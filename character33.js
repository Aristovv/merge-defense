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
 const base='stroke="#e5bbff" stroke-width="2.5" stroke-linejoin="round"';
 let shape='';
 if(t==='hat'){
  shape='<path d="M15 40 Q21 14 40 14 Q60 14 65 40 L65 44 L15 44Z" fill="'+color+'" '+base+'/>'+
  '<path d="M13 43 Q41 39 73 46 Q54 55 22 49Z" fill="'+color+'" '+base+'/>';
  if(id==='crown'||id==='horns')shape='<path d="M12 52 L8 18 25 33 40 12 56 33 73 18 69 52Z" fill="'+color+'" stroke="#ffecaf" stroke-width="3"/><circle cx="40" cy="38" r="5" fill="#f38bff"/>';
  if(id==='kitty')shape='<path d="M12 50 L12 19 25 29 40 15 55 29 68 19 68 50Z" fill="'+color+'" '+base+'/><circle cx="15" cy="38" r="10" fill="#aa69ff"/><circle cx="65" cy="38" r="10" fill="#aa69ff"/>';
 }
 if(t==='jacket')shape='<path d="M22 10 L31 5 40 19 49 5 58 10 73 27 66 66 55 58 55 75 25 75 25 58 14 66 7 27Z" fill="'+color+'" '+base+'/><path d="M31 6 L40 39 49 6 M40 39 L40 75" fill="none" stroke="#ffdc6a" stroke-width="3"/>';
 if(t==='pants')shape='<path d="M20 9 H61 L69 72 H45 L39 39 35 72 H12Z" fill="'+color+'" '+base+'/>';
 if(t==='shoes')shape='<path d="M11 44 L32 34 40 50 68 49 Q76 53 72 64 L8 64Z" fill="'+color+'" '+base+'/><path d="M12 56 H72" stroke="#fff" stroke-width="3"/>';
 if(t==='accessory')shape='<circle cx="24" cy="29" r="16" fill="'+color+'" '+base+'/><circle cx="56" cy="29" r="16" fill="'+color+'" '+base+'/><path d="M24 13 Q40 -2 56 13" fill="none" stroke="#ffd879" stroke-width="7"/>';
 return '<svg viewBox="0 0 80 80" aria-hidden="true">'+shape+'</svg>';
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
