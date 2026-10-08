import Link from "next/link";
import { Eye, MapPinned, Pause, Pencil, Play, Send, Trash2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatARS, formatNumber, spaceStatusLabel } from "@/lib/format";
import { deleteSpaceAction, submitForReviewAction, togglePauseAction } from "@/app/actions/spaces";
import { Alert, ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { ConfirmButton } from "@/components/confirm-button";

export default async function MySpacesPage({ searchParams }: { searchParams: Promise<{ guardado?: string }> }) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  const { guardado } = await searchParams;
  const spaces = await db.space.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      images: { take: 1, orderBy: { sortOrder: "asc" } },
      category: { select: { name: true } },
      _count: { select: { bookings: { where: { status: "PENDING" } } } },
    },
  });

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:border-ink";
  return (
    <>
      <PageHeader title="Mis espacios" description="Gestioná tus publicaciones y su estado." actions={<ButtonLink href="/panel/espacios/nuevo">Publicar espacio</ButtonLink>} />
      {guardado === "submit" && <div className="mb-6"><Alert tone="green">¡Listo! Guardamos tu publicación. Si es nueva, la revisaremos antes de publicarla.</Alert></div>}
      {guardado === "draft" && <div className="mb-6"><Alert tone="blue">Borrador guardado. Podés terminarlo cuando quieras.</Alert></div>}
      {spaces.length === 0 ? (
        <EmptyState icon={<MapPinned className="h-6 w-6" />} title="Aún no publicaste espacios" description="Una pared, una vidriera o tu auto pueden generar ingresos todos los meses." action={<ButtonLink href="/panel/espacios/nuevo">Publicar mi primer espacio</ButtonLink>} />
      ) : (
        <div className="space-y-4">
          {spaces.map((s) => (
            <Card key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row">
              <Link href={`/espacios/${s.id}`} className="shrink-0">
                <SafeImage src={s.images[0]?.url} alt={s.title} className="h-32 w-full rounded-xl sm:w-48" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s.status} label={spaceStatusLabel[s.status]} />
                  <span className="text-xs text-ink-muted">{s.category.name}</span>
                  {s._count.bookings > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{s._count.bookings} solicitud(es)</span>}
                </div>
                <Link href={`/espacios/${s.id}`} className="mt-1 truncate font-semibold hover:underline">{s.title}</Link>
                <p className="text-sm text-ink-muted">{[s.neighborhood, s.city].filter(Boolean).join(", ")} · {formatARS(s.pricePerMonth)}/mes</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted"><Eye className="h-3.5 w-3.5" /> {formatNumber(s.views)} visitas</p>
                {s.status === "REJECTED" && s.rejectionReason && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-800"><strong>Motivo del rechazo:</strong> {s.rejectionReason}</p>}
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <Link href={`/panel/espacios/${s.id}/editar`} className={btn}><Pencil className="h-3.5 w-3.5" /> Editar</Link>
                  {(s.status === "PUBLISHED" || s.status === "PAUSED") && (
                    <form action={togglePauseAction.bind(null, s.id)}>
                      <button className={btn}>{s.status === "PUBLISHED" ? <><Pause className="h-3.5 w-3.5" /> Pausar</> : <><Play className="h-3.5 w-3.5" /> Reactivar</>}</button>
                    </form>
                  )}
                  {(s.status === "DRAFT" || s.status === "REJECTED") && (
                    <form action={submitForReviewAction.bind(null, s.id)}>
                      <button className={btn}><Send className="h-3.5 w-3.5" /> Enviar a revisión</button>
                    </form>
                  )}
                  <form action={deleteSpaceAction.bind(null, s.id)}>
                    <ConfirmButton className={`${btn} text-red-600`} message="¿Eliminar esta publicación? Si tiene campañas registradas, se pausará en lugar de borrarse.">
                      <Trash2 className="h-3.5 w-3.5" /> Eliminar
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
