import { z } from "zod";

const trimmed = (min: number, max: number, label: string) =>
  z.string().trim().min(min, `${label}: mínimo ${min} caracteres`).max(max, `${label}: máximo ${max} caracteres`);

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
  .transform((s) => new Date(`${s}T00:00:00.000Z`));

export const registerSchema = z.object({
  name: trimmed(2, 80, "Nombre"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(100)
    .regex(/[A-Za-z]/, "La contraseña debe incluir letras")
    .regex(/\d/, "La contraseña debe incluir números"),
  role: z.enum(["OWNER", "ADVERTISER"], { message: "Elegí un tipo de cuenta" }),
  companyName: optionalText(100),
  city: optionalText(80),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const profileSchema = z.object({
  name: trimmed(2, 80, "Nombre"),
  companyName: optionalText(100),
  phone: optionalText(40),
  city: optionalText(80),
  bio: optionalText(600),
  avatarUrl: optionalText(500),
});

export const imageSchema = z.object({
  url: z.string().min(1).max(600).refine((u) => u.startsWith("https://") || u.startsWith("/api/uploads/"), "URL de imagen inválida"),
  publicId: z.string().max(300).nullable().optional(),
});

export const spaceSchema = z
  .object({
    title: trimmed(8, 100, "Título"),
    description: trimmed(30, 3000, "Descripción"),
    categoryId: z.string().min(1, "Elegí una categoría"),
    city: trimmed(2, 80, "Ciudad"),
    province: trimmed(2, 80, "Provincia"),
    neighborhood: optionalText(80),
    addressPrivate: optionalText(160),
    lat: z.coerce.number().min(-56).max(-21, "La ubicación debe estar en Argentina"),
    lng: z.coerce.number().min(-74).max(-53, "La ubicación debe estar en Argentina"),
    widthM: z.coerce.number().positive("Ancho inválido").max(200),
    heightM: z.coerce.number().positive("Alto inválido").max(200),
    surfaceType: trimmed(2, 60, "Superficie"),
    visibility: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]),
    dailyImpressions: z.coerce.number().int().min(0).max(5_000_000),
    pricePerMonth: z.coerce.number().int().min(1000, "El precio mínimo es $1.000").max(100_000_000),
    minMonths: z.coerce.number().int().min(1).max(24),
    availableFrom: dateString,
    availableTo: z
      .string()
      .optional()
      .transform((s) => (s ? new Date(`${s}T00:00:00.000Z`) : undefined)),
    conditions: optionalText(2000),
    includesInstallation: z
      .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
      .optional()
      .transform((v) => v === "on" || v === "true"),
    images: z.array(imageSchema).max(10, "Máximo 10 fotos"),
    intent: z.enum(["draft", "submit"]),
  })
  .superRefine((d, ctx) => {
    if (d.availableTo && d.availableTo <= d.availableFrom) {
      ctx.addIssue({ code: "custom", path: ["availableTo"], message: "La fecha de fin debe ser posterior al inicio" });
    }
    if (d.intent === "submit" && d.images.length === 0) {
      ctx.addIssue({ code: "custom", path: ["images"], message: "Subí al menos una foto para enviar a revisión" });
    }
  });

export const bookingRequestSchema = z.object({
  spaceId: z.string().min(1),
  campaignName: trimmed(3, 100, "Nombre de campaña"),
  startDate: dateString,
  months: z.coerce.number().int().min(1).max(24),
  monthlyPrice: z.coerce.number().int().min(1000).max(100_000_000),
  message: trimmed(10, 2000, "Mensaje"),
});

export const counterOfferSchema = z.object({
  bookingId: z.string().min(1),
  monthlyPrice: z.coerce.number().int().min(1000).max(100_000_000),
  note: optionalText(1000),
});

export const messageSchema = z.object({
  body: trimmed(1, 4000, "Mensaje"),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: trimmed(10, 1000, "Comentario"),
});

export const reportSchema = z.object({
  spaceId: z.string().optional(),
  reportedUserId: z.string().optional(),
  reason: z.enum(["fraude", "contenido_inapropiado", "informacion_falsa", "spam", "otro"]),
  details: optionalText(1000),
});

export const categorySchema = z.object({
  name: trimmed(2, 60, "Nombre"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug: sólo minúsculas, números y guiones").max(60),
  description: trimmed(5, 300, "Descripción"),
  icon: trimmed(2, 40, "Ícono"),
  imageUrl: optionalText(500),
  sortOrder: z.coerce.number().int().min(0).max(999),
  priceFactor: z.coerce.number().min(0.1).max(10),
});

export const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  ciudad: z.string().trim().max(80).optional(),
  categoria: z.string().trim().max(60).optional(),
  min: z.coerce.number().int().min(0).optional().catch(undefined),
  max: z.coerce.number().int().min(0).optional().catch(undefined),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  orden: z.enum(["relevancia", "precio_asc", "precio_desc", "audiencia", "recientes"]).optional().catch(undefined),
  vista: z.enum(["lista", "mapa"]).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: FieldErrors;
  message?: string;
};

export function zodErrors(error: z.ZodError): ActionState {
  return { error: "Revisá los campos marcados.", fieldErrors: error.flatten().fieldErrors as FieldErrors };
}
