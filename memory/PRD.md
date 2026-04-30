# Authix — Product Requirements Doc

## Original Problem Statement
> Create a Discord verification & security bot called **Authix**. Verifies users using a letter-based captcha system (users must enter a generated code to gain access). Manages roles, restricts access, and ensures only real users enter the server.

### User Choices
- Captcha delivery: **verification channel with button + modal**
- Premium monetization: **Discord App Monetization (SKU entitlements)** — not Stripe
- Notifications (Kick/Twitch/YouTube): **removed from scope**
- Design: **dark theme with neon cyan/blue accents**, premium SaaS aesthetic
- Credentials: user said **"skip"** — bot runs with placeholder token until `.env` is populated
- Web surface: **landing/marketing page + docs** (no user auth / dashboard)

## Architecture
- **Backend** (`/app/backend/server.py`): FastAPI with `/api` prefix — `/health`, `/stats`, `/commands`
- **Bot** (`/app/backend/bot.py`): `discord.py` 2.4 — slash commands, captcha modal, persistent Verify button, per-guild Mongo config, Discord SKU entitlement check. Runs as supervisor service `authix_bot`.
- **Frontend** (`/app/frontend/`): React + React Router + Tailwind + shadcn/ui. Pages: `/` (Landing), `/docs` (Docs). Fonts: Chivo (headings) + JetBrains Mono (body).
- **DB**: MongoDB — collections `guild_configs`, `authix_stats`.

## User Personas
1. **Server owner** — adds bot, sets verified role, posts panel.
2. **Moderator** — granted admin via `/config admin`, can tweak settings.
3. **Incoming member** — clicks Verify, solves captcha, gets role.
4. **Premium upgrader** — pays via Discord Monetization, unlocks `/customization`.

## What's Been Implemented (2026-04-30)
- Backend API: `/api/`, `/api/health`, `/api/stats`, `/api/commands` — 100% test pass
- Discord bot with:
  - `/config role` — set verified + optional unverified role (with role-hierarchy check)
  - `/config admin` — add/remove roles allowed to configure Authix
  - `/config panel` — post verification panel with persistent Verify button
  - `/customization` — premium-gated via SKU entitlement (fallback: guild owner)
  - `/help` — setup guide
  - Captcha modal with 6-letter code (visually unambiguous alphabet)
  - Live per-guild Mongo config; stats tracking (`servers_protected`, `users_verified`)
- Frontend landing page:
  - Hero with live stats from `/api/stats`
  - Features bento (6 cards)
  - Interactive captcha demo in "How it works" (mockup modal + input validation)
  - Commands list loaded from `/api/commands`
  - Premium plan card highlighting Discord Monetization
  - Final CTA + Footer
- Frontend `/docs` page with 6 setup steps
- Supervisor config for `authix_bot` (`/etc/supervisor/conf.d/authix_bot.conf`)
- Custom SVG AuthixLogo component (shield + stylized A + lock dot)

## Prioritized Backlog
### P0 (to make it live)
- [ ] User provides `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_PREMIUM_SKU_ID` in `/app/backend/.env` → `sudo supervisorctl restart authix_bot`

### P1 (polish before launch)
- [ ] Replace guild-owner fallback in `has_premium_entitlement` with a strict entitlement check once SKU is published
- [ ] Proper install URL on "Add to Discord" buttons (currently placeholder `discord.com/oauth2/authorize`)
- [ ] Logo generation retry (image gen quota was exhausted during build — SVG logo is in place meanwhile)
- [ ] Add `data-testid="docs-step-N"` to docs cards for stronger E2E

### P2 (future)
- [ ] Dashboard with Discord OAuth login for browser-based config
- [ ] Audit log channel support
- [ ] Anti-raid / cooldown tuning
- [ ] Restore optional notifications module (Kick/Twitch/YouTube) behind a toggle
- [ ] i18n for captcha prompts

## Test Status
- Backend: **6/6 pytest cases passing** (`/app/backend/tests/test_authix_api.py`)
- Frontend: all targeted flows verified via testing agent (captcha demo, navbar, hero, features grid, commands load, premium plans, docs)
- Bot process: running idle without token — does not crash
