import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const assignments = await prisma.assignment.findMany({
      where: { studentId: parseInt(id) },
      include: { subject: true, category: true, rubricItems: true },
      orderBy: { dueDate: "asc" },
    });

    const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];
    const categoryWeights = await prisma.categoryWeight.findMany({
      include: { category: true, subject: true },
    });

    type SubjectSummary = {
      subjectId: number;
      subjectName: string;
      subjectCode: string;
      assignments: typeof assignments;
      weightedAvg: number | null;
      simpleAvg: number | null;
    };

    const subjectSummaries: SubjectSummary[] = subjectIds.map((subjectId) => {
      const subjectAssignments = assignments.filter((a) => a.subjectId === subjectId);
      const subject = subjectAssignments[0]?.subject;
      const graded = subjectAssignments.filter(
        (a) => a.status === "GRADED" && a.gradeValue != null
      );
      const simpleAvg =
        graded.length > 0
          ? graded.reduce((s, a) => s + (a.gradeValue ?? 0), 0) / graded.length
          : null;

      const categoryMap = new Map<string, { sum: number; count: number }>();
      for (const a of graded) {
        const catName = a.category?.name ?? "__uncategorized__";
        const entry = categoryMap.get(catName) ?? { sum: 0, count: 0 };
        entry.sum += a.gradeValue ?? 0;
        entry.count++;
        categoryMap.set(catName, entry);
      }

      let weightedSum = 0;
      let totalWeight = 0;
      for (const [catName, { sum, count }] of categoryMap) {
        const avg = sum / count;
        const specific = categoryWeights.find(
          (w) => w.category.name === catName && w.subjectId === subjectId
        );
        const global = categoryWeights.find(
          (w) => w.category.name === catName && w.subjectId == null
        );
        const wt = specific?.weight ?? global?.weight;
        if (wt != null) {
          weightedSum += wt * avg;
          totalWeight += wt;
        }
      }
      const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : simpleAvg;

      return {
        subjectId,
        subjectName: subject?.name ?? "",
        subjectCode: subject?.code ?? "",
        assignments: subjectAssignments,
        weightedAvg,
        simpleAvg,
      };
    });

    const allGraded = assignments.filter(
      (a) => a.status === "GRADED" && a.gradeValue != null
    );
    const overallSimpleAvg =
      allGraded.length > 0
        ? allGraded.reduce((s, a) => s + (a.gradeValue ?? 0), 0) / allGraded.length
        : null;
    const validSummaries = subjectSummaries.filter((s) => s.weightedAvg != null);
    const overallWeightedAvg =
      validSummaries.length > 0
        ? validSummaries.reduce((sum, s) => sum + (s.weightedAvg ?? 0), 0) /
          validSummaries.length
        : overallSimpleAvg;

    const atRiskCount = assignments.filter((a) =>
      ["PENDING", "LATE", "INCOMPLETE"].includes(a.status)
    ).length;

    return NextResponse.json({
      student,
      assignments,
      subjectSummaries,
      overallWeightedAvg,
      atRiskCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
