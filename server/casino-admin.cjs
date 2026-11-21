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
 // No write endpoints until server-owned balances and client-save reconciliation
 // are implemented. A ranking-only reset would be overwritten by the next sync.
}
module.exports={registerCasinoAdmin};
