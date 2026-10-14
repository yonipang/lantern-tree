// ================= 바닥 조각: 바닥·벽 타일을 큰 조각으로 미리 그려 두기(drawChunk·getChunk) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ---- floor chunks: 16x16 tiles pre-rendered once, redrawn only when their tiles change ----
import { PRI, SPR } from '../art/world.js';
import { hash2 } from '../engine/random.js';
import { G } from '../save/state.js';
import { wallPiece } from '../sim/building.js';
import { WATER, WFLOOR } from '../sim/nature.js';
import { idx, inB, LAVA, W } from '../world/map.js';
import { BIOME_WATER, BUILT_WALLS, OLD_WATER, ROCK_FILL, TM, tileSetOf } from '../art/tilemap.js';
import { cv } from './view.js';
export const CHN = 16, chunks = new Map();
export function chunkSig(cx, cy) { let h = 7; for (let y = cy * CHN - 1; y <= cy * CHN + CHN; y++) for (let x = cx * CHN - 1; x <= cx * CHN + CHN; x++) { if (!inB(x, y)) continue; const i = idx(x, y); h = (Math.imul(h, 31) + G.wall[i] * 16 + G.floor[i] + (wallPiece(i) ? 7919 : 0)) | 0; } return h; }
export const natural = f => !!PRI[f];
export function drawChunk(c, cx, cy) {
  const g = c.cv.getContext('2d'); g.clearRect(0, 0, 256, 256); g.imageSmoothingEnabled = false;
  for (let ty = 0; ty < CHN; ty++) for (let tx = 0; tx < CHN; tx++) {
    const x = cx * CHN + tx, y = cy * CHN + ty; if (!inB(x, y)) continue; const i = idx(x, y); if (G.wall[i]) continue; const f = G.floor[i]; if (f === WATER) continue;
    const X = tx * 16, Y = ty * 16, hv = hash2(x, y, 5), vr = (hv * (SPR.floor[f] ? SPR.floor[f].length : 4)) | 0; // drawn floors can have more than 4 variants (v54)
    const tset = TM.ready && !wallPiece(i) ? tileSetOf(f) : null; // v71: drawn tileset floors
    if (tset) drawTileFloor(g, tset, x, y, X, Y, f);
    else if (wallPiece(i)) { // a thin wall's tile: each quarter takes the floor of the open side it faces, so floors stop right at the wall line
      const side = (hx, vy) => { for (const [dx, dy] of [[hx, 0], [0, vy], [hx, vy]]) { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) continue; const j = idx(xx, yy); if (G.wall[j] || wallPiece(j)) continue; const nf = G.floor[j]; if (nf === WATER || nf === LAVA || !SPR.floor[nf]) continue; return nf; } return f; };
      for (const [qx, qy] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { const qf = side(qx ? 1 : -1, qy ? 1 : -1); const FQ = SPR.floor[qf]; g.drawImage(FQ[(hv * FQ.length) | 0], qx, qy, 8, 8, X + qx, Y + qy, 8, 8); } }
    else g.drawImage(SPR.floor[f][vr], X, Y);
    if (!tset && natural(f) && !wallPiece(i)) {
      const nb = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return 0; const j = idx(xx, yy); return G.wall[j] ? 0 : G.floor[j]; };
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const fr = dirs.map(([dx, dy]) => { const b = nb(dx, dy); return natural(b) && PRI[b] > PRI[f] ? b : 0; });
      fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeX[b][q], X, Y); }); fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeL[b][q], X, Y); });
      [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]].forEach(([dx, dy, q]) => { const b = nb(dx, dy); if (natural(b) && PRI[b] > PRI[f] && nb(dx, 0) !== b && nb(0, dy) !== b) g.drawImage(SPR.corner[b][q], X, Y); });
      const hd = hash2(x, y, 77), dens = f === 1 ? .17 : .1;
      if (hd < dens && SPR.deco[f]) { const list = SPR.deco[f], d = list[(hash2(x, y, 78) * list.length) | 0]; g.drawImage(d, X + 2 + ((hash2(x, y, 79) * 8) | 0), Y + 3 + ((hash2(x, y, 80) * 7) | 0)); }
    }
    if (WFLOOR.has(f) && !wallPiece(i)) { const nw = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return false; const j = idx(xx, yy); return !G.wall[j] && (WFLOOR.has(G.floor[j]) || G.floor[j] === WATER); };
      if (!nw(0, -1)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 16, 1); g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 1, 16, 1); }
      if (!nw(0, 1)) { g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 14, 16, 1); g.fillStyle = '#5d5872'; g.fillRect(X, Y + 15, 16, 1); }
      if (!nw(-1, 0)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 1, 16); g.fillStyle = '#a7a2bb'; g.fillRect(X + 1, Y, 1, 16); }
      if (!nw(1, 0)) { g.fillStyle = '#a7a2bb'; g.fillRect(X + 14, Y, 1, 16); g.fillStyle = '#5d5872'; g.fillRect(X + 15, Y, 1, 16); } }
    // contact shadows next to walls
    if (y > 0 && G.wall[i - W]) { g.fillStyle = 'rgba(14,8,22,0.38)'; g.fillRect(X, Y, 16, 1); g.fillStyle = 'rgba(14,8,22,0.22)'; g.fillRect(X, Y + 1, 16, 1); g.fillStyle = 'rgba(14,8,22,0.1)'; g.fillRect(X, Y + 2, 16, 1); }
    if (x > 0 && G.wall[i - 1]) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 1, Y, 1, 16); }
    if (x < W - 1 && G.wall[i + 1]) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X + 15, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 14, Y, 1, 16); }
  }
  if (TM.ready) drawPatches(g, cx, cy);
}
// ---- v71 tileset floors (art/tilemap.js): each tile is four 8px quarters picked by its two side neighbours and the diagonal ----
const isWaterish = n => n === WATER || n === LAVA || WFLOOR.has(n);
// what is next door: floor number, -1 outside the map, -2 a built wall (wood·brick: the floor runs right up to it), -3 natural rock
function nbr(x, y) { if (!inB(x, y)) return -1; const j = idx(x, y), w = G.wall[j]; if (w) return BUILT_WALLS.has(w) ? -2 : -3; return G.floor[j]; }
function quarters(g, img, blk, inn, X, Y, same) {
  for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
    const dx = qx ? 1 : -1, dy = qy ? 1 : -1, h = same(dx, 0), v = same(0, dy), d = same(dx, dy); let tx, ty;
    if (h && v && d) { tx = blk[0] + 1; ty = blk[1] + 1; } // middle
    else if (h && v) { tx = inn[0] + 1 - qx; ty = inn[1] + 1 - qy; } // inside corner (the hole sits where the four inner tiles meet)
    else if (h) { tx = blk[0] + 1; ty = blk[1] + (qy ? 2 : 0); } // top / bottom edge
    else if (v) { tx = blk[0] + (qx ? 2 : 0); ty = blk[1] + 1; } // left / right edge
    else { tx = blk[0] + (qx ? 2 : 0); ty = blk[1] + (qy ? 2 : 0); } // outside corner
    g.drawImage(img, tx * 16 + qx * 8, ty * 16 + qy * 8, 8, 8, X + qx * 8, Y + qy * 8, 8, 8);
  }
}
// under a rim: water colour, rock colour where natural rock touches the quarter, or the edgeFill colour toward edgeTo floors
function underFill(g, s, x, y, X, Y) {
  const wb = BIOME_WATER[G.biome[idx(x, y)]]; g.fillStyle = wb ? wb[0] : OLD_WATER; g.fillRect(X, Y, 16, 16);
  for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) { const dx = qx ? 1 : -1, dy = qy ? 1 : -1, ns = [nbr(x + dx, y), nbr(x, y + dy), nbr(x + dx, y + dy)];
    if (ns.includes(-3)) g.fillStyle = ROCK_FILL; else if (s.edgeTo && ns.some(n => s.edgeTo.includes(n))) g.fillStyle = s.edgeFill; else continue;
    g.fillRect(X + qx * 8, Y + qy * 8, 8, 8); }
}
export function drawTileFloor(g, s, x, y, X, Y, f) {
  const img = s.img, eT = s.edgeTo || [];
  underFill(g, s, x, y, X, Y);
  quarters(g, img, s.blk, s.inn, X, Y, (dx, dy) => { const n = nbr(x + dx, y + dy); return n === -1 || n === -2 || (n >= 0 && !isWaterish(n) && !eT.includes(n)); });
  if (s.path && s.path.floors.includes(f)) { // a path on top: on grass if grass is around, otherwise with its own rim toward rock and water
    let onPlain = false; for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) if (s.plain.includes(nbr(x + xx, y + yy))) onPlain = true;
    if (!onPlain) underFill(g, s, x, y, X, Y);
    quarters(g, img, s.path.blk, s.path.inn, X, Y, onPlain
      ? (dx, dy) => { const n = nbr(x + dx, y + dy); return n < 0 || s.path.floors.includes(n); }
      : (dx, dy) => { const n = nbr(x + dx, y + dy); return n === -1 || n === -2 || (n >= 0 && !isWaterish(n)); });
  } else if (s.deco && hash2(x, y, 91) < s.deco.dens) { const d = s.deco.list[(hash2(x, y, 92) * s.deco.list.length) | 0];
    g.save(); if (s.deco.flip && hash2(x, y, 98) < .5) { g.translate(X * 2 + 16, 0); g.scale(-1, 1); } g.drawImage(img, d[0] * 16, d[1] * 16, 16, 16, X, Y, 16, 16); g.restore(); }
  // a south edge that drops into water (or toward an edgeTo floor) gets the cliff face
  const sth = nbr(x, y + 1), cl = s.cliff;
  if (cl && sth >= 0 && (isWaterish(sth) || eT.includes(sth))) for (let qx = 0; qx < 2; qx++) { const side = nbr(x + (qx ? 1 : -1), y), open = side >= 0 && (isWaterish(side) || eT.includes(side));
    g.drawImage(img, cl.x + qx * 8, cl.y, 8, cl.h, X + qx * 8 + (open ? (qx ? -1 : 1) : 0), Y + cl.at, 8, cl.h); }
}
// soft grass patches over several tiles — only where the whole patch (and its border) is plain grass inside this chunk
function drawPatches(g, cx, cy) {
  for (let ty = 0; ty < CHN; ty++) for (let tx = 0; tx < CHN; tx++) {
    const x = cx * CHN + tx, y = cy * CHN + ty; if (!inB(x, y)) continue; const i = idx(x, y); if (G.wall[i]) continue; const s = tileSetOf(G.floor[i]); if (!s || !s.patches) continue;
    const h = hash2(x, y, 95);
    for (const pt of s.patches) { if (h >= pt.dens) continue; const [w, hh] = pt.size; if (tx + w > CHN || ty + hh > CHN) continue; let ok = true;
      for (let yy = -1; yy <= hh && ok; yy++) for (let xx = -1; xx <= w && ok; xx++) { const n = nbr(x + xx, y + yy); if (n !== -2 && !s.plain.includes(n)) ok = false; }
      if (ok) { g.drawImage(s.img, pt.at[0] * 16, pt.at[1] * 16, w * 16, hh * 16, tx * 16, ty * 16, w * 16, hh * 16); break; } }
  }
}
export function getChunk(cx, cy) {
  const key = cx * 1000 + cy; let c = chunks.get(key);
  if (!c) { c = { cv: document.createElement('canvas'), sig: null }; c.cv.width = c.cv.height = 256; chunks.set(key, c); }
  const sig = chunkSig(cx, cy); if (sig !== c.sig) { c.sig = sig; drawChunk(c, cx, cy); }
  return c.cv;
}
