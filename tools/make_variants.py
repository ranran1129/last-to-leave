"""既存の写真から派生バリエーションを作る（新規生成を使わず、実写ピクセルの上で合成する）。

backyard_open.webp : バックヤードの搬入口シャッターが上がった状態。
  - 別写真を切り貼りすると必ず「貼った四角」に見えるので、開口部は元写真の上に
    夜の暗がりとして描き起こす（暗さは細部を隠してくれるので、合成が破綻しない）。
  - 開口部の形は元写真のシャッター面をなぞった多角形。手前の機材ケースに
    隠れている範囲には一切かからないようにしてある。
  - 中身は「床の照り返し＋奥の暗がり＋遠くの小さな表示灯」だけ。物体は描かない。
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'img'

base = Image.open(OUT / 'backyard_cable.webp').convert('RGB')
W, H = base.size  # 1600 x 900

# --- 元写真でシャッター面が見えている範囲（手前のケースに隠れる所は避ける） ---
OPENING = [(820, 0), (1345, 0), (1345, 216), (1246, 232), (1246, 574), (828, 572)]
FLOOR_Y = 572       # 敷居（コンクリートとの境目）
BACK_Y = 430        # 奥の床と壁の境目
X0, X1 = 820, 1345

# --- 開口部の中身を描く ---
inner = Image.new('RGB', (W, H), (8, 9, 12))
d = ImageDraw.Draw(inner)

# 奥の壁：上ほど暗い
for y in range(0, BACK_Y):
    t = y / BACK_Y
    v = int(6 + 13 * t ** 2)
    d.line([(X0, y), (X1, y)], fill=(v, v + 1, v + 3))

# 内側の床：外のコンクリートの実写をそのまま奥へ寝かせて使う（質感が揃う）
fh = FLOOR_Y - BACK_Y + 8
# 物が写り込んでいない範囲を選ぶ（ケーブルやキャスターの影が透けると偽物に見える）
slab = base.crop((905, 640, 1235, 815)).resize((X1 - X0, fh), Image.LANCZOS)
slab = ImageEnhance.Brightness(slab).enhance(0.30)
slab = ImageEnhance.Color(slab).enhance(0.45)
slab = ImageEnhance.Contrast(slab).enhance(0.7)
slab = slab.filter(ImageFilter.GaussianBlur(2.2))
inner.paste(slab, (X0, BACK_Y - 4))

# 床は奥ほど暗く沈ませる
fade = Image.new('L', (W, H), 0)
fd = ImageDraw.Draw(fade)
for y in range(BACK_Y - 6, FLOOR_Y + 4):
    t = (y - (BACK_Y - 6)) / (FLOOR_Y + 4 - (BACK_Y - 6))
    fd.line([(X0, y), (X1, y)], fill=int(235 * (1 - t) ** 1.2))
fade = fade.filter(ImageFilter.GaussianBlur(6))
inner = Image.composite(Image.new('RGB', (W, H), (7, 8, 10)), inner, fade)

# 敷居から差し込む外の明かり（手前の床だけ、ほのかに暖かく）
spill = Image.new('L', (W, H), 0)
sp = ImageDraw.Draw(spill)
sp.polygon([(900, FLOOR_Y), (1190, FLOOR_Y), (1120, BACK_Y + 40), (980, BACK_Y + 40)], fill=64)
spill = spill.filter(ImageFilter.GaussianBlur(34))
inner = Image.composite(Image.new('RGB', (W, H), (150, 126, 92)), inner, spill)

# 奥の低い位置に、小さな表示灯がひとつ（距離感が出る）
lamp = Image.new('RGB', (W, H), (0, 0, 0))
ld = ImageDraw.Draw(lamp)
ld.ellipse([1106, 398, 1130, 418], fill=(22, 82, 45))
lamp = lamp.filter(ImageFilter.GaussianBlur(10))
ld = ImageDraw.Draw(lamp)
ld.ellipse([1115, 406, 1121, 412], fill=(88, 200, 134))
inner = ImageChops.add(inner, lamp)

# 写真と同じ粒状感（のっぺりした塗りに見せない）。effect_noise は 128 が中心なので、
# 128 を引いて「明るいほうのゆらぎ」だけを足す
n = Image.effect_noise((W, H), 14).filter(ImageFilter.GaussianBlur(0.5))
grain = ImageChops.subtract(Image.merge('RGB', (n, n, n)), Image.new('RGB', (W, H), (128, 128, 128)))
inner = ImageChops.add(inner, grain)

# 左右のガイドレール側は一段暗く落とす（奥行きが出る）
side = Image.new('L', (W, H), 0)
sd = ImageDraw.Draw(side)
sd.rectangle([X0, 0, X0 + 46, H], fill=180)
sd.rectangle([X1 - 46, 0, X1, H], fill=150)
side = side.filter(ImageFilter.GaussianBlur(26))
inner = Image.composite(Image.new('RGB', (W, H), (3, 4, 6)), inner, side)

# --- 開口部のマスク（内側に少しぼかして、切り抜いた線を出さない） ---
mask = Image.new('L', (W, H), 0)
ImageDraw.Draw(mask).polygon(OPENING, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(3))
open_img = Image.composite(inner, base, mask)

# --- 敷居まわり：床のレール（細い明るい線）と、開口部の下に落ちる接地影 ---
d = ImageDraw.Draw(open_img)
d.line([(830, FLOOR_Y - 2), (1246, FLOOR_Y)], fill=(104, 99, 92), width=3)
d.line([(830, FLOOR_Y + 2), (1246, FLOOR_Y + 4)], fill=(46, 45, 44), width=2)

shadow = Image.new('L', (W, H), 0)
ImageDraw.Draw(shadow).polygon(
    [(828, FLOOR_Y + 2), (1246, FLOOR_Y + 4), (1246, FLOOR_Y + 26), (828, FLOOR_Y + 22)], fill=105)
shadow = shadow.filter(ImageFilter.GaussianBlur(10))
open_img = Image.composite(Image.new('RGB', (W, H), (10, 10, 12)), open_img, shadow)

open_img.save(OUT / 'backyard_open.webp', 'WEBP', quality=86)
print('backyard_open ok', open_img.size)
