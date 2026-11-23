'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../casino-clans.js'),'utf8');
test('clan creation logs handled failures and stages without credentials',()=>{
 assert.match(code,/\[clans-create\] received/);
 assert.match(code,/\[clans-create\] failed/);
 assert.match(code,/\[clans-create\] success/);
 for(const stage of ['database-initialization','vk-group-verification','database-create'])assert.ok(code.includes(stage));
 const start=code.indexOf("if(req.path==='/api/casino/clans/create')");
 const end=code.indexOf('return err(res,error);',start);
 const logger=code.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.doesNotMatch(logger,/req\.body\?\.communityToken|access_token|X-VK-Launch-Params|req\.playerId/);
 assert.match(logger,/status:Number\(error\.status\)\|\|503/);
});
