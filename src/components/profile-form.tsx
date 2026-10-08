"use client";
import { useActionState, useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { Alert, Avatar, Field, Input, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";
import { uploadImage } from "./image-uploader";

type P = { name: string; companyName: string | null; phone: string | null; city: string | null; bio: string | null; avatarUrl: string | null; role: string };

export function ProfileForm({ profile }: { profile: P }) {
  const [state, action] = useActionState(updateProfileAction, {});
  const [avatar, setAvatar] = useState(profile.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  return (
    <form action={action} className="max-w-2xl space-y-5">
      {state.error && <Alert>{state.error}</Alert>}
      {state.ok && <Alert tone="green">{state.message}</Alert>}
      <input type="hidden" name="avatarUrl" value={avatar} />
      <div className="flex items-center gap-4">
        <Avatar name={profile.name} url={avatar || null} size={72} />
        <label className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-ink">
          {uploading ? "Subiendo…" : "Cambiar foto"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setUploading(true);
              try {
                setAvatar((await uploadImage(f)).url);
              } catch (err) {
                alert((err as Error).message);
              }
              setUploading(false);
            }}
          />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre y apellido" error={state.fieldErrors?.name}><Input name="name" defaultValue={profile.name} required /></Field>
        {profile.role !== "OWNER" && <Field label="Empresa"><Input name="companyName" defaultValue={profile.companyName ?? ""} /></Field>}
        <Field label="Teléfono" hint="Sólo visible para contrapartes con campaña confirmada."><Input name="phone" defaultValue={profile.phone ?? ""} /></Field>
        <Field label="Ciudad"><Input name="city" defaultValue={profile.city ?? ""} /></Field>
      </div>
      <Field label="Sobre vos" error={state.fieldErrors?.bio} hint="Contá quién sos y por qué confiar en vos. Aparece en tu perfil público.">
        <Textarea name="bio" defaultValue={profile.bio ?? ""} />
      </Field>
      <SubmitButton pendingText="Guardando…">Guardar cambios</SubmitButton>
    </form>
  );
}
