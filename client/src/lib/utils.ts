import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('ms-MY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Malaysian Federal Public Holidays for Negeri Sembilan
const getPublicHolidays = (year: number): Date[] => {
  const holidays: Date[] = [];
  
  // Fixed annual holidays
  holidays.push(new Date(year, 0, 1));   // New Year's Day
  holidays.push(new Date(year, 1, 1));   // Federal Territory Day (some states)
  holidays.push(new Date(year, 4, 1));   // Labour Day
  holidays.push(new Date(year, 7, 31));  // Merdeka Day
  holidays.push(new Date(year, 8, 16));  // Malaysia Day
  holidays.push(new Date(year, 11, 25)); // Christmas Day
  
  // Religious holidays (approximate - these change annually)
  // For production, these should be fetched from an API or updated annually
  if (year === 2025) {
    holidays.push(new Date(2025, 0, 29));  // Chinese New Year
    holidays.push(new Date(2025, 0, 30));  // Chinese New Year (2nd day)
    holidays.push(new Date(2025, 2, 30));  // Hari Raya Haji (estimated)
    holidays.push(new Date(2025, 2, 31));  // Awal Muharram (estimated)
    holidays.push(new Date(2025, 4, 12));  // Wesak Day (estimated)
    holidays.push(new Date(2025, 4, 30));  // Hari Raya Aidilfitri (estimated)
    holidays.push(new Date(2025, 5, 1));   // Hari Raya Aidilfitri (2nd day)
    holidays.push(new Date(2025, 8, 7));   // Prophet Muhammad's Birthday (estimated)
    holidays.push(new Date(2025, 9, 31));  // Deepavali (estimated)
    
    // Negeri Sembilan specific holidays
    holidays.push(new Date(2025, 0, 14));  // Yang di-Pertuan Besar Negeri Sembilan's Birthday
  }
  
  return holidays;
};

const isPublicHoliday = (date: Date): boolean => {
  const holidays = getPublicHolidays(date.getFullYear());
  return holidays.some(holiday => 
    holiday.getFullYear() === date.getFullYear() &&
    holiday.getMonth() === date.getMonth() &&
    holiday.getDate() === date.getDate()
  );
};

export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  // Normalize dates to start of day to ignore time
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  
  // Start counting from the day AFTER submission (submission day is Day 0)
  const countFrom = new Date(start);
  countFrom.setDate(countFrom.getDate() + 1);
  
  let workingDays = 0;
  const currentDate = new Date(countFrom);
  
  while (currentDate <= end) {
    const dayOfWeek = currentDate.getDay();
    // Count only weekdays (Monday-Friday) that are not public holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isPublicHoliday(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return workingDays;
}

export function generateBookingId(): string {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${currentYear}${randomNum}`;
}

export function validateFutureDate(date: Date): boolean {
  return date > new Date();
}

export function validateDateRange(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function formatRoleLabel(role: string): string {
  const roleLabels = {
    user: 'Pengguna',
    admin: 'Admin',
    superadmin: 'Super Admin',
  };
  
  return roleLabels[role as keyof typeof roleLabels] || role;
}

export function formatStatusLabel(status: string): string {
  const statusLabels = {
    pending: 'Baru',
    approved: 'Diluluskan',
    rejected: 'Ditolak',
  };
  
  return statusLabels[status as keyof typeof statusLabels] || status;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
  return phoneRegex.test(phone.replace(/\s|-/g, ''));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
  }).format(amount);
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
