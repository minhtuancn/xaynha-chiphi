"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getChecklists, createChecklist, deleteChecklist } from "@/actions/checklists";
import { getStages } from "@/actions/stages";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import { ClipboardList } from "lucide-react";

interface ChecklistItemInfo {
  id: string;
  name: string;
  completed: boolean;
}

interface ChecklistInfo {
  id: string;
  name: string;
  order: number;
  items: ChecklistItemInfo[];
  _count: { items: number };
  stage: { id: string; name: string; project: { id: string; name: string } };
}

interface StageInfo {
  id: string;
  name: string;
  project: { id: string; name: string };
}

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<ChecklistInfo[]>([]);
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [stageId, setStageId] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const load = async () => {
    const [c, s] = await Promise.all([getChecklists(), getStages()]);
    setChecklists(c as unknown as ChecklistInfo[]);
    setStages(s as unknown as StageInfo[]);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageId || !name) return;
    setCreating(true);
    try {
      await createChecklist({ stageId, name });
      setName("");
      await load();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Xóa checklist này?",
      description: "Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "destructive",
    });
    if (!ok) return;
    await deleteChecklist(id);
    toast({ title: "Đã xóa checklist" });
    await load();
  };

  const completedCount = (items: ChecklistItemInfo[]) =>
    items.filter((i) => i.completed).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Checklist</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo checklist mới</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="stage">Giai đoạn</Label>
              <Select value={stageId} onValueChange={setStageId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.project?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="name">Tên checklist</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Kiểm tra móng"
                required
              />
            </div>
            <Button type="submit" disabled={creating}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo
            </Button>
          </form>
        </CardContent>
      </Card>

      {checklists.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Chưa có checklist nào"
          description="Tạo checklist đầu tiên để theo dõi các hạng mục thi công."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklists.map((cl) => {
            const done = completedCount(cl.items);
            const total = cl.items.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Card key={cl.id} className="transition-all hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/checklists/${cl.id}`}
                          className="font-semibold hover:underline truncate block"
                        >
                          {cl.name}
                        </Link>
                        <span className="text-xs text-muted-foreground block mt-1">
                          {cl.stage.name} &middot; {cl.stage.project.name}
                        </span>
                      </div>
                    </div>

                    {total > 0 ? (
                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Tiến độ</span>
                          <span>{done}/{total}</span>
                        </div>
                        <div className="relative">
                          <Progress value={pct} className="h-2 w-full [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-emerald-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-grow" />
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex items-center gap-1">
                        {done === total && total > 0 ? (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Hoàn thành
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Circle className="h-3.5 w-3.5" />
                            {total === 0 ? "Chưa có mục" : "Đang thực hiện"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link href={`/checklists/${cl.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(cl.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {confirmDialog}
    </div>
  );
}
