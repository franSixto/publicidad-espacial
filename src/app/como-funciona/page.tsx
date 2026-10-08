import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";
import { commissionRate } from "@/lib/pricing";
import { formatARS } from "@/lib/format";

export const metadata: Metadata = { title: "Cómo funciona" };
export const dynamic = "force-dynamic";

export default function HowItWorksPage() {
  const rate = commissionRate();
  const example = 400000;
  const steps = [
    ["1. Publicación", "El propietario carga fotos, medidas, ubicación aproximada, precio y disponibilidad. AdSpace revisa cada publicación antes de mostrarla."],
    ["2. Búsqueda", "Las empresas filtran por ciudad, tipo, presupuesto y fecha, y comparan audiencia estimada y CPM."],
    ["3. Propuesta", "El anunciante envía una solicitud con su precio. El propietario acepta, rechaza o contraoferta. Todo queda registrado."],
    ["4. Acuerdo y pago", "Al aceptar se genera el registro del acuerdo con el desglose completo y se habilita el pago."],
    ["5. Instalación", "El propietario sube una foto de la instalación: la campaña pasa a estar en curso."],
    ["6. Finalización", "Al terminar, se sube la foto del retiro y ambas partes se califican."],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight">Cómo funciona AdSpace</h1>
      <p className="mt-3 text-lg text-ink-muted">Un proceso simple y transparente para propietarios y anunciantes.</p>
      <ol className="mt-10 grid gap-5 sm:grid-cols-2">
        {steps.map(([t, d]) => (
          <li key={t} className="rounded-2xl border border-gray-200 p-6">
            <p className="font-semibold">{t}</p>
            <p className="mt-2 text-sm text-ink-soft">{d}</p>
          </li>
        ))}
      </ol>
      <section id="comisiones" className="mt-14 rounded-3xl bg-stone-50 p-8">
        <h2 className="text-2xl font-bold">Comisiones claras</h2>
        <p className="mt-2 text-ink-soft">
          Publicar es gratis. AdSpace cobra una comisión del <strong>{Math.round(rate * 100)}%</strong> sólo cuando una contratación se concreta.
          El anunciante paga el precio acordado sin cargos extra; la comisión se descuenta del monto del propietario.
        </p>
        <dl className="mt-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between"><dt>Precio acordado (1 mes)</dt><dd className="font-semibold">{formatARS(example)}</dd></div>
          <div className="flex justify-between text-ink-muted"><dt>Comisión AdSpace</dt><dd>− {formatARS(example * rate)}</dd></div>
          <div className="flex justify-between border-t border-gray-300 pt-2 font-bold"><dt>Recibe el propietario</dt><dd>{formatARS(example * (1 - rate))}</dd></div>
        </dl>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/registro?rol=OWNER">Publicar mi espacio</ButtonLink>
        <ButtonLink href="/espacios" variant="secondary">Explorar espacios</ButtonLink>
      </div>
    </div>
  );
}
