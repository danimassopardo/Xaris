"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Save, Plus } from "lucide-react";

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface CategoryWeight {
  id: number;
  weight: number;
  subjectId: number | null;
  subject: Subject | null;
}

interface Category {
  id: number;
  name: string;
  weights: CategoryWeight[];
}

interface CategoriesClientProps {
  categories: Category[];
  subjects: Subject[];
}

export default function CategoriesClient({
  categories: initialCategories,
  subjects,
}: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [weights, setWeights] = useState<Record<number, Record<string, string>>>(() => {
    const init: Record<number, Record<string, string>> = {};
    for (const cat of initialCategories) {
      init[cat.id] = {};
      for (const w of cat.weights) {
        const key = w.subjectId == null ? "global" : String(w.subjectId);
        init[cat.id][key] = String(w.weight);
      }
    }
    return init;
  });

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Error");
        return;
      }
      const cat = await res.json();
      setCategories((prev) => [...prev, cat]);
      setWeights((prev) => ({ ...prev, [cat.id]: {} }));
      setNewName("");
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    } catch {
      alert("Error al eliminar");
    }
  }

  async function handleRenameCategory(id: number) {
    const name = editNames[id];
    if (!name?.trim()) return;
    try {
      await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c))
      );
      setEditNames((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
      router.refresh();
    } catch {
      alert("Error al renombrar");
    }
  }

  async function handleSaveWeights(categoryId: number) {
    setSavingId(categoryId);
    try {
      const catWeights = weights[categoryId] ?? {};
      const payload = Object.entries(catWeights)
        .filter(([, v]) => v !== "")
        .map(([key, value]) => ({
          subjectId: key === "global" ? null : parseInt(key),
          weight: parseFloat(value) || 0,
        }));
      await fetch(`/api/categories/${categoryId}/weights`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights: payload }),
      });
      router.refresh();
    } catch {
      alert("Error al guardar pesos");
    } finally {
      setSavingId(null);
    }
  }

  function setWeight(categoryId: number, key: string, value: string) {
    setWeights((prev) => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] ?? {}), [key]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nueva Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la categoría…"
              className="flex-1"
            />
            <Button type="submit" disabled={adding || !newName.trim()}>
              <Plus className="h-4 w-4 mr-1" />
              Añadir
            </Button>
          </form>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </CardContent>
      </Card>

      {categories.length === 0 && (
        <p className="text-sm text-[var(--muted-foreground)]">
          No hay categorías. Añade una arriba.
        </p>
      )}

      {categories.map((cat) => (
        <Card key={cat.id}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {editNames[cat.id] !== undefined ? (
                <>
                  <Input
                    value={editNames[cat.id]}
                    onChange={(e) =>
                      setEditNames((p) => ({ ...p, [cat.id]: e.target.value }))
                    }
                    className="flex-1 h-8 text-sm font-medium"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRenameCategory(cat.id)}
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setEditNames((p) => {
                        const n = { ...p };
                        delete n[cat.id];
                        return n;
                      })
                    }
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <CardTitle className="flex-1">{cat.name}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditNames((p) => ({ ...p, [cat.id]: cat.name }))}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-[var(--muted-foreground)]">
                Pesos de la categoría (%)
              </Label>
              <div className="grid grid-cols-[auto_100px] gap-x-3 gap-y-1.5 items-center">
                <span className="text-sm font-medium">Global (todas las asignaturas)</span>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={weights[cat.id]?.["global"] ?? ""}
                  onChange={(e) => setWeight(cat.id, "global", e.target.value)}
                  placeholder="0"
                  className="h-7 text-sm"
                />
                {subjects.map((s) => (
                  <React.Fragment key={s.id}>
                    <span className="text-sm">
                      {s.name} ({s.code})
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={weights[cat.id]?.[String(s.id)] ?? ""}
                      onChange={(e) => setWeight(cat.id, String(s.id), e.target.value)}
                      placeholder="—"
                      className="h-7 text-sm"
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleSaveWeights(cat.id)}
              disabled={savingId === cat.id}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {savingId === cat.id ? "Guardando..." : "Guardar pesos"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
