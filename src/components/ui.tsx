import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusTone } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
  dark: "bg-ink text-white hover:bg-black shadow-sm",
  secondary: "bg-white text-ink border border-gray-300 hover:border-gray-900 hover:bg-gray-50",
  ghost: "text-ink-soft hover:bg-gray-100",
  danger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("rounded-2xl border border-gray-200 bg-white", className)} {...props} />;
}

const tones = {
  gray: "bg-gray-100 text-gray-700",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  green: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  blue: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  violet: "bg-violet-50 text-violet-800 ring-1 ring-violet-200",
  brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
};

export function Badge({ tone = "gray", className, children }: { tone?: keyof typeof tones; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return <Badge tone={statusTone[status] ?? "gray"}>{label}</Badge>;
}

export const inputClass =
  "block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:bg-gray-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(inputClass, "min-h-[110px]", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClass, "pr-8", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string[] | string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const msg = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {msg ? <p className="text-xs font-medium text-red-600">{msg}</p> : hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Alert({ tone = "red", children }: { tone?: "red" | "green" | "amber" | "blue"; children: ReactNode }) {
  const t = {
    red: "bg-red-50 text-red-800 border-red-200",
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-900 border-amber-200",
    blue: "bg-sky-50 text-sky-900 border-sky-200",
  }[tone];
  return <div className={cn("rounded-xl border px-4 py-3 text-sm", t)}>{children}</div>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
      {icon && <div className="mb-4 rounded-full bg-gray-100 p-3 text-ink-soft">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Rating({ value, count, className }: { value: number | null; count?: number; className?: string }) {
  if (!value) return <span className={cn("text-sm text-ink-muted", className)}>Sin reseñas aún</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium text-ink", className)}>
      <Star className="h-4 w-4 fill-ink text-ink" />
      {value.toFixed(1)}
      {count !== undefined && <span className="font-normal text-ink-muted">({count})</span>}
    </span>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("h-4 w-4", i <= value ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
      ))}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-muted">{label}</p>
        {icon && <span className="text-ink-muted">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}
