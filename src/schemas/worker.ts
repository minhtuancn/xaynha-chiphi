import { z } from "zod";

export const workerSchema = z.object({
  name: z.string().min(1, "Tên công nhân không được để trống"),
  phone: z.string().optional(),
  idCard: z.string().optional(),
  skill: z.string().optional(),
  taxCode: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountHolder: z.string().optional(),
  bankBranch: z.string().optional(),
  dailyWage: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

export const attendanceSchema = z.object({
  workerId: z.string(),
  date: z.coerce.date(),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
  checkIn: z.coerce.date().optional(),
  checkOut: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export type WorkerFormData = z.infer<typeof workerSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
