# AthenaGrid — Transportation System Architecture

> **Owner:** Transport / Logistics squad
> **Status:** MVP v0.1 (this document + runnable scaffold)
> **Scope of this module:** the transport marketplace — job posting, carrier verification, real-time bidding, and live delivery tracking. It sits downstream of the Farmer/Industry modules and consumes the `SalesDistribution` output of the ML `YieldSegmenter` / `LogisticsTransportationOptimizer` (Model 6 & 7).

---

## 1. Product summary

AthenaGrid connects US farmers with industries, restaurants and local shops. The **transport layer** is the connective tissue and the primary USP: whenever goods must move (farmer → industry, industry → farmer, farmer → restaurant), one side posts a **job**, verified **carriers bid** for it, the best bid wins, and the delivery is **tracked live** to completion.

Three responsibilities own this module:

1. **Job marketplace** — a shipper (farmer / industry / restaurant) posts a transport job with pickup, dropoff, cargo profile (weight, volume, perishability, cold-chain need) and a bidding window.
2. **Carrier verification** — before any carrier/driver can bid, they pass a verification gate (licence, insurance, vehicle registration, cold-chain certification), reviewed and approved by an admin/automated checks. Only `VERIFIED` carriers can bid.
3. **Bidding + live tracking** — verified carriers place competitive bids in real time; the shipper (or an auto-award rule) selects the winning bid; the assigned trip is then tracked live (driver location, state transitions) until delivered.

---

## 2. Core design principles

- **Single language, two apps.** TypeScript everywhere (Next.js web + NestJS API + shared types package) so the UI team and backend share DTOs and never drift.
- **Stateless API, state in managed services.** The API nodes hold no session state; everything durable lives in Postgres, everything ephemeral/real-time in Redis. This is what lets us scale horizontally behind a load balancer.
- **Transactional integrity where money-adjacent.** Bidding and awarding are transactional (Postgres `SERIALIZABLE`/row locks) so two carriers can never win the same job and a closed auction can never accept a late bid.
- **Geo-native.** Radius queries ("carriers/industries within N km") use PostGIS `geography` columns and GiST indexes, not app-side haversine loops.
- **Event-driven real-time.** Bids and location pings flow over WebSockets, fanned out through a Redis pub/sub adapter so any API node can push to any connected client.
- **Cloud-portable, AWS-native.** Nothing is locked to a proprietary API; every managed dependency maps to a standard AWS service (below) but can run in Docker locally unchanged.

---

## 3. Technology choices (and why)

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Shared types across UI + API; large hiring pool; compile-time safety for a fast-moving team. |
| API framework | **NestJS** | Opinionated modules/DI scale cleanly as the team grows; first-class WebSocket, validation, guards, testing. |
| Web framework | **Next.js (App Router)** | SSR/ISR, file-based routing, easy for the UI team; can host shipper + carrier + admin surfaces. |
| ORM | **Prisma** | Type-safe schema → generated client shared with the API; painless migrations. |
| Primary DB | **Postgres + PostGIS** | ACID for the auction; PostGIS for radius/route geo. → **AWS Aurora Postgres**. |
| Cache / real-time bus | **Redis** | Bid-window timers, presence, WebSocket pub/sub, hot reads. → **AWS ElastiCache**. |
| Object storage | **S3** | Verification documents (licence, insurance PDFs/images), signed-URL uploads. |
| Auth | **JWT (access + refresh)** | Stateless, role-based (SHIPPER / CARRIER / DRIVER / ADMIN). Swap-in Cognito later without app changes. |

### Why the database is Postgres (given "maybe AWS")
The bidding engine is an auction: correctness under concurrency is non-negotiable (no double-awards, no late bids). That's a textbook relational/transactional workload, so a document store like DynamoDB/Mongo would force us to hand-roll consistency. Postgres also gives us PostGIS for the geo radius features "for free." On AWS this is **Amazon Aurora PostgreSQL** (Postgres-compatible, auto-scaling storage, read replicas) with the PostGIS extension enabled — same code locally (Docker `postgis/postgis`) and in prod.

---

## 4. System architecture (logical)

