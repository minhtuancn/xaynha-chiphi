import { promises as fs } from "fs";
import path from "path";

export async function saveUploadedPhoto(
  file: File,
  subfolder: string
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", subfolder);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${subfolder}/${filename}`;
}
