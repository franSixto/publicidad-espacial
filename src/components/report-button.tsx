"use client";
import { useActionState, useState } from "react";
import { Flag } from "lucide-react";
import { createReportAction } from "@/app/actions/community";
import { Alert, Select, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";

export function ReportButton({ spaceId, userId, label = "Denunciar esta publicación" }: { spaceId?: string; userId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createReportAction, {});
  if (state.ok) return <p className="text-sm text-emerald-700">{state.message}</p>;
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted underline hover:text-ink">
        <Flag className="h-4 w-4" /> {label}
      </button>
      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-xl border border-gray-200 p-4">
          {state.error && <Alert>{state.error}</Alert>}
          {spaceId && <input type="hidden" name="spaceId" value={spaceId} />}
          {userId && <input type="hidden" name="reportedUserId" value={userId} />}
          <Select name="reason" required defaultValue="">
            <option value="" disabled>Motivo</option>
            <option value="informacion_falsa">Información falsa</option>
            <option value="fraude">Posible fraude</option>
            <option value="contenido_inapropiado">Contenido inapropiado</option>
            <option value="spam">Spam</option>
            <option value="otro">Otro</option>
          </Select>
          <Textarea name="details" placeholder="Contanos más (opcional)" className="min-h-[80px]" />
          <SubmitButton size="sm" variant="dark">Enviar reporte</SubmitButton>
        </form>
      )}
    </div>
  );
}
