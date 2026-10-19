// ================= v89 워프포인트·포탈: 놓기·켜기·이동, 몬스터 안 생기는 곳 =================
// 기획 dev/design/워프포탈.md (2026-10-18 확정). 수치는 data/warp.js, 그림은 render/world.js(drawWarp)·art/world.js(그림 자르기), 지도 창은 ui/map.js.
// - 워프포인트(warpPt): 지역마다 2개 + 등불나무 곁 1개(처음부터 켜짐). 새 세계는 만들 때, 옛 세계는 불러올 때 한 번(G.stats.warpV) 빈 자리를 찾아 놓아요 — 지형은 안 바꿔요.
//   만지면 켜져요(o.on, 세계 공용). 회수·파괴 불가, 둘레 8칸은 파기·벽 쌓기 불가.
// - 포탈(portal): 석영 작업대에서 만들어 놓으면 목적지가 하나 늘어요(늘 켜짐, 세계 공용). 한 사람당 5개(o.own), 보스방 12칸 안 금지, 다른 가구처럼 회수.
// - 켜진 워프포인트·포탈 앞에서 누르면 지도 창에서 다른 켜진 곳을 골라요 → 1초 뒤 이동, 그 사이에 맞으면 취소. 무료.
// - 둘레 6칸에는 몬스터가 생기지 않아요 (sim/enemies.js trySpawn).
import { PORTAL_MAX, WARP_BOSS_NEAR, WARP_DELAY, WARP_GAP, WARP_PER_REGION, WARP_REACH, WARP_SAFE } from '../data/warp.js';
import { BIOME, OBJ } from '../data/items.js';
import { fxRand, rng } from '../engine/random.js';
import { cam, curPl, G, myPlayer } from '../save/state.js';
import { defineCmd } from './commands.js';
import { emit } from './events.js';
import { markLight } from './loop.js';
import { WATER } from './nature.js';
import { standUp } from './player.js';
import { meId } from './survival.js';
import { onFrame } from './systems.js';
import { BX, BY, CX, CY, H, idx, inB, LAVA, PIT, SA, SB, SI, SL, W } from '../world/map.js';
import { boxHits, isSolid, noDigZone } from '../world/tiles.js';

export const isWarp = o => !!o && (o.t === 'warpPt' || o.t === 'portal');
export const warpOn = o => isWarp(o) && (o.t === 'portal' || !!o.on);
// 세계의 워프포인트·포탈 목록 (2초마다, 또는 포탈을 놓을 때 다시 찾아요 — 쓰는 곳에서 G.objs.get(e.i) === e.o로 아직 있는지 봐요)
let WL = { g: null, at: -9, v: -1, list: [] }, warpVer = 0;
export const warpsChanged = () => { warpVer++; };
export function warpList() {
  if (WL.g === G && WL.v === warpVer && G.time - WL.at < 2 && G.time >= WL.at) return WL.list;
  const list = []; for (const [i, o] of G.objs) if (isWarp(o)) list.push({ i, o, x: i % W, y: (i / W) | 0 });
  WL = { g: G, at: G.time, v: warpVer, list }; return list; }
export const liveWarps = () => warpList().filter(e => G.objs.get(e.i) === e.o);
// 워프포인트 둘레 8칸 (파기·벽 쌓기 불가)
export function nearWarpPt(x, y) { for (const e of warpList()) { if (e.o.t !== 'warpPt' || G.objs.get(e.i) !== e.o) continue; if (Math.abs(e.x - x) <= 1 && Math.abs(e.y - y) <= 1 && !(e.x === x && e.y === y)) return true; } return false; }
// 둘레 WARP_SAFE칸 안 (몬스터 안 생김)
export function warpSafe(x, y) { for (const e of warpList()) { if (G.objs.get(e.i) !== e.o) continue; if (Math.hypot(e.x + .5 - x, e.y + .5 - y) < WARP_SAFE) return true; } return false; }
// 이름: 「등불나무 워프」·「수정 동굴 워프 2」·「수정 동굴 포탈 2」(포탈은 그 지역에 놓인 차례)
export function warpName(e) { const o = e.o; if (o.t === 'warpPt') return o.home ? '등불나무 워프' : `${BIOME[o.b] || '동굴'} 워프 ${(o.n | 0) + 1}`;
  const b = G.biome[e.i], same = liveWarps().filter(q => q.o.t === 'portal' && G.biome[q.i] === b).sort((a, c) => (a.o.at || 0) - (c.o.at || 0) || a.i - c.i);
  return `${BIOME[b] || '동굴'} 포탈 ${Math.max(1, same.findIndex(q => q.i === e.i) + 1)}`; }
