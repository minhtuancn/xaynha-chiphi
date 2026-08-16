import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/detail-views/project-detail";
import { ProjectForm } from "@/components/forms/project-form";
import { getProject, updateProject } from "@/actions/projects";
import { serialize } from "@/lib/serialize";
import type { ProjectFormData } from "@/schemas/project";
import { DetailViewTabs } from "@/components/detail-view-tabs";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const defaultValues: Partial<ProjectFormData> = serialize({
    name: project.name,
    address: project.address,
    budget: project.budget,
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    status: project.status,
    progress: project.progress,
    description: project.description ?? undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dự án: {project.name}</h1>
      <DetailViewTabs
        viewTab={<ProjectDetail project={serialize(project)} />}
        editTab={
          <ProjectForm
            defaultValues={defaultValues}
            onSubmit={updateProject.bind(null, id)}
            submitLabel="Cập nhật"
          />
        }
      />
    </div>
  );
}
