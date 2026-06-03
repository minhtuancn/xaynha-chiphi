import { z } from "zod";

export const dailyLogSchema = z.object({
  projectId: z.string().min(1, "Chọn dự án"),
  date: z.coerce.date(),
  timeOfDay: z.enum(["MORNING", "AFTERNOON"]),
  weatherCondition: z
    .enum(["SUN", "RAIN", "CLOUDY", "STORM", "OVERCAST"])
    .optional(),
  temperature: z.coerce.number().min(-10).max(60).optional().nullable(),
  weatherSource: z.enum(["AUTO", "MANUAL"]).optional(),
  workerCount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  issues: z.string().optional(),
});

export type DailyLogFormData = z.infer<typeof dailyLogSchema>;
