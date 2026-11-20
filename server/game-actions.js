import crypto from 'node:crypto';

const rarities=[1,1.35,1.85,2.6];
const publicFields='player_id,coins,gems,hp,wave,summons,pity,kills,wins,power,income,towers,achievements,discovered,revision,updated_at';
const error=(status,code)=>Object.assign(new Error(code),{status,code});
const validSlot=n=>Number.isInteger(n)&&n>=0&&n<12;
const asInt=n=>Number.isInteger(n)?n:null;
const choose=n=>crypto.randomInt(n);
function makeAction(row,{type,from,to,slot}){
 const towers=Array.isArray(row.towers)?structuredClone(row.towers):[];
 const discovered=Array.isArray(row.discovered)?[...row.discovered]:[];
 let coins=Number(row.coins),summons=row.summons,pity=row.pity;
 const occupied=s=>towers.findIndex(t=>t.slot===s);
 let result={};
 if(type==='summon'){
  const price=Math.min(480,40+12*Math.floor(summons/3));
  if(towers.length>=12)throw error(409,'BOARD_FULL');
  if(coins<price)throw error(409,'NOT_ENOUGH_COINS');
  const free=Array.from({length:12},(_,i)=>i).filter(i=>occupied(i)<0);
  const chosen=free[choose(free.length)],element=choose(4);
  const roll=choose(10000)/100;
  const guaranteed=choose(3000)/100;
  const rarity=pity>=9?(guaranteed<1?3:guaranteed<7?2:1):roll<1?3:roll<7?2:roll<30?1:0;
  const tower={slot:chosen,type:element,rarity,level:1,cd:0};
  towers.push(tower);coins-=price;summons++;pity=rarity===0?pity+1:0;
  const key=element+':'+rarity;
  if(!discovered.includes(key))discovered.push(key);
  result={tower,price};
 }else if(type==='merge'){
  if(!validSlot(from)||!validSlot(to)||from===to)throw error(400,'INVALID_SLOT');
  const a=occupied(from),b=occupied(to);
  if(a<0||b<0)throw error(409,'TOWER_NOT_FOUND');
  const source=towers[a],target=towers[b];
  if(source.type!==target.type||source.level!==target.level||source.rarity!==target.rarity)throw error(409,'INCOMPATIBLE_TOWERS');
  if(source.level>=30)throw error(409,'MAX_LEVEL');
  target.level++;towers.splice(a,1);
  result={slot:to,level:target.level};
 }else if(type==='move'){
  if(!validSlot(from)||!validSlot(to)||from===to)throw error(400,'INVALID_SLOT');
  const a=occupied(from);
  if(a<0||occupied(to)>=0)throw error(409,'INVALID_MOVE');
  towers[a].slot=to;result={slot:to};
 }else if(type==='sell'){
  if(!validSlot(slot))throw error(400,'INVALID_SLOT');
  const at=occupied(slot);
  if(at<0)throw error(409,'TOWER_NOT_FOUND');
  const t=towers[at];
  const value=Math.round(24*Math.pow(2.05,t.level-1)*rarities[t.rarity]);
  towers.splice(at,1);coins+=value;result={coins:value};
 }else throw error(400,'UNKNOWN_ACTION');
 if(!Number.isSafeInteger(coins)||coins<0)throw error(409,'INVALID_BALANCE');
 return {towers,discovered,coins,summons,pity,result};
}
export function gameplayAction(pool){
 return async(req,res)=>{
  const body=req.body||{},revision=asInt(body.revision),id=req.playerId;
  if(revision===null||revision<1)return res.status(400).json({error:'REVISION_REQUIRED'});
  const client=await pool.connect().catch(()=>null);
  if(!client)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  try {
   await client.query('BEGIN');
   await client.query('INSERT INTO players(player_id) VALUES($1) ON CONFLICT DO NOTHING',[id]);
   const found=await client.query('SELECT '+publicFields+' FROM players WHERE player_id=$1 FOR UPDATE',[id]);
   const row=found.rows[0];
   if(Number(row.revision)!==revision)throw error(409,'REVISION_CONFLICT');
   const change=makeAction(row,body);
   const updated=await client.query(
    'UPDATE players SET towers=$2::jsonb,discovered=$3::jsonb,coins=$4,summons=$5,pity=$6,revision=revision+1,updated_at=NOW() WHERE player_id=$1 RETURNING '+publicFields,
    [id,JSON.stringify(change.towers),JSON.stringify(change.discovered),change.coins,change.summons,change.pity]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');
   return res.json({player:updated.rows[0],result:change.result});
  }catch(e){
   await client.query('ROLLBACK').catch(()=>{});
   const status=e.status||503;
   if(!e.status)console.error('game action failed',e.code||e.message);
   return res.status(status).json({error:e.status?e.code:'DATABASE_UNAVAILABLE'});
  }finally{client.release()}
 };
}
