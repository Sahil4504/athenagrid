---
tags: [athenagrid, transport, roadmap]
---

# Roadmap

## Status (2026-07-07)
✅ Live on the web for friends-testing: bidding (companies + individuals), verification gate,
live tracking, fair-price band + scoring, commission/settlement (farmer invoice + driver payout),
vibrant agri-brand UI, real signup/login. Deployed on [[Deployment|Netlify + Render]].

## Next build — post-testing change requests (2026-07-07)
Decisions: Transport Company executes/tracks its OWN won deliveries (no separate driver
logins for now); Farmer + Industry = same dashboard, two entry tabs + a type tag.

- [ ] **Split Shipper → Farmer + Industry.** Add `ShipperType` (FARMER | INDUSTRY) on the user;
      two tabs on the landing page. Both post jobs (Industry can post a job to deliver farming
      essentials to a Farmer). Same shipper dashboard, differ by branding/tag.
- [ ] **Rename in UI:** Carrier → **Transport Company**, Driver → **Individual Driver**.
- [ ] **Account types at signup (4):** Farmer, Industry, Transport Company, Individual Driver.
- [ ] **Unified login + role routing.** One common login page; after auth read role from
      `/users/me` and route to the correct dashboard. Persist token (localStorage) so refresh
      keeps you logged in.
- [ ] **BUG — role-scoped access.** Currently any account can open any dashboard. Add client
      route guards: SHIPPER→shipper only, CARRIER→carrier only; redirect on mismatch.
- [ ] **BUG — winner can't see won trip.** Root cause: a COMPANY has no driver profile, so the
      auto-assigned trip has no driver and the driver-only trip list is empty. Fix: make won
      trips visible + advanceable by the **carrier who won** (company or individual), via a
      "My deliveries" view on the carrier dashboard. `tracking.listTrips` for a CARRIER returns
      trips for jobs they won; advance/location allowed for the carrier owner OR assigned driver.
      This unifies individuals (also carriers) and companies. Drop separate DRIVER signup.
- [ ] **UI polish:** background imagery + mission content (farm/logistics feel).

## Later / testing hygiene
- [ ] Confirm the live end-to-end flow ([[Accounts and Testing]]) and share with friends.
- [ ] (Optional) keep-alive ping so the free API doesn't sleep during testing.
- [ ] Rename the Netlify site to something cleaner (e.g. `athenagrid.netlify.app`).

## Toward a real launch (hardening)
- [ ] Proper **Prisma migrations** (replace `db push`).
- [ ] **Always-on** backend + **persistent** Postgres (paid Render or AWS) — free DB expires ~30 days.
- [ ] Turn **off** `AUTO_VERIFY_CARRIERS`; build the admin **verification review UI** + real
      **S3 document uploads**.
- [ ] **Payments / escrow** (hold farmer total on award, release driver payout minus commission
      on delivery) — [[Pricing and Commission]].
- [ ] **Ratings & reliability** → feed into bid scoring.
- [ ] **ML integration**: use Model 7 `minimizedLogisticsCost` as the reference price; train a
      model to predict fair clearing price + on-time probability. See [[ML Models]].
- [ ] Custom domain, monitoring, rate limiting/idempotency on bid & award endpoints.

## Ideas / open questions
- Auto-award when bidding closes if top bid is in-band + carrier reliable?
- Multi-leg / cold-chain alerts on ETA slip.

Related: [[Decisions Log]]
