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
      if (!row.name?.trim()) {
        errors.push({ row: rowNum, error: "name is required" });
        return;
      }
      if (!row.studentid?.trim()) {
        errors.push({ row: rowNum, error: "studentId is required" });
        return;
      }
      if (!row.course?.trim()) {
        errors.push({ row: rowNum, error: "course is required" });
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
        await prisma.student.upsert({
          where: { studentId: row.studentid },
          update: { name: row.name, course: row.course, notes: row.notes ?? "" },
          create: {
            name: row.name,
            studentId: row.studentid,
            course: row.course,
            notes: row.notes ?? "",
          },
        });
        imported++;
      } catch (e) {
        importErrors.push({ row: i + 2, error: String(e) });
      }
    }

    return NextResponse.json({ imported, errors: importErrors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to import students" }, { status: 500 });
  }
}
