"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { materialUsageSchema } from "@/schemas/material-usage";
import { saveUploadedPhoto } from "@/lib/upload";
import { getProjectScope } from "./project-scope";

export async function getMaterialUsages() {
  await requirePermission("materialUsage", "view");

  const projectScope = await getProjectScope();

  return prisma.materialUsage.findMany({
    where: { ...(projectScope ? { projectId: projectScope } : {}) },
    include: {
      material: { select: { id: true, name: true, unit: true } },
      dailyLog: { select: { id: true, date: true } },
      task: { select: { id: true, name: true } },
      photos: { select: { id: true, url: true, caption: true } },
    },
    orderBy: { date: "desc" },
  });
}

export async function createMaterialUsage(
  data: {
    materialId: string;
    dailyLogId?: string;
    taskId?: string;
    projectId: string;
    quantity: number;
    date: Date;
    notes?: string;
  },
  photos?: File[]
) {
  await requirePermission("materialUsage", "create");

  const validated = materialUsageSchema.parse(data);

  const usage = await prisma.materialUsage.create({
    data: {
      materialId: validated.materialId,
      dailyLogId: validated.dailyLogId || null,
      taskId: validated.taskId || null,
      projectId: validated.projectId,
      quantity: validated.quantity,
      date: validated.date,
      notes: validated.notes || null,
    },
  });

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      try {
        const url = await saveUploadedPhoto(photo, "material-usage");
        await prisma.materialUsagePhoto.create({
          data: {
            materialUsageId: usage.id,
            url,
          },
        });
      } catch (e) {
        console.error("Failed to save photo:", e);
      }
    }
  }

  revalidatePath("/material-usage");
}

export async function deleteMaterialUsage(id: string) {
  await requirePermission("materialUsage", "delete");

  await prisma.materialUsage.delete({
    where: { id },
  });

  revalidatePath("/material-usage");
}
