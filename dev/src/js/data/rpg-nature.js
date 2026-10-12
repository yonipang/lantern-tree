// ================= 성장·스킬·몬스터·자연 데이터 (구조 변경 2단계: content/rpg-nature.js에서 데이터만 옮김) =================
// 레벨·능력치 이름·스킬·낚시 표·몬스터 수치·꽃·나무 자라는 시간·자연 꾸미기 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 content/rpg-nature.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { ITEMS, OBJ, RECIPES, Rc } from './items.js';
import { BX, BY, SA, SB, SI, SL, W } from '../world/map.js';
import { G, beat } from '../save/state.js';

// ---- level, stats and skills ----
export const MAX_LV = 30, XP_NEED = lv => 20 + (lv - 1) * 18;
export const STATN = { str: ['힘', '근접 무기 피해 +5% · 캐는 힘 +3%'], dex: ['민첩', '활 피해 +3% · 공격 속도 +1% (최대 20%) · 이동 속도 +1%'], vit: ['체력', '최대 체력 +8 · 배고파지는 속도 −2%'], int: ['지혜', '지팡이·스킬 피해 +3.5% · 최대 기력 +6'] };
export const SKILLS = {
  dash: { n: '구르기', act: 1, lv: 2, max: 3, mp: l => 12 - l * 2, cd: () => 1.4, d: l => `바라보는 쪽으로 데굴 굴러요. 구르는 동안은 다치지 않아요${l > 1 ? ` · 거리 +${(l - 1) * 15}%` : ''}` },
  spin: { n: '회전 베기', act: 1, lv: 3, max: 3, mp: () => 18, cd: l => 5.5 - l, d: l => `빙글 돌며 주변의 적을 모두 베요. 무기 피해의 ${130 + 30 * l}%` },
  bolt: { n: '빛 화살', act: 1, lv: 4, max: 3, mp: () => 12, cd: () => 1.1, d: l => `적을 꿰뚫는 빛 화살을 쏴요. 피해 ${10 + 6 * l} (지혜로 강해져요)` },
  quake: { n: '광맥 부수기', act: 1, lv: 5, max: 3, mp: l => 22 - l * 4, cd: () => 4, d: () => '바라보는 곳의 벽 3×3을 한 번에 캐요 (곡괭이 등급까지)' },
  heal: { n: '등불 치유', act: 1, lv: 6, max: 3, mp: () => 28, cd: l => 14 - l * 2, d: l => `따뜻한 빛으로 체력을 ${20 + 12 * l} 회복해요` },
  tough: { n: '튼튼한 몸', lv: 1, max: 3, d: l => `받는 피해 −${7 * l}%` },
  miner: { n: '광부의 손', lv: 1, max: 3, d: l => `캐는 힘 +${25 * l}%` },
  gourmet: { n: '든든한 배', lv: 2, max: 3, d: l => `배고파지는 속도 −${15 * l}% · 음식 효과 +${10 * l}%` },
  lucky: { n: '행운', lv: 3, max: 3, d: l => `재료가 하나 더 나올 확률 +${12 * l}%` },
  swift: { n: '날쌘 발', lv: 4, max: 3, d: l => `이동 속도 +${6 * l}%` },
};
// v44: two more skills each for general · magic · bow; skills are grouped by kind in the 능력 panel
Object.assign(SKILLS, {
  stomp: { n: '땅울림', act: 1, lv: 7, max: 3, mp: () => 16, cd: l => 8 - l, d: l => `발을 쿵 굴러 둘레 2.5칸의 적을 멀리 밀쳐내고 느리게 해요. 무기 피해의 ${70 + 20 * l}%` },
  warrior: { n: '전사의 기술', lv: 8, max: 3, d: l => `근접 무기 피해 +${6 * l}% · 근접 공격 속도 +${3 * l}%` },
  volley: { n: '화살비', act: 1, lv: 9, max: 3, mp: () => 20, cd: l => 7 - l, d: l => `활로 화살 ${3 + 2 * l}발을 부채꼴로 쏴요. 한 발에 활 피해의 ${50 + 10 * l}% (활을 들고 있어야 해요)` },
  hawk: { n: '매의 눈', lv: 10, max: 3, d: l => `활 피해 +${8 * l}% · 활 사거리 +${15 * l}%` },
  frostRing: { n: '서리 고리', act: 1, lv: 11, max: 3, mp: () => 24, cd: () => 8, d: l => `둘레 3칸에 서리를 퍼뜨려 피해 ${12 + 8 * l}를 주고 꽁꽁 얼려요 (지혜로 강해져요)` },
  arcane: { n: '마력 순환', lv: 12, max: 3, d: l => `최대 기력 +${8 * l} · 마법 피해 +${6 * l}%` },
});
export const SK_CAT = [['gen', '일반', ['dash', 'spin', 'stomp', 'tough', 'warrior', 'swift']], ['magic', '마법', ['bolt', 'heal', 'frostRing', 'arcane']], ['bow', '활', ['volley', 'hawk']], ['life', '생활', ['quake', 'miner', 'gourmet', 'lucky']]];
export const CATCH = { 0: [['minnow', 50], ['crucian', 34], ['boot', 10], ['koi', 6]], 1: [['catfish', 44], ['sporeEel', 30], ['minnow', 12], ['boot', 8], ['koi', 6]], 2: [['smelt', 46], ['shrimp', 30], ['crystal', 8], ['boot', 6], ['koi', 10]] };
export const ENEMY = {
  slimeG: { n: '초록 말랑이', hp: 14, dmg: 6, spd: 2.6, r: 0.32, hop: 1, drops: [['gel', 1, 1, 0.7]], col: '#86d96b' },
  slimeO: { n: '주황 말랑이', hp: 30, dmg: 10, spd: 2.8, r: 0.34, hop: 1, drops: [['gel', 1, 2, 0.8]], col: '#f2a65a' },
  slimeP: { n: '보라 말랑이', hp: 55, dmg: 15, spd: 3.0, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['crystal', 1, 1, 0.4]], col: '#b58cf0' },
  shroomy: { n: '버섯도깨비', hp: 24, dmg: 9, spd: 2.1, r: 0.3, hop: 0, drops: [['mushroom', 1, 2, 0.8], ['spore', 1, 1, 0.35]], col: '#a65fd1' },
};


