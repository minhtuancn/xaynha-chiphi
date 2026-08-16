"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, X } from "lucide-react";
import Link from "next/link";
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
import { createDocument } from "@/actions/documents";
import { getProjects } from "@/actions/projects";
import { useEffect, useCallback } from "react";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "CONTRACT", label: "Hợp đồng" },
  { value: "DRAWING", label: "Bản vẽ" },
  { value: "INVOICE", label: "Hóa đơn" },
  { value: "PERMIT", label: "Giấy phép" },
  { value: "OTHER", label: "Khác" },
];

interface ProjectInfo {
  id: string;
  name: string;
}

export default function UploadDocumentPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("OTHER");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    getProjects().then((data) => setProjects(data));
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name.replace(/\.[^.]+$/, ""));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setFileName(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn file");
      return;
    }
    if (!projectId) {
      setError("Vui lòng chọn dự án");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload/document", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Tải file thất bại");
      }

      const { url, size } = await res.json();
      setUploading(false);

      await createDocument({
        projectId,
        name: fileName || file.name,
        type: type as "CONTRACT" | "DRAWING" | "INVOICE" | "PERMIT" | "OTHER",
        category: category || undefined,
        url,
        size,
        tags: tags ? JSON.stringify(tags.split(",").map((t) => t.trim())) : undefined,
      });

      router.push("/documents");
    } catch (err) {
      setSaving(false);
      setUploading(false);
      setError(err instanceof Error ? err.message : "Tải lên thất bại");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/documents">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Tải tài liệu lên</h1>
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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Chọn file</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive ? "border-primary bg-primary/5" : "border-border"}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("doc-file-input")?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Kéo thả file vào đây hoặc nhấp để chọn file
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (tối đa 50MB)
              </p>
              <input
                id="doc-file-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {file && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-muted rounded-lg">
                <span className="text-sm flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => { setFile(null); setFileName(""); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Thông tin tài liệu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên tài liệu</Label>
              <Input
                id="name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Dự án</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Loại tài liệu</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Danh mục</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="VD: Hồ sơ thiết kế, Chứng từ thanh toán..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Thẻ (phân cách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="VD: quan-trọng, khẩn-cấp"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link href="/documents">
            <Button variant="outline" type="button">Hủy</Button>
          </Link>
          <Button type="submit" disabled={saving || uploading}>
            {(uploading || saving) ? "Đang tải lên..." : "Tải lên"}
          </Button>
        </div>
      </form>
    </div>
  );
}
