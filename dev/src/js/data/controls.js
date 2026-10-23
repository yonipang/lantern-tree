// ================= v65 조작 데이터 (구조 변경 2단계: features/controls.js에서 데이터만 옮김) =================
// 도구 종류, 도끼 → 나무 베기 도구(베는 힘·단계·설명), 쳐서 회수(몇 번·몇 초 안에) — 숫자와 설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 features/controls.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { ITEMS, RECIPES } from './items.js';

// ---- tools ----
export const TOOL_KINDS = ['pick', 'axe', 'sickle', 'shovel', 'wcan', 'rod', 'lasso', 'bucket']; // v87: 빈 양동이
// axes stop being weapons and become the tree-cutting tool (power = how fast they cut, like a pickaxe's power)
export const AXE_TOOL = { axeStone: [1.6, 0, '돌로 만든 도끼. 나무를 손이나 곡괭이보다 빨리 베어요.'], axeCopper: [3.2, 1, '단단한 구리 도끼. 큰 나무도 금방 베어요.'], axeIron: [4.8, 2, '날이 선 철 도끼. 어떤 나무든 몇 번이면 베어요.'] };
for (const id in AXE_TOOL) { const it = ITEMS[id]; if (!it) continue; it.kind = 'axe'; [it.power, it.tier, it.d] = AXE_TOOL[id]; delete it.dmg; delete it.wt; }
for (const r of RECIPES) if (AXE_TOOL[r.out]) r.cat = 'tool';
// ---- hit a placed piece three times and it falls on the floor ----
export const RECOVER_HITS = 3, RECOVER_GAP = 2; // hits · seconds (game time) the hits may be apart

// v139 자연물 치는 횟수 (나무·바위·결정 = 3번, 덤불·선인장·작은 바위·뼈 = 2번, 풀·꽃·빛버섯 = 1번 — 도구와 상관없이, 어린 나무는 1번 적게)
export const natHits = hp => hp >= 3 ? 3 : hp >= 2 ? 2 : 1;
// v139 자연물을 칠 때 다음 치기까지 간격(초) = 0.28 ÷ (도구 힘 × 캐는 배율)^0.25, 0.14초 아래로는 안 가요 (예전 모두 0.28)
// 도구 힘(나무 곡괭이 1 · 돌 도끼 1.6 · 구리 곡괭이 2 · 구리 도끼 3.2 · 철 도끼 4.8 · 별빛 곡괭이 7) → 0.28 · 0.25 · 0.24 · 0.21 · 0.19 · 0.17초
export const CHOP_CD = { base: .28, exp: .25, min: .14 };
