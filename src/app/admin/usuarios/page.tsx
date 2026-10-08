import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, roleLabel } from "@/lib/format";
import { toggleSuspendAction, toggleVerifiedAction } from "@/app/actions/admin";
import { Avatar, Badge, Card, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string }> }) {
  const sp = await searchParams;
  const me = await getCurrentUser();
  const role = (["OWNER", "ADVERTISER", "ADMIN"] as Role[]).find((r) => r === sp.rol);
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { email: { contains: sp.q, mode: "insensitive" } }, { companyName: { contains: sp.q, mode: "insensitive" } }] } : {}),
  };
  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { spaces: true, bookingsAsAdvertiser: true, bookingsAsOwner: true, reportsAgainst: { where: { status: "OPEN" } } } } },
  });
  const btn = "rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold hover:border-ink";
  return (
    <>
      <PageHeader title="Usuarios" description={`${users.length} resultados`} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {[undefined, "OWNER", "ADVERTISER", "ADMIN"].map((r) => (
          <Link key={r ?? "all"} href={r ? `/admin/usuarios?rol=${r}` : "/admin/usuarios"} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", role === r ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}>
            {r ? roleLabel[r as Role] : "Todos"}
          </Link>
        ))}
        <form className="ml-auto">
          {role && <input type="hidden" name="rol" value={role} />}
          <input name="q" defaultValue={sp.q} placeholder="Nombre, email o empresa" className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm" />
        </form>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-gray-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="p-3">Usuario</th><th className="p-3">Rol</th><th className="p-3">Actividad</th><th className="p-3">Alta</th><th className="p-3">Estado</th><th className="p-3 text-right">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} url={u.avatarUrl} size={32} />
                    <div><p className="font-medium">{u.name}{u.companyName ? ` · ${u.companyName}` : ""}</p><p className="text-xs text-ink-muted">{u.email}</p></div>
                  </div>
                </td>
                <td className="p-3">{roleLabel[u.role]}</td>
                <td className="p-3 text-xs text-ink-muted">
                  {u.role === "OWNER" ? `${u._count.spaces} espacios · ${u._count.bookingsAsOwner} campañas` : `${u._count.bookingsAsAdvertiser} campañas`}
                  {u._count.reportsAgainst > 0 && <span className="ml-1 font-semibold text-red-600">· {u._count.reportsAgainst} reporte(s)</span>}
                </td>
                <td className="p-3 text-xs">{formatDate(u.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {u.status === "ACTIVE" ? <Badge tone="green">Activo</Badge> : <Badge tone="red">Suspendido</Badge>}
                    {u.verified && <Badge tone="blue">Verificado</Badge>}
                  </div>
                </td>
                <td className="p-3">
                  {u.id !== me?.id && u.role !== "ADMIN" && (
                    <div className="flex justify-end gap-1.5">
                      <form action={toggleVerifiedAction.bind(null, u.id)}><button className={btn}>{u.verified ? "Quitar verificación" : "Verificar"}</button></form>
                      <form action={toggleSuspendAction.bind(null, u.id)}><button className={cn(btn, u.status === "ACTIVE" && "text-red-600")}>{u.status === "ACTIVE" ? "Suspender" : "Reactivar"}</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
