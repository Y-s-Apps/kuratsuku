# 国際大会 in the browser (2026-10-25): the home card in a qualifying window (Japan's group table), during the World Cup 2030
# (Japan's matches, my players at the tournament, the summer's tournaments), the player sheet's 称号, the records, the
# pre-match line of 大舞台の経験. Both looks for the choice (案A chips and a list, 案B medal magnets and Japan's road:
# localStorage 'kuratsuku.ttv'). iPhone 16 chalkboard, iPhone SE whiteboard.
# usage: python3 dev/test/wc.py   (KTK_FONTS=<node_modules/@fontsource> for the real fonts) → dev/test/shots/wc-*.png
import asyncio, pathlib, os, re, json, subprocess
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent; OUT = ROOT/'test'/'shots'; OUT.mkdir(exist_ok=True)
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', '/nonexistent'))
page_html = (ROOT/'dist/touchline.html').read_text()
(ROOT/'test/page.html').write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + page_html + '</body></html>')
LZ = (ROOT/'test/vendor/lz-string.min.js').read_text()
MAKE = r"""
let x = 11; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };   // before the engine (R)
const E = require(process.argv[1] + '/src/engine.js'); const D = require(process.argv[1] + '/data.json');
const S = E.newGame(D, 'kashima', 'ソーイ', '2026-10-14'); S.settings.boardLv = 'easy';
const run = (until, stopIf) => {
  for (let g = 0; g < 40000 && S.date < until; g++) {
    if (stopIf && stopIf()) return true;
    const st = E.advance(S, 1);
    if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); if (stopIf && stopIf(f)) return true; E.autoLineup(S, S.my); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 60); }
    else if (st.stop === 'inbox' || st.stop === 'sec' || st.stop === 'note' || st.stop === 'cele' || st.stop === 'camp') { S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); }); if (S.sec) (S.sec.notes || []).forEach(n => n.seen = true); if (S.camp) S.camp.show = 0; S.cele = []; }
    else if (st.stop === 'seasonEnd') { E.rollover(S); }
    else if (st.stop === 'fired') E.takeJob(S, S.fired.offers[0]);
  }
  return false;
};
const snap = () => { const c = JSON.parse(JSON.stringify(S)); c.cele = []; c.inbox.forEach(y => y.seen = true); if (c.reborn) c.reborn.show = 0; if (c.seasonEnd) c.seasonEnd = null; return c; };
const out = {};
// the 最終予選 under way (three matches played)
run('2028-09-29'); out.wq = snap();
// one of mine for Japan at the World Cup: my best young Japanese a lot better
run('2030-05-20');
const W = S.nt.wq[2030]; if (W && W.done !== 'q') { W.done = 'q'; W.q = (W.q || []).filter(c => c !== 'JPN').slice(0, 7).concat('JPN'); W.out = (W.out || []).filter(c => c !== 'JPN'); }
const mine = E.squad(S, S.my).filter(p => p.nat === 'JPN' && !p.loan).sort((a, b) => b.ovr - a.ovr)[0];
mine.ovr += 10; mine.at = mine.at.map(v => v + 10);
run('2030-07-06'); out.wc = snap();
run('2030-07-24'); out.after = snap();
// a big match of mine with a 称号 holder: the morning of it
const found = run('2031-06-01', f => f && f.hype && (f.hype.exp || []).some(e => S.players[e.pid] && S.players[e.pid].club === S.my));
if (found) { out.pre = snap(); }
console.log(JSON.stringify({ saves: out, mine: mine.id, wcJpn: (S.nt.th || []).find(t => t.key === 'wc2030') || null }));
"""
DATA = json.loads(subprocess.run(['node', '-e', MAKE, str(ROOT)], capture_output=True, text=True, check=True).stdout)
SAVES = DATA['saves']
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
            elif css and 'fonts.googleapis.com' in u: await r.fulfill(status=200, content_type='text/css', body=css)
            elif css and 'fonts.gstatic.com/fs/' in u:
                fn = u.split('/fs/')[1]; fam = next(x for x in ['yusei-magic', 'zen-kaku-gothic-new', 'dela-gothic-one', 'dotgothic16'] if fn.startswith(x))
                await r.fulfill(status=200, content_type='font/woff2', body=(FONTS/fam/'files'/fn).read_bytes())
            else: await r.abort()
        await page.route('https://**/*', route)
        async def load(st, v):
            await page.goto('file://' + str(ROOT/'test/page.html')); await page.wait_for_timeout(250)
            await page.evaluate("([b, v]) => { localStorage.setItem('kuratsuku.board', b); localStorage.setItem('kuratsuku.ttv', v); }", [board, v])
            await page.evaluate("s => localStorage.setItem('touchline.j1.save', 'lz:' + LZString.compressToBase64(s))", json.dumps(st))
            await page.reload(); await page.wait_for_timeout(400); await page.click('[data-act="continue"]'); await page.wait_for_timeout(500)
            if css: await page.evaluate('document.fonts.ready')
            await page.evaluate("() => { const s = document.querySelector('#sheet'); if (s && !s.hidden) document.querySelector('#sheet [data-act=closeSheet]')?.click(); }"); await page.wait_for_timeout(250)
        async def to_card(text):
            await page.evaluate("t => { const el = [...document.querySelectorAll('.card .eyebrow')].find(e => e.textContent.includes(t)); if (el) el.closest('.card').scrollIntoView({block: 'start'}); window.scrollBy(0, -64); }", text)
            await page.wait_for_timeout(250)
        async def wide(what):
            o = await page.evaluate("() => [...document.querySelectorAll('.card, .sheet-body > *, .tt-row, .wq-tab')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length")
            ok(o == 0, f'{what}: nothing runs off the screen ({o})')
        for v in ('A', 'B'):
            # the 最終予選
            await load(SAVES['wq'], v); t = await page.locator('#view').inner_text()
            ok('W杯アジア最終予選' in t and '日本' in t, f'{v}: the qualifying window card')
            ok(await page.locator('.wq-tab tr').count() == 6, f'{v}: Japan\'s group of six')
            await to_card('W杯'); await page.evaluate("() => { const t = document.querySelector('.wq-tab'); if (t) t.scrollIntoView({block: 'center'}); }"); await page.wait_for_timeout(200)
            await wide(f'{v} qualifiers'); await page.screenshot(path=str(OUT/f'wc-wq-{v}-{tag}.png'))
            # the World Cup under way
            await load(SAVES['wc'], v); t = await page.locator('#view').inner_text()
            ok('W杯2030' in t and 'この夏の国際大会' in t, f'{v}: the World Cup card')
            if v == 'B': ok(await page.locator('.road-card .road li').count() == 7, 'B: Japan\'s road (7 steps)')
            await to_card('W杯2030'); await wide(f'{v} world cup'); await page.screenshot(path=str(OUT/f'wc-card-{v}-{tag}.png'))
            # after it: the player sheet's 称号
            await load(SAVES['after'], v)
            await page.click('[data-tab="squad"]'); await page.wait_for_timeout(300)
            await page.evaluate("id => { const b = document.querySelector(`[data-id=\"${id}\"]`); if (b) b.click(); }", str(DATA['mine'])); await page.wait_for_timeout(450)
            st = await page.locator('#sheet').inner_text()
            ok('称号' in st and 'W杯2030' in (st if v == 'A' else st + 'W杯2030'), f'{v}: the player sheet shows the 称号')
            await page.evaluate("() => { const el = [...document.querySelectorAll('#sheet .eyebrow')].find(x => x.textContent === '称号'); if (el) el.scrollIntoView({block: 'center'}); }"); await page.wait_for_timeout(250)
            await wide(f'{v} player sheet'); await page.screenshot(path=str(OUT/f'wc-player-{v}-{tag}.png'))
        # the same in both: the records and the pre-match line
        await load(SAVES['after'], 'A')
        await page.click('[data-tab="club"]'); await page.wait_for_timeout(300)
        await page.click('[data-act="clView"][data-k="records"]'); await page.wait_for_timeout(300)
        t = await page.locator('#view').inner_text()
        ok('国際大会' in t and 'W杯2030' in t and 'EURO2028' in t, 'records: the tournaments')
        await page.evaluate("() => { const el = [...document.querySelectorAll('.eyebrow')].find(x => x.textContent === '国際大会'); if (el) el.scrollIntoView({block: 'start'}); window.scrollBy(0, -64); }"); await page.wait_for_timeout(250)
        await page.screenshot(path=str(OUT/f'wc-records-{tag}.png'))
        if SAVES.get('pre'):
            await load(SAVES['pre'], 'A')
            await page.click('[data-act="go"]'); await page.wait_for_timeout(500)
            st = await page.locator('#sheet').inner_text()
            ok('大舞台の経験' in st, 'pre-match: 大舞台の経験')
            await page.evaluate("() => { const el = [...document.querySelectorAll('#sheet .fine')].find(x => x.textContent.includes('大舞台の経験')); if (el) el.scrollIntoView({block: 'center'}); }"); await page.wait_for_timeout(250)
            await page.screenshot(path=str(OUT/f'wc-pre-{tag}.png'))
        ok(not errs, '\n'.join(errs) or 'no page errors')
        await b.close()

print('W杯2030:', json.dumps({k: DATA['wcJpn'][k] for k in ('champ', 'jp')} if DATA['wcJpn'] else None))
asyncio.run(main(393, 852, 'chalk'))
asyncio.run(main(375, 667, 'white'))
print('FAILS', fails); raise SystemExit(1 if fails else 0)
