"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddAssignmentDialog from "./AddAssignmentDialog";
import EditAssignmentDialog from "./EditAssignmentDialog";
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
  type: string;
  status: string;
  gradeValue: number | null;
  dueDate: string | Date;
  subjectId: number;
  subject: Subject;
}

interface AssignmentTableProps {
  studentId: number;
  assignments: Assignment[];
}

function statusBadge(status: string, overdue: boolean) {
  if (overdue) return <Badge variant="destructive">Vencida</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pendiente</Badge>;
  if (status === "SUBMITTED") return <Badge variant="info">Entregada</Badge>;
  if (status === "GRADED") return <Badge variant="success">Calificada</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function typeBadge(type: string) {
  if (type === "EXAM") return <Badge variant="purple">Examen</Badge>;
  return <Badge variant="indigo">Tarea</Badge>;
}

export default function AssignmentTable({ studentId, assignments }: AssignmentTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

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
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Estado</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Nota</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Fecha de entrega</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Acciones</th>
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
            {assignments.map((a) => {
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
                    <span title={a.subject.name} className="text-[var(--muted-foreground)] cursor-help">
                      {a.subject.code}
                    </span>
                  </td>
                  <td className="px-3 py-2">{typeBadge(a.type)}</td>
                  <td className="px-3 py-2">{statusBadge(a.status, overdue)}</td>
                  <td className={`px-3 py-2 text-right font-semibold ${getGradeColor(a.gradeValue)}`}>
                    {a.gradeValue != null ? `${a.gradeValue}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">
                    {formatDate(a.dueDate)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
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
    </div>
  );
}