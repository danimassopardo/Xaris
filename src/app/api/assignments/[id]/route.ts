import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: { subject: true, student: true, rubricItems: true, category: true },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }
    return NextResponse.json(assignment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch assignment" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, type, status, gradeValue, dueDate, subjectId, feedback, categoryId, completedAt, habitStatus, effortMinutes } =
      body;
    if (!title || !dueDate || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      select: {
        status: true,
        gradeValue: true,
        dueDate: true,
        subjectId: true,
        title: true,
        categoryId: true,
        habitStatus: true,
        completedAt: true,
      },
    });
    if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    const newGradeValue =
      gradeValue != null && gradeValue !== "" ? parseFloat(gradeValue) : null;
    const newDueDate = new Date(dueDate);
    const newSubjectId = parseInt(subjectId);
    const newCategoryId =
      categoryId != null && categoryId !== "" ? parseInt(categoryId) : null;

    const fieldsToAudit: { field: string; old: string | null; new: string | null }[] = [];
    if (existing.status !== status)
      fieldsToAudit.push({ field: "status", old: existing.status, new: status });
    if (existing.gradeValue !== newGradeValue)
      fieldsToAudit.push({
        field: "gradeValue",
        old: existing.gradeValue != null ? String(existing.gradeValue) : null,
        new: newGradeValue != null ? String(newGradeValue) : null,
      });
    if (existing.dueDate.toISOString() !== newDueDate.toISOString())
      fieldsToAudit.push({
        field: "dueDate",
        old: existing.dueDate.toISOString(),
        new: newDueDate.toISOString(),
      });
    if (existing.subjectId !== newSubjectId)
      fieldsToAudit.push({
        field: "subjectId",
        old: String(existing.subjectId),
        new: String(newSubjectId),
      });
    if (existing.title !== title)
      fieldsToAudit.push({ field: "title", old: existing.title, new: title });
    if (existing.categoryId !== newCategoryId)
      fieldsToAudit.push({
        field: "categoryId",
        old: existing.categoryId != null ? String(existing.categoryId) : null,
        new: newCategoryId != null ? String(newCategoryId) : null,
      });
    if (existing.habitStatus !== (habitStatus ?? "NOT_YET"))
      fieldsToAudit.push({ field: "habitStatus", old: existing.habitStatus, new: habitStatus ?? "NOT_YET" });

    const newCompletedAt = completedAt ? new Date(completedAt) : null;
    if ((existing.completedAt?.toISOString() ?? null) !== (newCompletedAt?.toISOString() ?? null))
      fieldsToAudit.push({
        field: "completedAt",
        old: existing.completedAt?.toISOString() ?? null,
        new: newCompletedAt?.toISOString() ?? null,
      });

    const assignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description ?? "",
        type,
        status,
        gradeValue: newGradeValue,
        feedback: feedback ?? "",
        dueDate: newDueDate,
        subjectId: newSubjectId,
        categoryId: newCategoryId,
        completedAt: newCompletedAt,
        habitStatus: habitStatus ?? "NOT_YET",
        effortMinutes: effortMinutes != null && effortMinutes !== "" ? parseInt(effortMinutes) : null,
      },
      include: { subject: true, student: true, rubricItems: true, category: true },
    });

    if (fieldsToAudit.length > 0) {
      await prisma.auditLog.createMany({
        data: fieldsToAudit.map((f) => ({
          entityType: "Assignment",
          entityId: parseInt(id),
          field: f.field,
          oldValue: f.old,
          newValue: f.new,
          timestamp: new Date(),
        })),
      });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update assignment" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.assignment.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete assignment" }, { status: 500 });
  }
}
