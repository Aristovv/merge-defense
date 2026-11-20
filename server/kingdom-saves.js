// Separate, signed-VK-account saves for Kingdoms.
// The original /api/cloud/save and its players' Merge Defense data remain untouched.
const schema = 'CREATE TABLE IF NOT EXISTS kingdom_saves (player_id TEXT PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE, save JSONB NOT NULL, revision BIGINT NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())';
let init;
const valid=(n,min,max)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
function clean(input){
 if(!input||input.gameVersion!==120||!input.state||typeof input.state!=='object'||Array.isArray(input.state))return null;
 const s=input.state,resources=['gold','wood','stone','crystal','food'];
 for(const k of resources)if(!valid(s[k],0,1e9))return null;
 for(const k of ['castle','level','xp','energy','wins','defenses','bosses','days'])if(!valid(s[k],k==='castle'||k==='level'?1:0,1e8))return null;
 if(!valid(s.updated,0,1e16)||!valid(s.lastDaily,0,1e16))return null;
 if(!Array.isArray(s.buildings)||s.buildings.length>24||!Array.isArray(s.heroes)||s.heroes.length>12||!Array.isArray(s.zones)||s.zones.length>5||!Array.isArray(s.research)||s.research.length>6||!Array.isArray(s.expeditions)||s.expeditions.length>3)return null;
 const tiles=new Set();
 for(const b of s.buildings){if(!b||!valid(b.tile,0,24)||!valid(b.type,0,15)||!valid(b.level,1,20)||tiles.has(b.tile))return null;tiles.add(b.tile)}
 const ids=new Set();
 for(const h of s.heroes){if(!h||!valid(h.id,0,11)||!valid(h.level,1,100)||!valid(h.star,1,5)||ids.has(h.id))return null;ids.add(h.id)}
 if(s.zones.some(v=>!valid(v,0,4))||s.research.some(v=>!valid(v,0,5))||new Set(s.zones).size!==s.zones.length||new Set(s.research).size!==s.research.length)return null;
 for(const e of s.expeditions)if(!e||!valid(e.id,0,8)||!valid(e.ends,0,1e16)||!valid(e.power,0,1e9))return null;
 if(!valid(s.pendingDefense,0,1e8)||!valid(s.lastDefense,0,1e16))return null;
 return {gameVersion:120,state:{gold:s.gold,wood:s.wood,stone:s.stone,crystal:s.crystal,food:s.food,castle:s.castle,level:s.level,xp:s.xp,energy:s.energy,wins:s.wins,defenses:s.defenses,bosses:s.bosses,days:s.days,updated:s.updated,lastDaily:s.lastDaily,buildings:s.buildings.map(b=>({tile:b.tile,type:b.type,level:b.level})),heroes:s.heroes.map(h=>({id:h.id,level:h.level,star:h.star})),zones:[...s.zones],research:[...s.research],expeditions:s.expeditions.map(e=>({id:e.id,ends:e.ends,power:e.power})),pendingDefense:s.pendingDefense,lastDefense:s.lastDefense}};
}
async function ready(pool){if(!pool)throw Error('DATABASE_NOT_CONFIGURED');if(!init)init=pool.query(schema).catch(e=>{init=null;throw e});await init}
export async function kingdomGet(pool,req,res){
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 try{await ready(pool);const q=await pool.query('SELECT save,revision FROM kingdom_saves WHERE player_id=$1',[req.playerId]);res.set('Cache-Control','no-store');return res.json(q.rows[0]?{save:q.rows[0].save,revision:Number(q.rows[0].revision)}:{save:null,revision:0})}
 catch(e){console.error('[kingdom get]',e.code||e.message);return res.status(503).json({error:'KINGDOM_UNAVAILABLE'})}
}
export async function kingdomPut(pool,req,res){
 const expected=req.body?.revision,save=clean(req.body?.save);
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 if(!valid(expected,0,Number.MAX_SAFE_INTEGER)||!save)return res.status(400).json({error:'INVALID_KINGDOM_SAVE'});
 let client;
 try{await ready(pool);client=await pool.connect();await client.query('BEGIN');await client.query('INSERT INTO players(player_id) VALUES($1) ON CONFLICT DO NOTHING',[req.playerId]);
 const current=await client.query('SELECT revision FROM kingdom_saves WHERE player_id=$1 FOR UPDATE',[req.playerId]),actual=current.rows[0]?Number(current.rows[0].revision):0;
 if(actual!==expected){await client.query('ROLLBACK');return res.status(409).json({error:'REVISION_CONFLICT',revision:actual})}
 const result=actual===0?await client.query('INSERT INTO kingdom_saves(player_id,save,revision) VALUES ($1,$2::jsonb,1) RETURNING revision',[req.playerId,JSON.stringify(save)]):
 await client.query('UPDATE kingdom_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE player_id=$1 RETURNING revision',[req.playerId,JSON.stringify(save)]);
 await client.query('COMMIT');res.set('Cache-Control','no-store');return res.json({ok:true,revision:Number(result.rows[0].revision)});
 }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('[kingdom put]',e.code||e.message);return res.status(503).json({error:'KINGDOM_UNAVAILABLE'})}
 finally{client?.release()}
}