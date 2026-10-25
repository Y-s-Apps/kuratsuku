# 並べた画像（チャットで見せる用）: out/pick-1.png・pick-2.png（iPhone 16 黒板）、pick-sheets.png、pick-se-white.png
# usage: python3 compose.py（shoot.py chalk と shoot.py white 375 667 のあと）
import pathlib
from PIL import Image, ImageDraw, ImageFont
HERE = pathlib.Path(__file__).resolve().parent; OUT = HERE / 'out'
F = lambda s, w='Bold': ImageFont.truetype(f'/usr/share/fonts/opentype/noto/NotoSansCJK-{w}.ttc', s)
def sheet(name, title, sub, items, bg=(22, 52, 40), ink=(242, 239, 228), mut=(169, 188, 175)):
    ims = [Image.open(OUT / f) for f, _ in items]
    pad, gap, head = 40, 36, 200 if sub else 120
    W = pad * 2 + sum(i.width for i in ims) + gap * (len(ims) - 1); H = head + 50 + max(i.height for i in ims) + pad
    im = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(im)
    d.text((pad, 26), title, font=F(54), fill=ink)
    if sub: d.text((pad, 108), sub, font=F(28, 'Regular'), fill=mut)
    x = pad
    for i, (_, lb) in zip(ims, items):
        d.text((x, head), lb, font=F(30, 'Regular'), fill=mut); im.paste(i, (x, head + 50)); x += i.width + gap
    im.save(OUT / name); print(name, im.size)
c = 'chalk-393'
sheet('pick-1.png', '案1　地図を下に伸ばす', 'いまの地図の下に「駅の向こう」の枠（施設の枠と同じ形）。スクロールすると続きが見える', [(f'm1-top-{c}.png', 'ホームタウン（開いたとき）'), (f'm1-east-{c}.png', '下にスクロール'), (f'm1-shut-{c}.png', 'まだ開いていないとき（建物 5/7）')])
sheet('pick-2.png', '案2　2枚目の地図', '地図の上の切り替え（または地図の「駅の向こう →」）で、線路の先の新しい街へ。駅前通り・商店街・公園', [(f'm2-top-{c}.png', 'スタジアムのまわり'), (f'm2-east-{c}.png', '駅の向こう'), (f'm2-shut-{c}.png', 'まだ開いていないとき（建物 5/7）')])
sheet('pick-sheets.png', '施設 Lv6〜10 と 新しい建物', 'Lv6〜10 は黄色のメモリと縁。シートに「いま → 次のLv」の効き目。建物は今までと同じシート', [(f'sh-train-{c}.png', '練習場 Lv7'), (f'sh-youth-{c}.png', 'ユース Lv5（Lv6へ）'), (f'sh-museum-{c}.png', 'クラブミュージアム'), (f'sh-shut-{c}.png', '開く前')])
w = 'white-375'
sheet('pick-se-white.png', 'iPhone SE・ホワイトボード', None, [(f'm1-east-{w}.png', '案1'), (f'm2-east-{w}.png', '案2'), (f'sh-train-{w}.png', '練習場 Lv7'), (f'sh-hotel-{w}.png', 'クラブホテル')], bg=(243, 245, 246), ink=(24, 35, 58), mut=(90, 102, 120))
