import { Card, CardContent } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudLightning, Wind } from "lucide-react";
import { WEATHER_LABELS } from "@/lib/utils";

interface WeatherWidgetProps {
  weather: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  } | null;
}

const weatherIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  windy: Wind,
};

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  if (!weather) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">Không có dữ liệu thời tiết</p>
        </CardContent>
      </Card>
    );
  }

  const Icon = weatherIcons[weather.condition] || Cloud;
  const label = WEATHER_LABELS[weather.condition] || weather.condition;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{weather.temperature}°C</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
          <div className="ml-auto text-right text-sm text-muted-foreground">
            <p>Độ ẩm: {weather.humidity}%</p>
            <p>Gió: {weather.windSpeed} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
