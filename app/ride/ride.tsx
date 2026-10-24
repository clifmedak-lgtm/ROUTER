import { useEffect, useState } from "react";
import { Redirect, useLocation, useSearch } from "wouter";
import { Banknote, Bike, Bus, Car, CarFront, Smartphone, Users, Info } from "lucide-react";
import { PageHeader, Protected, Shell, Spinner } from "../components/layout";
import { PlaceInput, type Place } from "../components/place-input";
import { RideMap } from "../components/ride-map";
import { client } from "../lib/api";
import { RIDE_META, xaf, type RideType } from "../lib/format";
import { useActiveRide, useCreateRide, useMe, usePaymentConfig, useQuote } from "../queries/app";
import { cn } from "../lib/utils";

const ICONS = { moto: Bike, eco: Car, comfort: CarFront, xl: Bus };

function Booking() {
  const search = new URLSearchParams(useSearch());
  const [, navigate] = useLocation();
  const active = useActiveRide();
  const me = useMe();
  const payCfg = usePaymentConfig();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [drop, setDrop] = useState<Place | null>(null);
  const [focus, setFocus] = useState<"pickup" | "drop">(search.get("to") ? "drop" : "pickup");
  const [rideType, setRideType] = useState<RideType>("eco");
  const [payment, setPayment] = useState<"cash" | "online">("cash");
  const [phone, setPhone] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quote = useQuote(pickup, drop);
  const create = useCreateRide();

  useEffect(() => {
    if (me.data?.phone && !phone) setPhone(me.data.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.data?.phone]);

  const locate = () => {
    if (!navigator.geolocation) return setError("Location not available on this device");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const r = await client.geo.reverse(p).catch(() => ({ label: "My location" }));
        setPickup({ ...p, address: r.label });
        setLocating(false);
        setFocus("drop");
      },
      () => {
        setLocating(false);
        setError("We couldn't get your location. Search or tap the map instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onMapClick = async (p: { lat: number; lng: number }) => {
    const r = await client.geo.reverse(p).catch(() => ({ label: "Pinned location" }));
    const place = { ...p, address: r.label };
    if (focus === "pickup") {
      setPickup(place);
      setFocus("drop");
    } else setDrop(place);
  };

  if (active.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }
  if (active.data) return <Redirect to={`/ride/${active.data.id}`} />;

  const book = () => {
    if (!pickup || !drop) return;
    setError(null);
    create.mutate(
      {
        pickup,
        drop,
        rideType,
        paymentMethod: payment,
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: (ride) => navigate(`/ride/${ride.id}`),
        onError: (e) => setError(e.message),
      },
    );
  };

  const selected = quote.data?.options.find((o) => o.type === rideType);

  return (
    <div className="mx-auto -mt-8 max-w-[1200px] px-5 pb-24 md:px-8">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="card relative z-20 space-y-5 p-5 md:p-6">
          <div className="space-y-3">
            <PlaceInput kind="pickup" value={pickup} onChange={setPickup} active={focus === "pickup"} onFocus={() => setFocus("pickup")} onLocate={locate} locating={locating} />
            <PlaceInput kind="drop" value={drop} onChange={setDrop} active={focus === "drop"} onFocus={() => setFocus("drop")} initialText={search.get("to") ?? undefined} />
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Info className="size-3.5" /> Tip: tap the map to drop a pin for {focus === "pickup" ? "pickup" : "destination"}.
            </p>
          </div>

          {pickup && drop && (
            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">Choose a ride</span>
                {quote.data && (
                  <span className="text-muted tabular">
                    {quote.data.distanceKm} km · ~{quote.data.durationMin} min
                  </span>
                )}
              </div>
              {quote.isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-[68px] animate-pulse rounded-xl bg-cream" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {quote.data?.options.map((o) => {
                    const Icon = ICONS[o.type];
                    return (
                      <button
                        key={o.type}
                        onClick={() => setRideType(o.type)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                          rideType === o.type ? "border-forest bg-lime/20" : "border-line hover:bg-cream",
                        )}
                      >
                        <span className={cn("grid size-11 place-items-center rounded-lg", rideType === o.type ? "bg-lime" : "bg-cream")}>
                          <Icon className="size-5 text-forest" />
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center gap-2 font-medium">
                            {o.label}
                            <span className="inline-flex items-center gap-0.5 text-xs text-muted">
                              <Users className="size-3" />
                              {o.seats}
                            </span>
                          </span>
                          <span className="block text-xs text-muted">
                            {o.etaMin} min away · {RIDE_META[o.type].blurb}
                          </span>
                        </span>
                        <span className="font-display font-semibold tabular">{xaf(o.fare)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {pickup && drop && quote.data && (
            <>
              <div>
                <span className="mb-2 block text-sm font-medium">Payment</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPayment("cash")}
                    className={cn("flex items-center gap-2 rounded-xl border p-3 text-sm", payment === "cash" ? "border-forest bg-lime/20" : "border-line")}
                  >
                    <Banknote className="size-4" /> Cash
                  </button>
                  <button
                    onClick={() => setPayment("online")}
                    className={cn("flex items-center gap-2 rounded-xl border p-3 text-left text-sm", payment === "online" ? "border-forest bg-lime/20" : "border-line")}
                  >
                    <Smartphone className="size-4 shrink-0" /> MoMo / Orange / Card
                  </button>
                </div>
                {payment === "online" && payCfg.data && !payCfg.data.online && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Online payments are being set up. You can still book and pay your driver in cash.
                  </p>
                )}
                {payment === "online" && payCfg.data?.online && (
                  <p className="mt-2 text-xs text-muted">You’ll pay securely via NotchPay once your driver accepts.</p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="fld-10">Phone number (so your driver can call you)</label>
                <input id="fld-10" aria-label="Phone number (so your driver can call you)" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" />
              </div>
            </>
          )}

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            onClick={book}
            disabled={!pickup || !drop || !selected || create.isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime font-medium text-ink transition hover:bg-lime-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending && <Spinner />}
            {selected ? `Request ${selected.label} · ${xaf(selected.fare)}` : "Enter pickup and destination"}
          </button>
        </div>

        <div className="card relative z-10 h-[420px] overflow-hidden p-0 lg:h-auto lg:min-h-[640px]">
          <RideMap pickup={pickup} drop={drop} route={quote.data?.geometry} onMapClick={onMapClick} className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export default function RidePage() {
  return (
    <Shell>
      <PageHeader eyebrow="Book a ride" title="Where are you headed?" subtitle="Upfront prices in FCFA. Moto, Eco, Comfort or XL — your choice." />
      <Protected>
        <Booking />
      </Protected>
    </Shell>
  );
}
