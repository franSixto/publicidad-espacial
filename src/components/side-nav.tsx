"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import {
  LayoutDashboard, MapPinned, Plus, Megaphone, MessageCircle, User, Shield, Users, Flag, Tags, Receipt, ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, spaces: MapPinned, plus: Plus, campaigns: Megaphone, messages: MessageCircle, user: User,
  shield: Shield, users: Users, flag: Flag, tags: Tags, receipt: Receipt, review: ClipboardCheck,
};

export type NavItem = { href: string; label: string; icon: string; badge?: number; exact?: boolean };

export function SideNav({ items, title }: { items: NavItem[]; title: string }) {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
      <p className="hidden px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted lg:block">{title}</p>
      {items.map((i) => {
        const Icon = ICONS[i.icon];
        const active = i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-ink text-white" : "text-ink-soft hover:bg-gray-100",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : <CategoryIcon name={i.icon} className="h-4 w-4" />}
            {i.label}
            {!!i.badge && <span className={cn("ml-auto rounded-full px-2 text-xs font-bold", active ? "bg-white text-ink" : "bg-brand-500 text-white")}>{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
