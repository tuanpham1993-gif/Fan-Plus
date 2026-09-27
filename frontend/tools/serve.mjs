/** Dependency-free local preview server, with SPA fallback and byte-range media support. */
import http from 'node:http';
import { promises as fs,createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be an integer between 1024 and 65535.');
let html;try{html=await fs.readFile(path.join(root,'index.html'),'utf8');}catch{console.error('dist/index.html is missing. Run npm run build:portable first.');process.exit(1);}
const importMap=html.match(/<script type="importmap">([\s\S]*?)<\/script>/)?.[1]||'';
const hash=createHash('sha256').update(importMap).digest('base64');
const csp=`default-src 'self'; script-src 'self' 'sha256-${hash}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; frame-src https://www.openstreetmap.org; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.webm':'video/webm','.vtt':'text/vtt; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Content-Security-Policy',csp);res.setHeader('Cache-Control','no-cache');
 if(!['GET','HEAD'].includes(req.method||'')){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
 try{
  const decoded=decodeURIComponent(new URL(req.url||'/','http://localhost').pathname);
  let file=path.resolve(root,'.'+decoded);
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  let stat;try{stat=await fs.stat(file);}catch{}
  if(!stat?.isFile()){
   if(path.extname(decoded)){res.writeHead(404,{'Content-Type':'text/plain'});res.end('File not found');return;}
   file=path.join(root,'index.html');stat=await fs.stat(file);
  }
  const size=stat.size;res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
  let start=0,end=size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
   if(!match[1])start=Math.max(0,size-Number(match[2]));else start=Number(match[1]);
   if(match[1]&&match[2])end=Math.min(size-1,Number(match[2]));
   if(start>=size||start>end||start<0){res.writeHead(416,{'Content-Range':`bytes */${size}`});res.end();return;}
   status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${size}`);
  }
  res.writeHead(status,{'Content-Length':end-start+1});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());stream.pipe(res);
 }catch(error){if(!res.headersSent)res.writeHead(error instanceof URIError?400:500,{'Content-Type':'text/plain'});res.end('Unable to serve this request.');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Fan Hub Plus preview: http://127.0.0.1:${port}\nLocal demo only. Press Ctrl+C to stop.`));
