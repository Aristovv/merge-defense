import express from 'express';
import pg from 'pg';
import cors from 'cors';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import {gameplayAction} from './game-actions.js';
import {vkPaymentsCallback} from './vk-payments.js';

const app=express();
app.disable('x-powered-by');
// Requests reach this API through exactly one trusted local Caddy proxy.
// This allows express-rate-limit to read the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);
app.use(express.json({limit:'12kb'}));
app.use('/api/vk/payments/callback',express.urlencoded({extended:false,limit:'12kb'}));
const origin=process.env.CLIENT_ORIGIN||'https://merge-defense.onrender.com';
app.use(cors({origin,methods:['GET','POST'],allowedHeaders:['Content-Type','X-VK-Launch-Params']}));
app.use('/api',rateLimit({windowMs:60_000,limit:80,standardHeaders:'draft-7',legacyHeaders:false}));
const pool=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='disable'?false:{rejectUnauthorized:true},max:5,connectionTimeoutMillis:4000}):null;
const secret=process.env.VK_APP_SECRET||'';

function vkIdentity(raw) {
 if(!secret||typeof raw!=='string'||raw.length>8192)return null;
 const q=new URLSearchParams(raw);
 const sign=q.get('sign'),id=q.get('vk_user_id'),appId=q.get('vk_app_id');
 if(!sign||!/^[1-9][0-9]{0,18}$/.test(id||'')||!/^[0-9]+$/.test(appId||''))return null;
 if(process.env.VK_APP_ID&&process.env.VK_APP_ID!==appId)return null;
 const fields=[...q.entries()].filter(([k])=>k.startsWith('vk_')).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('&');
 const expected=crypto.createHmac('sha256',secret).update(fields).digest('base64url');
 const a=Buffer.from(sign),b=Buffer.from(expected);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 const ts=Number(q.get('vk_ts'));
 if(!Number.isFinite(ts)||Math.abs(Date.now()/1000-ts)>3600)return null;
 return 'vk:'+id;
}
function requireAuth(req,res,next) {
 if(!secret)return res.status(503).json({error:'VK_AUTH_NOT_CONFIGURED'});
 const user=vkIdentity(req.header('X-VK-Launch-Params'));
 if(!user)return res.status(401).json({error:'INVALID_VK_LAUNCH'});
 req.playerId=user;next();
}
app.post('/api/vk/payments/callback',vkPaymentsCallback(pool));
app.get('/health',(_req,res)=>res.json({ok:true,service:'merge-defense-api',databaseConfigured:!!pool,vkAuthConfigured:!!secret}));
app.get('/api/me',requireAuth,async(req,res)=>{
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 try {
  await pool.query('INSERT INTO players(player_id) VALUES($1) ON CONFLICT DO NOTHING',[req.playerId]);
  const {rows}=await pool.query('SELECT player_id,coins,gems,hp,wave,summons,pity,kills,wins,power,income,towers,achievements,discovered,revision,updated_at FROM players WHERE player_id=$1',[req.playerId]);
  res.set('Cache-Control','no-store');return res.json({player:rows[0],paymentsTestEnabled:process.env.VK_PAYMENTS_TEST_MODE==='1'&&process.env.VK_PAYMENTS_TESTER_ID===req.playerId.slice(3)});
 }catch(e){console.error('db read failed',e.code||e.message);return res.status(503).json({error:'DATABASE_UNAVAILABLE'})}
});
// No unauthenticated balance updates, client-side purchase fulfillment, or unverified imports.
// VK payments are credited only through signed server callbacks and database transactions.
app.post('/api/game/action',requireAuth,(req,res,next)=>{if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});return gameplayAction(pool)(req,res,next)});
app.post('/api/purchases/verify',requireAuth,(_req,res)=>res.status(501).json({error:'PAYMENTS_DISABLED'}));
app.use((_req,res)=>res.status(404).json({error:'NOT_FOUND'}));
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log('Merge Defense API listening on',port));
