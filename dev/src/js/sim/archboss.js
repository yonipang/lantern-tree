// ================= v131 기록관 보스 4 · 기록관 몬스터 2종 (dev/design/성장확장.md 8-2d, 수치는 data/archboss.js) =================
// 기록관마다 일기 방 바깥 벽 너머에 13×9 「마지막 방」을 붙여요(위 → 오른쪽 → 왼쪽 순서로 자리를 찾고, 없으면 그 기록관은 보스 없음).
// 문은 암반으로 봉인돼 있다가 일기를 읽으면 열려요(sim/archive.js readDiary → abOpen). 옛 세계도 불러올 때 한 번(stats.abV), 이미 읽었으면 열린 채로.
// 자리는 기록관 기록(G.stats.arch[]의 br = { d, x, y, door, bx, by })에. 방이 없거나 아직 봉인이면 그 보스는 없는 것처럼(BOSSES[k].off) 그리지도 움직이지도 않아요.
// 파수 돌인형: 깨기 전 기록관 들어가는 방에서 네모 길을 돌고, 레버를 켜면 멈춰 돌이 돼요. 책벌레는 그림자 조각과 같이 나와요(sim/archive.js).
import { BOSSES, BKEYS } from '../data/rpg-nature.js';
import { OBJ } from '../data/items.js';
import { QSIDE, Q_GO } from '../data/quests.js';
import { ABOSS, ABOSS_OF, ABOSS_WAKE, AB_DMG, AB_Q_XP, WARD_DM } from '../data/archboss.js';
import { rand } from '../engine/random.js';
import { josa } from '../engine/util.js';
import { G, beat, freshBoss, playerList } from '../save/state.js';
import { archList, archAt, ARCH_W, ARCH_H, ARCH_PLAN } from './archive.js';
import { deepAt } from './deep.js';
import { BOSS_AI } from './bosses.js';
import { mkEnemy } from './enemies.js';
import { emit } from './events.js';
import { markLight } from './loop.js';
import { MON_AI } from './monsters.js';
import { hurtPlayer } from './player.js';
import { onFrame } from './systems.js';
import { nearWarpPt, roomInRect } from './warp.js';
import { BX, BY, H, idx, inB, PIT, SA, SB, SI, SL, W } from '../world/map.js';
import { boxHits, moveEnt, noDigZone } from '../world/tiles.js';

// 13 × 9 마지막 방 (# 암반 · . 돌바닥 · X 보스 자리)
export const AB_PLAN = [
  '#############',
  '#...........#',
  '#...........#',
  '#...........#',
  '#.....X.....#',
  '#...........#',
  '#...........#',
  '#...........#',
  '#############',
];
export const AB_W = AB_PLAN[0].length, AB_H = AB_PLAN.length;
// 붙이는 방향: 방 왼쪽 위 칸과 봉인 문(기록관 벽 위, 기록관 왼쪽 위 기준). 위 문은 일기 방 위 벽(얼음 기록관 얼음 속 등불지기 자리를 피해 8번째 칸)
// 같은 방향 안에서는 문이 방 벽 가운데쯤 오는 자리부터, 벽을 따라 조금씩 밀어 보며 찾아요 (위 → 오른쪽 → 왼쪽)
export const AB_DIRS = [
  ...[0, -1, 1, -2, 2, -3, 3, 4, 5, 6, 7].map(o => ({ d: 'up', rx: o, ry: -(AB_H - 1), dx: 8, dy: 0 })),
  ...[0, -1, 1, -2, 2, -3, 3].map(o => ({ d: 'right', rx: ARCH_W - 1, ry: -1 + o, dx: ARCH_W - 1, dy: 3 })),
  ...[0, -1, 1, -2, 2, -3, 3].map(o => ({ d: 'left', rx: -(AB_W - 1), ry: -1 + o, dx: 0, dy: 3 })),
];
const inArchRect = (a, x, y) => x >= a.x && x < a.x + ARCH_W && y >= a.y && y < a.y + ARCH_H;
export const abArchOf = k => { const A = ABOSS_OF[k]; return A ? archList().find(a => a.id === A.arch) || null : null; };
// 마지막 방 안인지 (그 기록관 기록을 돌려줘요)
export const abRoomAt = (x, y) => archList().find(a => a.br && x >= a.br.x && x < a.br.x + AB_W && y >= a.br.y && y < a.br.y + AB_H) || null;
// 보스 자리 (방이 없으면 쓰이지 않는 자리 — off가 막아요)
const abHome = k => { const a = abArchOf(k); return a && a.br ? { x: a.br.bx + .5, y: a.br.by + .5 } : { x: 2.5, y: 2.5 }; };
// 그 보스가 지금 없는 것처럼 할지: 방이 없거나, 아직 일기를 안 읽어 봉인돼 있으면
export const abOff = k => { const a = abArchOf(k); return !a || !a.br || !a.done; };

