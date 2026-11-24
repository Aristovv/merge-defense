'use strict';
// Private round state must be stored in a separate server-only table, not the public save JSON.
const {randomInt}=require('node:crypto');
const rank=c=>(c-1)%13+1;
function points(cards){let total=0,aces=0;for(const c of cards){const r=rank(c);total+=Math.min(10,r);if(r===1)aces++}while(aces&&total+10<=21){total+=10;aces--}return total}
function deck(rand=randomInt){const d=Array.from({length:52},(_,i)=>i+1);for(let i=51;i>0;i--){const j=rand(i+1);[d[i],d[j]]=[d[j],d[i]]}return d}
function publicRound(r){
 if(r.game===8)return {game:r.game,stake:r.stake,you:r.you.slice(),dealer:r.dealer.slice(0,1),version:r.version};
 if(r.game===9)return {game:r.game,stake:r.stake,cards:r.cards.slice(),version:r.version};
 if(r.game===11)return {game:r.game,stake:r.stake,num:r.num,version:r.version};
 throw Error('INVALID_GAME');
}
function startRound(game,stake,rand=randomInt){
 if(![8,9,11].includes(game)||!Number.isSafeInteger(stake)||stake<25||stake%5)throw Error('INVALID_ROUND');
 const d=deck(rand),r={game,stake,deck:d,version:1};
 if(game===8){r.you=[d.pop(),d.pop()];r.dealer=[d.pop(),d.pop()];
  if(points(r.you)===21)return {done:true,payout:points(r.dealer)===21?stake:Math.floor(stake*2.5),you:r.you,dealer:r.dealer};
 }else if(game===9)r.cards=Array.from({length:5},()=>d.pop());
 else r.num=d.pop();
 return {done:false,privateRound:r,view:publicRound(r)};
}
function advanceBlackjack(privateRound,action,version){
 if(privateRound.game!==8||privateRound.version!==version||!['hit','stand'].includes(action))throw Error('INVALID_ROUND_ACTION');
 const r=JSON.parse(JSON.stringify(privateRound));
 if(action==='hit'){
  r.you.push(r.deck.pop());r.version++;
  if(points(r.you)>21)return {done:true,payout:0,you:r.you,dealer:r.dealer};
  return {done:false,privateRound:r,view:publicRound(r)};
 }
 const y=points(r.you);let d=points(r.dealer);
 while(d<17){r.dealer.push(r.deck.pop());d=points(r.dealer)}
 return {done:true,payout:y<=21&&(d>21||y>d)?r.stake*2:y===d&&y<=21?r.stake:0,you:r.you,dealer:r.dealer};
}
function pokerResult(cards){
 const ranks=cards.map(rank),suits=cards.map(c=>Math.floor((c-1)/13)),counts={};
 ranks.forEach(r=>counts[r]=(counts[r]||0)+1);
 const groups=Object.entries(counts).map(([r,n])=>({r:Number(r),n})).sort((a,b)=>b.n-a.n);
 const sorted=[...new Set(ranks)].map(r=>r===1?14:r).sort((a,b)=>a-b);
 const flush=suits.every(x=>x===suits[0]),straight=sorted.length===5&&(sorted[4]-sorted[0]===4||sorted.join(',')==='2,3,4,5,14');
 if(straight&&flush&&sorted[0]===10)return 250;
 if(straight&&flush)return 50;
 if(groups[0].n===4)return 25;
 if(groups[0].n===3&&groups[1].n===2)return 9;
 if(flush)return 6;if(straight)return 4;if(groups[0].n===3)return 3;
 if(groups[0].n===2&&groups[1].n===2)return 2;
 return groups[0].n===2&&(groups[0].r===1||groups[0].r>=11)?1:0;
}
function advancePoker(r,held,version){
 if(r.game!==9||r.version!==version||!Array.isArray(held)||held.length>5||new Set(held).size!==held.length||held.some(i=>!Number.isInteger(i)||i<0||i>4))throw Error('INVALID_ROUND_ACTION');
 const remaining=r.deck.slice(),cards=r.cards.map((c,i)=>held.includes(i)?c:remaining.pop());
 const multiplier=pokerResult(cards);
 return {done:true,payout:Math.floor(r.stake*multiplier),cards,multiplier};
}
function advanceHiLo(r,high,version){
 if(r.game!==11||r.version!==version||typeof high!=='boolean')throw Error('INVALID_ROUND_ACTION');
 const prev=rank(r.num),favorable=r.deck.filter(c=>high?rank(c)>prev:rank(c)<prev).length;
 if(!favorable)throw Error('IMPOSSIBLE_GUESS');
 const multiplier=Math.floor(.94/(favorable/r.deck.length)*100)/100;
 const card=r.deck[r.deck.length-1],next=rank(card),won=high?next>prev:next<prev;
 return {done:true,payout:won?Math.floor(r.stake*multiplier):0,previous:r.num,card,multiplier};
}
module.exports={startRound,publicRound,advanceBlackjack,advancePoker,advanceHiLo,pokerResult,points};
