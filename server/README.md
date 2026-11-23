# MERGE DEFENSE server — VK cloud saves (3.0)

The single-player frontend is hosted on Render. The active game API is the dedicated MERGE DEFENSE process on the VPS, behind Caddy.

## Cloud-save endpoints

- `GET /api/cloud/save`: retrieves an authenticated VK player's cloud snapshot and revision.
- `PUT /api/cloud/save`: uploads a validated snapshot with an expected revision. A stale revision returns HTTP 409. No silent overwrite.
- Only signed, recent VK launch parameters are accepted by the existing `requireAuth` middleware.
- `game_saves` is created on the first cloud request if it doesn't already exist (see `schema.sql`).
- The frontend retains a local copy, imports the existing local game on first use, and shows a choice if local and cloud saves conflict.

**Important:** the cloud snapshot is **untrusted single-player state**, including free/local gems and coins. It must **never** be used to credit purchases or calculate purchased/spendable server gems. Paid purchases and the `players` ledger remain separate. Real payments are not ready for release.

## VPS deployment for MERGE DEFENSE only

After merging changes into `main`, update **only** the MERGE DEFENSE process on the VPS:

```bash
cd /opt/merge-defense
git pull --ff-only
pm2 restart merge-defense --update-env
```

The `game_saves` table is created automatically by the API on first request. Database credentials in the existing runtime config must allow creating this table. Do not restart other PM2 apps, modify Caddy, change port 80, or modify another game's database.

Check `https://merge.89-23-115-251.sslip.io/health` and authenticated GET/PUT `/api/cloud/save` from inside the VK app. A public GET without signed VK headers should return 401; that is expected.

If the VPS backend is still on an older commit, the frontend will continue saving locally and indicate that cloud saves are unavailable. Do **not** claim that data is backed up until a successful cloud PUT response.

## Security and deployment details

- Node.js >=20, PostgreSQL, Express with strict JSON size limits and rate limiting.
- Environment: `VK_APP_SECRET`, `VK_APP_ID`, `DATABASE_URL`, `DB_SSL`, `CLIENT_ORIGIN`.
- `/api/me` still uses the separate server-owned players table.
- `/api/game/action` operates on server-owned balances; the cloud snapshots never write to that table.
- `/api/purchases/verify` is disabled. Test purchases are nonspendable.

No secrets are stored in GitHub or sent to the browser.

## Lucky City clans (new module)

The new clan data is isolated in `lucky_clans` and `lucky_clan_members` and does not edit existing cloud saves, player balances, or purchases. The tables are created automatically when a clan endpoint is first requested. All mutations require signed VK launch params.

- `GET /api/casino/clans`: current clan and top clan list.
- `GET /api/casino/clans/group?url=...`: verify public VK group, load its real name and avatar.
- `POST /api/casino/clans/create`: create a clan for a verified VK group, **free**.
- `POST /api/casino/clans/join`, `leave`, `daily`, `upgrade`, `role`.

**Required for group selection:** set `VK_GROUP_SERVICE_TOKEN` in the API server environment (a VK application service token with access to groups.getById). Never put it in the frontend or GitHub. Without the token, choosing a community returns a clear 503 instead of creating an unverified clan. Restart the MERGE DEFENSE PM2 process with `--update-env` after configuring it.

The clan treasury currently holds **clan building materials** only, earned once per UTC day by each member; it is not a real-money/virtual-currency balance transfer. Headquarters and walls upgrade through 50 levels. Raids and clan attacks are not enabled in this release. Confirm backup coverage for both tables before exposing raids or clan spendable currency.

Frontend file `clans.js` is served next to `index.html`. Publishing GitHub alone does not prove the VPS has pulled new code. Check the served build and the authenticated clan API after deployment.
