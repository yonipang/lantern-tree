// ================= 기본 데이터 (구조 변경 2단계: content/items.js에서 데이터만 옮김) =================
// 벽·아이템·물체·레시피·무기·희귀도·가방 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 순서가 중요해요: RECIPES에 넣는 순서 = 제작 창 순서, 아래쪽의 일괄 보정(REQ_FIX·금속 → 구리 제작대)은 그 줄보다 앞의 레시피에만 적용돼요.
// 이 파일은 shell.html에서 content/items.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { rand } from '../engine/random.js';
import { spawnDrop } from '../sim/drops.js';
import { shovelDesc } from '../world/tiles.js';

export const CRYGEM_P = 0.35; // a crystal cluster gives one 수정결정 this often, otherwise one 석영
export const WALLS = {
  1: { n: '흙벽', tier: 0, hp: 3, drop: [['dirt', 1, 1, 1]] },
  2: { n: '돌벽', tier: 1, hp: 5, drop: [['stone', 1, 1, 1]] },
  3: { n: '화강암 벽', tier: 2, hp: 7, drop: [['granite', 1, 1, 1]] },
  4: { n: '구리 광맥', tier: 0, hp: 4, drop: [['copperOre', 1, 2, 1], ['dirt', 1, 1, 0.4]] },
  5: { n: '철 광맥', tier: 1, hp: 6, drop: [['ironOre', 1, 2, 1], ['stone', 1, 1, 0.4]] },
  6: { n: '나무 벽', tier: 0, hp: 3, drop: [['wallWood', 1, 1, 1]] },
  7: { n: '돌벽돌 벽', tier: 0, hp: 5, drop: [['wallBrick', 1, 1, 1]] },
  8: { n: '단단한 암반', tier: 9, hp: 1e9, drop: [] },
  9: { n: '현무암벽', tier: 3, hp: 8, drop: [['basalt', 1, 1, 1], ['obsidian', 1, 1, 0.15]] },
  10: { n: '금 광맥', tier: 3, hp: 8, drop: [['goldOre', 1, 2, 1], ['stone', 1, 1, 0.3]] },
  11: { n: '얼음벽', tier: 3, hp: 7, drop: [['iceBlock', 1, 1, 1], ['frostShard', 1, 1, 0.15]] },
  12: { n: '서리 광맥', tier: 3, hp: 8, drop: [['frostShard', 1, 2, 1]] },
  13: { n: '석영 광맥', tier: 2, hp: 7, drop: [['crystal', 1, 2, 1], ['granite', 1, 1, 0.3]] },
};
export const TIERNAME = ['나무 곡괭이', '구리 곡괭이', '철 곡괭이', '수정 곡괭이'];
export const BIOME = ['이끼 동굴', '버섯숲', '수정 동굴', '용암 동굴', '얼음 동굴'];
export const FURN_D = '집을 꾸미는 예쁜 가구예요.';
export const ITEMS = {
  wood: { n: '나무', d: '뿌리기둥이나 큰버섯을 베면 얻어요.' },
  dirt: { n: '흙', kind: 'wall', wall: 1, d: '흙벽을 캐면 나와요. 들고 있으면 흙벽을 쌓을 수 있어요.' },
  stone: { n: '돌', d: '돌벽을 캐면 나와요. 구리 곡괭이가 필요해요.' },
  fiber: { n: '이끼 섬유', d: '이끼풀을 베면 얻는 부드러운 실.' },
  gel: { n: '말랑 젤', d: '말랑이들이 남기는 말랑말랑한 젤.' },
  copperOre: { n: '구리광석', d: '용광로에서 녹이면 구리괴가 돼요.' },
  ironOre: { n: '철광석', d: '용광로에서 녹이면 철괴가 돼요.' },
  crystal: { n: '석영', d: '수정 동굴의 석영 광맥을 캐면 나와요. 가구·회로·귀환석 등 여러 곳에 쓰여요. 용광로에서 정제 석영으로 만들어요.' },
  granite: { n: '화강암', kind: 'wall', wall: 3, mat: 1, d: '수정 동굴의 화강암 벽을 캐면 나와요. 들고 있으면 화강암 벽을 쌓을 수 있어요.' },
  basalt: { n: '현무암', kind: 'wall', wall: 9, mat: 1, d: '용암 동굴의 현무암벽을 캐면 나와요. 들고 있으면 현무암벽을 쌓을 수 있어요.' },
  iceBlock: { n: '얼음 덩이', kind: 'wall', wall: 11, mat: 1, d: '얼음 동굴의 얼음벽을 캐면 나와요. 들고 있으면 얼음벽을 쌓을 수 있어요.' },
  quartzR: { n: '정제 석영', d: '용광로에서 석영 2개를 녹여 만든 맑은 석영. 수정 무기와 상위 도구에 들어가요.' },
  cryGem: { n: '수정결정', d: '수정 동굴의 빛나는 수정 결정에서 가끔 나오는 귀한 결정. 무기·상위 도구·빛나는 장식의 핵심 재료예요.' },
  copperBar: { n: '구리괴', d: '구리 도구와 요리솥을 만들어요.' },
  ironBar: { n: '철괴', d: '튼튼한 철 도구를 만들어요.' },
  glowcap: { n: '빛버섯', d: '은은하게 빛나는 작은 버섯.' },
  mushroom: { n: '버섯', kind: 'food', food: 8, heal: 0, d: '날로도 먹지만 구우면 훨씬 맛있어요.' },
  berry: { n: '통통베리', kind: 'food', food: 14, heal: 5, d: '새콤달콤한 땅속 베리.' },
  berrySeed: { n: '베리 씨앗', kind: 'seed', crop: 'cropBerry', d: '이끼나 흙 바닥에 심어요.' },
  spore: { n: '버섯 포자', kind: 'seed', crop: 'cropShroom', d: '흙이나 버섯흙 바닥에 심어요.' },
  grilled: { n: '구운 버섯', kind: 'food', food: 30, heal: 12, d: '고소한 냄새가 솔솔.' },
  pie: { n: '베리 파이', kind: 'food', food: 55, heal: 30, d: '배가 든든해지는 달콤한 파이.' },
  stew: { n: '버섯 스튜', kind: 'food', food: 45, heal: 50, d: '몸이 따뜻해지는 스튜. 체력을 많이 회복해요.' },
  lightSeed: { n: '빛씨앗', kind: 'key', d: '등불나무에 심으면 빛이 돌아와요.' },
  pickWood: { n: '나무 곡괭이', kind: 'pick', power: 1, tier: 0, stack: 1, d: '흙벽과 구리 광맥을 캘 수 있어요.' },
  pickCopper: { n: '구리 곡괭이', kind: 'pick', power: 2, tier: 1, stack: 1, d: '돌벽과 철 광맥도 캘 수 있어요.' },
  pickIron: { n: '철 곡괭이', kind: 'pick', power: 3, tier: 2, stack: 1, d: '수정 동굴의 단단한 화강암 벽과 석영 광맥까지 캘 수 있어요.' },
  swordWood: { n: '나무 검', kind: 'sword', dmg: 6, stack: 1, d: '처음부터 가진 검. 칼 버튼으로 휘둘러요.' },
  swordCopper: { n: '구리 검', kind: 'sword', dmg: 11, stack: 1, d: '가볍고 튼튼한 검.' },
  swordIron: { n: '철 검', kind: 'sword', dmg: 17, stack: 1, d: '묵직한 한 방.' },
  swordCrystal: { n: '수정 검', kind: 'sword', dmg: 26, stack: 1, d: '보랏빛으로 반짝이는 검.' },
  bench: { n: '작업대', kind: 'place', obj: 'bench', d: '도구와 가구를 만드는 곳.' },
  furnace: { n: '용광로', kind: 'place', obj: 'furnace', d: '광석을 녹여 구리괴·철괴·금괴·정제 석영을 만들어요. (v58 전 이름: 화로)' },
  pot: { n: '요리솥', kind: 'place', obj: 'pot', d: '든든한 요리를 만들어요.' },
  chest: { n: '보관상자', kind: 'place', obj: 'chest', d: '물건을 18칸 보관해요.' },
  torch: { n: '횃불', kind: 'place', obj: 'torch', d: '주변을 밝혀요. 밝은 곳엔 몬스터가 생기지 않아요.' },
  chair: { n: '나무 의자', kind: 'place', obj: 'chair' },
  table: { n: '둥근 탁자', kind: 'place', obj: 'table' },
  bed: { n: '포근한 침대', kind: 'place', obj: 'bed', d: '기절하면 침대에서 깨어나요.' },
  plant: { n: '화분', kind: 'place', obj: 'plant' },
  rug: { n: '꽃무늬 러그', kind: 'place', obj: 'rug', d: '위로 걸어 다닐 수 있는 러그.' },
  lampShroom: { n: '버섯 램프', kind: 'place', obj: 'lampShroom', d: '분홍빛으로 은은하게 밝혀요.' },
  lampCrystal: { n: '수정 램프', kind: 'place', obj: 'lampCrystal', d: '넓게 밝히는 보랏빛 램프.' },
  shelf: { n: '책장', kind: 'place', obj: 'shelf' },
  cushion: { n: '고양이 쿠션', kind: 'place', obj: 'cushion', d: '말랑한 고양이 모양 쿠션.' },
  vase: { n: '꽃병', kind: 'place', obj: 'vase' },
  wallWood: { n: '나무 벽', kind: 'wall', wall: 6, d: '집 벽을 쌓아요.' },
  wallBrick: { n: '돌벽돌 벽', kind: 'wall', wall: 7, d: '단정한 돌벽돌 벽.' },
  floorWood: { n: '나무 바닥', kind: 'floor', floor: 5, d: '따뜻한 나무 바닥을 깔아요.' },
  floorStone: { n: '돌 바닥', kind: 'floor', floor: 6, d: '깔끔한 돌 바닥을 깔아요.' },
};
export const OBJ = {
  bench: { n: '작업대', solid: 1, station: 'bench', item: 'bench' },
  furnace: { n: '용광로', solid: 1, station: 'furnace', item: 'furnace', light: [3.4, '#ff9a4d'] },
  pot: { n: '요리솥', solid: 1, station: 'pot', item: 'pot' },
  chest: { n: '보관상자', solid: 1, chest: 1, item: 'chest' },
  torch: { n: '횃불', item: 'torch', light: [6.5, '#ffb860'], flick: 1 },
  chair: { n: '나무 의자', solid: 1, item: 'chair' },
  table: { n: '둥근 탁자', solid: 1, item: 'table' },
  bed: { n: '포근한 침대', solid: 1, item: 'bed' },
  plant: { n: '화분', solid: 1, item: 'plant' },
  rug: { n: '꽃무늬 러그', flat: 1, item: 'rug' },
  lampShroom: { n: '버섯 램프', solid: 1, item: 'lampShroom', light: [5.5, '#ff9fd8'] },
  lampCrystal: { n: '수정 램프', solid: 1, item: 'lampCrystal', light: [7.5, '#c6b0ff'] },
  shelf: { n: '책장', solid: 1, item: 'shelf' },
  cushion: { n: '고양이 쿠션', item: 'cushion' },
  vase: { n: '꽃병', solid: 1, item: 'vase' },
  root: { n: '뿌리기둥', solid: 1, hp: 3, nat: 'chop', drops: [['wood', 2, 3, 1], ['fiber', 1, 1, 0.4]] },
  bigShroom: { n: '큰버섯', solid: 1, hp: 3, nat: 'chop', drops: [['wood', 1, 2, 1], ['mushroom', 1, 2, 1], ['spore', 1, 1, 0.4]] },
  bush: { n: '베리덤불', solid: 1, bush: 1 },
  grass: { n: '이끼풀', hp: 1, nat: 'chop', drops: [['fiber', 1, 2, 1], ['berrySeed', 1, 1, 0.08]] },
  glow: { n: '빛버섯', hp: 1, nat: 'pick', light: [3, '#6ff2e6'], drops: [['glowcap', 1, 1, 1], ['spore', 1, 1, 0.2]] },
  cluster: { n: '수정 결정', solid: 1, hp: 4, tier: 1, nat: 'mine', light: [3.5, '#b99bff'], drops: [], dropFn: (x, y) => spawnDrop(rand() < CRYGEM_P ? 'cryGem' : 'crystal', 1, x, y) },
  cropBerry: { n: '베리', crop: 'berry', grow: 110, yield: [['berry', 2, 3, 1], ['berrySeed', 1, 2, 1]] },
  cropShroom: { n: '버섯', crop: 'shroom', grow: 130, yield: [['mushroom', 2, 3, 1], ['spore', 1, 1, 0.8], ['glowcap', 1, 1, 0.3]] },
  shrine: { n: '고대 제단', solid: 1, shrine: 1 },
  treeP: { n: '등불나무', solid: 1, tree: 1 },
};
Object.assign(ITEMS, {
  shroomCap: { n: '버섯 갓', d: '큰버섯과 버섯 여왕에게서 얻는 탱글한 갓. 버섯 세트 재료예요.' },
  shovel: { n: '삽', kind: 'shovel', stack: 1, get d() { return shovelDesc(); } },
  gDirt: { n: '흙 한 삽', kind: 'ground', ground: 2, d: '땅을 흙으로 덮어요. 물을 메울 수도 있어요.' },
  gMoss: { n: '이끼 한 삽', kind: 'ground', ground: 1, d: '땅을 이끼로 덮어요. 씨앗을 심을 수 있어요.' },
  gShroom: { n: '버섯흙 한 삽', kind: 'ground', ground: 3, d: '땅을 버섯흙으로 덮어요. 포자를 심기 좋아요.' },
  gCrystal: { n: '수정 모래 한 삽', kind: 'ground', ground: 4, d: '땅을 반짝이는 수정 바닥으로 덮어요.' },
  gWater: { n: '물 한 동이', kind: 'ground', ground: 10, d: '빈 땅에 부으면 작은 물웅덩이가 생겨요. 낚시도 할 수 있어요.' },
  rod: { n: '낚싯대', kind: 'rod', stack: 1, d: '물을 바라보며 누르면 찌를 던져요. 찌가 쏙 들어가면 바로 한 번 더 눌러요!' },
  minnow: { n: '이끼 송사리', kind: 'food', fish: 1, food: 6, heal: 3, d: '이끼 동굴 물가의 작은 물고기.' },
  crucian: { n: '통통 붕어', kind: 'food', fish: 1, food: 10, heal: 4, d: '통통하게 살이 오른 붕어.' },
  catfish: { n: '버섯 메기', kind: 'food', fish: 1, food: 12, heal: 5, d: '버섯숲 물웅덩이에 사는 수염 메기.' },
  sporeEel: { n: '포자 장어', kind: 'food', fish: 1, food: 12, heal: 8, d: '보랏빛 점무늬가 있는 장어.' },
  smelt: { n: '수정 빙어', kind: 'food', fish: 1, food: 10, heal: 10, d: '몸이 투명하게 반짝여요.' },
  shrimp: { n: '반짝 새우', kind: 'food', fish: 1, food: 14, heal: 8, d: '수정동굴 물속의 분홍 새우.' },
  koi: { n: '별빛 잉어', kind: 'food', fish: 1, food: 20, heal: 20, d: '아주 드물게 낚이는 행운의 잉어!' },
  boot: { n: '낡은 장화', d: '누가 버린 장화… 화분으로 쓸 수 있을지도?' },
  anyFish: { n: '물고기', virtual: 1 },
  grilledFish: { n: '구운 생선', kind: 'food', food: 32, heal: 18, d: '노릇노릇 잘 구워졌어요.' },
  fishStew: { n: '생선 스튜', kind: 'food', food: 55, heal: 50, d: '든든하고 따뜻한 스튜.' },
  fishTank: { n: '어항', kind: 'place', obj: 'fishTank', d: '물고기가 헤엄치는 작은 어항.' },
  bootPlanter: { n: '장화 화분', kind: 'place', obj: 'bootPlanter', d: '낡은 장화에 꽃을 심었어요.' },
  stumpStool: { n: '그루터기 의자', kind: 'place', obj: 'stumpStool', set: 'moss' },
  mossSofa: { n: '이끼 소파', kind: 'place', obj: 'mossSofa', set: 'moss' },
  sproutLamp: { n: '새싹 등불', kind: 'place', obj: 'sproutLamp', set: 'moss', d: '연둣빛으로 은은하게 밝혀요.' },
  leafRug: { n: '나뭇잎 러그', kind: 'place', obj: 'leafRug', set: 'moss', d: '위로 걸어 다닐 수 있는 러그.' },
  mossBed: { n: '이끼 침대', kind: 'place', obj: 'mossBed', set: 'moss', d: '기절하면 이 침대에서 깨어나요.' },
  floorMoss: { n: '이끼 타일 바닥', kind: 'floor', floor: 7, set: 'moss', d: '폭신한 이끼 타일을 깔아요.' },
  shroomStool: { n: '버섯 의자', kind: 'place', obj: 'shroomStool', set: 'shroom' },
  shroomTable: { n: '버섯 탁자', kind: 'place', obj: 'shroomTable', set: 'shroom' },
  sporeLamp: { n: '포자 등불', kind: 'place', obj: 'sporeLamp', set: 'shroom', d: '보랏빛 포자가 반짝여요.' },
  shroomWardrobe: { n: '버섯집 옷장', kind: 'place', obj: 'shroomWardrobe', set: 'shroom' },
  dotRug: { n: '점박이 러그', kind: 'place', obj: 'dotRug', set: 'shroom', d: '위로 걸어 다닐 수 있는 러그.' },
  floorShroom: { n: '버섯 조약돌 바닥', kind: 'floor', floor: 8, set: 'shroom', d: '동글동글한 조약돌 바닥을 깔아요.' },
  cryChair: { n: '수정 의자', kind: 'place', obj: 'cryChair', set: 'crystal' },
  cryTable: { n: '수정 탁자', kind: 'place', obj: 'cryTable', set: 'crystal' },
  cryFountain: { n: '수정 분수', kind: 'place', obj: 'cryFountain', set: 'crystal', d: '맑은 물빛으로 주변을 밝혀요.' },
  cryMirror: { n: '수정 거울', kind: 'place', obj: 'cryMirror', set: 'crystal' },
  starRug: { n: '별빛 러그', kind: 'place', obj: 'starRug', set: 'crystal', d: '위로 걸어 다닐 수 있는 러그.' },
  floorCrystal: { n: '수정 타일 바닥', kind: 'floor', floor: 9, set: 'crystal', d: '반짝이는 수정 타일을 깔아요.' },
});
Object.assign(OBJ, {
  fishTank: { n: '어항', solid: 1, item: 'fishTank', light: [2.2, '#9fd8f0'] }, bootPlanter: { n: '장화 화분', solid: 1, item: 'bootPlanter' },
  stumpStool: { n: '그루터기 의자', solid: 1, item: 'stumpStool' }, mossSofa: { n: '이끼 소파', solid: 1, item: 'mossSofa' }, sproutLamp: { n: '새싹 등불', solid: 1, item: 'sproutLamp', light: [5, '#c8f58a'] },
  leafRug: { n: '나뭇잎 러그', flat: 1, item: 'leafRug' }, mossBed: { n: '이끼 침대', solid: 1, item: 'mossBed', bed: 1 },
  shroomStool: { n: '버섯 의자', solid: 1, item: 'shroomStool' }, shroomTable: { n: '버섯 탁자', solid: 1, item: 'shroomTable' }, sporeLamp: { n: '포자 등불', solid: 1, item: 'sporeLamp', light: [5.5, '#d59bff'] },
  shroomWardrobe: { n: '버섯집 옷장', solid: 1, item: 'shroomWardrobe' }, dotRug: { n: '점박이 러그', flat: 1, item: 'dotRug' },
  cryChair: { n: '수정 의자', solid: 1, item: 'cryChair' }, cryTable: { n: '수정 탁자', solid: 1, item: 'cryTable' }, cryFountain: { n: '수정 분수', solid: 1, item: 'cryFountain', light: [5, '#9fe0ff'] },
  cryMirror: { n: '수정 거울', solid: 1, item: 'cryMirror' }, starRug: { n: '별빛 러그', flat: 1, item: 'starRug' },
});
OBJ.bed.bed = 1;
OBJ.grass.nat = 'cut';
ITEMS.rod.power = 1;
export const USE = { chair: 'sit', stumpStool: 'sit', shroomStool: 'sit', cryChair: 'sit', mossSofa: 'sit', bed: 'sleep', mossBed: 'sleep', cushion: 'pet',
  torch: 'lamp', lampShroom: 'lamp', lampCrystal: 'lamp', sproutLamp: 'lamp', sporeLamp: 'lamp', fishTank: 'feed', shelf: 'read', cryMirror: 'mirror',
  shroomWardrobe: 'dress', cryFountain: 'wish', plant: 'water', vase: 'water', bootPlanter: 'water', table: 'tea', shroomTable: 'tea', cryTable: 'tea' };
