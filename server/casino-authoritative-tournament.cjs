'use strict';

function applyTournamentReward(save,receipt,reward,place,now=Date.now()){
 const next=structuredClone(save);

 if(!Array.isArray(next.tournamentReceipts))
  next.tournamentReceipts=[];

 if(next.tournamentReceipts.includes(receipt))
  return {save:next,alreadyApplied:true};

 for(const key of ['chips','coins','vip']){
  const amount=Number(reward[key]??0);

  if(!Number.isSafeInteger(amount)||amount<0||
     !Number.isSafeInteger(next[key])||
     !Number.isSafeInteger(next[key]+amount))
   throw Error('INVALID_TOURNAMENT_REWARD');

  next[key]+=amount;
 }

 next.tournamentReceipts.push(receipt);

 if(!Array.isArray(next.tournamentBadges))
  next.tournamentBadges=[];

 if(reward.badge)
  next.tournamentBadges.push({
   receipt,title:reward.badge,place
  });

 next.stamp=now;

 return {save:next,alreadyApplied:false};
}

module.exports={applyTournamentReward};
