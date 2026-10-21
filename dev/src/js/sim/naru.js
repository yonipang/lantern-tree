// ================= v118 나루 1부 ②: 먼저 걸어 나가기 · 나루의 부탁 · 나루가 사는 모습 · 1부 뒤 상황 한마디 =================
// 기획 dev/design/세계관-NPC.md 「나루 퀘스트라인」·「이어지는 대화 · 길잡이 방울」 (2026-10-20 사용자 확인). 대사·수치는 data/npc.js.
// 나루는 그대로 G.objs의 사람(npc) 물체예요 — 걸을 때는 한 칸씩 옮겨 가고, 그 사이 모습(어디쯤·방향·걸음)은 여기서 render/world.js에 알려 줘요.
// - 사는 모습: 등불나무 둘레(LIFE_R칸)·처음 서 있던 집 자리·그 안의 횃불·작업대 곁을 골라 천천히 걸어가 몇 초 머물러요. 누가 곁에 오면 멈추고 바라봐요.
// - 먼저 걸어 나가기(G.stats.nLead): 4번(횃불)이 끝나면 첫 구리 광맥 옆 빈 칸을 찾아 둬요(wait) → 방울 대화가 끝나면(명령 naruLead, 늦어도 LEAD_WAIT초)
//   곁에 있는 사람이 보는 앞에서 광맥 쪽으로 최대 LEAD_STEPS칸 걷고(walk, 보는 사람은 그동안 서 있음, 누르면 건너뜀) → 반짝이며 광맥 옆에(there)
//   → 누가 LEAD_ARRIVE칸 안에 오면 한마디(back) → 5초 뒤 집으로(done). 멀리 있으면 걷는 모습 없이 바로 광맥 옆에.
// - 나루의 부탁(G.stats.askOpen·askEnd): 이야기 퀘스트 after를 끝내면 방울로 부탁 → 끝내면 경험치는 바로, 방울 「마을로 와 줄래요?」 → 마을에서 끝 장면 + 물건.
// - 상황 한마디(G.stats.nTip): 1부(구리 곡괭이 장면)를 마친 뒤 그 상황이 처음 올 때 방울로 한 줄.
import { LEAD_ARRIVE, LEAD_SEE, LEAD_SPD, LEAD_STEPS, LEAD_WAIT, LIFE_NEAR, LIFE_R, LIFE_SPD, NARU_ASK, NARU_ASK_CALL, NARU_ASK_OPEN, NARU_LEAD_HERE, NARU_LIFE, NARU_TIP, TIP_GAP, NARU2_DEEP_HERE, NARU2_Q, NARU_BOSS, NARU2_BACK, NARU2_GO, NARU2_SC, NARU_INTRO } from '../data/npc.js';
import { BOSSES } from '../data/rpg-nature.js';
import { DEEP_H, DEEP_PLAN } from './deep.js';
import { GUIDE, Q_GO, QSIDE } from '../data/quests.js';
import { HOT, ITEMS, OBJ } from '../data/items.js';
import { rand } from '../engine/random.js';
import { alivePlayers, G, playerList, started } from '../save/state.js';
import { defineCmd } from './commands.js';
import { emit } from './events.js';
import { gainXp, maxHp } from './player.js';
import { onFrame } from './systems.js';
import { freeTile } from './warp.js';
import { naruSpot, talkTo, villageSpot } from './npc.js';
import { CX, CY, dirKo, idx, inB, W } from '../world/map.js';

const TREE = { x: CX + .5, y: CY }; // 등불나무 가운데 (3×2칸)
const nGIdx = id => GUIDE.findIndex(q => q.id === id);
const gPassed = id => { const k = nGIdx(id); return k >= 0 && k < G.guide; };
// ---- 나루 물체 찾기 (한 번 찾으면 그 칸을 기억해요) ----
const NW = { g: null, i: -1, o: null, from: null, mt: 0, spd: LIFE_SPD, path: [], wait: 0, hold: 0, face: { x: 0, y: 1 }, anim: 0 };
function naruAt() { if (NW.g !== G) { Object.assign(NW, { g: G, i: -1, o: null, from: null, mt: 0, path: [], wait: 0, hold: 0, face: { x: 0, y: 1 } }); }
  if (NW.o && G.objs.get(NW.i) === NW.o) return NW;
  NW.o = null; NW.from = null; NW.path = []; for (const [i, o] of G.objs) if (o.t === 'npc' && o.npc === 'guide') { NW.i = i; NW.o = o; break; }
  return NW.o ? NW : null; }
