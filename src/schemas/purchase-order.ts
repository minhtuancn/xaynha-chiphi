import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  materialId: z.string().min(1, "Chọn vật liệu"),
  quantity: z.coerce.number().min(0.01, "Số lượng phải lớn hơn 0"),
  unitPrice: z.coerce.number().min(0, "Đơn giá không hợp lệ"),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Chọn nhà cung cấp"),
  projectId: z.string().min(1, "Chọn dự án"),
  orderDate: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "Ít nhất 1 vật liệu"),
});

export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;
export type PurchaseOrderItemFormData = z.infer<typeof purchaseOrderItemSchema>;
