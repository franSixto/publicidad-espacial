export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-white">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">AdSpace</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight">Cada pared, vidriera o vehículo puede ser un medio.</h2>
          <ul className="mt-8 space-y-4 text-white/80">
            <li>✓ Publicá gratis y cobrá sólo cuando concretás una campaña.</li>
            <li>✓ Precios finales en pesos y comisión transparente.</li>
            <li>✓ Evidencia fotográfica de instalación y finalización.</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
