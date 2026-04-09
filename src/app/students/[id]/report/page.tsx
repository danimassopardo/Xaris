import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getGradeColor, formatDate } from "@/lib/utils";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.student.findUnique({ where: { id: parseInt(id) } });
  if (!student) notFound();

  const assignments = await prisma.assignment.findMany({
    where: { studentId: parseInt(id) },
    include: { subject: true, category: true, rubricItems: true },
    orderBy: { dueDate: "asc" },
  });

  const categoryWeights = await prisma.categoryWeight.findMany({
    include: { category: true, subject: true },
  });

  const graded = assignments.filter((a) => a.status === "GRADED" && a.gradeValue != null);
  const simpleAvg =
    graded.length > 0
      ? graded.reduce((s, a) => s + (a.gradeValue ?? 0), 0) / graded.length
      : null;
  const pending = assignments.filter((a) =>
    ["PENDING", "LATE", "INCOMPLETE"].includes(a.status)
  ).length;

  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))];

  const subjectSummaries = subjectIds.map((subjectId) => {
    const subjectAssignments = assignments.filter((a) => a.subjectId === subjectId);
    const subject = subjectAssignments[0]?.subject;
    const gradedSub = subjectAssignments.filter(
      (a) => a.status === "GRADED" && a.gradeValue != null
    );
    const subAvg =
      gradedSub.length > 0
        ? gradedSub.reduce((s, a) => s + (a.gradeValue ?? 0), 0) / gradedSub.length
        : null;

    const catMap = new Map<string, { sum: number; count: number }>();
    for (const a of gradedSub) {
      const cn = a.category?.name ?? "__none__";
      const e = catMap.get(cn) ?? { sum: 0, count: 0 };
      e.sum += a.gradeValue ?? 0;
      e.count++;
      catMap.set(cn, e);
    }
    let wSum = 0;
    let wTotal = 0;
    for (const [cn, { sum, count }] of catMap) {
      const avg = sum / count;
      const specific = categoryWeights.find(
        (w) => w.category.name === cn && w.subjectId === subjectId
      );
      const global = categoryWeights.find(
        (w) => w.category.name === cn && w.subjectId == null
      );
      const wt = specific?.weight ?? global?.weight;
      if (wt != null) {
        wSum += wt * avg;
        wTotal += wt;
      }
    }
    const weightedAvg = wTotal > 0 ? wSum / wTotal : subAvg;

    return { subjectId, subject, subjectAssignments, subAvg, weightedAvg };
  });

  const statusLabel: Record<string, string> = {
    PENDING: "Pendiente",
    SUBMITTED: "Entregada",
    GRADED: "Calificada",
    LATE: "Tardía",
    RESUBMITTED: "Reenviada",
    EXEMPT: "Exenta",
    INCOMPLETE: "Incompleta",
  };

  return (
    <div className="max-w-4xl mx-auto p-8 print:p-4">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print flex items-center gap-2 mb-6">
        <Link
          href={`/students/${id}`}
          className="text-sm text-[var(--primary)] hover:underline"
        >
          ← Volver al perfil
        </Link>
        <div className="ml-auto">
          <PrintButton />
        </div>
      </div>

      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold">{student.name}</h1>
        <p className="text-gray-600 mt-1">
          {student.studentId} · {student.course}
        </p>
        {student.notes && (
          <p className="text-sm text-gray-500 mt-1">{student.notes}</p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total tareas", value: String(assignments.length), alert: false },
          { label: "Calificadas", value: String(graded.length), alert: false },
          { label: "Pendientes", value: String(pending), alert: pending > 3 },
          {
            label: "Nota media",
            value: simpleAvg != null ? `${simpleAvg.toFixed(1)}%` : "—",
            alert: false,
          },
        ].map(({ label, value, alert }) => (
          <div
            key={label}
            className="border border-gray-200 rounded-lg p-3 text-center"
          >
            <p className={`text-2xl font-bold ${alert ? "text-red-600" : ""}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {pending > 3 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6 text-red-700 text-sm font-medium">
          ⚠️ Estudiante en riesgo — {pending} tareas pendientes/tardías/incompletas
        </div>
      )}

      <h2 className="text-xl font-bold mb-3">Resumen por asignatura</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {subjectSummaries.map(({ subjectId, subject, subAvg, weightedAvg }) => (
          <div key={subjectId} className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold">
              {subject?.name}{" "}
              <span className="text-gray-500 text-sm">({subject?.code})</span>
            </p>
            <div className="mt-1 text-sm grid grid-cols-2 gap-x-3">
              <span className="text-gray-500">Media simple:</span>
              <span className={getGradeColor(subAvg)}>
                {subAvg != null ? `${subAvg.toFixed(1)}%` : "—"}
              </span>
              <span className="text-gray-500">Media pond.:</span>
              <span className={getGradeColor(weightedAvg ?? null)}>
                {weightedAvg != null ? `${weightedAvg.toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-3">Tareas por asignatura</h2>
      {subjectSummaries.map(({ subjectId, subject, subjectAssignments }) => (
        <div key={subjectId} className="mb-6">
          <h3 className="font-semibold text-lg border-b border-gray-200 pb-1 mb-2">
            {subject?.name} ({subject?.code})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="pb-1 pr-3">Título</th>
                <th className="pb-1 pr-3">Tipo</th>
                <th className="pb-1 pr-3">Estado</th>
                <th className="pb-1 pr-3">Nota</th>
                <th className="pb-1">Entrega</th>
              </tr>
            </thead>
            <tbody>
              {subjectAssignments.map((a) => (
                <tr key={a.id} className="border-t border-gray-100">
                  <td className="py-1 pr-3">{a.title}</td>
                  <td className="py-1 pr-3 text-gray-500">
                    {a.type === "EXAM" ? "Examen" : "Tarea"}
                  </td>
                  <td className="py-1 pr-3">{statusLabel[a.status] ?? a.status}</td>
                  <td
                    className={`py-1 pr-3 font-semibold ${getGradeColor(a.gradeValue)}`}
                  >
                    {a.gradeValue != null ? `${a.gradeValue.toFixed(1)}%` : "—"}
                  </td>
                  <td className="py-1 text-gray-500">{formatDate(a.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <p className="text-xs text-gray-400 mt-8 text-center print:block hidden">
        Generado el {new Date().toLocaleDateString("es-ES")}
      </p>
    </div>
  );
}
