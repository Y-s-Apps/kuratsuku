// 国際大会 (2026-10-25): the summer tournaments (W杯・EURO・コパ・アメリカ・アフリカ選手権・ゴールドカップ・アジアカップ),
// the W杯 Asian qualifiers, the 称号 and their effects, the 2026 World Cup players, an old save.
// usage: node dev/test/wc.js   (about 1 minute: five seasons to the World Cup 2030)
let x = 31; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };   // before the engine (R)
const path = require('path'), fs = require('fs'), { execSync } = require('child_process');
const E = require('../src/engine.js'); const DATA = require('../data.json');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('NG', m); } };
const D = E.D;

// ---------- the calendar ----------
{
  const keys = y => E.tourList(y).map(t => t.k).sort().join();
  ok(keys(2026) === '', '2026: none (the game starts after the World Cup)');
  ok(keys(2027) === 'afcon,gold', '2027: アフリカ選手権・ゴールドカップ ' + keys(2027));
  ok(keys(2028) === 'afcon,copa,euro', '2028: EURO・コパ・アフリカ（アジアカップはまだ） ' + keys(2028));
  ok(keys(2029) === 'gold' && keys(2031) === 'gold', 'odd years: ゴールドカップ');
  ok(keys(2030) === 'wc' && keys(2034) === 'wc' && keys(2038) === 'wc', 'the World Cups');
  ok(keys(2032) === 'ac,afcon,copa,euro' && keys(2036) === 'ac,afcon,copa,euro', 'the Asian Cup in even years from 2032');
  const wc = E.tourOf('wc2030'), eu = E.tourOf('euro2028'), af = E.tourOf('afcon2027');
  ok(wc.from === '2030-06-08' && wc.to === '2030-07-21' && wc.hosts.join() === 'ESP,POR,MAR,URU,ARG,PAR' && !wc.est, 'W杯2030: 6/8〜7/21, six hosts, real');
  ok(eu.from === '2028-06-09' && eu.to === '2028-07-09' && eu.hosts.includes('ENG') && !eu.est, 'EURO2028: 6/9〜7/9, real');
  ok(af.from === '2027-06-19' && af.to === '2027-07-17' && af.hosts.join() === 'KEN,TAN,UGA', 'アフリカ選手権2027: 6/19〜7/17');
  ok(E.tourOf('wc2034').est && E.tourOf('wc2034').hosts.join() === 'KSA', 'W杯2034: Saudi Arabia, estimated dates');
  // the Asian Cup: 2027 in January only, no 2031/2035
  const acs = []; for (let sy = 2026; sy <= 2040; sy++) for (const e of E.ntEvents(sy)) if (e.kind === 'ac') acs.push(e.k);
  ok(acs.join() === 'ac2027', 'the January Asian Cup is 2027 only ' + acs);
  for (let sy = 2026; sy <= 2040; sy++) {
    const ev = E.ntEvents(sy), w3 = ev.find(e => e.k === `${sy}w3`), ts = E.tourList(sy + 1);
    if (ts.length) ok(w3.kind === 'sum' && w3.tours.join() === ts.map(t => t.key).join() && w3.to >= ts.map(t => t.to).sort().pop() && w3.wto < w3.to, `${sy}w3 is the summer with ${w3.tours}`);
    ok(ev.length === 4 + (sy === 2026 ? 1 : 0), `${sy}: four windows (+ the Asian Cup 2027)`);
  }
}

