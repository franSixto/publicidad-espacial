"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Booking } from "@prisma/client";
import { db } from "@/lib/db";
import { ActionError, assertUser, type CurrentUser } from "@/lib/auth";
import { computeBreakdown } from "@/lib/pricing";
import { hasOverlap } from "@/lib/queries";
import { initiatePayment } from "@/lib/payments";
import { addMonths, formatARS, formatDate } from "@/lib/format";
import { bookingRequestSchema, counterOfferSchema, imageSchema, zodErrors, type ActionState } from "@/lib/validation";
import { z } from "zod";

function fail(e: unknown): ActionState {
  if (e instanceof ActionError) return { error: e.message };
  throw e;
}

async function loadBookingFor(user: CurrentUser, bookingId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: { space: { select: { title: true } } } });
  if (!booking) throw new ActionError("Campaña inexistente.");
  if (booking.ownerId !== user.id && booking.advertiserId !== user.id && user.role !== "ADMIN") {
    throw new ActionError("No tenés acceso a esta campaña.");
  }
  return booking;
}

const otherParty = (b: Booking, userId: string) => (b.ownerId === userId ? b.advertiserId : b.ownerId);

export async function requestBookingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let bookingId: string;
  try {
    const user = await assertUser(["ADVERTISER"]);
    const parsed = bookingRequestSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const d = parsed.data;

    const space = await db.space.findUnique({ where: { id: d.spaceId } });
    if (!space || space.status !== "PUBLISHED") throw new ActionError("El espacio no está disponible.");
    if (space.ownerId === user.id) throw new ActionError("No podés contratar tu propio espacio.");

    const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
    const end = addMonths(d.startDate, d.months);
    if (d.startDate < today) return { fieldErrors: { startDate: ["La fecha de inicio no puede ser pasada"] }, error: "Revisá la fecha." };
    if (d.startDate < space.availableFrom) return { fieldErrors: { startDate: [`Disponible desde el ${formatDate(space.availableFrom)}`] }, error: "Revisá la fecha." };
    if (space.availableTo && end > space.availableTo) throw new ActionError(`El espacio está disponible hasta el ${formatDate(space.availableTo)}.`);
    if (d.months < space.minMonths) throw new ActionError(`La duración mínima es de ${space.minMonths} meses.`);
    if (await hasOverlap(space.id, d.startDate, end)) throw new ActionError("Ese período se superpone con otra campaña confirmada. Elegí otras fechas.");

    const pending = await db.booking.count({ where: { spaceId: space.id, advertiserId: user.id, status: "PENDING" } });
    if (pending > 0) throw new ActionError("Ya tenés una solicitud en negociación para este espacio.");

    const breakdown = computeBreakdown(d.monthlyPrice, d.months);
    const booking = await db.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          spaceId: space.id,
          advertiserId: user.id,
          ownerId: space.ownerId,
          campaignName: d.campaignName,
          startDate: d.startDate,
          endDate: end,
          months: d.months,
          monthlyPrice: d.monthlyPrice,
          ...breakdown,
          awaitingUserId: space.ownerId,
          offers: { create: { authorId: user.id, monthlyPrice: d.monthlyPrice, note: d.message } },
          events: { create: { actorId: user.id, type: "REQUESTED", note: "Solicitud de contratación enviada" } },
        },
      });
      // Deja el mensaje inicial también en la conversación con el propietario.
      const conv = await tx.conversation.upsert({
        where: { spaceId_advertiserId: { spaceId: space.id, advertiserId: user.id } },
        create: { spaceId: space.id, ownerId: space.ownerId, advertiserId: user.id },
        update: { lastMessageAt: new Date() },
      });
      await tx.message.create({
        data: {
          conversationId: conv.id,
          senderId: user.id,
          body: `📩 Nueva solicitud "${d.campaignName}": ${d.months} mes(es) desde el ${formatDate(d.startDate)} a ${formatARS(d.monthlyPrice)}/mes.\n\n${d.message}`,
        },
      });
      return b;
    });
    bookingId = booking.id;
  } catch (e) {
    return fail(e);
  }
  redirect(`/panel/campanas/${bookingId}?enviada=1`);
}

export async function counterOfferAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = counterOfferSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const b = await loadBookingFor(user, parsed.data.bookingId);
    if (b.status !== "PENDING") throw new ActionError("La negociación ya está cerrada.");
    if (b.awaitingUserId !== user.id) throw new ActionError("Estás esperando la respuesta de la otra parte.");

    const breakdown = computeBreakdown(parsed.data.monthlyPrice, b.months, b.commissionRate);
    await db.booking.update({
      where: { id: b.id },
      data: {
        monthlyPrice: parsed.data.monthlyPrice,
        ...breakdown,
        awaitingUserId: otherParty(b, user.id),
        offers: { create: { authorId: user.id, monthlyPrice: parsed.data.monthlyPrice, note: parsed.data.note } },
        events: { create: { actorId: user.id, type: "COUNTER_OFFER", note: `Nueva propuesta: ${formatARS(parsed.data.monthlyPrice)}/mes` } },
      },
    });
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true, message: "Propuesta enviada." };
  } catch (e) {
    return fail(e);
  }
}

