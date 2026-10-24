import { z } from "zod";
import { base } from "../__core/app";
import { computeFare, RIDE_TYPES, routeInfo, type RideType } from "../lib/pricing";

const UA = "RouterRideApp/1.0 (ride-hailing Cameroon)";

type NominatimResult = { display_name: string; lat: string; lon: string; name?: string };

function shortName(display: string) {
  return display.split(",").slice(0, 3).join(",").trim();
}

const point = z.object({ lat: z.number(), lng: z.number() });

export const geo = {
  search: base.input(z.object({ q: z.string().min(2) })).handler(async ({ input }) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=cm&q=${encodeURIComponent(input.q)}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en,fr" } });
    if (!res.ok) return [];
    const data = (await res.json()) as NominatimResult[];
    return data.map((d) => ({
      label: shortName(d.display_name),
      full: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }));
  }),

  reverse: base.input(point).handler(async ({ input }) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${input.lat}&lon=${input.lng}&zoom=17`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en,fr" } });
      const data = (await res.json()) as { display_name?: string };
      return { label: data.display_name ? shortName(data.display_name) : "Pinned location" };
    } catch {
      return { label: "Pinned location" };
    }
  }),

  /** Route + fare quotes for every ride type. */
  quote: base.input(z.object({ from: point, to: point })).handler(async ({ input }) => {
    const r = await routeInfo(input.from, input.to);
    const options = (Object.keys(RIDE_TYPES) as RideType[]).map((type) => ({
      type,
      label: RIDE_TYPES[type].label,
      seats: RIDE_TYPES[type].seats,
      fare: computeFare(type, r.distanceKm, r.durationMin),
      etaMin: type === "moto" ? 3 : type === "xl" ? 9 : type === "comfort" ? 7 : 5,
    }));
    return { ...r, options };
  }),
};
