import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupplierForm } from "@/components/forms/supplier-form";
import { createSupplier } from "@/actions/suppliers";

export default async function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Thêm nhà cung cấp mới</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin nhà cung cấp</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm
            onSubmit={createSupplier}
            submitLabel="Tạo nhà cung cấp"
          />
        </CardContent>
      </Card>
    </div>
  );
}
