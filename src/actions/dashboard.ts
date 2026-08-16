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

  const [totalStages, completedStages, totalTasks, completedTasks, budget, totalExpenses, stages, recentPhotos, upcomingTasks, recentExpenses, weather] = await Promise.all([
    prisma.constructionStage.count({
      where: { projectId: project.id, deletedAt: null },
    }),
    prisma.constructionStage.count({
      where: { projectId: project.id, status: "COMPLETED", deletedAt: null },
    }),
    prisma.constructionTask.count({
      where: { stage: { projectId: project.id }, deletedAt: null },
    }),
    prisma.constructionTask.count({
      where: { stage: { projectId: project.id }, status: "COMPLETED", deletedAt: null },
    }),
    prisma.budget.findUnique({ where: { projectId: project.id } }),
    prisma.expense.aggregate({
      where: { projectId: project.id, deletedAt: null },
      _sum: { amount: true },
    }),
    prisma.constructionStage.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: { order: "asc" },
      include: { _count: { select: { tasks: true } } },
    }),
    prisma.photo.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: { takenAt: "desc" },
      take: 6,
    }),
    prisma.constructionTask.findMany({
      where: {
        stage: { projectId: project.id },
        status: { in: ["PENDING", "IN_PROGRESS"] },
        deletedAt: null,
      },
      include: { stage: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.expense.findMany({
      where: { projectId: project.id, deletedAt: null },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    getWeatherForDate(project.id, new Date()),
  ]);

  const spentSum = totalExpenses._sum.amount ?? 0;
  const budgetTotal = budget?.totalBudget ?? 0;
  const budgetSpent = budget?.spent ?? 0;

  const spentValue = Number(spentSum) > 0 ? Number(spentSum) : Number(budgetSpent);

  return serialize({
    project,
    stats: {
      totalStages,
      completedStages,
      totalTasks,
      completedTasks,
      budget: Number(budgetTotal),
      spent: spentValue,
      remaining: Number(budgetTotal) - spentValue,
    },
    stages,
    recentPhotos,
    weather,
    upcomingTasks,
    recentExpenses,
  });
}
