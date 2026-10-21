// ================= 지도 만들기 (구조 변경 5단계: world.js에서 옮김) =================
// 시드로 세계 만들기(genWorld) — 지역·벽·물·연못·석영 광맥, 숨은 방(놓기·찾기·보물상자)
import { ANCH, ANCH2, BX, BY, CX, CY, H, L2, LAVA, LAY, MAPV, SA, SB, SI, SL, W, idx, inB, setLayout } from './map.js';
import { G } from '../save/state.js';
import { ROOM_DECO, ROOM_LOOT, ROOM_N } from '../data/farming-cooking.js';
import { fbm, hash2, rng, vn } from '../engine/random.js';
import { spawnDrop } from '../sim/drops.js';
import { emit } from '../sim/events.js';
import { knows, roomNotes } from '../sim/cooking.js';
import { WATER } from '../sim/nature.js';
import { gainXp } from '../sim/player.js';
import { checkGuide } from '../sim/quests.js';
import { markLight } from '../sim/loop.js';

// ================= world gen =================
export const quartzAt = (x, y, s) => vn(x * .22, y * .22, s + 81) > 0.71; // v43: quartz veins inside the crystal cave's granite
export function wallFor(b, x, y, s) {
  if (b === 0) return vn(x * .22, y * .22, s + 21) > 0.72 ? 4 : 1;
  if (b === 1) { if (vn(x * .07, y * .07, s + 31) > 0.47) return vn(x * .22, y * .22, s + 41) > 0.73 ? 5 : 2; return vn(x * .22, y * .22, s + 21) > 0.74 ? 4 : 1; }
  if (b === 3) return vn(x * .2, y * .2, s + 61) > 0.72 ? 10 : 9;
  if (b === 4) return vn(x * .2, y * .2, s + 71) > 0.72 ? 12 : 11;
  if (vn(x * .08, y * .08, s + 51) > 0.4) return quartzAt(x, y, s) ? 13 : 3; return vn(x * .22, y * .22, s + 41) > 0.7 ? 5 : 2;
}
export function deepRegion(x, y, dd, seed) {
  if (dd <= 71) return 0; const ang = Math.atan2(y - CY, x - CX) + (vn(x * .03, y * .03, seed + 13) - .5) * .5;
  return ang > 0.75 && ang < 2.4 ? 3 : (ang > 2.55 || ang < -2.75) ? 4 : 0;
}
export const ddOf = (x, y, seed) => Math.hypot(x - CX, y - CY) + (vn(x * 0.05, y * 0.05, seed + 7) - 0.5) * 18;
// layout 2: which region a tile belongs to — start (moss) · moss north / mushroom south · crystal north, lava south-east, ice south-west
// the edges only ever bulge outward: no crystal, lava or ice ground ever reaches inside the two inner rings
export function region2(x, y, seed) { const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy), n = vn(x * .018, y * .018, seed + 7) * 16;
  if (d < L2.r1 + n * .5) return 0; const ang = Math.atan2(dy, dx) + (vn(x * .012, y * .012, seed + 13) - .5) * .4;
  if (d < L2.r2 + n) return Math.sin(ang + .35) < 0 ? 0 : 1;
  let deg = ang * 180 / Math.PI; if (deg < -150) deg += 360; return deg < -30 ? 2 : deg < 90 ? 3 : 4; }
// layout 2 walls: plenty of plain dirt and stone in every region, with that region's own rock and ore veins in between
// q (map version 3 only): a small per-seed shift of the ore thresholds, so ore is a little richer or poorer from world to world
export function wallFor2(b, x, y, s, q = 0) { const v22 = k => vn(x * .1, y * .1, s + k), v06 = k => vn(x * .035, y * .035, s + k);
  if (b === 0) return v22(21) > .75 + q ? 4 : v06(33) > .62 ? 2 : 1;
  if (b === 1) return v22(41) > .75 + q ? 5 : v22(21) > .8 + q ? 4 : v06(35) > .6 ? 1 : 2;
  if (b === 2) return v06(51) > .55 ? (quartzAt(x, y, s) ? 13 : 3) : v22(41) > .76 + q ? 5 : v06(37) > .62 ? 1 : 2;
  if (b === 3) return v22(61) > .76 + q ? 10 : v06(63) > .55 ? 9 : v06(65) > .62 ? 1 : 2;
  return v22(71) > .76 + q ? 12 : v06(73) > .55 ? 11 : v06(75) > .6 ? 1 : 2; }
