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
import { BookingModal } from "@/components/BookingModal";
import { ProcessBookingModal } from "@/components/ProcessBookingModal";
import { CalendarIcon, Car, Clock, MapPin, User } from "lucide-react";
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

// Vehicle colors for differentiation
const vehicleColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

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
    queryKey: ['/api/bookings'],
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
    vehicles.forEach((vehicle: any, index: number) => {
      map[vehicle.id] = vehicleColors[index % vehicleColors.length];
    });
    return map;
  }, [vehicles]);

  // Convert bookings and holidays to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    const bookingEvents: CalendarEvent[] = bookings
      .filter((booking: any) => booking.status === 'approved' || booking.status === 'pending')
      .map((booking: any) => {
        const vehicle = vehicles.find((v: any) => v.id === booking.vehicleId);
        const vehicleNumber = vehicle?.plateNumber || 'Tiada Kenderaan';
        const color = booking.vehicleId 
          ? vehicleColorMap[booking.vehicleId] 
          : booking.status === 'pending' ? '#f59e0b' : '#6b7280';

        return {
          id: booking.id,
          title: `${vehicleNumber} - ${booking.destination}`,
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
                  <span className="text-sm">Tempahan Tertunda</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Tempahan Diluluskan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm">Cuti Umum</span>
                </div>
                <div className="text-sm text-gray-600">
                  Warna berbeza menunjukkan kenderaan yang berlainan
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

      {/* Booking Details Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Butiran Tempahan - {selectedBooking?.bookingId}</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Pemohon:</span>
                    <span>{selectedBooking.applicantName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Destinasi:</span>
                    <span>{selectedBooking.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Tarikh:</span>
                    <span>
                      {new Date(selectedBooking.departureDate).toLocaleDateString('ms-MY')} - {new Date(selectedBooking.returnDate).toLocaleDateString('ms-MY')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge 
                      variant="outline" 
                      className={selectedBooking.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                    >
                      {selectedBooking.status === 'approved' ? 'Diluluskan' : 'Tertunda'}
                    </Badge>
                  </div>
                  
                  {selectedBooking.vehicleId && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Kenderaan:</span>
                      <span>{vehicles.find((v: any) => v.id === selectedBooking.vehicleId)?.plateNumber}</span>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">Tujuan:</span>
                    <p className="text-sm text-gray-600">{selectedBooking.purpose}</p>
                  </div>
                </div>
              </div>
              
              {selectedBooking.notes && (
                <div>
                  <span className="font-medium">Catatan:</span>
                  <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                </div>
              )}
              
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  {selectedBooking.status === 'pending' && (
                    <Button onClick={() => handleProcessBooking(selectedBooking)}>
                      Proses Tempahan
                    </Button>
                  )}
                  {user?.role === 'superadmin' && selectedBooking.status !== 'pending' && (
                    <Button variant="outline" onClick={() => handleProcessBooking(selectedBooking)}>
                      Ubah Suai Tempahan
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
