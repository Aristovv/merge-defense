'use strict';

const {collectIncome}=require('./casino-authoritative-economy.cjs');

function exchangeChips(save,amount,now=Date.now()){
 if(!Number.isSafeInteger(amount)||amount<3000)
  throw Error('INVALID_EXCHANGE_AMOUNT');

 if(!Number.isSafeInteger(save.chips)||amount>save.chips)
  throw Error('INSUFFICIENT_CHIPS');

 const next=collectIncome(save,now).save;
 const coins=amount;

 if(!Number.isSafeInteger(coins)||
    !Number.isSafeInteger(next.coins+coins))
  throw Error('BALANCE_LIMIT');

 next.chips-=amount;
 next.coins+=coins;
 next.stamp=now;

 return {save:next,amount,coins};
}

module.exports={exchangeChips};
