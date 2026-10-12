// ---- circuits: wires, power (battery → generator → crystal generator), switches, powered devices ----
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const CIRC = { net: new Map(), pRoots: new Set(), find: x => x };
function circuitTick(dt) {
  const comps = []; for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (d && (d.src || d.sw || d.dev)) comps.push([i, o, d]); }
  if (!comps.length) { CIRC.net = new Map(); CIRC.pRoots = new Set(); return; }
  const swT = new Set(comps.filter(c => c[2].sw).map(c => c[0])), net = new Map(); let nid = 0;
  for (const i of G.wire.keys()) { if (net.has(i) || swT.has(i)) continue; const id = nid++, st = [i]; net.set(i, id);
    while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const k = idx(nx, ny); if (G.wire.has(k) && !net.has(k) && !swT.has(k)) { net.set(k, id); st.push(k); } } } }
  const par = Array.from({ length: nid }, (_, k) => k), find = a => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
  const adj = (i, own) => { const x = i % W, y = (i / W) | 0, out = new Set(); if (own && net.has(i)) out.add(net.get(i)); for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (inB(nx, ny) && net.has(idx(nx, ny))) out.add(net.get(idx(nx, ny))); } return [...out]; };
  const px = Math.floor(G.p.x), py = Math.floor(G.p.y);
  for (const [i, o, d] of comps) { if (!d.sw) continue; let on = false; const x = i % W, y = (i / W) | 0;
    if (d.sw === 'lever') on = !!o.on; else if (d.sw === 'plate') on = (px === x && py === y && G.p.dead <= 0) || G.enemies.some(e => Math.floor(e.x) === x && Math.floor(e.y) === y);
    else { o.tt = (o.tt || 0) + dt; on = Math.floor(o.tt / (o.per || 2)) % 2 === 0; }
    o.lit = on; if (on) { const a = adj(i, false); for (let k = 1; k < a.length; k++) uni(a[0], a[k]); } }
  const rs = new Map();
  for (const [i, o, d] of comps) { if (!d.src) continue; const ok = d.src === 'cgen' || (d.src === 'gen' && (o.fuel || 0) > 0) || (d.src === 'batt' && (o.e || 0) > 0); o.lit = ok; if (!ok) continue;
    for (const n of adj(i, true)) { const r = find(n); let e = rs.get(r); if (!e) rs.set(r, e = { inf: false, b: [], g: [], load: 0 }); if (d.src === 'cgen') e.inf = true; else if (d.src === 'gen') { if (!e.g.includes(o)) e.g.push(o); } else if (!e.b.includes(o)) e.b.push(o); } }
  for (const [i, o, d] of comps) { if (!d.dev) continue; let pr = null; for (const n of (d.sz ? [...new Set(fpTiles(i, o).flatMap(j => adj(j, true)))] : adj(i, true))) { const r = find(n); if (rs.has(r)) { pr = r; break; } }
    deviceStep(i, o, d, pr != null, dt); if (pr != null) rs.get(pr).load += (o.work ? (d.draw || 0) : (d.idle || 0)) * dt; }
  for (const [, e] of rs) { if (!e.load || e.inf) continue; if (e.g.length) { for (const g of e.g) { g.fuel = Math.max(0, g.fuel - dt); G.stats.genRun = 1; } continue; } if (e.b.length) { const per = e.load / e.b.length; for (const b of e.b) b.e = Math.max(0, b.e - per); } }
  CIRC.net = net; CIRC.pRoots = new Set(rs.keys()); CIRC.find = find;
}
function deviceStep(i, o, d, on, dt) {
  if (d.dev === 'sprk' || d.dev === 'harv') { farmDevStep(i, o, d, on, dt); return; }
  const x = i % W, y = (i / W) | 0;
  if (d.dev === 'lamp') { if (o.off !== !on) { o.off = !on; lightDirty = true; } o.work = on; if (on) G.stats.litLamp = 1; return; }
  if (d.dev === 'farm') { const ready = farmStage(o) >= 3; o.work = on && ready; if (on && ready) farmHarvest(i, o, true); return; }
  if (d.dev === 'door') { if (!!o.open !== on) { if (!on && occupied(x, y)) return; o.open = on; SFX.place(); } o.work = false; return; }
  if (d.dev === 'slide') { o.work = false; if (on) SLIDE_PW.set(o, G.time); // powered (or joined to a powered leaf): opens while the player is close, closes when they walk away
    const grp = doorGroup(x, y); o.pw = grp.some(([, g]) => (SLIDE_PW.get(g) ?? -9) > G.time - .5) ? 1 : 0; if (!o.pw) return;
    const near = G.p.dead <= 0 && grp.some(([j]) => Math.hypot(j % W + .5 - G.p.x, ((j / W) | 0) + .5 - G.p.y) < SLIDE_NEAR);
    if (!!o.open !== near) { if (!near && occupied(x, y)) return; o.open = near ? 1 : 0; if (Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 8) SFX.place(); } return; }
  if (d.dev === 'drill') { const dir = o.dir || { x: 0, y: -1 }, tx = x + dir.x, ty = y + dir.y, w = inB(tx, ty) ? G.wall[idx(tx, ty)] : 0, cnt = (o.store || []).reduce((a, s2) => a + s2.c, 0);
    const tierOk = w && WALLS[w] && (d.only ? d.only.includes(w) : WALLS[w].tier <= d.tier);
    const can = on && w && WALLS[w] && tierOk && w !== 6 && w !== 7 && w !== 8 && cnt < DRILL_CAP; o.work = !!can; o.why = !on ? 'power' : !w || w === 6 || w === 7 || w === 8 ? 'wall' : !tierOk ? 'tier' : cnt >= DRILL_CAP ? 'full' : '';
    if (!can) return; o.prog = (o.prog || 0) + dt;
    if (Math.hypot(tx + .5 - G.p.x, ty + .5 - G.p.y) < 14 && fxRand() < dt * 3) puff(tx + .5 - dir.x * .45, ty + .7 - dir.y * .45, WPAL[w][1], 2, 1.4, .1);
    if (o.prog >= d.every) { o.prog = 0; const dr0 = WALLS[w].drop[0]; if (rand() > (dr0[3] == null ? 1 : dr0[3])) return; const id = dr0[0]; G.stats.drilled = (G.stats.drilled || 0) + 1;
      let put = false; for (const [dx, dy] of [[-dir.x, -dir.y], ...D4]) { const cx = x + dx, cy = y + dy; if (!inB(cx, cy)) continue; const c = G.objs.get(idx(cx, cy)); if (c && c.t === 'chest' && c.items && !moveInto(c.items, { id, c: 1 })) { put = true; break; } }
      if (!put) { o.store = o.store || []; const s2 = o.store.find(z => z.id === id); if (s2) s2.c++; else o.store.push({ id, c: 1 }); } } }
}
function returnObj(o, x, y) {
  if (o.job) cancelJob(o, x, y); // v59: a furnace / pot picked up mid-job gives back the finished items and the unused materials
  const d = OBJ[o.t]; if (o.store) for (const s2 of o.store) { const l = moveInto(G.inv, s2); if (l) spawnDrop(s2.id, l, x, y); }
  if (DUR[d.item]) { const it = { id: d.item, c: 1, dur: Math.round(o.e != null ? o.e : DUR[d.item][0]) }; if (moveInto(G.inv, it)) { spawnDrop(d.item, 1, x, y); G.drops[G.drops.length - 1].dur = it.dur; } }
  else { const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; const l = addItem(it, 1, false); if (l) spawnDrop(it, 1, x, y); } // v60: an upgraded workbench comes back as its tier item
  invDirty = true;
}
function wirePowered(i) { const n = CIRC.net.get(i); return n != null && CIRC.pRoots.has(CIRC.find(n)); }

