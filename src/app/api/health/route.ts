import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - start;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        db: { connected: true, latencyMs: dbLatency },
        uptime: process.uptime(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: { connected: false, error: message },
      },
      { status: 503 },
    );
  }
}
