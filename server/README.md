# MERGE DEFENSE server (1.0 alpha)
A separate Node API. Existing browser game and local saves remain untouched.

## Status
- /health is public.
- /api/me checks signed VK launch parameters and reads or creates a player row if database and VK auth are configured.
- /api/game/action returns 501: *not implemented*; gameplay still lives locally.
- Payments are disabled; never grant paid assets from browser data.

## Environment variables on Render
- PORT: provided by Render.
- CLIENT_ORIGIN=https://merge-defense.onrender.com
- VK_APP_SECRET (server-only secret from VK configuration)
- VK_APP_ID (optional, recommended)
- DATABASE_URL (a **dedicated** Postgres instance, do not reuse another game's database)
- DB_SSL=disable only for local trusted Postgres.

Run schema.sql against the dedicated database before calling /api/me.
Do not place any secret in the frontend or GitHub.

## Safety notes
This is infrastructure groundwork, not completed cloud saves. The current game state is saved in localStorage and is not authoritative. Never upload that balance to a trusted player record without a reviewed migration policy. For legitimate live purchases, implement authenticated provider confirmation, transaction uniqueness, server-side entitlement grants and idempotency.
