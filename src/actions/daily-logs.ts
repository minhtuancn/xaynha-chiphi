"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "./notifications";
import { requirePermission } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { dailyLogSchema, type DailyLogFormData } from "@/schemas/daily-log";
import { getWeatherForDate } from "@/lib/weather";
import { saveUploadedPhoto } from "@/lib/upload";
import { getProjectScope } from "./project-scope";

export async function getDailyLogs() {
  await requirePermission("dailyLogs", "view");

  const projectScope = await getProjectScope();
  const logs = await prisma.dailyLog.findMany({
    where: { ...(projectScope ? { projectId: projectScope } : {}), deletedAt: null },
    orderBy: { date: "desc" },
    include: {
      project: {
        select: { id: true, name: true },
      },
    },
  });

  return serialize(logs);
}

export async function getDailyLog(id: string) {
  await requirePermission("dailyLogs", "view");

  const log = await prisma.dailyLog.findUnique({
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

  return serialize(log);
}

export async function createDailyLog(
  data: DailyLogFormData,
  photos?: File[]
) {
  await requirePermission("dailyLogs", "create");

  const validated = dailyLogSchema.parse(data);

  const project = await prisma.project.findUnique({
    where: { id: validated.projectId, deletedAt: null },
  });

  if (!project) throw new Error("Không tìm thấy dự án");

  const weather = await getWeatherForDate(project.id, validated.date);

  const dailyLog = await prisma.dailyLog.create({
    data: {
      projectId: project.id,
      date: validated.date,
      timeOfDay: validated.timeOfDay,
      temperature: validated.temperature ?? weather?.temperature ?? null,
      weatherCondition: validated.weatherCondition ?? null,
      weatherSource: validated.weatherSource ?? null,
      notes: validated.notes,
      issues: validated.issues,
      workerCount: validated.workerCount,
      weather: weather ? JSON.stringify(weather) : null,
    },
  });

  const photoRecords: { dailyLogId: string; url: string }[] = [];
  const photoErrors: string[] = [];

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const url = await saveUploadedPhoto(photo, "daily-logs");
        photoRecords.push({ dailyLogId: dailyLog.id, url });
      } catch (err: unknown) {
        console.warn("Failed to save photo:", photo.name, err);
        photoErrors.push(photo.name);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const record of photoRecords) {
      await tx.dailyLogPhoto.create({ data: record });
    }
  });

  if (photoErrors.length > 0) {
    console.warn(`Failed to save ${photoErrors.length} photo(s):`, photoErrors);
  }

  const dateStr = new Date(validated.date).toLocaleDateString("vi-VN");
  void notifyAdmins("NHAT_KY", `Nhật ký ngày ${dateStr} cho dự án "${project.name}" đã được tạo`);

  revalidatePath("/daily-logs");
  redirect("/daily-logs");
}

export async function updateDailyLog(
  id: string,
  data: DailyLogFormData,
  photos?: File[]
) {
  await requirePermission("dailyLogs", "edit");

  const validated = dailyLogSchema.parse(data);

  const log = await prisma.dailyLog.findFirst({ where: { id, deletedAt: null } });
  if (!log) throw new Error("Daily log not found");

  const weather = await getWeatherForDate(log.projectId, validated.date);

  await prisma.dailyLog.update({
    where: { id },
    data: {
      date: validated.date,
      timeOfDay: validated.timeOfDay,
      temperature: validated.temperature ?? weather?.temperature ?? null,
      weatherCondition: validated.weatherCondition ?? null,
      weatherSource: validated.weatherSource ?? null,
      notes: validated.notes,
      issues: validated.issues,
      workerCount: validated.workerCount,
      weather: weather ? JSON.stringify(weather) : null,
    },
  });

  const photoRecords: { dailyLogId: string; url: string }[] = [];
  const photoErrors: string[] = [];

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const url = await saveUploadedPhoto(photo, "daily-logs");
        photoRecords.push({ dailyLogId: id, url });
      } catch (err: unknown) {
        console.warn("Failed to save photo:", photo.name, err);
        photoErrors.push(photo.name);
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    for (const record of photoRecords) {
      await tx.dailyLogPhoto.create({ data: record });
    }
  });

  if (photoErrors.length > 0) {
    console.warn(`Failed to save ${photoErrors.length} photo(s):`, photoErrors);
  }

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
