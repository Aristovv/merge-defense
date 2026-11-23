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
/* 35.0: preserve all legacy item IDs and ownership; add 70 collectible wardrobe pieces.
   All real-money prices are in VK Votes and are only charged via the confirmed VK callback. */
const LC35_NEW_ITEMS=[
 // Hats: premium city streetwear and expensive collectables
 ['cap-noir','hat','Кепка STREET (чёрная)','Редкая',35000,'coin','#16172d','cap'],
 ['cap-ice','hat','Кепка Ice','Редкая',65000,'coin','#47bffa','cap'],
 ['cap-flame','hat','Кепка Flame','Эпическая',125000,'coin','#e94a42','cap'],
 ['cap-diamond','hat','Кепка Diamond','Легендарная',750000,'coin','#a4f2ff','cap'],
 ['beanie-rose','hat','Шапка Sakura','Редкая',55000,'coin','#e58bbd','beanie'],
 ['beanie-night','hat','Шапка Midnight','Эпическая',190000,'coin','#2a275c','beanie'],
 ['bucket-neon','hat','Панама Neon','Эпическая',235000,'coin','#8d41ed','bucket'],
 ['bucket-emerald','hat','Панама Emerald','Легендарная',550000,'coin','#32bf8b','bucket'],
 ['fedora-shadow','hat','Шляпа Shadow','Легендарная',900000,'coin','#281f34','cowboy'],
 ['crown-obsidian','hat','Корона Obsidian','Мифическая',3500000,'coin','#262242','crown'],
 ['cap-vip','hat','Кепка VIP','Эпическая',5,'premium','#c5a2ff','cap'],
 ['beanie-stars','hat','Шапка Starfall','Эпическая',7,'premium','#5755b3','beanie'],
 ['bucket-holo','hat','Панама Hologram','Легендарная',10,'premium','#76e3f5','bucket'],
 ['kitty-pink','hat','Наушники Kitty Pink','Эпическая',8,'premium','#e78ceb','kitty'],
 ['crown-royal','hat','Корона Royal','Легендарная',19,'premium','#ffc765','crown'],
 // Jackets
 ['jacket-black','jacket','Бомбер STREET (чёрный)','Редкая',45000,'coin','#121525','varsity'],
 ['jacket-blue','jacket','Куртка Sapphire','Редкая',85000,'coin','#3154b1','varsity'],
 ['hoodie-rose','jacket','Худи Sakura','Эпическая',175000,'coin','#b95b98','hoodie'],
 ['hoodie-forest','jacket','Худи Forest','Эпическая',280000,'coin','#197557','hoodie'],
 ['jacket-sunset','jacket','Бомбер Sunset','Легендарная',650000,'coin','#f07948','varsity'],
 ['jacket-diamond','jacket','Куртка Diamond','Легендарная',1200000,'coin','#75d8e8','varsity'],
 ['hoodie-cosmos','jacket','Худи Cosmos','Мифическая',2800000,'coin','#452bb4','hoodie'],
 ['coat-emperor','jacket','Плащ Императора','Мифическая',6500000,'coin','#a67829','goldcoat'],
 ['jacket-neon-vip','jacket','Бомбер Neon VIP','Эпическая',7,'premium','#9c46ff','varsity'],
 ['hoodie-lunar','jacket','Худи Lunar','Эпическая',9,'premium','#929be6','hoodie'],
 ['jacket-phoenix','jacket','Куртка Phoenix','Легендарная',14,'premium','#e14a32','goldcoat'],
 ['coat-royal-vip','jacket','Плащ Royal VIP','Легендарная',22,'premium','#e0b13c','goldcoat'],
 // Pants
 ['pants-blue','pants','Джинсы Indigo','Редкая',40000,'coin','#344f9a','jeans'],
 ['pants-white','pants','Джинсы Frost','Редкая',75000,'coin','#c4cce7','jeans'],
 ['cargo-navy','pants','Карго Navy','Эпическая',150000,'coin','#263b6b','cargo'],
 ['cargo-violet','pants','Карго STREET (фиолетовые)','Эпическая',260000,'coin','#7c42ba','cargo'],
 ['pants-goldline','pants','Брюки Goldline','Легендарная',700000,'coin','#58407a','royalpants'],
 ['pants-diamond','pants','Брюки Diamond','Легендарная',1200000,'coin','#6db4d2','royalpants'],
 ['cargo-abyss','pants','Карго Abyss','Мифическая',2800000,'coin','#171e37','cargo'],
 ['pants-emperor','pants','Брюки Императора','Мифическая',4500000,'coin','#b68a30','royalpants'],
 ['pants-vip','pants','Джинсы VIP','Эпическая',5,'premium','#895bce','jeans'],
 ['cargo-neon-vip','pants','Карго Neon','Эпическая',7,'premium','#6c4bea','cargo'],
 ['pants-royal-vip','pants','Брюки Crown','Легендарная',12,'premium','#d29c44','royalpants'],
 ['pants-galaxy','pants','Брюки Galaxy','Легендарная',17,'premium','#6c62cf','royalpants'],
 // Shoes
 ['shoes-black','shoes','Кроссовки STREET (чёрные)','Редкая',30000,'coin','#292538','sneakers'],
 ['shoes-rose','shoes','Кроссовки Rose','Редкая',65000,'coin','#e19cc0','sneakers'],
 ['shoes-ice','shoes','Кеды Ice','Эпическая',130000,'coin','#6bd0f4','neonboots'],
 ['shoes-lime','shoes','Кеды Toxic','Эпическая',220000,'coin','#7eed56','neonboots'],
 ['shoes-royal','shoes','Ботинки Royal','Легендарная',600000,'coin','#b88df0','goldboots'],
 ['shoes-flame','shoes','Кроссовки Fire','Легендарная',900000,'coin','#f57737','neonboots'],
 ['shoes-diamond','shoes','Ботинки Diamond','Мифическая',2200000,'coin','#c0f2fc','goldboots'],
 ['shoes-emperor','shoes','Обувь Императора','Мифическая',3500000,'coin','#dbac4c','goldboots'],
 ['shoes-vip','shoes','Кеды Neon VIP','Эпическая',5,'premium','#c36df7','neonboots'],
 ['shoes-sakura','shoes','Кроссовки Sakura','Эпическая',7,'premium','#e887c0','sneakers'],
 ['shoes-starlight','shoes','Ботинки Starlight','Легендарная',12,'premium','#b6b7ee','goldboots'],
 ['shoes-phoenix','shoes','Ботинки Phoenix','Легендарная',15,'premium','#f47a34','goldboots'],
 // Accessories
 ['glasses-gold','accessory','Очки Gold','Редкая',45000,'coin','#f6cb62','glasses'],
 ['glasses-cyan','accessory','Очки Cyber','Эпическая',135000,'coin','#5be4ed','glasses'],
 ['phones-red','accessory','Наушники Flame','Эпическая',180000,'coin','#eb7256','headphones'],
 ['phones-diamond','accessory','Наушники Diamond','Легендарная',780000,'coin','#88e4f4','headphones'],
 ['chain-silver','accessory','Цепь STREET (серебряная)','Редкая',90000,'coin','#c1c7e1','chain'],
 ['chain-diamond','accessory','Цепь Diamond','Легендарная',950000,'coin','#80d9ed','chain'],
 ['chain-emperor','accessory','Цепь Императора','Мифическая',3000000,'coin','#e0a92a','chain'],
 ['glasses-legend','accessory','Очки Legendary','Мифическая',2100000,'coin','#aa7dff','glasses'],
 ['glasses-vip','accessory','Очки VIP','Эпическая',4,'premium','#bba1f0','glasses'],
 ['phones-holo','accessory','Наушники Holo','Эпическая',8,'premium','#df7ff2','headphones'],
 ['chain-royal-vip','accessory','Цепь Royal','Легендарная',12,'premium','#f6c85d','chain'],
 ['glasses-phoenix','accessory','Очки Phoenix','Легендарная',10,'premium','#ff895a','glasses']
].map(([id,type,name,rarity,price,payment,color,style])=>({id,type,name,rarity,price,payment,color,style}));
LC33_GOODS.push(...LC35_NEW_ITEMS);
// Lower the advertised VK Vote prices for existing wardrobe items; other paid products stay unchanged.
const LC35_OLD_PRICES={kitty:8,crown:19,cowboy:9,goldcoat:12,royalpants:10,goldboots:15,chain:9};
for(const g of LC33_GOODS)if(Object.prototype.hasOwnProperty.call(LC35_OLD_PRICES,g.id))g.price=LC35_OLD_PRICES[g.id];
const LC35_BY_ID=new Map(LC33_GOODS.map(g=>[g.id,g]));

