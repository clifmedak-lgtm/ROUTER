import { useEffect, useState } from "react";
import { useParams, useSearch } from "wouter";
import { Check, Phone, Star, X, Smartphone, Banknote, CircleCheck } from "lucide-react";
import { PageHeader, Protected, Shell, Spinner } from "../components/layout";
import { RideMap } from "../components/ride-map";
import { RIDE_META, STATUS_LABEL, STATUS_STYLE, xaf } from "../lib/format";
import { useCancelRide, useRateRide, useRide, useStartPayment, useVerifyPayment, usePaymentConfig } from "../queries/app";
import { cn } from "../lib/utils";

const STEPS = ["requested", "accepted", "arriving", "in_progress", "completed"] as const;

function Trip({ id }: { id: number }) {
  const ride = useRide(id);
  const cancel = useCancelRide();
  const rate = useRateRide();
  const pay = useStartPayment();
  const verify = useVerifyPayment();
  const payCfg = usePaymentConfig();
  const search = new URLSearchParams(useSearch());
  const [stars, setStars] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // Returning from NotchPay checkout → verify the payment
  useEffect(() => {
    if (search.get("payment") === "return") verify.mutate({ rideId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep re-checking a pending online payment
  useEffect(() => {
    if (ride.data?.paymentStatus !== "pending") return;
    const t = setInterval(() => verify.mutate({ rideId: id }), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride.data?.paymentStatus]);

  if (ride.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }
  if (ride.error || !ride.data) {
    return <div className="mx-auto max-w-md py-20 text-center text-muted">Ride not found.</div>;
  }
  const r = ride.data;
  const stepIdx = STEPS.indexOf(r.status as (typeof STEPS)[number]);
  const driverPos = r.driver?.lat != null && r.driver?.lng != null ? { lat: r.driver.lat, lng: r.driver.lng } : null;
  const canCancel = ["requested", "accepted", "arriving"].includes(r.status);
  const canPay = r.paymentStatus !== "paid" && !["requested", "cancelled"].includes(r.status);

  const startPay = () => {
    setErr(null);
    pay.mutate(
      { rideId: r.id, origin: window.location.origin },
      {
        onSuccess: ({ url }) => {
          window.location.href = url;
        },
        onError: (e) => setErr(e.message),
      },
    );
  };

  return (
    <div className="mx-auto -mt-8 max-w-[1200px] px-5 pb-24 md:px-8">
      <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <div className="card relative z-20 p-5 md:p-6">
            <div className="flex items-center justify-between">
              <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
              <span className="text-xs text-muted">Ride #{r.id}</span>
            </div>

            {r.status === "requested" && (
              <div className="mt-6 flex items-center gap-4">
                <span className="relative grid size-12 place-items-center">
                  <span className="pulse-ring absolute inset-0 rounded-full bg-lime" />
                  <span className="relative size-4 rounded-full bg-forest" />
                </span>
                <div>
                  <div className="font-display text-lg">Looking for nearby drivers…</div>
                  <div className="text-sm text-muted">This usually takes under a minute.</div>
                </div>
              </div>
            )}

            {r.status !== "cancelled" && (
              <ol className="mt-6 flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <li key={s} className={cn("h-1.5 flex-1 rounded-full", i <= stepIdx ? "bg-forest" : "bg-line")} />
                ))}
              </ol>
            )}

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime text-[9px] font-bold text-forest">A</span>
                <span>{r.pickupAddress}</span>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[9px] font-bold text-white">B</span>
                <span>{r.dropAddress}</span>
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between border-t border-line pt-4">
              <div className="text-sm text-muted">
                {RIDE_META[r.rideType].label} · {r.distanceKm} km · ~{r.durationMin} min
              </div>
              <div className="font-display text-2xl font-semibold tabular">{xaf(r.fare)}</div>
            </div>
          </div>

          {r.driver && (
            <div className="card p-5">
              <div className="flex items-center gap-4">
                {r.driver.photoUrl || r.driver.image ? (
                  <img src={r.driver.photoUrl ?? r.driver.image!} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span className="grid size-14 place-items-center rounded-full bg-forest font-display text-xl text-lime">{r.driver.name[0]}</span>
                )}
                <div className="flex-1">
                  <div className="font-display text-lg">{r.driver.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted">
                    <Star className="size-3.5 fill-lime text-forest" /> {r.driver.rating ?? "New driver"}
                  </div>
                </div>
                <a href={`tel:${r.driver.phone}`} className="grid size-11 place-items-center rounded-xl bg-lime text-forest hover:bg-lime-dark">
                  <Phone className="size-4" />
                </a>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3 text-sm">
                <span>
                  {r.driver.vehicleColor} {r.driver.vehicleModel}
                </span>
                <span className="rounded-md bg-white px-2 py-1 font-mono text-xs font-semibold tracking-wider">{r.driver.plate}</span>
              </div>
            </div>
          )}

          {r.status !== "cancelled" && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Payment</span>
                {r.paymentStatus === "paid" ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                    <CircleCheck className="size-4" /> Paid
                  </span>
                ) : r.paymentStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-amber-700">
                    <Spinner className="size-3" /> Confirming…
                  </span>
                ) : (
                  <span className="text-sm text-muted">{r.paymentMethod === "cash" ? "Cash to driver" : "Not paid yet"}</span>
                )}
              </div>
              {canPay && (
                <div className="mt-4 space-y-2">
                  {payCfg.data?.online ? (
                    <button
                      onClick={startPay}
                      disabled={pay.isPending}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest font-medium text-white hover:bg-forest-glow disabled:opacity-60"
                    >
                      {pay.isPending ? <Spinner /> : <Smartphone className="size-4" />}
                      Pay {xaf(r.fare)} with MoMo, Orange or card
                    </button>
                  ) : (
                    <p className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2 text-xs text-muted">
                      <Banknote className="size-4" /> Please pay your driver in cash at the end of the trip.
                    </p>
                  )}
                  {err && <p className="text-sm text-red-700">{err}</p>}
                </div>
              )}
            </div>
          )}

          {r.status === "completed" && !r.riderRating && r.driver && (
            <div className="card p-5">
              <div className="font-medium">How was your ride with {r.driver.name.split(" ")[0]}?</div>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setStars(n)}>
                    <Star className={cn("size-8", n <= stars ? "fill-lime text-forest" : "text-line")} />
                  </button>
                ))}
              </div>
              <button
                disabled={!stars || rate.isPending}
                onClick={() => rate.mutate({ id: r.id, rating: stars })}
                className="mt-4 flex h-10 items-center gap-2 rounded-xl bg-lime px-5 text-sm font-medium text-ink disabled:opacity-50"
              >
                {rate.isPending && <Spinner />} Submit rating
              </button>
            </div>
          )}
          {r.riderRating && (
            <div className="card flex items-center gap-2 p-5 text-sm">
              <Check className="size-4 text-emerald-700" /> You rated this trip {r.riderRating}/5. Thank you!
            </div>
          )}

          <div className="flex gap-3">
            {canCancel && (
              <button
                onClick={() => cancel.mutate({ id: r.id })}
                disabled={cancel.isPending}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-700 hover:bg-red-50"
              >
                {cancel.isPending ? <Spinner /> : <X className="size-4" />} Cancel ride
              </button>
            )}
            {["completed", "cancelled"].includes(r.status) && (
              <a href="/ride" className="flex h-11 flex-1 items-center justify-center rounded-xl bg-lime text-sm font-medium text-ink hover:bg-lime-dark">
                Book another ride
              </a>
            )}
          </div>
        </div>

        <div className="card relative z-10 h-[420px] overflow-hidden p-0 lg:h-auto lg:min-h-[640px]">
          <RideMap
            pickup={{ lat: r.pickupLat, lng: r.pickupLng }}
            drop={{ lat: r.dropLat, lng: r.dropLng }}
            route={[
              [r.pickupLat, r.pickupLng],
              [r.dropLat, r.dropLng],
            ]}
            driver={["accepted", "arriving", "in_progress"].includes(r.status) ? driverPos : null}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <PageHeader eyebrow="Your trip" title="Track your ride" />
      <Protected>
        <Trip id={Number(id)} />
      </Protected>
    </Shell>
  );
}
