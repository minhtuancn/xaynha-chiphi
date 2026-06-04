"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUserSettings } from "@/hooks/use-user-settings";

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

export function ProjectDetail({ project }: ProjectDetailProps) {
  const { formatCurrency, formatDate } = useUserSettings();
  const statusLabels: Record<string, string> = { PLANNING: "Lập kế hoạch", ACTIVE: "Đang thi công", PAUSED: "Tạm dừng", COMPLETED: "Hoàn thành" };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin dự án</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tiến độ</span> <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Địa chỉ:</span> <span className="font-medium">{project.address || "-"}</span></div>
            <div><span className="text-muted-foreground">Ngân sách:</span> <span className="font-medium">{formatCurrency(project.budget)}</span></div>
            <div><span className="text-muted-foreground">Trạng thái:</span> <Badge>{statusLabels[project.status] || project.status}</Badge></div>
            <div><span className="text-muted-foreground">Số giai đoạn:</span> <span className="font-medium">{project._count.stages}</span></div>
            <div><span className="text-muted-foreground">Bắt đầu:</span> <span className="font-medium">{formatDate(project.startDate)}</span></div>
            <div><span className="text-muted-foreground">Kết thúc:</span> <span className="font-medium">{formatDate(project.endDate)}</span></div>
          </div>
          {project.description && (
            <div className="border-t pt-3">
              <p className="text-xs text-muted-foreground">Mô tả</p>
              <p className="text-sm">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
