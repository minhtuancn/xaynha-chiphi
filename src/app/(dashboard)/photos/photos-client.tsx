"use client";

import { useState } from "react";
import { Trash2, Upload, X, Calendar, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/forms/file-upload";
import { formatDate } from "@/lib/utils";
import { createPhoto, deletePhoto } from "@/actions/photos";
import type { Photo } from "@prisma/client";

interface PhotosPageClientProps {
  photos: Photo[];
}

export default function PhotosPageClient({ photos }: PhotosPageClientProps) {
  const [photoList, setPhotoList] = useState<Photo[]>(photos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");

  const filteredPhotos = dateFilter
    ? photoList.filter((p) => {
        const d = new Date(p.takenAt);
        return d.toISOString().split("T")[0] === dateFilter;
      })
    : photoList;

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setError(null);

    for (const file of files) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Tải lên thất bại");
        }

        const { url, thumbnail } = await res.json();

        await createPhoto({
          url,
          thumbnail,
          takenAt: new Date(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Tải lên thất bại");
      }
    }

    setUploading(false);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePhoto(id);
      setPhotoList((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Xóa ảnh thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight tracking-tight">Thư viện ảnh</h1>
      </div>

      {error && (
        <Card className="border-destructive shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-5 w-5" />
            Tải ảnh lên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUpload={handleUpload}
            accept="image/*"
            multiple
          />
          {uploading && (
            <p className="mt-2 text-sm text-muted-foreground">
              Đang tải lên...
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm shadow-sm"
          />
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {filteredPhotos.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12" />
            <p>Chưa có ảnh nào. Hãy tải ảnh lên để bắt đầu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="overflow-hidden group shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative aspect-square bg-muted">
                <img
                  src={photo.thumbnail || photo.url}
                  alt={photo.caption || ""}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all sm:group-hover:bg-black/40 sm:group-hover:opacity-100">
                  <form
                    action={async () => {
                      await handleDelete(photo.id);
                    }}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      type="submit"
                      className="bg-destructive/90 text-white opacity-100 transition-transform sm:scale-95 sm:opacity-0 sm:group-hover:scale-100 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="truncate text-xs">
                  {photo.caption || "Không có chú thích"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(photo.takenAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
