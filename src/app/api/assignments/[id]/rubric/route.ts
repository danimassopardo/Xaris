import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rubricItems = await prisma.rubricCriteria.findMany({
      where: { assignmentId: parseInt(id) },
    });
    return NextResponse.json(rubricItems);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch rubric" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignmentId = parseInt(id);
    const body = await request.json();
    const { rubricItems } = body as {
      rubricItems: { name: string; score: number; maxScore: number }[];
    };
    if (!Array.isArray(rubricItems)) {
      return NextResponse.json({ error: "rubricItems must be an array" }, { status: 400 });
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { gradeValue: true },
    });
    if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    await prisma.rubricCriteria.deleteMany({ where: { assignmentId } });
    const created =
      rubricItems.length > 0
        ? await Promise.all(
            rubricItems.map((item) =>
              prisma.rubricCriteria.create({
                data: {
                  assignmentId,
                  name: item.name,
                  score: item.score,
                  maxScore: item.maxScore,
                },
              })
            )
          )
        : [];

    let newGradeValue: number | null = existing.gradeValue;
    if (rubricItems.length > 0) {
      const totalScore = rubricItems.reduce((s, i) => s + i.score, 0);
      const totalMax = rubricItems.reduce((s, i) => s + i.maxScore, 0);
      newGradeValue = totalMax > 0 ? (totalScore / totalMax) * 100 : null;
    }

    if (newGradeValue !== existing.gradeValue) {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { gradeValue: newGradeValue },
      });
      await prisma.auditLog.create({
        data: {
          entityType: "Assignment",
          entityId: assignmentId,
          field: "gradeValue",
          oldValue: existing.gradeValue != null ? String(existing.gradeValue) : null,
          newValue: newGradeValue != null ? String(newGradeValue) : null,
          timestamp: new Date(),
        },
      });
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update rubric" }, { status: 500 });
  }
}
