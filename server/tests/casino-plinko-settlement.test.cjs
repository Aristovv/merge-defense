'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {settleRecordedPlinko}=require('../casino-saves.cjs');
const mk=(prize=120)=>({coins:2000,chips:850,earned:300,best:80,wins:2,plays:9,
 pendingMiniRound:{kind:'plinko',stake:100,prize}});
test('server settles persisted Plinko result exactly once without new stake debit',()=>{
 const original=mk();
 const resolved=settleRecordedPlinko(original);
 assert.equal(resolved.chips,970);
 assert.equal(resolved.earned,420);
 assert.equal(resolved.best,120);
 assert.equal(resolved.coins,2000);
 assert.equal(resolved.plays,9);
 assert.equal(resolved.wins,2);
 assert.equal(resolved.pendingMiniRound,null);
 assert.equal(original.pendingMiniRound.kind,'plinko');
 assert.equal(settleRecordedPlinko(resolved),null);
});
test('zero-prize Plinko clears pending marker without credit',()=>{
 const original=mk(0),resolved=settleRecordedPlinko(original);
 assert.equal(resolved.chips,original.chips);
 assert.equal(resolved.earned,original.earned);
 assert.equal(resolved.pendingMiniRound,null);
});
test('rejects malformed, unrelated or impossibly large pending rounds',()=>{
 assert.equal(settleRecordedPlinko({...mk(),pendingMiniRound:{kind:'crash'}}),null);
 assert.equal(settleRecordedPlinko({...mk(),pendingMiniRound:{kind:'plinko',stake:100,prize:-1}}),null);
 assert.equal(settleRecordedPlinko({...mk(),pendingMiniRound:{kind:'plinko',stake:100,prize:Infinity}}),null);
 assert.equal(settleRecordedPlinko({...mk(),chips:Number.MAX_SAFE_INTEGER}),null);
});
test('cloud reconcile checks stored result, expected revision and backs up both copies',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
 const saveSrc=fs.readFileSync(path.join(__dirname,'../casino-saves.cjs'),'utf8');
 assert.match(saveSrc,/FOR UPDATE/);
 assert.match(saveSrc,/Number\(q\.rows\[0\]\.revision\)!==expected/);
 assert.match(html,/casinoCloudSettleRecordedPlinko\(Number\(remote\.revision\)\)/);
 assert.match(html,/casino_city_plinko_pending_backup_/);
 assert.match(html,/casinoCloudQuarantinePending\('server-settled Plinko pending'\)/);
 assert.match(html,/casinoCloudPendingWrite\(settled\.revision\)/);
});
