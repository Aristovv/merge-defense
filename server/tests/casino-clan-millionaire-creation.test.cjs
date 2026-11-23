'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Millionaire path verifies selected group in token-authorized admin list',async()=>{
 const {verifyUserAdminGroup}=await import('../casino-clans.js');
 const old=global.fetch,called=[];
 global.fetch=async(url,{body})=>{
  const method=String(url).split('/').at(-1),args=new URLSearchParams(body);
  called.push({method,args});
  return {ok:true,json:async()=>({response:{items:[{id:243635589,name:'Группа игрока',photo_200:'https://sun1.userapi.com/abc.jpg',is_closed:0}]}})};
 };
 try{
  const group=await verifyUserAdminGroup('vk:876543211',243635589,'vk1.test_token_0123456789');
  assert.equal(group.name,'Группа игрока');
  assert.equal(group.groupId,243635589);
  assert.deepEqual(called.map(c=>c.method),['groups.get']);
  assert.equal(called[0].args.get('filter'),'admin');
  assert.equal(called[1].args.get('access_token'),'vk1.test_token_0123456789');
 }finally{global.fetch=old}
});

test('token that does not list selected group as admin cannot create clan',async()=>{
 const {verifyUserAdminGroup}=await import('../casino-clans.js');
 const old=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>({response:{items:[{id:99999999,name:'Not chosen',photo_200:'https://sun1.userapi.com/abc.jpg'}]}})});
 try{
  await assert.rejects(verifyUserAdminGroup('vk:876543211',243635589,'vk1.test_token_0123456789'),/не администратор выбранного сообщества/);
 }finally{global.fetch=old}
});

test('IP-bound user token triggers safe group-token fallback rather than creating a clan',async()=>{
 const {verifyUserAdminGroup}=await import('../casino-clans.js');
 const old=global.fetch;
 global.fetch=async()=>({ok:true,json:async()=>({error:{error_code:5,error_msg:'User authorization failed: IP address'}})});
 try{
  await assert.rejects(verifyUserAdminGroup('vk:876543211',243635589,'vk1.test_token_0123456789'),error=>error.status===409&&error.message==='VK_USER_TOKEN_NEEDS_COMMUNITY');
 }finally{global.fetch=old}
});

test('clan UI first uses Millionaire token path and falls back to VK community permission',()=>{
 const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
 assert.match(client,/await api\('\/create',\{groupId,userVKToken:userToken\}\)/);
 assert.match(client,/VK_USER_TOKEN_NEEDS_COMMUNITY/);
 assert.match(client,/await installIntoCommunity\(\)/);
 assert.match(client,/await getCommunityProof\(groupId\)/);
 assert.match(server,/req\.body\.userVKToken/);
 assert.match(server,/await verifyUserAdminGroup\(req\.playerId/);
 assert.doesNotMatch(server,/claim===true/);
});

test('VK group signed launches skip unnecessary native dialogs and provide recovery link',()=>{
 const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
 const start=client.indexOf("if(action==='create'){\n    const groupId=Number(preview.groupId);");
 const end=client.indexOf("}else{\n    const body=action==='join'",start);
 assert.ok(start>0&&end>start);
 const flow=client.slice(start,end);
 assert.match(flow,/if\(signedCommunityRole\(groupId\)\)/);
 assert.match(flow,/await api\('\/create',\{groupId\}\)/);
 assert.match(flow,/await api\('\/create',\{groupId,userVKToken:userToken\}\)/);
 assert.match(flow,/await getCommunityProof\(groupId\)/);
 assert.doesNotMatch(flow,/await installIntoCommunity\(\)/);
 assert.match(client,/Открыть сообщество VK/);
 assert.match(client,/rel="noopener noreferrer"/);
});