// ---- 보스 등록 ----
for (const A of ABOSS) { BOSSES[A.k] = { n: A.n, hp: A.hp, home: () => abHome(A.k), wake: ABOSS_WAKE, hr: A.hr, col: A.col, spr: A.k, scale: A.scale, off: () => abOff(A.k) }; BKEYS.push(A.k); }

// ---- 방 붙이기 ----
// 그 방향에 붙일 수 있는지 — 안 되면 까닭(글), 되면 '' (테스트도 써요)
export function abFitWhy(a, D, taken = []) { const x0 = a.x + D.rx, y0 = a.y + D.ry; let n = 0, walls = 0;
  if (roomInRect(x0, y0, x0 + AB_W - 1, y0 + AB_H - 1)) return 'room';
  for (const [sx, sy] of [[x0, y0], [x0 + AB_W - 1, y0], [x0, y0 + AB_H - 1], [x0 + AB_W - 1, y0 + AB_H - 1], [x0 + 6, y0 + 4]]) if (noDigZone(sx, sy)) return 'nodig';
  for (const b of [{ x: BX, y: BY }, SA, SB, SL, SI]) if (Math.hypot(x0 + 6 - b.x, y0 + 4 - b.y) < 16) return 'boss';
  for (let y = y0; y < y0 + AB_H; y++) for (let x = x0; x < x0 + AB_W; x++) { if (inArchRect(a, x, y)) continue;
    if (!inB(x, y) || x < 2 || y < 2 || x > W - 3 || y > H - 3) return 'edge'; const i = idx(x, y);
    if ((archAt(x, y) && archAt(x, y) !== a) || deepAt(x, y) || abRoomAt(x, y) || taken.some(r => x >= r.x && x < r.x + AB_W && y >= r.y && y < r.y + AB_H)) return 'other';
    const o = G.objs.get(i), od = o && OBJ[o.t]; // 저절로 난 자연물(풀·빛버섯·덤불·나무 …)은 덮어도 돼요 — 놓은 물건만 피해요
    if ((o && !(od && (od.nat || od.bush || od.ntree))) || G.wire.has(i) || G.under.has(i) || G.floor[i] === PIT || (G.bwall && G.bwall.has(i)) || nearWarpPt(x, y)) return 'stuff';
    n++; if (G.wall[i] || !G.explored[i]) walls++; }
  return walls >= n * .75 ? '' : 'open:' + Math.round(walls / n * 100); } // 밝힌 곳(플레이어가 다닌 굴)이 거의 없는 곳에만 — 안 가 본 동굴은 덮어도 돼요
const abFits = (a, D, taken) => !abFitWhy(a, D, taken);
function abCarve(a, D) { const x0 = a.x + D.rx, y0 = a.y + D.ry, door = idx(a.x + D.dx, a.y + D.dy); let bx = x0 + 6, by = y0 + 4;
  for (let r = 0; r < AB_H; r++) for (let c = 0; c < AB_W; c++) { const x = x0 + c, y = y0 + r; if (inArchRect(a, x, y)) continue; const i = idx(x, y), ch = AB_PLAN[r][c];
    G.objs.delete(i); G.wire.delete(i); if (G.wdmg) G.wdmg.delete(i);
    if (ch === '#') G.wall[i] = 8; else { G.wall[i] = 0; G.floor[i] = 6; if (ch === 'X') { bx = x; by = y; } }
    if (G.explored[i]) emit('tile', x, y); }
  a.br = { d: D.d, x: x0, y: y0, door, bx, by }; G.wall[door] = 8; if (a.done) abOpenDoor(a); }
