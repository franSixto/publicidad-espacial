import "server-only";
import { db } from "../db";
import { env } from "../env";
import { manualProvider } from "./manual";
import { mercadoPagoProvider } from "./mercadopago";
import type { PaymentProvider } from "./types";

const providers: Record<string, PaymentProvider> = {
  manual: manualProvider,
  mercadopago: mercadoPagoProvider,
};

export function getPaymentProvider(name: string = env().PAYMENT_PROVIDER): PaymentProvider {
  return providers[name] ?? manualProvider;
}

/** Crea el registro de pago de una campaña acordada e inicia el checkout del proveedor. */
export async function initiatePayment(bookingId: string) {
  const booking = await db.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { advertiser: { select: { email: true } }, space: { select: { title: true } } },
  });
  const provider = getPaymentProvider();
  const payment = await db.payment.create({
    data: {
      bookingId,
      amount: booking.totalAmount,
      commissionAmount: booking.commissionAmount,
      provider: provider.name,
    },
  });
  const result = await provider.createCheckout({
    paymentId: payment.id,
    bookingId,
    amount: booking.totalAmount,
    description: `AdSpace · ${booking.space.title}`,
    payerEmail: booking.advertiser.email,
  });
  return db.payment.update({
    where: { id: payment.id },
    data: { providerRef: result.providerRef, checkoutUrl: result.checkoutUrl },
  });
}
