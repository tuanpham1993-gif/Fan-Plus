"""Browser UI regression tests.
Normal environment: python tests/ui_test.py (start node tools/serve.mjs first).
Restricted environment: FANHUB_HARNESS=1 python tests/ui_test.py.
The harness uses real Chromium DOM/CSS but in-memory navigation and storage.
"""
from pathlib import Path
import os,json,time,traceback,sys
from playwright.sync_api import sync_playwright,expect
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'evidence';EVIDENCE.mkdir(exist_ok=True)
BASE=os.environ.get('FANHUB_TEST_URL','http://127.0.0.1:4173')
HARNESS=os.environ.get('FANHUB_HARNESS')=='1'
results=[];errors=[];console_errors=[]
def check(name,fn):
    start=time.monotonic()
    try:fn();results.append({'name':name,'status':'pass','seconds':round(time.monotonic()-start,2)});print('PASS',name,flush=True)
    except Exception as e:results.append({'name':name,'status':'fail','error':str(e),'seconds':round(time.monotonic()-start,2)});print('FAIL',name,str(e)[:350],flush=True);page.screenshot(path=str(EVIDENCE/'failure.png'),full_page=True);raise

def go(path):
    if HARNESS:page.evaluate('(path)=>window.__ui.go(path)',path)
    else:page.goto(BASE+path,wait_until='domcontentloaded')
    page.wait_for_timeout(100)
    expect(page.locator('main')).to_be_visible()

def login(role):
    go('/login')
    page.get_by_role('button',name=('Admin account' if role=='admin' else 'Fan account'),exact=True).click()
    page.get_by_role('button',name='Sign in',exact=True).click()
    expect(page.get_by_role('heading',name=('Bring the universe to life.' if role=='admin' else 'Good to see you, Alex.'))).to_be_visible()

def home():
    expect(page.locator('.world-tile')).to_have_count(8)
    expect(page.locator('[data-testid="content-card"]')).to_have_count(4)
    expect(page.get_by_role('link',name='Sitemap',exact=True)).to_be_visible()
    page.screenshot(path=str(EVIDENCE/'home-desktop.png'),full_page=True)

def filters():
    go('/explore');expect(page.locator('[data-testid="content-card"]')).to_have_count(9)
    page.get_by_role('button',name='Next',exact=True).click();expect(page.get_by_text('Page 2 of 3')).to_be_visible()
    page.locator('.category-tabs').get_by_role('button',name='Anime',exact=True).click()
    expect(page.locator('[data-testid="content-card"]')).to_have_count(3)
    page.get_by_label('Content type filter').select_option('character');expect(page.locator('[data-testid="content-card"]')).to_have_count(1)
    expect(page.get_by_role('heading',name='Meet Aki, the keeper of small promises')).to_be_visible()
    page.get_by_role('button',name='Reset',exact=True).click();expect(page.locator('[data-testid="content-card"]')).to_have_count(9)
    page.get_by_label('Sort content').select_option('az');page.get_by_role('button',name='List view',exact=True).click()
    expect(page.locator('.list-view')).to_be_visible()
    go('/explore');page.get_by_label('Search content',exact=True).fill('nonexistent galactic noodles');page.locator('.explore-search').get_by_role('button',name='Search',exact=True).click()
    expect(page.get_by_role('heading',name='No worlds found. Yet.')).to_be_visible()
    page.get_by_role('button',name='Clear all filters',exact=True).click();expect(page.locator('[data-testid="content-card"]')).to_have_count(9)
    page.screenshot(path=str(EVIDENCE/'explore-desktop.png'),full_page=True)

def gate():
    go('/collection');expect(page.get_by_role('heading',name='Your own corner of the universe')).to_be_visible()
    go('/admin');expect(page.get_by_role('heading',name='Your own corner of the universe')).to_be_visible()

