const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function routeRecorder(){
 const routes=new Map();
 const app={get:(url,...fn)=>routes.set('GET '+url,fn.at(-1)),post:(url,...fn)=>routes.set('POST '+url,fn.at(-1))};
 return {app,routes};
}
function response(){
 const res={statusCode:200,body:null,headers:{}};
 res.status=n=>{res.statusCode=n;return res};
 res.set=(key,value)=>{res.headers[key]=value;return res};
 res.json=value=>{res.body=value;return res};
 return res;
}
test('clan endpoints use device group selection and server-side verified creation',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 registerLuckyClans(app,null,()=>{});
 assert.equal(typeof routes.get('GET /api/casino/clans'),'function');
 assert.equal(routes.has('POST /api/casino/clans/admin-groups'),false);
 assert.equal(routes.has('GET /api/casino/clans/group'),false);
 for(const url of ['create','join','leave','daily','deposit','upgrade','role','kick'])
  assert.equal(typeof routes.get('POST /api/casino/clans/'+url),'function');
});
test('every clan upgrade level has a distinct SVG scene',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../../clan-scenes.js'),'utf8');
 const context={window:{}};
 vm.runInNewContext(script,context,{timeout:1000});
 for(const kind of ['headquarters','wall']){
  const render=context.window.LuckyClanScene[kind];
  assert.equal(typeof render,'function');
  const scenes=Array.from({length:50},(_,i)=>render(i+1));
  assert.equal(new Set(scenes).size,50,kind+' should change at every level');
  assert.ok(scenes.every(s=>s.startsWith('<svg')&&s.endsWith('</svg>')));
 }
});

test('50-level coin prices and 5-vote milestones are stable',async()=>{
 const {upgradeCost,PREMIUM_LEVELS}=await import('../casino-clans.js');
 assert.deepEqual([...PREMIUM_LEVELS.headquarters],[5,10,15,20,30,40]);
 assert.deepEqual([...PREMIUM_LEVELS.wall],[5,10,15,20,30,40]);
 assert.equal(upgradeCost('headquarters',1),5000);
 assert.equal(upgradeCost('wall',1),3500);
 assert.equal(upgradeCost('headquarters',49),1765000);
 assert.equal(upgradeCost('wall',49),1235500);
 for(const kind of ['headquarters','wall']){
  const regular=[];
  for(let level=1;level<50;level++){
   const cost=upgradeCost(kind,level);
   assert.ok(Number.isSafeInteger(cost)&&cost>0&&cost%100===0);
   if(level>1)assert.ok(cost>=upgradeCost(kind,level-1));
   if(!PREMIUM_LEVELS[kind].includes(level+1))regular.push(cost);
  }
  assert.equal(regular.reduce((a,b)=>a+b,0),kind==='headquarters'?14542200:10180000);
 }
});
test('5-vote clan construction permit uses signed payment product catalog',()=>{
 const {goods}=require('../casino-payments.cjs');
 assert.equal(goods.clan_build_permit.price,5);
 assert.equal(goods.clan_build_permit.clanPermit,1);
 assert.equal(typeof goods.clan_build_permit.id,'number');
});

test('signed community context only accepts same-group administrator, never editor',async()=>{
 const {verifiedCommunityLaunch}=await import('../casino-clans.js');
 const req=(group,role)=>({header(name){assert.equal(name,'X-VK-Launch-Params');return new URLSearchParams({vk_group_id:String(group),vk_viewer_group_role:role,vk_user_id:'101'}).toString()}});
 // Must be used strictly behind requireAuth which verifies VK HMAC launch signature.
 assert.equal(verifiedCommunityLaunch(req(243634230,'admin'),243634230),true);
 assert.equal(verifiedCommunityLaunch(req(243634230,'admin'),243634231),false);
 assert.equal(verifiedCommunityLaunch(req(243634230,'editor'),243634230),false);
 assert.equal(verifiedCommunityLaunch(req(243634230,'moder'),243634230),false);
 assert.equal(verifiedCommunityLaunch(req(243634230,'member'),243634230),false);
 assert.equal(verifiedCommunityLaunch({header:()=>''},243634230),false);
});


test('clan creation relies on signed admin launch or VK-issued group-specific proof',async()=>{
 const fs=require('node:fs');
 const path=require('node:path');
 const server=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
 const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
 assert.match(server,/api\.vk\.com\/method\/groups\.getById/);
 assert.match(server,/req\.body\?\.communityToken/);
 assert.match(server,/verifiedCommunityLaunch\(req,req\.body\?\.groupId\)/);
 assert.match(server,/Number\(groups\[0\]\?\.id\)!==requested/);
 assert.match(client,/VKWebAppGetCommunityToken/);
 assert.match(client,/scope:'messages'/);
 assert.doesNotMatch(server,/groups\.getCallbackConfirmationCode/);
 assert.match(client,/communityToken:proof/);
 assert.doesNotMatch(server,/userVK\('groups\.get'/);
 assert.doesNotMatch(client,/vkUserToken:proof/);
});

test('member removal requires owner authority, row locks, and cannot delete leader',()=>{
 const server=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
 const fragment=server.slice(server.indexOf("app.post('/api/casino/clans/kick'"),server.indexOf("app.post('/api/casino/clans/role'"));
 assert.match(fragment,/SELECT clan_id,role FROM lucky_clan_members WHERE player_id=\$1 FOR UPDATE/);
 assert.match(fragment,/SELECT id,owner_id FROM lucky_clans WHERE id=\$1 FOR UPDATE/);
 assert.match(fragment,/clan\.rows\[0\]\.owner_id!==req\.playerId/);
 assert.match(fragment,/member\.rows\[0\]\.role==='owner'/);
 assert.match(fragment,/DELETE FROM lucky_clan_members/);
 assert.doesNotMatch(fragment,/UPDATE lucky_clans SET coins/);
 assert.doesNotMatch(fragment,/UPDATE public\.casino_city_saves/);
});
test('member roster lists lifetime contribution and keeps owner-only removal UI',()=>{
 const server=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
 const client=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
 assert.match(server,/SUM\(t\.coins\) FILTER\(WHERE t\.action='deposit'\)/);
 assert.match(server,/COUNT\(t\.id\) FILTER\(WHERE t\.action='deposit'\)/);
 assert.match(client,/data-clan="kick"/);
 assert.match(client,/c\.role==='owner'&&m\.role!=='owner'/);
 assert.match(client,/window\.confirm\('Исключить участника/);
});
