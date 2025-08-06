import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Download, Printer } from "lucide-react";

export default function Reports() {
  return (
    <Layout title="Laporan & Dashboard">
      <div className="space-y-6">
        {/* Dashboard Statistics - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dashboard Statistik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500">Dashboard statistik akan dibangunkan di fasa seterusnya</p>
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Laporan Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {/* Booking Processing Performance Report */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Laporan Prestasi Pemprosesan Tempahan</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Menunjukkan bilangan hari kerja yang diambil untuk memproses setiap permohonan yang diluluskan
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Kategori: ≤ 3 hari kerja, {'>'}  3 hari kerja
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* Booking Summary Report */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Laporan Ringkasan Tempahan</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Menunjukkan semua butiran mengikut senarai dengan pilihan penapis
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Penapis: ID Tempahan, Status, Nama Pemohon, Unit, Tarikh, Destinasi, Tujuan, dll
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Excel
                    </Button>
                  </div>
                </div>
              </div>

              {/* JANM Official Form */}
              <div className="border rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">Borang Rasmi JANM-MyP/UPK/KEND/12/B01</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Borang rasmi menggunakan templat khusus dengan maklumat yang diisi secara automatik
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Termasuk: Nama pemohon, unit, tarikh, penumpang, destinasi, tujuan, pemandu, kenderaan, dll
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" className="bg-gov-blue hover:bg-gov-dark">
                      <Printer className="h-4 w-4 mr-1" />
                      Jana Borang
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">
            Sistem laporan komprehensif akan dibangunkan di fasa seterusnya
          </p>
          <p className="text-xs text-gray-400">
            Termasuk penjanaan PDF, Excel, dan borang rasmi JANM
          </p>
        </div>
      </div>
    </Layout>
  );
}
