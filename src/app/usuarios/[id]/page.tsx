import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getReputation, spaceCardSelect } from "@/lib/queries";
import { formatDate, roleLabel } from "@/lib/format";
import { Avatar, Badge, Card, Rating, Stars } from "@/components/ui";
import { SpaceCard } from "@/components/space-card";
import { ReportButton } from "@/components/report-button";

export const metadata: Metadata = { title: "Perfil" };

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, viewer] = await Promise.all([
    db.user.findUnique({ where: { id }, select: { id: true, name: true, companyName: true, role: true, bio: true, avatarUrl: true, city: true, verified: true, createdAt: true, status: true } }),
    getCurrentUser(),
  ]);
  if (!user || user.status !== "ACTIVE" || user.role === "ADMIN") notFound();
  const [rep, spaces, reviews] = await Promise.all([
    getReputation(user.id),
    user.role === "OWNER" ? db.space.findMany({ where: { ownerId: id, status: "PUBLISHED" }, select: spaceCardSelect, take: 12 }) : Promise.resolve([]),
    db.review.findMany({ where: { targetId: id }, orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, companyName: true, avatarUrl: true } } } }),
  ]);
  const display = user.companyName ?? user.name;

  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-8">
      <aside>
        <Card className="p-6 text-center shadow-card lg:sticky lg:top-24">
          <div className="relative mx-auto w-fit">
            <Avatar name={display} url={user.avatarUrl} size={104} />
            {user.verified && <BadgeCheck className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white fill-emerald-500 text-white" />}
          </div>
          <h1 className="mt-4 text-2xl font-bold">{display}</h1>
          {user.companyName && <p className="text-sm text-ink-muted">{user.name}</p>}
          <div className="mt-2 flex justify-center"><Badge tone="brand">{roleLabel[user.role]}</Badge></div>
          <dl className="mt-6 grid grid-cols-3 divide-x divide-gray-200 border-y border-gray-200 py-4">
            <div><dt className="text-xs text-ink-muted">Reseñas</dt><dd className="font-bold">{rep.reviews}</dd></div>
            <div><dt className="text-xs text-ink-muted">Calificación</dt><dd className="font-bold">{rep.rating ? rep.rating.toFixed(1) + " ★" : "—"}</dd></div>
            <div><dt className="text-xs text-ink-muted">Campañas</dt><dd className="font-bold">{rep.completed}</dd></div>
          </dl>
          <ul className="mt-4 space-y-2 text-left text-sm text-ink-soft">
            {user.city && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {user.city}</li>}
            <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> En AdSpace desde {formatDate(user.createdAt, { month: "long", year: "numeric" })}</li>
            {user.verified && <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-emerald-600" /> Identidad verificada</li>}
          </ul>
          {viewer && viewer.id !== user.id && <div className="mt-6 text-left"><ReportButton userId={user.id} label="Denunciar este perfil" /></div>}
        </Card>
      </aside>
      <div className="space-y-10">
        {user.bio && (
          <section>
            <h2 className="text-xl font-semibold">Acerca de {user.name.split(" ")[0]}</h2>
            <p className="mt-3 whitespace-pre-line text-ink-soft">{user.bio}</p>
          </section>
        )}
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold"><Rating value={rep.rating} className="text-xl" /> Reseñas</h2>
          {reviews.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">Todavía no tiene reseñas.</p>
          ) : (
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {reviews.map((r) => (
                <Card key={r.id} className="p-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.author.name} url={r.author.avatarUrl} size={36} />
                    <div><p className="text-sm font-semibold">{r.author.companyName ?? r.author.name}</p><p className="text-xs text-ink-muted">{formatDate(r.createdAt)}</p></div>
                  </div>
                  <div className="mt-3"><Stars value={r.rating} /></div>
                  <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
        {spaces.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold">Espacios de {user.name.split(" ")[0]}</h2>
            <div className="mt-5 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {spaces.map((s) => <SpaceCard key={s.id} space={s} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
