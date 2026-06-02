import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "Tên nhà cung cấp không được để trống"),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").or(z.literal("")).optional(),
  address: z.string().optional(),
  taxCode: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;
