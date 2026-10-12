// ================= 칸·충돌·움직임·놓기 (구조 변경 5단계: world.js와 content/circuits-regions.js에서 옮김) =================
// 막힌 칸(isSolid)·몸이 걸리는지(boxHits)·움직이기(moveEnt), 여러 칸 가구의 발자리(fpOf·setParts·delObj …), 땅 파기·지형 배우기, 놓을 수 있는지(canPlace)
import { FLOOR_ITEM, TERRAIN } from '../data/rpg-nature.js';
import { G, beat, started } from '../save/state.js';
import { LAVA, W, idx, inB } from './map.js';
import { OBJ } from '../data/items.js';
import { SFX } from '../engine/audio.js';
import { puff, toast } from '../engine/effects.js';
import { spawnDrop } from '../sim/drops.js';

export function isSolid(tx, ty) { if (!inB(tx, ty)) return true; const i = idx(tx, ty); if (G.wall[i] || G.floor[i] === WATER || G.floor[i] === LAVA) return true; let o = G.objs.get(i); if (o && o.t === '_part') o = G.objs.get(o.a); return !!(o && OBJ[o.t] && OBJ[o.t].solid && !(OBJ[o.t].door && o.open)); }
export function boxHits(x, y, r) { for (let ty = Math.floor(y - r); ty <= Math.floor(y + r * 0.7); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (isSolid(tx, ty)) return true; return false; }
export function moveEnt(e, dx, dy, r) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15)); let bx = false, by = false;
  for (let k = 0; k < n; k++) {
    if (!bx) { const nx = e.x + dx / n; if (!boxHits(nx, e.y, r)) e.x = nx; else bx = true; }
    if (!by) { const ny = e.y + dy / n; if (!boxHits(e.x, ny, r)) e.y = ny; else by = true; }
  }
  return bx || by;
}
export function occupied(tx, ty) {
  const p = G.p, r = 0.28; if (p.x + r > tx && p.x - r < tx + 1 && p.y + r * .7 > ty && p.y - r < ty + 1) return true;
  for (const e of G.enemies) if (Math.floor(e.x) === tx && Math.floor(e.y) === ty) return true; return false;
}
export const isPlacedFloor = f => !!FLOOR_ITEM[f];
export const terrainOk = f => !!(TERRAIN[f] && (TERRAIN[f].base || (G.terrain && G.terrain[f])));
export function checkUnlocks() {
  if (!G.terrain) G.terrain = {};
  for (const f in TERRAIN) { const T = TERRAIN[f]; if (T.base || G.terrain[f] || !T.when()) continue; G.terrain[f] = 1;
    if (started) { toast(`새 지형을 배웠어요: ${T.n}! 삽을 들고 떠서 다른 곳에 옮길 수 있어요${hasItem('shovel') ? '' : ' (삽은 장비제작대에서 만들어요)'}`, 'good', 'terrain' + f); SFX.craft(); } }
  if (started && !G.stats.starTip && beat('golem')) { G.stats.starTip = 1; setTimeout(() => toast('이제 맞는 흙에 심은 작물이 가끔 별 작물로 자라요 (베리=이끼, 버섯·빛버섯=버섯흙, 수정 콩=수정 모래)', 'good', 'startip'), 1500); }
}
export function shovelDesc() {
  const ks = Object.keys(TERRAIN).map(Number), ok = ks.filter(terrainOk).map(f => TERRAIN[f].n), no = ks.filter(f => !terrainOk(f));
  return `삽을 들고(도구 칸) 바닥을 바라보며 누르면 깔아 둔 바닥을 걷고, 땅을 누르면 배운 지형을 떠서 옮길 수 있어요. 배운 지형: ${ok.join(' · ')}${no.length ? ' / 아직: ' + no.map(f => `${TERRAIN[f].n}(${TERRAIN[f].how.replace(/ ?배워요$/, '')})`).join(', ') : ''}`;
}
export function digGround(t) {
  const i = idx(t.x, t.y), f = G.floor[i]; if (G.wall[i] || G.objs.get(i)) return;
  if (isPlacedFloor(f)) { G.floor[i] = G.under.has(i) ? G.under.get(i) : 2; G.under.delete(i); const l = addItem(FLOOR_ITEM[f], 1, false); if (l) spawnDrop(FLOOR_ITEM[f], 1, t.x + .5, t.y + .5); SFX.pick(); puff(t.x + .5, t.y + .7, '#e8d8c0', 6, 2); }
  else { if (f === 2 || !terrainOk(f)) return; const id = TERRAIN[f].item; G.floor[i] = 2; const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
    SFX.pick(); puff(t.x + .5, t.y + .7, f === WATER ? '#8fd0ff' : f === 1 ? '#7fd06a' : f === 3 ? '#c49ae0' : '#b9a8ff', 7, 2.2); G.stats.dug = (G.stats.dug || 0) + 1; }
  mapPixel(t.x, t.y); invDirty = true; const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
}
export function canPlace(tx, ty, it) {
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

export const fpOf = o => { const d = OBJ[o.t]; if (!d || !d.sz) return [1, 1]; return o.rot && d.sz[0] !== d.sz[1] ? [d.sz[1], d.sz[0]] : d.sz; };
export function fpTiles(i, o, fp) { fp = fp || fpOf(o); const x = i % W, y = (i / W) | 0, out = []; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) out.push(idx(x + dx, y + dy)); return out; }
export function setParts(i, o) { for (const j of fpTiles(i, o)) if (j !== i) G.objs.set(j, { t: '_part', a: i }); }
export function clearParts(i, o) { for (const j of fpTiles(i, o)) { if (j === i) continue; const q = G.objs.get(j); if (q && q.t === '_part' && q.a === i) G.objs.delete(j); } }
export function delObj(i) { const o = G.objs.get(i); if (o && OBJ[o.t] && OBJ[o.t].sz) clearParts(i, o); G.objs.delete(i); }
export function anchorAt(i) { const o = G.objs.get(i); if (o && o.t === '_part') { const a = G.objs.get(o.a); return a && a.t !== '_part' ? o.a : -1; } return o ? i : -1; }
export function fpFree(x, y, fp, solid, own) { for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) { const tx = x + dx, ty = y + dy; if (!inB(tx, ty)) return false; const j = idx(tx, ty); if (G.wall[j] || G.floor[j] === WATER || G.floor[j] === LAVA) return false; const q = G.objs.get(j); if (q && !(own != null && (j === own || (q.t === '_part' && q.a === own)))) return false; if (solid && occupied(tx, ty)) return false; } return true; }
export function placeAnchor(t, fp) { const f = G.p.face; let x = t.x, y = t.y; if (Math.abs(f.x) >= Math.abs(f.y)) { if (f.x < 0) x -= fp[0] - 1; y -= Math.floor((fp[1] - 1) / 2); } else { if (f.y < 0) y -= fp[1] - 1; x -= Math.floor((fp[0] - 1) / 2); } return { x, y }; }
