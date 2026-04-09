import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
