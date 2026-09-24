"""Capture the real rendered UI with off-screen lazy images eagerly decoded for full-page screenshots.
The app still runs in the documented memory-navigation Chromium harness.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_harness import mount
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,reduced_motion='reduce')
    page=context.new_page()
    mount(page)
    for name,width,height in [('home-desktop',1440,1000),('home-mobile',390,844)]:
        page.set_viewport_size({'width':width,'height':height})
        page.evaluate('''async () => {
            for (const image of document.images) image.loading='eager';
            await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
        }''')
        page.wait_for_timeout(200)
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
        page.screenshot(path=str(ROOT/'evidence'/(name+'.png')),full_page=True)
        print(name,'rendered; image count',page.locator('img').count(),flush=True)
    browser.close()
