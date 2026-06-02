import * as Minio from "minio";

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
    });
  }
  return minioClient;
}

export async function ensureBucket(bucket: string): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(bucket);
  if (!exists) {
    await client.makeBucket(bucket);
  }
}

export async function uploadFile(
  bucket: string,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await ensureBucket(bucket);
  await getMinioClient().putObject(bucket, objectName, buffer, undefined, {
    "Content-Type": contentType,
  });
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port = process.env.MINIO_PORT || "9000";
  return `${protocol}://${process.env.MINIO_ENDPOINT}:${port}/${bucket}/${objectName}`;
}

export async function deleteFile(bucket: string, objectName: string): Promise<void> {
  await getMinioClient().removeObject(bucket, objectName);
}

export function getPublicUrl(bucket: string, objectName: string): string {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const port = process.env.MINIO_PORT || "9000";
  return `${protocol}://${process.env.MINIO_ENDPOINT}:${port}/${bucket}/${objectName}`;
}