// v70 (BF-04) map version 3: every region gets its own cave shape per seed (and per try, t) — how big the caves are (noise scale), how open (threshold),
// how wide and how winding the long tunnels are, and the ore shift above. Layouts 1 and 2 never use this.
export function terr3(seed, t) { if (!(t >= 0)) return null; const R = rng(((seed ^ 0x5eed3) + 7919 * t) >>> 0), o = [];
  for (let b = 0; b < 5; b++) o.push({ sc: .055 * (.85 + .3 * R()), op: .6 + (R() - .5) * .06, tsc: .025 * (.8 + .4 * R()), tw: .02 * (.75 + .5 * R()), ore: (R() - .5) * .04 });
  return o; }
export function smoothCaves(wall, floor, biome, seed, T3) {
  for (let pass = 0; pass < 2; pass++) { const next = wall.slice();
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const i = idx(x, y), w = wall[i]; if (w === 8 || floor[i] === WATER) continue;
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && wall[i + dy * W + dx]) n++;
      if (w && n <= 2) next[i] = 0; else if (!w && n >= 6) next[i] = wallFor2(biome[i], x, y, seed, T3 ? T3[biome[i]].ore : 0); }
    wall.set(next); } }
export function genWorld(seed) {
  const wall = new Uint8Array(W * H), floor = new Uint8Array(W * H), biome = new Uint8Array(W * H), objs = new Map();
  const T3 = LAY === 2 && MAPV === 3 && ANCH ? terr3(seed, ANCH.t) : null;
  if (LAY === 2) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { // the ring map
    const i = idx(x, y), d = Math.hypot(x - CX, y - CY), b = region2(x, y, seed), sea = d + (vn(x * .04, y * .04, seed + 17) - .5) * 10 >= L2.r3; biome[i] = b;
    floor[i] = b === 0 ? (vn(x * .07, y * .07, seed + 3) > 0.66 ? 2 : 1) : b === 1 ? 3 : b === 3 ? 18 : b === 4 ? 19 : 4;
    if (d >= L2.r4 || x < 2 || y < 2 || x > W - 3 || y > H - 3) { wall[i] = 8; continue; }
    if (sea) { floor[i] = WATER; if (vn(x * .06, y * .06, seed + 19) > .78) wall[i] = 2; continue; }
    const k = T3 && T3[b], open = k ? fbm(x * k.sc, y * k.sc, seed) > k.op || Math.abs(vn(x * k.tsc, y * k.tsc, seed + 11) - 0.5) < k.tw : fbm(x * 0.055, y * 0.055, seed) > 0.6 || Math.abs(vn(x * 0.025, y * 0.025, seed + 11) - 0.5) < 0.02;
    if (!open) wall[i] = wallFor2(b, x, y, seed, k ? k.ore : 0);
  }
  if (LAY === 2) smoothCaves(wall, floor, biome, seed, T3); // clean up lone specks of rock and pinholes so the map reads in big shapes
  else for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = idx(x, y), dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy);
    const dd = d + (vn(x * 0.05, y * 0.05, seed + 7) - 0.5) * 18, ca = d > 0 ? dx / d : 1;
    let b = dd < 30 ? 0 : dd > 66 ? 2 : (ca + (vn(x * .04, y * .04, seed + 9) - 0.5) * 0.6 > 0.3 ? 0 : 1);
    const rg = deepRegion(x, y, dd, seed); if (rg) b = rg;
    biome[i] = b;
    floor[i] = b === 0 ? (vn(x * .16, y * .16, seed + 3) > 0.66 ? 2 : 1) : b === 1 ? 3 : b === 3 ? 18 : b === 4 ? 19 : 4;
    const open = fbm(x * 0.085, y * 0.085, seed) > 0.585 || Math.abs(vn(x * 0.035, y * 0.035, seed + 11) - 0.5) < 0.028;
    if (d > 95 || x < 2 || y < 2 || x > W - 3 || y > H - 3) wall[i] = 8;
    else if (!open) wall[i] = wallFor(b, x, y, seed);
  }
  const circ = (cx, cy, r, fn) => { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) { if (x < 2 || y < 2 || x > W - 3 || y > H - 3) continue; const d = Math.hypot(x - cx, y - cy); if (d <= r) fn(x, y, idx(x, y), d); } };
  const carve = (x, y) => { if (x < 2 || y < 2 || x > W - 3 || y > H - 3) return; const i = idx(x, y); if (wall[i] !== 8) wall[i] = 0; };
  const walk = (sx, sy, tx, ty, s) => { const R = rng(s); let x = sx, y = sy, n = 0; while ((Math.abs(x - tx) + Math.abs(y - ty)) > 1 && n++ < 5000) { if (R() < 0.6) { if (Math.abs(tx - x) > Math.abs(ty - y)) x += Math.sign(tx - x); else y += Math.sign(ty - y); } else { const k = R() * 4 | 0; x += [1, -1, 0, 0][k]; y += [0, 0, 1, -1][k]; } carve(x, y); carve(x + 1, y); carve(x, y + 1); carve(x + 1, y + 1); } };
  const walks2 = () => { walk(CX + 6, CY - 4, BX - 6, BY + 5, seed + 5); walk(CX - 6, CY + 4, SA.x + 6, SA.y - 4, seed + 6); for (let k = 6; k <= 10; k++) { carve(BX, BY - k); carve(BX + 1, BY - k); } walk(BX, BY - 9, SB.x, SB.y + 9, seed + 8); };
  // map version 3: the same five tunnels, from room to room in whatever direction the rooms now lie (lava and ice end inside their
  // rooms' rock ring, which is drawn over them below, so the deep rooms stay sealed as before)
  const edge = (P, Q, r) => { const d = Math.hypot(Q.x - P.x, Q.y - P.y) || 1; return { x: Math.round(P.x + (Q.x - P.x) / d * r), y: Math.round(P.y + (Q.y - P.y) / d * r) }; };
  const tun = (P, Q, rp, rq, s) => { const a = edge(P, Q, rp), b = edge(Q, P, rq); walk(a.x, a.y, b.x, b.y, s); };
  const walks3 = () => { const C0 = { x: CX, y: CY }, Bp = { x: BX, y: BY }; tun(C0, Bp, 6, 6, seed + 5); tun(C0, SA, 6, 6, seed + 6); tun(Bp, SB, 6, 6, seed + 8); };
  if (LAY === 2 && MAPV === 3) { walks3(); tun({ x: CX, y: CY }, SL, 6, 7, seed + 9); tun(SA, SI, 6, 7, seed + 10); }
  else if (LAY === 2) { walks2(); walk(CX + 5, CY + 9, SL.x - 7, SL.y - 5, seed + 9); walk(SA.x - 4, SA.y + 8, SI.x + 7, SI.y - 4, seed + 10); }
  else { walk(CX + 8, CY, BX - 9, BY, seed + 5); walk(CX - 8, CY + 2, SA.x + 5, SA.y, seed + 6); }
  circ(CX + .5, CY + .5, 8.5, (x, y, i) => { wall[i] = 0; floor[i] = 1; biome[i] = 0; });
  circ(BX + .5, BY + .5, 9.6, (x, y, i, d) => { biome[i] = 0; if (d < 7.6 || (x < BX && Math.abs(y - BY) <= 1)) { wall[i] = 0; floor[i] = d < 3 ? 6 : 2; } else wall[i] = (x * 7 + y * 3) % 5 === 0 ? 4 : 1; });
  circ(SA.x + .5, SA.y + .5, 8.2, (x, y, i, d) => { wall[i] = 0; biome[i] = 1; floor[i] = d < 4.6 ? 6 : 3; });
  circ(SB.x + .5, SB.y + .5, 8.2, (x, y, i, d) => { wall[i] = 0; biome[i] = 2; floor[i] = d < 4.6 ? 6 : 4; });
  // the deep regions are sealed by a band of hard rock, so you need a crystal pickaxe to get in
  if (LAY === 1) for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (biome[i] < 3 || wall[i] === 8 || Math.hypot(x - SL.x - .5, y - SL.y - .5) <= 9.6 || Math.hypot(x - SI.x - .5, y - SI.y - .5) <= 9.6) continue; let edge = false; for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (biome[idx(xx, yy)] < 3) { edge = true; break; } } if (edge) wall[i] = wallFor(biome[i], x, y, seed); }
  for (const [S, b, fl] of [[SL, 3, 18], [SI, 4, 19]]) circ(S.x + .5, S.y + .5, 9.6, (x, y, i, d) => { if (wall[i] === 8) return; biome[i] = b; if (d < 7.6) { wall[i] = 0; floor[i] = d < 3 ? 6 : fl; } else wall[i] = b === 3 ? 9 : 11; });
  // bug fix (v49.1): on the ring map the slime king's rock ring was drawn over the tunnels, so his room (and the golem's tunnel, which starts there) was often sealed — carve them through again
  if (LAY === 2) (MAPV === 3 ? walks3 : walks2)();
  // v109: 시작 둘레(등불나무에서 START_DIRT_R칸 안, 이끼 지역)의 돌벽은 흙벽으로 — 나무 곡괭이로 처음부터 캘 수 있게 (구리 광맥은 그대로)
  if (LAY === 2) circ(CX + .5, CY + .5, START_DIRT_R, (x, y, i) => { if (wall[i] === 2 && biome[i] === 0) wall[i] = 1; });
  // natural objects
  const nearSafe = (x, y) => Math.hypot(x - CX, y - CY) < 9.5 || Math.hypot(x - BX, y - BY) < 10.5 || Math.hypot(x - SA.x, y - SA.y) < 9.5 || Math.hypot(x - SB.x, y - SB.y) < 9.5 || Math.hypot(x - SL.x, y - SL.y) < 10.5 || Math.hypot(x - SI.x, y - SI.y) < 10.5;
  addWater({ wall, floor, objs }, seed, nearSafe, null);
  for (let i = 0; i < W * H; i++) if (floor[i] === WATER && !(LAY === 2 && Math.hypot(i % W - CX, ((i / W) | 0) - CY) > L2.r3 - 12)) { if (biome[i] === 3) floor[i] = LAVA; else if (biome[i] === 4 && hash2(i % W, (i / W) | 0, seed + 3) < .7) floor[i] = 20; }
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const i = idx(x, y), dT = Math.hypot(x - CX, y - CY), home = dT < 9.5; if (wall[i] || floor[i] === WATER || (nearSafe(x, y) && !home)) continue;
    if (home && (dT < 3.2 || (y >= CY + 1 && y <= CY + 5 && x >= CX - 5 && x <= CX + 5))) continue; // keep the tree and the starter deck clear
    const r = hash2(x, y, seed + 99), b = biome[i]; let t = null;
    const grove = 0.45 + 1.3 * vn(x * 0.09, y * 0.09, seed + 31), mead = 0.5 + 1.2 * vn(x * 0.07, y * 0.07, seed + 57); // woods and meadows come in patches
    // v74: root pillars 1/3, moss grass 1/2 of before (bush·glow·big shroom amounts unchanged)
    if (b === 0) { const rt = 0.05 * grove / 3, bu = rt + 0.014, gr = bu + 0.13 * mead / 2; t = r < rt ? 'root' : r < bu ? 'bush' : r < gr ? 'grass' : r < gr + 0.01 ? 'glow' : null; }
    else if (b === 1) { const re = 0.03 + 0.02 * grove / 3, ge = re + Math.max(0, 0.042 - 0.02 * grove), gre = ge + 0.04 * mead, be = gre + Math.max(0, 0.088 - 0.08 * mead); t = r < 0.03 ? 'bigShroom' : r < re ? 'root' : r < ge ? 'glow' : r < gre ? 'grass' : r < be ? 'bush' : null; }
    else if (b === 3) t = r < 0.022 ? 'fireBloom' : null;
    else if (b === 4) t = r < 0.02 ? 'iceCluster' : null;
    else t = r < 0.024 ? 'cluster' : r < 0.036 ? 'glow' : null;
    if (t) objs.set(i, t === 'bush' ? { t, r: 0 } : { t });
  }
  for (let y = CY - 1; y <= CY; y++) for (let x = CX - 1; x <= CX + 1; x++) objs.set(idx(x, y), { t: 'treeP' });
  for (let y = CY + 2; y <= CY + 4; y++) for (let x = CX - 4; x <= CX + 4; x++) floor[idx(x, y)] = 5;
  const put = (dx, dy, o) => objs.set(idx(CX + dx, CY + dy), o);
  [[7, -1], [-7, 1], [5, -5], [-6, 5], [3, 8]].forEach(([a, b]) => put(a, b, { t: 'root' }));
  [[-3, -6], [6, -3]].forEach(([a, b]) => put(a, b, { t: 'bush', r: 0 }));
  [[-2, -7], [4, 6]].forEach(([a, b]) => put(a, b, { t: 'glow' }));
  [[-7, -2], [-5, 3], [-1, 6], [-4, -4], [-6, -5], [2, 7], [6, 5]].forEach(([a, b]) => put(a, b, { t: 'grass' }));
  put(-4, 2, { t: 'plant' }); put(-3, 3, { t: 'chair' }); put(-2, 3, { t: 'table' }); [[-1, 3], [-2, 4], [-1, 4]].forEach(([a, b]) => put(a, b, { t: '_part', a: idx(CX - 2, CY + 3) })); /* v122: 둥근 탁자 2×2 */ put(0, 3, { t: 'rug' }); put(4, 2, { t: 'lampShroom' }); put(-4, 4, { t: 'torch' });
  const starter = [['bed', 1], ['chair', 1], ['table', 1], ['plant', 1], ['rug', 2], ['cushion', 1], ['vase', 1], ['shelf', 1], ['lampShroom', 1], ['torch', 4], ['wallWood', 10], ['floorWood', 12]];
  put(2, 3, { t: 'chest', items: starter.map(([id, c]) => ({ id, c })).concat(Array(18 - starter.length).fill(null)) });
  objs.set(idx(SA.x, SA.y), { t: 'shrine', has: 1 }); objs.set(idx(SB.x, SB.y), { t: 'shrine', has: 1 }); objs.set(idx(SL.x, SL.y), { t: 'shrine', has: 1 }); objs.set(idx(SI.x, SI.y), { t: 'shrine', has: 1 });
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; objs.set(idx(Math.round(SL.x + Math.cos(a) * 3.4), Math.round(SL.y + Math.sin(a) * 3.4)), { t: 'fireBloom' }); objs.set(idx(Math.round(SI.x + Math.cos(a) * 3.4), Math.round(SI.y + Math.sin(a) * 3.4)), { t: 'iceCluster' }); }
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; objs.set(idx(Math.round(SA.x + Math.cos(a) * 3.4), Math.round(SA.y + Math.sin(a) * 3.4)), { t: 'glow' }); objs.set(idx(Math.round(SB.x + Math.cos(a) * 3.4), Math.round(SB.y + Math.sin(a) * 3.4)), { t: 'cluster' }); }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .6; objs.set(idx(Math.round(BX + Math.cos(a) * 6.3), Math.round(BY + Math.sin(a) * 6.3)), { t: 'glow' }); }
  addPond({ wall, floor, objs }, null);
  return { wall, floor, biome, objs };
}
export function addWater(w, seed, nearSafe, ok) {
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = idx(x, y); if (w.wall[i] || nearSafe(x, y) || vn(x * .09, y * .09, seed + 77) < (LAY === 2 ? 0.76 : 0.715)) continue;
    let open = true; for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) if (w.wall[i + dy * W + dx]) { open = false; break; }
    if (!open || (ok && !ok(i))) continue; w.floor[i] = WATER; w.objs.delete(i);
  }
}
export function addPond(w, ok) {
  for (let y = CY - 6; y <= CY - 2; y++) for (let x = CX + 2; x <= CX + 8; x++) {
    const dx = (x + .5 - (CX + 5)) / 2.4, dy = (y + .5 - (CY - 4.2)) / 1.5; if (dx * dx + dy * dy > 1) continue;
    const i = idx(x, y); if (ok && !ok(i)) continue; if (w.wall[i] !== 8) w.wall[i] = 0; w.floor[i] = WATER; w.objs.delete(i);
  }
}
export function addQuartzVeins() { let n = 0; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (G.wall[i] === 3 && G.biome[i] === 2 && quartzAt(x, y, G.seed)) { G.wall[i] = 13; n++; } } return n; }

