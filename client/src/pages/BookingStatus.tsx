import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingModal } from "@/components/BookingModal";
import { Eye, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { format } from "date-fns";

export default function BookingStatus() {
  const [, setLocation] = useLocation();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: userBookingsResponse, isLoading } = useQuery({
    queryKey: ['/api/bookings'],
  });

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    };
    
    const labels = {
      pending: "Baru",
      approved: "Diluluskan",
      rejected: "Ditolak",
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  // Handle both response formats: direct array (for users) or object with bookings property (for admins)
  const userBookings = Array.isArray(userBookingsResponse) 
    ? userBookingsResponse 
    : userBookingsResponse?.bookings || [];

  const filteredBookings = userBookings.filter((booking: any) => 
    !statusFilter || statusFilter === 'all' || booking.status === statusFilter
  );

  return (
    <Layout title="Status Tempahan Saya">
      <div className="space-y-6">
        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Penapis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Baru</SelectItem>
                    <SelectItem value="approved">Diluluskan</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Senarai Tempahan Saya</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tiada tempahan dijumpai</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Tempahan</TableHead>
                      <TableHead>Tarikh & Masa Pergi/Balik</TableHead>
                      <TableHead>Destinasi</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tarikh Mohon</TableHead>
                      <TableHead>Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking: any) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.bookingId}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{format(new Date(booking.departureDate), 'dd/MM/yyyy HH:mm')}</div>
                            <div>{format(new Date(booking.returnDate), 'dd/MM/yyyy HH:mm')}</div>
                          </div>
                        </TableCell>
                        <TableCell>{booking.destination}</TableCell>
                        <TableCell className="max-w-xs truncate">{booking.purpose}</TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>{format(new Date(booking.submissionDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={() => setLocation('/booking')}>
            Kembali ke Borang Tempahan
          </Button>
          <Button onClick={() => setLocation('/calendar')} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Lihat Kalendar
          </Button>
        </div>
      </div>

      {/* Booking Details Modal */}
      <BookingModal
        booking={selectedBooking}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </Layout>
  );
}
