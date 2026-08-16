import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialForm } from "@/components/forms/material-form";
import { createMaterial } from "@/actions/materials";
import { getMaterialCategories } from "@/actions/materials";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";

export default async function NewMaterialPage() {
  const categories = await getMaterialCategories();
  const suppliers = serialize(await prisma.supplier.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Thêm vật liệu mới</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin vật liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialForm
            onSubmit={createMaterial}
            submitLabel="Tạo vật liệu"
            categories={categories}
            suppliers={suppliers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
