import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { StatsCards } from "@/components/StatsCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { BookingModal } from "@/components/BookingModal";
import { ProcessBookingModal } from "@/components/ProcessBookingModal";
import { Eye, ServerCog, Edit, Calendar, BarChart3, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { cn, calculateWorkingDays } from "@/lib/utils";

export default function Applications() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    applicantName: '',
    departureDate: '',
    destination: '',
    purpose: '',
    driverId: 'all',
    vehicleId: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch bookings with filters
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['/api/bookings', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') params.append(key, value);
      });
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
  });

  // Fetch drivers for dropdown
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
  });

  // Fetch vehicles for dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  const handleSearch = () => {
    setCurrentPage(1);
    // Force immediate refetch with updated filters
    queryClient.refetchQueries({ queryKey: ['/api/bookings', filters, 1] });
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleProcessBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowProcessModal(true);
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

  const calculateProcessingTime = (booking: any) => {
    const submissionDate = new Date(booking.submissionDate);
    const endDate = booking.processedDate 
      ? new Date(booking.processedDate)
      : booking.modifiedDate 
        ? new Date(booking.modifiedDate)
        : new Date(); // For pending bookings, use current date

    const workingDays = calculateWorkingDays(submissionDate, endDate);
    
    return {
      days: workingDays,
      isOverdue: workingDays > 3,
    };
  };

  const bookings = bookingsData?.bookings || [];
  const totalItems = bookingsData?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <Layout title="Senarai Permohonan">
      <div className="space-y-6">
        <StatsCards />

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Penapis & Carian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemohon</label>
                <Input 
                  placeholder="Cari nama..."
                  value={filters.applicantName}
                  onChange={(e) => setFilters({...filters, applicantName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Perjalanan</label>
                <Input 
                  type="date"
                  value={filters.departureDate}
                  onChange={(e) => setFilters({...filters, departureDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinasi</label>
                <Input 
                  placeholder="Cari destinasi..."
                  value={filters.destination}
                  onChange={(e) => setFilters({...filters, destination: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan</label>
                <Input 
                  placeholder="Cari tujuan..."
                  value={filters.purpose}
                  onChange={(e) => setFilters({...filters, purpose: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemandu</label>
                <Select value={filters.driverId} onValueChange={(value) => setFilters({...filters, driverId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Pemandu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pemandu</SelectItem>
                    {(drivers as any[])?.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kenderaan</label>
                <Select value={filters.vehicleId} onValueChange={(value) => setFilters({...filters, vehicleId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Kenderaan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kenderaan</SelectItem>
                    {(vehicles as any[])?.map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} - {vehicle.plateNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  Cari
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Senarai Permohonan Kenderaan</CardTitle>
            <div className="text-sm text-gray-500">
              Menunjukkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} daripada {totalItems} permohonan
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
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
                      <TableHead>Pemandu</TableHead>
                      <TableHead>Pemandu Tunggu</TableHead>
                      <TableHead>Kenderaan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Masa Pemprosesan</TableHead>
                      <TableHead>Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking: any) => {
                      const processingTime = calculateProcessingTime(booking);
                      return (
                        <TableRow key={booking.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{booking.bookingId}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{format(new Date(booking.departureDate), 'dd/MM/yyyy HH:mm')}</div>
                              <div>{format(new Date(booking.returnDate), 'dd/MM/yyyy HH:mm')}</div>
                            </div>
                          </TableCell>
                          <TableCell>{booking.destination}</TableCell>
                          <TableCell className="max-w-xs truncate" title={booking.purpose}>
                            {booking.purpose}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {booking.driverName || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {booking.driverInstruction === 'Driver Must Wait' ? 'Ya' : 
                               booking.driverInstruction === 'Driver Need Not Wait' ? 'Tidak' : '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {booking.vehicleInfo || '-'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "font-medium",
                              processingTime.isOverdue ? "text-red-500" : "text-gray-600"
                            )}>
                              {processingTime.days} hari kerja
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(booking)}
                                title="Lihat Butiran"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {booking.status === 'pending' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleProcessBooking(booking)}
                                  title="Proses Permohonan"
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <ServerCog className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleProcessBooking(booking)}
                                  title="Ubah Permohonan"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-700">
                      Menunjukkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> hingga{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> daripada{' '}
                      <span className="font-medium">{totalItems}</span> keputusan
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Sebelumnya
                      </Button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        );
                      })}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Seterusnya
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setLocation('/calendar')}>
            <Calendar className="h-4 w-4 mr-2" />
            Kalendar Interaktif
          </Button>
          <Button onClick={() => setLocation('/reports')} variant="secondary">
            <BarChart3 className="h-4 w-4 mr-2" />
            Laporan
          </Button>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        booking={selectedBooking}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
      />
      
      <ProcessBookingModal
        booking={selectedBooking}
        isOpen={showProcessModal}
        onClose={() => setShowProcessModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
          setShowProcessModal(false);
        }}
      />
    </Layout>
  );
}
