// ================= 실험판 보이기 효과: 조각·흔들림 (보이기만 — 게임 결과는 안 바꿔요) =================
// 조각 움직이기는 본 게임 render/parts.js(updateFx, 매 프레임 'fx')가 해요 — 조각 모양도 본 게임 ui/feedback.js 'chips'와 같게.
import { fxRand } from '../engine/random.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
export let shake = 0;
export const addShake = v => { shake = Math.max(shake, v); };
// 캐기 조각: 칸에서 튀어 떨어져 통통 튐 (big = 부서질 때 굵은 덩어리) — 본 게임 ui/feedback.js 'chips'와 같은 값
export function chips(x, y, c1, c2, n, big) { for (let k = 0; k < n; k++) { const a = fxRand() * 6.283, s = (big ? 2.2 : 1.6) * (.4 + fxRand() * .9);
  G.parts.push({ x: x + (fxRand() - .5) * (big ? .5 : .2), y, z: .35 + fxRand() * .3, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .5, vz: (big ? 3 : 2.2) + fxRand() * 2, life: (big ? .7 : .45) + fxRand() * .3, max: big ? 1 : .7, col: k % 3 ? c1 : c2, sz: big ? 2 + (fxRand() * 2 | 0) : 1 + (fxRand() * 2 | 0), bnc: 1 }); } }
onFrame('shake', dt => { shake = Math.max(0, shake - dt); });
