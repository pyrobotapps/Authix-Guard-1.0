# Deploying Authix to Railway

Authix is three services that share one repo:

1. **`authix-backend`** — FastAPI (port 8001) — the public landing-page API
2. **`authix-bot`** — long-running Discord bot (no public port)
3. **`authix-frontend`** — React landing page (port 3000)

Backend and bot share the same Dockerfile and codebase (`/backend/`); frontend has its own (`/frontend/`).

---

## 1. Push the repo to GitHub

If you haven't already, click **"Save to GitHub"** in the Emergent UI, or from the terminal:

```bash
cd /app
git init                      # if first time
git add -A
git commit -m "Initial Authix"
git remote add origin git@github.com:<you>/authix.git
git push -u origin main
```

`.env` files are gitignored — your secrets stay local.

---

## 2. Create the Railway project

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pick `authix`.
2. Railway will offer to auto-deploy. **Cancel that** — we'll add the three services manually so each one points at the right subdirectory.

---

## 3. Add the **backend** service

1. In your project → **+ New** → **GitHub Repo** → select `authix` → **Add Service**.
2. **Settings** tab on the new service:
   - **Service Name**: `authix-backend`
   - **Source** → **Root Directory**: `backend`
   - **Build** → Builder is auto-detected from `backend/railway.json` (Dockerfile).
3. **Variables** tab — paste your secrets:
   ```
   MONGO_URL=mongodb+srv://...    (your Atlas string)
   DB_NAME=authix
   CORS_ORIGINS=*                 (tighten in step 6)
   DISCORD_BOT_TOKEN=...
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   DISCORD_PREMIUM_MONTHLY_SKU_ID=
   DISCORD_PREMIUM_YEARLY_SKU_ID=
   ```
4. **Settings** → **Networking** → **Generate Domain**. Copy the URL (something like `https://authix-backend-production.up.railway.app`). You'll need it twice in the next steps.
5. **Deploy** — first build takes ~2 minutes. Hit `https://<your-domain>/api/health` and confirm `{"api":"ok","mongo":"ok"}`.

---

## 4. Add the **bot** service

1. **+ New** → **GitHub Repo** → same `authix` repo → **Add Service**.
2. **Settings**:
   - **Service Name**: `authix-bot`
   - **Source** → **Root Directory**: `backend`
   - **Deploy** → **Custom Start Command**: `python bot.py`
   - **Networking** → **DO NOT** generate a domain (the bot doesn't serve HTTP).
3. **Variables**:
   - Click **+ Reference Variable** → reference all the same env vars from `authix-backend` (MONGO_URL, DB_NAME, DISCORD_BOT_TOKEN, etc.). This way you only manage secrets in one place.
4. **Deploy**. Logs should show:
   ```
   Authix logged in as Authix#XXXX (id=...)
   Synced 4 slash commands
   Ensured TTL indexes on verification_events and captcha_attempts
   ```

---

## 5. Add the **frontend** service

1. **+ New** → **GitHub Repo** → same `authix` repo → **Add Service**.
2. **Settings**:
   - **Service Name**: `authix-frontend`
   - **Source** → **Root Directory**: `frontend`
3. **Variables** — frontend needs ONE variable, and it must be a **Build-time** variable (CRA bakes them at build):
   ```
   REACT_APP_BACKEND_URL=https://authix-backend-production.up.railway.app
   ```
   In Railway, regular variables are passed at runtime AND at build, so this works either way — just paste the backend URL from step 3.
4. **Networking** → **Generate Domain**. This is your public site URL (e.g. `https://authix.up.railway.app`).
5. **Deploy** — first build takes ~3 minutes. Visit the URL and confirm the landing page loads with live stats.

---

## 6. Tighten CORS (post-launch)

Once you know your final domains, lock the backend CORS:

In `authix-backend` → **Variables**:
```
CORS_ORIGINS=https://authix.up.railway.app,https://authix.yourdomain.com
```

Save → service auto-restarts.

---

## 7. Atlas Network Access

Your Railway services egress through a pool of IPs. Two options:

- **Easiest**: keep `0.0.0.0/0` in Atlas Network Access. Your strong DB password is the real lock.
- **Strict**: enable **Static Outbound IPs** in Railway (under each service → **Settings** → **Network** → **Static Outbound IP**, ~$5/mo per service). Then add those IPs to Atlas allowlist and remove `0.0.0.0/0`.

---

## 8. Custom domain (optional)

In `authix-frontend` → **Settings** → **Networking** → **Custom Domain** → add `authix.yourdomain.com` and copy the CNAME target into your DNS provider. Same for the backend if you want `api.authix.yourdomain.com`. Railway provisions SSL automatically.

If you do this, also update:
- `REACT_APP_BACKEND_URL` in `authix-frontend` → trigger redeploy (CRA needs to rebuild)
- `CORS_ORIGINS` in `authix-backend`
- The Discord OAuth install URL is generated server-side from `DISCORD_CLIENT_ID` so it doesn't need updating.

---

## 9. Recap of secrets to keep secure

These should ONLY live in Railway's Variables tab — never in Git:

| Variable | Where it's set |
|---|---|
| `DISCORD_BOT_TOKEN` | `authix-backend` + `authix-bot` |
| `DISCORD_CLIENT_SECRET` | `authix-backend` + `authix-bot` |
| `MONGO_URL` (Atlas) | `authix-backend` + `authix-bot` |
| `DISCORD_PREMIUM_MONTHLY_SKU_ID` | `authix-backend` + `authix-bot` |
| `DISCORD_PREMIUM_YEARLY_SKU_ID` | `authix-backend` + `authix-bot` |

Use Railway's **Reference Variables** feature so you only paste each secret once.

---

## 10. Cost estimate

Railway's hobby plan is **$5/month** of usage credit included. Authix's three services should sit comfortably inside that:
- backend: ~50 MB RAM idle, ~150 MB under load
- bot: ~80 MB RAM (steady)
- frontend: ~40 MB RAM (static)

Expect ~$3–5/mo total unless you're getting heavy traffic. Static outbound IPs are a separate ~$5/mo each if you want them.
