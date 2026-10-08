"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid3x3, X } from "lucide-react";
import { SafeImage } from "./safe-image";
import { cn } from "@/lib/utils";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const imgs = images.length ? images : [""];

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % imgs.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + imgs.length) % imgs.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, imgs.length]);

  return (
    <>
      <div
        className={cn(
          "relative grid h-[280px] gap-2 overflow-hidden rounded-2xl sm:h-[440px]",
          imgs.length === 2 && "sm:grid-cols-2",
          (imgs.length === 3 || imgs.length === 4) && "sm:grid-cols-3 sm:grid-rows-2",
          imgs.length >= 5 && "sm:grid-cols-4 sm:grid-rows-2",
        )}
      >
        <button className={cn(imgs.length >= 3 && "sm:row-span-2", imgs.length >= 3 && "sm:col-span-2")} onClick={() => setOpen(0)}>
          <SafeImage src={imgs[0]} alt={title} loading="eager" className="h-full w-full transition hover:brightness-90" />
        </button>
        {imgs.slice(1, imgs.length === 4 ? 3 : 5).map((src, i) => (
          <button key={i} className="hidden sm:block" onClick={() => setOpen(i + 1)}>
            <SafeImage src={src} alt={`${title} ${i + 2}`} className="h-full w-full transition hover:brightness-90" />
          </button>
        ))}
        {imgs.length > 1 && (
          <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-ink bg-white px-3 py-1.5 text-sm font-semibold shadow">
            <Grid3x3 className="h-4 w-4" /> Ver {imgs.length} fotos
          </button>
        )}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal>
          <button onClick={() => setOpen(null)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Cerrar"><X /></button>
          <button onClick={() => setOpen((open - 1 + imgs.length) % imgs.length)} className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Anterior"><ChevronLeft /></button>
          <SafeImage src={imgs[open]} alt={title} className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
          <button onClick={() => setOpen((open + 1) % imgs.length)} className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Siguiente"><ChevronRight /></button>
          <p className="absolute bottom-4 text-sm text-white/70">{open + 1} / {imgs.length}</p>
        </div>
      )}
    </>
  );
}