export async function acceptBookingAction(bookingId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    const b = await loadBookingFor(user, bookingId);
    if (b.status !== "PENDING") throw new ActionError("La solicitud ya no está pendiente.");
    if (b.awaitingUserId !== user.id) throw new ActionError("La otra parte debe responder tu última propuesta.");
    if (await hasOverlap(b.spaceId, b.startDate, b.endDate, b.id)) {
      throw new ActionError("El período ya fue reservado por otra campaña. Proponé nuevas fechas.");
    }
    const agreement =
      `Campaña "${b.campaignName}" en "${b.space.title}". ` +
      `Período: ${formatDate(b.startDate)} al ${formatDate(b.endDate)} (${b.months} mes/es). ` +
      `Precio mensual acordado: ${formatARS(b.monthlyPrice)}. Total: ${formatARS(b.totalAmount)}. ` +
      `Comisión AdSpace (${Math.round(b.commissionRate * 100)}%): ${formatARS(b.commissionAmount)}. ` +
      `Neto propietario: ${formatARS(b.ownerPayout)}.`;
    await db.booking.update({
      where: { id: b.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        awaitingUserId: null,
        agreementText: agreement,
        events: { create: { actorId: user.id, type: "ACCEPTED", note: "Acuerdo confirmado por ambas partes" } },
      },
    });
    await initiatePayment(b.id);
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true, message: "¡Acuerdo confirmado!" };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectBookingAction(bookingId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    const b = await loadBookingFor(user, bookingId);
    if (b.status !== "PENDING") throw new ActionError("La solicitud ya no está pendiente.");
    const isOwner = b.ownerId === user.id;
    await db.booking.update({
      where: { id: b.id },
      data: {
        status: isOwner ? "REJECTED" : "CANCELLED",
        awaitingUserId: null,
        events: { create: { actorId: user.id, type: isOwner ? "REJECTED" : "CANCELLED", note: isOwner ? "El propietario rechazó la solicitud" : "El anunciante retiró la solicitud" } },
      },
    });
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelBookingAction(bookingId: string): Promise<ActionState> {
  try {
    const user = await assertUser();
    const b = await loadBookingFor(user, bookingId);
    if (b.status !== "ACCEPTED") throw new ActionError("Sólo se pueden cancelar campañas acordadas que aún no comenzaron.");
    await db.$transaction([
      db.booking.update({
        where: { id: b.id },
        data: { status: "CANCELLED", events: { create: { actorId: user.id, type: "CANCELLED", note: "Campaña cancelada antes de la instalación" } } },
      }),
      db.payment.updateMany({ where: { bookingId: b.id, status: "PENDING" }, data: { status: "FAILED" } }),
    ]);
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const evidenceSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(["INSTALLATION", "COMPLETION"]),
  note: z.string().trim().max(500).optional(),
  image: z.string().transform((s, ctx) => {
    try {
      return imageSchema.parse(JSON.parse(s));
    } catch {
      ctx.addIssue({ code: "custom", message: "Subí una foto como evidencia" });
      return z.NEVER;
    }
  }),
});

export async function addEvidenceAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = evidenceSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const d = parsed.data;
    const b = await loadBookingFor(user, d.bookingId);
    if (b.ownerId !== user.id) throw new ActionError("Sólo el propietario registra la instalación y el retiro.");
    const transition =
      d.type === "INSTALLATION" ? (b.status === "ACCEPTED" ? "ACTIVE" : null) : b.status === "ACTIVE" ? "COMPLETED" : null;
    if (!transition) throw new ActionError("La campaña no está en una etapa que admita esta evidencia.");

    await db.booking.update({
      where: { id: b.id },
      data: {
        status: transition,
        evidences: { create: { uploadedById: user.id, type: d.type, url: d.image.url, note: d.note || null } },
        events: {
          create: {
            actorId: user.id,
            type: d.type === "INSTALLATION" ? "INSTALLED" : "COMPLETED",
            note: d.type === "INSTALLATION" ? "Instalación registrada con evidencia fotográfica" : "Campaña finalizada y material retirado",
          },
        },
      },
    });
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true, message: "Evidencia registrada." };
  } catch (e) {
    return fail(e);
  }
}
