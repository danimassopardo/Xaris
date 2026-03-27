import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AtRiskStudent {
  id: number;
  name: string;
  course: string;
  pendingCount: number;
}

interface AtRiskWidgetProps {
  students: AtRiskStudent[];
}

export default function AtRiskWidget({ students }: AtRiskWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          At-Risk Students
          {students.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {students.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {students.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
            No at-risk students. 🎉
          </p>
        ) : (
          <ul className="space-y-2">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-900/40 dark:bg-red-950/20"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {s.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {s.course}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{s.pendingCount} pending</Badge>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/students/${s.id}`}>View</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
