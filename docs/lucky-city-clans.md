# Lucky City — Clan system deployment notes

## Status
The client and server code is in this repository. Merging into GitHub does **not** guarantee the Timeweb instance has deployed it.

## Deployment requirements
1. Deploy the latest repository revision for the static client (`index.html`, `clans.js`, `clan-scenes.js`).
2. Deploy the latest `server/` revision to the API serving `https://merge.89-23-115-251.sslip.io`.
3. Verify the server environment has the existing `DATABASE_URL` and `VK_APP_SECRET`. Do not change either.
4. The user grants the `groups` permission in VK Bridge. `users.get` and `groups.get` now run **on the player's device via VKWebAppCallAPIMethod**, because VK's user token is IP-bound. The token is not sent to the Lucky City server. A server-side `VK_GROUP_SERVICE_TOKEN` is used solely to attempt an independent administrative-role check (`groups.getMembers?filter=managers`) on creation. If VK disallows that check for the service token, creation must fail closed pending a supported verification method.
5. Restart the backend, check `/health`, then open Lucky City in the VK app and choose **Клан**.

## APIs
All endpoints are protected by existing signed VK launch authentication.

- GET `/api/casino/clans` — current clan and public leaderboard
- The admin group list is loaded on-device with VK Bridge (no server route).
- POST `/api/casino/clans/create` — free creation with `{groupId}`; server independently checks administrator role and retrieves group name/avatar through VK API; it never trusts client-supplied group metadata
- POST `/api/casino/clans/join` — `{id}`
- POST `/api/casino/clans/leave`
- POST `/api/casino/clans/daily` — one server-side 100-material contribution per UTC day
- POST `/api/casino/clans/upgrade` — `{kind:"headquarters"|"wall"}`
- POST `/api/casino/clans/role` — owner-only role assignment

Only clan tables `lucky_clans` and `lucky_clan_members` are initialized; this code does **not** migrate or overwrite individual player cloud saves. The material treasury is separate from player coins/chips and donation entitlements.

## Acceptance checks
- In the UI, the bottom bar displays **Клан**; Games, Collection and Quests remain accessible in Profile.
- Top supports switching **Игроки / Кланы**.
- Opening Create Clan prompts for VK groups permission and shows the player's administered groups; choosing one fills the real name/avatar, and each community may only be linked once.
- Another VK user can join; only the clan owner can promote or demote officers.
- Double-clicking or reopening cannot claim daily materials more than once on the same UTC date.
- Headquarters and wall each display 50 distinct progressive vector scenes.
- Refresh / re-login retains clan membership and upgrade levels from PostgreSQL.
- Original coins, chips, clothing, purchases, and daily rewards retain their previous values.

## Not yet implemented or verified
- Production installation on Timeweb has not been verified.
- VK Bridge device API calls and service-key permission for `groups.getMembers` manager validation have not yet been verified on the deployed build. If the server VK API denies the manager list, creation remains blocked (no insecure bypass).
- Clan raids, NPC attacks, clan chat, cross-user invites, and user-funded deposits are **not active**.
- Upgrade-stage vector scenes are procedural previews, not individually illustrated photorealistic assets.
- Full production end-to-end tests with real VK accounts and PostgreSQL still need to be run.

## Safety
Before deployment, create a recoverable database backup and verify it. Never paste VK tokens or database URLs into an issue or chat. Avoid editing the legacy casino save tables for clan features.
