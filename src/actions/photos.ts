"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { deleteFile } from "@/lib/minio";
import { getProjectScope } from "./project-scope";
import { serialize } from "@/lib/serialize";

export async function getPhotos() {
  await requirePermission("photos", "view");

  const projectScope = await getProjectScope();

  const result = await prisma.photo.findMany({
    where: { ...(projectScope ? { projectId: projectScope } : {}), deletedAt: null },
    orderBy: { takenAt: "desc" },
  });
  return serialize(result);
}

export async function createPhoto(data: {
  url: string;
  thumbnail?: string;
  caption?: string;
  tags?: string[];
  takenAt: Date;
}) {
  await requirePermission("photos", "create");

  const projectScope = await getProjectScope();
  if (!projectScope) throw new Error("Không có dự án đang hoạt động");

  await prisma.photo.create({
    data: {
      projectId: projectScope,
      url: data.url,
      thumbnail: data.thumbnail ?? null,
      caption: data.caption ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : "[]",
      takenAt: data.takenAt,
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
