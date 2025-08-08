import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Edit, Users as UsersIcon, Shield, UserCheck, UserX } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { isUnauthorizedError } from "@/lib/authUtils";

const userUpdateSchema = z.object({
  firstName: z.string().min(1, "Nama pertama diperlukan"),
  lastName: z.string().min(1, "Nama akhir diperlukan"),
  email: z.string().email("Format email tidak sah"),
  role: z.enum(['user', 'admin', 'superadmin'], { required_error: "Peranan diperlukan" }),
  unit: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type UserUpdateFormData = z.infer<typeof userUpdateSchema>;

export default function Users() {
  const { toast } = useToast();
  const { user } = useAuth() as { user?: User };
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
      unit: '',
      phone: '',
      isActive: true,
    },
  });

  // Check admin access
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    return (
      <Layout title="Akses Ditolak">
        <div className="text-center py-16">
          <p className="text-red-500">Akses ditolak. Hanya Admin dan Super Admin yang boleh mengurus pengguna.</p>
        </div>
      </Layout>
    );
  }

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateFormData) => {
      if (!editingUser) throw new Error('No user selected for editing');
      return apiRequest('PUT', `/api/users/${editingUser.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }); // Refresh current user data
      toast({
        title: "Pengguna Dikemaskini",
        description: "Data pengguna berjaya dikemaskini",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
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
        description: error.message || "Gagal mengemas kini data pengguna",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserUpdateFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleEdit = (userToEdit: User) => {
    setEditingUser(userToEdit);
    form.setValue('firstName', userToEdit.firstName || '');
    form.setValue('lastName', userToEdit.lastName || '');
    form.setValue('email', userToEdit.email || '');
    form.setValue('role', (userToEdit.role as 'user' | 'admin' | 'superadmin') || 'user');
    form.setValue('unit', userToEdit.unit || '');
    form.setValue('phone', userToEdit.phone || '');
    form.setValue('isActive', userToEdit.isActive ?? true);
    setIsDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'admin': return 'default';
      case 'user': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'user': return 'Pengguna';
      default: return 'Tidak Diketahui';
    }
  };

  return (
    <Layout title="Pengurusan Pengguna">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Senarai Pengguna Sistem
            </CardTitle>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              Jumlah: {users.length} pengguna
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p>Memuatkan data pengguna...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Tiada data pengguna.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Peranan</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tarikh Daftar</TableHead>
                    <TableHead className="w-32">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem: User) => (
                    <TableRow key={userItem.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {userItem.profileImageUrl && (
                            <img 
                              src={userItem.profileImageUrl} 
                              alt="Profile" 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div>{userItem.firstName} {userItem.lastName}</div>
                            {userItem.id === user?.id && (
                              <div className="text-xs text-blue-600 font-medium">(Anda)</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{userItem.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(userItem.role || 'user')}>
                          {getRoleLabel(userItem.role || 'user')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{userItem.unit || '-'}</TableCell>
                      <TableCell className="text-sm">{userItem.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={userItem.isActive ? "default" : "secondary"}>
                          {userItem.isActive ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{userItem.createdAt ? formatDate(userItem.createdAt) : '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(userItem)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Kemaskini Pengguna - {editingUser?.firstName} {editingUser?.lastName}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pertama *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nama pertama" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Akhir *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nama akhir" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="user@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peranan *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih peranan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">Pengguna</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === 'true')} defaultValue={field.value ? 'true' : 'false'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Aktif</SelectItem>
                            <SelectItem value="false">Tidak Aktif</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nama unit/jabatan" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombor telefon" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {editingUser?.id === user?.id && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <UserCheck className="h-4 w-4" />
                      <span className="font-medium">Nota:</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      Anda sedang mengemas kini profil anda sendiri. Perubahan peranan akan mengubah akses anda ke sistem.
                    </p>
                  </div>
                )}

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
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending 
                      ? "Menyimpan..." 
                      : "Kemaskini"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}