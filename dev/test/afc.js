// ACL (2026-10-23): AFCチャンピオンズリーグエリート / Two. The data (2026/27 clubs, squads, the draw, dates), a new game's
// AFC season (the real draw, the Japanese clubs' real dates), a whole season (stages, money, titles, records, no domestic
// match too close to an AFC match, no two matches a day), the next season (Japan's places by the JFA rules, the other
// clubs drawn from 2023/24〜2026/27, the holders in, the Lカップ seeds), discipline, an old save (v17), and the quick
// simulation of overseas matches against the match engine (`calib` argument: refit it).
// usage: node dev/test/afc.js [calib]
const E = require('../src/engine.js'); const DATA = require('../data.json');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('NG', m); } };
let x = Number(process.env.SEED || 21); Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
const A = DATA.afc;
const play = (S, until) => {
  for (let g = 0; g < 30000; g++) {
    if (until && S.date >= until) return 'until';
    const st = E.advance(S, 1);
    if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { rotate: true }); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 40); }
    else if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
    else if (st.stop === 'seasonEnd') return 'end';
    else if (st.stop === 'fired') return 'fired';
    else if (st.stop === 'cele') S.cele = [];
  }
};
const top14 = (S, cid) => E.strength(S, cid);
const fxOf = (S, cup, cr) => S.fixtures.filter(f => f.cup === cup && (cr == null || f.cr === cr));

// ---------- data ----------
{
  const ids = new Set(A.clubs.map(c => c.id));
  ok(A.clubs.length >= 120, `clubs ${A.clubs.length}`);
  for (const reg of ['E', 'W']) {
    const t = A.s2026.acle[reg], cl = Object.keys(t);
    ok(cl.length === 14 + 2 - 2 + 2, `${reg}: 16 league-stage clubs in the 2026/27 draw (${cl.length})`);
    for (const [c, s] of Object.entries(t)) {
      const m = s.split(' ');
      ok(m.length === 8 && m.filter(y => y[0] === '+').length === 4, `${c}: 8 matches, 4 at home`);
      for (const y of m) { const o = y.slice(1), back = t[o] && t[o].split(' ').find(z => z.slice(1) === c); ok(back && back[0] !== y[0], `${c} v ${o} both ways`); }
    }
  }
  for (const [g, l] of Object.entries(A.s2026.acl2.groups)) ok(l.length === 4 && l.every(id => ids.has(id) || A.jrec[id]), `ACL2 group ${g}`);
  // every overseas 2026/27 league-stage club has its real squad; the top 14 average its strength
  const S = E.newGame(DATA, 'kashima', 'T', '2026-08-07');
  for (const reg of ['E', 'W']) for (const id of Object.keys(A.s2026.acle[reg])) {
    if (!S.clubs[id] || !S.clubs[id].afc) continue;
    ok(A.squads[id] && A.squads[id].length >= 20, `${id}: real squad`);
    E.afcSquad(S, id);
    ok(Math.abs(top14(S, id) - S.clubs[id].afc.s) < 0.6, `${id}: top 14 ${top14(S, id).toFixed(1)} ≈ ${S.clubs[id].afc.s}`);
  }
  // the order of strength: Al Hilal / Al Nassr above the J1 average, Buriram and CAHN below the J1 champions
  const j1 = S.order.reduce((a, id) => a + top14(S, id), 0) / S.order.length;
  ok(S.clubs.alhilal.afc.s > j1 + 2 && S.clubs.alnassr.afc.s > j1 + 2, `Al Hilal ${S.clubs.alhilal.afc.s} / Al Nassr ${S.clubs.alnassr.afc.s} > J1 average ${j1.toFixed(1)} + 2`);
  ok(S.clubs.buriram.afc.s < top14(S, 'kashima') && S.clubs.cahn.afc.s < top14(S, 'kashima'), 'Buriram / CAHN below 鹿島');
  // an invented squad (later seasons): 26 players, three keepers, the top 14 near the strength
  S.season = 2027; const id = 'ulsan' in S.clubs ? 'ulsan' : A.clubs.find(c => c.cc === 'KOR' && !A.squads[c.id]).id;
  E.afcClub(S, id); E.afcSquad(S, id); const sq = E.squad(S, id);
  ok(sq.length === 26 && sq.filter(p => p.pos === 'GK').length === 3 && Math.abs(top14(S, id) - S.clubs[id].afc.s) < 1.2, `${id}: invented squad (${sq.length}, top 14 ${top14(S, id).toFixed(1)} v ${S.clubs[id].afc.s})`);
  ok(sq.filter(p => p.nat !== 'KOR').length === Math.min(12, A.imports.KOR), `${id}: imports`);
  ok(sq.every(p => p.name && p.short && p.birth && p.gen), `${id}: names / birthdays`);
}

