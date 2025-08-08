import { useAuth } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { User, Shield, Settings, Users, Car, Calendar, FileText, UserCheck, AlertCircle } from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function RoleTesting() {
  const { user, isLoading } = useAuth() as { user?: UserType; isLoading: boolean };
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Layout title="Pengujian Peranan">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Pengujian Peranan">
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Akses Ditolak</h2>
          <p className="text-gray-600 mb-4">Anda perlu log masuk untuk mengakses halaman ini.</p>
          <Button onClick={() => window.location.href = "/api/login"}>
            Log Masuk
          </Button>
        </div>
      </Layout>
    );
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      superadmin: "destructive",
      admin: "default", 
      user: "secondary",
    };
    
    const labels = {
      superadmin: "Super Admin",
      admin: "Admin",
      user: "Pengguna",
    };

    const variant = variants[role as keyof typeof variants] as "destructive" | "default" | "secondary" | undefined;
    return (
      <Badge variant={variant || "secondary"}>
        {labels[role as keyof typeof labels] || "Tidak Diketahui"}
      </Badge>
    );
  };

  const rolePermissions = {
    user: [
      "Buat tempahan kenderaan baru",
      "Lihat status tempahan sendiri", 
      "Batalkan tempahan sendiri (yang belum bermula)",
      "Lihat kalendar tempahan",
    ],
    admin: [
      "Semua keupayaan Pengguna",
      "Lihat dan proses semua tempahan",
      "Urusan pemandu (tambah, kemaskini, padam)",
      "Urusan kenderaan (tambah, kemaskini, padam)",
      "Lihat statistik sistem",
    ],
    superadmin: [
      "Semua keupayaan Admin", 
      "Urusan pengguna (lihat, kemaskini peranan)",
      "Ubah suai tempahan yang telah diproses",
      "Akses penuh kepada semua fungsi sistem",
    ],
  };

  const testingInstructions = {
    user: [
      "Buat tempahan baru melalui Borang Tempahan",
      "Semak status tempahan di Status Tempahan",
      "Cuba batalkan tempahan yang masih pending",
      "Pastikan tidak boleh akses halaman admin",
    ],
    admin: [
      "Akses halaman Permohonan untuk proses tempahan",
      "Uji fungsi luluskan/tolak tempahan",
      "Tambah pemandu dan kenderaan baru",
      "Lihat statistik di dashboard",
    ],
    superadmin: [
      "Akses halaman Pengurusan Pengguna",
      "Ubah peranan pengguna lain",
      "Ubah suai tempahan yang telah diproses",
      "Uji semua fungsi sistem",
    ],
  };

  return (
    <Layout title="Pengujian Peranan Sistem">
      <div className="space-y-6">
        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Maklumat Pengguna Semasa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              {user.profileImageUrl && (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{user.firstName} {user.lastName}</h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Peranan:</span>
                  {getRoleBadge(user.role || 'user')}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>ID Pengguna:</strong> {user.id}
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Unit:</strong> {user.unit || 'Tidak dinyatakan'}
              </p>
              <p className="text-blue-800 text-sm">
                <strong>Status:</strong> {user.isActive ? 'Aktif' : 'Tidak Aktif'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Keupayaan Peranan Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rolePermissions[user.role as keyof typeof rolePermissions]?.map((permission, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Panduan Pengujian untuk Peranan {getRoleBadge(user.role || 'user')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testingInstructions[user.role as keyof typeof testingInstructions]?.map((instruction, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="bg-gov-blue text-white text-xs font-medium px-2 py-1 rounded-full min-w-[24px] text-center">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700">{instruction}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Navigasi Pantas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Always available */}
              <Button 
                variant="outline" 
                onClick={() => setLocation('/booking')}
                className="flex items-center gap-2 justify-start"
              >
                <Calendar className="h-4 w-4" />
                Borang Tempahan
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setLocation('/status')}
                className="flex items-center gap-2 justify-start"
              >
                <FileText className="h-4 w-4" />
                Status Tempahan
              </Button>

              {/* Admin and Super Admin only */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/applications')}
                    className="flex items-center gap-2 justify-start"
                  >
                    <FileText className="h-4 w-4" />
                    Permohonan
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/drivers')}
                    className="flex items-center gap-2 justify-start"
                  >
                    <User className="h-4 w-4" />
                    Pemandu
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation('/vehicles')}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Car className="h-4 w-4" />
                    Kenderaan
                  </Button>
                </>
              )}

              {/* Super Admin only */}
              {user.role === 'superadmin' && (
                <Button 
                  variant="outline" 
                  onClick={() => setLocation('/users')}
                  className="flex items-center gap-2 justify-start"
                >
                  <Users className="h-4 w-4" />
                  Pengurusan Pengguna
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Maklumat Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>Nota Pengujian:</strong> Halaman ini direka khas untuk membantu memahami dan menguji fungsi yang berbeza berdasarkan peranan pengguna.
              </p>
              <p>
                <strong>Perubahan Peranan:</strong> Hanya Super Admin yang boleh mengubah peranan pengguna melalui halaman Pengurusan Pengguna.
              </p>
              <p>
                <strong>Keselamatan:</strong> Sistem menggunakan Replit Auth untuk pengesahan dan kawalan akses berdasarkan peranan disimpan dalam pangkalan data.
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Peringatan:</strong> Jika anda perlu menguji peranan yang berbeza, minta admin atau super admin untuk mengubah peranan akaun anda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout Option */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/api/logout"}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Log Keluar
          </Button>
        </div>
      </div>
    </Layout>
  );
}