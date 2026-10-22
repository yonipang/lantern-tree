// ================= v129 그림자 지대 (dev/design/성장확장.md 8장, 수치는 data/shadow.js) =================
// 빛씨앗 5개를 심는 순간(옛 세이브는 불러올 때) 가장 깊은 곳 유적 둘레가 한 번 바뀌어요(stats.shadowV, 자리 stats.shadow = {x, y}).
// 바뀌는 것: 자연 바위 → 그림자 바위(약 6%는 그림자 결정 광맥), 자연 바닥 → 그림자 바닥. 그대로인 것: 유적 안, 광맥, 물·용암·얼어붙은 물,
// 직접 쌓은 벽(G.bwall)·깐 바닥, 보스방 둘레 18칸(바위 고리를 수정 곡괭이로 여는 길 그대로), 등불나무·숨은 방·기록관·워프포인트 둘레.
// 그림자 지대 안에서 생기는 몬스터는 SHADOW_TABLE(sim/enemies.js trySpawn이 inShadow로 물어봐요). 들어가면 알림 한 줄.
import { SHADOW_FLOOR, SHADOW_FROM_FLOOR, SHADOW_FROM_WALL, SHADOW_R, SHADOW_ROCK, SHADOW_TABLE, SHADOW_VEIN, SHADOW_VEIN_W, SHADOW_WOB } from '../data/shadow.js';
import { hash2, rand, vn } from '../engine/random.js';
import { G } from '../save/state.js';
import { BX, BY, SA, SB, SI, SL, idx, inB } from '../world/map.js';
import { isPlacedFloor, noDigZone } from '../world/tiles.js';
import { archAt } from './archive.js';
import { DEEP_H, DEEP_W, deepAt } from './deep.js';
import { emit } from './events.js';
import { onFrame } from './systems.js';
import { nearWarpPt, roomNear } from './warp.js';

const sh_seed = () => ((G.seed | 0) ^ 0x5ad0) | 0;
// 그 칸이 지대 둘레 안인지 (가운데 c에서 반지름 SHADOW_R ± SHADOW_WOB, 칸 좌표 노이즈라 같은 세계면 늘 같아요)
function sh_inRing(x, y, c) { const d = Math.hypot(x + .5 - c.x, y + .5 - c.y); if (d > SHADOW_R + SHADOW_WOB) return false; if (d < SHADOW_R - SHADOW_WOB) return true;
  return d < SHADOW_R - SHADOW_WOB + 2 * SHADOW_WOB * vn(x / 7, y / 7, sh_seed()); }
// 그림자 지대 안인지 (깨어난 뒤에만, 유적 안은 빼요)
export function inShadow(x, y) { const c = G && G.stats && G.stats.shadow; if (!c) return false; x = Math.floor(x); y = Math.floor(y); return !deepAt(x, y) && sh_inRing(x, y, c); }
export function pickShadow() { let r = rand(); for (const [k, w] of SHADOW_TABLE) { r -= w; if (r < 0) return k; } return SHADOW_TABLE[0][0]; }
// 바꾸지 않는 칸: 보스방 둘레·등불나무 둘레·숨은 방·기록관·워프포인트
function sh_keep(x, y) { for (const b of [{ x: BX, y: BY }, SA, SB, SL, SI]) if (Math.hypot(x - b.x, y - b.y) < 18) return true;
  return !!(noDigZone(x, y) || roomNear(x, y) || archAt(x, y) || nearWarpPt(x, y)); }
// 깨우기: 빛씨앗 5개 + 가장 깊은 곳이 있을 때 한 번. silent = 불러올 때(알림 없이)
export function shadowWake(silent) {
  const S = G && G.stats; if (!S || S.shadowV || !S.deep || (G.treeSeeds | 0) < 5) return 0; S.shadowV = 1;
  const d = S.deep, c = { x: d.x + DEEP_W / 2, y: d.y + DEEP_H / 2 }; S.shadow = { x: c.x, y: c.y };
  const R = SHADOW_R + SHADOW_WOB + 1, seed = sh_seed(); let walls = 0, veins = 0, floors = 0;
  for (let y = Math.floor(c.y - R); y <= c.y + R; y++) for (let x = Math.floor(c.x - R); x <= c.x + R; x++) {
    if (!inB(x, y) || !sh_inRing(x, y, c) || deepAt(x, y) || sh_keep(x, y)) continue; const i = idx(x, y); let ch = false;
    const w = G.wall[i];
    if (w) { if (SHADOW_FROM_WALL.has(w) && !(G.bwall && G.bwall.has(i))) { const v = hash2(x, y, seed) < SHADOW_VEIN; G.wall[i] = v ? SHADOW_VEIN_W : SHADOW_ROCK; if (G.wdmg) G.wdmg.delete(i); if (v) veins++; else walls++; ch = true; } }
    const f = G.floor[i]; if (SHADOW_FROM_FLOOR.has(f) && !isPlacedFloor(f)) { G.floor[i] = SHADOW_FLOOR; floors++; ch = true; }
    if (ch && G.explored[i]) emit('tile', x, y); }
  S.shadowN = { walls, veins, floors };
  if (!silent) { emit('toast', '가장 깊은 곳 둘레가 그림자에 물들었어요 — 그림자 지대가 깨어났어요', 'warn', 'shadowWake'); emit('shake', .25); }
  return 1; }
// 불러올 때 (save/state.js deserialize — 가장 깊은 곳을 넣은 뒤)
export const shadowOnLoad = () => shadowWake(true);
// 들어가면 알림 (처음 한 번은 길게)
const sh_in = new WeakMap();
onFrame('shadow', () => { const p = G.p; if (!p || !G.stats.shadow) return; const now = inShadow(p.x, p.y);
  if (now !== !!sh_in.get(p)) { sh_in.set(p, now); if (now) { if (!G.stats.shadowSeen) { G.stats.shadowSeen = 1; emit('toast', '그림자 지대 — 그림자 몬스터는 빛 안에서 피해를 2배로 받아요. 횃불을 챙겨요!', 'warn', 'shadowIn'); } else emit('toast', '그림자 지대', null, 'shadowIn'); } } });
