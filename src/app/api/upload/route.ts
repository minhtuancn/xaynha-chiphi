import { NextResponse } from "next/server";
import { getMinioClient, ensureBucket, uploadFile } from "@/lib/minio";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const uuid = crypto.randomUUID();
    const filename = `${dateStr}-${uuid}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const bucket = process.env.MINIO_BUCKET || "photos";

    const url = await uploadFile(bucket, filename, buffer, file.type);

    const thumbnail = url.replace(/\/([^/]+)$/, `/thumbs/$1`);

    return NextResponse.json({ url, thumbnail });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
