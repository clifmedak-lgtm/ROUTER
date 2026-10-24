import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Logo, Spinner } from "../components/layout";
import { authClient } from "../lib/auth";

export default function SignInPage() {
  const search = new URLSearchParams(useSearch());
  const next = search.get("next") || "/ride";
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);

  const done = () => navigate(next);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("email");
    const res =
      mode === "in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name });
    setLoading(null);
    if (res.error) setError(res.error.message ?? "Something went wrong");
    else done();
  };

  const google = async () => {
    setError(null);
    setLoading("google");
    const result = await authClient.managedAuth.signIn({ provider: "google" });
    setLoading(null);
    if (result.error && result.error.code !== "POPUP_CLOSED") setError(result.error.message);
    else if (!result.error) done();
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hero-band relative hidden overflow-hidden md:block">
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <Logo />
          <div>
            <h1 className="max-w-md font-display text-5xl font-normal leading-tight text-white">Your city, one tap away.</h1>
            <p className="mt-4 max-w-sm text-white/70">Ride, drive or manage — one Router account does it all.</p>
          </div>
          <img src="/images/hero-ride.jpg" alt="" className="h-56 w-full rounded-2xl object-cover opacity-90" />
        </div>
      </div>

      <div className="flex items-center justify-center bg-cream px-5 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <div className="inline-block rounded-xl bg-forest p-3">
              <Logo />
            </div>
          </div>
          <h2 className="font-display text-3xl">{mode === "in" ? "Welcome back" : "Create your account"}</h2>
          <p className="mt-2 text-sm text-muted">{mode === "in" ? "Sign in to book and track your rides." : "It takes less than a minute."}</p>

          <button
            onClick={google}
            disabled={!!loading}
            className="mt-8 flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-line bg-white font-medium transition hover:bg-[#fbfaf6] disabled:opacity-60"
          >
            {loading === "google" ? (
              <Spinner />
            ) : (
              <svg className="size-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "up" && (
              <div>
                <label className="label" htmlFor="fld-7">Full name</label>
                <input id="fld-7" aria-label="Full name" className="field" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ngono Marie" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="fld-8">Email</label>
              <input id="fld-8" aria-label="Email" className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="label" htmlFor="fld-9">Password</label>
              <input id="fld-9" aria-label="Password" className="field" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" />
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              disabled={!!loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest font-medium text-white transition hover:bg-forest-glow disabled:opacity-60"
            >
              {loading === "email" && <Spinner />}
              {mode === "in" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "in" ? "New to Router? " : "Already have an account? "}
            <button className="font-medium text-forest underline-offset-4 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); }}>
              {mode === "in" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-10 text-center text-xs text-muted">
            <Link to="/" className="hover:text-ink">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
