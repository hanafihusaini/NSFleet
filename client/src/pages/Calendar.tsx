import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Calendar as BigCalendar, momentLocalizer, Views } from "react-big-calendar";
import moment from "moment";
import { useAuth } from "@/hooks/useAuth";
import { ProcessBookingModal } from "@/components/ProcessBookingModal";
import { BookingModal } from "@/components/BookingModal";
import { CalendarIcon, Car, Clock, MapPin, User, FileText, Target, StickyNote, ServerCog, Edit } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar.css";

// Set up moment localizer
const localizer = momentLocalizer(moment);

// Malaysian Federal Public Holidays for Negeri Sembilan (2025)
const publicHolidays = [
  { date: "2025-01-01", name: "Tahun Baru" },
  { date: "2025-01-29", name: "Tahun Baru Cina" },
  { date: "2025-01-30", name: "Tahun Baru Cina (Hari Kedua)" },
  { date: "2025-03-31", name: "Hari Raya Haji" },
  { date: "2025-04-21", name: "Israk dan Mikraj" },
  { date: "2025-05-01", name: "Hari Pekerja" },
  { date: "2025-05-12", name: "Hari Wesak" },
  { date: "2025-06-02", name: "Hari Keputeraan Yang di-Pertuan Agong" },
  { date: "2025-08-31", name: "Hari Merdeka" },
  { date: "2025-09-16", name: "Hari Malaysia" },
  { date: "2025-11-14", name: "Deepavali" },
  { date: "2025-12-25", name: "Hari Krismas" },
  // Estimated religious holidays (subject to moon sighting)
  { date: "2025-03-30", name: "Hari Raya Puasa (Est.)" },
  { date: "2025-03-31", name: "Hari Raya Puasa (Est.)" },
  { date: "2025-06-06", name: "Hari Raya Haji (Est.)" },
  { date: "2025-06-27", name: "Awal Muharram (Est.)" },
  { date: "2025-09-05", name: "Maulidur Rasul (Est.)" },
];

// Vehicle colors - specific mapping by model name
const getVehicleColor = (model: string, plateNumber: string) => {
  const modelLower = model?.toLowerCase() || '';
  const plateLower = plateNumber?.toLowerCase() || '';
  
  if (modelLower.includes('fortuner')) return '#000000'; // black
  if (modelLower.includes('x-trail') || modelLower.includes('xtrail')) return '#6b7280'; // grey  
  if (modelLower.includes('aruz')) return '#8b5cf6'; // purple
  
  // Fallback to plate number check
  if (plateLower.includes('fortuner')) return '#000000';
  if (plateLower.includes('xtrail')) return '#6b7280';
  if (plateLower.includes('aruz')) return '#8b5cf6';
  
  return '#3b82f6'; // default blue
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    booking: any;
    type: 'booking' | 'holiday';
    color?: string;
  };
}

