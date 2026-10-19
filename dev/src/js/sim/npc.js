// ================= v104 그림자 고치 · NPC · 마을 · 대화 (데이터는 data/npc.js) =================
// 고치 놓기(새 세계·옛 세계 모두 불러올 때 한 번, 워프포인트처럼) → 고치 둘레 그림자 조각 → 공격 버튼으로 3번 치면 풀려나 등불나무 곁 마을 자리에 서요 → 말 걸기(대화 창).
import { BARTER, BARTER_DAY, BARTER_PER, COCOON_GUARD_R, COCOON_GUARDS, COCOON_HITS, COCOON_WAKE, NPC_IDS, NPCS } from '../data/npc.js';
import { ITEMS } from '../data/items.js';
import { defineCmd } from './commands.js';
import { addItem, countItem, removeItem } from './inventory.js';
import { RECOVER_GAP } from '../data/controls.js';
import { rand, rng } from '../engine/random.js';
import { G, nearestPlayer, playerList } from '../save/state.js';
import { faceTo } from './actions.js';
import { mkEnemy, regionEnemy } from './enemies.js';
import { emit } from './events.js';
import { spawnDrop } from './drops.js';
import { onFrame } from './systems.js';
import { freeTile, roomNear, walkable } from './warp.js';
import { BX, BY, CX, CY, H, idx, inB, SA, SB, SI, SL, W } from '../world/map.js';
import { isSolid, noDigZone } from '../world/tiles.js';
// ---- 놓기 ----
export const cocoonAt = i => { const o = G.objs.get(i); return o && o.t === 'cocoon' ? o : null; };
export const npcObjs = () => { const out = []; for (const [i, o] of G.objs) if (o.t === 'npc' || o.t === 'cocoon') out.push({ i, o, x: i % W, y: (i / W) | 0 }); return out; };
export const npcState = id => { for (const [, o] of G.objs) if ((o.t === 'npc' || o.t === 'cocoon') && o.npc === id) return o.t; return null; }; // 'cocoon' 갇힘 · 'npc' 구함 · null 없음
export function placeCocoons() {
  if (!G || !G.stats || G.stats.npcV) return 0; G.stats.npcV = 1; let n = 0;
  const R = rng(((G.seed | 0) ^ 0x5c0c0) >>> 0), reach = walkable(), boss = [{ x: BX, y: BY }, SA, SB, SL, SI];
  const taken = [];
  for (const id of NPC_IDS) { const N = NPCS[id]; if (N.archive || npcState(id)) continue; // 기록관 학자는 v106 기록관에서
    const cand = [];
    for (let y = 3; y < H - 3; y += 2) for (let x = 3; x < W - 3; x += 2) { const i = idx(x, y); if (G.biome[i] !== N.b || !freeTile(i)) continue;
      const d = Math.hypot(x - CX, y - CY); if (d < N.minD || d > N.maxD || noDigZone(x, y) || roomNear(x, y)) continue;
      if (Math.hypot(x - boss[N.b].x, y - boss[N.b].y) < 16) continue; if (taken.some(t => Math.hypot(t.x - x, t.y - y) < 20)) continue;
      let ok = true; for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const j = idx(x + dx, y + dy); if (!inB(x + dx, y + dy) || G.wall[j] || G.objs.get(j)) { ok = false; break; } }
      if (ok) cand.push({ x, y, r: reach[i] ? 1 : 0 }); }
    if (!cand.length) continue; const live = cand.filter(c => c.r), P = live.length ? live : cand, c = P[Math.floor(R() * P.length)];
    G.objs.set(idx(c.x, c.y), { t: 'cocoon', npc: id, hits: 0 }); taken.push(c); n++; }
  return n; }
// 마을 자리: 등불나무에서 각도별로 11칸쯤, 가장 가까운 빈 칸 (앞 칸도 비어야 말을 걸 수 있어요)
export function villageSpot(id) { const N = NPCS[id], a = N.ang * Math.PI / 180; let best = null, bd = 1e9;
  for (let r = 10; r <= 16; r++) for (let da = -40; da <= 40; da += 10) { const x = Math.round(CX + Math.cos(a + da * Math.PI / 180) * r), y = Math.round(CY + Math.sin(a + da * Math.PI / 180) * r); if (!inB(x, y + 1)) continue;
    const i = idx(x, y); if (!freeTile(i) || isSolid(x, y + 1) || G.objs.get(idx(x, y + 1))) continue; if (y >= CY + 1 && y <= CY + 5 && x >= CX - 5 && x <= CX + 5) continue;
    const s = (r - 11) * (r - 11) + Math.abs(da) / 10; if (s < bd) { bd = s; best = { x, y }; } }
  return best; }
// ---- 치기 (sim/combat.js doAttack: 가까운 적이 없을 때 앞 칸 고치) ----
export const COC = new Map();
export function cocoonTarget(t) { if (!inB(t.x, t.y)) return null; const i = idx(t.x, t.y), o = cocoonAt(i); return o ? { t, i, o } : null; }
export function hitCocoon(tg, w) { const p = G.p, t = tg.t, o = tg.o; faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: .22, max: .22, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: 1.2, rad: .95 }; emit('sfx', 'swing');
  const h = COC.get(tg.i), n = h && G.time - h.t < RECOVER_GAP ? h.n + 1 : 1; COC.set(tg.i, { n, t: G.time }); o.shake = .15;
  emit('sfx', 'mine'); emit('puff', t.x + .5, t.y + .3, '#6a4a9a', 6, 2, .3); emit('shake', .06);
  if (n < COCOON_HITS) { emit('ftext', t.x + .5, t.y - .6, `${n}/${COCOON_HITS}`, '#d6c2ff'); return; }
  COC.delete(tg.i); rescue(tg.i, o); }
