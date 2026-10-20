// ================= v113 자동 생산 1: 채굴기 레시피 · 채굴장과 나무 작업장 없애기 =================
// 기획: dev/design/자동생산.md 1·2장 (2026-10-20 확정). 동작: 채굴기는 sim/circuits.js(옛 v42 채굴기 그대로), 환급은 save/migrations.js refundAuto113.
// 이 파일은 shell.html에서 data/automation-tiers.js 바로 다음에 와요 — 「지형 재료 2배」·작업대 단계 나누기가 끝난 뒤라서
// 채굴장 레시피는 실제로 만들 때 든 재료(2배 뒤) 그대로 떼어 내 환급표로 쓰고, 새 채굴기 레시피는 단계를 직접 적어요.
import { RECIPES, Rc } from './items.js';

// 없어진 채굴장·나무 작업장: 아이템 id → 만들 때 든 재료 (옛 세이브에 남은 것을 이 재료로 돌려줘요)
export const OLD_AUTO = {};
for (const id of ['pitCu', 'pitFe', 'pitGold', 'quarry', 'treeFarm']) { const k = RECIPES.findIndex(r => r.out === id); if (k < 0) continue; OLD_AUTO[id] = RECIPES[k].req.map(([m, c]) => [m, c]); RECIPES.splice(k, 1); }
// 놓여 있던 옛 돌 채굴기(v42, 레시피 없음)는 계속 일하고, 회수하면 돌 채굴장 재료로 돌려줘요 (2026-10-20 사용자 선택)
OLD_AUTO.drillStone = OLD_AUTO.quarry;

// 채굴기 3단계: 구리·철·금 작업대에서 (2026-10-20 사용자 선택 — 옛 채굴장 레시피에서 광석만 뺀 것)
RECIPES.push(
  Object.assign(Rc('drillCu', 1, [['copperBar', 6], ['stone', 12], ['rope', 2]], 'bench', 'mine'), { tier: 1 }),
  Object.assign(Rc('drillFe', 1, [['ironBar', 6], ['copperBar', 4], ['crystal', 2]], 'bench', 'mine'), { tier: 2 }),
  Object.assign(Rc('drillGold', 1, [['goldBar', 4], ['obsidian', 4], ['ironBar', 4]], 'bench', 'mine'), { tier: 4 }));
