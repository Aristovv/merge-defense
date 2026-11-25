'use strict';

const {randomInt}=require('node:crypto');

function openChest(save,withKey=false,now=Date.now()){
 const next=structuredClone(save);
 const x=next.liveCity14;

 if(!x)throw Error('REWARD_NOT_READY');
 if(typeof withKey!=='boolean')throw Error('INVALID_KEY');

 x.inventory??=[];
 x.history??=[];

 const day=new Date(now).toISOString().slice(0,10);

 if(!x.daily||x.daily.key!==day)x.daily={key:day,games:[],rounds:0,builds:0,hot:0,claims:[]};

 if(withKey){
  const i=x.inventory.indexOf('chest');
  if(i<0)throw Error('NO_CHEST_KEY');
  x.inventory.splice(i,1);
 }else{
  if(now>0&&now<(x.nextChestAt||0))
   throw Error('CHEST_COOLDOWN');
  x.nextChestAt=now+8*3600000;
 }

 x.daily.chests=(x.daily.chests||0)+1;

 const roll=randomInt(100);
 let tier,symbol,label;

 if(roll<57){
  const amount=120+randomInt(181);
  next.chips+=amount;
  tier='ОБЫЧНЫЙ';
  symbol='◈';
  label='+'+amount+' фишек';

 }else if(roll<82){
  const amount=150+randomInt(251);
  next.coins+=amount;
  tier='НЕОБЫЧНЫЙ';
  symbol='✦';
  label='+'+amount+' монет';

 }else if(roll<96){
  const kind=randomInt(2)?'xp':'income';
  tier='РЕДКИЙ';
  symbol='◆';

  if(x.inventory.length>=25){
   next.chips+=80;
   label='80 фишек (инвентарь полон)';
  }else{
   x.inventory.push(kind);
   label=kind==='xp'?'Бустер опыта':'Бустер дохода';
  }

 }else{
  next.vip+=1;
  tier='ЛЕГЕНДАРНЫЙ';
  symbol='♛';
  label='+1 коллекционный VIP';
 }

 for(const key of ['chips','coins','vip']){
  if(!Number.isSafeInteger(next[key])||next[key]<0)
   throw Error('BALANCE_LIMIT');
 }

 const reward={tier,symbol,label};
 x.history.unshift({at:now,...reward});
 x.history=x.history.slice(0,8);
 next.stamp=now;

 return {save:next,reward};
}

module.exports={openChest};