def bookmark_note_rating():
    go('/content/c01');page.locator('.detail-sidebar').get_by_role('button',name='Bookmark: Neon Horizon: a city between two skies',exact=True).click()
    expect(page.locator('.detail-sidebar').get_by_role('button',name='Remove bookmark: Neon Horizon: a city between two skies',exact=True)).to_be_visible()
    page.get_by_role('button',name='Rate 5 out of 5',exact=True).click();expect(page.get_by_text('1 demo rating / 5.0 average')).to_be_visible()
    go('/collection');expect(page.locator('[data-testid="content-card"]')).to_have_count(1)
    page.get_by_role('button',name='Add a private demo note',exact=True).click();page.get_by_label('Your note',exact=True).fill('Return to this original fictional story later.')
    page.get_by_role('button',name='Save note',exact=True).click();expect(page.get_by_role('button',name='Return to this original fictional story later.',exact=True)).to_be_visible()

def permissions():
    go('/admin');expect(page.get_by_role('heading',name='Admin access required')).to_be_visible()

def profile():
    go('/profile');page.get_by_label('A little about you',exact=True).fill('I explore fictional worlds and collect original stories.')
    page.locator('.profile-grid').get_by_label('Cosplay',exact=True).check()
    page.get_by_role('button',name='Save profile',exact=True).click();expect(page.get_by_text('Your profile has been updated.',exact=True)).to_be_visible()
    go('/dashboard');expect(page.get_by_role('heading',name='Your discovery passport')).to_have_count(0)
    expect(page.locator('.stamp.earned')).to_have_count(1)
    page.screenshot(path=str(EVIDENCE/'dashboard-desktop.png'),full_page=True)

def submission():
    go('/submit');page.get_by_label('Story title',exact=True).fill('An original community test story')
    page.get_by_label('Fandom',exact=True).fill('Neon Horizon')
    page.get_by_label('Your story',exact=True).fill('A completely original reflection on kindness, community and the tiny details that make an imaginary world feel welcoming. No copied material is included in this test.')
    page.get_by_role('checkbox').last.check();page.get_by_role('button',name='Send for review',exact=True).click()
    expect(page.locator('.submission-card').get_by_text('pending',exact=True)).to_be_visible()
    go('/explore?q=An%20original%20community%20test%20story');expect(page.get_by_role('heading',name='No worlds found. Yet.')).to_be_visible()

def moderation():
    login('admin');go('/admin?tab=submissions');page.get_by_role('button',name='Review story',exact=True).click()
    expect(page.get_by_role('button',name='Reject with feedback',exact=True)).to_be_disabled()
    page.get_by_role('button',name='Approve and publish',exact=True).click();expect(page.get_by_text('Story published to Explore.',exact=True)).to_be_visible()
    go('/explore?q=An%20original%20community%20test%20story');expect(page.locator('[data-testid="content-card"]')).to_have_count(1)

def content_crud():
    go('/admin?tab=content');page.get_by_role('button',name='Add new',exact=True).click()
    d=page.locator('dialog[open]');d.get_by_label('Title',exact=True).fill('UI editorial fixture')
    d.get_by_label('Fandom',exact=True).fill('Original Demo')
    d.get_by_label('Summary',exact=True).fill('An original test record to validate frontend content editing.')
    d.get_by_label('Status',exact=True).select_option('published')
    d.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Edit UI editorial fixture',exact=True)).to_be_visible()
    page.get_by_role('button',name='Edit UI editorial fixture',exact=True).click();d.get_by_label('Title',exact=True).fill('UI editorial fixture updated')
    d.get_by_role('button',name='Save changes',exact=True).click();expect(page.get_by_role('button',name='Edit UI editorial fixture updated',exact=True)).to_be_visible()
    page.get_by_role('button',name='Delete UI editorial fixture updated',exact=True).click();page.get_by_role('button',name='Confirm action',exact=True).click()
    expect(page.get_by_role('button',name='Edit UI editorial fixture updated',exact=True)).to_have_count(0)

def categories_crud():
    go('/admin?tab=categories');page.get_by_role('button',name='Add new',exact=True).click();d=page.locator('dialog[open]')
    d.get_by_label('Category name',exact=True).fill('Test Universe');d.get_by_label('Description',exact=True).fill('A disposable test category.')
    d.get_by_role('button',name='Save changes',exact=True).click();card=page.locator('.admin-card-grid article').filter(has=page.get_by_role('heading',name='Test Universe',exact=True))
    expect(card).to_have_count(1);card.get_by_role('button',name='Delete',exact=True).click();page.get_by_role('button',name='Confirm action',exact=True).click();expect(card).to_have_count(0)

