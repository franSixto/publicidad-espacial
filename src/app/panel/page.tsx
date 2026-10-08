import Link from "next/link";
import { ArrowRight, Eye, Megaphone, MapPinned, Wallet, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getReputation } from "@/lib/queries";
import { bookingStatusLabel, formatARS, formatCompact, formatDate } from "@/lib/format";
import { Alert, ButtonLink, Card, EmptyState, PageHeader, Rating, Stat, StatusBadge } from "@/components/ui";

export default async function PanelHome({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { error } = await searchParams;
  const isOwner = user.role === "OWNER";
  const whereRole = isOwner ? { ownerId: user.id } : { advertiserId: user.id };

  const [rep, spacesAgg, active, awaiting, earned, recent] = await Promise.all([
    getReputation(user.id),
    db.space.aggregate({ where: { ownerId: user.id }, _count: true, _sum: { views: true } }),
    db.booking.count({ where: { ...whereRole, status: { in: ["ACCEPTED", "ACTIVE"] } } }),
    db.booking.count({ where: { awaitingUserId: user.id, status: "PENDING" } }),
    db.booking.aggregate({
      where: { ...whereRole, status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } },
      _sum: { ownerPayout: true, totalAmount: true },
    }),
    db.booking.findMany({
      where: whereRole,
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { space: { select: { title: true } }, advertiser: { select: { name: true, companyName: true } }, owner: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      {error === "permiso" && <div className="mb-6"><Alert tone="amber">No tenés permisos para acceder a esa sección.</Alert></div>}
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]} 👋`}
        description={isOwner ? "Así vienen tus espacios y campañas." : "Seguimiento de tus campañas en la vía pública."}
        actions={
          isOwner ? <ButtonLink href="/panel/espacios/nuevo">Publicar espacio</ButtonLink> : <ButtonLink href="/espacios">Buscar espacios</ButtonLink>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isOwner ? (
          <>
            <Stat label="Espacios publicados" value={spacesAgg._count} icon={<MapPinned className="h-5 w-5" />} />
            <Stat label="Visitas totales" value={formatCompact(spacesAgg._sum.views ?? 0)} icon={<Eye className="h-5 w-5" />} />
            <Stat label="Ingresos acordados (neto)" value={formatARS(earned._sum.ownerPayout ?? 0)} icon={<Wallet className="h-5 w-5" />} hint="Campañas acordadas, en curso y finalizadas" />
          </>
        ) : (
          <>
            <Stat label="Campañas activas" value={active} icon={<Megaphone className="h-5 w-5" />} />
            <Stat label="Inversión acordada" value={formatARS(earned._sum.totalAmount ?? 0)} icon={<Wallet className="h-5 w-5" />} />
            <Stat label="Reputación" value={<Rating value={rep.rating} count={rep.reviews} className="text-2xl" />} />
          </>
        )}
        <Stat label="Esperan tu respuesta" value={awaiting} icon={<Clock className="h-5 w-5" />} hint={awaiting ? "Revisá tus solicitudes" : "Estás al día"} />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Actividad reciente</h2>
        <Link href="/panel/campanas" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">Ver todo <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4">
        {recent.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-6 w-6" />}
            title={isOwner ? "Todavía no recibiste solicitudes" : "Todavía no enviaste solicitudes"}
            description={isOwner ? "Publicá tu espacio con buenas fotos para empezar a recibir propuestas." : "Explorá el catálogo y enviá tu primera propuesta."}
            action={<ButtonLink href={isOwner ? "/panel/espacios/nuevo" : "/espacios"} variant="secondary">{isOwner ? "Publicar espacio" : "Explorar espacios"}</ButtonLink>}
          />
        ) : (
          <Card className="divide-y divide-gray-100">
            {recent.map((b) => (
              <Link key={b.id} href={`/panel/campanas/${b.id}`} className="flex flex-col gap-2 p-4 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.campaignName}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {b.space.title} · {isOwner ? b.advertiser.companyName ?? b.advertiser.name : b.owner.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <span className="text-ink-muted">{formatDate(b.startDate)}</span>
                  <span className="font-semibold">{formatARS(b.totalAmount)}</span>
                  {b.awaitingUserId === user.id && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">Tu turno</span>}
                  <StatusBadge status={b.status} label={bookingStatusLabel[b.status]} />
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
