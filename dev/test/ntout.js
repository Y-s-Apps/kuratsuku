// 代表の不参加と追加招集 (2026-10-25): a player still injured for his side's first match on the day they join stays at his
// club (and one who is unwell, his condition low), Japan calls another of the same position (a goalkeeper always, otherwise
// NT.rep of the time; a J1 player sooner), also when one leaves the camp injured with two matches still to play (not with
// one, not in an Asian Cup under way), my club's players stop the day (inbox sub 'out' / 'rep'), the records, the season
// goes on with nobody away playing for his club.
// usage: node dev/test/ntout.js
let x = 23; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; // before the engine: it keeps Math.random as R
const E = require('../src/engine.js'); const DATA = require('../data.json');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('NG', m); } };
const stops = [];
const play = (S, until) => {
  for (let g = 0; g < 20000 && S.date < until; g++) {
    const st = E.advance(S, 1);
    if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { rotate: true }); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 40); }
    else if (st.stop === 'inbox') { stops.push(...S.inbox.filter(y => !y.seen && y.type === 'nt').map(y => ({ sub: y.sub || 'call', pid: y.rows[0].pid, d: S.date }))); S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); }); }
    else if (st.stop === 'seasonEnd') return 'end';
  }
};
const S = E.newGame(DATA, 'yokohamafm', 'テスト', '2026-10-14');
const deng = Object.values(S.players).find(p => p.name === 'トーマス デン'); if (deng) { deng.ovr += 3; deng.at = deng.at.map(v => v + 3); }   // one of mine in a squad (Australia)
const keep = { rep: E.NT.rep, ill: E.NT.ill };
const news = () => S.news.map(n => n.text).join('\n');

// ---------- the first window (named 9/17, they join 9/21, Japan plays 9/24 9/28 10/1 10/5) ----------
play(S, '2026-09-17');
const C = S.nt.cur;
ok(C && C.k === '2026w0' && C.sq.JPN.length === 28, 'the squad is named on 9/17');
const jp = C.sq.JPN.map(id => S.players[id]);
const inj = jp.find(p => p.pos !== 'GK' && S.order.includes(p.club) && p.inj <= 0) || jp.find(p => p.pos !== 'GK');
const gk = jp.find(p => p.pos === 'GK' && p.inj <= 0);
const fit = jp.find(p => p !== inj && p.pos !== 'GK' && p.inj <= 0);
inj.inj = 10; gk.inj = 8; fit.inj = 7;   // fit: 3 days left on 9/21, fit for the first match (9/24)
const callsGk = {}; for (const p of Object.values(S.players)) if (p.nat === 'JPN' && p.pos === 'GK') callsGk[p.id] = (p.nt && p.nt.calls) || 0;
// unwell: as ntDepart would do it, the day before
play(S, '2026-09-20');
const ill = jp.find(p => p.pos !== 'GK' && p !== inj && p !== gk && p !== fit && p.inj <= 0 && E.ntIn(C, p.id));
ill.cond = 100; E.NT.rep = 0; E.ntOut(S, C, 'JPN', ill, 'ill');
ok(C.out[ill.id].why === 'ill' && ill.cond >= 50 && ill.cond <= 60, 'unwell: condition down to 50〜60 ' + ill.cond);
ok(!E.ntIn(C, ill.id), 'unwell: out of the squad');
play(S, '2026-09-21');
ok(C.dep, 'they joined on 9/21');
ok(C.out[inj.id] && C.out[inj.id].why === 'inj' && !C.out[inj.id].mid && !inj.away, 'still injured for the first match: 不参加, at his club');
ok(!C.out[fit.id] && fit.away && fit.away.cc === 'JPN', 'fit again for the first match: he goes');
ok(!Object.values(C.rep || {}).some(r => r.for === inj.id), 'NT.rep 0: no one in his place (an outfield player)');
const rg = Object.keys(C.rep || {}).map(Number).find(id => C.rep[id].for === gk.id), r = S.players[rg];
ok(C.out[gk.id] && r, 'a goalkeeper is always replaced');
if (r) {
  ok(r.pos === 'GK' && r.nat === 'JPN' && r.away && r.away.cc === 'JPN' && r.away.to === C.to, 'the new goalkeeper: Japanese, with the squad until the end');
  ok(r.nt.calls === callsGk[r.id] + 1 && r.nt.last === '2026-09-21' && r.nt.lk === C.k, 'his call-up is in his record');
  ok(!jp.includes(r) && C.sq.JPN.includes(r.id), 'he was not in the squad, now he is');
  ok(r.inj <= 0, 'he is fit');
}
ok(C.sq.JPN.filter(id => E.ntIn(C, id)).length === 28 - 3 + 1, 'Japan: 28 − 3 out + 1 = 26 ' + C.sq.JPN.filter(id => E.ntIn(C, id)).length);
ok(C.sq.JPN.filter(id => E.ntIn(C, id)).every(id => S.players[id].away), 'everyone else in the squad is away');
ok(/不参加/.test(news()) && /追加招集/.test(news()), 'news: 不参加 and 追加招集');
ok(new RegExp(inj.name + '.*負傷のため不参加').test(news()), 'news: who and why');
// a J1 player sooner: the same squad, the next pick with and without the bonus
{
  const T = JSON.parse(JSON.stringify(S)), C2 = T.nt.cur, o = T.players[jp.find(p => p.pos === 'MF' && p.away).id];
  E.NT.repJ1 = 100; const a = E.ntReplace(T, C2, o); E.NT.repJ1 = -100; const b = E.ntReplace(T, C2, o); E.NT.repJ1 = 3;
  ok(a && T.order.includes(a.club) && a.pos === 'MF', 'with the bonus: a J1 player ' + (a && a.club));
  ok(b && !T.order.includes(b.club) && b.pos === 'MF', 'without: from abroad ' + (b && b.club));
}

