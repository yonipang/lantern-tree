// ================= v108 가장 깊은 곳 · 마지막 보스 큰 어둠 · 엔딩 (dev/design/세계관-NPC.md 4막) =================
// 가장 깊은 곳 = 손으로 설계한 큰 유적(21×15)을 용암·얼음 동굴 깊은 곳(등불나무에서 먼 곳)에 파서 넣어요(기록관과 같은 방식, stats.deep). 들어가는 조건: 빛씨앗 5개를 모두 심은 뒤(나무가 당신에게 반응한 뒤).
// 앞방: 찢긴 마지막 일기 장(읽으면 반전) → 보스방: 꺼진 횃대 6개. 큰 어둠은 밝힌 곳(횃대 빛 안)에 있을 때만 맞아요. 보스는 횃대를 하나씩 꺼뜨려요.
import { OBJ, USE, USE_LBL, ITEMS } from '../data/items.js';
import { BOSSES, BKEYS } from '../data/rpg-nature.js';
import { Q_GO, QSIDE, GUIDE } from '../data/quests.js';
import { rand, rng } from '../engine/random.js';
import { G, freshBoss, nearestPlayer, playerList, alivePlayers, withPlayer } from '../save/state.js';
import { emit } from './events.js';
import { isLit, mkEnemy, regionEnemy } from './enemies.js';
import { hurtPlayer, gainXp } from './player.js';
import { onFrame } from './systems.js';
import { roomInRect, roomNear, walkable } from './warp.js';
import { BX, BY, CX, CY, H, idx, inB, LAVA, PIT, SA, SB, SI, SL, W } from '../world/map.js';
import { isSolid, moveEnt, noDigZone } from '../world/tiles.js';
import { WATER } from './nature.js';
import { markLight } from './loop.js';
import { BOSS_AI } from './bosses.js';
import { DEEP_DIARY, ENDING } from '../data/story.js';
import { naruEnding } from './naru.js';
OBJ.brazier = { n: '횃대', solid: 1, brazier: 1, item: 'brazier', light: [5.5, '#ffc861'] };
ITEMS.brazier = { n: '횃대', d: '등불지기들이 세운 큰 횃대. 불을 붙이면 둘레가 환해져요.' };
USE.brazier = 'brazier'; USE_LBL.brazier = '불 붙이기';
OBJ.diaryLast = { n: '찢긴 마지막 장', solid: 1, diary: 1, last: 1, light: [2.5, '#ffe9a8'] };
// 21 × 15. # 암반 · . 돌바닥 · E 입구 · J 마지막 일기 · G 보스 문(일기를 읽으면 열림) · X 보스 자리 · T 횃대
export const DEEP_PLAN = [
  '#####################',
  '#...................#',
  '#..T.....T.....T....#',
  '#...................#',
  '#.........X.........#',
  '#...................#',
  '#..T.....T.....T....#',
  '#...................#',
  '#########G###########',
  '#.......#...#.......#',
  '#.......#.J.#.......#',
  '#.......#...#.......#',
  '#.......###.#########',
  '#...................#',
  '##########E##########',
];
export const DEEP_W = DEEP_PLAN[0].length, DEEP_H = DEEP_PLAN.length, DEEP_MIN = 110;
export const deepAt = (x, y) => { const d = G && G.stats && G.stats.deep; return d && x >= d.x && x < d.x + DEEP_W && y >= d.y && y < d.y + DEEP_H ? d : null; };
export const deepHidden = (x, y) => { const d = deepAt(x, y); return !!(d && !d.done && y !== d.y + DEEP_H - 1); };
const freeForDeep = i => !G.objs.get(i) && !G.wire.has(i) && !G.under.has(i) && G.floor[i] !== PIT; // 물·용암 위에도 파요(바닥은 돌바닥이 돼요)
export function placeDeep() {
  if (!G || !G.stats || G.stats.deepV) return 0; G.stats.deepV = 1;
  const R = rng(((G.seed | 0) ^ 0xdee9) >>> 0), reach = walkable(), boss = [{ x: BX, y: BY }, SA, SB, SL, SI], cand = [];
  for (let y = 4; y < H - DEEP_H - 4; y += 3) for (let x = 4; x < W - DEEP_W - 4; x += 3) {
    const cx = x + (DEEP_W >> 1), cy = y + DEEP_H, b = G.biome[idx(cx, cy)]; if (b !== 3 && b !== 4) continue; const d = Math.hypot(cx - CX, cy - CY); if (d < (W >= 600 ? DEEP_MIN : 60)) continue;
    { let bad = false; for (const [sx, sy] of [[x, y], [x + DEEP_W, y], [x, y + DEEP_H], [x + DEEP_W, y + DEEP_H], [x + 10, y + 7], [x + 5, y + 4], [x + 15, y + 11]]) { const i = idx(sx, sy); const bi = G.biome[i]; if ((bi !== 3 && bi !== 4) || G.explored[i] || G.objs.get(i) || !G.wall[i]) { bad = true; break; } } if (bad) continue; } // 빠른 거르기(7점, 모두 벽 안)
    if (Math.hypot(cx - boss[b].x, cy - boss[b].y) < 24 || noDigZone(cx, cy) || roomNear(cx, cy)) continue;
    let ok = true, walls = 0; for (let yy = y - 1; yy <= y + DEEP_H && ok; yy++) for (let xx = x - 1; xx <= x + DEEP_W; xx++) { if (!inB(xx, yy)) { ok = false; break; } const i = idx(xx, yy); if (G.explored[i] || (G.biome[i] !== 3 && G.biome[i] !== 4)) { ok = false; break; } if (G.wall[i]) walls++; }
    if (!ok || walls < (DEEP_W + 2) * (DEEP_H + 2) * (W >= 600 ? .6 : .35)) continue;
    const ex = x + DEEP_PLAN[DEEP_H - 1].indexOf('E'), ey = y + DEEP_H - 1; let open = false; for (let k = 1; k <= 8; k++) { if (!inB(ex, ey + k)) break; if (!G.wall[idx(ex, ey + k)]) { open = true; break; } } if (!inB(ex, ey + 3)) continue; // 입구 아래 8칸 안에 트인 곳이 있으면 좋아요 (길은 암반도 뚫어 내요)
    cand.push({ x, y, d, r: reach[idx(ex, Math.min(H - 1, ey + 4))] ? 1 : 0, open: open ? 1 : 0 }); }
  const near = [], clear = (c, any) => { if (!any && roomInRect(c.x, c.y, c.x + DEEP_W - 1, c.y + DEEP_H + 7)) { near.push(c); return false; } /* v112: 숨은 방과 겹치면 다른 자리를 먼저 (입구 아래 길 8칸까지) */ for (let yy = c.y - 1; yy <= c.y + DEEP_H; yy++) for (let xx = c.x - 1; xx <= c.x + DEEP_W; xx++) if (!freeForDeep(idx(xx, yy))) return false; return true; }; // 물건·빛뿌리·바닥 확인은 고른 곳만 (빠르게)
  while (cand.length) { const best = cand.filter(c => c.open && c.r), P = best.length ? best : cand.filter(c => c.open).length ? cand.filter(c => c.open) : cand, c = P[Math.floor(R() * P.length)];
    if (clear(c)) { carveDeep(c.x, c.y); return 1; } cand.splice(cand.indexOf(c), 1); }
  { const ok = near.find(c => clear(c, true)); if (ok) { carveDeep(ok.x, ok.y); return 1; } } // v112: 다른 자리가 하나도 없으면 예전처럼
  return 0; }
