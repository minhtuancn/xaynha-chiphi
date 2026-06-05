"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getWeatherForDate } from "@/lib/weather";
import { serialize } from "@/lib/serialize";
import { getProjectScope } from "@/actions/project-scope";

export async function getDashboardData() {
  const user = await requireUser();

  const projectScope = await getProjectScope();

  const project = projectScope
    ? await prisma.project.findUnique({ where: { id: projectScope, deletedAt: null } })
    : await prisma.project.findFirst({
        where: { status: "ACTIVE", deletedAt: null },
        orderBy: { updatedAt: "desc" },
      });

  if (!project) {
    return { project: null, stats: null, stages: [], recentPhotos: [], weather: null, upcomingTasks: [], recentExpenses: [] };
  }

  const totalStages = await prisma.constructionStage.count({
    where: { projectId: project.id, deletedAt: null },
  });
  const completedStages = await prisma.constructionStage.count({
    where: { projectId: project.id, status: "COMPLETED", deletedAt: null },
  });

  const totalTasks = await prisma.constructionTask.count({
    where: { stage: { projectId: project.id }, deletedAt: null },
  });
  const completedTasks = await prisma.constructionTask.count({
    where: { stage: { projectId: project.id }, status: "COMPLETED", deletedAt: null },
  });

  const budget = await prisma.budget.findUnique({ where: { projectId: project.id } });

  const totalExpenses = await prisma.expense.aggregate({
    where: { projectId: project.id, deletedAt: null },
    _sum: { amount: true },
  });

  const stages = await prisma.constructionStage.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { order: "asc" },
    include: { _count: { select: { tasks: true } } },
  });

  const recentPhotos = await prisma.photo.findMany({
    where: { projectId: project.id, deletedAt: null },
    orderBy: { takenAt: "desc" },
    take: 6,
  });

  const today = new Date();
  const weather = await getWeatherForDate(project.id, today);

  const upcomingTasks = await prisma.constructionTask.findMany({
    where: {
      stage: { projectId: project.id },
      status: { in: ["PENDING", "IN_PROGRESS"] },
      deletedAt: null,
    },
    include: { stage: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 5,
  });

  const recentExpenses = await prisma.expense.findMany({
    where: { projectId: project.id, deletedAt: null },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  return serialize({
    project,
    stats: {
      totalStages,
      completedStages,
      totalTasks,
      completedTasks,
      budget: budget?.totalBudget ?? 0,
      spent: budget?.spent ?? totalExpenses._sum.amount ?? 0,
      remaining: budget?.remaining ?? 0,
    },
    stages,
    recentPhotos,
    weather,
    upcomingTasks,
    recentExpenses,
  });
}
