// ACL（2026-10-23）の画面イメージ用のセーブ: 鹿島で指定の日まで自動で進める（エンジンは実装済み、画面はまだ）
// usage: cd dev/test/mock_afc && node make_save.js [club] [until] > save-<until>.json
const E = require('../../src/engine.js'); const D = require('../../data.json');
const club = process.argv[2] || 'kashima', until = process.argv[3] || '2026-11-27';
let x = 4; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
const S = E.newGame(D, club, 'ソーイ', '2026-10-23');
for (let g = 0; g < 9000 && S.date < until; g++) {
  const st = E.advance(S, 1);
  if (st.stop === 'match') { const f = S.fixtures.find(y => y.id === st.fid); E.autoLineup(S, S.my, { comp: E.compOf(f) }); const M = E.createMatch(S, f); E.simulateFull(S, M); E.finishMatch(S, M); S.board = Math.max(S.board, 50); }
  else if (st.stop === 'inbox') S.inbox.forEach(y => { y.seen = true; if (y.type === 'offer') E.rejectOffer(S, y.id); });
  else if (st.stop === 'cele') S.cele = [];
  else if (st.stop === 'seasonEnd') break;
}
if (S.sec) S.sec.notes = (S.sec.notes || []).map(n => Object.assign(n, { seen: true }));
S.inbox.forEach(y => { y.seen = true; });
process.stdout.write(JSON.stringify({ save: S }));
console.error(S.date, 'ACLE', JSON.stringify(E.afcMy(S, S.my)), 'E table', E.afcTable(S, 'acle', 'E').slice(0, 8).map(r => r.id + r.pts).join(' '));
