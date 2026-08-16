"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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

const photoSchema = z.object({
  url: z.string().min(1).max(1000),
  thumbnail: z.string().max(1000).nullable().optional(),
  caption: z.string().max(500).nullable().optional(),
  tags: z.array(z.string().max(50)).max(50).optional(),
  takenAt: z.coerce.date(),
});

export async function createPhoto(data: {
  url: string;
  thumbnail?: string;
  caption?: string;
  tags?: string[];
  takenAt: Date;
}) {
  await requirePermission("photos", "create");

  const validated = photoSchema.parse(data);

  const projectScope = await getProjectScope();
  if (!projectScope) throw new Error("Không có dự án đang hoạt động");

  await prisma.photo.create({
    data: {
      projectId: projectScope,
      url: validated.url,
      thumbnail: validated.thumbnail ?? null,
      caption: validated.caption ?? null,
      tags: validated.tags ? JSON.stringify(validated.tags) : "[]",
      takenAt: validated.takenAt,
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
