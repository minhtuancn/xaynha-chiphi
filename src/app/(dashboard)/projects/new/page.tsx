import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectForm } from "@/components/forms/project-form";
import { createProject } from "@/actions/projects";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Thêm dự án mới</h1>
      <Card>
        <CardHeader>
          <CardTitle>Thông tin dự án</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm
            onSubmit={createProject}
            submitLabel="Tạo dự án"
          />
        </CardContent>
      </Card>
    </div>
  );
}