export const USE_LBL = { sit: '앉기', sleep: '잠자기', pet: '쓰다듬기', feed: '밥 주기', read: '책 읽기', mirror: '거울 보기', dress: '꾸미기', wish: '소원 빌기', water: '물 주기', tea: '차 마시기' };
export const TIPS = ['칼 버튼은 언제나 공격, 손 버튼은 앞에 있는 것에 맞춰 열기·캐기·베기를 해요. 곡괭이·도끼는 알아서 꺼내 들어요.', '활을 쓸 때 가방에 광물 화살이 있으면 좋은 화살부터 써서 더 세게 쏴요.', '도끼가 도구 주머니에 있으면 나무를 훨씬 빨리 베요.', '횃불이나 램프로 밝힌 곳에는 몬스터가 생기지 않아요.', '침대에서 자면 체력이 가득 차고, 그 침대에서 다시 깨어나요.',
  '말랑대왕은 착지할 때 충격파를 내요. 점프하면 멀리 떨어져요.', '버섯 여왕의 포자는 둥글게 퍼져요. 포자 사이 틈으로 빠져나가요.', '수정골렘이 벽에 부딪혀 기절하면 1.5배 피해를 줄 수 있어요.',
  '수정 분수에서 소원을 빌면 잠시 희귀 물고기가 잘 낚여요.', '구리 낫이 가방에 있으면 작물을 하나씩 더 얻어요. 꾹 누르면 주변 3×3을 한 번에 거둬요.', '바닥 타일을 물 위에 깔면 다리가 돼요.', '찌가 쏙 들어가고 느낌표가 뜨면 바로 당겨요!', '의자에 앉아 있으면 체력이 조금씩 차올라요.'];
