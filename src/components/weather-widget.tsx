"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  temperature: number;
  weathercode: number;
  windspeed: number;
  humidity: number;
}

const WEATHER_CODES: Record<number, string> = {
  0: "Trời quang", 1: "Hầu hết quang", 2: "Có mây", 3: "U ám",
  45: "Sương mù", 48: "Sương mù băng", 51: "Mưa phùn nhẹ", 53: "Mưa phùn",
  55: "Mưa phùn dày", 61: "Mưa nhẹ", 63: "Mưa vừa", 65: "Mưa to",
  71: "Tuyết nhẹ", 73: "Tuyết vừa", 75: "Tuyết to", 80: "Mưa rào nhẹ",
  81: "Mưa rào", 82: "Mưa rào to", 95: "Giông", 96: "Giông + mưa đá",
};

interface WeatherWidgetProps {
  latitude: number;
  longitude: number;
}

export function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/weather?lat=${latitude}&lng=${longitude}`)
      .then((res) => res.json())
      .then((data) => { setWeather(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [latitude, longitude]);

  if (loading) return <Card><CardContent className="py-4 text-center text-muted-foreground">Đang tải thời tiết...</CardContent></Card>;
  if (!weather) return <Card><CardContent className="py-4 text-center text-muted-foreground">Không thể tải thời tiết</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Thời tiết hiện tại</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Thermometer className="h-5 w-5 text-orange-500" />
          <span className="text-2xl font-bold">{weather.temperature}°C</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{WEATHER_CODES[weather.weathercode] || "Không xác định"}</p>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{weather.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" />{weather.windspeed} km/h</span>
        </div>
      </CardContent>
    </Card>
  );
}
