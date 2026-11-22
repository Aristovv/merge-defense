'use strict';
const crypto=require('node:crypto');
const goods={},amounts=[800,5000,10000,50000,500000],prices=[5,25,50,200,800];
let n=12000;
for(const type of ['chips','coins'])amounts.forEach((amount,i)=>goods[type+amount]={id:++n,price:prices[i],name:amount+' '+(type==='chips'?'фишек':'монет'),[type]:amount});
const packs=[
 ['starter',35,'Стильный старт',{coins:2500,chips:1000,nick:'nick-neon-blue',frame:'frame-neon',title:'Стильный игрок',background:'night'}],
 ['royal',65,'Королевский профиль',{coins:7500,chips:3000,nick:'nick-legend',frame:'frame-royal',title:'Король города',background:'gold',effect:'gold',boost:5}],
 ['galaxy',95,'Галактический VIP',{coins:15000,chips:6000,nick:'nick-galaxy',frame:'frame-diamond',title:'Повелитель галактики',background:'galaxy',effect:'stars',boost:8,vipBadge:true}],
 ['ultimate',150,'Легенда Lucky City',{coins:30000,chips:12000,nick:'nick-rainbow',frame:'frame-rainbow',title:'Легенда Lucky City',background:'animated',effect:'fireworks',boost:10,vipBadge:true,theme:'ultimate'}]
];
packs.forEach(([key,price,name,pack])=>goods[key]={id:++n,price,name,...pack});
const nick=['nick-white','nick-red','nick-blue','nick-green','nick-purple','nick-gold','nick-neon-blue','nick-neon-pink','nick-fire','nick-legend','nick-galaxy','nick-rainbow'];
const frame=['frame-silver','frame-blue','frame-purple','frame-gold','frame-emerald','frame-neon','frame-fire','frame-rainbow','frame-diamond','frame-royal'];
for(const [type,list] of [['nick',nick],['frame',frame]])for(const value of list)goods[type+'_'+value]={id:++n,price:type==='nick'?({'nick-white':5,'nick-red':5,'nick-blue':5,'nick-green':10,'nick-purple':10,'nick-gold':20}[value]||25):({'frame-silver':5,'frame-blue':5,'frame-purple':10,'frame-gold':15,'frame-emerald':20}[value]||25),name:type+' '+value,[type]:value};
const byId=new Map(Object.entries(goods).map(([key,item])=>[String(item.id),{key,...item}]));
const error=(code,msg)=>({error:{error_code:code,error_msg:msg,critical:true}});
const ready=pool=>!!pool&&process.env.LUCKY_VK_PAYMENTS_ENABLED==='1'&&!!process.env.VK_PAYMENTS_SECRET;
function validSignature(body){
 const sig=body?.sig;if(typeof sig!=='string'||!/^[a-f0-9]{32}$/i.test(sig))return false;
 const keys=Object.keys(body).filter(k=>k!=='sig').sort();
 if(keys.some(k=>typeof body[k]!=='string'))return false;
 const raw=keys.map(k=>k+'='+body[k]).join('')+process.env.VK_PAYMENTS_SECRET;
 const expected=crypto.createHash('md5').update(raw).digest('hex');
 return crypto.timingSafeEqual(Buffer.from(sig.toLowerCase()),Buffer.from(expected));
}
function apply(save,item){
 for(const key of ['chips','coins'])if(item[key]){
  if(!Number.isSafeInteger(save[key])||save[key]<0||!Number.isSafeInteger(save[key]+item[key]))throw Error('INVALID_BALANCE');
  save[key]+=item[key];
 }
 const inv=save.donationInventory&&typeof save.donationInventory==='object'?save.donationInventory:{};
 const eq=save.donationEquipped&&typeof save.donationEquipped==='object'?save.donationEquipped:{};
 for(const key of ['nick','frame','title','background','effect','theme']){
  if(!item[key])continue;
  const list=key+'s';if(!Array.isArray(inv[list]))inv[list]=[];
  if(!inv[list].includes(item[key]))inv[list].push(item[key]);eq[key]=item[key];
 }
 if(item.vipBadge){if(!Array.isArray(inv.badges))inv.badges=[];if(!inv.badges.includes('vip'))inv.badges.push('vip');eq.badge='vip'}
 save.donationInventory=inv;save.donationEquipped=eq;
 if(item.boost){
  const now=Date.now(),old=save.donationIncomeBoost||{};
  save.donationIncomeBoost={percent:old.until>now?Math.max(Number(old.percent)||0,item.boost):item.boost,from:now,until:now+7*86400000};
 }
 save.resetEpoch=Math.max(0,Number(save.resetEpoch)||0)+1;save.stamp=Date.now();
}
function registerCasinoPayments(app,pool){
 app.get('/api/casino/payments/status',(_req,res)=>{res.set('Cache-Control','no-store');res.json({enabled:ready(pool)});});
 app.post('/api/casino/payments/callback',async(req,res)=>{
  res.set('Cache-Control','no-store');
  if(!ready(pool))return res.status(503).json(error(100,'Payments not configured'));
  const b=req.body||{};
  if(!validSignature(b))return res.json(error(10,'Invalid signature'));
  if(process.env.VK_APP_ID&&b.app_id!==process.env.VK_APP_ID)return res.json(error(11,'Wrong app'));
  const type=b.notification_type;
  // Live-only configuration: never grant rewards from free VK test orders.
  if(type==='get_item_test'||type==='order_status_change_test')return res.json(error(11,'Test purchases are disabled'));
  if(type==='get_item'){
   const item=goods[b.item];return item?res.json({response:{item_id:item.id,title:item.name,price:item.price,photo_url:''}}):res.json(error(20,'Unknown item'));
  }
  if(type!=='order_status_change'||b.status!=='chargeable')return res.json(error(11,'Unsupported event'));
  const item=byId.get(String(b.item_id));
  if(!item)return res.json(error(20,'Unknown item'));
  if(b.item_price!==undefined&&Number(b.item_price)!==item.price)return res.json(error(21,'Price mismatch'));
  const vkId=String(b.receiver_id||b.user_id||''),order=String(b.order_id||'');
  if(!/^[1-9][0-9]{0,18}$/.test(vkId)||!/^[1-9][0-9]{0,18}$/.test(order))return res.json(error(11,'Invalid order'));
  const provider='vk_live';
  let client;
  try{
   client=await pool.connect();await client.query('BEGIN');
   await client.query('CREATE TABLE IF NOT EXISTS public.casino_city_paid_orders(provider TEXT NOT NULL,order_id TEXT NOT NULL,target_vk_id BIGINT NOT NULL,item_key TEXT NOT NULL,app_order_id BIGSERIAL UNIQUE NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(provider,order_id))');
   const prev=await client.query('SELECT app_order_id::text AS id,target_vk_id::text AS vk,item_key FROM public.casino_city_paid_orders WHERE provider=$1 AND order_id=$2',[provider,order]);
   if(prev.rowCount){
    if(prev.rows[0].vk!==vkId||prev.rows[0].item_key!==item.key)throw Error('ORDER_COLLISION');
    await client.query('COMMIT');return res.json({response:{order_id:Number(order),app_order_id:Number(prev.rows[0].id)}});
   }
   const q=await client.query('SELECT save FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vkId]);
   if(!q.rowCount){await client.query('ROLLBACK');return res.json(error(22,'Open game before purchase'))}
   const save=q.rows[0].save;apply(save,item);
   const receipt=await client.query('INSERT INTO public.casino_city_paid_orders(provider,order_id,target_vk_id,item_key) VALUES($1,$2,$3,$4) RETURNING app_order_id::text AS id',[provider,order,vkId,item.key]);
   await client.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vkId,JSON.stringify(save)]);
   await client.query('COMMIT');
   return res.json({response:{order_id:Number(order),app_order_id:Number(receipt.rows[0].id)}});
  }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error('Lucky payments failed',e.code||e.message);return res.status(503).json(error(100,'Temporary error'))}
  finally{client?.release()}
 });
}
module.exports={registerCasinoPayments,goods};
