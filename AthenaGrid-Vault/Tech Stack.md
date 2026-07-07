---
tags: [athenagrid, transport, stack]
---

# Tech Stack

TypeScript everywhere. Monorepo at `transport-system/` (npm workspaces).

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript** | shared types across web + api |
| Web | **Next.js 14** (App Router) | all pages client-rendered; **static export** for Netlify |
| API | **NestJS 10** | modular DI, WebSocket gateway |
| ORM | **Prisma 5** | `apps/api/prisma/schema.prisma` |
| DB | **Postgres** (+PostGIS in prod) | Aurora target; Render Postgres in test; embedded-postgres locally |
| Realtime | **Socket.IO** | Redis adapter optional (multi-node) |
| Cache/bus | **Redis** (ioredis) | optional; ElastiCache target |
| Object store | **S3** | verification docs; stubbed locally (`STORAGE_DRIVER`) |
| Auth | **JWT** (access+refresh) | passwords via **node:crypto scrypt** (not bcrypt) |
| Shared pkg | `@athenagrid/shared` | built to `dist`, consumed by api & web |

## Key packages
- `apps/api`: @nestjs/*, @prisma/client, socket.io, ioredis, class-validator, @aws-sdk/client-s3
- `apps/web`: next, react, socket.io-client
- root devDep: `embedded-postgres` (local one-command DB only — see [[Local Development]])

## Notable configs
- API `tsconfig`: `rootDir: ./src`, `incremental: false`, excludes `**/*.spec.ts` from build.
- `@athenagrid/shared` consumed as a **built package** (main=dist), not source — see [[Gotchas and Fixes]].

Related: [[Architecture]] · [[Local Development]]
