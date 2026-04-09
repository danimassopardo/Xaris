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
    const assignments = await prisma.assignment.findMany({
      include: { student: true, subject: true, category: true, rubricItems: true },
      orderBy: { dueDate: "asc" },
    });

    const headers = [
      "id",
      "title",
      "type",
      "status",
      "gradeValue",
      "rubricTotal",
      "dueDate",
      "studentName",
      "studentId",
      "subjectCode",
      "subjectName",
      "category",
      "feedback",
    ];
    const rows = assignments.map((a) => {
      let rubricTotal = "";
      if (a.rubricItems.length > 0) {
        const totalScore = a.rubricItems.reduce((s, r) => s + r.score, 0);
        const totalMax = a.rubricItems.reduce((s, r) => s + r.maxScore, 0);
        rubricTotal = totalMax > 0 ? ((totalScore / totalMax) * 100).toFixed(2) : "";
      }
      return [
        escapeCSV(a.id),
        escapeCSV(a.title),
        escapeCSV(a.type),
        escapeCSV(a.status),
        a.gradeValue != null ? escapeCSV(a.gradeValue) : "",
        rubricTotal,
        escapeCSV(new Date(a.dueDate).toISOString()),
        escapeCSV(a.student.name),
        escapeCSV(a.student.studentId),
        escapeCSV(a.subject.code),
        escapeCSV(a.subject.name),
        escapeCSV(a.category?.name ?? ""),
        escapeCSV(a.feedback),
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="assignments.csv"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