export const warpAt = i => { const o = G.objs.get(i); return isWarp(o) ? { i, o, x: i % W, y: (i / W) | 0 } : null; };
// 지금 갈 수 있는 곳 (켜진 것, 출발지는 빼고), 가까운 순
export function warpDests(from) { const f = warpAt(from); return liveWarps().filter(e => e.i !== from && warpOn(e.o)).map(e => ({ ...e, name: warpName(e), d: f ? Math.hypot(e.x - f.x, e.y - f.y) : 0 })).sort((a, b) => a.d - b.d); }
export const myPortals = () => liveWarps().filter(e => e.o.t === 'portal' && (e.o.own || null) === meId()).length;
// 포탈을 놓을 수 없는 까닭 (null = 놓을 수 있음)
export function portalWhy(x, y) { if (noDigZone(x, y) === 'boss') return '보스방 가까이에는 포탈을 놓을 수 없어요';
  if (myPortals() >= PORTAL_MAX) return `포탈은 한 사람당 ${PORTAL_MAX}개까지 놓을 수 있어요 · 놓아 둔 포탈을 회수하면 다시 놓을 수 있어요`; return null; }

// ---- 워프포인트 놓기 (새 세계: 만들 때 · 옛 세계: 불러올 때 한 번) ----
export const freeTile = i => !G.wall[i] && G.floor[i] !== WATER && G.floor[i] !== LAVA && G.floor[i] !== PIT && !G.objs.get(i);
export function roomNear(x, y) { for (const r of G.rooms || []) if (x >= r.x - 3 && x <= r.x + 6 && y >= r.y - 3 && y <= r.y + 5) return true; return false; }
// 걸어서(캐지 않고) 등불나무에서 닿는 칸
export function walkable() { const N = W * H, seen = new Uint8Array(N), q = [idx(CX, CY + 2)]; seen[q[0]] = 1;
  for (let k = 0; k < q.length; k++) { const i = q[k], x = i % W; for (const [d, dx] of [[1, 1], [-1, -1], [W, 0], [-W, 0]]) { const j = i + d; if (x + dx < 0 || x + dx >= W || j < 0 || j >= N || seen[j] || G.wall[j] || G.floor[j] === WATER || G.floor[j] === LAVA || G.floor[j] === PIT) continue; seen[j] = 1; q.push(j); } }
  return seen; }
// 등불나무 곁: 나무 오른쪽(6칸)에서 가까운 빈 칸 (아래 칸도 비어 있어야 앞에 설 수 있어요), 시작 바닥(나무 아래 앞마당)은 피해요
function homeSpot() { let best = null, bd = 1e9;
  for (let y = CY - 9; y <= CY + 9; y++) for (let x = CX - 9; x <= CX + 9; x++) { const d = Math.hypot(x - CX, y - CY); if (d < 4.5 || d > 8.5 || !inB(x, y + 1)) continue;
    if (y >= CY + 1 && y <= CY + 5 && x >= CX - 5 && x <= CX + 5) continue; if (!freeTile(idx(x, y)) || isSolid(x, y + 1)) continue;
    const s = Math.hypot(x - (CX + 6), y - (CY + 1)); if (s < bd) { bd = s; best = { x, y }; } }
  return best; }
export function placeWarps() {
  if (!G || !G.stats || G.stats.warpV) return 0; G.stats.warpV = 1; let n = 0;
  const h = homeSpot(); if (h) { G.objs.set(idx(h.x, h.y), { t: 'warpPt', on: 1, home: 1, b: G.biome[idx(h.x, h.y)] || 0, n: 0 }); n++; }
  const R = rng(((G.seed | 0) ^ 0x3a9f1) >>> 0), reach = walkable(), boss = [{ x: BX, y: BY }, SA, SB, SL, SI], cand = [[], [], [], [], []], loose = [[], [], [], [], []];
  for (let y = 3; y < H - 3; y += 2) for (let x = 3; x < W - 3; x += 2) { const i = idx(x, y), b = G.biome[i]; if (b > 4 || !freeTile(i)) continue;
    if (Math.hypot(x - CX, y - CY) < 16 || noDigZone(x, y) || roomNear(x, y)) continue;
    let ok = true; for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) { const j = idx(x + dx, y + dy); if (!freeTile(j) || G.biome[j] !== b) { ok = false; break; } }
    const c = { x, y, r: reach[i] ? 1 : 0, db: Math.hypot(x - boss[b].x, y - boss[b].y) }; if (ok) cand[b].push(c); else if (!isSolid(x, y + 1) && G.biome[idx(x, y + 1)] === b) loose[b].push(c); } // loose: 앞(아래) 칸만 비어도 되는 자리 (좁은 지역에서 모자랄 때)
  const pick = L => { if (!L.length) return null; const live = L.filter(c => c.r); const P = live.length ? live : L; return P[Math.floor(R() * P.length)]; };
  for (let b = 0; b < 5; b++) { const CL = cand[b], got = [];
    const a = pick(CL.filter(c => c.db >= WARP_BOSS_NEAR[0] && c.db <= WARP_BOSS_NEAR[1])) || pick(CL); if (a) got.push(a); // 보스방 가는 길 근처
    if (!got.length && loose[b].length) got.push(pick(loose[b]));
    for (let k = 1; k < WARP_PER_REGION; k++) { let c = null; for (const [P, gap] of [[CL, WARP_GAP], [CL, WARP_GAP / 2], [CL, 8], [loose[b], 8]]) { c = pick(P.filter(q => got.every(g => Math.hypot(q.x - g.x, q.y - g.y) >= gap))); if (c) break; } if (c) got.push(c); }
    got.forEach((c, k) => { G.objs.set(idx(c.x, c.y), { t: 'warpPt', on: 0, b, n: k }); n++; }); }
  warpsChanged(); return n; }

