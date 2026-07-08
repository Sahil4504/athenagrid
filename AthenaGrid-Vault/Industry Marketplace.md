---
tags: [athenagrid, marketplace, feature]
---

# Industry Marketplace

Farmers buy farming essentials (seeds, pesticides, fertilizer, tools) from onboarded
industries; checkout auto-posts a transport job. **Sahil's build** (like [[Transport System]]).
Added 2026-07-07. Code: `apps/api/src/marketplace/`, `apps/web/app/marketplace/page.tsx`.

## Flow
1. **Farmer only** opens the Marketplace (nav link shows for FARMER shippers).
2. Sees a **product grid** from the **6 nearest vendors**, with **category filter chips**
   (Seed / Crop protection / Crop nutrition / Equipment), **search**, real product photos,
   brand, price/unit, and vendor + distance on each card.
3. Adds items from **one** vendor to a cart (one order = one pickup location), checks out.
4. Checkout creates an **Order** and auto-posts a **transport Job** (pickup = industry,
   dropoff = farmer, shipper = farmer). Drivers bid on it as normal.
5. Farmer **awards** the transport job on their Farmer dashboard (the only thing that
   dashboard does now — the manual "post a job" form was removed; jobs come from orders).
6. **Combined bill** = items + 5% marketplace fee + transport (winning bid + 4% shipper fee).
   Driver payout = bid − 8% (unchanged). Platform = marketplace fee + transport 12%.

## v3 — nationwide + real-world storefront (2026-07-08, Sahil)
Rebuilt so it feels like a launch-ready "Amazon of farm inputs".
- **Fixed the Michigan→CA bug.** Root cause was `GeocodeService.fallback`: it only knew 5
  **California** ZIPs, so any farmer whose Nominatim lookup failed/timed out was dropped into
  Fresno. New self-contained `apps/api/src/geo/us-zip.ts` maps every US ZIP prefix → correct
  state centroid (`zipToLatLng`); Nominatim is still primary but now has a 3.5s timeout.
  A Michigan ZIP now resolves to Michigan.
- **3 industries in every state (150 total).** `US_CITIES` trimmed to exactly 3 per state, all
  50 covered (verified). Seed's refresh logic now rebuilds when the set is stale (count ≠ 150 or
  <50 distinct states) and no orders reference it.
- **Real, richer catalog (30 products).** Real brands (DEKALB, Pioneer, Asgrow, WestBred, Bayer,
  Corteva, BASF, Syngenta, Nutrien, Mosaic, Yara, Chapin, Fimco, Rain Bird, Fiskars…), real
  specs/units/prices, plus **rating + reviews + description** (new `CatalogItem` columns:
  `imageKey`, `description`, `rating`, `reviews`). Nearby vendors bumped 6→10.
- **Product imagery** = in-app SVG illustrations keyed by `imageKey` (`apps/web/lib/productArt.tsx`),
  never-broken and consistent (a real photo `imageUrl` still overrides if ever set). Chose this
  over scraped retailer photos because hotlink/CORS-protected images break in production — the
  opposite of launch-ready. Sandbox has no outbound network to verify external URLs anyway.
- **Storefront UI** (`apps/web/app/marketplace/page.tsx` + `globals.css`): gradient hero with
  big search, category chips, sort (nearest/price/rating), rich product cards (image, brand,
  stars, blurb, vendor+distance, price, qty stepper), **sticky cart** with thumbnails + subtotal,
  skeleton loaders, empty states, responsive (cart stacks under grid < 900px).
- **Deploy:** Render `startCommand` now runs the idempotent seed after `db push` so a redeploy
  populates the live DB with the new 150-vendor catalog (was previously push-only). Schema
  changed → `db push` needed (auto on Render start / local `dev.mjs`). Local with old test
  orders → delete `.devdata` to force the vendor refresh.

## Scale of dummy data (v2, 2026-07-07 — superseded by v3 above)
- **~153 vendors** across US states (3–4 per state), generated in `prisma/seed-data.ts`
  (`US_CITIES` + `INDUSTRY_SUFFIXES`). Each stocks ~12 items with ±12% price variation.
- **Catalog** (`PRODUCTS`) ≈ 23 realistic items with real brands (DEKALB, Pioneer, Bayer,
  BASF, Syngenta, FBN…), units and prices, modelled on FBN's categories.
- **Images**: `loremflickr.com` keyword URLs on `CatalogItem.imageUrl`, with a UI fallback
  to a category emoji tile if an image fails (`ProductImg` component).
- No public farm-input API exists (FBN doesn't expose one) → realistic dummy data instead,
  structured so a real supplier feed can slot in later.
- Seed **auto-refreshes** stale dummy vendors: if industry count is outdated AND no orders
  reference them, it wipes + reseeds. (Local with test orders → delete `.devdata` to reset.)

## Decisions (2026-07-07)
- Geography: **USA / ZIP codes**. Dummy industries in CA cities (Fresno, Salinas, Bakersfield).
- Location: **auto-geocode** the farmer's ZIP via OpenStreetMap Nominatim, **fallback** to a
  seeded region table (`GeocodeService`). Farmer address+ZIP captured at signup.
- Fee: **5% marketplace fee on goods** (`MARKETPLACE_FEE_RATE`, added to farmer bill) PLUS the
  existing 8%/4% transport split. See [[Pricing and Commission]].

## Data model (added)
`Industry` (name, city, state, lat/lng, catalog) · `CatalogItem` (name, **brand**, category,
unit, pricePerUnit, weightKgPerUnit, **imageUrl**) · `Order` (farmer, industry, itemsTotal,
marketplaceFee, jobId, status) · `OrderItem`. `User` gained address/postalCode/lat/lng.
`Job` gained a back-relation `order`. See [[Data Model]].

## API (farmer-guarded)
`GET /marketplace/industries` (nearby + catalog) · `POST /marketplace/orders` (→ order + job) ·
`GET /marketplace/orders` (with combined bill).

## Deferred / later
Industry-facing catalog management (real vendors self-onboard), multi-industry carts, order
cancellation, paying the industry for goods (escrow), Sahil "has ideas" for company-driver model.

Related: [[Transport System]] · [[Roadmap]]
