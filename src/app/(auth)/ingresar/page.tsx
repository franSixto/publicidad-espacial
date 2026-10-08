import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Te damos la bienvenida</h1>
      <p className="mt-2 text-ink-muted">
        ¿No tenés cuenta? <Link href="/registro" className="font-semibold text-brand-600 hover:underline">Registrate gratis</Link>
      </p>
      <LoginForm next={next} />
      <div className="mt-8 rounded-xl bg-stone-50 p-4 text-xs text-ink-muted">
        <p className="font-semibold text-ink-soft">Cuentas de demostración (contraseña: <code>demo1234</code>)</p>
        <ul className="mt-1 space-y-0.5">
          <li>Propietario: <code>propietario@adspace.ar</code></li>
          <li>Empresa: <code>empresa@adspace.ar</code></li>
          <li>Admin: <code>admin@adspace.ar</code></li>
        </ul>
      </div>
    </div>
  );
}
