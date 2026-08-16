import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";
import { MaterialPriceSection } from "@/components/material-price-section";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { MaterialDetail } from "@/components/detail-views/material-detail";
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

  const [categories, suppliers] = await Promise.all([
    getMaterialCategories(),
    prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    }),
  ]);

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
  const serializedSuppliers = serialize(suppliers);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{material.name}</h1>
      <DetailViewTabs
        viewTab={<MaterialDetail material={serialize(material)} />}
        editTab={
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Thông tin vật liệu</CardTitle></CardHeader>
              <CardContent>
                <MaterialForm
                  defaultValues={defaultValues}
                  onSubmit={updateMaterial.bind(null, id)}
                  submitLabel="Cập nhật"
                  categories={categories}
                  suppliers={serializedSuppliers}
                />
              </CardContent>
            </Card>
            <MaterialPriceSection materialId={id} prices={prices} />
          </div>
        }
      />
    </div>
  );
}
