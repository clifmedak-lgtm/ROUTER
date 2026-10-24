
"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bike,
  Car,
  CarFront,
  Bus,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react";
import { Shell } from "../components/layout";
import { CITIES, xaf } from "../lib/format";

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }),
};

const RIDES = [
  { icon: Bike, name: "Moto", desc: "Weave through traffic. Helmet provided.", from: 300, seats: 1 },
  { icon: Car, name: "Eco", desc: "Everyday rides at the best price.", from: 1000, seats: 4 },
  { icon: CarFront, name: "Comfort", desc: "Newer cars with A/C and top drivers.", from: 1500, seats: 4 },
  { icon: Bus, name: "XL", desc: "Space for six and their luggage.", from: 2500, seats: 6 },
];

const FAQ = [
  {
    q: "How do I pay for my ride?",
    a: "Choose MTN Mobile Money, Orange Money or card for a cashless trip, or simply pay your driver in cash at the end. You see the fare before you book.",
  },
  {
    q: "How is the fare calculated?",
    a: "A base fare plus a rate per kilometre and per minute, depending on the ride type. The price shown when you book is the price you pay for the planned route.",
  },
  {
    q: "Are Router drivers verified?",
    a: "Every driver submits their licence, vehicle details and plate number. Our team reviews each application before the driver can accept trips.",
  },
  {
    q: "Which cities do you cover?",
    a: "We're launching in Douala and Yaoundé and expanding to Bafoussam, Bamenda, Garoua, Kribi, Limbe and Buea.",
  },
  {
    q: "Can I cancel a ride?",
    a: "Yes. You can cancel any time before your driver starts the trip, free of charge.",
  },
];

