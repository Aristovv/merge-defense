'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const character=fs.readFileSync(path.join(__dirname,'../../character33.js'),'utf8');
test('cloud outage does not block all game buttons',()=>{
 assert.doesNotMatch(html,/Действия заблокированы для защиты прогресса/);
 assert.match(html,/function casinoCloudSaveLocalOnly\(\)/);
 assert.match(html,/if\(casinoCloudRevision===null\|\|casinoCloudLocalOnly\)/);
});
test('offline local changes are account bound and never sent to cloud without reconciliation',()=>{
 assert.match(html,/const CASINO_LOCAL_ONLY_KEY=/);
 assert.match(html,/localStorage\.setItem\(CASINO_LOCAL_ONLY_KEY,user\)/);
 assert.match(html,/if\(casinoCloudLocalOnly\)return;/);
 assert.match(html,/if\(casinoCloudLocalOnly\|\|casinoCloudBusy/);
});
test('wardrobe no longer blocks coin purchases purely because cloud is offline',()=>{
 assert.doesNotMatch(character,/Сначала требуется облачная синхронизация — покупка не выполнена/);
 assert.doesNotMatch(character,/Облако не синхронизировано — действия временно недоступны/);
});