// ---------- a tournament worked out ----------
const S = E.newGame(DATA, 'yokohamafm', 'テスト', '2026-10-14');
{
  for (const [key, n] of [['wc2030', 48], ['euro2028', 24], ['afcon2027', 24], ['copa2028', 16], ['gold2027', 16], ['ac2032', 24]]) {
    const t = E.tourOf(key); if (key === 'wc2030') S.nt.wq = {};   // no qualifiers: Japan by strength
    const f = E.tourField(S, t);
    ok(f.length === n && new Set(f).size === n && f.every(cc => E.NATIONS[cc]), `${key}: ${n} nations ${f.length}`);
    ok(t.hosts.every(h => f.includes(h)), `${key}: the hosts are in`);
    if (key === 'copa2028') ok(f.filter(cc => E.confOf(cc) === 'CONMEBOL').length === 10 && f.filter(cc => E.confOf(cc) === 'CONCACAF').length === 6, 'コパ: 10 + 6 guests');
    if (key === 'gold2027') ok(f.includes('KSA') && f.filter(cc => E.confOf(cc) === 'CONCACAF').length === 15, 'ゴールドカップ2027: サウジアラビア + 15');
    if (key === 'ac2032') ok(f.includes('JPN') && f.every(cc => E.confOf(cc) === 'AFC'), 'アジアカップ: Japan and AFC');
    if (key === 'wc2030') {
      const by = {}; for (const cc of f) by[E.confOf(cc)] = (by[E.confOf(cc)] || 0) + 1;
      ok(by.UEFA === 16 && by.CAF >= 9 && by.CONMEBOL >= 6 && by.AFC >= 8 && by.CONCACAF >= 6 && by.OFC <= 2 && by.CAF + by.CONMEBOL + by.AFC + by.CONCACAF + (by.OFC || 0) === 32, 'W杯: places by confederation (two from the play-off, none of them European) ' + JSON.stringify(by));
    }
    const s = E.tourSim(S, t, f, null);
    const per = {}; for (const g of s.games) for (const c of [g.a, g.b]) { per[c + g.d] = (per[c + g.d] || 0) + 1; }
    ok(Object.values(per).every(v => v === 1), `${key}: nobody plays twice a day`);
    ok(s.games.every(g => g.d >= t.from && g.d <= t.to) && s.games[s.games.length - 1].d === t.to && s.games[s.games.length - 1].stage === '決勝', `${key}: within the dates, the final last`);
    const gs = s.games.filter(g => /^グループ/.test(g.stage));
    ok(gs.length === n / 4 * 6 && f.every(cc => gs.filter(g => g.a === cc || g.b === cc).length === 3), `${key}: three group matches each`);
    const cnt = st => Object.values(s.stage).filter(v => v === st).length;
    const ko = n === 48 ? { r32: 16, r16: 8, qf: 4, sf: 2, f: 1, w: 1 } : n === 24 ? { r16: 8, qf: 4, sf: 2, f: 1, w: 1 } : { qf: 4, sf: 2, f: 1, w: 1 };
    ok(Object.entries(ko).every(([k, v]) => cnt(k) === v) && cnt('gs') === n - (n === 48 ? 32 : n === 24 ? 16 : 8), `${key}: how far each went ` + JSON.stringify(Object.fromEntries(E.STAGES.map(k => [k, cnt(k)]))));
    ok(s.stage[s.champ] === 'w' && s.stage[s.runner] === 'f', `${key}: champion and runner-up`);
    ok(s.games.filter(g => !/^グループ/.test(g.stage)).every(g => g.ga !== g.gb || (g.pk && g.pk[0] !== g.pk[1])), `${key}: a knockout tie is settled`);
    if (key === 'wc2030') ok(s.games.filter(g => g.d < '2030-06-13').every(g => ['URU', 'ARG', 'PAR'].includes(g.a) || ['URU', 'ARG', 'PAR'].includes(g.b)) && s.games.filter(g => g.d < '2030-06-13').length === 3, 'W杯2030: the three centenary matches in South America first');
  }
  // Japan at a 48-team World Cup with the game's model: how far (sanity, 300 runs)
  const far = { r16: 0, qf: 0 }, t = E.tourOf('wc2030');
  for (let i = 0; i < 300; i++) { const f = E.tourField(S, t); if (!f.includes('JPN')) f[f.length - 1] = 'JPN'; const s = E.tourSim(S, t, f, null); const r = E.STAGES.indexOf(s.stage.JPN); if (r >= 2) far.r16++; if (r >= 3) far.qf++; }
  ok(far.r16 / 300 > 0.2 && far.r16 / 300 < 0.6 && far.qf / 300 > 0.06 && far.qf / 300 < 0.35, 'Japan: last 16 in 20〜60%, last 8 in 6〜35% ' + JSON.stringify(far));
}

