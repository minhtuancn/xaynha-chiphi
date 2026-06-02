import { z } from "zod";

export const materialSchema = z.object({
  name: z.string().min(1, "Tên vật liệu không được để trống"),
  categoryId: z.string().min(1, "Chọn danh mục"),
  unit: z.string().min(1, "Đơn vị tính"),
  currentStock: z.coerce.number().min(0).default(0),
  minStock: z.coerce.number().min(0).default(0),
  unitCost: z.coerce.number().min(0).default(0),
  supplierId: z.string().optional(),
});

export type MaterialFormData = z.infer<typeof materialSchema>;
