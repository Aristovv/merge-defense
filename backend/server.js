import 'dotenv/config';
import express from 'express';
import pg from 'pg';
import crypto from 'node:crypto';
const app=express();
app.use(express.json({limit:'16kb'}));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='true'?{rejectUnauthorized:true}:undefined});
const secret=process.env.VK_APP_SECRET;
function auth(req,res,next){
 const launch=req.get('x-vk-launch-params')||'';
 if(!secret)return res.status(503).json({error:'VK_APP_SECRET not configured'});
 const q=new URLSearchParams(launch),sign=q.get('sign'),id=q.get('vk_user_id');
 if(!sign||!/^\d+$/.test(id||''))return res.status(401).json({error:'VK authorization required'});
 const data=[...q].filter(([k])=>k.startsWith('vk_')).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('&');
 const expected=crypto.createHmac('sha256',secret).update(data).digest('base64url');
 if(sign.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sign),Buffer.from(expected)))return res.status(401).json({error:'Invalid VK signature'});
 req.vkId=id;next();
}
app.get('/health',(_req,res)=>res.json({ok:true,service:'casino-city'}));
app.get('/api/top',async(_req,res,next)=>{try{
 const {rows}=await pool.query('SELECT vk_id::text AS id,display_name,score::text,level FROM casino_city_players ORDER BY score DESC,updated_at ASC LIMIT 100');
 res.json({top:rows});
}catch(e){next(e)}});
app.get('/api/me',auth,async(req,res,next)=>{try{
 const {rows}=await pool.query('SELECT vk_id::text AS id,display_name,score::text,level,plays::text,wins::text FROM casino_city_players WHERE vk_id=$1',[req.vkId]);
 res.json({player:rows[0]||null});
}catch(e){next(e)}});
app.post('/api/register',auth,async(req,res,next)=>{try{
 const name=String(req.body?.displayName||'Игрок').replace(/[<>]/g,'').slice(0,60)||'Игрок';
 const {rows}=await pool.query('INSERT INTO casino_city_players(vk_id,display_name) VALUES($1,$2) ON CONFLICT(vk_id) DO UPDATE SET display_name=EXCLUDED.display_name RETURNING vk_id::text AS id,display_name,score::text,level',[req.vkId,name]);
 res.json({player:rows[0]});
}catch(e){next(e)}});
// Scores are intentionally NOT accepted from the browser: game results must be verified server-side.
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Internal server error'})});
app.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Casino City API ready'));
