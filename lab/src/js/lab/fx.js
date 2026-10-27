// ================= 실험판 보이기 효과: 조각·흔들림·떠오르는 글자·포자·불티 (보이기만 — 게임 결과는 안 바꿔요) =================
// 조각 움직이기는 본 게임 render/parts.js(updateFx, 매 프레임 'fx')가 해요 — 조각 모양도 본 게임 ui/feedback.js 'chips'와 같게.
import { fxRand } from '../engine/random.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
export let shake = 0;
export const addShake = v => { shake = Math.max(shake, v); };
// 캐기 조각: 칸에서 튀어 떨어져 통통 튐 (big = 부서질 때 굵은 덩어리) — 본 게임 ui/feedback.js 'chips'와 같은 값
export function chips(x, y, c1, c2, n, big) { for (let k = 0; k < n; k++) { const a = fxRand() * 6.283, s = (big ? 2.2 : 1.6) * (.4 + fxRand() * .9);
  G.parts.push({ x: x + (fxRand() - .5) * (big ? .5 : .2), y, z: .35 + fxRand() * .3, vx: Math.cos(a) * s, vy: Math.sin(a) * s * .5, vz: (big ? 3 : 2.2) + fxRand() * 2, life: (big ? .7 : .45) + fxRand() * .3, max: big ? 1 : .7, col: k % 3 ? c1 : c2, sz: big ? 2 + (fxRand() * 2 | 0) : 1 + (fxRand() * 2 | 0), bnc: 1 }); } }
// L2 단서: 벽 틈에서 피어오르는 초록 포자 · 망치 소리와 함께 튀는 불티
export function spores(x, y) { for (let k = 0; k < 5; k++) G.parts.push({ x: x + (fxRand() - .5) * .8, y: y - fxRand() * .3, z: .2 + fxRand() * .5, vx: (fxRand() - .5) * .4, vy: -.2 - fxRand() * .3, vz: 1.4 + fxRand(), life: 1 + fxRand() * .6, max: 1.6, col: k % 2 ? '#9ff07a' : '#d9ffb8', sz: 1, bnc: 0 }); }
export function sparks(x, y) { for (let k = 0; k < 6; k++) { const a = fxRand() * 6.283; G.parts.push({ x, y, z: .5, vx: Math.cos(a) * 2, vy: Math.sin(a), vz: 2 + fxRand() * 2, life: .35 + fxRand() * .25, max: .6, col: k % 2 ? '#ffd27a' : '#ff9a4d', sz: 1, bnc: 0 }); } }
// 떠오르는 글자 (+12 · +흙 1 …)
export const floats = [];
export const addFloat = (x, y, txt, col) => { floats.push({ x, y, txt, col, t: 0 }); if (floats.length > 12) floats.shift(); };
onFrame('shake', dt => { shake = Math.max(0, shake - dt); for (const f of floats) f.t += dt; while (floats.length && floats[0].t > 1.3) floats.shift(); });
