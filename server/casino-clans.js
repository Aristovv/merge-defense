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
let initialized;
const start=pool=>{
 if(!pool)throw Error('DATABASE_NOT_CONFIGURED');
 if(!initialized)initialized=(async()=>{for(const statement of INIT.split(';').map(x=>x.trim()).filter(Boolean))await pool.query(statement)})().catch(e=>{initialized=null;throw e});
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
async function verifiedAdminGroup(playerId,groupId){
 const requested=Number(groupId);
 if(!validId(requested))fail('Выберите группу из списка');
 const result=await serviceVK('groups.getMembers',{group_id:String(requested),filter:'managers',count:'1000'});
 const items=Array.isArray(result?.items)?result.items:[];
 const vkId=String(playerId).replace(/^vk:/,'');
 const manager=items.find(item=>String(typeof item==='object'?item.id:item)===vkId);
 if(!manager||!['administrator','creator','admin'].includes(String(manager.role||'').toLowerCase()))
  fail('Права администратора в этой группе не подтверждены',403);
 const raw=await serviceVK('groups.getById',{group_ids:String(requested),fields:'photo_200'});
 const group=(Array.isArray(raw)?raw:raw?.groups)?.[0];
 if(!group||Number(group.id)!==requested||!group.name||!group.photo_200||Number(group.is_closed)===2)
  fail('Сообщество недоступно',403);
 return {groupId:requested,name:String(group.name).slice(0,100),avatar:String(group.photo_200)};
}
const wrap=handler=>async(req,res)=>{try{res.set('Cache-Control','no-store');return await handler(req,res)}catch(e){return err(res,e)}};
async function tx(pool,fn){
 const client=await pool.connect();
 try{await client.query('BEGIN');const value=await fn(client);await client.query('COMMIT');return value}
 catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}
 finally{client.release()}
}
const clanFields=`c.id,c.group_id AS "groupId",c.name,c.avatar,c.owner_id AS "ownerId",c.headquarters,c.wall,c.materials,(5000+c.headquarters*2000) AS "treasuryCapacity",c.created_at AS "createdAt",(SELECT COUNT(*)::int FROM lucky_clan_members m WHERE m.clan_id=c.id) AS "memberCount"`;
async function mine(pool,playerId){
 const {rows}=await pool.query(`SELECT ${clanFields},m.role,m.last_claim AS "lastClaim" FROM lucky_clans c JOIN lucky_clan_members m ON m.clan_id=c.id WHERE m.player_id=$1`,[playerId]);
 if(!rows[0])return null;
 const members=await pool.query('SELECT player_id AS "playerId",role,joined_at AS "joinedAt" FROM lucky_clan_members WHERE clan_id=$1 ORDER BY joined_at LIMIT 50',[rows[0].id]);
 return {...rows[0],members:members.rows};
}
async function listing(pool){
 const {rows}=await pool.query(`SELECT ${clanFields}, (c.headquarters*1000+c.wall*600+(SELECT COUNT(*) FROM lucky_clan_members m WHERE m.clan_id=c.id)*50)::bigint AS score FROM lucky_clans c ORDER BY score DESC,c.created_at ASC LIMIT 100`);
 return rows;
}
function upgradeCost(level){return Math.ceil(100*Math.pow(1.12,level-1))}
export function registerLuckyClans(app,pool,requireAuth){
 app.get('/api/casino/clans',requireAuth,wrap(async(req,res)=>{await start(pool);res.json({mine:await mine(pool,req.playerId),leaders:await listing(pool)})}));
 app.post('/api/casino/clans/create',requireAuth,wrap(async(req,res)=>{
  await start(pool);
  const group=await verifiedAdminGroup(req.playerId,req.body?.groupId);
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
   const found=await c.query('SELECT id FROM lucky_clans WHERE id=$1 FOR UPDATE',[req.body.id]);
   if(!found.rowCount)fail('Клан не найден',404);
   const count=await c.query('SELECT COUNT(*)::int AS n FROM lucky_clan_members WHERE clan_id=$1',[req.body.id]);
   if(count.rows[0].n>=30)fail('Клан заполнен');
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
   const member=await c.query('SELECT clan_id,last_claim FROM lucky_clan_members WHERE player_id=$1 FOR UPDATE',[req.playerId]);
   if(!member.rowCount)fail('Сначала вступите в клан');
   const today=(await c.query("SELECT (NOW() AT TIME ZONE 'UTC')::date::text AS day")).rows[0].day;
   if(member.rows[0].last_claim&&new Date(member.rows[0].last_claim).toISOString().slice(0,10)===today)fail('Сегодня материалы уже получены');
   const added=await c.query('UPDATE lucky_clans SET materials=LEAST(materials+100,5000+headquarters*2000) WHERE id=$1 AND materials<(5000+headquarters*2000) RETURNING materials',[member.rows[0].clan_id]);
   if(!added.rowCount)fail('Казна заполнена. Улучшите штаб или потратьте материалы');
   await c.query('UPDATE lucky_clan_members SET last_claim=$1::date WHERE player_id=$2',[today,req.playerId]);
   return {reward:100};
  });res.json({ok:true,...result});
 }));
 app.post('/api/casino/clans/upgrade',requireAuth,wrap(async(req,res)=>{
  await start(pool);const kind=req.body?.kind;if(!['headquarters','wall'].includes(kind))fail('Неизвестное улучшение');
  const result=await tx(pool,async c=>{
   const member=await c.query('SELECT clan_id,role FROM lucky_clan_members WHERE player_id=$1',[req.playerId]);
   if(!member.rowCount||!['owner','officer'].includes(member.rows[0].role))fail('Недостаточно прав',403);
   const found=await c.query('SELECT * FROM lucky_clans WHERE id=$1 FOR UPDATE',[member.rows[0].clan_id]);
   const clan=found.rows[0];if(!clan)fail('Клан не найден',404);
   const level=clan[kind];if(level>=50)fail('Достигнут максимальный уровень');
   const cost=upgradeCost(level);
   if(Number(clan.materials)<cost)fail('Недостаточно материалов');
   await c.query(`UPDATE lucky_clans SET ${kind}=${kind}+1,materials=materials-$1 WHERE id=$2`,[cost,clan.id]);
   return {level:level+1,cost};
  });res.json({ok:true,...result});
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