// ---------- the qualifiers: the rounds ----------
{
  const T = JSON.parse(JSON.stringify(S)); T.nt.wq = {};
  const W = E.wqOf(T, 2030);
  E.wqFinish(T, W, 3);   // the 2次予選 played out
  ok(W.r === 3 && W.grp.length === 6 && W.grp[0] === 'JPN' && W.fx.length === 10 && W.others.length === 2, 'Japan through to the 最終予選: a group of six, ten matchdays, two other groups');
  ok(W.grp.every(cc => E.confOf(cc) === 'AFC'), 'AFC teams only ' + W.grp);
  { const H = JSON.parse(JSON.stringify(S)); H.nt.wq = {}; const W4 = E.wqOf(H, 2034); E.wqFinish(H, W4, 3); ok(!W4.grp.includes('KSA') && !W4.others.flat().includes('KSA'), 'the 2034 host (Saudi Arabia) plays no qualifiers'); }
  // 3rd → the 4次予選, then 2nd → the 5次予選, a win → the play-off, a win → qualified
  W.tab = Object.fromEntries(W.grp.map((cc, i) => [cc, { p: [20, 30, 25, 10, 5, 0][i], gd: 0, gf: 0, pl: 10 }])); W.md = 10;
  // (the table: Japan 3rd)
  const W3 = JSON.parse(JSON.stringify(W)); W3.tab.JPN.p = 20; W3.tab[W3.grp[1]].p = 30; W3.tab[W3.grp[2]].p = 25;
  Object.assign(W, W3);
  E.wqFinish(T, W, 4);
  ok(W.r === 4 && W.grp[0] === 'JPN' && W.grp.length === 3 && W.q.length === 6 && !W.q.includes('JPN') && W.r4.length === 6, '3rd: the 4次予選 (three teams), six already qualified ' + W.q);
  W.tab = { [W.grp[0]]: { p: 3, gd: 0, gf: 2, pl: 2 }, [W.grp[1]]: { p: 6, gd: 3, gf: 5, pl: 2 }, [W.grp[2]]: { p: 0, gd: -3, gf: 1, pl: 2 } }; W.md = 2;
  E.wqFinish(T, W, 5);
  ok(W.r === 5 && W.grp[0] === 'JPN' && W.q.length === 8, '2nd: the 5次予選 (two legs), eight qualified');
  W.legs = [1, 0]; W.md = 2; E.wqFinish(T, W, 6);
  ok(W.r === 6 && E.NATIONS[W.grp[1]] && E.confOf(W.grp[1]) !== 'AFC', 'won: the intercontinental play-off against ' + W.grp[1]);
  W.tab.JPN = { p: 3, gd: 2, gf: 2, pl: 1 }; W.md = 1; E.wqFinish(T, W);
  ok(W.done === 'q' && W.q.includes('JPN'), 'won the play-off: qualified');
  const f = E.tourField(T, E.tourOf('wc2030'));
  ok(f.includes('JPN') && f.filter(cc => E.confOf(cc) === 'AFC').length === 9, 'the World Cup: Japan in, Asia 8 + the play-off');
  // out in the 2次予選: the World Cup without Japan
  const U = JSON.parse(JSON.stringify(S)); U.nt.wq = {};
  const V = E.wqOf(U, 2030); E.wqFinish(U, V, 2); V.tab = Object.fromEntries(V.grp.map((cc, i) => [cc, { p: [1, 18, 12, 6][i], gd: 0, gf: 0, pl: 6 }])); V.md = 6; E.wqFinish(U, V);
  ok(V.done === 'out' && !E.tourField(U, E.tourOf('wc2030')).includes('JPN'), 'out in the 2次予選: no Japan at the World Cup');
}

