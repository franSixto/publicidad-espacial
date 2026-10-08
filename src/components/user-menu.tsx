"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, LayoutDashboard, MessageCircle, MapPinned, Megaphone, Shield, User, LogOut, Plus, Search } from "lucide-react";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/actions/auth";
import { Avatar } from "./ui";

export function UserMenu({ user, unread }: { user: { name: string; role: Role; avatarUrl: string | null }; unread: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const item = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink hover:bg-gray-100";
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-2 rounded-full border border-gray-300 py-1 pl-3 pr-1 transition hover:shadow-md"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        <Menu className="h-4 w-4 text-ink-soft" />
        <Avatar name={user.name} url={user.avatarUrl} size={30} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
          </div>
          <div className="my-1 h-px bg-gray-100" />
          <Link href="/panel" className={item}><LayoutDashboard className="h-4 w-4" /> Mi panel</Link>
          <Link href="/espacios" className={`${item} md:hidden`}><Search className="h-4 w-4" /> Explorar espacios</Link>
          {user.role === "OWNER" && (
            <>
              <Link href="/panel/espacios" className={item}><MapPinned className="h-4 w-4" /> Mis espacios</Link>
              <Link href="/panel/espacios/nuevo" className={item}><Plus className="h-4 w-4" /> Publicar espacio</Link>
            </>
          )}
          <Link href="/panel/campanas" className={item}>
            <Megaphone className="h-4 w-4" /> {user.role === "OWNER" ? "Solicitudes y campañas" : "Mis campañas"}
          </Link>
          <Link href="/panel/mensajes" className={item}>
            <MessageCircle className="h-4 w-4" /> Mensajes
            {unread > 0 && <span className="ml-auto rounded-full bg-brand-500 px-2 text-xs font-bold text-white">{unread}</span>}
          </Link>
          <Link href="/panel/perfil" className={item}><User className="h-4 w-4" /> Mi perfil</Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" className={item}><Shield className="h-4 w-4" /> Administración</Link>
          )}
          <div className="my-1 h-px bg-gray-100" />
          <form action={logoutAction}>
            <button className={`${item} w-full text-left`}><LogOut className="h-4 w-4" /> Cerrar sesión</button>
          </form>
        </div>
      )}
    </div>
  );
}
