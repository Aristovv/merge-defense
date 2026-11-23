# Lucky City — Clan system deployment notes

## Status
The client and server code is in this repository. Merging into GitHub does **not** guarantee the Timeweb instance has deployed it.

## Deployment requirements
1. Deploy the latest repository revision for the static client (`index.html`, `clans.js`, `clan-scenes.js`).
2. Deploy the latest `server/` revision to the API serving `https://merge.89-23-115-251.sslip.io`.
3. Verify the server environment has the existing `DATABASE_URL` and `VK_APP_SECRET`. Do not change either.
4. Group listing uses device-side VK Bridge user permission `groups`. For creation VK Bridge now requests a community access token with `manage` permission for the selected group. The server uses this temporary token only to request that group's callback confirmation code as proof of group control, and never logs or stores the token or confirmation code. VK may require installing/authorizing the mini app for that community; the live flow is **not yet confirmed**.
5. Restart the backend, check `/health`, then open Lucky City in the VK app and choose **Клан**.

## APIs
All endpoints are protected by existing signed VK launch authentication.

- GET `/api/casino/clans` — current clan and public leaderboard
- The admin group list is loaded on-device with VK Bridge (no server route).
- POST `/api/casino/clans/create` — free creation with `{groupId, communityToken}`; server checks that the native-VK-issued community credential can perform a group-specific privileged read (`groups.getCallbackConfirmationCode`) and retrieves name/avatar independently with service token. Neither token nor confirmation code is persisted.
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
- Native community-token issuance and group-specific server verification need live testing. The previous `groups.getMembers?filter=managers` approach was rejected by VK (code 15). The new flow does not use it. Failed permission requests must not create a clan.
- Clan raids, NPC attacks, clan chat, cross-user invites, and user-funded deposits are **not active**.
- Upgrade-stage vector scenes are procedural previews, not individually illustrated photorealistic assets.
- Full production end-to-end tests with real VK accounts and PostgreSQL still need to be run.

## Safety
Before deployment, create a recoverable database backup and verify it. Never paste VK tokens or database URLs into an issue or chat. Avoid editing the legacy casino save tables for clan features.
