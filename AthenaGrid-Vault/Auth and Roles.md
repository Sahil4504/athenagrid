---
tags: [athenagrid, transport, auth]
---

# Auth and Roles

How accounts, login, and access control work (reworked 2026-07-07). Code:
`apps/web/lib/auth.tsx` (context + guards), `apps/api/src/auth/`.

## Account types (chosen once at signup, `/signup`)
- **Farmer** → `role=SHIPPER`, `shipperType=FARMER` (+ address/ZIP, geocoded).
- **Industry** → `role=SHIPPER`, `shipperType=INDUSTRY`.
- **Transport Company** → `role=CARRIER`, `carrierType=COMPANY` (+ starter fleet vehicle).
- **Individual Driver** → `role=CARRIER`, `carrierType=INDIVIDUAL` (+ driver profile + vehicle).

Renamed in UI: "Carrier" → **Transport Company**, "Driver" → **Individual Driver**.

## Unified login
One `/login` page for everyone. After sign-in the app reads the role from `/users/me` and
routes automatically (`dashboardFor()`): SHIPPER → `/shipper`, CARRIER → `/carrier`. Token is
persisted in `localStorage` (`ag_token`) so refresh keeps you signed in.

## Role guards (fixes the "any account opens any page" bug)
`useRequireRole('SHIPPER'|'CARRIER')` redirects: not signed in → `/login`; wrong role →
their own dashboard. The marketplace additionally requires `shipperType==='FARMER'`.

## Who does what
- **Farmer** — buys in the [[Industry Marketplace]]; awards + tracks the auto-posted delivery
  jobs on the Farmer dashboard (no manual job posting).
- **Industry** — a shipper flavor (same dashboard); manual job posting removed.
- **Transport Company / Individual** — bid on jobs and run their own won deliveries via
  "My deliveries" on the carrier dashboard. See [[Bidding Engine]].

## Verification
Carriers must be VERIFIED to bid; on the test deployment `AUTO_VERIFY_CARRIERS=true` skips it.

Related: [[Transport System]] · [[Bidding Engine]] · [[Deployment]]
