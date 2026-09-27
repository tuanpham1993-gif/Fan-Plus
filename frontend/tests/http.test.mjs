import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const PORT=Number(process.env.FANHUB_HTTP_TEST_PORT||4187),BASE=`http://127.0.0.1:${PORT}`;
let child;
before(async()=>{
 child=spawn(process.execPath,['tools/serve.mjs'],{cwd:ROOT,env:{...process.env,PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error('Preview server did not start.')),5000);
  child.once('error',e=>{clearTimeout(timer);reject(e);});
  child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Server exited: ${code}`));});
  child.stdout.on('data',s=>{if(String(s).includes('Fan Hub Plus preview')){clearTimeout(timer);resolve();}});
 });
});
after(()=>child?.kill());
test('HTTP serves application shell',async()=>{const r=await fetch(BASE);assert.equal(r.status,200);assert.match(await r.text(),/type="importmap"/);});
test('HTTP supports deep SPA links',async()=>{const r=await fetch(BASE+'/content/c01');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^text\/html/);});
test('HTTP JavaScript has executable MIME type',async()=>{const r=await fetch(BASE+'/src/main.js');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^text\/javascript/);});
test('HTTP missing asset is a 404, not application HTML',async()=>{const r=await fetch(BASE+'/missing.js');assert.equal(r.status,404);});
test('HTTP read-only preview rejects POST',async()=>{const r=await fetch(BASE,{method:'POST',body:'test'});assert.equal(r.status,405);assert.equal(r.headers.get('allow'),'GET, HEAD');});
test('HTTP rejects malformed percent encoding',async()=>{const r=await fetch(BASE+'/%ZZ');assert.equal(r.status,400);});
test('HTTP serves partial local video bytes',async()=>{const r=await fetch(BASE+'/media/portal.webm',{headers:{Range:'bytes=0-99'}});assert.equal(r.status,206);assert.match(r.headers.get('content-range'),/^bytes 0-99\//);assert.equal((await r.arrayBuffer()).byteLength,100);});
test('HTTP serves suffix byte range',async()=>{const r=await fetch(BASE+'/media/portal.webm',{headers:{Range:'bytes=-50'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,50);});
test('HTTP rejects unsatisfiable range',async()=>{const r=await fetch(BASE+'/media/portal.webm',{headers:{Range:'bytes=999999999-'}});assert.equal(r.status,416);});
test('HTTP HEAD sends headers without a body',async()=>{const r=await fetch(BASE+'/media/portal.webm',{method:'HEAD'});assert.equal(r.status,200);assert.ok(Number(r.headers.get('content-length'))>0);assert.equal((await r.arrayBuffer()).byteLength,0);});
test('HTTP serves a valid caption file',async()=>{const r=await fetch(BASE+'/media/portal.vtt');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/^text\/vtt/);assert.match(await r.text(),/^WEBVTT/);});
test('HTTP supplies CSP, no-sniff and referrer controls',async()=>{const r=await fetch(BASE);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.match(r.headers.get('content-security-policy'),/script-src 'self' 'sha256-/);assert.equal(r.headers.get('referrer-policy'),'strict-origin-when-cross-origin');});