export const COMPLIMENTS = ['오늘도 귀여워요!', '반짝반짝, 멋진 모험가예요', '새싹이 생기 있어 보여요', '웃는 얼굴이 제일 예뻐요'];
OBJ.bigShroom.drops.push(['shroomCap', 1, 2, 1]);
export const SETN = { moss: '이끼 세트', shroom: '버섯 세트', crystal: '수정 세트' };
export const STN = { bench: '작업대', furnace: '용광로', pot: '요리솥' }; // v58: 화로 → 용광로 (the old 용광로 is now 장비제작대)
export const Rc = (out, n, req, at, cat) => ({ out, n, req, at, cat });
export const RECIPES = [
  Rc('bench', 1, [['wood', 6]], null, 'furn'),
  Rc('torch', 2, [['wood', 1]], null, 'build'),
  Rc('chest', 1, [['wood', 8]], 'bench', 'furn'),
  Rc('furnace', 1, [['dirt', 10], ['wood', 4]], 'bench', 'furn'),
  Rc('pot', 1, [['copperBar', 3], ['wood', 2]], 'bench', 'furn'),
  Rc('pickCopper', 1, [['copperBar', 4], ['wood', 2]], 'bench', 'tool'),
  Rc('swordCopper', 1, [['copperBar', 5], ['wood', 1]], 'bench', 'tool'),
  Rc('pickIron', 1, [['ironBar', 4], ['wood', 2]], 'bench', 'tool'),
  Rc('swordIron', 1, [['ironBar', 5], ['wood', 1]], 'bench', 'tool'),
  Rc('swordCrystal', 1, [['crystal', 8], ['ironBar', 3]], 'bench', 'tool'),
  Rc('chair', 1, [['wood', 4]], 'bench', 'furn'),
  Rc('table', 1, [['wood', 6], ['fiber', 2]], 'bench', 'furn'),
  Rc('bed', 1, [['wood', 8], ['fiber', 6]], 'bench', 'furn'),
  Rc('plant', 1, [['dirt', 3], ['fiber', 2]], 'bench', 'furn'),
  Rc('rug', 1, [['fiber', 6]], 'bench', 'furn'),
  Rc('lampShroom', 1, [['glowcap', 2], ['wood', 2]], 'bench', 'furn'),
  Rc('lampCrystal', 1, [['crystal', 3], ['ironBar', 1]], 'bench', 'furn'),
  Rc('shelf', 1, [['wood', 10]], 'bench', 'furn'),
  Rc('cushion', 1, [['fiber', 5], ['gel', 2]], 'bench', 'furn'),
  Rc('vase', 1, [['stone', 3], ['fiber', 1]], 'bench', 'furn'),
  Rc('wallWood', 2, [['wood', 2]], 'bench', 'build'),
  Rc('wallBrick', 2, [['stone', 3]], 'bench', 'build'),
  Rc('floorWood', 4, [['wood', 2]], 'bench', 'build'),
  Rc('floorStone', 4, [['stone', 2]], 'bench', 'build'),
  Rc('copperBar', 1, [['copperOre', 2]], 'furnace', 'mat'),
  Rc('ironBar', 1, [['ironOre', 2]], 'furnace', 'mat'),
  Rc('grilled', 1, [['mushroom', 1]], 'pot', 'food'), // v58: grilling moved from the furnace to the pot
  Rc('pie', 1, [['berry', 3], ['mushroom', 1]], 'pot', 'food'),
  Rc('stew', 1, [['mushroom', 3], ['glowcap', 1]], 'pot', 'food'),
];
// ---- building pieces: thin walls, half walls, window walls, window frames, fences, doors, pillars and the auto sliding door (auto-connecting) ----
// v41: pieces stand on the tile's bottom line like natural walls (TW_BASE), and the tall ones are as high as a natural wall; roofs were removed
export const BMAT = { wood: { n: '나무', res: 'wood', f: '#b0743f', fd: '#7d4d2a', fl: '#d9a066', c: '#e0b07a', cd: '#8a5a33', door: '#8f5a32' },
  stone: { n: '돌', res: 'stone', f: '#8f8aa3', fd: '#625d78', fl: '#b9b4cc', c: '#d3cee3', cd: '#6d6884', door: '#6d6884' } };