const nX = i => i % W, nY = i => (i / W) | 0;
// 나루가 지금 서 있는(걷는 중이면 지나가는) 자리
export function naruPos() { const n = naruAt(); if (!n) return null; const x = nX(n.i) + .5, y = nY(n.i) + .5; if (!n.from) return { x, y }; return { x: n.from.x + (x - n.from.x) * n.mt, y: n.from.y + (y - n.from.y) * n.mt }; }
// 그림용 (render/world.js): 칸 가운데에서 얼마나 떨어져 있는지·방향·걸음
export function naruPose(o) { if (!NW.o || o !== NW.o || NW.g !== G) return null; const p = naruPos(), f = NW.face, side = Math.abs(f.x) > Math.abs(f.y) * 1.05;
  return { dx: p.x - (nX(NW.i) + .5), dy: p.y - (nY(NW.i) + .5), dir: side ? 'side' : f.y < 0 ? 'up' : 'down', flip: side && f.x < 0, step: NW.from ? (Math.floor(NW.anim * 6) % 2) : -1 }; }
// ---- 한 칸씩 걷기 ----
const nPlayerIn = j => { const x0 = nX(j), y0 = nY(j); for (const pl of playerList()) { const p = pl.p; if (p.x + .3 > x0 && p.x - .3 < x0 + 1 && p.y + .25 > y0 && p.y - .35 < y0 + 1) return true; } return false; };
function nStep(j) { const n = NW; if (!freeTile(j) || nPlayerIn(j)) return false; const from = { x: nX(n.i) + .5, y: nY(n.i) + .5 };
  G.objs.delete(n.i); G.objs.set(j, n.o); n.face = { x: nX(j) - nX(n.i), y: nY(j) - nY(n.i) }; n.i = j; n.from = from; n.mt = 0; return true; }
function nMove(dt) { const n = NW; if (!n.from) return; n.mt += dt * n.spd; n.anim += dt; if (n.mt >= 1) { n.mt = 1; n.from = null; } }
function nPut(j) { const n = NW; if (j === n.i) return true; if (!freeTile(j)) return false; G.objs.delete(n.i); G.objs.set(j, n.o); n.i = j; n.from = null; n.path = []; return true; }
// ---- 나루가 사는 모습 ----
const nHome = n => n.o.home != null ? n.o.home : (n.o.home = n.i);
const nLifeR = n => Math.max(LIFE_R + 3, Math.hypot(nX(nHome(n)) + .5 - TREE.x, nY(nHome(n)) + .5 - TREE.y) + 2);
// 등불나무 둘레의 횃불·작업대 (곁에 설 빈 칸이 있는 것)
function lifeSpots() { const out = []; for (let y = Math.floor(TREE.y - LIFE_R - 2); y <= TREE.y + LIFE_R + 2; y++) for (let x = Math.floor(TREE.x - LIFE_R - 2); x <= TREE.x + LIFE_R + 2; x++) { if (!inB(x, y)) continue;
  const o = G.objs.get(idx(x, y)); if (!o || !(o.t === 'torch' || (OBJ[o.t] && OBJ[o.t].station === 'bench'))) continue;
  for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (inB(x + dx, y + dy) && freeTile(idx(x + dx, y + dy))) { out.push(idx(x + dx, y + dy)); break; } } return out; }
// 다음에 갈 곳과 길: 지금 자리에서 걸어서 닿는 칸 중에서 고르기 — 집 자리(30%) · 횃불·작업대 곁(35%) · 등불나무 둘레 LIFE_R칸이나 집 둘레 3칸의 아무 데
function lifeGoal(n) { const h = nHome(n), R = nLifeR(n), hx = nX(h) + .5, hy = nY(h) + .5, prev = new Map([[n.i, -1]]), q = [n.i];
  for (let k = 0; k < q.length && q.length < 1600; k++) { const i = q[k], x = nX(i), y = nY(i);
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { if (!inB(x + dx, y + dy)) continue; const j = idx(x + dx, y + dy); if (prev.has(j) || !freeTile(j) || Math.hypot(x + dx + .5 - TREE.x, y + dy + .5 - TREE.y) > R) continue; prev.set(j, i); q.push(j); } }
  const zone = j => Math.hypot(nX(j) + .5 - TREE.x, nY(j) + .5 - TREE.y) <= LIFE_R || Math.hypot(nX(j) + .5 - hx, nY(j) + .5 - hy) <= 3;
  const r = rand(), spots = lifeSpots().filter(j => prev.has(j) && j !== n.i), any = q.filter(j => j !== n.i && zone(j));
  let goal = -1; if (r < .3 && prev.has(h) && h !== n.i) goal = h; else if (r < .65 && spots.length) goal = spots[Math.floor(rand() * spots.length)]; else if (any.length) goal = any[Math.floor(rand() * any.length)];
  if (goal < 0) return null; const path = []; for (let c = goal; c !== n.i; c = prev.get(c)) path.push(c); return path.reverse(); }
