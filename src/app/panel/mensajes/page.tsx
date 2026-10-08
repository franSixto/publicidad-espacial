import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { Avatar, Card, EmptyState, PageHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await db.conversation.findMany({
    where: { OR: [{ ownerId: user.id }, { advertiserId: user.id }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      space: { select: { title: true } },
      owner: { select: { id: true, name: true, avatarUrl: true } },
      advertiser: { select: { id: true, name: true, companyName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { readAt: null, senderId: { not: user.id } } } } },
    },
  });
  return (
    <>
      <PageHeader title="Mensajes" description="Conversaciones con propietarios y anunciantes." />
      {conversations.length === 0 ? (
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No tenés conversaciones" description="Las consultas sobre espacios aparecerán acá." />
      ) : (
        <Card className="divide-y divide-gray-100">
          {conversations.map((c) => {
            const other = c.ownerId === user.id ? { name: c.advertiser.companyName ?? c.advertiser.name, avatar: c.advertiser.avatarUrl } : { name: c.owner.name, avatar: c.owner.avatarUrl };
            const last = c.messages[0];
            const unread = c._count.messages;
            return (
              <Link key={c.id} href={`/panel/mensajes/${c.id}`} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                <Avatar name={other.name} url={other.avatar} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn("truncate", unread ? "font-bold" : "font-semibold")}>{other.name}</p>
                    {last && <span className="shrink-0 text-xs text-ink-muted">{timeAgo(last.createdAt)}</span>}
                  </div>
                  <p className="truncate text-xs text-ink-muted">{c.space.title}</p>
                  <p className={cn("truncate text-sm", unread ? "font-medium text-ink" : "text-ink-soft")}>{last?.body ?? "Sin mensajes aún"}</p>
                </div>
                {unread > 0 && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-bold text-white">{unread}</span>}
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}
