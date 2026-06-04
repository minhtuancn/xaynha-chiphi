import { notFound } from "next/navigation";
import { ProjectDetail } from "@/components/detail-views/project-detail";
import { ProjectForm } from "@/components/forms/project-form";
import { getProject, updateProject } from "@/actions/projects";
import { serialize } from "@/lib/serialize";
import type { ProjectFormData } from "@/schemas/project";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "view" } = await searchParams;
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
      <h1 className="text-2xl font-bold">Dự án: {project.name}</h1>
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="view">Chi tiết</TabsTrigger>
          <TabsTrigger value="edit">Chỉnh sửa</TabsTrigger>
        </TabsList>
        <TabsContent value="view">
          <ProjectDetail project={{
            ...project,
            budget: Number(project.budget),
            _count: project._count,
          }} />
        </TabsContent>
        <TabsContent value="edit">
          <ProjectForm
            defaultValues={defaultValues}
            onSubmit={updateProject.bind(null, id)}
            submitLabel="Cập nhật"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
