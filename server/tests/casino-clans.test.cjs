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
test('clan endpoints register an authenticated admin community picker',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 const auth=()=>{};
 registerLuckyClans(app,null,auth);
 assert.equal(typeof routes.get('GET /api/casino/clans'),'function');
 assert.equal(routes.has('GET /api/casino/clans/group'),false,'legacy manual picker removed');
 for(const url of ['admin-groups','create','join','leave','daily','upgrade','role'])
  assert.equal(typeof routes.get('POST /api/casino/clans/'+url),'function');
});
test('admin community picker rejects missing user token without contacting VK',async()=>{
 const {registerLuckyClans}=await import('../casino-clans.js');
 const {app,routes}=routeRecorder();
 registerLuckyClans(app,null,()=>{});
 const route=routes.get('POST /api/casino/clans/admin-groups');
 const res=response();
 await route({playerId:'vk:123',body:{}},res);
 assert.equal(res.statusCode,403);
 assert.equal(typeof res.body.error,'string');
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
