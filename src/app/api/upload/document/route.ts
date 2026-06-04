import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/minio";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const dateStr = new Date().toISOString().split("T")[0];
    const uuid = crypto.randomUUID();
    const objectName = `documents/${dateStr}-${uuid}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = process.env.MINIO_BUCKET || "xaynha-chiphi";
    const url = await uploadFile(bucket, objectName, buffer, file.type);

    return NextResponse.json({ url, name: file.name, size: file.size });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
