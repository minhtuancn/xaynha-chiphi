"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserSettings } from "@/hooks/use-user-settings";
import { PROJECT_STATUS_LABELS } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  DollarSign,
  Layers,
  Camera,
  CloudSun,
  ListChecks,
  ArrowRight,
  Edit3,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  address: string | null;
  budget: number;
  status: string;
  progress: number;
  startDate: Date | string | null;
  endDate: Date | string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  _count: { stages: number; dailyLogs: number; expenses: number; photos: number };
  projectBudget?: { totalBudget: number; allocated: number; spent: number; remaining: number } | null;
  stages: {
    id: string; name: string; status: string; progress: number; order: number;
    startDate?: Date | string | null; endDate?: Date | string | null;
  }[];
};

type DailyLog = { id: string; date: Date | string; notes: string | null; workerCount: number; project: { name: string } };
type Expense = { id: string; amount: number; date: Date | string; description: string | null; category: { name: string } };
type Photo = { id: string; url: string; caption: string | null; takenAt: Date | string };
type StageBudget = { id: string; estimatedCost: number; actualCost: number };

export function ProjectDetailDashboard({
  project,
  dailyLogs,
  expenses,
  photos,
  stageBudget,
}: {
  project: Project;
  dailyLogs: DailyLog[];
  expenses: Expense[];
  photos: Photo[];
  stageBudget: StageBudget[];
}) {
  const { formatCurrency, formatDate, settings } = useUserSettings();
  const [tab, setTab] = useState("overview");

  const totalPlanned = stageBudget.reduce((s, b) => s + b.estimatedCost, 0);
  const totalActual = stageBudget.reduce((s, b) => s + b.actualCost, 0);
  const budgetUtilization = project.projectBudget?.totalBudget
    ? ((project.projectBudget.spent / project.projectBudget.totalBudget) * 100).toFixed(1)
    : "0";

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetRemaining = project.projectBudget
    ? project.projectBudget.totalBudget - project.projectBudget.spent
    : project.budget - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-xl border bg-gradient-to-br from-card to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge
                className={
                  project.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30"
                    : project.status === "COMPLETED"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30"
                      : project.status === "PAUSED"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                        : undefined
                }
              >
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.address || "Chưa có địa chỉ"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(project.startDate)} - {formatDate(project.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {project._count.stages} giai đoạn
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit3 className="mr-1.5 h-4 w-4" />
                Chỉnh sửa
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-0 bg-background/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ngân sách</p>
              <p className="mt-1 text-lg font-bold">{formatCurrency(project.budget)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-background/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đã chi</p>
              <p className="mt-1 text-lg font-bold text-rose-600">
                {formatCurrency(project.projectBudget?.spent ?? totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-background/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Còn lại</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">{formatCurrency(Math.max(0, budgetRemaining))}</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-background/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Tiến độ</p>
              <p className="mt-1 text-lg font-bold">{project.progress}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={project.progress} className="h-2" />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="logs">Nhật ký</TabsTrigger>
          <TabsTrigger value="expenses">Chi phí</TabsTrigger>
          <TabsTrigger value="stages">Tiến độ</TabsTrigger>
          <TabsTrigger value="photos">Hình ảnh</TabsTrigger>
          <TabsTrigger value="budget">Dự toán</TabsTrigger>
          <TabsTrigger value="weather">Thời tiết</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Info & Tasks Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Thông tin dự án</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Trạng thái</span><Badge variant="outline">{PROJECT_STATUS_LABELS[project.status]}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Giai đoạn</span><span>{project._count.stages}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Nhật ký</span><span>{project._count.dailyLogs}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Chi phí</span><span>{project._count.expenses}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ảnh</span><span>{project._count.photos}</span></div>
                {project.description && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                    <p className="text-sm">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Ngân sách</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span>Tổng ngân sách</span><span className="font-medium">{formatCurrency(project.budget)}</span></div>
                  <div className="flex justify-between mb-1"><span>Đã giải ngân</span><span className="font-medium text-rose-600">{formatCurrency(project.projectBudget?.spent ?? totalExpenses)}</span></div>
                  <div className="flex justify-between"><span>Còn lại</span><span className="font-medium text-emerald-600">{formatCurrency(Math.max(0, budgetRemaining))}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Stages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" />Giai đoạn thi công</CardTitle>
              <Link href={`/projects/${project.id}/stages`}>
                <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {project.stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có giai đoạn nào.</p>
              ) : (
                <div className="space-y-3">
                  {project.stages.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          s.status === "COMPLETED" ? "bg-emerald-500" :
                          s.status === "IN_PROGRESS" ? "bg-blue-500" :
                          s.status === "ON_HOLD" ? "bg-amber-500" : "bg-slate-300"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <Progress value={s.progress} className="h-1 mt-1" />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{s.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Photos */}
          {photos.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4" />Hình ảnh gần đây</CardTitle>
                <Link href={`/photos?projectId=${project.id}`}>
                  <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                      <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                          <p className="truncate text-[10px] text-white">{p.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Logs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Nhật ký gần đây</CardTitle>
              <Link href={`/daily-logs?projectId=${project.id}`}>
                <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có nhật ký nào.</p>
              ) : (
                <div className="space-y-2">
                  {dailyLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div>
                        <span className="font-medium">{formatDate(log.date)}</span>
                        <span className="ml-2 text-muted-foreground">{log.workerCount} công nhân</span>
                      </div>
                      <p className="max-w-[300px] truncate text-muted-foreground">{log.notes || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Chi phí gần đây</CardTitle>
              <Link href={`/expenses?projectId=${project.id}`}>
                <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có chi phí nào.</p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 5).map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                        <span className="font-medium">{ex.category.name}</span>
                        <span className="text-muted-foreground">{formatDate(ex.date)}</span>
                      </div>
                      <span className="font-medium text-rose-600">{formatCurrency(ex.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nhật ký dự án</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có nhật ký.</p>
              ) : (
                <div className="divide-y">
                  {dailyLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <span className="font-medium">{formatDate(log.date)}</span>
                        <span className="ml-2 text-muted-foreground">{log.workerCount} công nhân</span>
                      </div>
                      <p className="max-w-[400px] truncate text-muted-foreground">{log.notes || "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Chi phí dự án</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có chi phí.</p>
              ) : (
                <div className="divide-y">
                  {expenses.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ex.category.name}</span>
                        <span className="text-muted-foreground">{formatDate(ex.date)}</span>
                      </div>
                      <span className="font-medium text-rose-600">{formatCurrency(ex.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 border-t pt-3 flex justify-between text-sm font-medium">
                <span>Tổng chi phí</span>
                <span className="text-rose-600">{formatCurrency(totalExpenses)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stages Tab */}
        <TabsContent value="stages" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Tiến độ giai đoạn</CardTitle></CardHeader>
            <CardContent>
              {project.stages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có giai đoạn.</p>
              ) : (
                <div className="space-y-4">
                  {project.stages.map((s) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <span className="font-medium">{s.name}</span>
                        <Badge variant="outline">{s.progress}%</Badge>
                      </div>
                      <Progress value={s.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Hình ảnh dự án</CardTitle></CardHeader>
            <CardContent>
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có hình ảnh.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {photos.map((p) => (
                    <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border">
                      <img src={p.url} alt={p.caption ?? ""} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      {p.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="truncate text-xs text-white">{p.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Dự toán ngân sách</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span>Tổng ngân sách</span>
                  <span className="font-bold">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dự toán giai đoạn</span>
                  <span className="font-medium">{formatCurrency(totalPlanned)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Chi phí thực tế</span>
                  <span className="text-rose-600">{formatCurrency(totalActual)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Đã giải ngân</span>
                  <span className="font-medium text-rose-600">{formatCurrency(project.projectBudget?.spent ?? totalExpenses)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-emerald-600 font-medium">
                  <span>Còn lại</span>
                  <span>{formatCurrency(Math.max(0, budgetRemaining))}</span>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Tỷ lệ giải ngân</p>
                <Progress value={Math.min(100, parseFloat(budgetUtilization))} className="h-2" />
                <p className="text-right text-xs text-muted-foreground mt-1">{budgetUtilization}%</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weather Tab */}
        <TabsContent value="weather" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><CloudSun className="h-4 w-4" />Thời tiết</CardTitle></CardHeader>
            <CardContent>
              {project.latitude && project.longitude ? (
                <WeatherWidget lat={project.latitude} lon={project.longitude} address={project.address} />
              ) : (
                <p className="text-sm text-muted-foreground">Dự án chưa có tọa độ để hiển thị thời tiết.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WeatherWidget({ lat, lon, address }: { lat: number; lon: number; address: string | null }) {
  const weatherData = useMemo(() => {
    // Attempt to fetch weather from API
    return null as { condition: string; temperature: number; humidity: number; windSpeed: number } | null;
  }, [lat, lon]);

  if (weatherData) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center text-sm">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
          <CloudSun className="mx-auto h-8 w-8 text-blue-500" />
          <p className="mt-2 text-2xl font-bold">{weatherData.temperature}°C</p>
          <p className="text-muted-foreground">{weatherData.condition}</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">Độ ẩm</p>
          <p className="mt-1 text-lg font-bold">{weatherData.humidity}%</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">Gió</p>
          <p className="mt-1 text-lg font-bold">{weatherData.windSpeed} km/h</p>
        </div>
        <div className="rounded-lg bg-muted p-4">
          <p className="text-xs text-muted-foreground">Địa điểm</p>
          <p className="mt-1 text-xs truncate">{address || "Đang cập nhật"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center text-sm text-muted-foreground">
      <CloudSun className="mx-auto h-10 w-10 mb-2 opacity-50" />
      <p>Thời tiết hôm nay</p>
      <p className="mt-1 text-xs">
        {address || `Vĩ độ: ${lat}, Kinh độ: ${lon}`}
      </p>
    </div>
  );
}
