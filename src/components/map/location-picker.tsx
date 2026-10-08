"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";

const pin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:22px;height:22px;border-radius:9999px;background:#f1532f;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:translate(-50%,-50%)"></span>`,
  iconSize: [0, 0],
});

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onChange(+e.latlng.lat.toFixed(5), +e.latlng.lng.toFixed(5)) });
  return null;
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 13));
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  return (
    <MapContainer center={[lat, lng]} zoom={13} className="h-72 w-full rounded-2xl">
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler onChange={onChange} />
      <Recenter lat={lat} lng={lng} />
      <Marker position={[lat, lng]} icon={pin} draggable eventHandlers={{ dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(+p.lat.toFixed(5), +p.lng.toFixed(5)); } }} />
    </MapContainer>
  );
}
