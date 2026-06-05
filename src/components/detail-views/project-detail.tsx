"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserSettings } from "@/hooks/use-user-settings";
import { PROJECT_STATUS_LABELS } from "@/lib/utils";
import { Home, MapPin, CalendarRange, Layers, Wallet } from "lucide-react";

type ProjectDetailProps = {
  project: {
    id: string;
    name: string;
    address: string | null;
    budget: number;
    status: string;
    progress: number;
    startDate: Date | string | null;
    endDate: Date | string | null;
    description: string | null;
    _count: { stages: number };
  };
};

const STATUS_VARIANTS: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PAUSED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PLANNING: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Ngân sách</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(project.budget)}</p>
              </div>
              <div className="rounded-full bg-accent/10 p-2.5 text-accent">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tiến độ</p>
                <p className="mt-1 text-xl font-bold">{project.progress}%</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Home className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Giai đoạn</p>
                <p className="mt-1 text-xl font-bold">{project._count.stages}</p>
              </div>
              <div className="rounded-full bg-blue-500/10 p-2.5 text-blue-600">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Trạng thái</p>
                <Badge className={STATUS_VARIANTS[project.status] || ""}>
                  {PROJECT_STATUS_LABELS[project.status] || project.status}
                </Badge>
              </div>
              <CalendarRange className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main info */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Home className="h-4 w-4" />}>Thông tin dự án</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tiến độ tổng thể</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2.5" />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {project.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Địa chỉ:</span>
                <span className="font-medium">{project.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Ngân sách:</span>
              <span className="font-medium">{formatCurrency(project.budget)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Số giai đoạn:</span>
              <span className="font-medium">{project._count.stages}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Bắt đầu:</span>
              <span className="font-medium">{formatDate(project.startDate) || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarRange className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Kết thúc:</span>
              <span className="font-medium">{formatDate(project.endDate) || "-"}</span>
            </div>
          </div>

          {project.description && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}