'use strict';
// Pure round accounting; not exposed to the legacy client.
// Outcome generation and accounting must run inside the server transaction.
function applyCompletedRound(save,{game,stake,payout,description,now,freeSpin=false}){
 if(!Number.isInteger(game)||game<0||game>15||!Number.isSafeInteger(stake)||(freeSpin?stake!==0||game>5:stake<1)||
 !Number.isSafeInteger(payout)||payout<0||!Number.isSafeInteger(now))throw Error('INVALID_ROUND');
 if(save.pendingMiniRound)throw Error('ROUND_PENDING');
 if(!Number.isSafeInteger(save.chips)||save.chips<stake)throw Error('INSUFFICIENT_CHIPS');
 const next=structuredClone(save),won=!freeSpin&&payout>stake;
 const add=(a,b)=>{const n=(a||0)+b;if(!Number.isSafeInteger(n)||n<0)throw Error('BALANCE_LIMIT');return n};
 next.chips=add(next.chips-stake,payout);
 next.plays=add(next.plays,freeSpin?0:1);next.wins=add(next.wins,won?1:0);
 next.earned=add(next.earned,payout);next.best=Math.max(next.best||0,payout);
 const date=new Date(now),day=date.toISOString().slice(0,10);
 date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 const week=date.toISOString().slice(0,10);
 next.questPeriods??={};
 for(const [scope,key] of [['daily',day],['weekly',week]]){
  let p=next.questPeriods[scope];
  if(!p||p.key!==key||!p.counts||!Array.isArray(p.claimed))p=next.questPeriods[scope]={key,counts:{plays:0,wins:0,builds:0},claimed:[]};
  p.counts.plays=add(p.counts.plays,freeSpin?0:1);p.counts.wins=add(p.counts.wins,won?1:0);
 }
 next.liveCity14??={};const x=next.liveCity14;
 if(!x.daily||x.daily.key!==day)x.daily={key:day,games:[],rounds:0,builds:0,hot:0,claims:[]};
 if(!x.week||x.week.key!==week)x.week={key:week,rounds:0,wins:0,claimed:false};
 if(!freeSpin){
  x.daily.rounds=add(x.daily.rounds,1);x.week.rounds=add(x.week.rounds,1);
  x.week.wins=add(x.week.wins,won?1:0);
  if(!x.daily.games.includes(game))x.daily.games.push(game);
  if(game===(Number(day.replaceAll('-',''))*17+7)%16&&x.daily.hot<3){x.daily.hot++;next.chips=add(next.chips,35)}
 }
 if(!freeSpin&&next.level<500&&x.daily.rounds<=200){
  next.xp=add(next.xp,Number(x.boosts?.xp)>now?6:4);
  while(next.level<500){const need=420+next.level*110+next.level*next.level*8;if(next.xp<need)break;next.xp-=need;next.level++;next.chips=add(next.chips,100+next.level*20)}
 }
 if(next.level>=500)next.xp=0;
 next.casinoGameStats??={};const old=next.casinoGameStats[game]||{};
 next.casinoGameStats[game]={rounds:add(old.rounds,1),wins:add(old.wins,won?1:0),spent:add(old.spent,stake),received:add(old.received,payout),best:Math.max(old.best||0,payout)};
 next.casinoGameHistory=[{game,stake,payout,result:String(description||'').slice(0,130),at:now},...(next.casinoGameHistory||[])].slice(0,40);
 if(!Array.isArray(next.collect))next.collect=[];
 const existing=new Set(next.collect);
 for(let i=1;i<=Math.min(10000,Math.floor(next.plays/12));i++){const k='slot-'+i;if(!existing.has(k)){next.collect.push(k);existing.add(k);next.vip=add(next.vip,1)}}
 next.stamp=now;
 return next;
}
module.exports={applyCompletedRound};