function carveDeep(x0, y0) { const bz = []; let gate = null, diary = null, ent = null, bx = 0, by = 0;
  for (let r = 0; r < DEEP_H; r++) for (let c = 0; c < DEEP_W; c++) { const ch = DEEP_PLAN[r][c], x = x0 + c, y = y0 + r, i = idx(x, y); G.objs.delete(i); G.wire.delete(i); if (G.wdmg) G.wdmg.delete(i);
    if (ch === '#') { G.wall[i] = 8; continue; } G.wall[i] = 0; G.floor[i] = 6;
    if (ch === 'T') bz.push(i); else if (ch === 'G') gate = i; else if (ch === 'J') diary = i; else if (ch === 'E') ent = i; else if (ch === 'X') { bx = x; by = y; } }
  const ex = ent % W, ey = (ent / W) | 0; for (let k = 1; k <= 8; k++) { if (!inB(ex, ey + k)) break; const j = idx(ex, ey + k); if (!G.wall[j] && k > 3) break; if (G.wall[j]) { G.wall[j] = 0; if (G.wdmg) G.wdmg.delete(j); } if (G.floor[j] === LAVA || G.floor[j] === WATER) G.floor[j] = 6; } // 입구 아래로 길: 최소 3칸, 트인 곳까지 최대 8칸(암반도 뚫어요)
  G.wall[gate] = 8; for (const i of bz) G.objs.set(i, { t: 'brazier', off: 1 }); G.objs.set(diary, { t: 'diaryLast' });
  G.stats.deep = { x: x0, y: y0, gate, bx, by, done: 0, read: 0, gT: -999 }; G.bosses.dark = freshBoss('dark'); }
