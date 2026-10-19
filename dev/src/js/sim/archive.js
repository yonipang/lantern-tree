// ================= v106 기록관(유적): 이끼 굴 시험 기록관 (dev/design/세계관-NPC.md 「기록관」) =================
// 지도 안 유적 구역(코어키퍼 방식). 벽은 단단한 암반(8, 못 캠), 바닥은 돌바닥(6). 안은 깨기 전까지 지도에서 까맣고(render/light.js), 깨면(일기를 읽으면) 한 번에 모두 보여요.
// 두 방: 들어가는 방(레버·건전지·전선) → 전기 문 → 일기 방(일기 받침대·기록관 학자 고치·보물상자). 안에는 그림자 조각이 어둠에서 지켜요(빛 안에서 2배).
// 새 세계·옛 세계 모두 불러올 때 한 번 놓아요(stats.archV). 자리가 없으면 안 생겨요. 기록은 G.stats.arch[]. 글·보상은 Claude 임시(【검토 중】).
import { ITEMS, OBJ, USE, USE_LBL } from '../data/items.js';
import { BATT_MAX } from '../data/circuits-regions.js';
import { Q_GO, QSIDE } from '../data/quests.js';
import { WATER } from './nature.js';
import { rand, rng } from '../engine/random.js';
import { G, nearestPlayer, playerList } from '../save/state.js';
import { learnRecipe } from './cooking.js';
import { mkEnemy, regionEnemy } from './enemies.js';
import { emit } from './events.js';
import { onFrame } from './systems.js';
import { roomNear, walkable } from './warp.js';
import { BX, BY, CX, CY, H, idx, inB, LAVA, PIT, SA, SB, SI, SL, W } from '../world/map.js';
import { isSolid, noDigZone } from '../world/tiles.js';
import { ARCHIVES } from '../data/story.js';
OBJ.diary = { n: '등불지기의 일기', solid: 1, diary: 1, light: [2.5, '#ffe9a8'] };
OBJ.sleeper = { n: '얼음 속 등불지기', solid: 1, sleeper: 1, light: [1.5, '#bfe6ff'] }; // v107 얼음 기록관
USE.diary = 'read2'; USE_LBL.read2 = '일기 읽기';
// 13 × 9 틀. # 암반 · . 바닥 · E 입구(바닥) · L 레버 · B 건전지 · - 전선 · D 전기 문 · J 일기 · S 학자 고치 · C 보물상자 · t 횃불 자리(없음)
export const ARCH_PLAN = [
  '#############',
  '#.....#.....#',
  '#.....#..J..#',
  '#..L--D..S..#',
  '#.....#.....#',
  '#..B..#..C..#',
  '#.....#.....#',
  '###E#########',
];
export const ARCH_W = ARCH_PLAN[0].length, ARCH_H = ARCH_PLAN.length;
export const ARCH_NOW = ['arch0', 'arch2', 'arch3', 'arch4']; // v107: 네 지역 모두
// 얼음 기록관(arch4)은 일기 방에 얼음 속 등불지기 다섯 자리(F)와 빈자리 하나(복선 ②)
export const ARCH_PLAN_ICE = [
  '#############',
  '#.....#F.F.F#',
  '#.....#..J..#',
  '#..L--D.....#',
  '#.....#F...F#',
  '#..B..#..C..#',
  '#.....#.....#',
  '###E#########',
];
export const planOf = id => id === 'arch4' ? ARCH_PLAN_ICE : ARCH_PLAN;
export const archList = () => (G && G.stats && G.stats.arch) || [];
export const archAt = (x, y) => archList().find(a => x >= a.x && x < a.x + ARCH_W && y >= a.y && y < a.y + ARCH_H) || null;
export const archHidden = (x, y) => { const a = archAt(x, y); return !!(a && !a.done && !(y === a.y + ARCH_H - 1)); }; // 깨기 전엔 안이 지도에 안 남아요 (입구 줄은 보여요)
const freeFor = i => !G.objs.get(i) && !G.wire.has(i) && !G.under.has(i) && G.floor[i] !== WATER && G.floor[i] !== LAVA && G.floor[i] !== PIT;
export function placeArchives() {
  if (!G || !G.stats || G.stats.archV) return 0; G.stats.archV = 1; G.stats.arch = G.stats.arch || []; let n = 0;
  const R = rng(((G.seed | 0) ^ 0xa7c41) >>> 0), reach = walkable(), boss = [{ x: BX, y: BY }, SA, SB, SL, SI];
  for (const A of ARCHIVES.filter(q => ARCH_NOW.includes(q.id))) { if (archList().some(a => a.id === A.id)) continue; const cand = [];
    for (let y = 4; y < H - ARCH_H - 4; y += 2) for (let x = 4; x < W - ARCH_W - 4; x += 2) {
      const cx = x + (ARCH_W >> 1), cy = y + ARCH_H; if (G.biome[idx(cx, cy)] !== A.b) continue; const d = Math.hypot(cx - CX, cy - CY); if (d < A.minD || d > A.maxD) continue;
      if (noDigZone(cx, cy) || roomNear(cx, cy) || Math.hypot(cx - boss[A.b].x, cy - boss[A.b].y) < 20) continue;
      let ok = true, walls = 0; for (let yy = y - 1; yy <= y + ARCH_H && ok; yy++) for (let xx = x - 1; xx <= x + ARCH_W; xx++) { if (!inB(xx, yy)) { ok = false; break; } const i = idx(xx, yy); if (G.biome[i] !== A.b || !freeFor(i) || G.explored[i]) { ok = false; break; } if (G.wall[i]) walls++; }
      if (!ok || walls < (ARCH_W + 2) * (ARCH_H + 2) * .7) continue; // 거의 다 벽인 곳에만 파요 (플레이어가 판 굴을 망치지 않게)
      const ex = x + ARCH_PLAN[ARCH_H - 1].indexOf('E'), ey = y + ARCH_H - 1; let open = false, rock = false; for (let k = 1; k <= 4; k++) { if (!inB(ex, ey + k)) break; const wk = G.wall[idx(ex, ey + k)]; if (k <= 3 && wk === 8) rock = true; if (!wk) open = true; } if (rock) continue; // 입구 아래 3칸은 암반이 아니어야(길을 낼 수 있게), 4칸 안에 트인 곳이 있으면 좋아요
      cand.push({ x, y, r: reach[idx(ex, Math.min(H - 1, ey + 4))] ? 1 : 0, open: open ? 1 : 0 }); }
    if (!cand.length) continue; const best = cand.filter(c => c.open && c.r), P = best.length ? best : cand.filter(c => c.open).length ? cand.filter(c => c.open) : cand, c = P[Math.floor(R() * P.length)];
    carveArch(A, c.x, c.y); n++; }
  return n; }
