"use client";
import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

/** Imagen con respaldo visual si la URL falla (evita tarjetas rotas). */
export function SafeImage({ src, alt, className, loading = "lazy" }: { src?: string | null; alt: string; className?: string; loading?: "lazy" | "eager" }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Si la imagen falló antes de la hidratación, onError no se dispara: se verifica al montar.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div role="img" aria-label={alt} className={cn("flex items-center justify-center bg-gradient-to-br from-stone-200 via-stone-100 to-brand-100 text-stone-400", className)}>
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} loading={loading} onError={() => setFailed(true)} className={cn("object-cover", className)} />;
}
