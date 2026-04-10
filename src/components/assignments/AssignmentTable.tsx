"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, AlertCircle, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddAssignmentDialog from "./AddAssignmentDialog";
import EditAssignmentDialog from "./EditAssignmentDialog";
import CloneAssignmentDialog from "./CloneAssignmentDialog";
import { formatDate, getGradeColor, isOverdue, getRowColorByStatus } from "@/lib/utils";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  id: number;
  title: string;
  description?: string;
  feedback?: string;
  type: string;
  status: string;
  gradeValue: number | null;
  dueDate: string | Date;
  completedAt?: string | Date | null;
  habitStatus?: string | null;
  effortMinutes?: number | null;
  subjectId: number;
  categoryId?: number | null;
  subject: Subject;
}

interface AssignmentTableProps {
  studentId: number;
  studentCourse: string;
  assignments: Assignment[];
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

const HABIT_OPTIONS = [
  { value: "NOT_YET", label: "Sin hábito" },
  { value: "IN_PROGRESS", label: "Mejorando" },
  { value: "ACQUIRED", label: "Adquirido" },
];

export default function AssignmentTable({ studentId, studentCourse, assignments }: AssignmentTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cloneAssignment, setCloneAssignment] = useState<Assignment | null>(null);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [markingId, setMarkingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError("No se pudo eliminar la tarea. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      setDeleteError("Error de red al eliminar la tarea.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(a: Assignment) {
    setEditAssignment(a);
    setEditOpen(true);
  }

  function handleClone(a: Assignment) {
    setCloneAssignment(a);
    setCloneOpen(true);
  }

  async function handleMarkDone(a: Assignment) {
    setMarkingId(a.id);
    const newStatus = a.type === "DELIVERY" || a.type === "ASSIGNMENT" ? "SUBMITTED" : "DONE";
    const today = new Date().toISOString().split("T")[0];
    try {
      await fetch(`/api/assignments/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: a.title,
          description: a.description ?? "",
          feedback: a.feedback ?? "",
          type: a.type,
          status: newStatus,
          gradeValue: a.gradeValue,
          dueDate: new Date(a.dueDate).toISOString().split("T")[0],
          subjectId: a.subjectId,
          categoryId: a.categoryId ?? null,
          completedAt: today,
          habitStatus: a.habitStatus ?? "NOT_YET",
          effortMinutes: a.effortMinutes ?? null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to mark done:", err);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkLate(a: Assignment) {
    setMarkingId(a.id);
    try {
      await fetch(`/api/assignments/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: a.title,
          description: a.description ?? "",
          feedback: a.feedback ?? "",
          type: a.type,
          status: "LATE",
          gradeValue: a.gradeValue,
          dueDate: new Date(a.dueDate).toISOString().split("T")[0],
          subjectId: a.subjectId,
          categoryId: a.categoryId ?? null,
          completedAt: a.completedAt ? new Date(a.completedAt).toISOString().split("T")[0] : null,
          habitStatus: a.habitStatus ?? "NOT_YET",
          effortMinutes: a.effortMinutes ?? null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to mark late:", err);
    } finally {
      setMarkingId(null);
    }
  }

  async function handleHabitChange(a: Assignment, newHabit: string) {
    try {
      await fetch(`/api/assignments/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: a.title,
          description: a.description ?? "",
          feedback: a.feedback ?? "",
          type: a.type,
          status: a.status,
          gradeValue: a.gradeValue,
          dueDate: new Date(a.dueDate).toISOString().split("T")[0],
          subjectId: a.subjectId,
          categoryId: a.categoryId ?? null,
          completedAt: a.completedAt ? new Date(a.completedAt).toISOString().split("T")[0] : null,
          habitStatus: newHabit,
          effortMinutes: a.effortMinutes ?? null,
        }),
      });
      router.refresh();
    } catch (err) {
      console.error("Failed to update habit:", err);
    }
  }

  const FINAL_STATUSES = ["SUBMITTED", "DONE", "GRADED", "EXEMPT"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tareas</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir Tarea
        </Button>
      </div>
      {deleteError && (
        <p className="text-sm text-red-500">{deleteError}</p>
      )}
      <div className="rounded-md border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Título</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Asignatura</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Estado</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Nota</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Fecha objetivo</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Fecha real</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Hábito</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-[var(--muted-foreground)]">
                  No hay tareas aún.
                </td>
              </tr>
            )}
            {assignments.map((a) => {
              const overdue = isOverdue(a.dueDate, a.status);
              const rowColor = getRowColorByStatus(a.status, overdue);
              const isFinal = FINAL_STATUSES.includes(a.status);
              return (
                <tr
                  key={a.id}
                  className={`border-b border-[var(--border)] last:border-0 hover:brightness-95 transition-colors ${rowColor}`}
                >
                  <td className="px-3 py-2">
                    <div className="font-medium flex items-center gap-1">
                      {overdue && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                      {typeBadge(a.type)}
                      <span className="ml-1">{a.title}</span>
                    </div>
                    {a.description && (
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-1">{a.description}</p>
                    )}
                    {a.feedback && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 line-clamp-1 italic">
                        💬 {a.feedback}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span title={a.subject.name} className="text-[var(--muted-foreground)] cursor-help">
                      {a.subject.code}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {statusBadge(a.status, overdue)}
                    {overdue && !isFinal && (
                      <button
                        className="ml-1 text-xs text-orange-600 hover:underline"
                        disabled={markingId === a.id}
                        onClick={() => handleMarkLate(a)}
                      >
                        → Tardía
                      </button>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${getGradeColor(a.gradeValue)}`}>
                    {a.gradeValue != null ? `${a.gradeValue}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">
                    {formatDate(a.dueDate)}
                  </td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">
                    {a.completedAt ? formatDate(a.completedAt) : <span className="text-xs italic">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={a.habitStatus ?? "NOT_YET"}
                      onChange={(e) => handleHabitChange(a, e.target.value)}
                      aria-label="Estado de hábito"
                      className="text-xs border border-[var(--border)] rounded px-1.5 py-0.5 bg-transparent cursor-pointer"
                    >
                      {HABIT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      {!isFinal && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title={a.type === "EXAM" ? "Marcar como hecho" : "Marcar como entregado"}
                          disabled={markingId === a.id}
                          onClick={() => handleMarkDone(a)}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Clonar para curso"
                        onClick={() => handleClone(a)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(a)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        disabled={deletingId === a.id}
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <AddAssignmentDialog
        studentId={studentId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      <EditAssignmentDialog
        assignment={editAssignment}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {cloneAssignment && (
        <CloneAssignmentDialog
          assignmentId={cloneAssignment.id}
          assignmentTitle={cloneAssignment.title}
          currentCourse={studentCourse}
          open={cloneOpen}
          onOpenChange={setCloneOpen}
        />
      )}
    </div>
  );
}
