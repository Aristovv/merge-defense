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


## Clan economy (coin/vote milestone release)
- Clan creation: free. Existing player coins, chips and paid purchases are not reset or migrated.
- Existing clan building materials migrate into the new clan coin treasury at **1 material = 1 clan coin** on first successful clan database initialization; the `materials` column is retained for backwards compatibility. Back up database before deployment.
- Clan coin treasury maximum = `50,000 + 20,000 × headquarters_level²`. Level 1 = 70,000 coins; level 50 = 50,050,000.
- Standard HQ level-up from current level L costs `ceil(3000 × 1.11^(L-1) / 100) × 100` clan coins; wall costs `ceil(2000 × 1.11^(L-1) / 100) × 100`. Prices are derived **server-side**, not trusted from browser.
- Paywalled milestones: HQ reaches levels 4, 7, 10, 15; wall reaches levels 4, 7, 10. These require one server-owned construction permit bought for 5 VK votes; no clan coins are charged at these specific milestones. Total of 7 permits (35 votes) for both full 50-level paths.
- Each member may claim up to 500 free clan coins **once per UTC day**; a separate cross-clan unique claim key prevents repeated claiming by leaving and rejoining.
- A member may transfer **100–100,000** personal coins per request, with a total cap of 100,000 per UTC day. Transfers commit personal cloud-save debit, clan credit, and audit log in one PostgreSQL transaction. On uncertain network results, reload to reconcile rather than trying an untracked second transfer. Transfers are irreversible and cannot exceed available capacity.
- Spending clan coins and spending a paid permit are guarded by transactional locks and by expected construction level; simultaneous stale requests are rejected instead of upgrading a different level unintentionally.
- A 5-vote permit is issued **only** by the existing signature-verified VK order callback. Repeated order IDs are idempotent through `casino_city_paid_orders`; permits live in `lucky_clan_permits`, never in client-editable saves. The purchase UI only works when `LUCKY_VK_PAYMENTS_ENABLED=1` and `VK_PAYMENTS_SECRET` are already securely configured for existing commerce.
- Purchase completion can lag VK callback processing; players use **Проверить оплаченные пропуска** to refresh the authoritative entitlement.

### Risks and verification before production
- Existing Lucky City cloud saves currently permit client-originated coin increases for ordinary gameplay. Atomic clan deposits prevent double-spending via the API but **do not make the entire local game economy cheat-proof**. A fully secure competitive market requires server-authoritative coin earning across the whole game.
- Confirm all existing saves and table backups before deployment; this release adds clan tables and the `coins` column, not changes to individual save schema.
- Real VK premium order, callback, duplicate notification, paid permit consumption and delayed callback need full end-to-end testing; passing syntax or unit checks is not proof of live payment success.
- Do not publish the premium stage as live until verified with a real authorized VK order. Do not enable test order crediting. Never log payment secrets.

## Economy revision — 3 premium upgrades per building
- Clan creation remains **free**.
- Exactly three premium upgrades per building: **levels 5, 10, 15** for headquarters and **levels 5, 10, 15** for wall. Each costs **one 5-VK-vote construction permit** from the existing signed-payment flow; premium levels do not also spend coins.
- All other upgrades use **clan treasury coins**. Formula for upgrading from level `L` to `L+1`: `ceil(base * 1.13^(L-1) / 100) * 100`, with base **5,000** (headquarters) and **3,500** (wall).
- Cost for all coin stages, level 1 to 50: headquarters **15,260,600 coins**; wall **10,682,900 coins**; together **25,943,500 coins** plus **30 VK votes** for all six premium stages.
- Existing clan upgrades and server-side permit ownership are preserved; no retroactive charges or reset.
- Live VK purchases must be confirmed with signed server callbacks and are **not claimed as production-tested**.

## Treasury display and stalled-round handling (2026-11-23)
- Treasury capacity follows the server formula `50,000 + 20,000 * headquarters_level^2`, from 70,000 coins at HQ level 1 to 50,050,000 coins at HQ level 50. The wall does not increase storage. The clan UI now shows current and next HQ capacity.
- The construction-permit panel shows all **six** 5-vote milestones individually: HQ 5/10/15 and wall 5/10/15, with completed/next/future status and one permit per level.
- Coin transfers cannot run while a casino round is active or unfinished. The client identifies an active round and offers to return to it without resetting game state. A stale unfinished server save is never forcibly cleared or paid out: recovery must use the game's existing save-review mechanism. Do not bypass this lock, as Plinko and Crash may have unresolved wagers.
- A 409 representing an unfinished round is no longer mistaken for a cloud revision conflict. Balance and cloud session stay intact when that guard rejects a deposit.
