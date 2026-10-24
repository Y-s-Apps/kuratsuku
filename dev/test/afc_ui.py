# ACL の画面（2026-10-23、案B＋案C）: カップ戦の「ACL」タブ（ACLE / ACL2、アジアへの道、次のACL、日本勢、順位表、勝ち上がり表）、
# 海外クラブの情報、試合のチケット。src を組み立てたページで、エラーが無い・横にはみ出さない・マグネット（エンブレム）が
# 正円のまま（幅＝高さ）を確かめ、スクショを dev/test/shots/afc/ に残す。
# usage: python3 dev/test/afc_ui.py [chalk|white|both] [393x852,375x667]   （KTK_FONTS があれば本物の書体）
import asyncio, pathlib, os, re, json, sys, subprocess
from playwright.async_api import async_playwright
DEV = pathlib.Path(__file__).resolve().parent.parent
OUT = DEV / 'test/shots/afc'; OUT.mkdir(parents=True, exist_ok=True)
FONTS = pathlib.Path(os.environ.get('KTK_FONTS', ''))
src = DEV / 'src'
tpl = (src / 'template.html').read_text()
for k, v in [('/*DATA*/', (DEV / 'data.json').read_text()), ('/*ENGINE*/', (src / 'engine.js').read_text()), ('/*M2D*/', (src / 'match2d.js').read_text()), ('/*APP*/', (src / 'app.js').read_text())]:
    i = tpl.index(k); tpl = tpl[:i] + v + tpl[i + len(k):]
PAGE = OUT / 'page.html'
PAGE.write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + tpl + '</body></html>')
LZ = (DEV / 'test/vendor/lz-string.min.js').read_text()
SAVES = [('kashima', '2026-11-27', 'k-nov'), ('kashima', '2027-03-20', 'k-mar'), ('gosaka', '2026-08-08', 'g-aug'), ('machida', '2026-11-27', 'm-nov'), ('urawa', '2026-11-27', 'u-nov'), ('kashima', '2026-12-02', 'k-dec')]
for club, until, tag in SAVES:
    f = OUT / f'save-{tag}.json'
    if not f.exists():
        with open(f, 'w') as fh: subprocess.run(['node', str(DEV / 'test/mock_afc/make_save.js'), club, until], stdout=fh, stderr=subprocess.DEVNULL, check=True, cwd=str(DEV / 'test/mock_afc'))

def font_css():
    if not FONTS.name: return ''
    css = ''.join((FONTS / f).read_text() for f in ['dela-gothic-one/400.css', 'yusei-magic/400.css', 'dotgothic16/400.css'] + [f'zen-kaku-gothic-new/{w}.css' for w in (400, 500, 700, 900)])
    return re.sub(r"url\(\./files/([^)]+)\)", lambda m: f"url(https://fonts.gstatic.com/fs/{m.group(1)})", css)

bad = []
def ok(c, m):
    if not c: bad.append(m); print('NG', m)

CHECK = '''() => {
  const ks = [...document.querySelectorAll('.kit')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  const squash = ks.filter(e => { const r = e.getBoundingClientRect(); return Math.abs(r.width - r.height) > 1; }).map(e => { const r = e.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + (e.parentElement.className || e.parentElement.tagName); });
  return { kits: ks.length, squash: squash.slice(0, 4), over: document.documentElement.scrollWidth - window.innerWidth };
}'''
# 勝ち上がり表のずれ（2026-10-24、ユーザーのスクショ「準決勝や決勝がずれている」）: 見出しが同じ高さ、線でつながる列（準決勝・決勝）の
# 試合が前の列の2試合のちょうど真ん中、つなぎの線が両方の箱に届く、スクロールの終わりに余白
BK_ALIGN = '''() => {
  const bad = [], mid = e => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
  const hs = [...document.querySelectorAll('.bk-h')].map(h => Math.round(h.getBoundingClientRect().top));
  if (new Set(hs).size !== 1) bad.push('headings ' + hs.join(','));
  const cols = [...document.querySelectorAll('.bk-col')];
  cols.forEach((c, i) => {
    if (!c.classList.contains('bk-in')) return;
    const prev = [...cols[i - 1].querySelectorAll('.bk-m')], cur = [...c.querySelectorAll('.bk-m')];
    if (prev.length !== cur.length * 2) bad.push(`col ${i}: ${prev.length} → ${cur.length}`);
    cur.forEach((m, k) => { const d = mid(m) - (mid(prev[2 * k]) + mid(prev[2 * k + 1])) / 2; if (Math.abs(d) > 1) bad.push(`col ${i} tie ${k} off by ${d.toFixed(1)}px`); });
    const a = getComputedStyle(cols[i - 1].querySelector('.bk-s'), '::after'), b = getComputedStyle(c.querySelector('.bk-s'), '::before');
    const gap = c.getBoundingClientRect().left - cols[i - 1].getBoundingClientRect().right;
    if (Math.abs(parseFloat(a.width) + parseFloat(b.width) - gap) > 0.5) bad.push(`col ${i}: the lines do not reach (${a.width} + ${b.width} vs ${gap})`);
  });
  const w = document.querySelector('.bk-wrap'), wr = w.getBoundingClientRect();
  w.scrollLeft = 99999; const end = wr.right - cols[cols.length - 1].getBoundingClientRect().right; w.scrollLeft = 0;
  if (end < 6) bad.push('no margin after the final: ' + end.toFixed(1));
  return { bad };
}'''

