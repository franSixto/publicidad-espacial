import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getActiveCategories, searchSpaces } from "@/lib/queries";
import { searchSchema } from "@/lib/validation";
import { Filters, SortSelect } from "@/components/filters";
import { SpaceCard } from "@/components/space-card";
import { SpacesMap } from "@/components/map";
import { EmptyState, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Explorar espacios publicitarios" };

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function SpacesPage({ searchParams }: { searchParams: SP }) {
  const raw = await searchParams;
  const params = searchSchema.parse(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v || undefined])));
  const isMap = params.vista === "mapa";
  const [categories, result] = await Promise.all([getActiveCategories(), searchSpaces(params, { all: isMap })]);
  const currentCat = categories.find((c) => c.slug === params.categoria);

  const pageHref = (n: number) => {
    const p = new URLSearchParams(Object.entries(raw).filter(([, v]) => typeof v === "string") as [string, string][]);
    p.set("pagina", String(n));
    return `/espacios?${p.toString()}`;
  };

  const mapSpaces = result.items.map((s) => ({ id: s.id, title: s.title, lat: s.lat, lng: s.lng, pricePerMonth: s.pricePerMonth, image: s.images[0]?.url, city: s.city }));

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <Suspense>
        <Filters categories={categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))} />
      </Suspense>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-ink-soft">
          <strong className="text-ink">{result.total}</strong> {result.total === 1 ? "espacio" : "espacios"}
          {currentCat && <> en <strong className="text-ink">{currentCat.name}</strong></>}
          {params.ciudad && <> · {params.ciudad}</>}
        </p>
        <div className="flex items-center gap-2">
          <Link href={isMap ? "/espacios" : "/espacios?vista=mapa"} className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium sm:hidden">
            {isMap ? "Lista" : "Mapa"}
          </Link>
          <Suspense><SortSelect /></Suspense>
        </div>
      </div>

      {result.total === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="No encontramos espacios con esos filtros"
            description="Probá ampliar el presupuesto, cambiar la ciudad o quitar la fecha de disponibilidad."
            action={<ButtonLink href="/espacios" variant="secondary">Ver todos los espacios</ButtonLink>}
          />
        </div>
      ) : (
        <div className={cn("mt-6", isMap && "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]")}>
          {isMap && (
            <div className="order-first lg:order-last">
              <div className="lg:sticky lg:top-24">
                <SpacesMap spaces={mapSpaces} className="h-[420px] lg:h-[calc(100vh-8rem)]" />
              </div>
            </div>
          )}
          <div className={cn("grid gap-x-6 gap-y-10", isMap ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
            {result.items.map((s) => (
              <SpaceCard key={s.id} space={s} />
            ))}
          </div>
        </div>
      )}

      {!isMap && result.pages > 1 && (
        <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginación">
          {Array.from({ length: result.pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={pageHref(n)} className={cn("flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold", n === result.page ? "bg-ink text-white" : "hover:bg-gray-100")}>
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
