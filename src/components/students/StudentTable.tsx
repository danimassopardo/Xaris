"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Edit, Trash2, Eye, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddStudentDialog from "./AddStudentDialog";
import EditStudentDialog from "./EditStudentDialog";
import { getAverageGrade, getPendingCount, getGradeColor } from "@/lib/utils";

interface Assignment {
  id: number;
  status: string;
  gradeValue: number | null;
}

interface Student {
  id: number;
  name: string;
  studentId: string;
  course: string;
  notes: string;
  assignments: Assignment[];
}

interface StudentTableProps {
  students: Student[];
}

type SortOption = "name" | "urgency" | "grade";

function PerformanceBadge({ avg }: { avg: number | null }) {
  if (avg === null)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <span className="h-2 w-2 rounded-full bg-gray-400" />
        Sin datos
      </span>
    );
  if (avg >= 85)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Sobresaliente
      </span>
    );
  if (avg >= 60)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        Aprobado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      En riesgo
    </span>
  );
}

export default function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [sort, setSort] = useState<SortOption>("name");
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar este estudiante? También se eliminarán todas sus tareas.")) return;
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setDeleteError("No se pudo eliminar el estudiante. Inténtalo de nuevo.");
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to delete student:", err);
      setDeleteError("Error de red al eliminar el estudiante.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(student: Student) {
    setEditStudent(student);
    setEditOpen(true);
  }

  const filtered = students
    .filter((s) => {
      const q = search.toLowerCase();
      if (!s.name.toLowerCase().includes(q) && !s.studentId.toLowerCase().includes(q)) return false;
      if (filterLow) {
        const avg = getAverageGrade(s.assignments);
        if (avg === null || avg >= 70) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "urgency") return getPendingCount(b.assignments) - getPendingCount(a.assignments);
      if (sort === "grade") {
        const ga = getAverageGrade(a.assignments) ?? -1;
        const gb = getAverageGrade(b.assignments) ?? -1;
        return ga - gb;
      }
      return 0;
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Buscar por nombre o ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-48">
            <ChevronDown className="h-3.5 w-3.5 mr-1 opacity-50" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Ordenar: Por Nombre</SelectItem>
            <SelectItem value="urgency">Ordenar: Por Urgencia</SelectItem>
            <SelectItem value="grade">Ordenar: Por Nota</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={filterLow ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLow(!filterLow)}
        >
          Nota &lt; 70%
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir Estudiante
        </Button>
      </div>

      {deleteError && (
        <p className="text-sm text-red-500">{deleteError}</p>
      )}
      <div className="rounded-md border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Nombre</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">ID Estudiante</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Curso</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Rendimiento</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Nota Media</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Pendientes</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-[var(--muted-foreground)]"
                >
                  No se encontraron estudiantes.
                </td>
              </tr>
            )}
            {filtered.map((s) => {
              const avg = getAverageGrade(s.assignments);
              const pending = getPendingCount(s.assignments);
              return (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
                >
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 text-[var(--muted-foreground)]">{s.studentId}</td>
                  <td className="px-3 py-2">{s.course}</td>
                  <td className="px-3 py-2">
                    <PerformanceBadge avg={avg} />
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${getGradeColor(avg)}`}>
                    {avg !== null ? `${avg.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {pending > 0 ? (
                      <Badge variant={pending > 3 ? "destructive" : "warning"}>
                        {pending}
                      </Badge>
                    ) : (
                      <span className="text-[var(--muted-foreground)]">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/students/${s.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(s)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        disabled={deletingId === s.id}
                        onClick={() => handleDelete(s.id)}
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

      <AddStudentDialog open={addOpen} onOpenChange={setAddOpen} />
      <EditStudentDialog
        student={editStudent}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
