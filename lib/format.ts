export const RIDE_META = {
  moto: { label: "Router Moto", blurb: "Beat the traffic on two wheels", seats: 1 },
  eco: { label: "Router Eco", blurb: "Affordable everyday rides", seats: 4 },
  comfort: { label: "Router Comfort", blurb: "Newer cars, top-rated drivers", seats: 4 },
  xl: { label: "Router XL", blurb: "Room for groups and luggage", seats: 6 },
} as const;

export type RideType = keyof typeof RIDE_META;

export function xaf(n: number) {
  return `${new Intl.NumberFormat("fr-CM").format(n)} FCFA`;
}

export const STATUS_LABEL: Record<string, string> = {
  requested: "Finding your driver",
  accepted: "Driver assigned",
  arriving: "Driver is on the way",
  in_progress: "On the trip",
  completed: "Trip completed",
  cancelled: "Cancelled",
};

export const STATUS_STYLE: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  accepted: "bg-lime/40 text-forest",
  arriving: "bg-lime/40 text-forest",
  in_progress: "bg-emerald-100 text-emerald-800",
  completed: "bg-forest text-white",
  cancelled: "bg-red-100 text-red-700",
};

export function timeAgo(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const CITIES = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Kribi", "Limbe", "Buea"];

/** Default map centers for the main cities. */
export const DOUALA = { lat: 4.0511, lng: 9.7679 };