export let DOORS = new Set();
export const refreshDoors = () => { DOORS = new Set((G.rooms || []).filter(r => !r.found).map(r => idx(r.dx, r.dy))); };
export function placeRooms(w0) {
  const rooms = [], safe = [[CX, CY], [BX, BY], [SA.x, SA.y], [SB.x, SB.y], [SL.x, SL.y], [SI.x, SI.y]], cand = [[], [], [], [], []];
  for (let y = 4; y < H - 8; y += 2) for (let x = 4; x < W - 8; x += 2) { const b = G.biome[idx(x + 1, y + 1)]; if (b <= 4) cand[b].push([x, y, hash2(x, y, (G.seed | 0) + 77)]); }
  const untouched = i => G.wall[i] && G.wall[i] !== 8 && G.wall[i] === w0.wall[i] && !G.objs.get(i) && !G.wire.has(i) && !G.under.has(i);
  const open = i => !G.wall[i] && G.floor[i] !== WATER && G.floor[i] !== LAVA && !G.objs.get(i);
  // the cracked wall faces an open tunnel on any side; a region that still has no room after that takes a door into plain rock
  for (let pass = 0; pass < 2; pass++) for (let b = 0; b < 5; b++) { cand[b].sort((a, c) => a[2] - c[2]); let n = rooms.filter(r => r.b === b).length; if (pass && n) continue;
    for (const [x, y] of cand[b]) { if (n >= ROOM_N[b]) break;
      if (safe.some(([sx, sy]) => Math.hypot(x + 2 - sx, y + 1 - sy) < 16) || rooms.some(r => Math.hypot(r.x - x, r.y - y) < 24)) continue;
      let ok = true; for (let yy = y - 1; yy <= y + 3 && ok; yy++) for (let xx = x - 1; xx <= x + 4; xx++) { const i = idx(xx, yy); if (!untouched(i) || G.biome[i] !== b) { ok = false; break; } }
      if (!ok) continue;
      const h = hash2(x, y, 5) < .5 ? 0 : 1, sides = [[x + 1 + h, y + 3, 0, 1], [x - 1, y + 1, -1, 0], [x + 4, y + 1, 1, 0], [x + 1 + h, y - 1, 0, -1]];
      const door = sides.find(([dx, dy, ox, oy]) => inB(dx + ox, dy + oy) && open(idx(dx + ox, dy + oy))) || (pass ? sides[0] : null);
      if (!door) continue; const [dx, dy] = door;
      for (let yy = y; yy <= y + 2; yy++) for (let xx = x; xx <= x + 3; xx++) { const i = idx(xx, yy); G.wall[i] = 0; G.floor[i] = 6; G.wdmg.delete(i); }
      const spots = [[x + 1, y], [x + 2, y], [x + 1, y + 2], [x + 2, y + 2]].sort((a, c) => Math.hypot(c[0] - dx, c[1] - dy) - Math.hypot(a[0] - dx, a[1] - dy)), [cx, cy] = spots[0];
      G.objs.set(idx(cx, cy), { t: 'tchest', hid: 1 }); // stays dark until the room is found
      rooms.push({ id: 'r' + b + n, b, k: n, x, y, dx, dy, cx, cy, found: 0, open: 0, hint: 0 }); n++; } }
  return rooms;
}
export const cleanRooms = a => a.filter(r => r && Number.isInteger(r.x) && Number.isInteger(r.y) && Number.isInteger(r.b) && r.b >= 0 && r.b < 5).map(r => ({ id: String(r.id || ''), b: r.b, k: r.k | 0, x: r.x, y: r.y, dx: r.dx | 0, dy: r.dy | 0, cx: r.cx | 0, cy: r.cy | 0, found: r.found ? 1 : 0, open: r.open ? 1 : 0, hint: r.hint ? 1 : 0 }));
export function roomTick() {
  const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let ch = false;
  for (const r of G.rooms || []) { if (r.found) continue;
    if ((px >= r.x && px <= r.x + 3 && py >= r.y && py <= r.y + 2) || !G.wall[idx(r.dx, r.dy)]) { r.found = 1; ch = true; const tc = G.objs.get(idx(r.cx, r.cy)); if (tc) delete tc.hid; G.stats.rooms = (G.stats.rooms || 0) + 1; emit('toast', '숨은 방을 찾았어요! 보물상자를 열어 봐요', 'good', 'room'); emit('sfx', 'seed'); continue; }
    if (!r.hint && Math.hypot(p.x - r.dx - .5, p.y - r.dy - .5) < 3.2) { r.hint = 1; emit('toast', '금 간 벽 틈으로 바람이 새어 나와요… 이 벽 너머에 뭔가 있는 것 같아요', null, 'roomhint'); } }
  if (ch) { refreshDoors(); markLight(); }
}
export function openTreasure(t, o) {
  if (o.open) return; o.open = 1; const r = (G.rooms || []).find(q => q.cx === t.x && q.cy === t.y); const loot = r ? (ROOM_LOOT[r.b][r.k] || ROOM_LOOT[r.b][0]).slice() : [['crystal', 3], ['gel', 3]];
  delete o.hid; if (r) { r.open = 1; if (!r.found) { r.found = 1; refreshDoors(); } if (r.k === 0) loot.push([ROOM_DECO[r.b], 1]); for (const id of roomNotes(r)) if (!knows(id)) loot.push(['rn_' + id, 1]); }
  for (const [id, c] of loot) spawnDrop(id, c, t.x + .5, t.y + .9);
  G.stats.chests = (G.stats.chests || 0) + 1; emit('sfx', 'win'); emit('puff', t.x + .5, t.y + .4, '#ffe9a8', 18, 2.8, .5); gainXp(20); emit('toast', '보물상자를 열었어요!', 'good'); markLight(); checkGuide();
}

