'use strict';
// Pure server-side economy rules. Not wired into the legacy client yet.
const BASE=[1200,1600,2400,3400,4200,5400,8200,10000,13800,17500,21000,27000,34000,43000];
const REWARDS=new Map([[5,[180,350]],[10,[300,500]],[20,[450,700]],[35,[650,900]],[50,[900,1200]],[75,[1300,1700]],[100,[1800,2200]],[150,[2500,3000]],[200,[3500,4200]],[250,[4500,5000]],[300,[5500,6500]],[350,[6500,7500]],[400,[8000,9000]],[450,[10000,11000]],[500,[15000,18000]]]);
function buildingCost(i,level){
 if(!Number.isInteger(i)||i<0||i>=BASE.length||!Number.isInteger(level)||level<0)throw Error('INVALID_BUILDING');
 const cost=Math.floor(BASE[i]*1.2*Math.pow(1.75,level));
 if(!Number.isSafeInteger(cost))throw Error('BUILDING_COST_LIMIT');
 return cost;
}
function hourlyRate(save){
 return save.buildings.reduce((sum,level,i)=>{
  for(let n=0;n<level;n++)sum+=buildingCost(i,n)/36;
  return sum;
 },0);
}
function collectIncome(save,now){
 const next=structuredClone(save);
 if(!Number.isSafeInteger(now)||!Number.isFinite(next.lastIncome))throw Error('INVALID_INCOME_TIME');
 const hours=Math.max(0,Math.min(8,(now-next.lastIncome)/3600000));
 if(hours<.0025)return {save:next,amount:0};
 const start=now-hours*3600000,x=next.liveCity14||{},expire=Number(x.boosts?.income)||0;
 const from=Number(x.boostsStarted?.income)||expire-1800000;
 const overlap=(a,b)=>Math.max(0,Math.min(now,b)-Math.max(start,a))/3600000;
 const d=next.donationIncomeBoost||{};
 const gross=hourlyRate(next)*(hours+overlap(from,expire)*.25+overlap(Number(d.from)||0,Number(d.until)||0)*Math.max(0,Math.min(10,Number(d.percent)||0))/100)+(Number.isFinite(next.incomeRemainder)?next.incomeRemainder:0);
 const amount=Math.floor(gross);
 if(!Number.isSafeInteger(amount)||amount<0||!Number.isSafeInteger(next.coins+amount))throw Error('BALANCE_LIMIT');
 next.coins+=amount;next.incomeRemainder=gross-amount;next.lastIncome=now;
 return {save:next,amount};
}
function claimMilestone(save,level){
 const reward=REWARDS.get(level),next=structuredClone(save);
 if(!reward||next.level<level)throw Error('MILESTONE_NOT_REACHED');
 if(!Array.isArray(next.levelRewards))next.levelRewards=[];
 if(next.levelRewards.includes(level))return {save:next,alreadyClaimed:true};
 if(!Number.isSafeInteger(next.chips+reward[0])||!Number.isSafeInteger(next.coins+reward[1]))throw Error('BALANCE_LIMIT');
 next.levelRewards.push(level);next.chips+=reward[0];next.coins+=reward[1];
 return {save:next,alreadyClaimed:false};
}
module.exports={buildingCost,hourlyRate,collectIncome,claimMilestone};
