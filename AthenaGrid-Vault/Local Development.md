---
tags: [athenagrid, transport, dev, ops]
---

# Local Development

Environment: **Windows**, **Node v24** (LTS 20+ fine), **no Docker**.

## One command
```powershell
cd D:\Startup\AthenaGrid\transport-system
copy .env.example .env   # first time
npm install
npm run dev
```
`scripts/dev.mjs` boots a **self-contained embedded Postgres** (downloads a binary on first
run, stored in `.devdata/`), builds the shared package, runs `prisma db push` + seed, then
starts the API on **:4000** and the web app on **:3000** together. Ctrl+C stops everything.

Open http://localhost:3000. Logins: see [[Accounts and Testing]].

## Graceful degradation (why no Docker/Redis/S3/PostGIS needed locally)
- No Redis → in-memory WebSocket adapter.
- No S3 → verification storage stubbed (`STORAGE_DRIVER` unset).
- No PostGIS → geo radius uses JS Haversine fallback.

## Front-end only (for UI work, no backend)
Set `NEXT_PUBLIC_DEMO=true` in `.env`, run `npm run dev:web` — pages render with in-memory
demo data.

## Editing after deploy
Change code → `git add . && git commit && git push` → Netlify + Render auto-redeploy. See
[[Deployment]]. Your PC does **not** need to stay on for the live site.

Related: [[Gotchas and Fixes]] · [[Tech Stack]]
