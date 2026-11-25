import {createHmac} from 'node:crypto';
import economyRules from './casino-authoritative-economy.cjs';
// Base income excludes temporary boosts; malformed legacy saves keep the old limit.
function clanIncome(save){try{if(!Array.isArray(save?.buildings)||save.buildings.length!==14||save.buildings.some(x=>!Number.isInteger(x)||x<0||x>1000))return 0;const rate=economyRules.hourlyRate(save);return Number.isFinite(rate)&&rate>=0?Math.min(rate,100000000):0}catch{return 0}}
function clanDepositLimit(save){return Math.min(50000000,Math.max(10000,Math.ceil(clanIncome(save)*2/100)*100))}

// Lucky City clans: independent, server-owned data; never writes player cloud saves.
const INIT=`
CREATE TABLE IF NOT EXISTS lucky_clans (
 id BIGSERIAL PRIMARY KEY,
 group_id BIGINT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 avatar TEXT NOT NULL,
 owner_id TEXT NOT NULL,
 headquarters SMALLINT NOT NULL DEFAULT 1 CHECK(headquarters BETWEEN 1 AND 50),
 wall SMALLINT NOT NULL DEFAULT 1 CHECK(wall BETWEEN 1 AND 50),
 materials BIGINT NOT NULL DEFAULT 0 CHECK(materials>=0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS lucky_clan_members (
 player_id TEXT PRIMARY KEY,
 clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,
 role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner','officer','member')),
 last_claim DATE,
 joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lucky_clan_members_clan_idx ON lucky_clan_members(clan_id);
`;
const CLAN_SHOP=Object.freeze([
 {id:'violet',name:'Неоновый союз',price:25000,color:'#b78aff',icon:'✦'},
 {id:'emerald',name:'Изумрудная гвардия',price:75000,color:'#69dfb0',icon:'◆'},
 {id:'gold',name:'Золотая династия',price:150000,color:'#efc66d',icon:'♛'},
 {id:'crimson',name:'Багровый легион',price:300000,color:'#ff829d',icon:'⚔'},
 {id:'royal',name:'Королевский орден',price:750000,color:'#9edcff',icon:'♜'},
 {id:'cosmic',name:'Космическая элита',price:1500000,color:'#d7a8ff',icon:'✧'}
]);
const CLAN_PROJECTS=Object.freeze([
 {id:'bank',name:'Клановый банк',base:75000,step:125000,percent:2},
 {id:'business',name:'Бизнес-центр',base:150000,step:250000,percent:3},
 {id:'tower',name:'Небоскрёб',base:300000,step:500000,percent:5}
]);
function projectBonus(rows){return rows.reduce((sum,row)=>sum+(CLAN_PROJECTS.find(p=>p.id===row.project_id)?.percent||0)*Number(row.level||0),0)}
export function personalClanTarget(income){return Math.min(25000000,Math.max(1000,Math.ceil((Number(income)||0)*0.5/100)*100))}
const CLAN_ACHIEVEMENTS=Object.freeze([
 {days:7,title:'Новобранец',reward:5000},
 {days:30,title:'Активист',reward:25000},
 {days:100,title:'Ветеран',reward:100000},
 {days:365,title:'Легенда клана',reward:500000}
]);
const ECONOMY_SQL=[
 `CREATE TABLE IF NOT EXISTS lucky_clan_personal_achievements(player_id TEXT NOT NULL,days INTEGER NOT NULL,clan_id BIGINT NOT NULL,claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),prize BIGINT NOT NULL CHECK(prize>0),PRIMARY KEY(player_id,days))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_personal_weekly(player_id TEXT NOT NULL,week DATE NOT NULL,clan_id BIGINT NOT NULL,claimed_at TIMESTAMPTZ,prize BIGINT NOT NULL DEFAULT 0,PRIMARY KEY(player_id,week))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_personal_daily(player_id TEXT NOT NULL,day DATE NOT NULL,clan_id BIGINT NOT NULL,target BIGINT NOT NULL CHECK(target>0),claimed_at TIMESTAMPTZ,prize BIGINT NOT NULL DEFAULT 0,PRIMARY KEY(player_id,day))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_projects(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,project_id TEXT NOT NULL,level INTEGER NOT NULL DEFAULT 0 CHECK(level BETWEEN 0 AND 5),PRIMARY KEY(clan_id,project_id))`,
 `ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS equipped_style TEXT NOT NULL DEFAULT ''`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_shop_owned(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,item_id TEXT NOT NULL,purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(clan_id,item_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_tournament_entries(kind TEXT NOT NULL,period_start DATE NOT NULL,clan_id BIGINT NOT NULL,league TEXT NOT NULL,band INTEGER NOT NULL,name TEXT NOT NULL,avatar TEXT NOT NULL,members INTEGER NOT NULL,PRIMARY KEY(kind,period_start,clan_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_tournament_roster(kind TEXT NOT NULL,period_start DATE NOT NULL,player_id TEXT NOT NULL,clan_id BIGINT NOT NULL,PRIMARY KEY(kind,period_start,player_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_tournament_periods(kind TEXT NOT NULL,period_start DATE NOT NULL,period_end DATE NOT NULL,finished BOOLEAN NOT NULL DEFAULT FALSE,PRIMARY KEY(kind,period_start))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_tournament_results(kind TEXT NOT NULL,period_start DATE NOT NULL,clan_id BIGINT NOT NULL,league TEXT NOT NULL,band INTEGER NOT NULL,name TEXT NOT NULL,points INTEGER NOT NULL,rank INTEGER NOT NULL,prize BIGINT NOT NULL DEFAULT 0,PRIMARY KEY(kind,period_start,clan_id))`,
 `ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS min_income INTEGER NOT NULL DEFAULT 0 CHECK(min_income BETWEEN 0 AND 10000000)`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_invites(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,player_id TEXT NOT NULL,inviter_id TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(clan_id,player_id))`,
 `ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS join_policy TEXT NOT NULL DEFAULT 'open' CHECK(join_policy IN ('open','request','closed'))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_applications(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,player_id TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(clan_id,player_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_management_log(id BIGSERIAL PRIMARY KEY,clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,actor_id TEXT NOT NULL,target_id TEXT NOT NULL,action TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 `CREATE INDEX IF NOT EXISTS lucky_clan_management_log_idx ON lucky_clan_management_log(clan_id,id DESC)`,
 "ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS coins BIGINT CHECK(coins>=0)",
 "UPDATE lucky_clans SET coins=materials WHERE coins IS NULL",
 "ALTER TABLE lucky_clans ALTER COLUMN coins SET DEFAULT 0",
 "ALTER TABLE lucky_clans ALTER COLUMN coins SET NOT NULL",
 `CREATE TABLE IF NOT EXISTS lucky_clan_transactions(
 id BIGSERIAL PRIMARY KEY, clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE,
 player_id TEXT NOT NULL, action TEXT NOT NULL, coins BIGINT NOT NULL,
 request_id TEXT UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
 "CREATE INDEX IF NOT EXISTS lucky_clan_transactions_clan_idx ON lucky_clan_transactions(clan_id,created_at DESC)",
 `CREATE TABLE IF NOT EXISTS lucky_clan_permits(
 vk_id BIGINT PRIMARY KEY, balance INTEGER NOT NULL DEFAULT 0 CHECK(balance>=0))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_daily_claims(
 vk_id BIGINT NOT NULL, claim_day DATE NOT NULL, clan_id BIGINT NOT NULL,
 PRIMARY KEY(vk_id,claim_day))`,
 "ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS seat_tier SMALLINT NOT NULL DEFAULT 0 CHECK(seat_tier BETWEEN 0 AND 8)",
 `CREATE TABLE IF NOT EXISTS lucky_clan_mission_rewards(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE, mission TEXT NOT NULL, period_start DATE NOT NULL, xp INTEGER NOT NULL CHECK(xp>0), PRIMARY KEY(clan_id,mission,period_start))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_mission_targets(clan_id BIGINT NOT NULL REFERENCES lucky_clans(id) ON DELETE CASCADE, scope TEXT NOT NULL, period_start DATE NOT NULL, participants INTEGER NOT NULL, coins BIGINT NOT NULL, PRIMARY KEY(clan_id,scope,period_start))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_season_entries(season INTEGER NOT NULL, clan_id BIGINT NOT NULL, league TEXT NOT NULL, name TEXT NOT NULL, avatar TEXT NOT NULL, PRIMARY KEY(season,clan_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_season_results(season INTEGER NOT NULL, clan_id BIGINT NOT NULL, league TEXT NOT NULL, name TEXT NOT NULL, points INTEGER NOT NULL, rank INTEGER NOT NULL, PRIMARY KEY(season,clan_id))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_weekly_duels(week_start DATE NOT NULL, clan_a BIGINT NOT NULL, clan_b BIGINT NOT NULL, league TEXT NOT NULL, name_a TEXT NOT NULL, name_b TEXT NOT NULL, PRIMARY KEY(week_start,clan_a), UNIQUE(week_start,clan_b), CHECK(clan_a<>clan_b))`,
 `CREATE TABLE IF NOT EXISTS lucky_clan_duel_results(week_start DATE NOT NULL,clan_a BIGINT NOT NULL,clan_b BIGINT NOT NULL,name_a TEXT NOT NULL,name_b TEXT NOT NULL,points_a INTEGER NOT NULL,points_b INTEGER NOT NULL,winner BIGINT,PRIMARY KEY(week_start,clan_a))`
];
let initialized;
const start=pool=>{
 if(!pool)throw Error('DATABASE_NOT_CONFIGURED');
 if(!initialized)initialized=(async()=>{for(const statement of [...INIT.split(';').map(x=>x.trim()).filter(Boolean),...ECONOMY_SQL])await pool.query(statement)})().catch(e=>{initialized=null;throw e});
 return initialized;
};
function err(res,e){
 if(e.status)return res.status(e.status).json({error:e.message});
 console.error('[clans]',e.code||e.message);
 return res.status(503).json({error:'CLANS_UNAVAILABLE'});
}
const fail=(message,status=400)=>{let e=new Error(message);e.status=status;throw e};
const validId=x=>Number.isSafeInteger(Number(x))&&Number(x)>0;
/* VK Bridge performs user-token calls on device because VK binds them to device IP.
 * The backend independently verifies the selected group using its service token.
 * No browser-provided group data or user token is trusted for clan creation. */
async function serviceVK(method,params){
 const token=process.env.VK_GROUP_SERVICE_TOKEN;
 if(!token)fail('Проверка прав клана не настроена на сервере',503);
 const body=new URLSearchParams({...params,access_token:token,v:'5.199'});
 const response=await fetch('https://api.vk.com/method/'+method,{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body,signal:AbortSignal.timeout(7000)
 });
 if(!response.ok)fail('VK временно недоступен',503);
 const json=await response.json();
 if(json.error){
  const code=Number(json.error.error_code)||0;
  fail('VK не разрешил серверную проверку администраторов ('+method+', код '+code+'). Создание клана остановлено для защиты.',503);
 }
 return json.response;
}
export function verifiedCommunityLaunch(req,groupId){
 // requireAuth has already verified the HMAC signature for ALL vk_* launch fields,
 // including vk_group_id and vk_viewer_group_role.
 const raw=req.header('X-VK-Launch-Params');
 if(typeof raw!=='string')return false;
 const params=new URLSearchParams(raw);
 return Number(params.get('vk_group_id'))===Number(groupId)&&
  ['admin','creator'].includes(String(params.get('vk_viewer_group_role')||'').toLowerCase());
}
function cleanVKGroup(raw,requested){
 const group=(Array.isArray(raw)?raw:raw?.groups)?.[0];
 if(!group||Number(group.id)!==requested||!group.name||Number(group.is_closed)===2)
  fail('Сообщество VK недоступно для подтверждения',403);
 const avatar=safeVkPhoto(group.photo_200||group.photo_100||'');
 return {groupId:requested,name:String(group.name).slice(0,100),avatar};
}
async function communityGroupLookup(token,params){
 const body=new URLSearchParams({...params,access_token:token,v:'5.199'});
 const response=await fetch('https://api.vk.com/method/groups.getById',{
  method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
  body,signal:AbortSignal.timeout(7000)
 });
 if(!response.ok)fail('VK временно недоступен',503);
 const data=await response.json();
 if(data?.error)fail('VK не подтвердил ключ сообщества (код '+Number(data.error.error_code||0)+')',403);
 return data.response;
}
// Millionaire-compatible primary path: check the chosen community in
// groups.get(filter=admin) using the same VK user token that listed groups.
// User tokens can be IP-bound; VK code 5 explicitly enables a second, securely
// verified group-token path, never an unverified client "claim".
export async function verifyUserAdminGroup(playerId,groupId,userToken){
 const requested=Number(groupId);
 if(!validId(requested))fail('Выберите сообщество VK',400);
 if(typeof userToken!=='string'||userToken.length<20||userToken.length>4096)
  fail('Требуется разрешение VK на список сообществ',403);
 const call=async(method,params)=>{
  let response,body;
  try{
   response=await fetch('https://api.vk.com/method/'+method,{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({...params,access_token:userToken,v:'5.199'}),
    signal:AbortSignal.timeout(7000)
   });
   body=await response.json();
  }catch(error){console.warn('[clans-vk] transport',String(error.name||'Error'));fail('VK_USER_TOKEN_NEEDS_COMMUNITY',409)}
  if(!response.ok){console.warn('[clans-vk] HTTP',response.status);fail('VK_USER_TOKEN_NEEDS_COMMUNITY',409);}
  if(body?.error){
   const code=Number(body.error.error_code||0);
   console.warn('[clans-vk] API',JSON.stringify({method,code,ipRestricted:/ip address/i.test(String(body.error.error_msg||''))}));
   // Most frequently VK binds this user token to the phone's IP.
   if(code===5||/ip address/i.test(String(body.error.error_msg||'')))
    fail('VK_USER_TOKEN_NEEDS_COMMUNITY',409);
   fail('VK не подтвердил администрирование группы (код '+code+')',403);
  }
  return body?.response;
 };
 // The same signed-in VK Bridge token has already populated the group
 // picker on the device. Follow Millionaire's primary flow: check its
 // groups.get admin list directly instead of preflighting users.get, which
 // is an extra API call that can fail independently on mobile.
 for(let offset=0;offset<1000;offset+=200){
  const result=await call('groups.get',{filter:'admin',extended:'1',fields:'photo_200',count:'200',offset:String(offset)});
  const groups=Array.isArray(result?.items)?result.items:[];
  const found=groups.find(group=>Number(group.id)===requested);
  if(found)return cleanVKGroup([found],requested);
  if(groups.length<200)break;
 }
 fail('Вы не администратор выбранного сообщества VK',403);
}
// Proof of control through a temporary community description marker.
function clanChallenge(playerId,groupId,bucket){
 const secret=process.env.VK_APP_SECRET;
 if(!secret)fail('Проверка сообщества не настроена',503);
 return 'LC-'+createHmac('sha256',secret).update(JSON.stringify(['clan-description-v1',String(playerId),Number(groupId),bucket])).digest('hex').slice(0,32);
}
export async function verifyServiceAdmin(playerId,groupId){
 const uid=String(playerId).replace(/^vk:/,'');
 const id=Number(groupId);
 if(!validId(uid)||!validId(id))return null;
 // Require an explicit role for this exact user from VK, not public metadata.
 try{
  for(let offset=0;offset<5000;offset+=100){
   const result=await serviceVK('groups.getMembers',{group_id:String(id),filter:'managers',count:'100',offset:String(offset)});
   const items=Array.isArray(result?.items)?result.items:[];
   if(items.some(m=>String(m?.id)===uid&&['administrator','creator'].includes(m.role))){
    return cleanVKGroup(await serviceVK('groups.getById',{group_ids:String(id),fields:'photo_200'}),id);
   }
   if(items.length<100)break;
  }
 }catch(e){console.info('[clans-vk] automatic role lookup unavailable')}
 return null;
}
export async function verifyDescriptionProof(playerId,groupId){
 const id=Number(groupId);
 if(!validId(id))fail('Выберите сообщество VK');
 const bucket=Math.floor(Date.now()/900000);
 const raw=await serviceVK('groups.getById',{group_ids:String(id),fields:'description,photo_200'});
 const group=(Array.isArray(raw)?raw:raw?.groups)?.[0];
 const description=String(group?.description||'');
 if(![bucket,bucket-1].some(b=>description.includes(clanChallenge(playerId,id,b))))
  fail('Код не найден в описании сообщества. Сохраните описание в VK и повторите проверку.',403);
 return cleanVKGroup(raw,id);
}
export async function verifiedAdminGroup(playerId,groupId,communityToken,verifiedLaunch){
 const requested=Number(groupId);
 if(!validId(requested))fail('Выберите группу из списка');
 const token=typeof communityToken==='string'&&communityToken.length>=15&&communityToken.length<=4096?
  communityToken:null;
 if(token){
  if(verifiedLaunch){
   // Signed HMAC launch already proves this viewer is a group admin.
   // The token here retrieves metadata only, not authorization.
   try{
    const group=await communityGroupLookup(token,{group_ids:String(requested),fields:'photo_200'});
    return cleanVKGroup(group,requested);
   }catch(error){
    if(error.status!==403&&error.status!==503)throw error;
    // Fallback to server service/public lookup below with signed admin proof.
   }
  }else{
   // Important: querying arbitrary group_id with any token is NOT proof.
   // Omit group_id: the VK group-token default identifies its own community.
   let raw;
   try{raw=await communityGroupLookup(token,{fields:'photo_200'})}
   catch(error){
    if(error.status)throw error;
    fail('Не удалось проверить сообщество VK. Повторите авторизацию.',503);
   }
   return cleanVKGroup(raw,requested);
  }
 }
 if(!verifiedLaunch)
  fail('VK не подтвердил права администратора. Запустите Lucky City из сообщества либо предоставьте разрешение VK.',403);
 // The signed launch proves the group-admin role and exact group ID.
 if(process.env.VK_GROUP_SERVICE_TOKEN){
  const details=await serviceVK('groups.getById',{group_ids:String(requested),fields:'photo_200'});
  return cleanVKGroup(details,requested);
 }
 try{
  const params=new URLSearchParams({group_ids:String(requested),fields:'photo_200',v:'5.199'});
  const response=await fetch('https://api.vk.com/method/groups.getById',{
   method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:params,signal:AbortSignal.timeout(7000)
  });
  const details=await response.json();
  if(response.ok&&!details?.error)return cleanVKGroup(details.response,requested);
 }catch(error){console.warn('[clans] VK group metadata unavailable',error.code||error.message)}
 fail('Сервер VK не предоставил данные группы. Повторите создание через разрешение сообщества.',503);
}
const wrap=handler=>async(req,res)=>{
 try{res.set('Cache-Control','no-store');return await handler(req,res)}
 catch(error){
  if(req.path==='/api/casino/clans/create'){
   // Log only safe diagnostics. Never log launch params or VK access tokens.
   console.error('[clans-create] failed',JSON.stringify({
    stage:req.clanCreateStage||'unknown',status:Number(error.status)||503,
    code:String(error.code||'NONE').slice(0,24)
   }));
  }
  return err(res,error);
 }
};
async function tx(pool,fn){
 const client=await pool.connect();
 try{await client.query('BEGIN');const value=await fn(client);await client.query('COMMIT');return value}
 catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{client.release()}
}
// Public VK profile previews are fetched only by the server. Never expose a VK
// service token to browser code, and never persist profile photos to player saves.
const memberProfilesCache=new Map();
const MEMBER_PROFILE_TTL=5*60*1000;
const safeVkPhoto=value=>{
 if(typeof value!=='string'||value.length>650)return '';
 try{
  const u=new URL(value);
  return u.protocol==='https:'&&/(^|\.)(userapi\.com|vkcdn\.ru|vk\.com|vk\.ru)$/.test(u.hostname.toLowerCase())?u.href:'';
 }catch(_){return ''}
};
export function clanReputation(days){
 const n=Math.max(0,Number(days)||0);
 const tiers=[{days:0,title:'Новобранец',icon:'🌱'},{days:7,title:'Активист',icon:'🥉'},{days:30,title:'Опора клана',icon:'🥈'},{days:100,title:'Ветеран',icon:'🥇'},{days:365,title:'Легенда клана',icon:'👑'}];
 const index=tiers.reduce((best,t,i)=>n>=t.days?i:best,0);
 return {...tiers[index],completed:n,next:tiers[index+1]?.days??null,bonus:[0,5,10,15,25][index],frame:['','#b78aff','#72cdb5','#efc66d','#ed9aff'][index]};
}
async function withClanReputation(pool,members){
 if(!members.length)return members;
 const counts=await pool.query('SELECT player_id,COUNT(*)::int AS days FROM lucky_clan_personal_daily WHERE player_id=ANY($1::text[]) AND claimed_at IS NOT NULL GROUP BY player_id',[members.map(m=>m.playerId)]);
 const map=new Map(counts.rows.map(x=>[x.player_id,x.days]));
 return members.map(m=>({...m,reputation:clanReputation(map.get(m.playerId)||0)}));
}
async function vkMemberProfiles(members,token=process.env.VK_GROUP_SERVICE_TOKEN){
 const ids=[...new Set(members.map(m=>String(m.playerId||'').replace(/^vk:/,'')).filter(x=>/^[1-9][0-9]{0,18}$/.test(x)))];
 const now=Date.now(),missing=ids.filter(id=>!memberProfilesCache.has(id)||memberProfilesCache.get(id).until<=now);
 if(missing.length&&token){
  try{
   const params=new URLSearchParams({user_ids:missing.join(','),fields:'photo_100',access_token:token,v:'5.199'});
   const response=await fetch('https://api.vk.com/method/users.get',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params,signal:AbortSignal.timeout(5000)
   });
   if(!response.ok)throw Error('VK HTTP '+response.status);
   const result=await response.json();
   if(!Array.isArray(result?.response))throw Error('VK response unavailable');
   for(const user of result.response){
    const id=String(user.id||'');
    if(!missing.includes(id))continue;
    const name=[user.first_name,user.last_name].filter(x=>typeof x==='string'&&x.trim()).join(' ').trim().slice(0,100);
    memberProfilesCache.set(id,{until:now+MEMBER_PROFILE_TTL,name:name||'Игрок VK',avatar:safeVkPhoto(user.photo_100)});
   }
  }catch(error){console.warn('[clans] VK member previews unavailable:',error.code||error.message)}
 }
 return members.map(member=>{
  const id=String(member.playerId||'').replace(/^vk:/,'');
  const profile=memberProfilesCache.get(id);
  return {...member,profileName:profile?.until>now?profile.name:'Профиль VK',
   profileAvatar:profile?.until>now?profile.avatar:'',profileUrl:/^[1-9][0-9]{0,18}$/.test(id)?'https://vk.com/id'+id:''};
 });
}
const clanFields=`c.id,c.group_id AS "groupId",c.name,c.avatar,c.owner_id AS "ownerId",c.headquarters,c.wall,c.coins,c.equipped_style AS "equippedStyle",c.join_policy AS "joinPolicy",c.min_income AS "minIncome",c.seat_tier AS "seatTier",(10+c.seat_tier*5)::int AS "memberCapacity",(50000+c.headquarters*c.headquarters*80000)::bigint AS "treasuryCapacity",c.created_at AS "createdAt",(SELECT COUNT(*)::int FROM lucky_clan_members m WHERE m.clan_id=c.id) AS "memberCount"`;
// Fixed targets per UTC period. Existing rewards retain their original keys.
// Capped rewards keep high-income clans from gaining unlimited XP.
// Shared clan perk: only the free daily treasury contribution is boosted.
export function clanLevelBonus(xp){
 const level=1+Math.floor(Math.max(0,Number(xp)||0)/1000);
 const percent=Math.min(50,Math.floor((level-1)/5)*5);
 return {level,percent,dailyReward:Math.floor(500*(100+percent)/100)};
}
export function clanMissionRewards(targets){
 const scale=(value,base)=>Math.max(1,Math.min(3,1+Math.log10(Math.max(1,Number(value)/base))));
 const round=(base,factor)=>Math.round(base*factor/25)*25;
 return {dailyClaims:round(100,scale(targets.dailyParticipants,3)),dailyDeposits:round(150,scale(targets.dailyCoins,10000)),weeklyDeposits:round(500,scale(targets.weeklyCoins,50000)),weeklyUpgrades:400};
}
async function missionTargets(pool,id){
 const incomes=await pool.query(`SELECT s.save->'buildings' AS buildings, s.save->'businesses' AS businesses, s.save->'businessStaff' AS "businessStaff", s.save->'businessManagers' AS "businessManagers", s.save->'businessLicenses' AS "businessLicenses" FROM lucky_clan_members m LEFT JOIN public.casino_city_saves s ON s.vk_id::text=regexp_replace(m.player_id,'^vk:','') WHERE m.clan_id=$1`,[id]);
 const totalIncome=Math.ceil(incomes.rows.reduce((sum,row)=>sum+clanIncome(row),0));
 const totalLimit=incomes.rows.reduce((sum,row)=>sum+clanDepositLimit(row),0)||100000;
 const {rows}=await pool.query(`WITH periods AS (
 SELECT (NOW() AT TIME ZONE 'UTC')::date AS d,date_trunc('week',NOW() AT TIME ZONE 'UTC')::date AS w
 ), roster AS (
 SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1
 ), base AS (
 SELECT GREATEST(1,r.n) AS n,c.headquarters,c.wall,
 (50000+c.headquarters*c.headquarters*80000)::bigint AS cap
 FROM lucky_clans c CROSS JOIN roster r WHERE c.id=$1
 ), targets AS (
 SELECT p.d,p.w, GREATEST(1,CEIL(b.n*0.6))::int AS participants,
 LEAST(b.cap,$3::bigint,GREATEST(1000,b.n*1000::bigint,CEIL($2::numeric*0.5)::bigint)) AS daily_coins,
 LEAST(b.cap*3,$3::bigint*7,GREATEST(5000,b.n*5000::bigint,$2::bigint*3)) AS weekly_coins
 FROM base b CROSS JOIN periods p
 ), ins AS (
 INSERT INTO lucky_clan_mission_targets(clan_id,scope,period_start,participants,coins)
 SELECT $1,v.scope,v.period_start,t.participants,v.coins FROM targets t CROSS JOIN LATERAL
 (VALUES ('daily',t.d,t.daily_coins),('weekly',t.w,t.weekly_coins)) v(scope,period_start,coins)
 ON CONFLICT DO NOTHING RETURNING scope
 ) SELECT COUNT(*) FROM ins`,[id,totalIncome,totalLimit]);
 const saved=await pool.query(`SELECT scope,participants,coins FROM lucky_clan_mission_targets WHERE clan_id=$1 AND
 ((scope='daily' AND period_start=(NOW() AT TIME ZONE 'UTC')::date) OR
 (scope='weekly' AND period_start=date_trunc('week',NOW() AT TIME ZONE 'UTC')::date))`,[id]);
 const d=saved.rows.find(x=>x.scope==='daily'),w=saved.rows.find(x=>x.scope==='weekly');
 if(!d||!w)throw Error('MISSION_TARGETS_UNAVAILABLE');
 return {dailyParticipants:Number(d.participants),weeklyParticipants:Number(w.participants),dailyCoins:Number(d.coins),weeklyCoins:Number(w.coins)};
}
async function mine(pool,playerId){
 const {rows}=await pool.query(`SELECT ${clanFields},m.role,m.last_claim AS "lastClaim" FROM lucky_clans c JOIN lucky_clan_members m ON m.clan_id=c.id WHERE m.player_id=$1`,[playerId]);
 if(!rows[0])return null;
 const members=await pool.query(`SELECT m.player_id AS "playerId",m.role,m.joined_at AS "joinedAt",
 COALESCE(SUM(t.coins) FILTER(WHERE t.action='deposit'),0)::bigint AS "contributed",
 COUNT(t.id) FILTER(WHERE t.action='deposit')::int AS "deposits",
 COALESCE(SUM(t.coins) FILTER(WHERE t.action='deposit' AND t.created_at>=date_trunc('week',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND t.created_at>=m.joined_at),0)::bigint AS "weeklyContribution",
 COUNT(t.id) FILTER(WHERE t.action='deposit' AND t.created_at>=date_trunc('week',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND t.created_at>=m.joined_at)::int AS "weeklyTransfers",
 COUNT(DISTINCT (t.created_at AT TIME ZONE 'UTC')::date) FILTER(WHERE t.action IN ('deposit','daily','headquarters','wall','seats') AND t.created_at>=date_trunc('week',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AND t.created_at>=m.joined_at)::int AS "weeklyActiveDays",
 MAX(t.created_at) FILTER(WHERE t.action IN ('deposit','daily','headquarters','wall','seats') AND t.created_at>=m.joined_at) AS "lastClanAction"
 FROM lucky_clan_members m
 LEFT JOIN lucky_clan_transactions t ON t.clan_id=m.clan_id
  AND t.player_id=m.player_id
 WHERE m.clan_id=$1
 GROUP BY m.player_id,m.role,m.joined_at
 ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END,
  m.joined_at LIMIT 50`,[rows[0].id]);
 const log=await pool.query('SELECT action,coins,player_id AS "playerId",created_at AS "createdAt" FROM lucky_clan_transactions WHERE clan_id=$1 ORDER BY created_at DESC,id DESC LIMIT 25',[rows[0].id]);
 // Shared UTC objectives are calculated from committed transactions, not the client.
 const targets=await missionTargets(pool,rows[0].id);
 const activity=await pool.query(`SELECT
 COUNT(DISTINCT player_id) FILTER(WHERE action='daily' AND created_at>=date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS "dailyClaims",
 COALESCE(SUM(coins) FILTER(WHERE action='deposit' AND created_at>=date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'),0)::bigint AS "dailyDeposits",
 COUNT(DISTINCT player_id) FILTER(WHERE action='deposit' AND created_at>=date_trunc('day',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS "dailyContributors",
 COUNT(DISTINCT player_id) FILTER(WHERE action='deposit')::int AS "weeklyContributors",
 COALESCE(SUM(coins) FILTER(WHERE action='deposit'),0)::bigint AS "weeklyDeposits",
 COUNT(*) FILTER(WHERE action IN ('headquarters','wall','seats'))::int AS "weeklyUpgrades"
 FROM lucky_clan_transactions WHERE clan_id=$1
 AND created_at>=date_trunc('week',NOW() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'`,[rows[0].id]);
 const rewards=await pool.query(`SELECT COALESCE(SUM(xp),0)::bigint AS xp FROM lucky_clan_mission_rewards WHERE clan_id=$1`,[rows[0].id]);
 const own=await pool.query(`SELECT s.save->'buildings' AS buildings, s.save->'businesses' AS businesses, s.save->'businessStaff' AS "businessStaff", s.save->'businessManagers' AS "businessManagers", s.save->'businessLicenses' AS "businessLicenses" FROM public.casino_city_saves s WHERE s.vk_id=$1`,[String(playerId).replace(/^vk:/,'')]);
 const depositLimit=clanDepositLimit(own.rows[0]);
 const projectRows=(await pool.query('SELECT project_id,level FROM lucky_clan_projects WHERE clan_id=$1',[rows[0].id])).rows;
 const levelBonus=clanLevelBonus(rewards.rows[0]?.xp);levelBonus.projectPercent=projectBonus(projectRows);
 const personalDays=(await pool.query('SELECT COUNT(*)::int AS n FROM lucky_clan_personal_daily WHERE player_id=$1 AND claimed_at IS NOT NULL',[playerId])).rows[0].n;
 const reputation=clanReputation(personalDays);levelBonus.reputationPercent=reputation.bonus;levelBonus.dailyReward=Math.floor(levelBonus.dailyReward*(100+levelBonus.projectPercent+reputation.bonus)/100);

 const applications=['owner','officer'].includes(rows[0].role)?await pool.query(`SELECT a.player_id AS "playerId",a.created_at AS "createdAt" FROM lucky_clan_applications a WHERE a.clan_id=$1 AND NOT EXISTS(SELECT 1 FROM lucky_clan_members m WHERE m.player_id=a.player_id) ORDER BY a.created_at LIMIT 100`,[rows[0].id]):{rows:[]};
 const managementLog=rows[0].role==='owner'?await pool.query(`SELECT actor_id AS "actorId",target_id AS "targetId",action,created_at AS "createdAt" FROM lucky_clan_management_log WHERE clan_id=$1 ORDER BY id DESC LIMIT 30`,[rows[0].id]):{rows:[]};
 return {...rows[0],members:await vkMemberProfiles(await withClanReputation(pool,members.rows)),history:log.rows,managementLog:managementLog.rows,applications:await vkMemberProfiles(applications.rows),activity:activity.rows[0]||{},missionTargets:targets,missionRewards:clanMissionRewards(targets),depositLimit,missionXp:Number(rewards.rows[0]?.xp||0),levelBonus};
}
// Seasons are 14 UTC days, starting on a Monday. Points count completed
// mission periods rather than XP amounts, so higher income alone cannot buy rank.
export function clanSeasonWindow(now=Date.now()){
 const anchor=Date.UTC(2026,10,23),duration=14*86400000;
 const number=Math.max(1,Math.floor((now-anchor)/duration)+1);
 const start=new Date(anchor+(number-1)*duration),end=new Date(start.getTime()+duration);
 return {number,start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};
}
export function clanLeague(hq,wall){
 const development=Number(hq)+Number(wall);
 return development>=90?'legend':development>=75?'diamond':development>=55?'platinum':development>=35?'gold':development>=15?'silver':'bronze';
}
async function seasonListing(pool){
 const season=clanSeasonWindow();
 return tx(pool,async c=>{
  // Serialize season snapshots and archive writes across requests.
  await c.query("SELECT pg_advisory_xact_lock(74826531)");
  await c.query(`INSERT INTO lucky_clan_season_entries(season,clan_id,league,name,avatar)
   SELECT $1,id,CASE WHEN headquarters+wall>=90 THEN 'legend' WHEN headquarters+wall>=75 THEN 'diamond' WHEN headquarters+wall>=55 THEN 'platinum' WHEN headquarters+wall>=35 THEN 'gold' WHEN headquarters+wall>=15 THEN 'silver' ELSE 'bronze' END,name,avatar FROM lucky_clans
   ON CONFLICT DO NOTHING`,[season.number]);
  // Only archive seasons with an actual recorded league snapshot.
  await c.query(`WITH scores AS (
   SELECT e.season,e.clan_id,e.league,e.name,
   COALESCE(SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END),0)::int AS points
   FROM lucky_clan_season_entries e LEFT JOIN lucky_clan_mission_rewards r ON r.clan_id=e.clan_id
    AND r.period_start >= DATE '2026-11-23'+(e.season-1)*14 AND r.period_start < DATE '2026-11-23'+e.season*14
   WHERE e.season<$1 AND NOT EXISTS(SELECT 1 FROM lucky_clan_season_results z WHERE z.season=e.season AND z.clan_id=e.clan_id)
   GROUP BY e.season,e.clan_id,e.league,e.name
  ), ranked AS (
   SELECT *,ROW_NUMBER() OVER(PARTITION BY season,league ORDER BY points DESC,clan_id)::int AS rank FROM scores
  )
  INSERT INTO lucky_clan_season_results(season,clan_id,league,name,points,rank)
  SELECT season,clan_id,league,name,points,rank FROM ranked ON CONFLICT DO NOTHING`,[season.number]);
  const {rows}=await c.query(`SELECT e.clan_id AS id,e.name,e.avatar,e.league,
   COALESCE(SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END),0)::int AS points
   FROM lucky_clan_season_entries e JOIN lucky_clans cl ON cl.id=e.clan_id
   LEFT JOIN lucky_clan_mission_rewards r ON r.clan_id=e.clan_id AND r.period_start >= $2::date AND r.period_start < $3::date
   WHERE e.season=$1 GROUP BY e.clan_id,e.name,e.avatar,e.league ORDER BY points DESC,e.clan_id ASC`,[season.number,season.start,season.end]);
  const leagues={bronze:[],silver:[],gold:[],platinum:[],diamond:[],legend:[]};
  for(const row of rows){const list=leagues[row.league];if(list&&list.length<50)list.push({...row,rank:list.length+1});}
  const archive=await c.query(`SELECT season,clan_id AS id,league,name,points,rank FROM lucky_clan_season_results WHERE season=$1 AND rank<=3 AND points>0 ORDER BY league,rank`,[season.number-1]);
  return {...season,leagues,previousWinners:archive.rows};
 });
}
// Pair unmatched clans within the same locked seasonal league and roster-size band.
async function clanDuels(pool,playerId){
 await seasonListing(pool);
 const season=clanSeasonWindow();
 return tx(pool,async c=>{
  await c.query("SELECT pg_advisory_xact_lock(74826532)");
  const week=(await c.query("SELECT date_trunc('week',NOW() AT TIME ZONE 'UTC')::date::text AS week")).rows[0].week;
  await c.query(`WITH eligible AS (
   SELECT e.clan_id,e.name,e.league,cl.headquarters+cl.wall AS development,
    (SELECT COUNT(*) FROM lucky_clan_members m WHERE m.clan_id=e.clan_id) AS members
   FROM lucky_clan_season_entries e JOIN lucky_clans cl ON cl.id=e.clan_id
   WHERE e.season=$1 AND NOT EXISTS(SELECT 1 FROM lucky_clan_weekly_duels d WHERE d.week_start=$2::date AND (d.clan_a=e.clan_id OR d.clan_b=e.clan_id))
  ), grouped AS (
   SELECT *,CASE WHEN members<=3 THEN 1 WHEN members<=10 THEN 2 WHEN members<=20 THEN 3 WHEN members<=35 THEN 4 ELSE 5 END AS size_band
   FROM eligible WHERE members>0
  ), candidates AS (
   SELECT *,ROW_NUMBER() OVER(PARTITION BY league,size_band ORDER BY members,development,clan_id) AS n FROM grouped
  )
  INSERT INTO lucky_clan_weekly_duels(week_start,clan_a,clan_b,league,name_a,name_b)
  SELECT $2::date,a.clan_id,b.clan_id,a.league,a.name,b.name FROM candidates a JOIN candidates b ON a.league=b.league AND a.size_band=b.size_band AND b.n=a.n+1 WHERE MOD(a.n,2)=1
  ON CONFLICT DO NOTHING`,[season.number,week]);
  const {rows}=await c.query(`SELECT d.week_start::text AS "start",(d.week_start+7)::text AS "end",
  d.clan_a AS "clanA",d.clan_b AS "clanB",d.name_a AS "nameA",d.name_b AS "nameB",d.league,
  COALESCE((SELECT SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END) FROM lucky_clan_mission_rewards r WHERE r.clan_id=d.clan_a AND r.period_start>=d.week_start AND r.period_start<d.week_start+7),0)::int AS "pointsA",
  COALESCE((SELECT SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END) FROM lucky_clan_mission_rewards r WHERE r.clan_id=d.clan_b AND r.period_start>=d.week_start AND r.period_start<d.week_start+7),0)::int AS "pointsB"
  FROM lucky_clan_weekly_duels d JOIN lucky_clan_members m ON (m.clan_id=d.clan_a OR m.clan_id=d.clan_b) WHERE m.player_id=$1 AND d.week_start=$2::date`,[playerId,week]);
  // Archive completed matches once. No currency awards or personal save changes.
  await c.query(`WITH scores AS (
   SELECT d.*,
   COALESCE((SELECT SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END) FROM lucky_clan_mission_rewards r WHERE r.clan_id=d.clan_a AND r.period_start>=d.week_start AND r.period_start<d.week_start+7),0)::int AS pa,
   COALESCE((SELECT SUM(CASE WHEN r.mission IN ('daily_claims','daily_deposits') THEN 10 WHEN r.mission IN ('weekly_deposits','weekly_upgrades') THEN 40 ELSE 0 END) FROM lucky_clan_mission_rewards r WHERE r.clan_id=d.clan_b AND r.period_start>=d.week_start AND r.period_start<d.week_start+7),0)::int AS pb
   FROM lucky_clan_weekly_duels d WHERE d.week_start+7<=$1::date AND NOT EXISTS(SELECT 1 FROM lucky_clan_duel_results z WHERE z.week_start=d.week_start AND z.clan_a=d.clan_a)
  )
  INSERT INTO lucky_clan_duel_results(week_start,clan_a,clan_b,name_a,name_b,points_a,points_b,winner)
  SELECT week_start,clan_a,clan_b,name_a,name_b,pa,pb,CASE WHEN pa>pb THEN clan_a WHEN pb>pa THEN clan_b ELSE NULL END FROM scores ON CONFLICT DO NOTHING`,[week]);
  const history=await c.query(`SELECT z.week_start::text AS "start",
  CASE WHEN z.clan_a=m.clan_id THEN z.name_b ELSE z.name_a END AS opponent,
  CASE WHEN z.clan_a=m.clan_id THEN z.points_a ELSE z.points_b END AS "myPoints",
  CASE WHEN z.clan_a=m.clan_id THEN z.points_b ELSE z.points_a END AS "opponentPoints",
  CASE WHEN z.winner IS NULL THEN 'draw' WHEN z.winner=m.clan_id THEN 'win' ELSE 'loss' END AS outcome
  FROM lucky_clan_duel_results z JOIN lucky_clan_members m ON m.clan_id IN(z.clan_a,z.clan_b)
  WHERE m.player_id=$1 ORDER BY z.week_start DESC LIMIT 20`,[playerId]);
  const stats=await c.query(`SELECT COUNT(*) FILTER(WHERE z.winner=m.clan_id)::int AS wins,
  COUNT(*) FILTER(WHERE z.winner IS NOT NULL AND z.winner<>m.clan_id)::int AS losses,
  COUNT(*) FILTER(WHERE z.winner IS NULL)::int AS draws
  FROM lucky_clan_duel_results z JOIN lucky_clan_members m ON m.clan_id IN(z.clan_a,z.clan_b) WHERE m.player_id=$1`,[playerId]);
  return {week,duel:rows[0]||null,history:history.rows,stats:stats.rows[0]};
 });
}
async function listing(pool){
 const {rows}=await pool.query(`SELECT ${clanFields}, (c.headquarters*1000+c.wall*600+(SELECT COUNT(*) FROM lucky_clan_members m WHERE m.clan_id=c.id)*50)::bigint AS score FROM lucky_clans c ORDER BY score DESC,c.created_at ASC LIMIT 100`);
 return rows;
}
export const CLAN_SEAT_PRICES=Object.freeze([100000,200000,350000,600000,1000000,1600000,2500000,4000000]);
export const CLAN_SEAT_BASE=10;
export const clanSeatCapacity=tier=>CLAN_SEAT_BASE+Math.min(8,Math.max(0,Number(tier)||0))*5;
export const PREMIUM_LEVELS=Object.freeze({headquarters:Object.freeze([5,10,15,20,30,40]),wall:Object.freeze([5,10,15,20,30,40])});
const premiumUpgrade=(kind,nextLevel)=>PREMIUM_LEVELS[kind]?.includes(nextLevel)||false;
export function upgradeCost(kind,level){return Math.ceil((kind==='headquarters'?1:0.75)*(10000+30000*Math.pow(level-1,2)+600*Math.pow(level-1,3))/100)*100}
async function checkAdmissionIncome(c,playerId,minimum){
 const min=Number(minimum)||0;if(min<=0)return;
 const save=await c.query("SELECT save->'buildings' AS buildings, save->'businesses' AS businesses, save->'businessStaff' AS \"businessStaff\", save->'businessManagers' AS \"businessManagers\", save->'businessLicenses' AS \"businessLicenses\" FROM public.casino_city_saves WHERE vk_id=$1",[String(playerId).replace(/^vk:/,'')]);
 if(clanIncome(save.rows[0])<min)fail('Для вступления требуется базовый доход не менее '+min.toLocaleString('ru-RU')+' монет в час',403);
}
async function personalDaily(c,playerId){
 const member=(await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[playerId])).rows[0];
 if(!member)fail('Сначала вступите в клан',403);
 const day=(await c.query("SELECT (NOW() AT TIME ZONE 'UTC')::date::text AS day")).rows[0].day;
 const save=(await c.query("SELECT save->'buildings' AS buildings, save->'businesses' AS businesses, save->'businessStaff' AS \"businessStaff\", save->'businessManagers' AS \"businessManagers\", save->'businessLicenses' AS \"businessLicenses\" FROM public.casino_city_saves WHERE vk_id=$1",[String(playerId).replace(/^vk:/,'')])).rows[0];
 await c.query('INSERT INTO lucky_clan_personal_daily(player_id,day,clan_id,target) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[playerId,day,member.clan_id,personalClanTarget(clanIncome(save))]);
 const task=(await c.query('SELECT clan_id,target,claimed_at,prize FROM lucky_clan_personal_daily WHERE player_id=$1 AND day=$2 FOR UPDATE',[playerId,day])).rows[0];
 if(String(task.clan_id)!==String(member.clan_id))fail('Сегодня задание закреплено за прежним кланом. Новое будет завтра.');
 const progress=(await c.query("SELECT COALESCE(SUM(coins),0)::bigint AS total FROM lucky_clan_transactions WHERE clan_id=$1 AND player_id=$2 AND action='deposit' AND (created_at AT TIME ZONE 'UTC')::date=$3::date",[member.clan_id,playerId,day])).rows[0];
 const target=Number(task.target);
 return {day,clanId:member.clan_id,target,progress:Number(progress.total),reward:Math.min(500000,Math.floor(target*0.05)),claimed:!!task.claimed_at,prize:Number(task.prize)};
}
async function personalWeekly(c,playerId){
 const member=(await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[playerId])).rows[0];
 if(!member)fail('Сначала вступите в клан',403);
 const week=(await c.query("SELECT date_trunc('week',NOW() AT TIME ZONE 'UTC')::date::text AS week")).rows[0].week;
 await c.query('INSERT INTO lucky_clan_personal_weekly(player_id,week,clan_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[playerId,week,member.clan_id]);
 const task=(await c.query('SELECT clan_id,claimed_at,prize FROM lucky_clan_personal_weekly WHERE player_id=$1 AND week=$2 FOR UPDATE',[playerId,week])).rows[0];
 if(String(task.clan_id)!==String(member.clan_id))fail('Задание недели закреплено за прежним кланом');
 const counts=(await c.query(`SELECT COUNT(*) FILTER(WHERE day >= $3::date AND day < $3::date+7)::int AS weekly,COUNT(*)::int AS lifetime,COALESCE(SUM(target) FILTER(WHERE day >= $3::date AND day < $3::date+7),0)::bigint AS effort
 FROM lucky_clan_personal_daily WHERE player_id=$1 AND clan_id=$2 AND claimed_at IS NOT NULL`,[playerId,member.clan_id,week])).rows[0];
 return {week,clanId:member.clan_id,progress:Number(counts.weekly),target:5,lifetime:Number(counts.lifetime),reward:Number(counts.weekly)>=5?Math.min(1250000,Math.floor(Number(counts.effort)*0.02)):null,claimed:!!task.claimed_at,prize:Number(task.prize)};
}
export function registerLuckyClans(app,pool,requireAuth){
 app.get('/api/casino/clans/reputation',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const member=(await pool.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1',[req.playerId])).rows[0];
  if(!member)fail('Сначала вступите в клан',403);
  const rows=(await pool.query('SELECT player_id AS "playerId" FROM lucky_clan_members WHERE clan_id=$1',[member.clan_id])).rows;
  const players=await withClanReputation(pool,rows);
  const own=players.find(x=>x.playerId===req.playerId);
  const ranking=await vkMemberProfiles(players.sort((a,b)=>b.reputation.completed-a.reputation.completed||String(a.playerId).localeCompare(String(b.playerId))));
  res.json({mine:own?.reputation||clanReputation(0),ranking});
 }));

 app.get('/api/casino/clans/personal-achievements',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const member=(await pool.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1',[req.playerId])).rows[0];
  if(!member)fail('Сначала вступите в клан',403);
  const progress=Number((await pool.query('SELECT COUNT(*)::int AS n FROM lucky_clan_personal_daily WHERE player_id=$1 AND claimed_at IS NOT NULL',[req.playerId])).rows[0].n);
  const claimed=(await pool.query('SELECT days,prize FROM lucky_clan_personal_achievements WHERE player_id=$1',[req.playerId])).rows;
  res.json({progress,items:CLAN_ACHIEVEMENTS.map(a=>({...a,claimed:claimed.some(x=>Number(x.days)===a.days),prize:Number(claimed.find(x=>Number(x.days)===a.days)?.prize||0)}))});
 }));
 app.post('/api/casino/clans/personal-achievement-claim',requireAuth,wrap(async(req,res)=>{
  await start(pool);const a=CLAN_ACHIEVEMENTS.find(x=>x.days===req.body?.days);if(!a)fail('Неизвестное достижение');
  const result=await tx(pool,async c=>{
   const member=(await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[req.playerId])).rows[0];
   if(!member)fail('Сначала вступите в клан',403);
   const progress=Number((await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_personal_daily WHERE player_id=$1 AND claimed_at IS NOT NULL',[req.playerId])).rows[0].n);
   if(progress<a.days)fail('Достижение ещё не выполнено');
   const clan=(await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[member.clan_id])).rows[0];if(!clan)fail('Клан не найден',404);
   const free=50000+80000*Number(clan.headquarters)**2-Number(clan.coins);
   if(free<a.reward)fail('Освободите в казне место для всей награды: '+a.reward.toLocaleString('ru-RU')+' монет');
   const claimed=await c.query('INSERT INTO lucky_clan_personal_achievements(player_id,days,clan_id,prize) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING days',[req.playerId,a.days,member.clan_id,a.reward]);
   if(!claimed.rowCount)fail('Награда уже получена',409);
   await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[a.reward,member.clan_id]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'personal_achievement',$3)",[member.clan_id,req.playerId,a.reward]);
   return {ok:true,prize:a.reward};
  });res.json(result);
 }));

 app.get('/api/casino/clans/personal-weekly',requireAuth,wrap(async(req,res)=>{
  await start(pool);res.json(await tx(pool,async c=>personalWeekly(c,req.playerId)));
 }));
 app.post('/api/casino/clans/personal-weekly-claim',requireAuth,wrap(async(req,res)=>{
  await start(pool);const result=await tx(pool,async c=>{
   const task=await personalWeekly(c,req.playerId);
   if(task.claimed)fail('Награда недели уже получена',409);
   if(task.progress<task.target)fail('Выполните 5 личных заданий за неделю');
   const clan=(await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[task.clanId])).rows[0];
   if(!clan)fail('Клан не найден',404);
   const prize=Math.min(task.reward,50000+80000*Number(clan.headquarters)**2-Number(clan.coins));
   if(prize<=0)fail('Казна заполнена');
   const claimed=await c.query('UPDATE lucky_clan_personal_weekly SET claimed_at=NOW(),prize=$3 WHERE player_id=$1 AND week=$2 AND claimed_at IS NULL RETURNING player_id',[req.playerId,task.week,prize]);
   if(!claimed.rowCount)fail('Награда недели уже получена',409);
   await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[prize,task.clanId]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'personal_weekly',$3)",[task.clanId,req.playerId,prize]);
   return {ok:true,prize};
  });res.json(result);
 }));

 app.get('/api/casino/clans/personal-daily',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const task=await tx(pool,async c=>personalDaily(c,req.playerId));
  res.json(task);
 }));
 app.post('/api/casino/clans/personal-daily-claim',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const result=await tx(pool,async c=>{
   const task=await personalDaily(c,req.playerId);
   if(task.claimed)fail('Награда уже получена',409);
   if(task.progress<task.target)fail('Задание ещё не выполнено');
   const clan=(await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[task.clanId])).rows[0];
   if(!clan)fail('Клан не найден',404);
   const prize=Math.min(task.reward,50000+80000*Number(clan.headquarters)**2-Number(clan.coins));
   if(prize<=0)fail('Казна заполнена');
   const claimed=await c.query('UPDATE lucky_clan_personal_daily SET claimed_at=NOW(),prize=$3 WHERE player_id=$1 AND day=$2 AND claimed_at IS NULL RETURNING player_id',[req.playerId,task.day,prize]);
   if(!claimed.rowCount)fail('Награда уже получена',409);
   await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[prize,task.clanId]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'personal_daily',$3)",[task.clanId,req.playerId,prize]);
   return {ok:true,prize};
  });res.json(result);
 }));

 app.get('/api/casino/clans/projects',requireAuth,wrap(async(req,res)=>{
  await start(pool);const clan=(await pool.query('SELECT cl.id,cl.coins,m.role FROM lucky_clans cl JOIN lucky_clan_members m ON m.clan_id=cl.id WHERE m.player_id=$1',[req.playerId])).rows[0];
  if(!clan)fail('Сначала вступите в клан',403);
  const rows=(await pool.query('SELECT project_id,level FROM lucky_clan_projects WHERE clan_id=$1',[clan.id])).rows;
  res.json({coins:clan.coins,canManage:clan.role==='owner',bonus:projectBonus(rows),items:CLAN_PROJECTS.map(p=>{const level=Number(rows.find(x=>x.project_id===p.id)?.level||0);return {...p,level,nextCost:level<5?p.base+p.step*level:null}})});
 }));
 app.post('/api/casino/clans/project-upgrade',requireAuth,wrap(async(req,res)=>{
  await start(pool);const p=CLAN_PROJECTS.find(x=>x.id===req.body?.projectId),expected=req.body?.expectedLevel;
  if(!p||!Number.isInteger(expected)||expected<0||expected>=5)fail('Некорректный проект');
  await tx(pool,async c=>{
   const clan=(await c.query('SELECT id,coins FROM lucky_clans WHERE owner_id=$1 FOR UPDATE',[req.playerId])).rows[0];if(!clan)fail('Только глава может развивать проекты',403);
   const current=(await c.query('SELECT level FROM lucky_clan_projects WHERE clan_id=$1 AND project_id=$2',[clan.id,p.id])).rows[0];
   if(Number(current?.level||0)!==expected)fail('Уровень уже изменился',409);
   const cost=p.base+p.step*expected;
   const paid=await c.query('UPDATE lucky_clans SET coins=coins-$1 WHERE id=$2 AND coins>=$1 RETURNING id',[cost,clan.id]);if(!paid.rowCount)fail('Недостаточно монет в казне');
   await c.query('INSERT INTO lucky_clan_projects(clan_id,project_id,level) VALUES($1,$2,$3) ON CONFLICT(clan_id,project_id) DO UPDATE SET level=EXCLUDED.level',[clan.id,p.id,expected+1]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'project',$3)",[clan.id,req.playerId,-cost]);
  });res.json({ok:true});
 }));

 app.get('/api/casino/clans/shop',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const clan=(await pool.query('SELECT cl.id,cl.coins,cl.equipped_style,m.role FROM lucky_clans cl JOIN lucky_clan_members m ON m.clan_id=cl.id WHERE m.player_id=$1',[req.playerId])).rows[0];
  if(!clan)fail('Сначала вступите в клан',403);
  const owned=await pool.query('SELECT item_id FROM lucky_clan_shop_owned WHERE clan_id=$1',[clan.id]);
  res.json({items:CLAN_SHOP,owned:owned.rows.map(x=>x.item_id),equipped:clan.equipped_style,coins:clan.coins,canManage:clan.role==='owner'});
 }));
 app.post('/api/casino/clans/shop-buy',requireAuth,wrap(async(req,res)=>{
  await start(pool);const item=CLAN_SHOP.find(x=>x.id===req.body?.itemId);if(!item)fail('Предмет не найден',404);
  await tx(pool,async c=>{
   const clan=(await c.query('SELECT id,coins FROM lucky_clans WHERE owner_id=$1 FOR UPDATE',[req.playerId])).rows[0];
   if(!clan)fail('Покупать может только глава',403);
   const added=await c.query('INSERT INTO lucky_clan_shop_owned(clan_id,item_id) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING item_id',[clan.id,item.id]);
   if(!added.rowCount)fail('Предмет уже приобретён',409);
   const paid=await c.query('UPDATE lucky_clans SET coins=coins-$1 WHERE id=$2 AND coins>=$1 RETURNING id',[item.price,clan.id]);
   if(!paid.rowCount)fail('Недостаточно монет в казне');
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'shop',$3)",[clan.id,req.playerId,-item.price]);
  });res.json({ok:true});
 }));
 app.post('/api/casino/clans/shop-equip',requireAuth,wrap(async(req,res)=>{
  await start(pool);const itemId=req.body?.itemId;if(typeof itemId!=='string'||(itemId!==''&&!CLAN_SHOP.some(x=>x.id===itemId)))fail('Предмет не найден');
  const updated=await pool.query("UPDATE lucky_clans cl SET equipped_style=$1 WHERE owner_id=$2 AND ($1='' OR EXISTS(SELECT 1 FROM lucky_clan_shop_owned o WHERE o.clan_id=cl.id AND o.item_id=$1)) RETURNING id",[itemId,req.playerId]);
  if(!updated.rowCount)fail('Нет прав или предмет не приобретён',403);res.json({ok:true});
 }));

 app.post('/api/casino/clans/min-income',requireAuth,wrap(async(req,res)=>{
  await start(pool);const minimum=req.body?.minimum;
  if(!Number.isSafeInteger(minimum)||minimum<0||minimum>10000000)fail('Укажите доход от 0 до 10 000 000 монет в час');
  const changed=await pool.query('UPDATE lucky_clans SET min_income=$1 WHERE owner_id=$2 RETURNING id',[minimum,req.playerId]);
  if(!changed.rowCount)fail('Только глава может менять требования',403);res.json({ok:true});
 }));
 app.get('/api/casino/clans',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const p=await pool.query('SELECT balance FROM lucky_clan_permits WHERE vk_id=$1',[String(req.playerId).replace(/^vk:/,'')]);
  const invites=await pool.query(`SELECT cl.id,cl.name,cl.avatar,i.created_at AS "createdAt" FROM lucky_clan_invites i JOIN lucky_clans cl ON cl.id=i.clan_id WHERE i.player_id=$1 AND i.created_at>NOW()-INTERVAL '7 days' AND cl.join_policy<>'closed' AND NOT EXISTS(SELECT 1 FROM lucky_clan_members WHERE player_id=$1) ORDER BY i.created_at DESC LIMIT 30`,[req.playerId]);
  res.json({invites:invites.rows,mine:await mine(pool,req.playerId),leaders:await listing(pool),permits:Number(p.rows[0]?.balance||0),premiumLevels:PREMIUM_LEVELS,
   seatPrices:CLAN_SEAT_PRICES,baseMemberCapacity:CLAN_SEAT_BASE});
 }));
 // Read-only public clan card, available to signed-in VK players.
 // Never expose personal cloud saves or grant management powers here.
 app.get('/api/casino/clans/season',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  res.json(await seasonListing(pool));
 }));
 // Tournament roster and league are frozen on first access in each UTC period.
 app.get('/api/casino/clans/tournaments',requireAuth,wrap(async(req,res)=>{
  await start(pool);const season=await seasonListing(pool);
  const result=await tx(pool,async c=>{
   await c.query('SELECT pg_advisory_xact_lock(74826533)');
   const dates=(await c.query("SELECT (NOW() AT TIME ZONE 'UTC')::date::text AS today,date_trunc('week',NOW() AT TIME ZONE 'UTC')::date::text AS week,((NOW() AT TIME ZONE 'UTC')::date+1)::text AS tomorrow,(date_trunc('week',NOW() AT TIME ZONE 'UTC')::date+7)::text AS weekend")).rows[0];
   const own=(await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1',[req.playerId])).rows[0]?.clan_id;
   const pointsSql=`SELECT e.clan_id AS id,e.league,e.band,e.name,e.avatar,e.members,COUNT(d.vk_id)::int AS points
    FROM lucky_clan_tournament_entries e LEFT JOIN lucky_clan_tournament_roster r ON r.kind=e.kind AND r.period_start=e.period_start AND r.clan_id=e.clan_id
    LEFT JOIN lucky_clan_daily_claims d ON d.vk_id::text=regexp_replace(r.player_id,'^vk:','') AND d.clan_id=e.clan_id AND d.claim_day >= e.period_start AND d.claim_day < $3::date
    WHERE e.kind=$1 AND e.period_start=$2::date GROUP BY e.clan_id,e.league,e.band,e.name,e.avatar,e.members`;
   const expired=await c.query('SELECT kind,period_start::text AS start,period_end::text AS end FROM lucky_clan_tournament_periods WHERE NOT finished AND period_end <= $1::date ORDER BY period_start,kind',[dates.today]);
   for(const p of expired.rows){
    const ranked=await c.query(`WITH scores AS (${pointsSql}), ranks AS (SELECT *,RANK() OVER(PARTITION BY league,band ORDER BY points DESC)::int AS rank,COUNT(*) OVER(PARTITION BY league,band) AS competitors,COUNT(*) FILTER(WHERE points>0) OVER(PARTITION BY league,band) AS active FROM scores) SELECT * FROM ranks ORDER BY id`,[p.kind,p.start,p.end]);
    for(const row of ranked.rows){
     let prize=0;
     // Require at least two scoring clans. Tied ranks share the same nominal prize.
     if(row.points>0&&Number(row.active)>=2&&row.rank<=3){
      const nominal=([0,10000,6000,3000][row.rank]||0)*(p.kind==='weekly'?5:1);
      const cl=(await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[row.id])).rows[0];
      if(cl){
       prize=Math.max(0,Math.min(nominal,50000+80000*Number(cl.headquarters)**2-Number(cl.coins)));
       if(prize>0){
        await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[prize,row.id]);
        await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins,request_id) VALUES($1,'system','tournament',$2,$3)",[row.id,prize,'tournament:'+p.kind+':'+p.start+':'+row.id]);
       }
      }
     }
     await c.query('INSERT INTO lucky_clan_tournament_results(kind,period_start,clan_id,league,band,name,points,rank,prize) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[p.kind,p.start,row.id,row.league,row.band,row.name,row.points,row.rank,prize]);
    }
    await c.query('UPDATE lucky_clan_tournament_periods SET finished=TRUE WHERE kind=$1 AND period_start=$2',[p.kind,p.start]);
   }
   const output={today:dates.today,week:dates.week,dailyEnd:dates.tomorrow,weeklyEnd:dates.weekend,preview:false,mine:null};
   for(const [kind,start,end] of [['daily',dates.today,dates.tomorrow],['weekly',dates.week,dates.weekend]]){
    const created=await c.query('INSERT INTO lucky_clan_tournament_periods(kind,period_start,period_end) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING kind',[kind,start,end]);
    if(created.rowCount){
     await c.query(`WITH roster AS MATERIALIZED (
      SELECT m.player_id,m.clan_id,e.league,cl.name,cl.avatar FROM lucky_clan_members m JOIN lucky_clan_season_entries e ON e.clan_id=m.clan_id AND e.season=$3 JOIN lucky_clans cl ON cl.id=m.clan_id
     ), entries AS (
      INSERT INTO lucky_clan_tournament_entries(kind,period_start,clan_id,league,band,name,avatar,members)
      SELECT $1,$2,clan_id,league,CASE WHEN COUNT(*)<=3 THEN 1 WHEN COUNT(*)<=10 THEN 2 WHEN COUNT(*)<=20 THEN 3 WHEN COUNT(*)<=35 THEN 4 ELSE 5 END,name,avatar,COUNT(*)::int FROM roster GROUP BY clan_id,league,name,avatar RETURNING clan_id
     )
     INSERT INTO lucky_clan_tournament_roster(kind,period_start,player_id,clan_id)
     SELECT $1,$2,r.player_id,r.clan_id FROM roster r JOIN entries e ON e.clan_id=r.clan_id`,[kind,start,season.number]);
    }
    const rows=(await c.query(`WITH scores AS (${pointsSql}) SELECT *,RANK() OVER(PARTITION BY league,band ORDER BY points DESC)::int AS rank FROM scores ORDER BY rank,id`,[kind,start,end])).rows;
    const mine=rows.find(x=>String(x.id)===String(own));
    output[kind]=mine?rows.filter(x=>x.league===mine.league&&x.band===mine.band):[];
    output[kind+'Category']=mine?{league:mine.league,band:mine.band}:null;
    if(mine&&!output.mine)output.mine={id:mine.id,league:mine.league,band:mine.band};
   }
   output.history=own?(await c.query('SELECT kind,period_start::text AS start,points,rank,prize FROM lucky_clan_tournament_results WHERE clan_id=$1 ORDER BY period_start DESC,kind LIMIT 20',[own])).rows:[];
   return output;
  });res.json(result);
 }));
 app.get('/api/casino/clans/duel',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  res.json(await clanDuels(pool,req.playerId));
 }));
 app.get('/api/casino/clans/:id',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  if(!validId(req.params?.id))fail('Некорректный клан');
  const found=await pool.query(`SELECT ${clanFields},
   (c.headquarters*1000+c.wall*600+
    (SELECT COUNT(*) FROM lucky_clan_members m WHERE m.clan_id=c.id)*50)::bigint AS score
   FROM lucky_clans c WHERE c.id=$1`,[req.params.id]);
  if(!found.rowCount)fail('Клан не найден',404);
  const clan=found.rows[0];
  const members=await pool.query(`SELECT m.player_id AS "playerId",m.role,m.joined_at AS "joinedAt",
    COALESCE(SUM(t.coins) FILTER(WHERE t.action='deposit'),0)::bigint AS "contributed",
    COUNT(t.id) FILTER(WHERE t.action='deposit')::int AS "deposits"
   FROM lucky_clan_members m
   LEFT JOIN lucky_clan_transactions t ON t.clan_id=m.clan_id AND t.player_id=m.player_id
   WHERE m.clan_id=$1
   GROUP BY m.player_id,m.role,m.joined_at
   ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END,
    m.joined_at LIMIT 50`,[clan.id]);
  const totals=await pool.query(`SELECT
   COALESCE(SUM(coins) FILTER(WHERE action='deposit'),0)::bigint AS "totalDeposited",
   COUNT(*) FILTER(WHERE action='deposit')::int AS "depositCount",
   COUNT(*) FILTER(WHERE action='daily')::int AS "dailyClaims",
   COUNT(*) FILTER(WHERE action='headquarters')::int AS "headquartersUpgrades",
   COUNT(*) FILTER(WHERE action='wall')::int AS "wallUpgrades",
   COUNT(*) FILTER(WHERE action='seats')::int AS "seatUpgrades"
   FROM lucky_clan_transactions WHERE clan_id=$1`,[clan.id]);
  const honors=await pool.query(`SELECT season,league,rank,points FROM lucky_clan_season_results WHERE clan_id=$1 AND rank BETWEEN 1 AND 3 AND points>0 AND season<$2 ORDER BY season DESC LIMIT 30`,[clan.id,clanSeasonWindow().number]);
  return res.json({clan:{...clan,seasonHonors:honors.rows,members:await vkMemberProfiles(await withClanReputation(pool,members.rows)),
   stats:totals.rows[0]||{},communityUrl:'https://vk.com/club'+String(clan.groupId)},
   premiumLevels:PREMIUM_LEVELS,seatPrices:CLAN_SEAT_PRICES});
 }));
 app.post('/api/casino/clans/lookup',requireAuth,wrap(async(req,res)=>{
  const name=String(req.body?.community||'').trim();
  if(!/^[a-zA-Z0-9_.]{1,100}$/.test(name))fail('Введите ссылку или ID сообщества VK');
  const raw=await serviceVK('groups.getById',{group_ids:name,fields:'photo_200'});
  const group=(Array.isArray(raw)?raw:raw?.groups)?.[0];
  if(!validId(group?.id))fail('Сообщество не найдено',404);
  res.json(cleanVKGroup(raw,Number(group.id)));
 }));
 app.post('/api/casino/clans/challenge',requireAuth,wrap(async(req,res)=>{
  const groupId=Number(req.body?.groupId);
  if(!validId(groupId))fail('Выберите сообщество VK');
  if(!process.env.VK_GROUP_SERVICE_TOKEN)fail('Сервисный ключ VK не настроен',503);
  res.json({code:clanChallenge(req.playerId,groupId,Math.floor(Date.now()/900000))});
 }));
 app.post('/api/casino/clans/create',requireAuth,wrap(async(req,res)=>{
  req.clanCreateStage='database-initialization';
  console.info('[clans-create] received',JSON.stringify({
   hasGroupId:validId(req.body?.groupId),
   signedAdminLaunch:verifiedCommunityLaunch(req,req.body?.groupId),
   hasCommunityProof:typeof req.body?.communityToken==='string'&&req.body.communityToken.length>0
  }));
  await start(pool);
  req.clanCreateStage='vk-group-verification';
  const group=req.body?.automaticProof===true?
   (await verifyServiceAdmin(req.playerId,req.body?.groupId)||fail('VK_AUTO_PROOF_UNAVAILABLE',409)):
   req.body?.descriptionProof===true?
   await verifyDescriptionProof(req.playerId,req.body?.groupId):
   typeof req.body?.userVKToken==='string'?
   await verifyUserAdminGroup(req.playerId,req.body?.groupId,req.body.userVKToken):
   await verifiedAdminGroup(req.playerId,req.body?.groupId,req.body?.communityToken,verifiedCommunityLaunch(req,req.body?.groupId));
  req.clanCreateStage='database-create';
  const result=await tx(pool,async c=>{
   const existing=await c.query('SELECT 1 FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(existing.rowCount)fail('Вы уже состоите в клане');
   const added=await c.query('INSERT INTO lucky_clans(group_id,name,avatar,owner_id) VALUES($1,$2,$3,$4) ON CONFLICT(group_id) DO NOTHING RETURNING id',[group.groupId,group.name,group.avatar,req.playerId]);
   if(!added.rowCount)fail('Для этого сообщества клан уже создан');
   await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'owner')",[req.playerId,added.rows[0].id]);
   return {id:added.rows[0].id};
  });
  console.info('[clans-create] success');
  res.status(201).json({ok:true,...result});
 }));
 app.post('/api/casino/clans/invite',requireAuth,wrap(async(req,res)=>{
  await start(pool);const target=String(req.body?.playerId||'');
  if(!/^vk:[1-9]\d{0,18}$/.test(target)||target===req.playerId)fail('Введите корректный числовой ID игрока VK');
  await tx(pool,async c=>{
   const own=await c.query("SELECT cl.id,cl.join_policy FROM lucky_clans cl JOIN lucky_clan_members m ON m.clan_id=cl.id WHERE m.player_id=$1 AND m.role IN ('owner','officer') FOR UPDATE OF cl,m",[req.playerId]);
   if(!own.rowCount)fail('Приглашать может только руководство',403);
   const clan=own.rows[0];if(clan.join_policy==='closed')fail('Клан закрыт');
   if((await c.query('SELECT 1 FROM lucky_clan_members WHERE player_id=$1',[target])).rowCount)fail('Игрок уже в клане');
   if(!(await c.query('SELECT 1 FROM public.casino_city_saves WHERE vk_id=$1',[target.slice(3)])).rowCount)fail('Игрок ещё не зарегистрирован в Lucky City',404);
   const count=await c.query("SELECT COUNT(*)::int AS n FROM lucky_clan_invites WHERE clan_id=$1 AND created_at>NOW()-INTERVAL '7 days'",[clan.id]);
   if(count.rows[0].n>=50)fail('Лимит активных приглашений: 50');
   await c.query("INSERT INTO lucky_clan_invites(clan_id,player_id,inviter_id) VALUES($1,$2,$3) ON CONFLICT(clan_id,player_id) DO UPDATE SET created_at=NOW(),inviter_id=EXCLUDED.inviter_id WHERE lucky_clan_invites.created_at<=NOW()-INTERVAL '7 days'",[clan.id,target,req.playerId]);
  });res.json({ok:true});
 }));
 app.post('/api/casino/clans/invite-response',requireAuth,wrap(async(req,res)=>{
  await start(pool);const id=req.body?.id,decision=req.body?.decision;
  if(!validId(id)||!['accept','reject'].includes(decision))fail('Некорректное приглашение');
  await tx(pool,async c=>{
   const found=await c.query('SELECT id,seat_tier,join_policy,min_income FROM lucky_clans WHERE id=$1 FOR UPDATE',[id]);
   if(!found.rowCount)fail('Клан не найден',404);
   const invite=await c.query("SELECT 1 FROM lucky_clan_invites WHERE clan_id=$1 AND player_id=$2 AND created_at>NOW()-INTERVAL '7 days' FOR UPDATE",[id,req.playerId]);
   if(!invite.rowCount)fail('Приглашение истекло',404);
   if(decision==='accept'){
    if(found.rows[0].join_policy==='closed')fail('Клан закрыт');
    await checkAdmissionIncome(c,req.playerId,found.rows[0].min_income);
    const count=await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1',[id]);
    if(count.rows[0].n>=clanSeatCapacity(found.rows[0].seat_tier))fail('Нет свободных мест');
    const added=await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'member') ON CONFLICT(player_id) DO NOTHING RETURNING player_id",[req.playerId,id]);
    if(!added.rowCount)fail('Вы уже состоите в клане');
    await c.query('DELETE FROM lucky_clan_applications WHERE player_id=$1',[req.playerId]);
    await c.query('DELETE FROM lucky_clan_invites WHERE player_id=$1',[req.playerId]);
   }else await c.query('DELETE FROM lucky_clan_invites WHERE clan_id=$1 AND player_id=$2',[id,req.playerId]);
  });res.json({ok:true});
 }));
 app.post('/api/casino/clans/join-policy',requireAuth,wrap(async(req,res)=>{
  await start(pool);const policy=req.body?.policy;if(!['open','request','closed'].includes(policy))fail('Некорректный режим');
  const changed=await pool.query('UPDATE lucky_clans SET join_policy=$1 WHERE owner_id=$2 RETURNING id',[policy,req.playerId]);
  if(!changed.rowCount)fail('Только глава может менять настройки',403);res.json({ok:true});
 }));
 app.post('/api/casino/clans/application',requireAuth,wrap(async(req,res)=>{
  await start(pool);const target=req.body?.playerId,decision=req.body?.decision;
  if(typeof target!=='string'||!/^vk:[1-9]\d{0,18}$/.test(target)||!['accept','reject'].includes(decision))fail('Некорректная заявка');
  await tx(pool,async c=>{
   const own=await c.query(`SELECT cl.id,cl.seat_tier,cl.join_policy,cl.min_income FROM lucky_clans cl JOIN lucky_clan_members m ON m.clan_id=cl.id WHERE m.player_id=$1 AND m.role IN ('owner','officer') FOR UPDATE OF cl,m`,[req.playerId]);
   if(!own.rowCount)fail('Только руководство может рассматривать заявки',403);
   const clan=own.rows[0],application=await c.query('SELECT 1 FROM lucky_clan_applications WHERE clan_id=$1 AND player_id=$2 FOR UPDATE',[clan.id,target]);
   if(!application.rowCount)fail('Заявка не найдена',404);
   if(decision==='accept'){
    if(clan.join_policy==='closed')fail('Сначала откройте приём участников');
    await checkAdmissionIncome(c,target,clan.min_income);
    const count=await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1',[clan.id]);
    if(count.rows[0].n>=clanSeatCapacity(clan.seat_tier))fail('Нет свободных мест');
    const added=await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'member') ON CONFLICT(player_id) DO NOTHING RETURNING player_id",[target,clan.id]);
    if(!added.rowCount)fail('Игрок уже состоит в клане');
    await c.query('DELETE FROM lucky_clan_applications WHERE player_id=$1',[target]);
   }else await c.query('DELETE FROM lucky_clan_applications WHERE clan_id=$1 AND player_id=$2',[clan.id,target]);
   await c.query('INSERT INTO lucky_clan_management_log(clan_id,actor_id,target_id,action) VALUES($1,$2,$3,$4)',[clan.id,req.playerId,target,decision==='accept'?'accept':'reject']);
  });res.json({ok:true});
 }));
 app.post('/api/casino/clans/join',requireAuth,wrap(async(req,res)=>{
  await start(pool);if(!validId(req.body?.id))fail('Некорректный клан');
  const result=await tx(pool,async c=>{
   const found=await c.query('SELECT id,seat_tier,join_policy,min_income FROM lucky_clans WHERE id=$1 FOR UPDATE',[req.body.id]);
   if(!found.rowCount)fail('Клан не найден',404);
   const count=await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1',[req.body.id]);
   if(count.rows[0].n>=clanSeatCapacity(found.rows[0].seat_tier))fail('В клане нет свободных мест. Глава может расширить вместимость до 50.');
   if(found.rows[0].join_policy==='closed')fail('Клан закрыт для вступления',403);
   await checkAdmissionIncome(c,req.playerId,found.rows[0].min_income);
   if(found.rows[0].join_policy==='request'){
    const member=await c.query('SELECT 1 FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);if(member.rowCount)fail('Вы уже состоите в клане');
    await c.query('INSERT INTO lucky_clan_applications(clan_id,player_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[req.body.id,req.playerId]);return {pending:true};
   }
   const added=await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'member') ON CONFLICT(player_id) DO NOTHING RETURNING player_id",[req.playerId,req.body.id]);
   if(!added.rowCount)fail('Вы уже состоите в клане');
   await c.query('DELETE FROM lucky_clan_applications WHERE player_id=$1',[req.playerId]);return {pending:false};
  });res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/leave',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  await tx(pool,async c=>{
   const member=await c.query('SELECT clan_id,role FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[req.playerId]);
   if(!member.rowCount)fail('Вы не состоите в клане');
   const clanId=member.rows[0].clan_id;
   await c.query('SELECT id FROM lucky_clans WHERE id=$1 FOR UPDATE',[clanId]);
   if(member.rows[0].role==='owner'){
    const other=await c.query("SELECT player_id FROM lucky_clan_members WHERE clan_id=$1 AND player_id<>$2 ORDER BY CASE WHEN role='officer' THEN 0 ELSE 1 END,joined_at LIMIT 1",[clanId,req.playerId]);
    if(other.rowCount){
     await c.query("UPDATE lucky_clan_members SET role='owner' WHERE player_id=$1",[other.rows[0].player_id]);
     await c.query('UPDATE lucky_clans SET owner_id=$1 WHERE id=$2',[other.rows[0].player_id,clanId]);
    }else await c.query('DELETE FROM lucky_clans WHERE id=$1',[clanId]);
   }
   await c.query('DELETE FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
  });res.json({ok:true});
 }));

 app.post('/api/casino/clans/mission-rewards',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const result=await tx(pool,async c=>{
   const member=await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[req.playerId]);
   if(!member.rowCount)fail('Сначала вступите в клан',403);
   const id=member.rows[0].clan_id;
   const targets=await missionTargets(c,id);
   const rewards=clanMissionRewards(targets);
   const result=await c.query(`WITH periods AS (
    SELECT date_trunc('day',NOW() AT TIME ZONE 'UTC') AS d,date_trunc('week',NOW() AT TIME ZONE 'UTC') AS w
   ), totals AS (
    SELECT COUNT(DISTINCT player_id) FILTER(WHERE action='daily' AND created_at >= (p.d AT TIME ZONE 'UTC')) AS daily_claims,
    COALESCE(SUM(coins) FILTER(WHERE action='deposit' AND created_at >= (p.d AT TIME ZONE 'UTC')),0) AS daily_deposits,
    COUNT(DISTINCT player_id) FILTER(WHERE action='deposit' AND created_at >= (p.d AT TIME ZONE 'UTC')) AS daily_contributors,
    COUNT(DISTINCT player_id) FILTER(WHERE action='deposit') AS weekly_contributors,
    COALESCE(SUM(coins) FILTER(WHERE action='deposit'),0) AS weekly_deposits,
    COUNT(*) FILTER(WHERE action IN ('headquarters','wall','seats')) AS weekly_upgrades
    FROM lucky_clan_transactions CROSS JOIN periods p WHERE clan_id=$1 AND created_at >= (p.w AT TIME ZONE 'UTC')
   ), eligible AS (
    SELECT v.mission,v.period_start,v.xp FROM totals t CROSS JOIN periods p CROSS JOIN LATERAL (VALUES
      ('daily_claims',p.d::date,$6::int,t.daily_claims >= $2),
      ('daily_deposits',p.d::date,$7::int,t.daily_deposits >= $3 AND t.daily_contributors >= $2),
      ('weekly_deposits',p.w::date,$8::int,t.weekly_deposits >= $4 AND t.weekly_contributors >= $5),
      ('weekly_upgrades',p.w::date,$9::int,t.weekly_upgrades>=3)
    ) v(mission,period_start,xp,done) WHERE v.done
   )
   INSERT INTO lucky_clan_mission_rewards(clan_id,mission,period_start,xp)
   SELECT $1,mission,period_start,xp FROM eligible ORDER BY mission
   ON CONFLICT DO NOTHING RETURNING xp`,[id,targets.dailyParticipants,targets.dailyCoins,targets.weeklyCoins,targets.weeklyParticipants,rewards.dailyClaims,rewards.dailyDeposits,rewards.weeklyDeposits,rewards.weeklyUpgrades]);
   return {xp:result.rows.reduce((n,row)=>n+Number(row.xp),0)};
  });res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/daily',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const result=await tx(pool,async c=>{
   const m=await c.query('SELECT clan_id,last_claim FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[req.playerId]);
   if(!m.rowCount)fail('Сначала вступите в клан');
   const date=(await c.query("SELECT to_char(now() AT TIME ZONE 'UTC','YYYY-MM-DD') AS day")).rows[0].day;
   if(m.rows[0].last_claim&&new Date(m.rows[0].last_claim).toISOString().slice(0,10)===date)fail('Ежедневный взнос уже получен');
   // The daily unique key survives leaving and joining another clan;
   // otherwise members could collect unlimited bonuses by switching clans.
   const vk=String(req.playerId).replace(/^vk:/,'');
   const claimed=await c.query('INSERT INTO lucky_clan_daily_claims(vk_id,claim_day,clan_id) VALUES($1,$2::date,$3) ON CONFLICT DO NOTHING RETURNING vk_id',[vk,date,m.rows[0].clan_id]);
   if(!claimed.rowCount)fail('Сегодня бонус уже начислялся в другой клан');
   const clan=await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[m.rows[0].clan_id]);
   const cap=50000+clan.rows[0].headquarters**2*80000;
   const xp=await c.query('SELECT COALESCE(SUM(xp),0)::bigint AS xp FROM lucky_clan_mission_rewards WHERE clan_id=$1',[m.rows[0].clan_id]);
   const projects=(await c.query('SELECT project_id,level FROM lucky_clan_projects WHERE clan_id=$1',[m.rows[0].clan_id])).rows;
   const completed=(await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_personal_daily WHERE player_id=$1 AND claimed_at IS NOT NULL',[req.playerId])).rows[0].n;
   const reputation=clanReputation(completed);
   const reward=Math.min(Math.floor(clanLevelBonus(xp.rows[0]?.xp).dailyReward*(100+projectBonus(projects)+reputation.bonus)/100),cap-Number(clan.rows[0].coins));
   if(reward<=0)fail('Казна заполнена');
   await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[reward,m.rows[0].clan_id]);
   await c.query('UPDATE lucky_clan_members SET last_claim=$1::date WHERE player_id=$2',[date,req.playerId]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'daily',$3)",[m.rows[0].clan_id,req.playerId,reward]);
   return {reward};
  });res.json({ok:true,...result});
 }));

 app.post('/api/casino/clans/deposit',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const amount=req.body?.amount,revision=req.body?.revision,key=req.body?.requestId;
  if(!Number.isSafeInteger(amount)||amount<100||amount>50000000||amount%100!==0)fail('Взнос от 100 до 50 000 000 монет, шаг 100');
  if(!Number.isSafeInteger(revision)||revision<1)fail('Облако не подтверждено');
  if(typeof key!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(key))fail('Неверный идентификатор операции');
  const result=await tx(pool,async c=>{
   const vk=String(req.playerId).replace(/^vk:/,'');
   const current=await c.query('SELECT save,revision::text AS revision FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
   if(!current.rowCount)fail('Сохранение игрока не найдено',404);
   const prev=await c.query('SELECT player_id,coins FROM lucky_clan_transactions WHERE request_id=$1',[key]);
   if(prev.rowCount){
    if(prev.rows[0].player_id!==req.playerId||Number(prev.rows[0].coins)!==amount)fail('Номер операции уже использован',409);
    return {alreadyProcessed:true,revision:Number(current.rows[0].revision),save:current.rows[0].save};
   }
   if(Number(current.rows[0].revision)!==revision)fail('Сохранение изменилось — перезайди в игру',409);
   const daily=await c.query("SELECT COALESCE(SUM(coins),0)::bigint AS total FROM lucky_clan_transactions WHERE player_id=$1 AND action='deposit' AND (created_at AT TIME ZONE 'UTC')::date=(NOW() AT TIME ZONE 'UTC')::date",[req.playerId]);
   const limit=clanDepositLimit(current.rows[0].save);
   if(Number(daily.rows[0].total)+amount>limit)fail('Лимит взносов: '+limit.toLocaleString('ru-RU')+' монет в сутки');
   const save=current.rows[0].save;
   if(save.pendingMiniRound)fail('Сначала закончи мини-игру',409);
   if(!Number.isSafeInteger(save.coins)||save.coins<amount)fail('Недостаточно личных монет');
   const member=await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(!member.rowCount)fail('Сначала вступите в клан',403);
   const clan=await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[member.rows[0].clan_id]);
   if(!clan.rowCount)fail('Клан не найден',404);
   const cap=50000+clan.rows[0].headquarters**2*80000;
   if(Number(clan.rows[0].coins)+amount>cap)fail('В казне недостаточно свободного места');
   const next={...save,coins:save.coins-amount,stamp:Date.now()};
   await c.query('UPDATE public.casino_city_saves SET save=$2::jsonb,revision=revision+1,updated_at=NOW() WHERE vk_id=$1',[vk,JSON.stringify(next)]);
   await c.query('UPDATE lucky_clans SET coins=coins+$1 WHERE id=$2',[amount,member.rows[0].clan_id]);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins,request_id) VALUES($1,$2,'deposit',$3,$4)",[member.rows[0].clan_id,req.playerId,amount,key]);
   return {revision:revision+1,save:next};
  });
  res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/upgrade',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const kind=req.body?.kind;
  if(!['headquarters','wall'].includes(kind))fail('Неизвестное улучшение');
  const result=await tx(pool,async c=>{
   // Preserve the lock order with player deposits and payment receipts.
   const vk=String(req.playerId).replace(/^vk:/,'');
   const saved=await c.query('SELECT vk_id FROM public.casino_city_saves WHERE vk_id=$1 FOR UPDATE',[vk]);
   if(!saved.rowCount)fail('Облако игрока не найдено',409);
   const m=await c.query('SELECT clan_id,role FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(!m.rowCount||!['owner','officer'].includes(m.rows[0].role))fail('Недостаточно прав',403);
   const row=await c.query('SELECT * FROM lucky_clans WHERE id=$1 FOR UPDATE',[m.rows[0].clan_id]);
   const clan=row.rows[0];
   if(!clan)fail('Клан не найден',404);
   const level=Number(clan[kind]);
   if(level>=50)fail('Максимальный уровень');
   if(!Number.isSafeInteger(req.body?.expectedLevel)||req.body.expectedLevel!==level)fail('Уровень изменился. Обновите клан перед повторной прокачкой',409);
   if(premiumUpgrade(kind,level+1)){
    const balance=await c.query('SELECT balance FROM lucky_clan_permits WHERE vk_id=$1 FOR UPDATE',[vk]);
    if(!balance.rowCount||Number(balance.rows[0].balance)<1)fail('Для этого уровня требуется строительный пропуск за 5 голосов VK',402);
    await c.query('UPDATE lucky_clan_permits SET balance=balance-1 WHERE vk_id=$1',[vk]);
    await c.query('UPDATE lucky_clans SET '+kind+'='+kind+'+1 WHERE id=$1',[clan.id]);
    await c.query('INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,$3,0)',[clan.id,req.playerId,kind]);
    return {level:level+1,cost:0,premium:true};
   }
   const cost=upgradeCost(kind,level);
   if(Number(clan.coins)<cost)fail('В казне недостаточно монет');
   await c.query('UPDATE lucky_clans SET '+kind+'='+kind+'+1,coins=coins-$1 WHERE id=$2',[cost,clan.id]);
   await c.query('INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,$3,$4)',[clan.id,req.playerId,kind,-cost]);
   return {level:level+1,cost,premium:false};
  });
  res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/kick',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const target=req.body?.playerId;
  if(typeof target!=='string'||!/^vk:[1-9]\d{0,18}$/.test(target))
   fail('Неверный участник');
  if(target===req.playerId)fail('Глава не может исключить себя');
  await tx(pool,async c=>{
   // Lock the target first, preserving member->clan lock order used by leave.
   const member=await c.query('SELECT clan_id,role FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[target]);
   if(!member.rowCount)fail('Участник уже покинул клан',404);
   const clan=await c.query('SELECT id,owner_id FROM lucky_clans WHERE id=$1 FOR UPDATE',[member.rows[0].clan_id]);
   if(!clan.rowCount)fail('Клан не найден',404);
   if(clan.rows[0].owner_id!==req.playerId)fail('Исключать участников может только глава',403);
   if(member.rows[0].role==='owner')fail('Главу нельзя исключить',403);
   const removed=await c.query('DELETE FROM lucky_clan_members WHERE player_id=$1 AND clan_id=$2 AND role<>\'owner\' RETURNING player_id',[target,member.rows[0].clan_id]);
   if(!removed.rowCount)fail('Участник больше не состоит в клане',409);
   await c.query(`INSERT INTO lucky_clan_management_log(clan_id,actor_id,target_id,action) VALUES($1,$2,$3,'kick')`,[member.rows[0].clan_id,req.playerId,target]);
  });
  res.json({ok:true});
 }));
 app.post('/api/casino/clans/expand-seats',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const expectedTier=req.body?.expectedTier;
  if(!Number.isSafeInteger(expectedTier)||expectedTier<0||expectedTier>=8)
   fail('Некорректный этап расширения',400);
  const result=await tx(pool,async c=>{
   const own=await c.query("SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 AND role='owner'",[req.playerId]);
   if(!own.rowCount)fail('Расширять клан может только глава',403);
   const clan=await c.query('SELECT id,seat_tier,coins FROM lucky_clans WHERE id=$1 FOR UPDATE',[own.rows[0].clan_id]);
   if(!clan.rowCount)fail('Клан не найден',404);
   if(Number(clan.rows[0].seat_tier)!==expectedTier)
    fail('Вместимость клана уже изменилась. Обновите страницу.',409);
   const tier=expectedTier+1,cost=CLAN_SEAT_PRICES[tier-1];
   if(Number(clan.rows[0].coins)<cost)
    fail('Недостаточно монет в казне. Для '+clanSeatCapacity(tier)+' мест нужно '+cost.toLocaleString('ru-RU')+' монет.');
   const changed=await c.query('UPDATE lucky_clans SET seat_tier=$1,coins=coins-$2 WHERE id=$3 AND seat_tier=$4 AND coins>=$2 RETURNING seat_tier',
    [tier,cost,clan.rows[0].id,expectedTier]);
   if(!changed.rowCount)fail('Казна или вместимость изменились. Обновите клан.',409);
   await c.query("INSERT INTO lucky_clan_transactions(clan_id,player_id,action,coins) VALUES($1,$2,'seats',$3)",[clan.rows[0].id,req.playerId,-cost]);
   return {tier,capacity:clanSeatCapacity(tier)};
  });
  res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/role',requireAuth,wrap(async(req,res)=>{
  await start(pool);const target=req.body?.playerId,role=req.body?.role;
  if(typeof target!=='string'||!/^vk:[1-9]\d{0,18}$/.test(target)||!['member','officer'].includes(role))fail('Некорректные данные');
  await tx(pool,async c=>{
   const owner=await c.query("SELECT clan_id FROM lucky_clan_members WHERE player_id=$1 AND role='owner'",[req.playerId]);
   if(!owner.rowCount)fail('Только глава может назначать роли',403);
   const changed=await c.query("UPDATE lucky_clan_members SET role=$1 WHERE player_id=$2 AND clan_id=$3 AND role<>'owner' RETURNING player_id",[role,target,owner.rows[0].clan_id]);
   if(!changed.rowCount)fail('Участник не найден');
   await c.query(`INSERT INTO lucky_clan_management_log(clan_id,actor_id,target_id,action) VALUES($1,$2,$3,$4)`,[owner.rows[0].clan_id,req.playerId,target,role==='officer'?'promote':'demote']);
  });res.json({ok:true});
 }));
}
