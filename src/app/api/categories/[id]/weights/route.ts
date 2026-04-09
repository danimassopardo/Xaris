import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const weights = await prisma.categoryWeight.findMany({
      where: { categoryId: parseInt(id) },
      include: { subject: true },
    });
    return NextResponse.json(weights);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch weights" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id);
    const body = await request.json();
    const { weights } = body as { weights: { subjectId: number | null; weight: number }[] };
    if (!Array.isArray(weights)) {
      return NextResponse.json({ error: "weights must be an array" }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.categoryWeight.deleteMany({ where: { categoryId } }),
      ...weights.map((w) =>
        prisma.categoryWeight.create({
          data: { categoryId, subjectId: w.subjectId ?? null, weight: w.weight },
        })
      ),
    ]);
    const updated = await prisma.categoryWeight.findMany({
      where: { categoryId },
      include: { subject: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update weights" }, { status: 500 });
  }
}
