import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { searchSchema } from "./validation";
import type { z } from "zod";

export const PAGE_SIZE = 12;

export const spaceCardSelect = {
  id: true,
  title: true,
  city: true,
  province: true,
  neighborhood: true,
  pricePerMonth: true,
  dailyImpressions: true,
  visibility: true,
  widthM: true,
  heightM: true,
  lat: true,
  lng: true,
  featured: true,
  minMonths: true,
  category: { select: { name: true, slug: true, icon: true } },
  images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  owner: { select: { id: true, name: true, verified: true } },
} satisfies Prisma.SpaceSelect;

export type SpaceCardData = Prisma.SpaceGetPayload<{ select: typeof spaceCardSelect }>;

export type SearchParams = z.infer<typeof searchSchema>;

export async function searchSpaces(p: SearchParams, opts: { all?: boolean } = {}) {
  const where: Prisma.SpaceWhereInput = { status: "PUBLISHED", owner: { status: "ACTIVE" } };
  const and: Prisma.SpaceWhereInput[] = [];
  if (p.q) {
    and.push({
      OR: [
        { title: { contains: p.q, mode: "insensitive" } },
        { description: { contains: p.q, mode: "insensitive" } },
        { neighborhood: { contains: p.q, mode: "insensitive" } },
        { city: { contains: p.q, mode: "insensitive" } },
      ],
    });
  }
  if (p.ciudad) {
    and.push({
      OR: [
        { city: { contains: p.ciudad, mode: "insensitive" } },
        { province: { contains: p.ciudad, mode: "insensitive" } },
        { neighborhood: { contains: p.ciudad, mode: "insensitive" } },
      ],
    });
  }
  if (p.categoria) and.push({ category: { slug: p.categoria } });
  if (p.min !== undefined || p.max !== undefined) {
    and.push({ pricePerMonth: { gte: p.min, lte: p.max || undefined } });
  }
  if (p.desde) {
    const from = new Date(`${p.desde}T00:00:00.000Z`);
    and.push({ availableFrom: { lte: from } });
    and.push({ OR: [{ availableTo: null }, { availableTo: { gte: from } }] });
    // Excluye espacios ocupados en la fecha solicitada
    and.push({
      bookings: {
        none: { status: { in: ["ACCEPTED", "ACTIVE"] }, startDate: { lte: from }, endDate: { gt: from } },
      },
    });
  }
  if (and.length) where.AND = and;

  const orderBy: Prisma.SpaceOrderByWithRelationInput[] =
    p.orden === "precio_asc"
      ? [{ pricePerMonth: "asc" }]
      : p.orden === "precio_desc"
        ? [{ pricePerMonth: "desc" }]
        : p.orden === "audiencia"
          ? [{ dailyImpressions: "desc" }]
          : p.orden === "recientes"
            ? [{ publishedAt: "desc" }]
            : [{ featured: "desc" }, { views: "desc" }, { publishedAt: "desc" }];

  const page = p.pagina ?? 1;
  const [items, total] = await Promise.all([
    db.space.findMany({
      where,
      orderBy,
      select: spaceCardSelect,
      skip: opts.all ? 0 : (page - 1) * PAGE_SIZE,
      take: opts.all ? 500 : PAGE_SIZE,
    }),
    db.space.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getReputation(userId: string) {
  const [agg, completed] = await Promise.all([
    db.review.aggregate({ where: { targetId: userId }, _avg: { rating: true }, _count: true }),
    db.booking.count({ where: { status: "COMPLETED", OR: [{ ownerId: userId }, { advertiserId: userId }] } }),
  ]);
  return { rating: agg._avg.rating ?? null, reviews: agg._count, completed };
}

export async function getOccupiedRanges(spaceId: string) {
  return db.booking.findMany({
    where: { spaceId, status: { in: ["ACCEPTED", "ACTIVE"] }, endDate: { gte: new Date() } },
    select: { startDate: true, endDate: true },
    orderBy: { startDate: "asc" },
  });
}

/** ¿Se superpone el período con otra campaña confirmada del mismo espacio? */
export async function hasOverlap(spaceId: string, start: Date, end: Date, excludeBookingId?: string) {
  const n = await db.booking.count({
    where: {
      spaceId,
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      status: { in: ["ACCEPTED", "ACTIVE"] },
      startDate: { lt: end },
      endDate: { gt: start },
    },
  });
  return n > 0;
}

export async function getActiveCategories() {
  return db.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { spaces: { where: { status: "PUBLISHED" } } } } },
  });
}

export async function unreadCount(userId: string) {
  return db.message.count({
    where: {
      readAt: null,
      senderId: { not: userId },
      conversation: { OR: [{ ownerId: userId }, { advertiserId: userId }] },
    },
  });
}
