"""Derived image variants that don't need a new generation:
stock_empty = the storage room after the cable reel has been taken (floor cloned over it)."""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'img'

src = Image.open(OUT / 'stock.webp').convert('RGB')
W, H = src.size  # 1600x900
box = (495, 590, 760, 860)          # the reel
donor = src.crop((215, 590, 480, 860)).transpose(Image.FLIP_LEFT_RIGHT)
donor = donor.filter(ImageFilter.GaussianBlur(1.2))
patch = src.copy()
patch.paste(donor, box)
# feather the seams by blending a blurred copy along the edges
mask = Image.new('L', src.size, 0)
for i, inset in enumerate(range(0, 26, 2)):
    m = Image.new('L', (box[2] - box[0] - inset * 2, box[3] - box[1] - inset * 2), 255)
    mask.paste(m, (box[0] + inset, box[1] + inset))
mask = mask.filter(ImageFilter.GaussianBlur(10))
out = Image.composite(patch, src, mask)
out.save(OUT / 'stock_empty.webp', 'WEBP', quality=82)
print('stock_empty ok', out.size)

# preshow thumbnail: the same lobby corner, graded to look like a daytime phone photo
from PIL import ImageEnhance
fl = Image.open(OUT / 'flowers.webp').convert('RGB')
fl = ImageEnhance.Brightness(fl).enhance(1.75)
fl = ImageEnhance.Color(fl).enhance(1.15)
warm = Image.new('RGB', fl.size, (255, 214, 170))
fl = Image.blend(fl, warm, 0.08)
fl.save(OUT / 'preshow.webp', 'WEBP', quality=82)
print('preshow ok', fl.size)
