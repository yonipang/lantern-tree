// ================= v136 받은 그림 꾸미기 · 가구 제작대 (dev/design/그림에셋.md 「v136에 넣은 것」) =================
// 길드 홀·마법사 탑·낚시 마을·하수도 묶음과 pixel.zip(수정·지역 바위·버섯숲·유적 조각·열매나무)에서 잘라 낸 그림(dev/art/obj/).
// 사용자 결정(2026-10-23): 「일반 가구」 12가지만 만들 수 있고(가구 제작대), 나머지는 「꾸미기 전용」 — 만들 수 없고 세계(마을)에만 있어요.
// 꾸미기 전용은 개발자 모드 건축 목록 「꾸미기」 탭에서 재료 없이 놓아요(sim/buildmode.js) → 꾸민 마을은 설정의 개발자 칸에서 파일로 내보내요.
// 가구 제작대(fdesk): 작업대의 「집 가구」 레시피를 옮겨 와요(아래 MOVE136). 단계는 작업대 단계를 따라가요(sim/crafting.js stationTier).
import { ITEMS, OBJ, RECIPES, Rc, STN, USE } from './items.js';
import { recipeTier } from './automation-tiers.js';
import { DECO132 } from './winter132.js';

// ---- 가구 제작대 ----
ITEMS.fdesk = { n: '가구 제작대', kind: 'place', obj: 'fdesk', d: '의자·탁자·침대·책장·러그 같은 집 가구를 만들어요 (2×1). 단계는 작업대를 따라가요.' };
OBJ.fdesk = { n: '가구 제작대', item: 'fdesk', station: 'fdesk', solid: 1, sz: [2, 1] }; STN.fdesk = '가구 제작대';
{ const r = Rc('fdesk', 1, [['wood', 10], ['fiber', 6], ['resin', 1]], 'bench', 'furn'); r.tier = 0; RECIPES.push(r); }

// ---- 작업대에 남는 것: 제작대·상자·조명·포탈과 바깥의 큰 것(우물·분수·조리대·꽃 상자·채소·열매 상자·팻말·큰 보물상자·겨울 꾸미기). 나머지 「가구」는 가구 제작대로 ----
export const KEEP136 = new Set(['chest', 'bigChest', 'well', 'fountainBig', 'kitchenSet', 'flowerBox', 'flowerBoxFv', 'crateFruit', 'crateGreens', 'cropSign', ...Object.keys(DECO132)]);
export const MOVE136 = [];
for (const r of RECIPES) { if (r.at !== 'bench' || !['furn', 'moss', 'shroom', 'crystal'].includes(r.cat)) continue; /* 세트(이끼·버섯·수정) 가구도 — 바닥·벽은 물체가 없어 빠져요 */ const it = ITEMS[r.out], d = it && it.kind === 'place' && OBJ[it.obj]; if (!d || d.station || d.light || d.warp || d.chest || d.nat || KEEP136.has(r.out)) continue; r.at = 'fdesk'; MOVE136.push(r.out); }

