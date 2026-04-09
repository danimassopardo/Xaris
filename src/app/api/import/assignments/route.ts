import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csv: string) {
  const lines = csv
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

const VALID_TYPES = ["ASSIGNMENT", "EXAM"];
const VALID_STATUSES = [
  "PENDING",
  "SUBMITTED",
  "GRADED",
  "LATE",
  "RESUBMITTED",
  "EXEMPT",
  "INCOMPLETE",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csv, confirm } = body as { csv: string; confirm: boolean };
    if (!csv) return NextResponse.json({ error: "csv is required" }, { status: 400 });

    const { rows } = parseCSV(csv);
    const valid: Record<string, string>[] = [];
    const errors: { row: number; error: string }[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2;
      if (!row.title?.trim()) {
        errors.push({ row: rowNum, error: "title is required" });
        return;
      }
      if (!row.duedate?.trim()) {
        errors.push({ row: rowNum, error: "dueDate is required" });
        return;
      }
      if (!row.studentid?.trim()) {
        errors.push({ row: rowNum, error: "studentId is required" });
        return;
      }
      if (!row.subjectcode?.trim()) {
        errors.push({ row: rowNum, error: "subjectCode is required" });
        return;
      }
      if (isNaN(Date.parse(row.duedate))) {
        errors.push({ row: rowNum, error: "dueDate is not a valid date" });
        return;
      }
      if (row.type && !VALID_TYPES.includes(row.type.toUpperCase())) {
        errors.push({ row: rowNum, error: `Invalid type: ${row.type}` });
        return;
      }
      if (row.status && !VALID_STATUSES.includes(row.status.toUpperCase())) {
        errors.push({ row: rowNum, error: `Invalid status: ${row.status}` });
        return;
      }
      valid.push(row);
    });

    if (!confirm) {
      return NextResponse.json({ preview: { valid, errors } });
    }

    let imported = 0;
    const importErrors: { row: number; error: string }[] = [];

    for (let i = 0; i < valid.length; i++) {
      const row = valid[i];
      try {
        const student = await prisma.student.findUnique({
          where: { studentId: row.studentid },
        });
        if (!student) {
          importErrors.push({ row: i + 2, error: `Student not found: ${row.studentid}` });
          continue;
        }
        const subject = await prisma.subject.findUnique({
          where: { code: row.subjectcode.toUpperCase() },
        });
        if (!subject) {
          importErrors.push({ row: i + 2, error: `Subject not found: ${row.subjectcode}` });
          continue;
        }

        let categoryId: number | undefined;
        if (row.categoryname?.trim()) {
          const cat = await prisma.category.findFirst({
            where: { name: { equals: row.categoryname.trim() } },
          });
          if (cat) categoryId = cat.id;
        }

        const dueDate = new Date(row.duedate);
        const existing = await prisma.assignment.findFirst({
          where: { title: row.title, studentId: student.id, subjectId: subject.id, dueDate },
        });

        const data = {
          title: row.title,
          description: row.description ?? "",
          type: (row.type?.toUpperCase() as "ASSIGNMENT" | "EXAM") || "ASSIGNMENT",
          status: row.status?.toUpperCase() || "PENDING",
          gradeValue: row.gradevalue ? parseFloat(row.gradevalue) : null,
          feedback: row.feedback ?? "",
          dueDate,
          studentId: student.id,
          subjectId: subject.id,
          ...(categoryId != null ? { categoryId } : {}),
        };

        if (existing) {
          await prisma.assignment.update({ where: { id: existing.id }, data });
        } else {
          await prisma.assignment.create({ data });
        }
        imported++;
      } catch (e) {
        importErrors.push({ row: i + 2, error: String(e) });
      }
    }

    return NextResponse.json({ imported, errors: importErrors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to import assignments" }, { status: 500 });
  }
}
