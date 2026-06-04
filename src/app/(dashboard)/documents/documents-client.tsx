"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, FileText, ExternalLink, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatDate, formatFileSize } from "@/lib/utils";
import { deleteDocument } from "@/actions/documents";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Hợp đồng",
  DRAWING: "Bản vẽ",
  INVOICE: "Hóa đơn",
  PERMIT: "Giấy phép",
  OTHER: "Khác",
};

const DOCUMENT_TYPE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CONTRACT: "default",
  DRAWING: "secondary",
  INVOICE: "destructive",
  PERMIT: "outline",
  OTHER: "secondary",
};

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  category: string | null;
  url: string;
  size: number;
  tags: string;
  uploadedAt: string | Date;
  createdAt: string | Date;
  project: { id: string; name: string };
}

interface DocumentsClientProps {
  documents: DocumentInfo[];
  projects: { id: string; name: string }[];
}

export default function DocumentsClient({ documents, projects }: DocumentsClientProps) {
  const [docList, setDocList] = useState(documents);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");

  const filtered = docList.filter((doc) => {
    if (typeFilter !== "ALL" && doc.type !== typeFilter) return false;
    if (projectFilter !== "ALL" && doc.project.id !== projectFilter) return false;
    if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    try {
      await deleteDocument(id);
      setDocList((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Xóa tài liệu thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tài liệu</h1>
        <Link href="/documents/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tải lên
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tài liệu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Loại tài liệu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="CONTRACT">{DOCUMENT_TYPE_LABELS.CONTRACT}</SelectItem>
              <SelectItem value="DRAWING">{DOCUMENT_TYPE_LABELS.DRAWING}</SelectItem>
              <SelectItem value="INVOICE">{DOCUMENT_TYPE_LABELS.INVOICE}</SelectItem>
              <SelectItem value="PERMIT">{DOCUMENT_TYPE_LABELS.PERMIT}</SelectItem>
              <SelectItem value="OTHER">{DOCUMENT_TYPE_LABELS.OTHER}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Dự án" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả dự án</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {docList.length === 0
              ? "Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên."
              : "Không tìm thấy tài liệu phù hợp."}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Tên tài liệu</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Dự án</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Kích thước</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày tải lên</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={DOCUMENT_TYPE_VARIANTS[doc.type] || "secondary"}>
                      {DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {doc.project.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-mono">
                    {formatFileSize(doc.size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(doc.uploadedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="icon" title="Xem tài liệu">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
