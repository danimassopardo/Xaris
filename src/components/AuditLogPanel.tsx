"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AuditLog {
  id: number;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

interface AuditLogPanelProps {
  entityType: string;
  entityId: number;
}

export default function AuditLogPanel({ entityType, entityId }: AuditLogPanelProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/audit-log?entityType=${entityType}&entityId=${entityId}`)
        .then((r) => r.json())
        .then(setLogs)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, entityType, entityId]);

  return (
    <div className="border border-[var(--border)] rounded-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--secondary)] transition-colors rounded-md"
      >
        <span>Historial de cambios</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-4 pb-3">
          {loading && (
            <p className="text-sm text-[var(--muted-foreground)] py-2">Cargando...</p>
          )}
          {!loading && logs.length === 0 && (
            <p className="text-sm text-[var(--muted-foreground)] py-2">
              Sin cambios registrados.
            </p>
          )}
          {!loading && logs.length > 0 && (
            <div className="space-y-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="text-xs grid grid-cols-[auto_1fr] gap-x-3 py-1 border-b border-[var(--border)] last:border-0"
                >
                  <span className="text-[var(--muted-foreground)]">
                    {new Date(log.timestamp).toLocaleString("es-ES")}
                  </span>
                  <span>
                    <span className="font-medium">{log.field}</span>:{" "}
                    <span className="text-red-500">{log.oldValue ?? "—"}</span>
                    {" → "}
                    <span className="text-green-600">{log.newValue ?? "—"}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
