'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const {registerCasinoDaily}=require('../casino-daily.cjs');

// In-memory row-locked PG stand-in. No production account or database is touched.
function setup({day='2026-11-23',lastGift='',giftStreak=0,coins=2500,chips=1200,xp=0,revision=5}={}){
 const record={revision,save:{
  coins,chips,vip:0,level:1,xp,plays:0,wins:0,best:0,earned:0,
  buildings:[1,...Array(13).fill(0)],lastGift,giftStreak,giftBestStreak:giftStreak
 }};
 const client={
  async query(sql,params){
   if(['BEGIN','COMMIT','ROLLBACK'].includes(sql))return {rows:[]};
   if(sql.includes('SELECT save,revision::text'))return {rowCount:1,rows:[{save:structuredClone(record.save),revision:String(record.revision)}]};
   if(sql.includes('to_char(now()'))return {rows:[{day}]};
   if(sql.includes('UPDATE public.casino_city_saves')){
    assert.equal(params[1],record.revision);
    record.save=JSON.parse(params[2]);record.revision++;
    return {rowCount:1,rows:[{revision:String(record.revision)}]};
   }
   throw Error('Unexpected SQL: '+sql);
  },release(){}
 };
 let claim;
 registerCasinoDaily({post(route,_auth,fn){assert.equal(route,'/api/casino/daily/claim');claim=fn;}},{connect:async()=>client},(_req,_res,next)=>next());
 async function invoke(rev=record.revision){
  let status=200,payload;
  const res={status(n){status=n;return this},set(){return this},json(v){payload=v;return this}};
  await claim({playerId:'vk:123456789',body:{revision:rev}},res);
  return {status,payload};
 }
 return {record,invoke,setDay:(v)=>{day=v}};
}
test('first gift credits once and advances revision',async()=>{
 const s=setup();const r=await s.invoke();
 assert.equal(r.status,200);assert.equal(r.payload.streak,1);
 assert.equal(s.record.save.coins,3200);assert.equal(s.record.save.chips,1650);
 assert.equal(s.record.save.xp,15);assert.equal(s.record.revision,6);
 const duplicate=await s.invoke();assert.equal(duplicate.payload.alreadyClaimed,true);
 assert.equal(s.record.save.coins,3200);assert.equal(s.record.revision,6);
});
test('consecutive calendar days increase streak',async()=>{
 const s=setup({lastGift:'2026-11-22',giftStreak:4});
 const r=await s.invoke();assert.equal(r.payload.streak,5);
 assert.equal(s.record.save.giftBestStreak,5);
});
test('gap resets current streak, but never historical best',async()=>{
 const s=setup({lastGift:'2026-11-18',giftStreak:6});
 const r=await s.invoke();assert.equal(r.payload.streak,1);
 assert.equal(s.record.save.giftBestStreak,6);
});
test('stale revision cannot credit a second payment',async()=>{
 const s=setup();await s.invoke();const old=await s.invoke(5);
 assert.equal(old.status,409);assert.equal(old.payload.error,'REVISION_CONFLICT');
 assert.equal(s.record.save.coins,3200);
});
test('day seven receives one-time weekly bonus',async()=>{
 const s=setup({lastGift:'2026-11-22',giftStreak:6});
 const r=await s.invoke();assert.equal(r.payload.streak,7);
 assert.equal(r.payload.coins,1000);assert.equal(r.payload.chips,1100);
});

test('unfinished game blocks daily claim without changing progress',async()=>{
 const s=setup();s.record.save.pendingMiniRound={kind:'server-card'};
 const before=structuredClone(s.record);const r=await s.invoke();
 assert.equal(r.status,409);assert.equal(r.payload.error,'UNFINISHED_GAME');
 assert.deepEqual(s.record,before);
});
test('balance overflow rejects daily reward without changing progress',async()=>{
 const s=setup({coins:Number.MAX_SAFE_INTEGER});const before=structuredClone(s.record);
 const r=await s.invoke();assert.equal(r.status,409);assert.equal(r.payload.error,'BALANCE_LIMIT');
 assert.deepEqual(s.record,before);
});
