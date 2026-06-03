import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";
import { MaterialPriceSection } from "@/components/material-price-section";
import { getMaterial, updateMaterial, getMaterialCategories } from "@/actions/materials";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import type { MaterialFormData } from "@/schemas/material";

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const material = await getMaterial(id);

  if (!material) notFound();

  const categories = await getMaterialCategories();
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  const defaultValues: Partial<MaterialFormData> = serialize({
    name: material.name,
    categoryId: material.categoryId,
    unit: material.unit,
    currentStock: material.currentStock,
    minStock: material.minStock,
    unitCost: material.unitCost,
    supplierId: material.supplierId ?? "",
  });

  const prices = serialize(material.prices ?? []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa vật liệu</h1>
      <Card>
        <CardHeader>
          <CardTitle>{material.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialForm
            defaultValues={defaultValues}
            onSubmit={updateMaterial.bind(null, id)}
            submitLabel="Cập nhật"
            categories={categories}
            suppliers={suppliers}
          />
        </CardContent>
      </Card>
      <MaterialPriceSection materialId={id} prices={prices} />
    </div>
  );
}