// ---- petals & flower critters (bloomlings) living in zones of the moss caves ----
export const FLOWERS = { R: ['빨강', '빨간', '#ff6b81', '#ffb3c0', '#d0485e'], B: ['파랑', '파란', '#6fa8ff', '#c2dcff', '#4a78d0'], Y: ['노랑', '노란', '#ffd25c', '#fff1b0', '#d9a53a'], W: ['하양', '하얀', '#f4f0f8', '#ffffff', '#c9c0d6'], K: ['까망', '검은', '#4a3f5c', '#8a7aa6', '#2a2238'] };
for (const c in FLOWERS) { const [n, adj, col, cL, cD] = FLOWERS[c];
  ITEMS['petal' + c] = { n: `${adj} 꽃잎`, d: `${n} 꽃망울이 떨어뜨리는 꽃잎. 자연 꾸미기 재료예요.` };
  ENEMY['bloom' + c] = c === 'K' ? { n: `${n} 꽃망울`, hp: 46, dmg: 11, spd: 2.2, r: 0.3, hop: 0, calm: 1, drops: [['petalK', 1, 2, 1], ['petalR', 1, 1, 0.3]], col }
    : { n: `${n} 꽃망울`, hp: 18, dmg: 6, spd: 1.9, r: 0.3, hop: 0, calm: 1, drops: [['petal' + c, 1, 2, 1], ['berrySeed', 1, 1, 0.08]], col }; }
