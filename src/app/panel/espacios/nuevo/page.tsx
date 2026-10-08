import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { commissionRate } from "@/lib/pricing";
import { SpaceWizard } from "@/components/space-wizard";
import { Alert } from "@/components/ui";

export const metadata: Metadata = { title: "Publicar espacio" };

export default async function NewSpacePage({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const user = await requireRole(["OWNER", "ADMIN"]);
  const { bienvenida } = await searchParams;
  const categories = await db.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div>
      {bienvenida && <div className="mx-auto mb-6 max-w-3xl"><Alert tone="green">¡Bienvenido/a a AdSpace! Publicá tu primer espacio en pocos pasos.</Alert></div>}
      <SpaceWizard
        categories={categories}
        commissionRate={commissionRate()}
        initial={{
          categoryId: "", title: "", description: "", city: user.city ?? "", province: "", neighborhood: "", addressPrivate: "",
          lat: -34.6037, lng: -58.3816, widthM: "", heightM: "", surfaceType: "Pared revocada", visibility: "MEDIUM",
          dailyImpressions: "", pricePerMonth: "", minMonths: "1", availableFrom: new Date().toISOString().slice(0, 10), availableTo: "",
          conditions: "", includesInstallation: false, images: [],
        }}
      />
    </div>
  );
}
