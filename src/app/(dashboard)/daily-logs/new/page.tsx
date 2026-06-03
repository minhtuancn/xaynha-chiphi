import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyLogForm } from "@/components/forms/daily-log-form";
import { createDailyLog } from "@/actions/daily-logs";
import { getProjects } from "@/actions/projects";

export default async function NewDailyLogPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Thêm nhật ký thi công</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhật ký</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyLogForm
            projects={projects}
            onSubmit={createDailyLog}
            submitLabel="Tạo nhật ký"
          />
        </CardContent>
      </Card>
    </div>
  );
}
