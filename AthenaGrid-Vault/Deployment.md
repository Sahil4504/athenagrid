---
tags: [athenagrid, transport, deploy, ops]
---

# Deployment

Live test deployment (free tiers). Full guide in repo: `transport-system/DEPLOY.md`.

## Live URLs
- **Frontend (share this):** https://inspiring-lamington-ff8395.netlify.app
- **Backend API:** https://athenagrid-api.onrender.com  (health: `/api/v1/health`)
- **Repo:** github.com/Sahil4504/athenagrid — root `AthenaGrid/`, app in `transport-system/`, branch `main`.

## Frontend — Netlify (static Next export)
- **Base directory:** `transport-system` (critical — without it Netlify skips the build).
- Build: `npm install && npm run build --workspace @athenagrid/shared && npm run build --workspace @athenagrid/web`
- Publish: `transport-system/apps/web/out`
- Env vars (set in Netlify UI, baked at build time):
  - `NEXT_PUBLIC_API_URL = https://athenagrid-api.onrender.com/api/v1`
  - `NEXT_PUBLIC_WS_URL  = https://athenagrid-api.onrender.com`  (no /api/v1 suffix)

## Backend — Render (Blueprint `render.yaml` at repo root)
- Creates the API web service + a free managed **Postgres**.
- Build compiles; **start** runs `prisma db push` then `node dist/main.js`.
- Key env: `DATABASE_URL` (from DB), JWT secrets (auto), commission rates,
  `AUTO_VERIFY_CARRIERS=true`, `CORS_ORIGIN=*`.

## Free-tier caveats
- API **sleeps after ~15 min idle** → first request wakes it in ~50s.
- Render free **Postgres expires ~30 days** → data resets. Real launch = paid plan + persistent DB.
- Optional: a scheduled keep-alive ping every ~10 min to prevent sleep during testing.

## Redeploy
`git push` to `main` → both auto-redeploy. Netlify needs the base-directory set once.

Related: [[Local Development]] · [[Roadmap]]
