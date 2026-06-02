import { z } from "zod";

export const dailyLogSchema = z.object({
  date: z.coerce.date(),
  temperature: z.coerce.number().optional(),
  notes: z.string().optional(),
  issues: z.string().optional(),
  workerCount: z.coerce.number().min(0).default(0),
});

export type DailyLogFormData = z.infer<typeof dailyLogSchema>;
