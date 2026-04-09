"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface ImportAssignmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportAssignmentsDialog({
  open,
  onOpenChange,
}: ImportAssignmentsDialogProps) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    valid: unknown[];
    errors: { row: number; error: string }[];
  } | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    errors: { row: number; error: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  async function handlePreview() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/import/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setPreview(data.preview);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/import/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error");
        return;
      }
      setResult(data);
      setPreview(null);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setCsv("");
    setPreview(null);
    setResult(null);
    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Tareas CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            Columnas requeridas: <code>title, dueDate, studentId, subjectCode</code>.<br />
            Opcionales:{" "}
            <code>description, type, status, gradeValue, categoryName, feedback</code>
          </p>
          <div className="space-y-1">
            <Label>CSV</Label>
            <Textarea
              value={csv}
              onChange={(e) => {
                setCsv(e.target.value);
                setPreview(null);
                setResult(null);
              }}
              placeholder={"title,dueDate,studentId,subjectCode\nMath Quiz,2025-06-01,S001,MATH101"}
              rows={6}
              className="font-mono text-xs resize-y"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {preview && (
            <div className="space-y-1 text-sm">
              <p className="text-green-600">✅ {preview.valid.length} filas válidas</p>
              {preview.errors.length > 0 && (
                <div className="text-red-500 space-y-0.5">
                  {preview.errors.map((e) => (
                    <p key={e.row}>
                      Fila {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          {result && (
            <div className="text-sm">
              <p className="text-green-600">✅ {result.imported} tareas importadas</p>
              {result.errors.length > 0 && (
                <div className="text-red-500 space-y-0.5 mt-1">
                  {result.errors.map((e) => (
                    <p key={e.row}>
                      Fila {e.row}: {e.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="flex-wrap gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </DialogClose>
          {!result && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={loading || !csv.trim()}
                onClick={handlePreview}
              >
                Vista previa
              </Button>
              {preview && preview.valid.length > 0 && (
                <Button type="button" disabled={loading} onClick={handleConfirm}>
                  <Upload className="h-4 w-4 mr-1" />
                  Confirmar importación
                </Button>
              )}
            </>
          )}
          {result && (
            <Button type="button" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
