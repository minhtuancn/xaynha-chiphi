"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { dailyLogSchema, type DailyLogFormData } from "@/schemas/daily-log";
import { getWeatherForDate } from "@/lib/weather";

export async function getDailyLogs() {
  await requirePermission("dailyLogs", "view");

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) return [];

  return prisma.dailyLog.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { date: "desc" },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function getDailyLog(id: string) {
  await requirePermission("dailyLogs", "view");

  return prisma.dailyLog.findUnique({
    where: { id, deletedAt: null },
    include: {
      dailyLogPhotos: {
        where: { deletedAt: null },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function createDailyLog(data: DailyLogFormData) {
  await requirePermission("dailyLogs", "create");

  const validated = dailyLogSchema.parse(data);

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) throw new Error("No active project found");

  const weather = await getWeatherForDate(project.id, validated.date);

  await prisma.dailyLog.create({
    data: {
      projectId: project.id,
      date: validated.date,
      temperature: validated.temperature,
      notes: validated.notes,
      issues: validated.issues,
      workerCount: validated.workerCount,
      weather: weather ? JSON.stringify(weather) : null,
    },
  });

  revalidatePath("/daily-logs");
  redirect("/daily-logs");
}

export async function updateDailyLog(id: string, data: DailyLogFormData) {
  await requirePermission("dailyLogs", "edit");

  const validated = dailyLogSchema.parse(data);

  const log = await prisma.dailyLog.findUnique({ where: { id } });
  if (!log) throw new Error("Daily log not found");

  const weather = await getWeatherForDate(log.projectId, validated.date);

  await prisma.dailyLog.update({
    where: { id },
    data: {
      date: validated.date,
      temperature: validated.temperature,
      notes: validated.notes,
      issues: validated.issues,
      workerCount: validated.workerCount,
      weather: weather ? JSON.stringify(weather) : null,
    },
  });

  revalidatePath("/daily-logs");
  revalidatePath(`/daily-logs/${id}`);
}

export async function deleteDailyLog(id: string) {
  await requirePermission("dailyLogs", "delete");

  await prisma.dailyLog.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/daily-logs");
}
