import { z } from "zod";

export const documentSchema = z.object({
  projectId: z.string().min(1, "Chọn dự án"),
  name: z.string().min(1, "Nhập tên tài liệu"),
  type: z.enum(["CONTRACT", "DRAWING", "INVOICE", "PERMIT", "OTHER"]),
  category: z.string().optional(),
  url: z.string().min(1, "Chưa tải file lên"),
  size: z.coerce.number().min(0),
  tags: z.string().optional(),
});

export type DocumentFormData = z.infer<typeof documentSchema>;
