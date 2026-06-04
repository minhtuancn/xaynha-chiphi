import { z } from "zod";

export const materialUsageSchema = z.object({
  materialId: z.string().min(1, "Chọn vật liệu"),
  dailyLogId: z.string().optional(),
  taskId: z.string().optional(),
  projectId: z.string().min(1, "Chọn dự án"),
  quantity: z.coerce.number().min(0.01, "Số lượng phải lớn hơn 0"),
  date: z.coerce.date(),
  notes: z.string().optional(),
});

export type MaterialUsageFormData = z.infer<typeof materialUsageSchema>;
