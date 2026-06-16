import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/actions/purchase-orders";
import { getSuppliers } from "@/actions/suppliers";
import { getProjects } from "@/actions/projects";
import { getMaterials } from "@/actions/materials";
import { serialize } from "@/lib/serialize";
import PurchaseOrderDetailPage from "./page-client";

export default async function PurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getPurchaseOrder(id);

  if (!order) notFound();

  const [suppliers, projects, materials] = await Promise.all([
    getSuppliers(),
    getProjects(),
    getMaterials(),
  ]);

  return (
    <PurchaseOrderDetailPage 
      order={serialize(order)} 
      suppliers={serialize(suppliers).map((s) => ({ id: s.id, name: s.name }))}
      projects={serialize(projects).map((p) => ({ id: p.id, name: p.name }))}
      materials={serialize(materials.data).map((m) => ({ id: m.id, name: m.name, unit: m.unit }))}
    />
  );
}
