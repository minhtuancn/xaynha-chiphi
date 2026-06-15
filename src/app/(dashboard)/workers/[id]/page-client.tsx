"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { WorkerForm } from "@/components/forms/worker-form";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { WorkerDetail } from "@/components/detail-views/worker-detail";
import { updateWorker } from "@/actions/workers";
import { serialize } from "@/lib/serialize";
import type { WorkerFormData } from "@/schemas/worker";

type WorkerWithRelations = Awaited<ReturnType<typeof import("@/actions/workers").getWorker>>;

export default function WorkerDetailPage({
  worker,
}: {
  worker: NonNullable<WorkerWithRelations>;
}) {
  const router = useRouter();

  const defaultValues: Partial<WorkerFormData> = {
    name: worker.name,
    phone: worker.phone ?? "",
    idCard: worker.idCard ?? "",
    skill: worker.skill ?? "",
    dailyWage: Number(worker.dailyWage),
    notes: worker.notes ?? "",
  };

  async function handleUpdate(id: string, data: WorkerFormData) {
    try {
      await updateWorker(id, data);
    } catch {
      // redirect will happen
    }
  }

  // Serialize Decimals before passing to client components
  const serializedWorker = serialize(worker);

  return (
    <div className="space-y-6">
      <DetailViewTabs
        viewTab={<WorkerDetail worker={serializedWorker} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <WorkerForm
                defaultValues={defaultValues}
                onSubmit={updateWorker.bind(null, worker.id)}
                submitLabel="Cập nhật"
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}