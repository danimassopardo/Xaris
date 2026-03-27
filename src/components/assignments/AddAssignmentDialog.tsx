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

interface AddAssignmentDialogProps {
  studentId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddAssignmentDialog({
  studentId,
  open,
  onOpenChange,
}: AddAssignmentDialogProps) {
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
    if (open) {
      fetch("/api/subjects")
        .then((r) => r.json())
        .then(setSubjects)
        .catch(() => {});
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          studentId,
          gradeValue: form.gradeValue !== "" ? parseFloat(form.gradeValue) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear la tarea");
        return;
      }
      setForm({ title: "", subjectId: "", type: "ASSIGNMENT", status: "PENDING", gradeValue: "", dueDate: "" });
      onOpenChange(false);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Tarea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="a-title">Título *</Label>
            <Input
              id="a-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Asignatura *</Label>
            <Select
              value={form.subjectId}
              onValueChange={(v) => setForm({ ...form, subjectId: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar asignatura…" />
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
              <Label>Tipo *</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASSIGNMENT">Tarea</SelectItem>
                  <SelectItem value="EXAM">Examen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Estado *</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="SUBMITTED">Entregada</SelectItem>
                  <SelectItem value="GRADED">Calificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="a-grade">Nota (0–100)</Label>
              <Input
                id="a-grade"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.gradeValue}
                onChange={(e) => setForm({ ...form, gradeValue: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="a-due">Fecha de entrega *</Label>
              <Input
                id="a-due"
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
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading || !form.subjectId}>
              {loading ? "Añadiendo..." : "Añadir Tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
