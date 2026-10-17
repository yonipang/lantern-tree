// ================= 자연: 꽃잎 구역, 작물·어린나무 자라기, 벤 뒤 처리, 하루 하나 새 자연물 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { TREE_BLESS } from '../art/world.js';
import { OBJ } from '../data/items.js';
import { FLOWERS, SEED_OF, YOUNG_T } from '../data/rpg-nature.js';
import { NAT_DAY_FLOORS, NAT_DAY_KINDS, NAT_DAY_MAX } from '../data/digging.js';
import { rand, rng } from '../engine/random.js';
import { alivePlayers, G, nearestPlayer, playerList } from '../save/state.js';
import { rollDrops, spawnDrop } from './drops.js';
import { mkEnemy } from './enemies.js';
import { emit } from './events.js';
import { clampCrop, giantTry, rollStar } from './farming.js';
import { onFrame } from './systems.js';
import { treeStage } from './tree.js';
import { BX, BY, CX, CY, H, idx, inB, W } from '../world/map.js';
import { fpFree, fpOf, isSolid, noDigZone, occupied, setParts } from '../world/tiles.js';
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
// v87: 벤 나무(뿌리기둥·큰버섯·꾸밈 나무)는 그루터기 없이 사라지고 묘목을 꼭 1개 줘요 — 다시 자라지 않아요 (예전: 그루터기가 240초 뒤 다시 자람)
export function afterCut(t, o) {
  const i = idx(t.x, t.y), d = OBJ[o.t];
  if (SEED_OF[o.t] || (d && d.ntree)) { const fp = d && d.sz ? fpOf(o) : [1, 1]; spawnDrop(SEED_OF[o.t] || 'sapling', 1, t.x + fp[0] / 2, t.y + fp[1] / 2); }
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
// ---- nature decorations ----
export const WFLOOR = new Set([11, 12, 13, 14, 15]);
// ================= update =================
// v87: 세계 자연 재생은 실제 시간으로 하루에 하나 (예전: 플레이어 가까이 3초마다 이끼풀·뿌리기둥). 게임을 안 한 날 몫은 NAT_DAY_MAX개까지 쌓였다가
// 다음에 세계를 열면 한꺼번에 생겨요. 세계 아무 곳의 그 지역에 맞는 빈 자연 바닥(깐 바닥·등불나무 둘레·보스방·누가 선 칸은 빼요)에.
// 이끼풀·빛버섯·들꽃이 같은 자리에서 다시 자라는 것(G.regen, 위 growTick)은 그대로예요.
export const dayNo = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }; // 이 기기의 날짜
export let regrowT = 0;
export function pickNat(b) { const L = NAT_DAY_KINDS[b]; if (!L) return null; let s = 0; for (const [, w] of L) s += w; let r = rand() * s; for (const [k, w] of L) { r -= w; if (r < 0) return k; } return L[L.length - 1][0]; }
export function spawnNatural() {
  for (let k = 0; k < 400; k++) {
    const x = 2 + Math.floor(rand() * (W - 4)), y = 2 + Math.floor(rand() * (H - 4)), i = idx(x, y), f = G.floor[i];
    if (G.wall[i] || G.objs.get(i) || !NAT_DAY_FLOORS.has(f) || noDigZone(x, y) || occupied(x, y)) continue;
    const nt = pickNat(G.biome[i]); if (!nt || !OBJ[nt]) continue;
    G.objs.set(i, nt === 'bush' ? { t: nt, r: 0 } : { t: nt }); emit('tile', x, y); markLight(); return { x, y, t: nt };
  }
  return null;
}
export function regrow() {
  const today = dayNo(); if (G.natDay == null || G.natDay > today) { G.natDay = today; return; } // 새 세계·옛 세이브는 오늘부터 세요 (밀린 몫 없음)
  const n = Math.min(NAT_DAY_MAX, today - G.natDay); if (n <= 0) return;
  for (let k = 0; k < n; k++) spawnNatural();
  G.natDay = today;
}
onFrame('regrow', dt => {
  regrowT += dt; if (regrowT > 3) { regrowT = 0; regrow(); }
});
