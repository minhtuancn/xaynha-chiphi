import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { WorkerForm } from "@/components/forms/worker-form";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { WorkerDetail } from "@/components/detail-views/worker-detail";
import { getWorker, updateWorker } from "@/actions/workers";
import { serialize } from "@/lib/serialize";
import type { WorkerFormData } from "@/schemas/worker";

export default async function EditWorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = await getWorker(id);
  if (!worker) notFound();

  const defaultValues: Partial<WorkerFormData> = serialize({
    name: worker.name,
    phone: worker.phone ?? "",
    idCard: worker.idCard ?? "",
    skill: worker.skill ?? "",
    taxCode: worker.taxCode ?? "",
    bankName: worker.bankName ?? "",
    bankAccountNumber: worker.bankAccountNumber ?? "",
    bankAccountHolder: worker.bankAccountHolder ?? "",
    bankBranch: worker.bankBranch ?? "",
    dailyWage: worker.dailyWage,
    notes: worker.notes ?? "",
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{worker.name}</h1>
      <DetailViewTabs
        viewTab={<WorkerDetail worker={serialize(worker)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <WorkerForm
                defaultValues={defaultValues}
                onSubmit={updateWorker.bind(null, id)}
                submitLabel="Cập nhật"
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
