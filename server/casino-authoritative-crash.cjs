'use strict';
// Server clock determines crash settlement; never accept a client multiplier.
const {randomInt}=require('node:crypto');
function startCrash(stake,autoTarget,now=Date.now(),rand=randomInt){
 if(!Number.isSafeInteger(stake)||stake<25||stake%5||!Number.isSafeInteger(now))throw Error('INVALID_ROUND');
 if(autoTarget!==null&&(!Number.isFinite(autoTarget)||autoTarget<1.1||autoTarget>8||Math.abs(autoTarget*100-Math.round(autoTarget*100))>1e-7))throw Error('INVALID_AUTO_TARGET');
 const u=(rand(1000000)+1)/1000000;
 const stop=Math.max(1,Math.min(8,Math.floor(.90/u*100)/100));
 return {game:13,stake,autoTarget,startedAt:now,stop,version:1};
}
function viewCrash(r){return {game:13,stake:r.stake,autoTarget:r.autoTarget,startedAt:r.startedAt,version:r.version}}
function settleCrash(r,action,now=Date.now()){
 if(r.game!==13||!['status','cashout'].includes(action)||!Number.isSafeInteger(now)||now<r.startedAt)throw Error('INVALID_ROUND_ACTION');
 const live=Math.min(8,Math.exp(.29*(now-r.startedAt)/1000));
 // Auto target is registered before the round, and survives disconnects.
 if(r.autoTarget!==null&&r.autoTarget<r.stop&&live>=r.autoTarget)
  return {done:true,payout:Math.floor(r.stake*r.autoTarget),multiplier:r.autoTarget,automatic:true};
 if(live>=r.stop)return {done:true,payout:0,multiplier:r.stop,crashed:true};
 if(action==='cashout')return {done:true,payout:Math.floor(r.stake*live),multiplier:live,automatic:false};
 return {done:false,view:viewCrash(r)};
}
module.exports={startCrash,viewCrash,settleCrash};
