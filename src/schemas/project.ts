import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Tên dự án không được để trống"),
  address: z.string().min(1, "Địa chỉ không được để trống"),
  budget: z.coerce.number().min(0, "Ngân sách phải lớn hơn 0"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "PAUSED", "COMPLETED"]),
  progress: z.coerce.number().min(0).max(100).default(0),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
