"""バックヤード写真から「シャッター面だけ」のマスクを写真自身から切り出す。

手で多角形を引くと必ず手前の機材ケースに掛かるので、ピクセル単位で判定する。

手順
  1. core   : シャッター特有の「横スジ（スラット）＋低彩度」で芯を取る（保守的）
  2. grow   : 芯から1pxずつ外へ広げる。止めるのは「明らかに別の材質」の画素だけ
              （木＝高彩度／ケース本体＝暗くて平坦／コンクリート・金具＝明るくて平坦）。
              境界のにじみ画素まで飲み込むので、縁にスラットが残らない。
  3. cases  : 手前の機材ケースは列ごとに本体の上端とアルミ縁を検出して必ず除外
  4. 仕上げ : 穴埋め → 小さい半径で整える（大きなカーネルは階段状のギザギザを生む）

usage: python tools/shutter_mask.py [--debug]
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

SRC = 'public/img/backyard_cable.webp'
OUT = 'tools/shutter_mask.png'

X0, X1, Y0, Y1 = 700, 1440, 0, 660
SEEDS = [(900, 300), (1000, 200), (1100, 300), (860, 480), (960, 500), (1150, 120), (1250, 300)]
#: 手前に立っている機材ケース (x範囲, 本体を探し始める y, 上端を直線で均すか, 判定窓, 平均のしきい値)
#: 右の2つは天板が直線なので、列ごとの検出を最小二乗で直線に均す（外れ値に強い）。
#: 左の重ね置きは段差があるので列ごとの検出をそのまま使う。
CASES = [
    (1040, 1266, 430, True, 18, 88),
    (1238, 1440, 186, True, 18, 88),
]
#: 左に重ね置きされたケースは段差があるので、輪郭そのものを塗りつぶして求める
LEFT_CASE = {'seeds': [(760, 350), (770, 480), (730, 300), (790, 300)],
             'x': (700, 832), 'y': (236, 624)}
GROW = 18          # 芯から広げてよい最大距離（px）
FLOOR_X = (830, 1008)   # シャッターが床に接しているのが見えている列の範囲
JAMB_X = 780            # 左の戸当たり（垂直）
JAMB_R = 1342           # 右の戸当たり。ここから右の明るいレールは建物側なので塗らない


def features(img):
    a = np.asarray(img).astype(np.float32)
    gray = a.mean(axis=2)
    chroma = a.max(axis=2) - a.min(axis=2)
    # 横スジの強さ。縦に±2px差分を取り、横方向にだけ軽く均す
    # （横にぼかす分にはスラットは一様なので、左右の境界が甘くならない）
    dy = np.zeros_like(gray)
    dy[2:-2] = np.abs(gray[4:] - gray[:-4])
    dy = np.maximum.reduce([np.roll(dy, k, axis=0) for k in (-3, -1, 0, 1, 3)])
    ridge = np.asarray(Image.fromarray(dy.clip(0, 255).astype(np.uint8))
                       .filter(ImageFilter.BoxBlur((1, 0)))).astype(np.float32)
    return gray, chroma, ridge


def case_regions(gray, ridge, lip_min=104, lip_max=24):
    """手前の機材ケースが占める範囲（アルミの縁を含む）。

    ケースの黒い面は「そこから下へ18px の平均が暗い」で見分ける。
    シャッターの暗いスジは5px程度しか続かないので、この条件には掛からない。
    """
    H, W = gray.shape
    occ = np.zeros((H, W), dtype=bool)
    for x_from, x_to, y_from, straight, win, thr in CASES:
        xs, tops = [], []
        for x in range(x_from, min(x_to, W)):
            body = None
            for y in range(y_from, H - win):
                if gray[y, x] < 108 and gray[y:y + win, x].mean() < thr:
                    body = y
                    break
            if body is None:
                continue
            # 本体のすぐ上にある明るいアルミ縁も、ケースの一部として残す
            top = body
            k = body - 1
            while k > body - lip_max and gray[k, x] >= lip_min and ridge[k, x] < 12:
                top = k
                k -= 1
            xs.append(x)
            tops.append(top)
        if not xs:
            continue
        xs, tops = np.array(xs), np.array(tops, dtype=float)
        if straight and xs.size > 30:
            med = np.median(tops)
            ok = np.abs(tops - med) < 45          # 影などによる外れ値を捨てる
            if ok.sum() > 20:
                a1, b1 = np.polyfit(xs[ok], tops[ok], 1)
                line = a1 * np.arange(x_from, min(x_to, W)) + b1
                # 角が丸い所は直線より上に出るので、近い実測値があればそちらを採る
                raw = dict(zip(xs.tolist(), tops.tolist()))
                xs = np.arange(x_from, min(x_to, W))
                tops = np.array([
                    min(v, raw[x]) if abs(raw.get(x, v + 99) - v) < 14 else v
                    for x, v in zip(xs.tolist(), line.tolist())
                ])
        for x, top in zip(xs, tops):
            occ[max(0, int(top) - 1):, int(x)] = True
    return occ


def left_case_region(gray, ridge, chroma, barrier):
    """左に重ね置きされた機材ケースの輪郭。

    「スラットの縞ではない」画素を種から塗りつぶす。段差のある形をそのまま拾えるので、
    列ごとの上端検出のようにシャッター側を削り取ってしまうことがない。
    """
    H, W = gray.shape
    x0, x1 = LEFT_CASE['x']
    y0, y1 = LEFT_CASE['y']
    # スラットの段差（core を少し太らせた物）を壁にして、シャッター側へ染み出さないようにする
    caseish = ((ridge < 18) | (gray < 72)) & (chroma < 72) & ~barrier
    seen = np.zeros((H, W), dtype=bool)
    q = deque()
    for sx, sy in LEFT_CASE['seeds']:
        if caseish[sy, sx]:
            seen[sy, sx] = True
            q.append((sx, sy))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if x0 <= nx < x1 and y0 <= ny < y1 and caseish[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((nx, ny))
    m = fill_holes(Image.fromarray((seen * 255).astype(np.uint8), 'L'))
    m = m.filter(ImageFilter.MaxFilter(9))     # 縁を少し外へ（ケース側に余裕を持たせる）
    return np.asarray(m) > 127


def build():
    img = Image.open(SRC).convert('RGB')
    gray, chroma, ridge = features(img)
    H, W = gray.shape

    box = np.zeros((H, W), dtype=bool)
    box[Y0:Y1, X0:X1] = True
    # --- 1. 芯：確実にシャッターと言える所だけ
    raw_core = (chroma < 52) & (ridge > 16) & (gray > 26) & (gray < 215) & box
    barrier = np.asarray(Image.fromarray((raw_core * 255).astype(np.uint8), 'L')
                         .filter(ImageFilter.MaxFilter(9))) > 127
    occ = case_regions(gray, ridge) | left_case_region(gray, ridge, chroma, barrier)
    core = raw_core & ~occ

    # --- 2. 広げる：明らかに別の材質でなければ入れる
    other = (
        (chroma > 62)                       # 木の壁
        | ((gray < 70) & (ridge < 14))      # ケースの黒い面
        | ((gray > 104) & (ridge < 9))      # コンクリート・アルミの縁・金具
    )
    passable = box & ~occ & ~other

    keep = np.zeros((H, W), dtype=bool)
    dist = np.zeros((H, W), dtype=np.int16)
    q = deque()
    for sx, sy in SEEDS:
        if core[sy, sx]:
            keep[sy, sx] = True
            q.append((sx, sy))
    # まず芯の連結成分、続けて passable 側へ GROW px だけ染み出す
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if not (X0 <= nx < X1 and Y0 <= ny < Y1) or keep[ny, nx]:
                continue
            if core[ny, nx]:
                keep[ny, nx] = True
                dist[ny, nx] = 0
                q.append((nx, ny))
            elif passable[ny, nx] and dist[y, x] < GROW:
                keep[ny, nx] = True
                dist[ny, nx] = dist[y, x] + 1
                q.append((nx, ny))

    m = Image.fromarray((keep * 255).astype(np.uint8), 'L')
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))  # 小さな穴を閉じる
    m = fill_holes(m)
    m = m.filter(ImageFilter.MedianFilter(5))                                 # ギザギザだけ均す
    a = (np.asarray(m) > 127) & ~occ                                          # ケースは最後にもう一度守る

    a[:, :JAMB_X] = False       # 左の戸当たりより外はシャッターではない
    a[:, JAMB_R + 1:] = False   # 右の戸当たり（明るいガイドレール）は残す

    # 床との境目：列ごとに「スラットの段差が終わる高さ」を拾い、
    # 床は平らなので直線に当てはめる（1列ずつだと影や粒で暴れる）。
    dy = np.zeros_like(gray)
    dy[2:-2] = np.abs(gray[4:] - gray[:-4])
    xs, ys = [], []
    for x in range(FLOOR_X[0], FLOOR_X[1]):
        for y in range(500, 612):
            if (dy[y:y + 8, x] < 25).all():
                xs.append(x)
                ys.append(y)
                break
    if len(xs) > 40:
        xs, ys = np.array(xs), np.array(ys, dtype=float)
        for _ in range(3):
            k, b = np.polyfit(xs, ys, 1)
            r = ys - (k * xs + b)
            keep = np.abs(r) < max(5.0, 2 * r.std())
            if keep.sum() < 30:
                break
            xs, ys = xs[keep], ys[keep]
        k, b = np.polyfit(xs, ys, 1)
        for x in range(X0, X1):
            a[int(k * x + b) + 1:, x] = False

    return img, Image.fromarray((a * 255).astype(np.uint8), 'L')


def fill_holes(mask: Image.Image) -> Image.Image:
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
    return Image.fromarray(((a | ~outside) * 255).astype(np.uint8), 'L')


if __name__ == '__main__':
    img, m = build()
    m.save(OUT)
    a = np.asarray(m) > 127
    ys, xs = np.nonzero(a)
    print('mask px:', int(a.sum()), 'x:', xs.min(), xs.max(), 'y:', ys.min(), ys.max())
    if '--debug' in sys.argv:
        ov = np.asarray(img).copy()
        ov[a] = (ov[a] * 0.35 + np.array([255, 0, 160]) * 0.65).astype(np.uint8)
        Image.fromarray(ov).save('tools/shutter_mask_debug.png')
        print('debug written')
