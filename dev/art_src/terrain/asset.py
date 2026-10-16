# Turns the user's own textures (restored 16px sheet 1) into the tileset pieces the demo needs.
import numpy as np, json, colorsys
from PIL import Image
R = np.asarray(Image.open('sheet1_16px.png').convert('RGB')).astype(float)
def tex(c): ty = ord(c[0]) - 65; tx = int(c[1:]) - 1; return R[ty*16:ty*16+16, tx*16:tx*16+16].copy()
def mood(a, v=.92, s=.92):        # a little calmer for the lighting (Core Keeper feel)
    out = np.zeros_like(a)
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            h, l, ss = colorsys.rgb_to_hls(*(a[y, x] / 255)); r, g, b = colorsys.hls_to_rgb(h, l * v, ss * s); out[y, x] = [r * 255, g * 255, b * 255]
    return np.round(out)
def pal(a):                         # distinct colours sorted dark -> light
    c = np.unique(a.reshape(-1, 3), axis=0); return c[np.argsort(c @ [.3, .59, .11])]
def save(a, n, alpha=None):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA')
    if alpha is not None: im.putalpha(Image.fromarray((alpha * 255).astype(np.uint8)))
    im.save(f'out/{n}.png')
# grass and water: the textures' own colours, laid out as calm clusters (the checker-like originals look like static over big areas)
import draw
hx = lambda c: '#%02x%02x%02x' % tuple(int(v) for v in c)
Q = mood(np.array([[draw.hexc(c) for c in ['#3e6b26', '#4b7732', '#53803b', '#608c48']]], float))[0]
grass = draw.grass_fill([hx(Q[0] * .55), hx(Q[0]), hx(Q[1]), hx(Q[2]), hx(Q[3])], 1, (.26, .66)).astype(float); grass2 = grass.copy()   # one grass, no lighter blobs
Wc = mood(np.array([[draw.hexc(c) for c in ['#0673b1', '#077bb7', '#1b91cb', '#33baec']]], float), v=.85, s=.9)[0]
draw.WATER = [hx(Wc[0] * .7), hx(Wc[0]), hx(Wc[1]), hx(Wc[2]), hx(Wc[3])]
water = draw.water_fill(20).astype(float)
dirt = mood(tex('C13'))
for n, a in [('a_grass', grass), ('a_grass2', grass2), ('a_dirt', dirt), ('a_water', water)]: save(a, n)
gp, dp, wp = pal(grass), pal(dirt), pal(water)
dk = lambda c, k: np.round(c * k)
EDGE = {'gE': dk(gp[0], .55).tolist(), 'gS': dk(gp[0], .85).tolist(), 'pE': dk(dp[0], .6).tolist(), 'pS': dp[0].tolist()}
# walls: top = the texture as-is (all four variants the same so neighbouring tops join up), front = texture shaded darker toward the floor
def front(a, lip):
    out = a.copy()
    for y in range(16):
        k = 1.0 - y / 15 * .45; out[y] = np.round(out[y] * k)
    out[0] = lip; out[15] = np.round(pal(a)[0] * .5); return out
for t, top, fr in [(2, 'A1', 'B13'), (1, 'B1', 'B3')]:
    T = mood(tex(top)); F = mood(tex(fr), v=.85)
    for v in range(4): save(T, f'a_wtop_{t}_{v}')
    save(front(F, pal(T)[-1]), f'a_wfront_{t}')
