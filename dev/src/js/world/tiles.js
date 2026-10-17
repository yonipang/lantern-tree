// ================= 칸·충돌·움직임·놓기 (구조 변경 5단계: world.js와 content/circuits-regions.js에서 옮김) =================
// 막힌 칸(isSolid)·몸이 걸리는지(boxHits)·움직이기(moveEnt), 여러 칸 가구의 발자리(fpOf·setParts·delObj …), 땅 파기·지형 배우기, 놓을 수 있는지(canPlace)
import { FLOOR_ITEM, TERRAIN } from '../data/rpg-nature.js';
import { G, beat, started, playerList } from '../save/state.js';
import { LAVA, W, idx, inB } from './map.js';
import { OBJ } from '../data/items.js';
import { spawnDrop } from '../sim/drops.js';
import { emit } from '../sim/events.js';
import { placeFp } from '../sim/building.js';
import { addItem, selItem, wear } from '../sim/inventory.js';
import { WATER } from '../sim/nature.js';
import { hasItem } from '../sim/quests.js';

export function isSolid(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i] || G.floor[i] === WATER || G.floor[i] === LAVA) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].solid && !(OBJ[o.t].door && o.open)); }
// v85: 시야를 가리는 칸 = 벽·닫힌 문 (물·용암·가구는 너머가 보여요)
export function blocksSight(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i]) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].door && !o.open); }
// v85: (ax, ay)에서 (bx, by)가 보이나 — 두 점 사이를 0.25칸마다 짚어 벽·닫힌 문이 있으면 안 보여요 (양쪽 끝 칸은 빼요)
export function canSee(ax, ay, bx, by) {
  const sx = Math.floor(ax), sy = Math.floor(ay), ex = Math.floor(bx), ey = Math.floor(by), n = Math.ceil(Math.hypot(bx - ax, by - ay) / 0.25);
  for (let k = 1; k < n; k++) { const tx = Math.floor(ax + (bx - ax) * k / n), ty = Math.floor(ay + (by - ay) * k / n); if ((tx === sx && ty === sy) || (tx === ex && ty === ey)) continue; if (blocksSight(tx, ty)) return false; }
  return true;
}
export function boxHits(x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r * 0.7); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (isSolid(tx, ty)) return true; return false; }
export function moveEnt(e, dx, dy, r) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15)); let bx = false, by = false;
  for (let k = 0; k < n; k++) {
    if (!bx) { const nx = e.x + dx / n; if (!boxHits(nx, e.y, r)) e.x = nx; else bx = true; }
    if (!by) { const ny = e.y + dy / n; if (!boxHits(e.x, ny, r)) e.y = ny; else by = true; }
  }
  return bx || by;
}
// v67 (BF-10): moving (almost) straight into the corner of a wall or a piece of furniture slides the body round it, like Core Keeper.
// Only when the way ahead is free a little to one side (at most SLIDE_MAX of a tile): a wall that blocks the whole front still stops you,
// and the sideways step is never more than what was left of this frame's step (no extra speed, no jumping through gaps).
export const SLIDE_MAX = 0.4, SLIDE_AXIS = 2.5; // how far round the corner · how straight the push must be (main axis ≥ 2.5 × the other)
export function moveSlide(e, dx, dy, r) {
  const x0 = e.x, y0 = e.y, hit = moveEnt(e, dx, dy, r); if (!hit) return false;
  const ax = Math.abs(dx), ay = Math.abs(dy), left = Math.hypot(dx, dy) - Math.hypot(e.x - x0, e.y - y0);
  if (left <= 1e-6) return true;
  if (ax > ay * SLIDE_AXIS) slideSide(e, Math.sign(dx), 0, left, r);
  else if (ay > ax * SLIDE_AXIS) slideSide(e, 0, Math.sign(dy), left, r);
  return true;
}
export function slideSide(e, sx, sy, step, r) {
  const ahead = .05; if (!boxHits(e.x + sx * ahead, e.y + sy * ahead, r)) return; // not blocked straight ahead any more
  for (let d = .02; d <= SLIDE_MAX + 1e-9; d += .02) for (const s of [-1, 1]) { const ox = sy ? s * d : 0, oy = sx ? s * d : 0;
    if (!boxHits(e.x + ox, e.y + oy, r) && !boxHits(e.x + ox + sx * ahead, e.y + oy + sy * ahead, r)) { const m = Math.min(step, d) * s; moveEnt(e, sy ? m : 0, sx ? m : 0, r); return; } }
}
// someone's body is in this tile (skip = the body to leave out: the player who is placing something, BF-09)
export function occupied(tx, ty, skip) {
  const r = 0.28; for (const pl of playerList()) { const p = pl.p; if (p === skip) continue; if (p.x + r > tx && p.x - r < tx + 1 && p.y + r * .7 > ty && p.y - r < ty + 1) return true; } // 플레이어 누구든 (8단계)
  for (const e of G.enemies) if (Math.floor(e.x) === tx && Math.floor(e.y) === ty) return true; return false;
}
export const isPlacedFloor = f => !!FLOOR_ITEM[f];
export const terrainOk = f => !!(TERRAIN[f] && (TERRAIN[f].base || (G.terrain && G.terrain[f])));
export function checkUnlocks() {
  if (!G.terrain) G.terrain = {};
  for (const f in TERRAIN) { const T = TERRAIN[f]; if (T.base || G.terrain[f] || !T.when()) continue; G.terrain[f] = 1;
    if (started) { emit('toast', `새 지형을 배웠어요: ${T.n}! 삽을 들고 떠서 다른 곳에 옮길 수 있어요${hasItem('shovel') ? '' : ' (삽은 장비제작대에서 만들어요)'}`, 'good', 'terrain' + f); emit('sfx', 'craft'); } }
  if (started && !G.stats.starTip && beat('golem')) { G.stats.starTip = 1; setTimeout(() => emit('toast', '이제 맞는 흙에 심은 작물이 가끔 별 작물로 자라요 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', 'good', 'startip'), 1500); }
}
export function shovelDesc() {
  const ks = Object.keys(TERRAIN).map(Number), ok = ks.filter(terrainOk).map(f => TERRAIN[f].n), no = ks.filter(f => !terrainOk(f));
  return `삽을 들고(도구 칸) 바닥을 바라보며 누르면 깔아 둔 바닥을 걷고, 땅을 누르면 배운 지형을 떠서 옮길 수 있어요. 배운 지형: ${ok.join(' · ')}${no.length ? ' / 아직: ' + no.map(f => `${TERRAIN[f].n}(${TERRAIN[f].how.replace(/ ?배워요$/, '')})`).join(', ') : ''}`;
}
export function digGround(t) {
  const i = idx(t.x, t.y), f = G.floor[i]; if (G.wall[i] || G.objs.get(i)) return;
  if (isPlacedFloor(f)) { G.floor[i] = G.under.has(i) ? G.under.get(i) : 2; G.under.delete(i); const l = addItem(FLOOR_ITEM[f], 1, false); if (l) spawnDrop(FLOOR_ITEM[f], 1, t.x + .5, t.y + .5); emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .7, '#e8d8c0', 6, 2); }
  else { if (f === 2 || !terrainOk(f)) return; const id = TERRAIN[f].item; G.floor[i] = 2; const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
    emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .7, f === WATER ? '#8fd0ff' : f === 1 ? '#7fd06a' : f === 3 ? '#c49ae0' : '#b9a8ff', 7, 2.2); G.stats.dug = (G.stats.dug || 0) + 1; }
  emit('tile', t.x, t.y); emit('inv'); const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
}
export function canPlace(tx, ty, it, skip) {
  if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].sz) { const d = OBJ[it.obj], fp = placeFp(d), a = placeAnchor({ x: tx, y: ty }, fp); return fpFree(a.x, a.y, fp, !!d.solid, null, skip); }
  if (!inB(tx, ty)) return false; const i = idx(tx, ty); if (G.wall[i]) return false; const o = G.objs.get(i);
  if (it.kind === 'wire') return !G.wire.has(i) && G.floor[i] !== WATER && G.floor[i] !== LAVA && (!o || !OBJ[o.t].tree);
  if (it.kind === 'floor') return G.floor[i] !== it.floor && (!o || !OBJ[o.t].tree);
  if (it.kind === 'ground') return !o && G.floor[i] !== it.ground && !isPlacedFloor(G.floor[i]) && !(it.ground === WATER && (occupied(tx, ty) || (tx === Math.floor(G.p.x) && ty === Math.floor(G.p.y))));
  if (o) return false;
  if ((G.floor[i] === WATER || G.floor[i] === LAVA) && it.kind !== 'wall') return false;
  if (it.kind === 'seed') return it.crop === 'cropMoss' ? G.floor[i] === 21 : [1, 2, 3, 4, 21].includes(G.floor[i]);
  if (it.kind === 'wall') return !occupied(tx, ty, skip);
  if (it.kind === 'place') { const d = OBJ[it.obj]; return !(d.solid && occupied(tx, ty, skip)); }
  return false;
}
// v67 (BF-09): a wall, door or piece of furniture that would land on the placing player's own body: find one of the four tiles next to
// the tile the player stands on (behind → left/right → ahead, as the player faces) where the body fits — free ground, not a placed tile,
// no monster, no other player. Other players and monsters are never moved: if they are in the way, nothing is placed.
export function placeTiles(tx, ty, it) { if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].sz) { const fp = placeFp(OBJ[it.obj]), a = placeAnchor({ x: tx, y: ty }, fp), out = []; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) out.push([a.x + dx, a.y + dy]); return out; } return [[tx, ty]]; }
export function pushSpot(tx, ty, it) {
  const p = G.p; if (!p || canPlace(tx, ty, it) || !canPlace(tx, ty, it, p)) return null; // free already, or blocked by something else
  const r = 0.28, ptx = Math.floor(p.x), pty = Math.floor(p.y), taken = placeTiles(tx, ty, it), f = p.face || { x: 0, y: 1 };
  const fw = Math.abs(f.x) >= Math.abs(f.y) ? [Math.sign(f.x) || 1, 0] : [0, Math.sign(f.y) || 1];
  for (const [dx, dy] of [[-fw[0], -fw[1]], [-fw[1], fw[0]], [fw[1], -fw[0]], fw]) { const nx = ptx + dx, ny = pty + dy, x = nx + .5, y = ny + .5;
    if (!inB(nx, ny) || taken.some(([a, b]) => a === nx && b === ny) || boxHits(x, y, r)) continue;
    if (playerList().some(pl => pl.p !== p && Math.abs(pl.p.x - x) < r * 2 && Math.abs(pl.p.y - y) < r * 1.7)) continue;
    if (G.enemies.some(e => Math.floor(e.x) === nx && Math.floor(e.y) === ny)) continue;
    return { x, y }; }
  return null;
}
export const placeable = (tx, ty, it) => canPlace(tx, ty, it) || !!pushSpot(tx, ty, it);

