"""バックヤード写真から「シャッター面だけ」のマスクを写真自身から切り出す。

手で多角形を引くと必ず手前の機材ケースに掛かってしまうので、
シャッター特有の「横スジ（スラット）＋低彩度」という手掛かりでピクセル単位に判定し、
シャッター内部の種から連結成分を広げて輪郭を得る。

usage: python tools/shutter_mask.py [--debug]
出力: tools/shutter_mask.png（白＝開口部）／--debug で tools/shutter_mask_debug.png
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SRC = 'public/img/backyard_cable.webp'
OUT = 'tools/shutter_mask.png'

# 探索範囲（この外はシャッターではない）
X0, X1, Y0, Y1 = 760, 1420, 0, 640
# シャッター面だと分かっている点（連結成分の種）
SEEDS = [(900, 300), (1000, 200), (1100, 300), (860, 480), (960, 500), (1150, 120), (1250, 300)]


def build():
    img = Image.open(SRC).convert('RGB')
    a = np.asarray(img).astype(np.float32)
    H, W, _ = a.shape

    gray = a.mean(axis=2)
    chroma = a.max(axis=2) - a.min(axis=2)

    # 横スジの強さ：縦方向の微分を縦に均した量（スラットの段差に強く反応する）
    dy = np.zeros_like(gray)
    dy[2:-2] = np.abs(gray[4:] - gray[:-4])
    ridge = np.asarray(Image.fromarray(dy.astype(np.uint8)).filter(ImageFilter.BoxBlur(4))).astype(np.float32)

    # 縦方向のエッジ（ケースの金具・角は縦の段差が強い）→ シャッターらしさを下げる
    dx = np.zeros_like(gray)
    dx[:, 2:-2] = np.abs(gray[:, 4:] - gray[:, :-4])
    vedge = np.asarray(Image.fromarray(dx.astype(np.uint8)).filter(ImageFilter.BoxBlur(4))).astype(np.float32)

    # 木の壁は彩度が高く（chroma 90前後）横スジが無い（ridge 1〜2）ので、
    # chroma をゆるめても入ってこない。影になったシャッター左側（chroma 40〜50）を拾うため広めに取る。
    cand = (chroma < 60) & (ridge > 8.0) & (vedge < ridge * 1.35) & (gray > 26) & (gray < 215)
    box = np.zeros_like(cand)
    box[Y0:Y1, X0:X1] = True
    cand &= box
    # 手前の機材ケースの天板（アルミの縁）はシャッターと区別できないので、
    # ケース本体（暗い面）の上端を列ごとに見つけて、そこから縁の厚み分だけ上で切る。
    cand &= ~occluders(gray, chroma)

    # 種から連結成分を広げる（4近傍）
    keep = np.zeros_like(cand)
    q = deque()
    for sx, sy in SEEDS:
        if cand[sy, sx] and not keep[sy, sx]:
            keep[sy, sx] = True
            q.append((sx, sy))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if X0 <= nx < X1 and Y0 <= ny < Y1 and cand[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True
                q.append((nx, ny))

    m = Image.fromarray((keep * 255).astype(np.uint8), 'L')
    # スラットの継ぎ目で欠けた所を閉じる → 内側の穴を埋める → 1px 縮めて縁のにじみを避ける
    m = m.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9))
    m = fill_holes(m)
    m = m.filter(ImageFilter.MinFilter(3))
    return img, m


#: 手前に立っている機材ケース（x範囲, 探索を始める y, 縁のアルミの厚み）
CASES = [(995, 1262, 430, 17), (1235, 1440, 150, 20)]


def occluders(gray, chroma, run=8):
    """手前の機材ケースが占めている範囲（アルミの縁まで含む）を返す。

    ケースの黒い本体の上端を列ごとに探し、そこから縁の厚みだけ上で切る。
    縁はシャッターと同じ灰色なので、色だけでは区別できない。
    """
    H, W = gray.shape
    occ = np.zeros((H, W), dtype=bool)
    dark = (gray < 100) & (chroma < 55)
    for x_from, x_to, y_from, lip in CASES:
        for x in range(x_from, min(x_to, W)):
            for y in range(y_from, H - run):
                if dark[y:y + run, x].all():
                    occ[max(0, y - lip):, x] = True
                    break
    return occ


def fill_holes(mask: Image.Image) -> Image.Image:
    """外側から届かない 0 の領域（＝穴）を 255 で埋める。"""
    a = np.asarray(mask) > 127
    H, W = a.shape
    outside = np.zeros_like(a)
    q = deque()
    for x in range(W):
        for y in (0, H - 1):
            if not a[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((x, y))
    for y in range(H):
        for x in (0, W - 1):
            if not a[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not a[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((nx, ny))
    filled = a | ~outside
    return Image.fromarray((filled * 255).astype(np.uint8), 'L')


if __name__ == '__main__':
    img, m = build()
    m.save(OUT)
    a = np.asarray(m) > 127
    print('mask px:', int(a.sum()), 'bbox:', np.argwhere(a).min(0)[::-1], np.argwhere(a).max(0)[::-1])
    if '--debug' in sys.argv:
        ov = np.asarray(img).copy()
        ov[a] = (ov[a] * 0.35 + np.array([255, 0, 160]) * 0.65).astype(np.uint8)
        Image.fromarray(ov).save('tools/shutter_mask_debug.png')
        print('debug written')
