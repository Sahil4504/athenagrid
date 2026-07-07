---
tags: [athenagrid, transport, data]
---

# Data Model

Prisma schema: `transport-system/apps/api/prisma/schema.prisma`. Postgres.

## Entities
- **User** — role: `SHIPPER | CARRIER | DRIVER | ADMIN`; email, passwordHash (scrypt), fullName.
- **CarrierProfile** (1:1 with a CARRIER user) — companyName, **type: `COMPANY | INDIVIDUAL`**,
  verificationStatus, → Vehicles, DriverProfiles, VerificationDocuments, Bids.
- **DriverProfile** — licenceNo, carrierId, verificationStatus, → Trips. (An individual has
  both a CarrierProfile and a DriverProfile on the same user.)
- **Vehicle** — plate, capacityKg, volumeM3, refrigerated.
- **VerificationDocument** — type, s3Key, review status.
- **Job** — shipper, status, pickup/dropoff (lat/lng + address), cargo (crop, weightKg,
  volumeM3, perishabilityIndex, coldChainRequired), windows, budgetCeiling,
  **referencePrice/floorPrice/ceilingPrice** (from [[Pricing and Commission]]), awardedBidId.
- **Bid** — jobId, carrierId, vehicleId, amount, etaMinutes, status. Unique `(jobId, carrierId)`
  → one bid per carrier per job.
- **Trip** — jobId (1:1), driverId, vehicleId, status, currentLat/Lng, → TripEvents (append-only).
- **TripEvent** — status change or GPS ping (the live-tracking history).
- **Settlement** — created at award: transportPrice, commission/fee rates & amounts,
  farmerTotal, driverPayout, platformRevenue. See [[Pricing and Commission]].
- **AuditLog** — append-only (verification decisions, awards).

## State machines
```
Job:  DRAFT → OPEN → AWARDED → IN_TRANSIT → DELIVERED → CLOSED
                     └ EXPIRED · CANCELLED
Trip: ASSIGNED → EN_ROUTE_TO_PICKUP → AT_PICKUP → LOADED → IN_TRANSIT → AT_DROPOFF → DELIVERED
```
Transitions enforced server-side (`TRIP_TRANSITIONS` in `packages/shared`).

Related: [[Architecture]] · [[Bidding Engine]]