export function placeArchBosses() { if (!G || !G.stats || G.stats.abV) return 0; G.stats.abV = 1; let n = 0; const taken = [];
  for (const a of archList()) { if (a.br !== undefined || !ABOSS.some(A => A.arch === a.id)) continue; a.br = null;
    for (const D of AB_DIRS) if (abFits(a, D, taken)) { abCarve(a, D); taken.push({ x: a.br.x, y: a.br.y }); n++; break; } }
  if (n) { markLight(); emit('remap'); } return n; }
function abOpenDoor(a) { const i = a.br.door; G.wall[i] = 0; G.floor[i] = 6; if (G.wdmg) G.wdmg.delete(i); if (G.explored[i]) emit('tile', i % W, (i / W) | 0); }
// 일기를 읽으면 봉인이 풀려요 (sim/archive.js readDiary)
export function abOpen(a) { if (!a || !a.br || !G.wall[a.br.door]) return false; abOpenDoor(a); markLight(); const A = ABOSS.find(q => q.arch === a.id);
  if (A && !G.bossDead[A.k]) G.bosses[A.k] = freshBoss(A.k);
  emit('shake', .3); emit('sfx', 'boss'); emit('puff', a.br.door % W + .5, ((a.br.door / W) | 0) + .5, '#ffe9a8', 18, 3, .6);
  emit('toast', '일기 방 벽의 봉인이 풀렸어요… 마지막 방에서 무언가 기다려요', 'warn', 'abOpen'); return true; }
// 불러올 때 (save/state.js — 기록관을 놓은 뒤): 방 붙이기(한 번) + 보스 자리 맞추기
export function archBossOnLoad() { placeArchBosses(); for (const A of ABOSS) if (!G.bossDead[A.k]) G.bosses[A.k] = freshBoss(A.k); }

// ---- 보스 움직임 ----
const shotsFan = (b, n, gap, spd, dmg, k, life = 3) => { const p = G.p, base = Math.atan2(p.y - b.y, p.x - b.x); for (let q = 0; q < n; q++) { const a = base + (q - (n - 1) / 2) * gap; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life, dmg, k, a }); } };
const abHz = h => { G.hz = G.hz || []; G.hz.push(Object.assign({ t: 0 }, h)); };
// 방 안에서 내 둘레의 빈 자리
function spotNear(b, r0, r1) { const p = G.p, h = BOSSES[b.k].home(); for (let q = 0; q < 16; q++) { const a = rand() * 6.283, r = r0 + rand() * (r1 - r0), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r;
    if (!boxHits(x, y, .4) && Math.hypot(x - h.x, y - h.y) < 6.5) return { x, y }; } return null; }
