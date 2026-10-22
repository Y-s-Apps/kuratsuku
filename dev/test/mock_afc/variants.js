/* ACL（2026-10-23）の画面イメージ: 案A〜C。shoot.py が app.js の閉じ括弧の前に差し込む（アプリの関数をそのまま使う）。
   window.AFC_MOCK = 'A' | 'B' | 'C'。エンジン（S.afc・E.afcTable…）は実装済みのもの。 */
const MV = () => window.AFC_MOCK || 'A';
const AS = DATA.afc.assoc;
const CC_SHORT = { KSA: 'サウジ', AUS: '豪州', UZB: 'ウズベク', TKM: 'トルクメン', IDN: 'インドネシア', SIN: 'シンガポール', MAS: 'マレーシア', VIE: 'ベトナム', UAE: 'UAE', JPN: '日本' };
const ccOf = id => S.clubs[id] && S.clubs[id].afc ? S.clubs[id].afc.cc : 'JPN';
const ccJp = cc => CC_SHORT[cc] || (AS[cc] ? AS[cc][0] : cc);
const ctag = id => ccOf(id) === 'JPN' ? '' : `<small>${esc(ccJp(ccOf(id)))}</small>`;
const isJp = id => ccOf(id) === 'JPN';
UI.afc = UI.afc || { comp: 'acle', reg: 'E', grp: null };
function afcRow(f, note) {
  const w = f.played && !f.rr ? E.cupWinner(f) : null;
  return `<li><button class="fx ${f.h === S.my || f.a === S.my ? 'me' : ''}" style="width:100%" data-act="fxDetail" data-id="${f.id}"><span class="h ${w === f.h ? 'win' : ''}">${esc(S.clubs[f.h].short)}${ctag(f.h)}${kit(f.h, 'sm')}</span><span class="sc ${f.played ? '' : 'pending'}">${f.played ? `${f.hg}-${f.ag}${f.pk ? `<small>PK${f.pk[0]}-${f.pk[1]}</small>` : ''}` : jd(f.date)}</span><span class="a ${w === f.a ? 'win' : ''}">${kit(f.a, 'sm')}${esc(S.clubs[f.a].short)}${ctag(f.a)}</span></button>${note ? `<div class="fx-note">${note}</div>` : ''}</li>`;
}
function afcTbl(rows, cut, opt) {
  opt = opt || {};
  const tr = (r, i) => `<tr class="${i < cut ? 'z-top' : ''} ${r.id === S.my ? 'me' : ''} ${isJp(r.id) && r.id !== S.my ? 'jp' : ''}" data-act="team" data-id="${r.id}" tabindex="0" role="button"><td>${i + 1}</td><td class="club"><div>${kit(r.id, 'sm')}<span>${esc(S.clubs[r.id].short)}</span>${ctag(r.id) ? `<em class="cc">${esc(ccJp(ccOf(r.id)))}</em>` : ''}</div></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td class="pts">${r.pts}</td></tr>`;
  const list = opt.only ? rows.map((r, i) => [r, i]).filter(([, i]) => opt.only(i)) : rows.map((r, i) => [r, i]);
  let html = '', prev = -1;
  for (const [r, i] of list) { if (prev >= 0 && i > prev + 1) html += `<tr class="gap"><td colspan="8">…</td></tr>`; if (i === cut && prev === cut - 1) html += `<tr class="cut"><td colspan="8"></td></tr>`; html += tr(r, i); prev = i; }
  return `<div class="tbl-wrap"><table class="tbl afc"><thead><tr><th>#</th><th style="text-align:left">クラブ</th><th>試</th><th>勝</th><th>分</th><th>敗</th><th>得失</th><th>勝点</th></tr></thead><tbody>${html}</tbody></table></div>`;
}
const regOf = id => S.afc.e.E && S.afc.e.E.includes(id) ? 'E' : S.afc.e.W && S.afc.e.W.includes(id) ? 'W' : 'E';
const myGrp = () => Object.entries(S.afc.t.groups || {}).find(([, l]) => l.includes(S.my));
const RJ = { E: '東地区', W: '西地区' };
const stageNow = comp => {
  const X = comp === 'acle' ? S.afc.e : S.afc.t, C = E.CUPS[comp];
  if (X.champ) return `優勝 ${S.clubs[X.champ].short}`;
  if (comp === 'acle') { const st = X.st; return C.rounds[st] || ''; }
  return X.fin ? '決勝' : X.sf.E ? '準決勝' : X.qf.E ? '準々決勝' : X.r16.E ? 'ラウンド16' : 'グループステージ';
};
function myStatus(comp) {
  const m = E.afcMy(S, S.my).find(x => x.comp === comp);
  if (!m) return { chip: '', txt: '不参加' };
  if (m.done) return { chip: m.st === 'W' ? 'ok' : '', txt: m.jp.replace(/^\S+ /, '') };
  if (comp === 'acle' && S.afc.e.st === 1) { const r = E.afcTable(S, 'acle', regOf(S.my)); const i = r.findIndex(x => x.id === S.my); return { chip: 'acc', txt: `リーグステージ ${RJ[regOf(S.my)]} ${i + 1}位` }; }
  if (comp === 'acl2' && S.afc.t.st === 1 && !S.afc.t.r16.E) { const g = myGrp(); const r = E.afcTable(S, 'acl2', g[0]); return { chip: 'acc', txt: `${g[0]}組 ${r.findIndex(x => x.id === S.my) + 1}位` }; }
  return { chip: 'acc', txt: `${stageNow(comp)} 勝ち残り` };
}
const lsDone = reg => { const f = S.fixtures.filter(x => x.cup === 'acle' && x.cr === 1 && x.reg === reg); return f.filter(x => x.played).length; };
const lsMd = reg => { const f = S.fixtures.filter(x => x.cup === 'acle' && x.cr === 1 && x.reg === reg && x.played); return f.length ? Math.max(...f.map(x => x.md)) : 0; };
// ---- the knockout ties of a round, both legs on one row (A, C)
function koList(cup, cr, filt) {
  const fx = S.fixtures.filter(f => f.cup === cup && f.cr === cr && (!filt || filt(f)));
  if (!fx.length) return '';
  const one = fx.filter(f => f.leg !== 2);
  return `<ul class="list">${one.map(f => {
    if (!f.leg) return afcRow(f, `${jdw(f.date)}${f.venue ? '・' + esc(f.venue.replace(/・スポーツシティ$/, '')) : ''}`);
    const f2 = S.fixtures.find(x => x.tie === f.tie && x.leg === 2);
    const agg = E.tieAgg(S, f), w = f2 && f2.played ? E.cupWinner(f2) : null;
    return afcRow(f, `第1戦・${jdw(f.date)}`) + (f2 ? afcRow(f2, `第2戦・${jdw(f2.date)}${w ? `・2試合合計 ${agg[f.h] || 0}-${agg[f.a] || 0}・<b>${esc(S.clubs[w].short)}</b>が勝ち抜け` : ''}`) : '');
  }).join('')}</ul>`;
}
const PZ = DATA.afc.prize;
const descE = '東西16クラブずつのリーグステージ（別の組の8クラブと1試合ずつ、ホーム4・アウェイ4。同じ国のクラブとは当たらない）→ 各地区の上位8がラウンド16（ホーム＆アウェイ）→ 準々決勝からはサウジアラビア・ジッダで一発勝負。';
const descT = '東西4組ずつのグループステージ（ホーム＆アウェイ）→ 各組の上位2がラウンド16 → 準々決勝・準決勝（ホーム＆アウェイ）→ 決勝は一発勝負。';
/* ================= 案A: 大会ごとのタブ（Lカップと同じ作り） ================= */
function viewA(key) {
  const comp = key, C = E.CUPS[comp], st = myStatus(comp);
  const head = `<section class="card cuphead"><div class="row"><div class="eyebrow">2026/27 ${C.full}</div><span class="spacer"></span><span class="chip">${esc(stageNow(comp))}</span></div>
    <div class="row"><b>${esc(S.clubs[S.my].short)}</b><span class="chip ${st.chip}">${esc(st.txt)}</span></div>
    <p class="fine" style="margin:0">${comp === 'acle' ? descE : descT}優勝賞金 ${E.money(PZ[comp].champ)}。</p></section>`;
  if (comp === 'acle') {
    const reg = UI.afc.reg;
    const t = E.afcTable(S, 'acle', reg);
    const rseg = `<div class="seg sm2">${['E', 'W'].map(r => `<button data-act="afcReg" data-k="${r}" aria-pressed="${reg === r}">${RJ[r]}</button>`).join('')}</div>`;
    const mine = S.fixtures.filter(f => f.cup === 'acle' && f.cr === 1 && (f.h === S.my || f.a === S.my)).sort((a, b) => a.md - b.md);
    const ls = `<h3 class="sec-h">リーグステージ<small>第${lsMd(reg)}節まで・9/15〜2/17</small></h3>${rseg}${afcTbl(t, 8)}
      <div class="legend"><span><i style="background:var(--zone-top)"></i>ラウンド16へ（上位8）</span><span><i class="jpdot"></i>日本のクラブ</span><span class="spacer"></span><span>クラブをタップで詳しい情報</span></div>
      ${mine.length ? `<div class="eyebrow" style="margin:6px 0 0">${esc(S.clubs[S.my].short)}の8試合</div><ul class="list">${mine.map(f => afcRow(f, `第${f.md}節・${jdw(f.date)}`)).join('')}</ul>` : ''}`;
    const ko = [[2, 'ラウンド16', `${jdw(S.afc.d.r16.E[0])}・${jdw(S.afc.d.r16.E[1])}`], [3, '準々決勝', `${jdw(S.afc.d.qf[0])}・${jdw(S.afc.d.qf[1])}・ジッダ`], [4, '準決勝', `${jdw(S.afc.d.sf[0])}・${jdw(S.afc.d.sf[1])}・ジッダ`], [5, '決勝', `${jdw(S.afc.d.f)}・ジッダ`]]
      .map(([cr, n, d]) => `<h3 class="sec-h">${n}<small>${d}</small></h3>${koList('acle', cr) || '<p class="fine" style="margin:0">前のラウンドが終わると決まります。</p>'}`).join('');
    return head + ls + ko;
  }
  // ACL2: groups
  const g = myGrp(), gs = Object.entries(S.afc.t.groups);
  const order = (g ? [g] : []).concat(gs.filter(x => !g || x[0] !== g[0]));
  const groups = order.map(([n, l]) => `<div class="eyebrow" style="margin:10px 0 6px">${n}組<small class="muted">・${n < 'E' ? '西' : '東'}</small></div>${afcTbl(E.afcTable(S, 'acl2', n), 2)}`).join('');
  const ko = [[1, 'ラウンド16'], [2, '準々決勝'], [3, '準決勝'], [4, '決勝']].map(([cr, n]) => `<h3 class="sec-h">${n}</h3>${koList('acl2', cr) || '<p class="fine" style="margin:0">前のラウンドが終わると決まります。</p>'}`).join('');
  return head + `<h3 class="sec-h">グループステージ<small>9/16〜12/3</small></h3>${groups}` + ko;
}
/* ================= 案B: ACLは1つのタブ＋勝ち上がり表 ================= */
function bracket() {
  const fx = (cr, f) => S.fixtures.filter(x => x.cup === 'acle' && x.cr === cr && (!f || f(x)));
  const tieOf = f1 => { const f2 = S.fixtures.find(x => x.tie === f1.tie && x.leg === 2); const ag = E.tieAgg(S, f1); const w = f2 && f2.played ? E.cupWinner(f2) : null; return { a: f2 ? f2.h : f1.a, b: f2 ? f2.a : f1.h, ga: f2 && f2.played ? (ag[f2.h] || 0) : null, gb: f2 && f2.played ? (ag[f2.a] || 0) : null, w, pk: f2 && f2.pk }; };
  const one = f => ({ a: f.h, b: f.a, ga: f.played ? f.hg : null, gb: f.played ? f.ag : null, w: f.played ? E.cupWinner(f) : null, pk: f.pk });
  const box = t => { const side = (id, g) => id ? `<div class="bk-t ${t.w === id ? 'w' : t.w ? 'l' : ''} ${id === S.my ? 'me' : ''}">${kit(id, 'sm')}<span>${esc(S.clubs[id].short)}</span><b>${g == null ? '' : g}</b></div>` : `<div class="bk-t tbd"><span>未定</span></div>`; return `<div class="bk-m">${side(t.a, t.ga)}${side(t.b, t.gb)}${t.pk ? '<i class="bk-pk">PK</i>' : ''}</div>`; };
  const r16 = reg => fx(2, f => f.leg === 1 && f.reg === reg).map(tieOf);
  const qf = fx(3).sort((a, b) => a.slot - b.slot).map(one), sf = fx(4).sort((a, b) => a.slot - b.slot).map(one), fi = fx(5).map(one);
  const pad = (l, n) => l.concat(Array(Math.max(0, n - l.length)).fill({ a: null, b: null }));
  const col = (title, sub, list, cls) => `<div class="bk-col ${cls || ''}"><div class="bk-h">${title}<small>${sub}</small></div>${list.map(box).join('')}</div>`;
  return `<div class="bk-wrap"><div class="bk">${col('R16 東', '3/9・3/16', pad(r16('E'), 4))}${col('R16 西', '3/8・3/15', pad(r16('W'), 4))}${col('準々決勝', '4/23・24', pad(qf, 4), 'c2')}${col('準決勝', '4/27・28', pad(sf, 2), 'c3')}${col('決勝', '5/1 ジッダ', pad(fi, 1), 'c4')}</div></div>`;
}
function viewB() {
  const comp = UI.afc.comp, C = E.CUPS[comp], st = myStatus(comp);
  const cseg = `<div class="seg sm2">${['acle', 'acl2'].map(k => `<button data-act="afcComp" data-k="${k}" aria-pressed="${comp === k}">${E.CUPS[k].jp}${E.afcMy(S, S.my).some(x => x.comp === k) ? ' ●' : ''}</button>`).join('')}</div>`;
  const head = `<section class="card cuphead"><div class="row"><div class="eyebrow">2026/27 ${C.full}</div><span class="spacer"></span><span class="chip">${esc(stageNow(comp))}</span></div>
    <div class="row"><b>${esc(S.clubs[S.my].short)}</b><span class="chip ${st.chip}">${esc(st.txt)}</span><span class="spacer"></span><small class="muted">優勝賞金 ${E.money(PZ[comp].champ)}</small></div></section>`;
  if (comp === 'acle') {
    const reg = regOf(S.my), t = E.afcTable(S, 'acle', reg), me = t.findIndex(r => r.id === S.my);
    const ko = S.afc.e.st >= 2 || S.afc.e.r16.E;
    const tbl = `<h3 class="sec-h">リーグステージ ${RJ[reg]}<small>第${lsMd(reg)}節まで</small></h3>${afcTbl(t, 8, { only: i => i < 8 || Math.abs(i - me) <= 1 })}<button class="btn ghost block" style="min-height:40px">全16クラブ・西地区を見る</button>`;
    const bk = `<h3 class="sec-h">勝ち上がり<small>${ko ? '左右にスクロール' : 'リーグステージのあと'}</small></h3>${bracket()}`;
    return cseg + head + (ko ? bk + tbl : tbl + bk);
  }
  const g = myGrp(); const gn = g ? g[0] : 'G';
  return cseg + head + `<h3 class="sec-h">${gn}組<small>グループステージ</small></h3>${afcTbl(E.afcTable(S, 'acl2', gn), 2)}<button class="btn ghost block" style="min-height:40px">ほかの7組を見る</button>
    <h3 class="sec-h">ラウンド16〜決勝</h3>${koList('acl2', 1) || '<p class="fine" style="margin:0">グループステージが終わると決まります。</p>'}`;
}
/* ================= 案C: 自クラブの道のり＋日本勢 ================= */
function viewC() {
  const my = E.afcMy(S, S.my), comp = (my[0] && my[0].comp) || 'acle', C = E.CUPS[comp], X = comp === 'acle' ? S.afc.e : S.afc.t;
  const steps = comp === 'acle' ? [['PO', 'プレーオフ'], ['LS', 'リーグステージ'], ['R16', 'ラウンド16'], ['QF', '準々決勝'], ['SF', '準決勝'], ['F', '決勝']] : [['GS', 'グループ'], ['R16', 'ラウンド16'], ['QF', '準々決勝'], ['SF', '準決勝'], ['F', '決勝']];
  const rk = { PS: 0, LS: 1, GS: 0, R16: 2, QF: 3, SF: 4, F: 5, W: 6 }, rk2 = { GS: 0, R16: 1, QF: 2, SF: 3, F: 4, W: 5 };
  const cur = my[0] ? (comp === 'acle' ? rk[my[0].st] : rk2[my[0].st]) : -1;
  const startAt = comp === 'acle' && S.afc.jp.d.includes(S.my) ? 1 : 0;
  const stepper = `<ol class="road">${steps.map(([k, n], i) => `<li class="${i < startAt ? 'skip' : i < cur ? 'done' : i === cur ? 'now' : ''}"><i></i><span>${n}</span></li>`).join('')}</ol>`;
  const st = myStatus(comp);
  const earned = S.clubs[S.my].fin.prize;
  const nx = S.fixtures.filter(f => E.isAfc(f) && !f.played && (f.h === S.my || f.a === S.my)).sort((a, b) => a.date.localeCompare(b.date))[0];
  const hero = `<section class="card road-card"><div class="row"><div class="eyebrow">アジアへの道・2026/27</div><span class="spacer"></span><span class="chip acc">${C.jp}</span></div>
    <div class="row" style="gap:10px">${kitTag(S.my, S.clubs[S.my], 'lg')}<div><b style="font-size:17px">${esc(st.txt)}</b><div class="small muted">${cur <= 1 ? (comp === 'acle' ? 'リーグステージ上位8でラウンド16へ' : '各組の上位2でラウンド16へ') : nx ? `次は${E.roundName(nx).replace(/・第\d戦/, '')}（${jdw(nx.date)}）` : ''}・賞金 計${E.money(earned)}</div></div></div>${stepper}</section>`;
  let next = '';
  if (nx) {
    const op = nx.h === S.my ? nx.a : nx.h, oc = S.clubs[op];
    const gap = E.power(S, op) - E.power(S, S.my);
    next = `<section class="card"><div class="row"><div class="eyebrow">次のACL</div><span class="spacer"></span><b class="small">${jdw(nx.date)}・${nx.neutral ? 'ジッダ' : nx.h === S.my ? 'ホーム' : 'アウェイ'}</b></div>
      <button class="fx" style="width:100%;padding:10px 0" data-act="team" data-id="${op}"><span class="h">${esc(S.clubs[nx.h].short)}${ctag(nx.h)}${kit(nx.h, 'sm')}</span><span class="sc pending">${E.roundName(nx).replace('リーグステージ', 'LS ')}</span><span class="a">${kit(nx.a, 'sm')}${esc(S.clubs[nx.a].short)}${ctag(nx.a)}</span></button>
      <p class="fine" style="margin:0">${esc(oc.name)}（${esc(ccJp(ccOf(op)))}）。${oc.afc && oc.afc.lg ? `国内リーグ優勝${oc.afc.lg}回・` : ''}${oc.titles && oc.titles.acl ? `アジア制覇${oc.titles.acl}回・` : ''}${gap >= 2 ? '格上の相手。' : gap <= -2 ? '格下の相手。' : '力は互角。'}クラブの格 ${presBadge(oc)}</p></section>`;
  }
  // 日本勢
  const jp = [...S.afc.jp.d, ...S.afc.jp.ps, ...S.afc.jp.t];
  const jrow = id => {
    const m = E.afcMy(S, id); const a = m.filter(x => !x.done)[0] || m[m.length - 1];
    let txt = a ? a.jp : '—';
    if (a && !a.done && a.comp === 'acle' && S.afc.e.st === 1) { const r = E.afcTable(S, 'acle', regOf(id)); txt = `ACLE ${RJ[regOf(id)][0]}${r.findIndex(x => x.id === id) + 1}位`; }
    if (a && !a.done && a.comp === 'acl2' && !S.afc.t.r16.E) { const g = Object.entries(S.afc.t.groups).find(([, l]) => l.includes(id)); const r = E.afcTable(S, 'acl2', g[0]); txt = `ACL2 ${g[0]}組${r.findIndex(x => x.id === id) + 1}位`; }
    const out = a && a.done && a.st !== 'W';
    return `<li class="${id === S.my ? 'me' : ''}"><span>${kit(id, 'sm')}<b>${esc(S.clubs[id].short)}</b></span><span class="chip ${out ? '' : 'acc'}">${esc(txt)}</span></li>`;
  };
  const jcard = `<section class="card"><div class="row"><div class="eyebrow">日本勢</div><span class="spacer"></span><small class="muted">${jp.length}クラブ</small></div><ul class="jplist">${jp.map(jrow).join('')}</ul></section>`;
  // mini table
  let tbl = '';
  if (comp === 'acle' && S.afc.e.st === 1) {
    const reg = regOf(S.my), t = E.afcTable(S, 'acle', reg), me = t.findIndex(r => r.id === S.my);
    tbl = `<h3 class="sec-h">リーグステージ ${RJ[reg]}<small>第${lsMd(reg)}節まで</small></h3>${afcTbl(t, 8, { only: i => Math.abs(i - me) <= 2 || i === 7 || i === 8 })}<div class="row" style="gap:8px"><button class="btn ghost" style="flex:1;min-height:40px">順位表（東・西）</button><button class="btn ghost" style="flex:1;min-height:40px">ACL2</button></div>`;
  } else {
    tbl = `<h3 class="sec-h">勝ち上がり</h3>${koList('acle', S.afc.e.st, f => true) || ''}<div class="row" style="gap:8px"><button class="btn ghost" style="flex:1;min-height:40px">全ラウンド・順位表</button><button class="btn ghost" style="flex:1;min-height:40px">ACL2</button></div>`;
  }
  return hero + next + jcard + tbl;
}
/* ---- the cup tab: 天皇杯 / Lカップ / (案A) ACLE・ACL2 or (案B・C) ACL ---- */
const _cupView = cupView;
cupView = function () {
  const v = MV();
  if (v === 'A' && UI.lg.cup === 'acl') UI.lg.cup = 'acle';
  if (v !== 'A' && (UI.lg.cup === 'acle' || UI.lg.cup === 'acl2')) UI.lg.cup = 'acl';
  const key = UI.lg.cup || 'ec';
  const tabs = [['ec', '天皇杯'], ['lc', 'Lカップ']].concat(v === 'A' ? [['acle', 'ACLE'], ['acl2', 'ACL2']] : [['acl', 'ACL']]);
  const seg = `<div class="seg">${tabs.map(([k, l]) => `<button data-act="cupPick" data-k="${k}" aria-pressed="${key === k}">${l}</button>`).join('')}</div>`;
  if (key === 'ec' || key === 'lc') return _cupView().replace(/^<div class="seg">[\s\S]*?<\/div>/, seg);
  const body = v === 'A' ? viewA(key) : v === 'B' ? viewB() : viewC();
  return seg + body;
};
ACT.afcReg = d => { UI.afc.reg = d.k; render(); };
ACT.afcComp = d => { UI.afc.comp = d.k; render(); };
/* ---- an overseas club's sheet: country, AFC record, titles (all three) ---- */
const _sheetTeam = sheetTeam;
sheetTeam = function (cid, tab, back) {
  _sheetTeam(cid, tab, back);
  const c = S.clubs[cid]; if (!c || !c.afc) return;
  const sh = document.getElementById('sheet'); if (!sh) return;
  const eb = sh.querySelector('.team-head .eyebrow'); if (eb) eb.textContent = `${AS[c.afc.cc][0]}・AFC ${c.afc.reg === 'E' ? '東地区' : '西地区'}`;
  const p = [...sh.querySelectorAll('.sheet-body p.small.muted')].find(x => /J2のクラブ/.test(x.textContent));
  const rec = Object.entries(c.arec || {}).sort((a, b) => b[0].localeCompare(a[0])).map(([k, st]) => { const y = 2000 + parseInt(k, 10); const comp = k.endsWith('E') ? (y >= 2024 ? 'ACLE' : 'ACL') : (y >= 2024 ? 'ACL2' : 'AFCカップ'); return `<li><span>${y}/${String((y + 1) % 100).padStart(2, '0')}</span><b>${comp}</b><span class="chip ${st === 'W' ? 'ok' : st === 'F' || st === 'SF' ? 'acc' : ''}">${E.AFC_ST[st]}${['LS', 'GS', 'PS'].includes(st) ? '' : ''}</span></li>`; }).join('');
  const m = E.afcMy(S, cid)[0];
  let now = '';
  if (m && m.comp === 'acle' && S.afc.e.st === 1) { const r = E.afcTable(S, 'acle', c.afc.reg); const i = r.findIndex(x => x.id === cid); now = `今季 ACLE ${RJ[c.afc.reg][0]}${i + 1}位`; }
  else if (m) now = `今季 ${m.jp}`;
  const html = `<div class="team-rank afcr"><div><small>今季</small><b class="rec" style="font-size:15px">${esc(now.replace('今季 ', '') || '—')}</b></div><div><small>国内リーグ</small><b>${c.afc.lg}<i>回</i></b></div><div><small>アジア制覇</small><b>${(c.titles.acl || 0) + (c.titles.acl2 || 0)}<i>回</i></b></div></div>
    <div><div class="eyebrow" style="margin-bottom:6px">アジアの戦績（2023/24〜）</div><ul class="afcrec">${rec}</ul></div>`;
  if (p) p.outerHTML = html;
};
