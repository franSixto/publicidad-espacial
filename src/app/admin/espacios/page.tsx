import Link from "next/link";
import type { SpaceStatus } from "@prisma/client";
import { Check, Pause, Star } from "lucide-react";
import { db } from "@/lib/db";
import { formatARS, formatDate, spaceStatusLabel } from "@/lib/format";
import { adminPauseSpaceAction, approveSpaceAction, rejectSpaceAction, toggleFeaturedAction } from "@/app/actions/admin";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

const STATUSES: SpaceStatus[] = ["PENDING", "PUBLISHED", "PAUSED", "REJECTED", "DRAFT"];

export default async function AdminSpacesPage({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const sp = await searchParams;
  const estado = STATUSES.includes(sp.estado as SpaceStatus) ? (sp.estado as SpaceStatus) : "PENDING";
  const spaces = await db.space.findMany({
    where: { status: estado, ...(sp.q ? { title: { contains: sp.q, mode: "insensitive" } } : {}) },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      owner: { select: { id: true, name: true, email: true, verified: true } },
      category: { select: { name: true } },
      images: { take: 3, orderBy: { sortOrder: "asc" } },
      _count: { select: { reports: { where: { status: "OPEN" } } } },
    },
  });
  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:border-ink";

  return (
    <>
      <PageHeader title="Publicaciones" description="Moderá espacios nuevos y gestioná los publicados." />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/espacios?estado=${s}`} className={cn("rounded-full border px-4 py-1.5 text-sm font-medium", s === estado ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}>
            {spaceStatusLabel[s]}
          </Link>
        ))}
        <form className="ml-auto">
          <input type="hidden" name="estado" value={estado} />
          <input name="q" defaultValue={sp.q} placeholder="Buscar por título…" className="rounded-xl border border-gray-300 px-3 py-1.5 text-sm" />
        </form>
      </div>
      {spaces.length === 0 ? (
        <EmptyState title="No hay publicaciones en este estado" />
      ) : (
        <div className="space-y-4">
          {spaces.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="grid w-full shrink-0 grid-cols-3 gap-1 md:w-64">
                  {s.images.length ? s.images.map((i) => <SafeImage key={i.id} src={i.url} alt="" className="aspect-square w-full rounded-lg" />) : <p className="col-span-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">Sin fotos</p>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={s.status} label={spaceStatusLabel[s.status]} />
                    <span className="text-xs text-ink-muted">{s.category.name}</span>
                    {s.featured && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Destacado</span>}
                    {s._count.reports > 0 && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{s._count.reports} reporte(s)</span>}
                  </div>
                  <Link href={`/espacios/${s.id}`} className="mt-1 block font-semibold hover:underline">{s.title}</Link>
                  <p className="text-sm text-ink-muted">{s.city}, {s.province} · {formatARS(s.pricePerMonth)}/mes · {s.widthM}×{s.heightM} m</p>
                  <p className="text-xs text-ink-muted">Propietario: <Link href={`/usuarios/${s.owner.id}`} className="underline">{s.owner.name}</Link> ({s.owner.email}){s.owner.verified ? " · verificado" : " · sin verificar"} · actualizado {formatDate(s.updatedAt)}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{s.description}</p>
                  {s.rejectionReason && <p className="mt-2 text-xs text-red-700">Motivo de rechazo: {s.rejectionReason}</p>}
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    {s.status !== "PUBLISHED" && s.status !== "DRAFT" && (
                      <form action={approveSpaceAction.bind(null, s.id)}><button className={`${btn} border-emerald-300 text-emerald-700`}><Check className="h-3.5 w-3.5" /> Aprobar y publicar</button></form>
                    )}
                    {s.status === "PUBLISHED" && (
                      <>
                        <form action={toggleFeaturedAction.bind(null, s.id)}><button className={btn}><Star className="h-3.5 w-3.5" /> {s.featured ? "Quitar destacado" : "Destacar"}</button></form>
                        <form action={adminPauseSpaceAction.bind(null, s.id)}><button className={btn}><Pause className="h-3.5 w-3.5" /> Pausar</button></form>
                      </>
                    )}
                    {(s.status === "PENDING" || s.status === "PUBLISHED") && (
                      <details>
                        <summary className={`${btn} cursor-pointer list-none text-red-600`}>Rechazar…</summary>
                        <form action={rejectSpaceAction.bind(null, s.id)} className="mt-2 flex gap-2">
                          <input name="reason" required minLength={5} placeholder="Motivo visible para el propietario" className="w-64 rounded-lg border border-gray-300 px-2 py-1 text-xs" />
                          <button className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white">Confirmar</button>
                        </form>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
