"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { Building2, Phone, Mail, MapPin, Receipt, CreditCard, FileText, Package } from "lucide-react";

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
  const { formatCurrency } = useUserSettings();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overview card */}
      <Card variant="gradient">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{supplier.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Nhà cung cấp</p>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Đơn hàng</p>
                <p className="mt-1 text-xl font-bold">{supplier._count.purchaseOrders}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">tổng số</p>
              </div>
              <div className="rounded-full bg-accent/10 p-2.5 text-accent">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Liên hệ</p>
                <p className="mt-1 text-sm font-medium truncate max-w-[140px]">{supplier.contact || "Chưa có"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{supplier.phone || "Chưa có SĐT"}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Phone className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Mã số thuế</p>
                <p className="mt-1 text-sm font-medium">{supplier.taxCode || "Chưa có"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{supplier.email ? "Đã có email" : "Chưa có email"}</p>
              </div>
              <div className="rounded-full bg-muted p-2.5 text-muted-foreground">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle icon={<FileText className="h-4 w-4" />}>Thông tin liên hệ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            {supplier.contact && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Người liên hệ:</span>
                <span className="font-medium">{supplier.contact}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Số điện thoại:</span>
                <span className="font-medium">{supplier.phone}</span>
              </div>
            )}
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{supplier.email}</span>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Địa chỉ:</span>
                <span className="font-medium">{supplier.address}</span>
              </div>
            )}
            {supplier.taxCode && (
              <div className="flex items-center gap-2">
                <Receipt className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Mã số thuế:</span>
                <span className="font-medium">{supplier.taxCode}</span>
              </div>
            )}
          </div>
          {supplier.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground mb-1">Ghi chú</p>
              <p className="text-sm">{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}