async def main(boards, sizes):
    css = font_css()
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for board in boards:
            for (vw, vh) in sizes:
                ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=2, has_touch=True)
                page = await ctx.new_page(); errs = []
                page.on('pageerror', lambda e: errs.append(str(e)))
                async def route(r):
                    u = r.request.url
                    if 'lz-string' in u: await r.fulfill(status=200, content_type='application/javascript', body=LZ)
                    elif 'fonts.googleapis.com' in u: await r.fulfill(status=200, content_type='text/css', body=css)
                    elif 'fonts.gstatic.com/fs/' in u:
                        fn = u.split('/fs/')[1]; fam = next(x for x in ['yusei-magic', 'zen-kaku-gothic-new', 'dela-gothic-one', 'dotgothic16'] if fn.startswith(x))
                        await r.fulfill(status=200, content_type='font/woff2', body=(FONTS / fam / 'files' / fn).read_bytes())
                    else: await r.abort()
                await page.route('https://**/*', route)
                await page.goto('file://' + str(PAGE)); await page.wait_for_timeout(250)
                tagv = f'{board}-{vw}'
                async def load(tag):
                    s = json.loads((OUT / f'save-{tag}.json').read_text())['save']
                    await page.evaluate("b => localStorage.setItem('kuratsuku.board', b)", board)
                    await page.evaluate("s => localStorage.setItem('touchline.j1.save', 'lz:' + LZString.compressToBase64(s))", json.dumps(s))
                    await page.reload(); await page.wait_for_timeout(300); await page.click('[data-act="continue"]'); await page.wait_for_timeout(400)
                    await page.evaluate('document.fonts.ready')
                async def acl(comp=None):
                    await page.click('[data-act="tab"][data-tab="league"]'); await page.wait_for_timeout(120)
                    await page.click('[data-act="lgView"][data-k="cups"]'); await page.wait_for_timeout(120)
                    await page.click('[data-act="cupPick"][data-k="acl"]'); await page.wait_for_timeout(150)
                    if comp: await page.click(f'[data-act="afcComp"][data-k="{comp}"]'); await page.wait_for_timeout(150)
                    await page.evaluate('window.scrollTo(0, 0)'); await page.wait_for_timeout(80)
                async def shot(name, y=None, sel=None, check=True):
                    if sel: await page.evaluate("s => { const e = document.querySelector(s); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 80); }", sel)
                    elif y is not None: await page.evaluate(f'window.scrollTo(0, {y})')
                    await page.wait_for_timeout(120)
                    await page.screenshot(path=str(OUT / f'{name}-{tagv}.png'))
                    if check:
                        r = await page.evaluate(CHECK)
                        ok(not r['squash'], f'{name} {tagv}: magnets keep their round shape {r["squash"]}')
                        ok(r['over'] <= 0, f'{name} {tagv}: no sideways overflow ({r["over"]}px)')
                # 鹿島 11月: ACLE（アジアへの道・次のACL・日本勢・順位表）
                await load('k-nov'); await acl()
                ok(await page.locator('.road-card').count() == 1 and await page.locator('.road li').count() == 6, 'k-nov: アジアへの道 with six steps')
                ok(await page.locator('.jplist li').count() == 6, 'k-nov: 日本勢 six clubs')
                await shot('acl-k-nov-1'); await shot('acl-k-nov-2', sel='.jplist'); await shot('acl-k-nov-3', sel='.tbl.afc')
                ok(await page.locator('.tbl.afc tbody tr[data-act]').count() < 16, 'k-nov: the compact table')
                await page.click('[data-act="afcAll"]'); await page.wait_for_timeout(150)
                ok(await page.locator('.tbl.afc tbody tr[data-act]').count() == 16, 'k-nov: all 16 after the button')
                await page.click('[data-act="afcReg"][data-k="W"]'); await page.wait_for_timeout(150); await shot('acl-k-nov-west', sel='.tbl.afc')
                await page.click('[data-act="afcAll"]'); await page.wait_for_timeout(100)
                await acl('acl2'); await shot('acl-k-nov-acl2')
                # an overseas club: 全北 (players) and アル・ナスル (not met yet: the 2026/27 squad to look at)
                await acl('acle'); await page.click('[data-act="afcAll"]'); await page.wait_for_timeout(100)
                await page.click('.tbl.afc tr[data-id="jeonbuk"]'); await page.wait_for_timeout(350)
                await shot('team-jeonbuk', check=True)
                await page.evaluate("document.querySelector('#sheet .sheet-body').scrollTop = 99999"); await page.wait_for_timeout(120); await shot('team-jeonbuk-end')
                await page.evaluate("() => document.getElementById('scrim').click()"); await page.wait_for_timeout(300)
                await page.click('[data-act="afcReg"][data-k="W"]'); await page.wait_for_timeout(150)
                await page.click('.tbl.afc tr[data-id="alnassr"]'); await page.wait_for_timeout(350); await shot('team-alnassr')
                await page.click('[data-act="teamTab"][data-k="squad"]'); await page.wait_for_timeout(250); await shot('team-alnassr-squad')
                ok('ロナウド' in await page.inner_text('#sheet'), 'アル・ナスル: the real squad (クリスティアーノ ロナウド)')
                await page.evaluate("() => document.getElementById('scrim').click()"); await page.wait_for_timeout(300)
                await page.click('[data-act="afcAll"]'); await page.wait_for_timeout(100)
                # 鹿島 3月: the bracket first
                await load('k-mar'); await acl()
                ok(await page.locator('.bk-m').count() == 15, 'k-mar: bracket 8 + 4 + 2 + 1')
                for comp in ['acle', 'acl2']:
                    await acl(comp); r = await page.evaluate(BK_ALIGN)
                    ok(not r['bad'], f'k-mar {comp} {tagv}: the bracket lines up (headings in a row, a tie halfway between the two that feed it, lines that reach, a margin at the end) {r["bad"]}')
                await acl('acle')
                await shot('acl-k-mar-1'); await shot('acl-k-mar-2', sel='.bk-wrap')
                await page.evaluate("document.querySelector('.bk-wrap').scrollLeft = 400"); await shot('acl-k-mar-3', sel='.bk-wrap')
                await acl('acl2'); await shot('acl-k-mar-acl2', sel='.bk-wrap')
                # G大阪 8月: the preliminary stage; the home ticket for it
                await load('g-aug'); await shot('home-g-aug', 0)
                await acl(); ok('プレーオフ' in await page.inner_text('#view'), 'g-aug: プレーオフ'); await shot('acl-g-aug-1'); await shot('acl-g-aug-2', sel='.sec-h')
                # 町田 11月: ACL2 by default
                await load('m-nov'); await acl()
                ok(await page.locator('[data-act="afcComp"][data-k="acl2"][aria-pressed="true"]').count() == 1, 'm-nov: ACL2 open by default')
                await shot('acl-m-nov-1'); await shot('acl-m-nov-2', sel='.tbl.afc')
                # 浦和 11月: not in the ACL
                await load('u-nov'); await acl(); ok('不参加' in await page.inner_text('#view'), 'u-nov: 不参加'); await shot('acl-u-nov-1')
                # 鹿島 12/2: the ticket and the pre-match sheet of an ACL match away (大田)
                await load('k-dec'); await shot('home-k-dec', 0)
                ok('ACL ELITE' in await page.inner_text('.ticket'), 'k-dec: the ACL ticket')
                await page.click('.dock [data-act="go"], [data-act="go"]'); await page.wait_for_timeout(500); await shot('pre-k-dec', check=True)
                ok('リーグステージ第' in await page.inner_text('#sheet'), 'k-dec: the pre-match sheet of the ACL match')
                await page.evaluate("() => document.getElementById('scrim').click()"); await page.wait_for_timeout(300)
                ok(not errs, f'{tagv}: no page errors {errs[:3]}')
                await ctx.close()
        await b.close()

boards = ['chalk', 'white'] if len(sys.argv) < 2 or sys.argv[1] == 'both' else [sys.argv[1]]
sizes = [tuple(map(int, s.split('x'))) for s in (sys.argv[2] if len(sys.argv) > 2 else '393x852,375x667').split(',')]
asyncio.run(main(boards, sizes))
print(f'{len(bad)} NG' if bad else 'afc_ui: all OK')
sys.exit(1 if bad else 0)
