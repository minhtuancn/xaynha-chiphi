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
import { WeatherShiftCard } from '@/components/dashboard/weather-shift-card';
import { RecentPhotos } from '@/components/dashboard/recent-photos';

interface DashboardStats {
  totalStages: number;
  completedStages: number;
  totalTasks: number;
  completedTasks: number;
  budget: number;
  spent: number;
  remaining: number;
}

interface DashboardProps {
  project: {
    id: string;
    name: string;
    address: string | null;
    status: string;
  } | null;
  stats: DashboardStats | null;
  stages: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    _count: { tasks: number };
  }>;
  weather: { condition: string; temperature: number; humidity: number; windSpeed: number } | null;
  recentPhotos: Array<{ id: string; url: string; caption: string | null; takenAt: Date }>;
}

export default function DashboardClient({ project, stats, stages, weather, recentPhotos }: DashboardProps) {
  if (!project) {
    return <EmptyState icon={<Home className="h-8 w-8" />} title="Chưa có dự án" description="Tạo dự án để bắt đầu." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <p className="text-muted-foreground">{project.address}</p>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ngân sách" value={formatCurrency(Number(stats?.budget ?? 0))} subtitle={`Đã chi: ${formatCurrency(Number(stats?.spent ?? 0))}`} icon={Wallet} />
        <StatCard title="Giai đoạn" value={`${stats?.completedStages ?? 0}/${stats?.totalStages ?? 0}`} subtitle="Hoàn thành" icon={Building2} />
        <StatCard title="Công việc" value={`${stats?.completedTasks ?? 0}/${stats?.totalTasks ?? 0}`} subtitle="Hoàn thành" icon={ListChecks} />
        <StatCard title="Còn lại" value={formatCurrency(Number(stats?.remaining ?? 0))} subtitle="Ngân sách" icon={TrendingUp} />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="space-y-4 md:col-span-1">
          {weather && <WeatherWidget weather={weather} />}
          <WeatherShiftCard 
            morning={{ time: '06:30-10:30', temp: 28, humidity: 70, rainProb: 10, cloudCover: 20, windSpeed: 10 }}
            afternoon={{ time: '14:00-18:00', temp: 32, humidity: 60, rainProb: 20, cloudCover: 30, windSpeed: 15 }}
          />
        </div>
        <div className="md:col-span-2">{stages && <ProgressChart stages={stages} />}</div>
      </div>
      {recentPhotos && recentPhotos.length > 0 && <RecentPhotos photos={recentPhotos} />}
    </div>
  );
}
