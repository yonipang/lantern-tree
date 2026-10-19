// ================= 그리기 조각: 얇은 벽·문 그림, 회전 그림, 위험 지대, 등불나무 그리기·잎·빛, 반짝이 진행, 동물 그림, 회수 막대 (10단계에서 render/로 정리) =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { ANIM_DRAW } from '../art/content.js';
import { ARTC } from '../art/hand-art.js';
import { artPaint, glowSprite, SPR, TREE_BLESS, TREE_PAL } from '../art/world.js';
import { RECOVER_GAP, RECOVER_HITS } from '../data/controls.js';
import { OBJ } from '../data/items.js';
import { INK, mk, MKDEF } from '../engine/canvas.js';
import { fxRand, hash2 } from '../engine/random.js';
import { clamp } from '../engine/util.js';
import { ctx, drawImg, shadow, Z } from './view.js';
import { G } from '../save/state.js';
import { bmat, rotN, twH } from '../sim/building.js';
import { HITS } from '../sim/gathering.js';
import { onFrame } from '../sim/systems.js';
import { spreadKind, treeStage } from '../sim/tree.js';
import { CX, CY, idx, inB } from '../world/map.js';
export const TW_BASE = 4; // pieces are drawn in their own coordinates with the footprint line at y=12, then moved down onto the tile's bottom line
// draws one piece in tile coordinates (tile top at y0); the piece rises h px above its footprint line. open: 0..1 (a sliding door slides part way)
export function twDraw(A, type, mat, mask, open, h, y0) {
  y0 += TW_BASE;
  const M = bmat(mat), R = (x, y, w, hh, c) => { if (w > 0 && hh > 0) A.r(x, y0 + y, w, hh, c); }, P = (x, y, c) => A.p(x, y0 + y, c);
  const N = mask & 1, E = mask & 2, S = mask & 4, Wm = mask & 8, jw = mask & 16, je = mask & 32, ew = E || Wm || !(N || S), x0 = Wm ? 0 : 6, x1 = E ? 16 : 10;
  const face = (a, b) => { R(a, 12 - h, b - a, h, M.f); R(a, 11, b - a, 1, M.fd);
    if (mat === 'wood') { for (let x = a; x < b; x++) if (x % 4 === 0) R(x, 12 - h, 1, h - 1, M.fd); }
    else if (mat === 'metal') { R(a, 12 - h + 2, b - a, 1, M.fl); R(a, 12 - h + 9, b - a, 1, M.fd); }
    else for (let r = 0, y = 12 - h + 3; y < 11; y += 4, r++) { R(a, y, b - a, 1, M.fd); for (let x = a + (r % 2 ? 2 : 0); x < b; x += 5) R(x, y - 3, 1, 3, M.fd); } };
  const cap = (a, b, ya, yb, col) => { R(a, ya - h, b - a, yb - ya, col || M.c); };
  if (type === 'pillar') { R(6, 12 - h, 4, h, M.f); R(6, 12 - h, 1, h, M.fl); R(9, 12 - h, 1, h, M.fd); R(5, 8 - h, 6, 4, M.c); R(5, 11 - h, 6, 1, M.cd); R(5, 10, 6, 2, M.fd); return; }
  if (type === 'fence') { const rail = (a, b) => { R(a, 12 - h + 2, b - a, 2, M.fl); R(a, 12 - h + 4, b - a, 1, M.fd); R(a, 12 - h + 6, b - a, 2, M.fl); R(a, 12 - h + 8, b - a, 1, M.fd); };
    if (N) R(7, 0 - h + 3, 2, 12, M.fl); if (S) R(7, 12 - h + 3, 2, 4, M.fl); if (ew) rail(x0, x1); R(7, 12 - h, 2, h, M.f); R(7, 12 - h - 1, 2, 1, M.c); return; }
  if (type === 'slide') { // two metal posts with a panel that slides into the left post (or apart, for a pair)
    if (ew) { const a = jw ? 0 : 3, b = je ? 16 : 13, w = b - a, s = open || 0, right = jw && !je;
      if (!jw) face(x0, 3); if (!je) face(13, x1); cap(x0, x1, 8, 12); R(x0, 12 - h, x1 - x0, 1, M.cd);
      R(a, 12 - h + 1, w, 1, M.fd); P(right ? 14 : 8, 12 - h, s > .5 ? '#7fe0b5' : '#ffd25c');
      const pw = Math.max(1, Math.round(w * (1 - s))), px = right ? b - pw : a;
      R(px, 12 - h + 2, pw, h - 3, M.door); R(px, 12 - h + 2, pw, 1, M.fl); R(right ? px : px + pw - 1, 12 - h + 2, 1, h - 3, M.fd);
      if (pw >= 6) { R(px + (right ? 2 : pw - 5), 12 - h + 4, 3, h - 9, '#a8dcf5'); P(px + (right ? 2 : pw - 5), 12 - h + 5, '#eaf8ff'); }
      if (s > .02) R(right ? a : a + pw, 12 - h + 2, w - pw, 1, 'rgba(20,12,30,0.35)'); }
    else { if (N) cap(6, 10, 0, 8); cap(6, 10, 8, 12); if (S) cap(6, 10, 12, 16); else face(6, 10); if ((open || 0) < .5) R(7, (N ? 0 : 8) - h + 1, 2, (S ? 16 : 12) - (N ? 0 : 8) - 1, M.door); }
    return; }
  if (type === 'door' && open) {
    if (ew) { if (!jw) face(x0, 3); if (!je) face(13, x1); cap(x0, x1, 8, 12);
      if (jw && !je) { R(12, 12 - h, 1, h, M.fd); R(10, 12 - h + 1, 2, h - 1, M.door); R(11, 12 - h + 1, 1, h - 1, M.fl); } // right leaf of a pair swings to the right post
      else if (!jw) { R(3, 12 - h, 1, h, M.fd); R(4, 12 - h + 1, 2, h - 1, M.door); R(4, 12 - h + 1, 1, h - 1, M.fl); } }
    else { cap(6, 10, 0, 2); cap(6, 10, 14, 16); R(10, 2 - h + 2, 1, 10, M.door); }
    return; }
  if (N) cap(6, 10, 0, 8);
  if (ew) { face(x0, x1); cap(x0, x1, 8, 12); R(x0, 12 - h, x1 - x0, 1, M.cd);
    if (type === 'win') { const a = jw ? 0 : Math.max(x0, 4), b = je ? 16 : Math.min(x1, 12); if (b - a >= 4) { R(a, 12 - h + 3, b - a, 8, M.fl); R(a + (jw ? 0 : 1), 12 - h + 4, b - a - (jw ? 0 : 1) - (je ? 0 : 1), 6, '#a8dcf5'); P(a + 2, 12 - h + 5, '#eaf8ff'); P(a + 3, 12 - h + 6, '#eaf8ff'); if (!jw && !je) R((a + b) >> 1, 12 - h + 4, 1, 6, M.fl); } }
    if (type === 'frame') { R(x0 + (Wm ? 0 : 1), 12 - h + 1, x1 - x0 - (Wm ? 0 : 1) - (E ? 0 : 1), h - 3, '#a8dcf5'); R(x0, 12 - h + Math.round(h / 2), x1 - x0, 1, M.fl); if (x1 - x0 >= 8) R(8, 12 - h + 1, 1, h - 3, M.fl); P(x0 + 2, 12 - h + 3, '#eaf8ff'); P(x0 + 3, 12 - h + 4, '#eaf8ff'); }
    if (type === 'door') { const a = jw ? 0 : 3, b = je ? 16 : 13; R(a, 12 - h + 1, b - a, h - 2, M.door); R(a, 12 - h + 1, b - a, 1, M.fl);
      if (!jw && !je) { R(8, 12 - h + 1, 1, h - 2, M.fd); P(10, 6, '#ffc861'); P(6, 6, '#ffc861'); } // knobs stay at hand height
      else { if (je) R(15, 12 - h + 1, 1, h - 2, M.fd); P(je ? 13 : 2, 6, '#ffc861'); } }
  } else { cap(6, 10, 8, 12); if (!S) { face(6, 10); if (type === 'win' || type === 'frame') R(7, 12 - h + 3, 2, 8, '#a8dcf5'); if (type === 'door') R(7, 12 - h + 1, 2, h - 2, M.door); } }
  if (S) cap(6, 10, 12, 16);
  if (!ew) { if (type === 'win' || type === 'frame') R(7, (N ? 0 : 8) - h + 1, 2, (S ? 16 : 12) - (N ? 0 : 8) - 2, '#a8dcf5'); if (type === 'door') R(7, (N ? 0 : 8) - h, 2, (S ? 16 : 12) - (N ? 0 : 8), M.door); }
}
export const TWC = {}, TW_Y0 = 26;
export function twSprite(id, mask, open) { const k = id + '|' + mask + '|' + (+open || 0); if (TWC[k]) return TWC[k]; const { type, mat } = OBJ[id].tw;
  return TWC[k] = mk(16, TW_Y0 + 16, A => twDraw(A, type, mat, mask, +open || 0, twH(type), TW_Y0), 'sel'); }
