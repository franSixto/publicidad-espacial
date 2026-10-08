"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

type Cat = { slug: string; name: string };

export function SearchBar({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [ciudad, setCiudad] = useState("");
  const [categoria, setCategoria] = useState("");
  const [max, setMax] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (ciudad) p.set("ciudad", ciudad);
    if (categoria) p.set("categoria", categoria);
    if (max) p.set("max", max);
    router.push(`/espacios?${p.toString()}`);
  }

  const cell = "flex flex-col px-6 py-3 text-left rounded-full hover:bg-gray-100 transition focus-within:bg-gray-100";
  const label = "text-xs font-semibold text-ink";
  const input = "bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none";

  return (
    <form onSubmit={submit} className="w-full rounded-3xl border border-gray-200 bg-white p-2 shadow-lift md:rounded-full">
      <div className="grid gap-1 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center md:divide-x md:divide-gray-200">
        <label className={cell}>
          <span className={label}>Ubicación</span>
          <input className={input} placeholder="Ciudad, barrio o provincia" value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
        </label>
        <label className={cell}>
          <span className={label}>Tipo de espacio</span>
          <select className={`${input} -ml-1`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todos</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className={cell}>
          <span className={label}>Presupuesto mensual</span>
          <select className={`${input} -ml-1`} value={max} onChange={(e) => setMax(e.target.value)}>
            <option value="">Cualquiera</option>
            <option value="100000">Hasta $100.000</option>
            <option value="300000">Hasta $300.000</option>
            <option value="600000">Hasta $600.000</option>
            <option value="1000000">Hasta $1.000.000</option>
            <option value="2000000">Hasta $2.000.000</option>
          </select>
        </label>
        <div className="p-1 md:pl-2">
          <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-500 px-6 font-semibold text-white transition hover:bg-brand-600 md:w-auto">
            <Search className="h-5 w-5" />
            <span>Buscar</span>
          </button>
        </div>
      </div>
    </form>
  );
}
