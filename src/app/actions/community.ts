"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ActionError, assertUser } from "@/lib/auth";
import { reportSchema, reviewSchema, zodErrors, type ActionState } from "@/lib/validation";

export async function createReviewAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const b = await db.booking.findUnique({ where: { id: parsed.data.bookingId } });
    if (!b || (b.ownerId !== user.id && b.advertiserId !== user.id)) throw new ActionError("Campaña inexistente.");
    if (b.status !== "COMPLETED") throw new ActionError("Sólo podés calificar campañas finalizadas.");
    const exists = await db.review.findUnique({ where: { bookingId_authorId: { bookingId: b.id, authorId: user.id } } });
    if (exists) throw new ActionError("Ya calificaste esta campaña.");
    await db.review.create({
      data: {
        bookingId: b.id,
        authorId: user.id,
        targetId: b.ownerId === user.id ? b.advertiserId : b.ownerId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
    revalidatePath(`/panel/campanas/${b.id}`);
    return { ok: true, message: "¡Gracias por tu reseña!" };
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
}

export async function createReportAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = reportSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    if (!parsed.data.spaceId && !parsed.data.reportedUserId) throw new ActionError("Falta el objeto del reporte.");
    const recent = await db.report.count({ where: { reporterId: user.id, createdAt: { gte: new Date(Date.now() - 3600_000) } } });
    if (recent >= 5) throw new ActionError("Enviaste demasiados reportes. Probá más tarde.");
    await db.report.create({ data: { reporterId: user.id, ...parsed.data } });
    return { ok: true, message: "Gracias. Nuestro equipo revisará el reporte." };
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
}
