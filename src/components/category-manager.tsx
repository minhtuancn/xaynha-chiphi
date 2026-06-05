"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createMaterialCategory,
  updateMaterialCategory,
  deleteMaterialCategory,
} from "@/actions/materials";

interface Category {
  id: string;
  name: string;
  description?: string | null;
}

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, dialog: confirmDialog } = useConfirm();

  function resetForm() {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(cat: Category) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description ?? "");
    setError("");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      try {
        setError("");
        if (editingId) {
          await updateMaterialCategory(editingId, {
            name: name.trim(),
            description: description.trim() || undefined,
          });
        } else {
          await createMaterialCategory({
            name: name.trim(),
            description: description.trim() || undefined,
          });
        }
        resetForm();
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      }
    });
  }

  async function handleDelete(id: string, catName: string) {
    const ok = await confirm({
      title: `Xóa danh mục "${catName}"?`,
      description: "Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "destructive",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteMaterialCategory(id);
        toast({ title: "Đã xóa danh mục" });
        router.refresh();
      } catch (err) {
        toast({ title: err instanceof Error ? err.message : "Có lỗi xảy ra", variant: "destructive" });
      }
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Quản lý nhóm
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "Sửa danh mục" : "Thêm danh mục"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cat-name">
              Tên danh mục *
            </label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Xi măng, Gạch, Sắt thép"
              disabled={isPending}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="cat-desc">
              Mô tả (tùy chọn)
            </label>
            <Input
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả danh mục"
              disabled={isPending}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); resetForm(); }}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? "Đang lưu..." : editingId ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        </form>

        {categories.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium mb-2">Danh sách danh mục</p>
            <div className="max-h-48 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="p-1 hover:bg-muted rounded"
                            onClick={() => openEdit(cat)}
                            title="Sửa"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1 hover:bg-muted rounded text-red-500"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            title="Xóa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
      {confirmDialog}
    </>
  );
}