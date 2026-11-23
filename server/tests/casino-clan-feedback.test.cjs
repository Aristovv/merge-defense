'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const clans=fs.readFileSync(path.join(__dirname,'../../clans.js'),'utf8');
test('clan page does not present a failed deposit as a persistent page-wide error',()=>{
 const handler=clans.slice(clans.indexOf("if(action==='deposit')"),clans.indexOf("if(action==='install-community')"));
 assert.match(handler,/depositFeedback='Перевод не выполнен:/);
 assert.match(handler,/notice=''/);
 assert.match(handler,/clearTimeout\(depositFeedbackTimer\)/);
 assert.match(handler,/6000/);
 assert.doesNotMatch(handler,/notice=e\.message/);
});
test('deposit still requires server confirmation and never reports coins credited on failure',()=>{
 assert.match(clans,/await window\.LuckyClanEconomy\.deposit\(amount\)/);
 assert.match(clans,/depositFeedback='Монеты зачислены в казну'/);
 assert.match(clans,/требуется подтверждение баланса/);
});
