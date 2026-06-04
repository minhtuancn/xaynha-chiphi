import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SupplierForm } from "@/components/forms/supplier-form";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { SupplierDetail } from "@/components/detail-views/supplier-detail";
import { getSupplier, updateSupplier } from "@/actions/suppliers";
import { serialize } from "@/lib/serialize";
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
      <h1 className="text-2xl font-bold">{supplier.name}</h1>
      <DetailViewTabs
        viewTab={<SupplierDetail supplier={serialize(supplier)} />}
        editTab={
          <Card>
            <CardContent className="pt-6">
              <SupplierForm
                defaultValues={defaultValues}
                onSubmit={updateSupplier.bind(null, id)}
                submitLabel="Cập nhật"
              />
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
