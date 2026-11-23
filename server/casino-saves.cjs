'use strict';
// Isolated Casino City cloud saves. Browser state is not a secure payment ledger.
let ready;
async function ensure(pool){
 if(!pool)throw Error('DATABASE_UNAVAILABLE');
 if(!ready){
  ready=(async()=>{
   await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_saves(
    vk_id BIGINT PRIMARY KEY,save JSONB NOT NULL,revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_save_history(
    vk_id BIGINT NOT NULL,revision BIGINT NOT NULL,save JSONB NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(vk_id,revision))`);
   await pool.query(`CREATE OR REPLACE FUNCTION public.casino_city_capture_save()
    RETURNS TRIGGER LANGUAGE plpgsql AS $history$
    BEGIN
     IF TG_OP = 'INSERT' THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(NEW.vk_id,NEW.revision,NEW.save) ON CONFLICT DO NOTHING;
     ELSIF OLD.revision IS DISTINCT FROM NEW.revision THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(OLD.vk_id,OLD.revision,OLD.save) ON CONFLICT DO NOTHING;
     END IF;
     RETURN NEW;
    END;
    $history$`);
   await pool.query(`DO $install$
    BEGIN
     IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.casino_city_saves'::regclass AND tgname='casino_city_archive_revision') THEN
      CREATE TRIGGER casino_city_archive_revision
      AFTER INSERT OR UPDATE ON public.casino_city_saves
      FOR EACH ROW EXECUTE FUNCTION public.casino_city_capture_save();
     END IF;
    END; $install'use strict';
// Isolated Casino City cloud saves. Browser state is not a secure payment ledger.
let ready;
async function ensure(pool){
 if(!pool)throw Error('DATABASE_UNAVAILABLE');
 if(!ready){
  ready=(async()=>{
   await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_saves(
    vk_id BIGINT PRIMARY KEY,save JSONB NOT NULL,revision BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_save_history(
    vk_id BIGINT NOT NULL,revision BIGINT NOT NULL,save JSONB NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(vk_id,revision))`);
   await pool.query(`CREATE OR REPLACE FUNCTION public.casino_city_capture_save()
    RETURNS TRIGGER LANGUAGE plpgsql AS $history$
    BEGIN
     IF TG_OP = 'INSERT' THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(NEW.vk_id,NEW.revision,NEW.save) ON CONFLICT DO NOTHING;
     ELSIF OLD.revision IS DISTINCT FROM NEW.revision THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(OLD.vk_id,OLD.revision,OLD.save) ON CONFLICT DO NOTHING;
     END IF;
     RETURN NEW;
    END;
    $history$`);
   await pool.query(`DO $install$
    BEGIN
     IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.casino_city_saves'::regclass AND tgname='casino_city_archive_revision') THEN
      CREATE TRIGGER casino_city_archive_revision
      AFTER INSERT OR UPDATE ON public.casino_city_saves
      FOR EACH ROW EXECUTE FUNCTION public.casino_city_capture_save();
     END IF;
);
  })().catch(error=>{ready=null;throw error});
 }
 await ready;
}
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
 // Daily login gifts are committed only through the atomic /api/casino/daily/claim route.
 // Reject legacy browser-side awards to avoid duplicate grants and first-day resets.
 if((next.lastGift||'')!==(previous.lastGift||'')||
    (Number(next.giftStreak)||0)!==(Number(previous.giftStreak)||0)||
    (Number(next.giftBestStreak)||0)!==(Number(previous.giftBestStreak)||0))
  return 'SERVER_DAILY_CLAIM_REQUIRED';
 const epoch=Number(previous.resetEpoch)||0;
 if((Number(next.resetEpoch)||0)!==epoch)return 'RESET_EPOCH_MISMATCH';
 for(const key of ['level','plays','wins','earned','best','giftBestStreak']){
  const a=Number(previous[key])||0,b=Number(next[key])||0;
  if(!Number.isFinite(b)||b<a)return 'PROGRESS_REGRESSION_'+key.toUpperCase();
 }
 if(Array.isArray(previous.buildings)&&Array.isArray(next.buildings)){
  if(previous.buildings.some((v,i)=>Number(next.buildings[i])<Number(v)))return 'BUILDING_REGRESSION';
 }
 // Permanent claims and cosmetics are never silently removed by ordinary play.
 for(const key of ['achievementsClaimed','levelRewards','collect']){
  const old=previous[key],fresh=next[key];
  if(Array.isArray(old)&&old.some(value=>!Array.isArray(fresh)||!fresh.includes(value)))
   return 'PERMANENT_COLLECTION_REGRESSION_'+key.toUpperCase();
 }
 const stableCosmetics=['nicks','frames','titles','badges','backgrounds','effects','themes'];
 for(const key of stableCosmetics){
  const old=previous.donationInventory?.[key],fresh=next.donationInventory?.[key];
  if(Array.isArray(old)&&old.some(value=>!Array.isArray(fresh)||!fresh.includes(value)))
   return 'DONATION_OWNERSHIP_REGRESSION_'+key.toUpperCase();
 }
 const oldOutfits=previous.character33?.ownedOutfits;
 const newOutfits=next.character33?.ownedOutfits;
 if(Array.isArray(oldOutfits)&&oldOutfits.some(id=>!Array.isArray(newOutfits)||!newOutfits.includes(id)))return 'OUTFIT_OWNERSHIP_REGRESSION';
 if(typeof previous.lastGift==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(previous.lastGift)){
  if(typeof next.lastGift!=='string'||next.lastGift<previous.lastGift)return 'DAILY_GIFT_REGRESSION';
 }
 return null;
}
// Settle the already recorded Plinko outcome, never draw a new result.
// The stake was debited when pendingMiniRound was written to the cloud.
// A row lock plus clearing the pending marker make the payout exactly-once.
function settleRecordedPlinko(save){
 const pending=save?.pendingMiniRound;
 if(!pending||pending.kind!=='plinko')return null;
 const stake=Number(pending.stake),prize=Number(pending.prize);
 if(!valid(stake,1,1_000_000_000_000)||!valid(prize,0,1_000_000_000_000)||
    !valid(save.chips,0,Number.MAX_SAFE_INTEGER-prize)||
    !valid(save.earned,0,Number.MAX_SAFE_INTEGER-prize)||
    !valid(save.best,0,Number.MAX_SAFE_INTEGER))
  return null;
 const next={...save,pendingMiniRound:null,chips:save.chips+prize,
  earned:save.earned+prize,best:Math.max(save.best,prize),
  stamp:Date.now()};
 // No guessed wins, quest rewards, coins or repeat stake debit.
 // Ordinary local completion may contribute additional metadata on its next save.
 return next;
}
function id(req){const n=String(req.playerId||'').replace(/^vk:/,'');return /^[1-9][0-9]{0,18}$/.test(n)?n:null}
function registerCasinoSaves(app,pool,requireAuth){
 app.get('/api/casino/save',requireAuth,async(req,res)=>{
  try{await ensure(pool);const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
   const q=await pool.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1',[vk]);
   res.set('Cache-Control','no-store');res.json(q.rows[0]?{save:q.rows[0].save,revision:Number(q.rows[0].revision)}:{save:null,revision:0});
  }catch(e){console.error('casino save read',e.code||e.message);res.status(503).json({error:'SAVE_UNAVAILABLE'})}
 });
 // Read-only, account-scoped history. No automatic balance rollback.
 app.get('/api/casino/save/history',requireAuth,async(req,res)=>{
  const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  try{
   await ensure(pool);
   const q=await pool.query(`SELECT revision::text AS revision,captured_at,
    save->>'level' AS level,save->>'coins' AS coins,save->>'chips' AS chips,
    save->>'plays' AS plays,save->>'earned' AS earned
    FROM public.casino_city_save_history WHERE vk_id=$1
    ORDER BY revision DESC LIMIT 30`,[vk]);
   res.set('Cache-Control','no-store');
   return res.json({history:q.rows.map(row=>({...row,revision:Number(row.revision)}))});
  }catch(error){console.error('casino history',error.code||error.message);
   return res.status(503).json({error:'HISTORY_UNAVAILABLE'})}
 });
 app.post('/api/casino/rounds/settle-plinko',requireAuth,async(req,res)=>{
  const vk=id(req);
  if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  let client;
  try{
   await ensure(pool);
   client=await pool.connect();
   await client.query('BEGIN');
   const q=await client.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'SAVE_NOT_FOUND'})}
   const expected=req.body?.revision;
   if(!valid(expected,1,Number.MAX_SAFE_INTEGER)||Number(q.rows[0].revision)!==expected){
    await client.query('ROLLBACK');
    return res.status(409).json({error:'REVISION_CONFLICT',revision:Number(q.rows[0].revision)});
   }
   const saved=q.rows[0].save;
   const next=settleRecordedPlinko(saved);
   if(!next){
    await client.query('COMMIT');
    // No payout on a repeated request. Never clear an unrecognized pending round.
    if(saved.pendingMiniRound)return res.status(409).json({error:'ROUND_NOT_SETTLEABLE'});
    return res.json({ok:true,alreadySettled:true,save:saved,revision:Number(q.rows[0].revision)});
   }
   const updated=await client.query(
    'UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 RETURNING revision::text AS revision',
    [vk,JSON.stringify(next)]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');
   return res.json({ok:true,settled:true,save:next,revision:Number(updated.rows[0].revision)});
  }catch(e){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   console.error('plinko settlement',e.code||e.message);
   return res.status(503).json({error:'SETTLEMENT_UNAVAILABLE'});
  }finally{if(client)client.release()}
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
module.exports={registerCasinoSaves,regression,clean,settleRecordedPlinko};
