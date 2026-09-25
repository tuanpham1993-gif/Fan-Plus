"""V3 UI interaction tests in the documented, policy-respecting local harness."""
import json, time, sys, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from feature_harness import mount
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'evidence';OUT.mkdir(exist_ok=True)
results=[];errors=[];responsive=[]
HARNESS=os.environ.get('FANHUB_HARNESS')=='1'
BASE=os.environ.get('FANHUB_TEST_URL','http://127.0.0.1:4173')

def check(name,fn):
    start=time.monotonic()
    try:
        fn();results.append({'name':name,'status':'pass','seconds':round(time.monotonic()-start,2)});print('PASS',name,flush=True)
    except Exception as e:
        results.append({'name':name,'status':'fail','error':str(e)});page.screenshot(path=str(OUT/'v3-failure.png'),full_page=True);raise

def go(route):
    if HARNESS: page.evaluate('(route)=>window.__ui.go(route)',route)
    else: page.goto(BASE+route)
    page.wait_for_timeout(300)
    expect(page.locator('main')).to_be_visible()

def login(role):
    go('/login')
    page.get_by_role('button',name='Admin account' if role=='admin' else 'Fan account',exact=True).click()
    page.get_by_role('button',name='Sign in',exact=True).click()
    page.wait_for_timeout(600)
    expect(page.locator('h1')).to_contain_text('Bring the universe' if role=='admin' else 'Good to see you')

