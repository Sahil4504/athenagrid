# Deploying AthenaGrid Transport (Netlify + Render)

A free, shareable test deployment so friends can sign up and stress-test bidding.

- **Frontend** → Netlify (static Next.js export)
- **Backend API + WebSockets** → Render (Node web service)
- **Database** → Render managed PostgreSQL (created automatically by the blueprint)

Config lives in `netlify.toml` and `render.yaml`. This guide assumes your GitHub
repo root is the parent **AthenaGrid** folder with `transport-system/` inside it;
if the repo *is* the `transport-system` folder, ignore the "base/root directory"
notes and delete the `rootDir` line in `render.yaml`.

---

## 0. Push the code to GitHub

```bash
cd D:\Startup\AthenaGrid
git init            # if not already a repo
git add .
git commit -m "AthenaGrid transport MVP"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/AthenaGrid.git
git push -u origin main
```

---

## 1. Backend + database on Render

1. Go to **render.com** → sign in with GitHub.
2. **New → Blueprint** → pick your repo. Render reads `render.yaml` and proposes a
   web service **athenagrid-api** + a Postgres **athenagrid-db**.
   - If the repo root is the parent folder, confirm the service **Root Directory**
     is `transport-system` (it's set in `render.yaml`).
3. Click **Apply**. First build takes ~3–5 min (installs, builds, generates Prisma).
4. When live, open `https://<your-api>.onrender.com/api/v1/health` — you should see
   `{"status":"ok","db":"up",...}`. **Copy the base URL** `https://<your-api>.onrender.com`.

> Free tier note: the API **spins down after ~15 min idle**, so the first request
> after a pause takes ~30–60s to wake. That's normal for testing.

### (Optional) load demo accounts + a sample job
In the Render dashboard → your service → **Shell**, run:
```bash
npm --workspace @athenagrid/api run seed
```
This creates `farmer@ / carrier@ / carrier2@ / indie@ / driver@ / admin@` (password
`password123`) and one starter job. Skip it if you only want friends' own signups.

---

## 2. Frontend on Netlify

1. Go to **netlify.com** → **Add new site → Import from Git** → pick your repo.
2. If the repo root is the parent folder, set **Base directory** = `transport-system`.
   Build command and publish dir come from `netlify.toml` automatically
   (`publish = apps/web/out`).
3. Before the first build, add **Environment variables** (Site settings → Environment),
   pointing at your Render API from step 1:
   ```
   NEXT_PUBLIC_API_URL = https://<your-api>.onrender.com/api/v1
   NEXT_PUBLIC_WS_URL  = https://<your-api>.onrender.com
   ```
4. **Deploy**. When done you get a URL like `https://<your-site>.netlify.app`.

> These `NEXT_PUBLIC_*` values are baked in at build time, so if you change the API
> URL later, trigger a redeploy.

---

## 3. Share and test

Send friends the Netlify URL. They can:
- **Sign up** at `/signup` as a shipper, a carrier company, or an individual driver.
  (Carriers are auto-verified because `AUTO_VERIFY_CARRIERS=true` on Render, so they
  can bid right away.)
- A shipper posts a job; multiple carriers/individuals open it and bid different
  amounts; the shipper sees them **stream in live**, ranked, with the fair-price
  recommendation and the money split; awards one; the driver advances the trip and
  the shipper tracks it live.

---

## Locking it down later (optional)
- Set `CORS_ORIGIN` on Render to your exact Netlify URL instead of `*`.
- Set `AUTO_VERIFY_CARRIERS=false` to require real verification.
- Move `prisma db push` to proper migrations (`prisma migrate`) for a real launch.
- Add Redis (Render Key Value) and set `REDIS_URL` when you scale to >1 API instance.

## Troubleshooting
- **Frontend loads but calls fail** → check the `NEXT_PUBLIC_API_URL` env in Netlify
  and that the Render API `/api/v1/health` responds (it may be waking up).
- **Build fails on Render** → confirm Root Directory is `transport-system`.
- **WebSocket/live updates not arriving** → confirm `NEXT_PUBLIC_WS_URL` has **no**
  `/api/v1` suffix (it's the bare origin).