function bestArrow() { for (const id of ARROW_ORD) { const k = G.inv.findIndex(s => s && s.id === id); if (k >= 0) return k; } return -1; }
function takeArrow() { const k = bestArrow(); if (k < 0) return null; const s = G.inv[k], a = ITEMS[s.id].arw; s.c--; if (s.c <= 0) G.inv[k] = null; invDirty = true; G.stats.arrows = (G.stats.arrows || 0) + 1; return a; }
// hazards on the floor: lava pools, frost nova warnings
function updateHazards(dt) {
  const p = G.p; G.hz = G.hz || [];
  for (let i = G.hz.length - 1; i >= 0; i--) { const h = G.hz[i]; h.t += dt; if (h.t > h.life) { G.hz.splice(i, 1); continue; } if (h.t < h.warn || p.dead > 0) continue;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (h.k === 'lava') { if (d < h.r) hurtPlayer(h.dmg, h.x, h.y, 'fire'); }
    else if (!h.done) { h.done = 1; puff(h.x, h.y, '#d4f6ff', 26, 4.5, .4); shake = Math.max(shake, .3); if (d < h.r) { hurtPlayer(h.dmg, h.x, h.y); p.slowT = (h.slow || 2) * (wearing('snowBrooch') ? broochMul(eqLv('snowBrooch')) : 1); ftext(p.x, p.y - 1.6, '꽁꽁!', '#bfe6ff'); } } }
}
function drawHazards(T, camX, camY) {
  const t = performance.now() / 1000;
  for (const h of G.hz || []) { const X = h.x * T - camX, Y = h.y * T - camY, warn = h.t < h.warn;
    if (h.k === 'lava') { const a = warn ? .25 + .25 * Math.sin(t * 20) : Math.min(1, (h.life - h.t) * 1.5); ctx.globalAlpha = a; ctx.fillStyle = warn ? '#ff8a3d' : '#e8501f'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.fill(); if (!warn) { ctx.fillStyle = '#ffc861'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * .55, h.r * T * .32, 0, 0, 6.283); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (warn) { const pr = h.t / h.warn; ctx.strokeStyle = `rgba(191,230,255,${.4 + pr * .5})`; ctx.lineWidth = 2 * Z; ctx.setLineDash([4 * Z, 3 * Z]); ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(191,230,255,${pr * .25})`; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * pr, h.r * T * .62 * pr, 0, 0, 6.283); ctx.fill(); } }
}

let placeRot = 0, placeRotFor = null;
const pRot = () => { const s0 = G && selItem(); return s0 && s0.id === placeRotFor ? placeRot : 0; };
const DIRN = ['아래', '오른쪽', '위', '왼쪽'];
// v65 (stardew-like): each piece turns 1, 2 or 4 ways, chosen before placing (to turn a placed one, pick it up and place it again).
// Seats face 4 ways (the sitter faces the same way); other furniture 2 (front / turned 90°); front-only and round things do not turn.
// A turned piece uses its own drawing when there is one (obj/<id>S.png side, obj/<id>U.png back), otherwise the drawing turned 90°.
const ROT4 = new Set(['chair', 'cryChair', 'mossSofa', 'ironChair', 'shroomStool', 'stumpStool', 'sofa2', 'logBench', 'stoneBench', 'cushion']);
const NOROT = new Set(['pictureFrame', 'vase', 'table', 'rugRound', 'cryMirror', 'cryFountain', 'fountainBig', 'fishTank', 'bootPlanter', 'torch']);
function rotN(t) { const d = OBJ[t]; if (!d || !d.item || d.tw || d.dev || d.src || d.sw || d.chest || d.ranch || d.nat || d.crop || d.tree || d.lost || NOROT.has(t)) return 1; return ROT4.has(t) || d.dir4 ? 4 : 2; }
const canRotObj = t => rotN(t) > 1;
const rotSwaps = d => !!(d && d.sz && d.sz[0] !== d.sz[1]);
const placeFp = d => d.sz ? (pRot() % 2 && rotSwaps(d) ? [d.sz[1], d.sz[0]] : d.sz) : [1, 1];
const rotOf = o => typeof o.dir === 'number' ? o.dir : o.rot ? 1 : 0;
const ROTC = new WeakMap(), turned = c => { let k = ROTC.get(c); if (!k) { k = rot90(c); ROTC.set(c, k); } return k; };
function rotImg(t, r, base) { // → [image, flip]
  if (!r || !base) return [base, false]; const main = base === SPR.obj[t];
  if (r === 2 && rotN(t) === 4) return [(main && SPR.obj[t + 'U']) || base, false];
  return [(main && (SPR.obj[t + 'S'] || SPR.obj[t + 'V'])) || turned(base), r === 3]; }
function rotatePlace() { const s = selItem(), it = s && ITEMS[s.id]; if (!it || it.kind !== 'place' || rotN(it.obj) < 2) return; const n = rotN(it.obj);
  if (placeRotFor !== s.id) { placeRotFor = s.id; placeRot = 0; } placeRot = (placeRot + 1) % n;
  toast(n === 4 ? `${josa(DIRN[placeRot], '을', '를')} 보게 놓아요` : placeRot ? '옆으로 돌려 놓아요' : '정면으로 놓아요', null, 'prot'); SFX.click(); }
function rotateAction() { if (!started || paused || !G || G.p.dead > 0) return; rotatePlace(); }
function rot90(c) { const k = document.createElement('canvas'); k.width = c.height; k.height = c.width; k.hd = c.hd; const g = k.getContext('2d'); g.imageSmoothingEnabled = false; g.translate(k.width, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); return k; }
const growOf = o => (OBJ[o.t] && OBJ[o.t].grow) || FARM_GROW;
const farmStage = o => Math.max(0, Math.min(3, Math.floor((G.time - (o.p || 0)) / growOf(o) * 3)));
const farmLbl = o => (o.store || []).length ? '꺼내기' : farmStage(o) >= 3 ? farmT(o)[0] : '살펴보기';
function pitStat(o, n) { G.stats.quarried = (G.stats.quarried || 0) + n; if (o.t !== 'quarry') G.stats.drilled = (G.stats.drilled || 0) + n; }
const farmT = o => FARM_TXT[o.t] || FARM_TXT.treeFarm;
function farmYield(o) { const py = o && PIT_Y[o.t]; if (py) return [[py[0], py[1] + (rand() * (py[2] - py[1] + 1) | 0)]]; // v46: the stone pit gives only stone
  const out = [['wood', 5 + (rand() * 3 | 0)]]; if (rand() < .35) out.push(['resin', 1]); if (rand() < .12) out.push(['sapling', 1]); if (rand() < .5) out.push(['fiber', 1 + (rand() * 2 | 0)]); return out; }
function farmHarvest(i, o, auto) { const x = i % W, y = (i / W) | 0;
  if (!auto) { const got = farmYield(o); o.p = G.time; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1]; for (const [id, c] of got) spawnDrop(id, c, x + 1, y + 1.2); SFX.brk(); puff(x + 1, y + 1, farmT(o)[3], 10, 2.5); gainXp(2); return true; }
  const chests = []; for (const j of fpTiles(i, o)) { const jx = j % W, jy = (j / W) | 0; for (const [dx, dy] of D4) { if (!inB(jx + dx, jy + dy)) continue; const c = G.objs.get(idx(jx + dx, jy + dy)); if (c && c.t === 'chest' && c.items && !chests.includes(c)) chests.push(c); } }
  const stN = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (stN >= FARM_CAP && !chests.some(c => c.items.some(z => !z))) { o.why = 'full'; return false; }
  const got = farmYield(o); o.p = G.time; o.why = ''; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1];
  for (const [id, c] of got) { let left = c; for (const ch of chests) { if (!left) break; left = moveInto(ch.items, { id, c: left }); } if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, FARM_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } }
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 14) { puff(x + 1, y + 1, farmT(o)[3], 8, 2); SFX.brk(); } return true; }