export default function Calendar() {
  const { user } = useAuth() as { user?: UserType };
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  const { data: bookingsData } = useQuery<any>({
    queryKey: ['/api/bookings', 'calendar'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('limit', '1000'); // Get all bookings for calendar
      params.append('offset', '0');
      
      const response = await fetch(`/api/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!user
  });

  const { data: vehicles = [] } = useQuery<any[]>({
    queryKey: ['/api/vehicles'],
    enabled: !!user
  });

  // Handle both array and object response formats
  const bookings = Array.isArray(bookingsData) ? bookingsData : (bookingsData?.bookings || []);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Create vehicle color mapping
  const vehicleColorMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    vehicles.forEach((vehicle: any) => {
      map[vehicle.id] = getVehicleColor(vehicle.model, vehicle.plateNumber);
    });
    return map;
  }, [vehicles]);

  // Convert bookings and holidays to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const bookingEvents: CalendarEvent[] = bookings
      .filter((booking: any) => booking.status === 'approved' || booking.status === 'pending')
      .map((booking: any) => {
        const vehicle = vehicles.find((v: any) => v.id === booking.vehicleId);
        const vehicleNumber = vehicle?.plateNumber || '';
        
        // Create event title: Booking ID - Departure Time - Return Time - Destination - Purpose
        const departureTime = booking.departureTime || '';
        const returnTime = booking.returnTime || '';
        const title = `${booking.bookingId} - ${departureTime} - ${returnTime} - ${booking.destination} - ${booking.purpose}`;
        
        // Determine color based on status and vehicle
        let color: string;
        if (booking.status === 'pending') {
          color = '#f59e0b'; // yellow for pending
        } else if (booking.vehicleId && vehicle) {
          color = getVehicleColor(vehicle.model, vehicle.plateNumber);
        } else {
          color = '#6b7280'; // default grey
        }

        return {
          id: booking.id,
          title,
          start: new Date(booking.departureDate),
          end: new Date(booking.returnDate),
          resource: {
            booking,
            type: 'booking' as const,
            color
          }
        };
      });

    const holidayEvents: CalendarEvent[] = publicHolidays.map((holiday, index) => ({
      id: `holiday-${index}`,
      title: holiday.name,
      start: new Date(holiday.date),
      end: new Date(holiday.date),
      resource: {
        booking: null,
        type: 'holiday' as const,
        color: '#dc2626'
      }
    }));

    return [...bookingEvents, ...holidayEvents];
  }, [bookings, vehicles, vehicleColorMap]);

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.resource.type === 'booking') {
      setSelectedEvent(event);
      setSelectedBooking(event.resource.booking);
      setShowBookingModal(true);
    }
  };

  const handleProcessBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(false);
    setShowProcessModal(true);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const color = event.resource.color || '#6b7280';
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 6px'
      }
    };
  };

  const customDayPropGetter = (date: Date) => {
    const dateStr = moment(date).format('YYYY-MM-DD');
    const isHoliday = publicHolidays.some(holiday => holiday.date === dateStr);
    
    if (isHoliday) {
      return {
        style: {
          backgroundColor: '#fef2f2',
          color: '#dc2626'
        }
      };
    }
    return {};
  };

  // Calendar export functionality
  const generateICSContent = (events: any[]) => {
    const icsEvents = events.map(event => {
      const startDate = new Date(event.start).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      return [
        'BEGIN:VEVENT',
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `UID:${Date.now()}-${Math.random()}@janm.gov.my`,
        'END:VEVENT'
      ].join('\n');
    }).join('\n');

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JANM Negeri Sembilan//Sistem Tempahan Kenderaan//MS',
      'CALSCALE:GREGORIAN',
      icsEvents,
      'END:VCALENDAR'
    ].join('\n');
  };

  const downloadICS = (content: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tempahan-kenderaan-${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Kalendar Tempahan">
      <div className="space-y-6">
        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Kalendar Interaktif Tempahan Kenderaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Tempahan Baru</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-black rounded"></div>
                  <span className="text-sm">Fortuner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm">X-Trail</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span className="text-sm">Aruz</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm">Cuti Umum</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const calendarEvents = events
                    .filter(e => e.resource.type === 'booking')
                    .map(e => ({
                      title: e.title,
                      start: e.start.toISOString(),
                      end: e.end.toISOString(),
                      description: `Tujuan: ${e.resource.booking.purpose}`
                    }));
                  
                  const icsContent = generateICSContent(calendarEvents);
                  downloadICS(icsContent);
                }}
                data-testid="button-export-calendar"
              >
                Eksport ke Kalendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendar */}
        <Card>
          <CardContent className="p-6">
            <div style={{ height: '600px' }}>
              <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                dayPropGetter={customDayPropGetter}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                defaultView={Views.MONTH}
                popup
                messages={{
                  month: 'Bulan',
                  week: 'Minggu',
                  day: 'Hari',
                  today: 'Hari Ini',
                  previous: 'Sebelum',
                  next: 'Seterusnya',
                  showMore: (total: number) => `+${total} lagi`
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Details Modal - Using standardized BookingModal component */}
      {showBookingModal && selectedBooking && (
        <BookingModal
          key={`booking-modal-${selectedBooking.id}`}
          booking={selectedBooking}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedBooking(null);
          }}
          onProcessBooking={(booking) => {
            setSelectedBooking(booking);
            setShowBookingModal(false);
            setShowProcessModal(true);
          }}
        />
      )}

      {/* Process Booking Modal */}
      {showProcessModal && selectedBooking && (
        <ProcessBookingModal
          booking={selectedBooking}
          isOpen={showProcessModal}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedBooking(null);
          }}
          onSuccess={() => {
            // Invalidate queries to refresh data
            window.location.reload();
          }}
        />
      )}
    </Layout>
  );
}