export function twIcon(id) { const { type, mat } = OBJ[id].tw, h = Math.min(10, Math.round(twH(type) * .5) + 2); return mk(16, 16, A => twDraw(A, type, mat, type === 'pillar' ? 0 : 10, false, h, 3 - TW_BASE), 'sel'); }
export function drawHazards(T, camX, camY) {
  const t = performance.now() / 1000;
  for (const h of G.hz || []) { const X = h.x * T - camX, Y = h.y * T - camY, warn = h.t < h.warn;
    if (h.k === 'poison') { const a = warn ? .2 : Math.min(.75, (h.life - h.t) * 1.2); ctx.globalAlpha = a; ctx.fillStyle = '#9be37a'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = '#d59bff'; ctx.beginPath(); ctx.ellipse(X - h.r * T * .3, Y - h.r * T * .1, h.r * T * .3, h.r * T * .2, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; } // v101
    else if (h.k === 'lava') { const a = warn ? .25 + .25 * Math.sin(t * 20) : Math.min(1, (h.life - h.t) * 1.5); ctx.globalAlpha = a; ctx.fillStyle = warn ? '#ff8a3d' : '#e8501f'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.fill(); if (!warn) { ctx.fillStyle = '#ffc861'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * .55, h.r * T * .32, 0, 0, 6.283); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (warn) { const pr = h.t / h.warn; ctx.strokeStyle = `rgba(191,230,255,${.4 + pr * .5})`; ctx.lineWidth = 2 * Z; ctx.setLineDash([4 * Z, 3 * Z]); ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(191,230,255,${pr * .25})`; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * pr, h.r * T * .62 * pr, 0, 0, 6.283); ctx.fill(); } }
}
export const ROTC = new WeakMap(), turned = c => { let k = ROTC.get(c); if (!k) { k = rot90(c); ROTC.set(c, k); } return k; };
export function rotImg(t, r, base) { // → [image, flip]
  if (!r || !base) return [base, false]; const main = base === SPR.obj[t];
  if (r === 2 && rotN(t) === 4) return [(main && SPR.obj[t + 'U']) || base, false];
  return [(main && (SPR.obj[t + 'S'] || SPR.obj[t + 'V'])) || turned(base), r === 3]; }
export function rot90(c) { const k = document.createElement('canvas'); k.width = c.height; k.height = c.width; k.hd = c.hd; const g = k.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(k.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return k; }
// ---- lantern tree at play: growth show, see-through canopy, falling leaves, glow (all visual, nothing saved) ----
export const TREEFX = { grow: null, leaves: [], alpha: 1, leafT: 0 };
export const treeBase = () => ({ x: CX + .5, y: CY + 1 + 2 / 16 });
export function treeBox(L) { const b = treeBase(); return { l: b.x + (L.box.x0 - L.w / 2) / 16, r: b.x + (L.box.x1 + 1 - L.w / 2) / 16, t: b.y - (L.h - L.box.y0) / 16, b: b.y - (L.h - L.box.y1 - 1) / 16 }; }
export function behindCanopy() { const p = G.p, L = SPR.treeSt && SPR.treeSt[treeStage()]; if (!L || p.y >= CY + 1) return false; const k = treeBox(L); return p.x + .3 > k.l && p.x - .3 < k.r && p.y > k.t + .3 && p.y - .9 < k.b; }
export function treeLeaf(st, burst) {
  const L = SPR.treeSt[st], b = treeBase(), k = treeBox(L), P = TREE_PAL[st];
  const x = k.l + .3 + fxRand() * Math.max(.1, k.r - k.l - .6), top = k.t + (k.b - k.t) * (.35 + fxRand() * .6), gy = b.y - .2 + fxRand() * .8;
  const col = burst && st >= 3 && fxRand() < .35 ? (fxRand() < .5 ? '#ffb3c8' : '#fff1f6') : P[1 + ((fxRand() * 3) | 0)];
  TREEFX.leaves.push({ x, y: gy, z: Math.max(.3, gy - top), vz: burst ? .9 + fxRand() * .8 : .3 + fxRand() * .2, vx: burst ? (x - b.x) * (.8 + fxRand()) : (fxRand() - .5) * .3, vy: burst ? (fxRand() - .2) * .7 : 0, t: 0, ph: fxRand() * 6.28, col });
}
export function updateTree(dt) {
  const F = TREEFX, st = treeStage(), g = F.grow;
  if (g) { g.t += dt; if (!g.burst && g.t >= .45) { g.burst = 1; if (g.to >= 1) for (let k = 0; k < 22; k++) treeLeaf(g.to, 1); } if (g.t >= 1.6) F.grow = null; }
  F.alpha += ((behindCanopy() ? .42 : 1) - F.alpha) * Math.min(1, dt * 8);
  for (let i = F.leaves.length - 1; i >= 0; i--) { const q = F.leaves[i]; q.t += dt;
    if (q.z > 0) { q.z = Math.max(0, q.z - q.vz * dt); q.x += (q.vx + Math.sin(q.t * 2.4 + q.ph) * .35) * dt; q.y += q.vy * dt; q.vx *= Math.pow(.4, dt); q.vy *= Math.pow(.4, dt); }
    else { q.rest = (q.rest || 0) + dt; if (q.rest > .8) F.leaves.splice(i, 1); } }
  if (st >= 5 && F.leaves.length < 14 && Math.hypot(G.p.x - CX, G.p.y - CY) < 22) { F.leafT -= dt; if (F.leafT <= 0) { F.leafT = .7 + fxRand() * 1.1; treeLeaf(st, 0); } }
}
export function drawSpread(x, y, sx, sy, R) {
  const k = spreadKind(x, y, R); if (!k) return;
  if (k[0] === 'm') ctx.drawImage(SPR.tmoss[+k[1]], sx + 1 + ((hash2(x, y, 73) * 5) | 0), sy + 4 + ((hash2(x, y, 74) * 6) | 0));
  else { ctx.drawImage(SPR.tflower[k], sx + 2 + ((hash2(x, y, 73) * 9) | 0), sy + 2 + ((hash2(x, y, 74) * 8) | 0)); if (hash2(x, y, 75) < .35) ctx.drawImage(SPR.tmoss[0], sx + ((hash2(x, y, 76) * 6) | 0), sy + 9); }
}
export function drawTreeLook(L, t, o) {
  const b = treeBase(), sc = o.sc || 1, a = o.alpha, ca = a * o.ca, sw = L.s >= 5 ? Math.round(Math.sin(t * .7) * 1.2) / 16 : 0;
  const at = (lx, ly) => ({ x: b.x + (lx - L.w / 2) * sc / 16, y: b.y - (L.h - ly) * sc / 16 });
  if (a <= 0) return;
  shadow(b.x, CY + .95, (1.1 + L.w / 64) * sc, .3 * a);
  drawImg(L.trunk, b.x, b.y, { sx: sc, sy: sc, alpha: a });
  if (L.s < 2) L.lan.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 11); drawImg(SPR.lantern[k < L.s ? 1 : 0], q.x, q.y, { alpha: a }); });
  drawImg(L.canopy, b.x + sw, b.y, { sx: sc, sy: sc, alpha: ca });
  if (L.s >= 2) L.lan.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 11); drawImg(SPR.lantern[k < L.s ? 1 : 0], q.x + sw, q.y, { alpha: ca }); });
  L.small.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.3 + k * 2) * .5, ly + 8); drawImg(SPR.lanternS, q.x + sw, q.y, { alpha: ca }); });
}
export function drawTree(t) {
  const S = SPR.treeSt, g = TREEFX.grow, ca = TREEFX.alpha;
  if (!g) { drawTreeLook(S[treeStage()], t, { alpha: 1, ca }); return; }
  const u = clamp((g.t - .2) / .9, 0, 1), e = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); // grows with a little overshoot
  drawTreeLook(S[g.from], t, { alpha: 1 - clamp((u - .7) / .3, 0, 1), ca });
  drawTreeLook(S[g.to], t, { alpha: Math.min(1, u * 1.7), ca, sc: .78 + .22 * e });
}
export function drawTreeLeaves(T, camX, camY) {
  for (const q of TREEFX.leaves) { ctx.globalAlpha = q.z > 0 ? 1 : Math.max(0, 1 - q.rest / .8); ctx.fillStyle = q.col; const X = Math.round(q.x * T - camX), Y = Math.round((q.y - q.z) * T - camY); ctx.fillRect(X, Y, 2, 1); if (Math.sin(q.t * 5 + q.ph) > 0) ctx.fillRect(X + 1, Y - 1, 1, 1); }
  ctx.globalAlpha = 1;
}
// drawn after the darkness so lanterns, fruit, fireflies and the blessing edge read as light
export function drawTreeGlow(t, T, camX, camY, cw, ch) {
  const st = treeStage(), g = TREEFX.grow, b = treeBase(), show = g ? (g.t > .7 ? g.to : g.from) : st, L = SPR.treeSt[show], ca = TREEFX.alpha;
  const onS = (X, Y, m = 12) => X > -m && Y > -m && X < cw + m && Y < ch + m, sw = show >= 5 ? Math.round(Math.sin(t * .7) * 1.2) : 0;
  const at = (lx, ly) => [Math.round((b.x + (lx - L.w / 2) / 16) * T - camX), Math.round((b.y - (L.h - ly) / 16) * T - camY)];
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  if (onS(b.x * T - camX, (b.y - 2.5) * T - camY, 120)) {
    L.lan.forEach(([lx, ly], k) => { if (k >= show) return; const [X, Y] = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 7); ctx.globalAlpha = (.5 + Math.sin(t * 2 + k) * .08) * (show >= 2 ? ca : 1); ctx.drawImage(glowSprite('#ffd27a'), X + sw - 10, Y - 10, 20, 20); });
    L.small.forEach(([lx, ly], k) => { const [X, Y] = at(lx, ly + 5); ctx.globalAlpha = (.45 + Math.sin(t * 2.3 + k * 1.9) * .1) * ca; ctx.drawImage(glowSprite('#ffd27a'), X + sw - 7, Y - 7, 14, 14); });
    L.fruit.forEach(([lx, ly], k) => { const [X, Y] = at(lx + .5, ly + .5); ctx.globalAlpha = (.38 + Math.sin(t * 1.4 + k * 1.3) * .2) * ca; ctx.drawImage(glowSprite('#ffe08a'), X + sw - 7, Y - 7, 14, 14); });
    const nf = [0, 0, 0, 6, 10, 18][show], cx = b.x, cy = b.y - L.h * .52 / 16, rx = L.w / 16 * .62 + .6, ry = L.h / 16 * .42 + .4;
    for (let k = 0; k < nf; k++) { const h1 = hash2(k, 1, 9), h2 = hash2(k, 2, 9), h3 = hash2(k, 3, 9), X = (cx + Math.sin(t * .3 * (.6 + h1) + k * 2.1) * rx * (.45 + .55 * h2)) * T - camX, Y = (cy + Math.cos(t * .23 * (.7 + h3) + k) * ry * (.5 + .5 * h1)) * T - camY;
      const al = Math.max(0, Math.sin(t * 2.6 * (.5 + h2) + k * 1.7)); if (al <= .02) continue; ctx.globalAlpha = al * .9; ctx.drawImage(glowSprite('#e6ff9a'), X - 5, Y - 5, 10, 10); ctx.fillStyle = '#f8ffd0'; ctx.fillRect(Math.round(X), Math.round(Y), 1, 1); }
  }
  const R = TREE_BLESS(g ? (g.t > 1 ? g.to : g.from) : st);
  if (R) { const n = Math.round(R * 4), ox = CX + .5, oy = CY + .5;
    for (let k = 0; k < n; k++) { const h = hash2(k, R, 5), a = (k + h * .6) / n * 6.283 + t * .015, r = R + Math.sin(t * .6 + k * 1.7) * .22, wx = ox + Math.cos(a) * r, wy = oy + Math.sin(a) * r, X = wx * T - camX, Y0 = wy * T - camY;
      if (!onS(X, Y0)) continue; const tx = Math.floor(wx), ty = Math.floor(wy); if (!inB(tx, ty) || G.wall[idx(tx, ty)]) continue;
      const ph = (t * .22 + h) % 1, Y = Y0 - ph * 10; ctx.globalAlpha = Math.sin(ph * Math.PI) * .75; ctx.drawImage(glowSprite('#e9ffb8'), X - 4, Y - 4, 8, 8); ctx.fillStyle = '#f6ffdc'; ctx.fillRect(Math.round(X), Math.round(Y), 1, 1); } }
  if (g) { const X = b.x * T - camX, Y = b.y * T - camY, pa = g.t < .25 ? g.t / .25 : Math.max(0, 1 - (g.t - .25) / 1.1), Hh = 7.5 * T;
    const gr = ctx.createLinearGradient(0, Y - Hh, 0, Y); gr.addColorStop(0, 'rgba(255,236,170,0)'); gr.addColorStop(.45, `rgba(255,236,170,${.3 * pa})`); gr.addColorStop(1, `rgba(255,236,170,${.55 * pa})`);
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(X - 10, Y - Hh, 20, Hh); ctx.fillRect(X - 3, Y - Hh, 6, Hh);
    for (const dl of [0, .3]) { const q = clamp((g.t - dl) / 1.3, 0, 1); if (q <= 0 || q >= 1) continue; const rr = (1 + q * (TREE_BLESS(g.to) || 9)) * T;
      ctx.strokeStyle = `rgba(255,233,160,${.6 * (1 - q)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, (CY + .6) * T - camY, rr, 0, 6.283); ctx.stroke(); } }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
}
onFrame('fx', updateFx);
onFrame('tree', updateTree);
export function updateFx(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; if (q.life <= 0) { G.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= 9 * dt; q.z = Math.max(0, q.z + q.vz * dt); q.vx *= Math.pow(.2, dt); q.vy *= Math.pow(.2, dt); }
  for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= Math.pow(.15, dt); if (t.life <= 0) G.texts.splice(i, 1); }
  for (const o of visibleShakers) { o.shake = Math.max(0, (o.shake || 0) - dt); }
}
export const visibleShakers = new Set();
export const animalSpr = {};
export function animalImg(k) { if (animalSpr[k]) return animalSpr[k]; if (ARTC['animal/' + k]) return animalSpr[k] = artPaint('animal/' + k, MKDEF || INK); return animalSpr[k] = ANIM_DRAW[k] ? mk(16, 16, ANIM_DRAW[k]) : null; }
export function drawHitBars(T, camX, camY) { for (const [i, h] of HITS) { if (G.time - h.t >= RECOVER_GAP) { HITS.delete(i); continue; }
  const X = Math.round(h.x * T - camX + T * .15), Y = Math.round(h.y * T - camY - T * .35), w = Math.round(T * .7), f = 1 - h.n / RECOVER_HITS;
  ctx.fillStyle = 'rgba(20,14,30,.85)'; ctx.fillRect(X - 1, Y - 1, w + 2, Math.max(3, Math.round(T / 8)) + 2); ctx.fillStyle = '#ffc861'; ctx.fillRect(X, Y, Math.round(w * f), Math.max(3, Math.round(T / 8))); } }
