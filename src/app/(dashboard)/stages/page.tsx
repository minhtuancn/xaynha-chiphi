import { getStages } from "@/actions/stages";
import { getProjects } from "@/actions/projects";
import { serialize } from "@/lib/serialize";
import { StagesPageClient } from "@/components/stages-page-client";

export default async function StagesPage() {
  const [stages, projects] = await Promise.all([
    getStages(),
    getProjects(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giai đoạn thi công</h1>
      </div>

      <StagesPageClient
        projects={serialize(projects)}
        stages={serialize(stages)}
      />
    </div>
  );
}
