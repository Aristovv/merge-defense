'use strict';

const {collectIncome}=require('./casino-authoritative-economy.cjs');

function activateBooster(save,kind,now=Date.now()){
 if(!['income','xp'].includes(kind))
  throw Error('INVALID_BOOSTER');

 let next=structuredClone(save);

 if(!next.liveCity14?.inventory?.includes(kind))
  throw Error('NO_BOOSTER');

 if(kind==='income'){
  next=collectIncome(next,now,true).save;
 }

 const x=next.liveCity14;
 const index=x.inventory.indexOf(kind);

 if(index<0)throw Error('NO_BOOSTER');

 const activeUntil=Number(x.boosts?.[kind])||0;
 if(activeUntil>now+90*60000)throw Error('BOOSTER_QUEUE_LIMIT');
 x.inventory.splice(index,1);
 x.boosts??={};
 x.boostsStarted??={};

 const previous=Number(x.boosts[kind])||0;

 if(previous<=now)
  x.boostsStarted[kind]=now;

 x.boosts[kind]=Math.max(now,previous)+1800000;

 next.stamp=now;

 return {
  save:next,
  kind,
  expiresAt:x.boosts[kind]
 };
}

module.exports={activateBooster};