function lifeTick(dt) { const n = NW; nMove(dt);
  const pos = naruPos(), near = alivePlayers().map(pl => pl.p).filter(p => Math.hypot(p.x - pos.x, p.y - .3 - pos.y) < LIFE_NEAR + .5).sort((a, b) => Math.hypot(a.x - pos.x, a.y - pos.y) - Math.hypot(b.x - pos.x, b.y - pos.y))[0];
  if (near) { n.hold = G.time + 1.5; if (!n.from) { const fx = near.x - pos.x, fy = near.y - .4 - pos.y; n.face = Math.abs(fx) > Math.abs(fy) * 1.05 ? { x: Math.sign(fx), y: 0 } : { x: 0, y: fy < 0 ? -1 : 1 }; } }
  if (n.from || G.time < n.hold || G.time < n.wait) return;
  if (n.path.length) { const j = n.path.shift(); if (!nStep(j)) { n.path = []; n.wait = G.time + 1.5; } else if (!n.path.length) { n.wait = G.time + 4 + rand() * 5; } return; }
  n.spd = LIFE_SPD; const path = lifeGoal(n); if (!path || !path.length) { n.wait = G.time + 3 + rand() * 3; n.face = { x: 0, y: 1 }; return; } n.path = path; }
// 말을 걸면 멈추고 바라봐요 (sim/npc.js talkTo) · 곁에 따라 한마디
export function naruHold(t = 6) { if (naruAt()) NW.hold = Math.max(NW.hold, G.time + t); }
export function lifeLine() { const n = naruAt(); if (!n) return NARU_LIFE.other; const x = nX(n.i), y = nY(n.i);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!inB(x + dx, y + dy)) continue; const o = G.objs.get(idx(x + dx, y + dy)); if (!o) continue; if (o.t === 'torch') return NARU_LIFE.torch; }
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!inB(x + dx, y + dy)) continue; const o = G.objs.get(idx(x + dx, y + dy)); if (o && OBJ[o.t] && OBJ[o.t].station === 'bench') return NARU_LIFE.bench; }
  if (Math.hypot(x + .5 - TREE.x, y + .5 - TREE.y) <= LIFE_R + .5) return NARU_LIFE.tree;
  return NARU_LIFE.other; }
// ---- 먼저 걸어 나가기 ----
const nLead = () => G.stats.nLead || null;
export const leadWalking = () => !!G && !!G.stats && !!nLead() && nLead().s === 'walk';
export const leadThere = () => !!G && !!G.stats && !!nLead() && nLead().s === 'there';
// 4번이 끝날 때 (sim/quests.js checkGuide): 첫 구리 광맥 옆 빈 칸 — 나루 자리에서 걸어서 닿는 가장 가까운 곳. 찾으면 true
// 광맥 자리 = 나루에게서 가장 가까운, 구리 광맥(벽 4)에 붙은 빈 칸 (걸어서 닿지 않아도 — 주인공은 캐서 가요). 찾으면 true
export function leadPrep(q = 'ore') { const n = naruAt(); if (!n || !naruSpot()) return false; if (q !== 'ore') { const j = deepDoor(); if (j < 0) return false; G.stats.nLead = { s: 'wait', i: j, t: G.time, q }; return true; } const x0 = nX(n.i), y0 = nY(n.i); let best = -1, bd = 1e9;
  for (let y = y0 - 70; y <= y0 + 70; y++) for (let x = x0 - 70; x <= x0 + 70; x++) { if (!inB(x, y)) continue; const d = (x - x0) * (x - x0) + (y - y0) * (y - y0); if (d >= bd || d > 4900) continue; const j = idx(x, y); if (!freeTile(j)) continue;
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) if (inB(x + dx, y + dy) && G.wall[idx(x + dx, y + dy)] === 4) { best = j; bd = d; break; } }
  if (best < 0) return false; G.stats.nLead = { s: 'wait', i: best, t: G.time, q: 'ore' }; return true; }