// ---------- leaving the camp injured ----------
play(S, '2026-09-25');   // after the first match: 9/28, 10/1, 10/5 to play
E.NT.rep = 1;
const m1 = C.sq.JPN.map(id => S.players[id]).find(p => p.away && p.pos === 'DF' && p.inj <= 0);
m1.inj = 12; m1.away.to = S.date; const r1 = E.ntOut(S, C, 'JPN', m1, 'inj', true);
ok(C.out[m1.id].mid === 1 && E.ntIn(C, m1.id), 'left the camp: still counted in the squad');
ok(r1 && r1.pos === 'DF' && r1.away && C.rep[r1.id].for === m1.id, 'three matches to play: another DF called');
ok(/負傷で離脱した/.test(news()), 'news: called in place of the injured one');
play(S, '2026-09-26');
ok(!m1.away, 'the injured one is back at his club the next day');
play(S, '2026-10-02');   // one match to play
const m2 = C.sq.JPN.map(id => S.players[id]).find(p => p.away && p.pos === 'MF' && p.inj <= 0);
const n0 = C.sq.JPN.length; m2.inj = 9; m2.away.to = S.date;
ok(!E.ntOut(S, C, 'JPN', m2, 'inj', true) && C.sq.JPN.length === n0, 'one match to play: no one called');
// an Asian Cup under way: no change; before it began: yes
{
  const T = JSON.parse(JSON.stringify(S)), C2 = T.nt.cur; C2.kind = 'ac'; C2.games.forEach(g => { if (g.cc === 'JPN') g.played = false; });
  const a = T.players[C2.sq.JPN.find(id => T.players[id].away && T.players[id].pos === 'FW')];
  ok(!E.ntOut(T, C2, 'JPN', a, 'inj', true), 'an Asian Cup under way: no one called');
  const b = T.players[C2.sq.JPN.find(id => T.players[id].away && T.players[id].pos === 'FW' && T.players[id] !== a)];
  delete b.away; ok(!!E.ntOut(T, C2, 'JPN', b, 'inj'), 'before an Asian Cup begins: another called');
}
// other nations call no one from J1
{
  const T = JSON.parse(JSON.stringify(S)), C2 = T.nt.cur, cc = Object.keys(C2.sq).find(k => k !== 'JPN' && C2.sq[k].length);
  if (cc) { const n = C2.sq[cc].length, a = T.players[C2.sq[cc][0]]; delete a.away; ok(!E.ntOut(T, C2, cc, a, 'inj') && C2.sq[cc].length === n, 'other nations: no one in his place'); }
}
E.NT.rep = keep.rep;

