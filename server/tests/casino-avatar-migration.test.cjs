'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=fs.readFileSync(path.join(__dirname,'../casino-ranking.cjs'),'utf8');
test('check for existing avatar column before attempting privileged ALTER',()=>{
 const start=file.indexOf('const avatarReady =');
 const end=file.indexOf('const avatarColumn =',start);
 const init=file.slice(start,end);
 assert.ok(init.indexOf("SELECT 1 FROM information_schema.columns")>=0);
 assert.ok(init.indexOf("SELECT 1 FROM information_schema.columns")<init.indexOf('ALTER TABLE public.casino_city_players'));
 assert.match(init,/if \(column\.rowCount > 0\) return 'column'/);
 assert.match(init,/if \(error\.code !== '42501'\)/);
 assert.match(init,/CREATE TABLE IF NOT EXISTS public\.casino_city_avatars/);
});