export const BMAT_X = { metal: { n: '금속', f: '#8d97a8', fd: '#5a5468', fl: '#c8d0dc', c: '#dfe5ee', cd: '#6c7688', door: '#a9b6c8' } };
export const BTYPE = { // h: height in px · cnt: pieces per craft · cost: material per craft
  thin: { n: '얇은 벽', h: 16, cnt: 2, cost: 2, d: '얇고 아늑한 실내 벽. 옆 칸과 자동으로 이어지고, 바위벽과 높이가 같아요.' },
  half: { n: '반벽', h: 9, cnt: 2, cost: 1, d: '허리 높이의 낮은 벽. 옆 칸과 자동으로 이어져요.' },
  win: { n: '창문벽', h: 16, cnt: 2, cost: 3, d: '작은 창이 난 얇은 벽. 나란히 놓으면 긴 창이 돼요.' },
  frame: { n: '창문 틀', h: 16, cnt: 1, cost: 2, d: '벽 대신 세우는 큰 유리창.' },
  fence: { n: '울타리', h: 10, cnt: 2, cost: 1, d: '마당을 두르는 울타리. 울타리·기둥·문과 이어져요.' },
  door: { n: '문', h: 16, cnt: 1, cost: 4, d: '바라보고 누르면 열고 닫아요. 두 칸을 나란히 놓으면 양문이 되어 함께 열려요.' },
  pillar: { n: '기둥', h: 22, cnt: 2, cost: 1, d: '가느다란 기둥. 벽과 울타리가 이어져요.' },
};
export const TW_H = { slide: 16 }; // pieces outside the wood/stone sets
export const BCAP = s => s[0].toUpperCase() + s.slice(1);
export const bId = (type, mat) => 'b' + BCAP(type) + BCAP(mat); // e.g. bThinWood
export function addBuildPieces() {
  for (const mat in BMAT) {
    const M = BMAT[mat];
    for (const type in BTYPE) { const T = BTYPE[type], id = bId(type, mat);
      OBJ[id] = { n: `${M.n} ${T.n}`, solid: 1, item: id, tw: { type, mat }, door: type === 'door' ? 1 : 0 };
      ITEMS[id] = { n: `${M.n} ${T.n}`, kind: 'place', obj: id, d: T.d };
      if (type === 'door') USE[id] = 'door';
      RECIPES.push(Rc(id, T.cnt, [[M.res, T.cost]], 'bench', 'build')); }
  }
  // auto sliding door: opens by itself while powered and someone walks up; without power it is an ordinary door
  OBJ.slideDoor = { n: '자동 미닫이문', solid: 1, item: 'slideDoor', tw: { type: 'slide', mat: 'metal' }, door: 1, dev: 'slide', idle: .01 };
  ITEMS.slideDoor = { n: '자동 미닫이문', kind: 'place', obj: 'slideDoor', d: '전선으로 전기를 이어 주면 다가갈 때 옆으로 스르륵 열리고, 멀어지면 닫혀요. 몬스터는 못 열어요. 전기가 없으면 손으로 여닫아요.' };
  USE.slideDoor = 'door';
  RECIPES.push(Rc('slideDoor', 1, [['copperBar', 3], ['ironBar', 2], ['crystal', 1]], 'forge', 'build'));
}
addBuildPieces();

