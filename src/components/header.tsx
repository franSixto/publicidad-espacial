import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/queries";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { ButtonLink } from "./ui";

export async function Header() {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user.id) : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/espacios" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-gray-100">
            Explorar espacios
          </Link>
          <Link href="/espacios?vista=mapa" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-gray-100">
            Mapa
          </Link>
          <Link href="/como-funciona" className="rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:bg-gray-100">
            Cómo funciona
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {(!user || user.role === "OWNER") && (
            <Link
              href={user ? "/panel/espacios/nuevo" : "/registro?rol=OWNER"}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink hover:bg-gray-100 sm:inline-flex"
            >
              Publicá tu espacio
            </Link>
          )}
          {user ? (
            <UserMenu user={{ name: user.name, role: user.role, avatarUrl: user.avatarUrl }} unread={unread} />
          ) : (
            <>
              <ButtonLink href="/ingresar" variant="ghost" size="sm">
                Ingresar
              </ButtonLink>
              <ButtonLink href="/registro" size="sm" className="rounded-full">
                Crear cuenta
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