// ---------- 称号: the 2026 World Cup players, the effects ----------
{
  const tag = n => Object.values(S.players).find(p => p.name === n);
  ok(['早川 友基', '大迫 敬介', '長友 佑都', 'キム スンギュ', 'キム テヒョン', 'テテ イェンギ'].every(n => tag(n) && E.ttOf(tag(n)).some(t => t.t === 'wc' && t.y === 2026)), 'the six 2026 World Cup players in J1 have their 称号');
  ok(E.ttOf(tag('早川 友基'))[0].st === 'r32' && E.ttOf(tag('キム テヒョン'))[0].st === 'gs', 'Japan last 32, Korea the group');
  ok(E.tt2026(S) === 0, 'given once');
  const p = tag('早川 友基');
  ok(E.ttBig(p) === 1, 'a World Cup player: +1 in a big match');
  const q = Object.values(S.players).find(z => z.club === S.my && !E.ttOf(z).length && z.ovr > 70);
  const v0 = E.value(q, S.date); q.nt = { cc: 'JPN', caps: 1, g: 0, calls: 1, tt: [{ t: 'wc', y: 2026, cc: 'JPN', st: 'qf', n: 4, g: 1 }] };
  ok(E.ttBig(q) === 2 && Math.abs(E.value(q, S.date) / v0 - 1.15) < 0.02, 'ベスト8: +2, value ×1.15');
  q.nt.tt[0].n = 0; ok(E.ttBig(q) === 0 && E.value(q, S.date) === v0, 'in the squad without a match: the 称号 only');
  q.nt.tt = [{ t: 'euro', y: 2028, cc: 'FRA', st: 'w', n: 3, g: 0 }]; ok(E.ttBig(q) === 2, 'a continental title: +2');
  q.nt.tt = [{ t: 'copa', y: 2028, cc: 'BRA', st: 'sf', n: 3, g: 0 }]; ok(E.ttBig(q) === 0, 'a continental semi-final: nothing');
  delete q.nt;
  ok(E.ttLabel({ t: 'wc', y: 2030, st: 'qf' }) === 'W杯2030 ベスト8' && E.ttLabel({ t: 'gold', y: 2027, st: 'gs' }) === 'ゴールドカップ2027 出場', 'the labels');
}

// ---------- five seasons to the World Cup 2030 ----------
const seen = { awayIn: 0, exp: 0, expBig: true, quals: {}, sum: {} };
{
  const check = (M, f) => { if (Object.keys(M.pm).map(Number).concat(M.h.bench, M.a.bench).some(id => S.players[id] && S.players[id].away)) seen.awayIn++; };
  let s = 0;
  for (let g = 0; g < 400000 && s < 4; g++) {
    const C = S.nt.cur;
    if (C && C.kind === 'sum' && !seen.sum[C.k]) seen.sum[C.k] = { tours: (C.tours || []).map(t => t.key), jp: C.games.filter(z => z.cc === 'JPN').length };
    const st = E.advance(S, 1);
    if (st.stop === 'match') {
      const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { rotate: true });
      const hy = f.hype || {}; if (hy.exp) { seen.exp += hy.exp.length; for (const e of hy.exp) if (!(S.players[e.pid].exp && S.players[e.pid].exp.b === e.b && (hy.tags.length || E.isAfc && E.isAfc(f)))) seen.expBig = false; }
      const M = E.createMatch(S, f); check(M, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 40);
    }
    else if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
    else if (st.stop === 'seasonEnd') { s++; E.rollover(S); }
    else if (st.stop === 'fired') E.takeJob(S, S.fired.offers[0]);
    for (const r of (S.nt.res || [])) if (/W杯アジア/.test(r.lb || '')) seen.quals[r.d + r.opp] = r.lb;
  }
  // ...and the summer of 2030
  for (let g = 0; g < 3000 && S.date < '2030-07-25'; g++) { const st = E.advance(S, 1); if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); }); if (st.stop === 'seasonEnd') { E.rollover(S); } if (st.stop === 'fired') E.takeJob(S, S.fired.offers[0]); const C = S.nt.cur; if (C && C.kind === 'sum' && !seen.sum[C.k]) seen.sum[C.k] = { tours: (C.tours || []).map(t => t.key), jp: C.games.filter(z => z.cc === 'JPN').length }; }
  ok(seen.awayIn === 0, 'nobody away plays for his club ' + seen.awayIn);
  ok(Object.keys(seen.sum).join() === '2026w3,2027w3,2028w3,2029w3', 'four summers ' + Object.keys(seen.sum));
  ok(seen.sum['2026w3'].tours.join() === 'afcon2027,gold2027' && seen.sum['2027w3'].tours.join() === 'euro2028,copa2028,afcon2028' && seen.sum['2029w3'].tours.join() === 'wc2030', 'the tournaments of each summer');
  const q = Object.values(seen.quals);
  ok(q.filter(l => l === 'W杯アジア2次予選').length === 6, 'six 2次予選 matches ' + q.filter(l => l === 'W杯アジア2次予選').length);
  ok(q.filter(l => l === 'W杯アジア最終予選').length >= 8, 'the 最終予選 ' + q.filter(l => l === 'W杯アジア最終予選').length);
  const W = S.nt.wq[2030];
  ok(W && W.done, 'the qualifiers are over: ' + (W && W.done));
  const th = S.nt.th || [], wc = th.find(t => t.key === 'wc2030');
  ok(['afcon2027', 'gold2027', 'euro2028', 'copa2028', 'afcon2028', 'gold2029', 'wc2030'].every(k => th.some(t => t.key === k)) && th.some(t => t.key === 'ac2027'), 'every tournament is in the record ' + th.map(t => t.key));
  ok(wc && E.NATIONS[wc.champ] && wc.ko && wc.ko.length === 31, 'W杯2030: a champion and the knockout rounds kept');
  ok(!!wc && (W.done === 'q') === !!wc.jp, 'Japan at the World Cup iff it qualified');
  const tagged = Object.values(S.players).filter(p => E.ttOf(p).some(t => t.y >= 2027));
  ok(tagged.length >= 10, 'players with a 称号 from the tournaments ' + tagged.length);
  ok(tagged.every(p => E.ttOf(p).every(t => E.STAGES.includes(t.st) && E.TOURS[t.t] && t.y)), 'the 称号 are well-formed');
  ok(!Object.values(S.players).some(p => p.away), 'everyone is back after the World Cup');
  ok(seen.exp > 0 && seen.expBig, 'big matches: the 称号 holders get their edge on the day ' + seen.exp);
  ok(!Object.values(S.players).some(p => p.exp && p.exp.d !== S.date), 'the edge lasts the day');
  const gb = tagged.filter(p => E.ttOf(p).some(t => t.gb));
  console.log(`  (W杯2030: ${wc ? `${E.natJp(wc.champ)}が優勝、日本 ${wc.jp ? E.STAGE_JP[wc.jp] : '不出場'}` : '-'}・称号 ${tagged.length}人・得点王 ${gb.length}人・大一番の経験 ${seen.exp}回)`);
}