function carveArch(A, x0, y0) { const wires = [], sleepers = [], PLAN = planOf(A.id); let door = null, diary = null, scholar = null, chest = null, lever = null, batt = null, ent = null;
  for (let r = 0; r < ARCH_H; r++) for (let c = 0; c < ARCH_W; c++) { const ch = PLAN[r][c], x = x0 + c, y = y0 + r, i = idx(x, y); G.objs.delete(i); G.wire.delete(i); if (G.wdmg) G.wdmg.delete(i);
    if (ch === '#') { G.wall[i] = 8; continue; } G.wall[i] = 0; G.floor[i] = 6;
    if (ch === 'L') lever = i; else if (ch === 'B') batt = i; else if (ch === '-') wires.push(i); else if (ch === 'D') door = i; else if (ch === 'J') diary = i; else if (ch === 'S') scholar = i; else if (ch === 'C') chest = i; else if (ch === 'E') ent = i; else if (ch === 'F') sleepers.push(i); }
  // 입구 아래로 3칸 길을 내요 (막혀 있으면)
  const ex = ent % W, ey = (ent / W) | 0; for (let k = 1; k <= 3; k++) { const j = idx(ex, ey + k); if (!inB(ex, ey + k)) break; if (G.wall[j] && G.wall[j] !== 8) { G.wall[j] = 0; if (G.wdmg) G.wdmg.delete(j); } }
  G.objs.set(lever, { t: 'lever', on: 0, arch: 1 }); G.objs.set(batt, { t: 'battery', e: BATT_MAX, arch: 1 }); for (const i of wires) G.wire.set(i, 1);
  // 건전지 → 레버 → 문까지 전선: 건전지 위(아래 칸)와 레버·문 사이 벽 안쪽 줄은 이미 '-'로 이어져 있고, 건전지 칸에서 레버까지는 세로로
  { const bx = batt % W, by = (batt / W) | 0, lx = lever % W, ly = (lever / W) | 0; for (let y = ly + 1; y < by; y++) G.wire.set(idx(bx, y), 1); if (bx !== lx) for (let x = Math.min(bx, lx); x <= Math.max(bx, lx); x++) if (idx(x, ly + 1) !== lever) G.wire.set(idx(x, ly + 1), 1); }
  G.objs.set(door, { t: 'eDoor', open: 0, arch: 1 }); G.objs.set(diary, { t: 'diary', a: A.id }); if (A.npc) G.objs.set(scholar, { t: 'cocoon', npc: A.npc, hits: 0 }); G.objs.set(chest, { t: 'tchest', hid: 0 }); for (const i of sleepers) G.objs.set(i, { t: 'sleeper' });
  G.stats.arch.push({ id: A.id, b: A.b, x: x0, y: y0, done: 0, gT: -999 }); }