// ---- more decorations, spread over early (wood/stone/fiber/dirt) and later (copper/iron) materials ----
export const DECOR = {
  woodCrate: { n: '나무 상자', d: '차곡차곡 쌓아 두는 장식용 상자.', req: [['wood', 3]] },
  logBench: { n: '통나무 벤치', d: '앉아서 쉴 수 있어요.', req: [['wood', 5]], use: 'sit' },
  stoneBench: { n: '돌 벤치', d: '서늘하고 단단한 돌 의자. 앉을 수 있어요.', req: [['stone', 6]], use: 'sit' },
  stoneLantern: { n: '돌 등롱', d: '정원을 은은하게 밝히는 돌 등. 눌러서 켜고 꺼요.', req: [['stone', 4], ['wood', 1]], use: 'lamp', light: [5, '#ffd27a'], flick: 1 },
  flowerBox: { n: '꽃 화단', d: '알록달록한 꽃이 핀 화단. 물을 줄 수 있어요.', req: [['wood', 2], ['dirt', 2], ['fiber', 2]], use: 'water' },
  strawBasket: { n: '짚 바구니', d: '이끼 섬유로 엮은 바구니.', req: [['fiber', 4]] },
  pictureFrame: { n: '이젤 액자', d: '풍경화가 담긴 작은 이젤.', req: [['wood', 2], ['fiber', 1]] },
  copperLamp: { n: '구리 스탠드', d: '반짝이는 구리 스탠드 조명. 눌러서 켜고 꺼요.', req: [['copperBar', 2], ['wood', 1]], use: 'lamp', light: [6, '#ffd9a0'] },
  copperKettle: { n: '구리 주전자', d: '따뜻한 차를 마실 수 있어요.', req: [['copperBar', 2]], use: 'tea' },
  grandClock: { n: '괘종시계', d: '똑딱똑딱 시간을 알려 주는 커다란 시계.', req: [['copperBar', 1], ['wood', 6]] },
  ironStove: { n: '무쇠 난로', d: '집 안을 따뜻하게 밝혀요. 눌러서 켜고 꺼요.', req: [['ironBar', 3], ['stone', 4]], use: 'lamp', light: [5.5, '#ff9a4a'], flick: 1 },
  ironChair: { n: '철제 의자', d: '돌돌 말린 등받이가 예쁜 의자. 앉을 수 있어요.', req: [['ironBar', 2], ['fiber', 1]], use: 'sit' },
};
for (const id in DECOR) { const D = DECOR[id]; ITEMS[id] = { n: D.n, kind: 'place', obj: id, d: D.d }; OBJ[id] = { n: D.n, solid: 1, item: id }; if (D.light) OBJ[id].light = D.light; if (D.flick) OBJ[id].flick = 1; if (D.use) USE[id] = D.use; RECIPES.push(Rc(id, 1, D.req, 'bench', 'furn')); }
RECIPES.push(
  Rc('rod', 1, [['wood', 3], ['fiber', 2]], null, 'tool'),
  Rc('shovel', 1, [['copperBar', 2], ['wood', 3]], 'bench', 'tool'),
  Rc('gDirt', 2, [['dirt', 1]], null, 'build'),
  Rc('fishTank', 1, [['stone', 3], ['anyFish', 1]], 'bench', 'furn'),
  Rc('bootPlanter', 1, [['boot', 1], ['dirt', 2]], 'bench', 'furn'),
  Rc('grilledFish', 1, [['anyFish', 1]], 'pot', 'food'),
  Rc('fishStew', 1, [['anyFish', 2], ['mushroom', 1]], 'pot', 'food'),
  Rc('stumpStool', 1, [['wood', 3], ['fiber', 1]], 'bench', 'moss'),
  Rc('mossSofa', 1, [['wood', 6], ['fiber', 6]], 'bench', 'moss'),
  Rc('sproutLamp', 1, [['wood', 2], ['fiber', 2], ['glowcap', 1]], 'bench', 'moss'),
  Rc('leafRug', 1, [['fiber', 8]], 'bench', 'moss'),
  Rc('mossBed', 1, [['wood', 8], ['fiber', 8]], 'bench', 'moss'),
  Rc('floorMoss', 4, [['fiber', 2], ['dirt', 2]], 'bench', 'moss'),
  Rc('shroomStool', 1, [['shroomCap', 2], ['wood', 1]], 'bench', 'shroom'),
  Rc('shroomTable', 1, [['shroomCap', 4], ['wood', 2]], 'bench', 'shroom'),
  Rc('sporeLamp', 1, [['shroomCap', 2], ['glowcap', 2]], 'bench', 'shroom'),
  Rc('shroomWardrobe', 1, [['shroomCap', 6], ['wood', 6]], 'bench', 'shroom'),
  Rc('dotRug', 1, [['fiber', 6], ['shroomCap', 1]], 'bench', 'shroom'),
  Rc('floorShroom', 4, [['shroomCap', 1], ['dirt', 2]], 'bench', 'shroom'),
  Rc('cryChair', 1, [['crystal', 3], ['ironBar', 1]], 'bench', 'crystal'),
  Rc('cryTable', 1, [['crystal', 4], ['ironBar', 2]], 'bench', 'crystal'),
  Rc('cryFountain', 1, [['crystal', 6], ['stone', 6]], 'bench', 'crystal'),
  Rc('cryMirror', 1, [['crystal', 4], ['ironBar', 2]], 'bench', 'crystal'),
  Rc('starRug', 1, [['fiber', 6], ['crystal', 1]], 'bench', 'crystal'),
  Rc('floorCrystal', 4, [['crystal', 1], ['stone', 2]], 'bench', 'crystal'),
);

