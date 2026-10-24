# Router — Design

Ride-hailing web app for Cameroon (Douala, Yaoundé, …). Riders book motos & cars, drivers accept trips, admins manage the network. Visual direction: deep forest-green hero bands with soft radial glow, warm cream surfaces, crisp white cards, electric lime accent for primary actions. Calm, premium, uncluttered.

## Colors (CSS variables in `packages/web/src/web/styles.css`)

| Token | Hex | Use |
|---|---|---|
| forest | #0B2A1E | Hero bands, dark sections, nav on dark |
| forest-deep | #061810 | Footer, darkest gradient stop |
| forest-glow | #1F5A3D | Radial glow inside hero |
| lime | #C9F364 | Primary CTA buttons, active chips, highlights |
| cream | #F5F2EA | Page background for light sections, card wells |
| paper | #FFFFFF | Cards |
| ink | #0E1A14 | Body text on light |
| muted | #5E6B64 | Secondary text |
| line | #E4E0D4 | Borders on cream |

Status colors: requested = amber #F2B53A, accepted/arriving = lime, in_progress = #3FB37F, completed = forest, cancelled = #D9534F.

## Typography

- Display: **Plus Jakarta Sans** 400–500, tight tracking (-0.02em), large sizes (48–72px hero). Light weight headlines like the reference.
- Body/UI: **DM Sans** 400/500/700, 15–16px, line-height 1.6.
- Numbers (fares): Plus Jakarta Sans 600, tabular.

## Shape & spacing

- Radius: 14px cards, 10px buttons, full pills for chips.
- Cards: white on cream, 1px `line` border, soft shadow `0 10px 30px -12px rgba(11,42,30,.18)`.
- Section padding 96px desktop / 64px mobile. Max width 1200px.
- Hero: centered headline, two buttons (lime solid + white solid).

## Components

- Buttons: `lime` (ink text), `white` (ink text), `dark` (forest bg, white text), `ghost`.
- Inner pages (ride, drive, admin) open with a short forest band header (title + subtitle) then cream body, matching the template's interior pages.
- Map panels: Leaflet with CARTO light tiles, rounded 14px, pickup marker lime, drop marker forest.

## Motion

One staggered fade-up on hero load (motion). Subtle hover lift on cards. Pulsing dot for "searching for driver".

## Pages

- `/` landing · `/sign-in` · `/ride` book · `/ride/:id` trip · `/trips` history · `/drive` driver app · `/admin` admin console.
