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
    if (!confirm("Xóa checklist này?")) return;
    await deleteChecklist(id);
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
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Chưa có checklist nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {checklists.map((cl) => {
            const done = completedCount(cl.items);
            const total = cl.items.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <Card key={cl.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/checklists/${cl.id}`}
                          className="font-medium hover:underline truncate"
                        >
                          {cl.name}
                        </Link>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {cl.stage.name}
                        </span>
                      </div>
                      {total > 0 && (
                        <div className="flex items-center gap-3 mt-2">
                          <Progress value={pct} className="h-1.5 flex-1 max-w-xs" />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {done}/{total}
                          </span>
                        </div>
                      )}
                      {total === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Chưa có mục nào
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Link href={`/checklists/${cl.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cl.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
