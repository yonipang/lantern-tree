// ================= v115 자동 생산 3: 광석 그물 =================
// 기획: dev/design/자동생산.md 4장 (2026-10-20 확정 — 수치는 사용자가 고른 추천표대로). 동작은 sim/sieve.js.
// 흔한 지형 재료를 넣어 두면 재료 하나마다 SIEVE_T초가 지나 아래 표대로 하나가 나와요(꽝이면 아무것도 없음).
// 용광로처럼 넣어 두고 나중에 꺼내요(v59 방식, 게임을 꺼 둔 동안에도 진행). 힘(빛)은 필요 없어요.
import { ITEMS, OBJ, RECIPES, Rc, TIPS } from './items.js';

export const SIEVE_T = 8;     // 재료 하나에 걸리는 초 (모두 같음)
export const SIEVE_MAX = 30;  // 한 번에 넣는 최대 개수 (용광로와 같음)
// 넣는 것 → [[나오는 것(null = 꽝), 확률 %], …] — 합은 100. 드문 것은 「다음 지역 재료 맛보기」
const T_MOSS = [[null, 55], ['stone', 25], ['copperOre', 18], ['ironOre', 2]];
const T_CRY = [[null, 55], ['stone', 15], ['crystal', 25], ['cryGem', 5]];
const T_LAVA = [[null, 55], ['stone', 15], ['goldOre', 25], ['obsidian', 5]];
const T_ICE = [[null, 70], ['frostShard', 25], ['goldOre', 5]];
export const SIEVE = {
  dirt: T_MOSS, gMoss: T_MOSS,                                                   // 이끼 동굴
  stone: [[null, 55], ['copperOre', 22], ['ironOre', 20], ['crystal', 3]],     // 이끼·버섯숲
  gShroom: [[null, 50], ['dirt', 20], ['ironOre', 25], ['glowcap', 5]],        // 버섯숲
  granite: T_CRY, gCrystal: T_CRY,                                               // 수정 동굴
  basalt: T_LAVA, gAsh: T_LAVA,                                                  // 용암 동굴
  iceBlock: T_ICE, gSnow: T_ICE,                                                 // 얼음 동굴
};
// 그 재료의 「지역 광석」(돌·흙을 뺀 가장 흔한 것) — 다 된 그물 위에 떠오르는 아이콘·창의 대표 그림
export const sieveOre = id => { let b = null; for (const [o, p] of SIEVE[id] || []) if (o && o !== 'stone' && o !== 'dirt' && (!b || p > b[1])) b = [o, p]; return b ? b[0] : 'stone'; };
// 덩어리 재료: 그물 위에서 톡톡 부서지는 효과 (그림만, render/world.js)
export const SIEVE_CHUNK = { stone: '#9a93a8', granite: '#c9a9a0', basalt: '#4a4058', iceBlock: '#bfe8ff' };
// 거르는 재료의 가루 색 (그물 아래로 떨어지는 효과)
export const SIEVE_DUST = { dirt: '#9a6a44', gMoss: '#7fb86a', gShroom: '#8a6a9a', gCrystal: '#c9b8ff', gAsh: '#6a6070', gSnow: '#f0f8ff' };

ITEMS.oreNet = { n: '광석 그물', kind: 'place', obj: 'oreNet', d: `흙·돌·화강암·현무암·얼음 덩이와 이끼 흙·버섯흙·수정 모래·재·눈을 넣어 두면 하나에 ${SIEVE_T}초씩 걸러서, 가끔 그 지역의 광석이나 보석이 나와요. 빛이 없어도 일해요.` };
OBJ.oreNet = { n: '광석 그물', solid: 1, item: 'oreNet', sieve: 1 };
// 구리 작업대 · 편의 → 채굴기 탭 (2026-10-20 사용자 선택: 추천대로)
RECIPES.push(Object.assign(Rc('oreNet', 1, [['wood', 8], ['rope', 4], ['copperBar', 2]], 'bench', 'mine'), { tier: 1 }));
TIPS.push('바닥을 파거나 벽을 캐서 남은 흙·돌은 광석 그물에 넣어 두면, 가끔 그 지역의 광석이나 보석이 걸려 나와요.');
