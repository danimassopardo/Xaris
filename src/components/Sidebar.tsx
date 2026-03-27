"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/assignments", label: "Assignments", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 h-full flex flex-col border-r border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--border)]">
        <GraduationCap className="h-6 w-6 text-[var(--primary)]" />
        <div>
          <p className="text-sm font-bold leading-none">SLAT</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Academic Tracker
          </p>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--muted-foreground)]">v1.0.0</p>
      </div>
    </aside>
  );
}
