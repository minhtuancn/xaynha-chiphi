"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { addManualPrice } from "@/actions/materials";

interface PriceEntry {
  id: string;
  price: number;
  source: "PO" | "MANUAL";
  notes: string | null;
  createdAt: string | Date;
  purchaseOrder?: { id: string } | null;
}

interface MaterialPriceSectionProps {
  materialId: string;
  prices: PriceEntry[];
  currency?: string;
}

export function MaterialPriceSection({
  materialId,
  prices,
  currency = "₫",
}: MaterialPriceSectionProps) {
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = () => {
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) return;

    startTransition(async () => {
      await addManualPrice(materialId, {
        price: priceValue,
        notes: notes || undefined,
      });
      setPrice("");
      setNotes("");
      router.refresh();
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN").format(value) + " " + currency;

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử giá</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price History Table */}
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có lịch sử giá.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead className="text-right">Giá</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.createdAt)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.source === "PO" ? "default" : "secondary"}
                      >
                        {p.source === "PO" ? "Đơn hàng" : "Thủ công"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Manual Price Entry */}
        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-sm font-medium">Thêm giá thủ công</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-price">Giá ({currency})</Label>
              <Input
                id="manual-price"
                type="number"
                min={0}
                step="1"
                placeholder="Nhập giá"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="manual-notes"
                placeholder="Ghi chú về giá"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={1}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !price}
            >
              {isPending ? "Đang lưu..." : "Thêm giá"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
