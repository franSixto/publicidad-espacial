"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { List, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import { cn } from "@/lib/utils";
import { inputClass } from "./ui";

type Cat = { slug: string; name: string; icon: string };

export function Filters({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function update(patch: Record<string, string | undefined>) {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!("pagina" in patch)) p.delete("pagina");
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update({
      q: (f.get("q") as string) || undefined,
      ciudad: (f.get("ciudad") as string) || undefined,
      min: (f.get("min") as string) || undefined,
      max: (f.get("max") as string) || undefined,
      desde: (f.get("desde") as string) || undefined,
    });
    setOpen(false);
  }

  const active = sp.get("categoria");
  const vista = sp.get("vista") ?? "lista";
  const activeFilters = ["q", "ciudad", "min", "max", "desde"].filter((k) => sp.get(k)).length;

  return (
    <div className={cn("space-y-4", pending && "opacity-70 transition-opacity")}>
      <div className="flex items-center gap-3">
        <div className="no-scrollbar flex flex-1 gap-6 overflow-x-auto border-b border-gray-200">
          <button onClick={() => update({ categoria: undefined })} className={cn("flex shrink-0 flex-col items-center gap-1 border-b-2 pb-3 pt-1 text-xs font-medium transition", !active ? "border-ink text-ink" : "border-transparent text-ink-muted hover:border-gray-300 hover:text-ink")}>
            <CategoryIcon name="sparkles" className="h-6 w-6" />
            Todos
          </button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => update({ categoria: c.slug })} className={cn("flex shrink-0 flex-col items-center gap-1 border-b-2 pb-3 pt-1 text-xs font-medium transition", active === c.slug ? "border-ink text-ink" : "border-transparent text-ink-muted hover:border-gray-300 hover:text-ink")}>
              <CategoryIcon name={c.icon} className="h-6 w-6" />
              {c.name}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen((o) => !o)} className="relative inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-gray-300 px-4 text-sm font-semibold hover:border-ink">
          <SlidersHorizontal className="h-4 w-4" /> <span className="hidden sm:inline">Filtros</span>
          {activeFilters > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white">{activeFilters}</span>}
        </button>
        <div className="hidden shrink-0 rounded-xl border border-gray-300 p-1 sm:flex">
          <button onClick={() => update({ vista: undefined, pagina: sp.get("pagina") ?? undefined })} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium", vista === "lista" ? "bg-ink text-white" : "text-ink-soft")}>
            <List className="h-4 w-4" /> Lista
          </button>
          <button onClick={() => update({ vista: "mapa", pagina: sp.get("pagina") ?? undefined })} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium", vista === "mapa" ? "bg-ink text-white" : "text-ink-soft")}>
            <MapIcon className="h-4 w-4" /> Mapa
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-6">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold">Palabra clave</span>
            <input name="q" defaultValue={sp.get("q") ?? ""} placeholder="medianera, taxi, vidriera…" className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Ciudad o barrio</span>
            <input name="ciudad" defaultValue={sp.get("ciudad") ?? ""} placeholder="Rosario" className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Precio mín. (ARS/mes)</span>
            <input name="min" type="number" min={0} step={1000} defaultValue={sp.get("min") ?? ""} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Precio máx. (ARS/mes)</span>
            <input name="max" type="number" min={0} step={1000} defaultValue={sp.get("max") ?? ""} className={inputClass} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold">Disponible desde</span>
            <input name="desde" type="date" defaultValue={sp.get("desde") ?? ""} className={inputClass} />
          </label>
          <div className="flex items-center justify-end gap-2 sm:col-span-2 lg:col-span-6">
            <button type="button" onClick={() => { update({ q: undefined, ciudad: undefined, min: undefined, max: undefined, desde: undefined }); setOpen(false); }} className="inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold underline">
              <X className="h-4 w-4" /> Limpiar
            </button>
            <button className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white">Aplicar filtros</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <select
      aria-label="Ordenar"
      value={sp.get("orden") ?? "relevancia"}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        p.set("orden", e.target.value);
        p.delete("pagina");
        router.push(`${pathname}?${p.toString()}`, { scroll: false });
      }}
      className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium"
    >
      <option value="relevancia">Más relevantes</option>
      <option value="precio_asc">Menor precio</option>
      <option value="precio_desc">Mayor precio</option>
      <option value="audiencia">Mayor audiencia</option>
      <option value="recientes">Más recientes</option>
    </select>
  );
}
