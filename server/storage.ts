import {
  users,
  bookings,
  drivers,
  vehicles,
  auditTrail,
  systemErrors,
  type User,
  type UpsertUser,
  type Booking,
  type InsertBooking,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type AuditTrail,
  type SystemError,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, or, like, count } from "drizzle-orm";
import { sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // User management
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByBookingId(bookingId: string): Promise<Booking | undefined>;
  getUserBookings(userId: string): Promise<Booking[]>;
  getAllBookings(filters?: any): Promise<{ bookings: Booking[]; total: number }>;
  updateBooking(id: string, updates: Partial<Booking>): Promise<Booking>;
  checkBookingConflicts(departureDate: Date, returnDate: Date, driverId?: string, vehicleId?: string, excludeBookingId?: string): Promise<Booking[]>;
  
  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<Driver>): Promise<Driver>;
  
  // Vehicle operations
  getAllVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
  
  // Audit trail
  createAuditEntry(entry: Omit<AuditTrail, 'id' | 'timestamp'>): Promise<AuditTrail>;
  
  // System errors
  logError(error: Omit<SystemError, 'id' | 'timestamp'>): Promise<SystemError>;
  getSystemErrors(): Promise<SystemError[]>;
  
  // Statistics
  getBookingStats(): Promise<{ pending: number; approved: number; rejected: number }>;
  
  // Booking ID generation
  generateBookingId(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(drivers, eq(bookings.driverId, drivers.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.id, id));
    return booking?.bookings;
  }

  async getBookingByBookingId(bookingId: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingId, bookingId));
    return booking;
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(drivers, eq(bookings.driverId, drivers.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.submissionDate));
  }

  async getAllBookings(filters?: any): Promise<{ bookings: Booking[]; total: number }> {
    let query = db
      .select()
      .from(bookings)
      .leftJoin(users, eq(bookings.userId, users.id))
      .leftJoin(drivers, eq(bookings.driverId, drivers.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id));

    const conditions: any[] = [];

    if (filters) {
      if (filters.status) {
        conditions.push(eq(bookings.status, filters.status));
      }
      if (filters.applicantName) {
        conditions.push(like(bookings.applicantName, `%${filters.applicantName}%`));
      }
      if (filters.destination) {
        conditions.push(like(bookings.destination, `%${filters.destination}%`));
      }
      if (filters.purpose) {
        conditions.push(like(bookings.purpose, `%${filters.purpose}%`));
      }
      if (filters.departureDate) {
        conditions.push(gte(bookings.departureDate, new Date(filters.departureDate)));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get total count
    const totalQuery = db
      .select({ count: count() })
      .from(bookings);
    
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Get paginated results
    const results = await query
      .orderBy(
        // Pending bookings first
        sql`CASE WHEN ${bookings.status} = 'pending' THEN 0 ELSE 1 END`,
        asc(bookings.bookingId)
      )
      .limit(filters?.limit || 10)
      .offset(filters?.offset || 0);

    return {
      bookings: results.map(r => r.bookings),
      total
    };
  }

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const [booking] = await db
      .update(bookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async checkBookingConflicts(
    departureDate: Date,
    returnDate: Date,
    driverId?: string,
    vehicleId?: string,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    const conditions: any[] = [
      eq(bookings.status, 'approved'),
      or(
        and(
          gte(bookings.departureDate, departureDate),
          lte(bookings.departureDate, returnDate)
        ),
        and(
          gte(bookings.returnDate, departureDate),
          lte(bookings.returnDate, returnDate)
        ),
        and(
          lte(bookings.departureDate, departureDate),
          gte(bookings.returnDate, returnDate)
        )
      )
    ];

    if (driverId) {
      conditions.push(eq(bookings.driverId, driverId));
    }

    if (vehicleId) {
      conditions.push(eq(bookings.vehicleId, vehicleId));
    }

    if (excludeBookingId) {
      conditions.push(sql`${bookings.id} != ${excludeBookingId}`);
    }

    return await db
      .select()
      .from(bookings)
      .where(and(...conditions));
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return await db
      .select()
      .from(drivers)
      .where(eq(drivers.isActive, true))
      .orderBy(asc(drivers.name));
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [newDriver] = await db
      .insert(drivers)
      .values(driver)
      .returning();
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const [driver] = await db
      .update(drivers)
      .set(updates)
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  // Vehicle operations
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.isActive, true))
      .orderBy(asc(vehicles.model));
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db
      .insert(vehicles)
      .values(vehicle)
      .returning();
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(updates)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  // Audit trail
  async createAuditEntry(entry: Omit<AuditTrail, 'id' | 'timestamp'>): Promise<AuditTrail> {
    const [auditEntry] = await db
      .insert(auditTrail)
      .values(entry)
      .returning();
    return auditEntry;
  }

  // System errors
  async logError(error: Omit<SystemError, 'id' | 'timestamp'>): Promise<SystemError> {
    const [errorEntry] = await db
      .insert(systemErrors)
      .values(error)
      .returning();
    return errorEntry;
  }

  async getSystemErrors(): Promise<SystemError[]> {
    return await db
      .select()
      .from(systemErrors)
      .orderBy(desc(systemErrors.timestamp))
      .limit(100);
  }

  // Statistics
  async getBookingStats(): Promise<{ pending: number; approved: number; rejected: number }> {
    const stats = await db
      .select({
        status: bookings.status,
        count: count()
      })
      .from(bookings)
      .groupBy(bookings.status);

    const result = { pending: 0, approved: 0, rejected: 0 };
    stats.forEach(stat => {
      if (stat.status && stat.count) {
        result[stat.status as keyof typeof result] = Number(stat.count);
      }
    });

    return result;
  }

  // Booking ID generation
  async generateBookingId(): Promise<string> {
    const currentYear = new Date().getFullYear().toString().slice(-2);
    
    // Get the latest booking ID for the current year
    const latestBooking = await db
      .select({ bookingId: bookings.bookingId })
      .from(bookings)
      .where(like(bookings.bookingId, `${currentYear}%`))
      .orderBy(desc(bookings.bookingId))
      .limit(1);

    let sequence = 1;
    if (latestBooking.length > 0) {
      const latestId = latestBooking[0].bookingId;
      const sequenceStr = latestId.slice(2);
      sequence = parseInt(sequenceStr) + 1;
    }

    return `${currentYear}${sequence.toString().padStart(3, '0')}`;
  }
}

export const storage = new DatabaseStorage();
