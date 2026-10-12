// ================= lighting =================
let LX0 = 0, LY0 = 0, LW = 0, LH = 0, LR = null, LG = null, LB = null, lightCv = null, lightCtx = null, lightImg = null, LIGHTS = [];
function lightAt(x, y) { const i = (y - LY0) * LW + (x - LX0); if (x < LX0 || y < LY0 || x >= LX0 + LW || y >= LY0 + LH) return 0; return (LR[i] + LG[i] + LB[i]) / 3; }
function los(x0, y0, x1, y1) { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, x = x0, y = y0; while (true) { if (x === x1 && y === y1) return true; if (!(x === x0 && y === y0) && G.wall[idx(x, y)]) return false; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } } }
function computeLight() {
  if (!G) return; const cw = cv.width, ch = cv.height;
  const camX = cam.x * TP - cw / 2, camY = cam.y * TP - ch / 2;
  const x0 = Math.floor(camX / TP) - 2, x1 = Math.ceil((camX + cw) / TP) + 2, y0 = Math.floor(camY / TP) - 3, y1 = Math.ceil((camY + ch) / TP) + 3;
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  if (w !== LW || h !== LH || !LR) { LW = w; LH = h; LR = new Float32Array(w * h); LG = new Float32Array(w * h); LB = new Float32Array(w * h); lightCv.width = w; lightCv.height = h; lightImg = lightCtx.createImageData(w, h); }
  LX0 = x0; LY0 = y0;
  const amb = 0.075 + G.treeSeeds * 0.03; LR.fill(amb * 0.85); LG.fill(amb * 0.8); LB.fill(amb * 1.35);
  const lights = []; const p = G.p;
  lights.push({ x: p.x, y: p.y - .3, r: 4.6 * (1 + bval('light')), c: [1, .9, .75], k: 0.95 });
  lights.push({ x: CX + .5, y: CY - .2, r: 7 + G.treeSeeds * 3.5, c: [1, .85, .55], k: 1.1, col: '#ffd27a' });
  const t = G.time;
  for (let y = y0 - 8; y <= y1 + 8; y++) for (let x = x0 - 8; x <= x1 + 8; x++) {
    if (!inB(x, y)) continue; if (G.floor[idx(x, y)] === LAVA && !G.wall[idx(x, y)] && (x * 7 + y * 3) % 4 === 0) lights.push({ x: x + .5, y: y + .5, r: 3.4, c: [1, .5, .2], k: .9 });
    const o = G.objs.get(idx(x, y)); if (!o) continue; const d = OBJ[o.t];
    let L = d.light; if (o.t === 'shrine' && o.has) L = [4.5, '#ffd97a']; if (o.t === 'tchest' && (o.open || o.hid)) L = null; if (o.t === 'cropGlow') { const cs = cropStage(o); L = cs >= 3 ? [2.6, '#6ff2e6'] : cs >= 2 ? [1.4, '#6ff2e6'] : null; } if (o.t === 'cropFire') L = cropStage(o) >= 3 ? [2, '#ff9b4a'] : null; if (!L || o.off) continue;
    const fl = d.flick ? 1 + Math.sin(t * 9 + x * 3) * 0.05 + Math.sin(t * 23 + y) * 0.03 : 1;
    lights.push({ x: x + (d.sz ? fpOf(o)[0] / 2 : .5), y: y + (d.sz ? fpOf(o)[1] / 2 : .5), r: L[0] * fl, c: hexRgb(L[1]), k: 1, col: L[1], tall: SPR.obj[o.t] && effH(SPR.obj[o.t]) > 20 });
  }
  for (const k of BKEYS) { const b = G.bosses[k]; if (!G.bossDead[k] && b.st === 'fight') lights.push({ x: b.x, y: b.y - .5, r: 5, c: hexRgb(BOSSES[k].col), k: 1 }); }
  for (const h of G.hz || []) if (h.k === 'lava' && h.t >= h.warn) lights.push({ x: h.x, y: h.y, r: 2.6, c: [1, .55, .2], k: .9 });
  LIGHTS = lights;
  for (const L of lights) {
    const sx = Math.floor(L.x), sy = Math.floor(L.y), r = L.r, r2 = r * r;
    const ya = Math.max(y0, Math.floor(L.y - r)), yb = Math.min(y1, Math.ceil(L.y + r)), xa = Math.max(x0, Math.floor(L.x - r)), xb = Math.min(x1, Math.ceil(L.x + r));
    for (let ty = ya; ty <= yb; ty++) for (let tx = xa; tx <= xb; tx++) {
      if (!inB(tx, ty)) continue; const dx = tx + .5 - L.x, dy = ty + .5 - L.y, d2 = dx * dx + dy * dy; if (d2 > r2) continue;
      let f = Math.pow(1 - Math.sqrt(d2) / r, 1.25) * L.k; if (!(tx === sx && ty === sy) && !los(sx, sy, tx, ty)) f *= 0.1; if (f < 0.01) continue;
      const i = (ty - y0) * w + (tx - x0); LR[i] += f * L.c[0]; LG[i] += f * L.c[1]; LB[i] += f * L.c[2];
    }
  }
  const D = lightImg.data;
  for (let i = 0; i < w * h; i++) {
    const r = Math.min(1, LR[i]), g = Math.min(1, LG[i]), b = Math.min(1, LB[i]);
    D[i * 4] = r * 255; D[i * 4 + 1] = g * 255; D[i * 4 + 2] = b * 255; D[i * 4 + 3] = 255;
    if (r + g + b > 0.95) { const tx = x0 + i % w, ty = y0 + (i / w | 0); if (inB(tx, ty)) { const j = idx(tx, ty); if (!G.explored[j]) { G.explored[j] = 1; mapPixel(tx, ty); } } }
  }
  lightCtx.putImageData(lightImg, 0, 0);
}

