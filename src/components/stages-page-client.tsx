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
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

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
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();
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
    if (isSubmitting.current) return;
    if (!formName.trim()) {
      toast({ title: "Vui lòng nhập tên giai đoạn", variant: "destructive" });
      return;
    }
    if (!selectedProjectId) {
      toast({ title: "Vui lòng chọn dự án", variant: "destructive" });
      return;
    }

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
      toast({ title: error instanceof Error ? error.message : "Có lỗi xảy ra khi tạo giai đoạn", variant: "destructive" });
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
                <Card className="shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Chưa có giai đoạn nào cho dự án này.
                  </CardContent>
                </Card>
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="p-0">
                    <div className="rounded-md border overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left text-sm font-medium">Tên giai đoạn</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Tiến độ</th>
                            <th className="px-4 py-3 text-right text-sm font-medium hidden md:table-cell">Số task</th>
                            <th className="px-4 py-3 text-right text-sm font-medium hidden md:table-cell">Ngân sách</th>
                            <th className="px-4 py-3 text-center text-sm font-medium hidden md:table-cell">Thời gian</th>
                            <th className="px-4 py-3 text-right text-sm font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {projectStages.map((stage) => {
                            const fmtDate = (d: string | Date | null) =>
                              d
                                ? typeof d === "string"
                                  ? new Date(d).toLocaleDateString("vi-VN")
                                  : d.toLocaleDateString("vi-VN")
                                : null;
                            const start = fmtDate(stage.startDate);
                            const end = fmtDate(stage.endDate);
                            const dateLabel = start && end
                              ? `${start} - ${end}`
                              : start || end || "-";
                            return (
                              <tr
                                key={stage.id}
                                className="border-b last:border-0 hover:bg-muted/40 transition-colors group"
                              >
                                <td className="px-4 py-3">
                                  <Link
                                    href={`/stages/${stage.id}`}
                                    className="font-medium hover:underline"
                                  >
                                    {stage.name}
                                  </Link>
                                </td>
                                <td className="px-4 py-3">
                                  <StatusBadge
                                    status={stage.status}
                                    labels={STAGE_STATUS_LABELS}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2 max-w-[140px]">
                                    <Progress value={stage.progress} className="h-2 flex-1" />
                                    <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                                      {stage.progress}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right text-sm tabular-nums hidden md:table-cell">
                                  {stage._count.tasks}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-mono tabular-nums hidden md:table-cell">
                                  {formatCurrency(stage.estimatedBudget)}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                  {dateLabel}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                    <Link href={`/stages/${stage.id}`}>
                                      <Button variant="outline" size="sm">Chi tiết</Button>
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
