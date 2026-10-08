import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Clock, Eye, Layers, MapPin, MessageCircle, Ruler, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOccupiedRanges, getReputation } from "@/lib/queries";
import { commissionRate } from "@/lib/pricing";
import { formatARS, formatCompact, formatDate, formatNumber, toDateInput, visibilityLabel } from "@/lib/format";
import { startConversationAction } from "@/app/actions/messages";
import { Gallery } from "@/components/gallery";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { BookingForm } from "@/components/booking-form";
import { ApproxMap } from "@/components/map";
import { ReportButton } from "@/components/report-button";
import { Alert, Avatar, Badge, ButtonLink, Rating, Stars } from "@/components/ui";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

async function getSpace(id: string) {
  return db.space.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
      owner: { select: { id: true, name: true, avatarUrl: true, verified: true, bio: true, createdAt: true, city: true, status: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getSpace((await params).id);
  if (!s) return { title: "Espacio no encontrado" };
  return {
    title: s.title,
    description: s.description.slice(0, 155),
    openGraph: { images: s.images[0] ? [s.images[0].url] : [] },
  };
}

export default async function SpaceDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const [space, user] = await Promise.all([getSpace(id), getCurrentUser()]);
  if (!space) notFound();

  const isOwner = user?.id === space.ownerId;
  const isAdmin = user?.role === "ADMIN";
  if ((space.status !== "PUBLISHED" || space.owner.status !== "ACTIVE") && !isOwner && !isAdmin) notFound();

  if (!isOwner) await db.space.update({ where: { id }, data: { views: { increment: 1 } } });

  const [rep, occupied, reviews] = await Promise.all([
    getReputation(space.ownerId),
    getOccupiedRanges(space.id),
    db.review.findMany({
      where: { targetId: space.ownerId },
      include: { author: { select: { name: true, companyName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
  const minDate = space.availableFrom > today ? space.availableFrom : today;
  const area = space.widthM * space.heightM;

  const features = [
    { icon: Ruler, label: "Medidas", value: `${space.widthM} × ${space.heightM} m (${formatNumber(Math.round(area * 10) / 10)} m²)` },
    { icon: Layers, label: "Superficie", value: space.surfaceType },
    { icon: Eye, label: "Visibilidad", value: visibilityLabel[space.visibility] },
    { icon: Sparkles, label: "Audiencia estimada", value: `${formatNumber(space.dailyImpressions)} personas/día` },
    { icon: Clock, label: "Duración mínima", value: `${space.minMonths} ${space.minMonths === 1 ? "mes" : "meses"}` },
    { icon: CalendarDays, label: "Disponibilidad", value: `Desde ${formatDate(space.availableFrom)}${space.availableTo ? ` hasta ${formatDate(space.availableTo)}` : ""}` },
    { icon: Wrench, label: "Instalación", value: space.includesInstallation ? "Incluida por el propietario" : "A cargo del anunciante" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {space.status !== "PUBLISHED" && (
        <div className="mb-6"><Alert tone="amber">Vista previa: esta publicación no es visible al público (estado actual: {space.status.toLowerCase()}).</Alert></div>
      )}
      {error === "solo-empresas" && <div className="mb-6"><Alert tone="amber">Para contactar propietarios necesitás una cuenta de empresa anunciante.</Alert></div>}

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/espacios?categoria=${space.category.slug}`} className="font-medium text-brand-600 hover:underline">{space.category.name}</Link>
          {space.featured && <Badge tone="brand">Destacado</Badge>}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{space.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
          <Rating value={rep.rating} count={rep.reviews} />
          <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{[space.neighborhood, space.city, space.province].filter(Boolean).join(", ")}</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{formatCompact(space.views)} visitas</span>
        </div>
      </div>

      <Gallery images={space.images.map((i) => i.url)} title={space.title} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-8">
            <div>
              <h2 className="text-xl font-semibold">Publicado por {space.owner.name}</h2>
              <p className="text-sm text-ink-muted">
                {rep.completed} campañas completadas · En AdSpace desde {formatDate(space.owner.createdAt, { month: "long", year: "numeric" })}
              </p>
            </div>
            <Link href={`/usuarios/${space.owner.id}`} className="relative">
              <Avatar name={space.owner.name} url={space.owner.avatarUrl} size={56} />
              {space.owner.verified && <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white fill-emerald-500 text-white" />}
            </Link>
          </div>

          <section>
            <h2 className="text-xl font-semibold">Sobre este espacio</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{space.description}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Características</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.label} className="flex gap-3">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
                  <div>
                    <dt className="text-sm font-medium">{f.label}</dt>
                    <dd className="text-sm text-ink-muted">{f.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {space.conditions && (
            <section>
              <h2 className="text-xl font-semibold">Condiciones del propietario</h2>
              <p className="mt-3 whitespace-pre-line rounded-2xl bg-stone-50 p-5 text-sm leading-relaxed text-ink-soft">{space.conditions}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold">Calendario de disponibilidad</h2>
            <p className="mt-1 text-sm text-ink-muted">Los períodos reservados corresponden a campañas confirmadas.</p>
            <div className="mt-5 rounded-2xl border border-gray-200 p-5">
              <AvailabilityCalendar
                availableFrom={space.availableFrom.toISOString()}
                availableTo={space.availableTo?.toISOString() ?? null}
                occupied={occupied.map((o) => ({ start: o.startDate.toISOString(), end: o.endDate.toISOString() }))}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Ubicación aproximada</h2>
            <p className="mt-1 text-sm text-ink-muted">La dirección exacta se comparte cuando se confirma la campaña.</p>
            <div className="mt-4"><ApproxMap lat={space.lat} lng={space.lng} /></div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Rating value={rep.rating} className="text-xl" /> {rep.reviews > 0 && <span>· {rep.reviews} reseñas del propietario</span>}
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Este propietario todavía no tiene reseñas.</p>
            ) : (
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                {reviews.map((r) => (
                  <div key={r.id}>
                    <div className="flex items-center gap-3">
                      <Avatar name={r.author.name} url={r.author.avatarUrl} size={40} />
                      <div>
                        <p className="text-sm font-semibold">{r.author.companyName ?? r.author.name}</p>
                        <p className="text-xs text-ink-muted">{formatDate(r.createdAt, { month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                    <div className="mt-2"><Stars value={r.rating} /></div>
                    <p className="mt-1 text-sm text-ink-soft">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {user && !isOwner && <ReportButton spaceId={space.id} />}
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-lift">
            <p>
              <span className="text-2xl font-bold">{formatARS(space.pricePerMonth)}</span> <span className="text-ink-muted">/ mes</span>
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              ≈ {formatARS(Math.round((space.pricePerMonth / (space.dailyImpressions * 30 || 1)) * 1000))} cada mil impactos (CPM estimado)
            </p>
            <div className="mt-5">
              {isOwner ? (
                <div className="space-y-3">
                  <Alert tone="blue">Este es tu espacio.</Alert>
                  <ButtonLink href={`/panel/espacios/${space.id}/editar`} variant="secondary" className="w-full">Editar publicación</ButtonLink>
                </div>
              ) : !user ? (
                <div className="space-y-3">
                  <ButtonLink href={`/ingresar?next=/espacios/${space.id}`} className="w-full" size="lg">Ingresá para contratar</ButtonLink>
                  <ButtonLink href={`/registro?rol=ADVERTISER&next=/espacios/${space.id}`} variant="secondary" className="w-full">Crear cuenta de empresa</ButtonLink>
                </div>
              ) : user.role === "ADVERTISER" ? (
                space.status === "PUBLISHED" ? (
                  <>
                    <BookingForm spaceId={space.id} price={space.pricePerMonth} minMonths={space.minMonths} minDate={toDateInput(minDate)} commissionRate={commissionRate()} />
                    <form action={startConversationAction.bind(null, space.id)} className="mt-3">
                      <button className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold underline hover:bg-gray-50">
                        <MessageCircle className="h-4 w-4" /> Hacer una consulta al propietario
                      </button>
                    </form>
                  </>
                ) : (
                  <Alert tone="amber">Este espacio no está disponible para contratar.</Alert>
                )
              ) : (
                <Alert tone="amber">Sólo las cuentas de empresa anunciante pueden enviar solicitudes de contratación.</Alert>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gray-200 p-4 text-sm text-ink-soft">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <p>Tus datos y pagos quedan registrados en AdSpace. Nunca transfieras dinero por fuera de la plataforma.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
