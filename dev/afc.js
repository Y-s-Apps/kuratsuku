// AFC club competitions (ACL Elite = ACLE, ACL Two = ACL2) for クラつく (2026-10-23).
// build_data.js copies this into data.json as `data.afc`; the engine reads it in newGame / migrate.
//
// Sources (fetched 2026-10-23):
//  - Format, teams, draws, results: Wikipedia "2023–24 AFC Champions League", "2024–25 / 2025–26 / 2026–27 AFC Champions
//    League Elite", "2026–27 AFC Champions League Elite league stage", "2026 AFC Champions League Elite final",
//    "2023–24 AFC Cup", "2024–25 / 2025–26 / 2026–27 AFC Champions League Two", "AFC club competitions ranking"
//    (association ranking 2026-05-17 and the 2027/28 slots by rank).
//  - Japan's slots: J.League 2025-05-23 (2026/27), 2026-05-01 (expansion: ACLE direct 3 + indirect 2 + ACL2 1),
//    2026-06-06 (the clubs: 鹿島・神戸・柏 direct, 京都・G大阪 indirect, 町田 ACL2), JFA board 2026-08-20 via
//    Soccer King (2027/28 on: J1 1〜3位 ACLE direct, 4・5位 ACLE preliminary stage, 天皇杯優勝 ACL2; a club with two
//    routes takes the higher one and the rest move up; vacancies go to the next J1 club, never the 天皇杯 runner-up).
//  - Japanese clubs' 2026/27 dates: footballchannel.jp 2026-10-14 (ACLE), spocale.com (町田 ACL2).
//  - Prize money: AFC via New Straits Times 2024-08 / A-Leagues 2024-06 (ACLE: $800k for the league stage, R16 $200k,
//    QF $400k, SF $600k, runner-up $6M in all, champion $12M in all; ACL2: $300k, winner $2.5M, about $3.28M in all).
//    Per win / draw amounts were only in an AFC graphic: the game's are estimates. $1 = ¥150.
//  - Strength: Opta Power Rankings (0-100). J1 and J2: footballchannel.jp 2026-08-07 (all 40 clubs, 120th〜2223rd);
//    Al-Hilal 86.6 / Al-Nassr 85.7 (the same list); JDT 80.6, Buriram 74.6, Persib 74.2, CAHN 73.6, Persija 70.2,
//    Bali United 66.0 (Okezone 2026-10-22); Newcastle Jets 73.1 (#977, Global Football Rankings); Shanghai Shenhua 929th,
//    Shanghai Port 1278th (Tencent 2026-07-25), Al-Ahli 128th, Al-Ittihad 325th (Sabq 2026-05), converted with the
//    August rank→rating curve; Shabab Al Ahli 80.9 (Opta 2025-06, +0.5 for the 2025/26 semi-final); league averages
//    (Opta 2025-11: J1 74.5, Saudi 72.9, K1 72.2, CSL 62.8) for the levels. Clubs with no published rating (`os: 'e'`)
//    are estimated from their league's level, their place at home (2025 / 2025-26) and their recent AFC record.
//    The game turns a rating into strength with the J1 clubs: match strength = 2.39 + 0.858 × rating (the 20 J1 clubs,
//    geometric-mean fit, see dev/test/afc.js), i.e. the top-14 average = that − (格 − 3) × 0.25.
//  - Club colours / grounds: Wikipedia club articles, kit news (Al Qadsiah red+yellow, Daejeon teal+dark red,
//    Port orange+navy); smaller clubs from general knowledge.
//  - 2026/27 squads: Wikipedia club / season articles (Aug〜Oct 2026), Al-Hilal: starting11.com + footballtransfers.com.
//    Katakana by ソーイ. Birthdays the pages didn't give are estimates (`b` with a trailing '?').

// association: Japanese name, region (E / W)
const ASSOC = {
  JPN: ['日本', 'E'], KOR: ['韓国', 'E'], CHN: ['中国', 'E'], THA: ['タイ', 'E'], AUS: ['オーストラリア', 'E'], MAS: ['マレーシア', 'E'],
  VIE: ['ベトナム', 'E'], SIN: ['シンガポール', 'E'], IDN: ['インドネシア', 'E'], HKG: ['香港', 'E'], PHI: ['フィリピン', 'E'], CAM: ['カンボジア', 'E'],
  MYA: ['ミャンマー', 'E'], TPE: ['台湾', 'E'], MNG: ['モンゴル', 'E'], MAC: ['マカオ', 'E'],
  KSA: ['サウジアラビア', 'W'], UAE: ['UAE', 'W'], QAT: ['カタール', 'W'], IRN: ['イラン', 'W'], UZB: ['ウズベキスタン', 'W'], IRQ: ['イラク', 'W'],
  JOR: ['ヨルダン', 'W'], BHR: ['バーレーン', 'W'], OMA: ['オマーン', 'W'], KUW: ['クウェート', 'W'], TKM: ['トルクメニスタン', 'W'], TJK: ['タジキスタン', 'W'],
  KGZ: ['キルギス', 'W'], IND: ['インド', 'W'], BAN: ['バングラデシュ', 'W'], MDV: ['モルディブ', 'W'], LBN: ['レバノン', 'W'], SYR: ['シリア', 'W'], PLE: ['パレスチナ', 'W'],
};

// From 2027/28 (the 2026-05-17 association ranking, as the JFA assumes Japan stays 1st in the East): per region, the
// clubs each association sends. d = ACLE league stage, ps = ACLE preliminary stage, t = ACL2 group stage (besides the
// preliminary-stage losers, who drop into ACL2). Japan's own five + one come from the J1 table and the 天皇杯 (engine).
const SLOTS = {
  E: { d: { JPN: 3, KOR: 3, THA: 3, CHN: 2, AUS: 1, MAS: 1 }, ps: { JPN: 2, KOR: 1, AUS: 1, SIN: 1, VIE: 1 },
       t: { JPN: 1, KOR: 1, THA: 1, CHN: 1, AUS: 1, MAS: 1, SIN: 1, VIE: 1, IDN: 1, HKG: 2, CAM: 2 } },
  W: { d: { KSA: 3, UAE: 3, IRN: 3, QAT: 2, UZB: 1, JOR: 1 }, ps: { KSA: 2, UAE: 1, UZB: 1, IRQ: 1, BHR: 1 },
       t: { KSA: 1, UAE: 1, IRN: 1, QAT: 1, UZB: 1, JOR: 1, IRQ: 1, BHR: 1, OMA: 1, KUW: 1, TKM: 1, IND: 1 } },
};

