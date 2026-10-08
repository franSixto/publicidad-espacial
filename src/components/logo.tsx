import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="AdSpace inicio">
      <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="11" rx="2" />
          <path d="M12 15v5M8 20h8" />
        </svg>
      </span>
      <span className="text-xl font-extrabold tracking-tight text-ink">
        Ad<span className="text-brand-500">Space</span>
      </span>
    </Link>
  );
}