// ---- 켜기 · 이동 ----
export function warpDecide(t, o) {
  if (o.t === 'warpPt' && !o.on) return { k: 'warpOn', lbl: '켜기', icon: 'hand', t, o };
  if (G.warpGo) return { k: 'none', lbl: '이동하는 중…', icon: 'hand' };
  return { k: 'warp', lbl: '워프', icon: 'hand', t, o }; }
export function warpTurnOn(t, o) { if (o.t !== 'warpPt' || o.on) return; o.on = 1; G.stats.warpOn = (G.stats.warpOn || 0) + 1;
  emit('sfx', 'seed'); emit('puff', t.x + .5, t.y + .4, '#c9a6ff', 16, 2.6, .5);
  emit('toast', `워프포인트를 켰어요! (${warpName({ i: idx(t.x, t.y), o })}) · 켜진 워프포인트·포탈 앞에서 서로 오갈 수 있어요`, 'good', 'warp'); }
// 도착할 자리: 앞(아래) → 옆 → 뒤, 그다음 둘레 2~4칸
function arriveSpot(i) { const x0 = i % W, y0 = (i / W) | 0;
  const near = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]];
  const okAt = (x, y) => inB(x, y) && !isSolid(x, y) && !boxHits(x + .5, y + .6, .28);
  for (const [dx, dy] of near) if (okAt(x0 + dx, y0 + dy)) return { x: x0 + dx + .5, y: y0 + dy + .6 };
  for (let r = 2; r <= 4; r++) { let best = null, bd = 1e9; for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) { if (Math.max(Math.abs(x - x0), Math.abs(y - y0)) !== r || !okAt(x, y)) continue; const d = Math.hypot(x - x0, y - y0 - .5); if (d < bd) { bd = d; best = { x: x + .5, y: y + .6 }; } } if (best) return best; }
  return null; }
defineCmd('warp', c => startWarp(c.from, c.to));
export function startWarp(from, to) { const p = G.p; if (p.dead > 0 || G.warpGo) return false;
  const a = warpAt(from), b = warpAt(to); if (!a || !b || from === to || !warpOn(a.o) || !warpOn(b.o)) { emit('toast', '갈 수 없는 곳이에요', null, 'warp'); return false; }
  if (Math.hypot(p.x - a.x - .5, p.y - a.y - .5) > WARP_REACH + .6) { emit('toast', '워프포인트·포탈 앞에서 출발해요', null, 'warp'); return false; }
  G.warpGo = { to, o: b.o, at: G.time, t: WARP_DELAY, name: warpName(b) }; emit('sfx', 'seed'); emit('toast', `${G.warpGo.name} · ${WARP_DELAY}초 뒤에 이동해요 (맞으면 멈춰요)`, null, 'warp'); return true; }
onFrame('warp', dt => warpTick(dt));
export function warpTick(dt) { const R = G.warpGo; if (!R) return; const p = G.p;
  if (p.dead > 0 || (p.hitAt != null && p.hitAt >= R.at)) { G.warpGo = null; emit('toast', '맞아서 이동을 멈췄어요', 'warn', 'warp'); return; }
  if (G.objs.get(R.to) !== R.o) { G.warpGo = null; emit('toast', '가려던 곳이 사라졌어요', 'warn', 'warp'); return; }
  R.t -= dt; if (fxRand() < .6) emit('puff', p.x + (fxRand() - .5) * .8, p.y - .2, '#c9a6ff', 1, 1.6, .05);
  if (R.t > 0) return; G.warpGo = null;
  const to = arriveSpot(R.to); if (!to) { emit('toast', '도착할 자리가 막혀 있어요', 'warn', 'warp'); return; }
  if (p.sit) standUp(); G.fish = null; G.recall = null;
  emit('puff', p.x, p.y - .3, '#b99bff', 18, 3, .4); p.x = to.x; p.y = to.y; p.kx = p.ky = 0; if (p.dash) p.dash = null;
  if (curPl === myPlayer()) { cam.x = p.x; cam.y = p.y; }
  markLight(); emit('puff', p.x, p.y - .3, '#e3d4ff', 18, 3, .4); emit('sfx', 'win'); G.stats.warps = (G.stats.warps || 0) + 1;
  emit('toast', `도착했어요 · ${R.name}`, 'good', 'warp'); }
