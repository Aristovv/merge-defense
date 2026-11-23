'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('clan roster renders a VK link, name and avatar instead of a raw account ID',()=>{
 const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
 assert.match(client,/class="lc-clan-person"/);
 assert.match(client,/class="lc-clan-person-photo"/);
 assert.match(client,/m\.profileName/);
 assert.match(client,/m\.profileAvatar/);
 assert.match(client,/m\.profileUrl/);
 assert.match(client,/rel="noopener noreferrer"/);
 assert.match(client,/target="_blank"/);
 assert.doesNotMatch(client,/esc\(m\.playerId\.replace\('vk:','VK '\)\)/);
});
test('server reads public VK profiles in one batch with server-only token',async()=>{
 const {vkMemberProfiles}=await import('../casino-clans.js');
 const old=global.fetch;
 let count=0,requested;
 global.fetch=async(url,options)=>{
  count++;
  assert.equal(url,'https://api.vk.com/method/users.get');
  requested=new URLSearchParams(options.body);
  return {ok:true,json:async()=>({response:[
   {id:573921001,first_name:'Иван',last_name:'Тестовый',photo_100:'https://sun1.userapi.com/avatar.jpg'},
   {id:573921002,first_name:'Мария',last_name:'Тестовая',photo_100:'http://bad.example/avatar.jpg'}
  ]})};
 };
 try{
  const profiles=await vkMemberProfiles([{playerId:'vk:573921001',role:'owner'},{playerId:'vk:573921002',role:'member'}],'test-service-token');
  assert.equal(count,1);
  assert.equal(requested.get('user_ids'),'573921001,573921002');
  assert.equal(requested.get('access_token'),'test-service-token');
  assert.equal(profiles[0].profileName,'Иван Тестовый');
  assert.equal(profiles[0].profileAvatar,'https://sun1.userapi.com/avatar.jpg');
  assert.equal(profiles[0].profileUrl,'https://vk.com/id573921001');
  assert.equal(profiles[1].profileName,'Мария Тестовая');
  assert.equal(profiles[1].profileAvatar,'');
  assert.equal(profiles[1].profileUrl,'https://vk.com/id573921002');
 }finally{global.fetch=old}
});
test('VK outage does not block reading the clan or leak service credentials',async()=>{
 const {vkMemberProfiles}=await import('../casino-clans.js');
 const old=global.fetch;
 global.fetch=async()=>{throw Error('VK unavailable')};
 try{
  const profiles=await vkMemberProfiles([{playerId:'vk:573921003',role:'member'}],'test-service-token');
  assert.equal(profiles[0].profileName,'Профиль VK');
  assert.equal(profiles[0].profileUrl,'https://vk.com/id573921003');
  assert.equal(profiles[0].profileAvatar,'');
  assert.ok(!('token' in profiles[0]));
 }finally{global.fetch=old}
});
