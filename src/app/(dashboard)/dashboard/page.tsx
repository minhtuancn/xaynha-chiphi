import { Suspense } from 'react';
import DashboardClient from './DashboardClient';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { getDashboardData } from '@/actions/dashboard';
import { serialize } from '@/lib/serialize';

export default async function DashboardPage() {
  const rawData = await getDashboardData();
  const data = rawData ? serialize(rawData) : null;

  const project = data?.project ?? null;
  const stats = data?.stats ?? null;
  const stages = data?.stages ?? null;
  const weather = data?.weather ?? null;
  const recentPhotos = data?.recentPhotos ?? [];

  return (
    <Suspense fallback={<CardSkeleton />}>
      <DashboardClient
        project={project}
        stats={stats}
        stages={stages}
        weather={weather}
        recentPhotos={recentPhotos}
      />
    </Suspense>
  );
}