import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: { assignments: true },
      orderBy: { name: "asc" },
    });

    const headers = [
      "id",
      "name",
      "studentId",
      "course",
      "notes",
      "avgGrade",
      "totalAssignments",
      "pendingAssignments",
    ];
    const rows = students.map((s) => {
      const graded = s.assignments.filter(
        (a) => a.status === "GRADED" && a.gradeValue != null
      );
      const avg =
        graded.length > 0
          ? graded.reduce((sum, a) => sum + (a.gradeValue ?? 0), 0) / graded.length
          : null;
      const pending = s.assignments.filter((a) =>
        ["PENDING", "LATE", "INCOMPLETE"].includes(a.status)
      ).length;
      return [
        escapeCSV(s.id),
        escapeCSV(s.name),
        escapeCSV(s.studentId),
        escapeCSV(s.course),
        escapeCSV(s.notes),
        avg != null ? escapeCSV(avg.toFixed(2)) : "",
        escapeCSV(s.assignments.length),
        escapeCSV(pending),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="students.csv"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
