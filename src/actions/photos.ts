"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { deleteFile } from "@/lib/minio";

export async function getPhotos() {
  await requirePermission("photos", "view");

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) return [];

  return prisma.photo.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { takenAt: "desc" },
  });
}

export async function createPhoto(data: {
  url: string;
  thumbnail?: string;
  caption?: string;
  tags?: string[];
  takenAt: Date;
  dailyLogId?: string;
}) {
  await requirePermission("photos", "create");

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) throw new Error("No active project found");

  await prisma.photo.create({
    data: {
      projectId: project.id,
      url: data.url,
      thumbnail: data.thumbnail ?? null,
      caption: data.caption ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : "[]",
      takenAt: data.takenAt,
      dailyLogId: data.dailyLogId ?? null,
    },
  });

  revalidatePath("/photos");
}

export async function deletePhoto(id: string) {
  await requirePermission("photos", "delete");

  const photo = await prisma.photo.findUnique({ where: { id } });
  if (!photo) throw new Error("Photo not found");

  await prisma.photo.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  try {
    const bucket = process.env.MINIO_BUCKET || "photos";
    const objectName = photo.url.split("/").pop();
    if (objectName) {
      await deleteFile(bucket, objectName);
    }
  } catch {
    // MinIO may be unavailable; soft delete still succeeds
  }

  revalidatePath("/photos");
}
