"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CloneAssignmentDialogProps {
  assignmentId: number;
  assignmentTitle: string;
  currentCourse: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CloneAssignmentDialog({
  assignmentId,
  assignmentTitle,
  currentCourse,
  open,
  onOpenChange,
}: CloneAssignmentDialogProps) {
  const router = useRouter();
  const [course, setCourse] = useState(currentCourse);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);
    try {
      const res = await fetch("/api/assignments/bulk-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceAssignmentId: assignmentId, course }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al clonar la tarea");
        return;
      }
      setSuccess(data.created);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  function handleClose(v: boolean) {
    if (!v) {
      setError("");
      setSuccess(null);
      setCourse(currentCourse);
    }
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            Clonar tarea para curso
          </DialogTitle>
        </DialogHeader>
        {success !== null ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              ✅ Tarea &quot;{assignmentTitle}&quot; asignada a {success} estudiante
              {success !== 1 ? "s" : ""} del curso <strong>{course}</strong>.
            </p>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Se creará una copia de <strong>&quot;{assignmentTitle}&quot;</strong> para todos
              los estudiantes del curso indicado.
            </p>
            <div className="space-y-1">
              <Label htmlFor="clone-course">Curso destino *</Label>
              <Input
                id="clone-course"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="Ej. 2º DAW"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading || !course.trim()}>
                {loading ? "Clonando…" : "Clonar para el curso"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
