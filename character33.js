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
 ['cap-noir','hat','Кепка Noir','Редкая',35000,'coin','#16172d','cap'],
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
 ['jacket-black','jacket','Бомбер Blackout','Редкая',45000,'coin','#121525','varsity'],
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
 ['cargo-violet','pants','Карго Violet','Эпическая',260000,'coin','#7c42ba','cargo'],
 ['pants-goldline','pants','Брюки Goldline','Легендарная',700000,'coin','#58407a','royalpants'],
 ['pants-diamond','pants','Брюки Diamond','Легендарная',1200000,'coin','#6db4d2','royalpants'],
 ['cargo-abyss','pants','Карго Abyss','Мифическая',2800000,'coin','#171e37','cargo'],
 ['pants-emperor','pants','Брюки Императора','Мифическая',4500000,'coin','#b68a30','royalpants'],
 ['pants-vip','pants','Джинсы VIP','Эпическая',5,'premium','#895bce','jeans'],
 ['cargo-neon-vip','pants','Карго Neon','Эпическая',7,'premium','#6c4bea','cargo'],
 ['pants-royal-vip','pants','Брюки Crown','Легендарная',12,'premium','#d29c44','royalpants'],
 ['pants-galaxy','pants','Брюки Galaxy','Легендарная',17,'premium','#6c62cf','royalpants'],
 // Shoes
 ['shoes-black','shoes','Кроссовки Black','Редкая',30000,'coin','#292538','sneakers'],
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
 ['chain-silver','accessory','Цепь Silver','Редкая',90000,'coin','#c1c7e1','chain'],
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
function lc33AvatarFallback(){
 const c=lc33State(),get=type=>LC33_GOODS.find(x=>x.id===c.equipped[type]);
 const hat=get('hat'),jacket=get('jacket'),pants=get('pants'),shoes=get('shoes'),acc=get('accessory');
 const h=hat?.color||'#191934',j=jacket?.color||'#181a39',p=pants?.color||'#25223c',s=shoes?.color||'#fff3e9',a=acc?.color||'#ffc045';
 const hatId=hat?.id||'cap',accId=acc?.id||'headphones';
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
 const jacketId=jacket?.id||'varsity',pantId=pants?.id||'jeans',shoeId=shoes?.id||'sneakers';
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
// Restore reliable inline art for Safari / VK WebView: external SVG <use>
// rendered tiny thumbnails and unresolved gradients on iPhone.
function lc33Avatar(){return lc33AvatarFallback();}
function lc34SvgItem(g){return lc33SvgItem(g);}
function lc33Screen(){
 const c=lc33State(),active=LC33_GROUPS.find(g=>g[0]===lc33Category)||LC33_GROUPS[0];
 const list=LC33_GOODS.filter(g=>g.type===lc33Category&&g.payment!=='locked');
 const selected=list.find(g=>g.id===lc33Selected)||list.find(g=>g.id===c.equipped[lc33Category])||list[0];
 const cards=list.map(g=>{
  const owned=c.owned.includes(g.id),equipped=c.equipped[g.type]===g.id;
  const rarity=g.rarity==='Редкая'?'rare':g.rarity==='Эпическая'?'epic':g.rarity==='Легендарная'?'legend':'';
  const action=equipped?'✓ Надето':owned?'Надеть':g.payment==='coin'?fmt(g.price)+' 🪙':g.payment==='premium'?'🔒 '+g.price+' гол.':'Пока недоступно';
  return '<article class="lc33-item '+rarity+(equipped?' on':'')+'"><span class="rar">'+rankEsc(g.rarity)+'</span>'+lc34SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong>'+
   '<button data-lc33-item="'+g.id+'"'+(equipped?' disabled':'')+'>'+action+'</button></article>';
 }).join('');
 const view=lc33Subtab==='wardrobe'?
  '<div class="lc33-stage"><aside class="lc33-cats">'+LC33_GROUPS.map(g=>'<button data-lc33-cat="'+g[0]+'" class="'+(lc33Category===g[0]?'active':'')+'">'+g[2]+' '+g[1]+'</button>').join('')+'</aside>'+
  '<div class="lc33-figure"><div class="lc33-city">✧ ✦ ✧</div><div class="lc33-halo"></div><div class="lc33-person">'+lc33Avatar()+'</div></div>'+
  '<div class="lc33-side"><div>🪙 Бонус дохода<b>0% · только стиль</b></div><div>👕 Вещей в коллекции<b>'+c.owned.length+' предметов</b></div><div>👑 Активный образ<b>LUCKY CITY</b></div></div></div>'+
  '<section class="lc33-section"><h2>'+rankEsc(active[2])+' '+rankEsc(active[1])+'</h2><div class="lc33-items">'+cards+'</div>'+
  (selected?'<div class="lc33-detail">'+lc34SvgItem(selected)+'<div><strong>'+rankEsc(selected.name)+'</strong><p>'+rankEsc(selected.rarity)+' · '+(selected.payment==='premium'?'Премиальный внешний вид':selected.payment==='coin'?'Покупается за игровые монеты':'Стиль персонажа')+'</p><small>Одежда не влияет на шанс выигрыша</small></div></div>':'')+'</section>':
  '<section class="lc33-section"><h2>'+(lc33Subtab==='collection'?'Моя коллекция':'Бонусы персонажа')+'</h2>'+
  (lc33Subtab==='collection'?'<div class="lc33-items">'+LC33_GOODS.filter(g=>c.owned.includes(g.id)).map(g=>'<article class="lc33-item">'+lc34SvgItem(g)+'<strong>'+rankEsc(g.name)+'</strong><button data-lc33-cat="'+g.type+'">Посмотреть</button></article>').join('')+'</div>':
   '<div class="lc33-empty">Персонаж пока косметический: одежда не влияет на выигрыш или доход. Дополнительные бонусы ещё не подключены.</div>')+'</section>';
 return '<main class="lc33"><div class="lc33-hero"><h1>ПЕРСОНАЖ</h1></div>'+
 '<div class="lc33-tabs">'+[['wardrobe','♧ Гардероб'],['collection','♛ Коллекция'],['bonuses','✧ Бонусы']].map(([id,name])=>'<button class="'+(lc33Subtab===id?'active':'')+'" data-lc33-tab="'+id+'">'+name+'</button>').join('')+'</div>'+view+'</main>';
}
document.addEventListener('click',function(e){
 const t=e.target.closest('[data-lc33-tab]');if(t){lc33Subtab=t.dataset.lc33Tab;render();return}
 const g=e.target.closest('[data-lc33-cat]');if(g){lc33Category=g.dataset.lc33Cat;lc33Selected=lc33State().equipped[lc33Category]||LC33_GOODS.find(x=>x.type===lc33Category&&x.payment!=='locked')?.id||'cap';lc33Subtab='wardrobe';render();return}
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
