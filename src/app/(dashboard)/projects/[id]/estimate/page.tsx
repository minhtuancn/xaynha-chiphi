import { notFound } from 'next/navigation';
import { auth } from '@/app/api/auth/[...nextauth]/auth';
import { prisma } from '@/lib/prisma';
import { EstimateClientPage } from '@/components/estimate/EstimateClientPage';

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return notFound();

  const project = await prisma.project.findUnique({
    where: { id, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!project) notFound();

  return <EstimateClientPage projectId={id} />;
}