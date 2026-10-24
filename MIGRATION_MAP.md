# Router — migration map to Next.js

## Target decisions already agreed

- Next.js App Router + TypeScript.
- npm as package manager; no Bun commands.
- No Drizzle ORM.
- Neon PostgreSQL as the database.
- Adapt the current Hono/oRPC API to Next.js Route Handlers where appropriate.
- Brevo for transactional email.
- CamerPay for payments only after checking its official documentation.
- Remove Runable-specific auth/runtime dependencies as part of the auth migration.
- Preserve Router's rider, driver, trip, admin, fare, map, and upload functionality unless a security fix requires changing behavior.

## Analogy

Think of the current app as a house. The pages and business rules are the furniture; Vite/Wouter/Hono/oRPC are the old room layout and wiring. We will move the useful furniture into a new Next.js house, rebuild the wiring, and replace the database/payment/email connections. We should not throw away working business rules just because the framework changes.

```text
CURRENT ROUTER                         NEW ROUTER
----------------                       ---------------------------
Vite + React + Wouter       ----->      Next.js App Router
Hono + oRPC routes          ----->      Next.js Route Handlers
SQLite/Turso + Drizzle      ----->      Neon PostgreSQL + selected non-Drizzle data layer
Runable-managed auth        ----->      Better Auth configured independently of Runable
NotchPay                    ----->      CamerPay (after official docs verification)
Email integration           ----->      Brevo
Cloudinary                  ----->      Cloudinary (retain if still needed)
Leaflet + OSRM + Nominatim  ----->      Retain initially; review reliability/security later
```

## Page migration map

| Current page/component | Next.js destination | Notes |
|---|---|---|
| `web/pages/index.tsx` | `src/app/page.tsx` | Landing page |
| `web/pages/sign-in.tsx` | `src/app/sign-in/page.tsx` | Rebuild sign-in against the new auth setup |
| `web/pages/ride.tsx` | `src/app/ride/page.tsx` | Booking flow |
| `web/pages/trip.tsx` | `src/app/ride/[id]/page.tsx` | Dynamic trip page |
| `web/pages/trips.tsx` | `src/app/trips/page.tsx` | Ride history |
| `web/pages/drive.tsx` | `src/app/drive/page.tsx` | Driver portal |
| `web/pages/admin.tsx` | `src/app/admin/page.tsx` | Admin console; tighten authorization |
| `web/pages/not-found.tsx` | `src/app/not-found.tsx` | Check the alternate snippet in `_source-alternates/` before deciding which version is intended |
| `web/components/*` | `src/components/` or `src/features/*` | Keep reusable UI; add `"use client"` only where browser state/events are required |
| `web/lib/format.ts`, `utils.ts` | `src/lib/` | Reuse and test formatting helpers |
| `web/lib/api.ts`, `web/queries/app.ts` | `src/lib/api/` and feature hooks/services | Replace oRPC client usage with typed fetchers or another chosen API client |
| `web/styles.css` | `src/app/globals.css` | Adapt global styles and Tailwind configuration |
| `web/index.html` | `src/app/layout.tsx` metadata | Move title, description, icons and Open Graph metadata into Next metadata config |

## API migration map

| Current backend file | New direction |
|---|---|
| `api/routes/rides.ts` | `src/app/api/rides/route.ts` plus `[id]` route(s) if needed |
| `api/routes/driver.ts` | `src/app/api/driver/.../route.ts` grouped by action/resource |
| `api/routes/admin.ts` | `src/app/api/admin/.../route.ts`; admin checks must be server-side |
| `api/routes/geo.ts` | `src/app/api/geo/.../route.ts` or server-only service functions |
| `api/routes/me.ts` | `src/app/api/me/route.ts` |
| `api/routes/payments.ts` | `src/app/api/payments/.../route.ts` plus a provider webhook route |
| `api/routes/ping.ts` | `src/app/api/health/route.ts` |
| `api/auth.ts` | Better Auth server setup and catch-all auth Route Handler, after removing Runable coupling |
| `api/index.ts`, `api/__core/app.ts` | Do not port the framework wrapper wholesale; move each endpoint's behavior into Route Handlers and shared server-only services |
| `api/lib/pricing.ts` | `src/features/rides/pricing.ts` or `src/lib/server/pricing.ts`; preserve fare rules and add tests |
| `api/lib/cloudinary.ts` | `src/lib/server/cloudinary.ts` |
| `api/lib/notchpay.ts` | Replace with a CamerPay service after its official API/auth/webhook contract is verified |
| `api/middleware/auth.ts` | Shared server-side auth/role guards used by Route Handlers |
| `api/database/schema.ts`, `auth-schema.ts`, `database/index.ts` | Rebuild schema and data access for PostgreSQL without Drizzle; migrate data model and auth tables together |

