# 案A〜C を並べた画像（チャットで見せる用）: out/pick-<案>.png と out/pick-team.png（海外クラブの情報、3案共通）
# usage: python3 compose.py  （shoot.py chalk のあと）
import pathlib
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).resolve().parent; OUT = HERE / 'out'
F = lambda s, w='Bold': ImageFont.truetype(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{w}.ttc', s)
BG, INK, MUT = (22, 52, 40), (242, 239, 228), (169, 188, 175)
SETS = {
  'A': ('案A　大会ごとのタブ（Lカップと同じ作り）', 'カップ戦に「ACLE」「ACL2」のタブを足す。リーグステージの順位表（東・西の切り替え）→ 自クラブの8試合 → ラウンド16〜決勝を縦に並べる',
        [('A-nov-1', 'ACLE（11月・リーグステージ中）'), ('A-nov-2', '順位表の続き（上位8で区切り線）'), ('A-mar-3', '3月・準々決勝の組み合わせ（ジッダ）'), ('A-nov-acl2', 'ACL2 のタブ（組ごとの表）')]),
  'B': ('案B　ACLは1つのタブ＋勝ち上がり表', 'カップ戦に「ACL」1つ。中で ACLE / ACL2 を切り替え（出ている方に●）。自地区の上位8＋自クラブだけの順位表と、横にスクロールするトーナメント表',
        [('B-nov-1', 'ACL（11月・リーグステージ中）'), ('B-nov-2', '勝ち上がり表（まだ空）'), ('B-mar-1', '3月・ラウンド16の結果と準々決勝'), ('B-nov-acl2', 'ACL2（自分の組＋ほかは折りたたみ）')]),
  'C': ('案C　自クラブの「アジアへの道」＋日本勢', 'カップ戦に「ACL」1つ。自クラブの今いる段階（チョークの道のり）・次のACLの試合・日本の6クラブの状況・順位表の自クラブの前後。全体の表はボタンの先',
        [('C-nov-1', 'ACL（11月・リーグステージ中）'), ('C-nov-2', '日本勢と順位表（自分の前後）'), ('C-mar-1', '3月・準々決勝に勝ち残り'), ('C-mar-2', '3月・勝ち上がり')]),
}
def compose(name, title, sub, shots):
  ims = [Image.open(OUT / f'{n}-chalk.png') for n, _ in shots]
  pad, gap, head = 40, 36, 190
  W = pad * 2 + sum(i.width for i in ims) + gap * (len(ims) - 1)
  H = head + 50 + max(i.height for i in ims) + pad
  im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
  d.text((pad, 28), title, font=F(56), fill=INK); d.text((pad, 110), sub, font=F(28, 'Regular'), fill=MUT)
  x = pad
  for img, (_, lb) in zip(ims, shots):
    d.text((x, head), lb, font=F(30, 'Regular'), fill=MUT); im.paste(img, (x, head + 50)); x += img.width + gap
  im.save(OUT / f'pick-{name}.png'); print(name, im.size)
for k, (t, s, sh) in SETS.items(): compose(k, t, s, sh)
compose('team', '海外クラブの情報（3案共通）', '順位表や試合からタップ。国・地区、今季の成績、国内リーグ・アジアのタイトル、2023/24からのアジアの戦績、チーム力の比較、実在の選手（2026/27）',
        [('team-jeonbuk', '全北現代（概要）'), ('team-jeonbuk2', '概要の続き（戦い方）'), ('team-jeonbuk-squad', '選手（実名・2026/27）')])