let lc33Category='hat',lc33Subtab='wardrobe',lc33Selected='cap',lc35Filter='all',lc39Preview=null;
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
 const color=g?.color||'#bd6dff',t=g?.type||'hat',id=g?.style||g?.id||'cap';
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
 if(t==='accessory')shape='<path d="M21 17 Q40 -3 59 17" fill="none" stroke="#f9ce63" stroke-width="7"/><rect x="8" y="22" width="22" height="38" rx="10" fill="'+color+'" '+base+'/><rect x="50" y="22" width="22" height="38" rx="10" fill="'+color+'" '+base+'/><rect x="13" y="28" width="12" height="25" rx="6" fill="#65429a"/><rect x="55" y="28" width="12" height="25" rx="6" fill="#65429a"/>';
 if(id==='glasses')shape='<rect x="7" y="29" width="29" height="24" rx="7" fill="#372569" stroke="#dcc1ff" stroke-width="3"/><rect x="44" y="29" width="29" height="24" rx="7" fill="#372569" stroke="#dcc1ff" stroke-width="3"/><path d="M36 35 Q40 30 44 35" stroke="'+color+'" fill="none" stroke-width="4"/><path d="M11 33 L31 47 M48 33 L67 47" stroke="#e9d4ff" opacity=".5"/>';
 if(id==='chain')shape='<path d="M16 15 Q15 60 40 65 Q65 60 64 15" fill="none" stroke="#f7ce68" stroke-width="8"/><path d="M16 15 Q15 60 40 65 Q65 60 64 15" fill="none" stroke="#fff1a6" stroke-width="2" stroke-dasharray="4 6"/><path d="M34 48 L40 40 46 48 40 60Z" fill="#f4bb45" stroke="#fff0ac" stroke-width="2"/>';
 return '<svg viewBox="0 0 80 80" aria-hidden="true"><defs><linearGradient id="lc33fabric" x2="1" y2="1"><stop stop-color="'+color+'"/><stop offset=".5" stop-color="#524184"/><stop offset="1" stop-color="'+color+'"/></linearGradient><linearGradient id="lc33gold" x2="1" y2="1"><stop stop-color="#fff0a5"/><stop offset=".45" stop-color="#f6b72d"/><stop offset="1" stop-color="#ae601a"/></linearGradient><linearGradient id="lc33purple" x2="1" y2="1"><stop stop-color="#e69cff"/><stop offset="1" stop-color="#6a23d5"/></linearGradient></defs>'+shape+'</svg>';
}
function lc33AvatarFallback(override){
 const c=lc33State(),chosen=override||c.equipped,get=type=>LC33_GOODS.find(x=>x.id===chosen[type]);
 const hat=get('hat'),jacket=get('jacket'),pants=get('pants'),shoes=get('shoes'),acc=get('accessory');
 const h=hat?.color||'#191934',j=jacket?.color||'#181a39',p=pants?.color||'#25223c',s=shoes?.color||'#fff3e9',a=acc?.color||'#ffc045';
 const hatId=hat?.style||hat?.id||'cap',accId=acc?.style||acc?.id||'headphones';
 const crown=['crown','horns'].includes(hatId),beanie=hatId==='beanie',cowboy=hatId==='cowboy',kitty=hatId==='kitty',cylinder=hatId==='cylinder',bucket=hatId==='bucket';
 const svg=[];
 svg.push('<svg viewBox="0 0 280 405" role="img" aria-label="Персонаж Lucky City в выбранной одежде"><defs>'+
 '<linearGradient id="lc33skin" x1="0" y1="0" x2=".95" y2="1"><stop stop-color="#fff1d0"/><stop offset=".48" stop-color="#efb18e"/><stop offset="1" stop-color="#bb6d71"/></linearGradient>'+
 '<linearGradient id="lc33skinShadow" x2="1" y2="1"><stop stop-color="#f3b89d"/><stop offset="1" stop-color="#b16b77"/></linearGradient>'+
 '<linearGradient id="lc33fabricBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+j+'"/><stop offset=".49" stop-color="#312044"/><stop offset="1" stop-color="'+j+'"/></linearGradient>'+
 '<linearGradient id="lc33pantBody" x2="1" y2="1"><stop stop-color="'+p+'"/><stop offset=".65" stop-color="#21162f"/><stop offset="1" stop-color="'+p+'"/></linearGradient>'+
 '<linearGradient id="lc33metal" x2="1" y2="1"><stop stop-color="#fff4c3"/><stop offset=".5" stop-color="#f2b53c"/><stop offset="1" stop-color="#9c502a"/></linearGradient>'+
 '<linearGradient id="lc33shoe" x2="1" y2="1"><stop stop-color="'+s+'"/><stop offset=".6" stop-color="#d2afd1"/><stop offset="1" stop-color="'+s+'"/></linearGradient>'+
 '<filter id="lc33soft"><feGaussianBlur stdDeviation="7"/></filter><filter id="lc33glow"><feGaussianBlur stdDeviation="2"/></filter></defs>');
 // Ground and rear shadow
 svg.push('<ellipse cx="140" cy="386" rx="105" ry="13" fill="#901bf0" opacity=".55" filter="url(#lc33soft)"/>'+
 '<path d="M99 248 Q113 245 137 250 L130 335 114 369 71 366 Q89 320 90 288Z M145 249 Q170 244 186 247 L195 321 216 361 166 371 142 309Z" fill="url(#lc33pantBody)" stroke="#120b27" stroke-width="6" stroke-linejoin="round"/>'+
 '<path d="M101 273 L117 279 111 317 96 327 M157 272 L178 278 183 321 M92 345 L118 344 M168 343 L193 344" stroke="#75609c" stroke-width="3" fill="none" opacity=".65"/>'+
 '<path d="M73 357 Q86 338 110 347 L125 375 Q105 395 58 383 Q53 371 73 357Z M164 350 Q184 338 201 351 L223 374 Q211 394 161 384 Q156 367 164 350Z" fill="url(#lc33shoe)" stroke="#1b1534" stroke-width="6" stroke-linejoin="round"/>'+
 '<path d="M57 376 Q85 388 124 374 L124 384 Q95 401 58 386Z M159 377 Q187 391 222 374 L223 384 Q193 403 160 388Z" fill="#201b3a" stroke="#ffce66" stroke-width="3"/>'+
 '<path d="M80 363 L105 359 M78 368 L110 365 M172 361 L201 360 M173 368 L204 365" stroke="#fff5dc" stroke-width="3" stroke-linecap="round"/>');
 // Sleeves/body, layered seam and folds
 svg.push('<path d="M108 153 Q139 140 176 153 Q189 189 190 258 Q152 276 102 262 Q95 217 108 153Z" fill="url(#lc33fabricBody)" stroke="#170c2a" stroke-width="6"/>'+
 '<path d="M111 164 L137 202 159 164 L173 176 149 232 144 258 L119 258 117 226 93 174Z" fill="#efeff8" stroke="#4b3672" stroke-width="3"/>'+
 '<path d="M111 154 L125 194 138 203 122 227 103 265 L94 257 110 210 88 169Z M170 154 L153 197 140 206 153 226 181 264 195 253 168 205 191 170Z" fill="'+j+'" stroke="#100b25" stroke-width="5"/>'+
 '<path d="M108 157 L117 178 132 192 123 200 M170 157 L160 179 145 192 152 201" fill="none" stroke="#ffbd41" stroke-width="5"/>'+
 '<path d="M108 242 Q140 252 178 242" stroke="#ffc25f" stroke-width="3" fill="none"/>'+
 '<path d="M88 169 Q61 171 46 219 L56 264 80 255 81 223 107 187Z M190 168 Q213 170 232 215 L220 266 194 255 198 223 177 189Z" fill="'+j+'" stroke="#170c2a" stroke-width="6" stroke-linejoin="round"/>'+
 '<path d="M66 196 Q54 225 64 244 M211 194 Q226 227 214 246" fill="none" stroke="#dd9bd3" stroke-width="3" opacity=".65"/>'+
 '<path d="M55 250 L83 244 86 265 53 273Z M193 243 L222 248 228 274 195 265Z" fill="#ffc44c" stroke="#392248" stroke-width="3"/>'+
 '<path d="M59 266 Q48 276 52 293 Q63 309 79 294 Q87 279 77 266Z M201 267 Q192 279 198 296 Q216 313 229 295 Q234 279 220 268Z" fill="url(#lc33skin)" stroke="#f8dcba" stroke-width="3"/>');
 // Neck hair face
 svg.push('<path d="M124 140 L160 141 159 170 Q144 181 126 166Z" fill="url(#lc33skinShadow)" stroke="#9d6170" stroke-width="3"/>'+
 '<path d="M92 92 Q79 52 116 40 Q163 18 188 61 Q197 86 183 133 Q169 160 132 159 Q100 151 92 119Z" fill="#20122f" stroke="#160e2e" stroke-width="5"/>'+
 '<path d="M93 101 Q88 69 115 55 Q143 43 166 53 Q190 69 184 104 L178 132 Q160 161 130 153 Q103 149 94 119Z" fill="url(#lc33skin)" stroke="#5b334c" stroke-width="3"/>'+
 '<path d="M101 86 Q104 62 131 62 Q155 60 180 85 Q171 81 168 75 Q150 91 130 92 Q119 84 101 86Z" fill="#261c37"/>'+
 '<path d="M100 99 Q111 91 122 97 M145 97 Q157 90 169 96" stroke="#35213c" stroke-width="5" fill="none" stroke-linecap="round"/>'+
 '<path d="M106 109 Q117 106 125 111 M146 110 Q155 105 166 109" stroke="#fff8ef" stroke-width="5" fill="none" stroke-linecap="round"/>'+
 '<ellipse cx="118" cy="111" rx="4.5" ry="5.5" fill="#39a5ef"/><ellipse cx="157" cy="110" rx="4.5" ry="5.5" fill="#39a5ef"/>'+
 '<circle cx="119" cy="109" r="1.7" fill="#f1ffff"/><circle cx="158" cy="109" r="1.7" fill="#fff"/>'+
 '<path d="M138 110 L134 124 L143 125" fill="none" stroke="#ab6e70" stroke-width="2.4" stroke-linecap="round"/>'+
 '<path d="M125 138 Q139 144 153 132" fill="none" stroke="#964c60" stroke-width="3.5" stroke-linecap="round"/>'+
 '<path d="M103 127 L110 132 M168 126 L176 120" stroke="#fb8e92" stroke-width="2" opacity=".7"/>');
 // Lucky City 38: hand-drawn facial features and balanced warm skin shading.
 svg.push(
 '<path d="M97 101 Q88 96 87 111 Q88 126 101 127 M180 101 Q193 96 192 111 Q192 124 180 126" fill="url(#lc33skin)" stroke="#9b6178" stroke-width="2.4"/>'+
 '<path d="M104 123 Q110 130 117 129 M160 128 Q170 128 174 122" stroke="#fa9e97" opacity=".38" fill="none" stroke-width="3"/>'+
 '<path d="M107 88 Q116 85 127 90 M147 91 Q158 86 169 90" stroke="#27172d" fill="none" stroke-width="3" stroke-linecap="round"/>'+
 '<path d="M113 115 Q118 116 123 115 M153 115 Q158 116 164 114" fill="none" stroke="#724257" opacity=".53" stroke-width="1.4"/>'+
 '<path d="M130 148 Q139 152 150 147" fill="none" stroke="#ffdec0" opacity=".6" stroke-width="1.5"/>'+
 '<path d="M101 94 Q104 80 111 75" stroke="#fff3d5" stroke-width="2" fill="none" opacity=".22"/>'+
 '<path d="M180 94 Q181 106 178 117" stroke="#8b4c65" stroke-width="2" fill="none" opacity=".23"/>'+
 '<path d="M134 127 Q138 130 142 128" fill="none" stroke="#ffd2b8" opacity=".56" stroke-width="1.4"/>');
 // 41.0 facial drawing: cheek planes, sculpted jaw, brows and iris glints.
// Draw before the fringe and worn headgear so face remains readable on iOS.
 svg.push(
 '<path d="M98 110 Q89 97 87 111 Q87 122 100 129 M181 109 Q191 99 192 113 Q192 124 179 129" fill="url(#lc33skin)" stroke="#9d6874" stroke-width="2.4"/>'+
 '<path d="M103 124 Q113 139 128 143 M173 122 Q165 139 151 143" fill="none" stroke="#f4a18c" stroke-width="2.3" opacity=".48"/>'+
 '<path d="M108 102 Q117 97 125 103 M146 103 Q155 97 165 102" fill="none" stroke="#2b1f36" stroke-width="2" opacity=".7"/>'+
 '<path d="M108 118 Q115 124 124 119 M149 120 Q159 125 168 118" fill="none" stroke="#aa7275" stroke-width="1.6" opacity=".43"/>'+
 '<path d="M131 133 Q137 137 145 133" fill="none" stroke="#d18a7f" stroke-width="1.5" opacity=".62"/>'+
 '<path d="M126 146 Q138 149 150 143" fill="none" stroke="#fff1d9" stroke-width="1.4" opacity=".46"/>'+
 '<circle cx="116" cy="107" r="2" fill="#ffffff" opacity=".86"/><circle cx="155" cy="106" r="2" fill="#ffffff" opacity=".86"/>'+
 '<path d="M100 96 Q102 85 111 81" fill="none" stroke="#fff0d8" stroke-width="2.4" opacity=".26"/>'+
 '<path d="M177 98 Q177 111 172 120" fill="none" stroke="#8b4e67" stroke-width="2" opacity=".30"/>');
 // Hair fringe after face, no silly helmet
 svg.push('<path d="M96 91 Q81 74 93 57 Q107 36 142 40 Q168 39 185 57 Q196 79 185 96 L171 83 Q160 64 150 66 Q134 88 110 94 L110 82Z" fill="#211632" stroke="#0f0b23" stroke-width="3"/>'+
 '<path d="M109 67 Q125 49 144 55 M149 52 Q173 53 178 70" stroke="#554164" stroke-width="4" fill="none" stroke-linecap="round"/>');
 let headwear='';
 if(crown)headwear='<path d="M95 75 L84 34 106 48 137 19 163 49 191 33 181 76Z" fill="url(#lc33metal)" stroke="#fff0a4" stroke-width="5"/><circle cx="139" cy="55" r="7" fill="#ae58fc" stroke="#fff" stroke-width="2"/><path d="M94 74 Q136 83 185 74" fill="none" stroke="#b7783b" stroke-width="9"/>';
 else if(kitty)headwear='<path d="M94 85 L93 45 112 58 143 41 164 57 181 43 182 85Z" fill="'+h+'" stroke="#f7b8fe" stroke-width="5"/><circle cx="87" cy="99" r="17" fill="#bb6bfc" stroke="#e9bbff" stroke-width="5"/><circle cx="194" cy="99" r="17" fill="#bb6bfc" stroke="#e9bbff" stroke-width="5"/>';
 else if(cylinder)headwear='<path d="M111 15 H175 L171 72 H113Z" fill="'+h+'" stroke="#eee0ff" stroke-width="4"/><ellipse cx="142" cy="77" rx="66" ry="12" fill="'+h+'" stroke="#e8ccff" stroke-width="4"/><path d="M114 60 L171 60" stroke="#d9a84d" stroke-width="8"/>';
 else if(cowboy)headwear='<path d="M107 83 Q112 27 139 29 Q166 30 174 83Z" fill="'+h+'" stroke="#f8baff" stroke-width="4"/><path d="M74 89 Q121 111 207 82 Q192 107 159 100 Q136 90 111 105 Q87 108 74 89Z" fill="'+h+'" stroke="#eea0ff" stroke-width="4"/>';
 else if(beanie)headwear='<path d="M97 90 Q88 36 134 31 Q176 24 187 91Z" fill="'+h+'" stroke="#d4b4f3" stroke-width="4"/><path d="M95 85 Q136 79 187 84 L185 104 Q132 110 96 103Z" fill="#524467" stroke="#f4d6ff" stroke-width="3"/><path d="M115 46 L114 85 M133 37 L135 83 M153 39 L155 82 M173 52 L174 85" stroke="#a79bc8" stroke-width="2"/>';
 else if(bucket)headwear='<path d="M110 39 Q139 30 174 40 L181 90 L101 90Z" fill="'+h+'" stroke="#c6d9ff" stroke-width="4"/><ellipse cx="139" cy="91" rx="58" ry="12" fill="'+h+'" stroke="#d6c8ff" stroke-width="3"/><circle cx="143" cy="66" r="9" fill="#ffd66b"/>';
 else headwear='<path d="M96 84 Q98 39 137 35 Q174 32 184 78 L181 91 L93 91Z" fill="'+h+'" stroke="#0e0c22" stroke-width="5"/>'+
 '<path d="M97 78 Q140 71 193 88 Q164 104 95 94Z" fill="'+h+'" stroke="#1c1237" stroke-width="4"/>'+
 '<path d="M124 69 L130 73 137 62 145 73 152 69 L148 77 H127Z" fill="url(#lc33metal)"/>';
 svg.push(headwear);
 if(accId==='headphones')svg.push('<path d="M99 90 Q95 52 138 52 Q186 50 190 95" fill="none" stroke="'+a+'" stroke-width="9"/><path d="M102 86 L102 123 M185 86 L185 123" stroke="#e9a83f" stroke-width="12" stroke-linecap="round"/><rect x="92" y="93" width="19" height="34" rx="8" fill="'+a+'" stroke="#ffead0" stroke-width="3"/><rect x="177" y="93" width="19" height="34" rx="8" fill="'+a+'" stroke="#ffead0" stroke-width="3"/>');
 if(accId==='glasses')svg.push('<rect x="100" y="100" width="31" height="22" rx="7" fill="#513c92aa" stroke="'+a+'" stroke-width="3"/><rect x="145" y="100" width="31" height="22" rx="7" fill="#513c92aa" stroke="'+a+'" stroke-width="3"/><path d="M131 105 Q138 100 145 105" fill="none" stroke="'+a+'" stroke-width="4"/>');
 if(accId==='chain')svg.push('<path d="M119 162 Q137 201 161 163" fill="none" stroke="'+a+'" stroke-width="6"/><path d="M135 185 L140 178 146 185 140 193Z" fill="url(#lc33metal)"/>');

 // Fine wardrobe detail is painted as a separate, lightweight overlay; no economy changes.
 const jacketId=jacket?.style||jacket?.id||'varsity',pantId=pants?.style||pants?.id||'jeans',shoeId=shoes?.style||shoes?.id||'sneakers';
 if(jacketId==='varsity')svg.push(
 '<path d="M99 177 L80 200 L76 215 M178 178 L199 200 L202 213" stroke="#f6b74f" stroke-width="6" fill="none" stroke-linecap="round"/>'+
 '<path d="M99 237 L118 241 M162 241 L179 237" stroke="#ffe09c" stroke-width="2" opacity=".65"/>'+
 '<path d="M117 238 L117 253 M162 238 L162 253" stroke="#b17aa1" stroke-width="2"/>');
 if(jacketId==='hoodie')svg.push(
 '<path d="M109 154 Q138 181 172 154 Q168 173 153 186 L125 186 Q110 175 109 154Z" fill="#321054" stroke="#d28fff" stroke-width="3"/>'+
 '<path d="M127 185 L123 222 M152 183 L156 222" stroke="#f0bcff" stroke-width="3"/>'+
 '<path d="M116 234 Q141 248 165 233" fill="none" stroke="#9447d4" stroke-width="4"/>');
 if(jacketId==='goldcoat')svg.push(
 '<path d="M101 177 L115 190 120 216 L112 239 M178 178 L165 190 159 215 L169 238" fill="none" stroke="#fff0a0" stroke-width="5"/>'+
 '<path d="M120 248 Q141 253 164 248" stroke="#ffda66" fill="none" stroke-width="4"/>'+
 '<path d="M79 224 L87 224 M198 224 L206 224" stroke="#ffebae" stroke-width="5"/>');
 if(pantId==='cargo')svg.push(
 '<path d="M89 297 L111 303 L111 326 L88 326Z M161 299 L186 295 L187 324 L163 327Z" fill="#34244f" stroke="#b699e2" stroke-width="2"/>'+
 '<path d="M90 309 H110 M164 308 H186" stroke="#e8c279" stroke-width="3"/>'+
 '<path d="M98 326 L98 347 M175 325 L179 345" stroke="#8573a6" stroke-width="2"/>');
 if(pantId==='royalpants')svg.push(
 '<path d="M101 270 L93 339 M164 269 L186 340" stroke="#ddb1ff" stroke-width="4" opacity=".9"/>'+
 '<path d="M98 320 L117 323 M168 323 L186 319" stroke="#f6c877" stroke-width="3"/>'+
 '<path d="M109 296 L112 305 M173 297 L177 306" stroke="#af70ed" stroke-width="3"/>');
 if(shoeId==='neonboots')svg.push(
 '<path d="M62 375 Q90 386 122 376 M163 375 Q188 387 220 375" stroke="#24eeff" stroke-width="5" fill="none" filter="url(#lc33glow)"/>'+
 '<path d="M70 357 L111 355 M171 357 L202 359" stroke="#74efff" stroke-width="3"/>');
 if(shoeId==='goldboots')svg.push(
 '<path d="M61 377 Q93 391 123 378 M161 378 Q188 391 223 378" stroke="#ffe09b" stroke-width="6" fill="none"/>'+
 '<path d="M75 352 L108 349 M169 351 L200 355" stroke="#ffc848" stroke-width="6"/>'+
 '<path d="M90 345 L97 352 104 343 M179 344 L186 352 193 345" fill="none" stroke="#fef5bf" stroke-width="2"/>');
 // Highlights on fabric and face: specular illumination from the purple showroom.
 svg.push('<path d="M100 114 Q104 135 118 143" fill="none" stroke="#fff3d9" stroke-width="2" opacity=".29"/>'+
 '<path d="M175 113 Q172 128 162 139" fill="none" stroke="#733456" stroke-width="2" opacity=".28"/>'+
 '<path d="M89 191 Q83 215 78 240 M193 192 Q200 217 203 239" fill="none" stroke="#eb8cff" stroke-width="2" opacity=".35"/>'+
 '<circle cx="136" cy="53" r="1.7" fill="#ffffff" opacity=".35"/>');

 svg.push('</svg>');return svg.join('');
}
/* Lucky City 36: distinct collectible art — fully inline, Safari-friendly.
   Each piece gets its own drawn motif; special collections have different silhouettes. */
