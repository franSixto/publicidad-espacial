import type { Visibility } from "@prisma/client";

// Estimador orientativo del potencial comercial de un espacio.
// Heurística simple y transparente; pensado para reemplazarse por un modelo
// basado en datos reales de contrataciones a medida que la plataforma crezca.

const visibilityImpressions: Record<Visibility, number> = {
  LOW: 800,
  MEDIUM: 3500,
  HIGH: 12000,
  VERY_HIGH: 35000,
};

const cityTier: Record<string, number> = {
  "buenos aires": 1.35,
  caba: 1.35,
  "ciudad autónoma de buenos aires": 1.35,
  córdoba: 1.15,
  rosario: 1.15,
  mendoza: 1.1,
  "mar del plata": 1.1,
  "la plata": 1.05,
};

export type EstimateInput = {
  visibility: Visibility;
  widthM: number;
  heightM: number;
  city: string;
  categoryFactor: number;
  isMobile?: boolean;
};

export function estimatePotential(i: EstimateInput) {
  const area = Math.max(0.25, i.widthM * i.heightM);
  const tier = cityTier[i.city.trim().toLowerCase()] ?? 1;
  const dailyImpressions = Math.round(visibilityImpressions[i.visibility] * tier * (i.isMobile ? 1.4 : 1));
  // CPM orientativo en ARS por cada mil impactos, ajustado por superficie.
  const cpm = 180 * i.categoryFactor * Math.min(3, 0.6 + Math.sqrt(area) / 3);
  const monthly = (dailyImpressions * 30 * cpm) / 1000;
  const round = (n: number) => Math.max(5000, Math.round(n / 1000) * 1000);
  return {
    dailyImpressions,
    monthlyImpressions: dailyImpressions * 30,
    suggestedMin: round(monthly * 0.8),
    suggestedMax: round(monthly * 1.25),
    suggested: round(monthly),
  };
}
