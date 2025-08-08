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
import { Plus, Edit, Trash2, User as UserIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";

const driverSchema = z.object({
  name: z.string().min(1, "Nama pemandu diperlukan"),
});

type DriverFormData = z.infer<typeof driverSchema>;

export default function Drivers() {
  const { toast } = useToast();
  const { user } = useAuth() as { user?: User };
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);

  const form = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: '',
    },
  });

  // Check admin access
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <Layout title="Akses Ditolak">
        <div className="text-center py-16">
          <p className="text-red-500">Akses ditolak. Hanya Admin dan Super Admin yang boleh mengurus pemandu.</p>
        </div>
      </Layout>
    );
  }

  // Fetch drivers
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['/api/drivers'],
    queryFn: async () => {
      const response = await fetch('/api/drivers');
      if (!response.ok) throw new Error('Failed to fetch drivers');
      return response.json();
    },
  });

  // Create/Update driver mutation
  const driverMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      const url = editingDriver ? `/api/drivers/${editingDriver.id}` : '/api/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      return apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: editingDriver ? "Pemandu Dikemaskini" : "Pemandu Ditambah",
        description: editingDriver ? "Data pemandu berjaya dikemaskini" : "Pemandu baru berjaya ditambah",
      });
      setIsDialogOpen(false);
      setEditingDriver(null);
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
        description: error.message || "Gagal menyimpan data pemandu",
        variant: "destructive",
      });
    },
  });

  // Delete driver mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      toast({
        title: "Pemandu Dipadam",
        description: "Pemandu berjaya dipadam dari sistem",
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
        description: error.message || "Gagal memadam pemandu",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DriverFormData) => {
    driverMutation.mutate(data);
  };

  const handleEdit = (driver: any) => {
    setEditingDriver(driver);
    form.setValue('name', driver.name);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Adakah anda pasti ingin memadam pemandu ini?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingDriver(null);
    form.reset();
    setIsDialogOpen(true);
  };

  return (
    <Layout title="Pengurusan Pemandu">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Senarai Pemandu
            </CardTitle>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tambah Pemandu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingDriver ? 'Kemaskini Pemandu' : 'Tambah Pemandu Baru'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Pemandu *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Masukkan nama pemandu" />
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
                        disabled={driverMutation.isPending}
                      >
                        {driverMutation.isPending 
                          ? "Menyimpan..." 
                          : editingDriver ? "Kemaskini" : "Tambah"
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
                <p>Memuatkan data pemandu...</p>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tiada data pemandu. Tambah pemandu untuk mula menggunakannya.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Pemandu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh Ditambah</TableHead>
                    <TableHead className="w-32">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver: any) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>
                        <Badge variant={driver.isActive ? "default" : "secondary"}>
                          {driver.isActive ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(driver.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(driver)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(driver.id)}
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