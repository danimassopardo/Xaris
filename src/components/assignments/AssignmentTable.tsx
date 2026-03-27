"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddAssignmentDialog from "./AddAssignmentDialog";
import EditAssignmentDialog from "./EditAssignmentDialog";
import { formatDate, getGradeColor } from "@/lib/utils";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Assignment {
  id: number;
  title: string;
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

function statusBadge(status: string) {
  if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
  if (status === "SUBMITTED") return <Badge variant="info">Submitted</Badge>;
  if (status === "GRADED") return <Badge variant="success">Graded</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function typeBadge(type: string) {
  if (type === "EXAM") return <Badge variant="purple">Exam</Badge>;
  return <Badge variant="indigo">Assignment</Badge>;
}

export default function AssignmentTable({ studentId, assignments }: AssignmentTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!confirm("Delete this assignment?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      router.refresh();
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
        <h2 className="text-lg font-semibold">Assignments</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Assignment
        </Button>
      </div>
      <div className="rounded-md border border-[var(--border)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Title</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Subject</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Type</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Status</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Grade</th>
              <th className="px-3 py-2 text-left font-medium text-[var(--muted-foreground)]">Due Date</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--muted-foreground)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-[var(--muted-foreground)]">
                  No assignments yet.
                </td>
              </tr>
            )}
            {assignments.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/50"
              >
                <td className="px-3 py-2 font-medium">{a.title}</td>
                <td className="px-3 py-2 text-[var(--muted-foreground)]">
                  {a.subject.code}
                </td>
                <td className="px-3 py-2">{typeBadge(a.type)}</td>
                <td className="px-3 py-2">{statusBadge(a.status)}</td>
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
            ))}
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
