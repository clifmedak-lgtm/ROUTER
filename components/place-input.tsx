import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Navigation } from "lucide-react";
import { useGeoSearch } from "../queries/app";
import { Spinner } from "./layout";
import { cn } from "../lib/utils";

export type Place = { lat: number; lng: number; address: string };

function useDebounced<T>(v: T, ms = 400) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export function PlaceInput({
  kind,
  value,
  onChange,
  active,
  onFocus,
  onLocate,
  locating,
  initialText,
}: {
  kind: "pickup" | "drop";
  value: Place | null;
  onChange: (p: Place | null) => void;
  active: boolean;
  onFocus: () => void;
  onLocate?: () => void;
  locating?: boolean;
  initialText?: string;
}) {
  const [text, setText] = useState(value?.address ?? initialText ?? "");
  const [open, setOpen] = useState(!!initialText);
  const q = useDebounced(text);
  const results = useGeoSearch(open ? q : "");
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) setText(value.address);
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={wrap} className="relative">
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border bg-white px-3.5 transition",
          active ? "border-forest-glow ring-4 ring-forest-glow/10" : "border-line",
        )}
      >
        {kind === "pickup" ? (
          <span className="grid size-6 place-items-center rounded-full bg-lime text-[10px] font-bold text-forest">A</span>
        ) : (
          <span className="grid size-6 place-items-center rounded-full bg-forest text-[10px] font-bold text-white">B</span>
        )}
        <input
          aria-label={kind === "pickup" ? "Pickup location" : "Destination"}
          value={text}
          onFocus={() => {
            onFocus();
            setOpen(true);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          placeholder={kind === "pickup" ? "Pickup location" : "Where to?"}
          className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted/70"
        />
        {results.isFetching && <Spinner className="text-muted" />}
        {onLocate && (
          <button type="button" onClick={onLocate} title="Use my location" className="text-forest-glow hover:text-forest">
            {locating ? <Spinner /> : <Crosshair className="size-4" />}
          </button>
        )}
      </div>
      {open && q.trim().length >= 3 && results.data && (
        <div className="absolute inset-x-0 top-full z-[1000] mt-2 max-h-72 overflow-auto rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {results.data.length === 0 && <div className="px-3 py-3 text-sm text-muted">No places found in Cameroon. Try another name or tap the map.</div>}
          {results.data.map((r) => (
            <button
              key={`${r.lat},${r.lng}`}
              type="button"
              onClick={() => {
                onChange({ lat: r.lat, lng: r.lng, address: r.label });
                setText(r.label);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cream"
            >
              {kind === "pickup" ? <Navigation className="mt-0.5 size-4 shrink-0 text-muted" /> : <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />}
              <span>
                <span className="block text-sm font-medium">{r.label}</span>
                <span className="line-clamp-1 block text-xs text-muted">{r.full}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
