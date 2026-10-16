# Draws the new tiles for the lantern demo, pixel by pixel. Deterministic (fixed seeds).
# Style: chunky lumps with 1px dark gaps, light top-left edge / dark bottom-right, short ramps,
# mid-brightness so the lighting makes the mood (Core Keeper feel).
import numpy as np
from PIL import Image
import os

OUT = 'out'; os.makedirs(OUT, exist_ok=True)
hexc = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 + 1 / 32

def vnoise(w, h, cell, seed):
    """tileable value noise in [0,1], cell = lattice spacing (w,h divisible by cell)"""
    rng = np.random.default_rng(seed); gw, gh = w // cell, h // cell
    g = rng.random((gh, gw))
    ys, xs = np.mgrid[0:h, 0:w] + .5
    fx, fy = xs / cell - .5, ys / cell - .5
    x0, y0 = np.floor(fx).astype(int), np.floor(fy).astype(int)
    u, v = fx - x0, fy - y0; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v)
    a = g[y0 % gh, x0 % gw]; b = g[y0 % gh, (x0 + 1) % gw]; c = g[(y0 + 1) % gh, x0 % gw]; d = g[(y0 + 1) % gh, (x0 + 1) % gw]
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v

def ramp_pick(val, n):
    """value 0..1 -> index 0..n-1 with ordered dithering between steps"""
    h, w = val.shape
    t = BAYER[np.arange(h)[:, None] % 4, np.arange(w)[None, :] % 4]
    return np.clip(np.floor(val * (n - 1) + t), 0, n - 1).astype(int)

def quant(val, cuts):
    """value -> index by thresholds, no dithering: gives chunky clusters"""
    return np.digitize(val, cuts)

def paint(idx, pal):
    pal = np.array([hexc(c) for c in pal]); return pal[idx]

def save(a, name, alpha=None):
    im = Image.fromarray(a.astype(np.uint8), 'RGB').convert('RGBA')
    if alpha is not None: im.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    im.save(f'{OUT}/{name}.png'); return im

def lumps(w, h, n, seed, jitter=1.0, wrap=True):
    """Voronoi lumps: returns (cell id, distance to own centre, distance gap to 2nd nearest, rel dx, rel dy)"""
    rng = np.random.default_rng(seed)
    # jittered grid so lumps are evenly sized
    k = int(np.sqrt(n)); pts = []
    for j in range(k):
        for i in range(k):
            pts.append(((i + .5 + (rng.random() - .5) * jitter) * w / k, (j + .5 + (rng.random() - .5) * jitter) * h / k))
    pts = np.array(pts)
    ys, xs = np.mgrid[0:h, 0:w] + .5
    best = np.full((h, w), 1e9); second = np.full((h, w), 1e9); bid = np.zeros((h, w), int); bdx = np.zeros((h, w)); bdy = np.zeros((h, w))
    offs = [(ox, oy) for ox in (-w, 0, w) for oy in (-h, 0, h)] if wrap else [(0, 0)]
    for pi, (px, py) in enumerate(pts):
        for ox, oy in offs:
            dx = xs - (px + ox); dy = ys - (py + oy); d = np.hypot(dx * 1.0, dy * 1.15)
            m = d < best
            second = np.where(m, best, np.minimum(second, d))
            best = np.where(m, d, best); bid = np.where(m, pi, bid); bdx = np.where(m, dx, bdx); bdy = np.where(m, dy, bdy)
    return bid, best, second - best, bdx, bdy

# ---------------- floors (32x32, tileable; the bake samples them by world pixel) ----------------
GRASS = ['#1d3a2b', '#2b5634', '#3a7239', '#4a8a42', '#64a650']      # outline, shade, base, light, blade tip
GRASS2 = ['#2b5634', '#3f7a3c', '#4f8f44', '#62a24d', '#7dba5c']     # lush patch
DIRT = ['#3a2318', '#58382a', '#6f4a33', '#88603f', '#a2774d']        # outline, dark, base, light, highlight
PEB = ['#4b4440', '#76695f', '#a19282']
WATER = ['#163a55', '#1e5674', '#276c8c', '#4a98b0', '#a6dde3']       # deep line, deep, base, ripple, glint

