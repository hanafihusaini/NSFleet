import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, Shield, Calendar, FileText } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gov-gray">
      {/* Header */}
      <nav className="bg-gov-blue shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Car className="text-white text-2xl mr-3" />
              <span className="text-white text-lg font-semibold">
                Sistem Tempahan Kenderaan JANM Negeri Sembilan
              </span>
            </div>
            <div className="flex items-center">
              <Button onClick={handleLogin} variant="secondary">
                Log Masuk
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistem Tempahan Kenderaan
          </h1>
          <h2 className="text-2xl text-gov-blue mb-6">
            Jabatan Akauntan Negara Malaysia, Negeri Sembilan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sistem pengurusan tempahan kenderaan yang komprehensif untuk memudahkan 
            proses permohonan dan kelulusan penggunaan kenderaan jabatan.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Car className="h-12 w-12 text-gov-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Tempahan Mudah</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Proses tempahan kenderaan yang mudah dan pantas dengan validasi automatik
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 text-gov-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Kawalan Akses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistem kawalan akses berlapis dengan peranan Pengguna, Admin, dan Super Admin
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-gov-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Kalendar Interaktif</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Lihat jadual tempahan dengan kalendar interaktif dan pengesanan konflik
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-gov-blue mx-auto mb-4" />
              <CardTitle className="text-lg">Laporan Rasmi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Penjanaan borang rasmi JANM dan laporan komprehensif
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Mula Menggunakan Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Log masuk untuk mula menggunakan sistem tempahan kenderaan
              </p>
              <Button onClick={handleLogin} size="lg" className="w-full">
                Log Masuk Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 Jabatan Akauntan Negara Malaysia, Negeri Sembilan. Hak Cipta Terpelihara.
            </div>
            <div className="text-sm text-gray-500">
              Sistem Tempahan Kenderaan v2.1.0
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
