"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  getChecklist,
  updateChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "@/actions/checklists";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";

interface ChecklistItemInfo {
  id: string;
  name: string;
  completed: boolean;
  completedAt: string | Date | null;
  order: number;
}

interface ChecklistInfo {
  id: string;
  name: string;
  items: ChecklistItemInfo[];
  stage: { id: string; name: string; project: { id: string; name: string } };
}

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistInfo | null>(null);
  const [newItem, setNewItem] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  const load = async () => {
    const data = await getChecklist(params.id as string);
    if (!data) {
      router.push("/checklists");
      return;
    }
    setChecklist(data as unknown as ChecklistInfo);
    setEditName(data.name);
  };

  useEffect(() => { load(); }, [params.id]);

  if (!checklist) return null;

  const done = checklist.items.filter((i) => i.completed).length;
  const total = checklist.items.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addChecklistItem(checklist.id, newItem.trim());
    setNewItem("");
    await load();
  };

  const handleToggle = async (item: ChecklistItemInfo) => {
    await toggleChecklistItem(item.id, !item.completed);
    await load();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteChecklistItem(id);
    await load();
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    await updateChecklist(checklist.id, { name: editName.trim() });
    setEditing(false);
    await load();
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Xóa checklist này?",
      description: "Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "destructive",
    });
    if (!ok) return;
    await deleteChecklist(checklist.id);
    toast({ title: "Đã xóa checklist" });
    router.push("/checklists");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/checklists">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-64"
                />
                <Button size="sm" onClick={handleUpdateName}>Lưu</Button>
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">{checklist.name}</h1>
                <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {checklist.stage.project.name} — {checklist.stage.name}
      </p>

      {total > 0 && (
        <div className="flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="text-sm text-muted-foreground shrink-0">
            {done}/{total} ({pct}%)
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh sách mục</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Chưa có mục nào. Thêm mục đầu tiên.
            </p>
          ) : (
            checklist.items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  item.completed && "bg-muted/50 border-muted"
                )}
              >
                <button onClick={() => handleToggle(item)} className="shrink-0">
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <span
                  className={cn(
                    "flex-1 text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}
                >
                  {item.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}

          <form onSubmit={handleAddItem} className="flex items-center gap-2 pt-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Thêm mục mới..."
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={!newItem.trim()}>
              <Plus className="mr-1 h-4 w-4" />
              Thêm
            </Button>
          </form>
        </CardContent>
      </Card>
      {confirmDialog}
    </div>
  );
}