```
                         ┌──────────────────────────────────────────────┐
                         │                  Clients                      │
                         │  Shipper web · Carrier web · Driver PWA · Admin│
                         └───────────────┬───────────────┬──────────────┘
                                   HTTPS │        WSS     │
                                         ▼                ▼
                         ┌──────────────────────────────────────────────┐
                         │      CloudFront (CDN)  +  ALB (Load Balancer) │
                         └───────────────┬──────────────────────────────┘
                                         ▼
          ┌──────────────────────────────────────────────────────────────────┐
          │                    NestJS API (stateless, N replicas)             │
          │                                                                    │
          │  Auth ─ Users ─ Verification ─ Jobs ─ Bids ─ Tracking(WS) ─ Geo    │
          │        guards/roles   |          |      |        |                 │
          └──────┬─────────────────┬─────────┬──────┬────────┬─────────────────┘
                 │                 │         │      │        │
       ┌─────────▼───┐   ┌─────────▼──┐  ┌───▼──────▼───┐ ┌──▼───────────┐
       │  Aurora PG  │   │     S3     │  │    Redis     │ │  SNS/SES/SQS │
       │  + PostGIS  │   │  (docs)    │  │ pub/sub+cache│ │ notifications│
       └─────────────┘   └────────────┘  └──────────────┘ └──────────────┘
```

- **API replicas are identical and stateless.** Any node can serve any request; WebSocket fan-out works across nodes because Socket.IO uses the **Redis adapter**.
- **Bid-window closing** is driven by Redis-backed scheduled jobs (BullMQ) so a job's auction closes exactly on time regardless of which node created it.
- **Notifications** (bid received, you won, driver en route) go through a queue (SQS) to workers that dispatch email/SMS/push (SES/SNS) — decoupled so a slow provider never blocks the request path.

---

## 5. Data model (core entities)

```
User (id, role[SHIPPER|CARRIER|DRIVER|ADMIN], email, phone, passwordHash, ...)
  ├─ CarrierProfile (1:1 for CARRIER) — companyName, fleetSize, verificationStatus
  │     └─ VerificationDocument (1:N) — type, s3Key, status, reviewedBy
  │     └─ Vehicle (1:N) — plate, capacityKg, volumeM3, refrigerated
  └─ DriverProfile (1:1 for DRIVER) — licenceNo, carrierId, verificationStatus

Job (id, shipperId, status, pickup(geo), dropoff(geo), cargo{weightKg, volumeM3,
     cropType, perishabilityIndex, coldChainRequired}, pickupWindow, biddingClosesAt,
     budgetCeiling?, awardedBidId?)
  └─ Bid (1:N) — carrierId, amount, etaMinutes, vehicleId, message, status
  └─ Trip (0:1) — awarded bid → assigned driver/vehicle, status, currentLocation(geo)
        └─ TripEvent (1:N) — status changes + location pings (append-only)

AuditLog (append-only, who/what/when for verification + awards)
```

Key rules encoded in the schema/services:
- A `Bid` can only be created when `Job.status = OPEN` **and** `now < biddingClosesAt` **and** the carrier's `verificationStatus = VERIFIED`.
- Awarding a bid flips `Job.status = AWARDED`, creates a `Trip`, and rejects all other bids **in one transaction**.
- `TripEvent` is append-only — the live location history and state machine come from replaying events.

### Job / Trip state machine
```
Job:   DRAFT → OPEN → (BIDDING) → AWARDED → IN_TRANSIT → DELIVERED → CLOSED
                         │
                         └── EXPIRED (no bids / window elapsed)  ·  CANCELLED
Trip:  ASSIGNED → EN_ROUTE_TO_PICKUP → AT_PICKUP → LOADED → IN_TRANSIT
                                                        → AT_DROPOFF → DELIVERED
```

---

## 6. API surface (v1)

REST for CRUD + commands, WebSocket for real-time. All under `/api/v1`.

