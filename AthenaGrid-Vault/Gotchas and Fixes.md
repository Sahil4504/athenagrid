---
tags: [athenagrid, transport, troubleshooting]
---

# Gotchas and Fixes

Problems hit during build/deploy and how they were solved — read before touching these areas.

## Dependencies / packaging
- **bcryptjs broke** (missing `dist/bcrypt.js`) → replaced with **node:crypto scrypt**
  (`apps/api/src/common/password.ts`). No native build needed.
- **Missing transitive deps** (`xtend`, `is-number`) → a corrupted `node_modules` from an
  interrupted install + **Windows Defender** deleting files. Fix: exclude the project folder in
  Windows Security, delete ALL `node_modules` (root + nested `apps/*`), `npm install` fresh.
- **redis vs ioredis** — the WS adapter imported `redis` (not a dep) → switched to **ioredis**.

## Prisma / build
- **PostGIS + Prisma** — the `extensions` block needs a preview flag; instead decoupled PostGIS
  to raw SQL (`prisma/postgis.sql`) and a JS geo fallback.
- **`Cannot find dist/main`** on start — two causes fixed:
  1. `@athenagrid/shared` was consumed as **source**, so tsc nested the output; now consumed as
     a **built package** (shared `main=dist/index.js`, api tsconfig `rootDir: ./src`, no path alias).
  2. TypeScript **`incremental`** cache (`.tsbuildinfo`) skipped emitting after `dist` was
     deleted → set `incremental: false` and clean dist + tsbuildinfo in `dev.mjs`.
- **Render build failed** — `nest build` compiled the `*.spec.ts` test whose `BidsService`
  constructor was outdated. Fix: exclude `**/*.spec.ts` from the build tsconfig + update the test.

## Runtime / deploy
- **`NEXT_PUBLIC_*` only load from `apps/web`**, not the repo root — a page read the raw env and
  broke; route everything through the api-client (has a fallback URL).
- **CORS / binding** — API binds `0.0.0.0`, CORS wildcard OK (Bearer-token auth, no cookies).
- **Netlify published raw repo (4s build)** — **Base directory** wasn't set to `transport-system`,
  so it never ran the build. Setting base directory + redeploy fixed it.

Related: [[Local Development]] · [[Deployment]]
