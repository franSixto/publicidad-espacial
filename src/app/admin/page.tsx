import Link from "next/link";
import { Banknote, Flag, Megaphone, ShieldCheck, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatARS, formatNumber, spaceStatusLabel, bookingStatusLabel } from "@/lib/format";
import { Card, PageHeader, Stat } from "@/components/ui";

export default async function AdminHome() {
  const [users, byRole, spaces, bookings, gmv, paid, openReports] = await Promise.all([
    db.user.count(),
    db.user.groupBy({ by: ["role"], _count: true }),
    db.space.groupBy({ by: ["status"], _count: true }),
    db.booking.groupBy({ by: ["status"], _count: true }),
    db.booking.aggregate({ where: { status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } }, _sum: { totalAmount: true, commissionAmount: true } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { commissionAmount: true, amount: true } }),
    db.report.count({ where: { status: "OPEN" } }),
  ]);
  const roleCount = (r: string) => byRole.find((x) => x.role === r)?._count ?? 0;
  const pendingSpaces = spaces.find((s) => s.status === "PENDING")?._count ?? 0;

  return (
    <>
      <PageHeader title="Panel de administración" description="Salud del marketplace y tareas pendientes." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Usuarios" value={formatNumber(users)} hint={`${roleCount("OWNER")} propietarios · ${roleCount("ADVERTISER")} anunciantes`} icon={<Users className="h-5 w-5" />} />
        <Stat label="Volumen acordado (GMV)" value={formatARS(gmv._sum.totalAmount ?? 0)} icon={<Megaphone className="h-5 w-5" />} />
        <Stat label="Comisiones devengadas" value={formatARS(gmv._sum.commissionAmount ?? 0)} hint={`Cobradas: ${formatARS(paid._sum.commissionAmount ?? 0)}`} icon={<Wallet className="h-5 w-5" />} />
        <Stat label="Pagos acreditados" value={formatARS(paid._sum.amount ?? 0)} icon={<Banknote className="h-5 w-5" />} />
        <Link href="/admin/espacios?estado=PENDING"><Stat label="Publicaciones por revisar" value={pendingSpaces} icon={<ShieldCheck className="h-5 w-5" />} hint="Ir a moderación →" /></Link>
        <Link href="/admin/reportes"><Stat label="Reportes abiertos" value={openReports} icon={<Flag className="h-5 w-5" />} hint="Ir a reportes →" /></Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Publicaciones por estado</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {spaces.map((s) => (
              <li key={s.status} className="flex justify-between"><Link href={`/admin/espacios?estado=${s.status}`} className="hover:underline">{spaceStatusLabel[s.status]}</Link><strong>{s._count}</strong></li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Campañas por estado</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {bookings.map((b) => (
              <li key={b.status} className="flex justify-between"><Link href={`/admin/campanas?estado=${b.status}`} className="hover:underline">{bookingStatusLabel[b.status]}</Link><strong>{b._count}</strong></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
