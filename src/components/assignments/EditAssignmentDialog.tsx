"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

interface EditAssignmentDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditAssignmentDialog({
  assignment,
  open,
  onOpenChange,
}: EditAssignmentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState({
    title: "",
    subjectId: "",
    type: "ASSIGNMENT",
    status: "PENDING",
    gradeValue: "",
    dueDate: "",
  });

  useEffect(() => {
    fetch("/api/subjects")
      .then((r) => r.json())
      .then(setSubjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (assignment) {
      const d = new Date(assignment.dueDate);
      const dueStr = d.toISOString().split("T")[0];
      setForm({
        title: assignment.title,
        subjectId: String(assignment.subjectId),
        type: assignment.type,
        status: assignment.status,
        gradeValue: assignment.gradeValue != null ? String(assignment.gradeValue) : "",
        dueDate: dueStr,
      });
    }
  }, [assignment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gradeValue: form.gradeValue !== "" ? parseFloat(form.gradeValue) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update assignment");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="ea-title">Title *</Label>
            <Input
              id="ea-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Subject *</Label>
            <Select
              value={form.subjectId}
              onValueChange={(v) => setForm({ ...form, subjectId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject…" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name} ({s.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                  <SelectItem value="EXAM">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="GRADED">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="ea-grade">Grade (0–100)</Label>
              <Input
                id="ea-grade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.gradeValue}
                onChange={(e) => setForm({ ...form, gradeValue: e.target.value })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ea-due">Due Date *</Label>
              <Input
                id="ea-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !form.subjectId}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
