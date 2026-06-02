"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { projectSchema, type ProjectFormData } from "@/schemas/project";
import { Decimal } from "@prisma/client/runtime/library";

export async function getProjects() {
  await requirePermission("projects", "view");

  return prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProject(id: string) {
  await requirePermission("projects", "view");

  return prisma.project.findUnique({
    where: { id, deletedAt: null },
  });
}

export async function createProject(data: ProjectFormData) {
  await requirePermission("projects", "create");

  const validated = projectSchema.parse(data);

  const project = await prisma.project.create({
    data: {
      name: validated.name,
      address: validated.address,
      budget: new Decimal(validated.budget),
      startDate: validated.startDate,
      endDate: validated.endDate,
      status: validated.status,
      progress: validated.progress,
      description: validated.description,
    },
  });

  await prisma.budget.create({
    data: {
      projectId: project.id,
      totalBudget: new Decimal(validated.budget),
      allocated: new Decimal(0),
      spent: new Decimal(0),
      remaining: new Decimal(validated.budget),
    },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(id: string, data: ProjectFormData) {
  await requirePermission("projects", "edit");

  const validated = projectSchema.parse(data);

  await prisma.project.update({
    where: { id },
    data: {
      name: validated.name,
      address: validated.address,
      budget: new Decimal(validated.budget),
      startDate: validated.startDate,
      endDate: validated.endDate,
      status: validated.status,
      progress: validated.progress,
      description: validated.description,
    },
  });

  await prisma.budget.update({
    where: { projectId: id },
    data: {
      totalBudget: new Decimal(validated.budget),
      remaining: new Decimal(validated.budget),
    },
  });

  revalidatePath("/projects");
  redirect("/projects");
}

export async function deleteProject(id: string) {
  await requirePermission("projects", "delete");

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/projects");
}