// ================= v70 (BF-04): map version 3 — boss rooms and altars at per-seed places, checked before play =================
// Places (angle in degrees, 0 = east, -90 = north; distance from the lantern tree in tiles), approved 2026-10-14:
// slime king (moss) and mushroom queen 55–80 tiles out, within ±40° of their old angle; golem (crystal), turtle (lava) and spirit (ice)
// 150–200 tiles out, within ±25° of their sector's middle. Every room keeps 15° or more from its region's edges (so the angle ranges
// below are those windows cut to stay inside the region), and the five rooms are 60 tiles or more apart.
// A world passes when the tunnels really lead from the tree to the slime king, the queen and the golem, and to the rock rings of the
// lava and ice rooms (which stay sealed as before); each room sits in its own region; and every resource has at least 80% of the
// smallest amount seen on the fixed ring map (layout 2, 130 seeds; root pillars cut to 1/3 in v74, so 252 → 84). Up to 20 tries, then the fixed places of layout 2.
// v109: 새 세계에서 등불나무 둘레 이 칸 수 안의 이끼 지역 돌벽은 흙벽으로 (genWorld)
export const START_DIRT_R = 35;
export const BF04 = { tries: 20, gap: 60, near: [55, 80], far: [150, 200],
  ang: { B: [-75, -35], A: [100, 145], SB: [-115, -65], SL: [5, 55], SI: [125, 175] }, reg: { B: 0, A: 1, SB: 2, SL: 3, SI: 4 },
  minWall: { 4: 1460, 5: 2176, 10: 2402, 12: 2852, 13: 1276 }, minObj: { root: 84, bigShroom: 68, cluster: 201, glow: 208, fireBloom: 220, iceCluster: 176 } };
