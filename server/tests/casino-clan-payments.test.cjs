'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {registerCasinoPayments,goods}=require('../casino-payments.cjs');

function signed(body,secret){
 const raw=Object.keys(body).sort().map(key=>key+'='+body[key]).join('')+secret;
 return {...body,sig:crypto.createHash('md5').update(raw).digest('hex')};
}
function fakeRes(){
 return {code:200,payload:null,status(value){this.code=value;return this},
 set(){return this},json(value){this.payload=value;return this}};
}
test('clan permit is an explicit product priced at 5 VK votes',()=>{
 assert.equal(goods.clan_build_permit.price,5);
 assert.equal(goods.clan_build_permit.clanPermit,1);
 assert.equal(typeof goods.clan_build_permit.id,'number');
});
test('signed VK get_item advertises permit without granting entitlement',async()=>{
 const oldEnabled=process.env.LUCKY_VK_PAYMENTS_ENABLED,oldSecret=process.env.VK_PAYMENTS_SECRET;
 const oldAppId=process.env.VK_APP_ID;
 process.env.LUCKY_VK_PAYMENTS_ENABLED='1';
 process.env.VK_PAYMENTS_SECRET='a-secret-only-for-test';
 delete process.env.VK_APP_ID;
 try{
  const handlers=new Map(),app={
   get:(route,...callbacks)=>handlers.set('GET '+route,callbacks.at(-1)),
   post:(route,...callbacks)=>handlers.set('POST '+route,callbacks.at(-1))
  };
  const pool={connect(){throw Error('get_item must never touch the database')}};
  registerCasinoPayments(app,pool);
  const route=handlers.get('POST /api/casino/payments/callback');
  const payload=signed({notification_type:'get_item',item:'clan_build_permit'},process.env.VK_PAYMENTS_SECRET);
  const res=fakeRes();
  await route({body:payload},res);
  assert.equal(res.code,200);
  assert.equal(res.payload.response.price,5);
  assert.equal(res.payload.response.item_id,goods.clan_build_permit.id);
  const denied=fakeRes();
  await route({body:{...payload,sig:'00000000000000000000000000000000'}},denied);
  assert.ok(denied.payload.error,'An invalid signature must not return a valid item');
  const testOrder=fakeRes();
  await route({body:signed({notification_type:'order_status_change_test',item:'clan_build_permit'},process.env.VK_PAYMENTS_SECRET)},testOrder);
  assert.ok(testOrder.payload.error,'VK test orders must be disabled');
 }finally{
  for(const [name,value] of [['LUCKY_VK_PAYMENTS_ENABLED',oldEnabled],['VK_PAYMENTS_SECRET',oldSecret],['VK_APP_ID',oldAppId]]){
   if(value===undefined)delete process.env[name];
   else process.env[name]=value;
  }
 }
});

test('a signed clan permit purchase credits once and never modifies player coin save',async()=>{
 const envKeys=['LUCKY_VK_PAYMENTS_ENABLED','VK_PAYMENTS_SECRET','VK_APP_ID'];
 const envOld=Object.fromEntries(envKeys.map(key=>[key,process.env[key]]));
 process.env.LUCKY_VK_PAYMENTS_ENABLED='1';
 process.env.VK_PAYMENTS_SECRET='unit-test-secret-coin-safety';
 delete process.env.VK_APP_ID;
 let credited=0,receipt=null,saveUpdates=0;
 const client={
  async query(sql,params=[]){
   if(sql.startsWith('SELECT app_order_id::text')){
    return receipt?{rowCount:1,rows:[{id:'501',vk:'123',item_key:'clan_build_permit'}]}:{rowCount:0,rows:[]};
   }
   if(sql.startsWith('SELECT save FROM public.casino_city_saves'))
    return {rowCount:1,rows:[{save:{coins:2500}}]};
   if(sql.startsWith('INSERT INTO public.casino_city_paid_orders')){
    receipt=true;return {rowCount:1,rows:[{id:'501'}]};
   }
   if(sql.startsWith('INSERT INTO lucky_clan_permits')){credited++;return {rowCount:1,rows:[]}};
   if(sql.startsWith('UPDATE public.casino_city_saves')){saveUpdates++;return {rowCount:1,rows:[]}};
   return {rowCount:0,rows:[]};
  },
  release(){}
 };
 try{
  const handlers=new Map(),app={
   get:(route,...callbacks)=>handlers.set('GET '+route,callbacks.at(-1)),
   post:(route,...callbacks)=>handlers.set('POST '+route,callbacks.at(-1))
  };
  registerCasinoPayments(app,{connect:async()=>client});
  const body=signed({
   notification_type:'order_status_change',status:'chargeable',
   receiver_id:'123',order_id:'499',item_id:String(goods.clan_build_permit.id),
   item_price:'5'
  },process.env.VK_PAYMENTS_SECRET);
  const callback=handlers.get('POST /api/casino/payments/callback');
  const first=fakeRes();await callback({body},first);
  assert.equal(first.payload.response.app_order_id,501);
  assert.equal(credited,1);
  assert.equal(saveUpdates,0,'Permits must not be placed in player-controlled cloud saves');
  const again=fakeRes();await callback({body},again);
  assert.equal(again.payload.response.app_order_id,501);
  assert.equal(credited,1,'Replayed VK order must not create another permit');
 }finally{
  for(const key of envKeys){if(envOld[key]===undefined)delete process.env[key];else process.env[key]=envOld[key]}
 }
});
