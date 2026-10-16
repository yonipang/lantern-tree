# v73 바닥·벽·광석 그림 만들기 → dev/art/terrain/*.raw.png
# 원본: 사용자가 직접 그려 예전에 판매했던 텍스처 묶음 1번 시트(sheet1_16px.png = restore_sheet1.py로 16px 복원).
# draw.py(Claude가 그린 물결·장식) → asset.py(텍스처로 만든 바닥·벽·광석, 빛 데모의 「에셋으로」 세트)를 그대로 쓰고,
# 여기서 바탕 바위 화강암(A13)·현무암(A17), 철·서리 광맥, 「광석 + 바위」 짝(광석 5 × 바위 4)을 더 만들어요.
# 쓰는 법: python3 dev/art_src/terrain/make_terrain.py  (그다음 python3 dev/art_pack.py)
import os, sys, runpy, shutil, numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); os.chdir(HERE); sys.path.insert(0, HERE)
DST = os.path.join(HERE, '..', '..', 'art', 'terrain')
shutil.rmtree('out', ignore_errors=True); os.makedirs('out')
runpy.run_path('draw.py', run_name='__main__')          # n_ripple_*, n_deco (and the rest of Claude's set, unused)
ns = runpy.run_path('asset.py')                          # a_* (the demo's default set)
tex, mood, front, pal, ORE, ore_mask, blob, fl = (ns[k] for k in ('tex', 'mood', 'front', 'pal', 'ORE', 'ore_mask', 'blob', 'fl'))
hx = lambda h: np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float)
# ---- host rocks granite 3 (A13) · basalt 9 (A17), recoloured to the game's wall colours (same as rocks.py) ----
GAME = {3: ['#4b3f78', '#5b4d8f', '#3c3263'], 9: ['#3a3340', '#4a414f', '#2a2430']}
def ramp(t):
    b, l, d = (hx(c) for c in GAME[t]); return [d * .55, d, b, l, np.clip(l * 1.18 + 8, 0, 255)]
def recolour(a, t):
    L = a @ [.3, .59, .11]; lo, hi = np.percentile(L, 3), np.percentile(L, 97); v = np.clip((L - lo) / max(hi - lo, 1), 0, 1)
    R = ramp(t); q = np.round(v * 5) / 5; x = q * (len(R) - 1); i = np.clip(np.floor(x).astype(int), 0, len(R) - 2); f = (x - i)[..., None]
    return np.round(np.array(R)[i] * (1 - f) + np.array(R)[i + 1] * f)
HOST = {}
for t, c in ((1, None), (2, None), (3, 'A13'), (9, 'A17')):
    if c is None:
        top = np.asarray(Image.open(f'out/a_wtop_{t}_0.png').convert('RGB')).astype(float); fr = np.asarray(Image.open(f'out/a_wfront_{t}.png').convert('RGB')).astype(float)
    else:
        top = mood(recolour(tex(c), t)); fr = front(mood(recolour(tex(c), t), v=.85), pal(top)[-1])
    HOST[t] = (top, fr)
# ---- iron 5 and frost 12 (no texture of their own on the sheet): copper's nugget shapes in iron colours, quartz veins in frost colours ----
irn = tex('D4').copy(); IRN = [hx('#4e5566'), hx('#8c96a8'), hx('#dfe6f0')]
fi = np.roll(np.roll(fl, 4, 0), 9, 1)
for y in range(16):
    for x in range(16):
        if not fi[y, x]: continue
        top = not fi[(y - 1) % 16, x]; left = not fi[y, (x - 1) % 16]; bot = not fi[(y + 1) % 16, x]; right = not fi[y, (x + 1) % 16]
        irn[y, x] = IRN[2] if top and left else IRN[0] if bot and right else IRN[1]
qz = ORE[13]; L = qz @ np.array([.3, .59, .11]); lo, hi = L.min(), L.max(); FR = [hx('#1f4a6a'), hx('#3f86b8'), hx('#7fd0ee'), hx('#d6f6ff')]
frs = np.array([[FR[min(3, int((L[y, x] - lo) / max(hi - lo, 1) * 4))] for x in range(16)] for y in range(16)])
ORE[5] = irn; ORE[12] = frs
MASK = {4: ore_mask(4, ORE[4]), 10: ore_mask(10, ORE[10]), 13: ore_mask(13, ORE[13]), 5: fi, 12: np.roll(ore_mask(13, ORE[13]), 5, 1)}
SRC = {**ORE, 12: np.roll(frs, 5, 1)}
def sv(a, n):
    os.makedirs(os.path.dirname(os.path.join(DST, n)), exist_ok=True)
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert('RGBA').save(os.path.join(DST, n + '.raw.png'))
shutil.rmtree(DST, ignore_errors=True); os.makedirs(DST)
# ore embedded in each host rock (same placement as asset.py: 4 top variants with 1-2 blobs, 3 front variants)
for t in (4, 5, 10, 12, 13):
    M, T = MASK[t], SRC[t]
    for h, (top, fr) in HOST.items():
        for v in range(4):
            m = np.roll(np.roll(M, v * 5, 0), v * 7, 1) & blob(1000 + t * 10 + v, 1 + v % 2)
            src = np.roll(np.roll(T, v * 5, 0), v * 7, 1); out = top.copy(); out[m] = src[m]; sv(out, f'ore/{t}_{h}_top_{v}')
        for v in range(3):
            m = np.roll(M, v * 6, 1) & blob(2000 + t * 10 + v, 1); m[0] = False; m[15] = False
            src = np.roll(T, v * 6, 1); out = fr.copy()
            for y in range(16): out[y][m[y]] = np.round(src[y][m[y]] * (1 - y / 15 * .4))
            sv(out, f'ore/{t}_{h}_front_{v}')
for h, (top, fr) in HOST.items(): sv(top, f'wtop/{h}'); sv(fr, f'wfront/{h}')
cp = lambda a, n: shutil.copy(f'out/{a}.png', os.path.join(DST, n + '.raw.png'))
for a, n in (('a_grass', 'grass'), ('a_dirt', 'dirt'), ('a_water', 'water'), ('a_fwood', 'fwood'), ('a_fstone', 'fstone'), ('n_ripple_0', 'ripple_0'), ('n_ripple_1', 'ripple_1'), ('n_deco', 'deco')): cp(a, n)
c = Image.open('out/a_cliff.png').convert('RGBA'); c2 = Image.new('RGBA', (16, 10)); c2.paste(c, (0, 0)); c2.save(os.path.join(DST, 'cliff.raw.png'))  # 16×9 → 16×10 (even size)
print('edge colours (A_EDGE in render/terrain.js):', ns['EDGE'])
print('ok', sum(len(f) for _, _, f in os.walk(DST)), 'pictures')
