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
function upgradeBuilding(save,i,now){
 const next=collectIncome(save,now).save;
 const price=buildingCost(i,next.buildings[i]);
 if(next.coins<price)throw Error('INSUFFICIENT_COINS');
 if(next.buildings[i]>=1000)throw Error('BUILDING_LEVEL_LIMIT');
 next.coins-=price;next.buildings[i]++;
 const date=new Date(now),day=date.toISOString().slice(0,10);
 date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
 const week=date.toISOString().slice(0,10);
 next.questPeriods??={};
 for(const [scope,key] of [['daily',day],['weekly',week]]){
  let p=next.questPeriods[scope];
  if(!p||p.key!==key||!p.counts||!Array.isArray(p.claimed))p=next.questPeriods[scope]={key,counts:{plays:0,wins:0,builds:0},claimed:[]};
  p.counts.builds=(Number(p.counts.builds)||0)+1;
 }
 next.liveCity14??={};
 const x=next.liveCity14;
 if(!x.daily||x.daily.key!==day)x.daily={key:day,games:[],rounds:0,builds:0,hot:0,claims:[]};
 x.daily.builds=(Number(x.daily.builds)||0)+1;
 if(next.level<500){
  next.xp+=Math.floor(25*(Number(x.boosts?.xp)>now?1.5:1));
  while(next.level<500){
   const need=420+next.level*110+next.level*next.level*8;
   if(next.xp<need)break;
   next.xp-=need;next.level++;next.chips+=100+next.level*20;
  }
 }
 if(next.level>=500)next.xp=0;
 if(!Number.isSafeInteger(next.chips))throw Error('BALANCE_LIMIT');
 return {save:next,price};
}
module.exports={buildingCost,hourlyRate,collectIncome,claimMilestone,upgradeBuilding};