export const fpOf = o => { const d = OBJ[o.t]; if (!d || !d.sz) return [1, 1]; return o.rot && d.sz[0] !== d.sz[1] ? [d.sz[1], d.sz[0]] : d.sz; };
export function fpTiles(i, o, fp) { fp = fp || fpOf(o); const x = i % W, y = (i / W) | 0, out = []; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) out.push(idx(x + dx, y + dy)); return out; }
export function setParts(i, o) { for (const j of fpTiles(i, o)) if (j !== i) G.objs.set(j, { t: '_part', a: i }); }
export function clearParts(i, o) { for (const j of fpTiles(i, o)) { if (j === i) continue; const q = G.objs.get(j); if (q && q.t === '_part' && q.a === i) G.objs.delete(j); } }
export function delObj(i) { const o = G.objs.get(i); if (o && OBJ[o.t] && OBJ[o.t].sz) clearParts(i, o); G.objs.delete(i); }
export function anchorAt(i) { const o = G.objs.get(i); if (o && o.t === '_part') { const a = G.objs.get(o.a); return a && a.t !== '_part' ? o.a : -1; } return o ? i : -1; }
export function fpFree(x, y, fp, solid, own, skip) { for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) { const tx = x + dx, ty = y + dy; if (!inB(tx, ty)) return false; const j = idx(tx, ty); if (G.wall[j] || G.floor[j] === WATER || G.floor[j] === LAVA) return false; const q = G.objs.get(j); if (q && !(own != null && (j === own || (q.t === '_part' && q.a === own)))) return false; if (solid && occupied(tx, ty, skip)) return false; } return true; }
export function placeAnchor(t, fp) { const f = G.p.face; let x = t.x, y = t.y; if (Math.abs(f.x) >= Math.abs(f.y)) { if (f.x < 0) x -= fp[0] - 1; y -= Math.floor((fp[1] - 1) / 2); } else { if (f.y < 0) y -= fp[1] - 1; x -= Math.floor((fp[0] - 1) / 2); } return { x, y }; }
