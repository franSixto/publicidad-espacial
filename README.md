# AdSpace — Marketplace de publicidad física

AdSpace conecta a quienes tienen espacios disponibles para publicidad (frentes, medianeras, vehículos, vidrieras, terrenos, pantallas) con empresas que quieren llevar su marca a la calle. La interfaz está en español y los precios en pesos argentinos (ARS).

## Stack

| Capa | Tecnología |
|------|------------|
| App | Next.js 15 (App Router, Server Components, Server Actions) + TypeScript |
| UI | Tailwind CSS 3, lucide-react |
| Datos | PostgreSQL + Prisma 6 (migraciones versionadas) |
| Auth | Sesión propia: JWT HS256 (`jose`) en cookie httpOnly + contraseñas con bcrypt |
| Validación | Zod (servidor y formularios) |
| Mapas | Leaflet + OpenStreetMap (sin API key) |
| Imágenes | Cloudinary (subida firmada directa desde el navegador); disco local como respaldo |
| Pagos | Capa `PaymentProvider` lista para integrar (proveedor `manual` por defecto, esqueleto de Mercado Pago) |

Elegido para que sea **simple y barato de mantener**: un único proceso Next.js, una base Postgres administrada (Neon/Supabase/Railway, todas con plan gratuito) y Cloudinary gratis para imágenes. No hace falta Redis, colas ni servicios extra.

## Puesta en marcha

```bash
cp .env.example .env          # completar DATABASE_URL y AUTH_SECRET
npm install
npm run db:deploy             # aplica las migraciones
npm run db:seed               # datos de demostración
npm run dev                   # http://localhost:3000
```

### Cuentas de demostración (contraseña `demo1234`)

| Rol | Email |
|-----|-------|
| Propietario | `propietario@adspace.ar` (también `martin@`, `carla@`, `jorge@`, `sofia@`, `diego@adspace.ar`) |
| Empresa anunciante | `empresa@adspace.ar` (también `marketing@pagofacil.demo`, `agencia@adspace.ar`) |
| Administrador | `admin@adspace.ar` |

El seed crea 5 categorías, 24 espacios en 9 ciudades (en todos los estados), 7 campañas en distintas etapas, pagos, evidencias, reseñas, conversaciones y reportes.

> Las fotos de demostración son URLs de Unsplash. Si alguna no carga, la interfaz muestra un placeholder.

## Variables de entorno

Todas están documentadas en [`.env.example`](.env.example).

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | Conexión Postgres que usa la app (puede ir con pooler). |
| `DIRECT_URL` | ✅ | Conexión directa para migraciones (igual a la anterior si no hay pooler). |
| `AUTH_SECRET` | ✅ | Secreto de mínimo 32 caracteres para firmar las sesiones (`openssl rand -base64 48`). |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL pública (metadatos, callbacks de pago). |
| `PLATFORM_COMMISSION_RATE` | — | Comisión por contratación (default `0.15`). |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Prod | Habilita la subida firmada a Cloudinary. |
| `CLOUDINARY_UPLOAD_FOLDER` | — | Carpeta destino (default `adspace`). |
| `LOCAL_UPLOAD_DIR` | — | Carpeta del respaldo local (default `./uploads`). |
| `ALLOW_LOCAL_UPLOADS` | — | `true` permite el respaldo local en producción (sólo con disco persistente). |
| `PAYMENT_PROVIDER` | — | `manual` (default) o `mercadopago` (cuando se implemente). |
| `MERCADOPAGO_ACCESS_TOKEN` | — | Para la fase de pagos. |

## Funcionalidades

**Marketplace**
- Home con buscador destacado (ubicación, tipo y presupuesto), categorías visuales, destacados y métricas.
- Catálogo con filtros (palabra clave, ciudad/barrio, categoría, rango de precio, disponible desde), orden y paginación.
- Vista de mapa con pines de precio (estilo Airbnb).
- Detalle con galería y lightbox, características, medidas, CPM estimado, condiciones, calendario de disponibilidad (períodos reservados), zona aproximada en el mapa y reseñas.
- Perfiles públicos con reputación (promedio, reseñas, campañas completadas) y verificación.

