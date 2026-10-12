// ================= v65 조작 데이터 (구조 변경 2단계: features/controls.js에서 데이터만 옮김) =================
// 도구 종류, 도끼 → 나무 베기 도구(베는 힘·단계·설명), 쳐서 회수(몇 번·몇 초 안에) — 숫자와 설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 features/controls.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { ITEMS, RECIPES } from './items.js';

// ---- tools ----
export const TOOL_KINDS = ['pick', 'axe', 'sickle', 'shovel', 'wcan', 'rod', 'lasso'];
// axes stop being weapons and become the tree-cutting tool (power = how fast they cut, like a pickaxe's power)
export const AXE_TOOL = { axeStone: [1.6, 0, '돌로 만든 도끼. 나무를 손이나 곡괭이보다 빨리 베어요.'], axeCopper: [3.2, 1, '단단한 구리 도끼. 큰 나무도 금방 베어요.'], axeIron: [4.8, 2, '날이 선 철 도끼. 어떤 나무든 몇 번이면 베어요.'] };
for (const id in AXE_TOOL) { const it = ITEMS[id]; if (!it) continue; it.kind = 'axe'; [it.power, it.tier, it.d] = AXE_TOOL[id]; delete it.dmg; delete it.wt; }
for (const r of RECIPES) if (AXE_TOOL[r.out]) r.cat = 'tool';
// ---- hit a placed piece three times and it falls on the floor ----
export const RECOVER_HITS = 3, RECOVER_GAP = 2; // hits · seconds (game time) the hits may be apart