// v119 가장 깊은 곳 입구 곁: 입구 아래 길(입구 바로 밑 세로 줄)을 막지 않는, 입구에서 가장 가까운 빈 칸. 없으면 -1
export function deepDoor() { const d = G.stats.deep; if (!d) return -1; const ex = d.x + DEEP_PLAN[DEEP_H - 1].indexOf('E'), ey = d.y + DEEP_H - 1; let best = -1, bd = 1e9;
  for (let y = ey + 1; y <= ey + 10; y++) for (let x = ex - 8; x <= ex + 8; x++) { if (!inB(x, y) || x === ex) continue; const j = idx(x, y); if (!freeTile(j)) continue; const dd = (x - ex) * (x - ex) + (y - ey - 2) * (y - ey - 2); if (dd < bd) { bd = dd; best = j; } }
  return best; }
// 걷는 모습: 열린 칸을 따라 광맥 쪽으로 가장 가까워지는 곳까지의 길 (그중 처음 LEAD_STEPS칸만 걸어요). 다가갈 수 없으면 null
function leadPath(st0, to) { const tx0 = nX(to) + .5, ty0 = nY(to) + .5, dist = j => Math.hypot(nX(j) + .5 - tx0, nY(j) + .5 - ty0), prev = new Map([[st0, -1]]), q = [st0]; let best = st0, bd = dist(st0);
  for (let k = 0; k < q.length && q.length < 2500; k++) { const i = q[k], x = nX(i), y = nY(i);
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) { if (!inB(x + dx, y + dy)) continue; const j = idx(x + dx, y + dy); if (prev.has(j) || !freeTile(j) || nPlayerIn(j)) continue; prev.set(j, i); q.push(j); const d = dist(j); /* 사람이 선 칸은 돌아가요 */ if (d < bd - .01) { bd = d; best = j; } } }
  if (best === st0) return null; const path = []; for (let c = best; c !== st0; c = prev.get(c)) path.push(c); return path.reverse(); }
function leadGo() { const L = nLead(), n = naruAt(); if (!L || L.s !== 'wait') return; if (!n) { L.s = 'done'; return; }
  const pos = naruPos(), see = alivePlayers().filter(pl => Math.hypot(pl.p.x - pos.x, pl.p.y - pos.y) < LEAD_SEE);
  const path = see.length ? leadPath(n.i, L.i) : null;
  if (!path) { leadPlace(); return; }
  n.path = path.slice(0, LEAD_STEPS); n.spd = LEAD_SPD; n.hold = 0; n.wait = 0; L.s = 'walk'; L.end = G.time + n.path.length / LEAD_SPD + .4;
  for (const pl of see) pl.p.still = L.end + .2; // 보는 사람은 나루가 떠날 때까지 서 있어요
  emit('sfx', 'bell'); }
function leadPlace(skip) { const L = nLead(), n = naruAt(); if (skip) for (const pl of playerList()) if (pl.p.still) pl.p.still = 0; if (!L) return; // 다 걸으면 서 있기는 나루가 사라지고 조금 뒤까지 (건너뛰면 바로 풀려요) if (!n) { L.s = 'done'; return; }
  const p0 = naruPos(); n.from = null; n.path = [];
  let j = L.i; if (!freeTile(j) && j !== n.i) { j = -1; const x = nX(L.i), y = nY(L.i); for (let r = 1; r <= 2 && j < 0; r++) for (let dy = -r; dy <= r && j < 0; dy++) for (let dx = -r; dx <= r; dx++) if (inB(x + dx, y + dy) && freeTile(idx(x + dx, y + dy))) { j = idx(x + dx, y + dy); break; } }
  if (j < 0 || !nPut(j)) { L.s = 'done'; return; }
  emit('puff', p0.x, p0.y - .3, '#ffe9a8', 14, 2.2, .5); emit('puff', nX(j) + .5, nY(j) + .2, '#ffe9a8', 14, 2.2, .5); NW.face = { x: 0, y: 1 }; L.s = 'there'; }