function lc36Theme(g){
 const id=g?.id||'';
 if(/diamond|ice|frost|holo|cyber/.test(id))return 'crystal';
 if(/flame|fire|phoenix|sunset|toxic/.test(id))return 'flame';
 if(/cosmos|galaxy|star|lunar|night|midnight|abyss/.test(id))return 'space';
 if(/royal|king|crown|emperor|gold|legend/.test(id))return 'royal';
 if(/sakura|rose|pink|forest|emerald/.test(id))return 'nature';
 if(/noir|black|shadow/.test(id))return 'shadow';
 if(/neon|vip/.test(id))return 'neon';
 return 'street';
}
function lc36Accent(g){
 const theme=lc36Theme(g),id=g?.id||'';
 const ink=({crystal:'#b8f9ff',flame:'#ffbd62',space:'#d5bbff',royal:'#ffe394',
  nature:'#ffd7e8',shadow:'#a29cbd',neon:'#a9faff',street:'#f0d2ff'})[theme];
 let motif='';
 if(theme==='crystal')motif='<path d="M40 19 L50 30 45 48 35 48 30 30Z" fill="'+ink+'" stroke="#fff" stroke-width="1.5"/><path d="M40 19 V47 M30 30 H50" fill="none" stroke="#68bce5" stroke-width="1"/><circle cx="57" cy="21" r="3" fill="#fff"/><path d="M56 11 V16 M56 26 V31 M46 21 H51 M61 21 H66" stroke="'+ink+'" stroke-width="2"/>';
 if(theme==='flame')motif='<path d="M40 12 Q53 26 48 38 Q62 26 57 45 Q52 59 40 60 Q23 54 26 39 Q30 31 31 25 Q37 33 40 12Z" fill="'+ink+'" stroke="#ff5e56" stroke-width="1.5"/><path d="M42 34 Q49 48 40 55 Q32 51 37 43Z" fill="#fff4bd"/>';
 if(theme==='space')motif='<path d="M40 21 L44 32 56 33 47 41 50 53 40 47 30 53 33 41 24 33 36 32Z" fill="'+ink+'" stroke="#fff" stroke-width="1.2"/><circle cx="55" cy="19" r="3" fill="#b5e5ff"/><circle cx="25" cy="22" r="2" fill="#fff"/><path d="M18 49 L23 44 M57 54 L64 47" stroke="#e7c8ff" stroke-width="2"/>';
 if(theme==='royal')motif='<path d="M25 48 L23 27 32 36 40 21 49 36 58 27 56 48Z" fill="'+ink+'" stroke="#e4a950" stroke-width="1.8"/><rect x="24" y="46" width="33" height="7" rx="2" fill="#d6a350"/><circle cx="40" cy="39" r="3.5" fill="#9a62e8"/>';
 if(theme==='nature')motif='<path d="M39 49 Q22 39 25 27 Q38 27 40 41 Q41 27 56 25 Q59 42 39 49Z" fill="'+ink+'" stroke="#9c5494" stroke-width="1.4"/><circle cx="41" cy="33" r="5" fill="#fff1ad"/><path d="M40 49 V58" stroke="#ffe6c0" stroke-width="2"/>';
 if(theme==='shadow')motif='<path d="M40 17 L56 25 L52 49 L40 59 L27 49 L24 25Z" fill="#332840" stroke="'+ink+'" stroke-width="2"/><path d="M30 38 L38 43 49 32" fill="none" stroke="'+ink+'" stroke-width="3"/>';
 if(theme==='neon')motif='<path d="M28 23 L47 23 39 38 53 38 30 60 35 44 24 44Z" fill="'+ink+'" stroke="#fff" stroke-width="1.5"/>';
 if(theme==='street')motif='<path d="M25 33 L40 24 55 33 40 42Z" fill="'+ink+'" stroke="#fff" stroke-width="1.2"/><path d="M28 46 H52 M32 52 H48" stroke="'+ink+'" stroke-width="3"/>';
 // Important: vary silhouette as well as pattern in the shop, not just tint the same icon.
 let body='';
 if(g.type==='hat'){
  const fam=g.style||g.id;
  if(fam==='cap'&&/diamond|vip|flame/.test(id))body='<path d="M10 41 Q13 10 41 9 Q71 11 70 45 Q40 54 10 45Z" fill="'+g.color+'" stroke="#fcddff" stroke-width="3"/><path d="M18 43 Q44 34 78 47 Q55 60 10 50Z" fill="#24123c" stroke="'+ink+'" stroke-width="3"/>';
  else if(fam==='beanie'&&/star|night/.test(id))body='<path d="M17 51 Q12 13 40 12 Q66 13 65 49Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><path d="M13 45 H70 L67 60 H14Z" fill="#241a42" stroke="#e9ceff" stroke-width="3"/>';
  else if(fam==='crown'&&/obsidian/.test(id))body='<path d="M12 54 L10 13 27 36 40 6 54 36 70 13 68 54Z" fill="#201636" stroke="#9f88ff" stroke-width="3"/>';
  if(body)motif='<g transform="translate(0 0)">'+body+'</g><g transform="translate(21 6) scale(.46)">'+motif+'</g>';
  else motif='<g transform="translate(24 22) scale(.40)">'+motif+'</g>';
 }else if(g.type==='jacket'){
  if(/coat-|goldcoat|phoenix/.test(id))body='<path d="M21 18 L32 9 40 21 48 9 60 18 73 30 64 72 56 61 62 79 18 79 24 60 15 71 7 31Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><path d="M33 18 L40 40 47 18 M40 40 V75" fill="none" stroke="#ffdd8a" stroke-width="3"/>';
  else if(/hoodie/.test(id))body='<path d="M25 17 Q40 3 55 17 L65 26 74 69 60 73 56 59 56 77 H24 V59 L20 73 6 69 15 26Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="2.5"/><path d="M26 18 Q40 42 54 18" fill="none" stroke="#cdb6ff" stroke-width="4"/>';
  else if(/jacket-/.test(id))body='<path d="M20 15 L33 6 40 20 49 6 61 15 72 27 69 65 55 60 55 75 H25 V60 L11 65 8 27Z" fill="'+g.color+'" stroke="#d7a6ff" stroke-width="3"/><path d="M40 19 V75" stroke="'+ink+'" stroke-width="4"/>';
  motif=body+'<g transform="translate(25 25) scale(.38)">'+motif+'</g>';
 }else if(g.type==='pants'){
  if(/cargo/.test(id))body='<path d="M20 8 H60 L68 73 H45 L41 42 36 73 H13Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="2.5"/><rect x="13" y="42" width="20" height="17" rx="2" fill="#302648" stroke="#edc5ff"/><rect x="47" y="42" width="20" height="17" rx="2" fill="#302648" stroke="#edc5ff"/>';
  else if(/royal|emperor|goldline/.test(id))body='<path d="M20 8 H60 L67 74 H45 L40 42 35 74 H13Z" fill="'+g.color+'" stroke="#ffdc87" stroke-width="3"/><path d="M28 17 L25 68 M52 17 L56 68" stroke="#fff0b6" stroke-width="3"/>';
  motif=body+'<g transform="translate(25 16) scale(.37)">'+motif+'</g>';
 }else if(g.type==='shoes'){
  if(/boots|emperor|royal/.test(id))body='<path d="M20 10 H52 L53 42 68 49 Q76 60 67 68 H12 L10 54 21 47Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><path d="M15 62 H69" stroke="#fff1b3" stroke-width="4"/>';
  if(/sneakers|shoes-rose|shoes-black/.test(id))body='<path d="M10 42 L25 29 37 43 67 47 Q75 52 72 64 H7Z" fill="'+g.color+'" stroke="'+ink+'" stroke-width="2.8"/><path d="M26 41 L42 48 M23 47 L39 52" stroke="#fff" stroke-width="2.5"/>';
  motif=body+'<g transform="translate(34 34) scale(.27)">'+motif+'</g>';
 }else if(g.type==='accessory'){
  if(/chain/.test(id))body='<path d="M17 13 Q16 62 40 65 Q67 62 63 13" fill="none" stroke="'+ink+'" stroke-width="8"/>';
  else if(/glasses/.test(id))body='<rect x="7" y="25" width="29" height="27" rx="6" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><rect x="45" y="25" width="29" height="27" rx="6" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><path d="M36 31 Q40 26 45 31" fill="none" stroke="'+ink+'" stroke-width="3"/>';
  else if(/phones/.test(id))body='<path d="M18 25 Q40 -2 63 25" fill="none" stroke="'+ink+'" stroke-width="8"/><rect x="7" y="24" width="22" height="34" rx="9" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/><rect x="52" y="24" width="21" height="34" rx="9" fill="'+g.color+'" stroke="'+ink+'" stroke-width="3"/>';
  motif=body+'<g transform="translate(28 31) scale(.31)">'+motif+'</g>';
 }
 return '<g class="lc36-details">'+motif+'</g>';
}
function lc36ItemIcon(g){
 const base=lc33SvgItem(g);
 return base.replace('</svg>',lc36Accent(g)+'</svg>');
}
function lc36AvatarMark(g){
 if(!g)return '';
 const theme=lc36Theme(g),col=({crystal:'#d5ffff',flame:'#ffbc61',space:'#bca4ff',royal:'#ffdf7c',nature:'#ffd1e4',shadow:'#a09ab3',neon:'#7df8ff',street:'#e7bfff'})[theme];
 if(g.type==='hat')return '<g opacity=".95"><path d="M128 66 L139 58 150 66 139 76Z" fill="'+col+'" stroke="#fff" stroke-width="1.5"/></g>';
 if(g.type==='jacket'){
  let pieces='<path d="M103 203 L112 215 L106 228 M174 203 L166 216 L175 227" fill="none" stroke="'+col+'" stroke-width="3.5"/>';
  if(/coat-|phoenix/.test(g.id))pieces+='<path d="M96 245 L75 321 110 300 139 255 166 300 201 322 184 244" fill="'+g.color+'" stroke="'+col+'" stroke-width="4"/><path d="M101 252 L84 306 M178 252 L195 309" stroke="#fff1c0" stroke-width="2"/>';
  if(/hoodie/.test(g.id))pieces+='<path d="M108 150 Q139 178 173 150 L164 177 148 192 129 192 113 176Z" fill="'+g.color+'" stroke="'+col+'" stroke-width="3"/><path d="M129 189 L126 219 M151 190 L153 218" stroke="'+col+'" stroke-width="2.5"/>';
  if(/diamond|cosmos|emperor/.test(g.id))pieces+='<path d="M140 206 L152 220 140 235 129 220Z" fill="'+col+'" stroke="#fff" stroke-width="2"/>';
  return '<g>'+pieces+'</g>';
 }
 if(g.type==='pants'){
  let mark='<path d="M97 277 L108 291 M171 280 L180 294" stroke="'+col+'" stroke-width="3" fill="none"/>';
  if(/cargo/.test(g.id))mark+='<path d="M86 293 L115 301 112 328 H86Z M165 300 L190 292 192 327 165 328Z" fill="'+g.color+'" stroke="'+col+'" stroke-width="2.5"/><path d="M90 312 H110 M169 312 H187" stroke="#fff" stroke-width="2"/>';
  if(/royal|emperor|goldline/.test(g.id))mark+='<path d="M105 267 L96 342 M164 268 L184 341" stroke="'+col+'" stroke-width="4"/>';
  return mark;
 }
 if(g.type==='shoes'){
  let mark='<path d="M66 380 Q92 390 122 380 M162 380 Q190 390 221 380" fill="none" stroke="'+col+'" stroke-width="4"/>';
  if(/gold|emperor|royal|diamond/.test(g.id))mark+='<path d="M73 351 L102 348 M171 349 L202 351" stroke="'+col+'" stroke-width="6"/>';
  if(/flame|neon|ice|toxic/.test(g.id))mark+='<path d="M60 375 H121 M162 375 H221" stroke="'+col+'" stroke-width="3"/>';
  return mark;
 }
 if(g.type==='accessory'){
  if(/glasses/.test(g.id))return '<path d="M104 110 H129 M147 110 H174" stroke="'+col+'" stroke-width="4"/>';
  if(/chain/.test(g.id))return '<path d="M120 163 Q139 196 161 164" fill="none" stroke="'+col+'" stroke-width="5"/><circle cx="140" cy="185" r="6" fill="'+col+'"/>';
  return '<path d="M93 103 L95 119 M186 103 L184 119" stroke="'+col+'" stroke-width="3"/>';
 }
 return '';
}


/* 37.0. Distinct wearable construction, drawn on the full-sized avatar.
   Everything stays in one inline SVG (no external <use> or remote assets on iOS). */
