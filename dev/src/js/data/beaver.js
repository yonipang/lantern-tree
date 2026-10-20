// ================= v114 자동 생산 2: 비버 둥지 · 먹이통 =================
// 기획: dev/design/자동생산.md 3장 (2026-10-20 확정 — 수치는 사용자가 고른 추천표 + 먹이통). 동작은 sim/beaver.js.
// 비버는 이끼 동굴 물가에 살고(올가미로 잡아 「비버」 아이템), 둥지에 넣으면 둥지 둘레 NEST_R칸 안의 다 자란 나무를
// NEST_EVERY초마다 하나씩 베어 와요. 먹이는 둥지 둘레 NEST_R칸 안의 먹이통에서 먹고, 먹이가 없으면 둥지에서 잠들어요.
import { ANIMALS } from './gear-animals.js';
import { ITEMS, OBJ, RECIPES, Rc, TIPS } from './items.js';

export const NEST_R = 3;        // 둥지 둘레 몇 칸 (나무 베기·먹이통 찾기 모두, 7×7)
export const NEST_EVERY = 30;   // 한 그루 베는 데 걸리는 초 (뿌리기둥이면 1분에 나무 약 5개 — 구리 채굴기와 비슷하게)
export const NEST_CAP = 60;     // 옆 상자가 없을 때 둥지 안에 쌓이는 최대 개수 (채굴기와 같게)
export const FEED_SLOTS = 4;    // 먹이통 칸 수
export const BEAVER_WATER_R = 6; // 이끼 동굴에서 물 몇 칸 안에 서 있으면 비버가 먼저 나와요
// 먹이 하나로 몇 초 일하는지 (이 표에 한 줄 더하면 새 먹이가 돼요 — 별 작물은 아까워서 먹이로 쓰지 않아요)
export const FEED = { berry: 60, mushroom: 60, cbean: 120, fireBerry: 120, radish: 120 };

ANIMALS.beaver = { n: '비버', biome: 0, worker: 1, spd: 1.1, col: '#9a6a44' }; // 일꾼: 펫·목장 동물이 아니에요 (목장 퀘스트에도 안 셈)
Object.assign(ITEMS, {
  beaver: { n: '비버', kind: 'beaver', stack: 9, d: '이끼 동굴 물가에서 데려온 비버. 비버 둥지 앞에서 누르면 둥지에 들어가 둘레의 나무를 베어 와요.' },
  beaverNest: { n: '비버 둥지', kind: 'place', obj: 'beaverNest', d: `비버를 넣으면 둘레 ${NEST_R}칸 안의 다 자란 나무를 ${NEST_EVERY}초마다 하나씩 베어 옆 상자에 담아요. 벤 나무는 어린나무로 돌아가 다시 자라요. 먹이는 둘레의 먹이통에서 먹어요.` },
  feeder: { n: '먹이통', kind: 'place', obj: 'feeder', d: `비버의 먹이를 담는 통 (${FEED_SLOTS}칸). 통통베리·버섯은 1분, 수정 콩·불꽃 열매·서리 무는 2분 동안 일하게 해요. 둘레 ${NEST_R}칸 안의 비버 둥지가 같이 써요.` },
});
OBJ.beaverNest = { n: '비버 둥지', solid: 1, item: 'beaverNest', nest: 1 };
OBJ.feeder = { n: '먹이통', solid: 1, item: 'feeder', feeder: 1 };
// 작업대(기본)에서 · 편의 → 농사 탭 (2026-10-20 사용자 선택)
RECIPES.push(Object.assign(Rc('beaverNest', 1, [['wood', 12], ['dirt', 10], ['rope', 2]], 'bench', 'farm'), { tier: 0 }),
  Object.assign(Rc('feeder', 1, [['wood', 6], ['rope', 1]], 'bench', 'farm'), { tier: 0 }));
TIPS.push('이끼 동굴 물가에서 비버를 올가미로 데려와 비버 둥지에 넣으면, 먹이통의 먹이를 먹으며 둘레의 나무를 베어 와요.');
