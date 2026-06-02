import Link from "next/link";
import { Plus, Eye, Trash2, Sun, Cloud, CloudRain, CloudLightning, Wind } from "lucide-react";
import { getDailyLogs, deleteDailyLog } from "@/actions/daily-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, WEATHER_LABELS } from "@/lib/utils";

const weatherIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  windy: Wind,
};

export default async function DailyLogsPage() {
  const logs = await getDailyLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nhật ký thi công</h1>
        <Link href="/daily-logs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Thêm nhật ký
          </Button>
        </Link>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có nhật ký nào. Hãy thêm nhật ký thi công đầu tiên.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách nhật ký</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Thời tiết</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Công nhân</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const weather = log.weather ? JSON.parse(log.weather) : null;
                  const Icon = weather
                    ? weatherIcons[weather.condition] || Cloud
                    : null;
                  const label = weather
                    ? WEATHER_LABELS[weather.condition] || weather.condition
                    : "-";

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatDate(log.date)}
                      </TableCell>
                      <TableCell>
                        {weather ? (
                          <div className="flex items-center gap-2">
                            {Icon && (
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span>{weather.temperature}°C</span>
                            <span className="text-muted-foreground text-sm">
                              {label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.notes || "-"}
                      </TableCell>
                      <TableCell>{log.workerCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/daily-logs/${log.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <form
                            action={async () => {
                              "use server";
                              await deleteDailyLog(log.id);
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