function lc37Shape(g) {
 if(!g) return '';
 const id=g.id, c=g.color, theme=lc36Theme(g);
 const highlight={crystal:'#d5fcff',flame:'#ffd080',space:'#c4aeff',royal:'#ffe5a1',nature:'#ffd8e7',shadow:'#aa91c0',neon:'#8bf8ff',street:'#d8c0fb'}[theme];
 const dark='#21152c';
 if(g.type==='jacket') {
  if(/coat-|emperor/.test(id))return [
   '<g class="lc37-coat">',
   // Long split coat and raised shoulder silhouette.
   '<path d="M98 180 Q75 164 65 187 L81 215 68 290 54 346 111 316 132 257 149 263 178 319 231 345 208 284 191 215 209 186 Q195 168 179 179 L160 204 140 236 117 203Z" fill="'+c+'" stroke="'+dark+'" stroke-width="5" stroke-linejoin="round"/>',
   '<path d="M102 179 L124 214 139 246 151 215 179 178 170 216 140 253 115 217Z" fill="#281d3e" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M72 286 Q88 301 113 291 M173 291 Q197 306 212 289 M60 340 L102 314 M183 315 L226 342" fill="none" stroke="'+highlight+'" stroke-width="4" opacity=".82"/>',
   '<path d="M83 187 L96 171 116 191 107 217Z M165 191 L182 172 198 187 174 219Z" fill="'+highlight+'" opacity=".8"/>',
   '<circle cx="139" cy="235" r="6" fill="'+highlight+'" stroke="#fff4c6" stroke-width="2"/>',
   '</g>'
  ].join('');
  if(/hoodie/.test(id))return [
   '<g class="lc37-hoodie">',
   '<path d="M108 161 Q94 146 100 125 Q109 147 127 151 L156 151 Q173 145 180 126 Q186 147 173 161 L163 183 146 195 125 190Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="4"/>',
   '<path d="M108 161 Q139 183 173 160 L160 182 Q141 194 126 181Z" fill="#251539" stroke="'+highlight+'" stroke-width="2"/>',
   '<path d="M124 180 L120 228 M153 179 L157 228" fill="none" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M110 237 Q142 247 170 238 L167 263 115 263Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M124 240 V252 M154 240 V252" stroke="'+highlight+'" stroke-width="2"/>',
   '</g>'
  ].join('');
  // Bomber: puffy shoulders, knitted cuffs, shorter fitted waist.
  return [
   '<g class="lc37-bomber">',
   '<path d="M98 176 Q72 172 59 195 Q48 223 57 245 L83 242 102 199Z M184 175 Q213 169 221 194 Q236 227 225 247 L196 240 180 199Z" fill="'+c+'" stroke="'+dark+'" stroke-width="5"/>',
   '<path d="M101 173 L118 191 139 207 161 188 182 171 179 230 Q143 248 102 229Z" fill="'+c+'" stroke="'+dark+'" stroke-width="5"/>',
   '<path d="M101 230 Q141 243 180 230 L180 256 Q139 270 102 257Z" fill="#27183b" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M116 190 L139 207 163 188 M139 207 V255" fill="none" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M60 228 L85 229 81 250 57 251 M196 229 L223 228 229 250 198 251" fill="'+highlight+'" opacity=".8"/>',
   '<path d="M111 214 H123 M155 213 H167" stroke="'+highlight+'" stroke-width="3"/>',
   '</g>'
  ].join('');
 }
 if(g.type==='pants'){
  if(/cargo/.test(id))return [
   '<g class="lc37-cargo">',
   '<path d="M85 285 L115 290 116 331 84 333Z M163 289 L192 284 194 331 165 332Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M86 298 H114 M164 299 H192 M87 315 H115 M165 316 H193" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M78 266 L84 340 M198 266 L202 341" stroke="'+highlight+'" stroke-width="3" opacity=".65"/>',
   '<path d="M96 327 H112 M176 327 H192" stroke="#151126" stroke-width="4"/>',
   '</g>'
  ].join('');
  if(/royal|emperor|goldline|diamond/.test(id))return [
   '<g class="lc37-tailored">',
   '<path d="M98 264 L87 351 108 363 121 282Z M157 281 L173 362 199 348 183 265Z" fill="'+c+'" opacity=".52"/>',
   '<path d="M98 266 L93 340 M176 265 L192 340" fill="none" stroke="'+highlight+'" stroke-width="5"/>',
   '<path d="M84 341 L112 346 M172 346 L199 341 M104 275 L119 281 M163 281 L181 277" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M139 268 L139 293" stroke="'+highlight+'" stroke-width="4"/>',
   '</g>'
  ].join('');
  return '<g class="lc37-denim"><path d="M91 276 L104 291 117 279 M159 279 L175 290 187 277" stroke="'+highlight+'" stroke-width="3" fill="none"/><path d="M93 317 L111 318 M165 318 L184 316" stroke="'+highlight+'" stroke-width="2"/></g>';
 }
 if(g.type==='shoes'){
  const boots=/boots|emperor|royal|diamond/.test(id);
  if(boots)return [
   '<g class="lc37-boots">',
   '<path d="M70 321 L113 323 114 357 Q124 366 126 380 Q98 394 58 382 Q55 367 70 352Z M165 321 L207 323 207 355 Q222 365 225 380 Q195 394 159 382 Q157 367 165 353Z" fill="'+c+'" stroke="'+dark+'" stroke-width="5"/>',
   '<path d="M70 329 L113 332 M165 332 L207 329 M61 380 Q89 391 123 380 M161 380 Q195 391 221 380" stroke="'+highlight+'" stroke-width="4" fill="none"/>',
   '<path d="M84 345 L109 344 M173 344 L197 345" stroke="#fff0cc" stroke-width="3"/>',
   '</g>'
  ].join('');
  return [
   '<g class="lc37-sneakers">',
   '<path d="M69 350 Q86 341 109 351 L120 372 Q97 387 56 380 Q60 361 69 350Z M166 351 Q188 341 203 353 L223 374 Q194 388 160 381Z" fill="'+c+'" stroke="'+dark+'" stroke-width="5"/>',
   '<path d="M74 356 L104 353 M72 362 L108 361 M170 357 L199 356 M171 362 L201 362" stroke="'+highlight+'" stroke-width="3"/>',
   '<path d="M60 377 Q90 389 120 375 M163 379 Q189 390 220 377" fill="none" stroke="'+highlight+'" stroke-width="5"/>',
   '</g>'
  ].join('');
 }
 if(g.type==='hat'){
  if(/crown|obsidian/.test(id))return [
   '<g class="lc37-crown">',
   '<path d="M93 82 L86 39 111 56 138 17 167 56 194 37 185 84Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="5"/>',
   '<path d="M94 80 Q138 89 187 80" stroke="#33234b" stroke-width="9"/>',
   '<circle cx="138" cy="60" r="9" fill="'+highlight+'" stroke="#fff" stroke-width="2"/>',
   '<circle cx="105" cy="71" r="4" fill="#f9e3c3"/><circle cx="173" cy="72" r="4" fill="#f9e3c3"/>',
   '</g>'
  ].join('');
  if(/bucket|fedora|cowboy/.test(id))return [
   '<g class="lc37-brim">',
   '<path d="M105 45 Q137 32 171 45 L183 86 96 86Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="4"/>',
   '<path d="M72 90 Q140 106 204 88 Q183 110 146 103 Q104 112 72 90Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="4"/>',
   '<path d="M109 74 Q137 81 174 74" stroke="#ffdd8c" stroke-width="5"/>',
   '</g>'
  ].join('');
  if(/beanie/.test(id))return '<path d="M96 90 Q89 36 139 32 Q181 32 187 90 L188 105 Q141 112 96 105Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="4"/><path d="M100 88 H185 M115 54 V84 M138 44 V84 M163 54 V84" fill="none" stroke="'+highlight+'" stroke-width="3"/>';
  return '<g class="lc37-cap"><path d="M94 81 Q98 41 138 36 Q176 35 185 79 L184 91 94 91Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="4"/><path d="M97 85 Q139 75 198 91 Q172 104 97 97Z" fill="'+c+'" stroke="'+highlight+'" stroke-width="3"/><path d="M130 68 L138 62 147 69 138 77Z" fill="'+highlight+'"/></g>';
 }
 if(g.type==='accessory'){
  if(/glasses/.test(id))return [
   '<g class="lc37-glasses">',
   '<rect x="97" y="102" width="35" height="25" rx="6" fill="'+c+'" fill-opacity=".28" stroke="'+highlight+'" stroke-width="4"/>',
   '<rect x="145" y="102" width="35" height="25" rx="6" fill="'+c+'" fill-opacity=".28" stroke="'+highlight+'" stroke-width="4"/>',
   '<path d="M132 107 Q140 102 145 107" stroke="'+highlight+'" stroke-width="3" fill="none"/>',
   '</g>'
  ].join('');
  if(/chain/.test(id))return '<g class="lc37-chain"><path d="M117 162 Q140 208 164 162" fill="none" stroke="'+highlight+'" stroke-width="8"/><path d="M132 190 L140 179 149 191 140 202Z" fill="'+c+'" stroke="#fff6cf" stroke-width="2"/></g>';
  return '<g class="lc37-headphones"><path d="M99 90 Q99 49 140 48 Q186 48 191 91" fill="none" stroke="'+c+'" stroke-width="9"/><rect x="89" y="91" width="21" height="39" rx="9" fill="'+c+'" stroke="'+highlight+'" stroke-width="3"/><rect x="180" y="91" width="20" height="39" rx="9" fill="'+c+'" stroke="'+highlight+'" stroke-width="3"/></g>';
 }
 return '';
}

// Restore reliable inline art for Safari / VK WebView: external SVG <use>
// rendered tiny thumbnails and unresolved gradients on iPhone.
/* Premium VFX are cosmetic-only and based on worn rare items. */
function lc38Aura(items){
 const selected=items.filter(Boolean);
 const hero=selected.find(x=>x.rarity==='Мифическая')||selected.find(x=>x.rarity==='Легендарная');
 if(!hero)return '';
 const theme=lc36Theme(hero);
 const c=({crystal:'#9cf4ff',flame:'#ffb054',space:'#b5a2ff',royal:'#ffe2a0',nature:'#d7a9ef',shadow:'#b5a1c8',neon:'#8af3ee',street:'#eed2ff'})[theme];
 return '<g class="lc38-aura" aria-hidden="true">'+
  '<path d="M51 310 Q14 215 73 131 M226 310 Q264 215 207 131" stroke="'+c+'" stroke-width="2" fill="none" opacity=".46" stroke-dasharray="3 12"/>'+
  '<path d="M43 178 L47 169 51 178 59 182 51 186 47 196 43 186 35 182Z M224 152 L228 143 232 152 239 156 232 160 228 170 224 160 216 156Z" fill="'+c+'" opacity=".88"/>'+
  '<circle cx="48" cy="268" r="2.5" fill="'+c+'"/><circle cx="234" cy="234" r="3" fill="'+c+'"/>'+
  '</g>';
}

/* LUCKY CITY 39: complete themed outfits using existing wardrobe items.
   No new payments, no auto-spend, and no mutation of existing item IDs. */
const LC39_SETS=[
 {id:'street',name:'NEON STREET',description:'Уличный образ как на фото: простая чёрная кепка, тёмный бомбер, карго с фиолетовыми деталями, чёрные кроссовки и серебристая цепь. Все пять предметов — платные коллекционные модели за монеты.',tier:'Редкий',accent:'#ab76ff',
  equipped:{hat:'cap-noir',jacket:'jacket-black',pants:'cargo-violet',shoes:'shoes-black',accessory:'chain-silver'},
  legacyEquipped:{hat:'cap-ice',jacket:'jacket-blue',pants:'cargo-navy',shoes:'shoes-ice',accessory:'glasses-cyan'}},
 {id:'sakura',name:'SAKURA NIGHT',description:'Розовая худи, мягкие оттенки и яркие аксессуары.',tier:'Эпический',accent:'#ff91d5',
  equipped:{hat:'beanie-rose',jacket:'hoodie-rose',pants:'pants-white',shoes:'shoes-rose',accessory:'chain-silver'}},
 {id:'phantom',name:'DARK PHANTOM',description:'Тёмный силуэт, закрытая шляпа и карго Abyss.',tier:'Мифический',accent:'#a9a4ff',
  equipped:{hat:'fedora-shadow',jacket:'jacket-black',pants:'cargo-abyss',shoes:'shoes-black',accessory:'glasses-legend'}},
 {id:'emperor',name:'GOLDEN EMPEROR',description:'Золотая корона, длинный плащ и императорские ботинки.',tier:'Мифический',accent:'#ffd075',
  equipped:{hat:'crown-obsidian',jacket:'coat-emperor',pants:'pants-emperor',shoes:'shoes-emperor',accessory:'chain-emperor'}},
 {id:'galaxy',name:'COSMIC LEGEND',description:'Космическая худи, редкие брюки и ледяная обувь.',tier:'Мифический',accent:'#b5a1ff',
  equipped:{hat:'beanie-night',jacket:'hoodie-cosmos',pants:'pants-galaxy',shoes:'shoes-diamond',accessory:'phones-diamond'}}
];
function lc39GetSet(id){return LC39_SETS.find(x=>x.id===id)||null;}
/* Preserve players who already completed the original 48-50 NEON STREET. */
function lc503LegacyComplete(set,c=lc33State()){
 return !!set.legacyEquipped&&Object.values(set.legacyEquipped).every(id=>c.owned.includes(id));
}
function lc503Matches(gear,equipped){
 return Object.entries(gear).every(([key,id])=>equipped[key]===id);
}
function lc39Missing(set,c=lc33State()){
 return lc503LegacyComplete(set,c)?[]:Object.values(set.equipped).filter(id=>!c.owned.includes(id));
}
function lc39CurrentEquipped(){return lc39Preview?.equipped||lc33State().equipped;}
function lc39IsWearing(set,c=lc33State()){
 return lc503Matches(set.equipped,c.equipped)||(!!set.legacyEquipped&&lc503Matches(set.legacyEquipped,c.equipped));
}
/* 50.0: bundle offers use the existing item catalogue and owned IDs.
   Premium items are NEVER granted through a coin bundle. */
