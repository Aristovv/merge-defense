// Lucky City clans interface: no local progress writes.
(()=>{
 'use strict';
 const BASE='https://merge.89-23-115-251.sslip.io/api/casino/clans';
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const root=()=>document.getElementById('lucky-clan-root');
 let launch='',data=null,preview=null,loading=false,rankings=null,notice='',loadingTop=false,creating=false,adminGroups=[],userToken=null;
 const hqNames=['Гнилой сарай','Обшитый сарай','Небольшой сарай','Старый гараж с мусором','Убранный гараж','Оштукатуренный гараж','Гараж с ровным полом','Гараж с белыми стенами','Гараж с ламинатом','Освещённый гараж','Гараж с мебелью','Гараж с сейфом','Гараж с крепкой дверью','Гараж с кодовым замком','Заброшенный дом'];
 const wallNames=['Куча листьев','Листья и палки','Большая куча веток','Вкопанные колья','Колья и верёвки','Укреплённые колья','Колючая проволока','Забор и яма','Ров с мостиком','Начало бревенчатого забора','Бревенчатый забор — треть','Бревенчатый забор — две трети','Готовый бревенчатый забор','Бревенчатый забор с рвом','Ров с водой','Металлический каркас'];
 const description=(kind,level)=>kind==='headquarters'?(hqNames[level-1]||(level<=25?'Отремонтированный дом':level<=35?'Клановый особняк':level<=45?'Охраняемая резиденция':'Элитный клановый комплекс')):(wallNames[level-1]||(level<=25?'Металлический забор':level<=35?'Бетонная стена':level<=40?'Серебряная оборона':level<=44?'Золотая оборона':level<=47?'Алмазная оборона':'Изумрудная крепость'));
 const upgradeCost=(kind,l)=>Math.ceil((kind==='headquarters'?3000:2000)*Math.pow(1.11,l-1)/100)*100;
 const premiumNext=(kind,next)=>({headquarters:[4,7,10,15],wall:[4,7,10]}[kind]||[]).includes(next);
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
 .lc-clan-rank{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #624879;background:#1e1732;border-radius:13px;margin:8px 0}
 .lc-clan-rank img{width:40px;height:40px;border-radius:9px;object-fit:cover}
 .lc-clan-rank>div{flex:1;min-width:0}.lc-clan-rank strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .lc-clan-error{color:#ffb6b6;line-height:1.4;margin:9px 0}
 .lc-clan-success{color:#9ef5cf;line-height:1.4;margin:9px 0}
 .lc-clan-select{display:flex;width:100%;text-align:left;align-items:center;gap:12px;border:1px solid #70518d;background:#221732;color:#fce9ff;border-radius:13px;padding:11px;margin:9px 0;font:inherit}
 .lc-clan-select.is-selected{border-color:#e5b875;background:#442655;box-shadow:0 0 0 1px #e5b875}
 .lc-clan-select .lc-clan-img{width:50px;height:50px}
 .lc-clan-select small{display:block;color:#bcb0cd;margin-top:4px;font-size:11px}
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
 async function getCommunityProof(groupId){
  if(!window.vkBridge?.send)throw Error('Подтвердите группу внутри приложения VK');
  const appId=Number(new URLSearchParams(launch).get('vk_app_id'));
  if(!Number.isSafeInteger(appId)||appId<=0)throw Error('VK не предоставил ID приложения');
  const bridge=window.vkBridge;
  const names=['VKWebAppCommunityAccessToken','VKWebAppCommunityToken','VKWebAppGetCommunityAuthToken','VKWebAppGetCommunityToken'];
  const supported=names.filter(name=>typeof bridge.supports!=='function'||bridge.supports(name));
  if(!supported.length)throw Error('Текущая версия VK не поддерживает подтверждение управления группой');
  let lastError;
  for(const method of supported){
   try{
    const result=await bridge.send(method,{app_id:appId,group_id:Number(groupId),scope:'manage'});
    const token=result?.access_token;
    if(typeof token==='string'&&token.length>=15)return token;
    lastError=Error('VK не выдал разрешение на управление группой');
   }catch(e){
    lastError=e;
    // If VK explicitly refuses access, never skip to another authorization surface.
    if(/denied|cancel|access|permission|отказ|отмен/i.test(String(e?.message||'')))break;
   }
  }
  throw Error('VK не подтвердил управление выбранной группой: '+String(lastError?.message||'отказано'));
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
 async function load(){
  if(loading)return;
  loading=true;notice='';
  try{data=await api();}catch(e){notice=e.message}
  finally{loading=false;paint()}
 }
 function group(g){return '<div class="lc-clan-group"><img class="lc-clan-img" alt="" src="'+esc(g.avatar)+'"><div><strong>'+esc(g.name)+'</strong><div class="lc-clan-note">Сообщество VK №'+esc(g.groupId)+'</div></div></div>'}
 function paint(){
  const el=root();if(!el)return;
  let html='<div class="page"><div class="eyebrow">LUCKY CITY · СООБЩЕСТВА</div><h1 class="lc-clan-title">Кланы города</h1><p class="lc-clan-note">Создание бесплатно. Прогресс клана хранится отдельно от личного прогресса игроков.</p>';
  if(notice)html+='<div class="lc-clan-error">'+esc(notice)+'</div>';
  if(!data)html+='<div class="lc-clan-panel">'+(loading?'Загрузка кланов…':'Не удалось загрузить кланы. <button class="btn ghost" data-clan="reload">Повторить</button>')+'</div>';
  else if(data.mine){
   const c=data.mine,canEdit=c.role==='owner'||c.role==='officer';
   html+='<div class="lc-clan-head">'+group(c)+'<div class="lc-clan-title">'+esc(c.name)+'</div><p class="lc-clan-note">Участников: '+c.memberCount+'/30 · Роль: '+(c.role==='owner'?'Глава':c.role==='officer'?'Заместитель':'Участник')+'</p><p>🪙 Казна клана: <b>'+Number(c.coins).toLocaleString('ru-RU')+' / '+Number(c.treasuryCapacity).toLocaleString('ru-RU')+'</b></p><button class="btn purple" data-clan="daily">Ежедневно +500 монет в казну</button></div>';
   html+='<div class="lc-clan-panel"><h3>Строительные пропуска</h3><p class="lc-clan-note">В наличии: '+Number(data?.permits||0)+' 🎟️. Платные этапы: штаб 4, 7, 10, 15; стена 4, 7, 10. Один пропуск — 5 голосов VK. На остальных уровнях используются только монеты из казны.</p><button class="btn ghost" data-clan="refresh-permits">Проверить оплаченные пропуска</button></div>';
   html+='<div class="lc-clan-panel"><h3>Пополнить казну монетами</h3><p class="lc-clan-note">Перевод из твоего личного баланса. Минимум 100 монет, шаг 100; максимальный взнос за раз — 1 000 000. Отменить перевод нельзя.</p><input id="lc-deposit-amount" type="number" min="100" max="1000000" step="100" class="lc-clan-input" placeholder="Например, 10000"><button class="btn purple" data-clan="deposit">Перевести монеты</button></div>';
   html+='<div class="lc-clan-grid">'+[['headquarters','🏚️','Штаб'],['wall','🛡️','Стена']].map(([key,emoji,label])=>'<div class="lc-clan-panel"><strong>'+label+' · '+c[key]+'/50</strong><div class="lc-clan-visual">'+(window.LuckyClanScene?.[key]?.(c[key])||'🏰')+'</div><p class="lc-clan-note">'+esc(description(key,c[key]))+'</p>'+(canEdit&&c[key]<50?(premiumNext(key,c[key]+1)?(Number(data?.permits||0)>0?'<button class="btn purple" data-clan="upgrade" data-kind="'+key+'">Строительный пропуск · 1 🎟️</button>':'<button class="btn purple" data-clan="buy-permit">Улучшить за 5 голосов VK</button>'):'<button class="btn purple" data-clan="upgrade" data-kind="'+key+'">Улучшить · '+upgradeCost(key,c[key])+' 🪙</button>'):'')+'</div>').join('')+'</div>';
   html+='<div class="lc-clan-panel"><h3>История казны</h3>'+((c.history||[]).length?(c.history||[]).map(entry=>'<div class="lc-clan-roster"><span>'+({deposit:'Взнос игрока',daily:'Ежедневный бонус',headquarters:'Улучшение штаба',wall:'Улучшение стены'}[entry.action]||'Операция')+'</span><strong>'+(Number(entry.coins)>0?'+':'')+Number(entry.coins).toLocaleString('ru-RU')+' 🪙</strong></div>').join(''):'<p class="lc-clan-note">Операций пока нет</p>')+'</div>';
   html+='<div class="lc-clan-panel"><h3>Участники клана</h3>'+(c.members||[]).map(m=>'<div class="lc-clan-roster"><span>'+esc(m.playerId.replace('vk:','VK '))+' · '+(m.role==='owner'?'Глава':m.role==='officer'?'Заместитель':'Участник')+'</span>'+(c.role==='owner'&&m.role!=='owner'?'<button class="btn ghost" data-clan="role" data-user="'+esc(m.playerId)+'" data-role="'+(m.role==='officer'?'member':'officer')+'">'+(m.role==='officer'?'Снять':'Назначить')+'</button>':'')+'</div>').join('')+'</div>';
   html+='<div class="lc-clan-panel"><button class="btn ghost" data-clan="leave">Покинуть клан</button><p class="lc-clan-note">Если глава уходит, управление автоматически передаётся другому участнику. Пустой клан закрывается.</p></div>';
  }else{
   html+='<div class="lc-clan-panel"><h3>Создать свой клан</h3><p class="lc-clan-note">Бесплатно. Название и аватарка автоматически берутся из сообщества VK, где вы являетесь администратором.</p>'+(creating?'<h3>Выберите свою группу VK</h3><p class="lc-clan-note">Показываются только сообщества, где у вас есть права администратора.</p>'+(adminGroups.length?adminGroups.map(g=>'<button class="lc-clan-select '+(preview?.groupId===g.groupId?'is-selected':'')+'" data-clan="select-group" data-id="'+g.groupId+'"><img class="lc-clan-img" src="'+esc(g.avatar)+'" alt=""><span><strong>'+esc(g.name)+'</strong><small>Сообщество VK · '+g.groupId+'</small></span></button>').join(''):'<p class="lc-clan-note">Нет доступных групп. Проверьте права администратора и разрешение VK.</p>')+(preview?'<div class="lc-clan-group" style="margin:12px 0">'+group(preview)+'</div><div id="lc-clan-create-result" role="status" aria-live="polite">'+(notice?'<p class="lc-clan-error">'+esc(notice)+'</p>':'')+'</div><button class="btn purple" data-clan="create">Создать клан бесплатно</button>':'')+'<div style="margin-top:12px"><button class="btn ghost" data-clan="refresh-groups">Обновить список</button> <button class="btn ghost" data-clan="cancel-create">Назад</button></div>':'<button class="btn purple" data-clan="start-create">Создать клан</button>')+'</div>';
   html+='<div class="sectionhead"><h2>Присоединиться к клану</h2></div>'+(data.leaders||[]).slice(0,20).map(c=>'<div class="lc-clan-rank"><img src="'+esc(c.avatar)+'" alt=""><div><strong>'+esc(c.name)+'</strong><small>'+c.memberCount+'/30 участников · Штаб '+c.headquarters+'</small></div><button class="btn ghost" data-clan="join" data-id="'+c.id+'">Вступить</button></div>').join('') ;
  }
  html+='</div>';el.innerHTML=html;
 }
 function paintTop(){
  const host=document.getElementById('lucky-clan-ranking');if(!host)return;
  host.innerHTML='<div class="lc-clan-panel"><h3>🏰 Топ кланов</h3>'+(rankings?.length?rankings.slice(0,20).map((c,i)=>'<div class="lc-clan-rank"><strong>#'+(i+1)+'</strong><img src="'+esc(c.avatar)+'" alt=""><div><strong>'+esc(c.name)+'</strong><small>Штаб '+c.headquarters+' · Стена '+c.wall+' · '+c.memberCount+' участников</small></div></div>').join(''):'<p class="lc-clan-note">'+(loadingTop?'Загрузка рейтинга…':'Кланы пока не найдены')+'</p>')+'</div>';
 }
 async function refreshTop(){
  if(loadingTop||!launch)return;loadingTop=true;paintTop();
  try{rankings=(await api()).leaders||[];}catch(e){rankings=[]}
  finally{loadingTop=false;paintTop()}
 }
 document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-clan]');if(!btn||!root()?.contains(btn)||btn.disabled)return;
  const action=btn.dataset.clan;if(action==='reload'||action==='refresh-permits')return load();
  if(!launch){notice='Откройте Lucky City через VK';return paint()}
  if(action==='start-create'||action==='refresh-groups')return openCreator();
  if(action==='cancel-create'){creating=false;preview=null;userToken=null;adminGroups=[];notice='';return paint()}
  if(action==='select-group'){preview=adminGroups.find(g=>g.groupId===Number(btn.dataset.id))||null;return paint()}
  if(action==='leave'&&!window.confirm('Выйти из клана?'))return; // The explicit Create Clan button is confirmation; no browser modal
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
   if(!Number.isSafeInteger(amount)||amount<100||amount>1000000||amount%100!==0){notice='Укажи сумму от 100 до 1 000 000 монет, кратную 100';return paint()}
   btn.disabled=true;btn.textContent='Переводим монеты…';
   try{if(!window.LuckyClanEconomy?.deposit)throw Error('Переводы ещё не подключены. Перезагрузи игру');await window.LuckyClanEconomy.deposit(amount);data=await api();notice='Монеты зачислены в казну'}catch(e){notice=e.message||'Перевод не подтверждён'}
   paint();return;
  }
  if(action==='create'&&!preview){notice='Сначала выберите группу VK';paint();return}
  btn.disabled=true;
  if(action==='create'){
   btn.textContent='Подтверждаем управление группой…';notice='';
   const result=document.getElementById('lc-clan-create-result');
   if(result)result.textContent='VK запросит разрешение на управление выбранным сообществом.';
  }
  try{
   // The native VK client issues a group-scoped token only to an authorized admin.
   // This short-lived proof is submitted once via HTTPS and never stored locally.
   const proof=action==='create'?await getCommunityProof(preview.groupId):null;
   const body=action==='create'?{groupId:preview?.groupId,communityToken:proof}:action==='join'?{id:Number(btn.dataset.id)}:action==='upgrade'?{kind:btn.dataset.kind}:action==='role'?{playerId:btn.dataset.user,role:btn.dataset.role}:{};
   await api('/'+action,body);preview=null;userToken=null;creating=false;adminGroups=[];data=await api();notice='Успешно';rankings=data.leaders;paintTop();
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
