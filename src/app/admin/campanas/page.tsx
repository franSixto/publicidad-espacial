import Link from "next/link";
import type { BookingStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { bookingStatusLabel, formatARS, formatDate, paymentStatusLabel } from "@/lib/format";
import { markPaymentAction } from "@/app/actions/admin";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUSES: BookingStatus[] = ["PENDING", "ACCEPTED", "ACTIVE", "COMPLETED", "REJECTED", "CANCELLED"];

export default async function AdminBookingsPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sp = await searchParams;
  const estado = STATUSES.find((s) => s === sp.estado);
  const bookings = await db.booking.findMany({
    where: estado ? { status: estado } : {},
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      space: { select: { title: true } },
      advertiser: { select: { name: true, companyName: true } },
      owner: { select: { name: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const btn = "rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold hover:border-ink";
  return (
    <>
      <PageHeader title="Operaciones y pagos" description="Seguimiento de contrataciones, comisiones y conciliación de pagos." />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/campanas" className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", !estado ? "border-ink bg-ink text-white" : "border-gray-300")}>Todas</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/campanas?estado=${s}`} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", estado === s ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}>{bookingStatusLabel[s]}</Link>
        ))}
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-gray-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr><th className="p-3">Campaña</th><th className="p-3">Partes</th><th className="p-3">Período</th><th className="p-3 text-right">Total</th><th className="p-3 text-right">Comisión</th><th className="p-3">Estado</th><th className="p-3">Pago</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => {
              const p = b.payments[0];
              return (
                <tr key={b.id} className="align-top">
                  <td className="p-3"><Link href={`/panel/campanas/${b.id}`} className="font-medium hover:underline">{b.campaignName}</Link><p className="text-xs text-ink-muted">{b.space.title}</p></td>
                  <td className="p-3 text-xs"><p>{b.advertiser.companyName ?? b.advertiser.name}</p><p className="text-ink-muted">→ {b.owner.name}</p></td>
                  <td className="p-3 text-xs">{formatDate(b.startDate)}<br />{b.months} mes(es)</td>
                  <td className="p-3 text-right font-semibold">{formatARS(b.totalAmount)}</td>
                  <td className="p-3 text-right text-xs">{formatARS(b.commissionAmount)}<br /><span className="text-ink-muted">{Math.round(b.commissionRate * 100)}%</span></td>
                  <td className="p-3"><StatusBadge status={b.status} label={bookingStatusLabel[b.status]} /></td>
                  <td className="p-3">
                    {p ? (
                      <div className="space-y-1.5">
                        <StatusBadge status={p.status} label={paymentStatusLabel[p.status]} />
                        <div className="flex flex-wrap gap-1">
                          {p.status === "PENDING" && <form action={markPaymentAction.bind(null, p.id, "PAID")}><button className={btn}>Marcar acreditado</button></form>}
                          {p.status === "PAID" && <form action={markPaymentAction.bind(null, p.id, "REFUNDED")}><button className={btn}>Reintegrar</button></form>}
                        </div>
                      </div>
                    ) : <span className="text-xs text-ink-muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
