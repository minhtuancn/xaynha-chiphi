import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  MINIO_ENDPOINT: z.string().optional(),
  MINIO_PORT: z.string().optional(),
  MINIO_ACCESS_KEY: z.string().optional(),
  MINIO_SECRET_KEY: z.string().optional(),
  MINIO_BUCKET: z.string().optional(),
  MINIO_USE_SSL: z.string().optional(),
  OPENWEATHER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  const issues = parsed.error.issues.map(
    (i) => `  - ${i.path.join(".")}: ${i.message}`,
  );
  console.error(issues.join("\n"));
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variables");
  } else {
    console.warn("⚠️  Running with missing env vars in development mode");
  }
}

export const env = parsed.data ?? {
  DATABASE_URL: "",
  NEXTAUTH_SECRET: "",
  NEXTAUTH_URL: "http://localhost:3050",
  NODE_ENV: "development",
} as z.infer<typeof envSchema>;