// ---- 새 물건: id: [이름, 설명, 칸, 물체 속성, 재료(만들 수 있는 것만), 가구 탭, 쓰기] ----
export const DECO136 = {
  guildShelf: ["책 가득한 큰 책장", "책이 빼곡히 꽂힌 큰 책장. (3×1)", [3, 1], {"solid": 1}, [["wood", 16], ["resin", 2]], "store", null],
  guildShelfE: ["큰 빈 책장", "아무것도 없는 큰 책장. 물건을 올려 꾸며 봐요. (3×1)", [3, 1], {"solid": 1}, [["wood", 14], ["resin", 1]], "store", null],
  cabinet: ["나무 수납장", "문이 달린 낮은 수납장. (3×1)", [3, 1], {"solid": 1}, [["wood", 14], ["resin", 1], ["copperBar", 1]], "store", null],
  guildChair: ["나무 의자 (길드)", "등받이가 곧은 작은 나무 의자. 앉을 수 있어요.", [1, 1], {"solid": 1}, [["wood", 4]], "seat", "sit"],
  mageDesk: ["책상과 의자", "책과 안경이 놓인 책상과 의자 둘. (2×1)", [2, 1], {"solid": 1}, [["wood", 12], ["resin", 1], ["fiber", 2]], "table", null],
  vase2: ["보라 꽃병", "보라 꽃을 꽂은 검은 꽃병.", [1, 1], {"solid": 1}, [["dirt", 2], ["petalR", 1], ["petalB", 1]], "deco", null],
  mageRug: ["주황 러그", "둘레에 테를 두른 주황 러그. 위로 걸어 다닐 수 있어요. (3×2)", [3, 2], {"flat": 1}, [["fiber", 14], ["petalR", 1], ["petalY", 1]], "deco", null],
  ladder: ["나무 사다리", "벽에 기대 세우는 나무 사다리.", [1, 1], {"solid": 1}, [["wood", 4], ["rope", 1]], "deco", null],
  crateF: ["나무 궤짝", "널빤지로 짠 나무 궤짝.", [1, 1], {"solid": 1}, [["wood", 5]], "store", null],
  barrelF: ["나무 통", "쇠테를 두른 나무 통.", [1, 1], {"solid": 1}, [["wood", 6], ["rope", 1]], "store", null],
  sack: ["곡식 자루", "묶은 곡식 자루.", [1, 1], {"solid": 1}, [["fiber", 6]], "store", null],
  shelfF: ["물건 놓인 큰 선반", "통·자루·상자가 놓인 큰 선반. (3×1)", [3, 1], {"solid": 1}, [["wood", 12], ["rope", 2], ["fiber", 2]], "store", null],
};
for (const id in DECO136) { const [n, d, sz, ex, req, , use] = DECO136[id];
  ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = Object.assign({ n, item: id }, sz[0] * sz[1] > 1 ? { sz } : {}, ex); if (use) USE[id] = use;
  const r = Rc(id, 1, req, 'fdesk', 'furn'); r.tier = recipeTier(r); RECIPES.push(r); }

