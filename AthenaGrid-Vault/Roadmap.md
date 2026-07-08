---
tags: [athenagrid, transport, roadmap]
---

# Roadmap

## Status (2026-07-07)
✅ Live on the web for friends-testing. Shipped so far: bidding (companies + individuals),
verification gate, live tracking, fair-price band + scoring, commission/settlement (farmer
invoice + driver payout), vibrant agri-brand UI, **unified login + role guards**
([[Auth and Roles]]), **Farmer/Industry split**, carrier **My deliveries**, and the
**[[Industry Marketplace]]** (~153 US vendors, real catalog + photos, FBN-style UI, orders
auto-post deliveries, combined bill). Manual "post a job" form **removed**. Deployed on
[[Deployment|Netlify + Render]] (auto-seeds on deploy).

## Done — post-testing change requests (2026-07-07) ✅
All of the below are built and compile-verified. Decisions: Transport Company executes/tracks
its OWN won deliveries; Farmer + Industry share one dashboard.

- [x] **Split Shipper → Farmer + Industry.** Add `ShipperType` (FARMER | INDUSTRY) on the user;
      two tabs on the landing page. Both post jobs (Industry can post a job to deliver farming
      essentials to a Farmer). Same shipper dashboard, differ by branding/tag.
- [x] **Rename in UI:** Carrier → **Transport Company**, Driver → **Individual Driver**.
- [x] **Account types at signup (4):** Farmer, Industry, Transport Company, Individual Driver.
- [x] **Unified login + role routing** → [[Auth and Roles]]. Token persisted in localStorage.
- [x] **BUG — role-scoped access.** Client route guards (`useRequireRole`); redirect on mismatch.
- [x] **BUG — winner can't see won trip.** Root cause: a COMPANY has no driver profile, so the
      auto-assigned trip has no driver and the driver-only trip list is empty. Fix: make won
      trips visible + advanceable by the **carrier who won** (company or individual), via a
      "My deliveries" view on the carrier dashboard. `tracking.listTrips` for a CARRIER returns
      trips for jobs they won; advance/location allowed for the carrier owner OR assigned driver.
      This unifies individuals (also carriers) and companies. Drop separate DRIVER signup.
- [x] **UI polish:** background imagery + mission content (farm/logistics feel).
- [x] **Industry Marketplace** (Sahil) — see [[Industry Marketplace]]. ~153 vendors, real
      catalog + photos, FBN-style UI, order → auto delivery job, combined bill; removed the
      farmer's manual job portal.

## Done — marketplace v3, nationwide storefront (2026-07-08) ✅
Rebuilt the [[Industry Marketplace]] to launch quality (compile-verified, pending local test + push).
- [x] **Fixed Michigan→CA bug** — `GeocodeService` fallback only knew CA ZIPs; new `us-zip.ts`
      resolves every US ZIP to the right state. Nominatim now has a timeout.
- [x] **3 industries in every state (150 total)**, all 50 states verified.
- [x] **Real 30-product catalog** with real brands + ratings/reviews/descriptions.
- [x] **Never-broken product imagery** via in-app SVG art (`productArt.tsx`).
- [x] **Real-world storefront UI** — hero+search, categories, sort, rich cards, sticky cart,
      skeletons, empty states, responsive.
- [x] **Render seed on deploy** so the live DB gets the new catalog.

## Open ideas (from Sahil, for later)
- The Transport-Company driver model ("has ideas back of mind") — revisit separate driver
  accounts / assignment vs company-self-execute.
- Real supplier product feed to replace dummy catalog; industry self-onboarding + catalog mgmt.
- Pay the industry for goods (escrow across items + transport).

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