def grass_fill(pal, seed, cuts=(.36, .62)):
    w = h = 64
    n = vnoise(w, h, 16, seed) * .5 + vnoise(w, h, 8, seed + 1) * .35 + vnoise(w, h, 4, seed + 4) * .15
    idx = quant(n, list(cuts)) + 1                # shade / base / light clusters
    rng = np.random.default_rng(seed + 2); spots = []
    while len(spots) < 40:                        # leafy tufts, kept apart
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        if all(min(abs(x - a), w - abs(x - a)) + min(abs(y - b), h - abs(y - b)) > 7 for a, b in spots): spots.append((x, y))
    for x, y in spots:
        big = rng.random() < .5   # light blades over the ground, a single darker pixel at the root
        for (u, v, k) in ([(-1, 0, 4), (1, 0, 4), (-1, 1, 3), (0, 1, 3), (1, 1, 3), (0, 2, 1)] if big else [(0, 0, 4), (0, 1, 3), (1, 1, 2)]):
            idx[(y + v) % h, (x + u) % w] = k
    return paint(idx, pal)

def dirt_fill(seed, pebbles=16):
    w = h = 64
    bid, d, g, dx, dy = lumps(w, h, 64, seed, jitter=1.1)
    rng = np.random.default_rng(seed + 3); tone = rng.random(bid.max() + 1)
    n = vnoise(w, h, 8, seed + 1)
    v = .5 + (tone[bid] - .5) * .5 + (n - .5) * .4 + (-dx - dy) / 30
    idx = quant(v, [.38, .66]) + 1                # dark / base / light
    idx = np.where((g < .8) & ((-dx - dy) < -1), 1, idx)     # soft creases on the shadow side only
    idx = np.where((g < 2.2) & ((-dx - dy) > 3) & (idx < 3), 3, idx)
    a = paint(idx, DIRT); spots = []
    while len(spots) < pebbles:
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        if all(min(abs(x - p), w - abs(x - p)) + min(abs(y - q), h - abs(y - q)) > 9 for p, q in spots): spots.append((x, y))
    for x, y in spots:                            # pebble: light top-left, mid, dark bottom-right, shadow under
        big = rng.random() < .5
        shape = [(0, 0, 2), (1, 0, 1), (0, 1, 1), (1, 1, 0)] if not big else [(0, 0, 2), (1, 0, 2), (2, 0, 1), (0, 1, 1), (1, 1, 1), (2, 1, 0)]
        for u, v_, k in shape: a[(y + v_) % h, (x + u) % w] = hexc(PEB[k])
        for u in range(3 if big else 2): a[(y + 2) % h, (x + u) % w] = hexc(DIRT[1])
    return a

def water_fill(seed):
    w = h = 64
    n = vnoise(w, h, 16, seed) * .75 + vnoise(w, h, 8, seed + 1) * .25
    idx = quant(n, [.42]) + 1                     # deep / base, big soft shapes
    return paint(idx, WATER)

