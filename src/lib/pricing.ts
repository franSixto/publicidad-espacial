import { env } from "./env";

export function commissionRate() {
  return env().PLATFORM_COMMISSION_RATE;
}

/** Desglose transparente: el anunciante paga el total; la plataforma retiene la comisión. */
export function computeBreakdown(monthlyPrice: number, months: number, rate = commissionRate()) {
  const totalAmount = Math.round(monthlyPrice * months);
  const commissionAmount = Math.round(totalAmount * rate);
  return { totalAmount, commissionAmount, ownerPayout: totalAmount - commissionAmount, commissionRate: rate };
}
