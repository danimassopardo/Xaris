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

export default function StudentTable({ students }: StudentTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterLow, setFilterLow] = useState(false);
  const [sort, setSort] = useState<SortOption>("name");
  const [addOpen, setAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this student? All their assignments will also be deleted.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/students/${id}`, { method: "DELETE" });
      router.refresh();
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
            placeholder="Search by name or ID…"
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
            <SelectItem value="name">Sort: By Name</SelectItem>
            <SelectItem value="urgency">Sort: By Urgency</SelectItem>
            <SelectItem value="grade">Sort: By Grade</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={filterLow ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterLow(!filterLow)}
        >
          Grade &lt; 70%
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Student
        </Button>
      </div>

      <div className="rounded-md border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Name</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Student ID</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Course</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Avg Grade</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Pending</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-[var(--muted-foreground)]"
                >
                  No students found.
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
