"""Download generated images, convert to webp (1600px wide) into public/img.
Optional per-image ops: flip (horizontal mirror), key (magenta chroma key → transparent PNG-in-webp)."""
import json, sys, io, time, urllib.request
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'tools' / 'raw'
OUT = ROOT / 'public' / 'img'
RAW.mkdir(exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)

OPS = {
    'arenaback': ['flip'],
}

def key_magenta(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    # pink/magenta backdrop: both red and blue clearly above green
    rn = (r - g) / np.maximum(r, 1)
    bn = (b - g) / np.maximum(b, 1)
    mag = np.clip(np.minimum((rn - 0.18) / 0.12, (bn - 0.06) / 0.1), 0, 1)
    mag = mag * np.clip((r - 45) / 30.0, 0, 1)
    alpha = (1 - mag) * 255
    rgba = np.dstack([a.astype(np.uint8), alpha.astype(np.uint8)])
    out = Image.fromarray(rgba, 'RGBA')
    # despill: pull magenta tint from edges
    arr = np.asarray(out).astype(np.int16)
    spill = np.clip(np.minimum(arr[..., 0], arr[..., 2]) - arr[..., 1], 0, 255)
    arr[..., 0] -= (spill * 0.6).astype(np.int16)
    arr[..., 2] -= (spill * 0.6).astype(np.int16)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    out = Image.fromarray(arr, 'RGBA')
    bbox = out.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    return out.crop(bbox) if bbox else out

def main(only=None):
    data = json.loads((ROOT / 'tools' / 'images.json').read_text(encoding='utf-8'))
    for name, url in data.items():
        if only and name not in only:
            continue
        raw = RAW / f'{name}.png'
        if not raw.exists():
            for attempt in range(5):
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=60) as r:
                        raw.write_bytes(r.read())
                    break
                except Exception as e:  # transient TLS/connection resets happen
                    print('retry', name, attempt + 1, e)
                    time.sleep(2 + attempt * 2)
            else:
                raise SystemExit(f'download failed: {name}')
        img = Image.open(raw)
        ops = OPS.get(name, [])
        if name.startswith('stand_') or name.startswith('prop_'):
            ops = ops + ['key']
        if 'flip' in ops:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if 'key' in ops:
            img = key_magenta(img)
            img.thumbnail((700, 1400))
            img.save(OUT / f'{name}.webp', 'WEBP', quality=86)
        else:
            img = img.convert('RGB')
            img.thumbnail((1600, 900))
            img.save(OUT / f'{name}.webp', 'WEBP', quality=82)
        print('ok', name, img.size)

if __name__ == '__main__':
    main(sys.argv[1:] or None)
