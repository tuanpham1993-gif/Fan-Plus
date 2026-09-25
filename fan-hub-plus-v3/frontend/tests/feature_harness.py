"""Test-only adaptation of the V1 managed-browser harness.

Native top-level navigation is blocked by administrator policy. The harness uses
real Chromium/React/CSS with in-memory navigation/storage. WebCrypto's secure-
context interface is unavailable in about:blank: digest/HMAC delegate to Python
hashlib/hmac ONLY in this test harness. Node tests exercise native WebCrypto.
No browser policy is disabled or modified.
"""
import hashlib, hmac
from browser_harness import mount as original_mount


def mount(page):
    original_mount(page)
    page.expose_function('__test_sha256', lambda values: list(hashlib.sha256(bytes(values)).digest()))
    page.expose_function('__test_hmac', lambda key, values: list(hmac.new(bytes(key), bytes(values), hashlib.sha256).digest()))
    page.evaluate('''() => {
      if(!crypto.subtle)Object.defineProperty(crypto,'subtle',{value:{
        digest:async(_,data)=>new Uint8Array(await window.__test_sha256(Array.from(new Uint8Array(data.buffer||data)))).buffer,
        importKey:async(_,key)=>Array.from(new Uint8Array(key.buffer||key)),
        sign:async(_,key,data)=>new Uint8Array(await window.__test_hmac(key,Array.from(new Uint8Array(data.buffer||data)))).buffer
      }});
    }''')
