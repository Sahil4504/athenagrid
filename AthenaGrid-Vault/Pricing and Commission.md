---
tags: [athenagrid, transport, pricing, money]
---

# Pricing and Commission

Makes bids fair to both sides and defines the platform's cut. Code:
`apps/api/src/pricing/pricing.service.ts`; pure money math in `packages/shared` (`computeSettlement`).

## Fair-price band (per job, computed at creation)
```
reference = base + ratePerKm·distanceKm + ratePerTonneKm·(weightKg/1000)·distanceKm
            ×(1 + coldChainSurcharge) ×(1 + 0.1·perishabilityIndex)
floor   = reference × 0.8     (min sustainable — protects the driver)
ceiling = reference × 1.25    (max fair — protects the farmer)
```
Stored on the Job. Carriers see the **suggested range**; the bid box pre-fills with `reference`.
Future: replace the formula with the ML `minimizedLogisticsCost` from [[ML Models]] (Model 7).

## Bid scoring
Each bid scored 0–1: peaks in the lower-middle of the band, penalized **below floor**
(flake risk) and **above ceiling** (unfair to farmer). Best in-band bid → **⭐ Recommended**
badge in the shipper's feed. Rules-based now; ML later once there's data. See [[Roadmap]].

## Commission (12% total, split — decided in [[Decisions Log]])
- **Carrier commission:** 8% (env `CARRIER_COMMISSION_RATE=0.08`)
- **Shipper service fee:** 4% (env `SHIPPER_FEE_RATE=0.04`)

`computeSettlement(bid)` →
```
farmerTotal    = bid + bid·4%    (what the farmer pays)
driverPayout   = bid − bid·8%    (what the carrier/driver nets)
platformRevenue= 12% of bid
```
Worked example, bid $620 → farmer pays **$644.80**, carrier nets **$558**, platform **$86.80**.

## Where it shows
- Shipper: **🧾 invoice** (transport + service fee = total) on award.
- Driver: **💰 payout** (bid − commission) on the trip.
A `Settlement` row is created in the award transaction ([[Bidding Engine]]).

Related: [[Data Model]] · [[Transport System]]
