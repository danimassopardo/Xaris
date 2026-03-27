import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  return assignments.filter((a) => a.status === "PENDING").length;
}
