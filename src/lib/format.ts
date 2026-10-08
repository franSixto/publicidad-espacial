import type { BookingStatus, SpaceStatus, Visibility, Role, PaymentStatus, ReportStatus } from "@prisma/client";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("es-AR");

export const formatARS = (n: number) => ars.format(n);
export const formatNumber = (n: number) => num.format(n);
export const formatCompact = (n: number) =>
  new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Date(d).toLocaleDateString("es-AR", { timeZone: "UTC", ...opts });
}

export function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });
}

export function timeAgo(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (diff < 60) return "recién";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return rtf.format(-Math.round(diff / 86400), "day");
  return formatDate(d);
}

export const toDateInput = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

export const roleLabel: Record<Role, string> = {
  OWNER: "Propietario",
  ADVERTISER: "Empresa anunciante",
  ADMIN: "Administrador",
};

export const visibilityLabel: Record<Visibility, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  VERY_HIGH: "Muy alta",
};

export const spaceStatusLabel: Record<SpaceStatus, string> = {
  DRAFT: "Borrador",
  PENDING: "Pendiente de aprobación",
  PUBLISHED: "Publicada",
  PAUSED: "Pausada",
  REJECTED: "Rechazada",
};

export const bookingStatusLabel: Record<BookingStatus, string> = {
  PENDING: "En negociación",
  ACCEPTED: "Acordada",
  ACTIVE: "En curso",
  COMPLETED: "Finalizada",
  REJECTED: "Rechazada",
  CANCELLED: "Cancelada",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Acreditado",
  FAILED: "Fallido",
  REFUNDED: "Reintegrado",
};

export const reportStatusLabel: Record<ReportStatus, string> = {
  OPEN: "Abierto",
  RESOLVED: "Resuelto",
  DISMISSED: "Desestimado",
};

export const statusTone: Record<string, "gray" | "amber" | "green" | "blue" | "red" | "violet"> = {
  DRAFT: "gray",
  PENDING: "amber",
  PUBLISHED: "green",
  PAUSED: "gray",
  REJECTED: "red",
  ACCEPTED: "blue",
  ACTIVE: "violet",
  COMPLETED: "green",
  CANCELLED: "gray",
  PAID: "green",
  FAILED: "red",
  REFUNDED: "gray",
  OPEN: "amber",
  RESOLVED: "green",
  DISMISSED: "gray",
};

export const ARGENTINE_PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos",
  "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro",
  "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

export const SURFACE_TYPES = [
  "Pared revocada", "Ladrillo visto", "Chapa", "Vidrio", "Lona / vinilo", "Ploteo vehicular",
  "Madera", "Pantalla LED", "Persiana metálica", "Cerco / alambrado", "Otro",
];

export function monthsBetween(start: Date, end: Date) {
  const days = (end.getTime() - start.getTime()) / 86400000;
  return Math.max(1, Math.round(days / 30));
}

export function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}
