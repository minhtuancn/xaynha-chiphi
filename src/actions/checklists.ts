"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { checklistSchema } from "@/schemas/checklist";

export async function getChecklists() {
  await requirePermission("checklists", "view");

  return prisma.checklist.findMany({
    where: { deletedAt: null },
    include: {
      stage: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      items: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
      _count: { select: { items: true } },
    },
    orderBy: [{ stage: { name: "asc" } }, { order: "asc" }],
  });
}

export async function getChecklist(id: string) {
  await requirePermission("checklists", "view");

  return prisma.checklist.findFirst({
    where: { id, deletedAt: null },
    include: {
      stage: { select: { id: true, name: true, project: { select: { id: true, name: true } } } },
      items: {
        where: { deletedAt: null },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function createChecklist(data: { stageId: string; name: string }) {
  await requirePermission("checklists", "create");

  const validated = checklistSchema.parse(data);

  const maxOrder = await prisma.checklist.aggregate({
    where: { stageId: validated.stageId, deletedAt: null },
    _max: { order: true },
  });

  await prisma.checklist.create({
    data: {
      stageId: validated.stageId,
      name: validated.name,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/checklists");
}

export async function updateChecklist(id: string, data: { name: string }) {
  await requirePermission("checklists", "edit");

  await prisma.checklist.update({
    where: { id },
    data: { name: data.name },
  });

  revalidatePath("/checklists");
}

export async function deleteChecklist(id: string) {
  await requirePermission("checklists", "delete");

  await prisma.checklist.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/checklists");
}

export async function addChecklistItem(checklistId: string, name: string) {
  await requirePermission("checklists", "edit");

  const maxOrder = await prisma.checklistItem.aggregate({
    where: { checklistId, deletedAt: null },
    _max: { order: true },
  });

  await prisma.checklistItem.create({
    data: {
      checklistId,
      name,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/checklists");
}

export async function toggleChecklistItem(id: string, completed: boolean) {
  await requirePermission("checklists", "edit");

  await prisma.checklistItem.update({
    where: { id },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath("/checklists");
}

export async function deleteChecklistItem(id: string) {
  await requirePermission("checklists", "edit");

  await prisma.checklistItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/checklists");
}
