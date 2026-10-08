"use client";
import { Button } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-ink-muted">{process.env.NODE_ENV === "development" ? error.message : "No pudimos completar la operación. Intentá nuevamente."}</p>
      <Button onClick={reset} className="mt-8">Reintentar</Button>
    </div>
  );
}
