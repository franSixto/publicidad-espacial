import { Building2, Car, Trees, Store, Sparkles, Bike, Monitor, Truck, Home, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  building: Building2,
  car: Car,
  land: Trees,
  store: Store,
  sparkles: Sparkles,
  bike: Bike,
  monitor: Monitor,
  truck: Truck,
  home: Home,
};

export const CATEGORY_ICON_NAMES = Object.keys(icons);

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} />;
}
