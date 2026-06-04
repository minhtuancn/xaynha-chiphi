import { z } from "zod";

export const inventorySchema = z.object({
  materialId: z.string().min(1, "Chọn vật liệu"),
  type: z.enum(["IN", "OUT", "USAGE", "RETURN", "ADJUSTMENT"]),
  quantity: z.coerce.number().min(0.01, "Số lượng phải lớn hơn 0"),
  date: z.coerce.date(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  purchaseOrderId: z.string().optional(),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;
