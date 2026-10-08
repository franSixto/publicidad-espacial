"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { formatARS } from "@/lib/format";

export type MapSpace = { id: string; title: string; lat: number; lng: number; pricePerMonth: number; image?: string; city: string };

const shortPrice = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1).replace(".0", "")}M` : `$${Math.round(n / 1000)}k`);

function FitBounds({ spaces }: { spaces: MapSpace[] }) {
  const map = useMap();
  useEffect(() => {
    if (!spaces.length) return;
    const b = L.latLngBounds(spaces.map((s) => [s.lat, s.lng]));
    map.fitBounds(b, { padding: [40, 40], maxZoom: 14 });
  }, [map, spaces]);
  return null;
}

export default function SpacesMap({ spaces, className = "h-[600px]" }: { spaces: MapSpace[]; className?: string }) {
  return (
    <MapContainer center={[-34.6, -58.44]} zoom={5} scrollWheelZoom className={`${className} w-full rounded-2xl`}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds spaces={spaces} />
      {spaces.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={L.divIcon({ className: "", html: `<span class="price-pin">${shortPrice(s.pricePerMonth)}</span>`, iconSize: [0, 0] })}
        >
          <Popup>
            <a href={`/espacios/${s.id}`} className="block w-52 !text-ink no-underline">
              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt="" className="mb-2 h-28 w-full rounded-lg object-cover" />
              )}
              <strong className="line-clamp-2 block text-sm">{s.title}</strong>
              <span className="block text-xs text-gray-500">{s.city}</span>
              <span className="mt-1 block text-sm font-bold">{formatARS(s.pricePerMonth)} / mes</span>
            </a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
