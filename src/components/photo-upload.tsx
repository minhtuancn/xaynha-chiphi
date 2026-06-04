"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoFile {
  file: File;
  preview: string;
}

interface PhotoUploadProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  allowCamera?: boolean;
  allowUpload?: boolean;
}

export function PhotoUpload({
  onPhotosChange,
  maxPhotos = 10,
  allowCamera = true,
  allowUpload = true,
}: PhotoUploadProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, [photos]);

  const updatePhotos = (newPhotos: PhotoFile[]) => {
    setPhotos(newPhotos);
    onPhotosChange(newPhotos.map((p) => p.file));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const invalid = files.find((f) => !ALLOWED_TYPES.includes(f.type));
    if (invalid) {
      toast({
        title: "Định dạng không hỗ trợ",
        description: "Chỉ chấp nhận JPEG, PNG hoặc WebP",
        variant: "destructive",
      });
      return;
    }

    const oversized = files.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      toast({
        title: "Ảnh quá lớn",
        description: "Kích thước tối đa 10MB mỗi ảnh",
        variant: "destructive",
      });
      return;
    }

    const remaining = maxPhotos - photos.length;
    if (files.length > remaining) {
      toast({
        title: "Vượt quá số lượng",
        description: `Chỉ được chọn tối đa ${remaining} ảnh`,
        variant: "destructive",
      });
    }

    const newFiles = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    updatePhotos([...photos, ...newFiles]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview);
    const newPhotos = photos.filter((_, i) => i !== index);
    updatePhotos(newPhotos);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Không thể truy cập camera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
        updatePhotos([...photos, { file, preview: URL.createObjectURL(file) }]);
      }
    }, "image/jpeg", 0.8);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {allowUpload && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />Tải ảnh lên
          </Button>
        )}
        {allowCamera && !cameraActive && (
          <Button type="button" variant="outline" size="sm" onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />Chụp ảnh
          </Button>
        )}
        {cameraActive && (
          <>
            <Button type="button" size="sm" onClick={capturePhoto}>Chụp</Button>
            <Button type="button" variant="outline" size="sm" onClick={stopCamera}>Đóng camera</Button>
          </>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
      {cameraActive && (
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-md rounded border" />
      )}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <img src={photo.preview} alt={`Ảnh ${i + 1}`} className="w-full h-24 object-cover rounded border" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Xóa ảnh"
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