// ---- materials, the copper workbench, weapon types ----
Object.assign(ITEMS, {
  resin: { n: '송진', d: '뿌리기둥이나 큰버섯을 베면 가끔 나오는 끈적한 송진. 단단하게 붙여 줘요.' },
  rope: { n: '이끼 끈', d: '이끼 섬유를 꼬아 만든 튼튼한 끈. 도구와 가구에 쓰여요.' },
  forge: { n: '구리 제작대', kind: 'place', obj: 'forge', d: '구리·철·수정으로 된 도구, 무기, 가구를 만드는 곳.' },
});
OBJ.forge = { n: '구리 제작대', solid: 1, station: 'forge', item: 'forge' };
STN.forge = '구리 제작대';
OBJ.root.drops.push(['resin', 1, 1, 0.4]); OBJ.bigShroom.drops.push(['resin', 1, 1, 0.25]);
export const WTYPE = {
  fist: { n: '주먹', reach: 1.15, arc: 1.0, cd: 0.3, kb: 4 },
  sword: { n: '검', reach: 1.45, arc: 1.3, cd: 0.36, kb: 8 },
  axe: { n: '도끼', reach: 1.5, arc: 1.2, cd: 0.5, kb: 10, chop: 1.6 },
  dagger: { n: '단검', reach: 1.2, arc: 1.05, cd: 0.22, kb: 4, crit: 0.15 },
  spear: { n: '창', reach: 2.35, arc: 0.42, cd: 0.46, kb: 11 },
  hammer: { n: '망치', reach: 1.7, arc: 2.5, cd: 0.72, kb: 16 },
  bow: { n: '활', ranged: 'arrow', range: 6.5, cd: 0.62, spd: 12, kb: 2.5 },
  staff: { n: '지팡이', ranged: 'orb', range: 6.5, cd: 0.66, spd: 8, mp: 5, magic: 1, kb: 2 },
};
for (const id of ['swordWood', 'swordCopper', 'swordIron', 'swordCrystal']) ITEMS[id].wt = 'sword';
export const rarDefault = () => { for (const id in ITEMS) if ((ITEMS[id].kind === 'sword' || ITEMS[id].kind === 'pick') && RAR[id] == null) RAR[id] = 0; };
// id: [name, type, damage, recipe, durability, repair, description, orb colour] (아이콘은 art/content.js의 WEAPON_ICON)
export const WEAPONS = {
  daggerWood: ['나무 단검', 'dagger', 4, [['wood', 3], ['fiber', 2]], 150, [['wood', 2]], '짧지만 아주 빠르게 찔러요. 치명타가 잘 터져요.'],
  spearWood: ['나무 창', 'spear', 6, [['wood', 5], ['rope', 1]], 180, [['wood', 3]], '멀리 있는 적을 콕 찔러요. 앞쪽 좁은 곳만 맞혀요.'],
  bowWood: ['나무 활', 'bow', 4, [['wood', 4], ['rope', 2]], 160, [['rope', 1]], '멀리 화살을 쏴요. 화살은 따로 필요 없어요.'],
  daggerCopper: ['구리 단검', 'dagger', 8, [['copperBar', 3], ['wood', 1], ['rope', 1]], 300, [['copperBar', 1]], '빠르게 콕콕! 치명타가 잘 터져요.'],
  spearCopper: ['구리 창', 'spear', 12, [['copperBar', 4], ['wood', 3], ['rope', 1]], 320, [['copperBar', 2]], '긴 창으로 멀리서 안전하게 찔러요.'],
  hammerCopper: ['구리 망치', 'hammer', 20, [['copperBar', 6], ['wood', 2], ['stone', 4]], 300, [['copperBar', 2]], '느리지만 넓게 쾅! 적을 멀리 밀어내요.'],
  staffGlow: ['빛버섯 지팡이', 'staff', 9, [['wood', 4], ['glowcap', 4], ['gel', 3], ['copperBar', 1]], 250, [['glowcap', 2]], '기력을 조금 써서 적을 꿰뚫는 빛 구슬을 쏴요. 지혜가 높을수록 세져요.', '#9ff2e6'],
  spearIron: ['철 창', 'spear', 19, [['ironBar', 4], ['wood', 3], ['rope', 2]], 550, [['ironBar', 2]], '묵직한 철 창. 멀리서 깊게 찔러요.'],
  hammerIron: ['철 망치', 'hammer', 32, [['ironBar', 7], ['wood', 2], ['resin', 2]], 600, [['ironBar', 3]], '바닥이 울릴 만큼 강한 한 방.'],
  bowIron: ['사냥꾼의 활', 'bow', 11, [['ironBar', 3], ['wood', 4], ['rope', 3], ['gel', 2]], 450, [['ironBar', 1], ['rope', 1]], '팽팽한 시위로 빠른 화살을 쏴요.'],
  staffCrystal: ['수정 지팡이', 'staff', 17, [['crystal', 10], ['ironBar', 4], ['glowcap', 4]], 700, [['crystal', 3]], '보랏빛 구슬이 적 여럿을 꿰뚫어요.', '#d6c2ff'],
  bowCrystal: ['별빛 활', 'bow', 18, [['crystal', 10], ['ironBar', 4], ['rope', 4], ['glowcap', 2]], 800, [['crystal', 3]], '별빛처럼 반짝이는 화살을 쏴요.'],
  axeStone: ['돌 도끼', 'axe', 8, [['stone', 4], ['wood', 3], ['rope', 1]], 200, [['stone', 2]], '묵직하게 내려찍어요. 들고 있으면 나무도 더 빨리 베요.'],
  axeCopper: ['구리 도끼', 'axe', 15, [['copperBar', 4], ['wood', 2], ['rope', 1]], 350, [['copperBar', 2]], '단단한 구리 도끼. 적을 멀리 밀어내고 나무도 잘 베요.'],
  axeIron: ['철 도끼', 'axe', 23, [['ironBar', 4], ['wood', 2], ['resin', 1]], 550, [['ironBar', 2]], '날이 선 철 도끼. 한 번에 크게 찍어요.'],
};
export const WEAPON_DUR = {}, DUR2 = {};
for (const id in WEAPONS) { const [n, wt, dmg, req, dur, fix, d, orb] = WEAPONS[id];
  ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, orb }; WEAPON_DUR[id] = [dur, fix]; RECIPES.push(Rc(id, 1, req, 'bench', 'weapon')); }