## Suggested target layout

```text
router/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   ├── sign-in/page.tsx
│   │   ├── ride/page.tsx
│   │   ├── ride/[id]/page.tsx
│   │   ├── trips/page.tsx
│   │   ├── drive/page.tsx
│   │   ├── admin/page.tsx
│   │   └── api/...
│   ├── components/
│   ├── features/
│   │   ├── rides/
│   │   ├── drivers/
│   │   ├── payments/
│   │   └── admin/
│   ├── lib/
│   │   ├── server/
│   │   ├── auth/
│   │   └── db/
│   └── types/
├── .env.example
├── package.json
└── next.config.ts
```

The exact folder boundaries can change after we inspect all imports. Database access technology remains a deliberate decision: Prisma or the `pg` driver are possibilities, but neither is selected by this map.

## Migration order

1. **Complete the source inventory.** Keep the extracted snapshot separate from the original project. Resolve duplicate/alternate snippets and identify missing files.
2. **Create a clean Next.js project with npm.** Do not copy the old package manifest wholesale; select only needed dependencies and scripts.
3. **Move design system and UI.** Set up fonts, Tailwind, styles, shared components, and the page routes. Validate each page before moving on.
4. **Choose and implement the PostgreSQL data layer.** Convert the existing SQLite data model and Better Auth tables to PostgreSQL. Plan schema creation and data migration before connecting production data.
5. **Rebuild authentication.** Remove Runable-specific plugins/client methods, configure Better Auth for the new host, validate allowed origins, and test rider/driver/admin access.
6. **Port APIs one feature at a time.** Start with profile/health, then geo, rides, driver, admin, and payments. Keep calculations on the server.
7. **Integrate Brevo and Cloudinary.** Keep all secrets server-only and test failures as well as success paths.
8. **Integrate CamerPay only after verification.** Confirm initiation, status verification, currency/amount, callback URLs, webhook signatures, and idempotency against official docs.
9. **Fix security and correctness issues before deployment.** See checklist below.
10. **Test, deploy to staging, and then production.** Do not switch traffic until auth, booking, payment, and driver workflows pass end-to-end tests.

## Known issues to address during migration

- The current admin route allows the first user to claim admin when no admin exists. Replace this with a controlled bootstrap process, not a public self-promotion action.
- Payment confirmation/webhook flows must verify provider signatures, exact amount/currency/reference, expected order/ride state, and duplicate events.
- Cash confirmation should not mark a ride paid without checking ride completion and payment method.
- Admin revenue and driver earnings should be calculated from the correct paid/completed states, not completion alone.
- Validate callback/return URLs against the configured site URL rather than trusting arbitrary client-supplied origins.
- Avoid trusting arbitrary request origins in auth configuration; use a deliberate allowed-origin list.
- Validate and limit driver upload types/sizes; never expose Cloudinary secrets.
- Review the current straight-line route fallback so users understand when estimates are approximate.

## Missing or unconfirmed source files

The supplied excerpts reference files not included in the 43 primary sections, including `packages/web/src/api/database/__client.ts`, `packages/web/src/web/__main.tsx`, `packages/web/src/__server.ts`, and package/config files for the web workspace. The root package manifest also refers to `packages/desktop`, `packages/mobile`, and root config files not present in the snippets. These may be intentionally managed/protected files, but we should not assume their contents.

The current excerpts are enough to begin a migration design, but not enough to claim this is a complete repository clone.
