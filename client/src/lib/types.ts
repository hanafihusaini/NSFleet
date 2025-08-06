export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  unit?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  applicantName: string;
  applicantUnit: string;
  departureDate: Date;
  returnDate: Date;
  passengerName?: string;
  destination: string;
  purpose: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  driverId?: string;
  vehicleId?: string;
  driverInstruction?: string;
  rejectionReason?: string;
  submissionDate: Date;
  processedDate?: Date;
  modifiedDate?: Date;
  processedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  driver?: Driver;
  vehicle?: Vehicle;
  user?: User;
}

export interface Driver {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  model: string;
  plateNumber: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditTrail {
  id: string;
  bookingId: string;
  userId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  timestamp: Date;
}

export interface SystemError {
  id: string;
  userId?: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  requestUrl?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface BookingStats {
  pending: number;
  approved: number;
  rejected: number;
  availableVehicles: string;
}

export interface BookingFilters {
  status?: string;
  applicantName?: string;
  departureDate?: string;
  destination?: string;
  purpose?: string;
  limit?: number;
  offset?: number;
}

export interface ProcessingTime {
  days: number;
  isOverdue: boolean;
}
