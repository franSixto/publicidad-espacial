"use client";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const [state, action, pending] = useActionState(sendMessageAction.bind(null, conversationId), {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex items-end gap-2 border-t border-gray-200 p-3">
      <textarea
        name="body"
        rows={1}
        required
        maxLength={4000}
        placeholder="Escribí un mensaje…"
        className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-ink focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            ref.current?.requestSubmit();
          }
        }}
      />
      <button disabled={pending} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50" aria-label="Enviar">
        <SendHorizontal className="h-5 w-5" />
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

/** Refresca la vista periódicamente (mensajería casi en tiempo real sin websockets). */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
