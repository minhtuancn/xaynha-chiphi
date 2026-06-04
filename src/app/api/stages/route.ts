import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const stages = await prisma.constructionStage.findMany({
    where: { projectId, deletedAt: null },
    select: { id: true, name: true, projectId: true },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(stages);
}
