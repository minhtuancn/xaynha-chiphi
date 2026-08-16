"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { projectSchema, type ProjectFormData } from "@/schemas/project";
import { notifyAdmins } from "./notifications";
import { Decimal } from "@prisma/client/runtime/library";

export async function getProjects() {
  await requirePermission("projects", "view");

  const projects = await prisma.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return serialize(projects);
}

export async function getProject(id: string) {
  await requirePermission("projects", "view");

  const project = await prisma.project.findUnique({
    where: { id, deletedAt: null },
    include: { _count: { select: { stages: true } } },
  });

  return serialize(project);
}

export async function createProject(data: ProjectFormData) {
  await requirePermission("projects", "create");

  const validated = projectSchema.parse(data);

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
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

    await tx.budget.create({
      data: {
        projectId: created.id,
        totalBudget: new Decimal(validated.budget),
        allocated: new Decimal(0),
        spent: new Decimal(0),
        remaining: new Decimal(validated.budget),
      },
    });

    return created;
  });

  void notifyAdmins("DU_AN", `Dự án "${validated.name}" đã được tạo`);

  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(id: string, data: ProjectFormData) {
  await requirePermission("projects", "edit");

  const validated = projectSchema.parse(data);

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
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

    const budget = await tx.budget.findUnique({ where: { projectId: id } });
    const spent = budget?.spent ?? new Decimal(0);
    const remaining = new Decimal(validated.budget).sub(spent);

    await tx.budget.upsert({
      where: { projectId: id },
      create: {
        projectId: id,
        totalBudget: new Decimal(validated.budget),
        allocated: new Decimal(0),
        spent: new Decimal(0),
        remaining,
      },
      update: {
        totalBudget: new Decimal(validated.budget),
        remaining,
      },
    });
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
    documentCount > 0;

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

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (budget !== null) {
      await tx.budget.delete({ where: { projectId: id } });
    }

    const stages = await tx.constructionStage.findMany({
      where: { projectId: id, deletedAt: null },
      select: { id: true },
    });
    const stageIds = stages.map((s) => s.id);

    if (stageIds.length > 0) {
      await tx.stageBudget.deleteMany({ where: { stageId: { in: stageIds } } });
      await tx.checklist.updateMany({
        where: { stageId: { in: stageIds } },
        data: { deletedAt: now },
      });
    }

    // Estimates have no deletedAt; remove rows so no ACTIVE estimate outlives the project
    await tx.estimate.deleteMany({ where: { projectId: id } });
    // MaterialUsage has no deletedAt; remove the project-scoped rows
    await tx.materialUsage.deleteMany({ where: { projectId: id } });
    // InventoryTransaction/StageBudget have no deletedAt; delete the project-scoped rows
    await tx.inventoryTransaction.deleteMany({ where: { projectId: id } });
    await tx.constructionStage.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.dailyLog.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.expense.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.purchaseOrder.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.photo.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.document.updateMany({
      where: { projectId: id, deletedAt: null },
      data: { deletedAt: now },
    });
    await tx.project.update({
      where: { id },
      data: { deletedAt: now },
    });
  });

  revalidatePath("/projects");
  return { success: true };
}
