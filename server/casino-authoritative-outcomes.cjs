'use strict';
const {randomInt}=require('node:crypto');
const {hourlyRate}=require('./casino-authoritative-economy.cjs');
const {applyCompletedRound}=require('./casino-authoritative-rounds.cjs');
const TABLES=[
[8,2.5,1.4,1.05,.8,.7,.55,.7,.8,1.05,1.4,2.5,8],
[35,9,3,1.8,.8,.4,.15,.4,.8,1.8,3,9,35],
[250,28,8,1.8,.4,.3,0,.3,.4,1.8,8,28,250]];
const SLOT_LINES=[[1,1,1,1,1],[2,2,2,2,2],[0,0,0,0,0],[3,3,3,3,3],[0,1,2,1,0],[3,2,1,2,3],[1,0,1,0,1],[2,3,2,3,2],[0,0,1,0,0],[3,3,2,3,3],[1,1,0,1,1],[2,2,3,2,2],[0,1,1,1,0],[3,2,2,2,3],[1,2,3,2,1],[2,1,0,1,2],[0,1,2,3,3],[3,2,1,0,0],[0,0,0,1,2],[3,3,3,2,1],[1,2,2,2,1],[2,1,1,1,2],[0,1,0,1,0],[3,2,3,2,3],[1,0,0,0,1],[2,3,3,3,2],[0,1,2,2,2],[3,2,1,1,1],[1,1,2,3,2],[2,2,1,0,1]];
const SLOT_WEIGHTS=[[5,15,15,15,14,14,6,4],[18,17,15,14,11,9,6,4],[10,15,14,13,13,13,6,4],[9,15,14,15,15,13,6,4],[13,14,13,12,12,13,6,4],[17,16,13,12,12,11,6,4]];
const SLOT_LIMITS=[[25,500],[500,1000],[1000,3000],[3000,10000],[10000,50000],[50000,100000]];
const REDS=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
function resolveRoulette(save,input,now,rand){
 const {game,stake,picks}=input,limits=game===6?[25,5000]:[5000,15000];
 if(!Number.isSafeInteger(stake)||stake<limits[0]||stake>limits[1]||stake%5)throw Error('INVALID_STAKE');
 if(!Array.isArray(picks)||!picks.length||picks.length>42||new Set(picks).size!==picks.length||picks.some(p=>typeof p!=='string'||!(/^(red|black|green|odd|even|n(?:[0-9]|[12][0-9]|3[0-6]))$/.test(p))))throw Error('INVALID_PICKS');
 const total=stake*picks.length;
 if(save.chips<total)throw Error('INSUFFICIENT_CHIPS');
 if(save.pendingMiniRound)throw Error('ROUND_PENDING');
 const num=rand(37),color=num===0?'green':REDS.includes(num)?'red':'black';
 const payout=picks.reduce((sum,p)=>sum+((p.startsWith('n')?num===Number(p.slice(1)):p==='odd'?num>0&&num%2===1:p==='even'?num>0&&num%2===0:p===color)?stake*(p==='green'||p.startsWith('n')?36:2):0),0);
 const description='Выпало '+num+' ('+color+')';
 return {save:applyCompletedRound(save,{game,stake:total,payout,description,now}),payout,stake:total,details:{num,color},description};
}
function resolvePaidSlot(save,input,now,rand){
 const {game,stake}=input,[min,max]=SLOT_LIMITS[game];
 if(save.slotBonus?.left>0||save.slotFreeSpinInProgress)throw Error('SLOT_BONUS_PENDING');
 if(!Number.isSafeInteger(stake)||stake<min||stake>max||stake%5)throw Error('INVALID_STAKE');
 if(save.chips<stake)throw Error('INSUFFICIENT_CHIPS');
 if(save.pendingMiniRound)throw Error('ROUND_PENDING');
 const weights=SLOT_WEIGHTS[game],symbol=()=>{let p=rand(weights.reduce((a,b)=>a+b,0));for(let i=0;i<weights.length;i++){p-=weights[i];if(p<0)return i}return 7};
 const grid=Array.from({length:5},()=>Array.from({length:4},symbol)),lines=[],lineMatches={};
 let raw=0;
 SLOT_LINES.forEach((rows,i)=>{const symbols=rows.map((row,col)=>grid[col][row]);const base=symbols.find(x=>x!==6)??0;if(base===7)return;let n=0;while(n<5&&(symbols[n]===base||symbols[n]===6))n++;if(n<3)return;raw+=n===3?(base===0?.34:.19):n===4?(base===0?1.1:.63):(base===0?4.5:2.4);lines.push(i);lineMatches[i]=n});
 const payout=Math.floor(raw*stake*[1.17,1.03,1.24,1.29,1.16,1.06][game]),scatters=grid.flat().filter(x=>x===7).length;
 const description=lines.length?'Линии: '+lines.map(i=>i+1).join(', '):'Без совпадений';
 const next=applyCompletedRound(save,{game,stake,payout,description,now});
 if(scatters>=3&&rand(100)<8)next.slotBonus={game,left:[2,3,2,2,3,2][game],bet:stake};
 return {save:next,payout,stake,details:{grid,lines,lineMatches,scatters},description};
}
function resolveRound(save,input,now=Date.now(),rand=randomInt){
 if([6,7].includes(input.game))return resolveRoulette(save,input,now,rand);
 if(Number.isInteger(input.game)&&input.game>=0&&input.game<6)return resolvePaidSlot(save,input,now,rand);
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
