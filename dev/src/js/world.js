// ================= world gen =================
const quartzAt = (x, y, s) => vn(x * .22, y * .22, s + 81) > 0.71; // v43: quartz veins inside the crystal cave's granite
function wallFor(b, x, y, s) {
  if (b === 0) return vn(x * .22, y * .22, s + 21) > 0.72 ? 4 : 1;
  if (b === 1) { if (vn(x * .07, y * .07, s + 31) > 0.47) return vn(x * .22, y * .22, s + 41) > 0.73 ? 5 : 2; return vn(x * .22, y * .22, s + 21) > 0.74 ? 4 : 1; }
  if (b === 3) return vn(x * .2, y * .2, s + 61) > 0.72 ? 10 : 9;
  if (b === 4) return vn(x * .2, y * .2, s + 71) > 0.72 ? 12 : 11;
  if (vn(x * .08, y * .08, s + 51) > 0.4) return quartzAt(x, y, s) ? 13 : 3; return vn(x * .22, y * .22, s + 41) > 0.7 ? 5 : 2;
}
function deepRegion(x, y, dd, seed) {
  if (dd <= 71) return 0; const ang = Math.atan2(y - CY, x - CX) + (vn(x * .03, y * .03, seed + 13) - .5) * .5;
  return ang > 0.75 && ang < 2.4 ? 3 : (ang > 2.55 || ang < -2.75) ? 4 : 0;
}
const ddOf = (x, y, seed) => Math.hypot(x - CX, y - CY) + (vn(x * 0.05, y * 0.05, seed + 7) - 0.5) * 18;
// layout 2: which region a tile belongs to — start (moss) · moss north / mushroom south · crystal north, lava south-east, ice south-west
// the edges only ever bulge outward: no crystal, lava or ice ground ever reaches inside the two inner rings
function region2(x, y, seed) { const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy), n = vn(x * .018, y * .018, seed + 7) * 16;
  if (d < L2.r1 + n * .5) return 0; const ang = Math.atan2(dy, dx) + (vn(x * .012, y * .012, seed + 13) - .5) * .4;
  if (d < L2.r2 + n) return Math.sin(ang + .35) < 0 ? 0 : 1;
  let deg = ang * 180 / Math.PI; if (deg < -150) deg += 360; return deg < -30 ? 2 : deg < 90 ? 3 : 4; }
// layout 2 walls: plenty of plain dirt and stone in every region, with that region's own rock and ore veins in between
function wallFor2(b, x, y, s) { const v22 = k => vn(x * .1, y * .1, s + k), v06 = k => vn(x * .035, y * .035, s + k);
  if (b === 0) return v22(21) > .75 ? 4 : v06(33) > .62 ? 2 : 1;
  if (b === 1) return v22(41) > .75 ? 5 : v22(21) > .8 ? 4 : v06(35) > .6 ? 1 : 2;
  if (b === 2) return v06(51) > .55 ? (quartzAt(x, y, s) ? 13 : 3) : v22(41) > .76 ? 5 : v06(37) > .62 ? 1 : 2;
  if (b === 3) return v22(61) > .76 ? 10 : v06(63) > .55 ? 9 : v06(65) > .62 ? 1 : 2;
  return v22(71) > .76 ? 12 : v06(73) > .55 ? 11 : v06(75) > .6 ? 1 : 2; }
function smoothCaves(wall, floor, biome, seed) {
  for (let pass = 0; pass < 2; pass++) { const next = wall.slice();
    for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) { const i = idx(x, y), w = wall[i]; if (w === 8 || floor[i] === WATER) continue;
      let n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && wall[i + dy * W + dx]) n++;
      if (w && n <= 2) next[i] = 0; else if (!w && n >= 6) next[i] = wallFor2(biome[i], x, y, seed); }
    wall.set(next); } }
