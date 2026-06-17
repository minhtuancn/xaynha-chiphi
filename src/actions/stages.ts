"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { stageSchema, taskSchema, type StageFormData, type TaskFormData } from "@/schemas/stage";
import { serialize } from "@/lib/serialize";
import { Decimal } from "@prisma/client/runtime/library";

export async function getStages(projectId?: string) {
  await requirePermission("stages", "view");

  const result = await prisma.constructionStage.findMany({
    where: {
      deletedAt: null,
      ...(projectId ? { projectId } : {}),
    },
    include: {
      _count: {
        select: { tasks: { where: { deletedAt: null } } },
      },
      project: {
        select: { name: true },
      },
    },
    orderBy: { order: "asc" },
  });
  return serialize(result);
}

export async function getStage(id: string) {
  await requirePermission("stages", "view");

  const result = await prisma.constructionStage.findUnique({
    where: { id, deletedAt: null },
    include: {
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });
  return serialize(result);
}

export async function createStage(data: StageFormData, projectId: string, order: number) {
  await requirePermission("stages", "create");

  const validated = stageSchema.parse(data);

  const stage = await prisma.constructionStage.create({
    data: {
      projectId,
      order,
      name: validated.name,
      status: validated.status,
      startDate: validated.startDate,
      endDate: validated.endDate,
      progress: validated.progress,
      estimatedBudget: new Decimal(validated.estimatedBudget),
      actualCost: new Decimal(0),
      notes: validated.notes,
    },
  });

  revalidatePath("/stages");
  redirect(`/stages/${stage.id}`);
}

export async function updateStage(id: string, data: StageFormData) {
  await requirePermission("stages", "edit");

  const validated = stageSchema.parse(data);

  await prisma.constructionStage.update({
    where: { id },
    data: {
      name: validated.name,
      status: validated.status,
      startDate: validated.startDate,
      endDate: validated.endDate,
      progress: validated.progress,
      estimatedBudget: new Decimal(validated.estimatedBudget),
      notes: validated.notes,
    },
  });

  revalidatePath("/stages");
  revalidatePath(`/stages/${id}`);
}

export async function deleteStage(id: string) {
  await requirePermission("stages", "delete");

  await prisma.constructionStage.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/stages");
}

export async function createTask(stageId: string, data: TaskFormData) {
  await requirePermission("stages", "create");

  const validated = taskSchema.parse(data);

  await prisma.constructionTask.create({
    data: {
      stageId,
      name: validated.name,
      description: validated.description,
      status: validated.status,
      assignee: validated.assignee,
      startDate: validated.startDate,
      endDate: validated.endDate,
      progress: validated.progress,
      notes: validated.notes,
    },
  });

  revalidatePath(`/stages/${stageId}`);
}

export async function updateTask(id: string, data: TaskFormData) {
  await requirePermission("stages", "edit");

  const validated = taskSchema.parse(data);

  const task = await prisma.constructionTask.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      status: validated.status,
      assignee: validated.assignee,
      startDate: validated.startDate,
      endDate: validated.endDate,
      progress: validated.progress,
      notes: validated.notes,
    },
  });

  revalidatePath(`/stages/${task.stageId}`);
}

export async function deleteTask(id: string) {
  await requirePermission("stages", "delete");

  const task = await prisma.constructionTask.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/stages/${task.stageId}`);
}