**Publicación (propietarios)**
- Asistente de 6 pasos: tipo → ubicación (mapa clickeable) → detalles → fotos → precio y disponibilidad → revisión.
- **Estimador de potencial comercial** (`src/lib/estimate.ts`): impactos mensuales y rango de precio sugerido según categoría, superficie, visibilidad y ciudad.
- Estados: borrador, pendiente de aprobación, publicada, pausada, rechazada (con motivo).
- La dirección exacta es privada y sólo se muestra con campaña confirmada.

**Contratación**
- Solicitud con propuesta económica → contrapropuestas alternadas (siempre se sabe a quién le toca responder) → aceptación.
- Validaciones: duración mínima, ventana de disponibilidad, sin superposición con campañas confirmadas (también al aceptar).
- Registro del acuerdo (texto con todos los términos), desglose transparente: total, comisión y neto del propietario.
- Seguimiento: Solicitud → Acuerdo → Pago → Instalación → Finalización, con historial de eventos.
- Evidencia fotográfica obligatoria para pasar a "en curso" (instalación) y a "finalizada" (retiro).
- Reseñas mutuas al finalizar.
- Mensajería entre propietario y empresa por espacio, con no leídos y actualización automática.

**Administración** (`/admin`)
- Resumen: usuarios, GMV, comisiones devengadas y cobradas, pendientes.
- Moderación de publicaciones (aprobar, rechazar con motivo, destacar, pausar).
- Usuarios: búsqueda, verificación, suspensión (pausa sus publicaciones).
- Operaciones y pagos: conciliación manual (acreditar / reintegrar).
- Reportes de la comunidad (resolver / desestimar).
- Categorías: alta, edición, activación y factor de precio para el estimador.

## Seguridad y permisos

- `middleware.ts` protege `/panel` y `/admin` a nivel edge; además **cada página y cada server action** vuelve a validar sesión, rol y propiedad del recurso contra la base (`requireUser`, `requireRole`, `assertUser`). Un usuario suspendido pierde la sesión inmediatamente.
- Cookies `httpOnly`, `sameSite=lax`, `secure` en producción. Mensaje de login genérico. Redirecciones `next` restringidas a rutas internas.
- Todos los inputs se validan con Zod en el servidor. Los montos se recalculan siempre en el servidor.
- Subidas: tipos y tamaño validados, nombres aleatorios, firma de Cloudinary generada en el servidor.
- Headers de seguridad básicos en `next.config.ts`. Límite simple de reportes por hora.

## Pagos: cómo integrar la pasarela

No se procesan pagos reales. Al aceptarse un acuerdo, `initiatePayment()` (`src/lib/payments/index.ts`) crea un `Payment` pendiente y llama al proveedor configurado.

Para integrar Mercado Pago (u otro):
1. Implementar `createCheckout()` y `parseWebhook()` en `src/lib/payments/mercadopago.ts` (interfaz en `types.ts`).
2. Configurar `PAYMENT_PROVIDER=mercadopago` y el token.
3. Apuntar el webhook del proveedor a `POST /api/payments/webhook/mercadopago` (ya implementado, idempotente).
4. El botón "Pagar ahora" aparece automáticamente cuando el pago tiene `checkoutUrl`.

## Despliegue sugerido (bajo costo)

- **Vercel** (app) + **Neon** o **Supabase** (Postgres) + **Cloudinary** (imágenes). Build: `npm run build`; antes de cada deploy, `npm run db:deploy`.
- Alternativa en un solo servidor (Railway/Render/Fly): `npm run build && npm start`; ahí puede usarse el disco local con `ALLOW_LOCAL_UPLOADS=true` y un volumen persistente.
- Healthcheck: `GET /api/health`.

## Estructura

```
prisma/              schema, migraciones, seed
src/middleware.ts    protección de rutas por rol
src/lib/             auth, sesión, db, validación, pricing, estimador, pagos, storage, consultas
src/app/             páginas (marketplace, panel, admin), server actions y API
src/components/      UI reutilizable (tarjetas, mapa, wizard, galería, calendario…)
```

## Próximos pasos sugeridos

- Integración real de Mercado Pago y liquidaciones a propietarios.
- Verificación de identidad (DNI/CUIT) y de titularidad del espacio.
- Notificaciones por email (Resend) para nuevas solicitudes y mensajes.
- Publicaciones destacadas pagas, suscripciones para agencias y reportes de campaña.
- Rate limiting distribuido en login y tests automatizados (Playwright) en CI.
