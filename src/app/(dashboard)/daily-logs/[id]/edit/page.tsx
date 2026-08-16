import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyLogForm } from "@/components/forms/daily-log-form";
import { getDailyLog, updateDailyLog } from "@/actions/daily-logs";
import { getProjects } from "@/actions/projects";
import type { DailyLogFormData } from "@/schemas/daily-log";

export default async function EditDailyLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const log = await getDailyLog(id);
  if (!log) notFound();

  const projects = await getProjects();

  const defaultValues = {
    projectId: log.projectId,
    date: log.date instanceof Date ? log.date : new Date(log.date),
    timeOfDay: (log.timeOfDay ?? "MORNING") as "MORNING" | "AFTERNOON",
    temperature: log.temperature ? Number(log.temperature) : undefined,
    weatherCondition: (log.weatherCondition ?? undefined) as "SUN" | "RAIN" | "CLOUDY" | "STORM" | "OVERCAST" | undefined,
    weatherSource: (log.weatherSource ?? undefined) as "AUTO" | "MANUAL" | undefined,
    notes: log.notes ?? undefined,
    issues: log.issues ?? undefined,
    workerCount: log.workerCount,
  };

  async function handleSubmit(data: DailyLogFormData, photos?: File[]) {
    "use server";
    await updateDailyLog(id, data, photos);
    redirect(`/daily-logs/${id}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Chỉnh sửa nhật ký</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhật ký</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyLogForm
            projects={projects}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            submitLabel="Cập nhật"
          />
        </CardContent>
      </Card>
    </div>
  );
}
