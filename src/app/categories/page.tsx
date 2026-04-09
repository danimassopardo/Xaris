import { prisma } from "@/lib/prisma";
import { Tag } from "lucide-react";
import CategoriesClient from "@/components/categories/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, subjects] = await Promise.all([
    prisma.category.findMany({
      include: { weights: { include: { subject: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Tag className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">Categorías</h1>
        <span className="ml-auto text-sm text-[var(--muted-foreground)]">
          {categories.length} en total
        </span>
      </div>
      <CategoriesClient categories={categories} subjects={subjects} />
    </div>
  );
}
