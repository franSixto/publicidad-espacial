import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { SideNav } from "@/components/side-nav";

export const metadata = { title: "Administración" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("ADMIN");
  const [pending, reports] = await Promise.all([
    db.space.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "OPEN" } }),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:px-8">
      <aside className="mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-24">
          <SideNav
            title="Administración"
            items={[
              { href: "/admin", label: "Resumen", icon: "dashboard", exact: true },
              { href: "/admin/espacios", label: "Publicaciones", icon: "review", badge: pending },
              { href: "/admin/usuarios", label: "Usuarios", icon: "users" },
              { href: "/admin/campanas", label: "Operaciones y pagos", icon: "receipt" },
              { href: "/admin/reportes", label: "Reportes", icon: "flag", badge: reports },
              { href: "/admin/categorias", label: "Categorías", icon: "tags" },
            ]}
          />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
