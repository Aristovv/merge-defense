'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {regression,clean}=require('../casino-saves.cjs');
function save(overrides={}){
 return {
  coins:88962,chips:35770,vip:1,xp:99,level:1,plays:21,wins:13,best:100,earned:1000,
  buildings:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],lastGift:'2026-11-23',
  giftStreak:1,giftBestStreak:1,resetEpoch:0,
  character33:{ownedOutfits:['street-black']},...overrides
 };
}
test('valid saves accept normal spend and earning',()=>{
 const prior=save(),next=save({coins:85000,chips:36000});
 assert.equal(regression(prior,next),null);
 assert.ok(clean(next));
});
test('initial defaults cannot overwrite progressed cloud profile',()=>{
 assert.match(regression(save(),save({level:1,plays:0,wins:0,best:0,earned:0})),/PROGRESS_REGRESSION/);
});
test('daily claimed date may not roll back',()=>{
 assert.equal(regression(save(),save({lastGift:'2026-11-22'})),'SERVER_DAILY_CLAIM_REQUIRED');
});
test('best streak persists after current streak resets',()=>{
 assert.equal(regression(save(),save({giftStreak:0,giftBestStreak:1,lastGift:'2026-11-24'})),'SERVER_DAILY_CLAIM_REQUIRED');
 assert.equal(regression(save(),save({giftStreak:0,giftBestStreak:0,lastGift:'2026-11-24'})),'SERVER_DAILY_CLAIM_REQUIRED');
 assert.equal(regression(save(),save({giftBestStreak:0})),'SERVER_DAILY_CLAIM_REQUIRED');
});
test('purchased outfits cannot disappear from client saves',()=>{
 assert.equal(regression(save(),save({character33:{ownedOutfits:[]}})),'OUTFIT_OWNERSHIP_REGRESSION');
});
test('building and admin epoch rollbacks are blocked',()=>{
 assert.equal(regression(save(),save({buildings:Array(14).fill(0)})),'BUILDING_REGRESSION');
 assert.equal(regression(save({resetEpoch:4}),save({resetEpoch:3})),'RESET_EPOCH_MISMATCH');
});
test('malformed save rejected',()=>{
 assert.equal(clean(save({coins:-1})),null);
 assert.equal(clean(save({buildings:[1,2]})),null);
});
