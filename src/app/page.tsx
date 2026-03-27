import { prisma } from "@/lib/prisma";
import { getPendingCount } from "@/lib/utils";
import CalendarWidget from "@/components/dashboard/CalendarWidget";
import AtRiskWidget from "@/components/dashboard/AtRiskWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, Calendar, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const weekLater = new Date(now);
  weekLater.setDate(now.getDate() + 7);
  weekLater.setHours(23, 59, 59, 999);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const [students, upcomingAssignments, allPending] = await Promise.all([
    prisma.student.findMany({
      include: { assignments: true },
    }),
    prisma.assignment.findMany({
      where: {
        dueDate: { gte: today, lte: weekLater },
      },
      include: {
        student: true,
        subject: true,
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.assignment.count({ where: { status: "PENDING" } }),
  ]);

  const upcomingExams = upcomingAssignments.filter((a) => a.type === "EXAM").length;

  const atRiskStudents = students
    .map((s) => ({ ...s, pendingCount: getPendingCount(s.assignments) }))
    .filter((s) => s.pendingCount > 3)
    .sort((a, b) => b.pendingCount - a.pendingCount);

  const stats = [
    {
      label: "Total Students",
      value: students.length,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Assignments",
      value: allPending,
      icon: BookOpen,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Upcoming Exams",
      value: upcomingExams,
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "At-Risk Students",
      value: atRiskStudents.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        <div className="lg:col-span-4">
          <CalendarWidget assignments={upcomingAssignments} />
        </div>
        <div className="lg:col-span-3">
          <AtRiskWidget students={atRiskStudents} />
        </div>
      </div>
    </div>
  );
}
