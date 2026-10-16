// ================= 자연: 꽃잎 구역, 작물·어린나무 자라기, 베고 남기기·파내기, 풀·뿌리 다시 자라기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { TREE_BLESS } from '../art/world.js';
import { ITEMS, OBJ } from '../data/items.js';
import { FLOWERS, REGROW_TIME, YOUNG_T } from '../data/rpg-nature.js';
import { rand, rng } from '../engine/random.js';
import { alivePlayers, G, nearestPlayer, nextTurn, playerList } from '../save/state.js';
import { rollDrops, spawnDrop } from './drops.js';
import { mkEnemy } from './enemies.js';
import { emit } from './events.js';
import { clampCrop, giantTry, rollStar } from './farming.js';
import { addItem, selItem, wear } from './inventory.js';
import { onFrame } from './systems.js';
import { treeStage } from './tree.js';
import { BX, BY, CX, CY, H, idx, inB, W } from '../world/map.js';
import { delObj, fpFree, fpOf, isPlacedFloor, isSolid, setParts } from '../world/tiles.js';
import { markLight } from './loop.js';
export const WATER = 10;
export function genFlowerZones() {
  const R = rng((G.seed | 0) * 7 + 99), zones = [];
  for (const c of ['R', 'B', 'Y', 'W', 'K', 'R', 'B', 'Y', 'W', 'K']) {
    for (let tries = 0; tries < 1200; tries++) {
      const loose = tries >= 500, far = c === 'K', a = R() * 6.283, d = loose ? 14 + R() * 50 : (far ? 40 : 16) + R() * (far ? 22 : 28), x = Math.floor(CX + Math.cos(a) * d), y = Math.floor(CY + Math.sin(a) * d);
      if (x < 4 || y < 4 || x >= W - 4 || y >= H - 4 || G.biome[idx(x, y)] !== 0) continue;
      if (zones.some(z => Math.hypot(z.x - x, z.y - y) < (loose ? 10 : 13)) || Math.hypot(x - BX, y - BY) < 12) continue;
      let open = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = idx(x + dx, y + dy); if (!G.wall[j] && G.floor[j] !== WATER) open++; }
      if (open < (loose ? 12 : 17)) continue;
      zones.push({ x, y, c, dead: [] });
      for (let k = 0; k < 14; k++) { const fx = x + Math.round((R() - .5) * 7), fy = y + Math.round((R() - .5) * 7), j = idx(fx, fy); if (!G.wall[j] && !G.objs.get(j) && [1, 2].includes(G.floor[j])) G.objs.set(j, { t: 'wildF', c }); }
      break;
    }
  }
  return zones;
}
export const cleanZones = zs => zs.filter(z => z && Number.isInteger(z.x) && Number.isInteger(z.y) && FLOWERS[z.c]).map(z => ({ x: z.x, y: z.y, c: z.c, dead: Array.isArray(z.dead) ? z.dead.filter(Number.isFinite) : [] }));
export let zoneT = 0, growT = 0;
onFrame('zone', dt => {
  zoneT += dt; if (zoneT > 1) { zoneT = 0; zoneTick(); }
});
onFrame('grow', dt => {
  growT += dt; if (growT > 2) { const gd = growT; growT = 0; growTick(gd); }
});
export function zoneTick() {
  if (!G.fzones || !alivePlayers().length) return;
  G.fzones.forEach((z, zi) => { const p = nearestPlayer(z.x + .5, z.y + .5).p; // 구역마다 가장 가까운 살아 있는 플레이어 (8단계)
    z.dead = z.dead.filter(t => t > G.time);
    if (Math.hypot(z.x + .5 - p.x, z.y + .5 - p.y) > 26 || (z.next || 0) > G.time) return;
    const alive = G.enemies.reduce((n, e) => n + (e.zone === zi ? 1 : 0), 0), cap = z.c === 'K' ? 2 : 3;
    if (alive + z.dead.length >= cap) return;
    for (let k = 0; k < 10; k++) { const x = Math.floor(z.x + (rand() - .5) * 6), y = Math.floor(z.y + (rand() - .5) * 6);
      if (!inB(x, y) || isSolid(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) < 3.5) continue;
      const e = mkEnemy('bloom' + z.c, x + .5, y + .6); e.zone = zi; G.enemies.push(e); emit('puff', x + .5, y + .4, FLOWERS[z.c][2], 8, 2, .3); z.next = G.time + 1.5; break; }
  });
}
export const isYoung = o => !!(o && o.yg && G.time < o.yg);
// -1 bare stump, 0 sapling, 1 young sapling, 2 young tree (can be cut for a little wood), 3 grown. Worked out from times already saved, so old saves need nothing new
export function treeStep(o) { const d = OBJ[o.t]; if (d.growTo) { const r = (o.at || 0) - G.time; return d.stump && r > 3 * YOUNG_T ? -1 : r > 2 * YOUNG_T ? 0 : 1; } return isYoung(o) ? 2 : 3; }
export const youngDrops = drops => drops.filter(([id, , , ch]) => ch >= 1 && !['sapling', 'capSapling', 'resin'].includes(id)).map(([id, a, b]) => [id, Math.max(1, Math.ceil(a / 2)), Math.max(1, Math.ceil(b / 2)), 1]);
export function afterCut(t, o) {
  const i = idx(t.x, t.y);
  if (o.t === 'root' || o.t === 'bigShroom') G.objs.set(i, { t: o.t === 'root' ? 'stump' : 'capStump', g: o.t, at: G.time + REGROW_TIME });
  else if (OBJ[o.t] && OBJ[o.t].ntree) G.objs.set(i, { t: 'stump', g: o.t, at: G.time + REGROW_TIME });
  else if (o.t === 'grass' || o.t === 'glow' || o.t === 'wildF') { G.regen = G.regen || []; if (G.regen.length < 600) G.regen.push([i, o.t, G.time + (o.t === 'grass' ? 120 : 200), o.c || null]); }
  if (o.t === 'wildF') rollDrops([['petal' + (FLOWERS[o.c] ? o.c : 'R'), 1, 1, 0.35]], t.x + .5, t.y + .5);
}
export function growTick(dt = 2) {
  // crops: lantern-tree blessing (time ×0.8) and water (time ×0.75) add up, but never below half the normal time
  const BR = TREE_BLESS(treeStage());
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.crop || o.p == null) continue; if (G.time - o.p >= d.grow) { if (o.star == null) rollStar(i, o); giantTry(i, o); continue; } let k = 0; if (BR && Math.hypot(i % W - CX, ((i / W) | 0) - CY) <= BR) k += .25; if (o.w) k += 1 / 3; if (k) { o.p -= dt * k; clampCrop(o); } }
  const p = G.p, inside = (x, y) => playerList().some(pl => Math.abs(x + .5 - pl.p.x) < .8 && Math.abs(y + .5 - pl.p.y) < .8); // 플레이어가 서 있는 칸에서는 안 자라요
  for (const [i, o] of G.objs) { if (o.yg && G.time >= o.yg) { delete o.yg; const x = i % W, y = (i / W) | 0; if (Math.hypot(x - p.x, y - p.y) < 20) emit('puff', x + .5, y + .2, '#9be37a', 6, 2, .3); } }
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.growTo || G.time < (o.at || 0) - YOUNG_T) continue; const x = i % W, y = (i / W) | 0;
    if (inside(x, y)) { o.at = Math.max(o.at || 0, G.time + 4 + YOUNG_T); continue; }
    const nt = d.growTo === 'g' ? (OBJ[o.g] ? o.g : 'root') : d.growTo, yg = (o.at || 0) > G.time ? o.at : 0, no = yg ? { t: nt, yg } : { t: nt };
    if (OBJ[nt].sz) { G.objs.delete(i); if (!fpFree(x, y, fpOf(no), true)) { G.objs.set(i, o); o.at = G.time + 10 + YOUNG_T; continue; } G.objs.set(i, no); setParts(i, no); } else G.objs.set(i, no); if (Math.hypot(x - p.x, y - p.y) < 20) emit('puff', x + .5, y + .6, '#9be37a', 8, 2, .3); markLight(); }
  if (G.regen && G.regen.length) G.regen = G.regen.filter(([i, t, at, c]) => { if (at > G.time) return true; if (!OBJ[t] || G.wall[i] || G.objs.get(i) || ![1, 2, 3].includes(G.floor[i])) return false; const x = i % W, y = (i / W) | 0; if (inside(x, y)) return true; const o = { t }; if (c) o.c = c; G.objs.set(i, o); return false; });
}
export function digPlant(t, o) {
  const d = OBJ[o.t], i = idx(t.x, t.y); delObj(i);
  const id = d.bush ? 'berryBush' : o.t === 'sapling' ? 'sapling' : o.t === 'capSapling' ? 'capSapling' : d.stump && o.g && OBJ[o.g] && OBJ[o.g].ntree && ITEMS[o.g] ? o.g : 'wood';
  const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
  emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .7, '#9be37a', 7, 2.2); emit('inv'); markLight(); const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
  emit('toast', d.bush ? '베리덤불을 퍼냈어요. 원하는 곳에 다시 심어요' : d.stump ? `${d.n}을(를) 뽑았어요` : `${d.n}을(를) 퍼냈어요`, null, 'digplant');
}
// ---- nature decorations ----
export const WFLOOR = new Set([11, 12, 13, 14, 15]);
// ================= update =================
export let regrowT = 0;
export function regrow() {
  const p = nextTurn().p; // 플레이어를 돌아가며 그 주변에 (8단계)
  for (let k = 0; k < 14; k++) {
    const a = rand() * 6.283, d = 13 + rand() * 22, x = Math.floor(p.x + Math.cos(a) * d), y = Math.floor(p.y + Math.sin(a) * d);
    if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue; const i = idx(x, y), f = G.floor[i], b = G.biome[i];
    if (G.wall[i] || G.objs.get(i) || !(f === 1 || f === 2 || f === 3) || b === 2) continue;
    if (Math.hypot(x - CX, y - CY) < 3.5) continue;
    let nat = 0, built = false;
    for (let dy = -3; dy <= 3 && !built; dy++) for (let dx = -3; dx <= 3; dx++) { const j = idx(x + dx, y + dy), o = G.objs.get(j); if (isPlacedFloor(G.floor[j])) { built = true; break; } if (!o) continue; const od = OBJ[o.t]; if (od.nat || od.bush) nat++; else if (od.item || od.tw) { built = true; break; } }
    if (built || nat >= 6) continue;
    const nt = rand() < (b === 1 ? 0.25 : 0.35) && f !== 3 ? 'root' : 'grass';
    if (rand() >= (nt === 'root' ? 1 / 3 : 0.5)) return; // v74: root pillars regrow 1/3 as often, moss grass 1/2
    G.objs.set(i, { t: nt }); return;
  }
}
onFrame('regrow', dt => {
  regrowT += dt; if (regrowT > 3) { regrowT = 0; regrow(); }
});
