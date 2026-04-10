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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NewSubjectInline from "@/components/subjects/NewSubjectInline";
import { Plus, Trash2 } from "lucide-react";

const NO_CATEGORY_VALUE = "NONE";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Category {
  id: number;
  name: string;
}

interface RubricRow {
  name: string;
  score: string;
  maxScore: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [rubricMode, setRubricMode] = useState(false);
  const [rubricRows, setRubricRows] = useState<RubricRow[]>([
    { name: "", score: "", maxScore: "" },
  ]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subjectId: "",
    categoryId: NO_CATEGORY_VALUE,
    type: "ASSIGNMENT",
    status: "PENDING",
    gradeValue: "",
    dueDate: "",
    completedAt: "",
    habitStatus: "NOT_YET",
    effortMinutes: "",
  });

  useEffect(() => {
    if (open) {
      fetch("/api/subjects")
        .then((r) => r.json())
        .then(setSubjects)
        .catch(() => {});
      fetch("/api/categories")
        .then((r) => r.json())
        .then(setCategories)
        .catch(() => {});
    }
  }, [open]);

  function handleSubjectCreated(subject: Subject) {
    setSubjects((prev) => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, subjectId: String(subject.id) }));
  }

  const rubricTotal =
    rubricMode && rubricRows.some((r) => r.maxScore !== "")
      ? (() => {
          const totalScore = rubricRows.reduce((s, r) => s + (parseFloat(r.score) || 0), 0);
          const totalMax = rubricRows.reduce((s, r) => s + (parseFloat(r.maxScore) || 0), 0);
          return totalMax > 0 ? (totalScore / totalMax) * 100 : null;
        })()
      : null;

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
          categoryId:
            form.categoryId !== NO_CATEGORY_VALUE ? parseInt(form.categoryId) : null,
          gradeValue:
            !rubricMode && form.gradeValue !== "" ? parseFloat(form.gradeValue) : null,
          completedAt: form.completedAt || null,
          effortMinutes: form.effortMinutes !== "" ? parseInt(form.effortMinutes) : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Error al crear la tarea");
        return;
      }
      const newAssignment = await res.json();
      if (rubricMode && rubricRows.some((r) => r.name.trim())) {
        const validRows = rubricRows.filter((r) => r.name.trim());
        await fetch(`/api/assignments/${newAssignment.id}/rubric`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rubricItems: validRows.map((r) => ({
              name: r.name,
              score: parseFloat(r.score) || 0,
              maxScore: parseFloat(r.maxScore) || 0,
            })),
          }),
        });
      }
      setForm({
        title: "",
        description: "",
        subjectId: "",
        categoryId: NO_CATEGORY_VALUE,
        type: "ASSIGNMENT",
        status: "PENDING",
        gradeValue: "",
        dueDate: "",
        completedAt: "",
        habitStatus: "NOT_YET",
        effortMinutes: "",
      });
      setRubricMode(false);
      setRubricRows([{ name: "", score: "", maxScore: "" }]);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              placeholder="Ej. Examen de álgebra"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-desc">Descripción</Label>
            <Textarea
              id="a-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Instrucciones o notas adicionales…"
              rows={2}
              className="resize-none"
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
            <NewSubjectInline onCreated={handleSubjectCreated} />
          </div>
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Select
              value={form.categoryId}
              onValueChange={(v) => setForm({ ...form, categoryId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>Sin categoría</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
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
                  <SelectItem value="ASSIGNMENT">📝 Tarea</SelectItem>
                  <SelectItem value="EXAM">📋 Examen</SelectItem>
                  <SelectItem value="DELIVERY">📦 Entrega</SelectItem>
                  <SelectItem value="OTHER">🔖 Otro</SelectItem>
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
                  <SelectItem value="PENDING">⏳ Pendiente</SelectItem>
                  <SelectItem value="SUBMITTED">📤 Entregada</SelectItem>
                  <SelectItem value="DONE">✔️ Hecho</SelectItem>
                  <SelectItem value="GRADED">✅ Calificada</SelectItem>
                  <SelectItem value="LATE">⚠️ Tardía</SelectItem>
                  <SelectItem value="RESUBMITTED">🔄 Reenviada</SelectItem>
                  <SelectItem value="EXEMPT">🚫 Exenta</SelectItem>
                  <SelectItem value="INCOMPLETE">❌ Incompleta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="a-due">Fecha objetivo *</Label>
            <Input
              id="a-due"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="a-completed">Fecha real</Label>
              <Input
                id="a-completed"
                type="date"
                value={form.completedAt}
                onChange={(e) => setForm({ ...form, completedAt: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="a-effort">Esfuerzo (min)</Label>
              <Input
                id="a-effort"
                type="number"
                min="0"
                step="1"
                value={form.effortMinutes}
                onChange={(e) => setForm({ ...form, effortMinutes: e.target.value })}
                placeholder="Ej. 60"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Hábito</Label>
            <Select
              value={form.habitStatus}
              onValueChange={(v) => setForm({ ...form, habitStatus: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NOT_YET">Sin hábito</SelectItem>
                <SelectItem value="IN_PROGRESS">Mejorando</SelectItem>
                <SelectItem value="ACQUIRED">Adquirido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Calificación</Label>
              <div className="flex gap-1 ml-auto">
                <button
                  type="button"
                  onClick={() => setRubricMode(false)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    !rubricMode
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  Simple
                </button>
                <button
                  type="button"
                  onClick={() => setRubricMode(true)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    rubricMode
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)]"
                  }`}
                >
                  Rúbrica
                </button>
              </div>
            </div>
            {!rubricMode ? (
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.gradeValue}
                onChange={(e) => setForm({ ...form, gradeValue: e.target.value })}
                placeholder="Nota (0–100, opcional)"
              />
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_80px_80px_32px] gap-1 text-xs text-[var(--muted-foreground)] px-1">
                  <span>Criterio</span>
                  <span className="text-center">Ptos.</span>
                  <span className="text-center">Máx.</span>
                  <span />
                </div>
                {rubricRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_80px_32px] gap-1">
                    <Input
                      placeholder="Criterio"
                      value={row.name}
                      onChange={(e) => {
                        const r = [...rubricRows];
                        r[i] = { ...r[i], name: e.target.value };
                        setRubricRows(r);
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={row.score}
                      onChange={(e) => {
                        const r = [...rubricRows];
                        r[i] = { ...r[i], score: e.target.value };
                        setRubricRows(r);
                      }}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="10"
                      value={row.maxScore}
                      onChange={(e) => {
                        const r = [...rubricRows];
                        r[i] = { ...r[i], maxScore: e.target.value };
                        setRubricRows(r);
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-500 px-1"
                      onClick={() => setRubricRows(rubricRows.filter((_, j) => j !== i))}
                      disabled={rubricRows.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setRubricRows([...rubricRows, { name: "", score: "", maxScore: "" }])
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Añadir criterio
                </Button>
                {rubricTotal != null && (
                  <p className="text-sm font-medium text-center">
                    Total: {rubricTotal.toFixed(1)}%
                  </p>
                )}
              </div>
            )}
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