Object.assign(BOSS_AI, {
  // 책더미 골렘: 걸어오며 책을 부채꼴로 던지고, 세 번째마다 조준 뒤 돌진(벽에 부딪히면 잠깐 멈춤 + 책이 사방으로)
  bookGolem(b, dt) { const p = G.p, d = b.d, half = b.hp < b.max / 2, D = AB_DMG.bookGolem; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (b.ph === 'walk') { if (d > 2.2) moveEnt(b, (p.x - b.x) / d * 1.5 * dt, (p.y - b.y) / d * 1.5 * dt, .9); if (b.t <= 0) { b.casts++; if (b.casts % 3 === 0) { b.ph = 'aim'; b.t = .75; } else { b.ph = 'throw'; b.t = .45; } } }
    else if (b.ph === 'throw') { if (b.t <= 0) { shotsFan(b, half ? 7 : 5, .26, 6, D.book, 'book'); emit('sfx', 'swing'); b.ph = 'walk'; b.t = half ? .8 : 1.2; } }
    else if (b.ph === 'aim') { if (b.t > .3) { b.dx = (p.x - b.x) / (d || 1); b.dy = (p.y - b.y) / (d || 1); } if (b.t <= 0) { b.ph = 'dash'; b.t = .6; emit('sfx', 'swing'); } }
    else if (b.ph === 'dash') { const blocked = moveEnt(b, b.dx * (half ? 12 : 10) * dt, b.dy * (half ? 12 : 10) * dt, .9);
      if (blocked) { b.ph = 'stun'; b.t = 1.1; emit('shake', .4, true); emit('sfx', 'brk'); emit('puff', b.x, b.y - .5, '#f0d8a8', 16, 3); emit('ftext', b.x, b.y - 2.6, '쿵!', '#ffe9a8');
        for (let q = 0; q < 8; q++) { const a = q / 8 * 6.283; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, life: 2, dmg: D.book, k: 'book', a }); } }
      else if (b.t <= 0) { b.ph = 'walk'; b.t = .8; } }
    else if (b.ph === 'stun') { if (b.t <= 0) { b.ph = 'walk'; b.t = .6; } }
    else { b.ph = 'walk'; b.t = .5; }
    if (d < 1.4 && b.ph !== 'stun') hurtPlayer(b.ph === 'dash' ? D.dash : D.touch, b.x, b.y); },
  // 거울 사서: 거리를 두고 조준 뒤 빛줄기, 세 번째마다 거울 분신(분신도 빛줄기를 쏴요) — 체력 절반 아래면 빛줄기 두 번·분신 3개
  mirrorSage(b, dt) { const p = G.p, d = b.d, half = b.hp < b.max / 2, D = AB_DMG.mirrorSage; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (b.ph === 'walk') { const want = d > 6 ? 1 : d < 3.5 ? -1 : 0; if (want && d > 0) moveEnt(b, (p.x - b.x) / d * 1.8 * want * dt, (p.y - b.y) / d * 1.8 * want * dt, .8);
      if (b.t <= 0) { b.casts++; if (b.casts % 3 === 0) { b.ph = 'mirror'; b.t = .6; } else { b.ph = 'aim'; b.t = .8; } } }
    else if (b.ph === 'aim') { if (b.t > .25) { b.dx = (p.x - b.x) / (d || 1); b.dy = (p.y - b.y) / (d || 1); } if (b.t <= 0) { const a = Math.atan2(b.dy, b.dx);
        for (let q = 0; q < 7; q++) G.shots.push({ x: b.x - Math.cos(a) * q * .35, y: b.y - .4 - Math.sin(a) * q * .35, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, life: 1.6, dmg: D.beam, k: 'shard', a }); emit('sfx', 'clink');
        if (half && !b.dbl) { b.dbl = 1; b.ph = 'aim'; b.t = .55; } else { b.dbl = 0; b.ph = 'walk'; b.t = half ? 1.1 : 1.4; } } }
    else if (b.ph === 'mirror') { if (b.t <= 0) { const have = G.enemies.filter(e => e.k === 'mirrorClone').length, want = half ? 3 : 2;
        for (let q = have; q < want; q++) { const s = spotNear(b, 2.5, 3.5); if (!s) break; const e = mkEnemy('mirrorClone', s.x, s.y); e.cd = 1 + q * .5; G.enemies.push(e); emit('puff', s.x, s.y - .5, '#efe6ff', 12, 2.5, .5); }
        emit('sfx', 'cast2'); b.ph = 'walk'; b.t = 1; } }
    else { b.ph = 'walk'; b.t = .5; }
    if (d < 1.2) hurtPlayer(D.touch, b.x, b.y); },
  // 잉크 불꽃: 걸어오며 불꽃 탄과 잉크 웅덩이(밟으면 느려지고 조금씩 다침)를 번갈아 — 체력 절반 아래면 지나간 자리에도 잉크
  inkFlame(b, dt) { const p = G.p, d = b.d, half = b.hp < b.max / 2, D = AB_DMG.inkFlame; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (half) { b.trail = (b.trail || 0) - dt; if (b.trail <= 0) { b.trail = .8; abHz({ x: b.x, y: b.y + .2, r: .8, warn: .3, life: 4, dmg: D.ink, k: 'ink' }); } }
    if (b.ph === 'walk') { if (d > 2) moveEnt(b, (p.x - b.x) / d * 1.8 * dt, (p.y - b.y) / d * 1.8 * dt, .8); if (b.t <= 0) { b.casts++; b.ph = b.casts % 2 === 0 ? 'pour' : 'spit'; b.t = b.ph === 'pour' ? .6 : .5; } }
    else if (b.ph === 'spit') { if (b.t <= 0) { shotsFan(b, half ? 7 : 5, .24, 6.2, D.fire, 'fire'); emit('sfx', 'cast2'); b.ph = 'walk'; b.t = half ? .9 : 1.3; } }
    else if (b.ph === 'pour') { if (b.t <= 0) { abHz({ x: p.x, y: p.y, r: 1.2, warn: .5, life: 6, dmg: D.ink, k: 'ink' }); for (let q = 0; q < (half ? 4 : 2); q++) { const s = spotNear(b, 1.2, 2.8); if (s) abHz({ x: s.x, y: s.y, r: 1.2, warn: .5, life: 6, dmg: D.ink, k: 'ink' }); }
        emit('sfx', 'cast'); emit('puff', b.x, b.y - .5, '#3a3060', 14, 2.6, .5); b.ph = 'walk'; b.t = 1; } }
    else { b.ph = 'walk'; b.t = .5; }
    if (d < 1.3) hurtPlayer(D.touch, b.x, b.y, 'fire'); },
  // 얼어붙은 기록관장: 천천히 걸으며 경고 원 뒤 얼음 기둥, 그다음 책 고리(빙 둘러 퍼지는 책, 빈틈 셋) — 체력 절반 아래면 원 5개·고리 두 번
  frostKeeper(b, dt) { const p = G.p, d = b.d, half = b.hp < b.max / 2, D = AB_DMG.frostKeeper; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (b.ph === 'walk') { if (d > 2.4) moveEnt(b, (p.x - b.x) / d * 1.2 * dt, (p.y - b.y) / d * 1.2 * dt, .9); if (b.t <= 0) { b.casts++; b.ph = b.casts % 2 === 1 ? 'pillars' : 'ring'; b.t = b.ph === 'ring' ? .7 : .5; } }
    else if (b.ph === 'pillars') { if (b.t <= 0) { abHz({ x: p.x, y: p.y, r: 1.1, warn: .9, life: 1.05, dmg: D.pillar, k: 'frost', slow: 2 }); for (let q = 0; q < (half ? 4 : 2); q++) { const s = spotNear(b, 1.5, 3); if (s) abHz({ x: s.x, y: s.y, r: 1.1, warn: .9, life: 1.05, dmg: D.pillar, k: 'frost', slow: 2 }); }
        emit('sfx', 'cast'); b.ph = 'walk'; b.t = 1; } }
    else if (b.ph === 'ring') { if (b.t <= 0) { const n = 16, gap = Math.floor(rand() * n); for (let q = 0; q < n; q++) { if ((q - gap + n) % n < 3) continue; const a = q / n * 6.283 + (b.rings || 0) * .2; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, life: 4, dmg: D.book, k: 'book', a }); }
        emit('sfx', 'cast2'); b.rings = (b.rings || 0) + 1; if (half && b.rings % 2 === 1) b.t = .55; else { b.ph = 'walk'; b.t = half ? 1.1 : 1.5; } } }
    else { b.ph = 'walk'; b.t = .5; }
    if (d < 1.3) hurtPlayer(D.touch, b.x, b.y); },
});

