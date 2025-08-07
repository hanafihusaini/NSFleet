import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Car } from "lucide-react";

export function StatsCards() {
  const { data: stats } = useQuery({
    queryKey: ['/api/stats'],
  });

  const statsData = [
    {
      title: "Permohonan Baru",
      value: stats?.pending || 0,
      icon: Clock,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
    },
    {
      title: "Diluluskan",
      value: stats?.approved || 0,
      icon: CheckCircle,
      bgColor: "bg-approved bg-opacity-10",
      textColor: "text-approved",
    },
    {
      title: "Ditolak",
      value: stats?.rejected || 0,
      icon: XCircle,
      bgColor: "bg-rejected bg-opacity-10",
      textColor: "text-rejected",
    },
    {
      title: "Kenderaan Tersedia",
      value: stats?.availableVehicles || "0/0",
      icon: Car,
      bgColor: "bg-gov-blue bg-opacity-10",
      textColor: "text-gov-blue",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`text-xl ${stat.textColor}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
