/* Lucky City 33.0 — Character wardrobe. No clan mechanics, no real-money charges. */
const LC33_GROUPS=[['hat','Головной убор','♛'],['jacket','Куртка','♧'],['pants','Штаны','▥'],['shoes','Обувь','♢'],['accessory','Аксессуар','✦']];
const LC33_GOODS=[
 ['cap','hat','Базовая кепка','Обычная',0,'default','#181b3f'],
 ['beanie','hat','Вязаная шапка','Обычная',5000,'coin','#72617a'],
 ['bucket','hat','Панама Lucky','Редкая',15000,'coin','#2157ae'],
 ['kitty','hat','Наушники Kitty','Эпическая',490,'premium','#a953ff'],
 ['crown','hat','Корона города','Легендарная',1990,'premium','#ffc746'],
 ['cylinder','hat','Цилиндр игрока','Редкая',25000,'coin','#e3e4fc'],
 ['cowboy','hat','Ковбойская шляпа','Эпическая',690,'premium','#7528b7'],
 ['horns','hat','Корона клана','Легендарная',2490,'locked','#efad32'],
 ['varsity','jacket','Куртка Lucky','Обычная',0,'default','#171c36'],
 ['hoodie','jacket','Неоновая худи','Редкая',12000,'coin','#7325c6'],
 ['goldcoat','jacket','Золотой бомбер','Эпическая',790,'premium','#f3b42a'],
 ['jeans','pants','Тёмные джинсы','Обычная',0,'default','#20223b'],
 ['cargo','pants','Карго Street','Редкая',9000,'coin','#50407d'],
 ['royalpants','pants','Брюки Royal','Эпическая',690,'premium','#7e3ac0'],
 ['sneakers','shoes','Городские кроссовки','Обычная',0,'default','#f7f3fc'],
 ['neonboots','shoes','Неоновые кеды','Редкая',8500,'coin','#18d0fa'],
 ['goldboots','shoes','Золотые ботинки','Легендарная',990,'premium','#f8bd36'],
 ['headphones','accessory','Золотые наушники','Обычная',0,'default','#ffbe39'],
 ['glasses','accessory','Очки Street','Редкая',6000,'coin','#5b46cd'],
 ['chain','accessory','Цепь Короля','Эпическая',590,'premium','#f1c655']
].map(([id,type,name,rarity,price,payment,color])=>({id,type,name,rarity,price,payment,color}));
let lc33Category='hat',lc33Subtab='wardrobe',lc33Selected='cap';
function lc33State(){
 if(!state.character33||typeof state.character33!=='object'||Array.isArray(state.character33))state.character33={};
 const c=state.character33;
 if(!Array.isArray(c.owned))c.owned=[];
 if(!c.equipped||typeof c.equipped!=='object')c.equipped={};
 const defaults={hat:'cap',jacket:'varsity',pants:'jeans',shoes:'sneakers',accessory:'headphones'};
 for(const [type,id] of Object.entries(defaults)){
  if(!c.owned.includes(id))c.owned.push(id);
  if(!LC33_GOODS.some(x=>x.type===type&&x.id===c.equipped[type]&&c.owned.includes(x.id)))c.equipped[type]=id;
 }
 return c;
}
function lc33SvgItem(g){
 const color=g?.color||'#bd6dff',t=g?.type||'hat',id=g?.id||'cap';
 const base='stroke="#c6a0ff" stroke-width="1.6" stroke-linejoin="round"';
 let shape='';
 const crown='<path d="M13 51 L11 24 27 37 40 12 54 37 69 24 67 51Z" fill="url(#lc33gold)" stroke="#ffeaa1" stroke-width="2.8"/><rect x="12" y="49" width="56" height="9" rx="3" fill="#de992d" stroke="#ffe78a" stroke-width="2"/><circle cx="40" cy="40" r="5" fill="#d16dff" stroke="#fff" stroke-width="1"/><circle cx="24" cy="46" r="2.5" fill="#44deff"/><circle cx="56" cy="46" r="2.5" fill="#44deff"/>';
 if(t==='hat'){
  shape='<path d="M12 41 Q16 17 34 14 Q58 8 65 39 L64 49 L14 49Z" fill="url(#lc33fabric)" '+base+'/>'+
  '<path d="M14 42 Q44 38 71 47 Q59 55 17 50Z" fill="'+color+'" stroke="#eacaff" stroke-width="2"/>'+
  '<path d="M19 42 Q29 21 38 19 M46 18 Q59 23 61 40" fill="none" stroke="#ffffff" opacity=".3" stroke-width="2"/>'+
  '<path d="M31 33 L36 36 41 29 46 36 51 33 49 40 H33Z" fill="#ffd36d"/>';
  if(id==='beanie')shape='<path d="M13 46 Q14 18 36 17 Q56 10 66 45Z" fill="'+color+'" '+base+'/><path d="M12 44 Q38 39 69 44 L67 55 Q42 59 12 54Z" fill="#514366" stroke="#dcc7ff" stroke-width="2"/><path d="M21 28 L20 45 M31 22 L32 43 M43 20 L44 43 M55 26 L57 44" stroke="#bfb5da" stroke-width="2"/>';
  if(id==='bucket')shape='<path d="M22 18 Q40 11 58 18 L66 45 Q40 50 14 45Z" fill="'+color+'" '+base+'/><ellipse cx="40" cy="48" rx="36" ry="8" fill="#162a61" stroke="#60b6ff" stroke-width="2"/><circle cx="39" cy="31" r="8" fill="#ffda63"/><path d="M35 33 Q39 37 44 33" fill="none" stroke="#241232" stroke-width="1.5"/>';
  if(id==='crown'||id==='horns')shape=crown;
  if(id==='kitty')shape='<path d="M12 47 L12 19 24 27 40 12 56 27 68 19 68 47Z" fill="'+color+'" '+base+'/><path d="M14 41 Q40 50 66 41" stroke="#fbc3ff" fill="none" stroke-width="4"/><circle cx="13" cy="41" r="12" fill="url(#lc33purple)" stroke="#ffb5ff" stroke-width="3"/><circle cx="67" cy="41" r="12" fill="url(#lc33purple)" stroke="#ffb5ff" stroke-width="3"/>';
  if(id==='cylinder')shape='<path d="M21 8 H59 L55 48 H25Z" fill="#e5e6fe" stroke="#9586ca" stroke-width="2"/><path d="M18 49 H63 L71 54 Q40 64 9 54Z" fill="#f6f1ff" stroke="#9385cf" stroke-width="2"/><rect x="25" y="36" width="30" height="9" fill="#b587ff"/><path d="M35 38 L40 27 45 38Z" fill="#38275d"/>';
  if(id==='cowboy')shape='<path d="M19 44 Q24 13 40 12 Q59 13 63 44Z" fill="'+color+'" '+base+'/><path d="M7 45 Q39 54 72 45 Q64 66 40 53 Q15 67 7 45Z" fill="#8a32c9" stroke="#f3adff" stroke-width="2"/><path d="M20 39 L61 39" stroke="#f6bc49" stroke-width="4"/><circle cx="40" cy="38" r="4" fill="#f3c859"/>';
 }
 if(t==='jacket')shape='<path d="M22 11 L31 7 40 20 49 7 58 11 73 27 66 67 55 59 55 76 25 76 25 59 14 67 7 27Z" fill="'+color+'" '+base+'/><path d="M31 8 L40 39 49 8 M40 39 V75" fill="none" stroke="#ffdc6a" stroke-width="3"/><path d="M17 25 L26 31 24 55 13 50 M63 25 L54 31 56 55 67 50" fill="#000" opacity=".25"/><path d="M28 54 H34 M46 54 H52" stroke="#ffd46d" stroke-width="3"/><circle cx="40" cy="56" r="2" fill="#ffd46d"/>';
 if(t==='pants')shape='<path d="M20 9 H61 L69 72 H45 L39 39 35 72 H12Z" fill="'+color+'" '+base+'/><path d="M22 17 L36 19 M47 19 L61 17 M24 54 L34 54 M50 54 L64 54" stroke="#cfbafa" opacity=".55" stroke-width="2"/><path d="M38 11 V28" stroke="#ffc869" stroke-width="2"/>';
 if(t==='shoes')shape='<path d="M11 44 L32 34 40 50 68 49 Q76 53 72 64 L8 64Z" fill="'+color+'" '+base+'/><path d="M12 56 H72" stroke="#fff" stroke-width="4"/><path d="M25 46 L41 50 M24 51 L43 55" stroke="#d5b4ff" stroke-width="2"/><path d="M52 55 L64 55" stroke="#fbc75f" stroke-width="3"/>';
 if(t==='accessory')shape='<path d="M21 17 Q40 -3 59 17" fill="none" stroke="#f9ce63" stroke-width="7"/><rect x="8" y="22" width="22" height="38" rx="10" fill="'+color+'" '+base+'"/><rect x="50" y="22" width="22" height="38" rx="10" fill="'+color+'" '+base+'"/><rect x="13" y="28" width="12" height="25" rx="6" fill="#65429a"/><rect x="55" y="28" width="12" height="25" rx="6" fill="#65429a"/>';
 if(id==='glasses')shape='<rect x="7" y="29" width="29" height="24" rx="7" fill="#372569" stroke="#dcc1ff" stroke-width="3"/><rect x="44" y="29" width="29" height="24" rx="7" fill="#372569" stroke="#dcc1ff" stroke-width="3"/><path d="M36 35 Q40 30 44 35" stroke="'+color+'" fill="none" stroke-width="4"/><path d="M11 33 L31 47 M48 33 L67 47" stroke="#e9d4ff" opacity=".5"/>';
 if(id==='chain')shape='<path d="M16 15 Q15 60 40 65 Q65 60 64 15" fill="none" stroke="#f7ce68" stroke-width="8"/><path d="M16 15 Q15 60 40 65 Q65 60 64 15" fill="none" stroke="#fff1a6" stroke-width="2" stroke-dasharray="4 6"/><path d="M34 48 L40 40 46 48 40 60Z" fill="#f4bb45" stroke="#fff0ac" stroke-width="2"/>';
 return '<svg viewBox="0 0 80 80" aria-hidden="true"><defs><linearGradient id="lc33fabric" x2="1" y2="1"><stop stop-color="'+color+'"/><stop offset=".5" stop-color="#524184"/><stop offset="1" stop-color="'+color+'"/></linearGradient><linearGradient id="lc33gold" x2="1" y2="1"><stop stop-color="#fff0a5"/><stop offset=".45" stop-color="#f6b72d"/><stop offset="1" stop-color="#ae601a"/></linearGradient><linearGradient id="lc33purple" x2="1" y2="1"><stop stop-color="#e69cff"/><stop offset="1" stop-color="#6a23d5"/></linearGradient></defs>'+shape+'</svg>';
}
function lc33Avatar(){
 const c=lc33State(),hat=LC33_GOODS.find(x=>x.id===c.equipped.hat),coat=LC33_GOODS.find(x=>x.id===c.equipped.jacket),
 pant=LC33_GOODS.find(x=>x.id===c.equipped.pants),shoes=LC33_GOODS.find(x=>x.id===c.equipped.shoes),
 acc=LC33_GOODS.find(x=>x.id===c.equipped.accessory);
 const h=hat?.color||'#1a213f',j=coat?.color||'#1b2039',p=pant?.color||'#282039',s=shoes?.color||'#fff',a=acc?.color||'#ffbd3b';
 const crown=hat&&['crown','horns'].includes(hat.id);
 return '<svg viewBox="0 0 240 370" role="img" aria-label="Персонаж в выбранной одежде"><defs><linearGradient id="lcskin" x2="0.9" y2="1"><stop stop-color="#ffe0bd"/><stop offset="1" stop-color="#ca8b79"/></linearGradient><linearGradient id="lcshine"><stop stop-color="#f0bb46"/><stop offset="1" stop-color="#ae6cff"/></linearGradient></defs>'+
 '<ellipse cx="120" cy="349" rx="98" ry="14" fill="#af55ff" opacity=".32"/>'+
 '<path d="M81 233 L114 231 112 314 99 339 63 333 77 291Z M127 234 L164 229 167 310 190 333 150 339 135 302Z" fill="'+p+'" stroke="#130f2e" stroke-width="6"/>'+
 '<path d="M61 329 Q84 312 105 328 L109 347 Q83 355 54 346Z M149 328 Q171 309 188 328 L197 346 Q172 353 144 346Z" fill="'+s+'" stroke="#1c1834" stroke-width="5"/><path d="M58 340 L108 340 M146 340 L195 340" stroke="#f3b733" stroke-width="4"/>'+
 '<path d="M82 144 Q119 131 160 144 L177 225 Q144 243 77 234Z" fill="'+j+'" stroke="#170b29" stroke-width="6"/>'+
 '<path d="M91 141 L117 192 143 141 M117 192 L117 232" fill="none" stroke="#f0bb47" stroke-width="7"/>'+
 '<path d="M79 158 Q53 176 47 220 L66 234 96 190Z M159 157 Q182 167 196 223 L174 236 147 189Z" fill="'+j+'" stroke="#1a0d30" stroke-width="6"/>'+
 '<ellipse cx="58" cy="236" rx="13" ry="17" fill="url(#lcskin)"/><ellipse cx="182" cy="236" rx="13" ry="17" fill="url(#lcskin)"/>'+
 '<rect x="109" y="128" width="24" height="27" rx="10" fill="url(#lcskin)"/>'+
 '<ellipse cx="121" cy="94" rx="45" ry="53" fill="url(#lcskin)" stroke="#24112c" stroke-width="4"/>'+
 '<path d="M76 89 Q62 48 95 39 Q126 20 163 53 L167 90 Q152 83 143 70 Q108 100 77 86Z" fill="#1b1331"/>'+
 '<path d="M96 101 Q106 93 115 102 M131 102 Q141 94 150 101" fill="none" stroke="#301d37" stroke-width="4" stroke-linecap="round"/>'+
 '<circle cx="108" cy="105" r="4" fill="#45aaf0"/><circle cx="140" cy="105" r="4" fill="#45aaf0"/>'+
 '<path d="M113 126 Q124 134 136 124" fill="none" stroke="#803747" stroke-width="3"/>'+
 (crown?'<path d="M78 55 L72 21 95 39 120 11 145 39 170 21 164 55Z" fill="'+h+'" stroke="#ffe99c" stroke-width="5"/><circle cx="120" cy="38" r="6" fill="#fc8aff"/>':
 '<path d="M78 66 Q86 28 120 28 Q155 28 165 65 L163 78 74 78Z" fill="'+h+'" stroke="#241236" stroke-width="5"/><path d="M65 76 Q130 64 171 78 Q147 92 68 86Z" fill="'+h+'" stroke="#171231" stroke-width="4"/>')+
 (acc?.id==='headphones'?'<path d="M86 92 Q77 59 118 54 Q160 54 161 90" fill="none" stroke="'+a+'" stroke-width="8"/><rect x="74" y="84" width="14" height="30" rx="7" fill="'+a+'"/><rect x="154" y="84" width="14" height="30" rx="7" fill="'+a+'"/>':'')+
 (acc?.id==='glasses'?'<path d="M93 102 H119 M127 102 H151" stroke="'+a+'" stroke-width="6"/><rect x="91" y="92" width="29" height="20" rx="6" fill="#372e65aa" stroke="'+a+'" stroke-width="3"/><rect x="128" y="92" width="29" height="20" rx="6" fill="#372e65aa" stroke="'+a+'" stroke-width="3"/>':'')+
 (acc?.id==='chain'?'<path d="M97 146 Q120 185 146 146" fill="none" stroke="'+a+'" stroke-width="7"/><path d="M115 167 L123 177 130 165" fill="'+a+'"/>':'')+
 '</svg>';
}
function lc33Screen(){
 const c=lc33State(),active=LC33_GROUPS.find(g=>g[0]===lc33Category)||LC33_GROUPS[0];
 const list=LC33_GOODS.filter(g=>g.type===lc33Category);
 const selected=LC33_GOODS.find(g=>g.id===lc33Selected)||list[0];
 const cards=list.map(g=>{
  const owned=c.owned.includes(g.id),equipped=c.equipped[g.type]===g.id;
  const rarity=g.rarity==='Редкая'?'rare':g.rarity==='Эпическая'?'epic':g.rarity==='Легендарная'?'legend':'';
  const action=equipped?'✓ Надето':owned?'Надеть':g.payment==='coin'?fmt(g.price)+' 🪙':g.payment==='premium'?'🔒 '+g.price+' гол.':'Пока недоступно';
  return '<article class="lc33-item '+rarity+(equipped?' on':'')+'"><span class="rar">'+rankEsc(g.rarity)+'</span>'+lc33SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong>'+
   '<button data-lc33-item="'+g.id+'"'+(equipped?' disabled':'')+'>'+action+'</button></article>';
 }).join('');
 const view=lc33Subtab==='wardrobe'?
  '<div class="lc33-stage"><aside class="lc33-cats">'+LC33_GROUPS.map(g=>'<button data-lc33-cat="'+g[0]+'" class="'+(lc33Category===g[0]?'active':'')+'">'+g[2]+' '+g[1]+'</button>').join('')+'</aside>'+
  '<div class="lc33-figure"><div class="lc33-city">✧ ✦ ✧</div><div class="lc33-halo"></div><div class="lc33-person">'+lc33Avatar()+'</div></div>'+
  '<div class="lc33-side"><div>🪙 Бонус дохода<b>0% · только стиль</b></div><div>🛡️ Защита клана<b>Скоро</b></div><div>👑 Активный образ<b>LUCKY CITY</b></div></div></div>'+
  '<section class="lc33-section"><h2>'+rankEsc(active[2])+' '+rankEsc(active[1])+'</h2><div class="lc33-items">'+cards+'</div>'+
  (selected?'<div class="lc33-detail">'+lc33SvgItem(selected)+'<div><strong>'+rankEsc(selected.name)+'</strong><p>'+rankEsc(selected.rarity)+' · '+(selected.payment==='premium'?'Премиальный внешний вид':selected.payment==='coin'?'Покупается за игровые монеты':'Стиль персонажа')+'</p><small>Одежда не влияет на шанс выигрыша</small></div></div>':'')+'</section>':
  '<section class="lc33-section"><h2>'+(lc33Subtab==='collection'?'Моя коллекция':'Бонусы персонажа')+'</h2>'+
  (lc33Subtab==='collection'?'<div class="lc33-items">'+LC33_GOODS.filter(g=>c.owned.includes(g.id)).map(g=>'<article class="lc33-item">'+lc33SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong><button data-lc33-cat="'+g.type+'">Посмотреть</button></article>').join('')+'</div>':
   '<div class="lc33-empty">Персонаж пока косметический. Бонусы к доходу и клановой защите не подключены, чтобы не менять игровую экономику.</div>')+'</section>';
 return '<main class="lc33"><div class="lc33-hero"><h1>ПЕРСОНАЖ</h1></div>'+
 '<div class="lc33-tabs">'+[['wardrobe','♧ Гардероб'],['collection','♛ Коллекция'],['bonuses','✧ Бонусы']].map(([id,name])=>'<button class="'+(lc33Subtab===id?'active':'')+'" data-lc33-tab="'+id+'">'+name+'</button>').join('')+'</div>'+view+'</main>';
}
document.addEventListener('click',function(e){
 const t=e.target.closest('[data-lc33-tab]');if(t){lc33Subtab=t.dataset.lc33Tab;render();return}
 const g=e.target.closest('[data-lc33-cat]');if(g){lc33Category=g.dataset.lc33Cat;lc33Subtab='wardrobe';render();return}
 const b=e.target.closest('[data-lc33-item]');if(!b)return;
 const item=LC33_GOODS.find(x=>x.id===b.dataset.lc33Item);if(!item)return;
 lc33Selected=item.id;const c=lc33State();
 if(c.equipped[item.type]===item.id)return;
 if(!c.owned.includes(item.id)){
  if(item.payment==='premium'){message('Премиальная одежда появится после подтверждённой оплаты VK');render();return}
  if(item.payment==='locked'){message('Этот предмет пока недоступен');render();return}
  if(item.payment==='coin'){
   if(state.coins<item.price){message('Недостаточно монет');render();return}
   state.coins-=item.price;c.owned.push(item.id);
  }
 }
 c.equipped[item.type]=item.id;save();render();message('Предмет применён: '+item.name);
});
