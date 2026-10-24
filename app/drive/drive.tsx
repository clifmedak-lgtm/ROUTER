import { useEffect, useRef, useState } from "react";
import { Clock, MapPin, Phone, Power, Wallet, Navigation, Hourglass, XCircle } from "lucide-react";
import { PageHeader, Protected, Shell, Spinner } from "../components/layout";
import { RideMap } from "../components/ride-map";
import { ImageUpload } from "../components/image-upload";
import { CITIES, RIDE_META, STATUS_LABEL, STATUS_STYLE, timeAgo, xaf, type RideType } from "../lib/format";
import {
  useAcceptRide,
  useAdvanceRide,
  useApplyDriver,
  useConfirmCash,
  useDriverCancel,
  useDriverCurrent,
  useDriverEarnings,
  useDriverMe,
  useDriverRequests,
  useSetOnline,
  useUpdateLocation,
} from "../queries/app";
import { cn } from "../lib/utils";

function Apply({ existing }: { existing?: { status: string } | null }) {
  const apply = useApplyDriver();
  const [f, setF] = useState({
    phone: "",
    city: "Douala",
    vehicleType: "eco" as RideType,
    vehicleModel: "",
    vehicleColor: "",
    plate: "",
    licenseNumber: "",
  });
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [licensePhotoUrl, setLicensePhotoUrl] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="mx-auto -mt-8 max-w-2xl px-5 pb-24">
      <form
        className="card relative z-10 space-y-5 p-6 md:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          apply.mutate({ ...f, photoUrl, licensePhotoUrl });
        }}
      >
        {existing?.status === "rejected" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Your previous application was not approved. Update your details and resubmit.</p>
        )}
        <div>
          <h2 className="font-display text-2xl">Driver application</h2>
          <p className="mt-1 text-sm text-muted">Tell us about you and your vehicle. Our team reviews applications within 24 hours.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="fld-1">Phone number</label>
            <input id="fld-1" aria-label="Phone number" className="field" required value={f.phone} onChange={set("phone")} placeholder="+237 6XX XX XX XX" />
          </div>
          <div>
            <label className="label" htmlFor="fld-2">City</label>
            <select id="fld-2" aria-label="City" className="field" value={f.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <p className="label">Vehicle type</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {(Object.keys(RIDE_META) as RideType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setF({ ...f, vehicleType: t })}
                className={cn("rounded-xl border p-3 text-sm", f.vehicleType === t ? "border-forest bg-lime/25 font-medium" : "border-line")}
              >
                {RIDE_META[t].label.replace("Router ", "")}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="fld-3">Make & model</label>
            <input id="fld-3" aria-label="Make & model" className="field" required value={f.vehicleModel} onChange={set("vehicleModel")} placeholder={f.vehicleType === "moto" ? "Nanfang 125" : "Toyota Corolla"} />
          </div>
          <div>
            <label className="label" htmlFor="fld-4">Colour</label>
            <input id="fld-4" aria-label="Colour" className="field" required value={f.vehicleColor} onChange={set("vehicleColor")} placeholder="White" />
          </div>
          <div>
            <label className="label" htmlFor="fld-5">Plate number</label>
            <input id="fld-5" aria-label="Plate number" className="field" required value={f.plate} onChange={set("plate")} placeholder="LT 123 AB" />
          </div>
          <div>
            <label className="label" htmlFor="fld-6">Driving licence number</label>
            <input id="fld-6" aria-label="Driving licence number" className="field" required value={f.licenseNumber} onChange={set("licenseNumber")} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ImageUpload kind="driver-photo" label="Profile photo" value={photoUrl} onChange={setPhotoUrl} />
          <ImageUpload kind="license" label="Driving licence photo" value={licensePhotoUrl} onChange={setLicensePhotoUrl} />
        </div>
        {apply.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apply.error.message}</p>}
        <button disabled={apply.isPending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime font-medium text-ink hover:bg-lime-dark disabled:opacity-60">
          {apply.isPending && <Spinner />} Submit application
        </button>
      </form>
    </div>
  );
}