// ---- boss-only weapons (epic) with on-hit effects ----
export const FXN = { poison: '독: 맞은 적이 몇 초 동안 계속 아파요', slow: '끈적끈적: 맞은 적이 느려져요', split: '수정 파편: 맞은 곳에서 파편 3개가 튀어 주변 적도 맞혀요', burn: '불꽃: 맞은 적이 불타올라요', chill: '서리: 맞은 적이 꽁꽁 얼어 아주 느려져요' };
export const UNIQ = {
  daggerQueen: ['포자 여왕의 단검', 'dagger', 18, 650, [['shroomCap', 3]], '버섯 여왕이 남긴 단검. 찌를 때마다 독 포자가 퍼져요.', 'poison', 'queen'],
  hammerSlime: ['말랑대왕 망치', 'hammer', 34, 700, [['gel', 6]], '말랑대왕의 왕관 조각으로 만든 망치. 맞은 적이 끈적해져 느려져요.', 'slow', 'slime'],
  bowGolem: ['수정 거인의 활', 'bow', 24, 900, [['crystal', 4]], '수정골렘의 팔로 만든 활. 화살이 맞으면 수정 파편이 튀어요.', 'split', 'golem'],
};
export const UNIQ_OF = {};
for (const id in UNIQ) { const [n, wt, dmg, dur, fix, d, fx, boss] = UNIQ[id];
  ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, fx, orb: '#d6c2ff' }; WEAPON_DUR[id] = [dur, fix]; UNIQ_OF[boss] = id; }
