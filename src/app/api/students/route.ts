import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        assignments: {
          include: { subject: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, studentId, course, notes } = body;
    if (!name || !studentId || !course) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const student = await prisma.student.create({
      data: { name, studentId, course, notes: notes ?? "" },
    });
    return NextResponse.json(student, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Student ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