export function rescue(i, o) { const id = o.npc, N = NPCS[id]; if (!N) { G.objs.delete(i); return; } const x = i % W, y = (i / W) | 0;
  G.objs.delete(i); spawnDrop('cocoonBit', 2, x + .5, y + .5); emit('puff', x + .5, y + .2, '#3a2a5a', 30, 4, .6); emit('puff', x + .5, y + .2, '#ffe9a8', 16, 3, .9); emit('sfx', 'win'); emit('shake', .3);
  const s = villageSpot(id); if (s) G.objs.set(idx(s.x, s.y), { t: 'npc', npc: id, met: 0 });
  G.stats.rescued = G.stats.rescued || {}; G.stats.rescued[id] = 1;
  emit('toast', `${N.n}(${N.job})을(를) 그림자 고치에서 구했어요! 등불나무 곁 마을로 갔어요`, 'good', 'rescue'); emit('talk', id, 'hello'); }
// ---- 고치 둘레 그림자 조각: 플레이어가 9칸 안에 오면 3마리까지, 60초마다 ----
onFrame('cocoons', dt => {
  for (const [i, o] of G.objs) { if (o.t !== 'cocoon') continue; const x = i % W + .5, y = (i / W) | 0 + .5; const pl = nearestPlayer(x, y); if (!pl || Math.hypot(pl.p.x - x, pl.p.y - y) > COCOON_WAKE) continue;
    if (G.time - (o.gT || -999) < 60) continue; const near = G.enemies.filter(e => e.k === 'shadowBit' && Math.hypot(e.x - x, e.y - y) < COCOON_GUARD_R + 2).length; if (near >= 2) continue; o.gT = G.time;
    for (let k = near; k < COCOON_GUARDS; k++) { for (let tr = 0; tr < 8; tr++) { const a = rand() * 6.283, r = 1.5 + rand() * 2.5, ex = Math.floor(x + Math.cos(a) * r), ey = Math.floor(y + Math.sin(a) * r); if (!inB(ex, ey) || isSolid(ex, ey) || G.objs.get(idx(ex, ey))) continue;
      const e = regionEnemy(mkEnemy('shadowBit', ex + .5, ey + .6), G.biome[i] || 0); e.home = { x, y }; G.enemies.push(e); break; } } }
});
// 그림자 조각은 고치 둘레를 떠나지 않아요 (sim/enemies.js에서 매 프레임 불러요)
export function shadowLeash(e) { if (e.k !== 'shadowBit' || !e.home) return; const R = e.home.r || COCOON_GUARD_R, dx = e.x - e.home.x, dy = e.y - e.home.y, d = Math.hypot(dx, dy); if (d > R) { e.x = e.home.x + dx / d * R; e.y = e.home.y + dy / d * R; e.vx = -dx / d * 2; e.vy = -dy / d * 2; e.t = .5; } }
// ---- 대화: 안녕 → 할 일 힌트 → 직책 이야기(번갈아) ----
export function talkLines(id, kind) { const N = NPCS[id]; if (!N) return [];
  if (kind === 'hello') return [N.hello, '등불나무 곁에서 지낼게. 궁금한 게 있으면 말을 걸어 줘.'];
  for (const [, o] of G.objs) if (o.t === 'npc' && o.npc === id) { o.met = (o.met || 0) + 1; return [N.talk[(o.met - 1) % N.talk.length]]; }
  return [N.talk[0]]; }
export const villagers = () => NPC_IDS.filter(id => npcState(id) === 'npc');

// ---- v105 물물교환 (data/npc.js BARTER) ----
// 가방 안 재료만 써요(상자는 안 봄). 한 줄은 하루(게임 시간 1200초)에 3번. 쪽지는 이미 배웠거나 가졌으면 안 줘요.
export const barterKey = (npc, k) => npc + ':' + k;
export function barterLeft(npc, k) { const B = (G.stats.barter || {})[barterKey(npc, k)]; if (!B) return BARTER_PER; if (G.time - B[1] >= BARTER_DAY) return BARTER_PER; return Math.max(0, BARTER_PER - B[0]); }
export function barterWhy(npc, k) { const row = (BARTER[npc] || [])[k]; if (!row) return '없는 거래예요'; const [give, get] = row;
  if (barterLeft(npc, k) <= 0) return '오늘은 더 바꿀 수 없어요 (잠시 뒤에 다시)';
  for (const [id, n] of get) if (id.startsWith('rn_')) { const dish = id.slice(3); if ((G.recipes && G.recipes[dish]) || countItem(id) > 0) return '이미 가진 쪽지예요'; }
  for (const [id, n] of give) if (countItem(id) < n) return `${ITEMS[id].n}이(가) ${n - countItem(id)}개 모자라요`;
  return null; }
defineCmd('barter', c => { const npc = c.npc, k = c.n | 0, row = (BARTER[npc] || [])[k]; if (!row || !npcState(npc)) return false; const why = barterWhy(npc, k); if (why) { emit('toast', why, null, 'barter'); emit('sfx', 'clink'); return false; }
  const [give, get] = row; for (const [id, n] of give) removeItem(id, n);
  for (const [id, n] of get) { const left = addItem(id, n); if (left) spawnDrop(id, left, G.p.x, G.p.y); }
  const B = G.stats.barter = G.stats.barter || {}, key = barterKey(npc, k), old = B[key]; B[key] = old && G.time - old[1] < BARTER_DAY ? [old[0] + 1, old[1]] : [1, G.time];
  emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffe9a8', 10, 2, .5); emit('toast', `${get.map(([id, n]) => `${ITEMS[id].n} ${n}개`).join(', ')}을(를) 받았어요`, 'good', 'barter'); emit('inv'); return true; });
