/* Lucky City original generative ambient soundtrack — no third-party audio assets. */
(()=>{
const KEY='lucky_city_ambient_v1',AudioContext=window.AudioContext||window.webkitAudioContext;
if(!AudioContext)return;
let ctx,master,enabled=false,volume=.14,scene='',timer=0,step=0;
try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');enabled=!!p.enabled;volume=Number.isFinite(p.volume)?Math.max(0,Math.min(.35,p.volume)):.14}catch{}
const scales={city:[48,55,60,62,67,72],games:[50,57,60,65,69,72],game:[45,52,57,60,64,69],profile:[48,55,60,64,67],top:[50,57,62,65,69],quests:[48,55,60,65,67]};
function persist(){localStorage.setItem(KEY,JSON.stringify({enabled,volume}))}
function note(midi,at,duration,level,kind='sine'){
 if(!ctx||!master)return;
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=kind;o.frequency.setValueAtTime(440*Math.pow(2,(midi-69)/12),at);
 g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,level),at+.09);
 g.gain.exponentialRampToValueAtTime(.0001,at+duration);
 o.connect(g);g.connect(master);o.start(at);o.stop(at+duration+.03);
}
function currentScene(){
 try{if(typeof tab==='string'){if(tab==='game')return 'game:'+String(typeof selected==='number'?selected:0);return tab}}catch{}
 return 'city';
}
function play(){
 if(!ctx||!enabled||ctx.state!=='running')return;
 const next=currentScene();if(next!==scene){scene=next;step=0}
 const key=scene.startsWith('game:')?'game':scene,notes=scales[key]||scales.city;
 const variation=scene.startsWith('game:')?(Number(scene.split(':')[1])||0):0;
 const t=ctx.currentTime+.035,root=notes[(step+variation)%notes.length];
 note(root-12,t,2.6,.15,'sine');
 if(step%2===0)note(root,t+.22,2.3,.07,'triangle');
 if(step%4===0)note(notes[(step+2+variation)%notes.length]+12,t+.7,1.8,.035,'sine');
 step++;
}
function start(){
 if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.connect(ctx.destination)}
 master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.18);
 if(enabled){ctx.resume().catch(()=>{});if(!timer){play();timer=setInterval(play,2750)}}
 else if(timer){clearInterval(timer);timer=0}
}
function toggle(){enabled=!enabled;persist();start();draw()}
function draw(){
 let b=document.getElementById('lc-music-control');
 if(!b){b=document.createElement('button');b.id='lc-music-control';b.type='button';b.style.cssText='position:fixed;right:14px;bottom:calc(80px + env(safe-area-inset-bottom, 0px));z-index:9999;border:1px solid #9d77db;background:#211633e8;color:#f4e8ff;border-radius:24px;padding:9px 13px;font:600 13px system-ui;box-shadow:0 4px 18px #0006';b.addEventListener('click',toggle);document.body.appendChild(b)}
 b.textContent=enabled?'♫ Музыка: вкл':'♫ Музыка: выкл';b.setAttribute('aria-pressed',String(enabled));
}
document.addEventListener('visibilitychange',()=>{if(ctx){if(document.hidden)ctx.suspend();else if(enabled)ctx.resume().catch(()=>{})}});
window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);timer=0;if(ctx)ctx.suspend()});
window.LuckyCityAudio={enable(){enabled=true;persist();start();draw()},disable(){enabled=false;persist();start();draw()},setVolume(v){volume=Math.max(0,Math.min(.35,Number(v)||0));persist();if(master&&ctx)master.gain.setTargetAtTime(enabled?volume:0,ctx.currentTime,.15)}};
draw();
document.addEventListener('pointerdown',()=>{if(enabled&&(!ctx||ctx.state!=='running'))start()},{passive:true});
})();