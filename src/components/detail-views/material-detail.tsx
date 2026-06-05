"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserSettings } from "@/hooks/use-user-settings";
import { cn } from "@/lib/utils";
import { Package, AlertTriangle, DollarSign, Hash, Building2, TrendingDown } from "lucide-react";

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
  const { formatCurrency, formatNumber } = useUserSettings();
  const isLowStock = Number(material.currentStock) < Number(material.minStock);
  const stockRatio = material.minStock > 0 ? Math.min(Number(material.currentStock) / Number(material.minStock), 3) : 1;
  const stockPercent = Math.min(Math.round((stockRatio / 3) * 100), 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tồn kho</p>
                <p className={cn("mt-1 text-xl font-bold", isLowStock && "text-destructive")}>
                  {formatNumber(material.currentStock)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{material.unit}</p>
              </div>
              <div className={cn("rounded-full p-2.5", isLowStock ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent")}>
                {isLowStock ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tồn tối thiểu</p>
                <p className="mt-1 text-xl font-bold">{formatNumber(material.minStock)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{material.unit}</p>
              </div>
              <div className="rounded-full bg-orange-500/10 p-2.5 text-orange-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Đơn giá</p>
                <p className="mt-1 text-xl font-bold">{formatCurrency(material.unitCost)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">/{material.unit}</p>
              </div>
              <div className="rounded-full bg-green-500/10 p-2.5 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="gradient" hoverable>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Giá trị tồn kho</p>
                <p className="mt-1 text-xl font-bold">
                  {formatCurrency(Number(material.currentStock) * Number(material.unitCost))}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">theo đơn giá</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Hash className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main info */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Package className="h-4 w-4" />}>Thông tin vật liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Danh mục:</span>
              <Badge variant="outline">{material.category?.name ?? "-"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Đơn vị:</span>
              <span className="font-medium">{material.unit}</span>
            </div>
            {material.supplier && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Nhà cung cấp:</span>
                <span className="font-medium">{material.supplier.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock level indicator */}
      <Card>
        <CardHeader>
          <CardTitle icon={<Package className="h-4 w-4" />}>Mức tồn kho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{formatNumber(material.currentStock)} / {formatNumber(material.minStock)} {material.unit}</span>
              <span className={cn("font-medium", isLowStock && "text-destructive")}>
                {isLowStock ? "Dưới mức tối thiểu" : "Đạt yêu cầu"}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  stockPercent > 66 ? "bg-accent" : stockPercent > 33 ? "bg-amber-500" : "bg-destructive"
                )}
                style={{ width: `${stockPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>Tối thiểu: {formatNumber(material.minStock)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLowStock && (
        <Card variant="destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Tồn kho thấp hơn mức tối thiểu ({formatNumber(material.minStock)} {material.unit}). Cần nhập thêm.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}