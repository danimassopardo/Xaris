"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import ImportStudentsDialog from "@/components/students/ImportStudentsDialog";

export default function StudentsPageActions() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        onClick={() => setImportOpen(true)}
        className="flex items-center gap-1 text-sm border border-[var(--border)] rounded-md px-3 py-1.5 hover:bg-[var(--secondary)] transition-colors"
      >
        <Upload className="h-4 w-4" />
        Importar CSV
      </button>
      <a
        href="/api/export/students"
        className="flex items-center gap-1 text-sm border border-[var(--border)] rounded-md px-3 py-1.5 hover:bg-[var(--secondary)] transition-colors"
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </a>
      <ImportStudentsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