// ---------- my club: 不参加 and 追加招集 stop the day (the second window: named 11/5, they join 11/9) ----------
play(S, '2026-11-05');
const C3 = S.nt.cur;
ok(C3 && C3.k === '2026w1', 'the second window is named');
const mine = Object.entries(C3.sq).flatMap(([cc, ids]) => ids.map(id => ({ cc, p: S.players[id] }))).find(o => o.p.club === S.my);
if (mine) mine.p.inj = 15;
const other = C3.sq.JPN.map(id => S.players[id]).find(p => p.club !== S.my && p.pos === 'MF' && p.inj <= 0);
other.inj = 15;
const cand = E.squad(S, S.my).filter(p => p.nat === 'JPN' && p.pos === 'MF' && !C3.sq.JPN.includes(p.id) && p.inj <= 0 && !p.loan).sort((a, b) => b.ovr - a.ovr)[0];
cand.ovr += 12; cand.at = cand.at.map(v => v + 12);
E.NT.rep = 1; stops.length = 0;
play(S, '2026-11-09');
E.NT.rep = keep.rep;
if (mine) {
  ok(C3.out[mine.p.id] && !mine.p.away, 'my player injured: 不参加');
  ok(stops.some(s => s.sub === 'out' && s.pid === mine.p.id && s.d === '2026-11-09'), 'my player 不参加: the day stops');
  ok(new RegExp(mine.p.name + 'は負傷のため').test(news()), 'news: my player stays at the club');
} else ok(false, 'one of mine in the second window');
ok(C3.rep[cand.id] && cand.away && cand.away.cc === 'JPN', 'my player called in place of an injured one');
ok(stops.some(s => s.sub === 'rep' && s.pid === cand.id), 'my player 追加招集: the day stops');
ok(S.nt.log.some(l => l.k === C3.k && l.pid === cand.id && l.rep), 'the log: 追加招集');
ok(E.lineupIssues(S, S.my).xi.concat(E.lineupIssues(S, S.my).bench).every(i => i.why !== 'nt' || S.players[i.pid] && S.players[i.pid].away), 'the warnings follow who is away');

// ---------- the season goes on ----------
const seen = { awayIn: 0 };
for (let g = 0; g < 30000; g++) {
  const st = E.advance(S, 1);
  if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { rotate: true }); const M = E.createMatch(S, f); if (Object.keys(M.pm).concat(M.h.bench, M.a.bench).some(id => S.players[id] && S.players[id].away)) seen.awayIn++; E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 40); }
  else if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
  else if (st.stop === 'seasonEnd') break;
}
ok(!!S.seasonEnd, 'the season finished');
ok(seen.awayIn === 0, 'nobody away plays for his club ' + seen.awayIn);
ok(!Object.values(S.players).some(p => p.away), 'everyone is back');
const past = (S.nt.past || []).find(q => q.k === '2026w0'), went = C.sq.JPN.filter(id => E.ntIn(C, id)).length;
ok(past && past.jp === went && went === C.sq.JPN.filter(id => !(C.out[id] && !C.out[id].mid)).length && went < C.sq.JPN.length, 'the record of the first window: those who went ' + (past && past.jp) + '/' + went);
console.log(bad ? `ntout: ${bad} NG` : 'ntout: all OK'); process.exit(bad ? 1 : 0);
