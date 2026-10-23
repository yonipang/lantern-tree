// ================= 생존: 더위·추위, 귀환석, 긴급 탈출·갇힘 풀기, 잃어버린 꾸러미 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { ENV_TXT, LOST_MAX, LOST_SHARE, RECALL_CD, RECALL_T } from '../data/deep-survival.js';
import { EFF } from '../data/farming-cooking.js';
import { guardMul } from '../data/gear-animals.js';
import { GUIDE } from '../data/quests.js';
import { BUILT_WALLS, ITEMS, OBJ } from '../data/items.js';
import { fxRand } from '../engine/random.js';
import { $, clamp } from '../engine/util.js';
import { cam, curPl, G, ME, started } from '../save/state.js';
import { devOn } from '../save/storage.js';
import { D4 } from './circuits.js';
import { defineCmd } from './commands.js';
import { emit } from './events.js';
import { hatMul, lvOf } from './gear.js';
import { bagCat, moveInto } from './inventory.js';
import { WATER } from './nature.js';
import { standUp } from './player.js';
import { onFrame } from './systems.js';
import { genWorld } from '../world/gen.js';
import { ANCH, CX, CY, H, idx, inB, LAVA, MAPV, SI, SL, W } from '../world/map.js';
import { boxHits, fpOf, isSolid } from '../world/tiles.js';
import { markLight } from './loop.js';
defineCmd('escape', () => emergencyEscape());
export const envLv = k => G && G.env && G.env.k === k ? (G.env.v >= 100 ? 3 : G.env.v >= 70 ? 2 : G.env.v >= 40 ? 1 : 0) : 0;
export function bmul(ef) { if (!G || !G.buffs) return 1; let best = null; for (const b of G.buffs) if (b.ef === ef && b.end > G.time && (!best || b.tier > best.tier)) best = b; return best ? EFF[ef].v[best.tier - 1] : 1; }
export const inDeepArena = () => { const p = G.p; return Math.hypot(p.x - SL.x - .5, p.y - SL.y - .5) < 9.6 || Math.hypot(p.x - SI.x - .5, p.y - SI.y - .5) < 9.6; };
export function envRelief(k) { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y);
  for (let y = py - 3; y <= py + 3; y++) for (let x = px - 3; x <= px + 3; x++) { if (!inB(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) > 3.5) continue; const i = idx(x, y);
    if (k === 'hot') { if (G.floor[i] === WATER && !G.wall[i]) return true; continue; }
    const o = G.objs.get(i); if (!o) continue; const d = OBJ[o.t]; if (d && d.light && !d.nat && !d.crop && !o.off && o.t !== 'tchest') return true; }
  return false; }
export let envFxV = 0;
onFrame('env', dt => envTick(dt));
export function envTick(dt) {
  const p = G.p, E = G.env || (G.env = { k: null, v: 0, lv: 0, t: 0 }), b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))], zone = b === 3 ? 'hot' : b === 4 ? 'cold' : null;
  if (zone && E.k !== zone) { E.k = zone; E.v = 0; E.lv = -1; E.t = 0; }
  let rate = -4; if (zone && !envRelief(zone)) rate = (inDeepArena() ? .5 : 1) * bmul(zone === 'hot' ? 'heat' : 'cold') * (G.equip && G.equip.body && ITEMS[G.equip.body.id].guard === zone ? guardMul(lvOf(G.equip.body)) : 1) * (zone === 'cold' ? hatMul() : 1);
  E.v = clamp(E.v + rate * dt, 0, 100); if (!zone && E.v <= 0) E.k = null;
  const lv = !E.k ? 0 : E.v >= 100 ? 3 : E.v >= 70 ? 2 : E.v >= 40 ? 1 : 0;
  if (E.k && started && (lv > E.lv)) { if (lv || E.lv < 0) emit('toast', ENV_TXT[E.k][lv], lv >= 2 ? 'warn' : null, 'env'); } if (E.k) E.lv = lv;
  if (lv === 3 && p.dead <= 0 && !p.cine && !devOn('god')) { /* v127: 연출 장면 동안 더위·추위 피해 없음 */ E.t += dt; if (E.t >= 5) { E.t = 0; p.hp -= 2; emit('hurt'); emit('ftext', p.x, p.y - 1.2, '-2', E.k === 'hot' ? '#ff9b4a' : '#9fd8f0'); if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; G.fish = null; emit('fade', 'faint'); } } } else E.t = 0;
  // the screen edge: fades in and out over a second or two, never stronger than 30% during a boss fight
  let tgt = [0, .15, .30, .375 + Math.sin(performance.now() / 420) * .075][lv]; if (!$('#bossbar').hidden) tgt = Math.min(tgt, .30);
  envFxV += (tgt - envFxV) * Math.min(1, dt / (tgt > envFxV ? 1.2 : 1.6));
}
// v63: natural rock a pickaxe can dig is not a trap — a rock wall on a tile that was rock in the world first generated counts as open (quartz veins
// turn granite into quartz later). Wood/brick walls, walls built on open ground, fences, furniture, bedrock, water and lava still close you in.
// Some new worlds start in a rock-ringed clearing. Used by closedIn (fainting, recall, loading — v64) and regionOf (emergency escape — v63).
export let NATW = null, NATW_K = '';
export function naturalWalls() { const k = G.seed + '|' + W + 'x' + H + '|' + MAPV + (ANCH ? JSON.stringify(ANCH) : ''); if (NATW_K !== k) { NATW = genWorld(G.seed).wall; NATW_K = k; } return NATW; }
export function shutsIn(x, y, j, nat) { if (!isSolid(x, y)) return false; const o = G.objs.get(j), a = o && (o.t === '_part' ? G.objs.get(o.a) : o); if (a && OBJ[a.t] && OBJ[a.t].door) return false;
  return !(nat && nat[j] && nat[j] !== 8 && G.wall[j] && G.wall[j] !== 8 && !BUILT_WALLS.has(G.wall[j])); } // nat null: every solid tile shuts you in
