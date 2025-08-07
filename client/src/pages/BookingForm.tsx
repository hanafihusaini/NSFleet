import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";
import { Calendar, Clock, User as UserIcon, MapPin, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const bookingSchema = z.object({
  applicantName: z.string().min(1, "Nama pemohon diperlukan"),
  applicantUnit: z.string().min(1, "Unit pemohon diperlukan"),
  departureDate: z.string().min(1, "Tarikh berlepas diperlukan"),
  departureTime: z.string().min(1, "Masa berlepas diperlukan"),
  returnDate: z.string().min(1, "Tarikh pulang diperlukan"),
  returnTime: z.string().min(1, "Masa pulang diperlukan"),
  passengerName: z.string().optional(),
  destination: z.string().min(1, "Destinasi diperlukan"),
  purpose: z.string().min(1, "Tujuan diperlukan"),
  notes: z.string().max(50, "Catatan tidak boleh melebihi 50 aksara").optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingForm() {
  const { toast } = useToast();
  const { user } = useAuth() as { user?: User };
  const [, setLocation] = useLocation();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      applicantName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
      applicantUnit: user?.unit || '',
      passengerName: '',
      destination: '',
      purpose: '',
      notes: '',
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      // Combine date and time
      const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
      const returnDateTime = new Date(`${data.returnDate}T${data.returnTime}`);

      const bookingData = {
        applicantName: data.applicantName,
        applicantUnit: data.applicantUnit,
        departureDate: departureDateTime,
        returnDate: returnDateTime,
        passengerName: data.passengerName || null,
        destination: data.destination,
        purpose: data.purpose,
        notes: data.notes || null,
      };

      return apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      // Invalidate booking queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/stats'] });
      
      toast({
        title: "Tempahan Berjaya",
        description: "Permohonan tempahan kenderaan telah dihantar. Anda akan menerima notifikasi email mengenai status permohonan.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat Tempahan",
        description: error.message || "Gagal menghantar permohonan tempahan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BookingFormData) => {
    // Validate future date
    const departureDateTime = new Date(`${data.departureDate}T${data.departureTime}`);
    if (departureDateTime <= new Date()) {
      toast({
        title: "Tarikh Tidak Sah",
        description: "Tempahan hanya dibenarkan untuk tarikh dan masa akan datang",
        variant: "destructive",
      });
      return;
    }

    // Validate return date after departure date
    const returnDateTime = new Date(`${data.returnDate}T${data.returnTime}`);
    if (returnDateTime <= departureDateTime) {
      toast({
        title: "Tarikh Tidak Sah",
        description: "Tarikh dan masa pulang mestilah selepas tarikh dan masa berlepas",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate(data);
  };

  return (
    <Layout title="Borang Tempahan Kenderaan">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Permohonan Tempahan Kenderaan Jabatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Applicant Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Maklumat Pemohon
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="applicantName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemohon *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nama penuh pemohon" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="applicantUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Unit/Bahagian pemohon" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passengerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Penumpang</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Senaraikan nama semua penumpang (pilihan)"
                              className="min-h-[80px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Jadual Perjalanan
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departureDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarikh Berlepas *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="departureTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Masa Berlepas *</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="returnDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarikh Pulang *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="returnTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Masa Pulang *</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="destination"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destinasi *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Tempat dituju" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Purpose and Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Maklumat Tambahan</h3>
                  
                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tujuan Perjalanan *</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Nyatakan tujuan perjalanan dengan jelas"
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (maksimum 50 aksara)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Bil. penumpang, no. telefon pegawai bertugas, dll"
                            maxLength={50}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createBookingMutation.isPending}
                  >
                    {createBookingMutation.isPending ? "Menghantar..." : "Hantar Permohonan"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation('/status')}
                    className="flex-1"
                  >
                    📋 Semak Status Tempahan
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setLocation('/calendar')}
                    className="flex-1"
                  >
                    🗓️ Lihat Kalendar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
