"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Range = { start: string; end: string };

const WEEKDAYS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

/** Calendario de disponibilidad: muestra días libres, ocupados y fuera de período. */
export function AvailabilityCalendar({ availableFrom, availableTo, occupied }: { availableFrom: string; availableTo: string | null; occupied: Range[] }) {
  const today = useMemo(() => {
    const d = new Date();
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const [offset, setOffset] = useState(0);
  const from = new Date(availableFrom).getTime();
  const to = availableTo ? new Date(availableTo).getTime() : Infinity;
  const ranges = occupied.map((r) => [new Date(r.start).getTime(), new Date(r.end).getTime()] as const);

  const months = [0, 1].map((i) => {
    const base = new Date(today);
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + offset + i;
    const first = new Date(Date.UTC(y, m, 1));
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const lead = (first.getUTCDay() + 6) % 7;
    const days = Array.from({ length: daysInMonth }, (_, d) => {
      const t = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), d + 1);
      const busy = ranges.some(([s, e]) => t >= s && t < e);
      const outside = t < today || t < from || t > to;
      return { n: d + 1, state: busy ? "busy" : outside ? "off" : "free" };
    });
    return { label: first.toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" }), lead, days };
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setOffset((o) => Math.max(0, o - 1))} disabled={offset === 0} className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-30" aria-label="Mes anterior"><ChevronLeft className="h-4 w-4" /></button>
        <button onClick={() => setOffset((o) => Math.min(22, o + 1))} className="rounded-full p-2 hover:bg-gray-100" aria-label="Mes siguiente"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        {months.map((m) => (
          <div key={m.label}>
            <p className="mb-3 text-center text-sm font-semibold capitalize">{m.label}</p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAYS.map((w) => <span key={w} className="pb-1 font-medium text-ink-muted">{w}</span>)}
              {Array.from({ length: m.lead }).map((_, i) => <span key={`l${i}`} />)}
              {m.days.map((d) => (
                <span
                  key={d.n}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-full",
                    d.state === "free" && "font-medium text-ink",
                    d.state === "busy" && "bg-brand-100 text-brand-800 line-through",
                    d.state === "off" && "text-gray-300",
                  )}
                >
                  {d.n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border border-gray-300" /> Disponible</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-brand-100" /> Reservado</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-gray-100" /> No disponible</span>
      </div>
    </div>
  );
}
