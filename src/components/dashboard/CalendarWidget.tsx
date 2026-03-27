import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface AssignmentItem {
  id: number;
  title: string;
  type: string;
  dueDate: Date | string;
  student: { name: string };
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
        ? "Today"
        : i === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short" });
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
  const hasAny = days.some((d) => d.items.length > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-[var(--primary)]" />
          Upcoming 7 Days
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!hasAny ? (
          <p className="text-sm text-[var(--muted-foreground)] py-4 text-center">
            No assignments due in the next 7 days.
          </p>
        ) : (
          <div className="space-y-2">
            {days.map((day, i) => (
              <div key={i} className="rounded-md border border-[var(--border)] p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {day.label}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(day.date)}
                  </span>
                </div>
                {day.items.length === 0 ? (
                  <p className="text-xs text-[var(--muted-foreground)]">—</p>
                ) : (
                  <ul className="space-y-1">
                    {day.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 text-xs"
                      >
                        <Badge
                          variant={item.type === "EXAM" ? "purple" : "indigo"}
                          className="shrink-0"
                        >
                          {item.type}
                        </Badge>
                        <span className="truncate font-medium">{item.title}</span>
                        <span className="text-[var(--muted-foreground)] truncate">
                          — {item.student.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
