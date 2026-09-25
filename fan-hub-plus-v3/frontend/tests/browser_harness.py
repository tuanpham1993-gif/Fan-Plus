"""Offline browser UI harness. Does NOT disable or alter managed browser policies.

The environment blocks all top-level navigation, so it mounts the actual shipped
ES modules in about:blank. DOM, CSS, dialogs, media, React and event handlers are
real. Navigation and Web Storage are injected in-memory ports; geolocation/email,
network authorization and native history persistence are not certified by this test.
"""
from pathlib import Path
from urllib.parse import urlparse, unquote
import mimetypes
import json
BASE='http://127.0.0.1:4173'
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

def mount(page):
    def serve(route):
        url=urlparse(route.request.url)
        file=(DIST/unquote(url.path).lstrip('/')).resolve()
        if not file.is_relative_to(DIST) or not file.is_file():
            route.fulfill(status=404,body='Not found');return
        mime=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        if file.suffix=='.js':mime='text/javascript'
        route.fulfill(status=200,body=file.read_bytes(),headers={'Content-Type':mime,'Access-Control-Allow-Origin':'*'})
    page.route(BASE+'/**',serve)
    page.set_content('<!doctype html><html lang="en"><head><base href="'+BASE+'/"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><script type="importmap">'+json.dumps({'imports':{'react':BASE+'/vendor/react-runtime.js','react-dom/client':BASE+'/vendor/react-runtime.js'}})+'</script></head><body><div id="root"></div></body></html>')
    page.evaluate('''() => {
      const store=()=>{const values=new Map();return new Proxy({getItem:k=>values.get(String(k))??null,setItem:(k,v)=>values.set(String(k),String(v)),removeItem:k=>values.delete(String(k)),clear:()=>values.clear(),key:i=>[...values.keys()][i]??null,get length(){return values.size;}},{ownKeys:()=>[...values.keys()],getOwnPropertyDescriptor:()=>({configurable:true,enumerable:true})});};
      Object.defineProperty(window,'localStorage',{value:store(),configurable:true});Object.defineProperty(window,'sessionStorage',{value:store(),configurable:true});
      if(!crypto.randomUUID)Object.defineProperty(crypto,'randomUUID',{value:()=>{const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;return [...a].map((v,i)=>([4,6,8,10].includes(i)?'-':'')+v.toString(16).padStart(2,'0')).join('');},configurable:true});
    }''')
    page.evaluate('''async base => {
      const router=await import(base+'/src/lib/router.js');let path='/';const listeners=new Set();
      router.configureNavigationPort({read:()=>path,push:(to)=>{path=to;for(const l of listeners)l();},subscribe:l=>{listeners.add(l);return()=>listeners.delete(l);}});
      window.__ui={go:router.navigate,path:router.currentPath};await import(base+'/src/main.js');
    }''',BASE)
    page.locator('h1').first.wait_for()
