"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";

export async function getProgressReport() {
  await requirePermission("reports", "view");

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) return { stages: [], taskCompletionRate: 0, totalTasks: 0, completedTasks: 0 };

  const stages = await prisma.constructionStage.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        where: { deletedAt: null },
      },
    },
  });

  const stageData = stages.map((stage) => {
    const totalTasks = stage.tasks.length;
    const completedTasks = stage.tasks.filter((t) => t.status === "COMPLETED").length;
    return {
      id: stage.id,
      name: stage.name,
      progress: stage.progress,
      status: stage.status,
      totalTasks,
      completedTasks,
      estimatedBudget: Number(stage.estimatedBudget),
      actualCost: Number(stage.actualCost),
    };
  });

  const allTasks = await prisma.constructionTask.count({
    where: { stage: { projectId: project.id }, deletedAt: null },
  });
  const completedTasks = await prisma.constructionTask.count({
    where: { stage: { projectId: project.id }, status: "COMPLETED", deletedAt: null },
  });

  return {
    stages: stageData,
    taskCompletionRate: allTasks > 0 ? (completedTasks / allTasks) * 100 : 0,
    totalTasks: allTasks,
    completedTasks,
  };
}

export async function getFinancialReport() {
  await requirePermission("reports", "view");

  const project = await prisma.project.findFirst({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  if (!project) return { categories: [], monthlySpending: [], budgetVsActual: { budget: 0, spent: 0, remaining: 0 } };

  const expensesByCategory = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: { projectId: project.id, deletedAt: null },
    _sum: { amount: true },
    _count: true,
  });

  const categoryIds = expensesByCategory.map((e) => e.categoryId);
  const categories = await prisma.expenseCategory.findMany({
    where: { id: { in: categoryIds }, deletedAt: null },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoriesData = expensesByCategory.map((e) => ({
    name: categoryMap.get(e.categoryId) || "Khác",
    total: Number(e._sum.amount ?? 0),
    count: e._count,
  }));

  const monthlySpendingRaw = await prisma.expense.groupBy({
    by: ["date"],
    where: { projectId: project.id, deletedAt: null },
    _sum: { amount: true },
  });

  const monthlyMap = new Map<string, number>();
  for (const e of monthlySpendingRaw) {
    const month = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(e._sum.amount ?? 0));
  }

  const monthlySpending = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  const budget = await prisma.budget.findUnique({ where: { projectId: project.id } });
  const totalSpent = await prisma.expense.aggregate({
    where: { projectId: project.id, deletedAt: null },
    _sum: { amount: true },
  });

  const spent = Number(totalSpent._sum.amount ?? 0);
  const budgetTotal = Number(budget?.totalBudget ?? 0);

  return {
    categories: categoriesData,
    monthlySpending,
    budgetVsActual: {
      budget: budgetTotal,
      spent,
      remaining: budgetTotal - spent,
    },
  };
}

export async function getMaterialUsageReport() {
  await requirePermission("reports", "view");

  const materials = await prisma.material.findMany({
    where: { deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const materialsByCategory = await prisma.material.groupBy({
    by: ["categoryId"],
    where: { deletedAt: null },
    _sum: { currentStock: true },
    _count: true,
  });

  const categoryIds = materialsByCategory.map((m) => m.categoryId);
  const categories = await prisma.materialCategory.findMany({
    where: { id: { in: categoryIds }, deletedAt: null },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const categoryData = materialsByCategory.map((m) => ({
    name: categoryMap.get(m.categoryId) || "Khác",
    totalStock: Number(m._sum.currentStock ?? 0),
    count: m._count,
  }));

  const lowStock = materials
    .filter((m) => m.currentStock.lessThan(m.minStock))
    .map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      currentStock: Number(m.currentStock),
      minStock: Number(m.minStock),
      category: m.category.name,
    }));

  return {
    materials: materials.map((m) => ({
      id: m.id,
      name: m.name,
      unit: m.unit,
      currentStock: Number(m.currentStock),
      minStock: Number(m.minStock),
      unitCost: Number(m.unitCost),
      category: m.category.name,
      isLowStock: m.currentStock.lessThan(m.minStock),
    })),
    categories: categoryData,
    lowStock,
  };
}

export async function getSupplierReport() {
  await requirePermission("reports", "view");

  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null },
    include: {
      purchaseOrders: {
        where: { deletedAt: null },
      },
      debts: {
        where: { deletedAt: null },
      },
    },
    orderBy: { name: "asc" },
  });

  return suppliers.map((s) => {
    const totalOrders = s.purchaseOrders.length;
    const totalOrderValue = s.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
    const totalDebt = s.debts.reduce((sum, d) => sum + Number(d.amount) - Number(d.paidAmount), 0);

    return {
      id: s.id,
      name: s.name,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      totalOrders,
      totalOrderValue,
      debtBalance: Number(s.debtBalance),
      outstandingDebt: totalDebt,
    };
  });
}

export async function getWorkerReport() {
  await requirePermission("reports", "view");

  const workers = await prisma.worker.findMany({
    where: { deletedAt: null },
    include: {
      attendances: {},
    },
    orderBy: { name: "asc" },
  });

  return workers.map((w) => {
    const totalAttendance = w.attendances.length;
    const presentCount = w.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;
    const totalWages = presentCount * Number(w.dailyWage);

    return {
      id: w.id,
      name: w.name,
      phone: w.phone,
      skill: w.skill,
      dailyWage: Number(w.dailyWage),
      status: w.status,
      totalAttendance,
      presentCount,
      attendanceRate,
      totalWages,
    };
  });
}
