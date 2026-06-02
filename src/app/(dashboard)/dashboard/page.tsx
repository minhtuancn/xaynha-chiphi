import { getDashboardData } from "@/actions/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { RecentPhotos } from "@/components/dashboard/recent-photos";
import { formatCurrency, formatDate, STAGE_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/utils";
import { Building2, Wallet, TrendingUp, ListChecks } from "lucide-react";

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data.project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Chưa có dự án nào</h2>
        <p className="text-muted-foreground">Hãy tạo dự án mới để bắt đầu quản lý.</p>
      </div>
    );
  }

  const { project, stats, stages, recentPhotos, weather, upcomingTasks, recentExpenses } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">{project.address}</p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Tiến độ tổng thể</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Ngân sách"
          value={formatCurrency(Number(stats?.budget ?? 0))}
          subtitle={`Đã chi: ${formatCurrency(Number(stats?.spent ?? 0))}`}
          icon={Wallet}
        />
        <StatCard
          title="Giai đoạn"
          value={`${stats?.completedStages ?? 0}/${stats?.totalStages ?? 0}`}
          subtitle="Hoàn thành"
          icon={Building2}
        />
        <StatCard
          title="Tasks"
          value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`}
          subtitle="Hoàn thành"
          icon={ListChecks}
        />
        <StatCard
          title="Còn lại"
          value={formatCurrency(Number(stats?.remaining ?? 0))}
          subtitle="Ngân sách"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <WeatherWidget weather={weather} />
        </div>
        <div className="md:col-span-2">
          <ProgressChart stages={stages} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Giai đoạn thi công</h2>
          <div className="space-y-2">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-4 p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{stage.name}</span>
                    <StatusBadge status={stage.status} labels={STAGE_STATUS_LABELS} />
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{stage.progress}%</span>
                    <span>{stage._count.tasks} tasks</span>
                  </div>
                  <Progress value={stage.progress} className="h-1.5 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Task sắp tới</h2>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={task.status} labels={TASK_STATUS_LABELS} />
                    <span className="text-sm font-medium">{task.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{task.stage.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Chi phí gần đây</h2>
            <div className="space-y-2">
              {recentExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between items-center p-2 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(exp.date)}</p>
                  </div>
                  <span className="text-sm font-medium text-red-600">{formatCurrency(Number(exp.amount))}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RecentPhotos photos={recentPhotos} />
    </div>
  );
}
