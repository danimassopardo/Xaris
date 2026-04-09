import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/dashboard/filters
// Returns counts for quick-filter buttons on the dashboard
export async function GET() {
  try {
    const now = new Date();

    // Start/end of current week (Mon–Sun)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Start/end of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [toGrade, examsThisWeek, studentsRaw] = await Promise.all([
      prisma.assignment.count({ where: { status: "SUBMITTED" } }),
      prisma.assignment.count({
        where: {
          type: "EXAM",
          dueDate: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.student.findMany({
        select: {
          id: true,
          assignments: {
            where: {
              status: "GRADED",
              updatedAt: { gte: monthStart, lte: monthEnd },
            },
            select: { id: true },
          },
        },
      }),
    ]);

    const studentsWithoutGradesThisMonth = studentsRaw.filter(
      (s: { id: number; assignments: { id: number }[] }) => s.assignments.length === 0
    ).length;

    return NextResponse.json({ toGrade, examsThisWeek, studentsWithoutGradesThisMonth });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch filter counts" }, { status: 500 });
  }
}
