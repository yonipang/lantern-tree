// ================= sprites =================
const INK = '#241b2f';
const C = {
  skin: '#ffe0c2', blush: '#f59bab', mint: '#6cc9a3', mintD: '#479b7f', mintL: '#a5ecc9',
  leaf: '#5bbf4f', leafD: '#3b8a3a', leafL: '#9be37a', wood: '#b0743f', woodD: '#7d4d2a', woodL: '#d9a066',
  stone: '#8f8aa3', stoneD: '#625d78', stoneL: '#b9b4cc', dirt: '#7a5038', dirtD: '#5a3929', dirtL: '#9c6a4a',
  copper: '#e5884a', copperL: '#ffb57a', copperD: '#b8642f', iron: '#c8d0dc', ironL: '#eef2f7', ironD: '#8d97a8',
  cry: '#b493f5', cryL: '#e3d4ff', cryD: '#7a5cc4', rose: '#ff8fa3', roseD: '#d9607d', cream: '#fff1d6',
  amber: '#ffc861', fire: '#ff8a3d', glow: '#5fe3d6', glowL: '#d9fffb', berry: '#d94f7a', berryL: '#ff9ab8'
};
function inPoly(x, y, pts) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins; } return ins; }
function outline(c, col) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  const d = g.getImageData(0, 0, w, h), s = d.data, o = new Uint8ClampedArray(s);
  const [r, gg, b] = hexRgb(col).map(v => Math.round(v * 255));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (s[i + 3]) continue;
    if ((x > 0 && s[i - 1]) || (x < w - 1 && s[i + 7]) || (y > 0 && s[i - w * 4 + 3]) || (y < h - 1 && s[i + w * 4 + 3])) { o[i] = r; o[i + 1] = gg; o[i + 2] = b; o[i + 3] = 255; }
  }
  g.putImageData(new ImageData(o, w, h), 0, 0);
}
let MKDEF = null;
function softShadow(c) {
  const w = c.width, h = c.height, g = c.getContext('2d'), d = g.getImageData(0, 0, w, h), s = d.data, o = new Uint8ClampedArray(s);
  for (let y = 1; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (s[i + 3] || !s[i - w * 4 + 3]) continue; o[i] = 18; o[i + 1] = 10; o[i + 2] = 28; o[i + 3] = 80; }
  g.putImageData(new ImageData(o, w, h), 0, 0);
}
function outlineHD(c) { // for 32px art: a darker, half see-through edge in the colour of the picture itself
  const w = c.width, h = c.height, g = c.getContext('2d'), d = g.getImageData(0, 0, w, h), s = d.data, o = new Uint8ClampedArray(s);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (s[i + 3]) continue; let r = 0, gg = 0, b = 0, n = 0;
    for (const j of [x > 0 ? i - 4 : -1, x < w - 1 ? i + 4 : -1, y > 0 ? i - w * 4 : -1, y < h - 1 ? i + w * 4 : -1]) if (j >= 0 && s[j + 3]) { r += s[j]; gg += s[j + 1]; b += s[j + 2]; n++; }
    if (!n) continue; o[i] = r / n * .45; o[i + 1] = gg / n * .5; o[i + 2] = b / n * .55; o[i + 3] = 140; }
  g.putImageData(new ImageData(o, w, h), 0, 0);
}
function outlineSel(c) {
  const w = c.width, h = c.height, g = c.getContext('2d');
  const d = g.getImageData(0, 0, w, h), s = d.data, o = new Uint8ClampedArray(s);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (s[i + 3]) continue; let r = 0, gg = 0, b = 0, n = 0;
    for (const j of [x > 0 ? i - 4 : -1, x < w - 1 ? i + 4 : -1, y > 0 ? i - w * 4 : -1, y < h - 1 ? i + w * 4 : -1]) if (j >= 0 && s[j + 3]) { r += s[j]; gg += s[j + 1]; b += s[j + 2]; n++; }
    if (!n) continue; o[i] = r / n * .2 + 36 * .55; o[i + 1] = gg / n * .2 + 27 * .55; o[i + 2] = b / n * .2 + 47 * .55; o[i + 3] = 255;
  }
  g.putImageData(new ImageData(o, w, h), 0, 0);
}
function mk(w, h, fn, ol) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  const A = {
    g,
    r(x, y, ww, hh, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); },
    p(x, y, col) { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), 1, 1); },
    e(cx, cy, rx, ry, col) { g.fillStyle = col; for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) g.fillRect(x, y, 1, 1); } },
    poly(pts, col) { g.fillStyle = col; let mx = 1e9, my = 1e9, Mx = -1e9, My = -1e9; for (const [a, b] of pts) { mx = Math.min(mx, a); my = Math.min(my, b); Mx = Math.max(Mx, a); My = Math.max(My, b); } for (let y = Math.floor(my); y <= Math.ceil(My); y++) for (let x = Math.floor(mx); x <= Math.ceil(Mx); x++) if (inPoly(x + .5, y + .5, pts)) g.fillRect(x, y, 1, 1); },
    line(x0, y0, x1, y1, col, t = 1) { g.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1; for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), t, t); }
  };
  fn(A);
  if (ol === undefined) ol = MKDEF || INK;
  if (ol === 'sel') outlineSel(c); else if (ol === 'soft') softShadow(c); else if (ol !== null) outline(c, ol);
  c.ol = ol; return c;
}
function whiten(c) { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const g = k.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff'; g.fillRect(0, 0, k.width, k.height); k.hd = c.hd; return k; }
// ---- art pixels per game pixel. v53: back to 16px tiles (HD = 1) — the world is drawn 1:1 in game pixels again and hand-drawn
// art from ART is 16px per tile like the built-in sprites. (v49–v52 used HD = 2: 32px tiles, each old pixel drawn as 2×2.)
const HD = 1;
const effW = img => img.hd ? img.width / HD : img.width, effH = img => img.hd ? img.height / HD : img.height;
function hdCtx(g) { if (g.__hd) return g; const orig = g.drawImage.bind(g); g.drawImage = function (img, a, b) { if (arguments.length === 3 && img && img.hd) return orig(img, a, b, img.width / HD, img.height / HD); return orig.apply(null, arguments); }; g.__hd = true; return g; }