// bug fix: a home point (the lantern tree or a bed) fenced in on every side left you stuck after fainting or recalling;
// if the spot is closed in (no way out within 16 tiles, doors count as a way out), you wake up just outside instead
// (it looks at natural rock only when the spot reads as closed without it, so loading and waking up seldom rebuild the first world)
export function closedIn(x, y, lim = 900, far = 16, nat = null) { const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy) || isSolid(sx, sy)) return null; /* only a free spot can be fenced in */ const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.hypot(cx - sx, cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j) || shutsIn(nx, ny, j, nat)) continue; seen.add(j); st.push([nx, ny]); } }
  return nat ? seen : closedIn(x, y, lim, far, naturalWalls()); }
export function safeSpot(x, y) { const inside = closedIn(x, y); if (!inside) return null; const sx = Math.floor(x), sy = Math.floor(y);
  for (let r = 1; r <= 40; r++) { let best = null, bd = 1e9; for (let ty = sy - r; ty <= sy + r; ty++) for (let tx = sx - r; tx <= sx + r; tx++) { if (Math.max(Math.abs(tx - sx), Math.abs(ty - sy)) !== r || !inB(tx, ty) || inside.has(idx(tx, ty)) || isSolid(tx, ty) || boxHits(tx + .5, ty + .6, .28)) continue;
      const d = Math.hypot(tx - sx, ty - sy); if (d < bd && !closedIn(tx + .5, ty + .6)) { bd = d; best = { x: tx + .5, y: ty + .6 }; } }
    if (best) return best; }
  return null; }
// v57 emergency escape (menu): a fenced yard bigger than closedIn's 16 tiles still trapped a player. regionOf flood-fills the
// walkable area (doors count as a way out); it is "closed" when it ends within lim tiles and far tiles of the start.
export function regionOf(x, y, lim = 3000, far = 60) { const nat = naturalWalls(); const sx = Math.floor(x), sy = Math.floor(y); if (!inB(sx, sy)) return null; const seen = new Set([idx(sx, sy)]), st = [[sx, sy]];
  while (st.length) { const [cx, cy] = st.pop(); if (Math.abs(cx - sx) > far || Math.abs(cy - sy) > far || seen.size > lim) return null;
    for (const [dx, dy] of D4) { const nx = cx + dx, ny = cy + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j) || shutsIn(nx, ny, j, nat)) continue; seen.add(j); st.push([nx, ny]); } }
  return seen; }
export function openSpotNear(x, y, skip) { const sx = Math.floor(x), sy = Math.floor(y), bad = new Set(skip || []); let tries = 0;
  for (let r = 1; r <= 90; r++) { const ring = [];
    for (let ty = sy - r; ty <= sy + r; ty++) for (let tx = sx - r; tx <= sx + r; tx++) { if (Math.max(Math.abs(tx - sx), Math.abs(ty - sy)) !== r || !inB(tx, ty)) continue; const j = idx(tx, ty); if (bad.has(j) || isSolid(tx, ty) || boxHits(tx + .5, ty + .6, .28)) continue; ring.push([Math.hypot(tx - sx, ty - sy), tx, ty]); }
    ring.sort((a, b) => a[0] - b[0]);
    for (const [, tx, ty] of ring) { if (bad.has(idx(tx, ty))) continue; const reg = regionOf(tx + .5, ty + .6); if (!reg) return { x: tx + .5, y: ty + .6 }; for (const j of reg) bad.add(j); if (++tries > 400) return null; } }
  return null; }
