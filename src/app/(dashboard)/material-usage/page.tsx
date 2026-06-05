"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhotoUpload } from "@/components/photo-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDate, formatNumber } from "@/lib/utils";
import {
  getMaterialUsages,
  createMaterialUsage,
  deleteMaterialUsage,
} from "@/actions/material-usage";
import { getMaterials } from "@/actions/materials";
import { getDailyLogs } from "@/actions/daily-logs";
import { getProjects } from "@/actions/projects";

interface MaterialInfo {
  id: string;
  name: string;
  unit: string;
}

interface DailyLogInfo {
  id: string;
  date: string | Date;
  project?: { id: string; name: string };
}

interface ProjectInfo {
  id: string;
  name: string;
}

interface StageInfo {
  id: string;
  name: string;
  projectId: string;
}

interface PhotoInfo {
  id: string;
  url: string;
  caption?: string | null;
}

interface MaterialUsageInfo {
  id: string;
  quantity: number;
  date: string | Date;
  notes: string | null;
  material: { id: string; name: string; unit: string };
  dailyLog: { id: string; date: string | Date };
  task: { id: string; name: string } | null;
  photos?: PhotoInfo[];
}

export default function MaterialUsagePage() {
  const [records, setRecords] = useState<MaterialUsageInfo[]>([]);
  const [materials, setMaterials] = useState<MaterialInfo[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLogInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [stages, setStages] = useState<StageInfo[]>([]);

  const [projectId, setProjectId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [dailyLogId, setDailyLogId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterMaterial, setFilterMaterial] = useState("ALL");
  const [filterDate, setFilterDate] = useState("");

  const load = async () => {
    const [r, m, d, p] = await Promise.all([
      getMaterialUsages(),
      getMaterials(),
      getDailyLogs(),
      getProjects(),
    ]);
    setRecords(r as unknown as MaterialUsageInfo[]);
    setMaterials(m as unknown as MaterialInfo[]);
    setDailyLogs(d as unknown as DailyLogInfo[]);
    setProjects(p as unknown as ProjectInfo[]);

    if (p.length > 0 && !projectId) {
      setProjectId(p[0].id);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Fetch stages when project changes
  useEffect(() => {
    if (projectId) {
      fetch("/api/stages?projectId=" + projectId)
        .then((res) => res.json())
        .then(setStages)
        .catch(() => setStages([]));
      setTaskId("");
    }
  }, [projectId]);

  const filteredLogs = dailyLogs.filter(
    (l) => !projectId || l.project?.id === projectId
  );

  const filteredRecords = records.filter((r) => {
    if (filterMaterial !== "ALL" && r.material.id !== filterMaterial) return false;
    if (filterDate) {
      const rDate = new Date(r.date).toISOString().split("T")[0];
      if (rDate !== filterDate) return false;
    }
    return true;
  });

  const totalQuantity = filteredRecords.reduce((sum, r) => sum + r.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId || !quantity || !projectId) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const selectedLog = dailyLogs.find((l) => l.id === dailyLogId);
      await createMaterialUsage(
        {
          materialId,
          dailyLogId: dailyLogId || undefined,
          taskId: taskId || undefined,
          projectId,
          quantity: parseFloat(quantity),
          date: selectedLog ? new Date(selectedLog.date) : new Date(),
          notes: notes || undefined,
        },
        photos.length > 0 ? photos : undefined
      );
      setMaterialId("");
      setDailyLogId("");
      setTaskId("");
      setQuantity("");
      setNotes("");
      setPhotos([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa bản ghi này?")) return;
    try {
      await deleteMaterialUsage(id);
      await load();
    } catch {
      setError("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vật tư sử dụng</h1>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Ghi nhận sử dụng vật tư</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Dự án</Label>
              <Select value={projectId || undefined} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Vật liệu</Label>
              <Select value={materialId || undefined} onValueChange={setMaterialId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vật liệu" />
                </SelectTrigger>
                <SelectContent>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Giai đoạn</Label>
              <Select value={taskId || undefined} onValueChange={(v) => setTaskId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giai đoạn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không chọn</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Nhật ký</Label>
              <Select value={dailyLogId} onValueChange={setDailyLogId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhật ký" />
                </SelectTrigger>
                <SelectContent>
                  {filteredLogs.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {formatDate(l.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Số lượng</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Ghi chú</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tùy chọn"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Ảnh (tùy chọn)</Label>
              <PhotoUpload onPhotosChange={setPhotos} maxPhotos={5} />
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={creating}>
                <Plus className="mr-2 h-4 w-4" />
                {creating ? "Đang lưu..." : "Ghi nhận"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lịch sử sử dụng</CardTitle>
            <div className="flex items-center gap-3">
              <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Tất cả vật liệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vật liệu</SelectItem>
                  {materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Chưa có bản ghi sử dụng vật tư nào
            </p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Vật liệu</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Số lượng</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Ảnh</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Ghi chú</th>
                      <th className="px-4 py-3 text-right text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="group border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          {formatDate(r.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {r.material.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          {formatNumber(r.quantity, 2)} {r.material.unit}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {r.photos && r.photos.length > 0 ? (
                            <div className="flex gap-1">
                              {r.photos.slice(0, 3).map((p) => (
                                <Dialog key={p.id}>
                                  <DialogTrigger asChild>
                                    <img
                                      src={p.url}
                                      alt=""
                                      className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 border shadow-sm transition-opacity"
                                    />
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg">
                                    <img src={p.url} alt="" className="w-full rounded shadow-sm" />
                                  </DialogContent>
                                </Dialog>
                              ))}
                              {r.photos.length > 3 && (
                                <span className="text-muted-foreground text-xs flex items-center">
                                  +{r.photos.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {r.notes || "-"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(r.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-semibold">
                      <td colSpan={2} className="px-4 py-3 text-sm text-right">
                        Tổng cộng:
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatNumber(totalQuantity, 2)}
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
