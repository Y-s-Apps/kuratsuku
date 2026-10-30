# 2026-10-25 の画面イメージ: 施設 Lv6〜10 と「駅の向こう」を実際の画面で撮る。ユーザーに見せたのは 案1（地図を下に伸ばす）と
# 案2（2枚目の地図）で、案2 が選ばれ 案1 のコードは外した（いまは案2だけ撮る。案1 の画像は 0faa93c の版で撮れる）
# usage: python3 shoot.py [chalk|white] [幅] [高さ]  → out/*.png（make_save.js のあと。KTK_FONTS=<@fontsource> で本物の書体）
import asyncio, pathlib, os, re, json, sys
from urllib.parse import urlparse
from playwright.async_api import async_playwright
HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent.parent; OUT = HERE / 'out'; OUT.mkdir(exist_ok=True)
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', '/nonexistent'))
page_html = (ROOT / 'dist/touchline.html').read_text()
wrapped = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + page_html + '</body></html>'
(HERE / 'page.html').write_text(wrapped)
LZ = (ROOT / 'test/vendor/lz-string.min.js').read_text()
SAVES = json.loads((HERE / 'save.json').read_text())
board = sys.argv[1] if len(sys.argv) > 1 else 'chalk'
vw, vh = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (393, 852)
def font_css():
    if not FONTS.exists(): return None
    css = ''.join((FONTS / f).read_text() for f in ['dela-gothic-one/400.css', 'yusei-magic/400.css', 'dotgothic16/400.css'] + [f'zen-kaku-gothic-new/{w}.css' for w in (400, 500, 700, 900)])
    return re.sub(r"url\(\./files/([^)]+)\)", lambda m: f"url(https://fonts.gstatic.com/fs/{m.group(1)})", css)

async def main():
    css = font_css()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, has_touch=True)
        page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
        async def route(r):
            u = r.request.url
            if 'lz-string' in u: await r.fulfill(status=200, content_type='application/javascript', body=LZ)
            elif urlparse(u).hostname == 'fonts.googleapis.com' and css: await r.fulfill(status=200, content_type='text/css', body=css)
            elif urlparse(u).hostname == 'fonts.gstatic.com' and urlparse(u).path.startswith('/fs/'):
                fn = urlparse(u).path.split('/fs/', 1)[1]; fam = next(x for x in ['yusei-magic', 'zen-kaku-gothic-new', 'dela-gothic-one', 'dotgothic16'] if fn.startswith(x))
                await r.fulfill(status=200, content_type='font/woff2', body=(FONTS / fam / 'files' / fn).read_bytes())
            else: await r.abort()
        await page.route('https://**/*', route)
        tag = f'{board}-{vw}'
        async def load(st, mode):
            await page.goto('file://' + str(HERE / 'page.html')); await page.wait_for_timeout(250)
            await page.evaluate("b => localStorage.setItem('kuratsuku.board', b)", board)
            await page.evaluate("s => localStorage.setItem('touchline.j1.save', 'lz:' + LZString.compressToBase64(s))", json.dumps(st))
            await page.reload(); await page.wait_for_timeout(400); await page.click('[data-act="continue"]'); await page.wait_for_timeout(500)
            if css: await page.evaluate('document.fonts.ready')
            await page.locator('[data-act="tab"][data-tab="club"]').first.click(); await page.wait_for_timeout(250)
            await page.locator('[data-act="clView"][data-k="town"]').first.click(); await page.wait_for_timeout(350)
        async def shot(name, full=False):
            await page.wait_for_timeout(300); await page.evaluate("document.querySelector('#toast') && document.querySelector('#toast').classList.remove('on')"); await page.wait_for_timeout(200)
            await page.screenshot(path=str(OUT / f'{name}-{tag}.png'), full_page=full)
        async def scroll_to(sel, where='start', dy=0):
            await page.evaluate(f"() => {{ const e = document.querySelector('{sel}'); const r = e.getBoundingClientRect(); const top = scrollY + r.top; window.scrollTo(0, '{where}' === 'end' ? top + r.height - innerHeight + {dy} : top - {dy}); }}")
            await page.wait_for_timeout(250)
        async def el(sel, name):   # (the switch bar sticks to the bottom of the screen: out of the way for a shot of the whole board)
            await page.evaluate("document.querySelectorAll('#view > .subnav, .dock').forEach(e => e.style.visibility = 'hidden')")
            await page.locator(sel).first.screenshot(path=str(OUT / f'{name}-{tag}.png'))
            await page.evaluate("document.querySelectorAll('#view > .subnav, .dock').forEach(e => e.style.visibility = '')")
        async def sheet(k, name):
            await page.locator(f'.ht-board [data-act="htOpen"][data-k="{k}"]').first.click(); await page.wait_for_timeout(450)
            await shot(name)
            await page.locator('#sheet [data-act="closeSheet"]').last.click(); await page.wait_for_timeout(300)
        bad = lambda: page.evaluate('''() => { const B = document.querySelector('.ht-board').getBoundingClientRect(); const out = [];
              for (const e of document.querySelectorAll('.ht-board .ht-tok, .ht-board .ht-tok .lbl, .ht-board .ht-shut')) { const r = e.getBoundingClientRect(); if (r.left < B.left - 0.5 || r.right > B.right + 0.5 || r.bottom > B.bottom + 0.5) out.push(e.textContent.trim()); }
              const toks = [...document.querySelectorAll('.ht-board .ht-tok')].map(e => e.getBoundingClientRect());
              for (let i = 0; i < toks.length; i++) for (let j = i + 1; j < toks.length; j++) { const a = toks[i], b = toks[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push('overlap ' + i + ' ' + j); }
              return out; }''')

        await load(SAVES['open'], 2)
        await sheet('train', 'sh-train'); await sheet('youth', 'sh-youth')
        await page.locator('.ht-sw [data-k="east"]').click(); await page.wait_for_timeout(350)
        await sheet('hotel', 'sh-hotel'); await sheet('station', 'sh-station')
        # 案2: a second board
        await load(SAVES['open'], 2)
        await scroll_to('.ht-sw', 'start', 72); await shot('m2-top')
        await page.locator('.ht-sw [data-k="east"]').click(); await page.wait_for_timeout(350)
        await scroll_to('.ht-sw', 'start', 72); await shot('m2-east'); await el('.ht-board', 'm2-board'); print('案2', await bad())
        await sheet('museum', 'sh-museum')
        await load(SAVES['shut'], 2)
        await page.locator('.ht-sw [data-k="east"]').click(); await page.wait_for_timeout(350)
        await scroll_to('.ht-sw', 'start', 72); await shot('m2-shut'); print('案2 shut', await bad())
        await page.locator('.ht-board [data-act="htOpen"][data-k="school"]').click(); await page.wait_for_timeout(450); await shot('sh-shut')
        print('errors', errs)
        await b.close()
asyncio.run(main())
