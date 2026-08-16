"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { DetailViewTabs } from "@/components/detail-view-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { taskSchema, type TaskFormData, stageSchema, type StageFormData } from "@/schemas/stage";
import { createTask, updateTask, deleteTask, updateStage } from "@/actions/stages";
import { formatCurrency, formatDate, STAGE_STATUS_LABELS, TASK_STATUS_LABELS } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface StageDetailProps {
  stage: {
    id: string;
    projectId: string;
    name: string;
    order: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
    startDate: Date | null;
    endDate: Date | null;
    estimatedBudget: number;
    actualCost: number;
    progress: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    tasks: {
      id: string;
      name: string;
      status: string;
      progress: number;
      startDate: Date | null;
      endDate: Date | null;
      description: string | null;
      assignee: string | null;
      notes: string | null;
      stageId: string;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    }[];
    project: { id: string; name: string };
  };
}

function TaskForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: TaskFormData) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "PENDING",
      assignee: "",
      progress: 0,
      notes: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên task</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tên task" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Người thực hiện</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Tên người làm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiến độ (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} placeholder="Mô tả task" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm task
          </Button>
        </div>
      </form>
    </Form>
  );
}

function StageEditForm({
  stage,
  onSubmit,
  isSubmitting,
}: {
  stage: {
    id: string;
    projectId: string;
    name: string;
    order: number;
    status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD";
    startDate: Date | null;
    endDate: Date | null;
    estimatedBudget: number;
    actualCost: number;
    progress: number;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    project: { id: string; name: string };
  };
  onSubmit: (data: StageFormData) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      name: stage.name,
      status: stage.status,
      startDate: stage.startDate || undefined,
      endDate: stage.endDate || undefined,
      progress: stage.progress,
      estimatedBudget: Number(stage.estimatedBudget),
      notes: stage.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên giai đoạn</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nhập tên giai đoạn" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(STAGE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày bắt đầu</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngày kết thúc</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiến độ (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ngân sách ước tính</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} placeholder="Ghi chú" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function StageDetailPage({ stage }: StageDetailProps) {
  const router = useRouter();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  async function handleAddTask(data: TaskFormData) {
    setIsSubmitting(true);
    try {
      await createTask(stage.id, data);
      router.refresh();
      setShowTaskForm(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const ok = await confirm({
      title: "Xóa task này?",
      description: "Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "destructive",
    });
    if (!ok) return;
    await deleteTask(taskId);
    toast({ title: "Đã xóa task" });
    router.refresh();
  }

  async function handleUpdateTaskStatus(id: string, status: TaskFormData["status"]) {
    await updateTask(id, {
      name: stage.tasks.find((t) => t.id === id)?.name ?? "",
      status,
      progress: stage.tasks.find((t) => t.id === id)?.progress ?? 0,
    });
    router.refresh();
  }

  async function handleUpdateStage(data: StageFormData) {
    setIsSubmitting(true);
    try {
      await updateStage(stage.id, data);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/stages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{stage.name}</h1>
        <StatusBadge status={stage.status} labels={STAGE_STATUS_LABELS} />
      </div>

      <DetailViewTabs
        viewTab={
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin giai đoạn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ</span>
                    <span className="font-medium">{stage.progress}%</span>
                  </div>
                  <Progress value={stage.progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Dự án</p>
                    <p className="font-medium">{stage.project.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngân sách ước tính</p>
                    <p className="font-medium">{formatCurrency(Number(stage.estimatedBudget))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày bắt đầu</p>
                    <p className="font-medium">{formatDate(stage.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày kết thúc</p>
                    <p className="font-medium">{formatDate(stage.endDate)}</p>
                  </div>
                </div>

                {stage.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ghi chú</p>
                    <p className="text-sm">{stage.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Danh sách task ({stage.tasks.length})</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTaskForm(!showTaskForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm task
                </Button>
              </CardHeader>
              <CardContent>
                {showTaskForm && (
                  <div className="mb-6 rounded-lg border p-4">
                    <TaskForm onSubmit={handleAddTask} isSubmitting={isSubmitting} />
                  </div>
                )}

                {stage.tasks.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    Chưa có task nào. Nhấn &quot;Thêm task&quot; để tạo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="font-medium">{task.name}</p>
                            <StatusBadge status={task.status} labels={TASK_STATUS_LABELS} />
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {task.assignee && <span>Người làm: {task.assignee}</span>}
                            <span>Tiến độ: {task.progress}%</span>
                            {task.startDate && <span>Bắt đầu: {formatDate(task.startDate)}</span>}
                            {task.endDate && <span>Kết thúc: {formatDate(task.endDate)}</span>}
                          </div>
                          <div className="w-full max-w-xs">
                            <Progress value={task.progress} className="h-1.5" />
                          </div>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                          <Select
                            defaultValue={task.status}
                            onValueChange={(value: TaskFormData["status"]) =>
                              handleUpdateTaskStatus(task.id, value)
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        }
        editTab={
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa giai đoạn</CardTitle>
            </CardHeader>
            <CardContent>
              <StageEditForm
                stage={stage}
                onSubmit={handleUpdateStage}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        }
      />
      {confirmDialog}
    </div>
  );
}
