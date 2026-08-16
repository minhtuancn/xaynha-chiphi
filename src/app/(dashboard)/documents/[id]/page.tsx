import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDocument, deleteDocument } from "@/actions/documents";
import { formatDate, formatFileSize } from "@/lib/utils";
import { serialize } from "@/lib/serialize";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const data = serialize(doc);

  async function handleDelete() {
    "use server";
    await deleteDocument(id);
    revalidatePath("/documents");
    redirect("/documents");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <Badge variant={DOCUMENT_TYPE_VARIANTS[data.type] || "secondary"}>
            {DOCUMENT_TYPE_LABELS[data.type] || data.type}
          </Badge>
        </div>
        <form action={handleDelete}>
          <Button variant="destructive" size="sm" type="submit">
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin tài liệu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tên file</p>
              <p className="font-medium">{data.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Loại</p>
              <p className="font-medium">
                {DOCUMENT_TYPE_LABELS[data.type] || data.type}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Dự án</p>
              <p className="font-medium">{data.project.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kích thước</p>
              <p className="font-medium">{formatFileSize(data.size)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ngày tải lên</p>
              <p className="font-medium">{formatDate(data.uploadedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Danh mục</p>
              <p className="font-medium">{data.category || "-"}</p>
            </div>
          </div>

          {data.tags && data.tags !== "[]" && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Thẻ</p>
              <div className="flex flex-wrap gap-2">
                {(JSON.parse(data.tags) as string[]).map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <a href={data.url} target="_blank" rel="noopener noreferrer">
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                Mở tài liệu
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
