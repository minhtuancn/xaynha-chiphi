"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/forms/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { InventoryFormData } from "@/schemas/inventory";

const formSchema = z.object({
  purchaseOrderId: z.string().min(1, "Chọn đơn hàng"),
  materialId: z.string().min(1, "Chọn vật liệu"),
  quantity: z.coerce.number().min(0.01, "Số lượng > 0"),
  date: z.coerce.date(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PurchaseOrder {
  id: string;
  orderDate: Date | string;
  supplier: { name: string };
  items: { materialId: string }[];
}

interface InventoryReturnFormProps {
  purchaseOrders: PurchaseOrder[];
  materials: { id: string; name: string; unit: string }[];
  onSubmit: (data: InventoryFormData) => Promise<void>;
}

export function InventoryReturnForm({
  purchaseOrders,
  materials,
  onSubmit,
}: InventoryReturnFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      purchaseOrderId: "",
      materialId: "",
      quantity: 0,
      date: new Date(),
      notes: "",
    },
  });

  const selectedPOId = form.watch("purchaseOrderId");
  const selectedPO = purchaseOrders.find((p) => p.id === selectedPOId);
  const poMaterialIds = selectedPO ? selectedPO.items.map((i) => i.materialId) : [];
  const availableMaterials = materials.filter((m) => poMaterialIds.includes(m.id));

  const selectedMaterialId = form.watch("materialId");
  const unit = materials.find((m) => m.id === selectedMaterialId)?.unit || "";

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        materialId: data.materialId,
        type: "RETURN",
        quantity: data.quantity,
        date: data.date,
        purchaseOrderId: data.purchaseOrderId,
        notes: data.notes,
      });
      form.reset({ ...data, quantity: 0, notes: "" });
      toast({ title: "Đã ghi nhận trả hàng" });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="purchaseOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Đơn hàng (đã nhận)</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("materialId", ""); // Reset material when PO changes
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn hàng" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {purchaseOrders.map((po) => {
                      const date = new Date(po.orderDate).toLocaleDateString("vi-VN");
                      return (
                        <SelectItem key={po.id} value={po.id}>
                          {po.supplier.name} - {date}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="materialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vật liệu (có trong ĐH)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                  disabled={!selectedPOId || availableMaterials.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedPOId ? "Chọn ĐH trước" : "Chọn vật liệu"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableMaterials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số lượng {unit && `(${unit})`}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày trả</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Lý do / Ghi chú</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Hàng lỗi, thừa..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Đang xử lý..." : "Lưu giao dịch"}
          </Button>
        </div>
      </form>
    </Form>
  );
}