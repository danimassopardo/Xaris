"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2 } from "lucide-react";

interface FilterCounts {
  toGrade: number;
  examsThisWeek: number;
  studentsWithoutGradesThisMonth: number;
}

export default function QuickFiltersWidget() {
  const router = useRouter();
  const [counts, setCounts] = useState<FilterCounts | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/filters")
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  const filters = counts
    ? [
        {
          label: "Tareas por corregir",
          count: counts.toGrade,
          color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800",
          dot: "bg-amber-500",
          href: "/assignments?status=SUBMITTED",
        },
        {
          label: "Exámenes esta semana",
          count: counts.examsThisWeek,
          color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
          dot: "bg-purple-500",
          href: "/assignments?type=EXAM",
        },
        {
          label: "Estudiantes sin notas este mes",
          count: counts.studentsWithoutGradesThisMonth,
          color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
          dot: "bg-red-500",
          href: "/students",
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-[var(--primary)]" />
          Filtros rápidos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!counts ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filters.map((f) => (
              <button
                key={f.label}
                onClick={() => router.push(f.href)}
                className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition-colors ${f.color}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${f.dot}`} />
                  {f.label}
                </div>
                <span className="text-lg font-bold">{f.count}</span>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
