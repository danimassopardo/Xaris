"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface NewSubjectInlineProps {
  onCreated: (subject: Subject) => void;
}

export default function NewSubjectInline({ onCreated }: NewSubjectInlineProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim() || !code.trim()) {
      setError("Nombre y código obligatorios");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear la asignatura");
        return;
      }
      onCreated(data);
      setName("");
      setCode("");
      setOpen(false);
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1 mt-1"
      >
        <Plus className="h-3 w-3" />
        Nueva asignatura
      </button>
    );
  }

  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/50 p-3 mt-1 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Nueva asignatura</span>
        <button type="button" onClick={() => setOpen(false)}>
          <X className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nombre *</Label>
          <Input
            className="h-7 text-xs"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Física"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Código *</Label>
          <Input
            className="h-7 text-xs"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej. FIS101"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button type="button" size="sm" className="h-7 text-xs" disabled={loading} onClick={handleCreate}>
        {loading ? "Creando..." : "Crear asignatura"}
      </Button>
    </div>
  );
}
