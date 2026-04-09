import { prisma } from "@/lib/prisma";
import StudentTable from "@/components/students/StudentTable";
import { Users } from "lucide-react";
import StudentsPageActions from "@/components/students/StudentsPageActions";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      assignments: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Users className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">Estudiantes</h1>
        <span className="text-sm text-[var(--muted-foreground)]">
          {students.length} en total
        </span>
        <StudentsPageActions />
      </div>
      <StudentTable students={students} />
    </div>
  );
}