// 보스 자리 (BOSSES.dark.home)
export const darkHome = () => { const d = G && G.stats && G.stats.deep; return d ? { x: d.bx + .5, y: d.by + .5 } : { x: CX + .5, y: CY - 60 }; };
// 들어갈 수 있나: 빛씨앗 5개를 모두 심어야 (입구 칸을 막아요)
export function deepGateTick() { const d = G.stats && G.stats.deep; if (!d) return; const ok = (G.treeSeeds | 0) >= 5;
  for (const pl of playerList()) { const p = pl.p; if (!ok && deepAt(Math.floor(p.x), Math.floor(p.y)) && Math.floor(p.y) < d.y + DEEP_H - 1) { p.y = d.y + DEEP_H + .6; withPlayer(pl, () => { emit('toast', '어둠이 길을 막아요… 등불나무의 등불 다섯을 모두 밝혀야 들어갈 수 있어요', 'warn', 'deepgate'); emit('puff', p.x, p.y - .5, '#3a2a5a', 12, 2.5, .4); }); } } }
onFrame('deep', dt => { deepGateTick(); const d = G.stats && G.stats.deep; if (!d || d.done) return; const pl = playerList().find(q => deepAt(Math.floor(q.p.x), Math.floor(q.p.y)) === d); if (!pl) return;
  if (G.time - d.gT < 40) return; const inside = G.enemies.filter(e => e.k === 'shadowBit' && deepAt(Math.floor(e.x), Math.floor(e.y))).length; if (inside >= 3 || (G.bosses.dark && G.bosses.dark.st === 'fight')) return; d.gT = G.time;
  for (let k = inside; k < 5; k++) for (let tr = 0; tr < 12; tr++) { const x = d.x + 1 + Math.floor(rand() * (DEEP_W - 2)), y = d.y + 9 + Math.floor(rand() * 5); const i = idx(x, y); if (G.wall[i] || G.objs.get(i) || Math.hypot(x + .5 - pl.p.x, y + .5 - pl.p.y) < 3) continue;
    const e = regionEnemy(mkEnemy('shadowBit', x + .5, y + .6), 4); e.home = { x: d.x + DEEP_W / 2, y: d.y + 11, r: DEEP_W }; G.enemies.push(e); break; } });
// 마지막 일기를 읽으면 보스 문이 열려요 (반전)
export function readLast() { const d = G.stats.deep; if (!d) return; if (!d.read) { d.read = 1; G.wall[d.gate] = 0; if (G.wdmg) G.wdmg.delete(d.gate); markLight(); emit('shake', .4); emit('sfx', 'boss'); emit('toast', '벽이 무너지며 안쪽으로 길이 열렸어요… 무언가 깨어나요', 'warn', 'deepgate'); } emit('diaryLast'); }
export function lightBrazier(o, x, y) { if (!o.off) return; o.off = 0; markLight(); emit('sfx', 'craft'); emit('puff', x, y, '#ffc861', 14, 3, .6); }
// ---- 큰 어둠 ----
Object.assign(BOSSES, { dark: { n: '큰 어둠', hp: 3600, home: darkHome, wake: 7, hr: 1.3, col: '#3a2a5a', spr: 'dark', scale: 1.4 } });
BKEYS.push('dark');
export const DARK_DMG = 30;
BOSS_AI.dark = function (b, dt) { const p = G.p, d = b.d, st = b.stage || 1; b.t -= dt; b.anim = (b.anim || 0) + dt; const deep = G.stats.deep;
  const lit = (G.objs && deep) ? [...G.objs].filter(([i, o]) => o.t === 'brazier' && !o.off && deepAt(i % W, (i / W) | 0)) : [];
  if (b.ph === 'blow') { if (b.t <= 0) { const o = b.target && G.objs.get(b.target); if (o && o.t === 'brazier' && !o.off && Math.hypot(b.target % W + .5 - b.x, ((b.target / W) | 0) + .5 - b.y) < 2.2) { o.off = 1; markLight(); emit('puff', b.target % W + .5, ((b.target / W) | 0) + .2, '#3a2a5a', 18, 3, .5); emit('sfx', 'clink'); emit('toast', '큰 어둠이 횃대를 꺼뜨렸어요!', 'warn', 'blow'); } b.ph = 'walk'; b.t = 1; } return; }
  if (b.ph === 'walk') { if (d > 1.8) moveEnt(b, (p.x - b.x) / d * 1.25 * dt, (p.y - b.y) / d * 1.25 * dt, 1.1);
    if (b.t <= 0) { b.casts++; const every = st >= 2 ? 2 : 3;
      if (lit.length && b.casts % every === 0) { let best = null, bd = 1e9; for (const [i] of lit) { const dd = Math.hypot(i % W + .5 - b.x, ((i / W) | 0) + .5 - b.y); if (dd < bd) { bd = dd; best = i; } } b.target = best; b.ph = 'seek'; b.t = 6; }
      else { b.ph = 'shoot'; b.t = .5; } } return; }
  if (b.ph === 'seek') { const tx = b.target % W + .5, ty = ((b.target / W) | 0) + .5, dd = Math.hypot(tx - b.x, ty - b.y); if (dd > 1.6) moveEnt(b, (tx - b.x) / dd * 2.1 * dt, (ty - b.y) / dd * 2.1 * dt, 1.1); else { b.ph = 'blow'; b.t = .9; emit('puff', b.x, b.y - .6, '#8a6ad0', 10, 2.5, .4); } if (b.t <= 0) { b.ph = 'walk'; b.t = 1; } return; }
  if (b.ph === 'shoot') { if (b.t <= 0) { const n = st >= 2 ? 7 : 5, base = Math.atan2(p.y - b.y, p.x - b.x); for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * .22; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 5.5, vy: Math.sin(a) * 5.5, life: 3, dmg: 22, k: 'spore' }); } emit('sfx', 'cast'); b.ph = 'walk'; b.t = 1.6 - st * .2; } return; }
  b.ph = 'walk'; b.t = .5; };