// ================= map =================
let mapCv = null, mapCtx = null, mapImg = null;
const MAPF = { 7: '#6fb36a', 8: '#7f6191', 9: '#958ccf', 10: '#3f7fb5', 1: '#4f8f57', 2: '#7a5442', 3: '#6a5272', 4: '#4a5378', 5: '#c08a58', 6: '#8f8aa3' };
Object.assign(MAPF, { 21: '#7a6a3a', 17: '#ff6a2a', 18: '#4a3f48', 19: '#c8dcef', 20: '#a8e0f8', 11: '#6fb6e0', 12: '#3f7fb5', 13: '#5b9bd0', 14: '#8a7ad0', 15: '#7fb0d8', 16: '#e8a8c0' });
const MAPW = { 13: '#8a72d0', 9: '#2e2832', 10: '#c9a03a', 11: '#9cc8e8', 12: '#5ad8f0', 1: '#3a2a25', 2: '#38364a', 3: '#4a3a78', 4: '#a85f32', 5: '#8d97a8', 6: '#8a5a32', 7: '#6f6a86', 8: '#0b0910' };
function rebuildMap() { chunks.clear(); AMB.length = 0; if (!mapCv || mapCv.width !== W) { mapCv = document.createElement('canvas'); mapCv.width = W; mapCv.height = H; mapCtx = mapCv.getContext('2d'); } mapImg = mapCtx.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G.explored[idx(x, y)]) mapPixel(x, y, true); mapCtx.putImageData(mapImg, 0, 0); }
function mapPixel(x, y, bulk) {
  const i = idx(x, y); if (!G.explored[i] || !mapImg) return; const w = G.wall[i]; const col = w ? MAPW[w] : MAPF[G.floor[i]] || '#555';
  const [r, g, b] = hexRgb(col); const k = i * 4; mapImg.data[k] = r * 255; mapImg.data[k + 1] = g * 255; mapImg.data[k + 2] = b * 255; mapImg.data[k + 3] = 255; if (!bulk) mapDirty = true;
}
let mapDirty = false;