def feedback():
    go('/feedback');page.get_by_label('What is this about?',exact=True).select_option('bug');page.get_by_label('Your message',exact=True).fill('A reproducible layout issue in a fictional test page.')
    page.get_by_role('button',name='Send demo feedback',exact=True).click();expect(page.get_by_text('Thank you. This feedback has been stored locally, not sent to a support team.')).to_be_visible()
    go('/admin?tab=feedback');page.get_by_role('button',name='Mark resolved',exact=True).click();expect(page.locator('.admin-content .status').get_by_text('resolved',exact=True)).to_be_visible()

def events():
    go('/events');expect(page.locator('.event-card')).to_have_count(4);page.get_by_label('Filter events by city',exact=True).select_option('Hanoi');expect(page.locator('.event-card')).to_have_count(1)
    page.get_by_role('button',name='Calendar',exact=True).click();expect(page.get_by_role('heading',name='October 2026')).to_be_visible();expect(page.locator('.calendar-day a')).to_have_count(1)
    page.get_by_role('button',name='Map',exact=True).click();expect(page.locator('iframe')).to_have_count(0);expect(page.get_by_role('button',name='Load online map',exact=True)).to_be_visible()
    page.evaluate('''() => {navigator.geolocation.getCurrentPosition=(success,error)=>error({code:1});}''')
    page.get_by_role('button',name='Use my location',exact=True).click();expect(page.get_by_text('Location permission was denied. You can still browse by city.')).to_be_visible()
    page.evaluate('''() => {navigator.geolocation.getCurrentPosition=(success)=>success({coords:{latitude:10.7769,longitude:106.7009}});}''')
    page.get_by_role('button',name='Use my location',exact=True).click();page.get_by_role('button',name='List',exact=True).click();page.get_by_label('Distance radius',exact=True).select_option('25');expect(page.locator('.event-card')).to_have_count(2)
    go('/events/e1');expect(page.get_by_role('button',name='Add demo event to calendar',exact=True)).to_be_visible()
    go('/releases');expect(page.locator('.release-row')).to_have_count(8)
    page.locator('.category-tabs').get_by_role('button',name='Gaming',exact=True).click();expect(page.locator('.release-row')).to_have_count(1)

def media_spoilers():
    go('/content/c02');page.wait_for_function('document.querySelector("video")?.readyState>=1',timeout=10000);assert 5.8<float(page.locator('video').evaluate('(v)=>v.duration'))<6.3
    assert page.locator('track').get_attribute('src')=='/media/portal.vtt'
    go('/content/c11');page.wait_for_function('document.querySelector("audio")?.readyState>=1',timeout=10000);assert 7.9<float(page.locator('audio').evaluate('(v)=>v.duration'))<8.2
    go('/content/c03');page.get_by_role('button',name='Open concept image 1',exact=True).click();expect(page.locator('dialog[open]')).to_be_visible();page.locator('dialog[open]').get_by_role('button',name='Next',exact=True).click();expect(page.locator('dialog[open]').get_by_text('2 / 3',exact=True)).to_be_visible();page.keyboard.press('Escape');expect(page.locator('dialog[open]')).to_have_count(0)
    go('/content/c19');expect(page.get_by_role('heading',name='A little heads-up.')).to_be_visible();page.get_by_role('button',name="I'm ready - reveal this section",exact=True).click();expect(page.get_by_role('heading',name='A world worth exploring')).to_be_visible()

def assistant():
    go('/assistant');page.get_by_role('button',name='How do I bookmark?',exact=True).click();expect(page.locator('.chat-message').last).to_contain_text('Source: approved local FAQ')
    page.get_by_label('Your question',exact=True).fill('Neon Horizon');page.get_by_role('button',name='Send question',exact=True).click();expect(page.locator('.chat-sources a')).to_have_count(3)
    page.get_by_label('Your question',exact=True).fill('zxqv supernatural no-such-item');page.get_by_role('button',name='Send question',exact=True).click();expect(page.locator('.chat-message').last).to_contain_text('I do not have a published source')
    page.get_by_role('button',name='Clear conversation',exact=True).click();page.get_by_role('button',name='Confirm action',exact=True).click();expect(page.locator('.chat-message')).to_have_count(1)

