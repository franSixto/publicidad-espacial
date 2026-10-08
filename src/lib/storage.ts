import "server-only";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env, cloudinaryEnabled } from "./env";

export const LOCAL_UPLOAD_DIR = path.resolve(process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Firma para subida directa desde el navegador a Cloudinary (signed upload). */
export function cloudinarySignature() {
  const e = env();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = `folder=${e.CLOUDINARY_UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(params + e.CLOUDINARY_API_SECRET).digest("hex");
  return {
    cloudName: e.CLOUDINARY_CLOUD_NAME!,
    apiKey: e.CLOUDINARY_API_KEY!,
    folder: e.CLOUDINARY_UPLOAD_FOLDER,
    timestamp,
    signature,
  };
}

/** Respaldo para desarrollo local cuando Cloudinary no está configurado. */
export async function saveLocally(file: File) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_UPLOADS !== "true") {
    throw new Error("Configurá Cloudinary para subir imágenes en producción.");
  }
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type] ?? "bin";
  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { url: `/api/uploads/${name}`, publicId: null };
}

export { cloudinaryEnabled };
