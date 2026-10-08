"use client";
import dynamic from "next/dynamic";

const loading = () => <div className="flex h-full min-h-72 w-full animate-pulse items-center justify-center rounded-2xl bg-stone-100 text-sm text-ink-muted">Cargando mapa…</div>;

export const SpacesMap = dynamic(() => import("./spaces-map"), { ssr: false, loading });
export const ApproxMap = dynamic(() => import("./approx-map"), { ssr: false, loading });
export const LocationPicker = dynamic(() => import("./location-picker"), { ssr: false, loading });
export type { MapSpace } from "./spaces-map";
