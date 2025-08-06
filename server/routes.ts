import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBookingSchema, insertDriverSchema, insertVehicleSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Error handling middleware
  const handleError = (error: any, req: any, res: any) => {
    console.error("API Error:", error);
    storage.logError({
      userId: req.user?.claims?.sub,
      errorType: error.name || 'UnknownError',
      errorMessage: error.message,
      stackTrace: error.stack,
      requestUrl: req.originalUrl,
      userAgent: req.headers['user-agent'],
    }).catch(console.error);
    
    res.status(500).json({ message: error.message || "Internal Server Error" });
  };

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  // User management routes
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user?.claims?.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
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
      const userRole = req.user?.claims?.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const userRole = req.user.claims.role;
      
      if (userRole === 'user') {
        const bookings = await storage.getUserBookings(userId);
        res.json(bookings);
      } else {
        const filters = {
          status: req.query.status,
          applicantName: req.query.applicantName,
          destination: req.query.destination,
          purpose: req.query.purpose,
          departureDate: req.query.departureDate,
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
      const userRole = req.user.claims.role;
      const userId = req.user.claims.sub;
      
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const bookingId = req.params.id;
      const { status, driverId, vehicleId, driverInstruction, rejectionReason } = req.body;
      
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

      res.json(updatedBooking);
    } catch (error) {
      handleError(error, req, res);
    }
  });

  app.put('/api/bookings/:id/modify', isAuthenticated, async (req: any, res) => {
    try {
      const userRole = req.user.claims.role;
      const userId = req.user.claims.sub;
      
      if (userRole !== 'superadmin') {
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
      const userRole = req.user.claims.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
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
      const userRole = req.user.claims.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
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
      const userRole = req.user.claims.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
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
