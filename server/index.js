import express from 'express';
import pg from 'pg';
import cors from 'cors';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import {gameplayAction} from './game-actions.js';
import {vkPaymentsCallback} from './vk-payments.js';
import {cloudSaveGet,cloudSavePut} from './cloud-saves.js';
import {kingdomGet,kingdomPut} from './kingdom-saves.js';

const app=express();
app.disable('x-powered-by');
// Requests reach this API through exactly one trusted local Caddy proxy.
// This allows express-rate-limit to read the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);
// Cloud saves can contain inventories and quest history; keep other APIs at 12 KB.
app.use('/api/casino/save',express.json({limit:'96kb'}));
// Cloud saves include wardrobes, quest history and receipts. Limit is still bounded.
app.use(express.json({limit:'128kb'}));
app.use('/api/vk/payments/callback',express.urlencoded({extended:false,limit:'12kb'}));
app.use('/api/casino/payments/callback',express.urlencoded({extended:false,limit:'12kb'}));
const origin=process.env.CLIENT_ORIGIN||'https://merge-defense.onrender.com';
const casinoOrigins=new Set([origin,'https://merge-defense.onrender.com','https://merge.89-23-115-251.sslip.io']);
app.use(cors({origin:(requestOrigin,callback)=>callback(null,!requestOrigin||casinoOrigins.has(requestOrigin)),methods:['GET','POST','PUT'],allowedHeaders:['Content-Type','X-VK-Launch-Params']}));
app.use('/api',rateLimit({windowMs:60_000,limit:80,standardHeaders:'draft-7',legacyHeaders:false}));
const pool=process.env.DATABASE_URL?new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DB_SSL==='disable'?false:{rejectUnauthorized:true},max:5,connectionTimeoutMillis:4000}):null;
const secret=process.env.VK_APP_SECRET||'';

function vkIdentity(raw) {
 if(!secret||typeof raw!=='string'||raw.length>8192)return null;
 const q=new URLSearchParams(raw);
 const sign=q.get('sign'),id=q.get('vk_user_id'),appId=q.get('vk_app_id');
 if(!sign||!/^[1-9][0-9]{0,18}$/.test(id||'')||!/^[0-9]+$/.test(appId||''))return null;
 if(process.env.VK_APP_ID&&process.env.VK_APP_ID!==appId)return null;
 const fields=[...q.entries()].filter(([k])=>k.startsWith('vk_')).sort(([a],[b])=>a.localeCompare(b));
 const signedQuery=fields.map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
 const expected=crypto.createHmac('sha256',secret).update(signedQuery).digest('base64url');
 const a=Buffer.from(sign),b=Buffer.from(expected);
 if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return null;
 const ts=Number(q.get('vk_ts'));
 // VK Mini Apps may stay open for hours without a new launch signature.
 // Accept signed launch parameters from the last 24 hours; do not accept future timestamps.
 if(!Number.isFinite(ts)||ts>Date.now()/1000+300||ts<Date.now()/1000-86400)return null;
 return 'vk:'+id;
}
function optionalVkAuth(req,res,next){
 const user=vkIdentity(req.header('X-VK-Launch-Params'));
 if(user)req.playerId=user;
 next();
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
// Cloud saves are independent from the server-owned purchases and spendable gems ledger.
app.get('/api/cloud/save',requireAuth,(req,res)=>cloudSaveGet(pool,req,res));
app.put('/api/cloud/save',requireAuth,(req,res)=>cloudSavePut(pool,req,res));
app.get('/api/kingdom/save',requireAuth,(req,res)=>kingdomGet(pool,req,res));
app.put('/api/kingdom/save',requireAuth,(req,res)=>kingdomPut(pool,req,res));
app.post('/api/game/action',requireAuth,(req,res,next)=>{if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});return gameplayAction(pool)(req,res,next)});
app.get('/api/purchases/test-status',requireAuth,async(req,res)=>{
 if(!pool)return res.status(503).json({error:'DATABASE_NOT_CONFIGURED'});
 if(process.env.VK_PAYMENTS_TEST_MODE!=='1'||process.env.VK_PAYMENTS_TESTER_ID!==req.playerId.slice(3))return res.status(403).json({error:'TEST_MODE_DISABLED'});
 try{
  const {rows}=await pool.query("SELECT product_id,status,created_at FROM purchases WHERE player_id=$1 AND provider='vk_votes_test' ORDER BY id DESC LIMIT 20",[req.playerId]);
  const total=await pool.query("SELECT COALESCE(SUM(CASE WHEN product_id='gems100' THEN 100 WHEN product_id='gems550' THEN 550 ELSE 0 END),0)::text AS gems FROM purchases WHERE player_id=$1 AND provider='vk_votes_test' AND status='test'",[req.playerId]);
  res.set('Cache-Control','no-store');return res.json({testOrders:rows,testGems:Number(total.rows[0].gems),spendable:false});
 }catch(e){return res.status(503).json({error:'DATABASE_UNAVAILABLE'})}
});
app.post('/api/purchases/verify',requireAuth,(_req,res)=>res.status(501).json({error:'PAYMENTS_DISABLED'}));
const casinoTournaments=(await import('./casino-tournaments.cjs')).registerCasinoTournaments(app,pool,requireAuth,optionalVkAuth);
(await import('./casino-ranking.cjs')).registerCasinoRanking(app,pool,requireAuth,casinoTournaments.recordAcceptedAdvance);
(await import('./casino-admin.cjs')).registerCasinoAdmin(app,pool,requireAuth);
(await import('./casino-payments.cjs')).registerCasinoPayments(app,pool);
(await import('./casino-saves.cjs')).registerCasinoSaves(app,pool,requireAuth);
(await import('./casino-daily.cjs')).registerCasinoDaily(app,pool,requireAuth);
app.use((_req,res)=>res.status(404).json({error:'NOT_FOUND'}));
const port=Number(process.env.PORT||3000);
app.listen(port,'0.0.0.0',()=>console.log('Merge Defense API listening on',port));
