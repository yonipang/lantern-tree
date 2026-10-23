// ================= v122 받은 그림 넣기 (dev/design/그림에셋.md) =================
// 사용자가 올린 에셋(Fantasyville·현대 팩·GL 타일·나무·덤불 시트 …)에서 잘라 낸 그림(dev/art/)으로 가구·러그·자연 꾸미기·물 위 소품·마을 꾸미기·바닥·벽을 더하고,
// 침대·2인 침대·둥근 탁자·긴 식탁은 새 그림에 맞춰 칸을 키워요(옛 세이브는 save/migrations.js grow122).
// 레시피는 Claude 임시(2026-10-21 사용자 확인): 작업대, 같은 종류의 지금 가구 재료 + 색 꽃잎(초록 = 이끼 흙, 보라 = 빨강 1 + 파랑 1). 단계는 재료로 정해요(recipeTier).
// 이 파일은 data/sieve.js 다음에 와요 (작업대 단계 나누기 data/automation-tiers.js 뒤라서 단계를 직접 적어요).
import { BUILT_WALLS, ITEMS, OBJ, RECIPES, Rc, USE, WALLS } from './items.js';
import { MULTI } from './quests.js';
import { FLOOR_ITEM } from './rpg-nature.js';
import { recipeTier } from './automation-tiers.js';

// ---- 칸이 커지는 것 (새 그림 크기) ----
export const GROW122 = { bed: [2, 3], bedDouble: [2, 3], table: [2, 2], longTable: [3, 2] };
for (const id in GROW122) OBJ[id].sz = GROW122[id];
// v134 (dev/design/그림에셋.md 「v134에 넣은 것」): 받은 제작대 그림에 맞춰 장비제작대(보석·세공대)·용광로(큰 화로)도 2×1로 커져요. 옛 세계는 save/migrations.js grow134
export const GROW134 = { smelter: [2, 1], furnace: [2, 1] };
for (const id in GROW134) OBJ[id].sz = GROW134[id];
ITEMS.bed.d = '기절하면 침대에서 깨어나요. (2×3)';
ITEMS.table.d = '차를 마실 수 있는 둥근 탁자 (2×2).';
ITEMS.bedDouble.d = MULTI.bedDouble[1] = '둘이 누워도 넉넉한 커다란 침대 (2×3).';
ITEMS.longTable.d = MULTI.longTable[1] = '여럿이 둘러앉는 긴 식탁 (3×2). 가로·세로로 돌릴 수 있어요.';

