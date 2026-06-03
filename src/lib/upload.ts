import { promises as fs } from "fs";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validatePhoto(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Chỉ chấp nhận file JPEG, PNG hoặc WebP";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Kích thước file không được vượt quá 10MB";
  }
  return null;
}

export async function saveUploadedPhoto(
  file: File,
  subfolder: string
): Promise<string> {
  const error = validatePhoto(file);
  if (error) throw new Error(error);

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}
