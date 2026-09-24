import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]);}
test('First-party UI source and illustration assets contain no emoji presentation characters',()=>{
    const targets=[...files(path.join(root,'src')),...files(path.join(root,'public/art'))].filter(p=>/\.(tsx?|css|svg)$/.test(p));
    const pattern=/[\p{Extended_Pictographic}\uFE0F\u20E3]/u;
    for(const file of targets)assert.equal(pattern.test(fs.readFileSync(file,'utf8')),false,path.relative(root,file));
});
test('Editorial home uses numbered categories without sparkle icon or floating assistant',()=>{
    const layout=fs.readFileSync(path.join(root,'src/components/Layout.tsx'),'utf8');
    const home=fs.readFileSync(path.join(root,'src/pages/Home.tsx'),'utf8');
    assert.equal(layout.includes('assistant-fab'),false);
    assert.equal(home.includes('sparkles'),false);
    assert.ok(home.includes('world-number'));
});
