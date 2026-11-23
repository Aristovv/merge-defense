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
test('clan endpoints require authenticated route middleware',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 const auth=()=>{};
 registerLuckyClans(app,null,auth);
 for(const url of ['/api/casino/clans','/api/casino/clans/group']){
  const fn=routes.get('GET '+url);
  assert.equal(typeof fn,'function');
 }
 for(const url of ['create','join','leave','daily','upgrade','role'])
  assert.equal(typeof routes.get('POST /api/casino/clans/'+url),'function');
});
test('VK group URL is validated before contacting VK',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 registerLuckyClans(app,null,()=>{});
 const get=routes.get('GET /api/casino/clans/group');
 for(const bad of ['http://evil.example/club123','https://vk.com/club0','javascript:alert(1)','https://vk.com/club3?x=1','']){
  const res=response();await get({query:{url:bad}},res);
  assert.equal(res.statusCode,400,'Should reject '+bad);
  assert.equal(typeof res.body.error,'string');
 }
});
test('group lookup fails closed if server token is absent',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 registerLuckyClans(app,null,()=>{});
 const old=process.env.VK_GROUP_SERVICE_TOKEN;
 delete process.env.VK_GROUP_SERVICE_TOKEN;
 try{
  const res=response();
  await routes.get('GET /api/casino/clans/group')({query:{url:'https://vk.com/club1234'}},res);
  assert.equal(res.statusCode,503);
 }finally{
  if(old===undefined)delete process.env.VK_GROUP_SERVICE_TOKEN;
  else process.env.VK_GROUP_SERVICE_TOKEN=old;
 }
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
