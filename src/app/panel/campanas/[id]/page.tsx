import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, CheckCircle2, Circle, FileText, MapPin, MessageCircle, Receipt } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingStatusLabel, formatARS, formatDate, formatDateTime, paymentStatusLabel } from "@/lib/format";
import { Alert, Avatar, Card, StatusBadge } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { CancelButton, CounterOfferForm, DecisionButtons, EvidenceForm, ReviewForm } from "@/components/booking-actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle de campaña" };

const EVENT_LABEL: Record<string, string> = {
  REQUESTED: "Solicitud enviada",
  COUNTER_OFFER: "Contrapropuesta",
  ACCEPTED: "Acuerdo confirmado",
  REJECTED: "Solicitud rechazada",
  CANCELLED: "Cancelada",
  INSTALLED: "Instalación registrada",
  COMPLETED: "Campaña finalizada",
  PAYMENT: "Pago",
};

export default async function CampaignDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ enviada?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { enviada } = await searchParams;
  const b = await db.booking.findUnique({
    where: { id },
    include: {
      space: { select: { id: true, title: true, city: true, neighborhood: true, addressPrivate: true, includesInstallation: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
      advertiser: { select: { id: true, name: true, companyName: true, avatarUrl: true } },
      owner: { select: { id: true, name: true, avatarUrl: true } },
      offers: { orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true } } } },
      events: { orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } },
      evidences: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      reviews: true,
    },
  });
  if (!b) notFound();
  const isOwner = b.ownerId === user.id;
  const isAdvertiser = b.advertiserId === user.id;
  if (!isOwner && !isAdvertiser && user.role !== "ADMIN") notFound();

  const conversation = await db.conversation.findUnique({ where: { spaceId_advertiserId: { spaceId: b.spaceId, advertiserId: b.advertiserId } }, select: { id: true } });
  const other = isOwner ? { name: b.advertiser.companyName ?? b.advertiser.name, avatar: b.advertiser.avatarUrl, id: b.advertiser.id } : { name: b.owner.name, avatar: b.owner.avatarUrl, id: b.owner.id };
  const myTurn = b.status === "PENDING" && b.awaitingUserId === user.id;
  const payment = b.payments[0];
  const myReview = b.reviews.find((r) => r.authorId === user.id);
  const confirmed = ["ACCEPTED", "ACTIVE", "COMPLETED"].includes(b.status);

  const steps = [
    { label: "Solicitud", done: true },
    { label: "Acuerdo", done: confirmed },
    { label: "Pago", done: payment?.status === "PAID" },
    { label: "Instalación", done: b.status === "ACTIVE" || b.status === "COMPLETED" },
    { label: "Finalización", done: b.status === "COMPLETED" },
  ];

  return (
    <div className="space-y-6">
      {enviada && <Alert tone="green">¡Solicitud enviada! Te avisaremos cuando el propietario responda.</Alert>}

      {/* Encabezado */}
      <Card className="flex flex-col gap-5 p-5 sm:flex-row">
        <Link href={`/espacios/${b.space.id}`} className="shrink-0">
          <SafeImage src={b.space.images[0]?.url} alt="" className="h-28 w-full rounded-xl sm:w-40" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={b.status} label={bookingStatusLabel[b.status]} />
            {myTurn && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">Esperando tu respuesta</span>}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{b.campaignName}</h1>
          <Link href={`/espacios/${b.space.id}`} className="text-sm text-ink-soft hover:underline">{b.space.title}</Link>
          <p className="mt-1 text-sm text-ink-muted">
            {formatDate(b.startDate)} → {formatDate(b.endDate)} · {b.months} {b.months === 1 ? "mes" : "meses"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          <Link href={`/usuarios/${other.id}`} className="flex items-center gap-2 text-sm">
            <Avatar name={other.name} url={other.avatar} size={36} />
            <span><span className="block text-xs text-ink-muted">{isOwner ? "Anunciante" : "Propietario"}</span><span className="font-semibold">{other.name}</span></span>
          </Link>
          {conversation && (
            <Link href={`/panel/mensajes/${conversation.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:border-ink">
              <MessageCircle className="h-3.5 w-3.5" /> Mensajes
            </Link>
          )}
        </div>
      </Card>

      {/* Progreso */}
      {!["REJECTED", "CANCELLED"].includes(b.status) && (
        <Card className="p-5">
          <ol className="grid grid-cols-5 gap-2">
            {steps.map((s, i) => (
              <li key={s.label} className="flex flex-col items-center gap-2 text-center">
                <div className="flex w-full items-center">
                  <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : steps[i - 1].done ? "bg-emerald-500" : "bg-gray-200")} />
                  {s.done ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <Circle className="h-6 w-6 text-gray-300" />}
                  <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : s.done ? "bg-emerald-500" : "bg-gray-200")} />
                </div>
                <span className={cn("text-xs font-medium", s.done ? "text-ink" : "text-ink-muted")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* Negociación */}
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Receipt className="h-5 w-5" /> Propuestas económicas</h2>
            <ol className="mt-4 space-y-3">
              {b.offers.map((o, i) => {
                const mine = o.authorId === user.id;
                const last = i === b.offers.length - 1;
                return (
                  <li key={o.id} className={cn("rounded-xl border p-4", last && b.status === "PENDING" ? "border-ink" : "border-gray-200")}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm"><strong>{mine ? "Vos" : o.author.name}</strong> propuso <strong>{formatARS(o.monthlyPrice)}/mes</strong></p>
                      <span className="text-xs text-ink-muted">{formatDateTime(o.createdAt)}</span>
                    </div>
                    {o.note && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{o.note}</p>}
                  </li>
                );
              })}
            </ol>
            {b.status === "PENDING" && (
              <div className="mt-5 space-y-5 border-t border-gray-200 pt-5">
                {myTurn ? (
                  <>
                    <DecisionButtons bookingId={b.id} canAccept isOwner={isOwner} />
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-semibold underline">Proponer otro precio</summary>
                      <div className="mt-3"><CounterOfferForm bookingId={b.id} current={b.monthlyPrice} /></div>
                    </details>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-ink-muted">Esperando la respuesta de <strong className="text-ink">{other.name}</strong> a la última propuesta.</p>
                    {isAdvertiser && <DecisionButtons bookingId={b.id} canAccept={false} isOwner={false} />}
                  </>
                )}
              </div>
            )}
          </Card>

          {/* Acuerdo */}
          {confirmed && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5" /> Registro del acuerdo</h2>
              <p className="mt-3 rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-ink-soft">{b.agreementText}</p>
              {b.acceptedAt && <p className="mt-2 text-xs text-ink-muted">Confirmado el {formatDateTime(b.acceptedAt)}</p>}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-gray-200 p-4 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Dirección del espacio</p>
                  <p className="text-ink-soft">{b.space.addressPrivate || `${b.space.neighborhood ?? ""} ${b.space.city}`.trim()}</p>
                  <p className="text-xs text-ink-muted">Instalación: {b.space.includesInstallation ? "a cargo del propietario" : "a cargo del anunciante"}</p>
                </div>
              </div>
              {b.status === "ACCEPTED" && <div className="mt-4"><CancelButton bookingId={b.id} /></div>}
            </Card>
          )}

          {/* Evidencia */}
          {(confirmed || b.evidences.length > 0) && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-semibold"><Camera className="h-5 w-5" /> Evidencia fotográfica</h2>
              {b.evidences.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">Todavía no se registró la instalación.</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {b.evidences.map((e) => (
                    <figure key={e.id} className="overflow-hidden rounded-xl border border-gray-200">
                      <a href={e.url} target="_blank" rel="noreferrer"><SafeImage src={e.url} alt="" className="aspect-[4/3] w-full" /></a>
                      <figcaption className="p-3 text-sm">
                        <p className="font-semibold">{e.type === "INSTALLATION" ? "Instalación" : "Finalización / retiro"}</p>
                        {e.note && <p className="text-ink-soft">{e.note}</p>}
                        <p className="mt-1 text-xs text-ink-muted">{formatDateTime(e.createdAt)}</p>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {isOwner && b.status === "ACCEPTED" && (
                <div className="mt-5 border-t border-gray-200 pt-5">
                  <p className="mb-3 text-sm font-semibold">Registrá la instalación con una foto</p>
                  <EvidenceForm bookingId={b.id} type="INSTALLATION" />
                </div>
              )}
              {isOwner && b.status === "ACTIVE" && (
                <div className="mt-5 border-t border-gray-200 pt-5">
                  <p className="mb-3 text-sm font-semibold">Al terminar, registrá el retiro con una foto</p>
                  <EvidenceForm bookingId={b.id} type="COMPLETION" />
                </div>
              )}
            </Card>
          )}

          {/* Reseña */}
          {b.status === "COMPLETED" && (isOwner || isAdvertiser) && (
            <Card className="p-5">
              <h2 className="font-semibold">Reseña</h2>
              <div className="mt-3">
                {myReview ? <p className="text-sm text-ink-soft">Ya calificaste esta campaña con {myReview.rating} ★: “{myReview.comment}”</p> : <ReviewForm bookingId={b.id} targetName={other.name} />}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {/* Desglose */}
          <Card className="p-5">
            <h2 className="font-semibold">Desglose económico</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Precio mensual</dt><dd>{formatARS(b.monthlyPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Duración</dt><dd>{b.months} {b.months === 1 ? "mes" : "meses"}</dd></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold"><dt>Total campaña</dt><dd>{formatARS(b.totalAmount)}</dd></div>
              {(isOwner || user.role === "ADMIN") && (
                <>
                  <div className="flex justify-between text-ink-muted"><dt>Comisión AdSpace ({Math.round(b.commissionRate * 100)}%)</dt><dd>− {formatARS(b.commissionAmount)}</dd></div>
                  <div className="flex justify-between font-semibold text-emerald-700"><dt>Recibís</dt><dd>{formatARS(b.ownerPayout)}</dd></div>
                </>
              )}
            </dl>
          </Card>

          {/* Pago */}
          {payment && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Pago</h2>
                <StatusBadge status={payment.status} label={paymentStatusLabel[payment.status]} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">
                {payment.status === "PAID"
                  ? `Acreditado el ${formatDate(payment.paidAt!)}.`
                  : payment.checkoutUrl
                    ? "Completá el pago para confirmar la instalación."
                    : "Los pagos en línea se habilitarán próximamente. Por ahora, el equipo de AdSpace coordina el cobro y lo registra aquí."}
              </p>
              {payment.checkoutUrl && payment.status === "PENDING" && isAdvertiser && (
                <a href={payment.checkoutUrl} className="mt-3 inline-flex rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Pagar ahora</a>
              )}
              <p className="mt-2 text-xs text-ink-muted">Ref: {payment.providerRef ?? "—"} · {payment.provider}</p>
            </Card>
          )}

          {/* Timeline */}
          <Card className="p-5">
            <h2 className="font-semibold">Historial</h2>
            <ol className="mt-4 space-y-4 border-l border-gray-200 pl-4">
              {b.events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-ink" />
                  <p className="text-sm font-medium">{EVENT_LABEL[e.type] ?? e.type}</p>
                  {e.note && <p className="text-xs text-ink-soft">{e.note}</p>}
                  <p className="text-xs text-ink-muted">{formatDateTime(e.createdAt)}{e.actor ? ` · ${e.actor.name}` : ""}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
