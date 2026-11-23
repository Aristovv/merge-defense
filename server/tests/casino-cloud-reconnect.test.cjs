'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const restore=fs.readFileSync(path.join(__dirname,'../../outfits56.js'),'utf8');
test('offline mode reconnects only when the local and server snapshots are identical',()=>{
 const fragment=html.slice(html.indexOf('async function casinoCloudReconnectIdentical()'),html.indexOf('async function casinoCloudStart()'));
 assert.match(fragment,/casinoStableJSON\(remote\.save\)!==snapshot/);
 assert.match(fragment,/casinoCloudLocalOnly=false/);
 assert.match(fragment,/casinoCloudRevision=remote\.revision/);
 assert.doesNotMatch(fragment,/casinoCloudFetch\('PUT'/);
});
test('clan coin deposit checks for reconnection instead of permanently rejecting offline mode',()=>{
 const fragment=html.slice(html.indexOf('async deposit(amount)'),html.indexOf('const revision=casinoCloudRevision;',html.indexOf('async deposit(amount)')));
 assert.match(fragment,/await casinoCloudReconnectIdentical\(\)/);
 assert.match(fragment,/await casinoCloudStart\(\)/);
 assert.match(fragment,/Локальная и облачная копии требуют сверки/);
});
test('manual cloud restoration checks latest revision and archives pending writes before replacing local save',()=>{
 const block=restore.slice(restore.indexOf('if(apply){'),restore.indexOf("const tab=e.target.closest('[data-lc56-tab]')"));
 assert.ok(block.indexOf("casinoCloudFetch('GET')")<block.indexOf("localStorage.setItem(STORAGE,encoded)"));
 assert.match(block,/casinoCloudQuarantinePending\('manual cloud recovery'\)/);
 assert.match(block,/localStorage\.removeItem\(CASINO_LOCAL_ONLY_KEY\)/);
 assert.match(block,/casinoCloudLocalOnly=false/);
});
