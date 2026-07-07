---
tags: [athenagrid, transport, decisions]
---

# Decisions Log

Key choices and the reasoning behind them.

- **TypeScript full-stack (Next.js + NestJS + Prisma)** — one language across UI + API, shared
  types, easy for the UI team. *(2026-07-06)*
- **Postgres (+PostGIS), Redis, S3** as the data layer — the auction needs ACID/transactional
  integrity; PostGIS for geo. AWS-native (Aurora/ElastiCache/S3) but portable. User was
  undecided on DB but leaning AWS.
- **Both companies AND individuals can bid** — an individual registers as an INDIVIDUAL carrier
  and gets a driver profile + starter vehicle, so they bid and drive as one person. Trip actions
  are ownership-based (not role-gated) to support this. See [[Bidding Engine]].
- **Bids come from carriers, drivers execute** — bidding is at the carrier level; the winning
  carrier's driver runs the trip (the individual is their own driver).
- **Don't pick the cheapest bid — use a fair-price band + scoring** — protects driver (floor)
  and farmer (ceiling); best in-band bid is Recommended. Rules-based now, ML later. See
  [[Pricing and Commission]].
- **Commission 12% total, split 8% carrier + 4% shipper** — diversified, both sides contribute;
  configurable via env. *(User chose this on 2026-07-07.)*
- **Deploy on Netlify (frontend) + Render (backend + Postgres)** — teammate's suggestion; free,
  simple, good for friends-testing. Frontend as **static export** since all pages are client-side.
- **Auto-verify carriers on the test deployment** (`AUTO_VERIFY_CARRIERS=true`) — otherwise
  friends sign up and can't bid; turn off for a real launch.

Related: [[Roadmap]] · [[Gotchas and Fixes]]
