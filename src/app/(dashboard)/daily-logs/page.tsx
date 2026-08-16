"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Eye, Trash2, Sun, Cloud, CloudRain, CloudLightning, Wind, Search } from "lucide-react";
import { useDailyLogs } from "@/hooks/use-daily-logs";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { deleteDailyLog } from "@/actions/daily-logs";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Input } from "@/components/ui/input";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: logs, isLoading } = useDailyLogs();
  const [query, setQuery] = useState("");

  const filteredLogs = logs
    ? logs.filter((log) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const notes = (log.notes || "").toLowerCase();
        const date = formatDate(log.date).toLowerCase();
        return notes.includes(q) || date.includes(q);
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Nhật ký thi công</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm nhật ký..."
              className="h-10 w-44 pl-8 sm:w-56"
            />
          </div>
          <Link href="/daily-logs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhật ký
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : !logs || logs.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="Chưa có nhật ký nào"
          description="Thêm nhật ký thi công đầu tiên để theo dõi tiến độ hàng ngày."
          action={{ label: "Thêm nhật ký", onClick: () => router.push("/daily-logs/new") }}
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
                    <TableHead className="hidden md:table-cell">Thời tiết</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-center">Công nhân</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy nhật ký phù hợp
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredLogs.map((log) => {
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
                        <TableCell className="hidden md:table-cell">
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
                        <TableCell className="max-w-36 md:max-w-xs truncate block">
                          {log.notes || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-center">{log.workerCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <Link href={`/daily-logs/${log.id}`}>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 h-8 w-8 p-0">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <ConfirmDeleteButton
                              onConfirm={async () => {
                                await deleteDailyLog(log.id);
                                await queryClient.invalidateQueries({ queryKey: ["daily-logs"] });
                              }}
                              title="Xóa nhật ký này?"
                              description="Nhật ký và ảnh đính kèm sẽ bị xóa vĩnh viễn."
                            />
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