// Lucky City clans interface: no local progress writes.
(()=>{
 'use strict';
 const BASE='https://merge.89-23-115-251.sslip.io/api/casino/clans';
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const root=()=>document.getElementById('lucky-clan-root');
 let launch='',data=null,preview=null,loading=false,rankings=null,notice='',loadingTop=false,creating=false,adminGroups=[],userToken=null;
 let depositFeedback='',depositFeedbackTimer=null;
 let topSelectedClan=null,topClanDetails=null,topClanLoading=false,topClanError='';
 // Keep opened sections open after clan operations, without localStorage or save mutations.
 const expandedSections=new Set();
 const clanStyles={violet:['Неоновый союз','#b78aff','✦'],emerald:['Изумрудная гвардия','#69dfb0','◆'],gold:['Золотая династия','#efc66d','♛'],crimson:['Багровый легион','#ff829d','⚔'],royal:['Королевский орден','#9edcff','♜'],cosmic:['Космическая элита','#d7a8ff','✧']};
 function clanStyleBadge(id){const v=Object.hasOwn(clanStyles,id)?clanStyles[id]:null;return v?'<span style="display:inline-block;border:1px solid '+v[1]+';color:'+v[1]+';border-radius:9px;padding:5px 9px;margin:5px 0;font-weight:700">'+v[2]+' '+v[0]+'</span>':'';}

 let clanTab='overview',tabClanId=null;
 const hqNames=['Гнилой сарай','Обшитый сарай','Небольшой сарай','Старый гараж с мусором','Убранный гараж','Оштукатуренный гараж','Гараж с ровным полом','Гараж с белыми стенами','Гараж с ламинатом','Освещённый гараж','Гараж с мебелью','Гараж с сейфом','Гараж с крепкой дверью','Гараж с кодовым замком','Заброшенный дом'];
 const wallNames=['Куча листьев','Листья и палки','Большая куча веток','Вкопанные колья','Колья и верёвки','Укреплённые колья','Колючая проволока','Забор и яма','Ров с мостиком','Начало бревенчатого забора','Бревенчатый забор — треть','Бревенчатый забор — две трети','Готовый бревенчатый забор','Бревенчатый забор с рвом','Ров с водой','Металлический каркас'];
 const description=(kind,level)=>kind==='headquarters'?(hqNames[level-1]||(level<=25?'Отремонтированный дом':level<=35?'Клановый особняк':level<=45?'Охраняемая резиденция':'Элитный клановый комплекс')):(wallNames[level-1]||(level<=25?'Металлический забор':level<=35?'Бетонная стена':level<=40?'Серебряная оборона':level<=44?'Золотая оборона':level<=47?'Алмазная оборона':'Изумрудная крепость'));
 const upgradeCost=(kind,l)=>Math.ceil((kind==='headquarters'?5000:3500)*Math.pow(1.13,l-1)/100)*100;
 const premiumNext=(kind,next)=>({headquarters:[5,10,15,20,30,40],wall:[5,10,15,20,30,40]}[kind]||[]).includes(next);
 const style=document.createElement('style');
 style.textContent=`
 .lc-clan-head{background:linear-gradient(125deg,#4b245f,#21152e);border:1px solid #a477c0;border-radius:21px;padding:20px;margin:13px 0}
 .lc-clan-title{font-size:23px;font-weight:900;color:#ffdbad;margin:8px 0}
 .lc-clan-row{display:flex;align-items:center;gap:12px}.lc-clan-img{width:64px;height:64px;border-radius:16px;object-fit:cover;background:#302345;border:1px solid #bd91ce;flex:none}
 .lc-clan-input{display:block;width:100%;padding:13px;background:#100e24;color:white;border-radius:11px;border:1px solid #8b669c;font:inherit;margin:10px 0}
 .lc-clan-panel{border:1px solid #785388;background:linear-gradient(135deg,#2b1b40,#171329);border-radius:17px;padding:15px;margin:12px 0}
 .lc-clan-note{color:#bcb0cd;font-size:12px;line-height:1.6;margin:7px 0}.lc-clan-group{display:flex;gap:11px;align-items:center;padding:12px;border:1px solid #8f6da8;border-radius:13px;background:#281c39}
 .lc-clan-tabs{display:flex;gap:8px;overflow:auto}.lc-clan-tabs .btn{flex:1;min-width:0}
 .lc-clan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}
 .lc-clan-visual{display:grid;place-items:center;min-height:105px;font-size:51px;background:radial-gradient(ellipse at bottom,#6b4383,#18132b 80%);border-radius:13px;margin:10px 0}
 .lc-clan-roster{padding:11px 0;border-top:1px solid #563e70;display:flex;justify-content:space-between;gap:7px;align-items:center;font-size:12px}
 .lc-clan-person{display:flex;align-items:center;gap:10px;min-width:0;text-decoration:none;color:#f7e9ff}
 .lc-clan-person:focus-visible{outline:2px solid #d7acff;outline-offset:3px;border-radius:10px}
 .lc-clan-person-photo{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#382447;border:1px solid #a47cc5;flex:none}
 .lc-clan-person-placeholder{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:#382447;color:#dac0e9;font-size:21px;flex:none}
 .lc-clan-person-info{min-width:0}.lc-clan-person-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}

 .lc-clan-rank{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #624879;background:#1e1732;border-radius:13px;margin:8px 0}
 .lc-clan-rank img{width:40px;height:40px;border-radius:9px;object-fit:cover}
 .lc-clan-rank-button{font:inherit;color:inherit;text-align:left;width:100%;cursor:pointer}
 .lc-clan-rank-button:focus-visible,.lc-clan-detail-btn:focus-visible{outline:2px solid #eac3ff;outline-offset:3px}
 .lc-clan-detail-hero{background:linear-gradient(140deg,#4f256b,#20152f);border:1px solid #ab6bd8;border-radius:20px;padding:18px}
 .lc-clan-detail-header{display:flex;align-items:center;gap:13px}
 .lc-clan-detail-header img{width:72px;height:72px;border-radius:18px;object-fit:cover;flex:none}
 .lc-clan-detail-title{font-size:19px;font-weight:850;color:#f7d6ff;overflow-wrap:anywhere}
 .lc-clan-detail-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:14px 0}
 .lc-clan-detail-stat{border:1px solid #775494;border-radius:12px;padding:12px;background:#221735}
 .lc-clan-detail-stat strong{display:block;color:#f5d2a0;font-size:18px;margin:4px 0}
 .lc-clan-detail-action{display:block;text-align:center;padding:13px;border-radius:12px;border:1px solid #a477de;color:#f6dcff;font-weight:750;text-decoration:none;background:#533078;margin:12px 0}
 .lc-clan-detail-members{display:grid;gap:9px}
 .lc-clan-detail-member{display:flex;align-items:center;gap:11px;padding:10px;border:1px solid #634980;border-radius:12px;background:#21172f;color:#fff;text-decoration:none}
 .lc-clan-detail-member img{width:43px;height:43px;border-radius:50%;object-fit:cover;flex:none}
 .lc-clan-detail-member div{min-width:0;flex:1}
 .lc-clan-detail-member strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .lc-clan-detail-member small{display:block;color:#bdb0ca;line-height:1.5}

 .lc-clan-rank>div{flex:1;min-width:0}.lc-clan-rank strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .lc-clan-error{color:#ffb6b6;line-height:1.4;margin:9px 0}
 .lc-clan-success{color:#9ef5cf;line-height:1.4;margin:9px 0}
 .lc-clan-select{display:flex;width:100%;text-align:left;align-items:center;gap:12px;border:1px solid #70518d;background:#221732;color:#fce9ff;border-radius:13px;padding:11px;margin:9px 0;font:inherit}
 .lc-clan-select.is-selected{border-color:#e5b875;background:#442655;box-shadow:0 0 0 1px #e5b875}
 .lc-clan-select .lc-clan-img{width:50px;height:50px}
 .lc-clan-select small{display:block;color:#bcb0cd;margin-top:4px;font-size:11px}
 .lc-clan-premium-list{display:grid;gap:12px;margin:14px 0}.lc-clan-premium-group{background:#20172f;border:1px solid #704a90;border-radius:13px;padding:12px}.lc-clan-premium-group>strong{display:block;margin-bottom:8px;color:#f5daff}.lc-clan-premium-row{display:flex;align-items:center;gap:8px;justify-content:space-between;flex-wrap:wrap;padding:10px 0;border-top:1px solid #50375f;font-size:13px}.lc-clan-premium-row strong{color:#ebcbff}.lc-clan-premium-row small{width:100%;font-size:11px;color:#b8a2c7}
 `;
 document.head.append(style);
 async function api(path='',body){
  const headers={'X-VK-Launch-Params':launch};
  if(body!==undefined)headers['Content-Type']='application/json';
  const response=await fetch(BASE+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'Ошибка соединения');
  return result;
 }
 async function getAdminToken(){
  if(!window.vkBridge?.send)throw Error('Откройте Lucky City во ВКонтакте');
  const appId=Number(new URLSearchParams(launch).get('vk_app_id'));
  if(!Number.isSafeInteger(appId)||appId<=0)throw Error('VK не передал идентификатор приложения');
  const result=await window.vkBridge.send('VKWebAppGetAuthToken',{app_id:appId,scope:'groups'});
  if(!result?.access_token)throw Error('Не получено разрешение на просмотр сообществ');
  return result.access_token;
 }
 function signedCommunityRole(groupId){
  const params=new URLSearchParams(launch);
  return Number(params.get('vk_group_id'))===Number(groupId)&&
    ['admin','creator'].includes(String(params.get('vk_viewer_group_role')||'').toLowerCase());
 }
 async function getCommunityProof(groupId){
  if(!window.vkBridge?.send)throw Error('Создание клана доступно через ВКонтакте');
  const appId=Number(new URLSearchParams(launch).get('vk_app_id'));
  if(!Number.isSafeInteger(appId)||appId<=0)throw Error('VK не передал ID игры');
  // Same community-token permission as the working Millionaire integration.
  // VK grants this token to a community administrator on the device.
  // VK clients expose different aliases of the same community permission.
  // Prefer the supported bridge method rather than assuming one method name.
  const candidates=['VKWebAppGetCommunityToken','VKWebAppGetCommunityAuthToken','VKWebAppCommunityToken','VKWebAppCommunityAccessToken'];
  const method=typeof window.vkBridge.supports==='function'?
   candidates.find(candidate=>window.vkBridge.supports(candidate)):candidates[0];
  if(!method)throw Error('Эта версия VK не поддерживает выдачу ключа сообщества. Откройте игру из меню своей группы.');
  const result=await window.vkBridge.send(method,{
   app_id:appId,group_id:Number(groupId),scope:'messages'
  });
  if(typeof result?.access_token!=='string'||result.access_token.length<20)
   throw Error('VK не выдал разрешение на выбранное сообщество');
  return result.access_token;
 }
 async function installIntoCommunity(){
  if(!window.vkBridge?.send)throw Error('Добавление доступно только внутри VK');
  const id=Number(preview?.groupId);
  if(!Number.isSafeInteger(id)||id<=0)throw Error('Сначала выберите сообщество');
  if(typeof window.vkBridge.supports==='function'&&!window.vkBridge.supports('VKWebAppAddToCommunity'))
   throw Error('Текущая версия VK не поддерживает установку мини-приложения в сообщество');
  const result=await window.vkBridge.send('VKWebAppAddToCommunity');
  if(Number(result?.group_id)!==id)
   throw Error('Выбрана другая группа. Для создания клана выберите ту же группу и повторите.');
  return true;
 }
 async function bridgeApi(method,params){
  if(!userToken)throw Error('Разрешение VK на группы не получено');
  const result=await window.vkBridge.send('VKWebAppCallAPIMethod',{
   method,request_id:'lucky-clan-'+Math.random().toString(36).slice(2),
   params:{...params,access_token:userToken,v:'5.199'}
  });
  const payload=result?.response?.response??result?.response??result;
  if(payload?.error)throw Error('VK API: код '+payload.error.error_code);
  return payload;
 }
 async function openCreator(){
  creating=true;preview=null;adminGroups=[];notice='';paint();
  try{
   userToken=await getAdminToken();
   // The VK Bridge API request is performed inside VK on the player's device.
   // The user token never leaves the device for this read-only operation.
   const account=await bridgeApi('users.get',{});
   const expected=new URLSearchParams(launch).get('vk_user_id');
   if(!Array.isArray(account)||String(account[0]?.id)!==String(expected))
    throw Error('Авторизация принадлежит другому аккаунту VK');
   for(let offset=0;offset<1000;offset+=200){
    const response=await bridgeApi('groups.get',{extended:1,filter:'admin',fields:'photo_200',count:200,offset});
    const items=Array.isArray(response?.items)?response.items:[];
    for(const g of items)if(Number.isSafeInteger(Number(g.id))&&Number(g.id)>0&&g.name&&g.is_closed!==2){
     adminGroups.push({groupId:Number(g.id),name:String(g.name),avatar:String(g.photo_200||g.photo_100||''),screenName:String(g.screen_name||'')});
    }
    if(items.length<200)break;
   }
  }catch(e){
   notice='Не удалось получить список групп: '+(e.message||'ошибка доступа');
   userToken=null;
  }
  paint();
 }
 let duelState=null,duelClan=null,duelLoading=false,duelError='';
 async function loadDuel(){if(duelLoading||!data?.mine)return;const id=String(data.mine.id);duelLoading=true;duelError='';duelClan=id;duelState=null;paint();try{const result=await api('/duel');if(String(data?.mine?.id)===id)duelState=result}catch(e){duelError=e.message}finally{duelLoading=false;paint()}}
 async function load(){
  if(loading)return;
  loading=true;notice='';
  try{data=await api();}catch(e){notice=e.message}
  finally{loading=false;paint()}
 }
 function group(g){return '<div class="lc-clan-group"><img class="lc-clan-img" alt="" src="'+esc(g.avatar)+'"><div><strong>'+esc(g.name)+'</strong><div class="lc-clan-note">Сообщество VK №'+esc(g.groupId)+'</div></div></div>'}
 function paint(){
  const el=root();if(!el)return;
  for(const detail of el.querySelectorAll('details[data-clan-section]')){
   if(detail.open)expandedSections.add(detail.dataset.clanSection);
   else expandedSections.delete(detail.dataset.clanSection);
  }
  let html='<div class="page"><div class="eyebrow">LUCKY CITY · СООБЩЕСТВА</div><h1 class="lc-clan-title">Кланы города</h1><p class="lc-clan-note">Создание бесплатно. Прогресс клана хранится отдельно от личного прогресса игроков.</p>';
  if(notice)html+='<div class="lc-clan-error">'+esc(notice)+'</div>'+(window.LuckyClanEconomy?.roundStatus?.()&&/игру|раунд|мини-игру/i.test(notice)?'<button class="btn ghost" data-clan="resume-round">Открыть незавершённую игру</button>':'');
  if(!data)html+='<div class="lc-clan-panel">'+(loading?'Загрузка кланов…':'Не удалось загрузить кланы. <button class="btn ghost" data-clan="reload">Повторить</button>')+'</div>';
  else if(data.mine){
   const c=data.mine,canEdit=c.role==='owner'||c.role==='officer';
   html+='<div class="lc-clan-panel"><h3>🏙️ Совместные проекты</h3><p class="lc-clan-note">Постоянные улучшения за монеты казны. Каждый участник получает увеличенный ежедневный бесплатный взнос в общую казну. Личный доход не меняется.</p><p>Бонус проектов: <b>+'+Number(c.levelBonus?.projectPercent||0)+'%</b></p><button class="btn purple" data-clan="projects-load">Открыть проекты</button><div id="lc-clan-projects"></div></div>';

   html+='<div class="lc-clan-panel"><h3>🛍 Клановый магазин</h3><p class="lc-clan-note">Постоянные коллективные титулы и оформление за монеты казны. Покупать и выбирать оформление может глава. Доход и игровой баланс не изменяются.</p><button class="btn purple" data-clan="shop-load">Обновить магазин</button><div id="lc-clan-shop"></div></div>';

   html+='<div class="lc-clan-head">'+group(c)+'<div class="lc-clan-title">'+esc(c.name)+'</div>'+clanStyleBadge(c.equippedStyle)+'<p class="lc-clan-note">Участников: '+c.memberCount+'/'+Number(c.memberCapacity||10)+' · Роль: '+(c.role==='owner'?'Глава':c.role==='officer'?'Заместитель':'Участник')+'</p><p>🪙 Казна клана: <b>'+Number(c.coins).toLocaleString('ru-RU')+' / '+Number(c.treasuryCapacity).toLocaleString('ru-RU')+'</b></p><button class="btn purple" data-clan="daily">Ежедневно до +'+Number(c.levelBonus?.dailyReward||500).toLocaleString('ru-RU')+' монет в казну</button></div>';
   const fmtProgress=n=>Number(n||0).toLocaleString('ru-RU');
   const clanMeter=(label,value,max)=>{const v=Number(value),m=Number(max),pct=Number.isFinite(v)&&Number.isFinite(m)&&m>0?Math.max(0,Math.min(100,Math.round(v/m*100))):0;return '<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12px"><strong>'+esc(label)+'</strong><span>'+fmtProgress(value)+' / '+fmtProgress(max)+' · '+pct+'%</span></div><div role="progressbar" aria-label="'+esc(label)+'" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" style="height:9px;margin-top:6px;border-radius:9px;background:#171126;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#7543c9,#d3a0ff);border-radius:9px"></div></div></div>'};
   html+='<div class="lc-clan-panel"><h3>✦ Прогресс моего клана</h3>'+clanMeter('Казна',c.coins,c.treasuryCapacity)+clanMeter('Участники',c.memberCount,c.memberCapacity||10)+clanMeter('Штаб',c.headquarters,50)+clanMeter('Стена',c.wall,50)+'<a class="btn ghost" style="display:block;text-align:center;text-decoration:none;margin-top:12px" href="https://vk.com/club'+Number(c.groupId)+'" target="_blank" rel="noopener noreferrer">Сообщество клана ↗</a></div>';
   if(c.levelBonus){const bonus=c.levelBonus,level=Number(bonus.level)||1,pct=Number(bonus.percent)||0;html+='<div class="lc-clan-panel"><h3>✦ Бонус развития клана</h3><p>Ежедневный бесплатный взнос: <b>'+fmtProgress(bonus.dailyReward)+' 🪙</b> на участника</p>'+clanMeter('Усиление взноса',pct,50)+'<p class="lc-clan-note">'+(pct>=50?'Максимальный бонус достигнут.':'Следующие +5% на уровне '+(6+5*Math.floor((level-1)/5))+'.')+' Бонус начисляется в общую казну, не на личный баланс. Действует лимит вместимости казны.</p></div>';}
   const duel=duelClan===String(c.id)?duelState?.duel:null;
   html+='<div class="lc-clan-panel"><h3>🏆 Клановые турниры</h3><p class="lc-clan-note">Участие бесплатно. 1 очко за ежедневный бесплатный вклад игрока из зафиксированного состава. Призы дня: 10 000 / 6 000 / 3 000 монет; недели: 50 000 / 30 000 / 15 000. Нужно минимум два клана с очками. Награда ограничена свободным местом в казне и начисляется при обращении к турнирам после окончания периода.</p><button class="btn purple" data-clan="tournaments">Открыть турниры</button><div id="lc-tournament-results"></div></div>';
   const mySide=duel&&String(duel.clanA)===String(c.id);
   const battleCard=()=>{
    const ownPoints=Math.max(0,Number(mySide?duel.pointsA:duel.pointsB)||0),otherPoints=Math.max(0,Number(mySide?duel.pointsB:duel.pointsA)||0),total=ownPoints+otherPoints;
    const share=total?Math.round(ownPoints/total*100):50,opponentId=String(mySide?duel.clanB:duel.clanA),other=(data.leaders||[]).find(x=>String(x.id)===opponentId);
    const emblem=(avatar,icon)=>avatar?'<img alt="" src="'+esc(avatar)+'" style="width:56px;height:56px;object-fit:cover;border-radius:16px;border:2px solid #aa80eb">':'<span style="display:inline-block;font-size:36px">'+icon+'</span>';
    return '<div style="background:linear-gradient(135deg,#29204b,#181126 50%,#48263d);border:1px solid #7850a6;border-radius:16px;padding:12px;margin:10px 0"><p class="lc-clan-note" style="text-align:center">'+esc(duel.start)+' — '+esc(duel.end)+' UTC</p><div style="display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;text-align:center;align-items:center"><div style="overflow-wrap:anywhere">'+emblem(c.avatar,'🛡️')+'<div><strong>'+esc(mySide?duel.nameA:duel.nameB)+'</strong></div><small>Ваш клан</small><h2 style="color:#c5a4ff">'+fmtProgress(ownPoints)+'</h2></div><b style="color:#edcb8a">VS</b><div style="overflow-wrap:anywhere">'+emblem(other?.avatar,'⚔️')+'<div><strong>'+esc(mySide?duel.nameB:duel.nameA)+'</strong></div><small>Соперник</small><h2 style="color:#ffc1a5">'+fmtProgress(otherPoints)+'</h2></div></div><div role="img" aria-label="Доля очков вашего клана: '+share+'%" style="display:flex;height:10px;overflow:hidden;border-radius:8px;background:#352842"><div style="width:'+share+'%;background:linear-gradient(90deg,#8054cc,#caa0ff)"></div><div style="flex:1;background:linear-gradient(90deg,#f3b184,#c66e84)"></div></div><p style="text-align:center;margin:10px 0 0">'+(ownPoints===otherPoints?'Равный счёт':ownPoints>otherPoints?'Ваш клан лидирует на '+fmtProgress(ownPoints-otherPoints)+' оч.':'До равного счёта: '+fmtProgress(otherPoints-ownPoints)+' оч.')+'</p></div>';
   };
   html+='<div class="lc-clan-panel"><h3>⚔️ Клановая битва недели</h3><p class="lc-clan-note">Соперник из той же лиги. 10 очков за ежедневное задание, 40 за еженедельное. Без ставок и денежных призов.</p>'+
    (duel?battleCard():duelLoading?'Загрузка…':duelError?'<p class="lc-clan-error">'+esc(duelError)+'</p>':duelState&&duelClan===String(c.id)?'<p class="lc-clan-note">Пока нет свободного соперника.</p>':'')+
    '<button class="btn purple" data-clan="duel" '+(duelLoading?'disabled':'')+'>Открыть / обновить битву</button></div>';
   if(duelClan===String(c.id)&&duelState?.stats){const st=duelState.stats;html+='<div class="lc-clan-panel"><h3>🏅 История битв</h3><p>Победы: <b>'+fmtProgress(st.wins)+'</b> · Поражения: <b>'+fmtProgress(st.losses)+'</b> · Ничьи: <b>'+fmtProgress(st.draws)+'</b></p>'+((duelState.history||[]).length?duelState.history.map(row=>'<div class="lc-clan-roster"><div><strong>'+esc(row.opponent)+'</strong><div class="lc-clan-note">'+esc(row.start)+' · '+({win:'Победа',loss:'Поражение',draw:'Ничья'}[row.outcome]||'')+'</div></div><strong>'+fmtProgress(row.myPoints)+' : '+fmtProgress(row.opponentPoints)+'</strong></div>').join(''):'<p class="lc-clan-note">Завершённых битв пока нет.</p>')+'</div>';}
   const activity=c.activity;
   if(activity&&c.missionTargets){
    if(c.missionXp!==undefined){const xp=Math.max(0,Number(c.missionXp)||0),lv=1+Math.floor(xp/1000);html+='<div class="lc-clan-panel"><h3>⭐ Уровень клана '+lv+'</h3><p class="lc-clan-note">Всего опыта: '+fmtProgress(xp)+' XP. Каждые 1 000 XP — новый уровень. Личные балансы не меняются.</p>'+clanMeter('До следующего уровня',xp%1000,1000)+'<p class="lc-clan-note">Ежедневные задания: '+fmtProgress(c.missionRewards?.dailyClaims??100)+' и '+fmtProgress(c.missionRewards?.dailyDeposits??150)+' XP. Еженедельные: '+fmtProgress(c.missionRewards?.weeklyDeposits??500)+' и '+fmtProgress(c.missionRewards?.weeklyUpgrades??400)+' XP.</p><button class="btn purple" data-clan="mission-rewards">Получить опыт за задания</button></div>';}
    const t=c.missionTargets;
    const tasks=t?[['Ежедневные','Участники с ежедневным взносом',activity.dailyClaims,t.dailyParticipants],['Ежедневные','Пополнить казну монетами',activity.dailyDeposits,t.dailyCoins,activity.dailyContributors,t.dailyParticipants],['Еженедельные','Пополнить казну монетами',activity.weeklyDeposits,t.weeklyCoins,activity.weeklyContributors,t.weeklyParticipants],['Еженедельные','Провести 3 улучшения клана',activity.weeklyUpgrades,3]]:[];
    html+='<div class="lc-clan-panel"><h3>📋 Клановые задания</h3><p class="lc-clan-note">Цели зависят от состава, развития и базового дохода участников, фиксируются при первом обращении в периоде. Для взносов нужна коллективная активность. День обновляется в 00:00 UTC, неделя — в понедельник. За выполненные задания начисляется клановый опыт.</p>'+['Ежедневные','Еженедельные'].map(period=>'<strong style="display:block;margin-top:14px">'+period+'</strong>'+tasks.filter(t=>t[0]===period).map(t=>clanMeter(t[1]+(Number(t[2])>=t[3]&&(t[5]===undefined||Number(t[4])>=t[5])?' ✓':''),Math.min(Number(t[2])||0,t[3]),t[3])+(t[5]!==undefined?clanMeter('Разные вкладчики',Math.min(Number(t[4])||0,t[5]),t[5]):'')).join('')).join('')+'</div>';
   }
   const activeMembers=[...(c.members||[])].sort((a,b)=>Number(b.weeklyActiveDays||0)-Number(a.weeklyActiveDays||0)||Number(b.weeklyContribution||0)-Number(a.weeklyContribution||0));
   if(activeMembers.some(m=>m.weeklyActiveDays!==undefined))html+='<div class="lc-clan-panel"><h3>Активность участников</h3><p class="lc-clan-note">Текущая неделя с понедельника (UTC). Учитываются действия в клане после последнего вступления, а не просто вход в игру.</p><p>Активных: <b>'+activeMembers.filter(m=>Number(m.weeklyActiveDays)>0).length+' / '+activeMembers.length+'</b></p>'+activeMembers.map(m=>'<div style="padding:9px 0;border-bottom:1px solid #ffffff18"><a class="lc-clan-person" href="https://vk.com/id'+esc(String(m.playerId).replace(/^vk:/,''))+'" target="_blank" rel="noopener noreferrer">'+(m.profileAvatar?'<img class="lc-clan-person-photo" src="'+esc(m.profileAvatar)+'" alt="">':'<span>👤</span>')+'<strong>'+esc(m.profileName||'Профиль VK')+'</strong></a>'+clanMeter('Активные дни',m.weeklyActiveDays,7)+'<div class="lc-clan-note">Взносы за неделю: '+fmtProgress(m.weeklyContribution)+' 🪙 · Переводов: '+fmtProgress(m.weeklyTransfers)+'</div><small class="lc-clan-note">Последнее действие: '+(m.lastClanAction?esc(new Date(m.lastClanAction).toLocaleString('ru-RU')):'нет данных')+'</small></div>').join('')+'</div>';
   const contributors=[...(c.members||[])].filter(m=>Number(m.contributed)>0).sort((a,b)=>Number(b.contributed)-Number(a.contributed)||Number(b.deposits||0)-Number(a.deposits||0));
   const totalContributions=contributors.reduce((sum,m)=>sum+Number(m.contributed),0);
   const topContribution=Number(contributors[0]?.contributed||0);
   html+='<div class="lc-clan-panel"><h3>🏆 Лидеры по взносам</h3><p class="lc-clan-note">Полный рейтинг вкладчиков за всё время среди нынешних участников. Доля рассчитывается от суммы зарегистрированных взносов, а не от текущего остатка казны.</p><p>Всего внесено: <b>'+fmtProgress(totalContributions)+' 🪙</b> · Вкладчиков: <b>'+contributors.length+'</b></p>'+ (contributors.length?contributors.map((m,i)=>'<div style="padding:10px 0;border-bottom:1px solid #ffffff18"><a style="display:flex;gap:9px;align-items:center;color:inherit;text-decoration:none" href="https://vk.com/id'+esc(String(m.playerId).replace(/^vk:/,''))+'" target="_blank" rel="noopener noreferrer"><strong style="color:#eac48d">#'+(i+1)+'</strong>'+(m.profileAvatar?'<img class="lc-clan-person-photo" alt="" src="'+esc(m.profileAvatar)+'">':'<span class="lc-clan-person-placeholder">👤</span>')+'<span style="flex:1;min-width:0;overflow-wrap:anywhere">'+esc(m.profileName||'Профиль VK')+'</span><strong>'+fmtProgress(m.contributed)+' 🪙</strong></a><div style="height:5px;margin-top:7px;background:#171126;border-radius:5px"><div style="height:100%;border-radius:5px;background:#ad7bfa;width:'+Math.min(100,Math.round(Number(m.contributed)/topContribution*100))+'%"></div></div><small class="lc-clan-note">Переводов: '+fmtProgress(m.deposits)+' · Доля общих взносов: '+(Number(m.contributed)/totalContributions*100).toLocaleString('ru-RU',{maximumFractionDigits:2})+'%</small></div>').join(''):'<p class="lc-clan-note">Пока никто не внёс монеты. Первый взнос откроет рейтинг.</p>')+'</div>';
   html+='<div class="lc-clan-panel"><h3>👥 Вместимость клана · '+Number(c.memberCapacity||10)+'/50</h3>'+
    '<p class="lc-clan-note">Первые 10 мест бесплатные. Затем восемь расширений по 5 мест за монеты из казны. Улучшать вместимость может только глава.</p>'+
    '<div class="lc-clan-premium-list">'+
    (data.seatPrices||[100000,200000,350000,600000,1000000,1600000,2500000,4000000]).map((price,i)=>{
      const tier=i+1,limit=10+tier*5,completed=Number(c.seatTier||0)>=tier,next=Number(c.seatTier||0)===i;
      return '<div class="lc-clan-premium-row"><span><strong>'+limit+' мест</strong> · +5</span><strong>'+Number(price).toLocaleString('ru-RU')+' 🪙</strong>'+
       '<small>'+(completed?'Улучшено':next?'Следующее расширение':'После предыдущих улучшений')+'</small>'+
       (c.role==='owner'&&next?'<button class="btn purple" data-clan="expand-seats">Расширить за '+Number(price).toLocaleString('ru-RU')+' 🪙</button>':'')+'</div>';
    }).join('')+'</div>'+
    '<p class="lc-clan-note">Все расширения до 50 мест обойдутся в 10 350 000 монет. Деньги списываются только из казны, а не с личного баланса. Штаб и стена не изменяются.</p></div>';
   html+='<div class="lc-clan-panel"><h3>Строительные пропуска 🎟️</h3><p class="lc-clan-note">В наличии: <b>'+Number(data?.permits||0)+'</b> шт. Каждый из двенадцати платных этапов стоит <b>5 голосов VK</b> (1 пропуск). За такой уровень монеты из казны не списываются.</p>'+
    '<div class="lc-clan-premium-list">'+[['headquarters','🏠 Штаб'],['wall','🛡️ Стена']].map(([kind,label])=>
      '<div class="lc-clan-premium-group"><strong>'+label+'</strong>'+
      [5,10,15,20,30,40].map(level=>'<div class="lc-clan-premium-row"><span>Уровень '+level+'</span><strong>5 голосов VK</strong><small>'+(c[kind]>=level?'Пройден':c[kind]===level-1?'Следующий':'Впереди')+'</small></div>').join('')+'</div>').join('')+'</div>'+
    '<p class="lc-clan-note">Всего: 30 голосов на штаб и 30 на стену, 60 голосов за все 12 этапов. Остальные уровни — за монеты.</p>'+
    '<button class="btn ghost" data-clan="refresh-permits">Проверить оплаченные пропуска</button></div>';
   html+='<div class="lc-clan-panel"><h3>Как растёт лимит казны?</h3><p class="lc-clan-note">Вместимость зависит только от уровня штаба: 50 000 + 20 000 × уровень штаба². Стена не увеличивает казну.</p><p class="lc-clan-note">Сейчас: '+Number(c.treasuryCapacity).toLocaleString('ru-RU')+' 🪙. После следующего уровня штаба: '+(c.headquarters<50?(50000+20000*Math.pow(c.headquarters+1,2)).toLocaleString('ru-RU')+' 🪙':'максимум достигнут')+'.</p></div>';
   html+='<div class="lc-clan-panel"><h3>Пополнить казну монетами</h3><p class="lc-clan-note">Перевод из твоего личного баланса. Минимум 100 монет, шаг 100; твой суточный лимит — '+Number(c.depositLimit||100000).toLocaleString('ru-RU')+' монет (зависит от базового дохода). Отменить перевод нельзя.</p><input id="lc-deposit-amount" type="number" min="100" max="'+Number(c.depositLimit||100000)+'" step="100" class="lc-clan-input" placeholder="Например, 10000"><button class="btn purple" data-clan="deposit">Перевести монеты</button>'+(depositFeedback?'<p class="lc-clan-note" role="status">'+esc(depositFeedback)+'</p>':'')+'</div>';
   html+='<div class="lc-clan-grid">'+[['headquarters','🏚️','Штаб'],['wall','🛡️','Стена']].map(([key,emoji,label])=>'<div class="lc-clan-panel"><strong>'+label+' · '+c[key]+'/50</strong><div class="lc-clan-visual">'+(window.LuckyClanScene?.[key]?.(c[key])||'🏰')+'</div><p class="lc-clan-note">'+esc(description(key,c[key]))+'</p>'+(canEdit&&c[key]<50?(premiumNext(key,c[key]+1)?(Number(data?.permits||0)>0?'<button class="btn purple" data-clan="upgrade" data-kind="'+key+'">Строительный пропуск · 1 🎟️</button>':'<button class="btn purple" data-clan="buy-permit">Улучшить за 5 голосов VK</button>'):'<button class="btn purple" data-clan="upgrade" data-kind="'+key+'">Улучшить · '+upgradeCost(key,c[key])+' 🪙</button>'):'')+'</div>').join('')+'</div>';
   html+='<div class="lc-clan-panel"><h3>История казны</h3>'+((c.history||[]).length?(c.history||[]).map(entry=>'<div class="lc-clan-roster"><span>'+({deposit:'Взнос игрока',daily:'Ежедневный бонус',headquarters:'Улучшение штаба',wall:'Улучшение стены',seats:'Расширение мест',tournament:'Приз турнира',shop:'Покупка оформления',project:'Улучшение проекта'}[entry.action]||'Операция')+'</span><strong>'+(Number(entry.coins)>0?'+':'')+(Number(entry.coins)===0&&['headquarters','wall'].includes(entry.action)?'1 🎟️':Number(entry.coins).toLocaleString('ru-RU')+' 🪙')+'</strong></div>').join(''):'<p class="lc-clan-note">Операций пока нет</p>')+'</div>';
   html+='<div class="lc-clan-panel"><h3>Участники клана</h3><p class="lc-clan-note">Взносы за всё время в текущем клане. Назначать заместителей и исключать участников может только глава.</p>'+
    [...(c.members||[])].sort((a,b)=>(({owner:0,officer:1,member:2}[a.role]??3)-({owner:0,officer:1,member:2}[b.role]??3))||Number(b.contributed||0)-Number(a.contributed||0)).map(m=>'<div class="lc-clan-roster"><a class="lc-clan-person" href="'+esc(m.profileUrl||'https://vk.com/id'+String(m.playerId).replace('vk:',''))+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть страницу '+esc(m.profileName||'игрока')+' во ВКонтакте">'+(m.profileAvatar?'<img class="lc-clan-person-photo" src="'+esc(m.profileAvatar)+'" alt="">':'<span class="lc-clan-person-placeholder" aria-hidden="true">👤</span>')+'<span class="lc-clan-person-info"><strong class="lc-clan-person-name">'+esc(m.profileName||'Профиль VK')+'</strong><span class="lc-clan-note">'+(m.role==='owner'?'Глава':m.role==='officer'?'Заместитель':'Участник')+' · Внесено: '+Number(m.contributed||0).toLocaleString('ru-RU')+' 🪙 ('+Number(m.deposits||0)+' взн.)</span></span></a>'+
    (c.role==='owner'&&m.role!=='owner'?'<div style="display:flex;flex-wrap:wrap;gap:5px"><button class="btn ghost" data-clan="role" data-user="'+esc(m.playerId)+'" data-role="'+(m.role==='officer'?'member':'officer')+'">'+(m.role==='officer'?'Снять роль':'В заместители')+'</button><button class="btn ghost" data-clan="kick" data-user="'+esc(m.playerId)+'">Исключить</button></div>':'')+'</div>').join('')+'</div>';
   if(c.role==='owner')html+='<div class="lc-clan-panel"><h3>Требования для вступления</h3><p class="lc-clan-note">Минимальный базовый доход в час без временных усилений. Ноль — без ограничений. Действующие участники сохраняют членство.</p><input class="lc-clan-input" id="lc-min-income" type="number" min="0" max="10000000" step="1" value="'+Number(c.minIncome||0)+'"><button class="btn purple" data-clan="min-income">Сохранить требования</button></div>';
   if(['owner','officer'].includes(c.role)){
    html+='<div class="lc-clan-panel"><h3>Приглашения игроков</h3><p class="lc-clan-note">Введите числовой ID игрока VK. Приглашение действует 7 дней.</p><input class="lc-clan-input" id="lc-invite-user" inputmode="numeric" placeholder="ID игрока VK"><button class="btn purple" data-clan="invite">Пригласить</button></div>';
    html+='<div class="lc-clan-panel"><h3>Настройки вступления</h3><p class="lc-clan-note">Глава выбирает режим вступления. Руководство рассматривает заявки.</p><div style="display:flex;flex-wrap:wrap;gap:6px">'+Object.entries(c.role==='owner'?{open:'Открытый',request:'По заявкам',closed:'Закрытый'}:{}).map(([key,label])=>'<button class="btn '+((c.joinPolicy||'open')===key?'purple':'ghost')+'" data-clan="join-policy" data-policy="'+key+'">'+label+'</button>').join('')+'</div><h4>Заявки · '+(c.applications||[]).length+'</h4>'+((c.applications||[]).length?c.applications.map(m=>'<div class="lc-clan-roster"><a class="lc-clan-person" href="https://vk.com/id'+esc(String(m.playerId).replace(/^vk:/,''))+'" target="_blank" rel="noopener noreferrer">'+(m.profileAvatar?'<img class="lc-clan-person-photo" src="'+esc(m.profileAvatar)+'" alt="">':'')+'<strong>'+esc(m.profileName||'Профиль VK')+'</strong></a><div style="display:flex;flex-wrap:wrap;gap:5px"><button class="btn purple" data-clan="application" data-user="'+esc(m.playerId)+'" data-decision="accept">Принять</button><button class="btn ghost" data-clan="application" data-user="'+esc(m.playerId)+'" data-decision="reject">Отклонить</button></div></div>').join(''):'<p class="lc-clan-note">Нет новых заявок.</p>')+'</div>';
   }
   if(c.role==='owner'){
    const managementName=id=>{const m=(c.members||[]).find(x=>String(x.playerId)===String(id));return '<a style="color:inherit" href="https://vk.com/id'+esc(String(id).replace(/^vk:/,''))+'" target="_blank" rel="noopener noreferrer">'+esc(m?.profileName||'Профиль VK')+'</a>'};
    html+='<div class="lc-clan-panel"><h3>Журнал руководства</h3><p class="lc-clan-note">Последние 30 операций. Доступно только главе.</p>'+((c.managementLog||[]).length?c.managementLog.map(e=>'<div class="lc-clan-roster"><div><strong>'+esc(({kick:'Исключение',promote:'Назначение заместителя',demote:'Снятие должности',accept:'Принятие заявки',reject:'Отклонение заявки'})[e.action]||'Операция')+'</strong><div>'+managementName(e.actorId)+' → '+managementName(e.targetId)+'</div><small class="lc-clan-note">'+esc(new Date(e.createdAt).toLocaleString('ru-RU'))+'</small></div></div>').join(''):'<p class="lc-clan-note">Новых действий пока нет.</p>')+'</div>';
   }
   html+='<div class="lc-clan-panel"><button class="btn ghost" data-clan="leave">Покинуть клан</button><p class="lc-clan-note">Если глава уходит, управление автоматически передаётся другому участнику. Пустой клан закрывается.</p></div>';
  }else{
   html+='<div class="lc-clan-panel"><h3>Создать свой клан</h3><p class="lc-clan-note">Бесплатно. Название и аватарка автоматически берутся из сообщества VK, где вы являетесь администратором.</p>'+(creating?'<h3>Выберите свою группу VK</h3><p class="lc-clan-note">Показываются только сообщества, где у вас есть права администратора.</p>'+(adminGroups.length?adminGroups.map(g=>'<button class="lc-clan-select '+(preview?.groupId===g.groupId?'is-selected':'')+'" data-clan="select-group" data-id="'+g.groupId+'"><img class="lc-clan-img" src="'+esc(g.avatar)+'" alt=""><span><strong>'+esc(g.name)+'</strong><small>Сообщество VK · '+g.groupId+'</small></span></button>').join(''):'<p class="lc-clan-note">Нет доступных групп. Проверьте права администратора и разрешение VK.</p>')+'<div style="margin:12px 0"><input id="lc-manual-group" class="lc-clan-input" placeholder="Ссылка или ID группы VK"><button class="btn ghost" data-clan="manual-group">Найти сообщество вручную</button></div>'+(!preview&&notice?'<p class="lc-clan-error">'+esc(notice)+'</p>':'')+(preview?'<div class="lc-clan-group" style="margin:12px 0">'+group(preview)+'</div><div id="lc-clan-create-result" role="status" aria-live="polite">'+(notice?'<p class="lc-clan-error">'+esc(notice)+'</p>':'')+'</div><button class="btn purple" data-clan="create">Создать клан бесплатно</button><div class="lc-clan-note" style="margin-top:12px">Для создания клана достаточно быть администратором группы VK — добавлять игру в сообщество не требуется. Если VK временно ограничивает проверку, можно воспользоваться дополнительным способом подключения.</div><a class="btn ghost" href="https://vk.com/club'+Number(preview.groupId)+'" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;margin:8px 4px 0 0">Открыть сообщество VK</a> <button class="btn ghost" data-clan="install-community">Подключить Lucky City к группе VK</button>':'')+'<div style="margin-top:12px"><button class="btn ghost" data-clan="refresh-groups">Обновить список</button> <button class="btn ghost" data-clan="cancel-create">Назад</button></div>':'<button class="btn purple" data-clan="start-create">Создать клан</button>')+'</div>';
   if((data.invites||[]).length)html+='<div class="lc-clan-panel"><h3>Входящие приглашения</h3>'+data.invites.map(i=>'<div class="lc-clan-roster"><div>'+esc(i.name)+'</div><div><button class="btn purple" data-clan="invite-response" data-id="'+esc(i.id)+'" data-decision="accept">Принять</button> <button class="btn ghost" data-clan="invite-response" data-id="'+esc(i.id)+'" data-decision="reject">Отклонить</button></div></div>').join('')+'</div>';
   html+='<div class="sectionhead"><h2>Присоединиться к клану</h2></div>'+(data.leaders||[]).slice(0,20).map(c=>'<div class="lc-clan-rank"><img src="'+esc(c.avatar)+'" alt=""><div><strong>'+esc(c.name)+'</strong><small>'+c.memberCount+'/'+Number(c.memberCapacity||10)+' участников · Штаб '+c.headquarters+(Number(c.minIncome)>0?' · Доход от '+Number(c.minIncome).toLocaleString('ru-RU')+' 🪙/ч':'')+'</small></div>'+(c.joinPolicy==='closed'?'<button class="btn ghost" disabled>Закрыт</button>':'<button class="btn ghost" data-clan="join" data-id="'+c.id+'">'+(c.joinPolicy==='request'?'Подать заявку':'Вступить')+'</button>')+'</div>').join('') ;
  }
  html+='</div>';
  // Compact long secondary sections. Native <details> keeps controls usable,
  // including on mobile, without rerouting game actions or losing clan data.
  if(data?.mine){
   const view=document.createElement('div');view.innerHTML=html;
   const clan=data.mine;
   const rules=[
    ['👥 Вместимость клана', 'seats', 'Места '+Number(clan.memberCount)+'/'+Number(clan.memberCapacity||10)+(Number(clan.seatTier||0)<8?' · +5 за '+Number(data.seatPrices?.[Number(clan.seatTier||0)]||0).toLocaleString('ru-RU')+' 🪙':' · максимум')],
    ['Строительные пропуска', 'permits', 'Строительные пропуска · '+Number(data.permits||0)+' 🎟️'],
    ['Как растёт лимит казны?', 'treasury', 'Лимит казны · '+Number(clan.treasuryCapacity).toLocaleString('ru-RU')+' 🪙'],
    ['Журнал руководства', 'management', 'Журнал руководства · '+Number(clan.managementLog?.length||0)+' действий'],
    ['История казны', 'history', 'История казны · '+Number(clan.history?.length||0)+' операций'],
    ['Участники клана', 'members', 'Участники · '+Number(clan.memberCount)+'/'+Number(clan.memberCapacity||10)]
   ];
   for(const [prefix,key,title] of rules){
    const panel=[...view.querySelectorAll('.lc-clan-panel')].find(node=>{
      const heading=node.querySelector(':scope > h3');
      return heading?.textContent?.startsWith(prefix);
    });
    if(!panel)continue;
    const fold=document.createElement('details');
    fold.className=panel.className+' lc-clan-fold';
    fold.dataset.clanSection=key;
    fold.open=expandedSections.has(key);
    const summary=document.createElement('summary');
    summary.textContent=title;
    summary.style.cssText='cursor:pointer;list-style-position:inside;font-size:14px;font-weight:800;line-height:1.5;color:#f7d69f';
    const header=panel.querySelector(':scope > h3');
    if(header)header.remove();
    fold.appendChild(summary);
    const content=document.createElement('div');
    content.style.marginTop='12px';
    while(panel.firstChild)content.appendChild(panel.firstChild);
    fold.appendChild(content);
    panel.replaceWith(fold);
   }
   const page=view.querySelector('.page'),head=page?.querySelector(':scope > .lc-clan-head');
   if(page&&head){
    if(tabClanId!==String(clan.id)){tabClanId=String(clan.id);clanTab='overview'}
    const tabs=[['overview','🏠','Обзор'],['development','🏰','Развитие'],['battle','⚔️','Битвы'],['treasury','🪙','Казна'],['members','👥','Участники'],['missions','📋','Задания'],['season','🏆','Сезоны'],['management','⚙️','Управление'],['history','📜','История'],['shop','🛍','Магазин']];
    const sectionMap={seats:'development',permits:'development',treasury:'treasury',management:'history',history:'history',members:'members'};
    const classify=node=>{
     if(node.dataset.clanSection)return sectionMap[node.dataset.clanSection]||'overview';
     if(node.classList.contains('lc-clan-grid'))return 'development';
     if(node.querySelector('[data-clan="leave"]'))return 'management';
     const h=node.querySelector(':scope > h3')?.textContent||'';
     if(/Клановый магазин/.test(h))return 'shop';
     if(/Совместные проекты/.test(h))return 'development';
     if(/Клановая битва|История битв|Клановые турниры/.test(h))return 'battle';
     if(/Клановые задания/.test(h))return 'missions';
     if(/Лидеры по взносам|Активность участников/.test(h))return 'members';
     if(/Пополнить казну/.test(h))return 'treasury';
     if(/Требования для вступления|Приглашения игроков|Настройки вступления/.test(h))return 'management';
     return 'overview';
    };
    const nav=document.createElement('div');nav.setAttribute('role','group');nav.setAttribute('aria-label','Разделы клана');
    nav.style.cssText='display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:12px 0';
    nav.innerHTML=tabs.map(([key,emoji,label])=>'<button type="button" class="btn '+(clanTab===key?'purple':'ghost')+'" data-clan="tab" data-tab="'+key+'" aria-pressed="'+(clanTab===key)+'" style="min-width:0;white-space:normal;padding:9px 2px;font-size:12px;line-height:1.4"><span style="display:block;font-size:19px">'+emoji+'</span>'+label+'</button>').join('');
    head.after(nav);
    const season=document.createElement('div');season.className='lc-clan-panel';season.innerHTML='<h3>🏆 Сезонные лиги</h3><p class="lc-clan-note">Текущий сезон, рейтинг и награды прошлых сезонов.</p><button class="btn purple" data-clan="season-inline">Обновить рейтинг</button><div id="lc-clan-season-inline"></div>';page.appendChild(season);
    for(const node of [...page.children]){
     if(node===season){node.hidden=clanTab!=='season';}
     else if(node.classList.contains('lc-clan-panel')||node.classList.contains('lc-clan-grid'))node.hidden=classify(node)!==clanTab;
     if(node.hidden)node.style.display='none';
    }
   }
   html=view.innerHTML;
  }
  el.innerHTML=html;
  if(data?.mine&&clanTab==='season')paintInlineSeason();
 }
 function clanDetailUI(info){
  const c=info.clan,stats=c.stats||{},fmt=n=>Number(n||0).toLocaleString('ru-RU');
  const asLink=url=>esc(url||'#');
  const honors=Array.isArray(c.seasonHonors)?c.seasonHonors:[];
  const medalNames={1:'Чемпион',2:'Вице-чемпион',3:'Бронзовый призёр'};
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  const honorPanel='<div class="lc-clan-panel"><h3>🏆 Зал славы клана</h3>'+(honors.length?honors.map(h=>'<div class="lc-clan-roster"><div><strong>'+medals[h.rank]+' '+esc(medalNames[h.rank])+'</strong><div class="lc-clan-note">Сезон '+fmt(h.season)+' · '+esc(leagueNames[h.league]||h.league)+'</div></div><strong>'+fmt(h.points)+' оч.</strong></div>').join(''):'<p class="lc-clan-note">Почётные знаки появятся после призового места в завершённом сезоне.</p>')+'</div>';
  const championBadge=honors.length&&Number(honors[0].rank)===1?'<span style="display:inline-block;margin-top:6px;padding:5px 9px;border:1px solid #d9ad58;border-radius:8px;color:#f4d48a">👑 Чемпион · '+esc(leagueNames[honors[0].league]||honors[0].league)+'</span>':'';

  const tiles=[
   ['Участники',fmt(c.memberCount)+' / '+fmt(c.memberCapacity)],
   ['Место в рейтинге',rankings?.findIndex(x=>String(x.id)===String(c.id))+1||'—'],
   ['Штаб',fmt(c.headquarters)+' / 50'],
   ['Стена',fmt(c.wall)+' / 50'],
   ['Расширение мест',fmt(c.seatTier)+' / 8'],
   ['Казна',fmt(c.coins)+' / '+fmt(c.treasuryCapacity)],
   ['Очки клана',fmt(c.score)],
   ['Всего взносов',fmt(stats.totalDeposited)+' 🪙'],
   ['Переводов в казну',fmt(stats.depositCount)],
   ['Ежедневных наград',fmt(stats.dailyClaims)],
   ['Улучшений штаба',fmt(stats.headquartersUpgrades)],
   ['Улучшений стены',fmt(stats.wallUpgrades)]
  ];
  const roleRank={owner:0,officer:1,member:2};
  const memberMarkup=[...(c.members||[])].sort((a,b)=>(roleRank[a.role]??3)-(roleRank[b.role]??3)||Number(b.contributed||0)-Number(a.contributed||0)).map(m=>{
   const name=esc(m.profileName||'Профиль VK');
   return '<a class="lc-clan-detail-member" href="'+asLink(m.profileUrl)+'" target="_blank" rel="noopener noreferrer">'+
    (m.profileAvatar?'<img src="'+esc(m.profileAvatar)+'" alt="">':'<span class="lc-clan-person-placeholder" aria-hidden="true">👤</span>')+
    '<div><strong>'+name+'</strong><small>'+(m.role==='owner'?'Глава':m.role==='officer'?'Заместитель':'Участник')+
    ' · Внесено '+fmt(m.contributed)+' 🪙 · '+fmt(m.deposits)+' взн.</small></div><span aria-hidden="true">↗</span></a>';
  }).join('');
  const hq=Number(c.headquarters),wall=Number(c.wall),slots=Number(c.memberCapacity);
  const nextHq=hq<50?(50000+20000*(hq+1)**2):null;
  const progress=(value,max)=>{const v=Number(value),m=Number(max);return Number.isFinite(v)&&Number.isFinite(m)&&m>0?Math.max(0,Math.min(100,Math.round(v/m*100))):0};
  const meter=(label,value,max)=>'<div style="margin:10px 0"><div class="lc-clan-note">'+esc(label)+' · '+fmt(value)+' / '+fmt(max)+' · '+progress(value,max)+'%</div><progress aria-label="'+esc(label)+'" max="100" value="'+progress(value,max)+'" style="width:100%;height:10px;accent-color:#a78bfa"></progress></div>';
  return '<div class="lc-clan-panel"><button class="btn ghost" data-clan-top-back>← К рейтингу</button></div>'+
   '<div class="lc-clan-detail-hero"><div class="lc-clan-detail-header"><img src="'+esc(c.avatar)+'" alt=""><div><div class="lc-clan-detail-title">'+esc(c.name)+'</div>'+championBadge+clanStyleBadge(c.equippedStyle)+'<p class="lc-clan-note">Клан сообщества VK · Основан '+(c.createdAt?esc(new Date(c.createdAt).toLocaleDateString('ru-RU')):'—')+'</p></div></div>'+
   '<a class="lc-clan-detail-action" href="'+asLink(c.communityUrl)+'" target="_blank" rel="noopener noreferrer">Открыть сообщество клана VK ↗</a></div>'+
   honorPanel+
   '<div class="lc-clan-detail-stats">'+tiles.map(([label,value])=>'<div class="lc-clan-detail-stat"><span class="lc-clan-note">'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>').join('')+'</div>'+
   '<div class="lc-clan-panel"><h3>Прогресс клана</h3>'+meter('Казна',c.coins,c.treasuryCapacity)+meter('Участники',c.memberCount,c.memberCapacity)+meter('Штаб',hq,50)+meter('Стена',wall,50)+'</div>'+
   '<div class="lc-clan-panel"><h3>🏰 Уровни и развитие</h3>'+
    '<p class="lc-clan-note">Штаб '+fmt(hq)+'/50 · '+esc(description('headquarters',hq))+'</p><div class="lc-clan-visual">'+(window.LuckyClanScene?.headquarters?.(hq)||'🏰')+'</div>'+
    '<p class="lc-clan-note">Стена '+fmt(wall)+'/50 · '+esc(description('wall',wall))+'</p><div class="lc-clan-visual">'+(window.LuckyClanScene?.wall?.(wall)||'🛡️')+'</div>'+
    '<p class="lc-clan-note">Платные строительные этапы: 5, 10, 15, 20, 30, 40. Остальные уровни прокачиваются за монеты казны.</p>'+
    '<p class="lc-clan-note">Текущая вместимость: '+fmt(slots)+' из 50 мест. '+(nextHq?'Вместимость казны после следующего уровня штаба: '+fmt(nextHq)+' 🪙.':'Штаб максимально прокачан.')+'</p></div>'+
   '<div class="lc-clan-panel"><h3>👥 Состав клана · '+fmt(c.memberCount)+'</h3><p class="lc-clan-note">Сначала руководство, затем участники по сумме взносов. Нажмите на имя или аватарку, чтобы открыть профиль VK.</p>'+
   '<div class="lc-clan-detail-members">'+(memberMarkup||'<p class="lc-clan-note">Участников пока нет.</p>')+'</div></div>';
 }



 async function loadClanProjects(){
  const host=document.getElementById('lc-clan-projects');if(!host)return;host.textContent='Загрузка…';
  try{
   const result=await api('/projects');if(!host.isConnected)return;
   const icons={bank:'🏦',business:'🏢',tower:'🏙️'};
   host.innerHTML='<p>Казна: <b>'+fmtTop(result.coins)+' 🪙</b> · Бонус: +'+fmtTop(result.bonus)+'%</p>'+result.items.map(p=>{
    const level=Number(p.level),done=level>=5;
    return '<div style="border:1px solid #9d79d54d;background:linear-gradient(140deg,#352247,#20162c);border-radius:14px;margin:10px 0;padding:12px"><div style="display:flex;align-items:center;gap:10px"><span style="font-size:32px">'+icons[p.id]+'</span><div><strong>'+esc(p.name)+'</strong><div class="lc-clan-note">Уровень '+level+'/5 · +'+(level*p.percent)+'%</div></div></div><div style="display:flex;gap:5px;margin:10px 0">'+Array.from({length:5},(_,i)=>'<span style="flex:1;height:7px;border-radius:5px;background:'+(i<level?'#c29af8':'#493858')+'"></span>').join('')+'</div>'+(done?'<p>Максимальный уровень</p>':'<p>Следующий уровень: +'+p.percent+'% · '+fmtTop(p.nextCost)+' 🪙</p>'+(result.canManage?'<button class="btn purple" data-clan="project-upgrade" data-project="'+esc(p.id)+'" data-level="'+level+'" data-price="'+esc(fmtTop(p.nextCost))+'" '+(Number(result.coins)<p.nextCost?'disabled':'')+'>Улучшить</button>':''))+'</div>';
   }).join('');
  }catch(error){if(host.isConnected)host.textContent=error.message||'Проекты недоступны';}
 }
 async function loadClanShop(){
  const host=document.getElementById('lc-clan-shop');if(!host)return;host.textContent='Загрузка…';
  try{
   const shop=await api('/shop');if(!host.isConnected)return;
   host.innerHTML='<p>Казна: <b>'+fmtTop(shop.coins)+' 🪙</b></p>'+shop.items.map(item=>{
    const owned=shop.owned.includes(item.id),active=shop.equipped===item.id;
    return '<div style="border:1px solid #ffffff20;border-radius:12px;margin:8px 0;padding:10px">'+clanStyleBadge(item.id)+'<p>'+fmtTop(item.price)+' 🪙 · '+(active?'Выбрано':owned?'Куплено':'Не приобретено')+'</p>'+(shop.canManage?(owned?'<button class="btn ghost" data-clan="shop-equip" data-item="'+esc(active?'':item.id)+'">'+(active?'Снять оформление':'Выбрать')+'</button>':'<button class="btn purple" data-clan="shop-buy" data-item="'+esc(item.id)+'" data-price="'+esc(fmtTop(item.price))+'" '+(Number(shop.coins)<item.price?'disabled':'')+'>Купить</button>'):'')+'</div>';
   }).join('');
  }catch(error){if(host.isConnected)host.textContent=error.message||'Магазин недоступен';}
 }
 let inlineSeason=null,inlineLeague=null,inlineLoading=false,inlineError='';
 function paintInlineSeason(){
  const host=document.getElementById('lc-clan-season-inline');if(!host)return;
  if(inlineLoading){host.textContent='Загрузка сезона…';return;}
  if(inlineError){host.textContent=inlineError;return;}
  const result=inlineSeason;if(!result)return;
  const groups=Object.entries(result.leagues||{}),mineId=String(data?.mine?.id);
  const own=groups.flatMap(([league,rows])=>rows.filter(x=>String(x.id)===mineId).map(x=>({...x,league})))[0];
  if(!inlineLeague)inlineLeague=own?.league||'bronze';
  const rows=result.leagues?.[inlineLeague]||[],winners=(result.previousWinners||[]).filter(x=>x.league===inlineLeague);
  const start=Date.parse(result.start),end=Date.parse(result.end),remaining=Math.max(0,end-Date.now()),days=Math.floor(remaining/86400000),hours=Math.floor(remaining/3600000)%24;
  const progress=end>start?Math.max(0,Math.min(100,Math.round((Date.now()-start)/(end-start)*100))):0;
  const medals=['','🥇','🥈','🥉'];
  const row=x=>'<button type="button" data-clan="season-inline-profile" data-id="'+esc(x.id)+'" class="lc-clan-rank lc-clan-rank-button" style="width:100%;text-align:left;'+(String(x.id)===mineId?'border:1px solid #d9b674;background:#39284b;':'')+'"><strong>'+ (medals[Number(x.rank)]||'#'+esc(x.rank))+'</strong>'+(x.avatar?'<img src="'+esc(x.avatar)+'" alt="">':'<span>🛡️</span>')+'<div style="min-width:0;overflow-wrap:anywhere"><strong>'+esc(x.name)+'</strong><small>'+fmtTop(x.points)+' оч. '+(String(x.id)===mineId?'· Ваш клан':'')+'</small></div><span>›</span></button>';
  host.innerHTML='<div style="padding:14px;border:1px solid #9971c9;border-radius:14px;margin:12px 0;background:linear-gradient(135deg,#352049,#20162f)"><strong style="color:#f1d19a">СЕЗОН '+esc(result.number)+'</strong><p class="lc-clan-note">'+esc(result.start)+' — '+esc(result.end)+' UTC</p><strong>'+(remaining?'До конца: '+days+' д. '+hours+' ч.':'Сезон завершён')+'</strong><div style="height:8px;background:#171126;border-radius:8px;margin:10px 0"><div style="height:100%;width:'+progress+'%;background:linear-gradient(90deg,#8651d4,#edc681);border-radius:8px"></div></div>'+(own?'<p>Ваш клан · '+esc(leagueNames[own.league])+' · #'+esc(own.rank)+' · '+fmtTop(own.points)+' оч.</p>':'')+'</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px">'+Object.entries(leagueNames).map(([key,label])=>'<button class="btn '+(inlineLeague===key?'purple':'ghost')+'" style="min-width:0;padding:8px 2px;font-size:12px" data-clan="season-inline-league" data-league="'+key+'">'+label+'</button>').join('')+'</div><h4>'+esc(leagueNames[inlineLeague])+' · '+rows.length+' кланов</h4>'+(rows.length?rows.map(row).join(''):'<p class="lc-clan-note">В этой лиге пока нет кланов.</p>')+'<h4>🏅 Зал славы прошлого сезона</h4>'+(winners.length?winners.map(row).join(''):'<p class="lc-clan-note">Пока нет призёров.</p>');
 }
 async function loadInlineSeason(){
  if(inlineLoading)return;inlineLoading=true;inlineError='';paintInlineSeason();
  try{inlineSeason=await api('/season')}catch(error){inlineError=error.message||'Не удалось загрузить сезон'}finally{inlineLoading=false;paintInlineSeason()}
 }
 let seasonData=null,seasonMode=false,seasonLeague='bronze',seasonLoading=false,seasonError='';
 const leagueNames={bronze:'Бронза',silver:'Серебро',gold:'Золото',platinum:'Платина',diamond:'Алмаз',legend:'Легенда'};
 async function loadSeason(){if(seasonLoading)return;seasonLoading=true;seasonError='';paintTop();try{seasonData=await api('/season')}catch(e){seasonError=e.message}finally{seasonLoading=false;paintTop()}}
 function seasonUI(){
 const tabs=Object.entries(leagueNames).map(([key,label])=>'<button type="button" class="btn '+(key===seasonLeague?'purple':'ghost')+'" data-season-league="'+key+'">'+label+'</button>').join('');
 const rows=seasonData?.leagues?.[seasonLeague]||[];
 const winners=(seasonData?.previousWinners||[]).filter(c=>c.league===seasonLeague);
 const startMs=Date.parse(seasonData?.start||''),endMs=Date.parse(seasonData?.end||''),now=Date.now();
 const validDates=Number.isFinite(startMs)&&Number.isFinite(endMs)&&endMs>startMs;
 const seasonPct=validDates?Math.max(0,Math.min(100,Math.round((now-startMs)/(endMs-startMs)*100))):0;
 const daysLeft=validDates?Math.max(0,Math.ceil((endMs-now)/86400000)):0;
 const seasonProgress=validDates?'<div style="margin:12px 0"><strong>'+(now>=endMs?'Сезон завершён':'Осталось дней: '+daysLeft)+'</strong><div style="height:7px;background:#171126;border-radius:8px;margin:8px 0"><div style="height:100%;background:#ad7bfa;border-radius:8px;width:'+seasonPct+'%"></div></div><small class="lc-clan-note">Прошло '+seasonPct+'% сезона</small></div>':'';
 const podium=rows.length?'<p class="lc-clan-note">Кланов в рейтинге: '+fmtTop(rows.length)+' · Очки лидера: '+fmtTop(rows[0].points)+'</p>':'';

 const archive='<div class="lc-clan-panel"><h3>🏅 Зал славы · прошлый сезон</h3>'+(winners.length?winners.map(c=>'<div class="lc-clan-roster"><span>'+(['','Чемпион','Вице-чемпион','Бронзовый призёр'][Number(c.rank)]||'Призёр')+' · '+esc(c.name)+'</span><strong>'+fmtTop(c.points)+' оч.</strong></div>').join(''):'<p class="lc-clan-note">Пока нет завершённого сезона с результатами в этой лиге.</p>')+'</div>';
 return '<div class="lc-clan-panel"><h3>🏆 Сезон '+esc(seasonData?.number||'')+'</h3><p class="lc-clan-note">'+(seasonData?esc(seasonData.start)+' — '+esc(seasonData.end)+' (UTC, дата окончания не включена)':'')+'</p>'+seasonProgress+podium+'<p class="lc-clan-note">10 очков за ежедневное задание, 40 за еженедельное. Лига определяется при первом обновлении сезонного рейтинга и сохраняется до конца сезона. Призовые места получают почётные звания в архиве.</p><div style="display:flex;flex-wrap:wrap;gap:5px">'+tabs+'</div>'+(seasonLoading?'<p>Загрузка…</p>':seasonError?'<p class="lc-clan-error">'+esc(seasonError)+'</p><button class="btn ghost" data-season-refresh>Повторить</button>':rows.length?rows.map(c=>'<button type="button" class="lc-clan-rank lc-clan-rank-button" data-clan-top-view="'+esc(c.id)+'"><strong>#'+esc(c.rank)+'</strong><img src="'+esc(c.avatar)+'" alt=""><div><strong>'+esc(c.name)+'</strong><small>'+fmtTop(c.points)+' очков сезона</small></div></button>').join(''):'<p class="lc-clan-note">В этой лиге пока нет кланов.</p>')+'</div>'+archive;
 }
 function paintTop(){
  const host=document.getElementById('lucky-clan-ranking');if(!host)return;
  if(topSelectedClan!==null){
   host.innerHTML=topClanLoading?'<div class="lc-clan-panel"><button class="btn ghost" data-clan-top-back>← К рейтингу</button><p>Загрузка клана…</p></div>':
    topClanDetails?clanDetailUI(topClanDetails):
    '<div class="lc-clan-panel"><button class="btn ghost" data-clan-top-back>← К рейтингу</button><p class="lc-clan-error">'+esc(topClanError||'Не удалось загрузить клан')+'</p><button class="btn purple" data-clan-top-view="'+esc(topSelectedClan)+'">Повторить</button></div>';
   return;
  }
  const switcher='<div class="lc-clan-panel" style="display:flex;gap:6px"><button class="btn '+(!seasonMode?'purple':'ghost')+'" data-season-mode="all">Общий топ</button><button class="btn '+(seasonMode?'purple':'ghost')+'" data-season-mode="season">Сезонные лиги</button></div>';
  if(seasonMode){host.innerHTML=switcher+seasonUI();return;}
  host.innerHTML=switcher+'<div class="lc-clan-panel"><h3>🏰 Топ кланов</h3>'+(rankings?.length?rankings.slice(0,20).map((c,i)=>
   '<button type="button" class="lc-clan-rank lc-clan-rank-button" data-clan-top-view="'+esc(c.id)+'"><strong>#'+(i+1)+'</strong><img src="'+esc(c.avatar)+'" alt=""><div><strong>'+esc(c.name)+'</strong><small>Штаб '+fmtTop(c.headquarters)+' · Стена '+fmtTop(c.wall)+' · '+fmtTop(c.memberCount)+'/'+fmtTop(c.memberCapacity||10)+' участников</small></div><span aria-hidden="true">›</span></button>').join(''):
   '<p class="lc-clan-note">'+(loadingTop?'Загрузка рейтинга…':'Кланы пока не найдены')+'</p>')+'</div>';
 }
 const fmtTop=n=>Number(n||0).toLocaleString('ru-RU');
 async function openClanFromTop(id){
  const n=Number(id);if(!Number.isSafeInteger(n)||n<1)return;
  topSelectedClan=n;topClanDetails=null;topClanLoading=true;topClanError='';paintTop();
  try{
   const result=await api('/'+n);
   if(topSelectedClan!==n)return;
   if(!result.clan)throw Error('Клан не найден');
   topClanDetails=result;
  }catch(error){if(topSelectedClan===n)topClanError=error.message||'Ошибка сервера'}
  finally{if(topSelectedClan===n){topClanLoading=false;paintTop()}}
 }
 async function refreshTop(){
  if(loadingTop||!launch)return;loadingTop=true;paintTop();
  try{rankings=(await api()).leaders||[];}catch(e){rankings=[]}
  finally{loadingTop=false;paintTop()}
 }
 document.addEventListener('click',event=>{
  const host=document.getElementById('lucky-clan-ranking');
  if(!host||!host.contains(event.target))return;
  const mode=event.target.closest('[data-season-mode]');if(mode){seasonMode=mode.dataset.seasonMode==='season';if(seasonMode)loadSeason();else paintTop();return;}
  const league=event.target.closest('[data-season-league]');if(league){seasonLeague=league.dataset.seasonLeague;paintTop();return;}
  if(event.target.closest('[data-season-refresh]')){loadSeason();return;}
  const back=event.target.closest('[data-clan-top-back]');
  if(back){topSelectedClan=null;topClanDetails=null;topClanLoading=false;topClanError='';paintTop();return}
  const item=event.target.closest('[data-clan-top-view]');
  if(item){void openClanFromTop(item.dataset.clanTopView)}
 });
 document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-clan]');if(!btn||!root()?.contains(btn)||btn.disabled)return;
  const action=btn.dataset.clan;if(action==='reload'||action==='refresh-permits')return load();
  if(action==='tab'){clanTab=btn.dataset.tab;paint();if(clanTab==='season')void loadInlineSeason();if(clanTab==='shop')void loadClanShop();return;}
  if(action==='season-inline'){await loadInlineSeason();return;}
  if(action==='season-inline-league'){inlineLeague=btn.dataset.league;paintInlineSeason();return;}
  if(action==='season-inline-profile'){
   const id=String(btn.dataset.id||'');if(!/^[0-9]+$/.test(id))return;
   const host=document.getElementById('lc-clan-season-inline');if(!host)return;
   host.textContent='Загрузка профиля…';
   try{const info=await api('/'+id);if(!host.isConnected)return;host.innerHTML=clanDetailUI(info);const back=host.querySelector('[data-clan-top-back]');if(back){back.removeAttribute('data-clan-top-back');back.dataset.clan='season-inline-back';}}
   catch(error){if(host.isConnected){host.textContent=error.message;const back=document.createElement('button');back.className='btn ghost';back.dataset.clan='season-inline-back';back.textContent='Назад';host.appendChild(back);}}return;
  }
  if(action==='season-inline-back'){paintInlineSeason();return;}
  if(action==='projects-load'){await loadClanProjects();return;}
  if(action==='project-upgrade'){
   if(!window.confirm('Улучшить проект за '+btn.dataset.price+' монет из казны?'))return;
   btn.disabled=true;
   try{await api('/project-upgrade',{projectId:btn.dataset.project,expectedLevel:Number(btn.dataset.level)});data=await api();notice='Проект улучшен';paint();await loadClanProjects();}
   catch(error){notice=error.message;paint();await loadClanProjects();}finally{btn.disabled=false}return;
  }
  if(action==='shop-load'){await loadClanShop();return;}
  if(action==='shop-buy'||action==='shop-equip'){
   if(action==='shop-buy'&&!window.confirm('Купить оформление за '+btn.dataset.price+' монет из казны?'))return;
   btn.disabled=true;
   try{await api('/'+action,{itemId:btn.dataset.item||''});data=await api();notice='Успешно';paint();await loadClanShop();}
   catch(error){notice=error.message;paint();await loadClanShop();}finally{btn.disabled=false}return;
  }
  if(action==='tournaments'){
   const host=document.getElementById('lc-tournament-results');if(!host)return;
   btn.disabled=true;host.textContent='Загрузка…';
   try{const t=await api('/tournaments');if(!host.isConnected)return;
    const render=(title,rows,end,category)=>{const band=['','1–3','4–10','11–20','21–35','36–50'][category?.band]||'—';return '<h4>'+title+'</h4><p class="lc-clan-note">До '+esc(end||'—')+' 00:00 UTC · '+esc(leagueNames[category?.league]||'—')+' · '+band+' участников</p>'+((rows||[]).length?rows.map(x=>'<div class="lc-clan-roster" style="'+(String(x.id)===String(t.mine?.id)?'color:#f1d19a':'')+'"><span>'+(['','🥇','🥈','🥉'][Number(x.rank)]||'#'+esc(x.rank))+' '+esc(x.name)+'</span><strong>'+fmtTop(x.points)+' оч.</strong></div>').join(''):'<p>Клан не зарегистрирован в этом периоде.</p>');};
    host.innerHTML=render('Турнир дня',t.daily,t.dailyEnd,t.dailyCategory||t.mine)+render('Турнир недели',t.weekly,t.weeklyEnd,t.weeklyCategory||t.mine)+'<h4>История турниров</h4>'+((t.history||[]).length?t.history.map(x=>'<div class="lc-clan-roster"><div>'+esc(x.start)+' · '+(x.kind==='weekly'?'Неделя':'День')+'<br>Место '+esc(x.rank)+' · '+fmtTop(x.points)+' оч.</div><strong>+'+fmtTop(x.prize)+' 🪙</strong></div>').join(''):'<p class="lc-clan-note">Завершённых турниров пока нет.</p>');
   }catch(error){host.textContent=error.message||'Не удалось загрузить турниры'}finally{btn.disabled=false}return;
  }
  if(action==='duel')return loadDuel();
  if(action==='mission-rewards'){btn.disabled=true;try{const result=await api('/mission-rewards',{});await load();notice=Number(result.xp)>0?'Клан получил '+Number(result.xp)+' XP':'Нет новых выполненных заданий';}catch(e){notice=e.message}finally{btn.disabled=false;paint()}return;}
  if(!launch){notice='Откройте Lucky City через VK';return paint()}
  if(action==='start-create'||action==='refresh-groups')return openCreator();
  if(action==='cancel-create'){creating=false;preview=null;userToken=null;adminGroups=[];notice='';return paint()}
  if(action==='manual-group'){
   let value=String(document.getElementById('lc-manual-group')?.value||'').trim();
   if(value.startsWith('http://')||value.startsWith('https://')){try{const u=new URL(value);if(!['vk.com','vk.ru','m.vk.com','m.vk.ru'].includes(u.hostname))throw Error();value=u.pathname.split('/').filter(Boolean)[0]||''}catch(_){notice='Введите корректную ссылку VK';return paint()}}
   if(!/^[a-zA-Z0-9_.]{1,100}$/.test(value)){notice='Введите ссылку или ID сообщества VK';return paint()}
   btn.disabled=true;
   try{
    preview=await api('/lookup',{community:value});
    if(!adminGroups.some(g=>g.groupId===preview.groupId))adminGroups.push(preview);
    notice='Сообщество найдено. Нажмите «Создать клан бесплатно» для автоматической проверки.';
    return paint();
        const challenge=await api('/challenge',{groupId:preview.groupId});
    sessionStorage.setItem('lc-clan-proof:'+preview.groupId,challenge.code);
    notice='Добавьте код '+challenge.code+' в описание сообщества VK, сохраните и нажмите «Создать клан бесплатно». После создания удалите код.';
   }catch(e){notice=e.message||'Не удалось найти сообщество'}
   return paint();
  }
  if(action==='select-group'){preview=adminGroups.find(g=>g.groupId===Number(btn.dataset.id))||null;return paint()}
  if(action==='leave'&&!window.confirm('Выйти из клана?'))return;
  if(action==='kick'&&!window.confirm('Исключить участника '+String(btn.dataset.user||'')+' из клана? Его прежние взносы останутся в казне.'))return;
  if(action==='expand-seats'){
   const current=Number(data?.mine?.seatTier||0),price=Number(data?.seatPrices?.[current]||0);
   if(!price||!window.confirm('Расширить клан на 5 мест за '+price.toLocaleString('ru-RU')+' монет из казны? Отменить улучшение нельзя.'))return;
  }
  if(action==='resume-round'){
   try{window.LuckyClanEconomy?.openRound?.();notice='Открой игровое поле, заверши раунд и повтори взнос';}
   catch(e){notice=e.message||'Не удалось открыть игру'}
   paint();return;
  }
  if(action==='buy-permit'){
   btn.disabled=true;btn.textContent='Открываем оплату VK…';
   try{
    if(!window.LuckyClanEconomy?.buyPermit)throw Error('Оплата сейчас недоступна');
    await window.LuckyClanEconomy.buyPermit();
    data=await api();notice='Проверь оплаченный пропуск. Сервер начисляет его только после подтверждения VK.';
   }catch(e){notice=e.message||'Не удалось открыть оплату'}
   paint();return;
  }
  if(action==='deposit'){
   const amount=Number(document.getElementById('lc-deposit-amount')?.value);
   if(!Number.isSafeInteger(amount)||amount<100||amount>Number(data?.mine?.depositLimit||100000)||amount%100!==0){
    depositFeedback='Сумма должна быть от 100 до '+Number(data?.mine?.depositLimit||100000).toLocaleString('ru-RU')+' монет, с шагом 100.';
    paint();return;
   }
   btn.disabled=true;btn.textContent='Переводим монеты…';
   try{
    if(!window.LuckyClanEconomy?.deposit)throw Error('Переводы пока недоступны');
    await window.LuckyClanEconomy.deposit(amount);
    data=await api();depositFeedback='Монеты зачислены в казну';
   }catch(e){
    const reason=String(e.message||'Перевод не подтверждён');
    if(/незавершённ|раунд Plinko|раунд Crash|мини-игру|мини-игра/i.test(reason)){
     // A stale in-game round is a safety preflight, not a clan failure.
     // Do not keep showing it under the deposit form or imply funds were sent.
     depositFeedback='';
    }else if(/Облачное сохранение|облачную синхронизацию|сохранение ещё не подтверждено/i.test(reason)){
     depositFeedback='Перевод не выполнен: требуется подтверждение баланса.';
    }else depositFeedback='Перевод не выполнен: '+reason;
   }
   // Deposit errors describe only this attempt, not clan state or game availability.
   notice='';
   clearTimeout(depositFeedbackTimer);
   depositFeedbackTimer=setTimeout(()=>{depositFeedback='';if(root())paint()},6000);
   paint();return;
  }
  if(action==='install-community'){
   btn.disabled=true;btn.textContent='Открываем выбор сообщества…';
   try{
    await installIntoCommunity();
    notice='Приложение подключено. Теперь откройте Lucky City именно из меню своей группы VK и создайте клан там: это позволяет подтвердить роль администратора без ключа управления.';
   }catch(e){notice=e.message||'VK не подтвердил установку приложения в сообщество'}
   paint();return;
  }
  if(action==='create'&&!preview){notice='Сначала выберите группу VK';paint();return}
  btn.disabled=true;
  if(action==='create'){
   btn.textContent='Подтверждаем управление группой…';notice='';
   const result=document.getElementById('lc-clan-create-result');
   if(result)result.textContent='Проверяем права администратора через VK API.';
  }
  try{
   let actionResult;
   // Signed VK group launch is independently verified by requireAuth.
   // Avoid native permission prompts when this proof is already available.
   if(action==='create'){
    const groupId=Number(preview.groupId);
    if(sessionStorage.getItem('lc-clan-proof:'+groupId)){
     try{await api('/create',{groupId,descriptionProof:true});}catch(error){
      const challenge=await api('/challenge',{groupId});
      sessionStorage.setItem('lc-clan-proof:'+groupId,challenge.code);
      throw Error(error.message+' Код: '+challenge.code);
     }
     sessionStorage.removeItem('lc-clan-proof:'+groupId);
    }else if(signedCommunityRole(groupId)){
     await api('/create',{groupId});
    }else{
     // Millionaire's first path: the admin group token already obtained
     // on the same device, verified by the server against the VK account.

     try{
      if(!userToken)throw Error('VK_USER_TOKEN_NEEDS_COMMUNITY');
      await api('/create',{groupId,userVKToken:userToken});
     }catch(error){
      if(error.message!=='VK_USER_TOKEN_NEEDS_COMMUNITY')throw error;
      try{
 const proof=await getCommunityProof(groupId).catch(()=>null);
 if(proof){
  await api('/create',{groupId,communityToken:proof});
 }else{
  await api('/create',{groupId,automaticProof:true});
 }
}catch(autoError){
      if(autoError.message!=='VK_AUTO_PROOF_UNAVAILABLE')throw autoError;
      const challenge=await api('/challenge',{groupId});
      sessionStorage.setItem('lc-clan-proof:'+groupId,challenge.code);
      notice='VK ограничил проверку по IP. Скопируйте код '+challenge.code+' в описание выбранного сообщества, сохраните его и снова нажмите «Создать клан бесплатно». После создания код можно удалить.';
      return;
      }
     }
    }
   }else{
    const body=action==='min-income'?{minimum:Number(document.getElementById('lc-min-income')?.value)}:action==='invite'?{playerId:'vk:'+String(document.getElementById('lc-invite-user')?.value||'').trim()}:action==='invite-response'?{id:Number(btn.dataset.id),decision:btn.dataset.decision}:action==='join-policy'?{policy:btn.dataset.policy}:action==='application'?{playerId:btn.dataset.user,decision:btn.dataset.decision}:action==='join'?{id:Number(btn.dataset.id)}:action==='upgrade'?{kind:btn.dataset.kind,expectedLevel:Number(data?.mine?.[btn.dataset.kind])}:action==='role'?{playerId:btn.dataset.user,role:btn.dataset.role}:action==='kick'?{playerId:btn.dataset.user}:action==='expand-seats'?{expectedTier:Number(data?.mine?.seatTier||0)}:{};
    actionResult=await api('/'+action,body);
   }
   preview=null;userToken=null;creating=false;adminGroups=[];data=await api();notice=actionResult?.pending?'Заявка отправлена главе клана':'Успешно';rankings=data.leaders;paintTop();
  }catch(err){notice=err.message||'Ошибка сервера'}finally{
   paint();
   if(action==='create'&&notice!=='Успешно'){
    const result=document.getElementById('lc-clan-create-result');
    if(result){result.scrollIntoView({block:'center',behavior:'smooth'});result.setAttribute('tabindex','-1');result.focus({preventScroll:true})}
   }
  }
 });
 window.LuckyClans={
  mount(params){launch=params||'';paint();load()},
  mountTop(params){launch=params||'';paintTop();refreshTop()},
  list(){return rankings}
 };
})();
