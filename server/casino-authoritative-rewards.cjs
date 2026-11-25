'use strict';

function adaptiveQuestCoins(base,income,weekly=false){return base+Math.floor(Math.min(100000000,Math.max(0,Number(income)||0))*(weekly?0.5:0.05))}
function claimReward(save,kind,index,now=Date.now()){
 const next=structuredClone(save);
 const x=next.liveCity14;

 if(!x)throw Error('REWARD_NOT_READY');

 const date=new Date(now);
 const day=date.toISOString().slice(0,10);
 date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 const week=date.toISOString().slice(0,10);

 let chips=0,coins=0;

 if(kind==='daily'){
  const d=x.daily;
  if(!d||d.key!==day)throw Error('REWARD_NOT_READY');

  const goals=[
   [d.games?.length||0,4,180,80],
   [d.rounds||0,8,220,60],
   [d.chests||0,1,180,90]
  ];

  if(!Number.isInteger(index)||!goals[index])
   throw Error('INVALID_REWARD');

  d.claims??=[];

  if(d.claims.includes(index))
   throw Error('ALREADY_CLAIMED');

  const [value,goal,c,m]=goals[index];

  if(value<goal)throw Error('REWARD_NOT_READY');

  d.claims.push(index);
  chips=c;
  coins=m;

 }else if(kind==='weekly'){
  const w=x.week;

  if(!w||w.key!==week||w.rounds<30||w.wins<8)
   throw Error('REWARD_NOT_READY');

  if(w.claimed)throw Error('ALREADY_CLAIMED');

  w.claimed=true;
  chips=900;
  coins=400;

  x.inventory??=[];

  if(x.inventory.length>=25)chips+=80;
  else x.inventory.push('chest');

 }else throw Error('INVALID_REWARD');

 coins=adaptiveQuestCoins(coins,require('./casino-authoritative-economy.cjs').hourlyRate(next),kind==='weekly');
 next.chips+=chips;
 next.coins+=coins;
 next.stamp=now;

 if(!Number.isSafeInteger(next.chips)||
    !Number.isSafeInteger(next.coins))
  throw Error('BALANCE_LIMIT');

 return {save:next,chips,coins};
}

module.exports={claimReward};
