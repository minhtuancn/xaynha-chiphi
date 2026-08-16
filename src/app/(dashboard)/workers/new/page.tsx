import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/forms/worker-form";
import { createWorker } from "@/actions/workers";

export default async function NewWorkerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Thêm công nhân mới</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin công nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkerForm
            onSubmit={createWorker}
            submitLabel="Tạo công nhân"
          />
        </CardContent>
      </Card>
    </div>
  );
}
