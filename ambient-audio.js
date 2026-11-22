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
 crash:{bpm:122,roots:[45,41,38,40],chords:[[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],melody:[12,null,12,15,19,null,15,12,10,null,12,15,17,15,12,null,12,null,15,19,22,19,17,15,12,null,10,12,15,null,12,null],wave:'triangle'},
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
 filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2700;filter.Q.value=.35;
 delay=ctx.createDelay(.8);delay.delayTime.value=.32;
 feedback=ctx.createGain();feedback.gain.value=.18;
 wet=ctx.createGain();wet.gain.value=.14;
 filter.connect(master);filter.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(master);
 master.connect(ctx.destination);
}
function tone(midi,when,dur,amp,wave='sine',attack=.035){
 if(!ctx||when<ctx.currentTime-.1)return;
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=wave;o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),when);
 const a=Math.min(attack,dur*.4);
 g.gain.setValueAtTime(.00001,when);
 g.gain.linearRampToValueAtTime(amp,when+a);
 g.gain.exponentialRampToValueAtTime(.00001,when+dur);
 o.connect(g);g.connect(filter);
 o.start(when);o.stop(when+dur+.02);
}
function playBeat(at){
 const t=tracks[scene.split(':')[0]]||tracks.city;
 const b=beat%32,bar=Math.floor(b/8)%4,root=t.roots[bar],chord=t.chords[bar];
 const beatSec=60/t.bpm/2;
 // Soft sustained chord every four beats, giving the melody clear harmony.
 if(b%8===0){
  chord.forEach((interval,i)=>tone(root+interval+12,at,beatSec*7.5,.013,i%2?'sine':'triangle',.5));
  tone(root-12,at,beatSec*7.2,.08,'sine',.08);
 }
 // A consistent, recognizable arpeggio, varied per musical scene.
 if(b%2===0){
  const order=[0,2,1,3],n=chord[order[(b/2)%4]];
  tone(root+n+12,at,beatSec*1.65,.025,t.wave,.025);
 }
 const n=t.melody[b];
 if(n!==null)tone(root+n+12,at,beatSec*(b%4===0?2.8:1.7),.052,t.wave,.035);
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
