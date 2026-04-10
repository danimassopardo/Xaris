"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, AlertCircle, Search, Loader2, Download, Upload } from "lucide-react";
import { formatDate, getGradeColor, isOverdue, getRowColorByStatus } from "@/lib/utils";
import Link from "next/link";
import ImportAssignmentsDialog from "@/components/assignments/ImportAssignmentsDialog";

interface Assignment {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  gradeValue: number | null;
  dueDate: string;
  student: { id: number; name: string };
  subject: { id: number; name: string; code: string };
}

function statusBadge(status: string, overdue: boolean) {
  if (overdue) return <Badge variant="destructive">Vencida</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pendiente</Badge>;
  if (status === "SUBMITTED") return <Badge variant="info">Entregada</Badge>;
  if (status === "DONE") return <Badge variant="success">Hecho</Badge>;
  if (status === "GRADED") return <Badge variant="success">Calificada</Badge>;
  if (status === "LATE") return <Badge variant="warning">Tardía</Badge>;
  if (status === "RESUBMITTED") return <Badge variant="info">Reenviada</Badge>;
  if (status === "EXEMPT") return <Badge variant="secondary">Exenta</Badge>;
  if (status === "INCOMPLETE") return <Badge variant="destructive">Incompleta</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function typeBadge(type: string) {
  if (type === "EXAM") return <Badge variant="purple">Examen</Badge>;
  if (type === "DELIVERY") return <Badge variant="indigo">Entrega</Badge>;
  if (type === "OTHER") return <Badge variant="secondary">Otro</Badge>;
  return <Badge variant="indigo">Tarea</Badge>;
}

const STATUS_FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING", label: "Pendiente" },
  { value: "SUBMITTED", label: "Entregada" },
  { value: "DONE", label: "Hecho" },
  { value: "GRADED", label: "Calificada" },
  { value: "LATE", label: "Tardía" },
  { value: "RESUBMITTED", label: "Reenviada" },
  { value: "EXEMPT", label: "Exenta" },
  { value: "INCOMPLETE", label: "Incompleta" },
  { value: "OVERDUE", label: "Vencidas" },
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/assignments")
      .then((r) => r.json())
      .then(setAssignments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) => {
    if (filter !== "ALL") {
      if (filter === "OVERDUE" && !isOverdue(a.dueDate, a.status)) return false;
      if (filter !== "OVERDUE" && a.status !== filter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.title.toLowerCase().includes(q) &&
        !a.student.name.toLowerCase().includes(q) &&
        !a.subject.name.toLowerCase().includes(q) &&
        !a.subject.code.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <BookOpen className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">Tareas</h1>
        <span className="text-sm text-[var(--muted-foreground)]">
          {filtered.length} de {assignments.length} en total
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1 text-sm border border-[var(--border)] rounded-md px-3 py-1.5 hover:bg-[var(--secondary)] transition-colors"
          >
            <Upload className="h-4 w-4" />
            Importar CSV
          </button>
          <a
            href="/api/export/assignments"
            className="flex items-center gap-1 text-sm border border-[var(--border)] rounded-md px-3 py-1.5 hover:bg-[var(--secondary)] transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </a>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Buscar por título, estudiante o asignatura…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === f.value
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--foreground)]"
            }`}
          >
            {f.label}
          </button>
        ))}
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
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--muted-foreground)]">
                  No hay tareas en esta categoría.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((a) => {
                const overdue = isOverdue(a.dueDate, a.status);
                const rowColor = getRowColorByStatus(a.status, overdue);
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-[var(--border)] last:border-0 hover:brightness-95 transition-colors ${rowColor}`}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium flex items-center gap-1">
                        {overdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                        {a.title}
                      </div>
                      {a.description && (
                        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{a.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link href={`/students/${a.student.id}`} className="text-[var(--primary)] hover:underline">
                        {a.student.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span title={a.subject.name} className="text-[var(--muted-foreground)] cursor-help">
                        {a.subject.code}
                      </span>
                    </td>
                    <td className="px-3 py-2">{typeBadge(a.type)}</td>
                    <td className="px-3 py-2">{statusBadge(a.status, overdue)}</td>
                    <td className={`px-3 py-2 text-right font-semibold ${getGradeColor(a.gradeValue)}`}>
                      {a.gradeValue != null ? `${a.gradeValue}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--muted-foreground)]">{formatDate(a.dueDate)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <ImportAssignmentsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
