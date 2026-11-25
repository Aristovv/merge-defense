'use strict';
// Lucky City: one daily login reward per UTC day, credited atomically in PostgreSQL.
// Uses existing casino_city_saves row and optimistic revision to prevent double claims.
function registerCasinoDaily(app,pool,requireAuth){
 app.post('/api/casino/daily/claim',requireAuth,async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!pool)return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
  const vkId=String(req.playerId||'').replace(/^vk:/,'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId))return res.status(401).json({error:'INVALID_PLAYER'});
  const expected=req.body?.revision;
  if(!Number.isSafeInteger(expected)||expected<1)return res.status(400).json({error:'INVALID_REVISION'});
  let client;
  try{
   client=await pool.connect();
   await client.query('BEGIN');
   const q=await client.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.status(404).json({error:'SAVE_NOT_FOUND'})}
   const revision=Number(q.rows[0].revision),save=q.rows[0].save;
   // Check revision BEFORE awarding anything; other device/administrator may have modified save.
   if(revision!==expected){await client.query('ROLLBACK');return res.status(409).json({error:'REVISION_CONFLICT',revision})}
   if(save.pendingMiniRound){await client.query('ROLLBACK');return res.status(409).json({error:'UNFINISHED_GAME'})}
   const date=(await client.query("SELECT to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD') AS day")).rows[0].day;
   if(save.lastGift===date){
    await client.query('COMMIT');
    return res.json({ok:true,alreadyClaimed:true,day:date,revision,save});
   }
   const yesterday=new Date(Date.parse(date+'T00:00:00Z')-86400000).toISOString().slice(0,10);
   const oldStreak=Number.isSafeInteger(save.giftStreak)&&save.giftStreak>0?save.giftStreak:1;
   const streak=save.lastGift===yesterday?Math.min(100000,oldStreak+1):1;
   const bonusChips=Math.min(streak,7)*50+(streak%7===0?350:0);
   const bonusCoins=streak%7===0?300:0;
   const chips=400+bonusChips,coins=700+bonusCoins;
   if(!Number.isSafeInteger(save.chips)||!Number.isSafeInteger(save.coins)||
      save.chips+chips>Number.MAX_SAFE_INTEGER||save.coins+coins>Number.MAX_SAFE_INTEGER){
    await client.query('ROLLBACK');
    return res.status(409).json({error:'BALANCE_LIMIT'});
   }
   const next={...save,lastGift:date,giftStreak:streak,
    giftBestStreak:Math.max(streak,Number(save.giftBestStreak)||0),
    coins:save.coins+coins,chips:save.chips+chips,stamp:Date.now()};
   // Apply the original +15 XP bonus, including the active +50% XP booster.
   const xpBoost=Number(next.liveCity14?.boosts?.xp)||0;
   const xpAmount=xpBoost>Date.now()?22:15;
   let level=Number(next.level)||1,experience=Number(next.xp)||0;
   if(level<500){
    experience+=xpAmount;
    while(level<500&&experience>=Math.floor(420+level*110+level*level*8)){
     experience-=Math.floor(420+level*110+level*level*8);
     level++;
     next.chips+=100+level*20;
    }
    next.level=level;next.xp=level>=500?0:experience;
   }
   if(!Number.isSafeInteger(next.chips)||next.chips>Number.MAX_SAFE_INTEGER){
    await client.query('ROLLBACK');return res.status(409).json({error:'BALANCE_LIMIT'});
   }
   const update=await client.query(`UPDATE public.casino_city_saves
      SET save=$3::jsonb,revision=revision+1,updated_at=NOW()
      WHERE vk_id=$1 AND revision=$2 RETURNING revision::text AS revision`,
     [vkId,revision,JSON.stringify(next)]);
   if(!update.rowCount)throw Error('DAILY_REVISION_LOST');
   await client.query('COMMIT');
   res.set('Cache-Control','no-store');
   return res.json({ok:true,alreadyClaimed:false,day:date,streak,chips,coins,
     revision:Number(update.rows[0].revision),save:next});
  }catch(error){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   console.error('Casino daily claim failed:',error.code||error.message);
   return res.status(503).json({error:'DAILY_CLAIM_UNAVAILABLE'});
  }finally{client?.release()}
 });
}
module.exports={registerCasinoDaily};