OBJ.wildF = { n: '들꽃', hp: 1, nat: 'cut', drops: [] };
// ---- saplings, stumps and regrowth ----
Object.assign(OBJ, {
  sapling: { n: '뿌리기둥 묘목', growTo: 'root', into: '뿌리기둥' },
  capSapling: { n: '아기 큰버섯', growTo: 'bigShroom', into: '큰버섯' },
  stump: { n: '그루터기', growTo: 'g', stump: 1, into: '뿌리기둥' },
  capStump: { n: '버섯 밑동', growTo: 'g', stump: 1, into: '큰버섯' },
});
Object.assign(ITEMS, {
  sapling: { n: '뿌리기둥 묘목', kind: 'seed', crop: 'sapling', d: '흙·이끼·버섯흙 바닥에 심으면 3분쯤 뒤 뿌리기둥으로 자라요.' },
  capSapling: { n: '아기 큰버섯', kind: 'seed', crop: 'capSapling', d: '흙·이끼·버섯흙 바닥에 심으면 3분쯤 뒤 큰버섯으로 자라요.' },
  berryBush: { n: '베리덤불', kind: 'place', obj: 'bush', d: '삽으로 퍼 온 베리덤불. 원하는 곳에 옮겨 심으면 다시 열매가 열려요.' },
});
OBJ.root.drops.push(['sapling', 1, 1, 0.22]); OBJ.bigShroom.drops.push(['capSapling', 1, 1, 0.22]);
export const GROW_TIME = 180, REGROW_TIME = 240, YOUNG_T = 60; // each tree step lasts YOUNG_T: sapling → young sapling → young tree → grown (stumps wait one step first)
export const YOUNG_TREES = ['root', 'bigShroom', 'cherryTree', 'roundTree', 'bigTree'];
export const NFLOOR = { 11: ['waterShallow', '얕은 물 타일', '자갈이 비치는 맑은 물. 위로 걸어 다닐 수 있어요.', [['gWater', 1], ['stone', 1]]], 12: ['waterPond', '연못 물 타일', '연잎이 동동 떠 있는 연못.', [['gWater', 1], ['gMoss', 1]]],
  13: ['waterStep', '징검돌 물 타일', '징검돌이 놓인 물길.', [['gWater', 1], ['stone', 3]]], 14: ['waterCrystal', '수정 샘물 타일', '보랏빛으로 반짝이는 샘물.', [['gWater', 1], ['crystal', 1]]],
  15: ['waterPetal', '꽃잎 물 타일', '벚꽃잎이 떠다니는 물.', [['gWater', 1], ['petalW', 1], ['petalR', 1]]], 16: ['floorCherry', '벚꽃 타일', '벚꽃잎이 흩날린 이끼 바닥.', [['dirt', 1], ['gMoss', 1], ['petalW', 1], ['petalR', 1]]] };
for (const f in NFLOOR) { const [id, n, d, req] = NFLOOR[f]; ITEMS[id] = { n, kind: 'floor', floor: +f, d }; RECIPES.push(Rc(id, 4, req, req.some(([m]) => m === 'crystal') ? 'forge' : 'bench', 'nature')); }
export const NATURE = {
  cherryTree: ['벚꽃나무', '분홍 꽃잎이 흩날리는 커다란 벚꽃나무.', [['dirt', 6], ['gMoss', 6], ['wood', 10], ['petalW', 8], ['petalR', 6]], 0],
  roundTree: ['둥근 나무', '동글동글한 초록 나무.', [['dirt', 4], ['gMoss', 4]], 0],
  shrub: ['덤불', '푸릇푸릇한 작은 덤불.', [['dirt', 2], ['gMoss', 2]], 0],
  hydrangea: ['수국 덤불', '파란 꽃송이가 탐스러운 수국.', [['dirt', 1], ['gMoss', 1], ['petalB', 3]], 0],
  roseBlack: ['흑장미 덤불', '신비로운 검은 장미가 핀 덤불.', [['dirt', 1], ['gMoss', 1], ['petalK', 2], ['petalR', 1]], 0],
  sunflower: ['해바라기', '키가 큰 노란 해바라기.', [['dirt', 1], ['gMoss', 1], ['petalY', 3]], 0],
  daisies: ['데이지 무리', '작고 하얀 데이지. 위로 걸어 다닐 수 있어요.', [['gMoss', 1], ['petalW', 2]], 1],
  flowerBed: ['꽃밭', '빨강·파랑·노랑 꽃이 가득한 꽃밭. 위로 걸어 다닐 수 있어요.', [['dirt', 2], ['gMoss', 2], ['petalR', 2], ['petalB', 2], ['petalY', 2]], 1],
};
for (const id in NATURE) { const [n, d, req, flat] = NATURE[id]; ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = flat ? { n, flat: 1, item: id } : { n, solid: 1, item: id }; RECIPES.push(Rc(id, 1, req, 'bench', 'nature')); }
RECIPES.push(Rc('sapling', 1, [['wood', 3], ['dirt', 2], ['fiber', 2]], 'bench', 'nature'));
Object.assign(OBJ.cherryTree, { ntree: 1, nat: 'cut', hp: 6, drops: [['wood', 3, 5, 1], ['petalW', 1, 2, 0.5], ['petalR', 1, 1, 0.3]] });
Object.assign(OBJ.roundTree, { ntree: 1, nat: 'cut', hp: 5, drops: [['wood', 2, 4, 1], ['sapling', 1, 1, 0.2]] });

