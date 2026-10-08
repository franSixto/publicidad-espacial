import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET debe tener al menos 32 caracteres"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  PLATFORM_COMMISSION_RATE: z.coerce.number().min(0).max(0.5).default(0.15),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("adspace"),
  PAYMENT_PROVIDER: z.enum(["manual", "mercadopago"]).default("manual"),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
});

let cached: z.infer<typeof schema> | null = null;

/** Variables de entorno validadas (se evalúan en el primer uso, no en build). */
export function env() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(
        "Variables de entorno inválidas: " +
          parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      );
    }
    cached = parsed.data;
  }
  return cached;
}

export function cloudinaryEnabled() {
  const e = env();
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
}
