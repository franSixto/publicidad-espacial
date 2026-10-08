"use client";
import { useActionState, useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { acceptBookingAction, addEvidenceAction, cancelBookingAction, counterOfferAction, rejectBookingAction } from "@/app/actions/bookings";
import { createReviewAction } from "@/app/actions/community";
import type { ActionState } from "@/lib/validation";
import { Alert, Button, Input, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function DecisionButtons({ bookingId, canAccept, isOwner }: { bookingId: string; canAccept: boolean; isOwner: boolean }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState>({});
  const run = (fn: (id: string) => Promise<ActionState>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    start(async () => setResult(await fn(bookingId)));
  };
  return (
    <div className="space-y-3">
      {result.error && <Alert>{result.error}</Alert>}
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <Button onClick={() => run(acceptBookingAction, "¿Confirmás el acuerdo con las condiciones actuales?")} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Aceptar propuesta
          </Button>
        )}
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => run(rejectBookingAction, isOwner ? "¿Rechazar esta solicitud?" : "¿Retirar tu solicitud?")}
        >
          <X className="h-4 w-4" /> {isOwner ? "Rechazar" : "Retirar solicitud"}
        </Button>
      </div>
    </div>
  );
}

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionState>({});
  return (
    <div className="space-y-2">
      {result.error && <Alert>{result.error}</Alert>}
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => confirm("¿Cancelar la campaña acordada? Esta acción no se puede deshacer.") && start(async () => setResult(await cancelBookingAction(bookingId)))}
      >
        Cancelar campaña
      </Button>
    </div>
  );
}

export function CounterOfferForm({ bookingId, current }: { bookingId: string; current: number }) {
  const [state, action] = useActionState(counterOfferAction, {});
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        <label className="space-y-1">
          <span className="text-xs font-semibold">Nuevo precio mensual (ARS)</span>
          <Input name="monthlyPrice" type="number" min={1000} step={1000} defaultValue={current} required />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold">Comentario (opcional)</span>
          <Input name="note" placeholder="Ej: Incluye instalación y retiro" />
        </label>
      </div>
      <SubmitButton variant="secondary" size="sm">Enviar contrapropuesta</SubmitButton>
    </form>
  );
}

export function EvidenceForm({ bookingId, type }: { bookingId: string; type: "INSTALLATION" | "COMPLETION" }) {
  const [state, action] = useActionState(addEvidenceAction, {});
  const [imgs, setImgs] = useState<UploadedImage[]>([]);
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert>{state.error}</Alert>}
      {state.fieldErrors?.image && <Alert>{state.fieldErrors.image[0]}</Alert>}
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="image" value={imgs[0] ? JSON.stringify(imgs[0]) : ""} />
      <ImageUploader value={imgs} onChange={(v) => setImgs(v.slice(-1))} max={1} />
      <Textarea name="note" placeholder={type === "INSTALLATION" ? "Ej: Lona instalada el lunes 9 h, foto desde la vereda de enfrente." : "Ej: Material retirado, superficie en estado original."} className="min-h-[70px]" />
      <SubmitButton disabled={!imgs.length}>
        {type === "INSTALLATION" ? "Registrar instalación e iniciar campaña" : "Registrar retiro y finalizar campaña"}
      </SubmitButton>
    </form>
  );
}

export function ReviewForm({ bookingId, targetName }: { bookingId: string; targetName: string }) {
  const [state, action] = useActionState(createReviewAction, {});
  const [rating, setRating] = useState(5);
  if (state.ok) return <Alert tone="green">{state.message}</Alert>;
  return (
    <form action={action} className="space-y-3">
      {state.error && <Alert>{state.error}</Alert>}
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <p className="text-sm">¿Cómo fue trabajar con <strong>{targetName}</strong>?</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button type="button" key={i} onClick={() => setRating(i)} aria-label={`${i} estrellas`}>
            <Star className={cn("h-7 w-7", i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
          </button>
        ))}
      </div>
      <Textarea name="comment" placeholder="Contá tu experiencia (mínimo 10 caracteres)" required />
      {state.fieldErrors?.comment && <p className="text-xs text-red-600">{state.fieldErrors.comment[0]}</p>}
      <SubmitButton size="sm">Publicar reseña</SubmitButton>
    </form>
  );
}
