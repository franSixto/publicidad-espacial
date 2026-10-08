"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema, registerSchema, zodErrors, type ActionState } from "@/lib/validation";

function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  // Evita open redirects: sólo rutas internas.
  return n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodErrors(parsed.error);
  const data = parsed.data;

  const exists = await db.user.findUnique({ where: { email: data.email } });
  if (exists) return { error: "Ya existe una cuenta con ese email.", fieldErrors: { email: ["Email ya registrado"] } };

  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      companyName: data.companyName,
      city: data.city,
    },
  });
  await createSession(user.id, user.role);
  redirect(safeNext(formData.get("next"), user.role === "OWNER" ? "/panel/espacios/nuevo?bienvenida=1" : "/espacios"));
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodErrors(parsed.error);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  // Mismo mensaje para email inexistente o contraseña incorrecta.
  const valid = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) return { error: "Email o contraseña incorrectos." };
  if (user.status !== "ACTIVE") return { error: "Tu cuenta está suspendida. Contactá a soporte." };

  await createSession(user.id, user.role);
  redirect(safeNext(formData.get("next"), user.role === "ADMIN" ? "/admin" : "/panel"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
