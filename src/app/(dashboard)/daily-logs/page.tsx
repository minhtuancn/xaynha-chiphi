"use client";

import Link from "next/link";
import { Plus, Eye, Trash2, Sun, Cloud, CloudRain, CloudLightning, Wind } from "lucide-react";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { deleteDailyLog } from "@/actions/daily-logs";
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
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { BookOpen } from "lucide-react";

const weatherIcons: Record<string, typeof Sun> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudLightning,
  windy: Wind,
};

export default function DailyLogsPage() {
  const { data: logs, isLoading } = useDailyLogs();

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

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="Chưa có nhật ký nào"
          description="Thêm nhật ký thi công đầu tiên để theo dõi tiến độ hàng ngày."
          action={{ label: "Thêm nhật ký", onClick: () => window.location.href = "/daily-logs/new" }}
        />
      ) : (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Danh sách nhật ký</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thời tiết</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-center">Công nhân</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const weather = log.weather ? JSON.parse(log.weather as string) : null;
                    const Icon = weather
                      ? weatherIcons[weather.condition] || Cloud
                      : null;
                    const label = weather
                      ? WEATHER_LABELS[weather.condition] || weather.condition
                      : "-";

                    return (
                      <TableRow
                        key={log.id}
                        className="group cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link href={`/daily-logs/${log.id}`} className="hover:text-primary">
                            {formatDate(log.date)}
                          </Link>
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
                          {log.notes || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-center">{log.workerCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/daily-logs/${log.id}`}>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <form
                              action={() => deleteDailyLog(log.id)}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}