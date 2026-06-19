import * as Minio from "minio";

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    const endpoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ACCESS_KEY;

    if (!endpoint || endpoint === 'your-minio-host' || !accessKey || accessKey === 'your-access-key') {
      console.warn(
        '[minio] MinIO chưa được cấu hình đúng. ' +
        'Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY trong .env.production'
      );
    }

    minioClient = new Minio.Client({
      endPoint: endpoint || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000"),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: accessKey || "minioadmin",
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

function validateMinioConfig(): void {
  const endpoint = process.env.MINIO_ENDPOINT;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  if (!endpoint || endpoint === 'your-minio-host') {
    throw new Error('MINIO_ENDPOINT chưa được cấu hình. Set trong .env.production');
  }
  if (!accessKey || accessKey === 'your-access-key') {
    throw new Error('MINIO_ACCESS_KEY chưa được cấu hình. Set trong .env.production');
  }
  if (!secretKey || secretKey === 'your-secret-key') {
    throw new Error('MINIO_SECRET_KEY chưa được cấu hình. Set trong .env.production');
  }
}

export async function uploadFile(
  bucket: string,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  validateMinioConfig();
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
