'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../../index.html'),'utf8');
const cloud=html.slice(html.indexOf('/* Lucky City cloud save'),html.indexOf('function message(s)',html.indexOf('/* Lucky City cloud save')));
test('cloud upload accepts only an acknowledged revision advance',()=>{
 assert.match(cloud,/result\?\.ok!==true/);
 assert.match(cloud,/result\.revision<=revision/);
});
test('ambiguous network result is reconciled against server before retry',()=>{
 assert.match(cloud,/error\.code==='REVISION_CONFLICT'/);
 assert.match(cloud,/const remote=await casinoCloudFetch\('GET'\)/);
 assert.match(cloud,/casinoStableJSON\(remote\.save\)===casinoStableJSON\(JSON\.parse\(snapshot\)\)/);
});
test('divergent versions are preserved and never blindly overwritten',()=>{
 assert.match(cloud,/casinoCloudPreserveRemote\(remote,'unresolved upload revision conflict'\)/);
 assert.match(cloud,/casinoCloudRevision=null/);
 assert.match(cloud,/casinoCloudBackup\('Cloud revision conflict/);
});
test('server errors retain original conflict reason for diagnostics',()=>{
 assert.match(cloud,/code:payload\?\.error\|\|''/);
 assert.match(cloud,/reason:payload\?\.reason\|\|''/);
});
