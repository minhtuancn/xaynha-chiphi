import { z } from "zod";

export const checklistItemSchema = z.object({
  name: z.string().min(1, "Nhập nội dung mục"),
});

export const checklistSchema = z.object({
  stageId: z.string().min(1, "Chọn giai đoạn"),
  name: z.string().min(1, "Nhập tên checklist"),
});

export type ChecklistFormData = z.infer<typeof checklistSchema>;
export type ChecklistItemFormData = z.infer<typeof checklistItemSchema>;
