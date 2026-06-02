import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";
import { getMaterial, updateMaterial, getMaterialCategories } from "@/actions/materials";
import { prisma } from "@/lib/prisma";
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

  const defaultValues: Partial<MaterialFormData> = {
    name: material.name,
    categoryId: material.categoryId,
    unit: material.unit,
    currentStock: material.currentStock.toNumber(),
    minStock: material.minStock.toNumber(),
    unitCost: material.unitCost.toNumber(),
    supplierId: material.supplierId ?? "",
  };

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
            onSubmit={(data) => updateMaterial(id, data)}
            submitLabel="Cập nhật"
            categories={categories}
            suppliers={suppliers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
