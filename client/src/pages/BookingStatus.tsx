import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookingModal } from "@/components/BookingModal";
import { Eye, Calendar, X } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

export default function BookingStatus() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    bookingId: '',
    departureDate: '',
    destination: '',
    purpose: '',
  });

  const { data: userBookingsResponse, isLoading } = useQuery({
    queryKey: ['/api/bookings', filters],
    queryFn: async () => {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest('POST', `/api/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Tempahan Dibatalkan",
        description: "Tempahan anda telah berjaya dibatalkan",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Akses Ditolak",
          description: "Anda telah log keluar. Log masuk semula...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Ralat",
        description: error.message || "Gagal membatalkan tempahan",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCancelBooking = (booking: any) => {
    if (confirm('Adakah anda pasti ingin membatalkan tempahan ini?')) {
      cancelMutation.mutate(booking.id);
    }
  };

  const canCancelBooking = (booking: any) => {
    // Only allow cancellation for pending or approved bookings
    // and only for future bookings
    const now = new Date();
    const departureDate = new Date(booking.departureDate);
    return (booking.status === 'pending' || booking.status === 'approved') && 
           departureDate > now;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      dibatalkan: "bg-gray-100 text-gray-800 border-gray-200",
    };
    
    const labels = {
      pending: "Baru",
      approved: "Diluluskan",
      rejected: "Ditolak",
      dibatalkan: "Dibatalkan",
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
    : (userBookingsResponse as any)?.bookings || [];

  const filteredBookings = userBookings.filter((booking: any) => {
    // Status filter
    if (filters.status && filters.status !== 'all' && booking.status !== filters.status) {
      return false;
    }
    
    // Booking ID filter
    if (filters.bookingId && !booking.bookingId.toLowerCase().includes(filters.bookingId.toLowerCase())) {
      return false;
    }
    
    // Date filter - check if search date falls within booking date range
    if (filters.departureDate) {
      const filterDate = new Date(filters.departureDate);
      const bookingDepartureDate = new Date(booking.departureDate);
      const bookingReturnDate = new Date(booking.returnDate);
      
      // Remove time component for accurate date comparison
      filterDate.setHours(0, 0, 0, 0);
      bookingDepartureDate.setHours(0, 0, 0, 0);
      bookingReturnDate.setHours(0, 0, 0, 0);
      
      // Check if search date falls within the booking date range (inclusive)
      if (filterDate < bookingDepartureDate || filterDate > bookingReturnDate) {
        return false;
      }
    }
    
    // Destination filter
    if (filters.destination && !booking.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
      return false;
    }
    
    // Purpose filter
    if (filters.purpose && !booking.purpose.toLowerCase().includes(filters.purpose.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <Layout title="Status Tempahan Saya">
      <div className="space-y-6">
        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Penapis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Baru</SelectItem>
                    <SelectItem value="approved">Diluluskan</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                    <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Tempahan</label>
                <Input 
                  placeholder="Cari ID..."
                  value={filters.bookingId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, bookingId: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Perjalanan</label>
                <Input 
                  type="date"
                  value={filters.departureDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, departureDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinasi</label>
                <Input 
                  placeholder="Cari destinasi..."
                  value={filters.destination}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, destination: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label>
                <Input 
                  placeholder="Cari tujuan..."
                  value={filters.purpose}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters({...filters, purpose: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => setFilters({ status: 'all', bookingId: '', departureDate: '', destination: '', purpose: '' })}
                className="mr-2"
              >
                Reset Penapis
              </Button>
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
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canCancelBooking(booking) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelBooking(booking)}
                                disabled={cancelMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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
