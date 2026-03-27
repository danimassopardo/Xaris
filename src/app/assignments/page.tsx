import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { formatDate, getGradeColor } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

function statusBadge(status: string) {
  if (status === "PENDING") return <Badge variant="warning">Pendiente</Badge>;
  if (status === "SUBMITTED") return <Badge variant="info">Entregada</Badge>;
  if (status === "GRADED") return <Badge variant="success">Calificada</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function typeBadge(type: string) {
  if (type === "EXAM") return <Badge variant="purple">Examen</Badge>;
  return <Badge variant="indigo">Tarea</Badge>;
}

export default async function AssignmentsPage() {
  const assignments = await prisma.assignment.findMany({
    include: { student: true, subject: true },
    orderBy: { dueDate: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">Tareas</h1>
        <span className="ml-auto text-sm text-[var(--muted-foreground)]">
          {assignments.length} en total
        </span>
      </div>
      <div className="rounded-md border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Título</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Estudiante</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Asignatura</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Estado</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Nota</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Fecha de entrega</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--muted-foreground)]">
                  No hay tareas aún.
                </td>
              </tr>
            )}
            {assignments.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
              >
                <td className="px-3 py-2 font-medium">{a.title}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/students/${a.student.id}`}
                    className="text-[var(--primary)] hover:underline"
                  >
                    {a.student.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-[var(--muted-foreground)]">{a.subject.code}</td>
                <td className="px-3 py-2">{typeBadge(a.type)}</td>
                <td className="px-3 py-2">{statusBadge(a.status)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${getGradeColor(a.gradeValue)}`}>
                  {a.gradeValue != null ? `${a.gradeValue}%` : "—"}
                </td>
                <td className="px-3 py-2 text-[var(--muted-foreground)]">
                  {formatDate(a.dueDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
