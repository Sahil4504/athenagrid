---
tags: [athenagrid, reference]
---

# Glossary

- **Shipper** — the party posting a transport job (farmer, industry, restaurant, shop).
- **Carrier** — a bidder. A **company** (fleet) or an **individual** (owner-operator). See [[Bidding Engine]].
- **Driver** — executes an awarded trip. For an individual carrier, the same person.
- **Job** — a transport request (pickup, dropoff, cargo, windows). Status flows in [[Data Model]].
- **Bid** — a carrier's offer (amount + ETA + vehicle). One per carrier per job.
- **Trip** — the awarded job in motion; has a state machine + append-only events.
- **Fair-price band** — reference / floor / ceiling computed per job → [[Pricing and Commission]].
- **Settlement** — the money split at award: farmerTotal, driverPayout, platformRevenue.
- **Cold-chain** — refrigerated transport required for perishable cargo (high perishabilityIndex).
- **Verification gate** — carriers must be VERIFIED to bid (auto-verified on the test deploy).
- **MOC** — Map of Content (Obsidian): an index note, e.g. [[Home]].

Related: [[Home]]
