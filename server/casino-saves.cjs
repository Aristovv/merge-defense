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
   await pool.query(`ALTER TABLE public.casino_city_save_history ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
   await pool.query(`ALTER TABLE public.casino_city_save_history ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
   await pool.query(`ALTER TABLE public.casino_city_save_history ALTER COLUMN saved_at SET DEFAULT NOW()`);
   await pool.query(`CREATE OR REPLACE FUNCTION public.casino_city_capture_save()
    RETURNS TRIGGER LANGUAGE plpgsql AS $history$
    BEGIN
     IF TG_OP = 'INSERT' THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(NEW.vk_id,NEW.revision,NEW.save) ON CONFLICT DO NOTHING;
     ELSIF OLD.revision IS DISTINCT FROM NEW.revision THEN
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(OLD.vk_id,OLD.revision,OLD.save) ON CONFLICT DO NOTHING;
      INSERT INTO public.casino_city_save_history(vk_id,revision,save)
      VALUES(NEW.vk_id,NEW.revision,NEW.save) ON CONFLICT DO NOTHING;
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
    END; $install$`);
   await pool.query(`INSERT INTO public.casino_city_save_history(vk_id,revision,save) SELECT vk_id,revision,save FROM public.casino_city_saves ON CONFLICT DO NOTHING`);
   if(process.env.CASINO_AUTHORITATIVE_ECONOMY==='1')await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_economy_receipts(
    vk_id BIGINT NOT NULL,request_id TEXT NOT NULL,signature TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(vk_id,request_id))`);
   if(process.env.CASINO_AUTHORITATIVE_ECONOMY==='1')await pool.query(`ALTER TABLE public.casino_economy_receipts ADD COLUMN IF NOT EXISTS result JSONB NOT NULL DEFAULT '{}'::jsonb`);
   if(process.env.CASINO_AUTHORITATIVE_ECONOMY==='1')await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_private_rounds(
    vk_id BIGINT PRIMARY KEY,round_id TEXT NOT NULL UNIQUE,private_state JSONB NOT NULL,
    save_revision BIGINT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  })().catch(error=>{ready=null;throw error});
 }
 await ready;
}
const season=require('./casino-season-pass.cjs');
const valid=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
function clean(s){
 if(!s||typeof s!=='object'||Array.isArray(s))return null;
 for(const k of ['coins','chips','vip','xp','plays','wins','best','earned'])if(!valid(s[k],0,Number.MAX_SAFE_INTEGER))return null;
 if(!valid(s.level,1,500)||s.wins>s.plays||!Array.isArray(s.buildings)||s.buildings.length!==14||s.buildings.some(x=>!valid(x,0,1000)))return null;
 if(s.businesses!==undefined&&(!Array.isArray(s.businesses)||s.businesses.length!==6||s.businesses.some(n=>!valid(n,0,10))))return null;
 if(s.businessStaff!==undefined&&(!Array.isArray(s.businessStaff)||s.businessStaff.length!==6||s.businessStaff.some(n=>!valid(n,0,3))))return null;
 if(s.businessManagers!==undefined&&(!Array.isArray(s.businessManagers)||s.businessManagers.length!==6||s.businessManagers.some(n=>typeof n!=='boolean')))return null;
 if(s.businessContracts!==undefined&&(!Array.isArray(s.businessContracts)||s.businessContracts.length!==6||s.businessContracts.some(c=>c!==null&&(!c||!valid(c.endsAt,1,Number.MAX_SAFE_INTEGER)||!valid(c.reward,1,Number.MAX_SAFE_INTEGER)))))return null;
 if(s.businessReputation!==undefined&&(!Array.isArray(s.businessReputation)||s.businessReputation.length!==6||s.businessReputation.some(n=>!valid(n,0,100000))))return null;
 if(s.businessLicenses!==undefined&&(!Array.isArray(s.businessLicenses)||s.businessLicenses.length!==6||s.businessLicenses.some(n=>!valid(n,0,3))))return null;
 if(s.seasonPass40!==undefined&&!season.validPass(s.seasonPass40))return null;
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
 if(JSON.stringify(Object.entries(season.seasonPass(previous)).sort())!==JSON.stringify(Object.entries(season.seasonPass(next)).sort()))return 'SERVER_SEASON_ACTION_REQUIRED';
 const epoch=Number(previous.resetEpoch)||0;
 if((Number(next.resetEpoch)||0)!==epoch)return 'RESET_EPOCH_MISMATCH';
 for(const key of ['level','plays','wins','earned','best','giftBestStreak']){
  const a=Number(previous[key])||0,b=Number(next[key])||0;
  if(!Number.isFinite(b)||b<a)return 'PROGRESS_REGRESSION_'+key.toUpperCase();
 }
 if(Array.isArray(previous.buildings)&&Array.isArray(next.buildings)){
  if(previous.buildings.some((v,i)=>Number(next.buildings[i])<Number(v)))return 'BUILDING_REGRESSION';
 }
 // Business ownership can change only through the transactional economy action.
 const before=previous.businesses||[0,0,0,0,0,0],after=next.businesses||[0,0,0,0,0,0];
 if(before.some((n,i)=>n!==after[i]))return 'SERVER_BUSINESS_ACTION_REQUIRED';
 for(const [key,empty] of [['businessStaff',0],['businessManagers',false],['businessContracts',null],['businessReputation',0],['businessLicenses',0]]){
  if(JSON.stringify(previous[key]||Array(6).fill(empty))!==JSON.stringify(next[key]||Array(6).fill(empty)))return 'SERVER_BUSINESS_ACTION_REQUIRED';
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
async function persistRoundStart(client,vk,roundId,privateState,expectedRevision,nextSave){
 if(!clean(nextSave)||!valid(expectedRevision,1,Number.MAX_SAFE_INTEGER))throw Error('INVALID_ROUND_SAVE');
 const updated=await client.query('UPDATE public.casino_city_saves SET save=$3::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 AND revision=$2 RETURNING revision::text AS revision',[vk,expectedRevision,JSON.stringify(nextSave)]);
 if(!updated.rowCount)throw Error('REVISION_CONFLICT');
 const revision=Number(updated.rows[0].revision);
 await client.query('INSERT INTO public.casino_private_rounds(vk_id,round_id,private_state,save_revision) VALUES($1,$2,$3::jsonb,$4)',[vk,roundId,JSON.stringify(privateState),revision]);
 return revision;
}
async function persistRoundFinish(client,vk,roundId,expectedRevision,nextSave){
 if(!clean(nextSave)||!valid(expectedRevision,1,Number.MAX_SAFE_INTEGER))throw Error('INVALID_ROUND_SAVE');
 const locked=await client.query('SELECT round_id FROM public.casino_private_rounds WHERE vk_id=$1 AND round_id=$2 AND save_revision=$3 FOR UPDATE',[vk,roundId,expectedRevision]);
 if(!locked.rowCount)throw Error('ROUND_CONFLICT');
 const updated=await client.query('UPDATE public.casino_city_saves SET save=$3::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 AND revision=$2 RETURNING revision::text AS revision',[vk,expectedRevision,JSON.stringify(nextSave)]);
 if(!updated.rowCount)throw Error('REVISION_CONFLICT');
 await client.query('DELETE FROM public.casino_private_rounds WHERE vk_id=$1 AND round_id=$2',[vk,roundId]);
 return Number(updated.rows[0].revision);
}
function registerCasinoSaves(app,pool,requireAuth){
 app.get('/api/casino/business/top',requireAuth,async(req,res)=>{
  try{
   await ensure(pool);const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
   const result=await pool.query(`WITH scores AS (
    SELECT s.vk_id,COALESCE(p.display_name,'Игрок VK') AS name,
     (SELECT COALESCE(SUM(CASE WHEN v ~ '^[0-9]{1,6}$' THEN LEAST(v::int,100000) ELSE 0 END),0)
      FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(s.save->'businessReputation')='array' THEN s.save->'businessReputation' ELSE '[]'::jsonb END) v) AS points
    FROM public.casino_city_saves s LEFT JOIN public.casino_city_players p ON p.vk_id=s.vk_id
    WHERE s.save ? 'businessReputation'
   ), ranked AS (SELECT *,RANK() OVER(ORDER BY points DESC) AS rank FROM scores WHERE points>0)
   SELECT vk_id::text AS id,name,points::int,rank::int FROM ranked WHERE rank<=50 OR vk_id=$1 ORDER BY rank,vk_id LIMIT 100`,[vk]);
   res.set('Cache-Control','no-store');res.json({ranking:result.rows.filter(x=>x.rank<=50),me:result.rows.find(x=>x.id===vk)||null});
  }catch(e){console.error('business ranking',e.code||e.message);res.status(503).json({error:'BUSINESS_RANKING_UNAVAILABLE'})}
 });

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

 // Opt-in only: the legacy client still writes snapshots until migration is complete.
 // Read-only recovery endpoint: never expose the hidden deck.
 // Test-only card round API. All writes share the same player row lock.
 app.post('/api/casino/rounds/card-action',requireAuth,async(req,res)=>{
  if(process.env.CASINO_AUTHORITATIVE_ECONOMY!=='1')return res.status(503).json({error:'ECONOMY_NOT_ENABLED'});
  const vk=id(req),{action,revision,requestId,game,stake,roundId,version,held,high,autoTarget=null}=req.body||{};
  if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  if(!['start','hit','stand','draw','guess','status','cashout'].includes(action)||!valid(revision,1,Number.MAX_SAFE_INTEGER)||typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId))return res.status(400).json({error:'INVALID_ACTION'});
  const signature=JSON.stringify(['card',action,game??null,stake??null,roundId??null,version??null,held??null,high??null,autoTarget]);
  let client;
  try{
   await ensure(pool);client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
   if(!q.rowCount)throw Error('SAVE_NOT_FOUND');
   const current=q.rows[0],rev=Number(current.revision);
   const prior=await client.query('SELECT signature,result FROM public.casino_economy_receipts WHERE vk_id=$1 AND request_id=$2',[vk,requestId]);
   if(prior.rowCount){
    if(prior.rows[0].signature!==signature)throw Error('REQUEST_ID_REUSED');
    await client.query('COMMIT');res.set('Cache-Control','no-store');
    return res.json({...prior.rows[0].result,ok:true,alreadyProcessed:true,save:current.save,revision:rev});
   }
   if(rev!==revision)throw Error('REVISION_CONFLICT');
   const active=await client.query('SELECT round_id,private_state,save_revision::text AS revision FROM public.casino_private_rounds WHERE vk_id=$1 FOR UPDATE',[vk]);
   const cards=require('./casino-private-round-state.cjs'),account=require('./casino-authoritative-rounds.cjs');
   const now=Date.now();let next,receipt,newRevision;
   if(action==='start'){
    if(active.rowCount||current.save.pendingMiniRound)throw Error('ROUND_PENDING');
    const max=Math.min(100000,500+Math.floor(require('./casino-authoritative-economy.cjs').hourlyRate(current.save)/1000)*100);
    if(![8,9,11,13].includes(game)||!valid(stake,25,max)||stake%5)throw Error('INVALID_STAKE');
    if(current.save.chips<stake)throw Error('INSUFFICIENT_CHIPS');
    const crash=require('./casino-authoritative-crash.cjs');
    const started=game===13?(()=>{const p=crash.startCrash(stake,autoTarget,now);return {done:false,privateRound:p,view:crash.viewCrash(p)}})():cards.startRound(game,stake);
    if(started.done){
     next=account.applyCompletedRound(current.save,{game,stake,payout:started.payout,description:'Blackjack',now});
     const u=await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 RETURNING revision::text AS revision',[vk,JSON.stringify(next)]);
     newRevision=Number(u.rows[0].revision);receipt=started;
    }else{
     const rid=require('node:crypto').randomUUID();
     next={...current.save,chips:current.save.chips-stake,stamp:now,pendingMiniRound:{kind:'server-card',id:rid}};
     newRevision=await persistRoundStart(client,vk,rid,started.privateRound,rev,next);
     receipt={done:false,round:{...started.view,id:rid}};
    }
   }else{
    const row=active.rows[0];
    if(!row||row.round_id!==roundId||Number(row.revision)!==rev||current.save.pendingMiniRound?.id!==roundId)throw Error('ROUND_CONFLICT');
    const p=row.private_state;
    let outcome;
    if(p.game===8)outcome=cards.advanceBlackjack(p,action,version);
    else if(p.game===9&&action==='draw')outcome=cards.advancePoker(p,held,version);
    else if(p.game===11&&action==='guess')outcome=cards.advanceHiLo(p,high,version);
    else if(p.game===13&&version===p.version){
     outcome=require('./casino-authoritative-crash.cjs').settleCrash(p,action,now);
     if(!outcome.done){await client.query('COMMIT');res.set('Cache-Control','no-store');return res.json({ok:true,done:false,round:{...outcome.view,id:roundId},revision:rev,save:current.save});}
    }
    else throw Error('INVALID_ROUND_ACTION');
    if(outcome.done){
     const restored={...current.save,chips:current.save.chips+p.stake,pendingMiniRound:null};
     next=account.applyCompletedRound(restored,{game:p.game,stake:p.stake,payout:outcome.payout,description:p.game===13?'Crash':'Карточный раунд',now});
     newRevision=await persistRoundFinish(client,vk,roundId,rev,next);receipt=outcome;
    }else{
     next={...current.save,stamp:now};
     const u=await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 RETURNING revision::text AS revision',[vk,JSON.stringify(next)]);
     newRevision=Number(u.rows[0].revision);
     await client.query('UPDATE public.casino_private_rounds SET private_state=$2::jsonb,save_revision=$3,updated_at=NOW() WHERE vk_id=$1',[vk,JSON.stringify(outcome.privateRound),newRevision]);
     receipt={done:false,round:{...outcome.view,id:roundId}};
    }
   }
   if(!clean(next))throw Error('INVALID_RESULT');
   await client.query('INSERT INTO public.casino_economy_receipts(vk_id,request_id,signature,result) VALUES($1,$2,$3,$4::jsonb)',[vk,requestId,signature,JSON.stringify(receipt)]);
   await client.query('COMMIT');res.set('Cache-Control','no-store');
   return res.json({...receipt,ok:true,save:next,revision:newRevision});
  }catch(e){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   const known=['SAVE_NOT_FOUND','REQUEST_ID_REUSED','REVISION_CONFLICT','ROUND_PENDING','INVALID_STAKE','INSUFFICIENT_CHIPS','ROUND_CONFLICT','INVALID_ROUND_ACTION','IMPOSSIBLE_GUESS','INVALID_RESULT','INVALID_AUTO_TARGET','INVALID_ROUND'];
   if(known.includes(e.message))return res.status(409).json({error:e.message});
   console.error('card action',e.code||e.message);return res.status(503).json({error:'ROUND_UNAVAILABLE'});
  }finally{if(client)client.release()}
 });
 app.get('/api/casino/rounds/active',requireAuth,async(req,res)=>{
  if(process.env.CASINO_AUTHORITATIVE_ECONOMY!=='1')return res.status(503).json({error:'ECONOMY_NOT_ENABLED'});
  const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  try{
   await ensure(pool);
   const q=await pool.query('SELECT r.round_id,r.private_state,r.save_revision::text AS revision,s.revision::text AS current_revision FROM public.casino_private_rounds r JOIN public.casino_city_saves s USING(vk_id) WHERE r.vk_id=$1',[vk]);
   const row=q.rows[0];
   res.set('Cache-Control','no-store');
   if(!row)return res.json({round:null});
   if(row.revision!==row.current_revision)return res.status(409).json({error:'ROUND_SAVE_CONFLICT'});
   const view=row.private_state.game===13?require('./casino-authoritative-crash.cjs').viewCrash(row.private_state):require('./casino-private-round-state.cjs').publicRound(row.private_state);
   return res.json({round:{...view,id:row.round_id},revision:Number(row.revision)});
  }catch(e){console.error('casino active round',e.code||e.message);return res.status(503).json({error:'ROUND_UNAVAILABLE'})}
 });
 app.post('/api/casino/economy/action',requireAuth,async(req,res)=>{
  if(process.env.CASINO_AUTHORITATIVE_ECONOMY!=='1')return res.status(503).json({error:'ECONOMY_NOT_ENABLED'});
  const vk=id(req),{action,revision,requestId,index,level,game,stake,count=1,risk=0,guess,picks,freeSpin=false,withKey=false,kind,amount}=req.body||{};
  if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  if(!['season_visit','season_claim','collect_income','upgrade_building','upgrade_business','hire_business_staff','hire_business_manager','start_business_contract','claim_business_contract','buy_business_license','claim_milestone','play_round','claim_daily_reward','claim_weekly_reward','open_chest','activate_booster','claim_city_event','exchange_chips'].includes(action)||
     !valid(revision,1,Number.MAX_SAFE_INTEGER)||typeof requestId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(requestId)||
     (action==='upgrade_building'&&!valid(index,0,13))||
     (['upgrade_business','hire_business_staff','hire_business_manager','start_business_contract','claim_business_contract','buy_business_license'].includes(action)&&!valid(index,0,5))||
     (action==='claim_milestone'&&!valid(level,1,500))||
     (action==='play_round'&&(![0,1,2,3,4,5,6,7,10,12,14,15].includes(game)||typeof freeSpin!=='boolean'||(freeSpin?game>5:(!valid(stake,25,100000)||stake%5!==0)))))return res.status(400).json({error:'INVALID_ACTION'});
  const signature=JSON.stringify([action,action==='exchange_chips'?amount:null,action==='activate_booster'?kind:null,action==='open_chest'?withKey:null,['upgrade_building','upgrade_business','hire_business_staff','hire_business_manager','start_business_contract','claim_business_contract','buy_business_license','claim_daily_reward'].includes(action)?index:action==='claim_milestone'?level:action==='play_round'?[game,freeSpin?null:stake,count,risk,guess??null,picks??null,freeSpin]:null]);
  let client;
  try{
   await ensure(pool);
   const economy=require('./casino-authoritative-economy.cjs');
   client=await pool.connect();
   await client.query('BEGIN');
   const q=await client.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'SAVE_NOT_FOUND'})}
   const current=q.rows[0],currentRevision=Number(current.revision);
   const old=await client.query('SELECT signature,result FROM public.casino_economy_receipts WHERE vk_id=$1 AND request_id=$2',[vk,requestId]);
   if(old.rowCount){
    await client.query('COMMIT');
    if(old.rows[0].signature!==signature)return res.status(409).json({error:'REQUEST_ID_REUSED'});
    res.set('Cache-Control','no-store');
    return res.json({...old.rows[0].result,ok:true,alreadyProcessed:true,save:current.save,revision:currentRevision});
   }
   if(currentRevision!==revision||current.save.pendingMiniRound){
    await client.query('ROLLBACK');
    return res.status(409).json({error:currentRevision!==revision?'REVISION_CONFLICT':'ROUND_PENDING',revision:currentRevision});
   }
   let result;
   try{
    const now=Date.now();
    result=['season_visit','season_claim'].includes(action)?season.action(current.save,action,now):
      action==='collect_income'?economy.collectIncome(current.save,now):
      action==='upgrade_building'?economy.upgradeBuilding(current.save,index,now):
      action==='upgrade_business'?economy.upgradeBusiness(current.save,index,now):
      ['hire_business_staff','hire_business_manager','start_business_contract','claim_business_contract','buy_business_license'].includes(action)?economy.manageBusiness(current.save,index,action,now):
      action==='claim_milestone'?economy.claimMilestone(current.save,level):
      action==='claim_daily_reward'?require('./casino-authoritative-rewards.cjs').claimReward(current.save,'daily',index,now):
      action==='exchange_chips'?require('./casino-authoritative-exchange.cjs').exchangeChips(current.save,amount,now):
      action==='claim_city_event'?require('./casino-authoritative-events.cjs').claimEvent(current.save,now):
      action==='activate_booster'?require('./casino-authoritative-boosters.cjs').activateBooster(current.save,kind,now):
      action==='open_chest'?require('./casino-authoritative-chests.cjs').openChest(current.save,withKey,now):
      action==='claim_weekly_reward'?require('./casino-authoritative-rewards.cjs').claimReward(current.save,'weekly',null,now):
      require('./casino-authoritative-outcomes.cjs').resolveRound(current.save,{game,stake,count,risk,guess,picks,freeSpin},now);
    if(action==='collect_income'&&result.amount>0)season.earn(result.save,'income',now);
    if(action==='open_chest')season.earn(result.save,'chest',now);
    if(!clean(result.save))throw Error('INVALID_RESULT');
   }catch(e){
    await client.query('ROLLBACK');
    const known=['INSUFFICIENT_COINS','MILESTONE_NOT_REACHED','BUILDING_LEVEL_LIMIT','BUILDING_COST_LIMIT','BALANCE_LIMIT','INVALID_INCOME_TIME','INVALID_BUILDING','INVALID_RESULT','INVALID_STAKE','INVALID_PLINKO','INVALID_GUESS','INSUFFICIENT_CHIPS','ROUND_PENDING','UNSUPPORTED_GAME','INVALID_PICKS','SLOT_BONUS_PENDING','NO_FREE_SPIN','INVALID_REWARD','ALREADY_CLAIMED','REWARD_NOT_READY','INVALID_KEY','NO_CHEST_KEY','CHEST_COOLDOWN','DAILY_SYNC_REQUIRED','INVALID_BOOSTER','NO_BOOSTER','BOOSTER_QUEUE_LIMIT','INVALID_EXCHANGE_AMOUNT','INVALID_BUSINESS','BUSINESS_LEVEL_LIMIT','BUSINESS_LOCKED','BUSINESS_STAFF_LOCKED','BUSINESS_MANAGER_LOCKED','BUSINESS_CONTRACT_LOCKED','BUSINESS_CONTRACT_NOT_READY','BUSINESS_LICENSE_LOCKED','SEASON_CLOSED'];
    return res.status(422).json({error:known.includes(e.message)?e.message:'ACTION_REJECTED'});
   }
   const next={...result.save,stamp:Date.now()};
   const updated=await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1 RETURNING revision::text AS revision',[vk,JSON.stringify(next)]);
   const {save:_receiptSave,...receipt}=result;
   await client.query('INSERT INTO public.casino_economy_receipts(vk_id,request_id,signature,result) VALUES($1,$2,$3,$4::jsonb)',[vk,requestId,signature,JSON.stringify(receipt)]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');
   return res.json({...result,ok:true,save:next,revision:Number(updated.rows[0].revision)});
  }catch(e){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   console.error('casino economy action',e.code||e.message);
   return res.status(503).json({error:'ECONOMY_UNAVAILABLE'});
  }finally{if(client)client.release()}
 });
 app.put('/api/casino/save',requireAuth,async(req,res)=>{
  const save=clean(req.body?.save),revision=req.body?.revision;
  if(!save||!valid(revision,0,Number.MAX_SAFE_INTEGER))return res.status(400).json({error:'INVALID_SAVE'});
  const vk=id(req);if(!vk)return res.status(401).json({error:'INVALID_PLAYER'});
  try{await ensure(pool);let result;
   if(revision===0){
    if(save.seasonPass40!==undefined)return res.status(400).json({error:'SERVER_SEASON_ACTION_REQUIRED'});
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
     if(current.rows[0].save.pendingMiniRound?.kind==='server-card'||save.pendingMiniRound?.kind==='server-card'){
      await client.query('ROLLBACK');return res.status(409).json({error:'ROUND_PENDING'});
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
module.exports={registerCasinoSaves,regression,clean,settleRecordedPlinko,persistRoundStart,persistRoundFinish};
