import { notFound } from "next/navigation";
import { getStage } from "@/actions/stages";
import StageDetailPage from "./page-client";

export default async function StagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stage = await getStage(id);

  if (!stage) notFound();

  return <StageDetailPage stage={stage} />;
}
