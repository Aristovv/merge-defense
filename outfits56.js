
/* Lucky City 56 — whole outfits only; old character item ownership preserved. */
'use strict';
const LC56=[
 ['street','NEON STREET',460000,'coin','outfit-street.png','Редкий'],
 ['sakura','SAKURA NIGHT',780000,'coin','outfit-sakura.png','Эпический'],
 ['phantom','DARK PHANTOM',5875000,'coin','outfit-phantom.png','Мифический'],
 ['emperor','GOLDEN EMPEROR',21000000,'coin','outfit-emperor.png','Мифический'],
 ['galaxy','COSMIC LEGEND',5970000,'coin','outfit-galaxy.png','Мифический'],
 ['street-black','STREET BLACK',50000,'coin','street-black.png','Обычный'],
 ['urban-basic','URBAN BASIC',85000,'coin','urban-basic.png','Обычный'],
 ['neon-casual','NEON CASUAL',120000,'coin','neon-casual.png','Обычный'],
 ['city-rookie','CITY ROOKIE',180000,'coin','city-rookie.png','Необычный'],
 ['sport-night','SPORT NIGHT',250000,'coin','sport-night.png','Необычный'],
 ['cyber-smoke','CYBER SMOKE',1200000,'coin','cyber-smoke.png','Редкий'],
 ['midnight-racer','MIDNIGHT RACER',1850000,'coin','midnight-racer.png','Эпический'],
 ['violet-drip','VIOLET DRIP',2600000,'coin','violet-drip.png','Эпический'],
 ['royal-eclipse','ROYAL ECLIPSE',12500000,'coin','royal-eclipse.png','Легендарный'],
 ['diamond-syndicate','DIAMOND SYNDICATE',18000000,'coin','diamond-syndicate.png','Легендарный'],
 ['shadow-king','SHADOW KING',25000000,'coin','shadow-king.png','Легендарный'],
 ['galaxy-supreme','GALAXY SUPREME',19,'votes','galaxy-supreme.png','Легендарный'],
 ['obsidian-crown','OBSIDIAN CROWN',39,'votes','obsidian-crown.png','Легендарный'],
 ['inferno-elite','INFERNO ELITE',59,'votes','inferno-elite.png','Легендарный'],
 ['crystal-monarch','CRYSTAL MONARCH',79,'votes','crystal-monarch.png','Легендарный'],
 ['lucky-city-vip','LUCKY CITY VIP',109,'votes','lucky-city-vip.png','Эксклюзивный']
].map(([id,name,price,currency,image,rarity])=>({id,name,price,currency,image,rarity}));
const LC56_MAP=new Map(LC56.map(o=>[o.id,o]));
let lc56Tab='shop',lc56Preview=null,lc56Buying=false;
function lc56State(){
 const c=lc33State();
 if(!Array.isArray(c.ownedOutfits))c.ownedOutfits=[];
 if(c.outfitMigrated56!==true){
  for(const set of LC39_SETS){
   const complete=Object.values(set.equipped).every(id=>c.owned.includes(id));
   const original=set.legacyEquipped&&Object.values(set.legacyEquipped).every(id=>c.owned.includes(id));
   if((complete||original)&&!c.ownedOutfits.includes(set.id))c.ownedOutfits.push(set.id);
  }
  const active=LC39_SETS.find(set=>lc39IsWearing(set,c)&&c.ownedOutfits.includes(set.id));
  c.activeOutfit=active?.id||'base';c.outfitMigrated56=true;
 }
 if(!c.activeOutfit)c.activeOutfit='base';
 return c;
}
function lc56Img(id,name){
 const o=LC56_MAP.get(id);
 return '<img loading="lazy" alt="'+rankEsc(name)+'" src="./assets/character44/'+(o?.image||'avatar.png')+'?v=56.1.16" onerror="this.onerror=null;this.src=\'./assets/character44/avatar.png\'">';
}
function lc56Price(o){return fmt(o.price)+(o.currency==='votes'?' голосов VK':' 🪙')}
function lc56Tile(o,c){
 const owned=c.ownedOutfits.includes(o.id),active=c.activeOutfit===o.id;
 return '<article class="lc56-tile"><strong>'+o.name+'</strong><small>'+o.rarity+'</small>'+
 '<div class="lc56-tile-photo">'+lc56Img(o.id,o.name)+'</div>'+
 '<div class="lc56-price">'+(owned?'✓ Куплен':lc56Price(o))+'</div>'+
 '<div class="lc56-actions"><button data-lc56-preview="'+o.id+'">Примерить</button>'+
 (owned?'<button data-lc56-wear="'+o.id+'" '+(active?'disabled':'')+'>'+(active?'✓ Надето':'Надеть')+'</button>':
 o.currency==='votes'?'<button disabled title="Оплата голосами пока не подключена">Оплата скоро</button>':
 '<button class="lc56-buy" data-lc56-buy="'+o.id+'">Купить</button>')+'</div></article>';
}
function lc56Pending(o){
 return '<article class="lc56-upcoming"><span>✦</span><div><strong>'+o.name+'</strong><small>'+o.rarity+'</small></div>'+
 '<div class="lc56-upcoming-price">'+lc56Price(o)+'<small>Графика готовится</small></div></article>';
}
function lc56Screen(){
 const c=lc56State(),id=lc56Preview||c.activeOutfit||'base';
 const featured=LC56_MAP.get(id);
 const ready=LC56.filter(o=>o.image),planned=LC56.filter(o=>!o.image);
 const owned=ready.filter(o=>c.ownedOutfits.includes(o.id));
 const gallery=lc56Tab==='shop'?
 '<section class="lc56-section"><h2>Готовые образы</h2><p>Примерь и купи цельный образ — без отдельных вещей.</p>'+
 '<div class="lc56-gallery">'+ready.map(o=>lc56Tile(o,c)).join('')+'</div>'+
 '<h2>Новые образы</h2><p>Изображения обновлены. Покупки за голоса откроются после проверки серверной оплаты VK.</p>'+
 '<div class="lc56-upcoming-list">'+planned.map(lc56Pending).join('')+'</div></section>':
 lc56Tab==='collection'?
 '<section class="lc56-section"><h2>Моя коллекция</h2><p>Готовых образов: '+owned.length+'. Старая одежда и донатные покупки сохранены в данных игрока.</p>'+
 '<button class="lc56-base" data-lc56-base>Базовый персонаж — бесплатно</button>'+
 '<div class="lc56-gallery">'+(owned.length?owned.map(o=>lc56Tile(o,c)).join(''):'<p>Пока нет купленных образов</p>')+'</div></section>':
 '<section class="lc56-section"><h2>О системе</h2><p>Отдельные вещи больше не продаются в интерфейсе. Базовый вид бесплатный. Купленные ранее предметы в сохранении остаются.</p>'+
 '<p>Донатные образы: 19, 39, 59, 79 и 109 голосов VK. Их можно примерять; покупка откроется после подключения и проверки серверной оплаты.</p></section>';
 return '<main class="lc56-root"><h1>ПЕРСОНАЖ</h1>'+
 '<nav class="lc56-tabs">'+[['shop','Образы'],['collection','Коллекция'],['info','Информация']].map(([key,label])=>
 '<button data-lc56-tab="'+key+'" class="'+(lc56Tab===key?'active':'')+'">'+label+'</button>').join('')+'</nav>'+
 '<section class="lc56-stage"><div class="lc56-eyebrow">'+(lc56Preview?'БЕСПЛАТНАЯ ПРИМЕРКА':featured?'МОЙ ОБРАЗ: '+featured.name:'БАЗОВЫЙ ПЕРСОНАЖ')+'</div>'+
 '<div class="lc56-big-avatar">'+lc56Img(id,featured?.name||'Базовый персонаж')+'</div>'+
 (lc56Preview?'<button data-lc56-reset>Снять примерку</button>':'')+
 (c.activeOutfit!=='base'?'<button data-lc56-base>Надеть базовый</button>':'')+'</section>'+
 '<p class="lc56-sync">'+rankEsc(lc54CloudStatus())+'</p>'+gallery+'</main>';
}
lc33Screen=lc56Screen;
document.addEventListener('click',function(e){
 const tab=e.target.closest('[data-lc56-tab]');
 if(tab){lc56Tab=tab.dataset.lc56Tab;render();return}
 const preview=e.target.closest('[data-lc56-preview]');
 if(preview){const o=LC56_MAP.get(preview.dataset.lc56Preview);if(!o?.image)return;lc56Preview=o.id;render();message('Примерка бесплатно: '+o.name);return}
 if(e.target.closest('[data-lc56-reset]')){lc56Preview=null;render();return}
 if(e.target.closest('[data-lc56-base]')){
  const c=lc56State();c.activeOutfit='base';lc56Preview=null;save();render();return;
 }
 const wear=e.target.closest('[data-lc56-wear]');
 if(wear){const o=LC56_MAP.get(wear.dataset.lc56Wear),c=lc56State();
  if(!o?.image||!c.ownedOutfits.includes(o.id))return;
  c.activeOutfit=o.id;lc56Preview=null;save();render();message('Надето: '+o.name);return;
 }
 const buy=e.target.closest('[data-lc56-buy]');
 if(!buy||lc56Buying)return;
 const o=LC56_MAP.get(buy.dataset.lc56Buy),c=lc56State();
 if(!o?.image||o.currency!=='coin'||c.ownedOutfits.includes(o.id))return;
 if(lc54CloudRequired()&&(typeof casinoCloudRevision==='undefined'||casinoCloudRevision===null)){
  message('Нет облачной синхронизации, покупка временно недоступна');return;
 }
 if(!lc54StorageReady()){message('Сохранение недоступно');return}
 if(!Number.isSafeInteger(state.coins)||state.coins<o.price){message('Недостаточно монет');return}
 lc56Buying=true;buy.disabled=true;
 const prev={coins:state.coins,owned:[...c.ownedOutfits],active:c.activeOutfit,receipt:c.lastOutfitPurchase};
 try{
  state.coins-=o.price;c.ownedOutfits.push(o.id);c.activeOutfit=o.id;
  c.lastOutfitPurchase={id:o.id,price:o.price,at:Date.now()};
  save();
  const stored=JSON.parse(localStorage.getItem('casino_city_vk_v100')||'null');
  if(stored?.coins!==state.coins||!stored?.character33?.ownedOutfits?.includes(o.id)||
   stored?.character33?.lastOutfitPurchase?.at!==c.lastOutfitPurchase.at)throw Error('SAVE_NOT_PERSISTED');
  lc56Preview=null;render();message('Образ куплен и надет. Ожидается синхронизация с облаком.');
 }catch(err){
  state.coins=prev.coins;c.ownedOutfits=prev.owned;c.activeOutfit=prev.active;c.lastOutfitPurchase=prev.receipt;
  console.error('Outfit purchase',err);message('Не удалось сохранить покупку, изменения отменены');render();
 }finally{lc56Buying=false;buy.disabled=false}
});
(function(){
 const el=document.createElement('style');el.id='lc56-complete-outfits';
 el.textContent=
 '.lc56-root{padding:12px 9px;color:#f4e7ff}.lc56-root h1{text-align:center;font-size:26px;margin:9px 0 16px;text-shadow:0 0 15px #be6aff}'+
 '.lc56-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.lc56-tabs button{padding:12px 4px;border-radius:12px;font-size:12px;font-weight:800;color:#eee;border:1px solid #8051b0;background:#2b1645}.lc56-tabs button.active{background:linear-gradient(145deg,#9b49d6,#54208c)}'+
 '.lc56-stage{text-align:center;margin:16px 0;border:1px solid #8550bb;background:radial-gradient(ellipse,#38214e,#170b28);border-radius:20px;padding:12px}.lc56-eyebrow{font-size:11px;font-weight:900;letter-spacing:.8px}.lc56-big-avatar{height:350px;margin:6px auto;display:flex;align-items:center;justify-content:center}.lc56-big-avatar img{height:100%;max-width:100%;object-fit:contain}'+
 '.lc56-stage button,.lc56-base{border:1px solid #9865bf;background:#47236f;color:white;border-radius:11px;font-weight:800;padding:10px;margin:5px;font-size:12px}'+
 '.lc56-sync{font-size:10px;color:#bda8d0;line-height:1.5;padding:0 6px}.lc56-section{padding:13px 10px;border:1px solid #7553a0;border-radius:18px;background:#1e0f3188}.lc56-section h2{font-size:18px;margin:7px 0 10px;color:#f2ddff}.lc56-section p{font-size:11px;line-height:1.5;color:#c7b5d9}'+
 '.lc56-gallery{display:grid;grid-template-columns:minmax(0,1fr);gap:13px}.lc56-tile{padding:11px;border:1px solid #9162c6;border-radius:16px;background:radial-gradient(ellipse,#452558,#241234);min-width:0}.lc56-tile>strong{font-size:15px}.lc56-tile>small{display:block;color:#b8a0da;font-size:11px;margin:4px 0}.lc56-tile-photo{height:280px;text-align:center}.lc56-tile-photo img{height:100%;max-width:100%;object-fit:contain}.lc56-price{font-weight:900;font-size:13px;color:#f3d68d;margin:7px 0}.lc56-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.lc56-actions button{padding:12px 5px;border:1px solid #9a6fbd;border-radius:10px;background:#3d245b;color:white;font-size:12px;font-weight:800}.lc56-actions .lc56-buy{background:linear-gradient(140deg,#9f50d3,#65239e)}'+
 '.lc56-upcoming-list{display:grid;gap:7px}.lc56-upcoming{border:1px solid #6c4a8888;border-radius:12px;background:#28183e;padding:10px;display:grid;grid-template-columns:26px 1fr auto;gap:8px;align-items:center}.lc56-upcoming strong{font-size:11px}.lc56-upcoming small{display:block;font-size:10px;color:#bda6cf}.lc56-upcoming-price{color:#e4c7f0;font-size:11px;font-weight:800;text-align:right}.lc56-upcoming-price small{font-weight:400}.lc56-root button:disabled{opacity:.65}'+
 '@media(min-width:650px){.lc56-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}.lc56-big-avatar{height:410px}}';
 document.head.appendChild(el);
})();
