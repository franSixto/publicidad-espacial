"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ActionError, assertUser } from "@/lib/auth";
import { estimatePotential } from "@/lib/estimate";
import { spaceSchema, zodErrors, type ActionState } from "@/lib/validation";

function parseForm(formData: FormData) {
  const raw = Object.fromEntries(formData) as Record<string, unknown>;
  try {
    raw.images = JSON.parse(String(raw.images ?? "[]"));
  } catch {
    raw.images = [];
  }
  return spaceSchema.safeParse(raw);
}

export async function saveSpaceAction(spaceId: string | null, _: ActionState, formData: FormData): Promise<ActionState> {
  let id: string;
  let intent: "draft" | "submit";
  try {
    const user = await assertUser(["OWNER", "ADMIN"]);
    const parsed = parseForm(formData);
    if (!parsed.success) return zodErrors(parsed.error);
    const { images, intent: i, ...data } = parsed.data;
    intent = i;

    const category = await db.category.findFirst({ where: { id: data.categoryId, active: true } });
    if (!category) return { error: "Categoría inválida.", fieldErrors: { categoryId: ["Categoría inválida"] } };
    if (!data.dailyImpressions) {
      data.dailyImpressions = estimatePotential({
        visibility: data.visibility,
        widthM: data.widthM,
        heightM: data.heightM,
        city: data.city,
        categoryFactor: category.priceFactor,
        isMobile: category.slug === "vehiculos",
      }).dailyImpressions;
    }

    let status: "DRAFT" | "PENDING" | "PUBLISHED" | "PAUSED" = intent === "draft" ? "DRAFT" : "PENDING";
    if (spaceId) {
      const existing = await db.space.findUnique({ where: { id: spaceId } });
      if (!existing || (existing.ownerId !== user.id && user.role !== "ADMIN")) throw new ActionError("No podés editar este espacio.");
      // Las publicaciones ya aprobadas conservan su estado al editarse.
      if (intent === "submit" && (existing.status === "PUBLISHED" || existing.status === "PAUSED")) status = existing.status;
      await db.$transaction([
        db.spaceImage.deleteMany({ where: { spaceId } }),
        db.space.update({
          where: { id: spaceId },
          data: {
            ...data,
            availableTo: data.availableTo ?? null,
            status,
            rejectionReason: status === "PENDING" ? null : existing.rejectionReason,
            images: { create: images.map((img, idx) => ({ url: img.url, publicId: img.publicId ?? null, sortOrder: idx })) },
          },
        }),
      ]);
      id = spaceId;
    } else {
      const created = await db.space.create({
        data: {
          ...data,
          ownerId: user.id,
          status,
          images: { create: images.map((img, idx) => ({ url: img.url, publicId: img.publicId ?? null, sortOrder: idx })) },
        },
      });
      id = created.id;
    }
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
  revalidatePath("/panel/espacios");
  revalidatePath(`/espacios/${id}`);
  redirect(`/panel/espacios?guardado=${intent}`);
}

async function ownSpace(spaceId: string) {
  const user = await assertUser(["OWNER", "ADMIN"]);
  const space = await db.space.findUnique({ where: { id: spaceId } });
  if (!space || (space.ownerId !== user.id && user.role !== "ADMIN")) throw new ActionError("No podés modificar este espacio.");
  return space;
}

export async function togglePauseAction(spaceId: string) {
  const space = await ownSpace(spaceId);
  if (space.status !== "PUBLISHED" && space.status !== "PAUSED") throw new ActionError("Sólo se pueden pausar publicaciones aprobadas.");
  await db.space.update({ where: { id: spaceId }, data: { status: space.status === "PUBLISHED" ? "PAUSED" : "PUBLISHED" } });
  revalidatePath("/panel/espacios");
}

export async function submitForReviewAction(spaceId: string) {
  const space = await ownSpace(spaceId);
  if (space.status !== "DRAFT" && space.status !== "REJECTED") throw new ActionError("La publicación ya fue enviada.");
  const images = await db.spaceImage.count({ where: { spaceId } });
  if (!images) redirect(`/panel/espacios/${spaceId}/editar?error=fotos`);
  await db.space.update({ where: { id: spaceId }, data: { status: "PENDING", rejectionReason: null } });
  revalidatePath("/panel/espacios");
}

export async function deleteSpaceAction(spaceId: string) {
  await ownSpace(spaceId);
  const live = await db.booking.count({ where: { spaceId, status: { in: ["ACCEPTED", "ACTIVE", "COMPLETED"] } } });
  if (live > 0) {
    // Con historial de campañas no se borra (se conserva el registro); se pausa.
    await db.space.update({ where: { id: spaceId }, data: { status: "PAUSED" } });
  } else {
    await db.space.delete({ where: { id: spaceId } });
  }
  revalidatePath("/panel/espacios");
}
