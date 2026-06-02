import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/forms/project-form";
import { getProject, updateProject } from "@/actions/projects";
import type { ProjectFormData } from "@/schemas/project";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) notFound();

  const defaultValues: Partial<ProjectFormData> = {
    name: project.name,
    address: project.address,
    budget: project.budget.toNumber(),
    startDate: project.startDate ?? undefined,
    endDate: project.endDate ?? undefined,
    status: project.status,
    progress: project.progress,
    description: project.description ?? undefined,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chỉnh sửa dự án</h1>
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            defaultValues={defaultValues}
            onSubmit={(data) => updateProject(id, data)}
            submitLabel="Cập nhật"
          />
        </CardContent>
      </Card>
    </div>
  );
}
