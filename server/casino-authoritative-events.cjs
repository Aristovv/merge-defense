'use strict';

const EVENTS=[
 {chips:150,coins:150,booster:true},
 {chips:250,coins:0},
 {chips:100,coins:250},
 {chips:200,coins:100}
];

function claimEvent(save,now=Date.now()){
 const next=structuredClone(save);
 const x=next.liveCity14;

 if(!x)throw Error('REWARD_NOT_READY');

 const day=new Date(now).toISOString().slice(0,10);

 if(x.eventClaimed===day)
  throw Error('ALREADY_CLAIMED');

 const event=EVENTS[Number(day.replace(/-/g,''))%EVENTS.length];

 x.eventClaimed=day;
 next.chips+=event.chips;
 next.coins+=event.coins;

 if(event.booster){
  x.inventory??=[];
  if(x.inventory.length>=25)
   next.chips+=80;
  else
   x.inventory.push('income');
 }

 for(const key of ['chips','coins']){
  if(!Number.isSafeInteger(next[key])||next[key]<0)
   throw Error('BALANCE_LIMIT');
 }

 next.stamp=now;

 return {save:next,event};
}

module.exports={claimEvent};