function Pending({ status }: { status: string }) {
  const Icon = status === "suspended" ? XCircle : Hourglass;
  return (
    <div className="mx-auto -mt-8 max-w-lg px-5 pb-24">
      <div className="card relative z-10 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-lime/40">
          <Icon className="size-6 text-forest" />
        </span>
        <h2 className="mt-5 font-display text-2xl">{status === "suspended" ? "Account suspended" : "Application under review"}</h2>
        <p className="mt-2 text-muted">
          {status === "suspended"
            ? "Your driver account has been suspended. Please contact support@router.cm."
            : "Thanks for applying! We’ll verify your details shortly. This page updates automatically once you’re approved."}
        </p>
      </div>
    </div>
  );
}

function useGeoWatch(active: boolean, onPos: (p: { lat: number; lng: number }) => void) {
  const cb = useRef(onPos);
  cb.current = onPos;
  useEffect(() => {
    if (!active || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition((pos) => cb.current({ lat: pos.coords.latitude, lng: pos.coords.longitude }), undefined, {
      enableHighAccuracy: true,
      maximumAge: 10000,
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);
}

function Dashboard({ online, vehicleType }: { online: boolean; vehicleType: RideType }) {
  const setOnline = useSetOnline();
  const current = useDriverCurrent(true);
  const requests = useDriverRequests(online && !current.data);
  const earnings = useDriverEarnings(true);
  const accept = useAcceptRide();
  const advance = useAdvanceRide();
  const cancel = useDriverCancel();
  const cash = useConfirmCash();
  const loc = useUpdateLocation();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const lastSent = useRef(0);

  useGeoWatch(online, (p) => {
    setPos(p);
    if (Date.now() - lastSent.current > 8000) {
      lastSent.current = Date.now();
      loc.mutate(p);
    }
  });

  const toggle = () => {
    if (online) return setOnline.mutate({ online: false });
    if (!navigator.geolocation) return setOnline.mutate({ online: true });
    navigator.geolocation.getCurrentPosition(
      (p) => setOnline.mutate({ online: true, lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setOnline.mutate({ online: true }),
      { timeout: 8000 },
    );
  };

  const c = current.data;
  const nextLabel: Record<string, string> = {
    accepted: "I’m on my way",
    arriving: "Rider picked up — start trip",
    in_progress: "Complete trip",
  };

  return (
    <div className="mx-auto -mt-8 max-w-[1200px] px-5 pb-24 md:px-8">
      <div className="relative z-10 grid gap-4 md:grid-cols-4">
        <div className={cn("card flex items-center justify-between p-5 md:col-span-2", online && "bg-forest text-white")}>
          <div>
            <div className={cn("text-xs", online ? "text-white/60" : "text-muted")}>Status · {RIDE_META[vehicleType].label}</div>
            <div className="mt-1 font-display text-2xl">{online ? "You’re online" : "You’re offline"}</div>
          </div>
          <button
            onClick={toggle}
            disabled={setOnline.isPending}
            className={cn("flex h-12 items-center gap-2 rounded-xl px-5 font-medium", online ? "bg-white/10 text-white hover:bg-white/20" : "bg-lime text-ink hover:bg-lime-dark")}
          >
            {setOnline.isPending ? <Spinner /> : <Power className="size-4" />} {online ? "Go offline" : "Go online"}
          </button>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Wallet className="size-3.5" /> Today (net)
          </div>
          <div className="mt-1 font-display text-2xl tabular">{earnings.isLoading ? "…" : xaf(earnings.data?.todayNet ?? 0)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted">All-time · {earnings.data?.trips ?? 0} trips</div>
          <div className="mt-1 font-display text-2xl tabular">{earnings.isLoading ? "…" : xaf(earnings.data?.net ?? 0)}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[440px_1fr]">
        <div className="space-y-4">
          {c ? (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", STATUS_STYLE[c.status])}>{STATUS_LABEL[c.status]}</span>
                <span className="font-display text-xl font-semibold tabular">{xaf(c.fare)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-cream px-4 py-3">
                <div>
                  <div className="font-medium">{c.riderName}</div>
                  <div className="text-xs text-muted">
                    {c.paymentMethod === "cash" ? "Collect cash" : "Pays online"} · {c.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </div>
                </div>
                {c.riderPhone && (
                  <a href={`tel:${c.riderPhone}`} className="grid size-10 place-items-center rounded-lg bg-lime text-forest">
                    <Phone className="size-4" />
                  </a>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime text-[9px] font-bold text-forest">A</span>
                  {c.pickupAddress}
                </div>
                <div className="flex gap-2">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-forest text-[9px] font-bold text-white">B</span>
                  {c.dropAddress}
                </div>
              </div>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.status === "in_progress" ? `${c.dropLat},${c.dropLng}` : `${c.pickupLat},${c.pickupLng}`}`}
                className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm hover:bg-cream"
              >
                <Navigation className="size-4" /> Open navigation
              </a>
              <button
                onClick={() => advance.mutate({ id: c.id })}
                disabled={advance.isPending}
                className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime font-medium text-ink hover:bg-lime-dark disabled:opacity-60"
              >
                {advance.isPending && <Spinner />} {nextLabel[c.status]}
              </button>
              {["accepted", "arriving"].includes(c.status) && (
                <button onClick={() => cancel.mutate({ id: c.id })} className="mt-2 w-full py-2 text-sm text-red-700 hover:underline">
                  Release this trip
                </button>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-lg">Ride requests</h3>
                {online && <span className="flex items-center gap-1.5 text-xs text-muted"><span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Live</span>}
              </div>
              {!online ? (
                <p className="py-6 text-center text-sm text-muted">Go online to start receiving ride requests.</p>
              ) : requests.isLoading ? (
                <div className="grid place-items-center py-8"><Spinner className="text-forest" /></div>
              ) : !requests.data?.length ? (
                <p className="py-6 text-center text-sm text-muted">No requests right now. Hang tight — new ones appear automatically.</p>
              ) : (
                <div className="space-y-3">
                  {requests.data.map((r) => (
                    <div key={r.id} className="rounded-xl border border-line p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xl font-semibold tabular">{xaf(r.fare)}</span>
                        <span className="text-xs text-muted">{timeAgo(r.createdAt)}</span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-forest-glow" />{r.pickupAddress}</div>
                        <div className="flex gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-forest" />{r.dropAddress}</div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1"><Clock className="size-3" />{r.durationMin} min · {r.distanceKm} km</span>
                        {r.awayKm != null && <span>{r.awayKm} km from you</span>}
                        <span>{r.paymentMethod === "cash" ? "Cash" : "Online"}</span>
                      </div>
                      <button
                        onClick={() => accept.mutate({ id: r.id })}
                        disabled={accept.isPending}
                        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-forest text-sm font-medium text-white hover:bg-forest-glow disabled:opacity-60"
                      >
                        {accept.isPending && accept.variables?.id === r.id && <Spinner />} Accept ride
                      </button>
                    </div>
                  ))}
                  {accept.error && <p className="text-sm text-red-700">{accept.error.message}</p>}
                </div>
              )}
            </div>
          )}

          {earnings.data && earnings.data.recent.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display text-lg">Recent trips</h3>
              <div className="mt-3 divide-y divide-line">
                {earnings.data.recent.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{r.dropAddress}</div>
                      <div className="text-xs text-muted">{timeAgo(r.updatedAt)} · {r.paymentStatus === "paid" ? "Paid" : "Unpaid"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.paymentMethod === "cash" && r.paymentStatus !== "paid" && (
                        <button onClick={() => cash.mutate({ id: r.id })} className="rounded-md bg-lime/50 px-2 py-1 text-[11px] font-medium">
                          Cash received
                        </button>
                      )}
                      <span className="font-medium tabular">{xaf(Math.round(r.fare * (1 - (earnings.data?.commissionRate ?? 0))))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card h-[420px] overflow-hidden p-0 lg:h-auto lg:min-h-[600px]">
          <RideMap
            pickup={c ? { lat: c.pickupLat, lng: c.pickupLng } : null}
            drop={c ? { lat: c.dropLat, lng: c.dropLng } : null}
            route={c ? [[c.pickupLat, c.pickupLng], [c.dropLat, c.dropLng]] : undefined}
            driver={pos}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}

function DriverArea() {
  const me = useDriverMe();
  if (me.isLoading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }
  const d = me.data;
  if (!d || d.status === "rejected") return <Apply existing={d} />;
  if (d.status !== "approved") return <Pending status={d.status} />;
  return <Dashboard online={d.online} vehicleType={d.vehicleType} />;
}

export default function DrivePage() {
  return (
    <Shell>
      <PageHeader eyebrow="Router for drivers" title="Drive and earn on your schedule" subtitle="Keep 85% of every fare. Get paid in cash or straight to Mobile Money." />
      <Protected>
        <DriverArea />
      </Protected>
    </Shell>
  );
}