function lc50SetOffer(set,c=lc33State()){
 const missing=lc39Missing(set,c);
 const coinItems=missing.map(id=>LC35_BY_ID.get(id)).filter(g=>g&&g.payment==='coin');
 const premiumItems=missing.map(id=>LC35_BY_ID.get(id)).filter(g=>g&&g.payment==='premium');
 const unavailable=missing.filter(id=>{const g=LC35_BY_ID.get(id);return !g||!['coin','premium'].includes(g.payment)});
 return {missing,coinItems,premiumItems,unavailable,total:coinItems.reduce((n,g)=>n+g.price,0)};
}
function lc39SetCards(){
 const c=lc33State();
 const files={street:'outfit-street.png',sakura:'outfit-sakura.png',phantom:'outfit-phantom.png',emperor:'outfit-emperor.png',galaxy:'outfit-galaxy.png'};
 return '<section class="lc39-sets lc50-bundles"><h2>✦ Коллекционные комплекты</h2>'+
 '<p class="subline">Каждый комплект содержит пять определённых вещей. Покупаются только отсутствующие предметы; уже приобретённые не оплачиваются повторно.</p>'+
 '<div class="lc39-set-grid">'+LC39_SETS.map(set=>{
  const offer=lc50SetOffer(set,c),on=lc39IsWearing(set,c),preview=lc39Preview?.id===set.id;
  const pieces=Object.values(set.equipped).map(id=>{
   const g=LC35_BY_ID.get(id),owned=c.owned.includes(id);
   return '<li class="'+(owned?'owned':'')+'">'+(owned?'✓ ':'◇ ')+rankEsc(g?.name||id)+
   (owned?' · есть':g?.payment==='coin'?' · '+fmt(g.price)+' 🪙':g?.payment==='premium'?' · '+g.price+' гол.':' · недоступно')+'</li>';
  }).join('');
  let buy='';
  if(offer.coinItems.length&&!offer.unavailable.length){
   buy='<button type="button" data-lc50-buy="'+set.id+'">Купить '+offer.coinItems.length+' вещ. · '+fmt(offer.total)+' 🪙</button>';
  }
  const premiumNote=offer.premiumItems.length?'<p class="lc50-premium-note">💎 Донатные вещи приобретаются отдельно в гардеробе через VK: '+offer.premiumItems.map(g=>rankEsc(g.name)+' ('+g.price+' гол.)').join(', ')+'</p>':'';
  return '<article class="lc39-set-card lc50-set-card'+(preview?' preview':'')+(on?' worn':'')+'" style="--set-glow:'+set.accent+'">'+
   '<div class="lc39-set-top"><strong>'+set.name+'</strong><small>'+set.tier+'</small></div>'+
   '<img class="lc50-set-image" src="./assets/character44/'+files[set.id]+'" alt="'+set.name+'" loading="lazy">'+
   '<p>'+set.description+'</p>'+(set.id==='street'?'<p class="lc50-premium-note">🪙 Стоимость полного комплекта: 460 000 монет. Бесплатные стартовые вещи в него не входят.</p>':'')+
   '<p class="lc39-set-status">'+(on?'✓ Надето':lc503LegacyComplete(set,c)?'✓ Доступ по оригинальному STREET':offer.missing.length?'Собрано '+(5-offer.missing.length)+' из 5':'✓ Полный комплект в коллекции')+'</p>'+
   '<ul class="lc50-piece-list">'+pieces+'</ul>'+(lc503LegacyComplete(set,c)?'<p class="lc50-premium-note">Ранее собранный STREET остаётся доступен. Новые вещи можно приобретать отдельно; старые предметы остаются в коллекции.</p>':'')+premiumNote
   '<div class="lc39-set-actions"><button type="button" data-lc39-preview="'+set.id+'">Примерить</button>'+
   buy+'<button type="button" data-lc39-wear="'+set.id+'" '+(offer.missing.length||on?'disabled':'')+'>'+(on?'✓ Надето':'Надеть комплект')+'</button></div>'+
   '</article>';
 }).join('')+'</div>'+
 (lc39Preview?'<button type="button" class="lc39-reset" data-lc39-reset="1">Вернуться к своему персонажу</button>':'')+
 '</section>';
}

/* Lucky City 40: hand-crafted, set-specific couture elements.
   Render exclusively as inline SVG to avoid Safari's external SVG <use> regressions. */
function lc40FullSet(equipped){
 return LC39_SETS.find(set=>Object.entries(set.equipped).every(([type,id])=>equipped[type]===id))||null;
}
function lc40SetMark(set){
 if(!set)return '';
 const id=set.id;
 if(id==='street')return [
  '<g class="lc40-street">',
  '<path d="M95 182 L107 172 119 187 109 221 91 225Z M172 186 L184 172 196 183 187 225 171 220Z" fill="#183f7f" stroke="#77eaff" stroke-width="3"/>',
  '<path d="M118 209 L137 215 150 209 160 214 148 233 127 233Z" fill="#1a204c" stroke="#84faff" stroke-width="2"/>',
  '<path d="M123 214 L134 214 129 223 139 223 127 237 130 227 121 227Z" fill="#87faff"/>',
  '<path d="M86 306 H112 M164 308 H193 M83 327 L116 327 M163 327 L194 327" fill="none" stroke="#56e0fa" stroke-width="4" stroke-dasharray="11 4"/>',
  '<path d="M60 375 H123 M160 376 H223" fill="none" stroke="#8dfaff" stroke-width="3"/>',
  '<circle cx="86" cy="201" r="4" fill="#fff"/><circle cx="196" cy="203" r="4" fill="#fff"/>',
  '</g>'
 ].join('');
 if(id==='sakura')return [
  '<g class="lc40-sakura">',
  '<path d="M103 181 Q136 197 174 180" fill="none" stroke="#ffbfdc" stroke-width="5"/>',
  '<path d="M108 237 Q136 250 173 237" fill="none" stroke="#ffcce5" stroke-width="3"/>',
  '<path d="M133 209 Q129 201 134 195 Q140 196 140 203 Q146 195 153 200 Q151 209 144 213 Q152 214 150 222 Q140 223 139 218 Q136 229 129 222 Q127 214 133 209Z" fill="#ffc5ea" stroke="#fff1f7" stroke-width="2"/>',
  '<path d="M108 310 L120 314 M164 309 L181 314 M83 359 L106 351 M170 350 L195 358" stroke="#f5a3d4" stroke-width="4" fill="none"/>',
  '<path d="M65 146 Q75 136 77 150 Q88 141 92 154 Q80 164 65 146Z M205 243 Q216 229 222 245 Q233 242 231 253 Q212 264 205 243Z M43 275 Q52 259 62 273 Q71 263 74 282 Q61 294 43 275Z" fill="#ffc2e3" opacity=".78"/>',
  '</g>'
 ].join('');
 if(id==='phantom')return [
  '<g class="lc40-phantom">',
  '<path d="M95 176 Q71 196 52 276 L33 338 84 313 106 258Z M184 176 Q214 193 230 274 L248 335 198 313 176 256Z" fill="#120f2b" stroke="#8a75ca" stroke-width="5"/>',
  '<path d="M79 215 Q64 276 49 320 M203 215 Q217 276 233 320" stroke="#ae96e2" stroke-width="2" fill="none" opacity=".6"/>',
  '<path d="M105 105 Q120 114 133 108 M146 108 Q162 114 176 104" stroke="#a39fe8" stroke-width="3" fill="none"/>',
  '<path d="M107 120 Q140 134 174 121 L161 150 119 151Z" fill="#211b3b" stroke="#aaa5eb" stroke-width="3"/>',
  '<path d="M121 222 L139 209 158 222 139 245Z" fill="#6653a8" stroke="#d6caff" stroke-width="2"/>',
  '<path d="M90 302 L113 315 M167 315 L191 301" stroke="#9184c8" stroke-width="4"/>',
  '</g>'
 ].join('');
 if(id==='emperor')return [
  '<g class="lc40-emperor">',
  '<path d="M101 162 L83 174 70 198 90 201 108 187Z M174 163 L193 174 210 198 191 201 170 188Z" fill="#e9b950" stroke="#fff0aa" stroke-width="4"/>',
  '<path d="M99 206 L117 229 138 249 159 229 181 205" fill="none" stroke="#ffebb5" stroke-width="6"/>',
  '<path d="M132 228 L139 220 147 228 139 239Z" fill="#b562ff" stroke="#fff5cc" stroke-width="2"/>',
  '<path d="M75 282 L66 327 106 310 123 273 M195 281 L215 326 174 310 157 272" fill="none" stroke="#ffe5a3" stroke-width="4"/>',
  '<path d="M82 196 Q88 218 92 232 M197 196 Q191 218 188 232" fill="none" stroke="#f9cc72" stroke-width="3"/>',
  '<path d="M100 289 L91 300 100 310 111 301Z M178 289 L168 301 179 311 190 300Z" fill="#f5cb74" stroke="#fff4c5" stroke-width="2"/>',
  '<circle cx="48" cy="215" r="4" fill="#ffdf86"/><circle cx="230" cy="194" r="4" fill="#ffdf86"/>',
  '</g>'
 ].join('');
 if(id==='galaxy')return [
  '<g class="lc40-galaxy">',
  '<path d="M107 188 Q136 208 174 188 L169 258 Q136 274 110 258Z" fill="#302776" opacity=".5" stroke="#b6a7ff" stroke-width="3"/>',
  '<path d="M138 201 L144 216 160 217 148 228 153 245 138 235 122 245 128 228 116 217 132 216Z" fill="#cbc5ff" stroke="#fff" stroke-width="2"/>',
  '<circle cx="113" cy="227" r="3" fill="#83edff"/><circle cx="162" cy="249" r="2.5" fill="#f7d2ff"/>',
  '<path d="M108 278 Q121 269 133 283 Q146 297 164 283 Q178 273 190 282" fill="none" stroke="#a2b8ff" stroke-width="3"/>',
  '<path d="M85 352 L105 340 M178 341 L201 352" stroke="#a7fdff" stroke-width="3"/>',
  '<path d="M44 209 L49 198 54 209 66 215 54 221 49 233 44 221 33 215Z M227 280 L231 273 235 281 243 285 235 289 231 296 227 290 219 285Z" fill="#aaa0ff" opacity=".9"/>',
  '</g>'
 ].join('');
 return '';
}
function lc40Emblem(set){
 const color=set.accent;
 const symbols={
  street:'<path d="M38 14 L52 14 43 31 57 31 29 65 35 41 23 41Z" fill="'+color+'" stroke="#e9fdff" stroke-width="2"/>',
  sakura:'<path d="M40 33 Q24 9 17 27 Q16 39 33 42 Q12 43 22 58 Q34 65 40 48 Q44 69 57 57 Q63 45 46 42 Q66 36 58 24 Q46 15 40 33Z" fill="'+color+'" stroke="#fff" stroke-width="2"/><circle cx="40" cy="42" r="6" fill="#ffedb5"/>',
  phantom:'<path d="M15 21 L40 12 65 21 61 52 40 68 19 52Z" fill="#28213f" stroke="'+color+'" stroke-width="3"/><path d="M27 35 L37 40 40 37 43 40 54 35" fill="none" stroke="#e7dcff" stroke-width="4"/>',
  emperor:'<path d="M13 53 L11 21 27 34 40 12 53 34 69 21 67 53Z" fill="'+color+'" stroke="#fff1c1" stroke-width="3"/><path d="M14 53 H67 V61 H14Z" fill="#9d692b"/><circle cx="40" cy="42" r="5" fill="#9a5bdf"/>',
  galaxy:'<path d="M40 10 L47 31 70 31 52 44 58 67 40 54 22 67 28 44 10 31 33 31Z" fill="'+color+'" stroke="#f5f2ff" stroke-width="2"/><circle cx="40" cy="42" r="7" fill="#3d276e"/>'
 };
 return '<svg class="lc40-emblem" viewBox="0 0 80 80" aria-hidden="true">'+(symbols[set.id]||'')+'</svg>';
}

/* Lucky City 41: art-directed finish for high-value garments.
   No new items or economy logic. These inline paths remain compatible with VK iPhone WebView. */
function lc41CoutureDetail(item){
 if(!item)return '';
 const id=item.id,c=item.color;
 const high=['Мифическая','Легендарная'].includes(item.rarity);
 const isSpecial=/diamond|emperor|obsidian|cosmos|phoenix|galaxy|royal/.test(id);
 if(!high&&!isSpecial)return '';
 const theme=lc36Theme(item);
 const shine=({crystal:'#ecffff',flame:'#ffe1a4',space:'#dbbaff',royal:'#fff2c5',nature:'#ffe1ee',shadow:'#b3b1db',neon:'#befffb',street:'#edd8ff'})[theme];
 if(item.type==='jacket'){
  if(/coat-emperor|coat-royal-vip/.test(id))return '<g class="lc41-couture"><path d="M76 187 L93 170 110 190 93 211 68 204Z M169 190 L188 170 208 187 212 204 190 211Z" fill="url(#lc33metal)" stroke="'+shine+'" stroke-width="3"/><path d="M93 226 L117 242 138 256 160 242 184 226" fill="none" stroke="'+shine+'" stroke-width="4"/><path d="M83 290 L70 328 109 314 M196 292 L214 328 177 314" stroke="'+shine+'" stroke-width="3" fill="none"/><circle cx="139" cy="249" r="6" fill="#9a49f5" stroke="'+shine+'" stroke-width="2"/></g>';
  if(/cosmos|galaxy/.test(id))return '<g class="lc41-couture"><path d="M112 185 Q140 197 167 182" fill="none" stroke="'+shine+'" stroke-width="3"/><path d="M137 205 L141 216 153 218 144 226 148 239 137 231 125 239 130 226 120 218 133 216Z" fill="#c5aaff" stroke="#fff" stroke-width="1.8"/><circle cx="116" cy="238" r="3" fill="#9cefff"/><circle cx="164" cy="242" r="2.5" fill="#f5d8ff"/><path d="M107 260 Q139 266 172 259" stroke="'+shine+'" stroke-width="2" fill="none" opacity=".7"/></g>';
  if(/diamond/.test(id))return '<g class="lc41-couture"><path d="M114 183 L139 201 164 183" stroke="'+shine+'" stroke-width="5" fill="none"/><path d="M129 211 L139 201 150 211 145 226 133 226Z" fill="#7bcfe0" stroke="#fff" stroke-width="2"/><path d="M103 254 L117 245 M165 245 L181 254" stroke="'+shine+'" stroke-width="3"/></g>';
  if(/phoenix/.test(id))return '<g class="lc41-couture"><path d="M126 229 Q114 211 129 198 Q129 211 140 215 Q148 203 149 194 Q167 215 151 236 L141 247Z" fill="#ffbf6c" stroke="#ffe9ad" stroke-width="2"/><path d="M139 220 Q148 227 141 237 Q135 234 139 220Z" fill="#fff4ba"/></g>';
  return '<g class="lc41-couture"><path d="M103 197 L117 210 111 223 M177 197 L164 210 170 223" fill="none" stroke="'+shine+'" stroke-width="4"/><path d="M112 255 Q141 263 169 255" fill="none" stroke="'+shine+'" stroke-width="2"/></g>';
 }
 if(item.type==='pants')return '<g class="lc41-couture"><path d="M102 278 L95 305 M173 278 L184 307" stroke="'+shine+'" stroke-width="3" fill="none"/><path d="M92 334 L112 337 M169 337 L191 334" stroke="'+shine+'" stroke-width="3"/><circle cx="104" cy="300" r="3" fill="'+shine+'"/><circle cx="177" cy="300" r="3" fill="'+shine+'"/></g>';
 if(item.type==='shoes')return '<g class="lc41-couture"><path d="M63 379 Q94 393 121 377 M163 379 Q191 393 221 379" stroke="'+shine+'" stroke-width="4" fill="none"/><path d="M78 356 L107 353 M173 354 L204 358" stroke="'+shine+'" stroke-width="3"/></g>';
 if(item.type==='hat'&&/crown|diamond|obsidian/.test(id))return '<g class="lc41-couture"><path d="M116 65 L139 48 161 65" stroke="'+shine+'" stroke-width="2.5" fill="none"/><circle cx="139" cy="63" r="4" fill="'+shine+'"/><circle cx="105" cy="74" r="2" fill="#fff"/></g>';
 if(item.type==='accessory'&&/chain|glasses/.test(id))return '<g class="lc41-couture"><path d="M134 184 L141 176 148 184 141 194Z" fill="'+shine+'" stroke="#fff" stroke-width="1.5"/></g>';
 return '';
}
/* Lucky City 42: redrawn base character (not an additional face overlay).
   A single self-contained, inline SVG for VK iOS. Compatible with 37-41 apparel
   coordinates and every existing wardrobe ID. Does not modify saved data. */
