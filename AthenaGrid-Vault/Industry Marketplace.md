---
tags: [athenagrid, marketplace, feature]
---

# Industry Marketplace

Farmers buy farming essentials (seeds, pesticides, fertilizer, tools) from onboarded
industries; checkout auto-posts a transport job. **Sahil's build** (like [[Transport System]]).
Added 2026-07-07. Code: `apps/api/src/marketplace/`, `apps/web/app/marketplace/page.tsx`.

## Flow
1. **Farmer only** opens the Marketplace (nav link shows for FARMER shippers).
2. Sees **nearby industries** ranked by distance from the farmer's location, with catalogs + prices.
3. Adds items from **one** industry to a cart (one order = one pickup location), checks out.
4. Checkout creates an **Order** and auto-posts a **transport Job** (pickup = industry,
   dropoff = farmer, shipper = farmer). Drivers bid on it as normal.
5. Farmer **awards** the transport job on their Farmer dashboard.
6. **Combined bill** = items + 5% marketplace fee + transport (winning bid + 4% shipper fee).
   Driver payout = bid − 8% (unchanged). Platform = marketplace fee + transport 12%.

## Decisions (2026-07-07)
- Geography: **USA / ZIP codes**. Dummy industries in CA cities (Fresno, Salinas, Bakersfield).
- Location: **auto-geocode** the farmer's ZIP via OpenStreetMap Nominatim, **fallback** to a
  seeded region table (`GeocodeService`). Farmer address+ZIP captured at signup.
- Fee: **5% marketplace fee on goods** (`MARKETPLACE_FEE_RATE`, added to farmer bill) PLUS the
  existing 8%/4% transport split. See [[Pricing and Commission]].

## Data model (added)
`Industry` (name, city, lat/lng, catalog) · `CatalogItem` (category, unit, pricePerUnit,
weightKgPerUnit, icon) · `Order` (farmer, industry, itemsTotal, marketplaceFee, jobId) ·
`OrderItem`. `User` gained address/postalCode/lat/lng. `Job` gained a back-relation `order`.
See [[Data Model]].

## API (farmer-guarded)
`GET /marketplace/industries` (nearby + catalog) · `POST /marketplace/orders` (→ order + job) ·
`GET /marketplace/orders` (with combined bill).

## Deferred / later
Industry-facing catalog management (real vendors self-onboard), multi-industry carts, order
cancellation, paying the industry for goods (escrow), Sahil "has ideas" for company-driver model.

Related: [[Transport System]] · [[Roadmap]]
