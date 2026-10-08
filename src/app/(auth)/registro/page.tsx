import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ rol?: string; next?: string }> }) {
  const { rol, next } = await searchParams;
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Creá tu cuenta</h1>
      <p className="mt-2 text-ink-muted">
        ¿Ya tenés cuenta? <Link href="/ingresar" className="font-semibold text-brand-600 hover:underline">Ingresá</Link>
      </p>
      <RegisterForm defaultRole={rol === "ADVERTISER" ? "ADVERTISER" : rol === "OWNER" ? "OWNER" : undefined} next={next} />
    </div>
  );
}