function lc42AvatarBase(equipped){
 const pick=type=>LC35_BY_ID.get(equipped[type])||LC33_GOODS.find(g=>g.type===type);
 const hat=pick('hat'),jacket=pick('jacket'),pants=pick('pants'),shoes=pick('shoes'),acc=pick('accessory');
 const h=hat?.color||'#1c203a',j=jacket?.color||'#23203f',p=pants?.color||'#2b2844',sn=shoes?.color||'#eff4ff',ac=acc?.color||'#e7bd67';
 const head=hat?.style||hat?.id||'cap',accessory=acc?.style||acc?.id||'headphones';
 const premiumHat=/crown|horns/.test(head),beanie=head==='beanie',bucket=head==='bucket',cowboy=head==='cowboy',cylinder=head==='cylinder',kitty=head==='kitty';
 const coat=/coat-|emperor/.test(jacket?.id||''),hoodie=/hoodie/.test(jacket?.id||'');
 const boots=/boots|emperor|royal|diamond/.test(shoes?.id||'');
 const H=[];
 H.push('<svg class="lc42-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 405" role="img" aria-label="Персонаж Lucky City в выбранной одежде"><defs>'+
 '<linearGradient id="lc42skin" x1="12%" y1="0%" x2="88%" y2="96%"><stop stop-color="#ffe9d0"/><stop offset=".28" stop-color="#f6c4a6"/><stop offset=".64" stop-color="#dfa083"/><stop offset="1" stop-color="#ae7182"/></linearGradient>'+
 '<linearGradient id="lc42lightSkin" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#fff5df"/><stop offset=".58" stop-color="#eeb69e"/><stop offset="1" stop-color="#b97380"/></linearGradient>'+
 '<linearGradient id="lc42hair" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#44354e"/><stop offset=".48" stop-color="#282035"/><stop offset="1" stop-color="#100e23"/></linearGradient>'+
 '<linearGradient id="lc42cloth" x1="0%" y1="0%" x2="95%" y2="100%"><stop stop-color="'+j+'"/><stop offset=".48" stop-color="#302443"/><stop offset="1" stop-color="'+j+'"/></linearGradient>'+
 '<linearGradient id="lc42trouser" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="'+p+'"/><stop offset=".58" stop-color="#201a38"/><stop offset="1" stop-color="'+p+'"/></linearGradient>'+
 '<linearGradient id="lc42shoe" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#fff9ea"/><stop offset=".24" stop-color="'+sn+'"/><stop offset=".78" stop-color="'+sn+'"/><stop offset="1" stop-color="#50426e"/></linearGradient>'+
 '<linearGradient id="lc42gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop stop-color="#fff4c1"/><stop offset=".42" stop-color="#facf68"/><stop offset=".82" stop-color="#b97b32"/><stop offset="1" stop-color="#ffdea4"/></linearGradient>'+
 '<radialGradient id="lc42iris"><stop stop-color="#75e1ed"/><stop offset=".68" stop-color="#307dba"/><stop offset="1" stop-color="#182c57"/></radialGradient>'+
 '<filter id="lc42ground"><feGaussianBlur stdDeviation="7"/></filter></defs>');
 // Balanced legs, carefully weighted feet; old outfit outlines share the same coordinate system.
 H.push('<ellipse cx="140" cy="386" rx="94" ry="12" fill="#a65dff" opacity=".5" filter="url(#lc42ground)"/>'+
 '<path d="M100 248 Q116 252 138 250 L130 294 121 351 110 372 73 368 Q84 335 90 292Z M144 250 Q171 244 185 249 L191 298 206 352 216 368 166 371 152 320 140 291Z" fill="url(#lc42trouser)" stroke="#1a122a" stroke-width="5" stroke-linejoin="round"/>'+
 '<path d="M97 267 Q111 278 122 276 L111 324 M158 273 Q177 276 182 267 L190 324" stroke="#baa1de" stroke-width="2.5" opacity=".55" fill="none"/>'+
 '<path d="M88 319 Q92 332 89 347 M191 315 Q197 330 200 344" stroke="#0b0a1d" stroke-width="4" opacity=".44" fill="none"/>'+
 '<path d="M72 348 Q90 338 111 345 Q123 360 125 378 Q96 396 54 383 Q54 369 72 348Z M165 348 Q185 338 203 348 Q223 367 225 379 Q194 396 159 384 Q156 365 165 348Z" fill="url(#lc42shoe)" stroke="#211631" stroke-width="5" stroke-linejoin="round"/>'+
 '<path d="M56 377 Q87 389 122 376 M162 379 Q192 389 222 376" stroke="#ffdf9d" stroke-width="4" fill="none"/>'+
 '<path d="M78 360 L103 355 M74 366 L108 360 M174 360 L197 358 M173 367 L204 362" stroke="#fff7ef" stroke-width="2.8" stroke-linecap="round"/>');
 // Torso with natural shoulder line and padded tailored arms.
 H.push('<path d="M107 157 Q126 148 142 147 Q168 148 181 160 Q189 202 183 260 Q145 273 101 260 Q93 210 107 157Z" fill="url(#lc42cloth)" stroke="#1b122c" stroke-width="5"/>'+
 '<path d="M107 161 Q98 156 86 163 Q61 179 49 222 L55 266 79 263 82 223 108 190Z M178 161 Q193 155 203 165 Q225 181 232 224 L222 265 197 262 198 222 174 190Z" fill="url(#lc42cloth)" stroke="#1d122d" stroke-width="5" stroke-linejoin="round"/>'+
 '<path d="M82 175 Q67 199 64 225 M200 177 Q217 201 218 225" stroke="#d5b3d6" opacity=".42" stroke-width="2.3" fill="none"/>'+
 '<path d="M55 251 Q66 256 80 251 L82 270 Q67 275 54 269Z M198 251 Q213 256 224 250 L229 268 Q213 274 196 268Z" fill="#20192f" stroke="#d3a5ef" stroke-width="2.4"/>'+
 '<path d="M59 267 Q49 277 54 288 Q57 305 72 302 Q88 300 84 282 L79 267Z M202 266 Q192 280 197 294 Q207 307 224 300 Q237 289 226 273 L220 266Z" fill="url(#lc42skin)" stroke="#c58c89" stroke-width="2.5"/>'+
 '<path d="M111 164 L139 199 164 164 L173 175 145 237 138 257 122 256 116 234 103 181Z" fill="#eeeaf7" stroke="#7a648f" stroke-width="2.3"/>'+
 '<path d="M108 158 L124 198 139 209 125 228 101 261 93 252 110 205 91 178Z M172 157 L157 197 140 209 158 228 182 261 192 252 172 206 190 178Z" fill="url(#lc42cloth)" stroke="#25132d" stroke-width="4"/>'+
 '<path d="M107 158 Q117 181 135 198 M174 157 Q164 182 144 200" stroke="#e5b76d" stroke-width="3.5" fill="none"/>'+
 '<path d="M139 208 V261 M109 249 Q139 256 173 249" stroke="#a78ba3" stroke-width="2.1" opacity=".72" fill="none"/>');
 // Neck and ears.
 H.push('<path d="M122 138 Q141 149 163 136 L162 168 Q140 182 124 167Z" fill="url(#lc42skin)" stroke="#9e6776" stroke-width="2.8"/>'+
 '<path d="M101 100 Q90 94 89 106 Q86 120 102 126 M179 100 Q194 93 192 109 Q192 124 177 127" fill="url(#lc42skin)" stroke="#ad7381" stroke-width="2.6"/>'+
 '<path d="M97 85 Q93 54 115 41 Q139 29 167 41 Q188 54 187 86 L186 116 Q181 151 144 157 Q107 151 98 119Z" fill="url(#lc42hair)" stroke="#201827" stroke-width="4"/>'+
 '<path d="M99 91 Q104 57 135 53 Q162 48 181 74 L182 115 Q175 149 144 154 Q111 147 101 118Z" fill="url(#lc42lightSkin)" stroke="#9f6573" stroke-width="2.7"/>'+
 '<path d="M104 116 Q107 133 116 138 M173 118 Q170 134 158 140" fill="none" stroke="#f39d91" stroke-width="2.3" opacity=".37"/>'+
 '<path d="M103 85 Q122 82 133 66 Q155 72 168 59 Q173 70 182 87 L184 70 Q177 42 145 41 Q111 39 98 62Z" fill="url(#lc42hair)" stroke="#241a30" stroke-width="3"/>'+
 '<path d="M104 68 Q116 50 141 50 M148 47 Q168 48 177 64" fill="none" stroke="#64516e" stroke-width="3.3" opacity=".56"/>'+
 // Face: different shape than old drawing, iris rings / eyebrows / subtle nose.
 '<path d="M107 101 Q116 95 127 99 M149 99 Q159 95 172 101" stroke="#4d2e45" stroke-width="4" fill="none" stroke-linecap="round"/>'+
 '<path d="M108 110 Q117 105 127 110 M149 109 Q159 105 170 110" stroke="#f8eee7" stroke-width="5" fill="none" stroke-linecap="round"/>'+
 '<ellipse cx="118" cy="111" rx="5" ry="6.5" fill="url(#lc42iris)"/><ellipse cx="160" cy="111" rx="5" ry="6.5" fill="url(#lc42iris)"/>'+
 '<circle cx="119" cy="108" r="2" fill="#fff"/><circle cx="161" cy="108" r="2" fill="#fff"/>'+
 '<path d="M137 111 Q135 123 133 125 Q140 129 145 124" stroke="#b67979" fill="none" stroke-width="2.3" stroke-linecap="round"/>'+
 '<path d="M125 138 Q139 147 154 136" stroke="#9b5764" fill="none" stroke-width="3" stroke-linecap="round"/>'+
 '<path d="M128 143 Q140 146 151 141" stroke="#ffe6c7" fill="none" stroke-width="1.2" opacity=".8"/>'+
 '<path d="M103 121 Q110 126 116 127 M164 127 Q171 126 176 120" stroke="#d98c90" fill="none" stroke-width="1.7" opacity=".46"/>'+
 '<path d="M110 132 Q119 142 129 144 M169 131 Q160 142 151 145" stroke="#fff0d0" fill="none" stroke-width="1.4" opacity=".38"/>');
 // Sculpted hair: volume, side part, overlapping fringe.
 H.push('<path d="M99 91 Q86 80 96 60 Q104 39 128 35 Q148 30 165 41 Q183 45 190 69 L184 94 174 83 Q167 66 154 65 Q146 81 130 82 Q116 92 104 88Z" fill="url(#lc42hair)" stroke="#191323" stroke-width="3"/>'+
 '<path d="M107 76 Q120 59 145 53 M149 53 Q168 57 178 74" stroke="#82708a" stroke-width="2.5" opacity=".53" fill="none" stroke-linecap="round"/>'+
 '<path d="M101 84 L103 112 M181 83 L182 111" stroke="#271a32" stroke-width="6" opacity=".77"/>');
 // Individual hats, aligned with face and hair.
 let headwear='';
 if(premiumHat)headwear='<path d="M96 77 L84 35 110 50 140 17 169 49 193 34 183 78Z" fill="url(#lc42gold)" stroke="#fff5cc" stroke-width="4.5"/><path d="M93 76 Q140 85 188 76" stroke="#7e4e37" stroke-width="8" fill="none"/><circle cx="140" cy="56" r="7.5" fill="#af66f0" stroke="#fff" stroke-width="2"/>';
 else if(kitty)headwear='<path d="M96 84 L95 44 114 57 142 42 164 56 181 43 183 84Z" fill="'+h+'" stroke="#f2bcff" stroke-width="4"/><circle cx="89" cy="96" r="17" fill="#b55be9" stroke="#ffd5fb" stroke-width="4"/><circle cx="190" cy="96" r="17" fill="#b55be9" stroke="#ffd5fb" stroke-width="4"/>';
 else if(cylinder)headwear='<path d="M113 13 H174 L171 74 H113Z" fill="'+h+'" stroke="#edd9ff" stroke-width="4"/><ellipse cx="140" cy="76" rx="64" ry="11" fill="'+h+'" stroke="#d2abeb" stroke-width="3"/><path d="M115 57 H171" stroke="#eeb765" stroke-width="7"/>';
 else if(cowboy)headwear='<path d="M106 84 Q113 31 141 27 Q173 32 177 84Z" fill="'+h+'" stroke="#e8b0fc" stroke-width="4"/><path d="M74 86 Q141 110 204 85 Q184 108 140 100 Q94 110 74 86Z" fill="'+h+'" stroke="#ebc3f7" stroke-width="3"/>';
 else if(beanie)headwear='<path d="M96 93 Q90 35 139 31 Q184 32 187 92 L186 106 Q141 112 96 106Z" fill="'+h+'" stroke="#efceff" stroke-width="4"/><path d="M99 85 Q144 81 185 85 M116 50 V82 M139 40 V83 M163 52 V82" stroke="#f5d9ff" opacity=".65" stroke-width="2.5" fill="none"/>';
 else if(bucket)headwear='<path d="M111 42 Q141 34 173 42 L180 87 101 88Z" fill="'+h+'" stroke="#e1ddff" stroke-width="4"/><ellipse cx="141" cy="91" rx="59" ry="11" fill="'+h+'" stroke="#d1e6ff" stroke-width="3"/>';
 else headwear='<path d="M95 84 Q101 39 139 36 Q179 35 184 83 L185 91 94 91Z" fill="'+h+'" stroke="#d3b6e8" stroke-width="3.5"/><path d="M96 83 Q141 75 196 90 Q167 104 97 96Z" fill="'+h+'" stroke="#bd9ad9" stroke-width="3"/><path d="M130 68 L140 60 150 69 140 78Z" fill="url(#lc42gold)"/>';
 H.push(headwear);
 // Correct accessory ordering: eyeglasses on face, headphones around crown, chain below neck.
 if(accessory==='glasses')H.push('<rect x="100" y="100" width="32" height="24" rx="6" fill="'+ac+'" fill-opacity=".24" stroke="#e2d4ff" stroke-width="3"/><rect x="147" y="100" width="31" height="24" rx="6" fill="'+ac+'" fill-opacity=".24" stroke="#e2d4ff" stroke-width="3"/><path d="M132 108 Q140 104 147 108" stroke="#e7d4ff" stroke-width="3" fill="none"/>');
 if(accessory==='headphones')H.push('<path d="M100 91 Q99 49 140 46 Q184 48 189 93" fill="none" stroke="'+ac+'" stroke-width="9"/><path d="M101 91 V123 M186 91 V123" stroke="#9d6d45" stroke-width="11"/><rect x="91" y="93" width="20" height="35" rx="8" fill="'+ac+'" stroke="#ffedc9" stroke-width="3"/><rect x="178" y="93" width="18" height="35" rx="8" fill="'+ac+'" stroke="#ffedc9" stroke-width="3"/>');
 if(accessory==='chain')H.push('<path d="M117 162 Q140 202 163 162" fill="none" stroke="'+ac+'" stroke-width="6"/><path d="M134 185 L140 177 147 185 140 195Z" fill="url(#lc42gold)" stroke="#ffefd3" stroke-width="2"/>');
 if(hoodie)H.push('<path d="M106 159 Q140 184 174 157 L164 182 Q140 193 122 182Z" fill="'+j+'" stroke="#deb8ff" stroke-width="3"/><path d="M124 185 L122 212 M155 185 L157 212" stroke="#f6d5ff" stroke-width="3"/>');
 if(coat)H.push('<path d="M107 155 L140 201 172 155" fill="none" stroke="#fff0b9" stroke-width="3" opacity=".77"/>');
 H.push('</svg>');
 return H.join('');
}

