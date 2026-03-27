import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SLAT — Student Lifecycle & Academic Tracker",
  description: "Track students, assignments, and grades",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[var(--background)]">
          {children}
        </main>
      </body>
    </html>
  );
}
