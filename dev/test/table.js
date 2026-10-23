// 順位表（2026-10-24）: the J1 table counts league matches only. Until then table() also counted the cup and AFC matches
// between two J1 clubs (天皇杯・Lカップ・ACL are in S.fixtures with f.cup), so at the end of a season clubs had 39〜47
// games and points from cup wins — the place, the prize money, relegation, the ACL places, the sponsors' 勝点/順位/得点,
// the title all went by it. Checks: during and at the end of a season every club has as many games as league matches
// played (38 at the end), points = 3·wins + draws, the cups and the AFC don't move it; old saves (S.v 18): a contract on the
// place the wrong table had failed is paid, a title "won" on cup points comes off, one now won is celebrated, the news says
// so, nothing changes when no J1 clubs met in a cup yet.
// usage: node dev/test/table.js   (about 20 seconds: it plays one season through)
let gen = null; const seed = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rnd0 = Math.random; Math.random = () => (gen ? gen() : rnd0());
const E = require('../src/engine.js');
const DATA = require('../data.json');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails++; };
const clone = o => JSON.parse(JSON.stringify(o));
gen = seed(+(process.env.SEED || 20261024));

// the table as it was (every played match between two J1 clubs)
function oldTable(S) {
  const t = {}; for (const id of S.order) t[id] = { id, p: 0, pts: 0, gf: 0 };
  for (const f of S.fixtures) {
    if (!f.played || !t[f.h] || !t[f.a]) continue;
    t[f.h].p++; t[f.a].p++; t[f.h].gf += f.hg; t[f.a].gf += f.ag;
    if (f.hg > f.ag) t[f.h].pts += 3; else if (f.hg < f.ag) t[f.a].pts += 3; else { t[f.h].pts++; t[f.a].pts++; }
  }
  return t;
}
function check(S, when) {
  const t = E.table(S), lg = {};
  for (const f of S.fixtures) if (!f.cup && f.played) for (const c of [f.h, f.a]) lg[c] = (lg[c] || 0) + 1;
  ok(t.length === 20 && t.every(r => r.p === (lg[r.id] || 0) && r.w + r.d + r.l === r.p && r.pts === 3 * r.w + r.d && r.p <= 38),
    `${when}: every club's games = its league matches played (${[...new Set(t.map(r => r.p))].sort((a, b) => a - b).join('・')}), points = 3·wins + draws`);
  const w = t.reduce((a, r) => a + r.w, 0), l = t.reduce((a, r) => a + r.l, 0), gf = t.reduce((a, r) => a + r.gf, 0), ga = t.reduce((a, r) => a + r.ga, 0);
  ok(w === l && gf === ga, `${when}: wins = losses (${w}), goals for = against (${gf})`);
  return t;
}

const S = E.newGame(DATA, 'yokohamafm', 'T', '2026-08-07');
let mid = null, leagueDone = null, g = 0;
while (g++ < 5000) {
  const st = E.advance(S);
  if (st.stop === 'match') {
    if (E.lineupIssues(S, S.my).block) E.autoLineup(S, S.my, { rotate: true });
    const fx = S.fixtures.find(f => f.id === st.fid); const M = E.createMatch(S, fx); E.simulateFull(S, M); E.finishMatch(S, M);
  } else if (st.stop === 'inbox') { for (const it of S.inbox.filter(x => !x.seen)) { it.seen = true; if (it.type === 'offer') E.rejectOffer(S, it.id); } }
  else if (st.stop === 'fired') E.takeJob(S, S.fired.offers[0]);
  else if (st.stop === 'seasonEnd') break;
  const both = S.fixtures.filter(f => f.cup && f.played && S.order.includes(f.h) && S.order.includes(f.a)).length;
  if (!mid && both >= 6) mid = clone(S);
  if (!leagueDone && S.fixtures.every(f => f.cup || f.played)) leagueDone = clone(S);
}
ok(!!mid && !!leagueDone && !!S.seasonEnd, 'played a season through (mid-season with J1 clubs met in the cups, the day the league is over, the end)');

/* ---- the table ---- */
check(mid, 'mid-season');
const tEnd = check(leagueDone, 'the league over');
ok(tEnd.every(r => r.p === 38), 'the league over: 38 games each');
const both = leagueDone.fixtures.filter(f => f.cup && f.played && leagueDone.order.includes(f.h) && leagueDone.order.includes(f.a));
const ot = oldTable(leagueDone);
ok(both.length >= 10 && Object.values(ot).some(r => r.p > 38), `the old table would count ${both.length} cup/AFC matches between J1 clubs (up to ${Math.max(...Object.values(ot).map(r => r.p))} games)`);
const comps = [...new Set(both.map(f => f.cup))];
ok(comps.includes('ec') && comps.includes('lc'), `…in the 天皇杯 and the Lカップ (${comps.join('・')})`);
const se = S.seasonEnd;
ok(se && E.table(S).every(r => r.p === 38) && se.myPos === E.table(S).findIndex(r => r.id === S.my) + 1, `the season over: 38 games each, my place ${se.myPos} from the right table`);
ok(S.lastTable.join() === E.table(S).map(r => r.id).join(), 'next season goes by the right table (S.lastTable = the Lカップ seeds and the ACL places)');

