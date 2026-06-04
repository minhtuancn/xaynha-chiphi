"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserSettings } from "@/hooks/use-user-settings";

type MaterialDetailProps = {
  material: {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    unitCost: number;
    category: { name: string } | null;
    supplier: { id: string; name: string } | null;
    createdAt: Date | string;
  };
};

export function MaterialDetail({ material }: MaterialDetailProps) {
  const { formatCurrency, formatNumber, formatDate } = useUserSettings();
  const isLowStock = Number(material.currentStock) < Number(material.minStock);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Thông tin vật liệu</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Danh mục:</span> <span className="font-medium">{material.category?.name ?? "-"}</span></div>
          <div><span className="text-muted-foreground">Đơn vị:</span> <span className="font-medium">{material.unit}</span></div>
          <div><span className="text-muted-foreground">Tồn kho:</span> <span className={`font-medium ${isLowStock ? "text-destructive" : ""}`}>{formatNumber(material.currentStock)}</span></div>
          <div><span className="text-muted-foreground">Tồn tối thiểu:</span> <span className="font-medium">{formatNumber(material.minStock)}</span></div>
          <div><span className="text-muted-foreground">Đơn giá:</span> <span className="font-medium">{formatCurrency(material.unitCost)}</span></div>
          <div><span className="text-muted-foreground">Nhà cung cấp:</span> <span className="font-medium">{material.supplier?.name ?? "-"}</span></div>
        </CardContent>
      </Card>

      {isLowStock && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-destructive text-sm">
            ⚠ Tồn kho thấp hơn mức tối thiểu ({formatNumber(material.minStock)})
          </CardContent>
        </Card>
      )}
    </div>
  );
}
