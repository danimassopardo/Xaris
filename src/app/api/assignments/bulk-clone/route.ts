import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/assignments/bulk-clone
// Body: { sourceAssignmentId, course } — clones the assignment for every student in the given course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceAssignmentId, course } = body;
    if (!sourceAssignmentId || !course) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const source = await prisma.assignment.findUnique({
      where: { id: parseInt(sourceAssignmentId) },
    });
    if (!source) {
      return NextResponse.json({ error: "Source assignment not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { course },
      select: { id: true },
    });
    if (students.length === 0) {
      return NextResponse.json({ error: "No students found in this course" }, { status: 404 });
    }

    const created = await prisma.$transaction(
      students.map((s: { id: number }) =>
        prisma.assignment.create({
          data: {
            title: source.title,
            description: source.description,
            type: source.type,
            status: "PENDING",
            gradeValue: null,
            feedback: "",
            dueDate: source.dueDate,
            studentId: s.id,
            subjectId: source.subjectId,
          },
        })
      )
    );

    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to clone assignment" }, { status: 500 });
  }
}