function leadHome() { const L = nLead(), n = naruAt(); if (L) L.s = 'done'; if (!n) return; const p0 = naruPos(); let h = nHome(n);
  if (!freeTile(h) && h !== n.i) { G.objs.delete(n.i); const s = villageSpot('guide'); G.objs.set(n.i, n.o); h = s ? idx(s.x, s.y) : n.i; }
  if (nPut(h)) { emit('puff', p0.x, p0.y - .3, '#ffe9a8', 14, 2.2, .5); emit('puff', nX(h) + .5, nY(h) + .2, '#ffe9a8', 14, 2.2, .5); } n.wait = G.time + 3; NW.face = { x: 0, y: 1 }; }
// 광맥 옆의 나루에게 닿거나 말을 걸면: 한마디 → 5초 뒤 마을로
export function leadHere() { const L = nLead(); if (!L || L.s !== 'there') return false; L.s = 'back'; L.t = G.time + 5;
  if (L.q === 'dark') { L.t = G.time + 8; G.stats.n2ember = 1; for (const pl of alivePlayers()) emit('puff', pl.p.x, pl.p.y - .4, '#ffc861', 22, 2.6, .9); emit('sfx', 'win'); emit('talk', 'guide', 'sc:dark0'); } // v119 20 출발 전 · 마지막 불씨 (연출만)
  else emit('bell', (L.q === 'deep' ? NARU2_DEEP_HERE : NARU_LEAD_HERE).slice()); naruHold(L.q === 'dark' ? 8 : 5); return true; }
function leadTick(dt) { const L = nLead(), n = NW; if (!L || L.s === 'done') return false;
  if (L.s === 'wait') { if (G.time < L.t) L.t = G.time; if (G.time - L.t > LEAD_WAIT) leadGo(); return L.s !== 'wait' && L.s !== 'done'; }
  if (L.s === 'walk') { nMove(dt); if (!n.from) { if (n.path.length && G.time < L.end + 1) { const j = n.path.shift(); if (!nStep(j)) n.path = []; } else leadPlace(); } return true; }
  if (gPassed(L.q || 'ore')) { leadHome(); return false; } // 광석을 다 모으면(마지막 장을 읽으면·큰 어둠을 물리치면) 마을로
  if (L.s === 'there') { const pos = naruPos(); if (alivePlayers().some(pl => Math.hypot(pl.p.x - pos.x, pl.p.y - .3 - pos.y) < LEAD_ARRIVE)) leadHere(); return true; }
  if (L.s === 'back') { if (G.time >= L.t || G.time < L.t - 6) leadHome(); return L.s === 'back'; }
  return false; }
defineCmd('naruLead', () => { leadGo(); }); // 방울 대화(4번 끝)가 끝나면 화면 쪽이 보내요 (ui/talk.js)
defineCmd('leadSkip', () => { if (leadWalking()) leadPlace(true); }); // 걷는 모습 건너뛰기 (화면 누르기·스페이스)
// 퀘스트 화살표 (sim/quests.js questGo): 5번은 나루가 광맥 옆에 있으면 나루 자리 (밝히지 않은 곳이어도)
export function leadTarget(q = 'ore') { const L = nLead(); if (!L || (L.q || 'ore') !== q || (L.s !== 'there' && L.s !== 'wait' && L.s !== 'walk')) return null; if (L.s === 'there') return naruPos(); return { x: nX(L.i) + .5, y: nY(L.i) + .5 }; }
// ---- 나루의 부탁 ----
export const ASK_IDS = NARU_ASK.map(a => a.id);
export const isAsk = q => !!q && ASK_IDS.includes(q.id) && !!naruSpot(); // 나루가 없으면(마을 자리를 못 찾은 세계) 예전 도전 퀘스트처럼
export const askOpen = id => !!(G.stats.askOpen || {})[id];
export const askList = () => NARU_ASK.filter(a => askOpen(a.id)).map(a => QSIDE.find(q => q.id === a.id)).filter(Boolean); // 받은 부탁 (열린 차례)
export const askOwed = () => askList().filter(q => (G.stats.askEnd || {})[q.id] && !(G.qclaim || {})[q.id]).map(q => q.id); // 끝냈지만 아직 마을에서 안 받은 것
const askReady = a => gPassed(a.after) && !G.stats.naruCall;
function askTick() { const S = G.stats, open = S.askOpen = S.askOpen || {}, end = S.askEnd = S.askEnd || {};
  if (!S.askV) { S.askV = 1; for (const a of NARU_ASK) { if (askReady(a)) open[a.id] = 1; const q = QSIDE.find(x => x.id === a.id); if (open[a.id] && q && q.done()) end[a.id] = 1; } return; } // 옛 세이브: 이미 지난 것은 조용히
  for (const a of NARU_ASK) { const q = QSIDE.find(x => x.id === a.id); if (!q) continue;
    if (!open[a.id]) { if (askReady(a)) { open[a.id] = 1; emit('bell', NARU_ASK_OPEN[a.id].slice()); return; } continue; }
    if (!end[a.id] && q.done()) { end[a.id] = 1; const qx = S.qxp = S.qxp || {}; if (q.xp && !qx[q.id] && !(G.qclaim || {})[q.id]) { qx[q.id] = 1; gainXp(q.xp, G.p.x, G.p.y); }
      if (!(G.qclaim || {})[q.id]) { emit('bell', NARU_ASK_CALL.slice()); emit('sfx', 'craft'); } return; } } }
