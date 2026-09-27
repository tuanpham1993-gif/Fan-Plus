"""Clean screenshots of real V3 components using the documented UI harness."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from feature_harness import mount
OUT=Path(__file__).resolve().parents[1]/'evidence'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
 page.set_default_timeout(8000);mount(page)
 for width in [1440,390]:
  page.set_viewport_size({'width':width,'height':1000 if width==1440 else 844})
  for route,name in [('/','home'),('/community','community'),('/giveaways','giveaways')]:
   page.evaluate('(r)=>window.__ui.go(r)',route);page.wait_for_timeout(450)
   page.screenshot(path=str(OUT/(name+('-desktop' if width==1440 else '-mobile')+'.png')),full_page=True)
  page.evaluate("window.__ui.go('/community')");page.wait_for_timeout(200)
  page.get_by_role('button',name='Ask Lore',exact=True).click()
  if width==1440:
   page.locator('#question-dock').fill('T\u00f3m t\u1eaft c\u01a1 ch\u1ebf V\u00f4 H\u1ea1 H\u1ea1n c\u1ee7a Gojo Satoru?')
   page.get_by_role('button',name='Send to Lore Master').click()
   expect(page.locator('.lore-message.assistant')).to_have_count(1)
  else: expect(page.locator('.lore-message.assistant')).to_have_count(1)
  page.screenshot(path=str(OUT/('lore-drawer-desktop.png' if width==1440 else 'lore-mobile.png')),full_page=False)
  page.keyboard.press('Escape')
 page.set_viewport_size({'width':1440,'height':1000});page.evaluate("window.__ui.go('/assistant')");page.wait_for_timeout(400)
 page.screenshot(path=str(OUT/'lore-desktop.png'),full_page=True)
 page.evaluate("window.__ui.go('/community')");page.wait_for_timeout(200)
 # Change through the actual interface, not by falsifying a screenshot.
 toggle=page.get_by_role('button',name='Switch to light theme',exact=True)
 toggle.click();expect(page.locator('html')).to_have_attribute('data-theme','light')
 page.wait_for_timeout(150);page.screenshot(path=str(OUT/'community-light.png'),full_page=True)
 import signal
 def stop_close(*_): raise TimeoutError('Browser cleanup timeout')
 signal.signal(signal.SIGALRM,stop_close);signal.alarm(8)
 try:b.close()
 except TimeoutError:pass
 signal.alarm(0)
print('Clean desktop/mobile screenshots captured from actual components.')
