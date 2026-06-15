import { notFound } from "next/navigation";
import { getWorker } from "@/actions/workers";
import WorkerDetailPage from "./page-client";

export default async function WorkerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const worker = await getWorker(id);

  if (!worker) notFound();

  return <WorkerDetailPage worker={worker} />;
}