// ---- 1부 뒤 상황 한마디 ----
const NT = { g: null, last: -99, dead: false, lv: null, seed: null, pend: new Set() }; // pend: 사이 시간 동안 일어난 일(레벨·씨앗·기절)은 기다렸다가 말해요
const nSeedCount = () => G.inv.reduce((s, x) => s + (x && ITEMS[x.id] && ITEMS[x.id].kind === 'seed' ? x.c : 0), 0);
function tipNear(test, R) { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); for (let y = py - R; y <= py + R; y++) for (let x = px - R; x <= px + R; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && test(o) && Math.hypot(x + .5 - p.x, y + .5 - p.y) <= R) return true; } return false; }
const part1Done = () => gPassed('pick') && !G.stats.naruCall;
function tipTick() { if (NT.g !== G) Object.assign(NT, { g: G, last: -99, dead: false, lv: null, seed: null, pend: new Set() }); const p = G.p, said = G.stats.nTip = G.stats.nTip || {};
  if (p.dead > 0) { NT.dead = true; return; } if (NT.dead) { NT.dead = false; NT.pend.add('faint'); }
  const lv = G.rpg.lv, sc = nSeedCount(); if (NT.lv == null) { NT.lv = lv; NT.seed = sc; } if (lv > NT.lv) NT.pend.add('level'); if (sc > NT.seed) NT.pend.add('seed'); NT.lv = lv; NT.seed = sc;
  if (G.time < NT.last) NT.last = G.time - TIP_GAP; if (G.time - NT.last < TIP_GAP) return;
  const b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))];
  const cond = { hunger: () => p.hunger <= 50, hurt: () => p.hp < maxHp() / 2, faint: () => NT.pend.has('faint'), full: () => G.inv.slice(HOT).every(Boolean),
    cocoon: () => tipNear(o => o.t === 'cocoon', 9), region: () => b != null && b !== 0, warp: () => tipNear(o => o.t === 'warpPt' && !o.home, 6), level: () => NT.pend.has('level'), seed: () => NT.pend.has('seed') };
  for (const t of NARU_TIP) { if (said[t.k] || !cond[t.k]()) continue; said[t.k] = 1; NT.pend.delete(t.k); NT.last = G.time; emit('bell', [t.s], 1); return; } }
// ---- 매 프레임 ----
let askT = 0;
onFrame('naruLife', dt => { if (!started || !G.stats.naruMet) return; const n = naruAt(); if (!n) return;
  if (G.stats.nLead && G.stats.nLead.s === 'walk' && !NW.path.length && !NW.from && NW.mt === 0) leadPlace(); // 걷는 중에 저장한 세이브: 광맥 옆에
  if (!leadTick(dt)) lifeTick(dt);
  askT += dt; if (askT < .5) return; askT = 0; askTick(); if (part1Done() && naruSpot()) tipTick(); });