// ---- 새 물건: id: [이름, 설명, 재료, 분류(제작 창), 칸(없으면 1칸), 물체 속성, 쓰기, 가구 탭] ----
export const DECO122 = (() => { const cW = 'wood', cF = 'fiber', cR = 'rope', cS = 'stone', cD = 'dirt', cM = 'gMoss', pR = 'petalR', pB = 'petalB', pY = 'petalY', pW = 'petalW';
const BED = [[cW, 8], [cF, 6], [cR, 2]], SOFA = [[cW, 8], [cF, 10], [cR, 2]], SOLID = { solid: 1 };
return {
  bedRed: ['빨간 침대', '빨간 이불을 덮은 침대 (2×3). 기절하면 침대에서 깨어나요.', [...BED, [pR, 2]], 'furn', [2, 3], { solid: 1, bed: 1 }, 'sleep', 'bed'],
  bedGreen: ['초록 침대', '초록 이불을 덮은 침대 (2×3). 기절하면 침대에서 깨어나요.', [...BED, [cM, 2]], 'furn', [2, 3], { solid: 1, bed: 1 }, 'sleep', 'bed'],
  bedPurple: ['보라 침대', '보라 이불을 덮은 침대 (2×3). 기절하면 침대에서 깨어나요.', [...BED, [pR, 1], [pB, 1]], 'furn', [2, 3], { solid: 1, bed: 1 }, 'sleep', 'bed'],
  sofaYellow: ['노란 소파', '폭신한 노란 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [...SOFA, [pY, 2]], 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit', 'seat'],
  sofaBlue: ['파란 소파', '폭신한 파란 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [...SOFA, [pB, 2]], 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit', 'seat'],
  sofaPurple: ['보라 소파', '폭신한 보라 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [...SOFA, [pR, 1], [pB, 1]], 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit', 'seat'],
  sofaRed: ['빨간 소파', '폭신한 빨간 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [...SOFA, [pR, 2]], 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit', 'seat'],
  chairGreen: ['초록 방석 의자', '초록 방석을 깐 나무 의자. 앉을 수 있어요.', [[cW, 4], [cM, 1]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairYellow: ['노란 방석 의자', '노란 방석을 깐 나무 의자. 앉을 수 있어요.', [[cW, 4], [pY, 1]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairBlue: ['파란 방석 의자', '파란 방석을 깐 나무 의자. 앉을 수 있어요.', [[cW, 4], [pB, 1]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairPurple: ['보라 방석 의자', '보라 방석을 깐 나무 의자. 앉을 수 있어요.', [[cW, 4], [pR, 1], [pB, 1]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairRed: ['빨간 방석 의자', '빨간 방석을 깐 나무 의자. 앉을 수 있어요.', [[cW, 4], [pR, 1]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  benchLow: ['낮은 긴 의자', '여럿이 나란히 앉는 낮은 의자 (2×1).', [[cW, 6], [cF, 2]], 'furn', [2, 1], SOLID, 'sit', 'seat'],
  chairWood: ['등받이 의자', '등받이가 높은 나무 의자. 앉을 수 있어요.', [[cW, 4]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairCafe: ['카페 의자', '격자 등받이 의자. 앉을 수 있어요.', [[cW, 4]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  chairLadder: ['사다리 의자', '가로살 등받이 의자. 앉을 수 있어요.', [[cW, 4]], 'furn', null, { solid: 1, dir4: 1 }, 'sit', 'seat'],
  desk: ['서랍 책상', '서랍이 달린 나무 책상 (2×1).', [[cW, 8], ['resin', 1]], 'furn', [2, 1], SOLID, null, 'table'],
  nightstand: ['협탁', '침대 곁에 두는 작은 서랍장.', [[cW, 4]], 'furn', null, SOLID, null, 'store'],
  dresserLong: ['긴 서랍장', '서랍이 셋 달린 낮고 긴 서랍장 (3×1).', [[cW, 12], ['resin', 1]], 'furn', [3, 1], SOLID, null, 'store'],
  shelfEmpty: ['빈 책장', '아직 아무것도 꽂지 않은 책장 (2×1).', [[cW, 10], ['resin', 1]], 'furn', [2, 1], SOLID, null, 'store'],
  drawers: ['유리 서랍장', '유리문이 달린 서랍장 (2×1).', [[cW, 8], ['resin', 1]], 'furn', [2, 1], SOLID, null, 'store'],
  shelfGoods: ['물건 놓인 선반', '책과 바구니가 놓인 선반 (2×1).', [[cW, 10], [cF, 2]], 'furn', [2, 1], SOLID, null, 'store'],
  wardrobeOak: ['참나무 옷장', '두 문짝 옷장 (2×1). [꾸미기]로 캐릭터를 바꾸고 꾸밀 수 있어요.', [[cW, 10], [cF, 4]], 'furn', [2, 1], SOLID, 'dress', 'store'],
  wardrobeGlass: ['유리문 옷장', '유리문이 달린 옷장 (2×1). [꾸미기]로 캐릭터를 바꾸고 꾸밀 수 있어요.', [[cW, 10], [cF, 4], ['resin', 1]], 'furn', [2, 1], SOLID, 'dress', 'store'],
  wardrobeBig: ['큰 옷장', '키 큰 두 문짝 옷장 (2×1). [꾸미기]로 캐릭터를 바꾸고 꾸밀 수 있어요.', [[cW, 12], [cF, 4]], 'furn', [2, 1], SOLID, 'dress', 'store'],
  bannerPurple: ['보라 깃발', '벽에 거는 보라 깃발.', [[cF, 4], [cR, 1], [pR, 1], [pB, 1]], 'furn', null, SOLID, null, 'deco'],
  bannerRed: ['빨간 깃발', '벽에 거는 빨간 깃발.', [[cF, 4], [cR, 1], [pR, 1]], 'furn', null, SOLID, null, 'deco'],
  bannerWhite: ['하얀 깃발', '벽에 거는 하얀 깃발.', [[cF, 4], [cR, 1], [pW, 1]], 'furn', null, SOLID, null, 'deco'],
  bannerGreen: ['초록 깃발', '벽에 거는 초록 깃발.', [[cF, 4], [cR, 1], [cM, 1]], 'furn', null, SOLID, null, 'deco'],
  palmPot: ['야자 화분', '잎이 넓은 작은 야자 화분. 물을 줄 수 있어요.', [[cD, 2], ['sapling', 1]], 'furn', null, SOLID, 'water', 'deco'],
  bushPot: ['덤불 화분', '동글동글한 덤불 화분. 물을 줄 수 있어요.', [[cD, 2], ['sapling', 1]], 'furn', null, SOLID, 'water', 'deco'],
  plantBig: ['큰 화분', '키 큰 나무 화분. 물을 줄 수 있어요.', [[cD, 2], ['sapling', 1]], 'furn', null, SOLID, 'water', 'deco'],
  palmBig: ['큰 야자 화분', '키 큰 야자 화분. 물을 줄 수 있어요.', [[cD, 2], ['sapling', 1]], 'furn', null, SOLID, 'water', 'deco'],
  jarOrange: ['주황 항아리', '반들반들한 주황 항아리.', [[cD, 3], ['resin', 1], [pY, 1]], 'furn', null, SOLID, null, 'deco'],
  jarRed: ['빨간 항아리', '반들반들한 빨간 항아리.', [[cD, 3], ['resin', 1], [pR, 1]], 'furn', null, SOLID, null, 'deco'],
  jarBlue: ['파란 항아리', '반들반들한 파란 항아리.', [[cD, 3], ['resin', 1], [pB, 1]], 'furn', null, SOLID, null, 'deco'],
  flowerPotPurple: ['보라 꽃 화분', '보라 꽃이 핀 화분. 물을 줄 수 있어요.', [[cD, 2], [pR, 1], [pB, 1]], 'furn', null, SOLID, 'water', 'deco'],
  flowerPotRed: ['빨간 꽃 화분', '빨간 꽃이 핀 화분. 물을 줄 수 있어요.', [[cD, 2], [pR, 2]], 'furn', null, SOLID, 'water', 'deco'],
  flowerBasket: ['꽃바구니', '꽃을 가득 담은 바구니.', [[cF, 4], [pY, 1], [pR, 1]], 'furn', null, SOLID, null, 'deco'],
  // 러그 (위로 걸어 다닐 수 있어요)
  carpetPurple: ['보라 카펫', '네모난 보라 카펫 (2×2). 위로 걸어 다닐 수 있어요.', [[cF, 12], [pR, 1], [pB, 1]], 'furn', [2, 2], { flat: 1 }, null, 'deco'],
  carpetGreen: ['초록 카펫', '네모난 초록 카펫 (2×2). 위로 걸어 다닐 수 있어요.', [[cF, 12], [cM, 2]], 'furn', [2, 2], { flat: 1 }, null, 'deco'],
  carpetRed: ['빨간 카펫', '네모난 빨간 카펫 (2×2). 위로 걸어 다닐 수 있어요.', [[cF, 12], [pR, 2]], 'furn', [2, 2], { flat: 1 }, null, 'deco'],
  rugRetro: ['줄무늬 큰 러그', '빨강·노랑 줄무늬 큰 러그 (4×3). 위로 걸어 다닐 수 있어요.', [[cF, 20], [pR, 2], [pY, 2]], 'furn', [4, 3], { flat: 1 }, null, 'deco'],
  rugRetroTall: ['줄무늬 긴 러그', '빨강·노랑 줄무늬 긴 러그 (3×4). 위로 걸어 다닐 수 있어요.', [[cF, 20], [pR, 2], [pY, 2]], 'furn', [3, 4], { flat: 1 }, null, 'deco'],
  matBlue: ['파란 매트', '작은 파란 매트 (2×1). 위로 걸어 다닐 수 있어요.', [[cF, 6], [pB, 1]], 'furn', [2, 1], { flat: 1 }, null, 'deco'],
  matGreen: ['초록 매트', '작은 초록 매트 (2×1). 위로 걸어 다닐 수 있어요.', [[cF, 6], [cM, 1]], 'furn', [2, 1], { flat: 1 }, null, 'deco'],
  matBrown: ['갈색 매트', '작은 갈색 매트 (2×1). 위로 걸어 다닐 수 있어요.', [[cF, 6], [cD, 1]], 'furn', [2, 1], { flat: 1 }, null, 'deco'],
  rugPattern: ['무늬 러그', '마름모 무늬가 들어간 러그 (3×2). 가로·세로로 돌릴 수 있고, 위로 걸어 다닐 수 있어요.', [[cF, 14], [cR, 2], [pR, 1]], 'furn', [3, 2], { flat: 1, rotV: 1 }, null, 'deco'],
  rugOval: ['타원 러그', '작은 타원 러그 (2×1). 위로 걸어 다닐 수 있어요.', [[cF, 6], [pR, 1]], 'furn', [2, 1], { flat: 1 }, null, 'deco'],
  // 자연 꾸미기 (제작 창 건축 → 자연)
  mossStone: ['이끼 돌', '이끼가 덮인 작은 돌.', [[cS, 3], [cM, 1]], 'nature', null, SOLID],
  pinkFlower: ['분홍 꽃', '땅에 낮게 핀 분홍 꽃. 위로 걸어 다닐 수 있어요.', [[cD, 1], [pR, 1]], 'nature', null, { flat: 1 }],
  redBud: ['빨간 꽃봉오리', '동그란 빨간 꽃봉오리.', [[cD, 1], [pR, 1]], 'nature', null, {}],
  darkBush: ['짙은 덤불', '잎이 촘촘한 짙은 덤불 (2×1).', [[cM, 2], [cF, 4]], 'nature', [2, 1], SOLID],
  orangeBush: ['주황 꽃 덤불', '주황 꽃이 핀 덤불 (2×1).', [[cM, 2], [pY, 1]], 'nature', [2, 1], SOLID],
  fern: ['고사리', '잎을 활짝 편 고사리 (2×1).', [[cM, 2], [cF, 4]], 'nature', [2, 1], SOLID],
  redLeafPlant: ['붉은 잎 풀', '잎 끝이 붉은 풀 (2×1).', [[cM, 2], [pR, 1]], 'nature', [2, 1], SOLID],
  redMushrooms: ['빨간 버섯 무리', '빨간 버섯이 모여 난 자리 (2×1).', [['mushroom', 3], [cD, 1]], 'nature', [2, 1], SOLID],
  stalagmite: ['종유석', '바닥에서 솟은 뾰족한 종유석.', [[cS, 4]], 'nature', null, SOLID],
  glowVineTree: ['빛 덩굴 나무', '빛나는 덩굴이 늘어진 커다란 나무 (2×2). 베면 없어지고 뿌리기둥 묘목 1개를 줘요.', [[cD, 8], [cM, 8], [cW, 16], ['sapling', 2], ['glowcap', 2]], 'nature', [2, 2], { solid: 1, ntree: 1, nat: 'cut', hp: 10, drops: [[cW, 6, 9, 1], ['resin', 1, 2, 0.6]], light: [2.5, '#e8f08a'] }],
  // 물 위 소품: 물 칸에만 놓아요
  lilyPad: ['연잎', '물 위에 띄우는 연잎. 물 칸에만 놓아요.', [[cF, 2]], 'nature', null, { flat: 1, water: 1 }],
  lotus: ['연꽃', '물 위에 띄우는 분홍 연꽃. 물 칸에만 놓아요.', [[cF, 2], [pR, 1]], 'nature', null, { flat: 1, water: 1 }],
  lotus2: ['하얀 연꽃', '물 위에 띄우는 하얀 연꽃. 물 칸에만 놓아요.', [[cF, 2], [pW, 1]], 'nature', null, { flat: 1, water: 1 }],
  waterRock: ['물속 이끼 바위', '물 위로 고개를 내민 이끼 바위 (2×1). 물 칸에만 놓아요.', [[cS, 4], [cM, 1]], 'nature', [2, 1], { solid: 1, water: 1 }],
  waterRockS: ['작은 물속 바위', '물 위로 살짝 나온 바위. 물 칸에만 놓아요.', [[cS, 2]], 'nature', null, { solid: 1, water: 1 }],
  waterReed: ['물풀', '물가에 자라는 연둣빛 물풀. 물 칸에만 놓아요.', [[cF, 3]], 'nature', null, { solid: 1, water: 1 }],
  waterReedS: ['작은 물풀', '작은 물풀. 물 칸에만 놓아요.', [[cF, 2]], 'nature', null, { solid: 1, water: 1 }],
  pondRock: ['물가 바위', '물에 잠긴 큰 바위 (2×1). 물 칸에만 놓아요.', [[cS, 6]], 'nature', [2, 1], { solid: 1, water: 1 }],
  pondRockS: ['작은 물가 바위', '물에 잠긴 길쭉한 바위. 물 칸에만 놓아요.', [[cS, 3]], 'nature', null, { solid: 1, water: 1 }],
  // 마을 꾸미기
  streetLamp: ['쌍둥이 가로등', '등이 두 개 달린 가로등 (2×1). 눌러서 켜고 꺼요.', [['copperBar', 2], [cS, 4]], 'furn', [2, 1], { solid: 1, light: [5.5, '#ffd27a'], offDim: 1 }, 'lamp', 'light'],
  hangLamp: ['걸이 등불', '나무 기둥에 등불을 건 등 (2×1). 눌러서 켜고 꺼요.', [['copperBar', 1], [cW, 4]], 'furn', [2, 1], { solid: 1, light: [4.5, '#ffd27a'], offDim: 1 }, 'lamp', 'light'],
  well: ['우물', '두레박이 달린 돌 우물 (2×2).', [[cS, 20], [cW, 4], ['gWater', 2]], 'furn', [2, 2], SOLID, null, 'deco'],
  flowerBoxFv: ['노란 꽃 상자', '노란 꽃을 심은 나무 상자 (2×1). 물을 줄 수 있어요.', [[cW, 3], [cD, 2], [pY, 2]], 'furn', [2, 1], SOLID, 'water', 'deco'],
  crateFruit: ['열매 상자', '빨간 열매를 담은 나무 상자 (2×1).', [[cW, 3], ['berry', 3]], 'furn', [2, 1], SOLID, null, 'store'],
  crateGreens: ['채소 상자', '초록 채소를 담은 나무 상자 (2×1).', [[cW, 3], [cF, 3]], 'furn', [2, 1], SOLID, null, 'store'],
  cropSign: ['작물 팻말', '밭 앞에 세우는 나무 팻말.', [[cW, 2]], 'furn', null, SOLID, null, 'deco'],
  bigChest: ['큰 보물상자', '쇠테를 두른 커다란 보물상자 (2×1). 장식이에요.', [[cW, 10], ['copperBar', 2]], 'furn', [2, 1], SOLID, null, 'store'],
}; })();
// v123 가구 단계 (사용자 확정 2026-10-21, 추천표대로): 그 단계 금속을 1~2개 더해 레시피 단계를 옮겨요(단계는 재료로 정해져요 — recipeTier).
// 기본 작업대는 그대로. 구리 = 침대·소파·서랍·카펫·러그·우물·조명·물 위 소품·벽돌 바닥 … / 철 = 옷장·선반·큰 화분·쪽매·타일 바닥 / 석영 = 유리 가구·빛 덩굴 나무
const CU = n => [['copperBar', n]], FE = n => [['ironBar', n]], QZ = n => [['quartzR', n]];
export const TIER123 = {
  bedRed: CU(2), bedGreen: CU(2), bedPurple: CU(2), sofaYellow: CU(1), sofaBlue: CU(1), sofaPurple: CU(1), sofaRed: CU(1),
  desk: CU(1), dresserLong: CU(2), chairCafe: CU(1), carpetPurple: CU(1), carpetGreen: CU(1), carpetRed: CU(1), rugRetro: CU(1), rugRetroTall: CU(1), rugPattern: CU(1),
  well: CU(2), flowerBoxFv: CU(1), lilyPad: CU(1), lotus: CU(1), lotus2: CU(1), waterRock: CU(1), waterRockS: CU(1), waterReed: CU(1), waterReedS: CU(1), pondRock: CU(1), pondRockS: CU(1),
  floorBrickRed: CU(1), floorCheck: CU(1), wallRedWood: CU(1),
  wardrobeOak: FE(2), wardrobeBig: FE(2), shelfGoods: FE(1), plantBig: FE(1), palmBig: FE(1), floorHerring: FE(1), floorTileRed: FE(1),
  wardrobeGlass: QZ(2), drawers: QZ(1), glowVineTree: QZ(2),
};
const withTier = (id, req) => req.concat(TIER123[id] || []);
for (const id in DECO122) { const [n, d, req0, cat, sz, ex, use] = DECO122[id]; const req = withTier(id, req0);
  ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = Object.assign({ n, item: id }, sz ? { sz } : {}, ex); if (use) USE[id] = use;
  const r = Rc(id, 1, req, 'bench', cat); r.tier = recipeTier(r); RECIPES.push(r); }

// ---- 새 바닥 (30~34, 22는 구덩이 PIT라 건너뜀)·새 벽 (14·15) ----
export const FLOOR122 = { floorPlank: [30, '판자 바닥', '밝은 나무판을 깔아요.', [['wood', 2]]], floorBrickRed: [31, '붉은 벽돌 바닥', '붉은 벽돌을 깔아요.', [['stone', 2], ['dirt', 1]]],
  floorCheck: [32, '황토 체크 바닥', '황토색 체크무늬 타일을 깔아요.', [['stone', 2], ['dirt', 2]]], floorHerring: [33, '쪽매 바닥', '나무를 엇갈려 짠 쪽매 바닥을 깔아요.', [['wood', 3]]],
  floorTileRed: [34, '붉은 타일 바닥', '네모난 붉은 타일을 깔아요.', [['stone', 3]]] };
for (const id in FLOOR122) { const [f, n, d, req0] = FLOOR122[id]; const req = withTier(id, req0); ITEMS[id] = { n, kind: 'floor', floor: f, d }; FLOOR_ITEM[f] = id; const r = Rc(id, 4, req, 'bench', 'build'); r.tier = recipeTier(r); RECIPES.push(r); }
export const WALL122 = { wallPlank: [14, '판자 벽', '밝은 나무판을 세운 벽.', [['wood', 2]]], wallRedWood: [15, '붉은 나무 벽', '붉게 칠한 나무 벽.', [['wood', 2], ['resin', 1]]] };
for (const id in WALL122) { const [w, n, d, req0] = WALL122[id]; const req = withTier(id, req0); WALLS[w] = { n, tier: 0, hp: 3, drop: [[id, 1, 1, 1]] }; ITEMS[id] = { n, kind: 'wall', wall: w, d }; BUILT_WALLS.add(w); const r = Rc(id, 2, req, 'bench', 'build'); r.tier = recipeTier(r); RECIPES.push(r); }
