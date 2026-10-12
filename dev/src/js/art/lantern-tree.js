// ---- lantern tree: six looks, one per planted light seed. The look follows G.treeSeeds only, so old saves need nothing new ----
const TREE_STAGE = ['잠든 나무', '새순', '잎이 차오름', '첫 꽃', '빛 열매', '완성'];
const TREE_BLESS = s => s >= 5 ? 18 : s >= 3 ? 12 : 0; // crops within this many tiles grow 20% faster
const TREE_SPREAD = [0, 0, 3.5, 5.5, 7.5, 9.5]; // moss and little flowers creep over the bare ground around the roots
// leaf palettes: dark, mid, light, lighter, shine, underside
const TREE_PAL = [
  ['#56605a', '#68736b', '#7a857c', '#8c968d', '#a4ada4', '#454e48'],
  ['#3f7a4c', '#5ea35a', '#8fd66a', '#b8f08a', '#e4ffc4', '#2f5e3a'],
  ['#2c7454', '#38896a', '#46a07a', '#5cb98c', '#9ee3bb', '#22593f'],
  ['#235f45', '#2c7552', '#3a8c62', '#4fa676', '#86d4a4', '#1a4a35'],
  ['#1d5740', '#276c4d', '#33845c', '#46a06f', '#7cc99a', '#163f2e'],
  ['#164a35', '#1e6044', '#287752', '#349064', '#56b47f', '#0f3626'],
];
const TREE_BARK = [['#7a7078', '#958b93', '#564d58'], ['#8c6a52', '#a8856a', '#5e4436'], [C.wood, C.woodL, C.woodD], [C.wood, C.woodL, C.woodD], ['#a86c3a', '#cf9860', '#74462a'], ['#a46838', '#cd955c', '#6e4127']];
// w,h: sprite size · cx/tw/top: trunk · br: branches [x0,y0,x1,y1,thick] · bl: leaf blobs back→front [cx,cy,rx,ry] · lan: seed lanterns (top of string) · small: extra lanterns · fruit: light fruits
const TREE_SPEC = [
  { w: 48, h: 60, cx: 24, tw: 10, top: 24, br: [[23, 32, 10, 17, 2], [10, 17, 5, 13, 1], [14, 22, 7, 23, 1], [25, 30, 38, 15, 2], [38, 15, 43, 11, 1], [34, 21, 41, 22, 1], [24, 27, 23, 8, 2], [23, 12, 18, 6, 1], [23, 10, 28, 5, 1]],
    tuft: [[5, 12], [43, 10], [18, 5], [28, 4], [41, 21]], lan: [[11, 17], [37, 16], [8, 23]] },
  { w: 48, h: 60, cx: 24, tw: 10, top: 24, br: [[23, 32, 10, 17, 2], [10, 17, 5, 13, 1], [14, 22, 7, 23, 1], [25, 30, 38, 15, 2], [38, 15, 43, 11, 1], [34, 21, 41, 22, 1], [24, 27, 23, 8, 2], [23, 12, 18, 6, 1], [23, 10, 28, 5, 1]],
    sprout: [[5, 12], [43, 10], [18, 5], [28, 4], [41, 21], [7, 22], [23, 7], [31, 22], [15, 19], [33, 14], [22, 15]], lan: [[11, 17], [37, 16], [8, 23]] },
  { w: 48, h: 60, cx: 24, tw: 12, top: 28, br: [], bl: [[12, 25, 10, 8], [36, 25, 10, 8], [24, 18, 21, 14]], lan: [[9, 31], [24, 34], [39, 31]], base: 1 },
  { w: 60, h: 70, cx: 30, tw: 12, top: 34, br: [[30, 42, 14, 34, 2], [30, 40, 46, 34, 2]], bl: [[13, 31, 11, 9], [47, 31, 11, 9], [30, 24, 26, 17], [30, 13, 15, 8]], lan: [[11, 37], [30, 42], [49, 37], [19, 26], [41, 26]], flowers: 16, base: 2 },
  { w: 68, h: 76, cx: 34, tw: 15, top: 40, br: [[34, 50, 9, 40, 3], [9, 40, 4, 37, 2], [34, 48, 59, 40, 3], [59, 40, 64, 37, 2]], bl: [[12, 36, 12, 10], [56, 36, 12, 10], [34, 28, 30, 19], [34, 15, 18, 10]], lan: [[12, 43], [34, 48], [56, 43], [22, 32], [46, 32]], flowers: 8, fruit: [[16, 30], [29, 22], [41, 24], [52, 30], [34, 37], [23, 39], [46, 40]], base: 3 },
  { w: 80, h: 84, cx: 40, tw: 17, top: 46, br: [[40, 58, 9, 46, 3], [9, 46, 3, 42, 2], [40, 56, 71, 46, 3], [71, 46, 77, 42, 2]], bl: [[11, 42, 12, 10], [69, 42, 12, 10], [22, 30, 15, 13], [58, 30, 15, 13], [40, 31, 33, 21], [40, 16, 22, 12]], lan: [[13, 49], [40, 54], [67, 49], [25, 40], [55, 40]],
    small: [[5, 38], [75, 38], [16, 27], [64, 27], [31, 18], [49, 18], [40, 8]], flowers: 6, fruit: [[20, 34], [33, 25], [47, 25], [60, 34], [40, 42]], base: 4, rim: 1 },
];
function leafBlob(A, R, cx, cy, rx, ry, P) {
  const n = Math.max(6, Math.round((rx + ry) / 2.6));
  A.e(cx, cy, rx * .86, ry * .84, P[0]);
  for (let k = 0; k < n; k++) { const a = k / n * 6.283 + R() * .35; A.e(cx + Math.cos(a) * rx * .7, cy + Math.sin(a) * ry * .68, rx * .3 + R() * 1.1, ry * .33 + R() * .9, P[0]); }
  A.e(cx, cy + ry * .62, rx * .66, ry * .26, P[5]);
  A.e(cx, cy - ry * .14, rx * .78, ry * .62, P[1]);
  for (let k = 0; k < n; k++) { const a = Math.PI * (1.05 + .9 * (k + .5) / n); A.e(cx + Math.cos(a) * rx * .6, cy - ry * .16 + Math.sin(a) * ry * .54, rx * .22 + R() * .9, ry * .25 + R() * .7, P[1]); }
  A.e(cx - rx * .16, cy - ry * .36, rx * .5, ry * .36, P[2]); A.e(cx + rx * .3, cy - ry * .28, rx * .28, ry * .24, P[2]);
  A.e(cx - rx * .3, cy - ry * .54, rx * .26, ry * .19, P[3]); A.e(cx + rx * .12, cy - ry * .6, rx * .2, ry * .14, P[3]);
  A.e(cx - rx * .38, cy - ry * .62, Math.max(1.3, rx * .1), Math.max(.8, ry * .06), P[4]); A.p(cx + rx * .1, cy - ry * .7, P[4]);
  for (let k = 0; k < rx * ry / 7; k++) { const a = R() * 6.283, d = Math.sqrt(R()) * .78, x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d), col = y < cy - ry * .25 ? P[1] : P[0]; A.p(x, y, col); A.p(x + 1, y - 1, col); }
}
function treeSprs(s) {
  const S = TREE_SPEC[s], P = TREE_PAL[s], B = TREE_BARK[s], R = rng(4021 + s * 97), hl = (S.cx - S.tw / 2) | 0, hr = hl + S.tw;
  const trunk = mk(S.w, S.h, A => {
    const by = S.h - 1;
    A.poly([[hl - 6, by], [hl + 1, by - 12], [hl + 3, by]], B[2]); A.poly([[hr + 6, by], [hr - 1, by - 12], [hr - 3, by]], B[2]); A.poly([[hl - 1, by], [hl + 3, by - 7], [hl + 5, by]], B[0]);
    if (s >= 4) { A.poly([[hl - 10, by], [hl - 1, by - 8], [hl, by]], B[2]); A.poly([[hr + 10, by], [hr + 1, by - 8], [hr, by]], B[2]); }
    for (const [x0, y0, x1, y1, t] of S.br) { A.line(x0, y0, x1, y1, B[2], t + 1); A.line(x0, y0 - 1, x1, y1 - 1, B[0], t); }
    A.r(hl, S.top, S.tw, by - S.top, B[0]); A.r(hl, S.top, 3, by - S.top, B[1]); A.r(hr - 3, S.top, 3, by - S.top, B[2]);
    for (let k = 0; k < S.tw / 3; k++) { const x = hl + 4 + ((R() * (S.tw - 7)) | 0), y0 = S.top + 3 + ((R() * (by - S.top - 18)) | 0); A.line(x, y0, x, y0 + 4 + ((R() * 6) | 0), B[2]); }
    const hx = S.cx, hy = by - 8, hw = S.tw * .28; A.e(hx, hy, hw + 1, 5.5, '#5e3519'); A.r(hx - hw - 1, hy, hw * 2 + 2, 7, '#5e3519'); A.e(hx, hy, hw, 4.5, '#7a4b2a'); A.r(hx - hw, hy, hw * 2, 6, '#7a4b2a'); A.p(hx + 2, hy + 2, s ? C.amber : '#8a7a70');
    if (S.base) { const mo = ['#5ea366', '#7cc271', '#9be37a'];
      for (let k = 0; k < 4 + S.base * 3; k++) { const left = k % 2, x = left ? hl - 2 - R() * (5 + S.base * 2) : hr + 2 + R() * (5 + S.base * 2), y = by - R() * 3; A.e(x, y, 2 + R() * 1.5, 1, mo[(R() * 2) | 0]); A.p(x, y - 1, mo[2]); }
      const fc = ['#ff8fa3', '#fff1d6', '#ffd25c', '#c2dcff']; for (let k = 0; k < S.base * 2 + 1; k++) { const x = k % 2 ? hl - 3 - R() * (4 + S.base * 2) : hr + 3 + R() * (4 + S.base * 2), y = by - 1 - R() * 2; A.p(x, y, fc[k % 4]); A.p(x, y - 1, '#5ea366'); } }
  });
  const canopy = mk(S.w, S.h, A => {
    for (const [x, y] of S.tuft || []) { A.e(x, y, 2, 1.2, P[0]); A.p(x - 1, y - 1, P[1]); }
    for (const [x, y] of S.sprout || []) { A.e(x - 1, y, 1.6, 1, P[1]); A.e(x + 1.2, y - 1, 1.6, 1, P[2]); A.p(x, y - 2, P[3]); A.p(x + 1, y - 2, P[4]); }
    for (const [x, y, rx, ry] of S.bl || []) leafBlob(A, R, x, y, rx, ry, P);
    const solid = (x, y) => x >= 0 && y >= 0 && x < S.w && y < S.h && A.g.getImageData(x, y, 1, 1).data[3] > 0;
    for (let k = 0, n = 0; n < (S.flowers || 0) && k < 400; k++) { const [bx, by2, rx, ry] = S.bl[(R() * S.bl.length) | 0], a = R() * 6.283, d = Math.sqrt(R()) * .8, x = Math.round(bx + Math.cos(a) * rx * d), y = Math.round(by2 + Math.sin(a) * ry * d);
      if (y > by2 + ry * .35 || !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) continue; n++;
      const pk = R() < .3 ? '#fff1f6' : '#ffb3c8'; A.p(x - 1, y, pk); A.p(x + 1, y, pk); A.p(x, y - 1, pk); A.p(x, y + 1, pk); A.p(x, y, '#ffe27a'); }
    for (const [x, y] of S.fruit || []) { A.p(x, y - 2, P[5]); A.e(x + .5, y + .5, 1.7, 1.7, '#ffc861'); A.p(x, y, '#fff3c4'); A.p(x + 1, y + 1, '#e8a23f'); }
    if (S.rim) for (let x = 2; x < S.w - 2; x++) { if (hash2(x, s, 77) > .12) continue; let y = 0; while (y < S.h && !solid(x, y)) y++; if (y >= S.h - 30) continue; A.p(x, y, '#ffd98a'); if (solid(x + 1, y)) A.p(x + 1, y, '#f2e3a8'); if (solid(x, y + 1)) A.p(x, y + 1, P[3]); }
  });
  // canopy bounds (for see-through) from the drawn pixels
  const d = canopy.getContext('2d').getImageData(0, 0, S.w, S.h).data; let x0 = S.w, x1 = 0, y0 = S.h, y1 = 0;
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) if (d[(y * S.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { s, w: S.w, h: S.h, trunk, canopy, lan: S.lan, small: S.small || [], fruit: S.fruit || [], box: { x0, x1, y0, y1 } };
}
const lanternSpr = on => mk(9, 11, A => { A.r(4, 0, 1, 3, C.woodD); A.r(2, 3, 5, 1, C.woodD); A.r(2, 4, 5, 5, on ? '#ffcf6b' : '#5a4a52'); A.r(3, 5, 3, 3, on ? '#fff3c4' : '#6e5c66'); A.r(2, 9, 5, 1, C.woodD); });
const lanternSmallSpr = () => mk(5, 8, A => { A.r(2, 0, 1, 2, C.woodD); A.r(1, 2, 3, 1, C.woodD); A.r(1, 3, 3, 3, '#ffcf6b'); A.p(2, 4, '#fff3c4'); A.r(1, 6, 3, 1, C.woodD); });
function spreadSprs() {
  const mo = ['#4a8a50', '#62ad62', '#7cc271', '#9be37a'];
  SPR.tmoss = [0, 1, 2].map(v => mk(10, 6, A => { const R = rng(311 + v); for (let k = 0; k < 5 + v; k++) { const x = 1 + R() * 8, y = 2 + R() * 3; A.p(x, y, mo[(R() * 2) | 0]); A.p(x, y - 1, mo[2]); if (R() < .4) A.p(x + 1, y - 2, mo[3]); } }, null));
  SPR.tflower = {}; for (const c of ['R', 'B', 'Y', 'W']) { const F = FLOWERS[c]; SPR.tflower[c] = mk(5, 6, A => { A.p(2, 5, '#4a8a50'); A.p(2, 4, '#62ad62'); A.p(1, 2, F[2]); A.p(3, 2, F[2]); A.p(2, 1, F[2]); A.p(2, 3, F[4]); A.p(2, 2, c === 'Y' ? '#fff1b0' : '#ffe27a'); }, null); }
}

