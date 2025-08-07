import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface ProcessBookingModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProcessBookingModal({ booking, isOpen, onClose, onSuccess }: ProcessBookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [action, setAction] = useState<'approve' | 'reject' | ''>('');
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverInstruction, setDriverInstruction] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch drivers and vehicles
  const { data: drivers } = useQuery({
    queryKey: ['/api/drivers'],
    enabled: isOpen,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['/api/vehicles'],
    enabled: isOpen,
  });

  const processBookingMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = booking?.status === 'pending' ? 'process' : 'modify';
      return apiRequest('PUT', `/api/bookings/${booking.id}/${endpoint}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: action === 'approve' ? "Permohonan telah diluluskan" : "Permohonan telah ditolak",
      });
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      let title = "Ralat";
      let description = "Gagal memproses permohonan";
      
      // Handle booking conflict errors specifically
      if (error.message && error.message.includes('Booking conflicts detected')) {
        try {
          // Try to parse the JSON error message
          const errorData = JSON.parse(error.message.split(': ', 2)[1]);
          if (errorData.conflicts && errorData.conflicts.length > 0) {
            const conflict = errorData.conflicts[0];
            title = "Konflik Tempahan Dikesan";
            description = `Konflik dengan tempahan ID ${conflict.bookingId || conflict.id}. Pemandu atau kenderaan sudah ditugaskan pada waktu yang bertindih. Sila pilih pemandu atau kenderaan lain.`;
          } else {
            description = "Pemandu atau kenderaan sudah ditugaskan pada waktu yang sama. Sila pilih sumber lain.";
          }
        } catch {
          // If parsing fails, use a generic conflict message
          title = "Konflik Tempahan Dikesan";
          description = "Pemandu atau kenderaan sudah ditugaskan pada waktu yang sama. Sila pilih sumber lain.";
        }
      } else if (error.message) {
        // For other errors, clean up the message if it's JSON
        if (error.message.includes('{') && error.message.includes('}')) {
          try {
            const errorData = JSON.parse(error.message.split(': ', 2)[1]);
            description = errorData.message || "Gagal memproses permohonan";
          } catch {
            description = error.message;
          }
        } else {
          description = error.message;
        }
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setAction('');
    setDriverId('');
    setVehicleId('');
    setDriverInstruction('');
    setRejectionReason('');
    onClose();
  };

  const handleSubmit = () => {
    if (action === 'approve') {
      if (!driverId || !vehicleId || !driverInstruction) {
        toast({
          title: "Maklumat Tidak Lengkap",
          description: "Sila lengkapkan maklumat pemandu, kenderaan, dan arahan",
          variant: "destructive",
        });
        return;
      }

      processBookingMutation.mutate({
        status: 'approved',
        driverId,
        vehicleId,
        driverInstruction,
      });
    } else if (action === 'reject') {
      processBookingMutation.mutate({
        status: 'rejected',
        rejectionReason,
      });
    }
  };

  if (!booking) return null;

  const isModifying = booking.status !== 'pending';
  const canModify = user?.role === 'superadmin';

  if (isModifying && !canModify) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Akses Terhad
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-gray-600">
              Hanya Super Admin yang dibenarkan mengubah permohonan yang telah diproses.
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={onClose} variant="outline">Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isModifying ? 'Ubah Permohonan' : 'Proses Permohonan'}: {booking.bookingId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Ringkasan Permohonan</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Pemohon:</span> {booking.applicantName}
              </div>
              <div>
                <span className="font-medium">Destinasi:</span> {booking.destination}
              </div>
              <div>
                <span className="font-medium">Tarikh Pergi:</span>{' '}
                {format(new Date(booking.departureDate), 'dd/MM/yyyy HH:mm')}
              </div>
              <div>
                <span className="font-medium">Tarikh Balik:</span>{' '}
                {format(new Date(booking.returnDate), 'dd/MM/yyyy HH:mm')}
              </div>
            </div>
          </div>

          {/* Current Status (for modifications) */}
          {isModifying && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-3">Status Semasa</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <Badge className={
                    booking.status === 'approved' 
                      ? "bg-approved bg-opacity-10 text-approved"
                      : "bg-rejected bg-opacity-10 text-rejected"
                  }>
                    {booking.status === 'approved' ? 'Diluluskan' : 'Ditolak'}
                  </Badge>
                </div>
                {booking.driver && (
                  <div>
                    <span className="font-medium">Pemandu:</span> {booking.driver.name}
                  </div>
                )}
                {booking.vehicle && (
                  <div>
                    <span className="font-medium">Kenderaan:</span> {booking.vehicle.plateNumber}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <h4 className="font-medium mb-3">
              {isModifying ? 'Tindakan Baharu' : 'Pilih Tindakan'}
            </h4>
            <div className="flex gap-4">
              <Button
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Luluskan
              </Button>
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Tolak
              </Button>
            </div>
          </div>

          {/* Approval Details */}
          {action === 'approve' && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <h5 className="font-medium text-green-800">Maklumat Kelulusan</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pemandu *
                  </label>
                  <Select value={driverId} onValueChange={setDriverId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Pemandu" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Kenderaan *
                  </label>
                  <Select value={vehicleId} onValueChange={setVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kenderaan" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles?.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.model} - {vehicle.plateNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arahan kepada Pemandu *
                  </label>
                  <Select value={driverInstruction} onValueChange={setDriverInstruction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Arahan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Driver Must Wait">Pemandu Perlu Tunggu</SelectItem>
                      <SelectItem value="Driver Need Not Wait">Pemandu Tidak Perlu Tunggu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {action === 'reject' && (
            <div className="space-y-4 p-4 bg-red-50 rounded-lg">
              <h5 className="font-medium text-red-800">Sebab Penolakan</h5>
              <Textarea
                placeholder="Nyatakan sebab penolakan permohonan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button onClick={handleClose} variant="outline">
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={processBookingMutation.isPending || !action}
          >
            {processBookingMutation.isPending 
              ? 'Memproses...' 
              : action === 'approve' 
                ? 'Luluskan Permohonan' 
                : 'Tolak Permohonan'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
