import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(subjects);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code } = body;
    if (!name || !code) {
      return NextResponse.json({ error: "Nombre y código son obligatorios" }, { status: 400 });
    }
    const trimmedName = name.trim();
    const upperCode = code.trim().toUpperCase();
    const subject = await prisma.subject.create({ data: { name: trimmedName, code: upperCode } });
    return NextResponse.json(subject, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Ya existe una asignatura con ese código" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear la asignatura" }, { status: 500 });
  }
}
