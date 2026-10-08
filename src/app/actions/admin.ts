"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser, ActionError } from "@/lib/auth";
import { categorySchema, zodErrors, type ActionState } from "@/lib/validation";

const admin = () => assertUser(["ADMIN"]);

// ── Moderación de espacios ──────────────────────────────────────────────
export async function approveSpaceAction(spaceId: string) {
  await admin();
  await db.space.update({ where: { id: spaceId }, data: { status: "PUBLISHED", rejectionReason: null, publishedAt: new Date() } });
  revalidatePath("/admin/espacios");
}

export async function rejectSpaceAction(spaceId: string, formData: FormData) {
  await admin();
  const reason = z.string().trim().min(5).max(500).safeParse(formData.get("reason"));
  if (!reason.success) throw new ActionError("Indicá el motivo del rechazo (mínimo 5 caracteres).");
  await db.space.update({ where: { id: spaceId }, data: { status: "REJECTED", rejectionReason: reason.data } });
  revalidatePath("/admin/espacios");
}

export async function toggleFeaturedAction(spaceId: string) {
  await admin();
  const s = await db.space.findUniqueOrThrow({ where: { id: spaceId } });
  await db.space.update({ where: { id: spaceId }, data: { featured: !s.featured } });
  revalidatePath("/admin/espacios");
}

export async function adminPauseSpaceAction(spaceId: string) {
  await admin();
  await db.space.update({ where: { id: spaceId }, data: { status: "PAUSED" } });
  revalidatePath("/admin/espacios");
}

// ── Usuarios ────────────────────────────────────────────────────────────
export async function toggleSuspendAction(userId: string) {
  const me = await admin();
  if (me.id === userId) throw new ActionError("No podés suspender tu propia cuenta.");
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const suspend = u.status === "ACTIVE";
  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status: suspend ? "SUSPENDED" : "ACTIVE" } }),
    // Al suspender, se pausan sus publicaciones activas.
    ...(suspend ? [db.space.updateMany({ where: { ownerId: userId, status: "PUBLISHED" }, data: { status: "PAUSED" } })] : []),
  ]);
  revalidatePath("/admin/usuarios");
}

export async function toggleVerifiedAction(userId: string) {
  await admin();
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  await db.user.update({ where: { id: userId }, data: { verified: !u.verified } });
  revalidatePath("/admin/usuarios");
}

// ── Pagos (conciliación manual hasta integrar la pasarela) ──────────────
export async function markPaymentAction(paymentId: string, status: "PAID" | "REFUNDED" | "FAILED") {
  const me = await admin();
  const p = await db.payment.update({ where: { id: paymentId }, data: { status, paidAt: status === "PAID" ? new Date() : undefined } });
  await db.bookingEvent.create({
    data: { bookingId: p.bookingId, actorId: me.id, type: "PAYMENT", note: { PAID: "Pago acreditado", REFUNDED: "Pago reintegrado", FAILED: "Pago marcado como fallido" }[status] },
  });
  revalidatePath("/admin/campanas");
}

// ── Reportes ────────────────────────────────────────────────────────────
export async function resolveReportAction(reportId: string, status: "RESOLVED" | "DISMISSED", formData: FormData) {
  await admin();
  const note = String(formData.get("note") ?? "").slice(0, 500) || null;
  await db.report.update({ where: { id: reportId }, data: { status, resolutionNote: note } });
  revalidatePath("/admin/reportes");
}

// ── Categorías ──────────────────────────────────────────────────────────
export async function saveCategoryAction(categoryId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await admin();
    const parsed = categorySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const clash = await db.category.findFirst({ where: { slug: parsed.data.slug, id: categoryId ? { not: categoryId } : undefined } });
    if (clash) return { error: "Ya existe una categoría con ese slug.", fieldErrors: { slug: ["Slug en uso"] } };
    if (categoryId) await db.category.update({ where: { id: categoryId }, data: parsed.data });
    else await db.category.create({ data: parsed.data });
    revalidatePath("/admin/categorias");
    revalidatePath("/");
    return { ok: true, message: "Categoría guardada." };
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
}

export async function toggleCategoryAction(categoryId: string) {
  await admin();
  const c = await db.category.findUniqueOrThrow({ where: { id: categoryId } });
  await db.category.update({ where: { id: categoryId }, data: { active: !c.active } });
  revalidatePath("/admin/categorias");
}
