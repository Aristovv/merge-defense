// Signed-VK-account cloud storage for the existing single-player game.
// Intentionally NOT the authoritative paid-gems, purchases, or PvP economy ledger.
const sql=`CREATE TABLE IF NOT EXISTS game_saves (
 player_id TEXT PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
 save JSONB NOT NULL,
 revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;
let ready;
function ensureTable(pool){
 if(!pool)return Promise.reject(new Error('DATABASE_NOT_CONFIGURED'));
 if(!ready)ready=pool.query(sql).catch(e=>{ready=null;throw e});
 return ready;
}
const validInt=(x,min,max)=>Number.isSafeInteger(x)&&x>=min&&x<=max;
function normalizeSave(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 if(input.gameVersion===89)return normalizeHeroSave(input);
 const num=(key,min,max)=>validInt(input[key],min,max)?input[key]:null;
 const scalar={
  coins:num('coins',0,Number.MAX_SAFE_INTEGER),gems:num('gems',0,Number.MAX_SAFE_INTEGER),
  hp:num('hp',0,20),wave:num('wave',1,10),kills:num('kills',0,Number.MAX_SAFE_INTEGER),
  summons:num('summons',0,Number.MAX_SAFE_INTEGER),power:num('power',0,100),
  income:num('income',0,100),pity:num('pity',0,1000000),bosses:num('bosses',0,Number.MAX_SAFE_INTEGER),
  wins:num('wins',0,Number.MAX_SAFE_INTEGER),seasonClears:num('seasonClears',0,Number.MAX_SAFE_INTEGER),
  bestLevel:num('bestLevel',1,30)
 };
 if(Object.values(scalar).some(v=>v===null))return null;
 if(!Array.isArray(input.towers)||input.towers.length>12)return null;
 const occupied=new Set();
 const towers=[];
 for(const t of input.towers){
  if(!t||typeof t!=='object'||!validInt(t.slot,0,11)||!validInt(t.type,0,3)||!validInt(t.level,1,30)||!validInt(t.rarity,0,3)||occupied.has(t.slot))return null;
  occupied.add(t.slot);towers.push({slot:t.slot,type:t.type,rarity:t.rarity,level:t.level,cd:0});
 }
 const cleanArray=(value,max,regex)=>{
  if(!Array.isArray(value)||value.length>max||value.some(v=>typeof v!=='string'||!regex.test(v)))return null;
  return [...new Set(value)];
 };
 const achievements=cleanArray(input.achievements,60,/^[a-z0-9:_-]{1,50}$/);
 const discovered=cleanArray(input.discovered,16,/^[0-3]:[0-3]$/);
 if(!achievements||!discovered)return null;
 let daily=null;
 if(input.daily!==null&&input.daily!==undefined){
  const a=input.daily;
  if(!a||typeof a!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')||typeof a.claimed!=='boolean')return null;
  if(!a.tasks||typeof a.tasks!=='object')return null;
  const tasks={};
  for(const k of ['summons','wins','kills']){
   if(!validInt(a.tasks[k],0,10000000))return null;
   tasks[k]=a.tasks[k];
  }
  const rewards=cleanArray(a.rewards,3,/^(summons|wins|kills)$/);
  if(!rewards)return null;
  daily={date:a.date,claimed:a.claimed,tasks,rewards};
 }
 return {...scalar,towers,achievements,discovered,daily,battleSpeed:[1,2,3].includes(input.battleSpeed)?input.battleSpeed:1};
}
function normalizeHeroSave(input){
 const s=input.state;
 if(!s||typeof s!=='object'||Array.isArray(s))return null;
 const int=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 if(!int(s.wave,1,10)||!int(s.hp,0,20)||!int(s.coins,0,1000000000)||!int(s.gems,0,10000000)||!int(s.mana,0,9999)||!int(s.upgrade,0,5)||!int(s.wins,0,10000000)||!int(s.kills,0,100000000)||!int(s.highest,1,10))return null;
 const ids=(a,max,limit)=>Array.isArray(a)&&a.length<=limit&&a.every(v=>int(v,0,max))&&new Set(a).size===a.length;
 if(!Array.isArray(s.deck)||s.deck.length!==5||!ids(s.deck,11,5))return null;
 if(!Array.isArray(s.unlocked)||s.unlocked.length>12||!ids(s.unlocked,11,12)||s.deck.some(v=>!s.unlocked.includes(v)))return null;
 if(!Array.isArray(s.board)||s.board.length!==15)return null;
 const board=[];
 for(const t of s.board){
  if(t===null){board.push(null);continue}
  if(!t||typeof t!=='object'||!int(t.hero,0,11)||!int(t.rank,1,7))return null;
  board.push({hero:t.hero,rank:t.rank});
 }
 return {gameVersion:89,state:{wave:s.wave,hp:s.hp,coins:s.coins,gems:s.gems,mana:s.mana,deck:[...s.deck],unlocked:[...s.unlocked],board,upgrade:s.upgrade,wins:s.wins,kills:s.kills,highest:s.highest}};
}
function failure(res,e){
 console.error('[cloud save] database error',e.code||e.message);
 return res.status(503).json({error:'CLOUD_UNAVAILABLE'});
}
export async function cloudSaveGet(pool,req,res){
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 try{
  await ensureTable(pool);
  const found=await pool.query('SELECT save,revision,updated_at FROM game_saves WHERE player_id=$1',[req.playerId]);
  const row=found.rows[0];
  res.set('Cache-Control','no-store');
  return res.json(row?{save:row.save,revision:Number(row.revision),updatedAt:row.updated_at}:{save:null,revision:0,updatedAt:null});
 }catch(e){return failure(res,e)}
}
export async function cloudSavePut(pool,req,res){
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 const expected=req.body?.revision,save=normalizeSave(req.body?.save);
 if(!validInt(expected,0,Number.MAX_SAFE_INTEGER)||!save)return res.status(400).json({error:'INVALID_CLOUD_SAVE'});
 let client;
 try{
  await ensureTable(pool);
  client=await pool.connect();await client.query('BEGIN');
  await client.query('INSERT INTO players(player_id) VALUES($1) ON CONFLICT DO NOTHING',[req.playerId]);
  const result=await client.query('SELECT revision FROM game_saves WHERE player_id=$1 FOR UPDATE',[req.playerId]);
  const actual=result.rows.length?Number(result.rows[0].revision):0;
  if(actual!==expected){
   await client.query('ROLLBACK');
   return res.status(409).json({error:'CLOUD_REVISION_CONFLICT',revision:actual});
  }
  const json=JSON.stringify(save);
  const updated=actual===0?
   await client.query('INSERT INTO game_saves(player_id,save,revision) VALUES($1,$2::jsonb,1) RETURNING revision,updated_at',[req.playerId,json]):
   await client.query('UPDATE game_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE player_id=$1 RETURNING revision,updated_at',[req.playerId,json]);
  await client.query('COMMIT');
  res.set('Cache-Control','no-store');
  return res.json({ok:true,revision:Number(updated.rows[0].revision),updatedAt:updated.rows[0].updated_at});
 }catch(e){
  if(client)await client.query('ROLLBACK').catch(()=>{});
  if(e.code==='23505')return res.status(409).json({error:'CLOUD_REVISION_CONFLICT'});
  return failure(res,e);
 }finally{client?.release()}
}
