import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut } from "lucide-react";
import { authClient } from "../lib/auth";
import { useMe } from "../queries/app";
import { cn } from "../lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2 text-white", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-lime">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="#0b2a1e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="18" r="2.2" />
          <circle cx="18" cy="6" r="2.2" />
          <path d="M8 18h5a4 4 0 0 0 0-8h-2a4 4 0 0 1 0-8h5" />
        </svg>
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">Router</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { data: session } = authClient.useSession();
  const me = useMe();
  const role = me.data?.role;

  const links = [
    { to: "/ride", label: "Ride" },
    { to: "/drive", label: "Drive" },
    ...(session ? [{ to: "/trips", label: "My trips" }] : []),
    ...(role === "admin" ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  const signOut = async () => {
    await authClient.signOut();
    navigate("/");
    window.location.reload();
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Logo />
        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-[15px] text-white/85 transition hover:text-white">
              {l.label}
            </Link>
          ))}
          <a href="/#how" className="text-[15px] text-white/85 transition hover:text-white">
            How it works
          </a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <span className="text-sm text-white/70">{session.user.name.split(" ")[0]}</span>
              <button
                onClick={signOut}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/20 px-4 text-sm text-white transition hover:bg-white/10"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-ink transition hover:bg-cream"
            >
              Sign in
            </Link>
          )}
        </div>
        <button className="text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="mx-4 rounded-2xl bg-forest-deep/95 p-4 backdrop-blur md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-white/90 hover:bg-white/5">
              {l.label}
            </Link>
          ))}
          {session ? (
            <button onClick={signOut} className="mt-2 w-full rounded-lg border border-white/20 px-3 py-3 text-left text-white">
              Sign out
            </button>
          ) : (
            <Link to="/sign-in" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-lime px-3 py-3 text-center font-medium text-ink">
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="hero-band relative overflow-hidden pb-14 pt-32 md:pb-16 md:pt-36">
      <div className="relative z-10 mx-auto max-w-[1200px] px-5 text-center md:px-8">
        {eyebrow && (
          <span className="mb-4 inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.14em] text-lime">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-4xl font-normal text-white md:text-5xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-4 max-w-xl text-white/70">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-forest-deep text-white/70">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Safe, affordable rides across Cameroon. Book a moto or a car in seconds and pay with MTN MoMo, Orange Money, card or cash.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-medium text-white">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/ride" className="hover:text-white">Book a ride</Link></li>
            <li><Link to="/drive" className="hover:text-white">Become a driver</Link></li>
            <li><a href="/#cities" className="hover:text-white">Cities</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-sm font-medium text-white">Support</h4>
          <ul className="space-y-2 text-sm">
            <li>support@router.cm</li>
            <li>+237 6 00 00 00 00</li>
            <li>Douala · Yaoundé</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-5 md:px-8">
        <div className="select-none font-display text-[18vw] font-semibold leading-none tracking-tighter text-white/[0.04] md:text-[180px]">Router</div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col justify-between gap-2 px-5 py-6 text-xs md:flex-row md:px-8">
          <span>© {new Date().getFullYear()} Router Mobility. All rights reserved.</span>
          <span>Made for Cameroon 🇨🇲</span>
        </div>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent", className)} />;
}

export function Protected({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [location] = useLocation();
  if (isPending) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted">
        <Spinner className="size-6" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <h2 className="font-display text-2xl">Sign in to continue</h2>
        <p className="mt-2 text-muted">You need a Router account to use this page.</p>
        <Link
          to={`/sign-in?next=${encodeURIComponent(location)}`}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-forest px-6 font-medium text-white hover:bg-forest-glow"
        >
          Sign in or create account
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
