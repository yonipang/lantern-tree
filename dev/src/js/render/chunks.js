// ================= 바닥 조각: 바닥·벽 타일을 큰 조각으로 미리 그려 두기(drawChunk·getChunk) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ---- floor chunks: 16x16 tiles pre-rendered once, redrawn only when their tiles change ----
import { PRI, SPR } from '../art/world.js';
import { hash2 } from '../engine/random.js';
import { G } from '../save/state.js';
import { wallPiece } from '../sim/building.js';
import { WATER, WFLOOR } from '../sim/nature.js';
import { H, idx, inB, LAVA, PIT, W } from '../world/map.js';
import { BIOME_WATER, OLD_WATER, ROCK_FILL, TM, tileSetOf } from '../art/tilemap.js';
import { BUILT_WALLS } from '../data/items.js';
import { cv } from './view.js';
import { bakeFloor, basePx, floorNoise, isNewFloor, newQuarter, terrainReady } from './terrain.js';
import { drawIceShard, ICE_BIOME, ICE_FROZEN, ICE_W, isIceShard, SLANT, wallEdgeChunk } from './icecave.js';
export const CHN = 16, chunks = new Map();
const CH_KEEP = 96; let chunkClock = 0;
export function chunkSig(cx, cy) { let h = 7; const m = terrainReady() ? 2 : 1; for (let y = cy * CHN - m; y < cy * CHN + CHN + m; y++) for (let x = cx * CHN - m; x < cx * CHN + CHN + m; x++) { if (!inB(x, y)) continue; const i = idx(x, y); h = (Math.imul(h, 31) + G.wall[i] * 16 + G.floor[i] + (wallPiece(i) ? 7919 : 0)) | 0; } return h; }
export const natural = f => !!PRI[f];
export function drawChunk(c, cx, cy) {
  const g = c.cv.getContext('2d'); g.clearRect(0, 0, 256, 256); g.imageSmoothingEnabled = false;
  const NEW = terrainReady(); // v73: grass·dirt·water·wood·stone floors baked per pixel (render/terrain.js), other floors drawn per tile on top
  const bk = NEW ? bakeFloor(cx * CHN, cy * CHN, cx * CHN + CHN - 1, cy * CHN + CHN - 1) : null, late = [], pits = [];
  if (NEW) g.putImageData(bk, 0, 0);
  for (let ty = 0; ty < CHN; ty++) for (let tx = 0; tx < CHN; tx++) {
    const x = cx * CHN + tx, y = cy * CHN + ty; if (!inB(x, y)) continue; const i = idx(x, y);
    if (G.wall[i] === ICE_W) { drawIceShard(g, x, y, tx * 16, ty * 16, false); continue; } // v79: ice under the ice wall, seen where its edge slants in
    if (NEW && SLANT.has(G.wall[i])) { underWall(g, x, y, tx * 16, ty * 16); continue; } // v80: the floor next door continues under a slanted rock wall
    if (G.wall[i]) continue; const f = G.floor[i];
    if (f === PIT) { pits.push([x, y, tx * 16, ty * 16]); continue; } // v87: 구덩이는 다른 바닥을 다 그린 뒤 위에 (drawPit)
    if (NEW && f === ICE_FROZEN && G.biome[i] === ICE_BIOME) continue; // v80: frozen water in the ice cave is baked with the water (render/terrain.js)
    if (isIceShard(i) && !wallPiece(i)) { // v79: ice cave floor = ice shards (render/icecave.js); next to water the baked floor already has them with a wavy shore
      let wet = false; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inB(x + dx, y + dy) && !G.wall[idx(x + dx, y + dy)] && (G.floor[idx(x + dx, y + dy)] === WATER || G.floor[idx(x + dx, y + dy)] === ICE_FROZEN)) wet = true;
      if (!(NEW && wet)) drawIceShard(g, x, y, tx * 16, ty * 16, true); continue; }
    if (NEW && isNewFloor(f) && !wallPiece(i)) { newShadows(g, x, y, tx * 16, ty * 16, f); continue; }
    if (f === WATER) continue;
    const X = tx * 16, Y = ty * 16, hv = hash2(x, y, 5), vr = (hv * (SPR.floor[f] ? SPR.floor[f].length : 4)) | 0; // drawn floors can have more than 4 variants (v54)
    const tset = TM.ready && !wallPiece(i) ? tileSetOf(f) : null; // v71: drawn tileset floors
    if (tset) drawTileFloor(g, tset, x, y, X, Y, f);
    else if (wallPiece(i)) { // a thin wall's tile: each quarter takes the floor of the open side it faces, so floors stop right at the wall line
      const side = (hx, vy) => { for (const [dx, dy] of [[hx, 0], [0, vy], [hx, vy]]) { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) continue; const j = idx(xx, yy); if (G.wall[j] || wallPiece(j)) continue; const nf = G.floor[j]; if (nf === WATER || nf === LAVA || !SPR.floor[nf]) continue; return nf; } return f; };
      for (const [qx, qy] of [[0, 0], [8, 0], [0, 8], [8, 8]]) { const qf = side(qx ? 1 : -1, qy ? 1 : -1); if (NEW && isNewFloor(qf) && newQuarter(g, qf, X + qx, Y + qy, x * 16 + qx, y * 16 + qy)) continue; const FQ = SPR.floor[qf]; g.drawImage(FQ[(hv * FQ.length) | 0], qx, qy, 8, 8, X + qx, Y + qy, 8, 8); } }
    else g.drawImage(SPR.floor[f][vr], X, Y);
    // v82: with the new floors, edges between natural floors are drawn per pixel after this loop (softEdges), so the extras wait until then
    if (NEW) late.push([x, y, X, Y, f, i, tset]); else tileExtras(g, x, y, X, Y, f, i, tset, false);
  }
  if (NEW) { softEdges(g, cx, cy, bk); for (const a of late) tileExtras(g, ...a, true); }
  if (TM.ready && !NEW) drawPatches(g, cx, cy);
  for (const a of pits) drawPit(g, ...a);
  c.edge = wallEdgeChunk(cx, cy, CHN); // v79 teal glow beside ice walls · v80 soft shadow beside rock walls (render/icecave.js)
}
// ---- v87: 구덩이 그림 (코드로 그려요 — 지형 그림 예외와 같이). 위에서 비스듬히 내려다본 구멍: 북쪽 가장자리 아래로 안쪽 벽(위가 밝고 아래로 어두워짐),
// 바닥은 아주 어둡게, 다른 구덩이와 이어진 쪽은 테두리 없이 이어져요. 옆·아래 가장자리는 땅의 밝은 턱 1px + 안쪽 그늘. 지역마다 흙색(얼음 동굴은 푸른 얼음, 용암 동굴은 재색)
export const PIT_WALL = { d: ['#8a6848', '#6e5039', '#56402f', '#443226', '#33251e', '#281c19'], 4: ['#c6e2f8', '#8fb6e2', '#6a8fc6', '#4f6fa6', '#3a5486', '#2b3d66'], 3: ['#7a6870', '#625560', '#4e434e', '#3e343e', '#30282f', '#251e25'] };
export const PIT_FLOOR = { d: ['#1c1418', '#241a1d'], 4: ['#141c2c', '#1a2438'], 3: ['#18131a', '#201a22'] };
export function drawPit(g, x, y, X, Y) {
  const pit = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return false; const j = idx(xx, yy); return !G.wall[j] && G.floor[j] === PIT; };
  const b = G.biome[idx(x, y)], wc = PIT_WALL[b] || PIT_WALL.d, fc = PIT_FLOOR[b] || PIT_FLOOR.d;
  const n = pit(0, -1), s = pit(0, 1), w = pit(-1, 0), e = pit(1, 0);
  g.fillStyle = fc[0]; g.fillRect(X, Y, 16, 16);
  for (let k = 0; k < 5; k++) { const hx = (hash2(x * 5 + k, y, 41) * 16) | 0, hy = (hash2(x, y * 5 + k, 42) * 16) | 0; g.fillStyle = fc[1]; g.fillRect(X + hx, Y + hy, 1, 1); } // 바닥 얼룩
  if (!n) for (let u = 0; u < 16; u++) { // 북쪽 안쪽 벽: 4px마다 높이가 조금씩 달라요 (5~7px)
    const h = 5 + ((hash2(x * 4 + (u >> 2), y, 43) * 3) | 0);
    for (let v = 0; v < h; v++) { g.fillStyle = v === 0 ? wc[0] : wc[Math.min(wc.length - 1, 1 + Math.floor((v - 1) * (wc.length - 1) / Math.max(1, h - 1)))]; g.fillRect(X + u, Y + v, 1, 1); }
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(X + u, Y + h, 1, 1); } // 안쪽 벽 아래 그늘
  if (!w) { g.fillStyle = wc[1]; g.fillRect(X, Y, 1, 16); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X + 1, Y + (n ? 0 : 5), 1, n ? 16 : 11); }
  if (!e) { g.fillStyle = wc[2]; g.fillRect(X + 15, Y, 1, 16); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(X + 14, Y + (n ? 0 : 5), 1, n ? 16 : 11); }
  if (!s) { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(X, Y + 14, 16, 1); g.fillStyle = wc[0]; g.fillRect(X, Y + 15, 16, 1); } // 앞쪽 턱
  if (n && w && !pit(-1, -1)) { for (let v = 0; v < 6; v++) { g.fillStyle = wc[Math.min(wc.length - 1, v)]; g.fillRect(X, Y + v, 1, 1); } } // 안쪽 모서리: 북서쪽 칸만 땅이면 그쪽 벽이 조금
  if (n && e && !pit(1, -1)) { for (let v = 0; v < 6; v++) { g.fillStyle = wc[Math.min(wc.length - 1, v)]; g.fillRect(X + 15, Y + v, 1, 1); } }
}
// fringes (old floors only), little decorations, built-water rims and contact shadows on one floor tile
function tileExtras(g, x, y, X, Y, f, i, tset, NEW) {
  if (!tset && natural(f) && !wallPiece(i)) {
    const nb = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return 0; const j = idx(xx, yy); return G.wall[j] ? 0 : G.floor[j]; };
    if (!NEW) { // v82: the new floors have per-pixel edges instead of fringe pictures
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const fr = dirs.map(([dx, dy]) => { const b = nb(dx, dy); return natural(b) && PRI[b] > PRI[f] ? b : 0; });
      fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeX[b][q], X, Y); }); fr.forEach((b, q) => { if (b) g.drawImage(SPR.fringeL[b][q], X, Y); });
      [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]].forEach(([dx, dy, q]) => { const b = nb(dx, dy); if (natural(b) && PRI[b] > PRI[f] && nb(dx, 0) !== b && nb(0, dy) !== b) g.drawImage(SPR.corner[b][q], X, Y); }); }
    const hd = hash2(x, y, 77), dens = f === 1 ? .17 : .1;
    if (hd < dens && SPR.deco[f]) { const list = SPR.deco[f], d = list[(hash2(x, y, 78) * list.length) | 0]; g.drawImage(d, X + 2 + ((hash2(x, y, 79) * 8) | 0), Y + 3 + ((hash2(x, y, 80) * 7) | 0)); }
  }
  if (WFLOOR.has(f) && !wallPiece(i)) { const nw = (dx, dy) => { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) return false; const j = idx(xx, yy); return !G.wall[j] && (WFLOOR.has(G.floor[j]) || G.floor[j] === WATER); };
    if (!nw(0, -1)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 16, 1); g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 1, 16, 1); }
    if (!nw(0, 1)) { g.fillStyle = '#a7a2bb'; g.fillRect(X, Y + 14, 16, 1); g.fillStyle = '#5d5872'; g.fillRect(X, Y + 15, 16, 1); }
    if (!nw(-1, 0)) { g.fillStyle = '#5d5872'; g.fillRect(X, Y, 1, 16); g.fillStyle = '#a7a2bb'; g.fillRect(X + 1, Y, 1, 16); }
    if (!nw(1, 0)) { g.fillStyle = '#a7a2bb'; g.fillRect(X + 14, Y, 1, 16); g.fillStyle = '#5d5872'; g.fillRect(X + 15, Y, 1, 16); } }
  // contact shadows next to walls
  const hard = j => G.wall[j] && !(NEW && SLANT.has(G.wall[j])); // v80
  if (y > 0 && hard(i - W)) { g.fillStyle = 'rgba(14,8,22,0.38)'; g.fillRect(X, Y, 16, 1); g.fillStyle = 'rgba(14,8,22,0.22)'; g.fillRect(X, Y + 1, 16, 1); g.fillStyle = 'rgba(14,8,22,0.1)'; g.fillRect(X, Y + 2, 16, 1); }
  if (x > 0 && hard(i - 1)) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 1, Y, 1, 16); }
  if (x < W - 1 && hard(i + 1)) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X + 15, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 14, Y, 1, 16); }
}
// ---- v82: wavy edges between all natural floors (grass·dirt path·ice shards = "base" from the bake, mushroom soil 3, crystal sand 4, ash 18, lava) ----
// each pixel near a tile edge goes to the floor whose share (blended between tile centres) plus a little noise is biggest — like the grass/water edge.
// water stays where the bake put it (wavy shore for every floor), and the floor shows a darker rim at the shore.
export const SOFT_FLOORS = new Set([3, 4, 18, LAVA]);
// tile class: -1 none (water·wall·outside — no share), -2 fixed (built floors: a share of 0, never changed), 0 base, f soft floor
function fclass(x, y) { if (!inB(x, y)) return -1; const j = idx(x, y); if (G.wall[j]) return -1; if (wallPiece(j)) return -2; const f = G.floor[j];
  if (f === WATER || (f === ICE_FROZEN && G.biome[j] === ICE_BIOME)) return -1; if (f === 1 || f === 2 || (f === 19 && G.biome[j] === ICE_BIOME)) return 0; return SOFT_FLOORS.has(f) ? f : -2; }
