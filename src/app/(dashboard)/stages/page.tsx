import Link from "next/link";
import { Plus } from "lucide-react";
import { getStages } from "@/actions/stages";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, STAGE_STATUS_LABELS } from "@/lib/utils";

export default async function StagesPage() {
  const stages = await getStages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giai đoạn thi công</h1>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có giai đoạn nào. Tạo giai đoạn từ trang dự án.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <Card key={stage.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    <Link
                      href={`/stages/${stage.id}`}
                      className="hover:underline"
                    >
                      {stage.name}
                    </Link>
                  </CardTitle>
                  <StatusBadge
                    status={stage.status}
                    labels={STAGE_STATUS_LABELS}
                  />
                </div>
                {stage.project && (
                  <p className="text-sm text-muted-foreground">
                    Dự án: {stage.project.name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ</span>
                    <span className="font-medium">{stage.progress}%</span>
                  </div>
                  <Progress value={stage.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Số task</p>
                    <p className="font-medium">{stage._count.tasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngân sách ước tính</p>
                    <p className="font-medium">
                      {formatCurrency(stage.estimatedBudget.toNumber())}
                    </p>
                  </div>
                </div>

                {(stage.startDate || stage.endDate) && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    {stage.startDate && <span>{formatDate(stage.startDate)}</span>}
                    {stage.endDate && <span>{formatDate(stage.endDate)}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
