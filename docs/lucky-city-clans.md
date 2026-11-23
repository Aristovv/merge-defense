# Lucky City — Clan system deployment notes

## Status
The client and server code is in this repository. Merging into GitHub does **not** guarantee the Timeweb instance has deployed it.

## Deployment requirements
1. Deploy the latest repository revision for the static client (`index.html`, `clans.js`, `clan-scenes.js`).
2. Deploy the latest `server/` revision to the API serving `https://merge.89-23-115-251.sslip.io`.
3. Verify the server environment has the existing `DATABASE_URL` and `VK_APP_SECRET`. Do not change either.
4. Configure `VK_GROUP_SERVICE_TOKEN` as an **environment variable on the server**, never in GitHub, browser JavaScript or logs. The token needs VK API permission sufficient to call `groups.getById` on public groups.
5. Restart the backend, check `/health`, then open Lucky City in the VK app and choose **Клан**.

## APIs
All endpoints are protected by existing signed VK launch authentication.

- GET `/api/casino/clans` — current clan and public leaderboard
- GET `/api/casino/clans/group?url=...` — server-verified community name and avatar
- POST `/api/casino/clans/create` — free creation with `{groupUrl}`
- POST `/api/casino/clans/join` — `{id}`
- POST `/api/casino/clans/leave`
- POST `/api/casino/clans/daily` — one server-side 100-material contribution per UTC day
- POST `/api/casino/clans/upgrade` — `{kind:"headquarters"|"wall"}`
- POST `/api/casino/clans/role` — owner-only role assignment

Only clan tables `lucky_clans` and `lucky_clan_members` are initialized; this code does **not** migrate or overwrite individual player cloud saves. The material treasury is separate from player coins/chips and donation entitlements.

## Acceptance checks
- In the UI, the bottom bar displays **Клан**; Games, Collection and Quests remain accessible in Profile.
- Top supports switching **Игроки / Кланы**.
- Creation with a public VK community URL populates name/avatar and cannot be repeated for that community.
- Another VK user can join; only the clan owner can promote or demote officers.
- Double-clicking or reopening cannot claim daily materials more than once on the same UTC date.
- Headquarters and wall each display 50 distinct progressive vector scenes.
- Refresh / re-login retains clan membership and upgrade levels from PostgreSQL.
- Original coins, chips, clothing, purchases, and daily rewards retain their previous values.

## Not yet implemented or verified
- Production installation on Timeweb has not been verified.
- VK community token availability has not been verified.
- Clan raids, NPC attacks, clan chat, cross-user invites, and user-funded deposits are **not active**.
- Upgrade-stage vector scenes are procedural previews, not individually illustrated photorealistic assets.
- Full production end-to-end tests with real VK accounts and PostgreSQL still need to be run.

## Safety
Before deployment, create a recoverable database backup and verify it. Never paste VK tokens or database URLs into an issue or chat. Avoid editing the legacy casino save tables for clan features.
