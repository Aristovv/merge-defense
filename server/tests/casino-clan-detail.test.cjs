'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const server=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
test('clan profiles are read only and require verified VK launch',()=>{
 const from=server.indexOf("app.get('/api/casino/clans/:id',requireAuth");
 const to=server.indexOf("app.post('/api/casino/clans/create'",from);
 assert.ok(from>0&&to>from);
 const detail=server.slice(from,to);
 assert.match(detail,/WHERE c\.id=\$1/);
 assert.match(detail,/WHERE m\.clan_id=\$1/);
 assert.match(detail,/FROM lucky_clan_transactions WHERE clan_id=\$1/);
 assert.match(detail,/vkMemberProfiles\(members\.rows\)/);
 assert.match(detail,/communityUrl:'https:\/\/vk\.com\/club'/);
 assert.doesNotMatch(detail,/UPDATE |DELETE |INSERT INTO|casino_city_saves/);
});
test('ranking cards open a clan without leaving the leaderboard tab',()=>{
 assert.match(client,/data-clan-top-view/);
 assert.match(client,/openClanFromTop/);
 assert.match(client,/topSelectedClan/);
 assert.match(client,/data-clan-top-back/);
 assert.match(client,/api\('\/'\+n\)/);
});
test('clan details link to VK group and individual member profiles',()=>{
 assert.match(client,/Открыть сообщество клана VK/);
 assert.match(client,/m\.profileUrl/);
 assert.match(client,/m\.profileName/);
 assert.match(client,/m\.profileAvatar/);
 assert.match(client,/rel="noopener noreferrer"/);
 assert.match(client,/target="_blank"/);
 assert.match(client,/Уровни и развитие/);
 assert.match(client,/Состав клана/);
 assert.match(client,/Казна/);
});