def snapshot(name,full=True):
    page.screenshot(path=str(OUT/(name+'.png')),full_page=full)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page.set_default_timeout(8000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        if HARNESS: mount(page)
        else: page.goto(BASE)
        def home():
            expect(page.get_by_role('button',name='Ask Lore',exact=True)).to_be_visible()
            expect(page.locator('.world-tile')).to_have_count(8)
            snapshot('home-desktop')
        check('Retained discovery homepage and new navigation',home)
        def feed():
            go('/community');expect(page.locator('[data-testid="community-post"]')).to_have_count(3)
            page.get_by_role('button',name='Music',exact=True).click();expect(page.locator('[data-testid="community-post"]')).to_have_count(1)
            page.get_by_role('button',name='All conversations',exact=True).click()
            page.get_by_label('Search community posts').fill('quiet');expect(page.locator('[data-testid="community-post"]')).to_have_count(1)
            page.get_by_label('Search community posts').fill('');snapshot('community-desktop')
        check('Community filtering, actual counts and sample disclosure',feed)
        def guest():
            page.get_by_role('button',name='Write a post',exact=True).click()
            expect(page.locator('h1')).to_contain_text('Welcome back')
        check('Guest cannot write without signing in',guest)
        def compose():
            login('member');go('/community');page.get_by_role('button',name='Write a post',exact=True).click()
            dialog=page.locator('dialog[open]')
            dialog.get_by_label('Film, anime, song or discussion topic').fill('Original film club')
            dialog.get_by_label('Give your perspective a title').fill('A sound worth listening to')
            dialog.locator('#post-editor textarea').fill('This review discusses the careful use of silence and how it leaves room for the viewer. The comments are my own interpretation of this original example.')
            dialog.get_by_label('These are my own words',exact=False).check()
            snapshot('community-editor',False)
            dialog.get_by_role('button',name='Send for review',exact=False).click()
            expect(page.locator('dialog[open]')).to_have_count(0)
            expect(page.get_by_text('Awaiting moderation',exact=True)).to_be_visible()
        check('Member creates a draft and submits to moderation',compose)
        def approval():
            login('admin');go('/community');page.get_by_role('button',name='Review queue',exact=False).click()
            expect(page.get_by_role('heading',name='A sound worth listening to')).to_be_visible()
            page.get_by_role('button',name='Approve and publish').click()
            expect(page.get_by_role('heading',name='A sound worth listening to')).to_have_count(0)
            page.get_by_role('button',name='Latest',exact=True).click()
            expect(page.get_by_role('heading',name='A sound worth listening to')).to_be_visible()
        check('Administrator publishes reviewed post into the feed',approval)
        def reactions():
            login('member');go('/community')
            card=page.locator('[data-testid="community-post"]').filter(has=page.get_by_role('heading',name='A sound worth listening to'))
            card.get_by_role('button',name='Like',exact=True).click();expect(card.get_by_role('button',name='Like',exact=True)).to_have_attribute('aria-pressed','true')
            card.get_by_role('button',name='Love',exact=True).click();expect(card.get_by_role('button',name='Like',exact=True)).to_have_attribute('aria-pressed','false');expect(card.get_by_role('button',name='Love',exact=True)).to_have_attribute('aria-pressed','true')
            expect(card.get_by_text('1 appreciation',exact=True)).to_be_visible()
        check('Like and love replace each other without inflating counts',reactions)
        def comments():
            card=page.locator('[data-testid="community-post"]').filter(has=page.get_by_role('heading',name='A sound worth listening to'))
            card.get_by_role('button',name='Comment',exact=True).click()
            card.get_by_label('Your comment',exact=True).fill('<script>window.bad=true</script> A useful perspective.')
            card.get_by_role('button',name='Post comment',exact=False).click()
            expect(card.get_by_text('<script>window.bad=true</script> A useful perspective.',exact=True)).to_be_visible()
            assert page.evaluate('window.bad') is None
            card.get_by_role('button',name='Reply',exact=True).click()
            card.get_by_label('Your comment',exact=True).fill('A reply to that thought.')
            card.get_by_role('button',name='Post comment',exact=False).click()
            expect(card.locator('.social-comment.reply')).to_have_count(1)
        check('Comments, one-level replies, HTML rendered as text',comments)
        def chat():
            page.get_by_role('button',name='Ask Lore',exact=True).click()
            expect(page.locator('.lore-window')).to_be_visible()
            page.locator('#question-dock').fill('Explain Gojo Limitless')
            page.get_by_role('button',name='Send to Lore Master',exact=True).click()
            expect(page.locator('.lore-message.assistant')).to_have_count(1)
            expect(page.locator('.lore-source')).to_contain_text('Sample source')
            expect(page.get_by_text('Library excerpt / no LLM',exact=True)).to_be_visible()
            snapshot('lore-drawer-desktop',False)
            page.keyboard.press('Escape');expect(page.locator('dialog[open]')).to_have_count(0)
        check('Lore drawer answers sample question, shows source, closes with Escape',chat)
        def lore_full():
            go('/assistant');expect(page.locator('.lore-message.assistant')).to_have_count(1)
            page.locator('#question-page').fill('Summarize Unknown Zebra 999')
            page.locator('#question-page').press('Enter')
            expect(page.locator('.lore-message.assistant')).to_have_count(2)
            expect(page.get_by_text('No matching source / no generation',exact=True)).to_be_visible()
            page.get_by_role('button',name='Clear conversation').click()
            page.locator('dialog[open]').get_by_role('button',name='Confirm action').click()
            expect(page.locator('.lore-message')).to_have_count(0)
            page.locator('#question-page').fill('Explain Gojo Limitless')
            page.get_by_role('button',name='Send to Lore Master',exact=True).click()
            expect(page.locator('.lore-source')).to_be_visible()
            snapshot('lore-desktop')
            page.locator('.lore-source').click()
            expect(page.locator('h1')).to_contain_text('Gojo Satoru')
            expect(page.locator('.source-disclosure')).to_contain_text('not an independently verified')
        check('Full Lore workspace preserves history, abstains, clears, opens actual source',lore_full)
        def prizes():
            go('/giveaways');expect(page.locator('.prize-card')).to_have_count(3)
            expect(page.get_by_text('Demonstration campaign.',exact=True)).to_be_visible()
            snapshot('giveaways-desktop')
            page.get_by_role('button',name='Enter this quarter',exact=False).click()
            dialog=page.locator('dialog[open]');expect(dialog.get_by_role('button',name='Record my entry',exact=False)).to_be_disabled()
            dialog.get_by_role('checkbox').nth(0).check();dialog.get_by_role('checkbox').nth(1).check()
            dialog.get_by_role('button',name='Record my entry',exact=False).click()
            expect(page.get_by_text('Your demo entry is recorded.',exact=True)).to_be_visible()
            page.get_by_role('button',name='My entry',exact=True).click();expect(page.locator('.member-ticket code')).to_contain_text('FH-')
        check('Quarterly prizes and explicit, free member entry',prizes)
        def draw():
            login('admin');go('/giveaways')
            page.get_by_role('button',name='Lock demo entries',exact=True).click()
            page.locator('dialog[open]').get_by_role('button',name='Confirm snapshot lock').click()
            expect(page.get_by_role('button',name='Record demo draw',exact=False)).to_be_enabled()
            page.get_by_role('button',name='Record demo draw',exact=False).click()
            page.locator('dialog[open]').get_by_role('button',name='Confirm demo draw').click()
            expect(page.get_by_role('heading',name='The result is recorded.')).to_be_visible()
            expect(page.get_by_role('button',name='Record demo draw',exact=False)).to_be_disabled()
            page.locator('details.draw-record>summary').click()
            page.get_by_role('button',name='Verify record consistency',exact=False).click()
            expect(page.get_by_text('Record consistency verified:',exact=False)).to_be_visible()
            expect(page.get_by_text('Not allocated',exact=True)).to_have_count(2)
            snapshot('giveaway-result-desktop')
        check('Frozen snapshot, single saved draw, no reroll, verifiable record',draw)
        def adaptive():
            for width in [320,390,768,1024,1440]:
                page.set_viewport_size({'width':width,'height':900})
                for route in ['/','/community','/giveaways','/assistant','/explore']:
                    go(route)
                    overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                    responsive.append({'width':width,'route':route,'overflow':overflow})
                    assert not overflow, f'{route} overflow at {width}'
                    if width==390 and route in ['/community','/giveaways']:
                        snapshot(('community' if route=='/community' else 'giveaways')+'-mobile')
            page.set_viewport_size({'width':390,'height':844});go('/community')
            page.get_by_role('button',name='Ask Lore',exact=True).click()
            expect(page.locator('.lore-window')).to_be_visible()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
            snapshot('lore-mobile',False);page.keyboard.press('Escape')
        check('25 responsive page/viewport combinations and mobile chat',adaptive)
        def lights():
            page.set_viewport_size({'width':1440,'height':1000});go('/community')
            theme=page.get_by_role('button',name='Switch to light theme',exact=True)
            theme.click()
            expect(page.locator('html')).to_have_attribute('data-theme','light')
            snapshot('community-light')
            page.set_viewport_size({'width':320,'height':900})
            page.get_by_role('button',name='Open navigation',exact=True).click()
            page.locator('dialog[open] .mobile-reading select').select_option('1.25')
            page.locator('dialog[open]').get_by_role('button',name='Close dialog').click()
            for route in ['/community','/giveaways','/assistant']:
                go(route)
                overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
                responsive.append({'width':320,'font':1.25,'theme':'light','route':route,'overflow':overflow})
                assert not overflow, route+' large-text overflow'
            assert not errors, errors
        check('Light-theme view and no uncaught browser errors',lights)
    finally:
        (OUT/'v3-ui-results.json').write_text(json.dumps({'mode':'managed-browser harness; injected navigation, storage and test-only crypto adapter' if HARNESS else 'native HTTP preview browser','tests':results,'responsive':responsive,'pageErrors':errors},indent=2))
        import signal
        def stop_close(*_): raise TimeoutError('Browser cleanup timeout')
        signal.signal(signal.SIGALRM,stop_close);signal.alarm(8)
        try: browser.close()
        except TimeoutError: pass
        signal.alarm(0)
