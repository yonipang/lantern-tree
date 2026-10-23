// ================= 회로: 빛뿌리·빛 계산, 기계 작동 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// ---- circuits: wires, power (battery → generator → crystal generator · v113 lantern tree), switches, powered devices ----
// 보이는 이름은 빛(v113): wire 빛뿌리 · battery 빛 항아리 · generator 불씨 등잔 · crystalGen 수정 빛샘 · 등불나무(treeP)에 이어도 끝없는 빛
import { WPAL } from '../art/world.js';
import { DRILL_CAP } from '../data/circuits-regions.js';
import { BUILT_WALLS, OBJ, WALLS } from '../data/items.js';
import { fxRand, rand } from '../engine/random.js';
import { alivePlayers, G } from '../save/state.js';
import { doorGroup, SLIDE_NEAR, SLIDE_PW } from './building.js';
import { emit } from './events.js';
import { farmDevStep, farmHarvest, farmStage } from './farming.js';
import { moveInto, storeAt } from './inventory.js';
import { onFrame } from './systems.js';
import { idx, inB, W } from '../world/map.js';
import { fpTiles, occupied } from '../world/tiles.js';
import { markLight } from './loop.js';
export const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const CIRC = { net: new Map(), pRoots: new Set(), find: x => x };
export let circT = 0;
onFrame('circuit', dt => {
  circT += dt; if (circT > .2) { circuitTick(circT); circT = 0; }
});
export function circuitTick(dt) {
  const comps = []; for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (d && (d.src || d.sw || d.dev)) comps.push([i, o, d]); }
  if (!comps.length) { CIRC.net = new Map(); CIRC.pRoots = new Set(); return; }
  const swT = new Set(comps.filter(c => c[2].sw).map(c => c[0])), net = new Map(); let nid = 0;
  for (const i of G.wire.keys()) { if (net.has(i) || swT.has(i)) continue; const id = nid++, st = [i]; net.set(i, id);
    while (st.length) { const j = st.pop(), x = j % W, y = (j / W) | 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const k = idx(nx, ny); if (G.wire.has(k) && !net.has(k) && !swT.has(k)) { net.set(k, id); st.push(k); } } } }
  const par = Array.from({ length: nid }, (_, k) => k), find = a => { while (par[a] !== a) a = par[a] = par[par[a]]; return a; }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b; };
  const adj = (i, own) => { const x = i % W, y = (i / W) | 0, out = new Set(); if (own && net.has(i)) out.add(net.get(i)); for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (inB(nx, ny) && net.has(idx(nx, ny))) out.add(net.get(idx(nx, ny))); } return [...out]; };
  const onTile = (x, y) => alivePlayers().some(pl => Math.floor(pl.p.x) === x && Math.floor(pl.p.y) === y); // 발판: 살아 있는 플레이어 누구든 (8단계)
  for (const [i, o, d] of comps) { if (!d.sw) continue; let on = false; const x = i % W, y = (i / W) | 0;
    if (d.sw === 'lever') on = !!o.on; else if (d.sw === 'plate') on = onTile(x, y) || G.enemies.some(e => Math.floor(e.x) === x && Math.floor(e.y) === y);
    else { o.tt = (o.tt || 0) + dt; on = Math.floor(o.tt / (o.per || 2)) % 2 === 0; }
    o.lit = on; if (on) { const a = adj(i, false); for (let k = 1; k < a.length; k++) uni(a[0], a[k]); } }
  const rs = new Map();
  for (const [i, o, d] of comps) { if (!d.src) continue; const ok = d.src === 'cgen' || d.src === 'tree' || (d.src === 'gen' && (o.fuel || 0) > 0) || (d.src === 'batt' && (o.e || 0) > 0); o.lit = ok; if (!ok) continue;
    for (const n of adj(i, true)) { const r = find(n); let e = rs.get(r); if (!e) rs.set(r, e = { inf: false, b: [], g: [], load: 0 }); if (d.src === 'cgen' || d.src === 'tree') e.inf = true; else if (d.src === 'gen') { if (!e.g.includes(o)) e.g.push(o); } else if (!e.b.includes(o)) e.b.push(o); } }
  for (const [i, o, d] of comps) { if (!d.dev) continue; let pr = null; for (const n of (d.sz ? [...new Set(fpTiles(i, o).flatMap(j => adj(j, true)))] : adj(i, true))) { const r = find(n); if (rs.has(r)) { pr = r; break; } }
    deviceStep(i, o, d, pr != null, dt); if (pr != null) rs.get(pr).load += (o.work ? (d.draw || 0) : (d.idle || 0)) * dt; }
  for (const [, e] of rs) { if (!e.load || e.inf) continue; if (e.g.length) { for (const g of e.g) { g.fuel = Math.max(0, g.fuel - dt); G.stats.genRun = 1; } continue; } if (e.b.length) { const per = e.load / e.b.length; for (const b of e.b) b.e = Math.max(0, b.e - per); } }
  CIRC.net = net; CIRC.pRoots = new Set(rs.keys()); CIRC.find = find;
}
export function deviceStep(i, o, d, on, dt) {
  if (d.dev === 'sprk' || d.dev === 'harv') { farmDevStep(i, o, d, on, dt); return; }
  const x = i % W, y = (i / W) | 0;
  if (d.dev === 'lamp') { if (o.off !== !on) { o.off = !on; markLight(); } o.work = on; if (on) G.stats.litLamp = 1; return; }
  if (d.dev === 'farm') { const ready = farmStage(o) >= 3; o.work = on && ready; if (on && ready) farmHarvest(i, o, true); return; }
  if (d.dev === 'door') { if (!!o.open !== on) { if (!on && occupied(x, y)) return; o.open = on; emit('sfx', 'place'); } o.work = false; return; }
  if (d.dev === 'slide') { o.work = false; if (on) SLIDE_PW.set(o, G.time); // powered (or joined to a powered leaf): opens while the player is close, closes when they walk away
    const grp = doorGroup(x, y); o.pw = grp.some(([, g]) => (SLIDE_PW.get(g) ?? -9) > G.time - .5) ? 1 : 0; if (!o.pw) return;
    const near = alivePlayers().some(pl => grp.some(([j]) => Math.hypot(j % W + .5 - pl.p.x, ((j / W) | 0) + .5 - pl.p.y) < SLIDE_NEAR)); // 자동문: 살아 있는 플레이어 누구든 가까우면
    if (!!o.open !== near) { if (!near && occupied(x, y)) return; o.open = near ? 1 : 0; if (Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 8) emit('sfx', 'place'); } return; }
  if (d.dev === 'drill') { const dir = o.dir || { x: 0, y: -1 }, tx = x + dir.x, ty = y + dir.y, w = inB(tx, ty) ? G.wall[idx(tx, ty)] : 0, cnt = (o.store || []).reduce((a, s2) => a + s2.c, 0);
    const tierOk = w && WALLS[w] && (d.only ? d.only.includes(w) : WALLS[w].tier <= d.tier);
    const can = on && w && WALLS[w] && tierOk && !BUILT_WALLS.has(w) && w !== 8 && cnt < DRILL_CAP; o.work = !!can; o.why = !on ? 'power' : !w || BUILT_WALLS.has(w) || w === 8 ? 'wall' : !tierOk ? 'tier' : cnt >= DRILL_CAP ? 'full' : '';
    if (!can) return; o.prog = (o.prog || 0) + dt;
    if (Math.hypot(tx + .5 - G.p.x, ty + .5 - G.p.y) < 14 && fxRand() < dt * 3) emit('puff', tx + .5 - dir.x * .45, ty + .7 - dir.y * .45, WPAL[w][1], 2, 1.4, .1);
    if (o.prog >= d.every) { o.prog = 0; const dr0 = WALLS[w].drop[0]; if (rand() > (dr0[3] == null ? 1 : dr0[3])) return; const id = dr0[0]; G.stats.drilled = (G.stats.drilled || 0) + 1;
      let put = null; for (const [dx, dy] of [[-dir.x, -dir.y], ...D4]) { const cx = x + dx, cy = y + dy; if (!inB(cx, cy)) continue; const sc = storeAt(idx(cx, cy)); if (sc && !moveInto(sc.o.items, { id, c: 1 })) { put = [cx, cy]; break; } }
      if (Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 14) { const to = put || [x, y]; emit('oreFly', tx + .5 - dir.x * .45, ty + .7 - dir.y * .45, to[0] + .5, to[1] + .6, WPAL[w][1]); emit('sfx', 'pick'); } // v113: 광석이 톡 튀어 상자로
      if (!put) { o.store = o.store || []; const s2 = o.store.find(z => z.id === id); if (s2) s2.c++; else o.store.push({ id, c: 1 }); } } }
}
export function wirePowered(i) { const n = CIRC.net.get(i); return n != null && CIRC.pRoots.has(CIRC.find(n)); }