const SE_PIX = new WeakMap();
function sePix(cv) { let d = SE_PIX.get(cv); if (!d) { d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; SE_PIX.set(cv, d); } return d; }
const SE_J = { wobble: .3, jag: .09 }; // 경계가 구불거리는 정도 (잔디·물 경계보다 조금 크게 — 칸 모양이 안 보이게)
const SE_PRI = c => c === 0 ? 4 : PRI[c] || 0;
function softEdges(g, cx, cy, bk) {
  const T = 16, x0 = cx * CHN - 1, y0 = cy * CHN - 1, CW = CHN + 2, cl = new Int16Array(CW * CW);
  for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) cl[j * CW + i] = fclass(x0 + i, y0 + j);
  const clAt = (x, y) => (x < x0 || y < y0 || x >= x0 + CW || y >= y0 + CW) ? fclass(x, y) : cl[(y - y0) * CW + x - x0];
  let img = null; const D = () => img || (img = g.getImageData(0, 0, 256, 256)), B = bk.data;
  const own = new Int16Array(18 * 18);
  for (let ty = 0; ty < CHN; ty++) for (let tx = 0; tx < CHN; tx++) {
    const x = cx * CHN + tx, y = cy * CHN + ty; if (!inB(x, y)) continue; const i = idx(x, y), me = clAt(x, y);
    if (me === -2) continue; const wl = G.wall[i]; if (wl && (!SLANT.has(wl) || wl === ICE_W)) continue;
    const CS = []; let soft = me > 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const c = clAt(x + dx, y + dy); if (c >= 0 && !CS.includes(c)) CS.push(c); if (c > 0) soft = true; }
    if (!soft || !CS.length) continue; // only tiles where a soft floor is around
    // share of class c at world pixel (px,py): blend of the four nearest tile centres (1 = that class, 0 = another floor, .5 = water·wall)
    const share = (c, px, py) => { const gx = px / T - .5, gy = py / T - .5, a = Math.floor(gx), b = Math.floor(gy), u = gx - a, v = gy - b;
      const m = (xx, yy) => { const k = clAt(xx, yy); return k === c ? 1 : k === -1 ? .5 : 0; };
      return m(a, b) * (1 - u) * (1 - v) + m(a + 1, b) * u * (1 - v) + m(a, b + 1) * (1 - u) * v + m(a + 1, b + 1) * u * v; };
    const owner = (px, py) => { if (CS.length === 1) return CS[0]; let best = CS[0], bv = -9;
      for (const c of CS) { const v = share(c, px + .5, py + .5) + SE_J.wobble * floorNoise(px / 11, py / 11, 41 + c) + SE_J.jag * floorNoise(px / 2.6, py / 2.6, 61 + c); if (v > bv) { bv = v; best = c; } } return best; };
    for (let v = -1; v <= 16; v++) for (let u = -1; u <= 16; u++) own[(v + 1) * 18 + u + 1] = owner(x * T + u, y * T + v);
    const O = D().data, ice = G.biome[i] === ICE_BIOME, vr = (hash2(x, y, 5) * 4) | 0;
    let baseF = 1; for (const [dx, dy] of [[0, 0], [0, 1], [-1, 0], [1, 0], [0, -1]]) { if (clAt(x + dx, y + dy) === 0) { baseF = G.floor[idx(x + dx, y + dy)]; break; } }
    for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) { const k = (ty * T + v) * 256 + tx * T + u, o = k * 4, L = bk.land[k];
      if (L === 0) { if (me > 0) { O[o] = B[o]; O[o + 1] = B[o + 1]; O[o + 2] = B[o + 2]; O[o + 3] = 255; } continue; } // water stays where the bake put it
      const c = own[(v + 1) * 18 + u + 1], wx = x * T + u, wy = y * T + v; let col;
      if (c === 0) { if (L === 2) col = basePx(baseF, wx, wy, ice); else { if (me === 0) continue; col = [B[o], B[o + 1], B[o + 2]]; } }
      else { const F = SPR.floor[c]; if (!F) continue; const d = sePix(F[vr % F.length]), s = ((wy & 15) * 16 + (wx & 15)) * 4; col = [d[s], d[s + 1], d[s + 2]];
        const sh = bk.shore[k]; if (sh === 1) col = col.map(q => q * .55); else if (sh === 2) col = col.map(q => q * .78); }
      const pr = SE_PRI(c); if (SE_PRI(own[v * 18 + u + 1]) > pr || SE_PRI(own[(v + 2) * 18 + u + 1]) > pr || SE_PRI(own[(v + 1) * 18 + u]) > pr || SE_PRI(own[(v + 1) * 18 + u + 2]) > pr) col = col.map(q => q * .8); // a thin darker line on the lower floor
      O[o] = col[0]; O[o + 1] = col[1]; O[o + 2] = col[2]; O[o + 3] = 255; }
  }
  if (img) g.putImageData(img, 0, 0);
}
// v80: under a slanted rock wall, the floor of an open neighbour (south first) — seen where the wall's edge slants in
function underWall(g, x, y, X, Y) {
  let f = -1; for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) { const xx = x + dx, yy = y + dy; if (!inB(xx, yy)) continue; const j = idx(xx, yy); if (G.wall[j] || wallPiece(j)) continue; const nf = G.floor[j]; if (nf === WATER || nf === LAVA) continue; f = nf; if (G.biome[j] === 4 && nf === 19) { drawIceShard(g, x, y, X, Y, false); return; } break; }
  if (f < 0) return;
  if (isNewFloor(f)) { for (const [qx, qy] of [[0, 0], [8, 0], [0, 8], [8, 8]]) newQuarter(g, f, X + qx, Y + qy, x * 16 + qx, y * 16 + qy); return; }
  const F = SPR.floor[f]; if (F) g.drawImage(F[(hash2(x, y, 5) * F.length) | 0], X, Y);
}
// v73: contact shadows on the new floors (as in the light demo) — under a wall to the north, and beside walls left / right
function newShadows(g, x, y, X, Y, f) {
  const wl = (dx, dy) => { if (!inB(x + dx, y + dy)) return true; const w = G.wall[idx(x + dx, y + dy)]; return !!w && !SLANT.has(w); }; // v80: slanted walls get their own soft shadow (wallEdgeChunk)
  if (f === WATER) { if (wl(0, -1)) { g.fillStyle = 'rgba(10,20,45,0.6)'; g.fillRect(X, Y, 16, 3); } return; }
  if (wl(0, -1)) { g.fillStyle = 'rgba(14,8,22,0.38)'; g.fillRect(X, Y, 16, 1); g.fillStyle = 'rgba(14,8,22,0.22)'; g.fillRect(X, Y + 1, 16, 1); g.fillStyle = 'rgba(14,8,22,0.1)'; g.fillRect(X, Y + 2, 16, 1); }
  if (wl(-1, 0)) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 1, Y, 1, 16); }
  if (wl(1, 0)) { g.fillStyle = 'rgba(14,8,22,0.28)'; g.fillRect(X + 15, Y, 1, 16); g.fillStyle = 'rgba(14,8,22,0.12)'; g.fillRect(X + 14, Y, 1, 16); }
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
  if (!c) { c = { cv: document.createElement('canvas'), sig: null }; c.cv.width = c.cv.height = 256; chunks.set(key, c);
    if (chunks.size > CH_KEEP) { let old = null, ot = Infinity; for (const [k, v] of chunks) if (v.used < ot) { ot = v.used; old = k; } chunks.delete(old); } } // v73: keep only the chunks seen lately (memory)
  c.used = ++chunkClock;
  const sig = chunkSig(cx, cy); if (sig !== c.sig) { c.sig = sig; drawChunk(c, cx, cy); }
  return c.cv;
}
// v73: bake at most one chunk a frame just outside the screen, so walking into a new area rarely has to bake on screen
export const chunkEdge = (cx, cy) => { const c = chunks.get(cx * 1000 + cy); return c ? c.edge : null; };
export function prefetchChunk(cx0, cy0, cx1, cy1) {
  for (let cy = cy0 - 1; cy <= cy1 + 1; cy++) for (let cx = cx0 - 1; cx <= cx1 + 1; cx++) {
    if (cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1) continue; if (cx < 0 || cy < 0 || cx * CHN >= W || cy * CHN >= H) continue;
    const c = chunks.get(cx * 1000 + cy); if (c && c.sig === chunkSig(cx, cy)) continue;
    getChunk(cx, cy); return; }
}
