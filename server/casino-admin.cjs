'use strict';
// Casino City administrator endpoints. Never trust a client-side admin flag.
function registerCasinoAdmin(app,pool,requireAuth){
 const ADMIN_ID=process.env.CASINO_ADMIN_VK_ID||'523218982';
 function guard(req,res,next){requireAuth(req,res,()=>req.playerId==='vk:'+ADMIN_ID?next():res.status(403).json({error:'ADMIN_ONLY'}))}
 app.get('/api/casino/admin/players',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const search=String(req.query.q||'').trim().slice(0,64);
  try{
   const {rows}=await pool.query(`SELECT vk_id::text AS vk_id,display_name,score::text AS score,level,plays::text AS plays,wins::text AS wins,updated_at
     FROM public.casino_city_players WHERE ($1='' OR vk_id::text=$1 OR display_name ILIKE '%'||$1||'%')
     ORDER BY score DESC LIMIT 100`,[search]);
   res.set('Cache-Control','no-store');res.json({players:rows,admin:true,scope:'casino_ranking_only'});
  }catch(e){console.error('casino admin read',e.code||e.message);res.status(503).json({error:'ADMIN_READ_UNAVAILABLE'})}
 });

 // Modify cloud saves only. Players without a cloud save are not eligible.
 // The revision increment prevents stale clients from overwriting an admin change.
 app.post('/api/casino/admin/grant',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.body?.vkId||'');
  const field=req.body?.field;
  const amount=req.body?.amount;
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||!['chips','coins','vip','xp'].includes(field)||
     !Number.isSafeInteger(amount)||amount<1||amount>1000000000)
   return res.status(400).json({error:'INVALID_GRANT'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const save=q.rows[0].save;
   if(!Number.isSafeInteger(save[field])||save[field]<0||save[field]+amount>Number.MAX_SAFE_INTEGER){
    await client.query('ROLLBACK');return res.status(409).json({error:'INVALID_CURRENT_BALANCE'});
   }
   save[field]+=amount;
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',[ADMIN_ID,vkId,'grant',JSON.stringify({field,amount})]);
   await client.query('COMMIT');res.json({ok:true,vkId,field,amount});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino grant failed',e.code||e.message);res.status(503).json({error:'GRANT_UNAVAILABLE'})}
  finally{client?.release()}
 });
 app.get('/api/casino/admin/audit',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  try{
   await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   const vkId=String(req.query.vkId||'').trim();if(vkId&&!/^[1-9][0-9]{0,18}$/.test(vkId))return res.status(400).json({error:'INVALID_VK_ID'});
   const {rows}=await pool.query('SELECT id,target_vk_id::text AS vk_id,action,details,created_at FROM public.casino_city_admin_audit WHERE ($1=\'\' OR target_vk_id::text=$1) ORDER BY id DESC LIMIT 30',[vkId]);
   res.set('Cache-Control','no-store');res.json({entries:rows});
  }catch(e){console.error('casino audit read',e.code||e.message);res.status(503).json({error:'AUDIT_UNAVAILABLE'})}
 });
 app.get('/api/casino/admin/player',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.query.vkId||'').trim();
  if(!/^[1-9][0-9]{0,18}$/.test(vkId))return res.status(400).json({error:'INVALID_VK_ID'});
  try{
   const [cloud,rank]=await Promise.all([
    pool.query('SELECT save,revision::text AS revision,updated_at FROM public.casino_city_saves WHERE vk_id=$1',[vkId]),
    pool.query('SELECT display_name,score::text AS score,level,plays::text AS plays,wins::text AS wins FROM public.casino_city_players WHERE vk_id=$1',[vkId])
   ]);
   const c=cloud.rows[0],p=rank.rows[0],v=c?.save;
   res.set('Cache-Control','no-store');
   res.json({vkId,cloud:c?{revision:Number(c.revision),updatedAt:c.updated_at,chips:v.chips,coins:v.coins,vip:v.vip,xp:v.xp,level:v.level,plays:v.plays,wins:v.wins,buildings:v.buildings,stamp:v.stamp}:null,ranking:p||null,reset:{available:false,reason:'RESET_DISABLED_PENDING_SAFE_RECONCILIATION'}});
  }catch(e){console.error('casino admin player',e.code||e.message);res.status(503).json({error:'PLAYER_READ_UNAVAILABLE'})}
 });
 // No write endpoints until server-owned balances and client-save reconciliation
 // are implemented. A ranking-only reset would be overwritten by the next sync.
}
module.exports={registerCasinoAdmin};