// ================= v119 나루 2부 「나루의 기다림」 (dev/design/세계관-NPC.md, 2026-10-21 사용자 선택) =================
// - 보스(여왕~서리 정령): 물리치면 경험치는 바로, 방울로 부르고 G.stats.nPend에 「돌아와서」를 쌓아요(안 들러도 다음 이야기는 진행). 마을에서 말 걸면 「돌아와서」 + 물건 보상
//   + 바로 다음 보스의 「출발 전」(G.stats.nGo). 지금 이야기가 보스인데 「출발 전」을 아직 안 봤으면 나루 머리 위 !.
// - 빛씨앗 셋을 심으면(기억 장면 3 다음) 13번 장면, 기억 장면을 닫으면 바로 열려요.
// - 「나루에게 가기」(다섯 번째 기억 뒤, 18번) → 나루가 가장 깊은 곳 입구까지 먼저 가 있음 → 마지막 장 → 「나루에게 돌아가기」(19번, 반말)
//   → 나루가 입구까지 한 번 더 → 닿으면 20번 「출발 전」·마지막 불씨(연출) → 큰 어둠 → 엔딩 창 전에 나루의 마지막 말.
// - 도라 할머니를 구하면 나루와 할머니가 다시 만나는 장면(마지막 장을 읽은 뒤면 「돌아왔구나」).
const naruOK = () => !!naruSpot();
export const NQ2 = {
  naruGo: { id: 'naruGo', t: () => '마을의 나루에게 가기', h: '나무가 다섯 번째 기억을 보여 줬어요. 할머니가 남긴 말 이야기를 하고 싶어요. 마을로 와서 머리 위에 느낌표가 뜬 저한테 말을 걸어 줘요.',
    done: () => !!G.stats.n2go || !!(G.stats.deep && G.stats.deep.read) || !!G.bossDead.dark || !naruOK(), target: () => naruSpot() },
  naruBack: { id: 'naruBack', t: () => '마을의 나루에게 돌아가기', h: '마지막 장… 읽었어요? 마을로 돌아와 줘요. 머리 위에 느낌표가 뜬 저한테 말을 걸어 줘요.',
    done: () => !!G.stats.n2back || !!G.bossDead.dark || !naruOK(), target: () => naruSpot() },
};
for (const id in NQ2) Object.assign(NQ2[id], NARU2_Q[id]);
{ const k = GUIDE.findIndex(q => q.id === 'deep'); if (k >= 0) { GUIDE.splice(k, 0, NQ2.naruGo); GUIDE.splice(k + 2, 0, NQ2.naruBack); } }
Q_GO.naruGo = ['near']; Q_GO.naruBack = ['near'];
// 지금 이야기 퀘스트
const curQ = () => GUIDE[G.guide] || null;
// 그 보스방이 있는 쪽 ({dir:보스})
export const bossDir = k => { const B = BOSSES[k]; if (!B || !B.home) return ''; const h = B.home(); return dirKo(h.x, h.y); };
// 「출발 전」을 볼 수 있는 보스: 지금 이야기가 그 보스이고 아직 안 봤고 살아 있으면
export function departDue() { const q = curQ(); if (!q || !NARU_BOSS.includes(q.id) || G.bossDead[q.id] || G.stats.naruCall) return null; return (G.stats.nGo || {})[q.id] ? null : q.id; }
// 나루 머리 위 ! (render/world.js naruWaits): 「출발 전」·「나루에게 가기」·「나루에게 돌아가기」
export const naruBang = () => !!G.stats.naruMet && naruOK() && !leadThere() && (!!departDue() || ['naruGo', 'naruBack'].includes((curQ() || {}).id));
// 보스 이야기를 끝냈을 때 (sim/quests.js checkGuide, 놀이 중에만)
export function bossPassed(id) { const P = G.stats.nPend = G.stats.nPend || []; if (!P.includes('back:' + id)) P.push('back:' + id); }
// 이야기 퀘스트를 끝냈을 때 다른 장면 쌓기: 빛씨앗 셋을 심음(tree) → 13번
export function scenePassed(id) { if (id !== 'tree') return; const P = G.stats.nPend = G.stats.nPend || []; if (!P.includes('tree')) P.push('tree'); }
// 말 걸면 보여 줄 2부 장면 (sim/npc.js talkTo): [장면 이름, 그때 줄 보상 퀘스트 id들] 또는 null — 고른 장면은 본 것으로 표시해요
export function naru2Scene() { const S = G.stats, P = S.nPend = S.nPend || [], go = S.nGo = S.nGo || {}, q = curQ();
  if (P.length) { const k = P.shift(); if (k.startsWith('back:')) return ['sc:' + k, [k.slice(5)]]; return ['sc:' + k, []]; } // v121: 「돌아와서」만 — 다음 보스 「출발 전」은 장면 끝 [다음 이야기 듣기]로 (nextStory)
  if (q && q.id === 'naruGo' && !S.n2go) { S.n2go = 1; const lead = leadPrep('deep'); return ['sc:' + (lead ? 'n2go' : 'n2go0'), ['naruGo']]; }
  if (q && q.id === 'naruBack' && !S.n2back) { S.n2back = 1; const lead = leadPrep('dark'); return ['sc:' + (lead ? 'n2back' : 'n2back,dark0'), ['naruBack']]; }
  const d = departDue(); if (d) { go[d] = 1; return ['sc:go:' + d, []]; }
  return null; }
