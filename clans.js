// Lucky City clans interface: no local progress writes.
(()=>{
 'use strict';
 const BASE='https://merge.89-23-115-251.sslip.io/api/casino/clans';
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const root=()=>document.getElementById('lucky-clan-root');
 let launch='',data=null,preview=null,loading=false,rankings=null,notice='',loadingTop=false;
 const hqNames=['Гнилой сарай','Обшитый сарай','Небольшой сарай','Старый гараж с мусором','Убранный гараж','Оштукатуренный гараж','Гараж с ровным полом','Гараж с белыми стенами','Гараж с ламинатом','Освещённый гараж','Гараж с мебелью','Гараж с сейфом','Гараж с крепкой дверью','Гараж с кодовым замком','Заброшенный дом'];
 const wallNames=['Куча листьев','Листья и палки','Большая куча веток','Вкопанные колья','Колья и верёвки','Укреплённые колья','Колючая проволока','Забор и яма','Ров с мостиком','Начало бревенчатого забора','Бревенчатый забор — треть','Бревенчатый забор — две трети','Готовый бревенчатый забор','Бревенчатый забор с рвом','Ров с водой','Металлический каркас'];
 const description=(kind,level)=>kind==='headquarters'?(hqNames[level-1]||(level<=25?'Отремонтированный дом':level<=35?'Клановый особняк':level<=45?'Охраняемая резиденция':'Элитный клановый комплекс')):(wallNames[level-1]||(level<=25?'Металлический забор':level<=35?'Бетонная стена':level<=40?'Серебряная оборона':level<=44?'Золотая оборона':level<=47?'Алмазная оборона':'Изумрудная крепость'));
 const upgradeCost=l=>Math.ceil(100*Math.pow(1.18,l-1));
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
   html+='<div class="lc-clan-head">'+group(c)+'<div class="lc-clan-title">'+esc(c.name)+'</div><p class="lc-clan-note">Участников: '+c.memberCount+'/30 · Роль: '+(c.role==='owner'?'Глава':c.role==='officer'?'Заместитель':'Участник')+'</p><p>🧱 Материалы казны: <b>'+Number(c.materials).toLocaleString('ru-RU')+'</b></p><button class="btn purple" data-clan="daily">Получить ежедневные 100 материалов</button></div>';
   html+='<div class="lc-clan-grid">'+[['headquarters','🏚️','Штаб'],['wall','🛡️','Стена']].map(([key,emoji,label])=>'<div class="lc-clan-panel"><strong>'+label+' · '+c[key]+'/50</strong><div class="lc-clan-visual">'+(key==='headquarters'?(c[key]>35?'🏰':c[key]>15?'🏠':c[key]>3?'🏚️':'🛖'):(c[key]>35?'💎':c[key]>15?'🏯':c[key]>9?'🪵':'🌿'))+'</div><p class="lc-clan-note">'+esc(description(key,c[key]))+'</p>'+(canEdit&&c[key]<50?'<button class="btn purple" data-clan="upgrade" data-kind="'+key+'">Улучшить · '+upgradeCost(c[key])+' 🧱</button>':'')+'</div>').join('')+'</div>';
   html+='<div class="lc-clan-panel"><h3>Участники клана</h3>'+(c.members||[]).map(m=>'<div class="lc-clan-roster"><span>'+esc(m.playerId.replace('vk:','VK '))+' · '+(m.role==='owner'?'Глава':m.role==='officer'?'Заместитель':'Участник')+'</span>'+(c.role==='owner'&&m.role!=='owner'?'<button class="btn ghost" data-clan="role" data-user="'+esc(m.playerId)+'" data-role="'+(m.role==='officer'?'member':'officer')+'">'+(m.role==='officer'?'Снять':'Назначить')+'</button>':'')+'</div>').join('')+'</div>';
   html+='<div class="lc-clan-panel"><button class="btn ghost" data-clan="leave">Покинуть клан</button><p class="lc-clan-note">Если глава уходит, управление автоматически передаётся другому участнику. Пустой клан закрывается.</p></div>';
  }else{
   html+='<div class="lc-clan-panel"><h3>Создать клан бесплатно</h3><p class="lc-clan-note">Укажите ссылку на публичное сообщество VK, которое станет названием и аватаркой клана.</p><input class="lc-clan-input" id="lc-group-url" placeholder="https://vk.com/club123456" maxlength="200" autocomplete="off"><button class="btn purple" data-clan="preview">Выбрать сообщество</button><div id="lc-group-preview">'+(preview?group(preview)+'<button class="btn" data-clan="create" style="margin-top:12px">Создать клан бесплатно</button>':'')+'</div></div>';
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
  const action=btn.dataset.clan;if(action==='reload')return load();
  if(!launch){notice='Откройте Lucky City через VK';return paint()}
  if(['leave','create'].includes(action)&&!confirm(action==='leave'?'Выйти из клана?':'Создать клан с выбранным сообществом VK?'))return;
  const input=document.getElementById('lc-group-url');
  if(action==='preview'){
   const value=input?.value;btn.disabled=true;notice='';
   try{preview=await api('/group?url='+encodeURIComponent(value));preview=preview.group;}catch(err){preview=null;notice=err.message}
   paint();if(input)document.getElementById('lc-group-url').value=value||'';return;
  }
  btn.disabled=true;
  try{
   const body=action==='create'?{groupUrl:'https://vk.com/club'+preview?.groupId}:action==='join'?{id:Number(btn.dataset.id)}:action==='upgrade'?{kind:btn.dataset.kind}:action==='role'?{playerId:btn.dataset.user,role:btn.dataset.role}:{};
   await api('/'+action,body);preview=null;data=await api();notice='Успешно';rankings=data.leaders;paintTop();
  }catch(err){notice=err.message}finally{paint()}
 });
 window.LuckyClans={
  mount(params){launch=params||'';paint();load()},
  mountTop(params){launch=params||'';paintTop();refreshTop()},
  list(){return rankings}
 };
})();
