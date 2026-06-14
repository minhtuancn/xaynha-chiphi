import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sun, Cloud, CloudRain, CloudLightning, Wind, Image } from "lucide-react";
import { getDailyLog } from "@/actions/daily-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber, WEATHER_LABELS } from "@/lib/utils";

const weatherIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  windy: Wind,
};

export default async function DailyLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const log = await getDailyLog(id);

  if (!log) notFound();

  const weather = log.weather ? JSON.parse(log.weather) : null;
  const Icon = weather
    ? weatherIcons[weather.condition] || Cloud
    : null;
  const label = weather
    ? WEATHER_LABELS[weather.condition] || weather.condition
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/daily-logs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Nhật ký ngày {formatDate(log.date)}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Ngày</p>
              <p className="font-medium">{formatDate(log.date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Số công nhân</p>
              <p className="font-medium">{log.workerCount}</p>
            </div>
            {log.temperature != null && (
              <div>
                <p className="text-sm text-muted-foreground">Nhiệt độ</p>
                <p className="font-medium">{formatNumber(Number(log.temperature), 1)}°C</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thời tiết</CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="flex items-center gap-4">
                {Icon && (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-2xl font-bold">{weather.temperature}°C</p>
                  {label && (
                    <p className="text-sm text-muted-foreground">{label}</p>
                  )}
                </div>
                <div className="ml-auto text-right text-sm text-muted-foreground">
                  <p>Độ ẩm: {weather.humidity}%</p>
                  <p>Gió: {weather.windSpeed} km/h</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có dữ liệu thời tiết
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {log.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{log.notes}</p>
          </CardContent>
        </Card>
      )}

      {log.issues && (
        <Card>
          <CardHeader>
            <CardTitle>Vấn đề phát sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{log.issues}</p>
          </CardContent>
        </Card>
      )}

      {log.dailyLogPhotos && log.dailyLogPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ảnh đính kèm ({log.dailyLogPhotos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {log.dailyLogPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg border overflow-hidden bg-muted flex items-center justify-center"
                >
                  <Image className="h-8 w-8 text-muted-foreground" />
                  {photo.caption && (
                    <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                      {photo.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
