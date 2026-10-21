// ================= v123 지역마다 저절로 자라는 자연물 (dev/design/그림에셋.md · 기획-결정사항.md 2026-10-21) =================
// 사용자 선택(모두 추천대로): 지역별 추천 묶음 · 드문드문(지역 바닥의 약 1%, 큰 나무는 그 절반) · 베면 나무(나무는 묘목도 — sim/nature.js afterCut)
// · 옛 세계는 하루 하나 자연 재생(data/digging.js NAT_DAY_KINDS)으로 조금씩 · 쓰러진 통나무는 4×2칸.
// 그림은 받은 에셋(Trees_source·Assets_source)에서 잘라 아래 테두리만 지웠어요(dev/art/obj/<id>.raw.png). 작업대 「자연」에서 만들어 놓을 수도 있어요(레시피는 Claude 임시).
// 놓는 일(새 세계)은 world/gen.js addNature123, 하루 하나는 sim/nature.js가 NAT_DAY_KINDS를 봐요. 이 파일은 data/decor122.js 다음에 와요.
import { ITEMS, OBJ, RECIPES, Rc } from './items.js';
import { NAT_DAY_KINDS } from './digging.js';
import { recipeTier } from './automation-tiers.js';

// 종류별 규칙: 나무 = 베면 나무 3~5 + 묘목 1(ntree), 덤불 = 나무 1~2·섬유, 그루터기 = 나무 2~3, 선인장 = 섬유, 통나무 = 나무 4~6 (모두 도끼로 「베기」)
const KIND = {
  tree: { solid: 1, ntree: 1, nat: 'chop', hp: 5, drops: [['wood', 3, 5, 1], ['resin', 1, 1, 0.3]] },
  bush: { solid: 1, nat: 'chop', hp: 2, drops: [['wood', 1, 2, 1], ['fiber', 1, 1, 0.5]] },
  stump: { solid: 1, nat: 'chop', hp: 3, drops: [['wood', 2, 3, 1]] },
  cactus: { solid: 1, nat: 'chop', hp: 2, drops: [['fiber', 1, 2, 1]] },
  log: { solid: 1, nat: 'chop', hp: 6, sz: [4, 2], drops: [['wood', 4, 6, 1], ['resin', 1, 1, 0.4]] },
};
// id: [이름, 설명, 종류, 레시피(작업대 · 자연)]
export const NAT123 = {
  greenTree: ['초록 나무', '이끼 동굴에서 자라는 동그란 초록 나무.', 'tree', [['dirt', 4], ['gMoss', 4], ['wood', 4]]],
  vineTree: ['덩굴 나무', '노란 덩굴이 늘어진 이끼 동굴의 나무.', 'tree', [['dirt', 4], ['gMoss', 4], ['wood', 4]]],
  pinkTree: ['분홍 나무', '버섯숲에서 자라는 분홍 잎 나무.', 'tree', [['dirt', 4], ['gShroom', 4], ['wood', 4]]],
  pinkTreeS: ['작은 분홍 나무', '버섯숲의 작은 분홍 잎 나무.', 'tree', [['dirt', 2], ['gShroom', 2], ['wood', 2]]],
  mapleTree: ['단풍나무', '버섯숲에서 자라는 붉은 단풍나무.', 'tree', [['dirt', 4], ['gShroom', 4], ['wood', 4]]],
  mapleTreeS: ['작은 단풍나무', '버섯숲의 작은 단풍나무.', 'tree', [['dirt', 2], ['gShroom', 2], ['wood', 2]]],
  mapleBush: ['단풍 덤불', '붉게 물든 버섯숲 덤불.', 'bush', [['dirt', 2], ['gShroom', 2]]],
  treeStumpL: ['큰 그루터기', '나이테가 보이는 큰 그루터기.', 'stump', [['wood', 4], ['gShroom', 1]]],
  treeStump: ['그루터기', '버섯숲의 그루터기.', 'stump', [['wood', 3], ['gShroom', 1]]],
  treeStumpS: ['작은 그루터기', '버섯숲의 작은 그루터기.', 'stump', [['wood', 2], ['gShroom', 1]]],
  deadTree: ['마른 나무', '용암 동굴의 잎 없는 마른 나무.', 'tree', [['wood', 6], ['gAsh', 2]]],
  fallenLog: ['쓰러진 통나무', '용암 동굴에 쓰러져 있는 긴 통나무 (4×2).', 'log', [['wood', 10], ['gAsh', 2]]],
  cactus: ['선인장', '용암 동굴 가장자리의 선인장.', 'cactus', [['gAsh', 2], ['fiber', 2]]],
  cactusS: ['작은 선인장', '용암 동굴의 작은 선인장.', 'cactus', [['gAsh', 1], ['fiber', 1]]],
  snowTree: ['눈 덮인 나무', '얼음 동굴에서 자라는 눈 덮인 나무.', 'tree', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  blossomTree: ['눈꽃 나무', '가지마다 눈꽃이 핀 얼음 동굴의 나무.', 'tree', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  blossomTreeS: ['작은 눈꽃 나무', '얼음 동굴의 작은 눈꽃 나무.', 'tree', [['dirt', 2], ['gSnow', 2], ['wood', 2]]],
  snowBush: ['눈 덤불', '눈이 소복이 쌓인 덤불.', 'bush', [['dirt', 2], ['gSnow', 2]]],
  palmTree: ['야자나무', '물가에서 자라는 커다란 야자나무.', 'tree', [['dirt', 4], ['gMoss', 2], ['wood', 4]]],
  palmTreeS: ['작은 야자나무', '물가의 작은 야자나무.', 'tree', [['dirt', 2], ['gMoss', 1], ['wood', 2]]],
};
for (const id in NAT123) { const [n, d, kind, req] = NAT123[id]; const k = KIND[kind];
  ITEMS[id] = { n, kind: 'place', obj: id, d: d + (kind === 'tree' ? ' 베면 나무와 뿌리기둥 묘목을 줘요.' : ' 베면 ' + (kind === 'cactus' ? '이끼 섬유' : '나무') + '를 줘요.') };
  OBJ[id] = Object.assign({ n, item: id }, JSON.parse(JSON.stringify(k)));
  const r = Rc(id, 1, req, 'bench', 'nature'); r.tier = recipeTier(r); RECIPES.push(r); }

// 새 세계에 놓는 비율 (지역 바닥 칸 하나당 %, 둘레 3×3에 벽이 없는 열린 칸에만 — 좁은 굴을 막지 않게)
// 지역(biome): 0 이끼 동굴 · 1 버섯숲 · 2 수정 동굴(없음) · 3 용암 동굴 · 4 얼음 동굴. 큰 고목(v122 그림)도 이끼 동굴에 나요.
export const NAT_GEN = {
  0: [['greenTree', 0.2], ['vineTree', 0.15], ['bigTree', 0.15]],
  1: [['pinkTree', 0.12], ['pinkTreeS', 0.13], ['mapleTree', 0.12], ['mapleTreeS', 0.13], ['mapleBush', 0.2], ['treeStumpL', 0.1], ['treeStump', 0.1], ['treeStumpS', 0.1]],
  3: [['deadTree', 0.35], ['fallenLog', 0.15], ['cactus', 0.25], ['cactusS', 0.25]],
  4: [['snowTree', 0.2], ['blossomTree', 0.15], ['blossomTreeS', 0.15], ['snowBush', 0.5]],
};
// 물가(물 2칸 안, 이끼·버섯·수정 지역)의 야자나무: 그런 칸 하나당 %
export const NAT_SHORE = [['palmTree', 1.5], ['palmTreeS', 1.5]];
// 하루 하나 자연 재생에도 더해요(옛 세계에 조금씩) — 여러 칸인 큰 고목·통나무와 물가 야자는 빼요. 비율은 그 지역 다른 자연물과 같은 눈금(덤불 0.85 ≈ 1.4%)
NAT_DAY_KINDS[0].push(['greenTree', 0.12], ['vineTree', 0.1]);
NAT_DAY_KINDS[1].push(['pinkTree', 0.08], ['pinkTreeS', 0.08], ['mapleTree', 0.08], ['mapleTreeS', 0.08], ['mapleBush', 0.12], ['treeStumpL', 0.06], ['treeStump', 0.06], ['treeStumpS', 0.06]);
NAT_DAY_KINDS[3].push(['deadTree', 0.16], ['cactus', 0.11], ['cactusS', 0.11]);
NAT_DAY_KINDS[4].push(['snowTree', 0.1], ['blossomTree', 0.07], ['blossomTreeS', 0.07], ['snowBush', 0.25]);
