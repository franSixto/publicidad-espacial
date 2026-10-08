import type { PaymentProvider } from "./types";

/**
 * Proveedor por defecto: no cobra dinero. Registra el pago como pendiente para que
 * un administrador lo concilie manualmente (por ej. tras una transferencia bancaria).
 */
export const manualProvider: PaymentProvider = {
  name: "manual",
  async createCheckout(req) {
    return { providerRef: `manual_${req.paymentId}`, checkoutUrl: null };
  },
  async parseWebhook() {
    return null;
  },
};
