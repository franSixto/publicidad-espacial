"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ActionError, assertUser } from "@/lib/auth";
import { messageSchema, type ActionState } from "@/lib/validation";

export async function startConversationAction(spaceId: string) {
  const user = await assertUser();
  if (user.role !== "ADVERTISER") redirect(`/espacios/${spaceId}?error=solo-empresas`);
  const space = await db.space.findUnique({ where: { id: spaceId }, select: { id: true, ownerId: true, status: true } });
  if (!space || space.status !== "PUBLISHED") throw new ActionError("Espacio no disponible.");
  const conv = await db.conversation.upsert({
    where: { spaceId_advertiserId: { spaceId, advertiserId: user.id } },
    create: { spaceId, ownerId: space.ownerId, advertiserId: user.id },
    update: {},
  });
  redirect(`/panel/mensajes/${conv.id}`);
}

export async function sendMessageAction(conversationId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = messageSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: "Escribí un mensaje." };
    const conv = await db.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || (conv.ownerId !== user.id && conv.advertiserId !== user.id)) throw new ActionError("Conversación inexistente.");
    await db.$transaction([
      db.message.create({ data: { conversationId, senderId: user.id, body: parsed.data.body } }),
      db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
    ]);
    revalidatePath(`/panel/mensajes/${conversationId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
}
