import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, FileCheck2, HandCoins, Search, ShieldCheck, Upload, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { getActiveCategories, spaceCardSelect } from "@/lib/queries";
import { SearchBar } from "@/components/search-bar";
import { SpaceCard } from "@/components/space-card";
import { SafeImage } from "@/components/safe-image";
import { CategoryIcon } from "@/components/category-icon";
import { ButtonLink } from "@/components/ui";
import { formatARS, formatCompact } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, stats, cities] = await Promise.all([
    getActiveCategories(),
    db.space.findMany({
      where: { status: "PUBLISHED", owner: { status: "ACTIVE" } },
      orderBy: [{ featured: "desc" }, { views: "desc" }],
      take: 8,
      select: spaceCardSelect,
    }),
    db.space.aggregate({ where: { status: "PUBLISHED" }, _count: true, _sum: { dailyImpressions: true } }),
    db.space.groupBy({ by: ["city"], where: { status: "PUBLISHED" }, _count: true, orderBy: { _count: { city: "desc" } }, take: 6 }),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_#ffe5de_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_left,_#f5f5f4_0%,_transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {stats._count} espacios disponibles en Argentina
            </span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl md:text-6xl">
              Llevá tu marca a <span className="text-brand-500">la calle</span>.
              <br className="hidden sm:block" /> Convertí tus espacios en ingresos.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-muted">
              Frentes, medianeras, vehículos, vidrieras y terrenos listos para publicidad. Precios claros en pesos, propietarios verificados y campañas con seguimiento.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <SearchBar categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-ink-muted">Popular:</span>
            {cities.map((c) => (
              <Link key={c.city} href={`/espacios?ciudad=${encodeURIComponent(c.city)}`} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-ink-soft hover:border-gray-400">
                {c.city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Explorá por tipo de espacio</h2>
            <p className="mt-1 text-ink-muted">Cada formato llega a una audiencia distinta.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} href={`/espacios?categoria=${c.slug}`} className="group relative overflow-hidden rounded-2xl">
              <SafeImage src={c.imageUrl} alt={c.name} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <span className="mb-2 inline-flex rounded-lg bg-white/20 p-1.5 backdrop-blur"><CategoryIcon name={c.icon} className="h-4 w-4" /></span>
                <p className="font-semibold leading-tight">{c.name}</p>
                <p className="text-xs text-white/80">{c._count.spaces} espacios</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Espacios destacados</h2>
            <p className="mt-1 text-ink-muted">Alta visibilidad, propietarios verificados.</p>
          </div>
          <Link href="/espacios" className="inline-flex items-center gap-1 text-sm font-semibold text-ink hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((s) => (
            <SpaceCard key={s.id} space={s} />
          ))}
        </div>
      </section>

      {/* Métricas */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-3xl bg-ink px-8 py-10 text-white sm:grid-cols-3">
          <div>
            <p className="text-4xl font-extrabold">{stats._count}</p>
            <p className="mt-1 text-white/70">espacios publicados</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">{formatCompact((stats._sum.dailyImpressions ?? 0) * 30)}</p>
            <p className="mt-1 text-white/70">impactos mensuales estimados</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">{formatARS(0)}</p>
            <p className="mt-1 text-white/70">para publicar: cobramos sólo si concretás</p>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto mt-20 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-3xl border border-gray-200 p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Para empresas</p>
          <h3 className="mt-2 text-2xl font-bold">Encontrá, negociá y medí</h3>
          <ul className="mt-6 space-y-5">
            {[
              { icon: Search, t: "Buscá por zona, tipo y presupuesto", d: "Filtrá y explorá en el mapa con audiencia estimada." },
              { icon: HandCoins, t: "Proponé tu precio", d: "Enviá una solicitud y negociá directamente con el propietario." },
              { icon: Camera, t: "Seguimiento con evidencia", d: "Fotos de instalación y retiro en cada campaña." },
            ].map((i) => (
              <li key={i.t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><i.icon className="h-5 w-5" /></span>
                <div><p className="font-semibold">{i.t}</p><p className="text-sm text-ink-muted">{i.d}</p></div>
              </li>
            ))}
          </ul>
          <ButtonLink href="/registro?rol=ADVERTISER" variant="dark" className="mt-8">Crear cuenta de empresa</ButtonLink>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-stone-50 p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Para propietarios</p>
          <h3 className="mt-2 text-2xl font-bold">Ganá dinero con lo que ya tenés</h3>
          <ul className="mt-6 space-y-5">
            {[
              { icon: Upload, t: "Publicá en minutos", d: "Fotos, medidas y precio. Te sugerimos un valor orientativo." },
              { icon: FileCheck2, t: "Vos decidís", d: "Aceptá, rechazá o contraofertá cada solicitud." },
              { icon: Wallet, t: "Cobrás con transparencia", d: "Ves el desglose de la comisión antes de aceptar." },
            ].map((i) => (
              <li key={i.t} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm"><i.icon className="h-5 w-5" /></span>
                <div><p className="font-semibold">{i.t}</p><p className="text-sm text-ink-muted">{i.d}</p></div>
              </li>
            ))}
          </ul>
          <ButtonLink href="/registro?rol=OWNER" className="mt-8">Publicar mi espacio</ButtonLink>
        </div>
      </section>

      {/* Confianza */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, t: "Perfiles verificados", d: "Validamos la identidad de propietarios y empresas." },
            { icon: ShieldCheck, t: "Moderación de publicaciones", d: "Cada espacio es revisado antes de publicarse." },
            { icon: Wallet, t: "Precios transparentes", d: "Precio final en pesos y comisión visible en cada operación." },
          ].map((i) => (
            <div key={i.t} className="flex gap-4">
              <i.icon className="h-7 w-7 shrink-0 text-brand-500" />
              <div><p className="font-semibold">{i.t}</p><p className="text-sm text-ink-muted">{i.d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