```
Auth
  POST   /auth/register            {role, email, password, ...}
  POST   /auth/login               → {accessToken, refreshToken}
  POST   /auth/refresh

Verification (CARRIER onboarding gate)
  POST   /verification/documents           request S3 upload URL + register doc
  GET    /verification/me                   my verification status
  GET    /admin/verification/queue          (ADMIN) pending reviews
  POST   /admin/verification/:id/decision   (ADMIN) approve/reject

Jobs (SHIPPER)
  POST   /jobs                     create + open a transport job
  GET    /jobs                     list/search (filters: status, near, coldChain)
  GET    /jobs/:id
  POST   /jobs/:id/close           stop accepting bids early
  POST   /jobs/:id/award           {bidId} award manually
  POST   /jobs/:id/cancel

Bids (CARRIER)
  GET    /jobs/:id/bids            bids on a job (shipper sees all; carrier sees own)
  POST   /jobs/:id/bids            place a bid   (guarded: VERIFIED + window open)
  DELETE /bids/:id                 withdraw own bid (before award)

Trips / Tracking
  GET    /trips/:id
  POST   /trips/:id/status         {status} driver advances the state machine
  POST   /trips/:id/location       {lat,lng} location ping (also via WS)

WebSocket (namespace /realtime, JWT-authed)
  join   job:{id}                  live bid feed for a job
  join   trip:{id}                 live location/status for a trip
  emit   bid:new · bid:awarded · trip:location · trip:status
```

---

## 7. Key flows

**Bidding (concurrent-safe auction).** Carrier posts a bid → `BidsService` opens a Postgres transaction, re-reads the job `FOR UPDATE`, asserts `OPEN` + window open + carrier `VERIFIED`, inserts the bid, commits, then publishes `bid:new` to `job:{id}` over Redis so every watcher (and the shipper) sees it instantly. A BullMQ delayed job fires at `biddingClosesAt` to auto-close and (optionally) auto-award the lowest compliant bid.

**Verification gate.** Carrier requests a signed S3 URL, uploads licence/insurance/registration directly to S3, registers the doc. Admin queue surfaces pending docs; on approval the profile flips to `VERIFIED` and an `AuditLog` row is written. The bid guard reads this status — unverified carriers are rejected at the API boundary, never reaching the auction.

**Live tracking.** On award, a `Trip` is created in `ASSIGNED`. The driver PWA advances status (`EN_ROUTE_TO_PICKUP` → … → `DELIVERED`) and streams location pings over WebSocket; each ping is stored as an append-only `TripEvent` and rebroadcast to everyone in `trip:{id}`. Cold-chain jobs (high `perishabilityIndex`) can trigger alerts if ETA slips.

---

## 8. UI architecture

Three role-scoped surfaces in one Next.js app (App Router), sharing one design system and the shared types package:

- **Shipper** (`/shipper`) — post a job (map pickup/dropoff, cargo form), watch bids arrive live, compare and award, track the delivery on a map.
- **Carrier** (`/carrier`) — verification onboarding (upload docs, see status), browse open jobs near me, place/withdraw bids, manage fleet.
- **Driver PWA** (`/driver`) — assigned trips, one-tap status advance, background location streaming.
- **Admin** (`/admin`) — verification review queue, dispute/audit views.

Cross-cutting: a typed `apiClient` (fetch wrapper with token refresh) and a `useRealtime()` hook wrapping the Socket.IO client. All request/response shapes import from `@athenagrid/shared`, so a backend DTO change surfaces as a UI compile error rather than a runtime bug.

---

## 9. Scaling path (to millions)

- **Stateless API + Redis adapter** → scale API horizontally on ECS Fargate/EKS behind an ALB; WebSockets fan out cluster-wide.
- **Aurora read replicas** for read-heavy job browsing; writes (bids/awards) hit the primary and are cheap and short.
- **PostGIS + GiST indexes** keep "jobs/carriers near me" fast at scale; add geohash bucketing / tiling if needle-in-haystack radius search grows.
- **Queues (SQS) + workers** absorb notification and post-delivery processing spikes.
- **Partition hot tables** (`TripEvent`, `AuditLog`) by time; archive cold data to S3/Redshift for analytics.
- **Rate limiting + idempotency keys** on bid/award endpoints protect the auction under load and retries.

---

## 10. What this scaffold ships vs. later

**Ships now:** monorepo, Docker infra (Postgres+PostGIS, Redis), full Prisma data model, JWT auth + role guards, verification module (S3 signed-URL flow), jobs module, transactional bids module, WebSocket tracking gateway with Redis adapter, shared types, Next.js scaffold pages, seed data.

**Deliberately stubbed (next passes):** payments/escrow, ratings, ML route-optimizer integration (Model 7), SMS/push providers, Cognito swap, full admin UI. Interfaces for these exist so they slot in without refactors.
