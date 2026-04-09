"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface AssignmentItem {
  id: number;
  title: string;
  type: string;
  status: string;
  dueDate: Date | string;
  student: { id: number; name: string };
  subject: { name: string; code: string };
}

interface DayGroup {
  date: Date;
  label: string;
  items: AssignmentItem[];
}

interface CalendarWidgetProps {
  assignments: AssignmentItem[];
}

function getDayGroups(assignments: AssignmentItem[]): DayGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: DayGroup[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label =
      i === 0
        ? "Hoy"
        : i === 1
        ? "Mañana"
        : d.toLocaleDateString("es-ES", { weekday: "short" });
    days.push({ date: d, label, items: [] });
  }
  for (const a of assignments) {
    const due = new Date(a.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) {
      days[diff].items.push(a);
    }
  }
  return days;
}

export default function CalendarWidget({ assignments }: CalendarWidgetProps) {
  const days = getDayGroups(assignments);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const hasAny = days.some((d) => d.items.length > 0);

  const activeDay = selectedDay !== null ? days[selectedDay] : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-[var(--primary)]" />
          Próximos 7 días
          {activeDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="ml-auto text-xs font-normal text-[var(--muted-foreground)] hover:text-[var(--foreground)] underline underline-offset-2"
            >
              ← Volver
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {activeDay ? (
          // Expanded day view: list pending students
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{activeDay.label}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{formatDate(activeDay.date)}</span>
            </div>
            {activeDay.items.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
                No hay entregas pendientes este día.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {activeDay.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-md border border-[var(--border)] p-2 text-sm"
                  >
                    <Badge
                      variant={item.type === "EXAM" ? "purple" : "indigo"}
                      className="shrink-0 mt-0.5"
                    >
                      {item.type === "EXAM" ? "Examen" : "Tarea"}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {item.subject.code} ·{" "}
                        <Link
                          href={`/students/${item.student.id}`}
                          className="text-[var(--primary)] hover:underline"
                        >
                          {item.student.name}
                        </Link>
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "PENDING"
                          ? "warning"
                          : item.status === "SUBMITTED"
                          ? "info"
                          : "success"
                      }
                      className="shrink-0"
                    >
                      {item.status === "PENDING"
                        ? "Pendiente"
                        : item.status === "SUBMITTED"
                        ? "Entregada"
                        : "Calificada"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : !hasAny ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
            No hay tareas en los próximos 7 días.
          </p>
        ) : (
          // Default 7-day overview
          <div className="space-y-1">
            {days.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`w-full rounded-md border border-[var(--border)] p-2 text-left transition-colors hover:bg-[var(--muted)] ${
                  day.items.length > 0 ? "cursor-pointer" : "cursor-default opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {day.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {day.items.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {day.items.length}
                      </Badge>
                    )}
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(day.date)}
                    </span>
                  </div>
                </div>
                {day.items.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">—</p>
                ) : (
                  <ul className="space-y-0.5">
                    {day.items.slice(0, 3).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Badge
                          variant={item.type === "EXAM" ? "purple" : "indigo"}
                          className="shrink-0"
                        >
                          {item.type === "EXAM" ? "Examen" : "Tarea"}
                        </Badge>
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="text-[var(--muted-foreground)] truncate">
                          — {item.student.name}
                        </span>
                      </li>
                    ))}
                    {day.items.length > 3 && (
                      <li className="text-xs text-[var(--muted-foreground)] pl-1">
                        +{day.items.length - 3} más…
                      </li>
                    )}
                  </ul>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