// ---- 파수 돌인형: 들어가는 방(기록관 안 1~5번째 칸 · 1~6번째 줄)의 네모 길을 돌아요 ----
export const WARD_PATH = [[1.5, 1.6], [5.5, 1.6], [5.5, 6.6], [1.5, 6.6]];
const leverOf = a => G.objs.get(idx(a.x + ARCH_PLAN[3].indexOf('L'), a.y + 3));
MON_AI.patrol = function (e, def, dt) { e.vx = e.vy = 0; if (e.stone) return true; const a = archList().find(q => q.id === e.arch); if (!a) return true;
  const [px, py] = WARD_PATH[(e.wp || 0) % WARD_PATH.length], tx = a.x + px, ty = a.y + py, dx = tx - e.x, dy = ty - e.y, dd = Math.hypot(dx, dy);
  if (dd < .06) { e.wp = ((e.wp || 0) + 1) % WARD_PATH.length; return true; }
  const s = Math.min(dd, def.spd * dt); e.x += dx / dd * s; e.y += dy / dd * s; e.anim = (e.anim || 0) + dt; if (Math.abs(dx) > .05) e.flip = dx < 0; return true; };
// 깨기 전, 플레이어가 기록관 안에 있으면 2마리가 늘 돌아요(서로 반대편에서). 레버를 켜면 멈춰 돌이 돼요(다시 움직이지 않아요)
onFrame('archWards', () => { for (const a of archList()) { if (a.done) continue; const inside = playerList().some(q => archAt(Math.floor(q.p.x), Math.floor(q.p.y)) === a); if (!inside) continue;
  const lv = leverOf(a), on = !!(lv && lv.t === 'lever' && lv.on), wards = G.enemies.filter(e => e.k === 'stoneWard' && e.arch === a.id);
  if (on) { for (const e of wards) if (!e.stone) { e.stone = 1; emit('puff', e.x, e.y - .4, '#bdb6a8', 12, 2.4, .5); emit('sfx', 'brk'); emit('toast', '레버를 켜자 파수 돌인형이 멈춰 돌이 됐어요', 'good', 'wardStone'); } continue; }
  for (const wp of [0, 2]) { if (wards.some(e => e.home0 === wp)) continue; const [px, py] = WARD_PATH[wp], e = mkEnemy('stoneWard', a.x + px, a.y + py);
    Object.assign(e, { arch: a.id, wp: (wp + 1) % WARD_PATH.length, home0: wp, dm: WARD_DM[a.b] || 1 }); G.enemies.push(e); } } });

