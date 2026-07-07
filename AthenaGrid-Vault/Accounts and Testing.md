---
tags: [athenagrid, transport, testing]
---

# Accounts and Testing

## Seed accounts (password `password123`, all `@athenagrid.dev`)
Created by `apps/api/prisma/seed.ts` (run locally by `npm run dev`; on Render run
`npm --workspace @athenagrid/api run seed` in the Shell once).

| Email | Role | Notes |
|---|---|---|
| farmer@ | Shipper | Fresno Farm Co; has a seeded cold-chain strawberry job |
| carrier@ | Carrier (company) | ColdHaul Logistics; refrigerated + dry vehicles |
| carrier2@ | Carrier (company) | ValleyFreight Inc; refrigerated vehicle |
| indie@ | **Individual** | Ravi — bids AND drives (own vehicle + driver profile) |
| driver@ | Driver | Danny — employed by carrier@ |
| driver2@ | Driver | Val — employed by carrier2@ |
| admin@ | Admin | Ops |

On the **live site**, friends create their own accounts at `/signup` (auto-verified via
`AUTO_VERIFY_CARRIERS=true`).

## End-to-end smoke test (multiple bids)
1. **Shipper** tab: sign in `farmer@`, post a job (gets a fair-price range).
2. **Carrier** tabs: `carrier@`, `carrier2@`, `indie@` → open the job, bid different amounts
   (try one below the floor to see it flagged out-of-range).
3. **Shipper**: watch bids stream in live, ranked, ⭐ Recommended shown, with the "you'd pay /
   carrier nets" split. **Award** one.
4. **Bills**: shipper sees 🧾 invoice; the winning **driver** (driver@/driver2@/indie@) sees
   💰 payout, advances the trip, sends location.
5. **Shipper**: watch the trip stepper + coordinates update live.

Unit test: `apps/api/src/bids/bids.service.spec.ts` (verification-gate). Run `npm test` in `apps/api`.

Related: [[Bidding Engine]] · [[Deployment]]