# shore cliff 9x16: grass lip (2), earth face from the earth-wall front texture (5, darker down), foam, deep line
E = mood(tex('B3'), v=.8); c = np.zeros((9, 16, 3))
c[0] = gp[len(gp) // 2]; c[1] = EDGE['gE']
for r in range(5): c[2 + r] = np.round(E[r * 3] * (1 - r * .12))
c[7] = [np.round(wp[-1] * 1.1) if (x // 2) % 3 else wp[-2] for x in range(16)]; c[8] = np.round(wp[0] * .7)
save(c, 'a_cliff')
json.dump(EDGE, open('out/a_edge.json', 'w')); print(EDGE)

# ---- ore walls (copper 4, gold 10, quartz 13) ----
def lum(c): return .3 * c[0] + .59 * c[1] + .11 * c[2]
cop = tex('D4').copy()
COP = [np.array([0x6a, 0x34, 0x1a]), np.array([0x8c, 0x4a, 0x22]), np.array([0xec, 0x9a, 0x48])]   # only the brightest tone glows
fl = np.array([[cop[y, x, 0] - cop[y, x, 1] > 40 and cop[y, x, 0] - cop[y, x, 2] > 40 for x in range(16)] for y in range(16)])
for y in range(16):
    for x in range(16):
        if not fl[y, x]: continue                      # red flecks -> copper nuggets: lit top-left, dark bottom-right
        top = not fl[(y - 1) % 16, x]; left = not fl[y, (x - 1) % 16]; bot = not fl[(y + 1) % 16, x]; right = not fl[y, (x + 1) % 16]
        cop[y, x] = COP[2] if top and left else COP[0] if bot and right else COP[1]
qz = mood(tex('E14'), v=.9); qp = pal(qz)
for c, nc in [(qp[-1], [0xe2, 0xd2, 0xff]), (qp[-2], [0xc4, 0xae, 0xf2])]:   # the lightest veins become pale crystal (they glow)
    qz[(qz == c).all(-1)] = nc
gd = mood(tex('D11'), v=.95)
gm = np.array([[gd[y, x, 0] > 150 and gd[y, x, 1] > 110 and gd[y, x, 2] < 130 for x in range(16)] for y in range(16)])
for y in range(16):
    for x in range(16):                                # gold flecks: only the lit top-left corner of each fleck stays bright
        if gm[y, x] and not (not gm[(y - 1) % 16, x] and not gm[y, (x - 1) % 16]): gd[y, x] = np.round(gd[y, x] * .62)
ORE = {4: mood(cop, v=.85), 10: gd, 13: qz}
for t, T in ORE.items():
    for v in range(4): save(T, f'a_wtop_{t}_{v}')
    lip = np.clip(np.median(T.reshape(-1, 3), axis=0) * 1.45, 0, 255)   # rock-coloured edge, not ore-coloured
    save(front(np.round(T * .85), np.round(lip)), f'a_wfront_{t}')
RULE = {4: lambda r, g, b: r > 150 and r - b > 80 and 60 < g < 200, 10: lambda r, g, b: r > 150 and g > 110 and b < 130, 13: lambda r, g, b: lum((r, g, b)) > 150}
for t, T in ORE.items():
    n = sum(RULE[t](*T[y, x]) for y in range(16) for x in range(16)); print('ore', t, 'glowing pixels in top:', n)

# ---- ores embedded in the surrounding rock: host wall + an ore cluster in a different spot per variant ----
def ore_mask(t, T):
    if t == 4: return fl.copy()
    if t == 10: return gm.copy()
    L = T @ np.array([.3, .59, .11]); return L > np.percentile(L, 68)          # quartz: the lighter veins
def blob(seed, n):
    rng = np.random.default_rng(seed); ys, xs = np.mgrid[0:16, 0:16] + .5; m = np.zeros((16, 16), bool)
    for _ in range(n):
        cx, cy, r = rng.uniform(4, 12), rng.uniform(4, 12), rng.uniform(4.2, 6.2)
        m |= (xs - cx) ** 2 + ((ys - cy) * 1.2) ** 2 < r * r
    return m
HOST = {1: (mood(tex('B1')), front(mood(tex('B3'), v=.85), pal(mood(tex('B1')))[-1])), 2: (mood(tex('A1')), front(mood(tex('B13'), v=.85), pal(mood(tex('A1')))[-1]))}
for t, T in ORE.items():
    M = ore_mask(t, T)
    for h, (top, fr) in HOST.items():
        for v in range(4):
            m = np.roll(np.roll(M, v * 5, 0), v * 7, 1) & blob(1000 + t * 10 + v, 1 + v % 2)
            src = np.roll(np.roll(T, v * 5, 0), v * 7, 1); out = top.copy(); out[m] = src[m]; save(out, f'a_ore_{t}_{h}_top_{v}')
        for v in range(3):
            m = np.roll(M, v * 6, 1) & blob(2000 + t * 10 + v, 1); m[0] = False; m[15] = False
            src = np.roll(T, v * 6, 1); out = fr.copy()
            for y in range(16): out[y][m[y]] = np.round(src[y][m[y]] * (1 - y / 15 * .4))   # ore darker toward the floor like the face
            save(out, f'a_ore_{t}_{h}_front_{v}')
    n = [sum(RULE[t](*np.asarray(Image.open(f'out/a_ore_{t}_2_top_{v}.png').convert('RGB'))[y, x].astype(int)) for y in range(16) for x in range(16)) for v in range(4)]
    print('ore', t, 'glowing px per top variant (stone host):', n)

# ---- built floors (placed as square blocks) ----
save(mood(tex('G7'), v=.9), 'a_fwood'); save(mood(tex('C3'), v=.85), 'a_fstone')
