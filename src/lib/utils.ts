import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(dueDate: Date | string, status: string): boolean {
  return status === "PENDING" && new Date(dueDate) < new Date();
}

export function getRowColorByStatus(status: string, overdue: boolean): string {
  if (overdue) return "bg-red-50 dark:bg-red-950/20";
  if (status === "GRADED") return "bg-emerald-50 dark:bg-emerald-950/20";
  if (status === "SUBMITTED") return "bg-blue-50 dark:bg-blue-950/20";
  if (status === "LATE") return "bg-orange-50 dark:bg-orange-950/20";
  if (status === "RESUBMITTED") return "bg-cyan-50 dark:bg-cyan-950/20";
  if (status === "EXEMPT") return "bg-gray-50 dark:bg-gray-950/20";
  if (status === "INCOMPLETE") return "bg-red-50 dark:bg-red-950/20";
  return "";
}

export function getGradeColor(grade: number | null): string {
  if (grade === null) return "text-gray-400";
  if (grade >= 90) return "text-green-600";
  if (grade >= 70) return "text-blue-600";
  if (grade >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function getAverageGrade(
  assignments: { gradeValue: number | null; status: string }[]
): number | null {
  const graded = assignments.filter(
    (a) => a.status === "GRADED" && a.gradeValue !== null
  );
  if (graded.length === 0) return null;
  return (
    graded.reduce((sum, a) => sum + (a.gradeValue ?? 0), 0) / graded.length
  );
}

export function getPendingCount(assignments: { status: string }[]): number {
  return assignments.filter((a) => ["PENDING", "LATE", "INCOMPLETE"].includes(a.status)).length;
}

export function getAverageBySubject(
  assignments: { gradeValue: number | null; status: string; subject: { id: number; name: string; code: string } }[]
): { subjectId: number; name: string; code: string; avg: number | null; count: number }[] {
  const map = new Map<number, { name: string; code: string; sum: number; count: number }>();
  for (const a of assignments) {
    if (!map.has(a.subject.id)) {
      map.set(a.subject.id, { name: a.subject.name, code: a.subject.code, sum: 0, count: 0 });
    }
    if (a.status === "GRADED" && a.gradeValue !== null) {
      const entry = map.get(a.subject.id)!;
      entry.sum += a.gradeValue;
      entry.count += 1;
    }
  }
  return Array.from(map.entries()).map(([subjectId, { name, code, sum, count }]) => ({
    subjectId,
    name,
    code,
    avg: count > 0 ? sum / count : null,
    count,
  }));
}

export function getWeightedAverage(
  assignments: {
    gradeValue: number | null;
    status: string;
    category?: { name: string } | null;
    subject: { id: number };
  }[],
  weights: {
    categoryId?: number;
    categoryName: string;
    weight: number;
    subjectId: number | null;
  }[],
  subjectId?: number
): number | null {
  const filtered = assignments.filter(
    (a) =>
      a.status === "GRADED" &&
      a.gradeValue != null &&
      (subjectId == null || a.subject.id === subjectId)
  );
  if (filtered.length === 0) return null;

  const categoryMap = new Map<string, { sum: number; count: number }>();
  for (const a of filtered) {
    const catName = a.category?.name ?? "__uncategorized__";
    const entry = categoryMap.get(catName) ?? { sum: 0, count: 0 };
    entry.sum += a.gradeValue ?? 0;
    entry.count++;
    categoryMap.set(catName, entry);
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const [catName, { sum, count }] of categoryMap) {
    const avg = sum / count;
    const specific = weights.find(
      (w) => w.categoryName === catName && w.subjectId === (subjectId ?? null)
    );
    const global = weights.find((w) => w.categoryName === catName && w.subjectId == null);
    const wt = specific?.weight ?? global?.weight;
    if (wt != null) {
      weightedSum += wt * avg;
      totalWeight += wt;
    }
  }

  if (totalWeight === 0) {
    return filtered.reduce((s, a) => s + (a.gradeValue ?? 0), 0) / filtered.length;
  }
  return weightedSum / totalWeight;
}

