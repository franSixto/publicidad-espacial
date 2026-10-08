import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 text-ink-muted">Puede que la publicación haya sido pausada o eliminada.</p>
      <ButtonLink href="/espacios" className="mt-8">Explorar espacios</ButtonLink>
    </div>
  );
}
