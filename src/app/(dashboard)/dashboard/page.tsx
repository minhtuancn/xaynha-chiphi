"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { RecentPhotos } from "@/components/dashboard/recent-photos";
import { formatCurrency, formatDate, STAGE_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/utils";
import { Building2, Wallet, TrendingUp, ListChecks, Loader2 } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.project) {
    return (
      <Card className="text-center py-12 shadow-sm border-dashed">
        <h2 className="text-2xl font-heading font-semibold mb-2">Chưa có dự án nào</h2>
        <p className="text-muted-foreground">Hãy tạo dự án mới để bắt đầu quản lý.</p>
      </Card>
    );
  }

  const { project, stats, stages, recentPhotos, weather, upcomingTasks, recentExpenses } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-heading font-semibold text-foreground">{project.name}</h1>
        <p className="text-muted-foreground">{project.address}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tiến độ tổng thể</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ngân sách"
          value={formatCurrency(Number(stats?.budget ?? 0))}
          subtitle={`Đã chi: ${formatCurrency(Number(stats?.spent ?? 0))}`}
          icon={Wallet}
          className="shadow-sm hover:shadow-md transition-all"
        />
        <StatCard
          title="Giai đoạn"
          value={`${stats?.completedStages ?? 0}/${stats?.totalStages ?? 0}`}
          subtitle="Hoàn thành"
          icon={Building2}
          className="shadow-sm hover:shadow-md transition-all"
        />
        <StatCard
          title="Công việc"
          value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`}
          subtitle="Hoàn thành"
          icon={ListChecks}
          className="shadow-sm hover:shadow-md transition-all"
        />
        <StatCard
          title="Còn lại"
          value={formatCurrency(Number(stats?.remaining ?? 0))}
          subtitle="Ngân sách"
          icon={TrendingUp}
          className="shadow-sm hover:shadow-md transition-all"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1">
          <WeatherWidget weather={weather} />
        </div>
        <div className="md:col-span-2">
          <ProgressChart stages={stages} />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">Giai đoạn thi công</h2>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {stages.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground sm:col-span-2">Chưa có giai đoạn nào</Card>
            ) : (
                stages.map((stage: any) => (
                    <div key={stage.id} className="flex items-center gap-4 p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 bg-card group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium group-hover:text-primary transition-colors">{stage.name}</span>
                                <StatusBadge status={stage.status} labels={STAGE_STATUS_LABELS} />
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="font-mono">{stage.progress}%</span>
                                <span>{stage._count.tasks} nhiệm vụ</span>
                            </div>
                            <Progress value={stage.progress} className="h-1.5 mt-3" />
                        </div>
                    </div>
                ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Nhiệm vụ sắp tới</h2>
            <div className="space-y-3">
              {upcomingTasks.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground border-dashed">Không có nhiệm vụ nào</Card>
              ) : (
                upcomingTasks.map((task: any) => (
                  <div key={task.id} className="p-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 bg-card group">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.status} labels={TASK_STATUS_LABELS} />
                      <span className="text-sm font-medium group-hover:text-primary transition-colors">{task.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{task.stage.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">Chi phí gần đây</h2>
            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground border-dashed">Không có chi phí nào</Card>
              ) : (
                recentExpenses.map((exp: any) => (
                  <div key={exp.id} className="flex justify-between items-center p-3 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 bg-card group">
                    <div>
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{exp.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">{formatDate(exp.date)}</p>
                    </div>
                    <span className="text-sm font-bold text-destructive">{formatCurrency(Number(exp.amount))}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <RecentPhotos photos={recentPhotos} />
    </div>
  );
}
