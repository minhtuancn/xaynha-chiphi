import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierForm } from "@/components/forms/supplier-form";
import { getSupplier, updateSupplier } from "@/actions/suppliers";
import type { SupplierFormData } from "@/schemas/supplier";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) notFound();

  const defaultValues: Partial<SupplierFormData> = {
    name: supplier.name,
    contact: supplier.contact ?? "",
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    taxCode: supplier.taxCode ?? "",
    notes: supplier.notes ?? "",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa nhà cung cấp</h1>
      <Card>
        <CardHeader>
          <CardTitle>{supplier.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm
            defaultValues={defaultValues}
            onSubmit={(data) => updateSupplier(id, data)}
            submitLabel="Cập nhật"
          />
        </CardContent>
      </Card>
    </div>
  );
}
