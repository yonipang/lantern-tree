// ================= utils =================
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hash2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vn(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s) { return vn(x, y, s) * 0.55 + vn(x * 2.1, y * 2.1, s + 1) * 0.3 + vn(x * 4.3, y * 4.3, s + 2) * 0.15; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hexRgb(h) { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

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
// ================= audio =================
let AC = null, noiseBuf = null;
function ensureAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); const n = AC.sampleRate * 0.4; noiseBuf = AC.createBuffer(1, n, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function tone(f, dur, type = 'square', vol = 0.05, slide = 0) { if (!AC || !soundOn) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02); }
function nz(dur, vol, freq) { if (!AC || !soundOn) return; const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + .02); }
let lastPickSfx = 0;
const SFX = {
  hit: () => { tone(260, .09, 'square', .045, -140); nz(.05, .06, 1800); }, mine: () => { nz(.07, .09, 900); tone(180, .05, 'triangle', .03); }, brk: () => { nz(.16, .11, 500); tone(150, .14, 'triangle', .05, -70); },
  pick: () => { const n = performance.now(); if (n - lastPickSfx < 60) return; lastPickSfx = n; tone(880, .07, 'triangle', .045, 380); }, place: () => tone(330, .07, 'triangle', .06, -90),
  hurt: () => tone(170, .2, 'sawtooth', .05, -100), craft: () => { tone(660, .08, 'triangle', .05); setTimeout(() => tone(990, .1, 'triangle', .05), 70); }, eat: () => { tone(520, .09, 'sine', .07, -200); setTimeout(() => tone(620, .08, 'sine', .06, -200), 90); },
  clink: () => tone(1300, .05, 'square', .025), boss: () => { tone(90, .55, 'sawtooth', .07, -40); nz(.4, .06, 300); }, swing: () => nz(.06, .035, 2600),
  equip: () => tone(720, .05, 'triangle', .04, 200), purr: () => { tone(95, .25, 'triangle', .05, -15); setTimeout(() => tone(90, .25, 'triangle', .05, -15), 260); }, click: () => tone(1000, .03, 'square', .02), page: () => nz(.12, .04, 3200),
  sleep: () => [523, 440, 392, 330].forEach((f, i) => setTimeout(() => tone(f, .35, 'sine', .04), i * 220)),
  cast: () => { nz(.12, .04, 1800); tone(420, .12, 'sine', .03, 300); }, plop: () => tone(320, .09, 'sine', .05, -170), bite: () => { tone(880, .06, 'square', .04); setTimeout(() => tone(1175, .08, 'square', .04), 70); },
  catch: () => [660, 880, 1046].forEach((f, i) => setTimeout(() => tone(f, .12, 'triangle', .05), i * 70)), cast2: () => { tone(500, .25, 'sine', .04, -250); nz(.2, .03, 1200); },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .3, 'triangle', .06), i * 130)), seed: () => [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, .2, 'triangle', .05), i * 90)),
};

// ================= effects =================
function puff(x, y, col, n = 6, spd = 2.5, z = 0.3) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, s = spd * (0.4 + Math.random() * 0.8); G.parts.push({ x, y, z: z + Math.random() * .2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 1.5 + Math.random() * 2, life: .5 + Math.random() * .35, max: .8, col, sz: 1 + (Math.random() * 2 | 0) }); } }
function ftext(x, y, txt, col = '#fff1d6') { G.texts.push({ x, y, txt, col, life: 1, vy: -1.1 }); }
const toastKeys = {};
function placeToasts() { const g = document.querySelector('#goal'), box = $('#toasts'); if (!g || !box) return; const r = g.getBoundingClientRect(); if (r.width) { box.style.top = Math.round(r.bottom + 10) + 'px'; box.style.left = Math.round(r.left + 2) + 'px'; } }
function toast(msg, cls, key) {
  const now = performance.now(); if (key) { if (toastKeys[key] && now - toastKeys[key] < 2200) return; toastKeys[key] = now; }
  const box = $('#toasts'); placeToasts(); const el = document.createElement('div'); el.className = 'toast' + (cls ? ' ' + cls : ''); el.textContent = msg; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, cls === 'warn' ? 6500 : 2300);
}
function spawnDrop(id, c, x, y) { const a = Math.random() * 6.283; G.drops.push({ id, c, x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.1, z: 0.3, vz: 2.6, t: 0, hold: 0 }); }
function rollDrops(list, x, y) { for (const [id, a, b, ch] of list) if (Math.random() < (ch < 1 && petIs('rabbit') && rarOf(id) >= 2 ? Math.min(1, ch * 1.25) : ch)) { const c = rint(a, b); if (c > 0) spawnDrop(id, c + (Math.random() < skl('lucky') * 0.12 ? 1 : 0), x, y); } }