// ---------- an old save (S.v 19, made with the engine before this change) ----------
{
  const tmp = path.join(__dirname, '_old_engine_wc.js');
  try {
    fs.writeFileSync(tmp, execSync('git show 3fd8c3a:dev/src/engine.js', { cwd: path.join(__dirname, '..') }).toString());
    delete require.cache[require.resolve(tmp)];
    const O = require(tmp);
    const OS = O.newGame(DATA, 'kashima', 'テスト', '2026-10-14');
    for (let g = 0; g < 2000 && OS.date < '2027-05-20'; g++) { const st = O.advance(OS, 1); if (st.stop === 'match') { const f = OS.fixtures.find(y => y.id === st.fid); const M = O.createMatch(OS, f); O.simulateFull(OS, M); O.finishMatch(OS, M); } else if (st.stop === 'inbox') OS.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') O.rejectOffer(OS, y.id); }); }
    const save = JSON.parse(JSON.stringify(OS));
    ok(save.v === 19 && !save.nt.th, 'the old save: v19');
    E.migrate(save, DATA); const n1 = Object.values(save.players).filter(p => E.ttOf(p).length).length;
    E.migrate(save, DATA); const n2 = Object.values(save.players).filter(p => E.ttOf(p).length).length;
    ok(save.v === 20 && n1 >= 5 && n1 === n2, 'migrated: the 2026 World Cup players get their 称号, once ' + n1);
    ok(save.news.some(n => /国際大会|W杯・各大陸の大会/.test(n.text)), 'the news');
    let reach = null;
    for (let g = 0; g < 3000 && save.date < '2027-07-20'; g++) {
      const st = E.advance(save, 1);
      if (st.stop === 'match') { const f = save.fixtures.find(y => y.id === st.fid); E.autoLineup(save, save.my); const M = E.createMatch(save, f); E.simulateFull(save, M); E.finishMatch(save, M); }
      else if (st.stop === 'inbox') save.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(save, y.id); });
      else if (st.stop === 'seasonEnd') E.rollover(save);
      else if (st.stop === 'fired') E.takeJob(save, save.fired.offers[0]);
      if (save.nt.cur && save.nt.cur.kind === 'sum') reach = save.nt.cur.tours.map(t => t.key).join();
    }
    ok(reach === 'afcon2027,gold2027', 'the old save goes on into the summer of 2027: ' + reach);
    ok((save.nt.th || []).some(t => t.key === 'afcon2027'), 'and its tournaments end');
  } finally { try { fs.unlinkSync(tmp); } catch (e) {} }
}
console.log(bad ? `wc: ${bad} NG` : 'wc: all OK'); process.exit(bad ? 1 : 0);
