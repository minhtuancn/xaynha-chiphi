"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SupplierDetailProps = {
  supplier: {
    id: string;
    name: string;
    contact: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxCode: string | null;
    notes: string | null;
    _count: { purchaseOrders: number };
  };
};

export function SupplierDetail({ supplier }: SupplierDetailProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Thông tin nhà cung cấp</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">Người liên hệ:</span> <span className="font-medium">{supplier.contact || "-"}</span></div>
        <div><span className="text-muted-foreground">Số điện thoại:</span> <span className="font-medium">{supplier.phone || "-"}</span></div>
        <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{supplier.email || "-"}</span></div>
        <div><span className="text-muted-foreground">Địa chỉ:</span> <span className="font-medium">{supplier.address || "-"}</span></div>
        <div><span className="text-muted-foreground">Mã số thuế:</span> <span className="font-medium">{supplier.taxCode || "-"}</span></div>
        <div><span className="text-muted-foreground">Số đơn hàng:</span> <span className="font-medium">{supplier._count.purchaseOrders}</span></div>
      </CardContent>
      {supplier.notes && (
        <CardContent className="border-t pt-4">
          <p className="text-xs text-muted-foreground">Ghi chú</p>
          <p className="text-sm">{supplier.notes}</p>
        </CardContent>
      )}
    </Card>
  );
}
