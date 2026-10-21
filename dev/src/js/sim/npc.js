// ================= v104 그림자 고치 · NPC · 마을 · 대화 (데이터는 data/npc.js) =================
// 고치 놓기(새 세계·옛 세계 모두 불러올 때 한 번, 워프포인트처럼) → 고치 둘레 그림자 조각 → 공격 버튼으로 3번 치면 풀려나 등불나무 곁 마을 자리에 서요 → 말 걸기(대화 창).
import { BARTER, BARTER_DAY, BARTER_PER, COCOON_GUARD_R, COCOON_GUARDS, COCOON_HITS, COCOON_WAKE, NARU_ASK_END, NARU_CALL, NARU_LIFE, NARU_DOING, NARU_INTRO, NARU_Q, NARU_RW, NPC_IDS, NPCS } from '../data/npc.js';
import { GUIDE, QSIDE } from '../data/quests.js';
import { ASK_IDS, askOwed, grandmaScene, leadHere, leadThere, lifeLine, naru2Scene, naruBang, naruHold, sceneLines } from './naru.js';
import { gainXp } from './player.js';
import { ITEMS } from '../data/items.js';
import { defineCmd } from './commands.js';
import { addItem, countItem, removeItem } from './inventory.js';
import { RECOVER_GAP } from '../data/controls.js';
import { rand, rng } from '../engine/random.js';
import { G, nearestPlayer, playerList, started } from '../save/state.js';
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
  if (G && G.stats) settleStarters(); // v110: 처음부터 마을에 있는 NPC(나루)
  if (!G || !G.stats || G.stats.npcV) return 0; G.stats.npcV = 1; let n = 0;
  const R = rng(((G.seed | 0) ^ 0x5c0c0) >>> 0), reach = walkable(), boss = [{ x: BX, y: BY }, SA, SB, SL, SI];
  const taken = [];
  for (const id of NPC_IDS) { const N = NPCS[id]; if (N.archive || N.start || npcState(id)) continue; // 기록관 학자는 v106 기록관에서
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
// v110: 처음부터 마을에 있는 NPC(start: 나루) — 새 세계는 바로 마을에, 옛 세계는 고치에 갇혀 있으면 고치를 없애고 마을로 (구한 표시도).
// 마을 자리를 못 찾으면 첫 장면을 건너뛴 것으로 봐요(첫 이야기 퀘스트가 막히지 않게).
export function settleStarters() { for (const id of NPC_IDS) { if (!NPCS[id].start || npcState(id) === 'npc') continue;
  for (const [i, o] of [...G.objs]) if (o.t === 'cocoon' && o.npc === id) { G.objs.delete(i); COC.delete(i); G.enemies = G.enemies.filter(e => !(e.k === 'shadowBit' && e.home && Math.hypot(e.home.x - (i % W + .5), e.home.y - (((i / W) | 0) + .5)) < 1)); }
  const s = villageSpot(id); if (s) G.objs.set(idx(s.x, s.y), { t: 'npc', npc: id, met: 0 }); else if (id === 'guide') G.stats.naruMet = 1;
  G.stats.rescued = G.stats.rescued || {}; G.stats.rescued[id] = 1; } }
const NS = { g: null, t: -1, v: null }; // 한 프레임 안에서는 다시 찾지 않아요 (퀘스트 창·HUD가 여러 번 물어요)
export const naruSpot = () => { if (NS.g === G && NS.t === G.time) return NS.v; NS.g = G; NS.t = G.time; NS.v = null; for (const [i, o] of G.objs) if (o.t === 'npc' && o.npc === 'guide') { NS.v = { x: i % W + .5, y: ((i / W) | 0) + .5 }; break; } return NS.v; };
export const naruWaits = () => !G.stats.naruMet || naruBang(); // 머리 위 느낌표 (render/world.js) · v119 2부: 출발 전·나루에게 가기·돌아가기
// 말 걸기 (sim/actions.js use 'talk'): 처음 한 번은 첫 장면
// v117 나루: 첫 장면(방울·횃불을 건넴, 첫 퀘스트 보상은 그 자리에서) → 마을로 부른 장면(6·8번) → 쌓인 보상 → 보통 이야기
export function talkTo(id) {
  if (id !== 'guide') { emit('talk', id, 'talk'); return; }
  naruHold(); // v118: 말을 걸면 멈추고 바라봐요
  if (!G.stats.naruMet) { G.stats.naruMet = 1; G.stats.bell = 1; const l = addItem('torch', 1); if (l) spawnDrop('torch', l, G.p.x, G.p.y); naruGive(['naru'], true); emit('talk', id, 'intro'); return; }
  if (G.stats.introAt != null) { emit('talk', id, 'intro'); return; } // v120: 중간에 닫힌 첫 장면은 거기서 이어서 (방울·횃불·보상은 처음에 이미 받음)
  if (G.stats.naruCall) { const c = G.stats.naruCall; G.stats.naruCall = null; (G.stats.callSeen = G.stats.callSeen || {})[c] = 1; /* v121: 1부 끝 장면 뒤 버섯 여왕 「출발 전」은 [다음 이야기 듣기]로 (sim/naru.js nextStory) */ naruGive(naruOwed(), false); emit('talk', id, 'call:' + c); return; }
  if (leadThere() && leadHere()) return; // v118: 광맥 옆에 먼저 가 있던 나루
  const ask = askOwed()[0]; if (ask) { naruGive([ask, ...naruOwed()], false); /* 쌓인 1부 보상도 같이 */ emit('talk', id, 'ask:' + ask); return; } // v118 나루의 부탁 끝 장면 + 보상
  const sc = naru2Scene(); if (sc) { naruGive([...sc[1], ...naruOwed()], false); emit('talk', id, sc[0]); return; } // v119 2부 장면 (돌아와서·출발 전·나루에게 가기·돌아가기·13번)
  const owed = naruOwed(); if (owed.length) { naruGive(owed, false); G.stats.naruRw = (G.stats.naruRw | 0) + 1; emit('talk', id, 'reward'); return; }
  emit('talk', id, 'talk'); }
// ---- v117 나루에게 받는 보상: 끝냈지만 아직 안 받은 1부 이야기 퀘스트 (나루가 마을에 있을 때만 — 없으면 예전처럼 퀘스트 창에서) ----
export const naruHolds = q => !!q && (NARU_Q.includes(q.id) || ASK_IDS.includes(q.id)) && !!naruSpot(); // v118: 나루의 부탁도
export const naruOwed = () => GUIDE.filter((q, k) => NARU_Q.includes(q.id) && k < G.guide && !(G.qclaim || {})[q.id]).map(q => q.id);
export const naruAsk = () => !!G.stats.naruMet && (!!G.stats.naruCall || naruOwed().length > 0 || askOwed().length > 0 || (G.stats.nPend || []).length > 0); // v119: 쌓인 「돌아와서」 장면도 // 머리 위 ? (render/world.js)
// 보상 주기: 물건 + 아직 안 받은 경험치(옛 세이브에서 이미 지나간 퀘스트) · quiet = 알림 없이(장면 안에서)
export function naruGive(ids, quiet) { G.qclaim = G.qclaim || {}; G.stats.qxp = G.stats.qxp || {}; const got = {};
  for (const id of ids) { const q = GUIDE.find(x => x.id === id) || QSIDE.find(x => x.id === id); if (!q || G.qclaim[id]) continue; G.qclaim[id] = 1; if (G.qAct === id) G.qAct = 'main';
    for (const [it, c] of q.rw) { const l = addItem(it, c, false); if (l) spawnDrop(it, l, G.p.x, G.p.y); got[it] = (got[it] || 0) + c; }
    if (q.xp && !G.stats.qxp[id]) { G.stats.qxp[id] = 1; gainXp(q.xp, G.p.x, G.p.y); } }
  const names = Object.keys(got).map(it => `${ITEMS[it].n} ${got[it]}개`); if (!names.length) return;
  emit('inv'); if (quiet) return; emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffe9a8', 16, 2.6, .6); emit('toast', `나루에게 ${names.join(', ')}를 받았어요`, 'good', 'naruRw'); }
// ---- v117 이름 짓기 (첫 장면 · 프로필): 1~8자, 빈칸이면 고른 캐릭터 이름 ----
export const NAME_MAX = 8;
export function cleanName(n) { const t = String(n == null ? '' : n).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim(); return Array.from(t).slice(0, NAME_MAX).join(''); }
defineCmd('setName', c => { const n = cleanName(c.n); G.pname = n || null; emit('look'); return true; });
// ---- v117 하는 중 한마디 (data/npc.js NARU_DOING): 지금 이야기 퀘스트를 하는 동안 처음 그 일을 할 때 방울로 한 번 ----
const DOING = { wood1: () => (G.stats.wood | 0) >= 1, bench1: () => countItem('bench') > 0, ore1: () => (G.stats.copperOre | 0) >= 1,
  dirt1: () => countItem('dirt') > (G.stats.nDirt0 == null ? 1e9 : G.stats.nDirt0), furn1: () => { const p = G.p; for (let y = Math.floor(p.y) - 6; y <= p.y + 6; y++) for (let x = Math.floor(p.x) - 6; x <= p.x + 6; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && o.t === 'furnace') return true; } return false; } };
let naruT = 0;
onFrame('naru', dt => { naruT += dt; if (naruT < .5) return; naruT = 0; if (!started || !G.stats.naruMet || G.stats.naruCall) return;
  const q = GUIDE[G.guide]; if (!q || !NARU_Q.includes(q.id)) return; const said = G.stats.nSaid = G.stats.nSaid || {};
  if (q.id === 'ore' && G.stats.nDirt0 == null) G.stats.nDirt0 = countItem('dirt'); // 흙 개수는 구리 퀘스트를 시작할 때 기준
  for (const d of NARU_DOING) { if (d.q !== q.id || said[d.k] || !DOING[d.k] || !DOING[d.k]()) continue; said[d.k] = 1; emit('bell', [d.s], 1); break; } });
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
  emit('toast', `${N.n}(${N.job})을(를) 그림자 고치에서 구했어요! 등불나무 곁 마을로 갔어요`, 'good', 'rescue'); const gm = id === 'farmer' && G.stats.naruMet && grandmaScene(); emit('talk', gm ? 'guide' : id, gm || 'hello'); } // v119: 할머니를 구하면 나루와 다시 만나는 장면
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
const NARU_LIFE_OTHER = NARU_LIFE.other;
export function talkLines(id, kind) { const N = NPCS[id]; if (!N) return [];
  if (kind === 'hello') return [N.hello, '등불나무 곁에서 지낼게. 궁금한 게 있으면 말을 걸어 줘.'];
  if (kind === 'intro') return NARU_INTRO.slice(G.stats.introAt | 0); // v120: 중간에 닫았으면 그 줄부터 // v110 · v117 (이름 짓기 · 주인공 대답)
  if (kind.startsWith('sc:')) return sceneLines(kind); // v119 2부 장면
  if (kind.startsWith('call:')) return (NARU_CALL[kind.slice(5)] || ['…']).slice(); // v117 마을로 부른 장면
  if (kind.startsWith('ask:')) return (NARU_ASK_END[kind.slice(4)] || ['…']).slice(); // v118 나루의 부탁 끝 장면
  if (kind === 'reward') return [NARU_RW[((G.stats.naruRw | 0) + NARU_RW.length - 1) % NARU_RW.length]]; // v117 쌓인 보상
  for (const [, o] of G.objs) if (o.t === 'npc' && o.npc === id) { o.met = (o.met || 0) + 1;
    if (id === 'guide') { const l = lifeLine(); return [o.met % 2 || l !== NARU_LIFE_OTHER ? l : N.talk[((o.met >> 1) - 1 + N.talk.length) % N.talk.length]]; } // v118: 곁에 따라 한마디 (그 밖에서는 예전 이야기와 번갈아)
    return [N.talk[(o.met - 1) % N.talk.length]]; }
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
