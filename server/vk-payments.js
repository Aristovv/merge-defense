import crypto from 'node:crypto';

// VK virtual goods catalog: amounts and prices are server-side only.
export const shop = Object.freeze({
  gems100: Object.freeze({id:101,name:'100 кристаллов',price:5,gems:100}),
  gems550: Object.freeze({id:102,name:'550 кристаллов',price:20,gems:550})
});
const byId=new Map(Object.entries(shop).map(([key,v])=>[String(v.id),{key,...v}]));
const err=(code,msg,critical=true)=>({error:{error_code:code,error_msg:msg,critical}});
function signed(body,secret){
 if(!secret||!body||typeof body!=='object'||Array.isArray(body))return false;
 const sig=body.sig;
 if(typeof sig!=='string'||!/^[a-f\d]{32}$/i.test(sig))return false;
 const keys=Object.keys(body).filter(k=>k!=='sig').sort();
 if(keys.some(k=>typeof body[k]!=='string'))return false;
 const payload=keys.map(k=>k+'='+body[k]).join('')+secret;
 const expected=crypto.createHash('md5').update(payload,'utf8').digest('hex');
 return crypto.timingSafeEqual(Buffer.from(sig.toLowerCase()),Buffer.from(expected));
}
export function vkPaymentsCallback(pool){
 return async(req,res)=>{
  res.set('Cache-Control','no-store');
  const secret=process.env.VK_PAYMENTS_SECRET||'';
  if(!pool||!secret)return res.status(503).json(err(100,'Payment integration not configured'));
  if(!signed(req.body,secret))return res.json(err(10,'Invalid signature'));
  const b=req.body;
  if(b.notification_type==='get_item'||b.notification_type==='get_item_test'){
   const item=shop[b.item];
   if(!item)return res.json(err(20,'Unknown product'));
   return res.json({response:{item_id:item.id,title:item.name,price:item.price,photo_url:''}});
  }
  if(!['order_status_change','order_status_change_test'].includes(b.notification_type))return res.json(err(100,'Unsupported notification'));
  if(b.status!=='chargeable')return res.json(err(100,'Unsupported order status'));
  if(!/^[1-9]\d{0,18}$/.test(b.order_id||'')||!/^[1-9]\d{0,18}$/.test(b.user_id||''))return res.json(err(100,'Invalid order'));
  const item=byId.get(String(b.item_id));
  if(!item)return res.json(err(20,'Unknown purchased item'));
  const test=b.notification_type.endsWith('_test');
  // Isolate test order IDs, which can overlap with live VK orders.
  const provider=test?'vk_votes_test':'vk_votes';
  const playerId='vk:'+b.user_id;
  let client;
  try{
   client=await pool.connect();
   await client.query('BEGIN');
   await client.query('INSERT INTO players(player_id) VALUES($1) ON CONFLICT DO NOTHING',[playerId]);
   const inserted=await client.query(
    "INSERT INTO purchases(provider,provider_transaction_id,player_id,product_id,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider,provider_transaction_id) DO NOTHING RETURNING id,player_id,product_id",
    [provider,b.order_id,playerId,item.key,test?'test':'paid']);
   if(inserted.rowCount){
    if(!test){
     await client.query('UPDATE players SET gems=gems+$2,revision=revision+1,updated_at=NOW() WHERE player_id=$1',[playerId,item.gems]);
    }
   }else{
    const previous=await client.query('SELECT player_id,product_id FROM purchases WHERE provider=$1 AND provider_transaction_id=$2',[provider,b.order_id]);
    if(previous.rows[0]?.player_id!==playerId||previous.rows[0]?.product_id!==item.key)throw Error('Duplicate order mismatch');
   }
   await client.query('COMMIT');
   return res.json({response:{order_id:Number(b.order_id)}});
  }catch(e){
   if(client)await client.query('ROLLBACK').catch(()=>{});
   console.error('VK payment callback failed',e.code||e.message);
   return res.status(503).json(err(100,'Temporary payment processing error',false));
  }finally{client?.release()}
 };
}
