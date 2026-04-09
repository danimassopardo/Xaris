import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAverageGrade, getGradeColor, getPendingCount, getAverageBySubject } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import AssignmentTable from "@/components/assignments/AssignmentTable";
import StudentProfileActions from "@/components/students/StudentProfileActions";
import { ChevronLeft, GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id: parseInt(id) },
    include: {
      assignments: {
        include: { subject: true },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!student) notFound();

  const avg = getAverageGrade(student.assignments);
  const pending = getPendingCount(student.assignments);
  const graded = student.assignments.filter((a) => a.status === "GRADED").length;
  const subjectAverages = getAverageBySubject(student.assignments);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Estudiantes
          </Link>
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[var(--accent)] p-3">
            <GraduationCap className="h-6 w-6 text-[var(--accent-foreground)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">
              {student.studentId} · {student.course}
            </p>
          </div>
        </div>
        <StudentProfileActions student={student} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold ${getGradeColor(avg)}`}>
              {avg !== null ? `${avg.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Nota Media</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{student.assignments.length}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className={`text-2xl font-bold ${pending > 3 ? "text-red-600" : "text-amber-600"}`}>
              {pending}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{graded}</p>
            <p className="text-xs text-[var(--muted-foreground)]">Calificadas</p>
          </CardContent>
        </Card>
      </div>

      {student.notes && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-[var(--muted-foreground)]">Notas</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm">{student.notes}</p>
          </CardContent>
        </Card>
      )}

      {subjectAverages.length > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-[var(--muted-foreground)]">Nota media por asignatura</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjectAverages.map((s) => (
                <div
                  key={s.subjectId}
                  className="rounded-md border border-[var(--border)] p-2 text-center"
                >
                  <p className={`text-lg font-bold ${getGradeColor(s.avg)}`}>
                    {s.avg !== null ? `${s.avg.toFixed(1)}%` : "—"}
                  </p>
                  <p className="text-xs font-medium truncate" title={s.name}>{s.code}</p>
                  <p className="text-xs text-[var(--muted-foreground)] truncate" title={s.name}>{s.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <AssignmentTable studentId={student.id} studentCourse={student.course} assignments={student.assignments} />
    </div>
  );
}