// ---- 꾸미기 전용(만들 수 없음): id: [이름, 칸, 물체 속성, 묶음] — 묶음: pack 받은 묶음 · crystal 수정 · rock 바위 · shroom 버섯숲 · ruin 유적 · plant 덤불·꽃·나무 ----
export const DECOR_ONLY = {
  questBoard: ["퀘스트 게시판", [2, 1], {"solid": 1}, "pack"],
  questBoard2: ["게시판", [2, 1], {"solid": 1}, "pack"],
  tchest2: ["길드 보물상자", [1, 1], {"solid": 1}, "pack"],
  guildBanner: ["길드 깃발", [3, 1], {"solid": 1}, "pack"],
  weaponRack: ["무기 거치대", [3, 1], {"solid": 1}, "pack"],
  armorShelf: ["갑옷 선반", [3, 1], {"solid": 1}, "pack"],
  dragonSkull: ["용 머리뼈", [2, 1], {"solid": 1}, "pack"],
  skullS: ["작은 해골", [1, 1], {"solid": 1}, "pack"],
  crystalBall: ["수정 구슬", [2, 1], {"solid": 1}, "pack"],
  standCrystal: ["수정 받침대", [1, 1], {"solid": 1}, "pack"],
  standHourglass: ["모래시계 받침대", [1, 1], {"solid": 1}, "pack"],
  fishRack: ["생선 건조대", [4, 1], {"solid": 1}, "pack"],
  netFrame: ["그물 틀", [3, 1], {"solid": 1}, "pack"],
  fishCrate: ["생선 상자", [2, 1], {"solid": 1}, "pack"],
  shark: ["상어 장식", [4, 1], {"solid": 1}, "pack"],
  fishSign: ["생선 간판", [2, 1], {"solid": 1}, "pack"],
  shroomWhiteL: ["흰 버섯 무리", [1, 1], {"solid": 1}, "pack"],
  shroomWhite: ["흰 버섯", [1, 1], {"solid": 1}, "pack"],
  shroomWhiteS: ["작은 흰 버섯", [1, 1], {}, "pack"],
  crateS: ["낡은 나무 상자", [1, 1], {"solid": 1}, "pack"],
  barrelS: ["낡은 나무 통", [1, 1], {"solid": 1}, "pack"],
  planks: ["쌓인 판자", [2, 1], {"solid": 1}, "pack"],
  crysPinkL: ["큰 분홍 수정", [2, 1], {"solid": 1}, "crystal"],
  crysPinkM: ["중간 분홍 수정", [2, 1], {"solid": 1}, "crystal"],
  crysPinkS: ["작은 분홍 수정", [1, 1], {}, "crystal"],
  crysVioletL: ["큰 보라 수정", [2, 1], {"solid": 1}, "crystal"],
  crysVioletM: ["중간 보라 수정", [1, 1], {"solid": 1}, "crystal"],
  crysVioletS: ["작은 보라 수정", [1, 1], {}, "crystal"],
  crysBlueL: ["큰 파랑 수정", [2, 1], {"solid": 1}, "crystal"],
  crysBlueM: ["중간 파랑 수정", [1, 1], {"solid": 1}, "crystal"],
  crysBlueS: ["작은 파랑 수정", [1, 1], {}, "crystal"],
  crysGreenL: ["큰 초록 수정", [2, 1], {"solid": 1}, "crystal"],
  crysGreenM: ["중간 초록 수정", [1, 1], {"solid": 1}, "crystal"],
  crysGreenS: ["작은 초록 수정", [1, 1], {}, "crystal"],
  crysWhiteL: ["큰 하얀 수정", [2, 1], {"solid": 1}, "crystal"],
  crysWhiteM: ["중간 하얀 수정", [1, 1], {"solid": 1}, "crystal"],
  crysWhiteS: ["작은 하얀 수정", [1, 1], {}, "crystal"],
  crysYellowL: ["큰 노랑 수정", [2, 1], {"solid": 1}, "crystal"],
  crysYellowM: ["중간 노랑 수정", [1, 1], {"solid": 1}, "crystal"],
  crysYellowS: ["작은 노랑 수정", [1, 1], {}, "crystal"],
  crysYGreenL: ["큰 연두 수정", [2, 1], {"solid": 1}, "crystal"],
  crysYGreenM: ["중간 연두 수정", [2, 1], {"solid": 1}, "crystal"],
  crysYGreenS: ["작은 연두 수정", [1, 1], {}, "crystal"],
  crysBlackL: ["큰 검은 수정", [2, 1], {"solid": 1}, "crystal"],
  crysBlackM: ["중간 검은 수정", [1, 1], {"solid": 1}, "crystal"],
  crysBlackS: ["작은 검은 수정", [1, 1], {}, "crystal"],
  crysRedL: ["큰 빨강 수정", [2, 1], {"solid": 1}, "crystal"],
  crysRedM: ["중간 빨강 수정", [1, 1], {"solid": 1}, "crystal"],
  crysRedS: ["작은 빨강 수정", [1, 1], {}, "crystal"],
  crysDRedL: ["큰 검붉은 수정", [2, 1], {"solid": 1}, "crystal"],
  crysDRedM: ["중간 검붉은 수정", [1, 1], {"solid": 1}, "crystal"],
  crysDRedS: ["작은 검붉은 수정", [1, 1], {}, "crystal"],
  rockSand: ["하얀 모래 바위", [3, 2], {"solid": 1}, "rock"],
  rockRedCry: ["붉은 결정 바위", [3, 2], {"solid": 1}, "rock"],
  rockSnowCry: ["눈 덮인 수정 바위", [3, 2], {"solid": 1}, "rock"],
  rockMoss: ["이끼 바위 무더기", [3, 2], {"solid": 1}, "rock"],
  rockWhite: ["흰 바위", [3, 2], {"solid": 1}, "rock"],
  rockTan: ["갈라진 모래 바위", [3, 2], {"solid": 1}, "rock"],
  rockShroom: ["층층 버섯 바위", [3, 2], {"solid": 1}, "rock"],
  rockLava: ["용암 바위", [4, 2], {"solid": 1}, "rock"],
  rockRedCryS: ["작은 붉은 결정 바위", [3, 2], {"solid": 1}, "rock"],
  rockSnowCryS: ["작은 눈 덮인 수정 바위", [3, 2], {"solid": 1}, "rock"],
  rockMossS: ["작은 이끼 바위", [2, 1], {"solid": 1}, "rock"],
  rockTanS: ["작은 모래 바위", [2, 1], {"solid": 1}, "rock"],
  rockLavaS: ["작은 용암 바위", [3, 2], {"solid": 1}, "rock"],
  rockTanL: ["큰 모래 바위", [3, 2], {"solid": 1}, "rock"],
  rockTanP: ["모래 바위 무더기", [3, 2], {"solid": 1}, "rock"],
  rockTanL2: ["큰 모래 바위 2", [4, 2], {"solid": 1}, "rock"],
  toadTreeL: ["큰 흰빨강 버섯 나무", [3, 2], {"solid": 1}, "shroom"],
  toadTreeM: ["흰빨강 버섯 나무", [3, 2], {"solid": 1}, "shroom"],
  toadTreeS: ["작은 흰빨강 버섯", [1, 1], {"solid": 1}, "shroom"],
  greenCapL: ["큰 초록 점 버섯 나무", [3, 2], {"solid": 1}, "shroom"],
  greenCapM: ["초록 점 버섯 나무", [2, 1], {"solid": 1}, "shroom"],
  greenCapS: ["작은 초록 점 버섯", [1, 1], {"solid": 1}, "shroom"],
  chantL: ["꾀꼬리버섯 무리", [2, 1], {"solid": 1}, "shroom"],
  chantM: ["꾀꼬리버섯", [1, 1], {"solid": 1}, "shroom"],
  chantS: ["작은 꾀꼬리버섯", [1, 1], {}, "shroom"],
  redDotShrooms: ["빨간 점 버섯 무리", [2, 1], {"solid": 1}, "shroom"],
  redDotShroomS: ["작은 빨간 점 버섯", [1, 1], {}, "shroom"],
  shroomHouse: ["버섯집", [3, 2], {"solid": 1}, "shroom"],
  vineTower: ["덩굴 감긴 유적 탑", [6, 3], {"solid": 1}, "ruin"],
  stairWall: ["계단 벽 유적", [3, 2], {"solid": 1}, "ruin"],
  vinePillar: ["덩굴 기둥 유적", [3, 2], {"solid": 1}, "ruin"],
  pillarS: ["작은 기둥 유적", [2, 1], {"solid": 1}, "ruin"],
  stoneRing: ["회갈 돌 고리", [6, 3], {"solid": 1}, "ruin"],
  stoneArch: ["회갈 돌 굴", [4, 2], {"solid": 1}, "ruin"],
  whitePillars: ["흰 돌 기둥 유적", [5, 2], {"solid": 1}, "ruin"],
  whiteArch: ["흰 돌 아치", [5, 2], {"solid": 1}, "ruin"],
  whiteRubble: ["흰 돌 무더기", [3, 2], {"solid": 1}, "ruin"],
  snowTower: ["눈 덮인 돌탑", [4, 2], {"solid": 1}, "ruin"],
  roundTower: ["부서진 원탑", [4, 2], {"solid": 1}, "ruin"],
  roundTowerS: ["작은 부서진 원탑", [3, 2], {"solid": 1}, "ruin"],
  sandArch: ["모래 아치", [3, 2], {"solid": 1}, "ruin"],
  vineTowerL: ["큰 덩굴 유적 탑", [6, 3], {"solid": 1}, "ruin"],
  stairWallS: ["작은 계단 벽 유적", [4, 2], {"solid": 1}, "ruin"],
  vinePillar2: ["덩굴 기둥 유적 (흙)", [4, 2], {"solid": 1}, "ruin"],
  vineTower2: ["덩굴 유적 탑 (풀)", [6, 3], {"solid": 1}, "ruin"],
  stairWall2: ["계단 벽 유적 (풀)", [4, 2], {"solid": 1}, "ruin"],
  vinePillar3: ["덩굴 기둥 유적 (풀)", [4, 2], {"solid": 1}, "ruin"],
  pillarS2: ["작은 기둥 유적 (흙)", [2, 1], {"solid": 1}, "ruin"],
  totemPole: ["나무 토템 기둥", [1, 1], {"solid": 1}, "ruin"],
  totemPole2: ["나무 토템 기둥 2", [1, 1], {"solid": 1}, "ruin"],
  woodIdol: ["덩굴 나무 신상", [2, 1], {"solid": 1}, "ruin"],
  roundTreeY: ["연두 둥근 나무", [4, 2], {"solid": 1}, "plant"],
  roundTreeG: ["초록 둥근 나무", [3, 2], {"solid": 1}, "plant"],
  berryTreeS: ["작은 열매 나무", [4, 2], {"solid": 1}, "plant"],
  berryTree: ["빨간 열매 나무", [3, 2], {"solid": 1}, "plant"],
  grassMound: ["풀 덮인 흙더미", [3, 2], {"solid": 1}, "plant"],
  redLeafBush: ["빨간 잎 덤불", [3, 2], {"solid": 1}, "plant"],
  blueFlowerBush: ["파란 꽃 덤불", [3, 2], {"solid": 1}, "plant"],
  grassMound2: ["풀 흙더미", [3, 2], {"solid": 1}, "plant"],
  brokenStump: ["부러진 그루터기", [2, 1], {"solid": 1}, "plant"],
  yellowFlowerBush: ["노란 꽃 덤불", [2, 1], {"solid": 1}, "plant"],
  stump2: ["낮은 그루터기", [2, 1], {"solid": 1}, "plant"],
  yellowFlowerBushS: ["작은 노란 꽃 덤불", [2, 1], {"solid": 1}, "plant"],
  yellowFlowerS: ["작은 노란 꽃", [1, 1], {}, "plant"],
  redLeafS: ["작은 빨간 잎", [1, 1], {}, "plant"],
  redLeafBushS: ["작은 빨간 잎 덤불", [2, 1], {"solid": 1}, "plant"],
  bushS2: ["작은 둥근 덤불", [1, 1], {}, "plant"],
  grassMoundS: ["작은 풀 흙더미", [2, 1], {}, "plant"],
  stumpS2: ["작은 그루터기", [1, 1], {}, "plant"],
  blueFlowerBushL: ["큰 파란 꽃 덤불", [3, 2], {"solid": 1}, "plant"],
  pinkBud: ["분홍 봉오리 풀", [2, 1], {"solid": 1}, "plant"],
  pinkBudS: ["작은 분홍 봉오리", [2, 1], {}, "plant"],
  bushXS: ["아주 작은 덤불", [1, 1], {}, "plant"],
  mixFlowerBush: ["파랑·노랑 꽃 덤불", [3, 2], {"solid": 1}, "plant"],
  pinkFlowerBush: ["분홍 꽃 덤불", [3, 2], {"solid": 1}, "plant"],
  lavender: ["라벤더", [2, 1], {"solid": 1}, "plant"],
  violetFlower: ["보라 꽃", [2, 1], {"solid": 1}, "plant"],
  sunflowers: ["해바라기 무리", [3, 2], {"solid": 1}, "plant"],
  whiteBlueFlower: ["하얀 파랑 꽃", [3, 2], {"solid": 1}, "plant"],
  wheat: ["밀", [3, 2], {"solid": 1}, "plant"],
  fruitBushR: ["빨간 열매 덤불 나무", [5, 2], {"solid": 1}, "plant"],
  fruitTreeRS: ["작은 빨간 열매 나무", [3, 2], {"solid": 1}, "plant"],
  fruitTreeY: ["노란 열매 나무", [4, 2], {"solid": 1}, "plant"],
  fruitTreeYS: ["작은 노란 열매 나무", [2, 1], {"solid": 1}, "plant"],
};
for (const id in DECOR_ONLY) { const [n, sz, ex, grp] = DECOR_ONLY[id];
  ITEMS[id] = { n, kind: 'place', obj: id, d: '마을을 꾸미는 장식이에요. 만들 수는 없어요.', deco: 1 }; OBJ[id] = Object.assign({ n, item: id, deco: 1 }, sz[0] * sz[1] > 1 ? { sz } : {}, ex, grp !== 'pack' ? { noShadow: 1 } : {}); } // 수정·바위·버섯·유적·덤불은 그림에 땅이 붙어 있어서 게임 그림자를 안 그려요(그림자가 밑에 떨어져 떠 보임)

