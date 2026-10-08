import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { unreadCount } from "@/lib/queries";
import { SideNav, type NavItem } from "@/components/side-nav";
import { roleLabel } from "@/lib/format";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/panel");
  const [unread, awaiting] = await Promise.all([
    unreadCount(user.id),
    db.booking.count({ where: { awaitingUserId: user.id, status: "PENDING" } }),
  ]);
  const items: NavItem[] = [
    { href: "/panel", label: "Resumen", icon: "dashboard", exact: true },
    ...(user.role === "OWNER"
      ? [
          { href: "/panel/espacios", label: "Mis espacios", icon: "spaces" },
          { href: "/panel/campanas", label: "Solicitudes y campañas", icon: "campaigns", badge: awaiting },
        ]
      : [{ href: "/panel/campanas", label: "Mis campañas", icon: "campaigns", badge: awaiting }]),
    { href: "/panel/mensajes", label: "Mensajes", icon: "messages", badge: unread },
    { href: "/panel/perfil", label: "Mi perfil", icon: "user" },
    ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Administración", icon: "shield" }] : []),
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-10 lg:px-8">
      <aside className="mb-6 lg:mb-0">
        <div className="lg:sticky lg:top-24">
          <SideNav items={items} title={roleLabel[user.role]} />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
