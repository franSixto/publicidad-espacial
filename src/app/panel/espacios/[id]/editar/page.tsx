import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { commissionRate } from "@/lib/pricing";
import { toDateInput } from "@/lib/format";
import { SpaceWizard } from "@/components/space-wizard";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Editar espacio" };

export default async function EditSpacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  const { id } = await params;
  const { error } = await searchParams;
  const [space, categories] = await Promise.all([
    db.space.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!space || (space.ownerId !== user.id && user.role !== "ADMIN")) notFound();
  return (
    <div>
      {error === "fotos" && <div className="mx-auto mb-6 max-w-3xl"><Alert tone="amber">Subí al menos una foto antes de enviar a revisión.</Alert></div>}
      <SpaceWizard
        spaceId={space.id}
        categories={categories}
        commissionRate={commissionRate()}
        initial={{
          categoryId: space.categoryId, title: space.title, description: space.description, city: space.city, province: space.province,
          neighborhood: space.neighborhood ?? "", addressPrivate: space.addressPrivate ?? "", lat: space.lat, lng: space.lng,
          widthM: String(space.widthM), heightM: String(space.heightM), surfaceType: space.surfaceType, visibility: space.visibility,
          dailyImpressions: String(space.dailyImpressions), pricePerMonth: String(space.pricePerMonth), minMonths: String(space.minMonths),
          availableFrom: toDateInput(space.availableFrom), availableTo: toDateInput(space.availableTo), conditions: space.conditions ?? "",
          includesInstallation: space.includesInstallation, images: space.images.map((i) => ({ url: i.url, publicId: i.publicId })),
        }}
      />
    </div>
  );
}
