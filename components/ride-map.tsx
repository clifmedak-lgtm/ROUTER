import { useEffect } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { DOUALA } from "../lib/format";

type Pt = { lat: number; lng: number };

const dot = (bg: string, ring: string, label: string) =>
  L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:999px;background:${bg};border:3px solid ${ring};box-shadow:0 4px 14px rgba(0,0,0,.25);display:grid;place-items:center;font:700 11px 'DM Sans';color:${ring}">${label}</div>`,
  });

const pickupIcon = dot("#c9f364", "#0b2a1e", "A");
const dropIcon = dot("#0b2a1e", "#ffffff", "B");
const carIcon = L.divIcon({
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<div style="width:36px;height:36px;border-radius:12px;background:#0b2a1e;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9f364" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 6H7.3a2 2 0 0 0-1.6.8L3 10.5 1.6 11A1 1 0 0 0 1 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`,
});

function Fit({ points }: { points: Pt[] }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");
  useEffect(() => {
    if (points.length === 1) map.setView([points[0]!.lat, points[0]!.lng], 15, { animate: true });
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 16 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: (p: Pt) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function RideMap({
  pickup,
  drop,
  route,
  driver,
  onMapClick,
  className,
}: {
  pickup?: Pt | null;
  drop?: Pt | null;
  route?: [number, number][];
  driver?: Pt | null;
  onMapClick?: (p: Pt) => void;
  className?: string;
}) {
  const pts = [pickup, drop, driver].filter(Boolean) as Pt[];
  return (
    <MapContainer
      center={[DOUALA.lat, DOUALA.lng]}
      zoom={13}
      zoomControl={false}
      className={className ?? "h-full w-full"}
      style={{ minHeight: 320 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {route && route.length > 1 && (
        <>
          <Polyline positions={route} pathOptions={{ color: "#0b2a1e", weight: 7, opacity: 0.9 }} />
          <Polyline positions={route} pathOptions={{ color: "#c9f364", weight: 3, opacity: 1 }} />
        </>
      )}
      {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
      {drop && <Marker position={[drop.lat, drop.lng]} icon={dropIcon} />}
      {driver && <Marker position={[driver.lat, driver.lng]} icon={carIcon} />}
      <Fit points={pts} />
      <ClickHandler onClick={onMapClick} />
    </MapContainer>
  );
}
