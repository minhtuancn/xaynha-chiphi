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
    include: { _count: { select: { stages: true } } },
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

  const [
    stageCount,
    dailyLogCount,
    materialUsageCount,
    expenseCount,
    purchaseOrderCount,
    photoCount,
    documentCount,
    budget,
  ] = await Promise.all([
    prisma.constructionStage.count({ where: { projectId: id, deletedAt: null } }),
    prisma.dailyLog.count({ where: { projectId: id, deletedAt: null } }),
    prisma.materialUsage.count({ where: { projectId: id } }),
    prisma.expense.count({ where: { projectId: id, deletedAt: null } }),
    prisma.purchaseOrder.count({ where: { projectId: id, deletedAt: null } }),
    prisma.photo.count({ where: { projectId: id, deletedAt: null } }),
    prisma.document.count({ where: { projectId: id, deletedAt: null } }),
    prisma.budget.findUnique({ where: { projectId: id } }),
  ]);

  const hasDependencies =
    stageCount > 0 ||
    dailyLogCount > 0 ||
    materialUsageCount > 0 ||
    expenseCount > 0 ||
    purchaseOrderCount > 0 ||
    photoCount > 0 ||
    documentCount > 0 ||
    budget !== null;

  if (hasDependencies) {
    const parts: string[] = [];
    if (stageCount > 0) parts.push(`${stageCount} giai đoạn`);
    if (dailyLogCount > 0) parts.push(`${dailyLogCount} nhật ký`);
    if (materialUsageCount > 0) parts.push(`${materialUsageCount} lượt sử dụng vật tư`);
    if (expenseCount > 0) parts.push(`${expenseCount} khoản chi phí`);
    if (purchaseOrderCount > 0) parts.push(`${purchaseOrderCount} đơn đặt hàng`);
    if (photoCount > 0) parts.push(`${photoCount} ảnh`);
    if (documentCount > 0) parts.push(`${documentCount} tài liệu`);

    if (parts.length > 0) {
      return {
        success: false,
        error: `Dự án có ${parts.join(", ")}. Vui lòng xóa các liên kết trước.`,
      };
    }
  }

  if (budget !== null) {
    await prisma.budget.delete({ where: { projectId: id } });
  }

  await prisma.project.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidatePath("/projects");
  return { success: true };
}