export function escapeSpot() { const p = G.p, here = regionOf(p.x, p.y);
  if (here) return openSpotNear(p.x, p.y, here); // closed in where you stand: the nearest open place outside it
  const h = homePt(), home = regionOf(h.x, h.y); if (!home && !boxHits(h.x, h.y, .28)) return h; // otherwise home, unless home is the trap
  return openSpotNear(h.x, h.y, home || []); }
export function emergencyEscape() { const p = G.p; if (p.dead > 0) return false; if ((G.escCd || 0) > G.time) { emit('toast', `긴급 탈출은 ${Math.ceil(G.escCd - G.time)}초 뒤에 다시 쓸 수 있어요`, 'warn', 'esc'); return false; }
  if (p.sit) standUp(); G.recall = null; G.fish = null; const to = escapeSpot(); if (!to) { emit('toast', '빠져나갈 곳을 찾지 못했어요', 'warn', 'esc'); return false; }
  emit('puff', p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; cam.x = p.x; cam.y = p.y; G.enemies.length = 0; markLight(); emit('puff', p.x, p.y - .3, '#e3d4ff', 18, 3, .4);
  G.escCd = G.time + 30; emit('toast', '긴급 탈출! 트인 곳으로 옮겼어요', 'good', 'esc'); return true; }
export function unstick(p, why) { const to = safeSpot(p.x, p.y); if (!to) return false; p.x = to.x; p.y = to.y; cam.x = p.x; cam.y = p.y; markLight(); if (why) setTimeout(() => emit('toast', why, 'warn', 'unstick'), 900); return true; }
export function homePt() { const so = G.spawnPt && G.objs.get(idx(G.spawnPt.x, G.spawnPt.y)); if (so && OBJ[so.t].bed) { const fp = fpOf(so), x = G.spawnPt.x + .5, y = G.spawnPt.y + fp[1] + .6; return boxHits(x, y, .28) ? { x: G.spawnPt.x + fp[0] + .5, y: G.spawnPt.y + .5 } : { x, y }; } return { x: CX + .5, y: CY + 1.7 }; }
export const nearHome = () => { const h = homePt(); return Math.hypot(G.p.x - h.x, G.p.y - h.y) < 12; };
export function recallDecide(s) { const cd = (G.recallCd || 0) - G.time; if (cd > 0) return { k: 'info', lbl: `쉬는 중 ${Math.ceil(cd)}초`, icon: s.id, msg: `귀환석이 쉬고 있어요 · ${Math.ceil(cd)}초 뒤에 다시 쓸 수 있어요` };
  if (G.recall) return { k: 'none', lbl: '돌아가는 중…', icon: s.id };
  if (nearHome()) return G.backPt ? { k: 'recall', lbl: '표지로 돌아가기', icon: s.id, mode: 'back' } : { k: 'info', lbl: '집 근처', icon: s.id, msg: '여기는 집 근처예요. 멀리 나가서 쓰면 집으로 돌아와요' };
  return { k: 'recall', lbl: '집으로', icon: s.id, mode: 'home' }; }
export function startRecall(mode) { if (G.recall || (G.recallCd || 0) > G.time) return; G.recall = { t: RECALL_T, mode, x: G.p.x, y: G.p.y }; emit('sfx', 'seed'); emit('toast', mode === 'home' ? '귀환석이 빛나요… 가만히 있어요' : '표지로 돌아가요… 가만히 있어요', null, 'recall'); }
onFrame('recall', dt => recallTick(dt));
export function recallTick(dt) { const R = G.recall; if (!R) return; const p = G.p;
  if (p.dead > 0 || p.hurt > 0 || Math.hypot(p.x - R.x, p.y - R.y) > .25) { G.recall = null; emit('toast', '움직여서 귀환을 멈췄어요', null, 'recallStop'); return; }
  R.t -= dt; if (fxRand() < .5) emit('puff', p.x + (fxRand() - .5) * .8, p.y - .2, '#b99bff', 1, 1.6, .05);
  if (R.t > 0) return; G.recall = null; G.recallCd = G.time + RECALL_CD;
  let to; if (R.mode === 'back' && G.backPt) { to = G.backPt; G.backPt = null; } else { G.backPt = { x: p.x, y: p.y }; to = homePt(); }
  emit('puff', p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; if (R.mode !== 'back') unstick(p, '집이 사방으로 막혀 있어서 바로 바깥으로 왔어요'); /* bug fix (v49.1): going back to the marker (a spot you stood on) never moves you out of a closed cave pocket */ cam.x = p.x; cam.y = p.y; G.enemies.length = 0; G.fish = null; markLight(); emit('puff', p.x, p.y - .3, '#e3d4ff', 18, 3, .4); emit('sfx', 'win');
  emit('toast', R.mode === 'back' ? '표지가 있던 곳으로 돌아왔어요' : '집으로 돌아왔어요 · 집 근처에서 귀환석을 다시 쓰면 떠난 자리로 갈 수 있어요', 'good', 'recall'); }
// v68 (BF-01·08): every bundle belongs to the player who fainted there (o.own = that player's id). Bundles from before v68 have no
// owner: every save before multiplayer had one player, so they belong to this world's own player (ME). Only the owner takes it back,
// sees it on the small/big button and gets the arrow. Each player keeps up to LOST_MAX bundles of their own.
export const bagOwner = o => (o && o.own) || ME;
export const meId = () => (curPl && curPl.id) || ME;
export const myBag = o => !!o && o.t === 'lostBag' && bagOwner(o) === meId();
let bagScan = { at: -1, n: -1, list: [] }; // all bundles in the world, looked up again at most twice a second (or when one is dropped or emptied)
export const bagsChanged = () => { bagScan.at = -1; };
function allBags() { if (G.time - bagScan.at < .5 && bagScan.at >= 0 && bagScan.g === G) return bagScan.list; const list = []; for (const [i, o] of G.objs) if (o.t === 'lostBag') list.push(i); bagScan = { at: G.time, g: G, list }; return list; }
// my nearest bundle (straight-line distance), or null
export function nearestBag(x, y) { let best = null; for (const i of allBags()) { const o = G.objs.get(i); if (!myBag(o)) continue; const bx = i % W + .5, by = ((i / W) | 0) + .5, d = Math.hypot(bx - x, by - y); if (!best || d < best.d) best = { i, o, x: bx, y: by, d }; } return best; }
// my bundle under my feet or right next to me (the 3×3 tiles around me, nearest first)
export function bagNear() { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let best = null;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = px + dx, y = py + dy; if (!inB(x, y)) continue; const i = idx(x, y), o = G.objs.get(i); if (!myBag(o)) continue; const d = Math.hypot(x + .5 - p.x, y + .5 - p.y); if (!best || d < best.d) best = { t: { x, y }, o, d }; }
  return best; }
export function dropLost() {
  if ((G.guide || 0) < GUIDE.findIndex(q => q.id === 'pick')) return 0; // no loss before the copper pickaxe (v110: 퀘스트 id로)
  const p = G.p, items = []; for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (!s || bagCat(s.id) !== 'mat' || ITEMS[s.id].kind === 'key') continue; const n = Math.floor(s.c * LOST_SHARE); if (n <= 0) continue; s.c -= n; if (!s.c) G.inv[i] = null; const e = items.find(x => x.id === s.id); if (e) e.c += n; else items.push({ id: s.id, c: n }); }
  if (!items.length) return 0; emit('inv');
  const bags = []; for (const [i, o] of G.objs) if (myBag(o)) bags.push([i, o]); // v68: up to LOST_MAX of my own
  if (bags.length >= LOST_MAX) { bags.sort((a, b) => (a[1].at || 0) - (b[1].at || 0)); const [oi, oo] = bags[0]; for (const s of oo.items) if (s) { const e = items.find(x => x.id === s.id); if (e) e.c += s.c; else items.push({ ...s }); } G.objs.delete(oi); }
  const px = Math.floor(p.x), py = Math.floor(p.y); let at = -1;
  for (let r = 0; r <= 4 && at < 0; r++) for (let dy = -r; dy <= r && at < 0; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = px + dx, y = py + dy; if (!inB(x, y)) continue; const i = idx(x, y); if (G.wall[i] || G.objs.get(i) || G.floor[i] === WATER || G.floor[i] === LAVA) continue; at = i; break; }
  if (at < 0) { for (const s of items) moveInto(G.inv, s); return 0; }
  G.objs.set(at, { t: 'lostBag', items, at: Date.now(), own: meId() }); bagsChanged(); emit('tile', at % W, (at / W) | 0); return items.reduce((a, s) => a + s.c, 0);
}
export function pickLost(t, o) { const i = idx(t.x, t.y); if (!myBag(o) || G.objs.get(i) !== o) return; let got = 0; for (let k = 0; k < o.items.length; k++) { const s = o.items[k]; if (!s) continue; const left = moveInto(G.inv, s); got += s.c - left; if (left) s.c = left; else o.items[k] = null; }
  o.items = o.items.filter(Boolean); emit('inv'); emit('sfx', 'pick');
  if (!o.items.length) { G.objs.delete(i); bagsChanged(); markLight(); emit('puff', t.x + .5, t.y + .6, '#ffe9a8', 10, 2, .3); emit('toast', `잃어버린 재료를 모두 되찾았어요 (${got}개)`, 'good', 'lost'); } else emit('toast', `가방이 가득 차서 일부만 되찾았어요 (${got}개)`, null, 'lost'); }
