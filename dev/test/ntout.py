# 代表の不参加と追加招集 in the browser (2026-10-25): the day they join, my player still injured stays at the club (toast
# 「…が負傷で代表に不参加」, the home card's 不参加 chip and why), one of mine called in place of an injured goalkeeper (追加招集),
# the card's last line (不参加・追加招集), a player who left the camp injured (負傷で離脱). iPhone 16 chalkboard, iPhone SE whiteboard.
# usage: python3 dev/test/ntout.py   (KTK_FONTS=<node_modules/@fontsource> for the real fonts) → dev/test/shots/no-*.png
import asyncio, pathlib, os, re, json, subprocess
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT/'test'/'shots'; OUT.mkdir(exist_ok=True)
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', '/nonexistent'))
page_html = (ROOT/'dist/touchline.html').read_text()
(ROOT/'test/page.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + page_html + '</body></html>')
LZ = (ROOT/'test/vendor/lz-string.min.js').read_text()
MAKE = r"""
let x = 7; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };   // before the engine (R)
const E = require(process.argv[1] + '/src/engine.js'); const D = require(process.argv[1] + '/data.json');
const S = E.newGame(D, 'yokohamafm', 'ソーイ', '2026-10-14');
const run = until => {
  for (let g = 0; g < 4000 && S.date < until; g++) {
    const st = E.advance(S, 1);
    if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { rotate: true }); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 50); }
    else if (st.stop === 'inbox' || st.stop === 'sec' || st.stop === 'note') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
    else if (st.stop === 'seasonEnd') break;
  }
};
const snap = () => { const c = JSON.parse(JSON.stringify(S)); c.cele = []; return c; };
const deng = Object.values(S.players).find(p => p.name === 'トーマス デン'); deng.ovr += 3; deng.at = deng.at.map(v => v + 3);   // in Australia's squad
run('2026-09-17');
const C = S.nt.cur, inSq = id => Object.values(C.sq).flat().includes(id);
deng.inj = 14;                                                       // still injured on 9/21: 不参加
const gk = C.sq.JPN.map(id => S.players[id]).find(p => p.pos === 'GK' && p.club !== S.my); gk.inj = 12;   // replaced always
const mf = C.sq.JPN.map(id => S.players[id]).find(p => p.pos === 'MF' && p.club !== S.my && p.inj <= 0); mf.inj = 12;
const mine = E.squad(S, S.my).filter(p => p.nat === 'JPN' && p.pos === 'GK' && !inSq(p.id)).sort((a, b) => b.ovr - a.ovr)[0];
mine.ovr += 12; mine.at = mine.at.map(v => v + 12);                 // he is the next goalkeeper
run('2026-09-20'); const pre = snap();
// the camp: he leaves it injured after the first match (another called in his place)
run('2026-09-21'); S.inbox.forEach(y => y.seen = true);
run('2026-09-25'); mine.inj = 9; mine.away.to = S.date; E.NT.rep = 1; E.ntOut(S, C, 'JPN', mine, 'inj', true);
run('2026-09-26'); const mid = snap();
console.log(JSON.stringify({ pre, mid, deng: deng.id, mine: mine.id, gk: gk.id, mf: mf.id }));
"""
D = json.loads(subprocess.run(['node', '-e', MAKE, str(ROOT)], capture_output=True, text=True, check=True).stdout)
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
        async def load(st):
            await page.goto('file://' + str(ROOT/'test/page.html')); await page.wait_for_timeout(250)
            await page.evaluate("b => localStorage.setItem('kuratsuku.board', b)", board)
            await page.evaluate("s => localStorage.setItem('touchline.j1.save', 'lz:' + LZString.compressToBase64(s))", json.dumps(st))
            await page.reload(); await page.wait_for_timeout(400); await page.click('[data-act="continue"]'); await page.wait_for_timeout(500)
            if css: await page.evaluate('document.fonts.ready')
        view = page.locator('#view')
        async def card_into_view():
            await page.evaluate("() => { const el = [...document.querySelectorAll('.eyebrow')].find(e => e.textContent.includes('代表ウィーク')); if (el) el.closest('.card').scrollIntoView({block: 'start'}); window.scrollBy(0, -64); }")
            await page.wait_for_timeout(250)
        names = {k: D['pre']['players'][str(D[k])]['short'] for k in ('deng', 'mine', 'gk', 'mf')}
        # 9/20 → 9/21: they join; mine stays at the club, mine called in place of the goalkeeper
        await load(D['pre'])
        await page.click('[data-act="go"]'); await page.wait_for_timeout(500)
        toast = await page.evaluate("() => (document.querySelector('#toast') || {}).textContent || ''")
        ok(f"代表：{names['deng']}が不参加、{names['mine']}が追加招集" in toast, f'the day stops with one toast for both: {toast.strip()!r}')
        await page.screenshot(path=str(OUT/f'no-toast-{tag}.png'))
        await page.evaluate("document.querySelector('#toast').classList.remove('on')")
        await card_into_view()
        card = page.locator('.card', has=page.locator('.eyebrow', has_text='代表ウィーク')).first
        t = await card.inner_text()
        rows = page.locator('.ntrow')
        rd = await page.locator('.ntrow', has_text=names['deng']).first.inner_text() if await page.locator('.ntrow', has_text=names['deng']).count() else ''
        ok('不参加' in rd and '負傷のため不参加・クラブで治療' in rd, f'my injured player: 不参加 and why: {rd.splitlines()}')
        rm = await page.locator('.ntrow', has_text=names['mine']).first.inner_text() if await page.locator('.ntrow', has_text=names['mine']).count() else ''
        ok('追加招集' in rm and '日本代表' in rm, f'my player called in: 追加招集: {rm.splitlines()}')
        ok('不参加：' in t and D['pre']['players'][str(D['gk'])]['name'] in t and D['pre']['players'][str(D['mf'])]['name'] in t, 'the last line names who did not go (full names)')
        ok(f"{names['mine']}" in t and '※追加招集' in t, 'and who was called in (J1)')
        ov = await page.evaluate("() => [...document.querySelectorAll('.ntrow, .ntrow .chips')].filter(e => e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > innerWidth + 1).length")
        ok(ov == 0, f'no row runs off the screen ({ov})')
        await page.screenshot(path=str(OUT/f'no-card-{tag}.png'))
        await page.evaluate("() => { const el = [...document.querySelectorAll('.card p.fine')].find(e => e.textContent.includes('不参加：')); if (el) el.scrollIntoView({block: 'center'}); }"); await page.wait_for_timeout(250)
        await page.screenshot(path=str(OUT/f'no-line-{tag}.png'))
        # the camp: he left it injured
        await load(D['mid'])
        await card_into_view()
        rm = await page.locator('.ntrow', has_text=names['mine']).first.inner_text() if await page.locator('.ntrow', has_text=names['mine']).count() else ''
        ok('負傷で離脱' in rm and '帰国' in rm, f'left the camp injured: {rm.splitlines()}')
        ok('負傷で離脱：' in await view.inner_text(), 'the last line: 負傷で離脱')
        await page.screenshot(path=str(OUT/f'no-mid-{tag}.png'))
        ok(not errs, '\n'.join(errs) or 'no page errors')
        await b.close()

asyncio.run(main(393, 852, 'chalk'))
asyncio.run(main(375, 667, 'white'))
print('FAILS', fails); raise SystemExit(1 if fails else 0)
