export type CheckoutRequest = {
  paymentId: string;
  bookingId: string;
  amount: number;
  description: string;
  payerEmail: string;
};

export type CheckoutResult = {
  providerRef: string | null;
  /** URL a la que redirigir al anunciante para pagar (null en el proveedor manual). */
  checkoutUrl: string | null;
};

/**
 * Contrato que debe implementar cualquier pasarela de pagos (Mercado Pago, Stripe, etc.).
 * El flujo previsto:
 *   1. createCheckout() al aceptar el acuerdo → se guarda Payment(PENDING).
 *   2. La pasarela notifica vía webhook (/api/payments/webhook/[provider]).
 *   3. parseWebhook() devuelve el estado → se actualiza Payment y Booking.
 */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(req: CheckoutRequest): Promise<CheckoutResult>;
  parseWebhook(req: Request): Promise<{ providerRef: string; status: "PAID" | "FAILED" | "REFUNDED" } | null>;
}
