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
const ECONOMY_SQL=[
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
 "ALTER TABLE lucky_clans ADD COLUMN IF NOT EXISTS seat_tier SMALLINT NOT NULL DEFAULT 0 CHECK(seat_tier BETWEEN 0 AND 8)"
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
const wrap=handler=>async(req,res)=>{try{res.set('Cache-Control','no-store');return await handler(req,res)}catch(e){return err(res,e)}};
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
export async function vkMemberProfiles(members,token=process.env.VK_GROUP_SERVICE_TOKEN){
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
const clanFields=`c.id,c.group_id AS "groupId",c.name,c.avatar,c.owner_id AS "ownerId",c.headquarters,c.wall,c.coins,c.seat_tier AS "seatTier",(10+c.seat_tier*5)::int AS "memberCapacity",(50000+c.headquarters*c.headquarters*20000)::bigint AS "treasuryCapacity",c.created_at AS "createdAt",(SELECT COUNT(*)::int FROM lucky_clan_members m WHERE m.clan_id=c.id) AS "memberCount"`;
async function mine(pool,playerId){
 const {rows}=await pool.query(`SELECT ${clanFields},m.role,m.last_claim AS "lastClaim" FROM lucky_clans c JOIN lucky_clan_members m ON m.clan_id=c.id WHERE m.player_id=$1`,[playerId]);
 if(!rows[0])return null;
 const members=await pool.query(`SELECT m.player_id AS "playerId",m.role,m.joined_at AS "joinedAt",
 COALESCE(SUM(t.coins) FILTER(WHERE t.action='deposit'),0)::bigint AS "contributed",
 COUNT(t.id) FILTER(WHERE t.action='deposit')::int AS "deposits"
 FROM lucky_clan_members m
 LEFT JOIN lucky_clan_transactions t ON t.clan_id=m.clan_id
  AND t.player_id=m.player_id
 WHERE m.clan_id=$1
 GROUP BY m.player_id,m.role,m.joined_at
 ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'officer' THEN 1 ELSE 2 END,
  m.joined_at LIMIT 50`,[rows[0].id]);
 const log=await pool.query('SELECT action,coins,player_id AS "playerId",created_at AS "createdAt" FROM lucky_clan_transactions WHERE clan_id=$1 ORDER BY created_at DESC,id DESC LIMIT 25',[rows[0].id]);
 return {...rows[0],members:await vkMemberProfiles(members.rows),history:log.rows};
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
export function upgradeCost(kind,level){return Math.ceil((kind==='headquarters'?5000:3500)*Math.pow(1.13,level-1)/100)*100}
export function registerLuckyClans(app,pool,requireAuth){
 app.get('/api/casino/clans',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const p=await pool.query('SELECT balance FROM lucky_clan_permits WHERE vk_id=$1',[String(req.playerId).replace(/^vk:/,'')]);
  res.json({mine:await mine(pool,req.playerId),leaders:await listing(pool),permits:Number(p.rows[0]?.balance||0),premiumLevels:PREMIUM_LEVELS,
   seatPrices:CLAN_SEAT_PRICES,baseMemberCapacity:CLAN_SEAT_BASE});
 }));
 // Read-only public clan card, available to signed-in VK players.
 // Never expose personal cloud saves or grant management powers here.
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
  return res.json({clan:{...clan,members:await vkMemberProfiles(members.rows),
   stats:totals.rows[0]||{},communityUrl:'https://vk.com/club'+String(clan.groupId)},
   premiumLevels:PREMIUM_LEVELS,seatPrices:CLAN_SEAT_PRICES});
 }));
 app.post('/api/casino/clans/create',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const group=await verifiedAdminGroup(req.playerId,req.body?.groupId,req.body?.communityToken,verifiedCommunityLaunch(req,req.body?.groupId));
  const result=await tx(pool,async c=>{
   const existing=await c.query('SELECT 1 FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(existing.rowCount)fail('Вы уже состоите в клане');
   const added=await c.query('INSERT INTO lucky_clans(group_id,name,avatar,owner_id) VALUES($1,$2,$3,$4) ON CONFLICT(group_id) DO NOTHING RETURNING id',[group.groupId,group.name,group.avatar,req.playerId]);
   if(!added.rowCount)fail('Для этого сообщества клан уже создан');
   await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'owner')",[req.playerId,added.rows[0].id]);
   return {id:added.rows[0].id};
  });
  res.status(201).json({ok:true,...result});
 }));
 app.post('/api/casino/clans/join',requireAuth,wrap(async(req,res)=>{
  await start(pool);if(!validId(req.body?.id))fail('Некорректный клан');
  await tx(pool,async c=>{
   const found=await c.query('SELECT id,seat_tier FROM lucky_clans WHERE id=$1 FOR UPDATE',[req.body.id]);
   if(!found.rowCount)fail('Клан не найден',404);
   const count=await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1',[req.body.id]);
   if(count.rows[0].n>=clanSeatCapacity(found.rows[0].seat_tier))fail('В клане нет свободных мест. Глава может расширить вместимость до 50.');
   const added=await c.query("INSERT INTO lucky_clan_members(player_id,clan_id,role) VALUES($1,$2,'member') ON CONFLICT(player_id) DO NOTHING RETURNING player_id",[req.playerId,req.body.id]);
   if(!added.rowCount)fail('Вы уже состоите в клане');
  });res.json({ok:true});
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
   const cap=50000+clan.rows[0].headquarters**2*20000;
   const reward=Math.min(500,cap-Number(clan.rows[0].coins));
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
  if(!Number.isSafeInteger(amount)||amount<100||amount>100000||amount%100!==0)fail('Взнос от 100 до 100 000 монет, шаг 100');
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
   if(Number(daily.rows[0].total)+amount>100000)fail('Лимит взносов: 100 000 монет в сутки');
   const save=current.rows[0].save;
   if(save.pendingMiniRound)fail('Сначала закончи мини-игру',409);
   if(!Number.isSafeInteger(save.coins)||save.coins<amount)fail('Недостаточно личных монет');
   const member=await c.query('SELECT clan_id FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(!member.rowCount)fail('Сначала вступите в клан',403);
   const clan=await c.query('SELECT coins,headquarters FROM lucky_clans WHERE id=$1 FOR UPDATE',[member.rows[0].clan_id]);
   if(!clan.rowCount)fail('Клан не найден',404);
   const cap=50000+clan.rows[0].headquarters**2*20000;
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
  });res.json({ok:true});
 }));
}
