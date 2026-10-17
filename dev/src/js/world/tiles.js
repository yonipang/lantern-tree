// ================= 칸·충돌·움직임·놓기 (구조 변경 5단계: world.js와 content/circuits-regions.js에서 옮김) =================
// 막힌 칸(isSolid)·몸이 걸리는지(boxHits)·움직이기(moveEnt), 여러 칸 가구의 발자리(fpOf·setParts·delObj …), 바닥 파기(v87 구덩이)·못 파는 곳, 놓을 수 있는지(canPlace)
import { BUCKET_FISH, DIG_YIELD, FLOOR_ITEM } from '../data/rpg-nature.js';
import { G, beat, started, playerList } from '../save/state.js';
import { BX, BY, CX, CY, LAVA, PIT, SA, SB, SI, SL, W, idx, inB } from './map.js';
import { OBJ } from '../data/items.js';
import { spawnDrop } from '../sim/drops.js';
import { emit } from '../sim/events.js';
import { placeFp } from '../sim/building.js';
import { addItem, selItem, wear } from '../sim/inventory.js';
import { WATER } from '../sim/nature.js';
import { flowNear } from '../sim/digging.js';

export function isSolid(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i] || G.floor[i] === WATER || G.floor[i] === LAVA || G.floor[i] === PIT) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].solid && !(OBJ[o.t].door && o.open)); } // v87: 구덩이도 막혀요 (발사체는 벽만 봐서 지나가요)
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
// v87: 못 파는 곳 — 등불나무 둘레(가운데에서 9.5칸 안, 새 세계의 시작 빈터와 같은 넓이)와 보스방(방 가운데에서 12칸 안).
// 물·용암·벽·물체·누가 서 있는 칸은 digWhy가 따로 봐요
export const NODIG_TREE = 9.5, NODIG_BOSS = 12;
export function noDigZone(x, y) { const cx = x + .5, cy = y + .5; if (Math.hypot(cx - CX, cy - CY) < NODIG_TREE) return 'tree';
  for (const s of [{ x: BX, y: BY }, SA, SB, SL, SI]) if (Math.hypot(cx - s.x - .5, cy - s.y - .5) < NODIG_BOSS) return 'boss'; return null; }
// 삽으로 이 칸을 팔 수 있나: null = 팔 수 있음, 아니면 못 파는 까닭 (actions.js가 보여 줘요)
export function digWhy(x, y) {
  if (!inB(x, y)) return '여기는 팔 수 없어요'; const i = idx(x, y), f = G.floor[i];
  if (G.wall[i]) return '벽은 곡괭이로 캐요'; if (G.objs.get(i)) return '물건이 있는 칸은 팔 수 없어요';
  if (f === WATER) return '물은 빈 양동이로 떠요'; if (f === LAVA) return '용암은 팔 수 없어요'; if (f === PIT) return '이미 판 구덩이예요 · 바닥 재료로 메울 수 있어요';
  if (!isPlacedFloor(f) && !DIG_YIELD[f]) return '여기는 팔 수 없어요';
  if (occupied(x, y)) return '누가 서 있는 칸은 팔 수 없어요';
  const z = noDigZone(x, y); if (z && !isPlacedFloor(f)) return z === 'tree' ? '등불나무 둘레는 팔 수 없어요' : '보스방은 팔 수 없어요'; // 깔아 둔 바닥은 어디서나 걷을 수 있어요
  return null; }
// 바닥이 돌려주는 아이템 (자연 바닥 = 그 한 삽, 깐 바닥 = 그 바닥 아이템, 물·용암·구덩이 = 없음)
export const floorItem = f => FLOOR_ITEM[f] || DIG_YIELD[f] || null;
export function checkUnlocks() {
  if (!G.terrain) G.terrain = {};
  if (started && !G.stats.bucketTip && (G.stats.fishCaught || 0) >= BUCKET_FISH) { G.stats.bucketTip = 1; emit('toast', '이제 작업대에서 빈 양동이를 만들 수 있어요! 물을 떠서 구덩이에 부어요', 'good', 'bucket'); emit('sfx', 'craft'); }
  if (started && !G.stats.starTip && beat('golem')) { G.stats.starTip = 1; setTimeout(() => emit('toast', '이제 맞는 흙에 심은 작물이 가끔 별 작물로 자라요 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', 'good', 'startip'), 1500); }
}
export function shovelDesc() { return '삽을 들고(도구 칸) 바닥을 바라보며 누르면 파서 구덩이를 만들고, 그 바닥 한 삽을 얻어요(재·눈 바닥은 흙 한 삽). 깔아 둔 바닥은 걷어서 돌려받아요. 구덩이는 사람·몬스터가 못 지나가고, 바닥 재료로 메워요. 등불나무 둘레·보스방은 못 파요.'; }
export function digGround(t) {
  if (digWhy(t.x, t.y)) return; const i = idx(t.x, t.y), f = G.floor[i];
  if (isPlacedFloor(f)) { G.floor[i] = G.under.has(i) ? G.under.get(i) : 2; G.under.delete(i); const l = addItem(FLOOR_ITEM[f], 1, false); if (l) spawnDrop(FLOOR_ITEM[f], 1, t.x + .5, t.y + .5); emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .7, '#e8d8c0', 6, 2); }
  else { const id = DIG_YIELD[f]; G.floor[i] = PIT; const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
    emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .7, f === 1 ? '#7fd06a' : f === 3 ? '#c49ae0' : f === 4 ? '#b9a8ff' : f === 20 || f === 19 ? '#cfeaff' : '#a07a5a', 7, 2.2); G.stats.dug = (G.stats.dug || 0) + 1; }
  flowNear(t.x, t.y); // 새 구덩이(또는 걷어서 드러난 구덩이) 옆에 물·용암이 있으면 흘러 들어와요
  emit('tile', t.x, t.y); emit('inv'); const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
}
export function canPlace(tx, ty, it, skip) {
  if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].sz) { const d = OBJ[it.obj], fp = placeFp(d), a = placeAnchor({ x: tx, y: ty }, fp); return fpFree(a.x, a.y, fp, !!d.solid, null, skip); }
  if (!inB(tx, ty)) return false; const i = idx(tx, ty); if (G.wall[i]) return false; const o = G.objs.get(i);
  if (it.kind === 'wire') return !G.wire.has(i) && G.floor[i] !== WATER && G.floor[i] !== LAVA && G.floor[i] !== PIT && (!o || !OBJ[o.t].tree);
  if (it.kind === 'floor') return G.floor[i] !== it.floor && (!o || !OBJ[o.t].tree); // 구덩이 위에도 깔 수 있어요 (걷으면 구덩이가 다시 드러나요)
  if (it.kind === 'ground') { const f = G.floor[i]; if (o) return false; // v87: 물 한 동이는 구덩이에만 · 다른 바닥 재료는 구덩이를 메우거나, 물·용암을 메우거나, 다른 자연 바닥을 바꿔요
    if (it.ground === WATER) return f === PIT; return f === PIT || f === WATER || f === LAVA || (!!DIG_YIELD[f] && f !== it.ground); }
  if (o) return false;
  if (G.floor[i] === PIT) return false; // v87: 구덩이에는 벽·가구·씨앗을 놓지 못해요 (먼저 메워요)
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
