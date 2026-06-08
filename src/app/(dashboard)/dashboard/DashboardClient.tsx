'use client';

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from '@/lib/utils';
import { Building2, Home, ListChecks, Wallet, TrendingUp } from 'lucide-react';
import { ProgressChart } from '@/components/dashboard/progress-chart';
import { WeatherWidget } from '@/components/dashboard/weather-widget';
import { RecentPhotos } from '@/components/dashboard/recent-photos';

export default function DashboardClient({ project, stats, stages, weather, recentPhotos }: any) {
  if (!project) {
    return <EmptyState icon={<Home className="h-8 w-8" />} title="Chưa có dự án" description="Tạo dự án để bắt đầu." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <p className="text-muted-foreground">{project.address}</p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ngân sách" value={formatCurrency(Number(stats?.budget ?? 0))} subtitle={`Đã chi: ${formatCurrency(Number(stats?.spent ?? 0))}`} icon={Wallet} />
        <StatCard title="Giai đoạn" value={`${stats?.completedStages ?? 0}/${stats?.totalStages ?? 0}`} subtitle="Hoàn thành" icon={Building2} />
        <StatCard title="Công việc" value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`} subtitle="Hoàn thành" icon={ListChecks} />
        <StatCard title="Còn lại" value={formatCurrency(Number(stats?.remaining ?? 0))} subtitle="Ngân sách" icon={TrendingUp} />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1">{weather && <WeatherWidget weather={weather} />}</div>
        <div className="md:col-span-2">{stages && <ProgressChart stages={stages} />}</div>
      </div>
      {recentPhotos && recentPhotos.length > 0 && <RecentPhotos photos={recentPhotos} />}
    </div>
  );
}
