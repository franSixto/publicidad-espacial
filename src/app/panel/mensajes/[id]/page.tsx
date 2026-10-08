import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Avatar, Card } from "@/components/ui";
import { MessageComposer, AutoRefresh } from "@/components/message-composer";
import { cn } from "@/lib/utils";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await db.conversation.findUnique({
    where: { id },
    include: {
      space: { select: { id: true, title: true } },
      owner: { select: { id: true, name: true, avatarUrl: true } },
      advertiser: { select: { id: true, name: true, companyName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!c || (c.ownerId !== user.id && c.advertiserId !== user.id)) notFound();
  await db.message.updateMany({ where: { conversationId: id, senderId: { not: user.id }, readAt: null }, data: { readAt: new Date() } });

  const other = c.ownerId === user.id ? { id: c.advertiser.id, name: c.advertiser.companyName ?? c.advertiser.name, avatar: c.advertiser.avatarUrl } : { id: c.owner.id, name: c.owner.name, avatar: c.owner.avatarUrl };
  const booking = await db.booking.findFirst({ where: { spaceId: c.spaceId, advertiserId: c.advertiserId }, orderBy: { createdAt: "desc" }, select: { id: true, campaignName: true } });

  return (
    <Card className="flex h-[calc(100vh-10rem)] min-h-[500px] flex-col overflow-hidden">
      <AutoRefresh seconds={10} />
      <div className="flex items-center gap-3 border-b border-gray-200 p-4">
        <Link href="/panel/mensajes" className="rounded-full p-1 hover:bg-gray-100 lg:hidden" aria-label="Volver"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar name={other.name} url={other.avatar} size={40} />
        <div className="min-w-0 flex-1">
          <Link href={`/usuarios/${other.id}`} className="font-semibold hover:underline">{other.name}</Link>
          <Link href={`/espacios/${c.space.id}`} className="block truncate text-xs text-ink-muted hover:underline">{c.space.title}</Link>
        </div>
        {booking && <Link href={`/panel/campanas/${booking.id}`} className="hidden rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold hover:border-ink sm:block">Ver campaña</Link>}
      </div>
      <div className="flex flex-1 flex-col-reverse overflow-y-auto p-4">
        <div className="space-y-3">
          <p className="mx-auto flex max-w-md items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
            <ShieldAlert className="h-4 w-4 shrink-0" /> Por tu seguridad, mantené las negociaciones y pagos dentro de AdSpace.
          </p>
          {c.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", mine ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-gray-100 text-ink")}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={cn("mt-1 text-[10px]", mine ? "text-white/60" : "text-ink-muted")}>{formatDateTime(m.createdAt)}{mine && m.readAt ? " · Leído" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <MessageComposer conversationId={c.id} />
    </Card>
  );
}
