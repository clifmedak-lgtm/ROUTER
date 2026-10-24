import { useState } from "react";
import { ShieldCheck, Users, Car, Route, Wallet, Activity } from "lucide-react";
import { PageHeader, Protected, Shell, Spinner } from "../components/layout";
import { RIDE_META, STATUS_LABEL, STATUS_STYLE, timeAgo, xaf } from "../lib/format";
import {
  useAdminDrivers,
  useAdminRides,
  useAdminStats,
  useAdminUsers,
  useCanClaimAdmin,
  useClaimAdmin,
  useMe,
  useSetDriverStatus,
  useSetRole,
} from "../queries/app";
import { cn } from "../lib/utils";

function Claim() {
  const can = useCanClaimAdmin(true);
  const claim = useClaimAdmin();
  if (can.isLoading) return <div className="grid min-h-[30vh] place-items-center"><Spinner className="text-forest" /></div>;
  return (
    <div className="mx-auto -mt-8 max-w-md px-5 pb-24">
      <div className="card relative z-10 p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-forest" />
        {can.data?.canClaim ? (
          <>
            <h2 className="mt-4 font-display text-2xl">Set up the admin account</h2>
            <p className="mt-2 text-sm text-muted">No admin exists yet. Claim admin access for this account to manage drivers and rides.</p>
            <button onClick={() => claim.mutate({})} disabled={claim.isPending} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-lime px-6 font-medium text-ink">
              {claim.isPending && <Spinner />} Become admin
            </button>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-display text-2xl">Admins only</h2>
            <p className="mt-2 text-sm text-muted">Ask an existing admin to grant your account access.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, dark }: { icon: typeof Users; label: string; value: string | number; dark?: boolean }) {
  return (
    <div className={cn("card p-5", dark && "bg-forest text-white")}>
      <div className={cn("flex items-center gap-1.5 text-xs", dark ? "text-white/60" : "text-muted")}>
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={cn("mt-1 font-display text-2xl tabular", dark && "text-lime")}>{value}</div>
    </div>
  );
}

function Console() {
  const [tab, setTab] = useState<"drivers" | "rides" | "users">("drivers");
  const stats = useAdminStats(true);
  const drivers = useAdminDrivers(tab === "drivers");
  const rides = useAdminRides(tab === "rides");
  const users = useAdminUsers(tab === "users");
  const setStatus = useSetDriverStatus();
  const setRole = useSetRole();
  const s = stats.data;

  return (
    <div className="mx-auto -mt-8 max-w-[1200px] px-5 pb-24 md:px-8">
      <div className="relative z-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Stat icon={Wallet} label="Router revenue" value={s ? xaf(s.revenue) : "…"} dark />
        <Stat icon={Wallet} label="Gross bookings" value={s ? xaf(s.gross) : "…"} />
        <Stat icon={Route} label="Completed rides" value={s?.completedRides ?? "…"} />
        <Stat icon={Activity} label="Active now" value={s?.activeRides ?? "…"} />
        <Stat icon={Car} label="Drivers online / total" value={s ? `${s.onlineDrivers} / ${s.drivers}` : "…"} />
        <Stat icon={Users} label="Users" value={s?.users ?? "…"} />
      </div>

      <div className="mt-8 flex gap-2">
        {(["drivers", "rides", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("h-10 rounded-full px-5 text-sm capitalize", tab === t ? "bg-forest text-white" : "bg-white text-ink hover:bg-[#efebe0]")}
          >
            {t}
            {t === "drivers" && s?.pendingDrivers ? <span className="ml-2 rounded-full bg-lime px-1.5 text-[11px] text-forest">{s.pendingDrivers}</span> : null}
          </button>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto p-0">
        {tab === "drivers" &&
          (drivers.isLoading ? (
            <div className="grid place-items-center py-16"><Spinner className="text-forest" /></div>
          ) : !drivers.data?.length ? (
            <p className="p-10 text-center text-muted">No driver applications yet.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-cream/60 text-left text-xs text-muted">
                <tr>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Licence</th>
                  <th className="p-4">City</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {drivers.data.map((d) => (
                  <tr key={d.userId}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {d.photoUrl ? <img src={d.photoUrl} className="size-9 rounded-full object-cover" alt="" /> : <span className="grid size-9 place-items-center rounded-full bg-forest text-lime">{d.name[0]}</span>}
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-muted">{d.phone} · {d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>{RIDE_META[d.vehicleType].label}</div>
                      <div className="text-xs text-muted">{d.vehicleColor} {d.vehicleModel} · <span className="font-mono">{d.plate}</span></div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs">{d.licenseNumber}</div>
                      {d.licensePhotoUrl && <a href={d.licensePhotoUrl} target="_blank" rel="noreferrer" className="text-xs text-forest-glow underline">View photo</a>}
                    </td>
                    <td className="p-4">{d.city}</td>
                    <td className="p-4 tabular">{d.ratingCount ? (d.ratingSum / d.ratingCount).toFixed(1) : "—"}</td>
                    <td className="p-4">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] capitalize", d.status === "approved" ? "bg-lime/50 text-forest" : d.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700")}>
                        {d.status}
                      </span>
                      {d.online && <span className="ml-2 text-[11px] text-emerald-700">● online</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {d.status !== "approved" && (
                          <button onClick={() => setStatus.mutate({ userId: d.userId, status: "approved" })} className="rounded-lg bg-forest px-3 py-1.5 text-xs text-white">Approve</button>
                        )}
                        {d.status === "pending" && (
                          <button onClick={() => setStatus.mutate({ userId: d.userId, status: "rejected" })} className="rounded-lg border border-line px-3 py-1.5 text-xs">Reject</button>
                        )}
                        {d.status === "approved" && (
                          <button onClick={() => setStatus.mutate({ userId: d.userId, status: "suspended" })} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700">Suspend</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "rides" &&
          (rides.isLoading ? (
            <div className="grid place-items-center py-16"><Spinner className="text-forest" /></div>
          ) : !rides.data?.length ? (
            <p className="p-10 text-center text-muted">No rides yet.</p>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-cream/60 text-left text-xs text-muted">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">Rider</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Fare</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rides.data.map(({ ride: r, riderName }) => (
                  <tr key={r.id}>
                    <td className="p-4 text-muted">{r.id}</td>
                    <td className="p-4">{riderName}</td>
                    <td className="max-w-[280px] p-4"><div className="truncate">{r.pickupAddress}</div><div className="truncate text-xs text-muted">→ {r.dropAddress}</div></td>
                    <td className="p-4">{RIDE_META[r.rideType].label.replace("Router ", "")}</td>
                    <td className="p-4 font-medium tabular">{xaf(r.fare)}</td>
                    <td className="p-4 text-xs">{r.paymentMethod} · {r.paymentStatus}</td>
                    <td className="p-4"><span className={cn("rounded-full px-2 py-0.5 text-[11px]", STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span></td>
                    <td className="p-4 text-xs text-muted">{timeAgo(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {tab === "users" &&
          (users.isLoading ? (
            <div className="grid place-items-center py-16"><Spinner className="text-forest" /></div>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-cream/60 text-left text-xs text-muted">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data?.map((u) => (
                  <tr key={u.id}>
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">{u.phone ?? "—"}</td>
                    <td className="p-4 text-xs text-muted">{timeAgo(u.createdAt)}</td>
                    <td className="p-4">
                      <select
                        aria-label="User role"
                        value={u.role ?? "rider"}
                        onChange={(e) => setRole.mutate({ userId: u.id, role: e.target.value as "rider" | "driver" | "admin" })}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                      >
                        <option value="rider">Rider</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        {(setStatus.error || setRole.error) && <p className="p-4 text-sm text-red-700">{(setStatus.error ?? setRole.error)?.message}</p>}
      </div>
    </div>
  );
}

function AdminArea() {
  const me = useMe();
  if (me.isLoading) return <div className="grid min-h-[30vh] place-items-center"><Spinner className="text-forest" /></div>;
  return me.data?.role === "admin" ? <Console /> : <Claim />;
}

export default function AdminPage() {
  return (
    <Shell>
      <PageHeader eyebrow="Admin" title="Network control" subtitle="Approve drivers, monitor rides and track revenue." />
      <Protected>
        <AdminArea />
      </Protected>
    </Shell>
  );
}
