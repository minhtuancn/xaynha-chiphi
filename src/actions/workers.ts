"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { workerSchema, type WorkerFormData } from "@/schemas/worker";

export async function getWorkers() {
  await requirePermission("workers", "view");

  return prisma.worker.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { attendances: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorker(id: string) {
  await requirePermission("workers", "view");

  return prisma.worker.findUnique({
    where: { id, deletedAt: null },
    include: {
      attendances: {
        orderBy: { date: "desc" },
      },
      debts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createWorker(data: WorkerFormData) {
  await requirePermission("workers", "create");

  const validated = workerSchema.parse(data);

  await prisma.worker.create({
    data: {
      name: validated.name,
      phone: validated.phone || null,
      idCard: validated.idCard || null,
      skill: validated.skill || null,
      dailyWage: validated.dailyWage,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/workers");
  redirect("/workers");
}

export async function updateWorker(id: string, data: WorkerFormData) {
  await requirePermission("workers", "edit");

  const validated = workerSchema.parse(data);

  await prisma.worker.update({
    where: { id },
    data: {
      name: validated.name,
      phone: validated.phone || null,
      idCard: validated.idCard || null,
      skill: validated.skill || null,
      dailyWage: validated.dailyWage,
      notes: validated.notes || null,
    },
  });

  revalidatePath("/workers");
  redirect("/workers");
}

export async function deleteWorker(id: string) {
  await requirePermission("workers", "delete");

  await prisma.worker.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/workers");
}

export async function getAttendanceByDate(date: Date) {
  await requirePermission("attendance", "view");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.workerAttendance.findMany({
    where: {
      date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      worker: {
        where: { deletedAt: null },
      },
    },
    orderBy: { worker: { name: "asc" } },
  });
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

  revalidatePath("/attendance");
}
