export type RideType = "moto" | "eco" | "comfort" | "xl";

export const RIDE_TYPES: Record<
  RideType,
  { label: string; seats: number; base: number; perKm: number; perMin: number; min: number }
> = {
  moto: { label: "Router Moto", seats: 1, base: 200, perKm: 120, perMin: 10, min: 300 },
  eco: { label: "Router Eco", seats: 4, base: 500, perKm: 220, perMin: 20, min: 1000 },
  comfort: { label: "Router Comfort", seats: 4, base: 800, perKm: 320, perMin: 30, min: 1500 },
  xl: { label: "Router XL", seats: 6, base: 1200, perKm: 420, perMin: 40, min: 2500 },
};

/** Platform commission taken from each completed fare. */
export const COMMISSION = 0.15;

export function computeFare(type: RideType, km: number, min: number) {
  const t = RIDE_TYPES[type];
  const raw = t.base + t.perKm * km + t.perMin * min;
  // round up to nearest 50 XAF
  return Math.max(t.min, Math.ceil(raw / 50) * 50);
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Road distance/duration via public OSRM, falling back to straight-line estimate. */
export async function routeInfo(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = (await res.json()) as {
        routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
      };
      const r = data.routes?.[0];
      if (r) {
        return {
          distanceKm: Math.round((r.distance / 1000) * 10) / 10,
          // city traffic factor
          durationMin: Math.max(1, Math.round((r.duration / 60) * 1.3)),
          geometry: r.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
        };
      }
    }
  } catch {
    // fall through
  }
  const km = haversineKm(a, b) * 1.35;
  return {
    distanceKm: Math.round(km * 10) / 10,
    durationMin: Math.max(1, Math.round((km / 22) * 60)),
    geometry: [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ] as [number, number][],
  };
}