// v121 (2026-10-21 사용자 확정): 중요한 전환점(보스 「돌아와서」 뒤 · 1부 끝 구리 곡괭이 장면 뒤)에서만 [다음 이야기 듣기] / [대화 마치기].
//   들을 이야기 = 다음 보스의 「출발 전」(departDue). 아직 「돌아와서」가 더 쌓여 있으면(보스를 여럿 잡고 왔으면) 마지막 「돌아와서」 뒤에만 — 말 걸 때마다 하나씩.
//   [대화 마치기]를 고르면 본 것으로 치지 않아요 → 나루 머리 위 !, 다음에 말 걸면 바로 그 이야기 (새 저장 칸 없이 G.stats.nGo 그대로). 다음 보스 퀘스트는 안 들어도 진행돼요.
export function nextStory(mode) { const m = String(mode || ''); if (!(m.startsWith('sc:back:') || m === 'call:pick')) return null; if ((G.stats.nPend || []).some(k => String(k).startsWith('back:'))) return null; return departDue(); }
defineCmd('hearGo', c => { const id = departDue(); if (!id || id !== c.id) return false; (G.stats.nGo = G.stats.nGo || {})[id] = 1; return true; }); // [다음 이야기 듣기] (ui/panel-actions.js)
// 장면 줄 (sim/npc.js talkLines): 'sc:back:queen,go:slime' → 줄들
const dirFill = l => { const f = s => String(s).replace(/\{dir:(\w+)\}/g, (_, k) => bossDir(k)); return l && typeof l === 'object' ? (l.ask ? l : { ...l, s: f(l.s) }) : f(l); };
export function sceneLines(kind) { const out = [];
  for (const part of kind.slice(3).split(',')) { const [a, b] = part.split(':'); const L = a === 'go' ? NARU2_GO[b] : a === 'back' ? NARU2_BACK[b] : NARU2_SC[a]; if (L) out.push(...L); }
  return (out.length ? out : ['…']).map(dirFill); }
// 창을 닫았을 때 (ui/panels.js closePanel → 명령): 나루 장면이 끝나면 나루가 먼저 걸어 나가요 · 큰 어둠 뒤 장면이 끝나면 엔딩 창 · 기억 장면을 닫으면 쌓인 장면을 바로
defineCmd('talkEnd', c => { const m = String(c.m || ''); if (m === 'intro') { const at = (G.stats.introAt | 0) + Math.max(0, c.at | 0); if (at < NARU_INTRO.length - 1) G.stats.introAt = at; else delete G.stats.introAt; } /* v120: 첫 장면을 다 못 봤으면 다음에 말 걸 때 그 줄부터 */ if (/\bn2go\b|\bn2back\b/.test(m)) leadGo(); if (m === 'sc:end') emit('ending', 1); });
defineCmd('memEnd', () => { if (!G.stats.naruMet || !naruOK() || leadThere() || leadWalking() || G.stats.naruCall) return; const q = curQ(), P = G.stats.nPend || [];
  if (P.includes('tree') || (q && q.id === 'naruGo' && !G.stats.n2go)) { talkTo('guide'); } });
// 큰 어둠을 물리치면 (sim/deep.js darkDown): 나루가 있으면 마지막 말 → 엔딩 창
export const naruEnding = () => { if (!naruOK()) return false; emit('talk', 'guide', 'sc:end'); return true; };
// 할머니를 구하면 (sim/npc.js rescue)
export const grandmaScene = () => naruOK() ? 'sc:' + (G.stats.deep && G.stats.deep.read ? 'grandma2' : 'grandma') : null;
