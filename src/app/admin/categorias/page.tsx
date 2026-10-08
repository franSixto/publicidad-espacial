import { db } from "@/lib/db";
import { toggleCategoryAction } from "@/app/actions/admin";
import { Badge, Card, PageHeader } from "@/components/ui";
import { CategoryIcon } from "@/components/category-icon";
import { CategoryForm } from "@/components/category-form";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { spaces: true } } } });
  return (
    <>
      <PageHeader title="Categorías" description="Tipos de espacio disponibles y su factor de precio para el estimador." />
      <div className="space-y-4">
        {categories.map((c) => (
          <Card key={c.id} className="p-5">
            <details>
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-4">
                <span className="rounded-xl bg-brand-50 p-2 text-brand-600"><CategoryIcon name={c.icon} className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{c.name} <span className="text-xs font-normal text-ink-muted">/{c.slug}</span></p>
                  <p className="text-sm text-ink-muted">{c.description}</p>
                </div>
                <span className="text-xs text-ink-muted">{c._count.spaces} espacios · factor {c.priceFactor}</span>
                {c.active ? <Badge tone="green">Activa</Badge> : <Badge>Inactiva</Badge>}
                <span className="text-sm font-semibold underline">Editar</span>
              </summary>
              <div className="mt-5 border-t border-gray-200 pt-5">
                <CategoryForm category={c} />
                <form action={toggleCategoryAction.bind(null, c.id)} className="mt-3">
                  <button className="text-sm font-semibold text-ink-muted underline">{c.active ? "Desactivar categoría" : "Activar categoría"}</button>
                </form>
              </div>
            </details>
          </Card>
        ))}
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Nueva categoría</h2>
          <CategoryForm />
        </Card>
      </div>
    </>
  );
}
