"use client";
import { useActionState, useState } from "react";
import { Building, Home } from "lucide-react";
import { registerAction } from "@/app/actions/auth";
import { Alert, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/utils";

export function RegisterForm({ defaultRole, next }: { defaultRole?: "OWNER" | "ADVERTISER"; next?: string }) {
  const [state, action] = useActionState(registerAction, {});
  const [role, setRole] = useState<"OWNER" | "ADVERTISER" | undefined>(defaultRole);
  const options = [
    { value: "OWNER" as const, icon: Home, title: "Tengo un espacio", text: "Quiero publicar y ganar dinero" },
    { value: "ADVERTISER" as const, icon: Building, title: "Soy anunciante", text: "Quiero contratar espacios" },
  ];
  return (
    <form action={action} className="mt-8 space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="next" value={next ?? ""} />
      <input type="hidden" name="role" value={role ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            onClick={() => setRole(o.value)}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition",
              role === o.value ? "border-ink bg-stone-50" : "border-gray-200 hover:border-gray-400",
            )}
          >
            <o.icon className="h-6 w-6 text-brand-500" />
            <p className="mt-3 text-sm font-semibold">{o.title}</p>
            <p className="text-xs text-ink-muted">{o.text}</p>
          </button>
        ))}
      </div>
      {state.fieldErrors?.role && <p className="text-xs font-medium text-red-600">Elegí un tipo de cuenta</p>}
      <Field label="Nombre y apellido" htmlFor="name" error={state.fieldErrors?.name}>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      {role === "ADVERTISER" && (
        <Field label="Empresa" htmlFor="companyName" error={state.fieldErrors?.companyName}>
          <Input id="companyName" name="companyName" autoComplete="organization" />
        </Field>
      )}
      <Field label="Ciudad" htmlFor="city">
        <Input id="city" name="city" placeholder="Ej: Córdoba" />
      </Field>
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={state.fieldErrors?.password} hint="Mínimo 8 caracteres, con letras y números.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full" size="lg" pendingText="Creando cuenta…">Crear cuenta</SubmitButton>
      <p className="text-center text-xs text-ink-muted">Al registrarte aceptás los términos de uso y la política de privacidad.</p>
    </form>
  );
}
