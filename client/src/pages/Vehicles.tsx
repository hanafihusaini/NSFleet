import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Car } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";

const vehicleSchema = z.object({
  model: z.string().min(1, "Model kenderaan diperlukan"),
  plateNumber: z.string().min(1, "Nombor plat diperlukan"),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

export default function Vehicles() {
  const { toast } = useToast();
  const { user } = useAuth() as { user?: User };
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      model: '',
      plateNumber: '',
    },
  });

  // Check admin access
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <Layout title="Akses Ditolak">
        <div className="text-center py-16">
          <p className="text-red-500">Akses ditolak. Hanya Admin dan Super Admin yang boleh mengurus kenderaan.</p>
        </div>
      </Layout>
    );
  }

  // Fetch vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['/api/vehicles'],
    queryFn: async () => {
      const response = await fetch('/api/vehicles');
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    },
  });

  // Create/Update vehicle mutation
  const vehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: editingVehicle ? "Kenderaan Dikemaskini" : "Kenderaan Ditambah",
        description: editingVehicle ? "Data kenderaan berjaya dikemaskini" : "Kenderaan baru berjaya ditambah",
      });
      setIsDialogOpen(false);
      setEditingVehicle(null);
      form.reset();
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
        description: error.message || "Gagal menyimpan data kenderaan",
        variant: "destructive",
      });
    },
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Kenderaan Dipadam",
        description: "Kenderaan berjaya dipadam dari sistem",
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
        description: error.message || "Gagal memadam kenderaan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    vehicleMutation.mutate(data);
  };

  const handleEdit = (vehicle: any) => {
    setEditingVehicle(vehicle);
    form.setValue('model', vehicle.model);
    form.setValue('plateNumber', vehicle.plateNumber);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Adakah anda pasti ingin memadam kenderaan ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingVehicle(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <Layout title="Pengurusan Kenderaan">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Senarai Kenderaan
            </CardTitle>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Kenderaan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingVehicle ? 'Kemaskini Kenderaan' : 'Tambah Kenderaan Baru'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Model Kenderaan *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Cth: Toyota Vios, Honda Civic" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="plateNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombor Plat *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Cth: ABC 1234, WBD 5678" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={vehicleMutation.isPending}
                      >
                        {vehicleMutation.isPending 
                          ? "Menyimpan..." 
                          : editingVehicle ? "Kemaskini" : "Tambah"
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Memuatkan data kenderaan...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tiada data kenderaan. Tambah kenderaan untuk mula menggunakannya.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model Kenderaan</TableHead>
                    <TableHead>Nombor Plat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh Ditambah</TableHead>
                    <TableHead className="w-32">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle: any) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.model}</TableCell>
                      <TableCell className="font-mono">{vehicle.plateNumber}</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                          {vehicle.isActive ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(vehicle.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(vehicle)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(vehicle.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}