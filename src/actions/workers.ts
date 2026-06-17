"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "./notifications";
import { requirePermission } from "@/lib/auth";
import { workerSchema, type WorkerFormData } from "@/schemas/worker";
import { createNotificationForCurrentUser } from "./notifications";
import { logAudit } from "@/lib/audit";
import { serialize } from "@/lib/serialize";

async function notifyCurrentUser(type: string, message: string) {
  try {
    await createNotificationForCurrentUser({ type, message });
  } catch {
    // Notifications should not block worker mutations.
  }
}

export async function getWorkers() {
  await requirePermission("workers", "view");

  const result = await prisma.worker.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(result);
}

export async function getWorker(id: string) {
  await requirePermission("workers", "view");

  const result = await prisma.worker.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { attendances: true } },
      attendances: { orderBy: { date: "desc" }, take: 10 },
      debts: {
        where: { deletedAt: null },
        select: { id: true, amount: true, paidAmount: true, type: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  return serialize(result);
}

export async function createWorker(data: WorkerFormData) {
  const user = await requirePermission("workers", "create");

  const validated = workerSchema.parse(data);

  const worker = await prisma.worker.create({
    data: {
      name: validated.name,
      phone: validated.phone || null,
      idCard: validated.idCard || null,
      skill: validated.skill || null,
      taxCode: validated.taxCode || null,
      bankName: validated.bankName || null,
      bankAccountNumber: validated.bankAccountNumber || null,
      bankAccountHolder: validated.bankAccountHolder || null,
      bankBranch: validated.bankBranch || null,
      dailyWage: validated.dailyWage,
      notes: validated.notes || null,
    },
  });

  await logAudit(user.id, "CREATE", "Worker", worker.id, {
    newValues: {
      name: validated.name,
      phone: validated.phone || null,
      dailyWage: validated.dailyWage,
    },
  });
  await notifyCurrentUser("SUCCESS", "Da tao cong nhan moi");
  revalidatePath("/workers");
  redirect("/workers");
}

export async function updateWorker(id: string, data: WorkerFormData) {
  const user = await requirePermission("workers", "edit");

  const validated = workerSchema.parse(data);

  await prisma.worker.update({
    where: { id },
    data: {
      name: validated.name,
      phone: validated.phone || null,
      idCard: validated.idCard || null,
      skill: validated.skill || null,
      taxCode: validated.taxCode || null,
      bankName: validated.bankName || null,
      bankAccountNumber: validated.bankAccountNumber || null,
      bankAccountHolder: validated.bankAccountHolder || null,
      bankBranch: validated.bankBranch || null,
      dailyWage: validated.dailyWage,
      notes: validated.notes || null,
    },
  });

  await logAudit(user.id, "UPDATE", "Worker", id, {
    newValues: {
      name: validated.name,
      phone: validated.phone || null,
      dailyWage: validated.dailyWage,
    },
  });
  await notifyCurrentUser("INFO", "Da cap nhat thong tin cong nhan");
  revalidatePath("/workers");
  redirect("/workers");
}

export async function deleteWorker(id: string) {
  const user = await requirePermission("workers", "delete");

  await prisma.worker.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await logAudit(user.id, "DELETE", "Worker", id, {});
  await notifyCurrentUser("WARNING", "Da xoa cong nhan");
  revalidatePath("/workers");
}

export async function getAttendanceByDate(date: Date) {
  await requirePermission("attendance", "view");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await prisma.workerAttendance.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      worker: true,
    },
    orderBy: { worker: { name: "asc" } },
  });
  return serialize(result);
}

export async function bulkAttendance(
  date: Date,
  records: {
    workerId: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    checkIn?: Date;
    checkOut?: Date;
    notes?: string;
  }[]
) {
  await requirePermission("attendance", "create");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.$transaction(
    records.map((record) =>
      prisma.workerAttendance.upsert({
        where: {
          workerId_date: {
            workerId: record.workerId,
            date: startOfDay,
          },
        },
        create: {
          workerId: record.workerId,
          date: startOfDay,
          status: record.status,
          checkIn: record.checkIn || null,
          checkOut: record.checkOut || null,
          notes: record.notes || null,
        },
        update: {
          status: record.status,
          checkIn: record.checkIn || null,
          checkOut: record.checkOut || null,
          notes: record.notes || null,
        },
      })
    )
  );

  const dateStr = new Date(date).toLocaleDateString("vi-VN");
  void notifyAdmins("CHAM_CONG", `Chấm công ngày ${dateStr} đã được lưu (${records.length} công nhân)`);

  revalidatePath("/attendance");
}