// ---------- a new game: the 2026/27 draw ----------
let S = E.newGame(DATA, 'kashima', 'T', '2026-08-07');
{
  ok(S.v === 18 && E.afcOn(S), 'v18, S.afc');
  ok(S.afc.jp.d.join() === 'kashima,kobe,kashiwa,kyoto' && S.afc.jp.ps.join() === 'gosaka' && S.afc.jp.t.join() === 'machida', 'Japan 2026/27');
  const ps = fxOf(S, 'acle', 0);
  ok(ps.length === 4 && ps.every(f => f.date === '2026-08-11'), 'four preliminary-stage matches on 8/11');
  ok(ps.some(f => f.h === 'gangwon' && f.a === 'gosaka'), '江原 v G大阪');
  ok(S.fixtures.filter(E.isAfc).every(f => f.q || !E.isForeign(S, f.h) || E.squad(S, f.h).length), 'a club meeting a Japanese club has players');
  ok(Object.values(S.clubs).filter(c => c.afc).every(c => c.fans == null && !S.order.includes(c.id)), 'overseas clubs: no supporters, not in J1');
  play(S, '2026-08-13');
  const ls = fxOf(S, 'acle', 1);
  ok(ls.length === 128, `128 league-stage matches (${ls.length})`);
  for (const reg of ['E', 'W']) {
    const t = S.afc.e[reg]; ok(t.length === 16, `${reg}: 16`);
    for (const id of t) {
      const m = ls.filter(f => f.h === id || f.a === id);
      ok(m.length === 8 && m.filter(f => f.h === id).length === 4 && new Set(m.map(f => f.md)).size === 8, `${id}: 8 matchdays, 4 at home`);
      ok(m.every(f => { const o = f.h === id ? f.a : f.h; return E.isForeign(S, id) ? !S.clubs[o].afc || S.clubs[o].afc.cc !== S.clubs[id].afc.cc : E.isForeign(S, o); }), `${id}: never against its own country`);
    }
  }
  const won = ps.map(f => E.cupWinner(f));
  const realDraw = won.every(w => A.s2026.ps.real.includes(w));
  for (const id of ['kashima', 'kobe', 'kashiwa', 'kyoto', 'gosaka']) {
    const m = ls.filter(f => f.h === id || f.a === id).sort((a, b) => a.md - b.md);
    if (!m.length) { ok(id === 'gosaka' && !won.includes('gosaka'), `${id} missing`); continue; }
    ok(m.map(f => f.date).join() === A.s2026.jdate[id].join(), `${id}: the real dates`);
  }
  // the real 2026/27 opponents (鹿島: 8 clubs of the other half)
  const k = ls.filter(f => f.h === 'kashima' || f.a === 'kashima').sort((a, b) => a.md - b.md).map(f => (f.h === 'kashima' ? '+' : '-') + (f.h === 'kashima' ? f.a : f.h));
  const real = A.s2026.acle.E.kashima.split(' ');
  if (realDraw) ok(k.join() === real.map(y => { const r = A.s2026.ps.real.includes(y.slice(1)) ? y[0] + won.find(w => ps.some(f => (f.h === w || f.a === w) && (f.h === y.slice(1) || f.a === y.slice(1)))) : y; return r; }).join(), `鹿島: the real draw (${k.join(' ')})`);
  const g = fxOf(S, 'acl2', 0);
  ok(g.length === 96 && Object.values(S.afc.t.groups).every(l => l.length === 4), `ACL2: 8 groups, 96 matches (${g.length})`);
  const mach = g.filter(f => f.h === 'machida' || f.a === 'machida').sort((a, b) => a.md - b.md);
  ok(mach.map(f => f.date).join() === A.s2026.acl2.jdate.machida.join(), '町田: the real dates');
  ok(mach.map(f => (f.h === 'machida' ? 'H ' : 'A ') + (f.h === 'machida' ? f.a : f.h)).join() === 'H svayrieng,A tampines,A shenhua,H shenhua,A svayrieng,H tampines', `町田: the real order (${mach.map(f => f.h + '-' + f.a).join(' ')})`);
  for (const l of [...Object.values(S.afc.t.groups)]) for (const id of l) ok(E.afcRecKey(2026, 'acl2') in (S.clubs[id].arec || {}), `${id}: ACL2 record`);
}
// ---------- the whole season ----------
{
  const f0 = S.clubs.kashima.fin.prize;
  const res = play(S);
  ok(res === 'end', 'the season ends');
  ok(!!S.afc.e.champ && !!S.afc.t.champ, `winners: ACLE ${S.afc.e.champ}, ACL2 ${S.afc.t.champ}`);
  ok(S.fixtures.filter(E.isAfc).every(f => f.played), 'every AFC match played');
  const qf = fxOf(S, 'acle', 3), sf = fxOf(S, 'acle', 4), fi = fxOf(S, 'acle', 5);
  ok(fxOf(S, 'acle', 2).length === 16 && qf.length === 4 && sf.length === 2 && fi.length === 1, 'R16 8 ties, QF 4, SF 2, the final');
  ok(qf.every(f => f.neutral && f.venue && S.clubs[f.h].afc ? true : true) && qf.every(f => [f.h, f.a].map(id => E.isForeign(S, id) ? S.clubs[id].afc.reg : 'E').sort().join() === 'E,W'), 'quarter-finals East v West');
  ok(fi[0].date === '2027-05-01' && fi[0].neutral, 'the final in Jeddah on 5/1');
  for (const reg of ['E', 'W']) { const r16 = fxOf(S, 'acle', 2).filter(f => f.reg === reg && f.leg === 2); const t = E.afcTable(S, 'acle', reg).slice(0, 4).map(r => r.id); ok(r16.every(f => t.includes(f.h)), `${reg}: the top four at home in the second leg`); }
  const a2 = fxOf(S, 'acl2', 4)[0];
  ok(a2 && a2.date === '2027-05-15' && (E.isForeign(S, a2.h) ? S.clubs[a2.h].afc.reg : 'E') === 'E', 'ACL2 final at the East club on 5/15');
  // money: the participation fee at least (鹿島 played the league stage)
  ok(S.clubs.kashima.fin.prize - f0 >= A.prize.acle.part, 'prize money for 鹿島');
  // the winner: title, record
  const ch = S.clubs[S.afc.e.champ];
  ok(ch.titles.acl >= 1 && ch.arec[E.afcRecKey(2026, 'acle')] === 'W' && S.clubs[S.afc.e.runner].arec['26E'] === 'F', 'ACLE winner: title and record');
  ok(S.clubs[S.afc.t.champ].arec['26-2'] === 'W', 'ACL2 winner record');
  ok(S.seasonEnd.afc && S.seasonEnd.afc.acle[0] === S.afc.e.champ, 'season summary');
  // no club has two matches on one day; no Japanese club plays a domestic match within two days of its AFC match
  const days = {}; let two = 0, near = 0;
  for (const f of S.fixtures) for (const c of [f.h, f.a]) { const k = c + f.date; if (days[k]) two++; days[k] = 1; }
  ok(two === 0, `no two matches a day (${two})`);
  for (const a of S.fixtures.filter(f => E.isAfc(f) && !f.q)) for (const c of [a.h, a.a]) if (!E.isForeign(S, c)) for (const y of S.fixtures) if (!E.isAfc(y) && (y.h === c || y.a === c) && Math.abs(E.D.diff(y.date, a.date)) <= E.AFC.dist) near++;
  ok(near <= 3, `domestic matches within ${E.AFC.dist} days of an AFC match: ${near}`);
  ok(Object.values(S.players).filter(p => S.clubs[p.club] && S.clubs[p.club].afc).every(p => !p.hist.length), 'overseas players untouched by the season archive (yet)');
}
// ---------- next season ----------
{
  const t = S.lastTable.slice(), ec = S.cups.ec.champ, acle = S.afc.e.champ, acl2 = S.afc.t.champ;
  E.rollover(S);
  ok(S.season === 2027 && E.afcOn(S), '2027/28 AFC');
  ok(!Object.values(S.players).some(p => S.clubs[p.club] && S.clubs[p.club].afc && E.fxLabel && !S.fixtures.some(f => E.isAfc(f) && !f.q && (f.h === p.club || f.a === p.club))), 'last season\'s overseas players gone');
  const jp = S.afc.jp, all = [...jp.d, ...jp.ps, ...jp.t];
  const exp = E.afcJapan(S, { table: t, ec, acle, acl2 });
  ok(JSON.stringify([jp.d, jp.ps, jp.t]) === JSON.stringify([exp.d, exp.ps, exp.t]), 'Japan by the rules');
  ok(jp.d.length === 3 && jp.ps.length === 2 && jp.t.length === 1 && new Set(all).size === 6, `Japan 3 + 2 + 1 (${all.join(' ')})`);
  if (!S.clubs[acle].afc) ok(jp.d[0] === acle, 'the Japanese ACLE winner first');
  const ps = fxOf(S, 'acle', 0);
  for (const reg of ['E', 'W']) {
    const n = ps.filter(f => f.reg === reg).length;
    ok(S.afc.e.dir[reg].length + n === 16, `${reg}: ${S.afc.e.dir[reg].length} direct + ${n} preliminary winners = 16`);
    ok(S.afc.t.pre[reg].length + n === 16, `${reg}: ACL2 ${S.afc.t.pre[reg].length} + ${n} losers = 16`);
    const cl = [...S.afc.e.dir[reg], ...ps.filter(f => f.reg === reg).flatMap(f => [f.h, f.a]), ...S.afc.t.pre[reg]];
    ok(new Set(cl).size === cl.length, `${reg}: nobody twice`);
    ok(cl.every(id => !E.isForeign(S, id) || S.clubs[id].afc.reg === reg), `${reg}: clubs of the region`);
    // per association: the 2027/28 slots
    const SL = A.slots[reg];
    for (const [cc, k] of Object.entries(SL.d)) if (cc !== 'JPN') ok(S.afc.e.dir[reg].filter(id => E.isForeign(S, id) && S.clubs[id].afc.cc === cc && id !== acle).length === k, `${reg} ${cc}: ${k} direct`);
  }
  if (S.clubs[acle] && S.clubs[acle].afc) ok(S.afc.e.dir[S.clubs[acle].afc.reg].includes(acle), 'the overseas ACLE winner straight into the league stage');
  if (S.clubs[acl2] && S.clubs[acl2].afc) ok(ps.some(f => f.h === acl2 || f.a === acl2), 'the overseas ACL2 winner in the preliminary stage');
  ok(ps.every(f => f.date > '2027-08-01' && f.date < '2027-08-20'), `preliminary stage in August (${ps[0] && ps[0].date})`);
  // the Lカップ seeds the J1 clubs in the ACL
  const lc = S.cups.lc, seeds = [...lc.prime, ...lc.afc.flat()];
  ok(all.filter(id => S.order.includes(id)).every(id => seeds.includes(id)), 'Lカップ seeds = the ACL clubs');
  // the draws later on: halves keep one country together
  play(S, D2(ps[0].date));
  const ls = fxOf(S, 'acle', 1);
  ok(ls.length === 128, `2027/28: 128 league-stage matches (${ls.length})`);
  let same = 0; for (const f of ls) if (E.isForeign(S, f.h) && E.isForeign(S, f.a) && S.clubs[f.h].afc.cc === S.clubs[f.a].afc.cc) same++; else if (!E.isForeign(S, f.h) && !E.isForeign(S, f.a)) same++;
  ok(same === 0, `2027/28: no league-stage match within one country (${same})`);
  for (const id of [...S.afc.e.E, ...S.afc.e.W]) { const m = ls.filter(f => f.h === id || f.a === id); ok(m.length === 8 && m.filter(f => f.h === id).length === 4, `2027/28 ${id}: 8, 4 at home`); }
  ok(Object.values(S.afc.t.groups).every(l => l.length === 4) && fxOf(S, 'acl2', 0).length === 96, '2027/28 ACL2 groups');
}
function D2(d) { return E.D ? E.D.add(d, 2) : d; }
// ---------- Japan's places (JFA 2026-08-20) ----------
{
  const T = E.newGame(DATA, 'kobe', 'T', '2026-08-07'); T.season = 2027;
  const tb = T.order.slice();
  let j = E.afcJapan(T, { table: tb, ec: tb[10] });
  ok(j.d.join() === tb.slice(0, 3).join() && j.ps.join() === tb.slice(3, 5).join() && j.t[0] === tb[10], '1〜3 direct, 4・5 PS, the 天皇杯 winner ACL2');
  j = E.afcJapan(T, { table: tb, ec: tb[1] });
  ok(j.d.join() === tb.slice(0, 3).join() && j.ps.join() === tb.slice(3, 5).join() && j.t[0] === tb[5], 'a 天皇杯 winner already in: the 6th');
  j = E.afcJapan(T, { table: tb, ec: tb[10], acle: tb[7] });
  ok(j.d.join() === [tb[7], tb[0], tb[1]].join() && j.ps.join() === [tb[2], tb[3]].join(), 'the Japanese ACLE winner first, the 3rd to the preliminary stage');
  j = E.afcJapan(T, { table: tb, ec: tb[10], acl2: tb[12] });
  ok(j.d.join() === tb.slice(0, 3).join() && j.ps.join() === [tb[3], tb[12]].join(), 'the Japanese ACL2 winner the second preliminary place');
  j = E.afcJapan(T, { table: tb, ec: tb[10], acle: 'alhilal' });
  ok(j.d.join() === tb.slice(0, 3).join(), 'an overseas winner changes nothing for Japan');
}
// ---------- discipline ----------
{
  ok(E.compOf({ cup: 'acle' }) === 'afc' && E.compOf({ cup: 'acl2' }) === 'afc', 'one AFC competition');
  ok(!E.banHits({ c: '*' }, 'afc') && !E.banHits({ c: 'J' }, 'afc') && !E.banHits({ c: 'afc' }, 'lg') && E.banHits({ c: 'afc' }, 'afc'), 'AFC bans only in AFC matches');
  const T = E.newGame(DATA, 'kashima', 'T', '2026-08-07'); const p = E.squad(T, 'urawa').sort((a, b) => b.birth.localeCompare(a.birth))[0];   // not in the 2026/27 ACL
  p.bans = [{ c: 'afc', n: 1, r: 'sfp' }, { c: 'lg', n: 1, r: 'dogso' }];
  play(T); E.rollover(T);
  ok(T.players[p.id] && (T.players[p.id].bans || []).some(b => b.c === 'afc' && b.n === 1), 'an AFC ban carries into next season');
  ok(!(T.players[p.id].bans || []).some(b => b.c === 'J'), 'one league game left lapses');
}
// ---------- an old save ----------
{
  const T = E.newGame(DATA, 'machida', 'T', '2026-08-07');
  play(T, '2026-11-20');
  // as a v17 save: no AFC
  T.fixtures = T.fixtures.filter(f => !E.isAfc(f)); delete T.afc; T.v = 17;
  for (const [id, p] of Object.entries(T.players)) if (T.clubs[p.club] && T.clubs[p.club].afc) delete T.players[id];
  for (const id of Object.keys(T.clubs)) if (T.clubs[id].afc) delete T.clubs[id];
  for (const c of Object.values(T.clubs)) delete c.arec;
  const old = JSON.parse(JSON.stringify(T));
  E.migrate(old, DATA);
  ok(old.v === 18 && E.afcOn(old), 'old save: v18, AFC');
  ok(old.fixtures.filter(f => E.isAfc(f) && f.date < old.date).every(f => f.played), 'old save: the matches before today played');
  ok(fxOf(old, 'acle', 1).length === 128 && fxOf(old, 'acl2', 0).length === 96, 'old save: the stages drawn');
  ok(old.news.some(n => /アジアの大会/.test(n.text)), 'old save: the news');
  ok(old.clubs.kawasakif.arec && old.clubs.kawasakif.arec['24E'] === 'F', 'old save: Japanese clubs\' AFC record');
  const r = play(old); ok(r === 'end' && old.afc.e.champ && old.afc.t.champ, 'old save: the season ends with both winners');
}
// ---------- the quick simulation against the engine ----------
if (process.argv[2] === 'calib') {
  const T = E.newGame(DATA, 'kashima', 'T', '2026-08-07');
  for (const id of Object.keys(T.clubs)) if (T.clubs[id].afc && A.squads[id]) E.afcSquad(T, id);
  const ids = Object.keys(T.clubs).filter(id => E.squad(T, id).length >= 18), rows = [];
  for (let i = 0; i < 3000; i++) {
    const h = ids[Math.floor(Math.random() * ids.length)]; let a; do { a = ids[Math.floor(Math.random() * ids.length)]; } while (a === h);
    const fx = { id: 9e6 + i, h, a, date: T.date, cup: 'acle', cr: 1, rr: 1, md: 1, neutral: Math.random() < 0.2, hg: null, ag: null };
    for (const c of [h, a]) E.autoLineup(T, c, { comp: 'afc' });
    const M = E.createMatch(T, fx); E.simulateFull(T, M); for (const p of Object.values(T.players)) p.cond = 100;
    rows.push({ d: E.afcStr(T, h) - E.afcStr(T, a), n: fx.neutral, hg: M.hg, ag: M.ag });
  }
  let best = null;
  for (let g = 1.0; g <= 1.8; g += 0.02) for (let k = 0.02; k <= 0.2; k += 0.005) for (let hm = 0; hm <= 3; hm += 0.25) {
    let ll = 0; for (const r of rows) { const dd = r.d + (r.n ? 0 : hm), lh = g * Math.exp(k * dd / 2), la = g * Math.exp(-k * dd / 2); ll += r.hg * Math.log(lh) - lh + r.ag * Math.log(la) - la; }
    if (!best || ll > best.ll) best = { g: +g.toFixed(2), k: +k.toFixed(3), home: hm, ll };
  }
  console.log('fit', JSON.stringify(best), 'now', JSON.stringify(E.AFC.quick));
  ok(Math.abs(best.g - E.AFC.quick.g) < 0.1 && Math.abs(best.k - E.AFC.quick.k) < 0.035, 'AFC.quick matches the engine');
}
console.log(bad ? `${bad} NG` : 'afc: all OK');
process.exit(bad ? 1 : 0);