def admin_evidence():
    go('/admin');page.screenshot(path=str(EVIDENCE/'admin-desktop.png'),full_page=True)

def responsive():
    routes=['/','/explore','/content/c01','/events','/showcase','/releases','/dashboard','/collection','/profile','/submit','/feedback','/admin','/assistant','/login','/sitemap']
    for width in [1440,768,390,320]:
        page.set_viewport_size({'width':width,'height':900 if width>700 else 844})
        for path in routes:
            print('LAYOUT', width, path, flush=True)
            go(path)
            assert page.locator('h1').count()==1,(width,path,'Expected one main heading')
            overflow=page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
            assert not overflow,(width,path,page.evaluate('[document.documentElement.scrollWidth,innerWidth]'))
        if width==390:
            go('/');page.screenshot(path=str(EVIDENCE/'home-mobile.png'),full_page=True)
            go('/explore');page.screenshot(path=str(EVIDENCE/'explore-mobile.png'),full_page=True)
    # Visitor-accessible mobile reading preferences.
    page.get_by_role('button',name='Open navigation',exact=True).click()
    page.get_by_role('combobox',name='Mobile text size',exact=True).select_option('1.25')
    page.get_by_role('button',name='Use dark theme',exact=True).click()
    page.keyboard.press('Escape')
    expect(page.locator('html')).to_have_attribute('data-theme','dark')
    for path in ['/','/explore','/profile','/admin','/assistant','/events']:
        go(path);assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'),('large font',path)
    page.set_viewport_size({'width':1440,'height':1000});go('/')
    page.screenshot(path=str(EVIDENCE/'home-dark-large-text.png'),full_page=True)

def global_search():
    page.keyboard.press('Control+k');expect(page.locator('dialog[open]')).to_be_visible()
    page.get_by_label('Search all content',exact=True).fill('Skybound');page.locator('dialog[open]').get_by_role('button',name='Search',exact=True).click()
    expect(page.locator('[data-testid="content-card"]')).to_have_count(3)

def all_routes():
    for path in ['/media','/characters','/forgot-password','/reset-password','/verify-email','/register','/privacy','/not-a-page','/content/missing','/events/missing','/admin?tab=users','/admin?tab=events','/admin?tab=knowledge']:
        go(path);assert len(page.locator('main').inner_text())>30
    assert not errors,errors

with sync_playwright() as p:
    executable=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium')
    browser=p.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1,reduced_motion='reduce')
    page=context.new_page();page.set_default_timeout(7000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None)
    exit_code=0
    try:
        if HARNESS:
            from browser_harness import mount
            mount(page)
        else:page.goto(BASE,wait_until='networkidle')
        for name,fn in [('Landing page and sitemap',home),('Search, filters, sorting, paging and empty states',filters),('Visitor route gates',gate),('Demo member login',lambda:login('fan')),('Bookmark, private note and rating',bookmark_note_rating),('Member cannot open admin',permissions),('Profile preferences and discovery passport',profile),('Fan submission remains pending and private',submission),('Admin moderation publishes fan story',moderation),('Admin content create/edit/delete',content_crud),('Admin category create/delete',categories_crud),('Feedback submission and resolution',feedback),('Events, calendar, consent and simulated geolocation states',events),('Local media, gallery and spoiler reveal',media_spoilers),('Source-backed local assistant and clear history',assistant),('Admin overview evidence',admin_evidence),('60 responsive route checks plus dark/large text',responsive),('Global keyboard search',global_search),('Remaining routes and runtime errors',all_routes)]:check(name,fn)
    except Exception:
        exit_code=1;traceback.print_exc()
    finally:
        report={'mode':'Chromium UI integration harness: memory navigation/storage; simulated GPS' if HARNESS else 'Native HTTP browser flows','browser':browser.version,'test_groups':results,'uncaught_runtime_errors':errors,'console_errors':console_errors,'limitations':['No cross-browser certification','No live backend/auth/email/LLM','Online map rendering and native calendar import not validated']}
        (EVIDENCE/'ui-tests.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
        browser.close()
    sys.exit(exit_code)
