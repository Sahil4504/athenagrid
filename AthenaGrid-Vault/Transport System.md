---
tags: [athenagrid, transport, module]
---

# Transport System

The transport marketplace — **Sahil's module** and the focus of this vault. Code lives in
`D:\Startup\AthenaGrid\transport-system` (a TypeScript monorepo). See [[Tech Stack]].

## What it does (the core loop)
1. A **shipper** (farmer / industry / restaurant) posts a transport **job** with pickup,
   dropoff, cargo profile (weight, volume, crop, perishability, cold-chain need) and a
   bidding window.
2. **Carriers** (companies) and **individual drivers** place competitive **bids** — but only
   after passing a **verification gate**. See [[Bidding Engine]].
3. The shipper (or an auto rule) **awards** the best bid; a **Trip** is created.
4. The assigned **driver** advances the trip through its stages and streams live GPS; the
   shipper **tracks** it in real time.
5. Money is split via [[Pricing and Commission]]: farmer bill + driver payout + platform take.

## Three modules built (MVP)
- Job posting + **bidding** engine → [[Bidding Engine]]
- Driver/carrier **verification** gate
- Live **tracking** (WebSockets) + trip state machine

## Bidder types
- **Carrier company** — has a fleet, bids, assigns a driver on win.
- **Individual driver** — one person who bids *and* drives (auto-gets a driver profile +
  starter vehicle at signup). Decided in [[Decisions Log]].

## Deliberately deferred
Payments/escrow, ratings, ML route-optimizer integration, Cognito auth, full admin UI,
real S3 verification uploads (stubbed locally). See [[Roadmap]].

## Access (reworked 2026-07-07)
Unified `/login` routes by role; dashboards are role-guarded. Account types: Farmer, Industry,
Transport Company, Individual Driver. Full detail in [[Auth and Roles]]. Farmers also get the
[[Industry Marketplace]]; the manual "post a job" form was removed (jobs now come from orders).

Related: [[Architecture]] · [[Data Model]] · [[Auth and Roles]] · [[Industry Marketplace]]
