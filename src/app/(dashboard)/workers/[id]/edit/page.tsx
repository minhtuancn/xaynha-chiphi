import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/forms/worker-form";
import { getWorker, updateWorker } from "@/actions/workers";
import type { WorkerFormData } from "@/schemas/worker";

export default async function EditWorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = await getWorker(id);

  if (!worker) notFound();

  const defaultValues: Partial<WorkerFormData> = {
    name: worker.name,
    phone: worker.phone ?? "",
    idCard: worker.idCard ?? "",
    skill: worker.skill ?? "",
    dailyWage: worker.dailyWage.toNumber(),
    notes: worker.notes ?? "",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa công nhân</h1>
      <Card>
        <CardHeader>
          <CardTitle>{worker.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkerForm
            defaultValues={defaultValues}
            onSubmit={(data) => updateWorker(id, data)}
            submitLabel="Cập nhật"
          />
        </CardContent>
      </Card>
    </div>
  );
}
