/* Lucky City — original melodic soundtracks, synthesized locally.
   No audio downloads or copyrighted recordings. User gesture required on iOS. */
(()=>{
'use strict';
const KEY='lucky_city_ambient_v1';
const AC=window.AudioContext||window.webkitAudioContext;
if(!AC)return;
let ctx,master,filter,delay,feedback,wet;
let enabled=false,volume=.14,scene='',timer=null,beat=0,nextTime=0;
try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');enabled=!!p.enabled;volume=Number.isFinite(p.volume)?Math.max(0,Math.min(.35,p.volume)):.14}catch{}
const tracks={
 city:{bpm:86,roots:[48,44,41,43],chords:[[0,4,7,11],[0,3,7,10],[0,4,7,11],[0,4,7,10]],melody:[7,null,11,12,11,null,7,4,7,null,10,12,10,7,3,null,7,null,11,14,12,null,11,7,7,10,12,null,10,7,4,null],wave:'sine'},
 games:{bpm:106,roots:[50,46,43,45],chords:[[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],melody:[12,10,7,null,10,12,15,12,10,null,7,5,7,10,12,null,12,15,17,15,12,10,7,null,10,12,10,7,5,null,7,null],wave:'triangle'},
 slot:{bpm:112,roots:[45,41,43,40],chords:[[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],melody:[12,null,15,19,17,15,12,null,10,12,15,null,12,10,7,null,12,15,19,null,22,19,17,15,12,null,10,12,15,12,10,null],wave:'triangle'},
 plinko:{bpm:124,roots:[50,46,43,45],chords:[[0,3,7,10],[0,4,7,10],[0,3,7,10],[0,4,7,10]],melody:[12,15,19,15,12,null,10,12,15,19,22,19,15,null,12,10,12,15,17,15,12,10,7,null,10,12,15,12,10,null,7,null],wave:'sine'},
 crash:{bpm:120,roots:[45,41,38,40],chords:[[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],melody:[12,null,12,15,19,null,15,12,10,null,12,15,17,15,12,null,12,null,15,19,22,19,17,15,12,null,10,12,15,null,12,null],wave:'sawtooth'},
 roulette:{bpm:98,roots:[48,43,44,41],chords:[[0,4,7,11],[0,4,7,10],[0,3,7,10],[0,4,7,11]],melody:[7,null,11,14,12,null,11,7,9,12,16,null,14,12,9,null,7,11,14,16,14,null,11,9,7,null,9,12,11,7,null,null],wave:'sine'},
 calm:{bpm:78,roots:[48,44,41,43],chords:[[0,4,7,11],[0,3,7,10],[0,4,7,11],[0,4,7,10]],melody:[7,null,null,11,12,null,11,null,7,null,4,null,7,null,null,null,11,null,12,null,14,null,12,null,11,null,7,null,4,null,null,null],wave:'sine'}
};
function currentScene(){
 try{
  if(typeof tab==='string'){
   if(tab==='game'){
    const i=typeof selected==='number'?selected:-1;
    if(i>=0&&i<6)return 'slot:'+i;
    const name=typeof GAMES!=='undefined'&&GAMES[i]?String(GAMES[i][1]).toLowerCase():'';
    if(name.includes('plinko'))return 'plinko';
    if(name.includes('crash'))return 'crash';
    if(name.includes('roulette'))return 'roulette';
    return 'games';
   }
   if(tab==='city')return 'city';
   if(tab==='games')return 'games';
   return 'calm';
  }
 }catch{}
 return 'city';
}
function setup(){
 if(ctx)return;
 ctx=new AC();
 master=ctx.createGain();master.gain.value=0;
 filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=3400;filter.Q.value=.35;
 delay=ctx.createDelay(.8);delay.delayTime.value=.29;
 feedback=ctx.createGain();feedback.gain.value=.11;
 wet=ctx.createGain();wet.gain.value=.10;
 filter.connect(master);filter.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
 master.connect(ctx.destination);
}
function tone(midi,when,dur,amp,wave='sine',attack=.035){
 if(!ctx||when<ctx.currentTime-.1)return;
 const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
 o.type=wave;o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),when);
 const a=Math.min(attack,dur*.4);
 g.gain.setValueAtTime(.00001,when);
 g.gain.linearRampToValueAtTime(amp,when+a);
 g.gain.exponentialRampToValueAtTime(.00001,when+dur);
 f.type='lowpass';f.frequency.value=wave==='sawtooth'?1200:3600;o.connect(f);f.connect(g);g.connect(filter);
 o.start(when);o.stop(when+dur+.02);
}
function playBeat(at){
 const kind=scene.split(':')[0];
 const t=tracks[kind]||tracks.city;
 const b=beat%32,bar=Math.floor(b/8)%4,root=t.roots[bar],chord=t.chords[bar];
 const beatSec=60/t.bpm/2;
 // Original arrangements: soft electric piano, plucked bells, warm pads and restrained bass.
 if(b%8===0){
  chord.forEach((interval,i)=>{
   const note=root+interval+12;
   tone(note,at,beatSec*7.7,kind==='city'?.008:.006,'sine',.55);
   if(i<3)tone(note+12,at+.035,beatSec*6.8,.0035,'triangle',.7);
  });
  tone(root-12,at,beatSec*7.4,kind==='crash'?.045:.06,'sine',.10);
 }
 const patterns={
  city:[0,null,2,null,1,null,3,null],
  games:[0,2,1,3,0,2,3,1],
  slot:[0,2,1,3,2,0,3,1],
  plinko:[0,1,2,3,2,1,3,2],
  crash:[0,null,null,2,1,null,null,3],
  roulette:[0,null,2,1,null,3,2,null],
  calm:[0,null,null,2,null,1,null,3]
 };
 const order=(patterns[kind]||patterns.city)[b%8];
 if(order!==null){
  const n=root+chord[order]+12;
  const pluck=kind==='plinko'||kind==='slot';
  tone(n,at,beatSec*(pluck?.82:1.55),pluck?.021:.016,kind==='crash'?'triangle':'sine',.012);
  if(pluck)tone(n+12,at+.012,beatSec*.55,.005,'triangle',.006);
 }
 // Melodic lead: different timbres and phrasing for each game.
 const n=t.melody[b];
 if(n!==null){
  const note=root+n+12;
  const lead=kind==='crash'?'triangle':kind==='slot'?'triangle':'sine';
  const strength=kind==='calm'?.022:kind==='crash'?.028:.035;
  tone(note,at,beatSec*(b%4===0?2.8:1.6),strength,lead,.035);
  if(kind==='city'||kind==='roulette')tone(note+12,at+.045,beatSec*1.3,.005,'sine',.045);
 }
 // Musical accents without harsh noise or disruptive effects.
 if(kind==='slot'&&b%8===4)tone(root+31,at,beatSec*.65,.012,'triangle',.009);
 if(kind==='plinko'&&b%4===2)tone(root+36,at,beatSec*.52,.012,'sine',.009);
 if(kind==='crash'&&b%4===0)tone(root-24,at,beatSec*1.3,.034,'sine',.015);
 if(kind==='roulette'&&b%8===6)tone(root+28,at,beatSec*2.3,.009,'sine',.08);
 beat++;
}
function tick(){
 if(!ctx||!enabled||ctx.state!=='running')return;
 const next=currentScene();
 if(next!==scene){scene=next;beat=0;nextTime=ctx.currentTime+.07}
 const t=tracks[scene.split(':')[0]]||tracks.city;
 let count=0;
 while(nextTime<ctx.currentTime+.32&&count++<8){
  playBeat(nextTime);nextTime+=60/t.bpm/2;
 }
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify({enabled,volume}))}catch{}}
function start(){
 if(enabled){
  setup();master.gain.setTargetAtTime(volume,ctx.currentTime,.22);
  ctx.resume().then(()=>{if(!timer){scene='';nextTime=ctx.currentTime+.08;timer=setInterval(tick,110)}tick()}).catch(()=>{});
 }else{
  if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.12);
  if(timer){clearInterval(timer);timer=null}
 }
}
function draw(){
 let b=document.getElementById('lc-music-control');
 if(!b){
  b=document.createElement('button');b.id='lc-music-control';b.type='button';
  b.style.cssText='position:fixed;right:14px;bottom:calc(80px + env(safe-area-inset-bottom, 0px));z-index:9999;border:1px solid #9d77db;background:#211633e8;color:#f4e8ff;border-radius:24px;padding:9px 13px;font:600 13px system-ui;box-shadow:0 4px 18px #0006';
  b.addEventListener('click',()=>{enabled=!enabled;persist();start();draw()});document.body.appendChild(b);
 }
 b.textContent=enabled?'♫ Музыка: вкл':'♫ Музыка: выкл';b.setAttribute('aria-pressed',String(enabled));
}
document.addEventListener('visibilitychange',()=>{
 if(!ctx)return;
 if(document.hidden){if(timer){clearInterval(timer);timer=null}ctx.suspend().catch(()=>{})}
 else if(enabled)start();
});
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);timer=null;if(ctx)ctx.suspend().catch(()=>{})});
window.LuckyCityAudio={
 enable(){enabled=true;persist();start();draw()},
 disable(){enabled=false;persist();start();draw()},
 setVolume(v){volume=Math.max(0,Math.min(.35,Number(v)||0));persist();if(master&&ctx)master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.15)}
};
draw();
document.addEventListener('pointerdown',()=>{if(enabled&&(!ctx||ctx.state!=='running'))start()},{passive:true});
})();
