import { z } from "zod";

export const notificationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  message: z.string().min(1),
});

export type NotificationFormData = z.infer<typeof notificationSchema>;