/* 49.0 — five separate realistic fashion previews; no ownership changes. */
let lc49SelectedOutfit='base';
const LC49_OUTFITS=[
 ['base','Базовый','avatar.png'],
 ['street','NEON STREET','outfit-street.png'],
 ['sakura','SAKURA NIGHT','outfit-sakura.png'],
 ['phantom','DARK PHANTOM','outfit-phantom.png'],
 ['emperor','GOLDEN EMPEROR','outfit-emperor.png'],
 ['galaxy','COSMIC LEGEND','outfit-galaxy.png']
];
function lc33Avatar(){
 const previewId=lc39Preview?.id||lc49SelectedOutfit;
 const outfit=LC49_OUTFITS.find(o=>o[0]===previewId)||LC49_OUTFITS[0];
 const src='./assets/character44/'+outfit[2];
 return '<img class="lc47-real-avatar" src="'+src+'" alt="Реалистичный персонаж: '+outfit[1]+'" draggable="false" onerror="this.onerror=null;this.src=\'./assets/character44/avatar.png\'">';
}

/* 43.0: recognizable material patches and seams, painted inside each thumbnail.
   No external SVG <use>, filenames, fonts or network dependencies. */
function lc43ItemSignature(g){
 if(!g)return '';
 const id=g.id,theme=lc36Theme(g),c=g.color;
 const high=({crystal:'#e8ffff',flame:'#ffe6a7',space:'#f0d6ff',royal:'#fff1b1',nature:'#ffe9ee',shadow:'#d2caed',neon:'#a7ffff',street:'#f6d4ff'})[theme];
 let artwork='';
 if(g.type==='hat'){
  if(/crown|obsidian/.test(id))artwork='<path d="M20 42 L12 25 28 34 41 13 53 34 69 25 61 43Z" stroke="'+high+'" stroke-width="2" fill="'+c+'"/><circle cx="40" cy="33" r="6" fill="'+high+'"/>';
  else if(/beanie/.test(id))artwork='<path d="M16 47 Q40 39 64 47 M20 52 H60" stroke="'+high+'" stroke-width="2" fill="none"/><path d="M29 24 V43 M41 20 V42 M53 25 V43" stroke="'+high+'" stroke-width="2" opacity=".78"/>';
  else if(/bucket|fedora|cowboy/.test(id))artwork='<path d="M17 40 Q40 49 66 40 M11 52 Q40 62 72 52" fill="none" stroke="'+high+'" stroke-width="2"/>';
  else artwork='<path d="M15 45 Q40 36 68 45 M29 26 Q40 21 51 26" stroke="'+high+'" stroke-width="2" fill="none"/>';
 }else if(g.type==='jacket'){
  if(/hoodie/.test(id))artwork='<path d="M25 19 Q40 40 55 19 M29 42 L24 55 M50 42 L56 55 M28 66 H52" stroke="'+high+'" stroke-width="2" fill="none"/>';
  else if(/coat|goldcoat|emperor|phoenix/.test(id))artwork='<path d="M24 18 L40 44 56 18 M40 44 V72 M23 65 L32 57 M49 57 L57 65" stroke="'+high+'" stroke-width="2.5" fill="none"/>';
  else artwork='<path d="M20 27 L31 20 40 35 49 20 60 27 M40 35 V73 M21 62 L30 62 M50 62 L59 62" stroke="'+high+'" stroke-width="2" fill="none"/>';
 }else if(g.type==='pants'){
  artwork=/cargo/.test(id)?'<rect x="14" y="43" width="19" height="16" rx="3" stroke="'+high+'" stroke-width="2" fill="'+c+'"/><rect x="48" y="43" width="18" height="16" rx="3" stroke="'+high+'" stroke-width="2" fill="'+c+'"/><path d="M17 49 H30 M51 49 H63" stroke="'+high+'" stroke-width="2"/>':'<path d="M25 15 L22 40 M56 15 L60 40 M19 65 L32 65 M48 65 H62" stroke="'+high+'" stroke-width="2" fill="none"/>';
 }else if(g.type==='shoes'){
  artwork=/boots|emperor|royal|diamond/.test(id)?'<path d="M22 22 V45 M49 23 V46 M17 61 H68" stroke="'+high+'" stroke-width="3" fill="none"/><path d="M26 40 H44" stroke="#fff" stroke-width="2"/>':'<path d="M20 48 L32 40 43 48 M18 56 H69 M26 52 L35 55" stroke="'+high+'" stroke-width="2.5" fill="none"/>';
 }else if(g.type==='accessory'){
  artwork=/glasses/.test(id)?'<path d="M12 32 L26 46 M51 45 L65 30" stroke="'+high+'" stroke-width="3" fill="none"/>':/chain/.test(id)?'<path d="M29 55 L40 64 51 55" stroke="'+high+'" stroke-width="2.5" fill="none"/>':'<path d="M17 30 V51 M61 30 V51" stroke="'+high+'" stroke-width="2.5" fill="none"/>';
 }
 // Uniqueness is identity-specific: four extra stitched strokes positioned from stable item ID.
 let hash=0;for(let i=0;i<id.length;i++)hash=(hash*31+id.charCodeAt(i))>>>0;
 const px=17+(hash%42),py=19+((hash>>>6)%27);
 return '<g class="lc43-stitches" pointer-events="none">'+artwork+
  '<path d="M'+px+' '+py+' l5 0 m-2.5 -2.5 v5" stroke="'+high+'" stroke-width="1.5" opacity=".72"/>'+
  '</g>';
}
function lc43ItemIcon(g){
 const svg=lc36ItemIcon(g);
 return svg.replace('</svg>',lc43ItemSignature(g)+'</svg>');
}

