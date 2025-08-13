import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, User as UserIcon, Calendar, MapPin, Target, StickyNote, Clock, Printer, Car } from "lucide-react";
import { cn, calculateWorkingDays } from "@/lib/utils";

interface BookingModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ booking, isOpen, onClose }: BookingModalProps) {
  if (!booking) return null;

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

  const calculateProcessingTime = () => {
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

  const processingTime = calculateProcessingTime();

  const handlePrintForm = () => {
    // This would generate the official JANM form
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Butiran Permohonan: {booking.bookingId}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Maklumat Permohonan
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nama Pemohon:</label>
                  <p className="text-sm text-gray-800">{booking.applicantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit:</label>
                  <p className="text-sm text-gray-800">{booking.applicantUnit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tarikh Permohonan:</label>
                  <p className="text-sm text-gray-800">
                    {format(new Date(booking.submissionDate), 'dd/MM/yyyy')}
                  </p>
                </div>
                {booking.passengerName && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nama Penumpang:</label>
                    <p className="text-sm text-gray-800">{booking.passengerName}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Jadual Perjalanan
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tarikh & Masa Pergi:</label>
                  <p className="text-sm text-gray-800">
                    {new Date(booking.departureDate).toLocaleDateString('ms-MY')}
                    {booking.departureTime ? ` - ${booking.departureTime}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tarikh & Masa Balik:</label>
                  <p className="text-sm text-gray-800">
                    {new Date(booking.returnDate).toLocaleDateString('ms-MY')}
                    {booking.returnTime ? ` - ${booking.returnTime}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Destinasi:
                  </label>
                  <p className="text-sm text-gray-800">{booking.destination}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Tujuan:
                  </label>
                  <p className="text-sm text-gray-800">{booking.purpose}</p>
                </div>
                {booking.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <StickyNote className="h-3 w-3" />
                      Catatan:
                    </label>
                    <p className="text-sm text-gray-800">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Processing Information */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Maklumat Pemprosesan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <div className="mt-1">{getStatusBadge(booking.status)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Masa Pemprosesan:</label>
                <p className={cn(
                  "text-sm font-medium",
                  processingTime.isOverdue ? "text-red-500" : "text-gray-800"
                )}>
                  {processingTime.days} hari kerja
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tarikh Diproses:</label>
                <p className="text-sm text-gray-800">
                  {booking.processedDate 
                    ? format(new Date(booking.processedDate), 'dd/MM/yyyy')
                    : booking.modifiedDate
                      ? format(new Date(booking.modifiedDate), 'dd/MM/yyyy')
                      : '-'
                  }
                </p>
              </div>
            </div>

            {/* Vehicle Information for Approved Bookings */}
            {booking.status === 'approved' && (booking.driver || booking.vehicle || booking.driverName) && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Maklumat Kenderaan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Nama Pemandu:</label>
                      <p className="text-sm text-gray-800">{booking.driverName || booking.driver?.name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">No. Kenderaan:</label>
                      <p className="text-sm text-gray-800">
                        {booking.vehicleModel || booking.vehicle?.model || '-'}
                        {(booking.vehiclePlateNumber || booking.vehicle?.plateNumber) && 
                          ` - ${booking.vehiclePlateNumber || booking.vehicle?.plateNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {booking.driverInstruction && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Arahan Kepada Pemandu:</label>
                        <p className="text-sm text-gray-800">{booking.driverInstruction}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rejection Reason (if rejected) */}
            {booking.status === 'rejected' && booking.rejectionReason && (
              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <h5 className="font-medium text-red-800 mb-3">Sebab Penolakan</h5>
                <p className="text-sm text-gray-800">{booking.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-4 mt-6 border-t pt-4">
          {booking.status === 'approved' && (
            <Button onClick={handlePrintForm} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Cetak Borang JANM
            </Button>
          )}
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
