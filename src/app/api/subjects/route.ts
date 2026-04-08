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
    const subject = await prisma.subject.create({ data: { name: name.trim(), code: code.trim().toUpperCase() } });
    return NextResponse.json(subject, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    const msg = error instanceof Error && error.message.includes("Unique constraint")
      ? "Ya existe una asignatura con ese código"
      : "Error al crear la asignatura";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