function genWorld(seed) {
  const wall = new Uint8Array(W * H), floor = new Uint8Array(W * H), biome = new Uint8Array(W * H), objs = new Map();
  if (LAY === 2) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { // the ring map
    const i = idx(x, y), d = Math.hypot(x - CX, y - CY), b = region2(x, y, seed), sea = d + (vn(x * .04, y * .04, seed + 17) - .5) * 10 >= L2.r3; biome[i] = b;
    floor[i] = b === 0 ? (vn(x * .07, y * .07, seed + 3) > 0.66 ? 2 : 1) : b === 1 ? 3 : b === 3 ? 18 : b === 4 ? 19 : 4;
    if (d >= L2.r4 || x < 2 || y < 2 || x > W - 3 || y > H - 3) { wall[i] = 8; continue; }
    if (sea) { floor[i] = WATER; if (vn(x * .06, y * .06, seed + 19) > .78) wall[i] = 2; continue; }
    const open = fbm(x * 0.055, y * 0.055, seed) > 0.6 || Math.abs(vn(x * 0.025, y * 0.025, seed + 11) - 0.5) < 0.02;
    if (!open) wall[i] = wallFor2(b, x, y, seed);
  }
  if (LAY === 2) smoothCaves(wall, floor, biome, seed); // clean up lone specks of rock and pinholes so the map reads in big shapes
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
  if (LAY === 2) { walks2(); walk(CX + 5, CY + 9, SL.x - 7, SL.y - 5, seed + 9); walk(SA.x - 4, SA.y + 8, SI.x + 7, SI.y - 4, seed + 10); }
  else { walk(CX + 8, CY, BX - 9, BY, seed + 5); walk(CX - 8, CY + 2, SA.x + 5, SA.y, seed + 6); }
  circ(CX + .5, CY + .5, 8.5, (x, y, i) => { wall[i] = 0; floor[i] = 1; biome[i] = 0; });
  circ(BX + .5, BY + .5, 9.6, (x, y, i, d) => { biome[i] = 0; if (d < 7.6 || (x < BX && Math.abs(y - BY) <= 1)) { wall[i] = 0; floor[i] = d < 3 ? 6 : 2; } else wall[i] = (x * 7 + y * 3) % 5 === 0 ? 4 : 1; });
  circ(SA.x + .5, SA.y + .5, 8.2, (x, y, i, d) => { wall[i] = 0; biome[i] = 1; floor[i] = d < 4.6 ? 6 : 3; });
  circ(SB.x + .5, SB.y + .5, 8.2, (x, y, i, d) => { wall[i] = 0; biome[i] = 2; floor[i] = d < 4.6 ? 6 : 4; });
  // the deep regions are sealed by a band of hard rock, so you need a crystal pickaxe to get in
  if (LAY === 1) for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (biome[i] < 3 || wall[i] === 8 || Math.hypot(x - SL.x - .5, y - SL.y - .5) <= 9.6 || Math.hypot(x - SI.x - .5, y - SI.y - .5) <= 9.6) continue; let edge = false; for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (biome[idx(xx, yy)] < 3) { edge = true; break; } } if (edge) wall[i] = wallFor(biome[i], x, y, seed); }
  for (const [S, b, fl] of [[SL, 3, 18], [SI, 4, 19]]) circ(S.x + .5, S.y + .5, 9.6, (x, y, i, d) => { if (wall[i] === 8) return; biome[i] = b; if (d < 7.6) { wall[i] = 0; floor[i] = d < 3 ? 6 : fl; } else wall[i] = b === 3 ? 9 : 11; });
  // bug fix (v49.1): on the ring map the slime king's rock ring was drawn over the tunnels, so his room (and the golem's tunnel, which starts there) was often sealed — carve them through again
  if (LAY === 2) walks2();
  // natural objects
  const nearSafe = (x, y) => Math.hypot(x - CX, y - CY) < 9.5 || Math.hypot(x - BX, y - BY) < 10.5 || Math.hypot(x - SA.x, y - SA.y) < 9.5 || Math.hypot(x - SB.x, y - SB.y) < 9.5 || Math.hypot(x - SL.x, y - SL.y) < 10.5 || Math.hypot(x - SI.x, y - SI.y) < 10.5;
  addWater({ wall, floor, objs }, seed, nearSafe, null);
  for (let i = 0; i < W * H; i++) if (floor[i] === WATER && !(LAY === 2 && Math.hypot(i % W - CX, ((i / W) | 0) - CY) > L2.r3 - 12)) { if (biome[i] === 3) floor[i] = LAVA; else if (biome[i] === 4 && hash2(i % W, (i / W) | 0, seed + 3) < .7) floor[i] = 20; }
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    const i = idx(x, y), dT = Math.hypot(x - CX, y - CY), home = dT < 9.5; if (wall[i] || floor[i] === WATER || (nearSafe(x, y) && !home)) continue;
    if (home && (dT < 3.2 || (y >= CY + 1 && y <= CY + 5 && x >= CX - 5 && x <= CX + 5))) continue; // keep the tree and the starter deck clear
    const r = hash2(x, y, seed + 99), b = biome[i]; let t = null;
    const grove = 0.45 + 1.3 * vn(x * 0.09, y * 0.09, seed + 31), mead = 0.5 + 1.2 * vn(x * 0.07, y * 0.07, seed + 57); // woods and meadows come in patches
    if (b === 0) { const rt = 0.05 * grove, bu = rt + 0.014, gr = bu + 0.13 * mead; t = r < rt ? 'root' : r < bu ? 'bush' : r < gr ? 'grass' : r < gr + 0.01 ? 'glow' : null; }
    else if (b === 1) t = r < 0.03 ? 'bigShroom' : r < 0.03 + 0.02 * grove ? 'root' : r < 0.072 ? 'glow' : r < 0.072 + 0.08 * mead ? 'grass' : r < 0.16 ? 'bush' : null;
    else if (b === 3) t = r < 0.022 ? 'fireBloom' : null;
    else if (b === 4) t = r < 0.02 ? 'iceCluster' : null;
    else t = r < 0.024 ? 'cluster' : r < 0.036 ? 'glow' : null;
    if (t) objs.set(i, t === 'bush' ? { t, r: 0 } : { t });
  }
  for (let y = CY - 1; y <= CY; y++) for (let x = CX - 1; x <= CX + 1; x++) objs.set(idx(x, y), { t: 'treeP' });
  for (let y = CY + 2; y <= CY + 4; y++) for (let x = CX - 4; x <= CX + 4; x++) floor[idx(x, y)] = 5;
  const put = (dx, dy, o) => objs.set(idx(CX + dx, CY + dy), o);
  [[7, -1], [-7, 1], [5, -5], [-5, -6], [1, -7], [-6, 5], [7, 4], [-3, 7], [8, 2], [-8, -3], [3, 8], [-2, -8], [8, -4], [-7, 6]].forEach(([a, b]) => put(a, b, { t: 'root' }));
  [[-3, -6], [6, -3]].forEach(([a, b]) => put(a, b, { t: 'bush', r: 0 }));
  [[-2, -7], [4, 6]].forEach(([a, b]) => put(a, b, { t: 'glow' }));
  [[-7, -2], [6, 1], [-5, 3], [3, -6], [-1, 6], [5, 6], [-4, -4], [4, -3], [-6, -5], [7, -6], [2, 7], [-4, 6], [6, 5], [-8, 1]].forEach(([a, b]) => put(a, b, { t: 'grass' }));
  put(-4, 2, { t: 'plant' }); put(-3, 3, { t: 'chair' }); put(-2, 3, { t: 'table' }); put(0, 3, { t: 'rug' }); put(4, 2, { t: 'lampShroom' }); put(-4, 4, { t: 'torch' });
  const starter = [['bed', 1], ['chair', 1], ['table', 1], ['plant', 1], ['rug', 2], ['cushion', 1], ['vase', 1], ['shelf', 1], ['lampShroom', 1], ['torch', 4], ['wallWood', 10], ['floorWood', 12]];
  put(2, 3, { t: 'chest', items: starter.map(([id, c]) => ({ id, c })).concat(Array(18 - starter.length).fill(null)) });
  objs.set(idx(SA.x, SA.y), { t: 'shrine', has: 1 }); objs.set(idx(SB.x, SB.y), { t: 'shrine', has: 1 }); objs.set(idx(SL.x, SL.y), { t: 'shrine', has: 1 }); objs.set(idx(SI.x, SI.y), { t: 'shrine', has: 1 });
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; objs.set(idx(Math.round(SL.x + Math.cos(a) * 3.4), Math.round(SL.y + Math.sin(a) * 3.4)), { t: 'fireBloom' }); objs.set(idx(Math.round(SI.x + Math.cos(a) * 3.4), Math.round(SI.y + Math.sin(a) * 3.4)), { t: 'iceCluster' }); }
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; objs.set(idx(Math.round(SA.x + Math.cos(a) * 3.4), Math.round(SA.y + Math.sin(a) * 3.4)), { t: 'glow' }); objs.set(idx(Math.round(SB.x + Math.cos(a) * 3.4), Math.round(SB.y + Math.sin(a) * 3.4)), { t: 'cluster' }); }
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .6; objs.set(idx(Math.round(BX + Math.cos(a) * 6.3), Math.round(BY + Math.sin(a) * 6.3)), { t: 'glow' }); }
  addPond({ wall, floor, objs }, null);
  return { wall, floor, biome, objs };
}
function addWater(w, seed, nearSafe, ok) {
  for (let y = 3; y < H - 3; y++) for (let x = 3; x < W - 3; x++) {
    const i = idx(x, y); if (w.wall[i] || nearSafe(x, y) || vn(x * .09, y * .09, seed + 77) < (LAY === 2 ? 0.76 : 0.715)) continue;
    let open = true; for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) if (w.wall[i + dy * W + dx]) { open = false; break; }
    if (!open || (ok && !ok(i))) continue; w.floor[i] = WATER; w.objs.delete(i);
  }
}
function addPond(w, ok) {
  for (let y = CY - 6; y <= CY - 2; y++) for (let x = CX + 2; x <= CX + 8; x++) {
    const dx = (x + .5 - (CX + 5)) / 2.4, dy = (y + .5 - (CY - 4.2)) / 1.5; if (dx * dx + dy * dy > 1) continue;
    const i = idx(x, y); if (ok && !ok(i)) continue; if (w.wall[i] !== 8) w.wall[i] = 0; w.floor[i] = WATER; w.objs.delete(i);
  }
}
function addQuartzVeins() { let n = 0; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) { const i = idx(x, y); if (G.wall[i] === 3 && G.biome[i] === 2 && quartzAt(x, y, G.seed)) { G.wall[i] = 13; n++; } } return n; }