const AKEYS = ['B', 'A', 'SB', 'SL', 'SI'];
export function rollAnch(seed, k) { const R = rng((Math.imul(seed | 0, 31) + 977 * (k + 1)) >>> 0), u = (a, b) => a + (b - a) * R(), o = {};
  for (const key of AKEYS) { const [a0, a1] = BF04.ang[key], [d0, d1] = key === 'B' || key === 'A' ? BF04.near : BF04.far; o[key] = [Math.round(u(a0, a1)), Math.round(u(d0, d1))]; }
  o.t = k; return o; } // each try also gets its own cave shape (terr3), so a world short of some resource can be fixed by trying again
const anchPts = () => ({ B: { x: BX, y: BY }, A: SA, SB, SL, SI });
// why a world fails ('' = it passes); call after setLayout(3, anchors) and genWorld
export function checkWorld(w) { const P = anchPts();
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) if (Math.hypot(P[AKEYS[i]].x - P[AKEYS[j]].x, P[AKEYS[i]].y - P[AKEYS[j]].y) < BF04.gap) return 'gap ' + AKEYS[i] + '-' + AKEYS[j];
  for (const k of AKEYS) { const S = P[k]; let n = 0, ok = 0; // the region around the room (outside its own circle)
    for (let y = S.y - 14; y <= S.y + 14; y++) for (let x = S.x - 14; x <= S.x + 14; x++) { const d = Math.hypot(x - S.x, y - S.y); if (d < 10 || d > 14 || !inB(x, y)) continue; n++; if (w.biome[idx(x, y)] === BF04.reg[k]) ok++; }
    if (ok < n * .9) return 'region ' + k; }
  const N = W * H, seen = new Uint8Array(N), q = [idx(CX, CY + 2)]; seen[q[0]] = 1; // walk without digging or swimming
  for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W; for (const [d, dx] of [[1, 1], [-1, -1], [W, 0], [-W, 0]]) { const j = i + d; if (x + dx < 0 || x + dx >= W || j < 0 || j >= N || seen[j] || w.wall[j] || w.floor[j] === WATER || w.floor[j] === LAVA) continue; seen[j] = 1; q.push(j); } }
  const near = (S, r) => { for (let y = S.y - r; y <= S.y + r; y++) for (let x = S.x - r; x <= S.x + r; x++) if (inB(x, y) && Math.hypot(x - S.x, y - S.y) <= r && seen[idx(x, y)]) return true; return false; };
  for (const k of ['B', 'A', 'SB']) if (!seen[idx(P[k].x, P[k].y)]) return 'path ' + k;
  for (const k of ['SL', 'SI']) if (!near(P[k], 12)) return 'path ' + k;
  const wc = {}; for (let i = 0; i < N; i++) { const v = w.wall[i]; if (BF04.minWall[v]) wc[v] = (wc[v] || 0) + 1; }
  for (const v in BF04.minWall) if ((wc[v] || 0) < BF04.minWall[v]) return 'wall ' + v;
  const oc = {}; for (const o of w.objs.values()) if (BF04.minObj[o.t]) oc[o.t] = (oc[o.t] || 0) + 1;
  for (const t in BF04.minObj) if ((oc[t] || 0) < BF04.minObj[t]) return 'obj ' + t;
  return ''; }
// a new world on map version 3: try up to 20 sets of places and cave shapes; if none passes, layout 2's fixed places and cave shape
// (still saved as map version 3 with t = -1; the tunnels are drawn the version-3 way, from room edge to room edge)
export function makeWorld3(seed, chk = checkWorld) { const why = [];
  for (let k = 0; k < BF04.tries; k++) { setLayout(3, rollAnch(seed, k)); const w = genWorld(seed), r = chk(w); if (!r) return { w, tries: k + 1, why }; why.push(r); }
  setLayout(3, { ...ANCH2, t: -1 }); return { w: genWorld(seed), tries: 0, why }; }
