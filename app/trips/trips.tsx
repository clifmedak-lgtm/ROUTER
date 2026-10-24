import { Link } from "wouter";
import { ChevronRight } from "lucide-react";
import { PageHeader, Protected, Shell, Spinner } from "../components/layout";
import { RIDE_META, STATUS_LABEL, STATUS_STYLE, timeAgo, xaf } from "../lib/format";
import { useRideHistory } from "../queries/app";
import { cn } from "../lib/utils";

function History() {
  const list = useRideHistory();
  if (list.isLoading) {
    return (
      <div className="grid min-h-[30vh] place-items-center">
        <Spinner className="size-6 text-forest" />
      </div>
    );
  }
  const rides = list.data ?? [];
  const spent = rides.filter((r) => r.status === "completed").reduce((s, r) => s + r.fare, 0);
  return (
    <div className="mx-auto -mt-8 max-w-3xl px-5 pb-24">
      <div className="card relative z-10 mb-5 grid grid-cols-2 divide-x divide-line p-0">
        <div className="p-5">
          <div className="text-xs text-muted">Trips taken</div>
          <div className="mt-1 font-display text-3xl tabular">{rides.filter((r) => r.status === "completed").length}</div>
        </div>
        <div className="p-5">
          <div className="text-xs text-muted">Total spent</div>
          <div className="mt-1 font-display text-3xl tabular">{xaf(spent)}</div>
        </div>
      </div>
      {rides.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-muted">No trips yet.</p>
          <Link to="/ride" className="mt-4 inline-flex h-11 items-center rounded-xl bg-lime px-5 font-medium text-ink">
            Book your first ride
          </Link>
        </div>
      ) : (
        <div className="card divide-y divide-line p-0">
          {rides.map((r) => (
            <Link key={r.id} to={`/ride/${r.id}`} className="flex items-center gap-4 p-4 transition hover:bg-cream/60 md:p-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{RIDE_META[r.rideType].label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px]", STATUS_STYLE[r.status])}>{STATUS_LABEL[r.status]}</span>
                </div>
                <div className="mt-1 truncate text-sm text-muted">
                  {r.pickupAddress} → {r.dropAddress}
                </div>
                <div className="mt-0.5 text-xs text-muted">{timeAgo(r.createdAt)}</div>
              </div>
              <div className="font-display font-semibold tabular">{xaf(r.fare)}</div>
              <ChevronRight className="size-4 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TripsPage() {
  return (
    <Shell>
      <PageHeader eyebrow="History" title="My trips" />
      <Protected>
        <History />
      </Protected>
    </Shell>
  );
}
