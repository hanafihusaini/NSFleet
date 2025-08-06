import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserPlus, Edit, Trash2, Shield } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

const userSchema = z.object({
  firstName: z.string().min(1, "Nama pertama diperlukan"),
  lastName: z.string().min(1, "Nama akhir diperlukan"),
  email: z.string().email("Email tidak sah"),
  role: z.enum(['user', 'admin', 'superadmin']),
  unit: z.string().min(1, "Unit diperlukan"),
  phone: z.string().optional(),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check if current user has access
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin') {
    return (
      <Layout title="Pengurusan Pengguna">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Akses Terhad</h3>
            <p className="text-gray-600">
              Hanya Admin dan Super Admin yang dibenarkan mengakses halaman ini.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
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

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; userData: Partial<UserFormData> }) => {
      return apiRequest('PUT', `/api/users/${data.id}`, data.userData);
    },
    onSuccess: () => {
      toast({
        title: "Berjaya",
        description: "Maklumat pengguna telah dikemaskini",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowUserModal(false);
      setSelectedUser(null);
      setIsEditing(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ralat",
        description: error.message || "Gagal mengemaskini pengguna",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditing(true);
    form.reset({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role,
      unit: user.unit || '',
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setShowUserModal(true);
  };

  const handleNewUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    form.reset();
    setShowUserModal(true);
  };

  const onSubmit = (data: UserFormData) => {
    if (isEditing && selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        userData: data,
      });
    } else {
      toast({
        title: "Maklumat",
        description: "Pengguna baharu akan dibuat secara automatik semasa log masuk pertama",
      });
      setShowUserModal(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      user: "bg-blue-100 text-blue-800",
      admin: "bg-green-100 text-green-800",
      superadmin: "bg-purple-100 text-purple-800",
    };
    
    const labels = {
      user: "Pengguna",
      admin: "Admin",
      superadmin: "Super Admin",
    };

    return (
      <Badge className={variants[role as keyof typeof variants]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {isActive ? "Aktif" : "Tidak Aktif"}
      </Badge>
    );
  };

  return (
    <Layout title="Pengurusan Pengguna">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Senarai Pengguna Sistem</h2>
            <p className="text-sm text-gray-500 mt-1">
              Urus pengguna dan peranan mereka dalam sistem
            </p>
          </div>
          <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
            <DialogTrigger asChild>
              <Button onClick={handleNewUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Pengguna Baharu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? 'Kemaskini Pengguna' : 'Pengguna Baharu'}
                </DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Input {...field} type="email" placeholder="alamat@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peranan *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih peranan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">Pengguna</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {currentUser?.role === 'superadmin' && (
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Unit/Bahagian" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value === 'true')} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                  )}

                  <div className="flex justify-end space-x-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowUserModal(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending 
                        ? 'Menyimpan...' 
                        : isEditing 
                          ? 'Kemaskini' 
                          : 'Simpan'
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Senarai Pengguna
            </CardTitle>
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
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Peranan</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tarikh Daftar</TableHead>
                      <TableHead>Tindakan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{user.unit || '-'}</TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                        <TableCell>
                          {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              title="Kemaskini"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
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

        {/* Info Card */}
        <Card className="bg-blue-50">
          <CardContent className="p-6">
            <h4 className="font-medium text-blue-900 mb-2">Maklumat Penting</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pengguna baharu akan dibuat secara automatik semasa log masuk pertama melalui sistem Replit Auth</li>
              <li>• Admin boleh mengurus pengguna biasa dan admin lain</li>
              <li>• Super Admin boleh mengurus semua jenis pengguna termasuk Super Admin lain</li>
              <li>• Peranan pengguna menentukan akses mereka dalam sistem</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
