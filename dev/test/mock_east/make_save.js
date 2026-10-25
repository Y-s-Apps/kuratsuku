// 2026-10-25 の画面イメージ（施設 Lv6〜10・駅の向こう）用のセーブ: 横浜FM、施設は Lv5（練習場は Lv7）、スタジアムのまわりの
// 建物7つが完成、資金 474.9億、サポーター 69,689人（ユーザーのスクショ 2040/6/3 に近い数字）。
// open: ミュージアム完成・新駅の工事中 45%、shut: まわりの建物 5/7（駅の向こうはまだ）
// 作り方: cd dev/test/mock_east && node make_save.js > save.json && python3 shoot.py（dev/dist/touchline.html を先にビルド）
const E = require('../../src/engine.js'); const D = require('../../data.json');
const clone = o => { const c = JSON.parse(JSON.stringify(o)); c.cele = []; return c; };
const S = E.newGame(D, 'yokohamafm', 'ソーイ', '2026-10-15');
E.sponPick(S, E.sponRec(S));
for (let g = 0; g < 9000 && S.date < '2027-03-02'; g++) {
  const st = E.advance(S, 1);
  if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { comp: E.compOf(f) }); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 60); }
  else if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
}
const c = S.clubs[S.my], T = E.townOf(c);
c.fac = { train: 7, youth: 5, medical: 5, scout: 5 };
for (const k of E.TOWN.west) T.b[k] = '2031-05-01';
c.fans = 69689; c.fanH = (c.fanH || []).map((r, i, a) => [r[0], Math.round(67600 + 2089 * i / Math.max(1, a.length - 1)), r[2]]);
for (const f of S.fixtures) if (f.played && f.h === S.my && f.att && !f.neutral) f.att = Math.round(c.cap * (f.cup ? 0.62 : 0.955 + ((f.id * 7) % 10) / 600));
for (const p of E.squad(S, S.my)) { p.inj = 0; delete p.bans; delete p.away; }
E.autoLineup(S, S.my); S.sec.back = []; E.secSeen(S); S.sec.notes = []; S.inbox.forEach(y => { y.seen = true; });
const open = clone(S);
{ const o = open.clubs[open.my]; o.funds = 4749000 - 300000 - 500000; o.town.b.museum = '2027-01-20'; o.town.job = { k: 'station', from: '2026-08-20', to: '2027-08-20', cost: 500000 }; }
const shut = clone(S);
{ const o = shut.clubs[shut.my]; o.funds = 4749000; delete o.town.b.indoor; delete o.town.b.roof; o.fac.train = 5; }
console.log(JSON.stringify({ open, shut }));
