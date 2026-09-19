"""既存の写真から派生バリエーションを作る（新規生成を使わず、実写ピクセルの上で合成する）。

backyard_open.webp : バックヤードの搬入口シャッターが上がった状態。
  - 開口部の形は手で多角形を引かず、`tools/shutter_mask.py` が元写真から
    ピクセル単位で切り出したシャッター面のマスクを使う。
    手前に立っている機材ケースには1ピクセルも掛からない。
  - 中身は「奥の暗がり＋内側の床＋敷居から差す明かり＋遠くの表示灯」だけを描き起こす。
    別の写真を貼ると必ず「貼った四角」に見えるので使わない。
  - ガイドレール・敷居・接地影も、マスクの輪郭をなぞって引く。
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'img'
MASK = ROOT / 'tools' / 'shutter_mask.png'

base = Image.open(OUT / 'backyard_cable.webp').convert('RGB')
W, H = base.size  # 1600 x 900
if not MASK.exists():
    raise SystemExit('先に python tools/shutter_mask.py を実行してください')
mask = Image.open(MASK).convert('L').resize((W, H))
m = np.asarray(mask) > 127

BACK_Y = 430        # 奥の床と壁の境目
# マスクの下端は shutter_mask.py が床との接地線に合わせてあるので、ここでは触らない
cols = np.where(m.any(axis=0))[0]
X0, X1 = int(cols.min()), int(cols.max())
# 列ごとの開口部の上端・下端（＝輪郭）
top_y = np.full(W, -1)
bot_y = np.full(W, -1)
for x in cols:
    ys = np.where(m[:, x])[0]
    top_y[x], bot_y[x] = ys.min(), ys.max()

# ---------------------------------------------------------------- 開口部の中身
inner = Image.new('RGB', (W, H), (8, 9, 12))
d = ImageDraw.Draw(inner)

# 奥の壁：上ほど暗い
for y in range(0, BACK_Y):
    v = int(6 + 13 * (y / BACK_Y) ** 2)
    d.line([(X0, y), (X1, y)], fill=(v, v + 1, v + 3))

# 内側の床：外のコンクリートの実写を奥へ寝かせて使う（質感が揃う）
fh = 600 - BACK_Y + 8
slab = base.crop((905, 640, 1235, 815)).resize((X1 - X0 + 1, fh), Image.LANCZOS)
slab = ImageEnhance.Brightness(slab).enhance(0.30)
slab = ImageEnhance.Color(slab).enhance(0.45)
slab = ImageEnhance.Contrast(slab).enhance(0.7)
slab = slab.filter(ImageFilter.GaussianBlur(2.2))
inner.paste(slab, (X0, BACK_Y - 4))

# 床は奥ほど暗く沈ませる
fade = Image.new('L', (W, H), 0)
fd = ImageDraw.Draw(fade)
for y in range(BACK_Y - 6, 606):
    t = (y - (BACK_Y - 6)) / (612 - BACK_Y)
    fd.line([(X0, y), (X1, y)], fill=int(235 * (1 - t) ** 1.2))
fade = fade.filter(ImageFilter.GaussianBlur(6))
inner = Image.composite(Image.new('RGB', (W, H), (7, 8, 10)), inner, fade)

# 敷居から差し込む外の明かり（手前の床だけ、ほのかに暖かく）
spill = Image.new('L', (W, H), 0)
sp = ImageDraw.Draw(spill)
sp.polygon([(880, 580), (1130, 580), (1090, BACK_Y + 40), (935, BACK_Y + 40)], fill=70)
spill = spill.filter(ImageFilter.GaussianBlur(34))
inner = Image.composite(Image.new('RGB', (W, H), (150, 126, 92)), inner, spill)

# 奥の低い位置に小さな表示灯（距離感が出る）
lamp = Image.new('RGB', (W, H), (0, 0, 0))
ld = ImageDraw.Draw(lamp)
ld.ellipse([1106, 396, 1130, 416], fill=(22, 82, 45))
lamp = lamp.filter(ImageFilter.GaussianBlur(10))
ImageDraw.Draw(lamp).ellipse([1115, 404, 1121, 410], fill=(88, 200, 134))
inner = ImageChops.add(inner, lamp)

# 写真と同じ粒状感（のっぺりした塗りに見せない）
n = Image.effect_noise((W, H), 14).filter(ImageFilter.GaussianBlur(0.5))
grain = ImageChops.subtract(Image.merge('RGB', (n, n, n)), Image.new('RGB', (W, H), (128, 128, 128)))
inner = ImageChops.add(inner, grain)

# ---------------------------------------------------------------- 合成
soft = mask.filter(ImageFilter.GaussianBlur(1.2))   # 縁を1pxだけなじませる
open_img = Image.composite(inner, base, soft)

# ---------------------------------------------------------------- 敷居
# 縁取りは描かない（描くと輪郭線に見える）。床と接する列にだけ、
# 敷居の金属が光を拾う細い線と、そこから落ちる影を足す。
rail = Image.new('RGBA', (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(rail)
floor_cols = [x for x in cols if bot_y[x] > 520]
for x in floor_cols:
    y = int(bot_y[x])
    rd.line([(x, y - 2), (x, y - 1)], fill=(98, 94, 88, 150), width=1)
open_img = Image.alpha_composite(open_img.convert('RGBA'), rail).convert('RGB')

shadow = Image.new('L', (W, H), 0)
sd = ImageDraw.Draw(shadow)
for x in floor_cols:
    y = int(bot_y[x])
    sd.line([(x, y + 2), (x, y + 22)], fill=105, width=1)
shadow = shadow.filter(ImageFilter.GaussianBlur(9))
open_img = Image.composite(Image.new('RGB', (W, H), (10, 10, 12)), open_img, shadow)

open_img.save(OUT / 'backyard_open.webp', 'WEBP', quality=86)
print('backyard_open ok', open_img.size, 'opening px:', int(m.sum()))
