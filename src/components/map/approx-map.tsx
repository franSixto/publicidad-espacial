"use client";
import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, TileLayer } from "react-leaflet";

/** Muestra una zona aproximada (no la dirección exacta) por privacidad del propietario. */
export default function ApproxMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom={false} className="h-80 w-full rounded-2xl">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Circle center={[lat, lng]} radius={350} pathOptions={{ color: "#f1532f", fillColor: "#f1532f", fillOpacity: 0.18 }} />
    </MapContainer>
  );
}
