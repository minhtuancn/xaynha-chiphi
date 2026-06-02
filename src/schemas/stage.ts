import { z } from "zod";

export const stageSchema = z.object({
  name: z.string().min(1, "Tên giai đoạn không được để trống"),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "ON_HOLD"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  progress: z.coerce.number().min(0).max(100).default(0),
  estimatedBudget: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  name: z.string().min(1, "Tên task không được để trống"),
  description: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  assignee: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  progress: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export type StageFormData = z.infer<typeof stageSchema>;
export type TaskFormData = z.infer<typeof taskSchema>;
