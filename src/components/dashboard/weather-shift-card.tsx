import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sun, CloudRain, Wind, Droplets, Thermometer } from "lucide-react";

interface ShiftData {
  time: string;
  temp: number;
  humidity: number;
  rainProb: number;
  cloudCover: number;
  windSpeed: number;
}

interface WeatherShiftCardProps {
  morning: ShiftData;
  afternoon: ShiftData;
}

const getSafetyStatus = (data: ShiftData) => {
  if (data.temp >= 38 || data.temp <= 13 || data.rainProb > 70 || data.windSpeed > 40) {
    return { label: "Danger", variant: "destructive" as const };
  }
  if (data.temp >= 35 || data.temp <= 15 || data.rainProb > 40 || data.windSpeed > 25) {
    return { label: "Warning", variant: "warning" as const }; // Assumes custom variant or style
  }
  return { label: "Safe", variant: "success" as const }; // Assumes custom variant or style
};

// Simple Badge variant mapping for standard/custom
const getVariant = (variant: string) => {
    switch(variant) {
        case 'destructive': return "bg-red-500 text-white";
        case 'warning': return "bg-yellow-500 text-black";
        default: return "bg-green-500 text-white";
    }
}

const ShiftBlock = ({ title, data }: { title: string, data: ShiftData }) => {
  const status = getSafetyStatus(data);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getVariant(status.variant))}>
          {status.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5"><Thermometer className="w-4 h-4" /> {data.temp}°C</div>
        <div className="flex items-center gap-1.5"><Droplets className="w-4 h-4" /> {data.humidity}%</div>
        <div className="flex items-center gap-1.5"><CloudRain className="w-4 h-4" /> {data.rainProb}%</div>
        <div className="flex items-center gap-1.5"><Wind className="w-4 h-4" /> {data.windSpeed} km/h</div>
      </div>
    </div>
  );
};

export function WeatherShiftCard({ morning, afternoon }: WeatherShiftCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Dự báo theo ca làm việc</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <ShiftBlock title="Ca Sáng (06:30 - 10:30)" data={morning} />
        <ShiftBlock title="Ca Chiều (14:00 - 18:00)" data={afternoon} />
      </CardContent>
    </Card>
  );
}