// ---- v136 보관함 (사용자 요청 2026-10-23: 상자 종류 가구에는 늘 보관 칸, 예전 것도 모두 · 큰 보관함 새로) ----
// OBJ[t].chest = 칸 수. 보관상자 18칸(그대로). 옛 세계에 놓여 있던 것은 처음 열 때 빈 칸이 생겨요(sim/inventory.js storeAt)
ITEMS.chestBig = { n: '큰 보관함', kind: 'place', obj: 'chestBig', d: '통과 상자를 쌓아 만든 큰 보관함. 물건을 36칸 보관해요 (2×1).' };
OBJ.chestBig = { n: '큰 보관함', item: 'chestBig', solid: 1, sz: [2, 1], chest: 36 };
{ const r = Rc('chestBig', 1, [['wood', 24], ['copperBar', 2], ['rope', 2]], 'bench', 'furn'); r.tier = recipeTier(r); RECIPES.push(r); }
export const CHEST136 = { chestBig: 36, bigChest: 24, cabinet: 18, woodCrate: 12, crateFruit: 12, crateGreens: 12, crateF: 12, barrelF: 12, crateS: 12, barrelS: 12, tchest2: 12, fishCrate: 12, strawBasket: 9, sack: 9 };
ITEMS.bigChest.d = '쇠테를 두른 커다란 보물상자 (2×1).';
for (const id in CHEST136) { OBJ[id].chest = CHEST136[id]; const it = ITEMS[id]; if (it && !/칸 보관/.test(it.d)) it.d = it.d.trim() + ' 물건을 ' + CHEST136[id] + '칸 보관해요.'; }
