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
function buildingPaybackHours(level){return level<5?36:level<10?48:level<15?96:level<20?168:level<25?240:level<30?480:720}
const BUSINESS_CATALOG=[["Кофейня","☕",6000,1,72],["Автомойка","🚘",30000,5,96],["Ресторан","🍽️",150000,10,120],["Логистический центр","🚚",750000,20,168],["Торговый комплекс","🏬",3000000,35,240],["Технологический парк","🏙️",15000000,50,336]];
function businessLevels(save){return BUSINESS_CATALOG.map((_,i)=>{const n=save.businesses?.[i];return Number.isInteger(n)&&n>=0&&n<=10?n:0})}
function businessCost(i,n){return Math.floor(BUSINESS_CATALOG[i][2]*(1+n*.5))}
function businessPayback(i,n){return BUSINESS_CATALOG[i][4]+n*24}
function businessIncome(i,level){let total=0;for(let n=0;n<level;n++)total+=Math.floor(businessCost(i,n)/businessPayback(i,n));return total}
function businessStaff(save,i){const n=save.businessStaff?.[i];return Number.isInteger(n)&&n>=0&&n<=3?n:0}
function businessManager(save,i){return save.businessManagers?.[i]===true}
function businessStaffCost(i,n){return Math.floor(BUSINESS_CATALOG[i][2]*(.4+n*.2))}
function businessManagerCost(i){return BUSINESS_CATALOG[i][2]*2}
function businessReputation(save,i){const n=save.businessReputation?.[i];return Number.isSafeInteger(n)&&n>=0?Math.min(n,100000):0}
function businessLicense(save,i){const n=save.businessLicenses?.[i];return Number.isInteger(n)&&n>=0&&n<=3?n:0}
const BUSINESS_LICENSES=[{name:'Городская',need:5,level:4,bonus:2},{name:'Региональная',need:15,level:7,bonus:4},{name:'Федеральная',need:30,level:10,bonus:6}];
function businessLicenseCost(i,n){return Math.floor(BUSINESS_CATALOG[i][2]*[.5,1,2][n])}
function businessLicenseBonus(save,i){return businessLicense(save,i)*2}
function businessManagedIncome(save,i,n){return Math.floor(businessIncome(i,n)*(100+businessStaff(save,i)*3+(businessManager(save,i)?6:0)+businessLicenseBonus(save,i))/100)}
function businessContractTerms(save,i){const income=businessManagedIncome(save,i,businessLevels(save)[i]);return {cost:Math.max(1,income*3),reward:Math.max(1,Math.floor(income*3.3)),duration:86400000}}
function businessRate(save){return businessLevels(save).reduce((sum,n,i)=>sum+businessManagedIncome(save,i,n),0)}
function manageBusiness(save,i,action,now){
 if(!Number.isInteger(i)||!BUSINESS_CATALOG[i])throw Error('INVALID_BUSINESS');
 const level=businessLevels(save)[i];if(!level)throw Error('BUSINESS_LOCKED');
 const next=collectIncome(save,now,true).save;
 const staff=BUSINESS_CATALOG.map((_,j)=>businessStaff(next,j)),managers=BUSINESS_CATALOG.map((_,j)=>businessManager(next,j));
 const contracts=BUSINESS_CATALOG.map((_,j)=>next.businessContracts?.[j]||null);
 const reputation=BUSINESS_CATALOG.map((_,j)=>businessReputation(next,j)),licenses=BUSINESS_CATALOG.map((_,j)=>businessLicense(next,j));
 let price=0,reward=0;
 if(action==='hire_business_staff'){
  if(staff[i]>=3||level<(staff[i]+1)*2)throw Error('BUSINESS_STAFF_LOCKED');
  price=businessStaffCost(i,staff[i]);staff[i]++;
 }else if(action==='hire_business_manager'){
  if(managers[i]||level<8||staff[i]<3)throw Error('BUSINESS_MANAGER_LOCKED');
  price=businessManagerCost(i);managers[i]=true;
 }else if(action==='buy_business_license'){
  const n=licenses[i],lic=BUSINESS_LICENSES[n];
  if(!lic||level<lic.level||reputation[i]<lic.need)throw Error('BUSINESS_LICENSE_LOCKED');
  price=businessLicenseCost(i,n);licenses[i]++;
 }else if(action==='start_business_contract'){
  if(contracts[i]||level<3)throw Error('BUSINESS_CONTRACT_LOCKED');
  const terms=businessContractTerms(next,i);price=terms.cost;
  contracts[i]={endsAt:now+terms.duration,reward:terms.reward};
 }else if(action==='claim_business_contract'){
  const c=contracts[i];if(!c||now<c.endsAt)throw Error('BUSINESS_CONTRACT_NOT_READY');
  reward=c.reward;contracts[i]=null;reputation[i]=Math.min(100000,reputation[i]+1);
 }else throw Error('INVALID_BUSINESS');
 if(next.coins<price)throw Error('INSUFFICIENT_COINS');
 if(!Number.isSafeInteger(next.coins-price+reward))throw Error('BALANCE_LIMIT');
 next.coins+=reward-price;next.businessStaff=staff;next.businessManagers=managers;next.businessContracts=contracts;next.businessReputation=reputation;next.businessLicenses=licenses;
 return {save:next,price,reward};
}
function upgradeBusiness(save,i,now){
 if(!Number.isInteger(i)||!BUSINESS_CATALOG[i])throw Error('INVALID_BUSINESS');
 const levels=businessLevels(save),n=levels[i];
 if(n>=10)throw Error('BUSINESS_LEVEL_LIMIT');
 if(save.level<BUSINESS_CATALOG[i][3])throw Error('BUSINESS_LOCKED');
 const next=collectIncome(save,now,true).save,price=businessCost(i,n);
 if(next.coins<price)throw Error('INSUFFICIENT_COINS');
 next.coins-=price;levels[i]++;next.businesses=levels;
 return {save:next,price};
}
function hourlyRate(save){
 return save.buildings.reduce((sum,level,i)=>{
  for(let n=0;n<level;n++)sum+=buildingCost(i,n)/buildingPaybackHours(n);
  return sum;
 },0)+businessRate(save);
}
function collectIncome(save,now,force=false){
 const next=structuredClone(save);
 if(!Number.isSafeInteger(now)||!Number.isFinite(next.lastIncome))throw Error('INVALID_INCOME_TIME');
 const hours=Math.max(0,Math.min(8,(now-next.lastIncome)/3600000));
 if(hours===0||(!force&&hours<.0025))return {save:next,amount:0};
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
 const next=collectIncome(save,now,true).save;
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
module.exports={businessReputation,businessLicense,businessLicenseCost,manageBusiness,businessStaff,businessManager,businessManagedIncome,businessContractTerms,businessLevels,businessCost,businessPayback,businessIncome,businessRate,upgradeBusiness,buildingPaybackHours,buildingCost,hourlyRate,collectIncome,claimMilestone,upgradeBuilding};
