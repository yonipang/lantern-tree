# Restores the user's own texture sheet 1 (816x816 JPG, 17x17 textures of 16px shown at 3x) to clean 16px pixel art.
# Each art pixel = median of its 3x3 block; then each 16px texture is reduced to 7 colours (k-means).
import sys, numpy as np
from PIL import Image
src = sys.argv[1] if len(sys.argv) > 1 else '9d6dea369b0744ebf5fd3420c3cbc3fd.jpg'
a = np.asarray(Image.open(src).convert('RGB')).astype(float)
small = np.median(a.reshape(272, 3, 272, 3, 3).transpose(0, 2, 1, 3, 4).reshape(272, 272, 9, 3), axis=2)
def kmeans(px, k, it=12):
    rng = np.random.default_rng(0); c = px[rng.choice(len(px), k, replace=False)]
    for _ in range(it):
        l = ((px[:, None] - c[None]) ** 2).sum(2).argmin(1)
        for j in range(k):
            if (l == j).any(): c[j] = px[l == j].mean(0)
    return c, ((px[:, None] - c[None]) ** 2).sum(2).argmin(1)
out = np.zeros_like(small)
for ty in range(17):
    for tx in range(17):
        t = small[ty*16:(ty+1)*16, tx*16:(tx+1)*16].reshape(-1, 3); c, l = kmeans(t, 7)
        out[ty*16:(ty+1)*16, tx*16:(tx+1)*16] = np.round(c[l]).reshape(16, 16, 3)
Image.fromarray(out.astype(np.uint8)).save('sheet1_16px.png'); print('saved sheet1_16px.png')
