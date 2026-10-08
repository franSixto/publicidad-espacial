import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-gray-200 bg-stone-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink-muted">
            El marketplace argentino de publicidad física. Monetizá tus espacios o encontrá dónde llevar tu marca a la calle.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">Anunciantes</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/espacios" className="hover:text-ink">Explorar espacios</Link></li>
            <li><Link href="/espacios?vista=mapa" className="hover:text-ink">Mapa de ubicaciones</Link></li>
            <li><Link href="/registro?rol=ADVERTISER" className="hover:text-ink">Crear cuenta de empresa</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">Propietarios</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li><Link href="/registro?rol=OWNER" className="hover:text-ink">Publicá tu espacio</Link></li>
            <li><Link href="/como-funciona" className="hover:text-ink">Cómo funciona</Link></li>
            <li><Link href="/como-funciona#comisiones" className="hover:text-ink">Comisiones</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-ink">Confianza</h4>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>Perfiles verificados</li>
            <li>Evidencia fotográfica de cada campaña</li>
            <li>Precios finales en pesos, sin sorpresas</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} AdSpace. Hecho en Argentina.</p>
          <p>Precios expresados en pesos argentinos (ARS).</p>
        </div>
      </div>
    </footer>
  );
}
