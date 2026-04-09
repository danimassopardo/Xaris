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
      include: { subject: true, student: true },
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
    const { title, description, type, status, gradeValue, dueDate, subjectId, feedback } = body;
    if (!title || !dueDate || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description: description ?? "",
        type,
        status,
        gradeValue: gradeValue != null && gradeValue !== "" ? parseFloat(gradeValue) : null,
        feedback: feedback ?? "",
        dueDate: new Date(dueDate),
        subjectId: parseInt(subjectId),
      },
      include: { subject: true, student: true },
    });
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
