import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { LogIn, Shield, Users, Car, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Login() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const res = await apiRequest('POST', '/api/login', credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/auth/user'], user);
      toast({
        title: "Log Masuk Berjaya",
        description: `Selamat datang, ${user.firstName} ${user.lastName}`,
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Log Masuk Gagal",
        description: error.message || "Username atau password tidak betul",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gov-blue rounded-full p-3">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sistem Tempahan Kenderaan
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Jabatan Akauntan Negara Malaysia (Negeri Sembilan)
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Masukkan username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Masukkan password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sedang Log Masuk...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Log Masuk
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Test Account Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Akaun Ujian:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div><strong>Pengguna:</strong> user1 / password</div>
                <div><strong>Admin:</strong> admin1 / password</div>
                <div><strong>Super Admin:</strong> superadmin1 / password</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <div className="text-center lg:text-left space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Sistem Pengurusan Tempahan Kenderaan
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Sistem yang memudahkan proses permohonan dan kelulusan penggunaan kenderaan 
              kerajaan dengan kawalan akses berasaskan peranan, penjanaan ID tempahan automatik, 
              dan jejak audit yang komprehensif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Calendar className="h-8 w-8 text-gov-blue" />
              <div>
                <h3 className="font-semibold text-gray-900">Tempahan Mudah</h3>
                <p className="text-sm text-gray-600">Buat dan urus tempahan dengan cepat</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Car className="h-8 w-8 text-gov-blue" />
              <div>
                <h3 className="font-semibold text-gray-900">Urusan Kenderaan</h3>
                <p className="text-sm text-gray-600">Pengurusan kenderaan dan pemandu</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Users className="h-8 w-8 text-gov-blue" />
              <div>
                <h3 className="font-semibold text-gray-900">Kawalan Peranan</h3>
                <p className="text-sm text-gray-600">Akses berbeza untuk pengguna, admin dan super admin</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm">
              <Shield className="h-8 w-8 text-gov-blue" />
              <div>
                <h3 className="font-semibold text-gray-900">Jejak Audit</h3>
                <p className="text-sm text-gray-600">Rekod lengkap semua aktiviti sistem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}