export default function Index() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [faq, setFaq] = useState<number | null>(0);

  return (
    <Shell>
      {/* HERO */}
      <section className="hero-band relative overflow-hidden pb-40 pt-36 md:pb-48 md:pt-44">
        <div className="relative z-10 mx-auto max-w-[1200px] px-5 text-center md:px-8">
          <motion.span
            custom={0}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs uppercase tracking-[0.14em] text-lime"
          >
            <span className="size-1.5 rounded-full bg-lime" /> Now live in Douala & Yaoundé
          </motion.span>
          <motion.h1
            custom={1}
            initial="hidden"
            animate="show"
            variants={fade}
            className="mx-auto max-w-4xl font-display text-[44px] font-normal leading-[1.08] text-white md:text-[68px]"
          >
            Get where you’re going,
            <br className="hidden md:block" /> the smarter way
          </motion.h1>
          <motion.p custom={2} initial="hidden" animate="show" variants={fade} className="mx-auto mt-6 max-w-xl text-[17px] text-white/75">
            Router connects you with trusted drivers across Cameroon. Book a moto or a car in seconds, see your price upfront and pay with Mobile Money.
          </motion.p>

          <motion.form
            custom={3}
            initial="hidden"
            animate="show"
            variants={fade}
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/ride${to.trim() ? `?to=${encodeURIComponent(to.trim())}` : ""}`);
            }}
            className="mx-auto mt-10 flex max-w-xl flex-col gap-3 rounded-2xl bg-white/[0.07] p-2 backdrop-blur sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4">
              <Navigation className="size-4 text-forest-glow" />
              <input aria-label="Destination"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Where to? e.g. Akwa, Bonapriso…"
                className="h-12 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted/70"
              />
            </div>
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-lime px-6 font-medium text-ink transition hover:bg-lime-dark">
              See prices <ArrowRight className="size-4" />
            </button>
          </motion.form>
          <motion.div custom={4} initial="hidden" animate="show" variants={fade} className="mt-5">
            <a href="/drive" className="text-sm text-white/70 underline-offset-4 hover:text-white hover:underline">
              Want to earn? Drive with Router →
            </a>
          </motion.div>
        </div>
      </section>

      {/* SHOWCASE STRIP */}
      <section className="relative z-20 -mt-28 md:-mt-32">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-5 md:grid-cols-[1.3fr_1fr_1fr] md:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="card overflow-hidden p-2">
            <img src="/images/hero-ride.jpg" alt="Rider getting into a Router car" className="h-64 w-full rounded-xl object-cover md:h-80" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.8 }} className="card flex flex-col justify-between p-6">
            <div>
              <span className="grid size-11 place-items-center rounded-xl bg-lime/40">
                <ShieldCheck className="size-5 text-forest" />
              </span>
              <h3 className="mt-5 font-display text-2xl">Verified drivers</h3>
              <p className="mt-2 text-[15px] text-muted">Licence, vehicle and plate checked before every driver goes live.</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-ink">
              <Star className="size-4 fill-lime text-forest" /> <b>4.9</b> average driver rating
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.74, duration: 0.8 }} className="card overflow-hidden bg-forest p-6 text-white">
            <span className="grid size-11 place-items-center rounded-xl bg-white/10">
              <Clock className="size-5 text-lime" />
            </span>
            <h3 className="mt-5 font-display text-2xl">Pickup in minutes</h3>
            <p className="mt-2 text-[15px] text-white/70">Nearby drivers see your request instantly. Track them live on the map.</p>
            <div className="mt-6 font-display text-5xl font-light text-lime tabular">~4 min</div>
          </motion.div>
        </div>
      </section>

      {/* RIDE OPTIONS */}
      <section className="py-24 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-normal md:text-5xl">A ride for every journey</h2>
            <p className="mt-4 text-muted">From a quick moto hop across town to a group trip to the airport.</p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RIDES.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="card group p-6 transition hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-xl bg-cream transition group-hover:bg-lime">
                    <r.icon className="size-6 text-forest" />
                  </span>
                  <span className="text-xs text-muted">{r.seats} seat{r.seats > 1 ? "s" : ""}</span>
                </div>
                <h3 className="mt-6 font-display text-xl">Router {r.name}</h3>
                <p className="mt-1.5 text-sm text-muted">{r.desc}</p>
                <div className="mt-6 border-t border-line pt-4 text-sm">
                  From <span className="font-display font-semibold text-ink tabular">{xaf(r.from)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="pb-24 md:pb-28">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="rounded-[28px] bg-[#efebe0] p-6 md:p-14">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="font-display text-4xl font-normal md:text-5xl">Book in three taps</h2>
                <p className="mt-4 max-w-md text-muted">No haggling, no guessing. Your price is fixed before the driver arrives.</p>
                <ol className="mt-10 space-y-6">
                  {[
                    { icon: MapPin, t: "Set your pickup & destination", d: "Search a place or tap the map. We work out the best route." },
                    { icon: Car, t: "Pick your ride and price", d: "Compare Moto, Eco, Comfort and XL with upfront fares in FCFA." },
                    { icon: Navigation, t: "Track your driver live", d: "See who’s coming, their car and plate, and follow them on the map." },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white font-display font-semibold text-forest shadow-sm">
                        0{i + 1}
                      </span>
                      <div>
                        <h4 className="font-display text-lg">{s.t}</h4>
                        <p className="text-sm text-muted">{s.d}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <a href="/ride" className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-forest px-6 font-medium text-white transition hover:bg-forest-glow">
                  Book a ride now <ArrowRight className="size-4" />
                </a>
              </div>
              <div className="relative">
                <img src="/images/moto.jpg" alt="Router moto taxi in Douala" className="h-[420px] w-full rounded-2xl object-cover" />
                <div className="card absolute -bottom-6 left-6 right-6 flex items-center gap-4 p-4 md:left-auto md:w-72">
                  <span className="grid size-11 place-items-center rounded-xl bg-lime">
                    <Bike className="size-5 text-forest" />
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Router Moto · 3 min</div>
                    <div className="text-xs text-muted">Akwa → Bonanjo</div>
                  </div>
                  <div className="font-display font-semibold tabular">{xaf(650)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAYMENTS */}
      <section className="pb-24 md:pb-28">
        <div className="mx-auto max-w-[1200px] px-5 text-center md:px-8">
          <h2 className="font-display text-4xl font-normal md:text-5xl">Pay the way you like</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted">Cashless with Mobile Money or card through our secure payment partner, or cash to your driver.</p>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4">
            {[
              { icon: Smartphone, t: "MTN Mobile Money", c: "bg-[#ffcc00]" },
              { icon: Wallet, t: "Orange Money", c: "bg-[#ff7900]" },
              { icon: CreditCard, t: "Visa & Mastercard", c: "bg-forest" },
              { icon: Banknote, t: "Cash", c: "bg-lime" },
            ].map((p) => (
              <div key={p.t} className="card flex items-center gap-3 px-6 py-5">
                <span className={`grid size-10 place-items-center rounded-lg ${p.c}`}>
                  <p.icon className={`size-5 ${p.c === "bg-forest" ? "text-white" : "text-ink"}`} />
                </span>
                <span className="font-display text-lg font-medium">{p.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DRIVE */}
      <section className="bg-forest-deep py-24 text-white md:py-28">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 md:grid-cols-2 md:px-8">
          <img src="/images/driver.jpg" alt="Router driver" className="h-[440px] w-full rounded-2xl object-cover" />
          <div>
            <span className="text-xs uppercase tracking-[0.14em] text-lime">Drive with Router</span>
            <h2 className="mt-4 font-display text-4xl font-normal md:text-5xl">Your car. Your hours. Your income.</h2>
            <p className="mt-5 max-w-md text-white/70">
              Join drivers earning on their own schedule. Keep 85% of every fare, get trip requests near you and see your earnings in real time.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { n: "85%", l: "of each fare" },
                { n: "24/7", l: "drive anytime" },
                { n: "0 FCFA", l: "to sign up" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="font-display text-2xl text-lime">{s.n}</div>
                  <div className="mt-1 text-xs text-white/60">{s.l}</div>
                </div>
              ))}
            </div>
            <a href="/drive" className="mt-10 inline-flex h-12 items-center gap-2 rounded-xl bg-lime px-6 font-medium text-ink transition hover:bg-lime-dark">
              Apply to drive <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section id="cities" className="py-24 md:py-28">
        <div className="mx-auto max-w-[1200px] px-5 text-center md:px-8">
          <h2 className="font-display text-4xl font-normal md:text-5xl">Moving Cameroon, city by city</h2>
          <p className="mt-4 text-muted">Live today in Douala and Yaoundé, with more cities rolling out.</p>
          <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-4">
            {CITIES.map((c, i) => (
              <div key={c} className="card flex items-center gap-3 px-6 py-4">
                <MapPin className="size-5 text-forest-glow" />
                <span className="font-display text-lg font-medium">{c}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${i < 2 ? "bg-lime text-forest" : "bg-cream text-muted"}`}>
                  {i < 2 ? "Live" : "Soon"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-28">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 md:grid-cols-[1fr_1.4fr] md:px-8">
          <div>
            <h2 className="font-display text-4xl font-normal">Frequently asked questions</h2>
            <p className="mt-4 text-muted">Can’t find what you need? Email support@router.cm.</p>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="card overflow-hidden">
                <button onClick={() => setFaq(faq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown className={`size-4 transition ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && <p className="px-5 pb-5 text-[15px] text-muted">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-[1200px] px-5 md:px-8">
          <div className="hero-band relative overflow-hidden rounded-[28px] px-6 py-16 text-center">
            <div className="relative z-10">
              <h2 className="font-display text-4xl font-normal text-white md:text-5xl">Ready when you are</h2>
              <p className="mx-auto mt-4 max-w-md text-white/70">Create your free account and take your first Router ride today.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a href="/ride" className="inline-flex h-12 items-center rounded-xl bg-lime px-6 font-medium text-ink hover:bg-lime-dark">
                  Book a ride
                </a>
                <a href="/drive" className="inline-flex h-12 items-center rounded-xl bg-white px-6 font-medium text-ink hover:bg-cream">
                  Become a driver
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}
