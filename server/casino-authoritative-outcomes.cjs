'use strict';
const {randomInt}=require('node:crypto');
const {hourlyRate}=require('./casino-authoritative-economy.cjs');
const {applyCompletedRound}=require('./casino-authoritative-rounds.cjs');
const TABLES=[
[8,2.5,1.4,1.05,.8,.7,.55,.7,.8,1.05,1.4,2.5,8],
[35,9,3,1.8,.8,.4,.15,.4,.8,1.8,3,9,35],
[250,28,8,1.8,.4,.3,0,.3,.4,1.8,8,28,250]];
function resolveRound(save,input,now=Date.now(),rand=randomInt){
 const {game,stake,count=1,risk=0,guess}=input;
 if(![12,14,15].includes(game))throw Error('UNSUPPORTED_GAME');
 const max=Math.min(100000,500+Math.floor(hourlyRate(save)/1000)*100);
 if(!Number.isSafeInteger(stake)||stake<25||stake>max||stake%5)throw Error('INVALID_STAKE');
 if(game===12&&(!Number.isInteger(count)||count<1||count>10||!Number.isInteger(risk)||risk<0||risk>2))throw Error('INVALID_PLINKO');
 if(game===14&&!['over','under'].includes(guess))throw Error('INVALID_GUESS');
 const total=game===12?stake*count:stake;
 if(save.pendingMiniRound)throw Error('ROUND_PENDING');
 if(save.chips<total)throw Error('INSUFFICIENT_CHIPS');
 let payout=0,details,description;
 if(game===12){
  details=Array.from({length:count},()=>{let index=0;const path=[];for(let i=0;i<12;i++){index+=rand(2);path.push(index)}return {index,path,prize:Math.floor(stake*TABLES[risk][index])}});
  payout=details.reduce((n,x)=>n+x.prize,0);description='Plinko: '+count+' шариков';
 }else if(game===14){
  const a=1+rand(6),b=1+rand(6),sum=a+b;
  payout=sum===7?stake:(guess==='over'?sum>=8:sum<=6)?Math.floor(stake*1.9):0;
  details={a,b,sum};description='Кубики: '+a+' + '+b+' = '+sum;
 }else{
  const roll=rand(100),distribution=roll<3?[5,1,1,1,1]:roll<10?[4,2,1,1,1]:roll<25?[3,2,2,1,1]:[2,2,2,2,1];
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
  const ids=shuffle([0,1,2,3,4]),cells=[];
  distribution.forEach((n,i)=>{for(let j=0;j<n;j++)cells.push(ids[i])});
  details=shuffle(cells);payout=stake*(roll<3?10:roll<10?5:roll<25?2:0);
  description=payout?'Нашёл сочетание!':'Попробуй ещё';
 }
 return {save:applyCompletedRound(save,{game,stake:total,payout,description,now}),payout,stake:total,details,description};
}
module.exports={resolveRound};