let DOORS = new Set();
const refreshDoors = () => { DOORS = new Set((G.rooms || []).filter(r => !r.found).map(r => idx(r.dx, r.dy))); };
function placeRooms(w0) {
  const rooms = [], safe = [[CX, CY], [BX, BY], [SA.x, SA.y], [SB.x, SB.y], [SL.x, SL.y], [SI.x, SI.y]], cand = [[], [], [], [], []];
  for (let y = 4; y < H - 8; y += 2) for (let x = 4; x < W - 8; x += 2) { const b = G.biome[idx(x + 1, y + 1)]; if (b <= 4) cand[b].push([x, y, hash2(x, y, (G.seed | 0) + 77)]); }
  const natural = i => G.wall[i] && G.wall[i] !== 8 && G.wall[i] === w0.wall[i] && !G.objs.get(i) && !G.wire.has(i) && !G.under.has(i);
  const open = i => !G.wall[i] && G.floor[i] !== WATER && G.floor[i] !== LAVA && !G.objs.get(i);
  // the cracked wall faces an open tunnel on any side; a region that still has no room after that takes a door into plain rock
  for (let pass = 0; pass < 2; pass++) for (let b = 0; b < 5; b++) { cand[b].sort((a, c) => a[2] - c[2]); let n = rooms.filter(r => r.b === b).length; if (pass && n) continue;
    for (const [x, y] of cand[b]) { if (n >= ROOM_N[b]) break;
      if (safe.some(([sx, sy]) => Math.hypot(x + 2 - sx, y + 1 - sy) < 16) || rooms.some(r => Math.hypot(r.x - x, r.y - y) < 24)) continue;
      let ok = true; for (let yy = y - 1; yy <= y + 3 && ok; yy++) for (let xx = x - 1; xx <= x + 4; xx++) { const i = idx(xx, yy); if (!natural(i) || G.biome[i] !== b) { ok = false; break; } }
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
const cleanRooms = a => a.filter(r => r && Number.isInteger(r.x) && Number.isInteger(r.y) && Number.isInteger(r.b) && r.b >= 0 && r.b < 5).map(r => ({ id: String(r.id || ''), b: r.b, k: r.k | 0, x: r.x, y: r.y, dx: r.dx | 0, dy: r.dy | 0, cx: r.cx | 0, cy: r.cy | 0, found: r.found ? 1 : 0, open: r.open ? 1 : 0, hint: r.hint ? 1 : 0 }));
function roomTick() {
  const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let ch = false;
  for (const r of G.rooms || []) { if (r.found) continue;
    if ((px >= r.x && px <= r.x + 3 && py >= r.y && py <= r.y + 2) || !G.wall[idx(r.dx, r.dy)]) { r.found = 1; ch = true; const tc = G.objs.get(idx(r.cx, r.cy)); if (tc) delete tc.hid; G.stats.rooms = (G.stats.rooms || 0) + 1; toast('숨은 방을 찾았어요! 보물상자를 열어 봐요', 'good', 'room'); SFX.seed(); continue; }
    if (!r.hint && Math.hypot(p.x - r.dx - .5, p.y - r.dy - .5) < 3.2) { r.hint = 1; toast('금 간 벽 틈으로 바람이 새어 나와요… 이 벽 너머에 뭔가 있는 것 같아요', null, 'roomhint'); } }
  if (ch) { refreshDoors(); lightDirty = true; }
}
function openTreasure(t, o) {
  if (o.open) return; o.open = 1; const r = (G.rooms || []).find(q => q.cx === t.x && q.cy === t.y); const loot = r ? (ROOM_LOOT[r.b][r.k] || ROOM_LOOT[r.b][0]).slice() : [['crystal', 3], ['gel', 3]];
  delete o.hid; if (r) { r.open = 1; if (!r.found) { r.found = 1; refreshDoors(); } if (r.k === 0) loot.push([ROOM_DECO[r.b], 1]); for (const id of roomNotes(r)) if (!knows(id)) loot.push(['rn_' + id, 1]); }
  for (const [id, c] of loot) spawnDrop(id, c, t.x + .5, t.y + .9);
  G.stats.chests = (G.stats.chests || 0) + 1; SFX.win(); puff(t.x + .5, t.y + .4, '#ffe9a8', 18, 2.8, .5); gainXp(20); toast('보물상자를 열었어요!', 'good'); lightDirty = true; checkGuide();
}
// ================= world helpers =================
const inB = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
function isSolid(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i] || G.floor[i] === WATER || G.floor[i] === LAVA) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].solid && !(OBJ[o.t].door && o.open)); }
function boxHits(x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r * 0.7); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (isSolid(tx, ty)) return true; return false; }
function moveEnt(e, dx, dy, r) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15)); let bx = false, by = false;
  for (let k = 0; k < n; k++) {
    if (!bx) { const nx = e.x + dx / n; if (!boxHits(nx, e.y, r)) e.x = nx; else bx = true; }
    if (!by) { const ny = e.y + dy / n; if (!boxHits(e.x, ny, r)) e.y = ny; else by = true; }
  }
  return bx || by;
}
function occupied(tx, ty) {
  const p = G.p, r = 0.28; if (p.x + r > tx && p.x - r < tx + 1 && p.y + r * .7 > ty && p.y - r < ty + 1) return true;
  for (const e of G.enemies) if (Math.floor(e.x) === tx && Math.floor(e.y) === ty) return true; return false;
}
// ---- terrain: ground you can dig with a shovel and lay elsewhere, unlocked one by one ----
const FLOOR_ITEM = { 5: 'floorWood', 6: 'floorStone', 7: 'floorMoss', 8: 'floorShroom', 9: 'floorCrystal' };
for (const f in NFLOOR) FLOOR_ITEM[f] = NFLOOR[f][0];
FLOOR_ITEM[21] = 'meadow';
const isPlacedFloor = f => !!FLOOR_ITEM[f];
const josa = (w, a, b) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c < 11172 && c % 28 ? a : b); };
// how: shown while locked · when: unlock condition (checked often, so it also works for old saves)
const TERRAIN = {
  2: { n: '흙', item: 'gDirt', base: true },
  1: { n: '이끼', item: 'gMoss', how: '퀘스트 「구리 곡괭이 만들기」를 마치면 배워요', when: () => G.guide > 5 },
  10: { n: '물', item: 'gWater', how: '물고기를 10마리 낚으면 배워요', when: () => (G.stats.fishCaught || 0) >= 10 },
  3: { n: '버섯흙', item: 'gShroom', how: '버섯 여왕을 물리치면 배워요', when: () => beat('queen') },
  4: { n: '수정바닥', item: 'gCrystal', how: '수정골렘을 물리치면 배워요', when: () => beat('golem') },
};
const terrainOk = f => !!(TERRAIN[f] && (TERRAIN[f].base || (G.terrain && G.terrain[f])));
function checkUnlocks() {
  if (!G.terrain) G.terrain = {};
  for (const f in TERRAIN) { const T = TERRAIN[f]; if (T.base || G.terrain[f] || !T.when()) continue; G.terrain[f] = 1;
    if (started) { toast(`새 지형을 배웠어요: ${T.n}! 삽을 들고 떠서 다른 곳에 옮길 수 있어요${hasItem('shovel') ? '' : ' (삽은 장비제작대에서 만들어요)'}`, 'good', 'terrain' + f); SFX.craft(); } }
  if (started && !G.stats.starTip && beat('golem')) { G.stats.starTip = 1; setTimeout(() => toast('이제 맞는 흙에 심은 작물이 가끔 별 작물로 자라요 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', 'good', 'startip'), 1500); }
}
function shovelDesc() {
  const ks = Object.keys(TERRAIN).map(Number), ok = ks.filter(terrainOk).map(f => TERRAIN[f].n), no = ks.filter(f => !terrainOk(f));
  return `삽을 들고(도구 칸) 바닥을 바라보며 누르면 깔아 둔 바닥을 걷고, 땅을 누르면 배운 지형을 떠서 옮길 수 있어요. 배운 지형: ${ok.join(' · ')}${no.length ? ' / 아직: ' + no.map(f => `${TERRAIN[f].n}(${TERRAIN[f].how.replace(/ ?배워요$/, '')})`).join(', ') : ''}`;
}
function digGround(t) {
  const i = idx(t.x, t.y), f = G.floor[i]; if (G.wall[i] || G.objs.get(i)) return;
  if (isPlacedFloor(f)) { G.floor[i] = G.under.has(i) ? G.under.get(i) : 2; G.under.delete(i); const l = addItem(FLOOR_ITEM[f], 1, false); if (l) spawnDrop(FLOOR_ITEM[f], 1, t.x + .5, t.y + .5); SFX.pick(); puff(t.x + .5, t.y + .7, '#e8d8c0', 6, 2); }
  else { if (f === 2 || !terrainOk(f)) return; const id = TERRAIN[f].item; G.floor[i] = 2; const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
    SFX.pick(); puff(t.x + .5, t.y + .7, f === WATER ? '#8fd0ff' : f === 1 ? '#7fd06a' : f === 3 ? '#c49ae0' : '#b9a8ff', 7, 2.2); G.stats.dug = (G.stats.dug || 0) + 1; }
  mapPixel(t.x, t.y); invDirty = true; const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
}
function canPlace(tx, ty, it) {
  if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].sz) { const d = OBJ[it.obj], fp = placeFp(d), a = placeAnchor({ x: tx, y: ty }, fp); return fpFree(a.x, a.y, fp, !!d.solid); }
  if (!inB(tx, ty)) return false; const i = idx(tx, ty); if (G.wall[i]) return false; const o = G.objs.get(i);
  if (it.kind === 'wire') return !G.wire.has(i) && G.floor[i] !== WATER && G.floor[i] !== LAVA && (!o || !OBJ[o.t].tree);
  if (it.kind === 'floor') return G.floor[i] !== it.floor && (!o || !OBJ[o.t].tree);
  if (it.kind === 'ground') return !o && G.floor[i] !== it.ground && !isPlacedFloor(G.floor[i]) && !(it.ground === WATER && (occupied(tx, ty) || (tx === Math.floor(G.p.x) && ty === Math.floor(G.p.y))));
  if (o) return false;
  if ((G.floor[i] === WATER || G.floor[i] === LAVA) && it.kind !== 'wall') return false;
  if (it.kind === 'seed') return it.crop === 'cropMoss' ? G.floor[i] === 21 : [1, 2, 3, 4, 21].includes(G.floor[i]);
  if (it.kind === 'wall') return !occupied(tx, ty);
  if (it.kind === 'place') { const d = OBJ[it.obj]; return !(d.solid && occupied(tx, ty)); }
  return false;
}
