---
tags: [athenagrid, transport, architecture]
---

# Architecture

Full design doc lives in the repo at `transport-system/docs/ARCHITECTURE.md`. Summary:

## Shape
- **Monorepo** (npm workspaces): `apps/api` (NestJS), `apps/web` (Next.js), `packages/shared`
  (enums, DTOs, realtime + money contracts imported by both).
- **Stateless API** behind a load balancer; durable state in Postgres, ephemeral/real-time in
  Redis. Horizontal scale = add API replicas.

## Request + realtime flow
- REST for CRUD/commands (`/api/v1/...`), **WebSocket** namespace `/realtime` for live bid
  feed + trip location/status.
- WebSockets fan out across API nodes via a **Redis adapter** (optional; single node uses an
  in-memory adapter — see [[Gotchas and Fixes]]).

## Modules (NestJS)
`auth` · `users` · `verification` · `jobs` · `bids` · `tracking` (WS gateway) · `geo` ·
`pricing`. Guards: JWT + role-based; trip actions are **ownership-based** (assigned driver).

## Geo
Radius search uses **PostGIS** in production; falls back to app-side Haversine when PostGIS
isn't present (so it runs on any plain Postgres). See [[Gotchas and Fixes]].

## AWS target (production)
Aurora Postgres + PostGIS · ElastiCache Redis · S3 (verification docs) · ECS/EKS behind ALB ·
SQS/SES for notifications. Currently deployed cheaper on [[Deployment|Netlify + Render]] for testing.

Related: [[Data Model]] · [[Bidding Engine]] · [[Tech Stack]]
