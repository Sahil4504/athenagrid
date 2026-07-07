# AthenaGrid — Transport System

The transport marketplace for AthenaGrid: shippers post jobs, **verified** carriers bid in
real time, the best bid is awarded, and the delivery is tracked live to completion.

- **Architecture & rationale:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Stack:** TypeScript everywhere — Next.js (web) · NestJS (api) · Prisma · Postgres+PostGIS · Redis · S3.

## Repo layout

```
transport-system/
├── docs/ARCHITECTURE.md      # system design, AWS topology, data model, flows, scaling
├── docker-compose.yml        # local Postgres+PostGIS, Redis, MinIO (S3)
├── packages/shared/          # enums + DTOs + realtime contracts (imported by api & web)
└── apps/
    ├── api/                  # NestJS: auth, users, verification, jobs, bids, tracking, geo
    │   ├── prisma/           # schema.prisma, postgis.sql, seed.ts
    │   └── src/…
    └── web/                  # Next.js scaffold: shipper / carrier surfaces (UI team extends)
```

## Quick start — one command, no Docker (recommended)

Only prerequisite: **Node 20+**. This boots a self-contained local Postgres
(downloaded automatically on first run, no install), applies the schema, seeds demo
data, and starts the API (:4000) and web app (:3000) together.

```bash
cp .env.example .env      # (Windows PowerShell: copy .env.example .env)
npm install
npm run dev
```

Open http://localhost:3000. Seeded logins (password `password123`):
`farmer@`, `carrier@`, `admin@athenagrid.dev`.

No Redis, S3, or PostGIS is required locally — the app degrades gracefully (in-memory
WebSocket adapter, stubbed verification storage, JS distance search). Those services
are used in production; see "Deploying on AWS" below.

### Front-end only (no backend at all)

For the UI team to build screens immediately, set `NEXT_PUBLIC_DEMO=true` in `.env`
and run just `npm run dev:web` — the app renders with in-memory demo data.

### Alternative: run with Docker (matches production closest)

```bash
cp .env.example .env
npm install
npm run infra:up                                       # Postgres+PostGIS, Redis, MinIO
npm run db:migrate                                     # apply Prisma schema
psql "$DATABASE_URL" -f apps/api/prisma/postgis.sql    # geo columns + GiST index
npm run db:seed
npm run dev:api    # :4000
npm run dev:web    # :3000
```

### Alternative: hosted Postgres (Neon/Supabase, no local DB)

Create a free Postgres, run `CREATE EXTENSION postgis;`, put its URL in `DATABASE_URL`,
then `npm run db:migrate && npm run db:seed && npm run dev:api` + `npm run dev:web`.

## Core flows to try

1. **Post a job** — sign in as the farmer (web `/shipper`) — a seeded open cold-chain job exists.
2. **Bid** — sign in as the carrier (web `/carrier`); they're pre-VERIFIED with a refrigerated truck, so bidding is allowed. Unverified carriers are blocked at the API.
3. **Watch it live** — the shipper's bid panel updates over WebSocket the moment a bid lands.
4. **Award** — shipper awards a bid → a `Trip` is created transactionally, other bids rejected.
5. **Track** — driver advances trip status / streams location; everyone in the trip room sees it.

## Key API endpoints

`POST /auth/login` · `POST /jobs` · `GET /jobs?nearLat=&nearLng=&radiusKm=` ·
`POST /jobs/:id/bids` · `POST /jobs/:id/award` · `POST /trips/:id/status` ·
`POST /verification/documents` · `POST /admin/verification/:id/decision`
WebSocket namespace `/realtime` — `join:job`, `join:trip`, `trip:ping`.

## Tests

```bash
npm run test --workspace @athenagrid/api   # auction verification-gate unit tests
```

## Deploying on AWS (target)

| Local (compose) | AWS |
|---|---|
| postgis container | Aurora PostgreSQL + PostGIS |
| redis container | ElastiCache for Redis |
| minio container | S3 |
| `dev:api` | ECS Fargate / EKS behind ALB (N replicas) |
| `dev:web` | Amplify / ECS / Vercel |

API nodes are stateless and WebSockets fan out via the Redis adapter, so scaling out is
adding replicas behind the load balancer. See `docs/ARCHITECTURE.md` §9.

## Not in this pass (interfaces exist)

Payments/escrow, ratings, ML route-optimizer (Model 7) integration, SMS/push, Cognito swap,
full admin & driver UIs.
