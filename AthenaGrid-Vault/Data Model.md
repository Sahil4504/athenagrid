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

## Roles + marketplace additions (2026-07-07)
- **User** gained: `shipperType` (`FARMER | INDUSTRY`) and location `address / postalCode /
  lat / lng` (farmers, for [[Industry Marketplace]] proximity). Also `orders`.
- **CarrierProfile** gained `type` (`COMPANY | INDIVIDUAL`) — see [[Bidding Engine]].
- **Industry** — dummy vendor: name, city, state, lat/lng, → `catalog`.
- **CatalogItem** — industryId, name, **brand**, `category` (`SEEDS | PESTICIDES | FERTILIZER
  | TOOLS`), unit, pricePerUnit, weightKgPerUnit, **imageUrl**.
- **Order** — farmerId, industryId, `status`, itemsTotal, marketplaceFee, `jobId` (the
  auto-posted transport [[Data Model#Entities|Job]]). → `items` (**OrderItem**: name, qty,
  unitPrice, lineTotal).
- **Job** gained pricing fields (referencePrice/floorPrice/ceilingPrice — [[Pricing and Commission]])
  and a back-relation `order`.

## State machines
```
Job:  DRAFT → OPEN → AWARDED → IN_TRANSIT → DELIVERED → CLOSED
                     └ EXPIRED · CANCELLED
Trip: ASSIGNED → EN_ROUTE_TO_PICKUP → AT_PICKUP → LOADED → IN_TRANSIT → AT_DROPOFF → DELIVERED
```
Transitions enforced server-side (`TRIP_TRANSITIONS` in `packages/shared`).

Related: [[Architecture]] · [[Bidding Engine]]
