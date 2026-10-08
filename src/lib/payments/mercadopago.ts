import type { PaymentProvider } from "./types";

/**
 * Esqueleto para la integración con Mercado Pago (Checkout Pro).
 * Se habilita con PAYMENT_PROVIDER="mercadopago" y MERCADOPAGO_ACCESS_TOKEN.
 * Pendiente de implementar en la fase de pagos: crear la "preference" vía
 * POST https://api.mercadopago.com/checkout/preferences y validar la firma del webhook.
 */
export const mercadoPagoProvider: PaymentProvider = {
  name: "mercadopago",
  async createCheckout() {
    throw new Error("La integración con Mercado Pago aún no está habilitada.");
  },
  async parseWebhook() {
    return null;
  },
};
