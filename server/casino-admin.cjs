'use strict';
// Casino City administrator endpoints. Never trust a client-side admin flag.
function registerCasinoAdmin(app,pool,requireAuth){
 const ADMIN_ID=process.env.CASINO_ADMIN_VK_ID||'523218982';
 function guard(req,res,next){requireAuth(req,res,()=>req.playerId==='vk:'+ADMIN_ID?next():res.status(403).json({error:'ADMIN_ONLY'}))}
 app.get('/api/casino/admin/stats',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  try{
   const [saves,players,tournaments]=await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE updated_at>NOW()-INTERVAL '24 hours')::int AS active24,
     COALESCE(SUM(CASE WHEN (save->>'chips') ~ '^[0-9]{1,15},guard,async(req,res)=>{
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
 // Administrator-only reversible resource and building adjustments.
 app.post('/api/casino/admin/adjust',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const {vkId,field,mode,amount,buildingIndex}=req.body||{};
  const scalar={chips:1e12,coins:1e12,vip:1e9,xp:1e12,level:10000,plays:1e9,wins:1e9,best:1e12,earned:1e12};
  if(!/^[1-9][0-9]{0,18}$/.test(String(vkId||''))||
   !Object.prototype.hasOwnProperty.call(scalar,field)&&field!=='building'||
   !['add','remove','set'].includes(mode)||!Number.isSafeInteger(amount)||amount<0||amount>1e9||
   (field==='building'&&(!Number.isInteger(buildingIndex)||buildingIndex<0||buildingIndex>13)))
   return res.status(400).json({error:'INVALID_ADJUSTMENT'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const save=q.rows[0].save;
   const current=field==='building'?save.buildings?.[buildingIndex]:save[field];
   const cap=field==='building'?1000:scalar[field];
   if(!Number.isSafeInteger(current)||current<0){await client.query('ROLLBACK');return res.status(409).json({error:'INVALID_CURRENT_VALUE'})}
   const raw=mode==='set'?amount:mode==='add'?current+amount:current-amount;
   const min=field==='level'?1:field==='building'&&buildingIndex===0?1:0;
   const next=Math.max(min,Math.min(cap,raw));
   if(field==='building')save.buildings[buildingIndex]=next;else save[field]=next;
   // Invalidate stale device saves, as with player resets.
   save.resetEpoch=Math.max(0,Number(save.resetEpoch)||0)+1;
   save.stamp=Date.now();
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',
    [ADMIN_ID,vkId,'adjust',JSON.stringify({field,buildingIndex:field==='building'?buildingIndex:null,mode,amount,before:current,after:next})]);
   await client.query('COMMIT');res.set('Cache-Control','no-store');res.json({ok:true,vkId,field,mode,before:current,after:next});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino adjust failed',e.code||e.message);res.status(503).json({error:'ADJUST_UNAVAILABLE'})}
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
 // Reset only one player's cloud game progress. The reset epoch prevents older
 // device saves from silently restoring the previous cloud progress.
 app.post('/api/casino/admin/reset-player',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.body?.vkId||'').trim();
  const confirmation=String(req.body?.confirmation||'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||confirmation!=='RESET '+vkId)
   return res.status(400).json({error:'RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const previous=q.rows[0].save;
   const epoch=Math.max(0,Number(previous.resetEpoch)||0)+1;
   const now=Date.now();
   const fresh={coins:2500,chips:1200,vip:0,level:1,xp:0,buildings:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],plays:0,wins:0,best:0,earned:0,collect:[],quests:[],lastGift:'',stamp:now,lastIncome:now,resetEpoch:epoch};
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(fresh)]);
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',[ADMIN_ID,vkId,'reset_cloud_progress',JSON.stringify({resetEpoch:epoch,previousRevision:Number(q.rows[0].revision)})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,vkId,resetEpoch:epoch,scope:'cloud_game_progress_only'});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino reset failed',e.code||e.message);res.status(503).json({error:'RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });
 // Bulk reset: a single DB transaction resets cloud saves and competitive tables.
 // No action happens until the administrator explicitly confirms in the UI.
 app.post('/api/casino/admin/reset-all',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  if(req.body?.confirmation!=='RESET ALL CASINO CITY'||req.body?.acknowledge!==true)
   return res.status(400).json({error:'BULK_RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   // Serialize bulk resets and prevent simultaneous reset requests.
   await client.query('SELECT pg_advisory_xact_lock(54893392)');
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   const saves=await client.query(`UPDATE public.casino_city_saves
    SET save=jsonb_build_object(
     'coins',2500,'chips',1200,'vip',0,'level',1,'xp',0,
     'buildings',jsonb_build_array(1,0,0,0,0,0,0,0,0,0,0,0,0,0),
     'plays',0,'wins',0,'best',0,'earned',0,'collect',jsonb_build_array(),
     'quests',jsonb_build_array(),'lastGift','',
     'stamp',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'lastIncome',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'resetEpoch',COALESCE(CASE WHEN (save->>'resetEpoch') ~ '^[0-9]{1,12}$'
       THEN (save->>'resetEpoch')::bigint ELSE 0 END,0)+1),
    revision=revision+1,updated_at=NOW()`);
   const ranking=await client.query('UPDATE public.casino_city_players SET score=0,level=1,plays=0,wins=0,updated_at=NOW()');
   const tournaments=await client.query('DELETE FROM public.casino_city_tournaments');
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$1,$2,$3::jsonb)',
    [ADMIN_ID,'reset_all',JSON.stringify({saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino bulk reset failed',e.code||e.message);res.status(503).json({error:'BULK_RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });

}
module.exports={registerCasinoAdmin};
 THEN (save->>'chips')::numeric ELSE 0 END),0)::text AS chips,
     COALESCE(SUM(CASE WHEN (save->>'coins') ~ '^[0-9]{1,15},guard,async(req,res)=>{
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
 // Administrator-only reversible resource and building adjustments.
 app.post('/api/casino/admin/adjust',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const {vkId,field,mode,amount,buildingIndex}=req.body||{};
  const scalar={chips:1e12,coins:1e12,vip:1e9,xp:1e12,level:10000,plays:1e9,wins:1e9,best:1e12,earned:1e12};
  if(!/^[1-9][0-9]{0,18}$/.test(String(vkId||''))||
   !Object.prototype.hasOwnProperty.call(scalar,field)&&field!=='building'||
   !['add','remove','set'].includes(mode)||!Number.isSafeInteger(amount)||amount<0||amount>1e9||
   (field==='building'&&(!Number.isInteger(buildingIndex)||buildingIndex<0||buildingIndex>13)))
   return res.status(400).json({error:'INVALID_ADJUSTMENT'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const save=q.rows[0].save;
   const current=field==='building'?save.buildings?.[buildingIndex]:save[field];
   const cap=field==='building'?1000:scalar[field];
   if(!Number.isSafeInteger(current)||current<0){await client.query('ROLLBACK');return res.status(409).json({error:'INVALID_CURRENT_VALUE'})}
   const raw=mode==='set'?amount:mode==='add'?current+amount:current-amount;
   const min=field==='level'?1:field==='building'&&buildingIndex===0?1:0;
   const next=Math.max(min,Math.min(cap,raw));
   if(field==='building')save.buildings[buildingIndex]=next;else save[field]=next;
   // Invalidate stale device saves, as with player resets.
   save.resetEpoch=Math.max(0,Number(save.resetEpoch)||0)+1;
   save.stamp=Date.now();
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',
    [ADMIN_ID,vkId,'adjust',JSON.stringify({field,buildingIndex:field==='building'?buildingIndex:null,mode,amount,before:current,after:next})]);
   await client.query('COMMIT');res.set('Cache-Control','no-store');res.json({ok:true,vkId,field,mode,before:current,after:next});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino adjust failed',e.code||e.message);res.status(503).json({error:'ADJUST_UNAVAILABLE'})}
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
 // Reset only one player's cloud game progress. The reset epoch prevents older
 // device saves from silently restoring the previous cloud progress.
 app.post('/api/casino/admin/reset-player',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.body?.vkId||'').trim();
  const confirmation=String(req.body?.confirmation||'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||confirmation!=='RESET '+vkId)
   return res.status(400).json({error:'RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const previous=q.rows[0].save;
   const epoch=Math.max(0,Number(previous.resetEpoch)||0)+1;
   const now=Date.now();
   const fresh={coins:2500,chips:1200,vip:0,level:1,xp:0,buildings:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],plays:0,wins:0,best:0,earned:0,collect:[],quests:[],lastGift:'',stamp:now,lastIncome:now,resetEpoch:epoch};
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(fresh)]);
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',[ADMIN_ID,vkId,'reset_cloud_progress',JSON.stringify({resetEpoch:epoch,previousRevision:Number(q.rows[0].revision)})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,vkId,resetEpoch:epoch,scope:'cloud_game_progress_only'});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino reset failed',e.code||e.message);res.status(503).json({error:'RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });
 // Bulk reset: a single DB transaction resets cloud saves and competitive tables.
 // No action happens until the administrator explicitly confirms in the UI.
 app.post('/api/casino/admin/reset-all',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  if(req.body?.confirmation!=='RESET ALL CASINO CITY'||req.body?.acknowledge!==true)
   return res.status(400).json({error:'BULK_RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   // Serialize bulk resets and prevent simultaneous reset requests.
   await client.query('SELECT pg_advisory_xact_lock(54893392)');
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   const saves=await client.query(`UPDATE public.casino_city_saves
    SET save=jsonb_build_object(
     'coins',2500,'chips',1200,'vip',0,'level',1,'xp',0,
     'buildings',jsonb_build_array(1,0,0,0,0,0,0,0,0,0,0,0,0,0),
     'plays',0,'wins',0,'best',0,'earned',0,'collect',jsonb_build_array(),
     'quests',jsonb_build_array(),'lastGift','',
     'stamp',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'lastIncome',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'resetEpoch',COALESCE(CASE WHEN (save->>'resetEpoch') ~ '^[0-9]{1,12}$'
       THEN (save->>'resetEpoch')::bigint ELSE 0 END,0)+1),
    revision=revision+1,updated_at=NOW()`);
   const ranking=await client.query('UPDATE public.casino_city_players SET score=0,level=1,plays=0,wins=0,updated_at=NOW()');
   const tournaments=await client.query('DELETE FROM public.casino_city_tournaments');
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$1,$2,$3::jsonb)',
    [ADMIN_ID,'reset_all',JSON.stringify({saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino bulk reset failed',e.code||e.message);res.status(503).json({error:'BULK_RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });

}
module.exports={registerCasinoAdmin};
 THEN (save->>'coins')::numeric ELSE 0 END),0)::text AS coins,
     COALESCE(SUM(CASE WHEN (save->>'plays') ~ '^[0-9]{1,12},guard,async(req,res)=>{
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
 // Administrator-only reversible resource and building adjustments.
 app.post('/api/casino/admin/adjust',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const {vkId,field,mode,amount,buildingIndex}=req.body||{};
  const scalar={chips:1e12,coins:1e12,vip:1e9,xp:1e12,level:10000,plays:1e9,wins:1e9,best:1e12,earned:1e12};
  if(!/^[1-9][0-9]{0,18}$/.test(String(vkId||''))||
   !Object.prototype.hasOwnProperty.call(scalar,field)&&field!=='building'||
   !['add','remove','set'].includes(mode)||!Number.isSafeInteger(amount)||amount<0||amount>1e9||
   (field==='building'&&(!Number.isInteger(buildingIndex)||buildingIndex<0||buildingIndex>13)))
   return res.status(400).json({error:'INVALID_ADJUSTMENT'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const save=q.rows[0].save;
   const current=field==='building'?save.buildings?.[buildingIndex]:save[field];
   const cap=field==='building'?1000:scalar[field];
   if(!Number.isSafeInteger(current)||current<0){await client.query('ROLLBACK');return res.status(409).json({error:'INVALID_CURRENT_VALUE'})}
   const raw=mode==='set'?amount:mode==='add'?current+amount:current-amount;
   const min=field==='level'?1:field==='building'&&buildingIndex===0?1:0;
   const next=Math.max(min,Math.min(cap,raw));
   if(field==='building')save.buildings[buildingIndex]=next;else save[field]=next;
   // Invalidate stale device saves, as with player resets.
   save.resetEpoch=Math.max(0,Number(save.resetEpoch)||0)+1;
   save.stamp=Date.now();
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',
    [ADMIN_ID,vkId,'adjust',JSON.stringify({field,buildingIndex:field==='building'?buildingIndex:null,mode,amount,before:current,after:next})]);
   await client.query('COMMIT');res.set('Cache-Control','no-store');res.json({ok:true,vkId,field,mode,before:current,after:next});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino adjust failed',e.code||e.message);res.status(503).json({error:'ADJUST_UNAVAILABLE'})}
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
 // Reset only one player's cloud game progress. The reset epoch prevents older
 // device saves from silently restoring the previous cloud progress.
 app.post('/api/casino/admin/reset-player',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.body?.vkId||'').trim();
  const confirmation=String(req.body?.confirmation||'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||confirmation!=='RESET '+vkId)
   return res.status(400).json({error:'RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const previous=q.rows[0].save;
   const epoch=Math.max(0,Number(previous.resetEpoch)||0)+1;
   const now=Date.now();
   const fresh={coins:2500,chips:1200,vip:0,level:1,xp:0,buildings:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],plays:0,wins:0,best:0,earned:0,collect:[],quests:[],lastGift:'',stamp:now,lastIncome:now,resetEpoch:epoch};
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(fresh)]);
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',[ADMIN_ID,vkId,'reset_cloud_progress',JSON.stringify({resetEpoch:epoch,previousRevision:Number(q.rows[0].revision)})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,vkId,resetEpoch:epoch,scope:'cloud_game_progress_only'});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino reset failed',e.code||e.message);res.status(503).json({error:'RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });
 // Bulk reset: a single DB transaction resets cloud saves and competitive tables.
 // No action happens until the administrator explicitly confirms in the UI.
 app.post('/api/casino/admin/reset-all',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  if(req.body?.confirmation!=='RESET ALL CASINO CITY'||req.body?.acknowledge!==true)
   return res.status(400).json({error:'BULK_RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   // Serialize bulk resets and prevent simultaneous reset requests.
   await client.query('SELECT pg_advisory_xact_lock(54893392)');
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   const saves=await client.query(`UPDATE public.casino_city_saves
    SET save=jsonb_build_object(
     'coins',2500,'chips',1200,'vip',0,'level',1,'xp',0,
     'buildings',jsonb_build_array(1,0,0,0,0,0,0,0,0,0,0,0,0,0),
     'plays',0,'wins',0,'best',0,'earned',0,'collect',jsonb_build_array(),
     'quests',jsonb_build_array(),'lastGift','',
     'stamp',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'lastIncome',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'resetEpoch',COALESCE(CASE WHEN (save->>'resetEpoch') ~ '^[0-9]{1,12}$'
       THEN (save->>'resetEpoch')::bigint ELSE 0 END,0)+1),
    revision=revision+1,updated_at=NOW()`);
   const ranking=await client.query('UPDATE public.casino_city_players SET score=0,level=1,plays=0,wins=0,updated_at=NOW()');
   const tournaments=await client.query('DELETE FROM public.casino_city_tournaments');
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$1,$2,$3::jsonb)',
    [ADMIN_ID,'reset_all',JSON.stringify({saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino bulk reset failed',e.code||e.message);res.status(503).json({error:'BULK_RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });

}
module.exports={registerCasinoAdmin};
 THEN (save->>'plays')::numeric ELSE 0 END),0)::text AS plays
     FROM public.casino_city_saves`),
    pool.query('SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE updated_at>NOW()-INTERVAL \'24 hours\')::int AS active24 FROM public.casino_city_players'),
    pool.query('SELECT COUNT(*)::int AS total FROM public.casino_city_tournaments')
   ]);
   res.set('Cache-Control','no-store');res.json({ok:true,cloud:saves.rows[0],ranking:players.rows[0],tournaments:tournaments.rows[0],note:'Активность за 24 часа — по времени обновления данных, не онлайн.'});
  }catch(e){console.error('casino admin stats',e.code||e.message);res.status(503).json({error:'STATS_UNAVAILABLE'})}
 });
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
 // Administrator-only reversible resource and building adjustments.
 app.post('/api/casino/admin/adjust',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const {vkId,field,mode,amount,buildingIndex}=req.body||{};
  const scalar={chips:1e12,coins:1e12,vip:1e9,xp:1e12,level:10000,plays:1e9,wins:1e9,best:1e12,earned:1e12};
  if(!/^[1-9][0-9]{0,18}$/.test(String(vkId||''))||
   !Object.prototype.hasOwnProperty.call(scalar,field)&&field!=='building'||
   !['add','remove','set'].includes(mode)||!Number.isSafeInteger(amount)||amount<0||amount>1e9||
   (field==='building'&&(!Number.isInteger(buildingIndex)||buildingIndex<0||buildingIndex>13)))
   return res.status(400).json({error:'INVALID_ADJUSTMENT'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const save=q.rows[0].save;
   const current=field==='building'?save.buildings?.[buildingIndex]:save[field];
   const cap=field==='building'?1000:scalar[field];
   if(!Number.isSafeInteger(current)||current<0){await client.query('ROLLBACK');return res.status(409).json({error:'INVALID_CURRENT_VALUE'})}
   const raw=mode==='set'?amount:mode==='add'?current+amount:current-amount;
   const min=field==='level'?1:field==='building'&&buildingIndex===0?1:0;
   const next=Math.max(min,Math.min(cap,raw));
   if(field==='building')save.buildings[buildingIndex]=next;else save[field]=next;
   // Invalidate stale device saves, as with player resets.
   save.resetEpoch=Math.max(0,Number(save.resetEpoch)||0)+1;
   save.stamp=Date.now();
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',
    [ADMIN_ID,vkId,'adjust',JSON.stringify({field,buildingIndex:field==='building'?buildingIndex:null,mode,amount,before:current,after:next})]);
   await client.query('COMMIT');res.set('Cache-Control','no-store');res.json({ok:true,vkId,field,mode,before:current,after:next});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino adjust failed',e.code||e.message);res.status(503).json({error:'ADJUST_UNAVAILABLE'})}
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
 // Reset only one player's cloud game progress. The reset epoch prevents older
 // device saves from silently restoring the previous cloud progress.
 app.post('/api/casino/admin/reset-player',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.body?.vkId||'').trim();
  const confirmation=String(req.body?.confirmation||'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||confirmation!=='RESET '+vkId)
   return res.status(400).json({error:'RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   const q=await client.query('SELECT save,revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'CLOUD_SAVE_NOT_FOUND'})}
   const previous=q.rows[0].save;
   const epoch=Math.max(0,Number(previous.resetEpoch)||0)+1;
   const now=Date.now();
   const fresh={coins:2500,chips:1200,vip:0,level:1,xp:0,buildings:[1,0,0,0,0,0,0,0,0,0,0,0,0,0],plays:0,wins:0,best:0,earned:0,collect:[],quests:[],lastGift:'',stamp:now,lastIncome:now,resetEpoch:epoch};
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(fresh)]);
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$2,$3,$4::jsonb)',[ADMIN_ID,vkId,'reset_cloud_progress',JSON.stringify({resetEpoch:epoch,previousRevision:Number(q.rows[0].revision)})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,vkId,resetEpoch:epoch,scope:'cloud_game_progress_only'});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino reset failed',e.code||e.message);res.status(503).json({error:'RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });
 // Bulk reset: a single DB transaction resets cloud saves and competitive tables.
 // No action happens until the administrator explicitly confirms in the UI.
 app.post('/api/casino/admin/reset-all',guard,async(req,res)=>{
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  if(req.body?.confirmation!=='RESET ALL CASINO CITY'||req.body?.acknowledge!==true)
   return res.status(400).json({error:'BULK_RESET_CONFIRMATION_REQUIRED'});
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   // Serialize bulk resets and prevent simultaneous reset requests.
   await client.query('SELECT pg_advisory_xact_lock(54893392)');
   await client.query(`CREATE TABLE IF NOT EXISTS public.casino_city_admin_audit(
    id BIGSERIAL PRIMARY KEY,admin_vk_id BIGINT NOT NULL,target_vk_id BIGINT NOT NULL,
    action TEXT NOT NULL,details JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
   const saves=await client.query(`UPDATE public.casino_city_saves
    SET save=jsonb_build_object(
     'coins',2500,'chips',1200,'vip',0,'level',1,'xp',0,
     'buildings',jsonb_build_array(1,0,0,0,0,0,0,0,0,0,0,0,0,0),
     'plays',0,'wins',0,'best',0,'earned',0,'collect',jsonb_build_array(),
     'quests',jsonb_build_array(),'lastGift','',
     'stamp',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'lastIncome',(EXTRACT(EPOCH FROM clock_timestamp())*1000)::bigint,
     'resetEpoch',COALESCE(CASE WHEN (save->>'resetEpoch') ~ '^[0-9]{1,12}$'
       THEN (save->>'resetEpoch')::bigint ELSE 0 END,0)+1),
    revision=revision+1,updated_at=NOW()`);
   const ranking=await client.query('UPDATE public.casino_city_players SET score=0,level=1,plays=0,wins=0,updated_at=NOW()');
   const tournaments=await client.query('DELETE FROM public.casino_city_tournaments');
   await client.query('INSERT INTO public.casino_city_admin_audit(admin_vk_id,target_vk_id,action,details) VALUES($1,$1,$2,$3::jsonb)',
    [ADMIN_ID,'reset_all',JSON.stringify({saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount})]);
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');res.json({ok:true,saves:saves.rowCount,ranking:ranking.rowCount,tournaments:tournaments.rowCount});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('casino bulk reset failed',e.code||e.message);res.status(503).json({error:'BULK_RESET_UNAVAILABLE'})}
  finally{client?.release()}
 });

}
module.exports={registerCasinoAdmin};
