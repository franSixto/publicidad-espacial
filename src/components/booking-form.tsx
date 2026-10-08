"use client";
import { useActionState, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { requestBookingAction } from "@/app/actions/bookings";
import { formatARS } from "@/lib/format";
import { Alert, Input, Textarea, inputClass } from "./ui";
import { SubmitButton } from "./submit-button";

export function BookingForm({
  spaceId,
  price,
  minMonths,
  minDate,
  commissionRate,
}: {
  spaceId: string;
  price: number;
  minMonths: number;
  minDate: string;
  commissionRate: number;
}) {
  const [state, action] = useActionState(requestBookingAction, {});
  const [months, setMonths] = useState(minMonths);
  const [offer, setOffer] = useState(price);
  const total = useMemo(() => months * (offer || 0), [months, offer]);
  const diff = offer && offer !== price ? Math.round(((offer - price) / price) * 100) : 0;

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="spaceId" value={spaceId} />
      <div className="overflow-hidden rounded-xl border border-gray-300">
        <div className="grid grid-cols-2 divide-x divide-gray-300">
          <label className="block p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wide">Inicio</span>
            <input name="startDate" type="date" min={minDate} defaultValue={minDate} required className="w-full bg-transparent text-sm focus:outline-none" />
          </label>
          <label className="block p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wide">Duración</span>
            <select name="months" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full bg-transparent text-sm focus:outline-none">
              {Array.from({ length: 25 - minMonths }, (_, i) => i + minMonths).map((m) => (
                <option key={m} value={m}>{m} {m === 1 ? "mes" : "meses"}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {state.fieldErrors?.startDate && <p className="text-xs text-red-600">{state.fieldErrors.startDate[0]}</p>}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Tu propuesta mensual (ARS)</span>
        <input name="monthlyPrice" type="number" min={1000} step={1000} value={offer} onChange={(e) => setOffer(Number(e.target.value))} className={inputClass} />
        {diff !== 0 && <span className={`text-xs ${diff < 0 ? "text-amber-700" : "text-emerald-700"}`}>{diff > 0 ? "+" : ""}{diff}% respecto del precio publicado</span>}
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Nombre de la campaña</span>
        <Input name="campaignName" placeholder="Ej: Lanzamiento primavera" required />
        {state.fieldErrors?.campaignName && <span className="text-xs text-red-600">{state.fieldErrors.campaignName[0]}</span>}
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Mensaje al propietario</span>
        <Textarea name="message" placeholder="Contá qué querés comunicar, el formato del material y cualquier detalle de instalación." required />
        {state.fieldErrors?.message && <span className="text-xs text-red-600">{state.fieldErrors.message[0]}</span>}
      </label>

      <div className="space-y-2 border-t border-gray-200 pt-4 text-sm">
        <div className="flex justify-between text-ink-soft"><span>{formatARS(offer || 0)} × {months} {months === 1 ? "mes" : "meses"}</span><span>{formatARS(total)}</span></div>
        <div className="flex justify-between text-ink-soft"><span>Cargos de servicio para anunciantes</span><span>{formatARS(0)}</span></div>
        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total de la campaña</span><span>{formatARS(total)}</span></div>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText="Enviando…">Enviar solicitud</SubmitButton>
      <p className="flex gap-2 text-xs text-ink-muted">
        <Info className="h-4 w-4 shrink-0" />
        No se cobra nada ahora. El propietario puede aceptar, rechazar o contraofertar. La comisión de AdSpace ({Math.round(commissionRate * 100)}%) se descuenta del monto que recibe el propietario.
      </p>
    </form>
  );
}