// Clubs that played the ACL / ACLE (E) or the AFC Cup / ACL2 (2) group or league stage — or their preliminary stage — in
// 2023/24 〜 2026/27. The pools for later seasons are these, by association.
// id, name, short, en, cc, colours, ground and capacity, op = Opta-scale rating (os: 'o' published / 'e' estimate),
// pres = 格 (1〜5, from titles and standing), t = titles {acl: Asian club titles (incl. the Asian Club Championship), acl2:
// AFC Cup / ACL2, lg: national league titles where known}, rec = 'season+comp:stage' (23 = 2023/24 …; E / 2), stage:
// W 優勝 F 準優勝 SF 準決勝 QF 準々決勝 R16 ラウンド16 LS リーグステージ GS グループステージ PS プレーオフ.
// AFC Cup 2023/24 zone rounds: zonal semi-final = R16, zonal final / inter-zone semi = QF, inter-zone final = SF.
const CLUBS = [
  // ---- East: Korea ----
  { id: 'jeonbuk', name: '全北現代モータース', short: '全北', en: 'Jeonbuk Hyundai Motors', cc: 'KOR', c1: '#0B7A3E', c2: '#F2F2F2', st: '全州ワールドカップ競技場', cap: 34207, op: 80.5, os: 'e', pres: 4.5, t: { acl: 2, lg: 10 }, rec: '23E:QF 24-2:QF 26E:LS', form: '4-2-3-1' },
  { id: 'daejeon', name: '大田ハナ・シチズン', short: '大田', en: 'Daejeon Hana Citizen', cc: 'KOR', c1: '#008C86', c2: '#7A1E2C', st: '大田ワールドカップ競技場', cap: 40535, op: 78.8, os: 'e', pres: 2.5, t: {}, rec: '26E:LS', form: '4-4-2' },
  { id: 'pohang', name: '浦項スティーラーズ', short: '浦項', en: 'Pohang Steelers', cc: 'KOR', c1: '#C8102E', c2: '#111111', st: '浦項スティールヤード', cap: 17443, op: 77.8, os: 'e', pres: 4.5, t: { acl: 3, lg: 5 }, rec: '23E:R16 24E:LS 25-2:R16 26E:LS', form: '4-2-3-1' },
  { id: 'ulsan', name: '蔚山HD', short: '蔚山', en: 'Ulsan HD', cc: 'KOR', c1: '#1D4FA0', c2: '#F2C400', st: '蔚山文殊フットボールスタジアム', cap: 37897, op: 78.0, os: 'e', pres: 4.5, t: { acl: 2, lg: 5 }, rec: '23E:SF 24E:LS 25E:LS' },
  { id: 'fcseoul', name: 'FCソウル', short: 'ソウル', en: 'FC Seoul', cc: 'KOR', c1: '#C8102E', c2: '#111111', st: 'ソウルワールドカップ競技場', cap: 66704, op: 79.0, os: 'e', pres: 4.0, t: { lg: 6 }, rec: '25E:R16 26-2:GS' },
  { id: 'gangwon', name: '江原FC', short: '江原', en: 'Gangwon FC', cc: 'KOR', c1: '#F26522', c2: '#1B2A5A', st: '春川松岩スポーツタウン', cap: 20000, op: 77.5, os: 'e', pres: 2.0, t: {}, rec: '25E:R16 26E:PS 26-2:GS' },
  { id: 'gwangju', name: '光州FC', short: '光州', en: 'Gwangju FC', cc: 'KOR', c1: '#F2C400', c2: '#C8102E', st: '光州サッカー専用競技場', cap: 10007, op: 75.5, os: 'e', pres: 2.0, t: {}, rec: '24E:QF' },
  { id: 'incheon', name: '仁川ユナイテッド', short: '仁川', en: 'Incheon United', cc: 'KOR', c1: '#1D4FA0', c2: '#111111', st: '仁川サッカー専用競技場', cap: 20300, op: 76.5, os: 'e', pres: 2.0, t: {}, rec: '23E:GS' },
  // ---- East: China ----
  { id: 'shanghaiport', name: '上海海港', short: '上海海港', en: 'Shanghai Port', cc: 'CHN', c1: '#D71920', c2: '#F2F2F2', st: '上海浦東サッカー場', cap: 37000, op: 72.0, os: 'o', pres: 3.5, t: { lg: 4 }, rec: '23E:PS 24E:R16 25E:LS 26E:LS' },
  { id: 'shenhua', name: '上海申花', short: '申花', en: 'Shanghai Shenhua', cc: 'CHN', c1: '#1F3F9A', c2: '#F2F2F2', st: '上海体育場', cap: 72000, op: 73.9, os: 'o', pres: 3.0, t: { lg: 1 }, rec: '24E:R16 25E:LS 26-2:GS' },
  { id: 'guoan', name: '北京国安', short: '国安', en: 'Beijing Guoan', cc: 'CHN', c1: '#00653A', c2: '#F2F2F2', st: '北京工人体育場', cap: 68000, op: 73.0, os: 'e', pres: 3.0, t: { lg: 1 }, rec: '25-2:GS 26E:LS', form: '4-2-3-1' },
  { id: 'shandong', name: '山東泰山', short: '山東', en: 'Shandong Taishan', cc: 'CHN', c1: '#F28C00', c2: '#F2F2F2', st: '済南オリンピックスポーツセンター', cap: 56808, op: 72.5, os: 'e', pres: 3.0, t: { lg: 1 }, rec: '23E:QF 24E:LS' },
  { id: 'chengdu', name: '成都蓉城', short: '成都', en: 'Chengdu Rongcheng', cc: 'CHN', c1: '#C8102E', c2: '#F2C400', st: '鳳凰山スポーツパーク', cap: 50000, op: 73.5, os: 'e', pres: 2.0, t: {}, rec: '25E:LS' },
  { id: 'zhejiang', name: '浙江FC', short: '浙江', en: 'Zhejiang FC', cc: 'CHN', c1: '#007A3D', c2: '#F2F2F2', st: '杭州黄龍スポーツセンター', cap: 51971, op: 71.0, os: 'e', pres: 1.8, t: {}, rec: '23E:GS 24-2:GS' },
  { id: 'wuhantt', name: '武漢三鎮', short: '武漢', en: 'Wuhan Three Towns', cc: 'CHN', c1: '#2A5CAA', c2: '#F2F2F2', st: '武漢スポーツセンター', cap: 54357, op: 69.5, os: 'e', pres: 1.8, t: { lg: 1 }, rec: '23E:GS' },
  // ---- East: Thailand ----
  { id: 'buriram', name: 'ブリーラム・ユナイテッド', short: 'ブリーラム', en: 'Buriram United', cc: 'THA', c1: '#123C8C', c2: '#F28C28', st: 'チャン・アリーナ', cap: 32600, op: 74.6, os: 'o', pres: 3.5, t: {}, rec: '23E:GS 24E:QF 25E:QF 26E:LS', form: '4-2-3-1' },
  { id: 'portfc', name: 'ポートFC', short: 'ポート', en: 'Port FC', cc: 'THA', c1: '#F57F20', c2: '#1A2A6C', st: 'PATスタジアム', cap: 8000, op: 72.0, os: 'e', pres: 2.2, t: {}, rec: '23E:PS 24-2:R16 26E:LS', form: '4-2-3-1' },
  { id: 'ratchaburi', name: 'ラーチャブリーFC', short: 'ラーチャブリー', en: 'Ratchaburi FC', cc: 'THA', c1: '#C8102E', c2: '#111111', st: 'ドラゴン・ソーラーパーク', cap: 10000, op: 70.2, os: 'e', pres: 1.8, t: {}, rec: '25-2:QF 26E:LS', form: '4-3-3' },
  { id: 'bangkokutd', name: 'バンコク・ユナイテッド', short: 'バンコクU', en: 'Bangkok United', cc: 'THA', c1: '#E30613', c2: '#111111', st: 'タマサート・スタジアム', cap: 25000, op: 71.8, os: 'o', pres: 2.0, t: {}, rec: '23E:R16 24E:PS 24-2:R16 25-2:SF' },
  { id: 'bgpathum', name: 'BGパトゥム・ユナイテッド', short: 'BGパトゥム', en: 'BG Pathum United', cc: 'THA', c1: '#1E3A8A', c2: '#F2F2F2', st: 'BGスタジアム', cap: 10114, op: 71.3, os: 'e', pres: 2.0, t: {}, rec: '23E:GS 25-2:GS 26-2:GS' },
  { id: 'muangthong', name: 'ムアントン・ユナイテッド', short: 'ムアントン', en: 'Muangthong United', cc: 'THA', c1: '#D9261C', c2: '#111111', st: 'サンダードーム・スタジアム', cap: 15000, op: 68.5, os: 'e', pres: 2.0, t: {}, rec: '24-2:R16' },
  // ---- East: Australia ----
  { id: 'newcastlejets', name: 'ニューカッスル・ジェッツ', short: 'ニューカッスル', en: 'Newcastle Jets', cc: 'AUS', c1: '#0B2D6B', c2: '#E2231A', st: 'マクドナルド・ジョーンズ・スタジアム', cap: 30000, op: 73.1, os: 'o', pres: 2.0, t: { lg: 1 }, rec: '26E:LS', form: '4-2-3-1' },
  { id: 'melbcity', name: 'メルボルン・シティ', short: 'メルボルンC', en: 'Melbourne City', cc: 'AUS', c1: '#6CABDD', c2: '#F2F2F2', st: 'AAMIパーク', cap: 30050, op: 74.5, os: 'e', pres: 2.8, t: {}, rec: '23E:GS 25E:R16' },
  { id: 'ccm', name: 'セントラルコースト・マリナーズ', short: 'CCマリナーズ', en: 'Central Coast Mariners', cc: 'AUS', c1: '#F7D117', c2: '#14234B', st: 'インダストリー・スタジアム', cap: 20059, op: 70.5, os: 'e', pres: 2.5, t: { acl2: 1 }, rec: '23-2:W 24E:LS' },
  { id: 'adelaide', name: 'アデレード・ユナイテッド', short: 'アデレード', en: 'Adelaide United', cc: 'AUS', c1: '#D3122C', c2: '#F2F2F2', st: 'クーパーズ・スタジアム', cap: 16500, op: 71.5, os: 'e', pres: 2.3, t: {}, rec: '26E:PS 26-2:GS' },
  { id: 'melbvictory', name: 'メルボルン・ビクトリー', short: 'メルボルンV', en: 'Melbourne Victory', cc: 'AUS', c1: '#0B1F5C', c2: '#F2F2F2', st: 'AAMIパーク', cap: 30050, op: 71.5, os: 'e', pres: 2.5, t: {}, rec: '26-2:GS' },
  { id: 'sydneyfc', name: 'シドニーFC', short: 'シドニー', en: 'Sydney FC', cc: 'AUS', c1: '#6CABDD', c2: '#0B1F5C', st: 'アリアンツ・スタジアム', cap: 42500, op: 71.5, os: 'e', pres: 2.5, t: {}, rec: '24-2:SF' },
  { id: 'macarthur', name: 'マッカーサーFC', short: 'マッカーサー', en: 'Macarthur FC', cc: 'AUS', c1: '#111111', c2: '#C9A227', st: 'キャンベルタウン・スタジアム', cap: 17500, op: 69.5, os: 'e', pres: 1.8, t: {}, rec: '23-2:QF 25-2:R16' },
  // ---- East: Malaysia ----
  { id: 'jdt', name: 'ジョホール・ダルル・タクジム', short: 'ジョホールDT', en: "Johor Darul Ta'zim", cc: 'MAS', c1: '#E11E26', c2: '#1D3E9C', st: 'スルタン・イブラヒム・スタジアム', cap: 40000, op: 80.6, os: 'o', pres: 3.0, t: { acl2: 1 }, rec: '23E:GS 24E:R16 25E:QF 26E:LS', form: '4-3-3' },
  { id: 'selangor', name: 'セランゴールFC', short: 'セランゴール', en: 'Selangor FC', cc: 'MAS', c1: '#C8102E', c2: '#F2C400', st: 'MBPJスタジアム', cap: 10000, op: 70.0, os: 'e', pres: 2.0, t: {}, rec: '24-2:GS 25-2:GS' },
  { id: 'sabah', name: 'サバFC', short: 'サバ', en: 'Sabah FC', cc: 'MAS', c1: '#1D4FA0', c2: '#C8102E', st: 'リカス・スタジアム', cap: 35000, op: 65.0, os: 'e', pres: 1.5, t: {}, rec: '23-2:R16' },
  { id: 'terengganu', name: 'トレンガヌFC', short: 'トレンガヌ', en: 'Terengganu FC', cc: 'MAS', c1: '#111111', c2: '#F2F2F2', st: 'スルタン・ミザン・ザイナル・アビディン・スタジアム', cap: 50000, op: 65.0, os: 'e', pres: 1.5, t: {}, rec: '23-2:GS' },
  { id: 'kuching', name: 'クチン・シティ', short: 'クチン', en: 'Kuching City', cc: 'MAS', c1: '#D9261C', c2: '#F2C400', st: 'サラワク州立スタジアム', cap: 40000, op: 64.0, os: 'e', pres: 1.2, t: {}, rec: '26-2:GS' },
  // ---- East: Vietnam ----
  { id: 'cahn', name: 'コンアン・ハノイ', short: 'CAハノイ', en: 'Công An Hà Nội', cc: 'VIE', c1: '#C8102E', c2: '#F2C400', st: 'ハンダイ・スタジアム', cap: 22500, op: 73.6, os: 'o', pres: 1.8, t: { lg: 3 }, rec: '25-2:R16 26E:LS', form: '4-2-3-1' },
  { id: 'hanoifc', name: 'ハノイFC', short: 'ハノイ', en: 'Hà Nội FC', cc: 'VIE', c1: '#6B2C91', c2: '#F2F2F2', st: 'ハンダイ・スタジアム', cap: 22500, op: 70.5, os: 'e', pres: 2.3, t: {}, rec: '23E:GS' },
  { id: 'namdinh', name: 'ナムディン', short: 'ナムディン', en: 'Thép Xanh Nam Định', cc: 'VIE', c1: '#1D4FA0', c2: '#F2F2F2', st: 'ティエンチュオン・スタジアム', cap: 30000, op: 70.0, os: 'e', pres: 1.8, t: {}, rec: '24-2:R16 25-2:GS' },
  { id: 'viettel', name: 'ベトテルFC', short: 'ベトテル', en: 'Thể Công–Viettel', cc: 'VIE', c1: '#C8102E', c2: '#F2F2F2', st: 'ミーディン国立競技場', cap: 40000, op: 70.5, os: 'e', pres: 1.8, t: {}, rec: '26-2:GS' },
  { id: 'haiphong', name: 'ハイフォン', short: 'ハイフォン', en: 'Hải Phòng FC', cc: 'VIE', c1: '#C8102E', c2: '#F2F2F2', st: 'ラクチャイ・スタジアム', cap: 28000, op: 66.0, os: 'e', pres: 1.5, t: {}, rec: '23E:PS 23-2:GS' },
  // ---- East: Singapore / Indonesia / Hong Kong / Philippines / Cambodia / others ----
  { id: 'lioncity', name: 'ライオン・シティ・セーラーズ', short: 'LCセーラーズ', en: 'Lion City Sailors', cc: 'SIN', c1: '#1D4FA0', c2: '#F2F2F2', st: 'ビシャン・スタジアム', cap: 10000, op: 69.0, os: 'e', pres: 2.0, t: {}, rec: '23E:GS 24-2:F 25-2:GS 26-2:GS' },
  { id: 'tampines', name: 'タンピネス・ローバーズ', short: 'タンピネス', en: 'Tampines Rovers', cc: 'SIN', c1: '#F2C400', c2: '#1D4FA0', st: 'ジャラン・ブサール・スタジアム', cap: 6000, op: 65.5, os: 'e', pres: 1.5, t: {}, rec: '24-2:GS 25-2:QF 26-2:GS' },
  { id: 'hougang', name: 'ホウガン・ユナイテッド', short: 'ホウガン', en: 'Hougang United', cc: 'SIN', c1: '#F28C00', c2: '#111111', st: 'ホウガン・スタジアム', cap: 3000, op: 60.0, os: 'e', pres: 1.2, t: {}, rec: '23-2:GS' },
  { id: 'persib', name: 'ペルシブ・バンドン', short: 'ペルシブ', en: 'Persib Bandung', cc: 'IDN', c1: '#1D4FA0', c2: '#F2F2F2', st: 'ゲロラ・バンドン・ラウタン・アピ', cap: 38000, op: 74.2, os: 'o', pres: 2.0, t: {}, rec: '24-2:GS 25-2:R16 26-2:GS' },
  { id: 'baliutd', name: 'バリ・ユナイテッド', short: 'バリU', en: 'Bali United', cc: 'IDN', c1: '#C8102E', c2: '#111111', st: 'カプテン・イ・ワヤン・ディプタ', cap: 25000, op: 66.0, os: 'o', pres: 1.5, t: {}, rec: '23E:PS 23-2:GS' },
  { id: 'psm', name: 'PSMマカッサル', short: 'PSM', en: 'PSM Makassar', cc: 'IDN', c1: '#8B1A1A', c2: '#F2F2F2', st: 'BJハビビ・スタジアム', cap: 20000, op: 66.5, os: 'e', pres: 1.5, t: {}, rec: '23-2:GS' },
  { id: 'kitchee', name: '傑志', short: '傑志', en: 'Kitchee', cc: 'HKG', c1: '#1D4FA0', c2: '#F2F2F2', st: '旺角大球場', cap: 6668, op: 63.0, os: 'e', pres: 1.8, t: {}, rec: '23E:GS 26-2:GS' },
  { id: 'eastern', name: '東方', short: '東方', en: 'Eastern', cc: 'HKG', c1: '#1D4FA0', c2: '#C9A227', st: '旺角大球場', cap: 6668, op: 58.0, os: 'e', pres: 1.2, t: {}, rec: '24-2:GS 25-2:GS' },
  { id: 'leeman', name: '理文', short: '理文', en: 'Lee Man', cc: 'HKG', c1: '#F28C00', c2: '#111111', st: '旺角大球場', cap: 6668, op: 60.0, os: 'e', pres: 1.2, t: {}, rec: '23E:PS 24-2:GS' },
  { id: 'taipo', name: '大埔', short: '大埔', en: 'Tai Po', cc: 'HKG', c1: '#1E8F3E', c2: '#F2F2F2', st: '大埔運動場', cap: 3000, op: 60.0, os: 'e', pres: 1.2, t: {}, rec: '25-2:GS 26-2:GS' },
  { id: 'kaya', name: 'カヤ・イロイロ', short: 'カヤ', en: 'Kaya–Iloilo', cc: 'PHI', c1: '#C8102E', c2: '#F2F2F2', st: 'リサール・メモリアル・スタジアム', cap: 12873, op: 58.0, os: 'e', pres: 1.2, t: {}, rec: '23E:GS 24-2:GS 25-2:GS' },
  { id: 'dhcebu', name: 'DHセブ', short: 'DHセブ', en: 'DH Cebu', cc: 'PHI', c1: '#1D4FA0', c2: '#F2C400', st: 'セブ・シティ・スポーツセンター', cap: 5000, op: 56.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS 24-2:GS' },
  { id: 'stallion', name: 'スタリオン・ラグナ', short: 'スタリオン', en: 'Stallion Laguna', cc: 'PHI', c1: '#C8102E', c2: '#111111', st: 'ビニャン・フットボールスタジアム', cap: 3000, op: 54.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'manila', name: 'マニラ・ディガー', short: 'マニラD', en: 'Manila Digger', cc: 'PHI', c1: '#F28C00', c2: '#111111', st: 'リサール・メモリアル・スタジアム', cap: 12873, op: 54.0, os: 'e', pres: 1.0, t: {}, rec: '25-2:PS 26-2:PS' },
  { id: 'svayrieng', name: 'プレアカン・リーチ・スヴァイリエン', short: 'スヴァイリエン', en: 'PKR Svay Rieng', cc: 'CAM', c1: '#1D4FA0', c2: '#F2F2F2', st: 'モロドク・テコー国立競技場', cap: 60000, op: 62.5, os: 'e', pres: 1.2, t: {}, rec: '26-2:GS' },
  { id: 'phnompenh', name: 'プノンペン・クラウン', short: 'プノンペン', en: 'Phnom Penh Crown', cc: 'CAM', c1: '#C8102E', c2: '#F2C400', st: 'スマートRSNスタジアム', cap: 5000, op: 61.5, os: 'e', pres: 1.3, t: {}, rec: '23-2:R16 26-2:GS' },
  { id: 'shanutd', name: 'シャン・ユナイテッド', short: 'シャンU', en: 'Shan United', cc: 'MYA', c1: '#F2C400', c2: '#111111', st: 'トゥウンナ・スタジアム', cap: 32000, op: 57.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'taichung', name: '台中フトゥーロ', short: '台中', en: 'Taichung Futuro', cc: 'TPE', c1: '#1D4FA0', c2: '#F2F2F2', st: '台中市朝馬足球場', cap: 3000, op: 56.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:QF' },
  { id: 'taiwansteel', name: '台湾鋼鉄', short: '台湾鋼鉄', en: 'Taiwan Steel', cc: 'TPE', c1: '#1D4FA0', c2: '#C8102E', st: '新北市立板橋第一運動場', cap: 5000, op: 54.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'ulaanbaatar', name: 'FCウランバートル', short: 'ウランバートル', en: 'FC Ulaanbaatar', cc: 'MNG', c1: '#1D4FA0', c2: '#C8102E', st: 'MFFフットボールセンター', cap: 5000, op: 50.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'chaopakkei', name: 'チャオ・パク・ケイ', short: 'チャオパクケイ', en: 'Chao Pak Kei', cc: 'MAC', c1: '#1D4FA0', c2: '#F2F2F2', st: 'マカオ・スタジアム', cap: 16272, op: 46.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  // ---- West: Saudi Arabia ----
  { id: 'alhilal', name: 'アル・ヒラル', short: 'ヒラル', en: 'Al-Hilal', cc: 'KSA', c1: '#1D4F9C', c2: '#F2F2F2', st: 'キングダム・アリーナ', cap: 26000, op: 86.6, os: 'o', pres: 5, t: { acl: 4, lg: 19 }, rec: '23E:SF 24E:SF 25E:R16 26E:LS', form: '4-2-3-1' },
  { id: 'alnassr', name: 'アル・ナスル', short: 'ナスル', en: 'Al-Nassr', cc: 'KSA', c1: '#FCD116', c2: '#1E3A8A', st: 'アル・アウワル・パーク', cap: 25000, op: 85.7, os: 'o', pres: 4.0, t: { lg: 11 }, rec: '23E:QF 24E:SF 25-2:F 26E:LS', form: '4-2-3-1' },
  { id: 'alahli', name: 'アル・アハリ', short: 'アハリ', en: 'Al-Ahli', cc: 'KSA', c1: '#00843D', c2: '#F2F2F2', st: 'キング・アブドゥッラー・スポーツシティ', cap: 62345, op: 84.5, os: 'o', pres: 4.5, t: { acl: 2, lg: 9 }, rec: '24E:W 25E:W 26E:LS', form: '4-3-3' },
  { id: 'alittihad', name: 'アル・イテハド', short: 'イテハド', en: 'Al-Ittihad', cc: 'KSA', c1: '#FFD200', c2: '#111111', st: 'キング・アブドゥッラー・スポーツシティ', cap: 62345, op: 81.0, os: 'o', pres: 4.5, t: { acl: 2, lg: 14 }, rec: '23E:QF 25E:QF 26E:LS', form: '4-3-3' },
  { id: 'alqadsiah', name: 'アル・カーディシーヤ', short: 'カーディシーヤ', en: 'Al-Qadsiah', cc: 'KSA', c1: '#D7141A', c2: '#FFD200', st: 'プリンス・モハメド・ビン・ファハド・スタジアム', cap: 26000, op: 81.5, os: 'e', pres: 2.5, t: {}, rec: '26E:LS', form: '4-2-3-1' },
  { id: 'alfayha', name: 'アル・ファイハ', short: 'ファイハ', en: 'Al-Fayha', cc: 'KSA', c1: '#F47920', c2: '#1D4FA0', st: 'マジュマア・スポーツシティ', cap: 7000, op: 76.0, os: 'e', pres: 2.0, t: {}, rec: '23E:R16' },
  { id: 'altaawoun', name: 'アル・タアーウン', short: 'タアーウン', en: 'Al-Taawoun', cc: 'KSA', c1: '#FFD200', c2: '#1D4FA0', st: 'キング・アブドゥッラー・スポーツシティ（ブライダ）', cap: 25000, op: 78.0, os: 'e', pres: 2.0, t: {}, rec: '24-2:SF 26-2:GS' },
  // ---- West: UAE ----
  { id: 'alain', name: 'アル・アイン', short: 'アイン', en: 'Al Ain', cc: 'UAE', c1: '#6A2C91', c2: '#F2F2F2', st: 'ハッザ・ビン・ザイード・スタジアム', cap: 25965, op: 79.5, os: 'e', pres: 4.5, t: { acl: 2, lg: 15 }, rec: '23E:W 24E:LS 26E:LS', form: '4-2-3-1' },
  { id: 'shababahli', name: 'シャバブ・アル・アハリ', short: 'シャバブ・アハリ', en: 'Shabab Al Ahli', cc: 'UAE', c1: '#C8102E', c2: '#F2F2F2', st: 'ラシード・スタジアム', cap: 12000, op: 81.5, os: 'o', pres: 3.5, t: { lg: 9 }, rec: '24E:PS 24-2:QF 25E:SF 26E:LS', form: '4-2-3-1' },
  { id: 'alwasl', name: 'アル・ワスル', short: 'ワスル', en: 'Al Wasl', cc: 'UAE', c1: '#FFD200', c2: '#111111', st: 'ザビール・スタジアム', cap: 8439, op: 79.0, os: 'e', pres: 3.0, t: { lg: 8 }, rec: '24E:R16 25-2:QF 26E:LS', form: '4-2-3-1' },
  { id: 'sharjah', name: 'シャルジャ', short: 'シャルジャ', en: 'Sharjah', cc: 'UAE', c1: '#C8102E', c2: '#F2F2F2', st: 'シャルジャ・スタジアム', cap: 18000, op: 77.5, os: 'e', pres: 3.0, t: { acl2: 1 }, rec: '23E:GS 24-2:W 25E:LS' },
  { id: 'alwahda', name: 'アル・ワフダ', short: 'ワフダ', en: 'Al Wahda', cc: 'UAE', c1: '#7B1E3A', c2: '#F2F2F2', st: 'アル・ナヒヤーン・スタジアム', cap: 12000, op: 78.0, os: 'e', pres: 2.8, t: {}, rec: '25E:R16 26-2:GS' },
  { id: 'aljazira', name: 'アル・ジャジーラ', short: 'ジャジーラ', en: 'Al Jazira', cc: 'UAE', c1: '#E1001A', c2: '#111111', st: 'モハメド・ビン・ザイード・スタジアム', cap: 42056, op: 77.0, os: 'e', pres: 2.5, t: {}, rec: '26E:PS 26-2:GS' },
  // ---- West: Qatar ----
  { id: 'alsadd', name: 'アル・サッド', short: 'サッド', en: 'Al Sadd', cc: 'QAT', c1: '#F2F2F2', c2: '#111111', st: 'ジャシム・ビン・ハマド・スタジアム', cap: 15000, op: 78.5, os: 'e', pres: 4.5, t: { acl: 2 }, rec: '23E:GS 24E:QF 25E:QF 26E:LS', form: '4-3-3' },
  { id: 'alduhail', name: 'アル・ドゥハイル', short: 'ドゥハイル', en: 'Al-Duhail', cc: 'QAT', c1: '#9D1C2E', c2: '#F2F2F2', st: 'アブドゥッラー・ビン・ハリファ・スタジアム', cap: 10000, op: 77.5, os: 'e', pres: 3.0, t: {}, rec: '23E:GS 25E:R16' },
  { id: 'alrayyan', name: 'アル・ラーヤン', short: 'ラーヤン', en: 'Al-Rayyan', cc: 'QAT', c1: '#C8102E', c2: '#111111', st: 'アハマド・ビン・アリ・スタジアム', cap: 45032, op: 76.5, os: 'e', pres: 3.0, t: {}, rec: '24E:R16 26-2:GS' },
  { id: 'algharafa', name: 'アル・ガラファ', short: 'ガラファ', en: 'Al-Gharafa', cc: 'QAT', c1: '#FFD200', c2: '#1D4FA0', st: 'サーニ・ビン・ジャシム・スタジアム', cap: 21175, op: 77.0, os: 'e', pres: 3.0, t: { lg: 7 }, rec: '24E:LS 25E:LS 26E:LS', form: '4-2-3-1' },
  { id: 'alshamal', name: 'アル・シャマル', short: 'シャマル', en: 'Al-Shamal', cc: 'QAT', c1: '#1D4FA0', c2: '#F2F2F2', st: 'アル・シャマル・スタジアム', cap: 5300, op: 75.0, os: 'e', pres: 1.5, t: {}, rec: '26E:LS', form: '4-2-3-1' },
  { id: 'alwakrah', name: 'アル・ワクラ', short: 'ワクラ', en: 'Al-Wakrah', cc: 'QAT', c1: '#1D4FA0', c2: '#F2F2F2', st: 'アル・ジャヌーブ・スタジアム', cap: 40000, op: 74.0, os: 'e', pres: 2.0, t: {}, rec: '23E:PS 24-2:R16' },
  { id: 'alahliqa', name: 'アル・アハリ（カタール）', short: 'アハリ（QAT）', en: 'Al-Ahli Doha', cc: 'QAT', c1: '#C8102E', c2: '#F2F2F2', st: 'ハマド・ビン・ハリファ・スタジアム', cap: 12000, op: 72.5, os: 'e', pres: 2.0, t: {}, rec: '25-2:SF' },
  // ---- West: Iran ----
  { id: 'esteghlal', name: 'エステグラル', short: 'エステグラル', en: 'Esteghlal', cc: 'IRN', c1: '#1E4FA0', c2: '#F2F2F2', st: 'アザディ・スタジアム', cap: 78116, op: 78.0, os: 'e', pres: 4.5, t: { acl: 2 }, rec: '24E:R16 25-2:R16 26E:LS', form: '4-2-3-1' },
  { id: 'persepolis', name: 'ペルセポリス', short: 'ペルセポリス', en: 'Persepolis', cc: 'IRN', c1: '#E1001A', c2: '#F2F2F2', st: 'アザディ・スタジアム', cap: 78116, op: 77.5, os: 'e', pres: 4.0, t: {}, rec: '23E:GS 24E:LS' },
  { id: 'tractor', name: 'トラクター', short: 'トラクター', en: 'Tractor', cc: 'IRN', c1: '#C8102E', c2: '#F2F2F2', st: 'ヤドガレ・エマーム・スタジアム', cap: 66833, op: 78.0, os: 'e', pres: 2.8, t: { lg: 1 }, rec: '23E:PS 24-2:QF 25E:R16 26E:LS', form: '4-2-3-1' },
  { id: 'sepahan', name: 'セパハン', short: 'セパハン', en: 'Sepahan', cc: 'IRN', c1: '#FFD200', c2: '#1D2D5A', st: 'ナグシェ・ジャハーン・スタジアム', cap: 75000, op: 77.5, os: 'e', pres: 3.5, t: {}, rec: '23E:R16 24E:PS 24-2:GS 25-2:R16' },
  { id: 'nassaji', name: 'ナッサジ・マーザンダラーン', short: 'ナッサジ', en: 'Nassaji Mazandaran', cc: 'IRN', c1: '#C8102E', c2: '#F2F2F2', st: 'ヴァタニ・スタジアム', cap: 15000, op: 73.0, os: 'e', pres: 1.5, t: {}, rec: '23E:GS' },
  { id: 'golgohar', name: 'ゴル・ゴハル', short: 'ゴル・ゴハル', en: 'Gol Gohar Sirjan', cc: 'IRN', c1: '#C8102E', c2: '#111111', st: 'イマーム・アリ・スタジアム', cap: 8000, op: 74.0, os: 'e', pres: 1.5, t: {}, rec: '26-2:GS' },
  // ---- West: Uzbekistan / Iraq / Jordan ----
  { id: 'pakhtakor', name: 'パフタコール', short: 'パフタコール', en: 'Pakhtakor', cc: 'UZB', c1: '#007A33', c2: '#F2F2F2', st: 'パフタコール中央スタジアム', cap: 35000, op: 74.5, os: 'e', pres: 3.0, t: { lg: 16 }, rec: '23E:GS 24E:R16 26E:LS', form: '4-2-3-1' },
  { id: 'nasaf', name: 'ナサフ', short: 'ナサフ', en: 'Nasaf', cc: 'UZB', c1: '#1D4FA0', c2: '#F2F2F2', st: 'カルシ中央スタジアム', cap: 21000, op: 73.5, os: 'e', pres: 2.5, t: { acl2: 1 }, rec: '23E:R16 24-2:GS 25E:LS 26-2:GS' },
  { id: 'neftchi', name: 'ネフチ・フェルガナ', short: 'ネフチ', en: 'Neftchi Fergana', cc: 'UZB', c1: '#F2F2F2', c2: '#1D4FA0', st: 'イスティクロル・スタジアム', cap: 20000, op: 73.0, os: 'e', pres: 2.5, t: { lg: 6 }, rec: '26E:LS', form: '4-2-3-1' },
  { id: 'agmk', name: 'AGMK', short: 'AGMK', en: 'AGMK', cc: 'UZB', c1: '#E1001A', c2: '#F2F2F2', st: 'AGMKスタジアム', cap: 12000, op: 70.0, os: 'e', pres: 1.5, t: {}, rec: '23E:GS' },
  { id: 'navbahor', name: 'ナヴバホル', short: 'ナヴバホル', en: 'Navbahor', cc: 'UZB', c1: '#1E8F3E', c2: '#F2F2F2', st: 'ナマンガン中央スタジアム', cap: 22000, op: 71.5, os: 'e', pres: 1.8, t: {}, rec: '23E:R16' },
  { id: 'andijon', name: 'アンディジャン', short: 'アンディジャン', en: 'Andijon', cc: 'UZB', c1: '#C8102E', c2: '#F2F2F2', st: 'ソグロム・アヴロド・スタジアム', cap: 18000, op: 68.5, os: 'e', pres: 1.5, t: {}, rec: '25-2:GS' },
  { id: 'alquwa', name: 'アル・クワ・アル・ジャウウィヤ', short: 'アル・クワ', en: 'Al-Quwa Al-Jawiya', cc: 'IRQ', c1: '#1D6FB8', c2: '#F2F2F2', st: 'アル・マディーナ・スタジアム', cap: 32000, op: 72.5, os: 'e', pres: 3.0, t: { acl2: 3, lg: 8 }, rec: '23E:GS 24-2:GS 26E:LS', form: '4-2-3-1' },
  { id: 'alshorta', name: 'アル・ショルタ', short: 'ショルタ', en: 'Al-Shorta', cc: 'IRQ', c1: '#00843D', c2: '#F2F2F2', st: 'アル・シャアブ・スタジアム', cap: 35700, op: 72.5, os: 'e', pres: 2.8, t: {}, rec: '24E:LS 25E:LS 26-2:GS' },
  { id: 'alzawraa', name: 'アル・ザウラー', short: 'ザウラー', en: 'Al-Zawraa', cc: 'IRQ', c1: '#F2F2F2', c2: '#1D4FA0', st: 'アル・ザウラー・スタジアム', cap: 15443, op: 70.5, os: 'e', pres: 2.5, t: {}, rec: '23-2:GS 25-2:R16' },
  { id: 'alkahrabaa', name: 'アル・カフラバー', short: 'カフラバー', en: 'Al-Kahrabaa', cc: 'IRQ', c1: '#1D4FA0', c2: '#F2C400', st: 'アル・カフラバー・スタジアム', cap: 5000, op: 66.5, os: 'e', pres: 1.3, t: {}, rec: '23-2:R16' },
  { id: 'alfaisaly', name: 'アル・ファイサリー', short: 'ファイサリー', en: 'Al-Faisaly', cc: 'JOR', c1: '#1E4FA0', c2: '#F2F2F2', st: 'アンマン国際スタジアム', cap: 17619, op: 68.5, os: 'e', pres: 2.8, t: { acl2: 2 }, rec: '23E:GS 26-2:GS' },
  { id: 'alhussein', name: 'アル・フセイン', short: 'フセイン', en: 'Al-Hussein', cc: 'JOR', c1: '#F2C400', c2: '#1D4FA0', st: 'アル・ハッサン・スタジアム', cap: 12000, op: 70.0, os: 'e', pres: 1.5, t: {}, rec: '24-2:R16 25-2:QF 26E:PS 26-2:GS' },
  { id: 'alwehdat', name: 'アル・ウェフダト', short: 'ウェフダト', en: 'Al-Wehdat', cc: 'JOR', c1: '#1E8F3E', c2: '#C8102E', st: 'キング・アブドゥッラー2世スタジアム', cap: 13265, op: 69.5, os: 'e', pres: 2.0, t: {}, rec: '23-2:GS 24-2:R16 25-2:GS' },
  // ---- West: Gulf / Central Asia / South Asia / others ----
  { id: 'alkhaldiya', name: 'アル・ハーリディーヤ', short: 'ハーリディーヤ', en: 'Al-Khaldiya', cc: 'BHR', c1: '#1D4FA0', c2: '#F2F2F2', st: 'バーレーン国立競技場', cap: 24000, op: 66.0, os: 'e', pres: 1.3, t: {}, rec: '24-2:R16 25-2:GS 26-2:GS' },
  { id: 'almuharraq', name: 'アル・ムハラク', short: 'ムハラク', en: 'Al-Muharraq', cc: 'BHR', c1: '#C8102E', c2: '#F2F2F2', st: 'アル・ムハラク・スタジアム', cap: 10000, op: 65.5, os: 'e', pres: 2.3, t: { acl2: 2 }, rec: '25-2:GS 26-2:GS' },
  { id: 'alriffa', name: 'アル・リファー', short: 'リファー', en: 'Al-Riffa', cc: 'BHR', c1: '#1D4FA0', c2: '#F2F2F2', st: 'バーレーン国立競技場', cap: 24000, op: 65.5, os: 'e', pres: 1.5, t: {}, rec: '23-2:R16' },
  { id: 'alseeb', name: 'アル・シーブ', short: 'シーブ', en: 'Al-Seeb', cc: 'OMA', c1: '#C8102E', c2: '#F2F2F2', st: 'アル・シーブ・スタジアム', cap: 14000, op: 64.5, os: 'e', pres: 1.8, t: { acl2: 1 }, rec: '26-2:GS' },
  { id: 'alnahda', name: 'アル・ナフダ', short: 'ナフダ', en: 'Al-Nahda', cc: 'OMA', c1: '#1E8F3E', c2: '#F2F2F2', st: 'アル・ブライミ・スポーツコンプレックス', cap: 8000, op: 63.5, os: 'e', pres: 1.3, t: {}, rec: '23-2:QF 26-2:GS' },
  { id: 'alkuwait', name: 'アル・クウェート', short: 'クウェート', en: 'Al-Kuwait', cc: 'KUW', c1: '#F2F2F2', c2: '#C8102E', st: 'アル・クウェート・スタジアム', cap: 18000, op: 66.0, os: 'e', pres: 2.5, t: { acl2: 3 }, rec: '23-2:GS 24-2:GS 26-2:GS' },
  { id: 'alarabi', name: 'アル・アラビ', short: 'アラビ', en: 'Al-Arabi', cc: 'KUW', c1: '#1E8F3E', c2: '#F2F2F2', st: 'サバハ・アル・サーレム・スタジアム', cap: 22000, op: 65.0, os: 'e', pres: 1.5, t: {}, rec: '23-2:GS' },
  { id: 'arkadag', name: 'アルカダグ', short: 'アルカダグ', en: 'Arkadag', cc: 'TKM', c1: '#1E8F3E', c2: '#F2F2F2', st: 'アルカダグ・スタジアム', cap: 10000, op: 66.0, os: 'e', pres: 1.3, t: {}, rec: '25-2:R16 26-2:GS' },
  { id: 'ahal', name: 'アハル', short: 'アハル', en: 'Ahal', cc: 'TKM', c1: '#F2C400', c2: '#1E8F3E', st: 'アシガバート・スタジアム', cap: 20000, op: 63.5, os: 'e', pres: 1.2, t: {}, rec: '23E:GS 25-2:GS' },
  { id: 'altynasyr', name: 'アルティン・アスィル', short: 'アルティン', en: 'Altyn Asyr', cc: 'TKM', c1: '#F2C400', c2: '#1D4FA0', st: 'アシガバート・スタジアム', cap: 20000, op: 62.0, os: 'e', pres: 1.3, t: {}, rec: '23-2:GS 24-2:GS' },
  { id: 'merw', name: 'メルウ', short: 'メルウ', en: 'Merw Mary', cc: 'TKM', c1: '#C8102E', c2: '#F2F2F2', st: 'マル・スタジアム', cap: 10000, op: 58.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'istiklol', name: 'イスティクロル', short: 'イスティクロル', en: 'Istiklol', cc: 'TJK', c1: '#F2C400', c2: '#111111', st: 'ドゥシャンベ中央共和国スタジアム', cap: 20000, op: 64.5, os: 'e', pres: 1.5, t: {}, rec: '23E:GS 24-2:GS 25-2:GS' },
  { id: 'ravshan', name: 'ラフシャン', short: 'ラフシャン', en: 'Ravshan Kulob', cc: 'TJK', c1: '#F28C00', c2: '#F2F2F2', st: 'クリャーブ中央スタジアム', cap: 20000, op: 61.0, os: 'e', pres: 1.2, t: {}, rec: '23-2:GS 24-2:GS' },
  { id: 'abdyshata', name: 'アブディシ・アタ', short: 'アブディシ・アタ', en: 'Abdysh-Ata Kant', cc: 'KGZ', c1: '#1D4FA0', c2: '#F2F2F2', st: 'アブディシ・アタ・スポーツコンプレックス', cap: 3000, op: 60.0, os: 'e', pres: 1.2, t: {}, rec: '23-2:SF' },
  { id: 'eastbengal', name: 'イースト・ベンガル', short: 'Eベンガル', en: 'East Bengal', cc: 'IND', c1: '#C8102E', c2: '#F2C400', st: 'ソルトレイク・スタジアム', cap: 68000, op: 63.5, os: 'e', pres: 1.5, t: {}, rec: '26-2:GS' },
  { id: 'mohunbagan', name: 'モフン・バガン', short: 'モフン・バガン', en: 'Mohun Bagan SG', cc: 'IND', c1: '#7B1E3A', c2: '#1E8F3E', st: 'ソルトレイク・スタジアム', cap: 68000, op: 64.5, os: 'e', pres: 1.5, t: {}, rec: '23-2:GS 24-2:GS' },
  { id: 'mumbaicity', name: 'ムンバイ・シティ', short: 'ムンバイ', en: 'Mumbai City', cc: 'IND', c1: '#6CABDD', c2: '#F28C00', st: 'ムンバイ・フットボール・アリーナ', cap: 6600, op: 62.5, os: 'e', pres: 1.3, t: {}, rec: '23E:GS' },
  { id: 'fcgoa', name: 'FCゴア', short: 'ゴア', en: 'FC Goa', cc: 'IND', c1: '#F28C00', c2: '#1D4FA0', st: 'ファトルダ・スタジアム', cap: 19000, op: 62.0, os: 'e', pres: 1.2, t: {}, rec: '25-2:GS' },
  { id: 'odisha', name: 'オディシャFC', short: 'オディシャ', en: 'Odisha FC', cc: 'IND', c1: '#6B2C91', c2: '#F2C400', st: 'カリンガ・スタジアム', cap: 15000, op: 61.5, os: 'e', pres: 1.2, t: {}, rec: '23-2:QF' },
  { id: 'bashundhara', name: 'バシュンダラ・キングス', short: 'バシュンダラ', en: 'Bashundhara Kings', cc: 'BAN', c1: '#F28C00', c2: '#111111', st: 'バシュンダラ・キングス・アリーナ', cap: 8000, op: 58.5, os: 'e', pres: 1.2, t: {}, rec: '23-2:GS' },
  { id: 'maziya', name: 'マジヤ', short: 'マジヤ', en: 'Maziya', cc: 'MDV', c1: '#1E8F3E', c2: '#F2F2F2', st: 'マレ国立サッカースタジアム', cap: 11850, op: 54.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'alahed', name: 'アル・アヘド', short: 'アヘド', en: 'Al-Ahed', cc: 'LBN', c1: '#F2C400', c2: '#111111', st: 'アル・アヘド・スタジアム', cap: 2000, op: 61.5, os: 'e', pres: 1.8, t: { acl2: 1 }, rec: '23-2:F' },
  { id: 'nejmeh', name: 'ネジメ', short: 'ネジメ', en: 'Nejmeh', cc: 'LBN', c1: '#C8102E', c2: '#F2F2F2', st: 'ラフィク・ハリリ・スタジアム', cap: 22500, op: 60.0, os: 'e', pres: 1.3, t: {}, rec: '23-2:GS' },
  { id: 'alfotuwa', name: 'アル・フトゥーワ', short: 'フトゥーワ', en: 'Al-Fotuwa', cc: 'SYR', c1: '#C8102E', c2: '#F2F2F2', st: 'ハマ市スタジアム', cap: 15000, op: 57.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
  { id: 'alittihadsy', name: 'アル・イテハド（シリア）', short: 'イテハド（SYR）', en: 'Al-Ittihad Aleppo', cc: 'SYR', c1: '#C8102E', c2: '#F2F2F2', st: 'アレッポ国際スタジアム', cap: 53200, op: 57.0, os: 'e', pres: 1.5, t: { acl2: 1 }, rec: '23-2:GS' },
  { id: 'jabal', name: 'ジャバル・アル・ムカベル', short: 'ジャバル', en: 'Jabal Al-Mukaber', cc: 'PLE', c1: '#1E8F3E', c2: '#F2F2F2', st: 'ファイサル・アル・フセイニ国際スタジアム', cap: 12500, op: 55.0, os: 'e', pres: 1.0, t: {}, rec: '23-2:GS' },
];

// Japanese clubs' AFC record 2023/24〜2026/27 (for their pages; the engine adds what happens in the game)
const JREC = {
  yokohamafm: '23E:F 24E:QF', kofu: '23E:R16', kawasakif: '23E:R16 24E:F', urawa: '23E:GS', kobe: '24E:R16 25E:SF 26E:LS',
  hiroshima: '24-2:QF 25E:R16', machida: '25E:F 26-2:GS', gosaka: '25-2:W 26E:LS', kashima: '26E:LS', kashiwa: '26E:LS', kyoto: '26E:LS',
};

// 2026/27 as it was drawn (the game starts on 2026-08-07, so everything after that is played in the game)
const S2026 = {
  // ACLE preliminary stage (one match, 2026-08-11): [home, away]; the winners take the second club's place in the draw
  // below if the game's result differs (the real winners were 'G大阪, CAハノイ, イテハド, パフタコール')
  ps: { date: '2026-08-11', E: [['gangwon', 'gosaka'], ['adelaide', 'cahn']], W: [['aljazira', 'alittihad'], ['pakhtakor', 'alhussein']], real: ['gosaka', 'cahn', 'alittihad', 'pakhtakor'] },
  // league stage (draw 2026-08-18): every club's eight games in matchday order, '+' = at home, '-' = away
  acle: {
    E: {
      buriram: '-jdt +guoan -gosaka +kashima -shanghaiport +kyoto -kashiwa +kobe',
      daejeon: '+kyoto -shanghaiport +kobe -kashiwa +guoan -jdt +kashima -gosaka',
      portfc: '+kobe -kashiwa -jdt +guoan -gosaka +kashima -shanghaiport +kyoto',
      cahn: '-gosaka +kashima -shanghaiport +kyoto +kobe -kashiwa +guoan -jdt',
      kashima: '+newcastlejets -cahn +pohang -buriram +jeonbuk -portfc -daejeon +ratchaburi',
      kobe: '-portfc +jeonbuk -daejeon +ratchaburi -cahn +newcastlejets +pohang -buriram',
      guoan: '+pohang -buriram +jeonbuk -portfc -daejeon +ratchaburi -cahn +newcastlejets',
      kyoto: '-daejeon +ratchaburi +newcastlejets -cahn +pohang -buriram +jeonbuk -portfc',
      jeonbuk: '+kashiwa -kobe -guoan +jdt -kashima +gosaka -kyoto +shanghaiport',
      newcastlejets: '-kashima +gosaka -kyoto +shanghaiport +kashiwa -kobe +jdt -guoan',
      pohang: '-guoan +jdt -kashima +gosaka -kyoto +shanghaiport -kobe +kashiwa',
      ratchaburi: '+shanghaiport -kyoto +kashiwa -kobe +jdt -guoan +gosaka -kashima',
      shanghaiport: '-ratchaburi +daejeon +cahn -newcastlejets +buriram -pohang +portfc -jeonbuk',
      jdt: '+buriram -pohang +portfc -jeonbuk -ratchaburi +daejeon -newcastlejets +cahn',
      kashiwa: '-jeonbuk +portfc -ratchaburi +daejeon -newcastlejets +cahn +buriram -pohang',
      gosaka: '+cahn -newcastlejets +buriram -pohang +portfc -jeonbuk -ratchaburi +daejeon',
    },
    W: {
      alain: '+alnassr -alquwa +tractor -alittihad +esteghlal -alhilal +alqadsiah -alahli',
      shababahli: '+tractor -alittihad +esteghlal -alhilal +alqadsiah -alahli -alquwa +alnassr',
      algharafa: '-alhilal +esteghlal -alahli +alqadsiah -alquwa +alnassr -alittihad +tractor',
      pakhtakor: '-alahli +alqadsiah -alquwa +alnassr -alittihad +tractor +esteghlal -alhilal',
      esteghlal: '+alsadd -algharafa -shababahli +alshamal -alain +neftchi -pakhtakor +alwasl',
      alnassr: '-alain +neftchi +alwasl -pakhtakor +alsadd -algharafa +alshamal -shababahli',
      tractor: '-shababahli +alshamal -alain +neftchi +alwasl -pakhtakor +alsadd -algharafa',
      alqadsiah: '+alwasl -pakhtakor +alsadd -algharafa -shababahli +alshamal -alain +neftchi',
      alsadd: '-esteghlal +alhilal -alqadsiah +alahli -alnassr +alquwa -tractor +alittihad',
      neftchi: '+alquwa -alnassr +alittihad -tractor +alhilal -esteghlal +alahli -alqadsiah',
      alwasl: '-alqadsiah +alahli -alnassr +alquwa -tractor +alittihad +alhilal -esteghlal',
      alshamal: '+alittihad -tractor +alhilal -esteghlal +alahli -alqadsiah -alnassr +alquwa',
      alahli: '+pakhtakor -alwasl +algharafa -alsadd -alshamal +shababahli -neftchi +alain',
      alquwa: '-neftchi +alain +pakhtakor -alwasl +algharafa -alsadd +shababahli -alshamal',
      alhilal: '+algharafa -alsadd -alshamal +shababahli -neftchi +alain -alwasl +pakhtakor',
      alittihad: '-alshamal +shababahli -neftchi +alain +pakhtakor -alwasl +algharafa -alsadd',
    },
  },
  // matchday dates by region [first day, second day]; Japanese clubs play on their own dates (jdate)
  md: { E: [['2026-09-15', '2026-09-16'], ['2026-10-13', '2026-10-14'], ['2026-10-27', '2026-10-28'], ['2026-11-03', '2026-11-04'], ['2026-11-24', '2026-11-25'], ['2026-12-01', '2026-12-02'], ['2027-02-09', '2027-02-10'], ['2027-02-16', '2027-02-17']],
        W: [['2026-09-14', '2026-09-15'], ['2026-10-12', '2026-10-13'], ['2026-10-26', '2026-10-27'], ['2026-11-02', '2026-11-03'], ['2026-11-23', '2026-11-24'], ['2026-12-07', '2026-12-08'], ['2027-02-08', '2027-02-09'], ['2027-02-15', '2027-02-16']] },
  jdate: {
    kashima: ['2026-09-15', '2026-10-13', '2026-10-28', '2026-11-04', '2026-11-25', '2026-12-02', '2027-02-09', '2027-02-16'],
    kobe: ['2026-09-16', '2026-10-14', '2026-10-27', '2026-11-03', '2026-11-24', '2026-12-01', '2027-02-10', '2027-02-16'],
    kashiwa: ['2026-09-16', '2026-10-14', '2026-10-27', '2026-11-03', '2026-11-24', '2026-12-01', '2027-02-10', '2027-02-16'],
    kyoto: ['2026-09-15', '2026-10-13', '2026-10-27', '2026-11-03', '2026-11-24', '2026-12-01', '2027-02-09', '2027-02-16'],
    gosaka: ['2026-09-15', '2026-10-13', '2026-10-28', '2026-11-04', '2026-11-25', '2026-12-02', '2027-02-09', '2027-02-16'],
  },
  // knockouts: R16 two legs within the region (1 v 8, 2 v 7, 3 v 6, 4 v 5; the higher club at home in the second leg),
  // the finals in Jeddah (one match each; quarter-finals East v West)
  r16: { E: ['2027-03-09', '2027-03-16'], W: ['2027-03-08', '2027-03-15'] },
  fin: { qf: ['2027-04-23', '2027-04-24'], sf: ['2027-04-27', '2027-04-28'], f: '2027-05-01' },
  // ACL2: groups (draw 2026-08-18; A〜D West, E〜H East); each group's six matchdays in order [home, away]
  acl2: {
    groups: { A: ['alwahda', 'nasaf', 'alkhaldiya', 'alkuwait'], B: ['arkadag', 'aljazira', 'golgohar', 'almuharraq'], C: ['alrayyan', 'altaawoun', 'alnahda', 'alfaisaly'],
      D: ['alshorta', 'eastbengal', 'alhussein', 'alseeb'], E: ['persib', 'melbvictory', 'viettel', 'fcseoul'], F: ['adelaide', 'bgpathum', 'lioncity', 'taipo'],
      G: ['machida', 'shenhua', 'tampines', 'svayrieng'], H: ['phnompenh', 'gangwon', 'kitchee', 'kuching'] },
    // the order inside each group above is the draw position 1〜4; matchdays [home, away]: 1v4 2v3 / 3v1 4v2 / 2v1 4v3 /
    // 1v2 3v4 / 4v1 3v2 / 1v3 2v4 (町田's real schedule: 9/17 H スヴァイリエン, 10/15 A タンピネス, 10/29 A 申花, 11/5 H 申花,
    // 11/26 A スヴァイリエン, 12/3 H タンピネス; the matchday-1 results of the other groups fit the same order)
    order: [[0, 3], [1, 2], [2, 0], [3, 1], [1, 0], [3, 2], [0, 1], [2, 3], [3, 0], [2, 1], [0, 2], [1, 3]],
    md: { E: ['2026-09-16', '2026-10-14', '2026-10-28', '2026-11-04', '2026-11-25', '2026-12-02'], W: ['2026-09-15', '2026-10-13', '2026-10-27', '2026-11-03', '2026-11-24', '2026-12-08'] },
    jdate: { machida: ['2026-09-17', '2026-10-15', '2026-10-29', '2026-11-05', '2026-11-26', '2026-12-03'] },
    r16: { E: ['2027-02-10', '2027-02-17'], W: ['2027-02-09', '2027-02-16'] },
    qf: { E: ['2027-03-10', '2027-03-17'], W: ['2027-03-02', '2027-03-16'] },
    sf: { E: ['2027-04-07', '2027-04-14'], W: ['2027-04-06', '2027-04-13'] },
    f: '2027-05-15', host: 'E',   // the final is at the ground of the club from the region whose turn it is (24/25 East, 25/26 West)
  },
};

// money (万円; $1 = ¥150). ACLE: league stage $800k, R16 $200k, QF $400k, SF $600k, runner-up / winner of the final
// (so that the total is about $6M / $12M); per win / draw estimates. ACL2: $300k, winner $2.5M (about $3.28M in all).
const PRIZE = {
  acle: { part: 12000, win: 1500, draw: 750, r16: 3000, qf: 6000, sf: 9000, runner: 60000, champ: 150000 },
  acl2: { part: 4500, win: 750, draw: 375, r16: 1200, qf: 2400, sf: 3400, runner: 15000, champ: 37500 },
};

// invented players for the clubs of later seasons: names by the country (culture), 'gf' = given family, 'fg' = family given
// (short = the whole name, as Korean / Chinese names are called), 'fmg' = Vietnamese (short = middle + given); s: 'g' = the
// short name is the given name (Thai); al: 1 = the family name takes 「アル・」 half of the time (Arabic)
const NAMES = {
  kor: { o: 'fg', f: 'キム イ パク チェ チョン カン チョ ユン チャン イム ハン オ ソ シン クォン ファン アン ソン ユ ホン ペク ナム ノ ハ ク', g: 'ミンジュン ソジュン ドユン イェジュン シウ ハジュン ジホ ジュウォン ヒョンウ ジュンソ テヒョン ソンミン ドンヒョン ジェウォン ヨンホ サンウ ミンス ジフン ウジン スンホ ジェミン ヒョンジュン テヤン ギュヒョン ドンウク セフン チャンミン ヨンジェ ジヌ ハンギョル' },
  chn: { o: 'fg', f: 'ワン リー チャン リウ チェン ヤン ジャオ ホアン ジョウ ウー シュー スン フー ジュー ガオ リン ホー グオ マー ルオ', g: 'ウェイ レイ ハオ ジエ ユー ポン ハオラン ジーハオ ユーハン ズーハン ボーウェン ティエン シュアイ ヤン ジュン ロン フェイ ミン カイ シン' },
  tha: { o: 'gf', s: 'g', f: 'シースワン ブンマー カンタウォン ウォンサワット スクサワット ポンパニット ラッタナポン チャイヤプーム ケーオマニー シーサワット プロムマー サイチャイ インタラ パンヤーウォン ブンロート', g: 'ソムチャイ ティーラポン スパチャイ ナタポン ウォラウット チャナティップ ティーラシン エカニット ポンサコン キティポン スラチェート アピワット パティパン チャルームサック ウィーラテップ サーラット ピヤポン ジャカパン タナポン' },
  vie: { o: 'fmg', f: 'グエン チャン レ ファム ホアン ブイ ドー ヴー ダン ゴー ドアン ファン', m: 'ヴァン ドゥック タイン クアン ホアン ミン ティエン ゴック', g: 'ハイ フン トアン ダット ロン ハウ フオン ティン ヴィン クオン ズン タイ ナム タン' },
  may: { o: 'gf', f: 'アズミ イスマイル ハッサン ラザク アハマド ユソフ オスマン ハミド サレー ラヒム サプトラ ヌグロホ プラセティヨ ハキム マウラナ', g: 'アフィク シャフミ ファイサル ハキミ アリフ ナズミ シャフィク ハリス アズリ ファリス ダニアル イズワン ルスラン アイマン ザリフ リズキー ファジャル エギー ヘンドラ イルファン' },
  phi: { o: 'gf', f: 'サントス レイエス クルス バウティスタ オカンポ ガルシア メンドーサ トーレス ビジャヌエバ ラモス', g: 'ジョン マーク ミゲル ホセ カルロ パオロ ジェームズ ライアン ケビン マイケル' },
  cam: { o: 'gf', f: 'ソク チャン ケオ リム ヘン ソム ペン チア', g: 'ソファル ヴィチェット ダラ ピセット ソバン ラタナ ボレイ ヴァンナ' },
  mya: { o: 'gf', f: 'アウン ミン ゾー トゥン チョー ラ', g: 'ナイン ウィン テイ ルウィン ミャット ソー' },
  mng: { o: 'gf', f: 'バトバヤル ガンバータル エルデネ ツェレン ドルジ', g: 'ナランバートル テムーレン ボルド ガンゾリグ ムンフバト' },
  eng: { o: 'gf', f: 'スミス ジョーンズ ウィリアムズ ブラウン ウィルソン テイラー ジョンソン ホワイト マーティン アンダーソン トンプソン トーマス ウォーカー ハリス クラーク', g: 'ジャック ライリー ネイサン ジョシュ ルーク ディラン ミッチェル ジェームズ ダニエル トーマス ライアン キャメロン マシュー サム ベン' },
  ara: { o: 'gf', al: 1, f: 'ダウサリ ハルビ オタイビ カハタニ シャハラニ ガムディ ザハラニ ムタイリ アンジ マルキ ハジリ アムリ シャムシ ハマディ カアビ マズルーイ ブライディ ラワヒ ハシミ ジュブーリ サアディ ナイミ クワリ', g: 'モハメド アブドゥッラー アハメド ハリド サレム ファハド スルタン ナセル アリ オマル ユセフ イブラヒム ハマド サウード ファイサル ワリード マジェド ムサブ ラカン ハッサン トゥルキ バンダル ナワフ' },
  per: { o: 'gf', f: 'アフマディ ホセイニ モハンマディ カリミ レザエイ ラヒミ ジャファリ サデギ ヘイダリ ナザリ ゴラミ モラディ', g: 'アリ メフディ モハンマド レザ ホセイン アミル サイード ミラド アフマド ハミド モルテザ アボルファズル' },
  cas: { o: 'gf', f: 'ユスポフ ラヒモフ トゥルスノフ アフメドフ カリモフ ナザロフ イスマイロフ ハミドフ ショムロドフ エルガシェフ', g: 'ジャスル オタベク ドストン シェルゾド ジャムシド アジズ ファルフ ルスタム エルドル サルドル ボブル イスロム' },
  ind: { o: 'gf', f: 'シン クマール ボース チェトリ タパ ナイク ジング デイ ゴーシュ パラブ', g: 'ラフル サンデシュ アニルド スニル アシク リスティン ブランドン マンヴィル アカシュ ジークソン' },
  slav: { o: 'gf', f: 'ヨヴァノヴィッチ ペトロヴィッチ ニコリッチ マルコヴィッチ イリッチ パヴロヴィッチ コヴァチ ペリシッチ', g: 'ニコラ マルコ ステファン ルカ ミロシュ ネマニャ イヴァン フィリップ' },
  afr: { o: 'gf', f: 'ディアロ トラオレ ケイタ カマラ オコンクォ メンサー バンバ シセ', g: 'イブラヒマ ムサ ウスマン ママドゥ サムエル エマニュエル ユスフ アブドゥライ' },
};
// which names a country's players get (Brazil, Portugal, Spain and the rest of Latin America: the game's own foreign names)
const CULTURE = { KOR: 'kor', CHN: 'chn', HKG: 'chn', MAC: 'chn', TPE: 'chn', THA: 'tha', VIE: 'vie', MAS: 'may', SIN: 'may', IDN: 'may', PHI: 'phi', CAM: 'cam', MYA: 'mya', MNG: 'mng',
  AUS: 'eng', KSA: 'ara', UAE: 'ara', QAT: 'ara', KUW: 'ara', BHR: 'ara', OMA: 'ara', IRQ: 'ara', JOR: 'ara', SYR: 'ara', LBN: 'ara', PLE: 'ara', IRN: 'per',
  UZB: 'cas', TKM: 'cas', TJK: 'cas', KGZ: 'cas', IND: 'ind', BAN: 'ind', MDV: 'ind', SRB: 'slav', CRO: 'slav', NGA: 'afr', SEN: 'afr', GHA: 'afr', MAR: 'afr', FRA: 'afr', NED: 'eng' };
// imports per club by country (a rough picture of each league's foreign-player rules and habits) and where they come from
const IMPORTS = { KSA: 10, UAE: 7, QAT: 7, IRN: 3, UZB: 4, IRQ: 5, JOR: 4, BHR: 4, OMA: 3, KUW: 4, TKM: 1, TJK: 2, KGZ: 2, IND: 5, BAN: 4, MDV: 3, LBN: 4, SYR: 2, PLE: 2,
  KOR: 5, CHN: 5, THA: 6, AUS: 5, MAS: 9, VIE: 4, SIN: 6, IDN: 6, HKG: 7, PHI: 5, CAM: 5, MYA: 4, TPE: 4, MNG: 4, MAC: 3 };
const IMPORT_NAT = [['BRA', 9], ['ESP', 2], ['POR', 2], ['ARG', 1.5], ['COL', 1], ['SRB', 1.5], ['CRO', 1], ['NGA', 1.5], ['SEN', 1], ['GHA', 1], ['MAR', 1], ['FRA', 1.5], ['NED', 0.8], ['JPN', 1], ['KOR', 0.8], ['AUS', 0.8], ['URU', 0.8]];

module.exports = { ASSOC, SLOTS, CLUBS, JREC, S2026, PRIZE, NAMES, CULTURE, IMPORTS, IMPORT_NAT };