// 안에서는 그림자 조각이 어둠에서 생겨요 (깨기 전, 플레이어가 안에 있을 때, 4마리까지, 45초마다)
onFrame('archives', dt => { for (const a of archList()) { if (a.done) continue; const pl = playerList().find(q => archAt(Math.floor(q.p.x), Math.floor(q.p.y)) === a); if (!pl) continue;
  if (G.time - a.gT < 45) continue; const inside = G.enemies.filter(e => e.k === 'shadowBit' && archAt(Math.floor(e.x), Math.floor(e.y)) === a).length; if (inside >= 2) continue; a.gT = G.time;
  for (let k = inside; k < 4; k++) for (let tr = 0; tr < 12; tr++) { const x = a.x + 1 + Math.floor(rand() * (ARCH_W - 2)), y = a.y + 1 + Math.floor(rand() * (ARCH_H - 2)); const i = idx(x, y); if (G.wall[i] || G.objs.get(i) || Math.hypot(x + .5 - pl.p.x, y + .5 - pl.p.y) < 3) continue;
    const e = regionEnemy(mkEnemy('shadowBit', x + .5, y + .6), a.b); e.home = { x: a.x + ARCH_W / 2, y: a.y + ARCH_H / 2, r: ARCH_W }; G.enemies.push(e); break; } } });
// 일기 읽기 → 기록관을 깼어요: 지도가 모두 보이고, 지역 레시피를 배우고, 기록
export function readDiary(o) { const a = archList().find(q => q.id === o.a); if (!a) return; const A = ARCHIVES.find(q => q.id === a.id);
  if (!a.done) { a.done = 1; for (let r = 0; r < ARCH_H; r++) for (let c = 0; c < ARCH_W; c++) G.explored[idx(a.x + c, a.y + r)] = 1; emit('remap'); G.stats.archDone = (G.stats.archDone || 0) + 1;
    if (A && A.recipe && learnRecipe(A.recipe)) emit('toast', `기록관을 깼어요! 지도에 기록관이 보이고, 등불지기의 레시피 「${(ITEMS['rn_' + A.recipe] || {}).n ? ITEMS['rn_' + A.recipe].n.replace('레시피 쪽지 · ', '') : A.recipe}」를 배웠어요`, 'good', 'arch');
    else emit('toast', '기록관을 깼어요! 지도에 기록관이 보여요', 'good', 'arch'); emit('sfx', 'win'); emit('puff', o.x, o.y, '#ffe9a8', 24, 3.5, .8); }
  emit('diary', a.id); }
export const archDiaryIds = () => archList().filter(a => a.done).map(a => a.id);
// 도전 퀘스트: 이끼 굴 기록관 깨기
for (const [id, nm, b] of [['arch2', '수정 동굴', 2], ['arch3', '용암 동굴', 3], ['arch4', '얼음 동굴', 4]]) { Q_GO['s_' + id] = ['tgt']; QSIDE.push({ id: 's_' + id, t: `${nm}의 기록관 깨기`, h: `${nm} 어딘가에 등불지기들의 기록관이 있어요. 레버로 전기 문을 열고 일기를 읽어요.`, done: () => archList().some(a => a.id === id && a.done), rw: [['torch', 10], [['cryGem', 'obsidian', 'frostShard'][b - 2], 4]], xp: 120 + b * 20,
  target: () => { const a = archList().find(q => q.id === id); return a ? { x: a.x + ARCH_PLAN[ARCH_H - 1].indexOf('E') + .5, y: a.y + ARCH_H + .5 } : null; } }); } // v107
Q_GO.s_arch0 = ['tgt'];
QSIDE.push({ id: 's_arch0', t: '이끼 굴의 기록관 깨기', h: '이끼 굴 어딘가에 등불지기들이 남긴 기록관이 있어요. 안은 어두워요 — 횃불을 챙기고, 레버로 전기 문을 열어 일기를 읽어요.', done: () => archList().some(a => a.id === 'arch0' && a.done), rw: [['torch', 10], ['glowcap', 6]], xp: 80,
  target: () => { const a = archList().find(q => q.id === 'arch0'); return a ? { x: a.x + ARCH_PLAN[ARCH_H - 1].indexOf('E') + .5, y: a.y + ARCH_H + .5 } : null; } });