// ---- 보스 (구조 변경 2단계: save/state.js·game/combat.js에서 옮김) — 체력·자리·재도전 보상 ----
export const BOSSES = {
  slime: { n: '말랑대왕', hp: 720, home: () => ({ x: BX + .5, y: BY + .5 }), wake: 8.5, hr: .95, col: '#86d96b', spr: 'boss', scale: 1.25 },
  queen: { n: '버섯 여왕', hp: 700, home: () => ({ x: SA.x + .5, y: SA.y - 3 }), wake: 8, hr: 1.0, col: '#b673de', spr: 'queen', scale: 1.15 },
  golem: { n: '수정골렘', hp: 1500, home: () => ({ x: SB.x + .5, y: SB.y + 4.2 }), wake: 8, hr: 1.1, col: '#b493f5', spr: 'golem', scale: 1.2 },
  turtle: { n: '용암 거북', hp: 2300, home: () => ({ x: SL.x + .5, y: SL.y - 3.5 }), wake: 8, hr: 1.2, col: '#ff8a3d', spr: 'turtle', scale: 1.2 },
  spirit: { n: '서리 정령', hp: 2000, home: () => ({ x: SI.x + 4, y: SI.y + .5 }), wake: 8, hr: 1.0, col: '#9fd8f0', spr: 'spirit', scale: 1.15 },
};
export const BKEYS = ['slime', 'queen', 'golem', 'turtle', 'spirit'];
// ---- calling a beaten boss back for another fight ----
export const REMATCH = { queen: [['shroomCap', 6], ['glowcap', 4], ['spore', 2], ['ironBar', 2]], slime: [['gel', 10], ['copperBar', 4], ['ironOre', 4]], golem: [['crystal', 6], ['cryGem', 2], ['golemCore', 1], ['ironBar', 3]], turtle: [['lavaCore', 1], ['goldBar', 4], ['obsidian', 3]], spirit: [['frostCore', 1], ['frostShard', 8], ['goldBar', 2]] };

// ---- 바닥 타일 → 아이템, 삽으로 뜰 수 있는 지형과 배우는 조건 (구조 변경 5단계: world.js에서 옮김) ----
// ---- terrain: ground you can dig with a shovel and lay elsewhere, unlocked one by one ----
export const FLOOR_ITEM = { 5: 'floorWood', 6: 'floorStone', 7: 'floorMoss', 8: 'floorShroom', 9: 'floorCrystal' };
for (const f in NFLOOR) FLOOR_ITEM[f] = NFLOOR[f][0];
FLOOR_ITEM[21] = 'meadow';
// how: shown while locked · when: unlock condition (checked often, so it also works for old saves)
export const TERRAIN = {
  2: { n: '흙', item: 'gDirt', base: true },
  1: { n: '이끼', item: 'gMoss', how: '퀘스트 「구리 곡괭이 만들기」를 마치면 배워요', when: () => G.guide > 5 },
  10: { n: '물', item: 'gWater', how: '물고기를 10마리 낚으면 배워요', when: () => (G.stats.fishCaught || 0) >= 10 },
  3: { n: '버섯흙', item: 'gShroom', how: '버섯 여왕을 물리치면 배워요', when: () => beat('queen') },
  4: { n: '수정바닥', item: 'gCrystal', how: '수정골렘을 물리치면 배워요', when: () => beat('golem') },
};