// ---- 도전 퀘스트 「○○ 기록관의 마지막 방」 ----
const AB_HINT = {
  bookGolem: '이끼 굴 기록관에서 일기를 읽으면 일기 방 벽 너머 봉인된 문이 열려요. 책더미 골렘의 돌진을 옆으로 피하면 벽에 부딪혀 잠깐 멈춰요.',
  mirrorSage: '수정 동굴 기록관의 마지막 방에 거울 사서가 있어요. 거울 분신도 빛줄기를 쏘니까 분신부터 깨요.',
  inkFlame: '용암 동굴 기록관의 마지막 방에 잉크 불꽃이 있어요. 잉크 웅덩이를 밟으면 느려지고 조금씩 다쳐요. 더위 대비도 챙겨요.',
  frostKeeper: '얼음 동굴 기록관의 마지막 방에 얼어붙은 기록관장이 있어요. 점선 원 밖으로 피하고, 책 고리는 빈틈으로 빠져나가요.',
};
for (const A of ABOSS) { const id = 's_ab' + A.arch.slice(4); Q_GO[id] = ['tgt'];
  QSIDE.push({ id, t: `${A.at} 기록관의 마지막 방`, h: AB_HINT[A.k], done: () => beat(A.k), rw: [], xp: AB_Q_XP[id] || 100,
    gone: () => { const a = archList().find(q => q.id === A.arch); return !!G.stats.abV && !(a && a.br); }, // 방이 없는 세계에서는 안 보여요
    target: () => { const a = archList().find(q => q.id === A.arch); if (!a) return null; if (a.br && a.done) return abHome(A.k); return { x: a.x + ARCH_PLAN[ARCH_H - 1].indexOf('E') + .5, y: a.y + ARCH_H + .5 }; } }); }
// 처음 물리쳤을 때 알림 (sim/bosses.js hitBoss)
export const abDownToast = k => emit('toast', `${josa(BOSSES[k].n, '을', '를')} 물리쳤어요! ${ABOSS_OF[k].at} 기록관의 마지막 방을 깼어요`, 'good');
export const isABoss = k => !!ABOSS_OF[k];
