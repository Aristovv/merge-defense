'use strict';
// Isolated Casino City cloud saves. Browser state is not a secure payment ledger.
let ready;
async function ensure(pool){if(!pool)throw Error('DATABASE_UNAVAILABLE');if(!ready)ready=pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_saves(
 vk_id BIGINT PRIMARY KEY, save JSONB NOT NULL, revision BIGINT NOT NULL DEFAULT 1,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`).catch(e=>{ready=null;throw e});await ready}
const valid=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
function clean(s){
 if(!s||typeof s!=='object'||Array.isArray(s))return null;
 for(const k of ['coins','chips','vip','xp','plays','wins','best','earned'])if(!valid(s[k],0,Number.MAX_SAFE_INTEGER))return null;
 if(!valid(s.level,1,500)||s.wins>s.plays||!Array.isArray(s.buildings)||s.buildings.length!==14||s.buildings.some(x=>!valid(x,0,1000)))return null;
 const raw=JSON.stringify(s);if(Buffer.byteLength(raw,'utf8')>90000)return null;
 return JSON.parse(raw);
}
// Fail closed when a stale/default client tries to replace established progress.
// Administrative edits occur through separate authenticated endpoints and bump resetEpoch.
function regression(previous,next){
 const epoch=Number(previous.resetEpoch)||0;
 if((Number(next.resetEpoch)||0)!==epoch)return 'RESET_EPOCH_MISMATCH';
 for(const key of ['level','plays','wins','earned','best','giftBestStreak']){
  const a=Number(previous[key])||0,b=Number(next[key])||0;
  if(!Number.isFinite(b)||b<a)return 'PROGRESS_REGRESSION_'+key.toUpperCase();
 }
 if(Array.isArray(previous.buildings)&&Array.isArray(next.buildings)){
  if(previous.buildings.some((v,i)=>Number(next.buildings[i])<Number(v)))return 'BUILDING_REGRESSION';
 }
 const oldOutfits=previous.character33?.ownedOutfits;
 const newOutfits=next.character33?.ownedOutfits;
 if(Array.isArray(oldOutfits)&&oldOutfits.some(id=>!Array.isArray(newOutfits)||!newOutfits.includes(id)))return 'OUTFIT_OWNERSHIP_REGRESSION';
 if(typeof previous.lastGift==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(previous.lastGift)){
  if(typeof next.lastGift!=='string'||next.lastGift<previous.lastGift)return 'DAILY_GIFT_REGRESSION';
 }
 return null;
}
function id(req){const n=String(req.playerId||'').replace(/^vk:/,'');return /^[1-9][0-9]{0,18}$/.test(n)?n:null}
function registerCasinoSaves(app,pool,requireAuth){
 app.get('/api/casino/save',requireAuth,async(req,res)=>{
  try{await ensure(pool);const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
   const q=await pool.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1',[vk]);
   res.set('Cache-Control','no-store');res.json(q.rows[0]?{save:q.rows[0].save,revision:Number(q.rows[0].revision)}:{save:null,revision:0});
  }catch(e){console.error('casino save read',e.code||e.message);res.status(503).json({error:'SAVE_UNAVAILABLE'})}
 });
 app.put('/api/casino/save',requireAuth,async(req,res)=>{
  const save=clean(req.body?.save),revision=req.body?.revision;
  if(!save||!valid(revision,0,Number.MAX_SAFE_INTEGER))return res.status(400).json({error:'INVALID_SAVE'});
  const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  try{await ensure(pool);let result;
   if(revision===0){
    result=await pool.query('INSERT INTO public.casino_city_saves(vk_id,save) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING RETURNING revision::text AS revision',[vk,JSON.stringify(save)]);
   }else{
    // Lock the row so validation and revision increment are atomic.
    const client=await pool.connect();
    try{
     await client.query('BEGIN');
     const current=await client.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
     if(!current.rowCount||Number(current.rows[0].revision)!==revision){
      await client.query('ROLLBACK');
      return res.status(409).json({error:'REVISION_CONFLICT',revision:Number(current.rows[0]?.revision||0)});
     }
     const reason=regression(current.rows[0].save,save);
     if(reason){
      await client.query('ROLLBACK');
      console.warn('Casino progress regression blocked:',reason);
      return res.status(409).json({error:'PROGRESS_REGRESSION',reason,revision});
     }
     result=await client.query('UPDATE public.casino_city_saves SET save=$3::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 AND revision=$2 RETURNING revision::text AS revision',[vk,revision,JSON.stringify(save)]);
     await client.query('COMMIT');
    }catch(error){await client.query('ROLLBACK').catch(()=>{});throw error}
    finally{client.release()}
   }
   if(!result.rowCount){const q=await pool.query('SELECT revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1',[vk]);return res.status(409).json({error:'REVISION_CONFLICT',revision:Number(q.rows[0]?.revision||0)})}
   res.set('Cache-Control','no-store');res.json({ok:true,revision:Number(result.rows[0].revision)});
  }catch(e){console.error('casino save write',e.code||e.message);res.status(503).json({error:'SAVE_UNAVAILABLE'})}
 });
}
module.exports={registerCasinoSaves,regression,clean};