ITEMS.golemCore = { n: '수정 핵', d: '수정골렘의 가슴에서 빛나던 핵. 수정 곡괭이를 만드는 데 써요.' };
ITEMS.pickCrystal = { n: '수정 곡괭이', kind: 'pick', power: 4, tier: 3, stack: 1, d: '아주 단단한 곡괭이. 용암·얼음 지역의 벽까지 캘 수 있어요.' };
WEAPON_DUR.pickCrystal = [1400, [['crystal', 3]]];
RECIPES.push(Rc('pickCrystal', 1, [['crystal', 10], ['ironBar', 4], ['golemCore', 1], ['glowcap', 2]], 'forge', 'tool'));
// rarity: 0 일반 · 1 고급 · 2 희귀 · 3 영웅 · 4 전설
export const RARITY = [['일반', '#d9d0e2'], ['고급', '#7fe0b5'], ['희귀', '#7fb8ff'], ['영웅', '#c89aff'], ['전설', '#ffc35a']];
export const RAR = { pickIron: 1, swordIron: 1, spearIron: 1, hammerIron: 1, bowIron: 1, staffGlow: 1, swordCrystal: 2, staffCrystal: 2, bowCrystal: 2, pickCrystal: 2, golemCore: 2, daggerQueen: 3, hammerSlime: 3, bowGolem: 3 };
RECIPES.push(Rc('gMoss', 1, [['fiber', 1]], null, 'mat'), Rc('rope', 1, [['fiber', 3]], null, 'mat'), Rc('forge', 1, [['copperBar', 3], ['wood', 8], ['resin', 2]], 'bench', 'furn'));
// crafting asks for one or two more kinds of material than before
export const REQ_FIX = {
  chest: [['wood', 8], ['resin', 1]], furnace: [['dirt', 10], ['wood', 4], ['resin', 1]], pot: [['copperBar', 3], ['stone', 4], ['wood', 2]],
  pickCopper: [['copperBar', 4], ['wood', 2], ['rope', 2]], swordCopper: [['copperBar', 5], ['wood', 1], ['gel', 2]],
  pickIron: [['ironBar', 4], ['copperBar', 2], ['rope', 2], ['resin', 1]], swordIron: [['ironBar', 5], ['copperBar', 1], ['gel', 3]],
  swordCrystal: [['crystal', 8], ['ironBar', 3], ['glowcap', 3]], shovel: [['copperBar', 2], ['wood', 3], ['rope', 1]], rod: [['wood', 3], ['rope', 1], ['gel', 1]],
  table: [['wood', 6], ['fiber', 2], ['resin', 1]], bed: [['wood', 8], ['fiber', 6], ['rope', 2]], shelf: [['wood', 10], ['resin', 1]],
  lampShroom: [['glowcap', 2], ['wood', 2], ['gel', 1]], lampCrystal: [['crystal', 3], ['ironBar', 1], ['glowcap', 1]],
  mossSofa: [['wood', 6], ['fiber', 6], ['rope', 1]], mossBed: [['wood', 8], ['fiber', 8], ['rope', 2]],
  shroomTable: [['shroomCap', 4], ['wood', 2], ['resin', 1]], shroomWardrobe: [['shroomCap', 6], ['wood', 6], ['resin', 2]],
  cryFountain: [['crystal', 6], ['stone', 6], ['glowcap', 2]], cryMirror: [['crystal', 4], ['ironBar', 2], ['glowcap', 1]],
  copperLamp: [['copperBar', 2], ['wood', 1], ['glowcap', 1]], grandClock: [['copperBar', 1], ['wood', 6], ['resin', 1]], ironStove: [['ironBar', 3], ['stone', 4], ['copperBar', 1]],
};
for (const r of RECIPES) { if (REQ_FIX[r.out]) r.req = REQ_FIX[r.out]; if (ITEMS[r.out].kind === 'sword') r.cat = 'weapon'; }
// anything made of copper, iron or crystal is crafted at the copper workbench, not the basic one
export const METAL = ['copperBar', 'ironBar', 'crystal'];
for (const r of RECIPES) if (r.at === 'bench' && r.out !== 'forge' && r.req.some(([id]) => METAL.includes(id))) r.at = 'forge';
rarDefault();
export const HOT = 9, BAG0 = 24, BAG_STEP = 6, BAG_MAX_LV = 3;
export const BAG_UPS = [['bagUp1', '튼튼한 가방', [['fiber', 20], ['rope', 6], ['resin', 2]], 'bench'], ['bagUp2', '여행자의 가방', [['rope', 10], ['gel', 10], ['copperBar', 4]], 'forge'], ['bagUp3', '큰 모험가 가방', [['rope', 16], ['shroomCap', 8], ['ironBar', 4]], 'forge']];
BAG_UPS.forEach(([id, n, req, at], k) => { ITEMS[id] = { n, bagUp: k + 1, d: `만들면 가방이 ${BAG_STEP}칸 늘어나요 (${BAG0 + BAG_STEP * k}칸 → ${BAG0 + BAG_STEP * (k + 1)}칸).` }; const r = Rc(id, 1, req, at, 'tool'); r.bag = k; RECIPES.push(r); });
