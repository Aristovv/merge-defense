/* Lucky City: procedural clan scenes. Distinct details evolve at every level. */
(()=>{
const svg=(body)=>'<svg role="img" aria-label="Визуальный уровень постройки" viewBox="0 0 320 184" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;max-height:210px;border-radius:12px"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#26154d"/><stop offset="1" stop-color="#5b3663"/></linearGradient><linearGradient id="wallpaint" x2="0" y2="1"><stop stop-color="#dad0bd"/><stop offset="1" stop-color="#706277"/></linearGradient></defs><rect width="320" height="184" fill="url(#sky)"/><circle cx="255" cy="27" r="15" fill="#eac58c" opacity=".55"/><path d="M0 135Q60 116 120 136T320 128V184H0" fill="#25283d"/>'+body+'</svg>';
const rect=(x,y,w,h,fill,stroke='#0005',rx=0)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+rx+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.5"/>';
const line=(x1,y1,x2,y2,color='#0006',sw=2)=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="'+sw+'"/>';
function headquarters(level){
 const tier=level<=3?0:level<=14?1:level<=15?2:level<=25?3:level<=35?4:level<=45?5:6;
 const bg=['#75614e','#9a8575','#99877d','#b5a39a','#d0beb2','#cbc3ce','#b3c8dd'][tier];
 const roofs=['#523c39','#574d56','#4a4349','#424253','#36374d','#272d52','#20263e'];
 let out='';
 if(tier>=3)out+=rect(66,76,188,90,'#746c65')+rect(85,59,150,94,bg);
 else out+=rect(tier===0?72:52,tier===0?86:69,tier===0?176:216,95,bg);
 if(tier===0){
  out+='<polygon points="62,93 159,42 256,93" fill="'+roofs[tier]+'" stroke="#291e2b" stroke-width="4"/>';
  for(let i=0;i<level+2;i++)out+=line(73+i*21,90,67+i*21,170,'#413027',3);
  if(level>=2)out+=rect(91,100,38,39,'#7c6254');
  if(level>=3)out+=rect(181,105,37,36,'#a38c71');
 }else{
  out+='<polygon points="'+(tier>=3?'75,73 160,26 245,73':'43,77 160,31 277,77')+'" fill="'+roofs[tier]+'" stroke="#312b3f" stroke-width="4"/>';
  out+=rect(133,103,56,65,tier>=3?'#513a4f':'#5b4c46','#221c31',3);
  if(level>=5)out+=rect(67,93,36,32,level>=8?'#d3e7f0':'#343846');
  if(level>=9)out+=rect(215,93,36,32,'#b2d8e8');
  if(level>=11)out+=rect(125,150,72,11,'#74664b');
  if(level>=12)out+=rect(205,138,17,19,'#6c8496');
  if(level>=13)out+=rect(146,110,9,46,'#bca381');
  if(level>=14)out+=rect(176,127,7,12,'#91e6df');
  if(level>=15)out+=rect(119,84,82,7,'#eadfc4');
 }
 const phase=level%10;
 for(let i=0;i<phase;i++){
  const x=23+(i%5)*65,y=166-Math.floor(i/5)*10;
  out+='<circle cx="'+x+'" cy="'+y+'" r="2.8" fill="'+(tier>=4?'#e8d5a4':'#836d63')+'"/>';
 }
 if(level>=16){
  const windows=Math.min(12,2+Math.floor((level-16)/3));
  for(let i=0;i<windows;i++){
   const x=75+(i%6)*31,y=87+Math.floor(i/6)*26;
   if(x>115&&x<196)continue;
   out+=rect(x,y,17,18,level>=36?'#fce6ae':'#8ab9cf','#473b53',2);
  }
 }
 if(level>=26)out+='<path d="M57 169H263" stroke="#b5ab9a" stroke-width="9"/>';
 if(level>=36)out+='<path d="M68 80L160 25L251 80" stroke="#e4c784" stroke-width="4" fill="none"/>';
 if(level>=46)out+='<path d="M160 17L165 28H177L168 36L172 46L160 40L148 46L152 36L143 28H155Z" fill="#74f0df" stroke="#f9eac1" stroke-width="1"/>';
 return svg(out);
}
function wall(level){
 const material=level<=3?'#725a42':level<=9?'#9a805c':level<=15?'#8e5e40':level<=25?'#7a858c':level<=35?'#9c9aa3':level<=40?'#bccbd1':level<=44?'#ceaf56':level<=47?'#79b9e6':'#79e9b7';
 let out='';
 if(level<4){
  for(let i=0;i<level+2;i++){
   let x=82+i*32;
   out+='<path d="M'+x+' 150l13 -'+(8+level*7)+' 15 '+(5+level*4)+'" stroke="#80634b" stroke-width="'+(5+level*2)+'" fill="none"/>';
  }
 }else{
  const count=Math.min(24,4+Math.floor((level-4)/2));
  const height=47+Math.min(37,level);
  const gap=232/count;
  for(let i=0;i<count;i++){
   let x=44+i*gap;
   out+=rect(x,156-height,Math.max(7,gap-2),height,material,'#272336');
   if(level>=7&&level<=9)out+=line(x+1,100,x+gap/2,94,'#d9d9da',1.5);
   if(level>=16)out+=rect(x+1,156-height+8,Math.max(4,gap-5),2,level>=41?'#f8e3a6':'#353744','none');
  }
  if(level>=10)out+=rect(34,155,252,10,material);
  if(level>=8)out+='<path d="M28 164Q160 '+(178-Math.min(15,level-8))+' 292 164" stroke="#111c2e" fill="none" stroke-width="'+Math.min(13,level-4)+'"/>';
  if(level>=15)out+='<path d="M24 171Q160 160 297 171" stroke="#61b7da" stroke-width="7" fill="none"/>';
  if(level>=26)out+=rect(24,92,272,8,'#535260');
  if(level>=36)out+=rect(153,96,15,57,'#e0c480');
 }
 const features=level%10;
 for(let i=0;i<features;i++){
  out+='<circle cx="'+(33+i*28)+'" cy="'+(154-i%2*5)+'" r="'+(2+(level>35?1:0))+'" fill="'+(level>=48?'#64ffcb':'#d7b385')+'"/>';
 }
 if(level>=45)out+='<path d="M156 87l5 9 10 2-8 7 2 11-9-5-9 5 2-11-8-7 10-2Z" fill="'+(level>=48?'#78ffe0':'#f5db87')+'"/>';
 return svg(out);
}
window.LuckyClanScene={headquarters,wall};
})();
