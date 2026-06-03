"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, STAGE_STATUS_LABELS } from "@/lib/utils";
import { WeatherWidget } from "@/components/weather-widget";
import { createStage } from "@/actions/stages";

interface Project {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

interface Stage {
  id: string;
  name: string;
  status: string;
  progress: number;
  estimatedBudget: number;
  startDate: string | Date | null;
  endDate: string | Date | null;
  order: number;
  projectId: string;
  _count: { tasks: number };
}

interface StagesPageClientProps {
  projects: Project[];
  stages: Stage[];
}

export function StagesPageClient({ projects, stages }: StagesPageClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isSubmitting = useRef(false);
  const router = useRouter();

  const [formName, setFormName] = useState("");
  const [formStatus, setFormStatus] = useState("NOT_STARTED");
  const [formBudget, setFormBudget] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filteredStages = stages.filter((s) => s.projectId === selectedProjectId);

  function resetForm() {
    setFormName("");
    setFormStatus("NOT_STARTED");
    setFormBudget("");
    setFormNotes("");
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !selectedProjectId || isSubmitting.current) return;

    isSubmitting.current = true;
    const order = filteredStages.length;
    try {
      startTransition(async () => {
        await createStage(
          {
            name: formName.trim(),
            status: formStatus as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD",
            estimatedBudget: parseFloat(formBudget) || 0,
            progress: 0,
            notes: formNotes.trim() || undefined,
          },
          selectedProjectId,
          order,
        );
        resetForm();
        router.refresh();
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo giai đoạn");
    } finally {
      isSubmitting.current = false;
    }
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Chưa có dự án nào. Tạo dự án trước khi thêm giai đoạn.
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={selectedProjectId} onValueChange={setSelectedProjectId}>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <TabsList className="flex-wrap h-auto">
          {projects.map((project) => (
            <TabsTrigger key={project.id} value={project.id}>
              {project.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
          size="sm"
        >
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Đóng" : "Thêm giai đoạn"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Tạo giai đoạn mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên giai đoạn *</Label>
                  <Input
                    id="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nhập tên giai đoạn"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Chưa bắt đầu</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang thực hiện</SelectItem>
                      <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                      <SelectItem value="ON_HOLD">Tạm dừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Ngân sách ước tính</Label>
                  <Input
                    id="budget"
                    type="number"
                    min="0"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    rows={1}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isPending || !formName.trim()}>
                  {isPending ? "Đang tạo..." : "Tạo giai đoạn"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {projects.map((project) => {
        const projectStages = stages.filter((s) => s.projectId === project.id);
        return (
          <TabsContent key={project.id} value={project.id}>
            <div className="space-y-6">
              <Card>
                <CardContent className="py-4 flex flex-wrap gap-6 items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{project.address}</p>
                  </div>
                  {project.latitude != null && project.longitude != null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tọa độ</p>
                      <p className="font-medium">
                        {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {project.latitude != null && project.longitude != null && (
                <WeatherWidget latitude={project.latitude} longitude={project.longitude} />
              )}

              {projectStages.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Chưa có giai đoạn nào cho dự án này.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projectStages.map((stage) => (
                    <Card key={stage.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">
                            <Link
                              href={`/stages/${stage.id}`}
                              className="hover:underline"
                            >
                              {stage.name}
                            </Link>
                          </CardTitle>
                          <StatusBadge
                            status={stage.status}
                            labels={STAGE_STATUS_LABELS}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tiến độ</span>
                            <span className="font-medium">{stage.progress}%</span>
                          </div>
                          <Progress value={stage.progress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Số task</p>
                            <p className="font-medium">{stage._count.tasks}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ngân sách ước tính</p>
                            <p className="font-medium">
                              {formatCurrency(stage.estimatedBudget)}
                            </p>
                          </div>
                        </div>

                        {(stage.startDate || stage.endDate) && (
                          <div className="flex justify-between text-sm text-muted-foreground">
                            {stage.startDate && (
                              <span>
                                {typeof stage.startDate === "string"
                                  ? new Date(stage.startDate).toLocaleDateString("vi-VN")
                                  : stage.startDate.toLocaleDateString("vi-VN")}
                              </span>
                            )}
                            {stage.endDate && (
                              <span>
                                {typeof stage.endDate === "string"
                                  ? new Date(stage.endDate).toLocaleDateString("vi-VN")
                                  : stage.endDate.toLocaleDateString("vi-VN")}
                              </span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
