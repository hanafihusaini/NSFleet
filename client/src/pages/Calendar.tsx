import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Calendar() {
  return (
    <Layout title="Kalendar Tempahan">
      <Card>
        <CardHeader>
          <CardTitle>Kalendar Interaktif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Kalendar interaktif akan dibangunkan di fasa seterusnya</p>
            <p className="text-sm text-gray-400">
              Ciri-ciri yang akan disertakan:
            </p>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• Paparan kalendar bulanan penuh</li>
              <li>• Tempahan yang diluluskan dan tertunda</li>
              <li>• Cuti umum Malaysia dan Negeri Sembilan</li>
              <li>• Butiran tempahan dalam popup</li>
              <li>• Warna mengikut status (hijau/kuning)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
