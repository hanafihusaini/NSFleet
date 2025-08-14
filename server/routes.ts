import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertBookingSchema, insertDriverSchema, insertVehicleSchema } from "@shared/schema";
import { z } from "zod";
import { EmailService } from './emailService.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize email service
  let emailService: EmailService | null = null;
  try {
    emailService = new EmailService();
  } catch (error) {
    console.log('Email service not available:', (error as Error).message);
  }

  // Error handling middleware
  const handleError = (error: any, req: any, res: any) => {
    console.error("API Error:", error);
    storage.logError({
      userId: req.user?.id,
      errorType: error.name || 'UnknownError',
      errorMessage: error.message,
      stackTrace: error.stack,
      requestUrl: req.originalUrl,
      userAgent: req.headers['user-agent'],
    }).catch(console.error);
    
    res.status(500).json({ message: error.message || "Internal Server Error" });
  };

  // Auth route is now handled in auth.ts setupAuth function

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.put('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const requestingUserId = req.user.id;
      
      // Get requesting user role from database
      const requestingUser = await storage.getUser(requestingUserId);
      if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const userId = req.params.id;
      const updates = req.body;
      
      const user = await storage.updateUser(userId, updates);
      res.json(user);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // Booking routes
  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        userId,
        bookingId: await storage.generateBookingId(),
      });

      // Validate future date
      if (new Date(bookingData.departureDate) <= new Date()) {
        return res.status(400).json({ message: "Booking must be for future dates only" });
      }

      const booking = await storage.createBooking(bookingData);
      
      // Create audit entry
      await storage.createAuditEntry({
        bookingId: booking.id,
        userId,
        action: 'created',
        newValues: booking,
        oldValues: null,
      });

      // Send confirmation email
      if (emailService && booking.applicantEmail) {
        try {
          await emailService.sendBookingConfirmation({
            bookingId: booking.bookingId,
            applicantName: booking.applicantName,
            applicantEmail: booking.applicantEmail,
            destination: booking.destination,
            purpose: booking.purpose,
            bookingDate: new Date(booking.departureDate).toLocaleDateString('ms-MY'),
            bookingTime: booking.departureTime || undefined,
            returnDate: new Date(booking.returnDate).toLocaleDateString('ms-MY'),
            returnTime: booking.returnTime || undefined,
          });
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the booking creation if email fails
        }
      }

      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      handleError(error, req, res);
    }
  });

  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.role === 'user') {
        const bookings = await storage.getUserBookings(userId);
        res.json(bookings);
      } else {
        const filters = {
          status: req.query.status,
          bookingId: req.query.bookingId,
          applicantName: req.query.applicantName,
          destination: req.query.destination,
          purpose: req.query.purpose,
          departureDate: req.query.departureDate,
          driverId: req.query.driverId,
          vehicleId: req.query.vehicleId,
          limit: parseInt(req.query.limit as string) || 10,
          offset: parseInt(req.query.offset as string) || 0,
        };
        
        const result = await storage.getAllBookings(filters);
        res.json(result);
      }
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const bookingId = req.params.id;
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.put('/api/bookings/:id/process', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database to ensure it's current
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update session with current role
      req.user.role = user.role;

      const bookingId = req.params.id;
      const { status, driverId, vehicleId, driverInstruction, rejectionReason, adminNotes } = req.body;
      
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check for conflicts if approving
      if (status === 'approved' && driverId && vehicleId) {
        const conflicts = await storage.checkBookingConflicts(
          existingBooking.departureDate,
          existingBooking.returnDate,
          driverId,
          vehicleId,
          bookingId
        );
        
        if (conflicts.length > 0) {
          return res.status(400).json({ 
            message: "Booking conflicts detected with existing approved bookings",
            conflicts 
          });
        }
      }

      const updates: any = {
        status,
        processedBy: userId,
        processedDate: new Date(),
      };

      if (status === 'approved') {
        updates.driverId = driverId;
        updates.vehicleId = vehicleId;
        updates.driverInstruction = driverInstruction;
      } else if (status === 'rejected') {
        updates.rejectionReason = rejectionReason;
      }

      const updatedBooking = await storage.updateBooking(bookingId, updates);
      
      // Create audit entry
      await storage.createAuditEntry({
        bookingId,
        userId,
        action: status === 'approved' ? 'approved' : 'rejected',
        oldValues: existingBooking,
        newValues: updatedBooking,
      });

      // Send status update email
      if (emailService && updatedBooking.applicantEmail) {
        try {
          // Get driver and vehicle info for approved bookings
          let driverInfo = null;
          let vehicleInfo = null;
          
          if (status === 'approved' && driverId) {
            try {
              const drivers = await storage.getAllDrivers();
              driverInfo = drivers.find(d => d.id === driverId);
            } catch (error) {
              console.error('Failed to fetch driver info:', error);
            }
          }
          
          if (status === 'approved' && vehicleId) {
            try {
              const vehicles = await storage.getAllVehicles();
              vehicleInfo = vehicles.find(v => v.id === vehicleId);
            } catch (error) {
              console.error('Failed to fetch vehicle info:', error);
            }
          }

          const emailData = {
            bookingId: updatedBooking.bookingId,
            applicantName: updatedBooking.applicantName,
            applicantEmail: updatedBooking.applicantEmail,
            destination: updatedBooking.destination,
            purpose: updatedBooking.purpose,
            bookingDate: new Date(updatedBooking.departureDate).toLocaleDateString('ms-MY'),
            bookingTime: updatedBooking.departureTime || undefined,
            returnDate: new Date(updatedBooking.returnDate).toLocaleDateString('ms-MY'),
            returnTime: updatedBooking.returnTime || undefined,
            driverName: driverInfo?.name || undefined,
            driverPhone: driverInfo?.phone || undefined,
            vehicleModel: vehicleInfo?.model || undefined,
            vehiclePlateNumber: vehicleInfo?.plateNumber || undefined,
            reason: rejectionReason,
            adminNotes: adminNotes || undefined,
            processedBy: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          };

          if (status === 'approved') {
            await emailService.sendBookingApproval(emailData);
          } else if (status === 'rejected') {
            await emailService.sendBookingRejection(emailData);
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't fail the booking update if email fails
        }
      }

      res.json(updatedBooking);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.put('/api/bookings/:id/modify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'superadmin') {
        return res.status(403).json({ message: "Only Super Admin can modify processed bookings" });
      }

      const bookingId = req.params.id;
      const { status, driverId, vehicleId, driverInstruction } = req.body;
      
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Check for conflicts if changing to approved
      if (status === 'approved' && driverId && vehicleId) {
        const conflicts = await storage.checkBookingConflicts(
          existingBooking.departureDate,
          existingBooking.returnDate,
          driverId,
          vehicleId,
          bookingId
        );
        
        if (conflicts.length > 0) {
          return res.status(400).json({ 
            message: "Booking conflicts detected with existing approved bookings",
            conflicts 
          });
        }
      }

      const updates = {
        status,
        driverId,
        vehicleId,
        driverInstruction,
        modifiedDate: new Date(),
      };

      const updatedBooking = await storage.updateBooking(bookingId, updates);
      
      // Create audit entry
      await storage.createAuditEntry({
        bookingId,
        userId,
        action: 'modified',
        oldValues: existingBooking,
        newValues: updatedBooking,
      });

      // Send modification email notification
      if (emailService && updatedBooking.applicantEmail) {
        try {
          const emailData = {
            bookingId: updatedBooking.bookingId,
            applicantName: updatedBooking.applicantName,
            applicantEmail: updatedBooking.applicantEmail,
            destination: updatedBooking.destination,
            bookingDate: new Date(updatedBooking.departureDate).toLocaleDateString('ms-MY'),
            returnDate: new Date(updatedBooking.returnDate).toLocaleDateString('ms-MY'),
            reason: '',
            processedBy: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
          };

          // For modifications by superadmin, use specific modification email
          await emailService.sendBookingModification(emailData);
        } catch (emailError) {
          console.error('Failed to send modification email:', emailError);
          // Don't fail the booking modification if email fails
        }
      }

      res.json(updatedBooking);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.post('/api/bookings/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bookingId = req.params.id;
      
      const existingBooking = await storage.getBooking(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Verify user owns this booking
      if (existingBooking.userId !== userId) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }

      // Check if booking can be cancelled
      if (existingBooking.status !== 'pending' && existingBooking.status !== 'approved') {
        return res.status(400).json({ message: "Only pending or approved bookings can be cancelled" });
      }

      // Check if booking is in the future
      const now = new Date();
      const departureDate = new Date(existingBooking.departureDate);
      if (departureDate <= now) {
        return res.status(400).json({ message: "Cannot cancel bookings that have already started" });
      }

      const updates = {
        status: 'dibatalkan' as const,
        processedDate: new Date(),
        processedBy: userId,
      };

      const updatedBooking = await storage.updateBooking(bookingId, updates);
      
      // Create audit entry
      await storage.createAuditEntry({
        bookingId,
        userId,
        action: 'cancelled',
        oldValues: existingBooking,
        newValues: updatedBooking,
      });

      res.json(updatedBooking);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // Driver routes
  app.get('/api/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.post('/api/drivers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver data", errors: error.errors });
      }
      handleError(error, req, res);
    }
  });

  app.put('/api/drivers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const driverId = req.params.id;
      const driverData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(driverId, driverData);
      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver data", errors: error.errors });
      }
      handleError(error, req, res);
    }
  });

  app.delete('/api/drivers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const driverId = req.params.id;
      await storage.deleteDriver(driverId);
      res.json({ message: "Driver deleted successfully" });
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // Vehicle routes
  app.get('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.post('/api/vehicles', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      handleError(error, req, res);
    }
  });

  app.put('/api/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const vehicleId = req.params.id;
      const vehicleData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(vehicleId, vehicleData);
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      handleError(error, req, res);
    }
  });

  app.delete('/api/vehicles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const vehicleId = req.params.id;
      await storage.deleteVehicle(vehicleId);
      res.json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // Statistics route
  app.get('/api/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getBookingStats();
      const vehicles = await storage.getAllVehicles();
      
      res.json({
        ...stats,
        availableVehicles: `${vehicles.filter(v => v.isActive).length}/${vehicles.length}`
      });
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // Error logs route (admin only)
  app.get('/api/errors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user role from database
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
        return res.status(403).json({ message: "Access denied" });
      }

      const errors = await storage.getSystemErrors();
      res.json(errors);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
