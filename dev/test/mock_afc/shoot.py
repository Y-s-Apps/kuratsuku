# ACL（2026-10-23）の画面イメージ: 実際のアプリ（src を組み立てたもの）に variants.js（案A〜C）を差し込んでスクショ
# usage: cd dev/test/mock_afc && node make_save.js kashima 2026-11-27 > save-a.json && node make_save.js kashima 2027-03-20 > save-b.json
#        && KTK_FONTS=<@fontsource のフォルダ> python3 shoot.py [chalk|white] [w] [h]  → out/*.png（compose.py で並べる）
import asyncio, pathlib, os, re, json, sys
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent
DEV = HERE.parent.parent
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', ''))
OUT = HERE / 'out'; OUT.mkdir(exist_ok=True)
src = DEV / 'src'
tpl = (src / 'template.html').read_text()
app = (src / 'app.js').read_text()
var = (HERE / 'variants.js').read_text()
cut = app.index('const hot = window.claude && window.claude.hot;')   # before the app starts
app = app[:cut] + var + '\n' + app[cut:]
mock_css = (HERE / 'mock.css').read_text()
for k, v in [('/*DATA*/', (DEV / 'data.json').read_text()), ('/*ENGINE*/', (src / 'engine.js').read_text()), ('/*M2D*/', (src / 'match2d.js').read_text()), ('/*APP*/', app)]:
    i = tpl.index(k); tpl = tpl[:i] + v + tpl[i + len(k):]
wrapped = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + tpl + '</body></html>'
(HERE / 'page.html').write_text(wrapped)
if len(sys.argv) > 1 and sys.argv[1] == 'build': sys.exit(0)   # page.html only
LZ = (DEV / 'test/vendor/lz-string.min.js').read_text()

def font_css():
    if not FONTS.name: return ''
    css = ''.join((FONTS / f).read_text() for f in ['dela-gothic-one/400.css', 'yusei-magic/400.css', 'dotgothic16/400.css'] + [f'zen-kaku-gothic-new/{w}.css' for w in (400, 500, 700, 900)])
    return re.sub(r"url\(\./files/([^)]+)\)", lambda m: f"url(https://fonts.gstatic.com/fs/{m.group(1)})", css)

async def main(board, vw, vh):
    css = font_css()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
        async def route(r):
            u = r.request.url
            if 'lz-string' in u: await r.fulfill(status=200, content_type='application/javascript', body=LZ)
            elif 'fonts.googleapis.com' in u: await r.fulfill(status=200, content_type='text/css', body=css)
            elif 'fonts.gstatic.com/fs/' in u:
                fn = u.split('/fs/')[1]; fam = next(x for x in ['yusei-magic', 'zen-kaku-gothic-new', 'dela-gothic-one', 'dotgothic16'] if fn.startswith(x))
                await r.fulfill(status=200, content_type='font/woff2', body=(FONTS / fam / 'files' / fn).read_bytes())
            else: await r.abort()
        await page.route('https://**/*', route)
        await page.goto('file://' + str(HERE / 'page.html')); await page.wait_for_timeout(250)

        async def load(save):
            s = json.loads((HERE / save).read_text())['save']
            await page.evaluate("b => localStorage.setItem('kuratsuku.board', b)", board)
            await page.evaluate("s => localStorage.setItem('touchline.j1.save', 'lz:' + LZString.compressToBase64(s))", json.dumps(s))
            await page.reload(); await page.wait_for_timeout(400); await page.click('[data-act="continue"]'); await page.wait_for_timeout(500)
            await page.evaluate('document.fonts.ready'); await page.add_style_tag(content=mock_css)

        async def cup(v, key, extra=None):
            await page.evaluate("v => { window.AFC_MOCK = v; }", v)
            await page.click('[data-act="tab"][data-tab="league"]'); await page.wait_for_timeout(150)
            await page.click('[data-act="lgView"][data-k="cups"]'); await page.wait_for_timeout(150)
            await page.click(f'[data-act="cupPick"][data-k="{key}"]'); await page.wait_for_timeout(200)
            if extra: await page.click(extra); await page.wait_for_timeout(200)
            await page.evaluate('window.scrollTo(0, 0)'); await page.wait_for_timeout(100)

        async def shot(name, y=0, sel=None):
            if sel:
                await page.evaluate("s => { const e = document.querySelector(s); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 70); }", sel)
            else: await page.evaluate(f'window.scrollTo(0, {y})')
            await page.wait_for_timeout(150)
            await page.screenshot(path=str(OUT / f'{name}-{board}.png'))

        tag = board
        for save, d in [('save-a.json', 'nov'), ('save-b.json', 'mar')]:
            await load(save)
            # 案A: ACLE tab (table, then the knockout), ACL2 tab
            await cup('A', 'acle'); await shot(f'A-{d}-1'); await shot(f'A-{d}-2', 560)
            if d == 'mar': await shot(f'A-{d}-3', sel='.sec-h:nth-of-type(3)')
            await cup('A', 'acl2'); await shot(f'A-{d}-acl2')
            # 案B: ACL tab with the bracket
            await cup('B', 'acl'); await shot(f'B-{d}-1'); await shot(f'B-{d}-2', 520)
            await cup('B', 'acl', '[data-act="afcComp"][data-k="acl2"]'); await shot(f'B-{d}-acl2')
            # 案C: my club's road + Japanese clubs
            await cup('C', 'acl'); await shot(f'C-{d}-1'); await shot(f'C-{d}-2', 520)
            # an overseas club's sheet (same in all three)
            if d == 'nov':
                await cup('A', 'acle')
                await page.click('tr[data-act="team"][data-id="jeonbuk"]'); await page.wait_for_timeout(400)
                await page.screenshot(path=str(OUT / f'team-jeonbuk-{tag}.png'))
                await page.evaluate("document.querySelector('#sheet .sheet-body').scrollTop = 420"); await page.wait_for_timeout(150)
                await page.screenshot(path=str(OUT / f'team-jeonbuk2-{tag}.png'))
                await page.click('[data-act="teamTab"][data-k="squad"]'); await page.wait_for_timeout(300)
                await page.screenshot(path=str(OUT / f'team-jeonbuk-squad-{tag}.png'))
                await page.evaluate("() => { const s = document.getElementById('scrim'); if (s) s.click(); }"); await page.wait_for_timeout(300)
        print('errors:', errs[:5] if errs else 'none')
        await b.close()

board = sys.argv[1] if len(sys.argv) > 1 else 'chalk'
vw = int(sys.argv[2]) if len(sys.argv) > 2 else 393
vh = int(sys.argv[3]) if len(sys.argv) > 3 else 852
asyncio.run(main(board, vw, vh))
