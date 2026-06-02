import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface RecentPhotosProps {
  photos: { id: string; url: string; thumbnail?: string | null; caption?: string | null }[];
}

export function RecentPhotos({ photos }: RecentPhotosProps) {
  if (photos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Ảnh công trình gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Chưa có ảnh nào</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Ảnh công trình gần đây
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                {photo.caption || "Ảnh"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
