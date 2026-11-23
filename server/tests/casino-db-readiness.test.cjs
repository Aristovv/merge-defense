'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const server=fs.readFileSync(path.join(__dirname,'../index.js'),'utf8');
test('PostgreSQL readiness checks an actual query rather than just configured credentials',()=>{
 assert.match(server,/app\.get\('\/health\/db',async/);
 assert.match(server,/await pool\.query\(\{text:'SELECT 1',query_timeout:5000\}\)/);
 assert.match(server,/status\(503\)\.json\(\{ok:false,database:'unavailable'\}\)/);
 assert.doesNotMatch(server,/app\.get\('\/health\/db'.*databaseConfigured:!!pool/);
});
test('connection wait is tolerant without opening an unbounded pool',()=>{
 assert.match(server,/max:5,connectionTimeoutMillis:10000/);
 assert.match(server,/idleTimeoutMillis:30000,keepAlive:true/);
});
