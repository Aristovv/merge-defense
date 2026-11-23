'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {clean,regression}=require('../casino-saves.cjs');

function player(){
 return {
  coins:88962,chips:35770,vip:1,level:1,xp:99,
  buildings:[1,...Array(13).fill(0)],
  plays:21,wins:13,best:500,earned:6000,
  giftBestStreak:1,giftStreak:1,lastGift:'2026-11-23',
  character33:{ownedOutfits:['city-rookie']}
 };
}

test('valid cloud saves are accepted',()=>{
 assert.ok(clean(player()));
});
test('valid spending does not trigger a false rollback',()=>{
 const a=player(),b={...a,coins:1000,chips:3000};
 assert.equal(regression(a,b),null);
});
test('stale starter save cannot overwrite established plays',()=>{
 assert.equal(regression(player(),{...player(),plays:0}),'PROGRESS_REGRESSION_PLAYS');
});
test('daily login history cannot disappear',()=>{
 assert.equal(regression(player(),{...player(),lastGift:''}),'SERVER_DAILY_CLAIM_REQUIRED');
});
test('earned level and purchased outfit cannot disappear',()=>{
 assert.equal(regression(player(),{...player(),level:0}),'PROGRESS_REGRESSION_LEVEL');
 assert.equal(regression(player(),{...player(),character33:{ownedOutfits:[]}}),'OUTFIT_OWNERSHIP_REGRESSION');
});
test('buildings cannot drop to new-game defaults',()=>{
 assert.equal(regression(player(),{...player(),buildings:Array(14).fill(0)}),'BUILDING_REGRESSION');
});
test('mismatched administrative epoch rejects stale writes',()=>{
 assert.equal(regression(player(),{...player(),resetEpoch:2}),'RESET_EPOCH_MISMATCH');
});

test('permanent achievements and VIP cosmetics cannot vanish',()=>{
 const old={...player(),achievementsClaimed:[0,1],levelRewards:[5],
  donationInventory:{nicks:['nick-rainbow'],frames:['frame-royal']}};
 assert.equal(regression(old,{...old,achievementsClaimed:[0]}),
  'PERMANENT_COLLECTION_REGRESSION_ACHIEVEMENTSCLAIMED');
 assert.equal(regression(old,{...old,donationInventory:{nicks:[],frames:['frame-royal']}}),
  'DONATION_OWNERSHIP_REGRESSION_NICKS');
});

test('oversized and invalid snapshots are rejected',()=>{
 assert.equal(clean({...player(),level:0}),null);
 assert.equal(clean({...player(),padding:'x'.repeat(91000)}),null);
});

// Snapshot archival must be part of the same PostgreSQL transaction as every
// mutation, including clan deposits, daily gifts and Plinko settlement.
test('server cloud history uses a database trigger, not browser cache',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../casino-saves.cjs'),'utf8');
 assert.match(source,/CREATE TABLE IF NOT EXISTS public\.casino_city_save_history/);
 assert.match(source,/AFTER INSERT OR UPDATE ON public\.casino_city_saves/);
 assert.match(source,/OLD\.revision IS DISTINCT FROM NEW\.revision/);
 assert.match(source,/VALUES\(OLD\.vk_id,OLD\.revision,OLD\.save\)/);
 assert.match(source,/ON CONFLICT DO NOTHING/);
});
test('history API is read-only and scoped to authenticated account',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../casino-saves.cjs'),'utf8');
 assert.match(source,/app\.get\('\/api\/casino\/save\/history',requireAuth/);
 assert.match(source,/FROM public\.casino_city_save_history WHERE vk_id=\$1/);
 assert.doesNotMatch(source,/app\.post\('\/api\/casino\/save\/restore'/);
});