/* ---- old saves (S.v 18) ---- */
const v18 = s => { const o = clone(s); o.v = 18; return o; };
// a save before any two J1 clubs met in a cup: nothing to say
{
  const early = clone(mid); early.fixtures = early.fixtures.filter(f => !(f.cup && early.order.includes(f.h) && early.order.includes(f.a)));
  const o = v18(early), n0 = o.news.length; E.migrate(o, DATA);
  ok(o.v === 19 && o.news.length === n0, 'old save with no J1 clubs met in a cup: v19, no news');
}
// the league over: the news; a contract on the place the old table had failed is paid; one still missed stays missed
{
  const o = v18(leagueDone), t = E.table(o), me = t.findIndex(r => r.id === o.my) + 1;
  const deals = E.sponDeals(o);
  ok(deals.length >= 2, `contracts this season (${deals.length})`);
  const [d1, d2] = deals;
  Object.assign(d1, { k: 'rank', n: me, st: 'fail', dd: o.date, got: 0 });   // met with the right table
  Object.assign(d2, { k: 'rank', n: Math.max(1, me - 1), st: 'fail', dd: o.date, got: 0 });
  if (me === 1) d2.n = 0;   // top: a place above can't be met
  const f0 = o.clubs[o.my].funds, n0 = o.news.length;
  E.migrate(o, DATA);
  const pay = Math.round(d1.b * E.SPON.slot[d1.slot].f);
  ok(d1.st === 'done' && d1.got === pay && o.clubs[o.my].funds === f0 + pay, `old save: 「${me}位以内」 failed by the old table → met, bonus ${E.money(pay)} paid`);
  ok(d2.st === 'fail', 'old save: a place still not reached stays missed');
  ok(o.news.slice(0, o.news.length - n0 + 2).some(x => /順位表を直しました/.test(x.t || x.text || x.msg || JSON.stringify(x))), 'old save: the news says the table was put right');
}
// the title
{
  const o = v18(leagueDone), t = E.table(o);
  const top = t[0].id, mine = o.my;
  // a title "won" though another club is top
  if (top !== mine) {
    o.titleWon = o.season; o.cele = [{ k: 'j1', season: o.season, pts: 99 }];
    E.migrate(o, DATA);
    ok(o.titleWon !== o.season && !o.cele.some(x => x.k === 'j1' && x.season === o.season), 'old save: a title "won" on cup points comes off (and its pop-up)');
  } else {
    o.my = t[1].id; o.titleWon = o.season; o.cele = [{ k: 'j1', season: o.season, pts: 99 }];
    E.migrate(o, DATA);
    ok(o.titleWon !== o.season && !o.cele.length, 'old save: a title "won" on cup points comes off (and its pop-up)');
  }
  // the champion, not celebrated yet (the old table had a rival ahead): celebrated now; celebrated already: the pop-up's numbers
  const p = v18(leagueDone); p.my = E.table(p)[0].id; delete p.titleWon; p.cele = [];
  E.migrate(p, DATA);
  const c = p.cele.find(x => x.k === 'j1'), r = E.table(p)[0];
  ok(p.titleWon === p.season && c && c.pts === r.pts && c.w + c.dr + c.l === 38, `old save: the champion now (${p.clubs[p.my].short} ${r.pts}点) gets the pop-up, with 38 games`);
  const q = v18(leagueDone); q.my = E.table(q)[0].id; q.titleWon = q.season; q.cele = [{ k: 'j1', season: q.season, pts: 999, w: 40, dr: 0, l: 7 }];
  E.migrate(q, DATA);
  ok(q.titleWon === q.season && q.cele.length === 1 && q.cele[0].pts === E.table(q)[0].pts && q.cele[0].w + q.cele[0].dr + q.cele[0].l === 38, 'old save: a title already won keeps its pop-up, with the right numbers');
}
// a save at the season-end screen: as it was decided
{
  const o = v18(S), n0 = o.news.length, last = o.lastTable.join();
  E.migrate(o, DATA);
  ok(o.v === 19 && o.news.length === n0 && o.lastTable.join() === last, 'old save at the end of the season: left as it was');
}
console.log(fails ? `\n${fails} FAILED` : '\nALL OK');
process.exit(fails ? 1 : 0);
