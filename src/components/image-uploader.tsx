"use client";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { SafeImage } from "./safe-image";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; publicId?: string | null };

const MAX_BYTES = 6 * 1024 * 1024;

export async function uploadImage(file: File): Promise<UploadedImage> {
  if (file.size > MAX_BYTES) throw new Error(`${file.name}: supera los 6 MB`);
  const cfg = await fetch("/api/uploads").then((r) => r.json());
  if (cfg.error) throw new Error(cfg.error);
  if (cfg.mode === "cloudinary") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", cfg.apiKey);
    fd.append("timestamp", String(cfg.timestamp));
    fd.append("signature", cfg.signature);
    fd.append("folder", cfg.folder);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: "POST", body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message ?? "Error subiendo a Cloudinary");
    return { url: json.secure_url, publicId: json.public_id };
  }
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error subiendo la imagen");
  return json;
}

export function ImageUploader({ value, onChange, max = 10 }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const next = [...value];
    for (const f of Array.from(files).slice(0, max - value.length)) {
      try {
        next.push(await uploadImage(f));
      } catch (e) {
        setError((e as Error).message);
      }
    }
    onChange(next);
    setBusy(false);
  }

  const move = (i: number, d: number) => {
    const n = [...value];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x);
    onChange(n);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 px-6 py-10 text-center transition hover:border-ink hover:bg-stone-50"
      >
        {busy ? <Loader2 className="h-8 w-8 animate-spin text-ink-muted" /> : <ImagePlus className="h-8 w-8 text-ink-muted" />}
        <p className="mt-3 font-semibold">Arrastrá tus fotos o hacé clic para elegirlas</p>
        <p className="text-sm text-ink-muted">JPG, PNG o WEBP · hasta 6 MB · máximo {max} fotos</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="…o pegá la URL https:// de una imagen" className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm" />
        <button
          type="button"
          onClick={() => {
            if (!url.startsWith("https://")) return setError("La URL debe comenzar con https://");
            onChange([...value, { url }]);
            setUrl("");
          }}
          className="rounded-xl border border-gray-300 px-4 text-sm font-semibold hover:border-ink"
        >
          Agregar
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((img, i) => (
            <div key={img.url + i} className={cn("group relative overflow-hidden rounded-xl", i === 0 && "ring-2 ring-brand-500")}>
              <SafeImage src={img.url} alt="" className="aspect-[4/3] w-full" />
              {i === 0 && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold"><Star className="h-3 w-3" /> Portada</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  {i > 0 && <button type="button" onClick={() => move(i, -1)} className="rounded-full bg-white p-1.5" aria-label="Mover antes"><ArrowLeft className="h-3.5 w-3.5" /></button>}
                  {i < value.length - 1 && <button type="button" onClick={() => move(i, 1)} className="rounded-full bg-white p-1.5" aria-label="Mover después"><ArrowRight className="h-3.5 w-3.5" /></button>}
                </div>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded-full bg-white p-1.5 text-red-600" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
