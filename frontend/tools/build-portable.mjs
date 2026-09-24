/** Offline preview compiler. This transpiles TypeScript; run npm run build for semantic type-checking. */
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let ts;
try{ts=require(process.env.TYPESCRIPT_PATH||'typescript');}
catch{console.error('Install the development dependencies (npm install), or supply TYPESCRIPT_PATH to an existing TypeScript installation.');process.exit(1);}
const out=path.join(root,'dist');
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(out,{recursive:true});
await fs.cp(path.join(root,'public'),out,{recursive:true});
let count=0;
async function walk(dir){
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const input=path.join(dir,entry.name);
  if(entry.isDirectory()){await walk(input);continue;}
  if(!/\.(ts|tsx)$/.test(entry.name))continue;
  let source=await fs.readFile(input,'utf8');
  source=source.replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm,'');
  const result=ts.transpileModule(source,{fileName:input,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.React,sourceMap:false,removeComments:false,isolatedModules:true}});
  const errors=(result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  if(errors.length){console.error(ts.formatDiagnosticsWithColorAndContext(errors,{getCurrentDirectory:()=>root,getCanonicalFileName:n=>n,getNewLine:()=> '\n'}));process.exit(1);}
  const code=result.outputText.replace(/(from\s*['"]|import\s*\(\s*['"])(\.{1,2}\/[^'"]+)(['"])/g,(_,a,b,c)=>a+(/\.\w+$/.test(b)?b:b+'.js')+c);
  const destination=path.join(out,path.relative(root,input).replace(/\.tsx?$/,'.js'));
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,code);count++;
 }
}
await walk(path.join(root,'src'));
await fs.copyFile(path.join(root,'src/styles.css'),path.join(out,'styles.css'));
const html=await fs.readFile(path.join(root,'index.html'),'utf8');
const imports=JSON.stringify({imports:{react:'/vendor/react-runtime.js','react-dom/client':'/vendor/react-runtime.js'}});
await fs.writeFile(path.join(out,'index.html'),html.replace('</head>',`<link rel="stylesheet" href="/styles.css"><script type="importmap">${imports}</script></head>`).replace('/src/main.tsx','/src/main.js'));
console.log(`Portable build: ${count} modules transpiled into dist/. Semantic type-checking is a separate npm run build step.`);
