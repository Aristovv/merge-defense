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

## Clan economy (2026-11-23)

- Creating/joining a clan remains free.
- Previous `materials` treasury balances migrate to `coins` at a 1:1 ratio, with the legacy field retained for rollback compatibility. No player's personal balance is changed by the migration.
- Clan treasury capacity: `50,000 + 20,000 × headquartersLevel²` coins; level 1 is 70,000 coins.
- Upgrading HQ to the next level: `ceil(3,000 × 1.13^(currentLevel-1) / 100) × 100` coins.
- Upgrading the wall to the next level: `ceil(2,000 × 1.13^(currentLevel-1) / 100) × 100` coins.
- Member daily contribution reward: up to 500 clan coins, exactly once per UTC day, subject to vault capacity.
- Voluntary deposits transfer personal in-game coins from authoritative-at-request cloud snapshot into the clan vault in one PostgreSQL transaction, with expected revision and idempotency request key. Amounts 100–1,000,000 in increments of 100; sum of deposits per account per UTC day capped at 100,000. A pending mini-game blocks transfers.
- Deposits increment the player's cloud revision and return the committed save, which the frontend reconciles before allowing further actions.
- The last 25 clan treasury actions are visible. Only the owner or an officer can upgrade the HQ/wall. Ordinary members may contribute.
- **Important**: the existing casino personal coin save is client-generated gameplay state; it is not a fully server-authoritative earnings ledger. The revision check and atomic transfers prevent double transfers and stale writes, but they **do not prevent a malicious player from manipulating an untrusted upstream coin balance**. Before competitive coin economies or valuable prizes are introduced, migrate coin earning/spending to validated server-side game actions.
- **VK Votes not implemented yet for clans.** The screenshot's 5-vote milestone ideas remain a separate planned purchase feature. No 5-vote option is enabled or charged. Proper integration must record a pre-authorized upgrade intent, validate VK's signed payment callback, and consume the receipt exactly once; never trust a client-only payment success flag.

## Required regression tests before rollout

1. Back up PostgreSQL, verify the backup can be restored and includes the existing `casino_city_saves` table.
2. Check existing treasury migration (e.g. 100 materials becomes 100 coins), personal balances unchanged.
3. Confirm a 3,000-coin HQ upgrade spends exactly 3,000 clan coins and raises headquarters 1→2.
4. Confirm deposit from personal account decrements the player's saved coins exactly once, increases clan coins exactly once, and survives re-login.
5. Confirm repeated request ID, stale cloud revision, insufficient personal funds and full vault never double-charge.
6. Confirm two simultaneous donations don't overwrite the latest cloud save or exceed vault capacity.
7. Confirm a pre-existing unsynced local save blocks donations and requests no payment.
8. Confirm no vote-based upgrades are purchasable until the signed VK payment flow has been built.

## Not yet implemented or verified
- Production installation on Timeweb has not been verified.
- Native community-token issuance and group-specific server verification need live testing. The previous `groups.getMembers?filter=managers` approach was rejected by VK (code 15). The new flow does not use it. Failed permission requests must not create a clan.
- Clan raids, NPC attacks, clan chat, cross-user invites, and user-funded deposits are **not active**.
- Upgrade-stage vector scenes are procedural previews, not individually illustrated photorealistic assets.
- Full production end-to-end tests with real VK accounts and PostgreSQL still need to be run.

## Safety
Before deployment, create a recoverable database backup and verify it. Never paste VK tokens or database URLs into an issue or chat. Avoid editing the legacy casino save tables for clan features.
