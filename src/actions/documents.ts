"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { documentSchema } from "@/schemas/document";
import { serialize } from "@/lib/serialize";

export async function getDocuments() {
  await requirePermission("documents", "view");

  const result = await prisma.document.findMany({
    where: { deletedAt: null },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return serialize(result);
}

export async function getDocument(id: string) {
  await requirePermission("documents", "view");

  return prisma.document.findFirst({
    where: { id, deletedAt: null },
    include: { project: { select: { id: true, name: true } } },
  });
}

export async function createDocument(data: {
  projectId: string;
  name: string;
  type: "CONTRACT" | "DRAWING" | "INVOICE" | "PERMIT" | "OTHER";
  category?: string;
  url: string;
  size: number;
  tags?: string;
}) {
  await requirePermission("documents", "create");

  const validated = documentSchema.parse(data);

  await prisma.document.create({
    data: {
      projectId: validated.projectId,
      name: validated.name,
      type: validated.type,
      category: validated.category || null,
      url: validated.url,
      size: validated.size,
      tags: validated.tags || "[]",
      uploadedAt: new Date(),
    },
  });

  revalidatePath("/documents");
}

export async function deleteDocument(id: string) {
  await requirePermission("documents", "delete");

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) throw new Error("Document not found");

  await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/documents");
}
