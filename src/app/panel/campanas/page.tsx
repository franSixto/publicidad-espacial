import Link from "next/link";
import type { BookingStatus, Prisma } from "@prisma/client";
import { Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookingStatusLabel, formatARS, formatDate } from "@/lib/format";
import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { SafeImage } from "@/components/safe-image";
import { cn } from "@/lib/utils";

const TABS: { key: string; label: string; statuses?: BookingStatus[] }[] = [
  { key: "todas", label: "Todas" },
  { key: "negociacion", label: "En negociación", statuses: ["PENDING"] },
  { key: "activas", label: "Acordadas y en curso", statuses: ["ACCEPTED", "ACTIVE"] },
  { key: "finalizadas", label: "Finalizadas", statuses: ["COMPLETED"] },
  { key: "cerradas", label: "Rechazadas/canceladas", statuses: ["REJECTED", "CANCELLED"] },
];

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireUser();
  const { tab = "todas" } = await searchParams;
  const isOwner = user.role === "OWNER";
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];
  const where: Prisma.BookingWhereInput = {
    ...(isOwner ? { ownerId: user.id } : { advertiserId: user.id }),
    ...(current.statuses ? { status: { in: current.statuses } } : {}),
  };
  const bookings = await db.booking.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      space: { select: { title: true, city: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } } },
      advertiser: { select: { name: true, companyName: true } },
      owner: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title={isOwner ? "Solicitudes y campañas" : "Mis campañas"}
        description={isOwner ? "Respondé propuestas, registrá instalaciones y seguí cada campaña." : "Negociaciones, acuerdos y seguimiento de tus campañas."}
      />
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <Link key={t.key} href={`/panel/campanas?tab=${t.key}`} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium", t.key === current.key ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}>
            {t.label}
          </Link>
        ))}
      </div>
      {bookings.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-6 w-6" />} title="No hay campañas en esta sección" action={!isOwner ? <ButtonLink href="/espacios" variant="secondary">Explorar espacios</ButtonLink> : undefined} />
      ) : (
        <div className="grid gap-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/panel/campanas/${b.id}`}>
              <Card className="flex gap-4 p-4 transition hover:shadow-card">
                <SafeImage src={b.space.images[0]?.url} alt="" className="h-20 w-24 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} label={bookingStatusLabel[b.status]} />
                    {b.awaitingUserId === user.id && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">Tu turno</span>}
                  </div>
                  <p className="mt-1 truncate font-semibold">{b.campaignName}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {b.space.title} · {isOwner ? `de ${b.advertiser.companyName ?? b.advertiser.name}` : `con ${b.owner.name}`}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right text-sm sm:block">
                  <p className="font-bold">{formatARS(b.totalAmount)}</p>
                  <p className="text-ink-muted">{formatDate(b.startDate)} · {b.months} mes(es)</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