function lc34SvgItem(g){return lc43ItemIcon(g);}
function lc33Screen(){
 const c=lc33State(),active=LC33_GROUPS.find(g=>g[0]===lc33Category)||LC33_GROUPS[0];
 const list=LC33_GOODS.filter(g=>g.type===lc33Category&&g.payment!=='locked'&&(lc35Filter==='all'||(lc35Filter==='coin'&&['coin','default'].includes(g.payment))||(lc35Filter==='premium'&&g.payment==='premium')));
 const selected=list.find(g=>g.id===lc33Selected)||list.find(g=>g.id===c.equipped[lc33Category])||list[0];
 const cards=list.map(g=>{
  const owned=c.owned.includes(g.id),equipped=c.equipped[g.type]===g.id;
  const rarity=g.rarity==='Редкая'?'rare':g.rarity==='Эпическая'?'epic':g.rarity==='Легендарная'?'legend':g.rarity==='Мифическая'?'mythic':'';
  const action=equipped?'✓ Надето':owned?'Надеть':g.payment==='coin'?fmt(g.price)+' 🪙':g.payment==='premium'?(typeof luckyPaymentsReady!=='undefined'&&luckyPaymentsReady?g.price+' гол. · Купить':'🔒 '+g.price+' гол.'):'Пока недоступно';
  return '<article class="lc33-item '+rarity+(equipped?' on':'')+(g.payment==='premium'?' lc35-premium':'')+'"><span class="rar">'+rankEsc(g.rarity)+'</span>'+lc34SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong>'+
   '<button data-lc33-item="'+g.id+'"'+(equipped?' disabled':'')+'>'+action+'</button></article>';
 }).join('');
 const view=lc33Subtab==='sets'?lc39SetCards():lc33Subtab==='wardrobe'?
  '<div class="lc33-stage"><aside class="lc33-cats">'+LC33_GROUPS.map(g=>'<button data-lc33-cat="'+g[0]+'" class="'+(lc33Category===g[0]?'active':'')+'">'+g[2]+' '+g[1]+'</button>').join('')+'</aside>'+
  '<div class="lc33-figure"><div class="lc33-city">✧ ✦ ✧</div><div class="lc33-halo"></div><div class="lc33-person">'+lc33Avatar()+'</div></div>'+
  '<div class="lc33-side"><div>🪙 Бонус дохода<b>0% · только стиль</b></div><div>👕 Вещей в коллекции<b>'+c.owned.length+' предметов</b></div><div>👑 Активный образ<b>LUCKY CITY</b></div></div></div>'+
  '<section class="lc33-section"><h2>'+rankEsc(active[2])+' '+rankEsc(active[1])+'</h2><div class="lc35-filters">'+[['all','Все'],['coin','🪙 За монеты'],['premium','💎 Донат']].map(([id,title])=>'<button type="button" data-lc35-filter="'+id+'" class="'+(lc35Filter===id?'selected':'')+'">'+title+'</button>').join('')+'</div><div class="lc35-item-count">Доступно предметов: '+list.length+'</div><div class="lc33-items">'+cards+'</div>'+
  (selected?'<div class="lc33-detail">'+lc34SvgItem(selected)+'<div><strong>'+rankEsc(selected.name)+'</strong><p>'+rankEsc(selected.rarity)+' · '+(selected.payment==='premium'?'Премиальный внешний вид':selected.payment==='coin'?'Покупается за игровые монеты':'Стиль персонажа')+'</p><small>Одежда не влияет на шанс выигрыша</small></div></div>':'')+'</section>':
  '<section class="lc33-section"><h2>'+(lc33Subtab==='collection'?'Моя коллекция':'Бонусы персонажа')+'</h2>'+
  (lc33Subtab==='collection'?'<div class="lc33-items">'+LC33_GOODS.filter(g=>c.owned.includes(g.id)).map(g=>'<article class="lc33-item">'+lc34SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong><button data-lc33-cat="'+g.type+'">Посмотреть</button></article>').join('')+'</div>':
   '<div class="lc33-empty">Персонаж пока косметический: одежда не влияет на выигрыш или доход. Дополнительные бонусы ещё не подключены.</div>')+'</section>';
 const currentSet=lc40FullSet(lc39CurrentEquipped());
 const previewStage=lc33Subtab==='sets'?'<div class="lc39-preview-stage lc40-stage-'+(currentSet?.id||'default')+'"><div class="lc39-preview-label">'+(lc39Preview?'ПРИМЕРКА · '+lc39Preview.name:currentSet?'МОЙ ОБРАЗ · '+currentSet.name:'МОЙ ПЕРСОНАЖ')+'</div><div class="lc39-preview-avatar">'+lc33Avatar()+'</div></div>':'';
 return '<main class="lc33"><div class="lc33-hero"><h1>ПЕРСОНАЖ</h1></div>'+
 '<div class="lc33-tabs">'+[['wardrobe','♧ Гардероб'],['sets','✦ Образы'],['collection','♛ Коллекция'],['bonuses','✧ Бонусы']].map(([id,name])=>'<button class="'+(lc33Subtab===id?'active':'')+'" data-lc33-tab="'+id+'">'+name+'</button>').join('')+'</div>'+previewStage+view+'</main>';
}
document.addEventListener('click',function(e){
 const button=e.target.closest('[data-lc50-buy]');
 if(!button)return;
 const set=lc39GetSet(button.dataset.lc50Buy);
 if(!set)return;
 const c=lc33State(),offer=lc50SetOffer(set,c);
 if(offer.unavailable.length||!offer.coinItems.length)return;
 if(!Number.isFinite(state.coins)||state.coins<offer.total){message('Недостаточно монет для комплекта');return}
 // Atomic in the existing local game-save flow: charge the exact missing coin items once.
 state.coins-=offer.total;
 for(const g of offer.coinItems)if(!c.owned.includes(g.id))c.owned.push(g.id);
 save();render();
 message('Куплено вещей: '+offer.coinItems.length+' — '+set.name+(offer.premiumItems.length?'. Донатную вещь купи отдельно.':''));
});
document.addEventListener('click',function(e){
 const preview=e.target.closest('[data-lc39-preview]');
 if(preview){const set=lc39GetSet(preview.dataset.lc39Preview);if(!set)return;
  lc39Preview=set;lc49SelectedOutfit=set.id;render();message('Примерка: '+set.name);return}
 const reset=e.target.closest('[data-lc39-reset]');
 if(reset){lc39Preview=null;lc49SelectedOutfit='base';render();return}
 const wear=e.target.closest('[data-lc39-wear]');
 if(wear){const set=lc39GetSet(wear.dataset.lc39Wear);if(!set)return;
  const c=lc33State(),missing=lc39Missing(set,c);
  if(missing.length){message('Для комплекта нужны все пять предметов');return}
  const chosen=lc503LegacyComplete(set,c)&&!Object.values(set.equipped).every(id=>c.owned.includes(id))?set.legacyEquipped:set.equipped;
  c.equipped={...c.equipped,...chosen};lc39Preview=null;lc49SelectedOutfit=set.id;
  save();render();message('Комплект надет: '+set.name);return}

 const filter=e.target.closest('[data-lc35-filter]');if(filter){lc35Filter=filter.dataset.lc35Filter;render();return}
 const t=e.target.closest('[data-lc33-tab]');if(t){lc33Subtab=t.dataset.lc33Tab;if(lc33Subtab!=='sets')lc39Preview=null;render();return}
 const g=e.target.closest('[data-lc33-cat]');if(g){lc33Category=g.dataset.lc33Cat;lc35Filter='all';lc33Selected=lc33State().equipped[lc33Category]||LC33_GOODS.find(x=>x.type===lc33Category&&x.payment!=='locked')?.id||'cap';lc33Subtab='wardrobe';render();return}
 const b=e.target.closest('[data-lc33-item]');if(!b)return;
 lc39Preview=null;
 const item=LC33_GOODS.find(x=>x.id===b.dataset.lc33Item);if(!item)return;
 lc33Selected=item.id;const c=lc33State();
 if(c.equipped[item.type]===item.id)return;
 if(!c.owned.includes(item.id)){
  if(item.payment==='premium'){if(typeof luckyPaymentsReady!=='undefined'&&luckyPaymentsReady&&typeof luckyBuy==='function'){luckyBuy('character_'+item.id);}else message('Оплата через голоса VK пока не подключена');render();return}
  if(item.payment==='locked'){message('Этот предмет пока недоступен');render();return}
  if(item.payment==='coin'){
   if(state.coins<item.price){message('Недостаточно монет');render();return}
   state.coins-=item.price;c.owned.push(item.id);
  }
 }
 c.equipped[item.type]=item.id;save();render();message('Предмет применён: '+item.name);
});



/* Lucky City 45.0: prototype fitted photo layers. No purchases or ownership changes. */
let lc45TryOn=null;
const LC45_IMAGES=new Set(['cap','beanie','bucket','kitty','crown','cylinder','cowboy','cap-vip','varsity','hoodie','goldcoat','jeans','cargo','sneakers','neonboots','chain']);
function lc45Figure(){
 const equipped={...lc33State().equipped,...(lc39Preview?.equipped||{}),...(lc45TryOn||{})};
 const trial=lc45TryOn?LC35_BY_ID.get(Object.values(lc45TryOn)[0]):null;
 const status=lc39Preview?'Комплект: '+lc39Preview.name:trial?'Примерка: '+trial.name:'Текущий образ';
 const photos=['hat','jacket','pants','shoes','accessory'].map(type=>{
   const id=equipped[type],item=LC35_BY_ID.get(id);
   if(!item)return '';
   const art=LC45_IMAGES.has(id)
     ?'<img alt="" loading="lazy" src="./assets/character44/'+id+'.png" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="lc46-fallback" hidden>'+lc43ItemIcon(item)+'</span>'
     :'<span class="lc46-fallback">'+lc43ItemIcon(item)+'</span>';
   return '<div class="lc46-piece">'+art+'<span>'+rankEsc(item.name)+'</span></div>';
 }).join('');
 return '<div class="lc45-panel lc46-panel"><div class="lc45-brow">REALISTIC CHARACTER · 46.0</div>'+
 '<div class="lc46-showcase"><div class="lc46-avatar"><img alt="Реалистичный персонаж Lucky City" src="./assets/character44/avatar.png"></div>'+
 '<div class="lc46-kit">'+photos+'</div></div>'+
 '<div class="lc45-status">'+rankEsc(status)+'</div>'+
 '<p class="lc45-note">Реалистичный персонаж и выбранная одежда показаны отдельно. Одежда пока не надета на эту 3D-модель: товарные изображения не совпадают с пропорциями тела. Рабочая экипировка и образы сохранены ниже.</p>'+
 (lc45TryOn?'<button type="button" class="lc45-clear" data-lc45-clear>Сбросить примерку</button>':'')+'</div>';
}
document.addEventListener('click',function(e){
 if(e.target.closest('[data-lc45-clear]')){lc45TryOn=null;render();return}
 const card=e.target.closest('.lc33-item');
 if(!card||e.target.closest('button'))return;
 const btn=card.querySelector('[data-lc33-item]');
 if(!btn)return;
 const g=LC35_BY_ID.get(btn.dataset.lc33Item);
 if(!g)return;
 lc45TryOn={[g.type]:g.id};render();message('Примерка без покупки: '+g.name);
});
const lc45Styles=document.createElement('style');lc45Styles.id='lc45-styles';
lc45Styles.textContent=
'.lc45-panel{background:radial-gradient(ellipse at 50% 30%,#38224c,#120c24 85%);border:1px solid #9254cf;border-radius:22px;padding:12px 12px 16px;margin:9px 0 15px;text-align:center;overflow:hidden}'+
'.lc45-brow{color:#e9ccff;font-size:11px;font-weight:900;letter-spacing:1.4px;margin:2px 0 8px}'+
'.lc45-canvas{height:375px;max-width:330px;margin:auto;position:relative;overflow:hidden}'+
'.lc45-base{width:100%;height:100%;object-fit:contain;display:block;position:absolute;inset:0}'+
'.lc45-layer{position:absolute;object-fit:contain;pointer-events:none;filter:drop-shadow(0 3px 3px #06020a55)}'+
'.lc45-hat{width:29%;height:19%;top:3.3%;left:35.5%;z-index:5}'+
'.lc45-jacket{width:62%;height:39%;top:16%;left:19%;z-index:4}'+
'.lc45-pants{width:38%;height:44%;top:48%;left:31%;z-index:3}'+
'.lc45-shoes{width:44%;height:13%;top:86%;left:28%;z-index:4}'+
'.lc45-accessory{width:28%;height:13%;top:17%;left:36%;z-index:6}'+
'.lc45-status{font-weight:900;font-size:14px;color:#f8ebff;margin:6px 0}'+
'.lc45-note{font-size:11px;line-height:1.5;color:#baa9cb;margin:7px auto 0;max-width:340px}'+
'.lc45-missing{color:#c8b2da;font-size:10px;line-height:1.8}'+
'.lc45-unrendered{border:1px solid #755293;border-radius:8px;padding:2px 5px;margin:2px;display:inline-block}'+
'.lc45-clear{background:#51267e;color:#fff;border:1px solid #ac77f5;border-radius:12px;padding:10px;margin:10px 0 0;font-weight:800}'+
'.lc33-item{cursor:pointer}'+
'@media(max-width:390px){.lc45-canvas{height:330px}}';
document.head.appendChild(lc45Styles);
const lc46Styles=document.createElement('style');lc46Styles.id='lc46-styles';
lc46Styles.textContent=
'.lc46-showcase{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);align-items:center;gap:8px;min-height:335px}'+
'.lc46-avatar{height:345px;display:flex;align-items:center;justify-content:center;min-width:0}'+
'.lc46-avatar img{height:100%;width:100%;object-fit:contain}'+
'.lc46-kit{display:flex;flex-direction:column;gap:5px;min-width:0}'+
'.lc46-piece{height:64px;display:flex;gap:5px;align-items:center;background:#251437aa;border:1px solid #8e53bf66;border-radius:11px;padding:4px;min-width:0}'+
'.lc46-piece img,.lc46-fallback{height:53px;width:50px;object-fit:contain;flex:0 0 50px;display:flex;align-items:center;justify-content:center}'+
'.lc46-fallback svg{height:100%;width:100%}'+
'.lc46-piece span:last-child{font-size:10px;color:#eee0ff;line-height:1.2;overflow-wrap:anywhere;text-align:left}'+
'@media(max-width:380px){.lc46-avatar{height:305px}.lc46-piece{height:57px}.lc46-piece img,.lc46-fallback{height:47px;width:41px;flex-basis:41px}}';
document.head.appendChild(lc46Styles);

/* Lucky City 44.0 — safe photorealistic wardrobe preview.
   Existing item identifiers, prices, owned inventory and payments are untouched.
   Image files: assets/character44/{item-id}.png. Fallback to 43.0 SVG art. */
(function(){
 const previewIds=new Set(['cap','beanie','bucket','kitty','crown','cylinder','cowboy',
 'varsity','hoodie','goldcoat','jeans','cargo','sneakers','neonboots','chain','cap-vip']);
 const safePreviewId=id=>/^[a-z0-9-]+$/.test(String(id||''))?id:'';
 const originalIcon=lc34SvgItem;
 lc34SvgItem=function(g){
   if(!g||!previewIds.has(g.id))return originalIcon(g);
   const fallback=originalIcon(g),src='./assets/character44/'+safePreviewId(g.id)+'.png';
   return '<span class="lc44-asset-wrap"><img loading="lazy" alt="" class="lc44-photo" src="'+src+
     '" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="lc44-old-art" hidden>'+fallback+'</span></span>';
 };
 const style=document.createElement('style');style.id='lc44-style';style.textContent=
 '.lc44-asset-wrap{display:flex;align-items:center;justify-content:center;height:100px;max-width:100%;position:relative}' +
 '.lc44-photo{width:100%!important;height:100%!important;object-fit:contain!important;display:block}' +
 '.lc44-asset-wrap .lc44-old-art{height:92px;width:92px;max-width:100%}' +
 '.lc44-asset-wrap .lc44-old-art svg{width:100%;height:100%}' +
 '.lc44-preview-action{display:flex;justify-content:center;margin:0 0 13px}' +
 '.lc44-preview-action button{border:1px solid #a965e9;background:linear-gradient(135deg,#51247c,#24163f);border-radius:14px;color:white;font-weight:800;padding:11px 15px}' +
 '.lc44-preview-stage{border:1px solid #9958d7;border-radius:18px;background:radial-gradient(ellipse at 50% 25%,#573a80,#100b20 80%);margin-bottom:14px;padding:16px;text-align:center}' +
 '.lc44-preview-stage img{display:block;height:360px;width:100%;object-fit:contain}' +
 '.lc44-preview-stage p{color:#ecb9ff}' +
 '.lc44-preview-stage small{display:block;color:#bba5d2;padding-top:8px}';
 document.head.appendChild(style);
})();


/* 49.0: previews are not purchases or equipped inventory. */
const lc49BaseScreen=lc33Screen;
lc33Screen=function(){
 const html=lc49BaseScreen();
 const buttons=LC49_OUTFITS.map(([id,title,file])=>
  '<button type="button" data-lc49-outfit="'+id+'" class="'+(lc49SelectedOutfit===id?'active':'')+'" aria-pressed="'+(lc49SelectedOutfit===id?'true':'false')+'">'+
  '<img alt="" loading="lazy" src="./assets/character44/'+file+'" onerror="this.style.visibility=\'hidden\'">'+
  '<span>'+title+'</span></button>').join('');
 const choose='<section class="lc49-picker"><div class="lc49-title">Реалистичные образы · 50.0</div>'+
 '<div class="lc49-grid">'+buttons+'</div>'+
 '<p>Это бесплатный предпросмотр. Чтобы получить и надеть пять вещей, открой вкладку «Образы» ниже.</p></section>';
 return html.replace('<div class="lc33-tabs">',choose+'<div class="lc33-tabs">');
};
document.addEventListener('click',function(e){
 const btn=e.target.closest('[data-lc49-outfit]');
 if(!btn)return;
 const id=btn.dataset.lc49Outfit;
 if(!LC49_OUTFITS.some(o=>o[0]===id))return;
 lc49SelectedOutfit=id;
 lc39Preview=null;
 render();
});
const lc49Style=document.createElement('style');lc49Style.id='lc49-style';
lc49Style.textContent=
'.lc49-picker{margin:10px auto 16px;text-align:center;border:1px solid #6e438d;border-radius:17px;background:#19102caa;padding:10px}'+
'.lc49-title{font-weight:900;font-size:15px;margin:3px 0 10px;color:#f1d4ff}'+
'.lc49-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}'+
'.lc49-grid button{min-width:0;border-radius:12px;border:1px solid #7e4cac;background:linear-gradient(160deg,#34204b,#160d25);color:white;padding:5px;display:flex;flex-direction:column;align-items:center;cursor:pointer}'+
'.lc49-grid button.active{border-color:#e3b5ff;box-shadow:0 0 0 2px #a95aff77,0 0 16px #a75aff55}'+
'.lc49-grid img{width:100%;height:135px;object-fit:contain}'+
'.lc49-grid span{font-size:11px;font-weight:800;line-height:1.3;min-height:27px;display:flex;align-items:center;justify-content:center}'+
'.lc49-picker p{color:#cbb7dc;font-size:11px;line-height:1.5;margin:9px 2px 3px}';
document.head.appendChild(lc49Style);

/* 50.0: larger previews, transparent distinction between ownership and visual sampling */
const lc50Style=document.createElement('style');lc50Style.id='lc50-sets-style';
lc50Style.textContent=
'.lc50-set-card{overflow:hidden;padding:12px!important}'+
'.lc50-set-image{display:block;height:220px;max-width:100%;width:100%;object-fit:contain;margin:8px auto;border-radius:12px;background:radial-gradient(ellipse,#39245166,transparent 70%)}'+
'.lc50-piece-list{padding:7px 9px;list-style:none;margin:8px 0;display:grid;gap:5px;text-align:left;border:1px solid #6b477e88;border-radius:10px;background:#140e2588}'+
'.lc50-piece-list li{font-size:11px;color:#ebdcfc;line-height:1.4;overflow-wrap:anywhere}'+
'.lc50-piece-list li.owned{color:#a8e6cf}'+
'.lc50-premium-note{font-size:11px;color:#e9c6fc;line-height:1.4}'+
'.lc50-set-card .lc39-set-actions{display:flex;flex-direction:column;flex-wrap:nowrap;gap:8px;width:100%;margin-top:6px}'+
'.lc50-set-card .lc39-set-actions button{flex:0 0 auto!important;width:100%;min-width:0;min-height:43px;height:auto;box-sizing:border-box;display:block;padding:10px 7px;font-size:12px;line-height:1.35;white-space:normal;overflow-wrap:anywhere}'+
'.lc50-bundles .lc39-set-grid{grid-template-columns:minmax(0,1fr)!important;gap:14px!important}'+
'.lc50-bundles .lc50-set-card{min-width:0;width:100%;box-sizing:border-box;overflow:visible}'+
'.lc50-bundles .lc50-set-image{height:270px;max-height:48vh}'+
'.lc50-bundles .lc50-piece-list li{font-size:12px;line-height:1.5}'+
'.lc49-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}'+
'.lc49-grid img{height:165px!important}'+
'.lc49-picker{margin-bottom:12px!important}'+
'.lc33-figure .lc47-real-avatar{max-height:420px!important}'+
'@media(min-width:650px){.lc49-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.lc49-grid img{height:190px!important}}';
document.head.appendChild(lc50Style);


/* 47.0 Realistic-only viewport, no duplicate 44-46 photo panel. */
const lc47Style=document.createElement('style');lc47Style.id='lc47-realistic-character';lc47Style.textContent=
'.lc33-person{display:flex!important;align-items:center!important;justify-content:center!important;max-width:100%!important;width:100%!important;overflow:visible!important}'+
'.lc47-real-avatar{display:block!important;width:100%!important;height:100%!important;max-height:345px!important;object-fit:contain!important;object-position:center center!important;filter:drop-shadow(0 12px 18px #09041a99)}'+
'.lc39-preview-avatar .lc47-real-avatar{max-height:390px!important}'+
'.lc33-figure .lc47-real-avatar{max-height:310px!important}';document.head.appendChild(lc47Style);
