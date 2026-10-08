import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";

/**
 * Webhook de la pasarela de pagos. Con el proveedor "manual" no hace nada;
 * queda listo para que cada proveedor implemente parseWebhook() (incluida la
 * validación de firma) y actualice el estado del pago de forma idempotente.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: name } = await params;
  const provider = getPaymentProvider(name);
  if (provider.name !== name) return NextResponse.json({ error: "Proveedor desconocido" }, { status: 404 });

  const event = await provider.parseWebhook(req);
  if (!event) return NextResponse.json({ received: true });

  const payment = await db.payment.findFirst({ where: { provider: name, providerRef: event.providerRef } });
  if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  if (payment.status !== event.status) {
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: event.status, paidAt: event.status === "PAID" ? new Date() : undefined } }),
      db.bookingEvent.create({ data: { bookingId: payment.bookingId, type: "PAYMENT", note: `Pago ${event.status.toLowerCase()} (${name})` } }),
    ]);
  }
  return NextResponse.json({ received: true });
}