def ripples(seed, frame):
    """16x16 overlay: a few short glints that drift between the two frames"""
    w = h = 16; a = np.zeros((h, w, 3)); al = np.zeros((h, w)); rng = np.random.default_rng(seed)
    for _ in range(3):
        x, y, L = rng.integers(0, w), rng.integers(0, h), rng.integers(3, 6)
        x = (x + frame * 2) % w; y = (y + frame) % h
        for k in range(L):
            xx = (x + k) % w; a[y, xx] = hexc(WATER[3]); al[y, xx] = 1
        a[y, (x + L // 2) % w] = hexc(WATER[4])
    return a, al

def cliff_strip():
    """9 rows x 32: grass lip (2 rows), earth face (5), foam (1), deep line (1). Drawn where ground drops south into water."""
    w = 32; a = np.zeros((9, w, 3), np.uint8); rng = np.random.default_rng(77)
    lip = vnoise(w, 4, 4, 70)[0]
    for x in range(w):
        a[0, x] = hexc(GRASS[2] if lip[x] > .45 else GRASS[1]); a[1, x] = hexc(GRASS[0])
    face = vnoise(w, 8, 4, 71)[:5]
    FACE = ['#2f1d15', '#47291e', '#5d3926', '#734a31']
    for r in range(5):
        for x in range(w):
            v = face[r, x] * .5 + (1 - r / 4) * .5        # lighter at the top of the face
            k = int(np.clip(np.floor(v * 3 + BAYER[r % 4, x % 4]), 0, 3)); a[2 + r, x] = hexc(FACE[k])
    for x in range(0, w, 1):                               # strata: a darker line, broken
        if rng.random() < .7: a[4, x] = hexc(FACE[0])
    for x in range(w): a[7, x] = hexc(WATER[4] if (x // 2 + (x * 7) % 3) % 3 else WATER[3])
    for x in range(w): a[8, x] = hexc(WATER[0])
    return a

def deco():
    """8x8 sprites: grass tuft x2, flower x2, pebble. Returns RGBA strip 40x8"""
    S = np.zeros((8, 40, 4), np.uint8)
    def px(i, x, y, c): S[y, i * 8 + x, :3] = hexc(c); S[y, i * 8 + x, 3] = 255
    for x, y, c in [(1, 6, GRASS[1]), (2, 5, GRASS[4]), (2, 6, GRASS[3]), (3, 4, GRASS[4]), (3, 5, GRASS[3]), (3, 6, GRASS[3]), (4, 5, GRASS[4]), (4, 6, GRASS[3]), (5, 6, GRASS[1]), (2, 7, GRASS[0]), (3, 7, GRASS[0]), (4, 7, GRASS[0])]: px(0, x, y, c)
    for x, y, c in [(2, 6, GRASS[4]), (3, 5, GRASS[4]), (3, 6, GRASS[3]), (5, 4, GRASS[4]), (5, 5, GRASS[3]), (5, 6, GRASS[3]), (4, 6, GRASS[1]), (3, 7, GRASS[0]), (5, 7, GRASS[0])]: px(1, x, y, c)
    for i, (pet, mid) in enumerate([('#e8d9b0', '#f2c14e'), ('#c9a6e8', '#f4e3a0')]):
        for x, y in [(3, 2), (2, 3), (4, 3), (3, 4)]: px(2 + i, x, y, pet)
        px(2 + i, 3, 3, mid); px(2 + i, 3, 5, GRASS[3]); px(2 + i, 3, 6, GRASS[1])
    for x, y, c in [(2, 5, PEB[2]), (3, 5, PEB[2]), (4, 5, PEB[1]), (2, 6, PEB[1]), (3, 6, PEB[1]), (4, 6, PEB[0]), (2, 7, GRASS[0]), (3, 7, GRASS[0]), (4, 7, GRASS[0])]: px(4, x, y, c)
    return S

# ---------------- walls: top 16x16 (rows 0-11 show; 12-15 sit under the front) and front 16x16 ----------------
STONE_T = ['#1f2230', '#363c50', '#4a526a', '#5f6984', '#7c87a2']   # gap, dark, base, light, edge highlight
STONE_F = ['#171922', '#262a37', '#343a4c', '#444b61', '#59617b']
EARTH_T = ['#2a1912', '#4a2f21', '#62402c', '#7a5236', '#946543']
EARTH_F = ['#1d110c', '#311e15', '#43291d', '#563626', '#6c4530']

def lump_shade(bid, dist, gap, dx, dy, pal, seed, gapw=.9, n_tone=3):
    """inside each lump: lighter toward top-left, dark rim bottom-right; gaps in pal[0]"""
    h, w = bid.shape; rng = np.random.default_rng(seed)
    tone = rng.random(bid.max() + 1) * .35
    light = (-dx - dy) / 7.0                          # top-left facing
    v = .45 + light * .35 + tone[bid] - dist / 18
    idx = quant(v, [.42, .6]) + 1
    edge_tl = (gap < gapw + 1.2) & (light > .25)
    edge_br = (gap < gapw + 1.2) & (light < -.15)
    idx = np.where(edge_tl, 4, idx); idx = np.where(edge_br, 1, idx)
    idx = np.where(gap < gapw, 0, idx)
    return paint(idx, pal)

def wall_top(kind, v):
    if kind == 'stone':
        bid, d, g, dx, dy = lumps(16, 16, 4, 100 + v, jitter=.9)
        return lump_shade(bid, d, g, dx, dy, STONE_T, 200 + v)
    # earth: shaded clumps like the dirt floor but darker, a stone now and then
    bid, d, g, dx, dy = lumps(16, 16, 9, 330 + v, jitter=1)
    rng = np.random.default_rng(320 + v); tone = rng.random(bid.max() + 1)
    val = .5 + (tone[bid] - .5) * .45 + (-dx - dy) / 14
    idx = quant(val, [.4, .64]) + 1
    idx = np.where((g < 1.0) & ((-dx - dy) < 1), 0, idx)                   # crease on the shadow side
    idx = np.where((g < 2.0) & ((-dx - dy) > 2.5) & (idx >= 2), 4, idx)    # lit edge
    a = paint(idx, EARTH_T)
    if v % 2 == 0:
        x, y = rng.integers(2, 12), rng.integers(1, 8)
        for (u, w_, c) in [(0, 0, PEB[2]), (1, 0, PEB[1]), (0, 1, PEB[1]), (1, 1, PEB[0]), (0, 2, EARTH_T[0]), (1, 2, EARTH_T[0])]:
            a[y + w_, x + u] = hexc(c)
    return a

def wall_front(kind):
    w, h = 16, 16; rng = np.random.default_rng(500 if kind == 'stone' else 600)
    pal = STONE_F if kind == 'stone' else EARTH_F
    a = np.zeros((h, w, 3), np.uint8)
    if kind == 'stone':
        # rough blocks in staggered rows, darker toward the floor
        rows = [(0, 5), (5, 5), (10, 6)]; blk_tone = {(r, c): rng.random() for r in range(3) for c in range(4)}
        for ri, (y0, rh) in enumerate(rows):
            off = (ri % 2) * 5; cuts = [(off + k * 9) % 16 for k in range(3)]
            for y in range(y0, y0 + rh):
                for x in range(w):
                    down = ri / 2
                    base = .62 - down * .32 + (blk_tone[(ri, sum(x >= c for c in cuts))] - .5) * .2 - (y - y0) / rh * .12
                    if y == y0: base += .25
                    if y == y0 + rh - 1 or x in cuts: base = -1
                    k = 0 if base < 0 else int(np.digitize(base, [.3, .55, .8])) + 1
                    a[y, x] = hexc(pal[k])
    else:
        # packed earth in two soft layers, darker toward the floor, a few pebbles
        bid, d, g, dx, dy = lumps(16, 16, 9, 620, jitter=1)
        tone = rng.random(bid.max() + 1)
        for y in range(h):
            for x in range(w):
                band = 0 if y < 7 else 1
                val = .62 - band * .26 - (y % 7) / 7 * .12 + (tone[bid[y, x]] - .5) * .25 + (-dx[y, x] - dy[y, x]) / 20
                k = int(np.digitize(val, [.28, .45, .6])) + 1
                if g[y, x] < .9 and (-dx[y, x] - dy[y, x]) < 1: k = 1
                a[y, x] = hexc(pal[min(k, 4)])
        for x in range(w): a[7, x] = hexc(pal[0]) if (x * 5) % 7 else hexc(pal[1])     # layer seam
    a[0, :] = hexc(STONE_T[4] if kind == 'stone' else EARTH_T[4])   # lit lip where the top meets the face
    a[h - 1, :] = hexc(pal[0])
    return a

if __name__ == '__main__':
    save(grass_fill(GRASS, 1), 'n_grass'); save(grass_fill(GRASS2, 5), 'n_grass2')
    save(dirt_fill(10), 'n_dirt'); save(water_fill(20), 'n_water')
    for f in (0, 1): a, al = ripples(30, f); save(a, f'n_ripple_{f}', al)
    save(cliff_strip(), 'n_cliff')
    Image.fromarray(deco(), 'RGBA').save(f'{OUT}/n_deco.png')
    for kind, t in (('earth', 1), ('stone', 2)):
        for v in range(4): save(wall_top(kind, v), f'n_wtop_{t}_{v}')
        save(wall_front(kind), f'n_wfront_{t}')
    print('ok', sorted(os.listdir(OUT)))
