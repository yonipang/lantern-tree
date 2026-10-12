// ================= data =================
// v47: two map layouts. 1 = the original 200×200 map (every save made before v47 keeps it); 2 = the 600×600 ring map for new games:
// the lantern tree in the middle, a ring split into the moss cave (north) and mushroom forest (south), then a wide ring split into
// the crystal cave (north), lava cave (south-east) and ice cave (south-west), a sea ring, and hard rock at the edge
let LAY = 1, W = 200, H = 200, CX = 100, CY = 100, BX = 144, BY = 102, SA = { x: 54, y: 118 }, SB = { x: 106, y: 24 }, SL = { x: 96, y: 184 }, SI = { x: 16, y: 104 };
const L2 = { r1: 34, r2: 100, r3: 250, r4: 272 }; // ring radii of layout 2 (start · moss/mushroom · crystal/lava/ice · sea; rock beyond)
function setLayout(v) { LAY = v === 2 ? 2 : 1;
  if (LAY === 2) { W = H = 600; CX = CY = 300; const at = (deg, r) => ({ x: Math.round(CX + Math.cos(deg * Math.PI / 180) * r), y: Math.round(CY + Math.sin(deg * Math.PI / 180) * r) });
    const b = at(-35, 64); BX = b.x; BY = b.y; SA = at(140, 66); SB = at(-90, 172); SL = at(30, 172); SI = at(150, 172); }
  else { W = H = 200; CX = CY = 100; BX = CX + 44; BY = CY + 2; SA = { x: CX - 46, y: CY + 18 }; SB = { x: CX + 6, y: CY - 76 }; SL = { x: CX - 4, y: CY + 84 }; SI = { x: CX - 84, y: CY + 4 }; }
  layoutTexts(); }
const devLayout = () => { try { const v = +localStorage.getItem('lantern-tree-layout'); return v === 1 || v === 2 ? v : 0; } catch (_) { return 0; } }; // tests pin the old layout
const DIR8 = ['동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽'];
const dirKo = (x, y) => DIR8[((Math.round(Math.atan2(y - CY, x - CX) / (Math.PI / 4)) % 8) + 8) % 8];
const LAVA = 17;
const idx = (x, y) => y * W + x;
const CRYGEM_P = 0.35; // a crystal cluster gives one 수정결정 this often, otherwise one 석영
const WALLS = {
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
const TIERNAME = ['나무 곡괭이', '구리 곡괭이', '철 곡괭이', '수정 곡괭이'];
const BIOME = ['이끼 동굴', '버섯숲', '수정 동굴', '용암 동굴', '얼음 동굴'];
const FURN_D = '집을 꾸미는 예쁜 가구예요.';
const ITEMS = {
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
  swordWood: { n: '나무 검', kind: 'sword', dmg: 6, stack: 1, d: '처음부터 가진 검. 단축칸에서 골라 들면 이 검으로 싸워요.' },
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
const OBJ = {
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
  cluster: { n: '수정 결정', solid: 1, hp: 4, tier: 1, nat: 'mine', light: [3.5, '#b99bff'], drops: [], dropFn: (x, y) => spawnDrop(Math.random() < CRYGEM_P ? 'cryGem' : 'crystal', 1, x, y) },
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
const USE = { chair: 'sit', stumpStool: 'sit', shroomStool: 'sit', cryChair: 'sit', mossSofa: 'sit', bed: 'sleep', mossBed: 'sleep', cushion: 'pet',
  torch: 'lamp', lampShroom: 'lamp', lampCrystal: 'lamp', sproutLamp: 'lamp', sporeLamp: 'lamp', fishTank: 'feed', shelf: 'read', cryMirror: 'mirror',
  shroomWardrobe: 'dress', cryFountain: 'wish', plant: 'water', vase: 'water', bootPlanter: 'water', table: 'tea', shroomTable: 'tea', cryTable: 'tea' };
const USE_LBL = { sit: '앉기', sleep: '잠자기', pet: '쓰다듬기', feed: '밥 주기', read: '책 읽기', mirror: '거울 보기', dress: '꾸미기', wish: '소원 빌기', water: '물 주기', tea: '차 마시기' };
const TIPS = ['무기·도구·가구는 단축칸에서 골라 들면 그 일만 해요. 빈손이면 앞에 있는 것에 맞춰 열기·줍기·캐기를 해요.', '활을 쓸 때 가방에 광물 화살이 있으면 좋은 화살부터 써서 더 세게 쏴요.', '도끼를 들고 나무를 베면 더 빨리 베요.', '횃불이나 램프로 밝힌 곳에는 몬스터가 생기지 않아요.', '침대에서 자면 체력이 가득 차고, 그 침대에서 다시 깨어나요.',
  '말랑대왕은 착지할 때 충격파를 내요. 점프하면 멀리 떨어져요.', '버섯 여왕의 포자는 둥글게 퍼져요. 포자 사이 틈으로 빠져나가요.', '수정골렘이 벽에 부딪혀 기절하면 1.5배 피해를 줄 수 있어요.',
  '수정 분수에서 소원을 빌면 잠시 희귀 물고기가 잘 낚여요.', '구리 낫이 가방에 있으면 작물을 하나씩 더 얻어요. 꾹 누르면 주변 3×3을 한 번에 거둬요.', '바닥 타일을 물 위에 깔면 다리가 돼요.', '찌가 쏙 들어가고 느낌표가 뜨면 바로 당겨요!', '의자에 앉아 있으면 체력이 조금씩 차올라요.'];
const COMPLIMENTS = ['오늘도 귀여워요!', '반짝반짝, 멋진 모험가예요', '새싹이 생기 있어 보여요', '웃는 얼굴이 제일 예뻐요'];
OBJ.bigShroom.drops.push(['shroomCap', 1, 2, 1]);
const SETN = { moss: '이끼 세트', shroom: '버섯 세트', crystal: '수정 세트' };
const STN = { bench: '작업대', furnace: '용광로', pot: '요리솥' }; // v58: 화로 → 용광로 (the old 용광로 is now 장비제작대)
const Rc = (out, n, req, at, cat) => ({ out, n, req, at, cat });
// recipes people usually make many of at once get a quantity picker
const isMulti = r => ['build', 'food', 'mat'].includes(r.cat) || ['floor', 'wall', 'ground', 'food', 'mat', 'fert'].includes(ITEMS[r.out].kind);
function maxCraft(r) { let m = 99; for (const [id, c] of r.req) m = Math.min(m, Math.floor(availCount(id) / c)); return Math.max(0, m); }
const RECIPES = [
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
