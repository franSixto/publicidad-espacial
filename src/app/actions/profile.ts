"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertUser, ActionError } from "@/lib/auth";
import { profileSchema, zodErrors, type ActionState } from "@/lib/validation";

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await assertUser();
    const parsed = profileSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return zodErrors(parsed.error);
    const d = parsed.data;
    if (d.avatarUrl && !d.avatarUrl.startsWith("https://") && !d.avatarUrl.startsWith("/api/uploads/")) {
      return { error: "URL de foto inválida." };
    }
    await db.user.update({
      where: { id: user.id },
      data: { name: d.name, companyName: d.companyName ?? null, phone: d.phone ?? null, city: d.city ?? null, bio: d.bio ?? null, avatarUrl: d.avatarUrl ?? null },
    });
    revalidatePath("/", "layout");
    return { ok: true, message: "Perfil actualizado." };
  } catch (e) {
    if (e instanceof ActionError) return { error: e.message };
    throw e;
  }
}
