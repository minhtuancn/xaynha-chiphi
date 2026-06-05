import { notFound } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { serialize } from "@/lib/serialize";
import { ProjectDetailDashboard } from "./project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return notFound();

  const project = await prisma.project.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: { select: { stages: true, dailyLogs: true, expenses: true, photos: true } },
      projectBudget: true,
      stages: { where: { deletedAt: null }, orderBy: { order: "asc" } },
    },
  });
  if (!project) notFound();

  const dailyLogs = await prisma.dailyLog.findMany({
    where: { projectId: id, deletedAt: null },
    orderBy: { date: "desc" },
    take: 10,
    include: { project: { select: { name: true } } },
  });

  const expenses = await prisma.expense.findMany({
    where: { projectId: id, deletedAt: null },
    orderBy: { date: "desc" },
    take: 10,
    include: { category: { select: { name: true } } },
  });

  const photos = await prisma.photo.findMany({
    where: { projectId: id, deletedAt: null },
    orderBy: { takenAt: "desc" },
    take: 12,
  });

  const stageBudget = await prisma.stageBudget.findMany({
    where: { stage: { projectId: id, deletedAt: null } },
  });

  return (
    <ProjectDetailDashboard
      project={serialize(project)}
      dailyLogs={serialize(dailyLogs)}
      expenses={serialize(expenses)}
      photos={serialize(photos)}
      stageBudget={serialize(stageBudget)}
    />
  );
}