// 밝힌 곳에 있을 때만 맞아요 (sim/bosses.js hitBoss가 불러요)
export const darkCanHit = b => b.k !== 'dark' || isLit(b.x, b.y);
export function darkContact(dt) { const b = G.bosses.dark; if (!b || G.bossDead.dark || b.st !== 'fight') return; for (const pl of alivePlayers()) if (Math.hypot(pl.p.x - b.x, pl.p.y - b.y) < 1.5) withPlayer(pl, () => hurtPlayer(DARK_DMG, b.x, b.y)); }
onFrame('darkContact', darkContact);
// 쓰러지면 엔딩
export function darkDown(b) { const d = G.stats.deep; if (d) d.done = 1; G.stats.ending = (G.stats.ending || 0) + 1; if (d) for (let r = 0; r < DEEP_H; r++) for (let c = 0; c < DEEP_W; c++) G.explored[idx(d.x + c, d.y + r)] = 1; emit('remap'); if (!naruEnding()) emit('ending'); } // v119: 나루가 있으면 마지막 말 → 창을 닫으면 엔딩
// 이야기 퀘스트: 다섯 등불 뒤 → 가장 깊은 곳
GUIDE.splice(GUIDE.length - 1, 0,
  { id: 'deep', t: () => '가장 깊은 곳의 마지막 장 찾기', h: '나무가 당신한테 반응했어요! 용암·얼음 동굴 깊은 곳 어딘가에 등불지기들의 마지막 유적이 있대요. 어둠이 길을 막으면 등불 다섯을 먼저 밝혀요.', done: () => !!(G.stats.deep && G.stats.deep.read), rw: [['torch', 12], ['stew', 3]], xp: 300, target: () => { const d = G.stats.deep; return d ? { x: d.x + DEEP_PLAN[DEEP_H - 1].indexOf('E') + .5, y: d.y + DEEP_H + .5 } : null; } },
  { id: 'dark', t: () => '큰 어둠 물리치기', h: '횃대에 불을 붙여 밝힌 곳에 서 있을 때만 큰 어둠을 때릴 수 있대요. 어둠이 횃대를 하나씩 꺼뜨리니까, 다시 붙이며 싸워요.', done: () => !!G.bossDead.dark, rw: [['goldBar', 8], ['cryGem', 4]], xp: 1200, target: () => darkHome() });
Q_GO.deep = ['tgt']; Q_GO.dark = ['tgt'];
// 불러올 때: 가장 깊은 곳 놓기(한 번) + 보스 자리 맞추기
export function deepOnLoad() { placeDeep(); if (G.stats.deep && !G.bossDead.dark) G.bosses.dark = freshBoss('dark'); }
