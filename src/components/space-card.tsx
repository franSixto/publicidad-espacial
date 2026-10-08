import Link from "next/link";
import { BadgeCheck, Eye, MapPin, Ruler } from "lucide-react";
import type { SpaceCardData } from "@/lib/queries";
import { formatARS, formatCompact } from "@/lib/format";
import { SafeImage } from "./safe-image";

export function SpaceCard({ space }: { space: SpaceCardData }) {
  return (
    <Link href={`/espacios/${space.id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100">
        <SafeImage
          src={space.images[0]?.url}
          alt={space.title}
          className="h-full w-full transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">{space.category.name}</span>
          {space.featured && <span className="rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">Destacado</span>}
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink">{space.title}</h3>
        </div>
        <p className="flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{[space.neighborhood, space.city].filter(Boolean).join(", ")}</span>
        </p>
        <div className="flex items-center gap-3 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatCompact(space.dailyImpressions)}/día</span>
          <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{space.widthM} × {space.heightM} m</span>
          {space.owner.verified && <span className="inline-flex items-center gap-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verificado</span>}
        </div>
        <p className="pt-1 text-ink">
          <span className="font-bold">{formatARS(space.pricePerMonth)}</span> <span className="text-sm text-ink-muted">/ mes</span>
        </p>
      </div>
    </Link>
  );
}
