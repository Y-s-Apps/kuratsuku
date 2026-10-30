# 先発から外す (2026-10-24, the user's screenshot: the bench sheet has ベンチから外す, the position sheet had nothing to take
# a starter out). The position sheet of a filled slot has [先発から外す][詳細を見る]: the place is left empty, the player
# goes out of the matchday squad (not to the bench), the bench is untouched, kickoff waits until the place is filled
# (the warning's 空いた枠をおまかせで埋める). An empty slot's sheet has only 閉じる. iPhone 16 chalkboard, iPhone SE whiteboard.
# usage: python3 dev/test/xiout.py   (KTK_FONTS=<node_modules/@fontsource> for the real fonts) → dev/test/shots/xo-*.png
import asyncio, pathlib, os, re, json
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT/'test'/'shots'; OUT.mkdir(exist_ok=True)
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', '/nonexistent'))
page_html = (ROOT/'dist/touchline.html').read_text()
(ROOT/'test/page.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + page_html + '</body></html>')
LZ = (ROOT/'test/vendor/lz-string.min.js').read_text()
LOAD = "() => JSON.parse(LZString.decompressFromBase64(localStorage.getItem('touchline.j1.save').slice(3)))"
fails = 0
def ok(cond, msg):
    global fails
    print(('ok   ' if cond else 'FAIL ') + msg)
    if not cond: fails += 1
def font_css():
    if not FONTS.exists(): return None
    css = ''.join((FONTS/f).read_text() for f in ['dela-gothic-one/400.css', 'yusei-magic/400.css', 'dotgothic16/400.css'] + [f'zen-kaku-gothic-new/{w}.css' for w in (400, 500, 700, 900)])
    return re.sub(r"url\(\./files/([^)]+)\)", lambda m: f"url(https://fonts.gstatic.com/fs/{m.group(1)})", css)

async def main(vw, vh, board):
    css = font_css(); tag = f'{board}-{vw}'
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        async def route(r):
            u = r.request.url
            if 'lz-string' in u: await r.fulfill(status=200, content_type='application/javascript', body=LZ)
            elif css and urlparse(u).hostname == 'fonts.googleapis.com': await r.fulfill(status=200, content_type='text/css', body=css)
            elif css and urlparse(u).hostname == 'fonts.gstatic.com' and urlparse(u).path.startswith('/fs/'):
                fn = urlparse(u).path.split('/fs/', 1)[1]; fam = next(x for x in ['yusei-magic', 'zen-kaku-gothic-new', 'dela-gothic-one', 'dotgothic16'] if fn.startswith(x))
                await r.fulfill(status=200, content_type='font/woff2', body=(FONTS/fam/'files'/fn).read_bytes())
            else: await r.abort()
        await page.route('https://**/*', route)
        await page.goto('file://' + str(ROOT/'test/page.html')); await page.wait_for_timeout(250)
        await page.evaluate("b => localStorage.setItem('kuratsuku.board', b)", board)
        await page.reload(); await page.wait_for_timeout(300)
        await page.click('text=新しく始める'); await page.click('[data-id="yokohamafm"]'); await page.wait_for_timeout(300)
        await page.click('[data-act="nameClub"]'); await page.wait_for_timeout(250); await page.click('#sheet [data-act="startClub"]'); await page.wait_for_timeout(300)
        if css: await page.evaluate('document.fonts.ready')
        await page.evaluate("() => { const s = document.querySelector('#sheet'); if (s && !s.hidden) document.querySelector('#sheet [data-act=closeSheet]')?.click(); }"); await page.wait_for_timeout(200)
        await page.click('[data-tab="tactics"]'); await page.wait_for_timeout(300)
        await page.wait_for_function("() => !document.querySelector('.toast.on, #toast.on')", timeout=5000)  # the welcome toast, for a clean shot
        st = await page.evaluate(LOAD); c = st['clubs'][st['my']]
        xi0, bench0 = list(c['tac']['xi']), list(c['tac']['bench'])
        # a central midfielder's place (as in the user's screenshot), else the 6th
        i = await page.evaluate("() => { const t = [...document.querySelectorAll('.tok[data-act=slot]')]; const k = t.findIndex(e => /CMF/.test(e.textContent)); return k >= 0 ? Number(t[k].dataset.i) : 5; }")
        pid = xi0[i]
        await page.click(f'.tok[data-act="slot"][data-i="{i}"]'); await page.wait_for_timeout(400)
        await page.screenshot(path=str(OUT/f'xo-sheet-{tag}.png'))
        btn = page.locator('#sheet [data-act="xiOut"]')
        ok(await btn.count() == 1 and (await btn.inner_text()).strip() == '先発から外す', 'the position sheet of a filled place has 先発から外す')
        ok(await page.locator(f'#sheet [data-act="player"][data-id="{pid}"]').count() == 1, 'and 詳細を見る for the player in that place')
        bb = await btn.bounding_box()
        ok(bb and bb['y'] + bb['height'] <= vh and bb['x'] >= 0 and bb['x'] + bb['width'] <= vw, f'the button is on the screen: {bb}')
        h = await btn.evaluate('e => [e.scrollWidth <= e.clientWidth + 1, e.getClientRects().length, Math.round(e.getBoundingClientRect().height)]')
        lines = await btn.evaluate("e => { const r = document.createRange(); r.selectNodeContents(e); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; }")
        ok(h[0] and lines == 1, f'the label fits on one line: {h} lines {lines}')
        name = st['players'][str(pid)]['short']
        await btn.click(); await page.wait_for_timeout(400)
        toast = await page.evaluate("() => (document.querySelector('.toast') || document.querySelector('#toast') || {}).textContent || ''")
        ok(f'{name}を先発から外しました' in toast, f'toast: {toast.strip()!r}')
        st = await page.evaluate(LOAD); c = st['clubs'][st['my']]
        ok(c['tac']['xi'][i] is None, 'the place is empty')
        ok(pid not in c['tac']['xi'] and pid not in c['tac']['bench'], 'the player is out of the matchday squad (not moved to the bench)')
        ok(c['tac']['bench'] == bench0 and [x for k, x in enumerate(c['tac']['xi']) if k != i] == [x for k, x in enumerate(xi0) if k != i], 'the other ten and the bench are untouched')
        ok(await page.locator(f'.tok.empty[data-i="{i}"]').count() == 1, 'the board shows the empty place')
        alert = await page.locator('.card.alert').first.inner_text() if await page.locator('.card.alert').count() else ''
        ok('空いて' in alert and await page.locator('[data-act="fillEmpty"]').count() > 0, f'the warning asks to fill it: {alert.splitlines()[:2]}')
        await page.evaluate(f"document.querySelector('.tok.empty[data-i=\"{i}\"]').scrollIntoView({{block:'center'}})"); await page.wait_for_timeout(200)
        await page.screenshot(path=str(OUT/f'xo-after-{tag}.png'))
        # an empty place: no 先発から外す
        await page.click(f'.tok.empty[data-i="{i}"]'); await page.wait_for_timeout(350)
        ok(await page.locator('#sheet [data-act="xiOut"]').count() == 0 and await page.locator('#sheet [data-act="closeSheet"]').count() == 1, 'an empty place\'s sheet has only 閉じる')
        await page.click('#sheet [data-act="closeSheet"]'); await page.wait_for_timeout(300)
        # kickoff waits
        await page.click('[data-act="go"]'); await page.wait_for_timeout(400)
        ok(await page.locator('#sheet [data-act="kickoff"]').count() == 0 and await page.locator('#sheet [data-act="toTactics"]').count() == 1, 'kickoff waits until the place is filled')
        await page.click('#sheet [data-act="toTactics"]'); await page.wait_for_timeout(350)
        await page.click('[data-act="fillEmpty"]'); await page.wait_for_timeout(350)
        st = await page.evaluate(LOAD); c = st['clubs'][st['my']]
        ok(all(c['tac']['xi']) and len(c['tac']['bench']) == 9, f'空いた枠をおまかせで埋める fills it: {c["tac"]["xi"][i]} (was {pid})')
        ok(not errs, '\n'.join(errs) or 'no page errors')
        await b.close()

asyncio.run(main(393, 852, 'chalk'))
asyncio.run(main(375, 667, 'white'))
print('FAILS', fails)
