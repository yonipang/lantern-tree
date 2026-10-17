// ================= v87 바닥 파기: 물·용암 흐름, 빈 양동이 =================
// 기획 dev/design/바닥파기.md (2026-10-17 확정). 파기·메우기 자체는 world/tiles.js(digGround·digWhy·canPlace)와 sim/building.js(placeItem)에 있어요.
// - 물·용암은 이어진 구덩이로 한 칸씩 흘러요 (물 0.5초 · 용암 2초, data/digging.js FLOW_SEC). 원래 물·용암은 줄지 않아요.
// - 물과 용암이 한 구덩이에서 만나면 그 칸은 돌 바닥(6)으로 굳어요.
// - 흘러 들어온 칸의 떨어진 물건: 용암은 태워 없애고, 물은 옆 빈 칸으로 밀어내요. (몬스터·사람은 구덩이에 못 들어가요)
// - 흐를 차례는 저장하지 않아요: 세계를 불러오면 구덩이 옆 물·용암을 한 번 훑어 다시 이어 가요.
import { FLOW_SEC } from '../data/digging.js';
import { G } from '../save/state.js';
import { emit } from './events.js';
import { addItem } from './inventory.js';
import { spawnDrop } from './drops.js';
import { onFrame } from './systems.js';
import { markLight } from './loop.js';
import { WATER } from './nature.js';
import { H, idx, inB, LAVA, PIT, W } from '../world/map.js';
import { isSolid } from '../world/tiles.js';
export const STONE_FLOOR = 6; // 물과 용암이 만나 굳은 칸 (걸을 수 있는 돌 바닥 — 삽으로 걷으면 돌 바닥 아이템)
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export const isLiquid = f => f === WATER || f === LAVA;
// 흐를 차례: 칸 번호 → 그 칸이 바뀔 게임 시간
export let flowQ = new Map(), flowG = null;
export function resetFlow() { flowQ = new Map(); flowG = G; }
function liquidNb(x, y) { let w = false, l = false; for (const [dx, dy] of N4) { const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (G.wall[j]) continue; const f = G.floor[j]; if (f === WATER) w = true; else if (f === LAVA) l = true; } return { w, l }; }
// 구덩이 한 칸이 언제 바뀔지 정해요 (이미 정해져 있으면 더 빠른 쪽)
function schedule(x, y) { const i = idx(x, y); if (G.floor[i] !== PIT || G.wall[i]) return; const n = liquidNb(x, y); if (!n.w && !n.l) return;
  const at = G.time + Math.min(n.w ? FLOW_SEC[WATER] : 99, n.l ? FLOW_SEC[LAVA] : 99), old = flowQ.get(i); if (old == null || at < old) flowQ.set(i, at); }
// (x, y)가 바뀌었을 때 부르는 곳: 그 칸과 옆 칸들 가운데 흘러 들어올 구덩이를 찾아요
export function flowNear(x, y) { if (flowG !== G) scanFlow(); schedule(x, y); for (const [dx, dy] of N4) if (inB(x + dx, y + dy)) schedule(x + dx, y + dy); }
export function scanFlow() { resetFlow(); for (let i = 0; i < W * H; i++) if (G.floor[i] === PIT) schedule(i % W, (i / W) | 0); }
// 구덩이 칸이 물·용암·돌 바닥이 돼요
export function fillPit(i) { const x = i % W, y = (i / W) | 0, n = liquidNb(x, y); if (G.floor[i] !== PIT || (!n.w && !n.l)) return false;
  const nf = n.w && n.l ? STONE_FLOOR : n.w ? WATER : LAVA; G.floor[i] = nf;
  if (nf === LAVA) { let burnt = 0; G.drops = G.drops.filter(d => { const hit = Math.floor(d.x) === x && Math.floor(d.y) === y; if (hit) burnt++; return !hit; }); if (burnt) emit('puff', x + .5, y + .5, '#ffb070', 8, 2, .3); }
  else if (nf === WATER) for (const d of G.drops) { if (Math.floor(d.x) !== x || Math.floor(d.y) !== y) continue; const to = N4.find(([dx, dy]) => inB(x + dx, y + dy) && !isSolid(x + dx, y + dy)); if (to) { d.x = x + to[0] + .5; d.y = y + to[1] + .5; } }
  if (nf === STONE_FLOOR) { emit('puff', x + .5, y + .5, '#d8d4e0', 12, 2.4, .4); emit('sfx', 'brk'); }
  else emit('puff', x + .5, y + .6, nf === WATER ? '#8fd0ff' : '#ff9b4a', 5, 1.6, .2);
  emit('tile', x, y); markLight();
  if (nf !== STONE_FLOOR) for (const [dx, dy] of N4) if (inB(x + dx, y + dy)) schedule(x + dx, y + dy); // 이어진 구덩이로 계속
  return true; }
export function flowTick() {
  if (flowG !== G) scanFlow(); if (!flowQ.size) return;
  const due = []; for (const [i, at] of flowQ) if (at <= G.time) due.push(i);
  for (const i of due) { flowQ.delete(i); fillPit(i); }
}
onFrame('flow', () => flowTick());
// ---- 빈 양동이: 물 칸에서 「물 한 동이」 하나 (물 칸은 그대로, 양동이는 닳지 않아요) ----
export function scoopWater(t) {
  if (!inB(t.x, t.y)) return false; const i = idx(t.x, t.y); if (G.wall[i] || G.floor[i] !== WATER) return false;
  const l = addItem('gWater', 1, false); if (l) spawnDrop('gWater', 1, t.x + .5, t.y + .5);
  emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .6, '#8fd0ff', 7, 2, .2); emit('inv'); return true; }
