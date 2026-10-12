// tiles
const FPAL = { 7: ['#5f9e5c', '#6fb36a', '#4a7f48'], 8: ['#6a4f7a', '#7f6191', '#55406a'], 9: ['#7c74b8', '#958ccf', '#625a9c'], 1: ['#4f8f57', '#5ea366', '#447d4c'], 2: ['#6e4a3a', '#7d5743', '#5e3d30'], 3: ['#5a4560', '#6a5272', '#4a3850'], 4: ['#3d4566', '#4a5378', '#323a58'], 5: ['#b07a4a', '#c48d5a', '#7d5233'], 6: ['#7f7a92', '#948fa6', '#5d5872'] };
function floorTex(t, v) {
  if (t >= 17) return regFloorTex(t, v);
  if (t >= 11) return natFloorTex(t, v);
  const R = rng(t * 977 + v * 131 + 7), pal = FPAL[t];
  const P = (A, x, y, col) => A.p(((x % 16) + 16) % 16, ((y % 16) + 16) % 16, col);
  return mk(16, 16, A => {
    if (t === 1) { A.r(0, 0, 16, 16, '#468a4f');
      for (let k = 0; k < 26; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#3c7a46'); P(A, x + 1, y, '#3c7a46'); }
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0, c = R() < .5 ? '#58a05c' : '#62ad62'; P(A, x, y + 1, '#356c40'); P(A, x, y, c); P(A, x, y - 1, c); P(A, x + (R() < .5 ? 1 : -1), y - 2, '#7cc271'); }
      for (let k = 0; k < 5; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#8fd27a');
      if (v === 0) P(A, 4, 5, '#ffd36b'); if (v === 2) P(A, 11, 10, '#fff1d6'); return; }
    if (t === 2) { A.r(0, 0, 16, 16, '#6b4838');
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#5e3d30'); P(A, x + 1, y, '#5e3d30'); }
      for (let k = 0; k < 12; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#7a5442');
      for (let k = 0; k < 3; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#9a8478'); P(A, x + 1, y, '#857066'); P(A, x, y + 1, '#4a3127'); P(A, x + 1, y + 1, '#4a3127'); } return; }
    if (t === 3) { A.r(0, 0, 16, 16, '#544060');
      for (let k = 0; k < 22; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#4a3756'); P(A, x, y + 1, '#4a3756'); }
      for (let k = 0; k < 14; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#614c6e');
      for (let k = 0; k < 4; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#5f6f57'); P(A, x + 1, y, '#6a7d60'); }
      for (let k = 0; k < 3; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#c49ae0'); P(A, x, y + 1, '#3d2c48'); } return; }
    if (t === 4) { A.r(0, 0, 16, 16, '#3d4566');
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#353c5a'); P(A, x + 1, y, '#353c5a'); }
      for (let k = 0; k < 12; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#4a5378');
      { let x = R() * 16 | 0, y = R() * 16 | 0; for (let k = 0; k < 6; k++) { P(A, x, y, '#2c3250'); x += R() < .5 ? 1 : 0; y += R() < .6 ? 1 : 0; } }
      if (v % 2 === 0) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#c9b8ff'); P(A, x + 1, y, '#8f84d0'); } return; }
    if (t === 5) { A.r(0, 0, 16, 16, '#a8743f');
      for (let y = 0; y < 16; y += 4) { A.r(0, y, 16, 1, '#c08a52'); A.r(0, y + 3, 16, 1, '#7d5233'); const j = ((y / 4 + v) % 2) ? 5 : 11; A.r(j, y, 1, 3, '#7d5233'); A.p(j - 1, y + 1, '#d8b48a');
        for (let k = 0; k < 2; k++) A.r(R() * 13 | 0, y + 1 + (R() * 2 | 0), 2 + (R() * 3 | 0), 1, '#96643a'); } return; }
    if (t === 6) { A.r(0, 0, 16, 16, '#565170');
      const jit = () => (R() * 2 | 0);
      for (const [x, y, w, h] of [[1, 1, 6 + jit(), 6], [9, 1, 6, 5 + jit()], [1, 9, 5, 6], [7, 8, 8, 7]]) { A.r(x, y, w, h, '#8a85a0'); A.r(x, y, w, 1, '#a7a2bb'); A.r(x, y, 1, h, '#9a95b0'); A.r(x, y + h - 1, w, 1, '#6c6786'); A.r(x + w - 1, y, 1, h, '#726d8c'); A.p(x + 2, y + 2, '#9994ae'); }
      return; }
    A.r(0, 0, 16, 16, pal[0]);
    if (t === 5) { for (let y = 0; y < 16; y += 4) { A.r(0, y, 16, 1, pal[1]); A.r(0, y + 3, 16, 1, pal[2]); const j = ((y / 4 + v) % 2) ? 5 : 11; A.r(j, y, 1, 3, pal[2]); } A.p(3, 1, '#c99a6a'); A.p(13, 9, '#c99a6a'); return; }
    if (t === 7) { A.r(0, 7, 16, 1, pal[2]); A.r(7, 0, 1, 16, pal[2]); A.r(0, 15, 16, 1, pal[2]); A.r(15, 0, 1, 16, pal[2]); A.r(0, 0, 7, 1, pal[1]); A.r(8, 8, 7, 1, pal[1]); A.p(3, 4, '#9be37a'); A.p(4, 3, '#9be37a'); if (v % 2) A.p(11, 11, '#ffd36b'); return; }
    if (t === 8) { for (const [x, y] of [[4, 4], [12, 4], [8, 12], [0, 12], [16, 12]]) A.e(x, y, 3.3, 3.3, pal[1]); A.p(3, 3, '#d9bfe8'); A.p(11, 3, '#d9bfe8'); A.p(7, 11, '#d9bfe8'); return; }
    if (t === 9) { A.poly([[8, 0], [16, 8], [8, 16], [0, 8]], pal[1]); A.line(0, 8, 8, 0, pal[2]); A.line(8, 0, 16, 8, pal[2]); A.line(16, 8, 8, 16, pal[2]); A.line(8, 16, 0, 8, pal[2]); A.p(8, 5, '#ffffff'); if (v % 2) A.p(3, 3, '#e3d4ff'); return; }
    if (t === 6) { A.r(0, 7, 16, 1, pal[2]); A.r(0, 15, 16, 1, pal[2]); A.r(7, 0, 1, 7, pal[2]); A.r(15, 0, 1, 7, pal[2]); A.r(3, 8, 1, 7, pal[2]); A.r(11, 8, 1, 7, pal[2]); A.r(0, 0, 7, 1, pal[1]); A.r(8, 0, 7, 1, pal[1]); A.r(0, 8, 3, 1, pal[1]); A.r(4, 8, 7, 1, pal[1]); A.r(12, 8, 4, 1, pal[1]); return; }
    for (let k = 0; k < 24; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1 + (R() * 2 | 0)]);
    for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 2 + R() * 12 | 0; A.p(x, y, pal[1]); A.p(x + 1, y, pal[1]); A.p(x, y + 1, pal[2]); }
    if (t === 1) { for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 3 + R() * 11 | 0; A.p(x, y, '#72bb72'); A.p(x + 1, y - 1, '#72bb72'); A.p(x - 1, y - 1, '#5ea366'); } if (v === 0) { A.p(5, 5, '#ffd36b'); A.p(11, 11, '#ff9ab0'); } if (v === 2) A.p(9, 4, '#fff1d6'); }
    if (t === 2) { const x = 3 + R() * 9 | 0, y = 3 + R() * 9 | 0; A.p(x, y, '#8f7a72'); A.p(x + 1, y, '#a48f86'); }
    if (t === 3) { for (let k = 0; k < 3; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#b98ad0'); }
    if (t === 4) { for (let k = 0; k < 2; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#a99cf0'); A.r(0, 0, 16, 1, '#454e72'); A.r(0, 0, 1, 16, '#454e72'); }
  }, null);
}
const WPAL = { 13: ['#4b3f78', '#5b4d8f', '#3c3263'], 9: ['#3a3340', '#4a414f', '#2a2430'], 10: ['#3a3340', '#4a414f', '#2a2430'], 11: ['#8fc4e8', '#b8e0f8', '#6a9cc8'], 12: ['#8fc4e8', '#b8e0f8', '#6a9cc8'], 1: ['#8a5a3e', '#9c6a4a', '#704630'], 2: ['#8e89a3', '#a29db6', '#6f6a86'], 3: ['#4b3f78', '#5b4d8f', '#3c3263'], 4: ['#8a5a3e', '#9c6a4a', '#704630'], 5: ['#8e89a3', '#a29db6', '#6f6a86'], 6: ['#a06a3c', '#b97e4a', '#7d4d2a'], 7: ['#a59fb8', '#bab5cb', '#6f6a86'], 8: ['#2b2238', '#352a45', '#221b2d'] };
const WFRONT_COL = { 13: '#33295a', 9: '#221c28', 10: '#221c28', 11: '#5a88b0', 12: '#5a88b0', 1: '#5e3b29', 2: '#5e5a74', 3: '#33295a', 4: '#5e3b29', 5: '#5e5a74', 6: '#6e4426', 7: '#77718c', 8: '#1a1424' };
function wallTop(t, v) {
  const R = rng(t * 733 + v * 97 + 3), pal = WPAL[t];
  return mk(16, 16, A => {
    A.r(0, 0, 16, 16, pal[0]);
    if (t === 6) { for (const x of [0, 5, 10, 15]) { A.r(x, 0, 1, 16, pal[2]); if (x < 15) A.r(x + 1, 0, 1, 16, pal[1]); } A.p(3, 3, pal[2]); A.p(8, 12, pal[2]); A.p(13, 6, pal[2]); return; }
    if (t === 7) { for (let y = 0; y < 16; y += 4) { A.r(0, y + 3, 16, 1, pal[2]); A.r(0, y, 16, 1, pal[1]); const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) A.r(x, y, 1, 3, pal[2]); } return; }
    for (let k = 0; k < 5; k++) A.e(R() * 16, R() * 16, 1 + R() * 2, 1 + R() * 1.4, pal[2]);
    for (let k = 0; k < 4; k++) A.e(R() * 16, R() * 16, 0.8 + R() * 1.5, 0.7 + R(), pal[1]);
    for (let k = 0; k < 10; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1 + (R() * 2 | 0)]);
    if (t === 3) for (let k = 0; k < 9; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, k % 3 ? '#8a7ab0' : '#c9a8c0'); if (k % 4 === 0) A.p(x + 1, y, '#2c2450'); }
    if (t === 13) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 4 + R() * 9; A.poly([[x, y - 3], [x + 2, y], [x, y + 2], [x - 2, y]], '#e8e0ff'); A.p(x | 0, (y - 1) | 0, '#ffffff'); A.p((x + 1) | 0, y | 0, C.cryL); }
    if (t === 4) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.7, 1.4, C.copper); A.p(x - 1, y - 1, C.copperL); A.p(x + 1, y, C.copperD); }
    if (t === 5) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.6, 1.3, C.iron); A.p(x - 1, y - 1, '#ffffff'); A.p(x + 1, y, C.ironD); }
    if (t === 9 || t === 10) { let x = R() * 16 | 0, y = R() * 16 | 0; for (let k = 0; k < 7; k++) { A.p(x, y, k % 3 ? '#c4441a' : '#ff8a3d'); x = (x + (R() < .5 ? 1 : 0)) % 16; y = (y + (R() < .7 ? 1 : 0)) % 16; } }
    if (t === 10) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.6, 1.3, '#ffd25c'); A.p(x - 1, y - 1, '#fff1b0'); A.p(x + 1, y, '#c9902a'); }
    if (t === 11 || t === 12) { for (let k = 0; k < 3; k++) { const x = R() * 14 | 0, y = R() * 14 | 0; A.p(x, y, '#ffffff'); A.p(x + 1, y + 1, '#e8f8ff'); } }
    if (t === 12) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.poly([[x, y - 2.5], [x + 1.6, y], [x, y + 2], [x - 1.6, y]], '#5ad8f0'); A.p(x | 0, (y - 1) | 0, '#ffffff'); }
  }, null);
}
function wallFront(t) {
  return mk(16, 5, A => { const c = WFRONT_COL[t]; A.r(0, 0, 16, 5, c); for (let x = 1; x < 16; x += 3) A.r(x, 1, 1, 3, 'rgba(255,255,255,0.07)'); A.r(0, 4, 16, 1, '#1d1424'); A.r(0, 0, 16, 1, 'rgba(255,255,255,0.06)');
    if (t === 4) A.p(6, 2, C.copper); if (t === 5) A.p(9, 2, C.iron); if (t === 10) A.p(7, 2, '#ffd25c'); if (t === 12) A.p(10, 2, '#7ff0ff'); if (t === 9) A.p(4, 3, '#c4441a'); if (t === 3) { A.p(4, 2, '#8a7ab0'); A.p(11, 1, '#8a7ab0'); } if (t === 13) { A.p(4, 2, '#e8e0ff'); A.p(11, 1, '#e8e0ff'); } if (t === 7) { A.r(0, 2, 16, 1, '#5e5a74'); A.r(7, 0, 1, 2, '#5e5a74'); } }, null);
}
function crackSpr(n) { return mk(16, 16, A => { const c = 'rgba(30,18,34,0.75)'; A.line(8, 8, 4, 4, c); A.line(8, 8, 12, 6, c); if (n > 0) { A.line(8, 8, 6, 13, c); A.line(4, 4, 2, 6, c); } if (n > 1) { A.line(8, 8, 13, 12, c); A.line(12, 6, 14, 2, c); A.line(6, 13, 3, 14, c); } }, null); }

const PRI = { 1: 4, 3: 3, 4: 2, 2: 1, 18: .5, 19: .6 };
function rotCanvas(c, q) { if (!q) return c; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const g = k.getContext('2d'); g.translate(8, 8); g.rotate(q * Math.PI / 2); g.drawImage(c, -8, -8); return k; }
function makeFringe(t, mode, part = 'all') {
  // mode: 'edge' (land over land), 'water' (land over water with foam)
  const src = SPR.floor[t][1].getContext('2d').getImageData(0, 0, 16, 16).data, R = rng(t * 53 + (mode === 'water' ? 7 : 1));
  const depth = []; let d = 2.5; for (let i = 0; i < 16; i++) { d += (R() - .5) * 1.5; d = clamp(d, 1.2, 4.2); depth.push(Math.round(d)); }
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), im = g.createImageData(16, 16), D = im.data;
  const set = (x, y, r, gg, b, a) => { if (y < 0 || y > 15) return; const k = (y * 16 + x) * 4; D[k] = r; D[k + 1] = gg; D[k + 2] = b; D[k + 3] = a; };
  for (let x = 0; x < 16; x++) { const dp = depth[x];
    if (part !== 'fx') for (let y = 0; y < dp; y++) { const k = (y * 16 + x) * 4; set(x, y, src[k], src[k + 1], src[k + 2], 255); }
    if (part !== 'land') { if (mode === 'water') { set(x, dp, 225, 244, 255, 210); set(x, dp + 1, 200, 232, 255, 90); } else set(x, dp, 20, 12, 30, 70); }
    if (dp > 1 && part !== 'fx') { const k = ((dp - 1) * 16 + x) * 4; set(x, dp - 1, Math.min(255, src[k] * 1.12), Math.min(255, src[k + 1] * 1.12), Math.min(255, src[k + 2] * 1.12), 255); }
  }
  g.putImageData(im, 0, 0); return [0, 1, 2, 3].map(q => rotCanvas(c, q));
}
function makeCorner(t, mode) {
  const src = SPR.floor[t][2].getContext('2d').getImageData(0, 0, 16, 16).data;
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), im = g.createImageData(16, 16), D = im.data;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { const r = Math.hypot(x + .5, y + .5), k = (y * 16 + x) * 4;
    if (r < 3.2) { D[k] = src[k]; D[k + 1] = src[k + 1]; D[k + 2] = src[k + 2]; D[k + 3] = 255; }
    else if (r < 4.3) { if (mode === 'water') { D[k] = 225; D[k + 1] = 244; D[k + 2] = 255; D[k + 3] = 170; } else { D[k] = 20; D[k + 1] = 12; D[k + 2] = 30; D[k + 3] = 60; } } }
  g.putImageData(im, 0, 0); return [0, 1, 2, 3].map(q => rotCanvas(c, q));
}
