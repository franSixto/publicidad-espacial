"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lightbulb, TrendingUp } from "lucide-react";
import type { Visibility } from "@prisma/client";
import { saveSpaceAction } from "@/app/actions/spaces";
import { estimatePotential } from "@/lib/estimate";
import { ARGENTINE_PROVINCES, SURFACE_TYPES, formatARS, formatNumber, visibilityLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { LocationPicker } from "./map";
import { Alert, Button, Field, Input, Select, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";

type Cat = { id: string; name: string; description: string; icon: string; priceFactor: number; slug: string };

export type SpaceFormValues = {
  categoryId: string;
  title: string;
  description: string;
  city: string;
  province: string;
  neighborhood: string;
  addressPrivate: string;
  lat: number;
  lng: number;
  widthM: string;
  heightM: string;
  surfaceType: string;
  visibility: Visibility;
  dailyImpressions: string;
  pricePerMonth: string;
  minMonths: string;
  availableFrom: string;
  availableTo: string;
  conditions: string;
  includesInstallation: boolean;
  images: UploadedImage[];
};

const CITY_PRESETS: { city: string; province: string; lat: number; lng: number }[] = [
  { city: "CABA", province: "CABA", lat: -34.6037, lng: -58.3816 },
  { city: "Córdoba", province: "Córdoba", lat: -31.4201, lng: -64.1888 },
  { city: "Rosario", province: "Santa Fe", lat: -32.9442, lng: -60.6505 },
  { city: "Mendoza", province: "Mendoza", lat: -32.8895, lng: -68.8458 },
  { city: "La Plata", province: "Buenos Aires", lat: -34.9214, lng: -57.9545 },
  { city: "Mar del Plata", province: "Buenos Aires", lat: -38.0055, lng: -57.5426 },
  { city: "San Miguel de Tucumán", province: "Tucumán", lat: -26.8083, lng: -65.2176 },
  { city: "Salta", province: "Salta", lat: -24.7821, lng: -65.4232 },
  { city: "Neuquén", province: "Neuquén", lat: -38.9516, lng: -68.0591 },
  { city: "Santa Fe", province: "Santa Fe", lat: -31.6333, lng: -60.7 },
];

const STEPS = ["Tipo", "Ubicación", "Detalles", "Fotos", "Precio", "Revisión"];

const FIELD_STEP: Record<string, number> = {
  categoryId: 0,
  city: 1, province: 1, neighborhood: 1, addressPrivate: 1, lat: 1, lng: 1,
  title: 2, description: 2, widthM: 2, heightM: 2, surfaceType: 2, visibility: 2, dailyImpressions: 2,
  images: 3,
  pricePerMonth: 4, minMonths: 4, availableFrom: 4, availableTo: 4, conditions: 4,
};

export function SpaceWizard({ categories, initial, spaceId, commissionRate }: { categories: Cat[]; initial: SpaceFormValues; spaceId?: string; commissionRate: number }) {
  const [state, action] = useActionState(saveSpaceAction.bind(null, spaceId ?? null), {});
  const [step, setStep] = useState(0);
  const [v, setV] = useState<SpaceFormValues>(initial);
  const [localError, setLocalError] = useState<string | null>(null);
  const set = <K extends keyof SpaceFormValues>(k: K, val: SpaceFormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const fe = state.fieldErrors ?? {};

  // Si el servidor devuelve errores, saltar al primer paso con problemas.
  const [lastState, setLastState] = useState(state);
  if (state !== lastState) {
    setLastState(state);
    const first = Object.keys(state.fieldErrors ?? {}).map((k) => FIELD_STEP[k] ?? 0).sort()[0];
    if (first !== undefined) setStep(first);
  }

  const category = categories.find((c) => c.id === v.categoryId);
  const estimate = useMemo(() => {
    const w = parseFloat(v.widthM), h = parseFloat(v.heightM);
    if (!category || !w || !h) return null;
    return estimatePotential({
      visibility: v.visibility,
      widthM: w,
      heightM: h,
      city: v.city,
      categoryFactor: category.priceFactor,
      isMobile: category.slug === "vehiculos",
    });
  }, [v.widthM, v.heightM, v.visibility, v.city, category]);

  function validateStep(s: number): string | null {
    if (s === 0 && !v.categoryId) return "Elegí el tipo de espacio.";
    if (s === 1 && (!v.city.trim() || !v.province)) return "Completá ciudad y provincia.";
    if (s === 2) {
      if (v.title.trim().length < 8) return "El título debe tener al menos 8 caracteres.";
      if (v.description.trim().length < 30) return "La descripción debe tener al menos 30 caracteres.";
      if (!(parseFloat(v.widthM) > 0) || !(parseFloat(v.heightM) > 0)) return "Indicá ancho y alto en metros.";
    }
    if (s === 4) {
      if (!(parseInt(v.pricePerMonth) >= 1000)) return "Indicá un precio mensual (mínimo $1.000).";
      if (!v.availableFrom) return "Indicá desde cuándo está disponible.";
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    setLocalError(err);
    if (!err) {
      if (step === 2 && !v.dailyImpressions && estimate) set("dailyImpressions", String(estimate.dailyImpressions));
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const hidden = (s: number) => (step === s ? "" : "hidden");

  return (
    <form action={action} className="mx-auto max-w-3xl" onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") e.preventDefault(); }}>
      {/* Progreso */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn("h-1.5 rounded-full transition", i <= step ? "bg-ink" : "bg-gray-200", i < step && "cursor-pointer")}
              aria-label={`Paso ${i + 1}: ${label}`}
            />
            <span className={cn("hidden text-xs font-medium sm:block", i === step ? "text-ink" : "text-ink-muted")}>{label}</span>
          </li>
        ))}
      </ol>

      {(state.error || localError) && <div className="mb-6"><Alert>{localError ?? state.error}</Alert></div>}

      {/* Campos serializados para el server action */}
      {(["categoryId", "title", "description", "city", "province", "neighborhood", "addressPrivate", "widthM", "heightM", "surfaceType", "visibility", "dailyImpressions", "pricePerMonth", "minMonths", "availableFrom", "availableTo", "conditions"] as const).map((k) => (
        <input key={k} type="hidden" name={k} value={String(v[k] ?? "")} />
      ))}
      <input type="hidden" name="lat" value={v.lat} />
      <input type="hidden" name="lng" value={v.lng} />
      <input type="hidden" name="includesInstallation" value={v.includesInstallation ? "true" : "false"} />
      <input type="hidden" name="images" value={JSON.stringify(v.images)} />

      {/* Paso 1 */}
      <section className={hidden(0)}>
        <h2 className="text-2xl font-bold">¿Qué tipo de espacio querés publicar?</h2>
        <p className="mt-1 text-ink-muted">Elegí la categoría que mejor lo describe.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => set("categoryId", c.id)}
              className={cn("flex items-start gap-4 rounded-2xl border-2 p-5 text-left transition", v.categoryId === c.id ? "border-ink bg-stone-50" : "border-gray-200 hover:border-gray-400")}
            >
              <CategoryIcon name={c.icon} className="h-7 w-7 shrink-0 text-brand-500" />
              <span>
                <span className="block font-semibold">{c.name}</span>
                <span className="block text-sm text-ink-muted">{c.description}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Paso 2 */}
      <section className={cn("space-y-5", hidden(1))}>
        <div>
          <h2 className="text-2xl font-bold">¿Dónde está?</h2>
          <p className="mt-1 text-ink-muted">Mostramos sólo una zona aproximada. La dirección exacta se comparte al confirmar una campaña.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CITY_PRESETS.map((c) => (
            <button
              type="button"
              key={c.city}
              onClick={() => setV((p) => ({ ...p, city: c.city, province: c.province, lat: c.lat, lng: c.lng }))}
              className={cn("rounded-full border px-3 py-1 text-sm", v.city === c.city ? "border-ink bg-ink text-white" : "border-gray-300 hover:border-ink")}
            >
              {c.city}
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ciudad" error={fe.city}><Input value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Ej: Rosario" /></Field>
          <Field label="Provincia" error={fe.province}>
            <Select value={v.province} onChange={(e) => set("province", e.target.value)}>
              <option value="">Elegí…</option>
              {ARGENTINE_PROVINCES.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Barrio o zona (público)" error={fe.neighborhood}><Input value={v.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ej: Palermo" /></Field>
          <Field label="Dirección exacta (privada)" hint="Sólo la ve el anunciante con campaña confirmada."><Input value={v.addressPrivate} onChange={(e) => set("addressPrivate", e.target.value)} placeholder="Calle y número" /></Field>
        </div>
        <Field label="Marcá la ubicación en el mapa" error={fe.lat ?? fe.lng} hint={`Hacé clic o arrastrá el punto. Coordenadas: ${v.lat}, ${v.lng}`}>
          <LocationPicker lat={v.lat} lng={v.lng} onChange={(lat, lng) => setV((p) => ({ ...p, lat, lng }))} />
        </Field>
      </section>

      {/* Paso 3 */}
      <section className={cn("space-y-5", hidden(2))}>
        <div>
          <h2 className="text-2xl font-bold">Contanos cómo es</h2>
          <p className="mt-1 text-ink-muted">Un buen título y medidas precisas generan más solicitudes.</p>
        </div>
        <Field label="Título" error={fe.title} hint={`${v.title.length}/100`}>
          <Input value={v.title} maxLength={100} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Medianera de 8×12 m frente a semáforo en Av. Córdoba" />
        </Field>
        <Field label="Descripción" error={fe.description} hint="Incluí qué se ve, quién pasa, horarios de mayor tránsito y cómo se accede para instalar.">
          <Textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={6} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ancho (m)" error={fe.widthM}><Input type="number" step="0.1" min="0.1" value={v.widthM} onChange={(e) => set("widthM", e.target.value)} /></Field>
          <Field label="Alto (m)" error={fe.heightM}><Input type="number" step="0.1" min="0.1" value={v.heightM} onChange={(e) => set("heightM", e.target.value)} /></Field>
          <Field label="Tipo de superficie" error={fe.surfaceType}>
            <Select value={v.surfaceType} onChange={(e) => set("surfaceType", e.target.value)}>
              {SURFACE_TYPES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Visibilidad estimada" error={fe.visibility}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(visibilityLabel) as Visibility[]).map((k) => (
              <button type="button" key={k} onClick={() => set("visibility", k)} className={cn("rounded-xl border-2 px-3 py-3 text-sm font-semibold", v.visibility === k ? "border-ink bg-stone-50" : "border-gray-200")}>
                {visibilityLabel[k]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Audiencia diaria estimada (personas)" error={fe.dailyImpressions} hint={estimate ? `Sugerencia según ubicación y visibilidad: ${formatNumber(estimate.dailyImpressions)}` : "Si no lo sabés, dejalo vacío y lo estimamos."}>
          <Input type="number" min="0" value={v.dailyImpressions} onChange={(e) => set("dailyImpressions", e.target.value)} />
        </Field>
      </section>

      {/* Paso 4 */}
      <section className={cn("space-y-5", hidden(3))}>
        <div>
          <h2 className="text-2xl font-bold">Sumá fotos reales</h2>
          <p className="mt-1 text-ink-muted">Mostrá el espacio de frente, desde la vereda de enfrente y en contexto. La primera foto es la portada.</p>
        </div>
        {fe.images && <Alert>{fe.images[0]}</Alert>}
        <ImageUploader value={v.images} onChange={(imgs) => set("images", imgs)} />
      </section>

      {/* Paso 5 */}
      <section className={cn("space-y-5", hidden(4))}>
        <div>
          <h2 className="text-2xl font-bold">Precio y disponibilidad</h2>
          <p className="mt-1 text-ink-muted">Vos fijás el precio. Te mostramos una referencia orientativa.</p>
        </div>
        {estimate && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="flex items-center gap-2 font-semibold text-emerald-900"><TrendingUp className="h-5 w-5" /> Potencial comercial estimado</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div><p className="text-xs text-emerald-800">Impactos por mes</p><p className="text-lg font-bold text-emerald-950">{formatNumber(estimate.monthlyImpressions)}</p></div>
              <div><p className="text-xs text-emerald-800">Rango de precio sugerido</p><p className="text-lg font-bold text-emerald-950">{formatARS(estimate.suggestedMin)} – {formatARS(estimate.suggestedMax)}</p></div>
              <div className="flex items-end"><Button type="button" variant="secondary" size="sm" onClick={() => set("pricePerMonth", String(estimate.suggested))}>Usar {formatARS(estimate.suggested)}</Button></div>
            </div>
            <p className="mt-3 text-xs text-emerald-800">Referencia calculada con tipo de espacio, tamaño, visibilidad y ciudad. No es una garantía de ingresos.</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio mensual (ARS)" error={fe.pricePerMonth}><Input type="number" min="1000" step="1000" value={v.pricePerMonth} onChange={(e) => set("pricePerMonth", e.target.value)} /></Field>
          <Field label="Duración mínima" error={fe.minMonths}>
            <Select value={v.minMonths} onChange={(e) => set("minMonths", e.target.value)}>
              {[1, 2, 3, 6, 12].map((m) => <option key={m} value={m}>{m} {m === 1 ? "mes" : "meses"}</option>)}
            </Select>
          </Field>
          <Field label="Disponible desde" error={fe.availableFrom}><Input type="date" value={v.availableFrom} onChange={(e) => set("availableFrom", e.target.value)} /></Field>
          <Field label="Disponible hasta (opcional)" error={fe.availableTo}><Input type="date" value={v.availableTo} onChange={(e) => set("availableTo", e.target.value)} /></Field>
        </div>
        {v.pricePerMonth && parseInt(v.pricePerMonth) > 0 && (
          <p className="rounded-xl bg-stone-50 p-4 text-sm text-ink-soft">
            Por cada mes contratado recibirías aproximadamente <strong className="text-ink">{formatARS(Math.round(parseInt(v.pricePerMonth) * (1 - commissionRate)))}</strong> (precio menos la comisión de AdSpace del {Math.round(commissionRate * 100)}%).
          </p>
        )}
        <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
          <input type="checkbox" checked={v.includesInstallation} onChange={(e) => set("includesInstallation", e.target.checked)} className="h-5 w-5 rounded accent-brand-500" />
          <span className="text-sm"><strong>Incluyo la instalación</strong> — me encargo de colocar y retirar el material del anunciante.</span>
        </label>
        <Field label="Condiciones (opcional)" error={fe.conditions} hint="Rubros no aceptados, horarios de acceso, requisitos de seguro, etc.">
          <Textarea value={v.conditions} onChange={(e) => set("conditions", e.target.value)} />
        </Field>
      </section>

      {/* Paso 6 */}
      <section className={cn("space-y-5", hidden(5))}>
        <h2 className="text-2xl font-bold">Revisá tu publicación</h2>
        <dl className="divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {[
            ["Tipo", category?.name ?? "—", 0],
            ["Ubicación", [v.neighborhood, v.city, v.province].filter(Boolean).join(", ") || "—", 1],
            ["Título", v.title || "—", 2],
            ["Medidas", v.widthM && v.heightM ? `${v.widthM} × ${v.heightM} m · ${v.surfaceType}` : "—", 2],
            ["Visibilidad", `${visibilityLabel[v.visibility]} · ${formatNumber(parseInt(v.dailyImpressions) || 0)} personas/día`, 2],
            ["Fotos", `${v.images.length} cargadas`, 3],
            ["Precio", v.pricePerMonth ? `${formatARS(parseInt(v.pricePerMonth))} / mes · mínimo ${v.minMonths} mes(es)` : "—", 4],
          ].map(([k, val, s]) => (
            <div key={k as string} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="flex items-center gap-3 text-right font-medium">
                {val}
                <button type="button" className="text-xs underline" onClick={() => setStep(s as number)}>Editar</button>
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex gap-3 rounded-xl bg-sky-50 p-4 text-sm text-sky-900">
          <Lightbulb className="h-5 w-5 shrink-0" />
          <p>Nuestro equipo revisa cada publicación nueva (normalmente en menos de 24 h). Podés guardarla como borrador y terminarla después.</p>
        </div>
      </section>

      {/* Navegación */}
      <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
        <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Atrás
        </Button>
        <div className="flex gap-2">
          <SubmitButton name="intent" value="draft" variant="secondary">Guardar borrador</SubmitButton>
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="dark" onClick={next}>Siguiente <ChevronRight className="h-4 w-4" /></Button>
          ) : (
            <SubmitButton name="intent" value="submit" pendingText="Enviando…"><Check className="h-4 w-4" /> {spaceId ? "Guardar cambios" : "Enviar a revisión"}</SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}
