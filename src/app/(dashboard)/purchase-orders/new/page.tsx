import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { createPurchaseOrder } from "@/actions/purchase-orders";
import { getSuppliers } from "@/actions/suppliers";
import { getProjects } from "@/actions/projects";
import { getMaterials } from "@/actions/materials";
import { serialize } from "@/lib/serialize";

export default async function NewPurchaseOrderPage() {
  const [suppliers, projects, materials] = await Promise.all([
    getSuppliers(),
    getProjects(),
    getMaterials(),
  ]);

  const serializedMaterials = serialize(materials.data).map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Tạo đơn đặt hàng</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseOrderForm
            onSubmit={createPurchaseOrder}
            submitLabel="Tạo đơn hàng"
            suppliers={serialize(suppliers).map((s) => ({ id: s.id, name: s.name }))}
            projects={serialize(projects).map((p) => ({ id: p.id, name: p.name }))}
            materials={serializedMaterials}
          />
        </CardContent>
      </Card>
    </div>
  );
}
