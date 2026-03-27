import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        student: true,
        subject: true,
      },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, type, status, gradeValue, dueDate, studentId, subjectId } = body;
    if (!title || !dueDate || !studentId || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const assignment = await prisma.assignment.create({
      data: {
        title,
        type: type ?? "ASSIGNMENT",
        status: status ?? "PENDING",
        gradeValue: gradeValue != null ? parseFloat(gradeValue) : null,
        dueDate: new Date(dueDate),
        studentId: parseInt(studentId),
        subjectId: parseInt(subjectId),
      },
      include: { subject: true, student: true },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
