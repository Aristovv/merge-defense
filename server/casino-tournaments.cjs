'use strict';
/**
 * Casino City: shared weekly tournaments, entirely driven by server-accepted
 * leaderboard score increases. Client-supplied "tournament points" are ignored.
 * The ranking's existing rate limits remain in force.
 */
const WEEK_MS=7*24*60*60*1000;
function startOfWeek(date=new Date()) {
 const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
 d.setUTCDate(d.getUTCDate() - (d.getUTCDay()+6)%7);
 return d;
}
function previousWeek() { return new Date(startOfWeek().getTime()-WEEK_MS); }
function weeklyRewards(position) {
 if(position===1)return {chips:2500,coins:1200,vip:3,badge:'Золотой чемпион'};
 if(position===2)return {chips:1500,coins:800,vip:2,badge:'Серебряный призёр'};
 if(position===3)return {chips:1000,coins:500,vip:1,badge:'Бронзовый призёр'};
 if(position<=10)return {chips:450,coins:200,vip:0,badge:'Финалист недели'};
 return {chips:0,coins:0,vip:0,badge:''};
}
function registerCasinoTournaments(app,pool,requireAuth,optionalAuth) {
 let ready=null;
 async function ensure() {
  if(!pool)throw new Error('DATABASE_UNAVAILABLE');
  if(!ready)ready=(async()=>{
   await pool.query(`
    CREATE TABLE IF NOT EXISTS public.casino_city_tournaments (
     week_start DATE NOT NULL,
     vk_id BIGINT NOT NULL,
     display_name TEXT NOT NULL DEFAULT '',
     points BIGINT NOT NULL DEFAULT 0,
     joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     claimed_at TIMESTAMPTZ NULL,
     PRIMARY KEY(week_start,vk_id)
    )`);
   await pool.query('CREATE INDEX IF NOT EXISTS casino_city_tournaments_week_leaders ON public.casino_city_tournaments (week_start,points DESC,joined_at ASC,vk_id ASC)');
   return true;
  })().catch(e=>{ready=null;throw e});
  return ready;
 }
 // Called *within* the current ranking sync DB transaction after its row lock,
 // so each accepted score increase is recorded exactly once on the same commit.
 async function recordAcceptedAdvance(client,vkId,displayName,scoreDelta){
  const delta=Math.max(0,Math.floor(Number(scoreDelta)||0));
  if(!delta)return;
  try {await ensure()}catch(e){console.warn('Tournament schema unavailable:',e.code||e.message);return}
  const week=startOfWeek().toISOString().slice(0,10);
  const name=String(displayName||'').replace(/[<>\u0000-\u001f]/g,'').slice(0,48);
  // A tournament is not allowed to roll back a successful ranking sync.
  // A SAVEPOINT isolates the optional tournament write.
  await client.query('SAVEPOINT casino_tournament_part');
  try{
   await client.query(`
    INSERT INTO public.casino_city_tournaments(week_start,vk_id,display_name,points)
    VALUES($1,$2,$3,$4)
    ON CONFLICT(week_start,vk_id) DO UPDATE
    SET points=public.casino_city_tournaments.points+EXCLUDED.points,
        display_name=EXCLUDED.display_name,updated_at=NOW()`,
    [week,vkId,name,delta]);
   await client.query('RELEASE SAVEPOINT casino_tournament_part');
  }catch(e){
   await client.query('ROLLBACK TO SAVEPOINT casino_tournament_part');
   await client.query('RELEASE SAVEPOINT casino_tournament_part');
   console.warn('Tournament write unavailable:',e.code||e.message);
  }
 }
 function idFor(req){const id=String(req.playerId||'').replace(/^vk:/,'');return /^\d{1,19}$/.test(id)?id:null}
 async function leaders(client,week){
  const {rows}=await client.query(`
   SELECT vk_id::text AS vk_id,display_name,points::text AS points,claimed_at
   FROM public.casino_city_tournaments WHERE week_start=$1
   ORDER BY points::bigint DESC,joined_at ASC,vk_id ASC LIMIT 100`,[week]);
  return rows;
 }
 app.get('/api/casino/tournament',optionalAuth,async(req,res)=>{
  // The tournament table is public, just like /api/casino/top.
  // Signed VK launch params are required only for personalized details and claims.
  const id=idFor(req);
  try {
   await ensure();
   const active=startOfWeek(),prior=previousWeek();
   const [top,last,personalCurrent,personalPrior]=await Promise.all([
    leaders(pool,active.toISOString().slice(0,10)),leaders(pool,prior.toISOString().slice(0,10)),
    id?pool.query('SELECT points::text AS points FROM public.casino_city_tournaments WHERE week_start=$1 AND vk_id=$2',[active.toISOString().slice(0,10),id]):Promise.resolve({rows:[]}),
    id?pool.query('SELECT points::text AS points,claimed_at FROM public.casino_city_tournaments WHERE week_start=$1 AND vk_id=$2',[prior.toISOString().slice(0,10),id]):Promise.resolve({rows:[]})
   ]);
   const lastRank=last.findIndex(p=>p.vk_id===id)+1;
   const previous=personalPrior.rows[0]||null;
   res.set('Cache-Control','no-store');
   return res.json({
    now:Date.now(),weekStart:active.toISOString(),weekEnd:new Date(active.getTime()+WEEK_MS).toISOString(),
    top:top.map((p,i)=>({vk_id:p.vk_id,display_name:p.display_name,points:p.points,place:i+1})),
    me:{vk_id:id,points:personalCurrent.rows[0]?.points||'0'},
    previous:{weekStart:prior.toISOString(),place:lastRank||null,points:previous?.points||'0',
      claimed:!!previous?.claimed_at,reward:lastRank&&lastRank<=10?weeklyRewards(lastRank):null}
   });
  }catch(e){
   console.error('Tournament read failed:',e.code||e.message);
   return res.status(503).json({error:'TOURNAMENT_UNAVAILABLE',detail:'Tournament database table is not ready'});
  }
 });
 // Receipts are durable and re-readable. Clients should apply a receipt once,
 // keyed by its immutable ID, to their existing local-only Casino City save.
 app.post('/api/casino/tournament/claim',requireAuth,async(req,res)=>{
  const id=idFor(req);if(!id)return res.status(401).json({error:'INVALID_PLAYER'});
  const previous=previousWeek().toISOString().slice(0,10);
  let client;
  try{
   await ensure();client=await pool.connect();await client.query('BEGIN');
   const {rows}=await client.query('SELECT points::text AS points,claimed_at FROM public.casino_city_tournaments WHERE week_start=$1 AND vk_id=$2 FOR UPDATE',[previous,id]);
   if(!rows.length){await client.query('ROLLBACK');return res.status(404).json({error:'NO_PREVIOUS_ENTRY'})}
   const top=await leaders(client,previous),place=top.findIndex(p=>p.vk_id===id)+1;
   if(!place||place>10){await client.query('ROLLBACK');return res.status(409).json({error:'NOT_A_PRIZE_WINNER'})}
   const reward=weeklyRewards(place);
   if(!rows[0].claimed_at)await client.query('UPDATE public.casino_city_tournaments SET claimed_at=NOW() WHERE week_start=$1 AND vk_id=$2',[previous,id]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');
   return res.json({ok:true,receipt:'casino-tournament:'+previous+':'+id,place,reward,alreadyClaimed:!!rows[0].claimed_at});
  }catch(e){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   console.error('Tournament claim failed:',e.code||e.message);
   return res.status(503).json({error:'TOURNAMENT_CLAIM_UNAVAILABLE'});
  }finally{client?.release()}
 });
 return {recordAcceptedAdvance};
}
module.exports={registerCasinoTournaments};
