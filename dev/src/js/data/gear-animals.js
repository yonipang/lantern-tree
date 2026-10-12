// ================= 장비·반지·강화·동물 데이터 (구조 변경 2단계: features/gear-animals.js에서 데이터만 옮김) =================
// 불꽃·서리 작물, 옷·장신구, 장비제작대, 반지, 강화 비용·효과, 동물·목장 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 features/gear-animals.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { C } from '../engine/canvas.js';
import { CROP_SOIL, STAR_OF } from './farming-cooking.js';
import { ENEMY } from './rpg-nature.js';
import { ITEMS, OBJ, RAR, RECIPES, Rc, STN } from './items.js';
import { QSIDE } from './quests.js';
import { G } from '../save/state.js';

// ================= deep caves: fire berry and frost radish crops, clothes and charms, cold/heat gauge =================
Object.assign(OBJ, {
  cropFire: { n: '불꽃 열매', crop: 'fire', grow: 200, yield: [['fireBerry', 2, 3, 1], ['fireSeed', 1, 2, 1]] },
  cropRadish: { n: '서리 무', crop: 'radish', grow: 200, yield: [['radish', 2, 3, 1], ['radishSeed', 1, 2, 1]] },
});
Object.assign(CROP_SOIL, { cropFire: 2, cropRadish: 1 }); Object.assign(STAR_OF, { fireBerry: 'fireBerryS', radish: 'radishS' });
Object.assign(ITEMS, {
  fireSeed: { n: '불꽃 열매 씨앗', kind: 'seed', crop: 'cropFire', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분 20초쯤 뒤 불꽃 열매가 열려요. 흙이 잘 맞아요.' },
  radishSeed: { n: '서리 무 씨앗', kind: 'seed', crop: 'cropRadish', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분 20초쯤 뒤 서리 무가 자라요. 이끼가 잘 맞아요.' },
  radish: { n: '서리 무', kind: 'food', food: 10, heal: 6, d: '얼음 동굴에서 온 시원한 무. 더위를 식히는 요리에 들어가요.' },
  fireBerryS: { n: '별 불꽃 열매', kind: 'food', food: 26, heal: 20, d: '별 작물에서 딴 특별한 불꽃 열매. 제작에서는 불꽃 열매 대신 쓸 수 있어요.' },
  radishS: { n: '별 서리 무', kind: 'food', food: 12, heal: 6, d: '별 작물에서 딴 특별한 서리 무. 제작에서는 서리 무 대신 쓸 수 있어요.' },
});
OBJ.fireBloom.drops.push(['fireSeed', 1, 1, 0.25]); ENEMY.snowling.drops.push(['radishSeed', 1, 1, 0.2]);
export const ACC_OF = { turtle: 'turtleCharm', spirit: 'snowBrooch' };
Object.assign(ITEMS, {
  obsCoat: { n: '흑요석 외투', kind: 'wear', slot: 'body', guard: 'cold', stack: 1, d: '얼음 동굴의 추위 게이지가 반 속도로 올라요. 입으면 어두운 보랏빛 외투가 보여요.' },
  frostRobe: { n: '서리 비단옷', kind: 'wear', slot: 'body', guard: 'hot', stack: 1, d: '용암 동굴의 더위 게이지가 반 속도로 올라요. 입으면 하늘빛 비단옷이 보여요.' },
  turtleCharm: { n: '거북 등껍질 부적', kind: 'wear', slot: 'neck', stack: 1, d: '용암 거북의 등껍질 조각. 목에 걸면 불덩이와 용암 웅덩이 피해가 30% 줄어요.' },
  snowBrooch: { n: '눈꽃 브로치', kind: 'wear', slot: 'head', stack: 1, d: '서리 정령의 눈꽃. 머리에 꽂으면 얼어서 느려지는 시간이 절반이 돼요.' },
});
RECIPES.push(Rc('obsCoat', 1, [['obsidian', 4], ['fiber', 10], ['goldBar', 1]], 'forge', 'tool'), Rc('frostRobe', 1, [['frostShard', 6], ['fiber', 10], ['goldBar', 1]], 'forge', 'tool'));
// v42: slots in their own 「장비」 menu — clothes · head · neck · ring (rings arrive with the smelter in v43); v48: the weapon slot is gone (the held weapon is used)
export const EQ_SLOTS = [['body', '옷'], ['head', '머리장식'], ['neck', '목걸이'], ['ring', '반지']], EQ_N = Object.fromEntries(EQ_SLOTS);
// ---- v43 smelter 「용광로」 (v58: renamed 「장비제작대」): upgrade gear (+1 … +5) and break it down; rings are made here too ----
ITEMS.smelter = { n: '장비제작대', kind: 'place', obj: 'smelter', d: '장비에 재료를 넣어 강화하고(최대 +5), 장비를 분해해 재료 일부를 돌려받아요. 반지도 여기서 만들어요. (v58 전 이름: 용광로)' };
OBJ.smelter = { n: '장비제작대', solid: 1, station: 'smelter', item: 'smelter', light: [3.4, '#ff8a3d'] };
STN.smelter = '장비제작대';
RECIPES.push(Rc('smelter', 1, [['wood', 10], ['stone', 8], ['resin', 2]], 'bench', 'furn')); // v58: made early at the workbench from wood and stone
// rings: [name, effect, base, per level, recipe, rarity, band, gem]
export const RINGS = {
  ringCu: ['구리 반지', 'atk', .04, .01, [['copperBar', 4], ['gel', 2]], 0, C.copper, '#ff8fa3'],
  ringFe: ['철 반지', 'def', .04, .01, [['ironBar', 4], ['copperBar', 2]], 1, C.iron, '#7fe0b5'],
  ringQ: ['석영 반지', 'mp', .2, .05, [['quartzR', 3], ['ironBar', 2]], 2, '#d8d2ee', '#ffffff'],
  ringGem: ['수정결정 반지', 'xp', .08, .02, [['cryGem', 2], ['quartzR', 2], ['ironBar', 2]], 2, C.iron, C.cry],
  ringGold: ['금 반지', 'mine', .1, .02, [['goldBar', 3], ['cryGem', 1]], 3, '#ffd25c', '#7ff0e6'],
};
export const RING_TXT = { atk: v => `공격력 +${pct2(v)}`, def: v => `받는 피해 -${pct2(v)}`, mp: v => `기력 회복 +${pct2(v)}`, xp: v => `경험치 +${pct2(v)}`, mine: v => `채굴 속도 +${pct2(v)}` };
export const pct2 = v => Math.round(v * 100) + '%';
for (const id in RINGS) { const [n, k, b, per, req, rar, band, gem] = RINGS[id];
  ITEMS[id] = { n, kind: 'wear', slot: 'ring', stack: 1, ring: k, d: `반지 칸에 끼면 ${RING_TXT[k](b)}. 장비제작대에서 강화할 때마다 ${Math.round(per * 100)}%씩 더 좋아져요.` }; RAR[id] = rar;
  RECIPES.push(Rc(id, 1, req, 'smelter', 'ring')); }
export const UPG_MAX = 5, UPG_DMG = .08, UPG_POW = .1, UPG_MAT = ['copperBar', 'ironBar', 'quartzR', 'goldBar', 'goldBar'];
export const guardMul = lv => .5 - .05 * lv, turtleCut = lv => .3 + .04 * lv, broochMul = lv => .5 - .05 * lv;
// ---- v45 pets: wild animals roam their home region; catch one with the lasso mini-game (spin the rope, throw in the green zone) and it follows you with a small buff ----
export const ANIMALS = {
  dog: { n: '강아지', pn: '멍멍이', biome: 0, pet: 1, spd: 1.3, fx: '떨어진 물건을 끌어오는 범위 +60%', col: '#c98a5a' },
  rabbit: { n: '토끼', pn: '깡총이', biome: 1, pet: 1, spd: 1.7, fx: '희귀 이상 재료가 나올 확률 +25%', col: '#f4f0f8' },
  cat: { n: '고양이', pn: '야옹이', biome: 2, pet: 1, spd: 1.2, fx: '낚시 운 1단계 (별빛 잉어가 잘 낚여요)', col: '#f0a860' },
};
ITEMS.lasso = { n: '올가미 밧줄', kind: 'lasso', stack: 1, d: '들고 동물 가까이에서 누르면 [포획]. 빙글빙글 도는 밧줄이 초록 구간에 왔을 때 던져요. 세 번 성공하면 친구가 돼요.' };
RECIPES.push(Rc('lasso', 1, [['rope', 4], ['wood', 2], ['gel', 1]], 'bench', 'tool'));
QSIDE.push({ id: 's_pet', t: '동물 친구 데려오기', h: '장비제작대에서 올가미 밧줄을 만들어 들고, 이끼 동굴의 강아지·버섯숲의 토끼·수정 동굴의 고양이에게 다가가 [포획]해요.', done: () => Object.keys(G.pets || {}).length > 0, rw: [['stew', 2], ['gel', 4]], xp: 40 });
// ---- v46 ranch: catch cows, chickens and sheep with the same lasso, set them down anywhere and collect milk, eggs and wool ----
Object.assign(ANIMALS, {
  cow: { n: '소', biome: 0, ranch: 'milk', spd: .8, every: 300, verb: '우유 짜기' },
  chicken: { n: '닭', biome: 0, ranch: 'egg', spd: 1.4, every: 240, verb: '달걀 줍기' },
  sheep: { n: '양', biome: 1, ranch: 'wool', spd: .9, every: 360, verb: '털 깎기' },
});
for (const k of ['cow', 'chicken', 'sheep']) { const A2 = ANIMALS[k];
  ITEMS[k] = { n: A2.n, kind: 'place', obj: k, stack: 9, d: `원하는 곳에 내려놓으면 ${Math.round(A2.every / 60)}분마다 ${A2.verb.split(' ')[0]}${A2.ranch === 'wool' ? '을' : '를'} 얻어요. [회수]로 다시 데려올 수 있어요.` };
  OBJ[k] = { n: A2.n, solid: 1, item: k, ranch: A2.ranch, every: A2.every }; }
Object.assign(ITEMS, {
  milk: { n: '우유', kind: 'food', food: 12, heal: 8, d: '소에게서 짠 고소한 우유. 그냥 마셔도 되고 팬케이크에도 들어가요.' },
  egg: { n: '달걀', d: '닭이 낳은 따끈한 달걀. 요리솥에서 부치거나 팬케이크를 만들어요.' },
  wool: { n: '양모', d: '양에게서 깎은 폭신한 털. 털모자와 양털 러그를 만들어요.' },
  friedEgg: { n: '달걀 프라이', kind: 'food', food: 20, heal: 12, d: '노른자가 반짝이는 달걀 프라이.' },
  pancake: { n: '베리 팬케이크', kind: 'food', food: 36, heal: 24, d: '우유와 달걀로 구운 폭신한 팬케이크에 베리를 올렸어요.' },
  woolHat: { n: '털모자', kind: 'wear', slot: 'head', stack: 1, d: '머리에 쓰면 얼음 동굴의 추위 게이지가 천천히 올라요 (옷과 함께 쓰면 더 좋아요).' },
  woolRug: { n: '양털 러그', kind: 'place', obj: 'woolRug', d: '폭신폭신한 양털 러그. 위로 걸어 다닐 수 있어요.' },
});
OBJ.woolRug = { n: '양털 러그', flat: 1, item: 'woolRug' };
RECIPES.push(Rc('friedEgg', 1, [['egg', 1]], 'pot', 'food'), Rc('pancake', 1, [['egg', 1], ['milk', 1], ['berry', 2]], 'pot', 'food'), Rc('woolHat', 1, [['wool', 4], ['fiber', 2]], 'bench', 'tool'), Rc('woolRug', 1, [['wool', 3]], 'bench', 'furn'));
QSIDE.push({ id: 's_ranch', t: () => `목장 동물 세 종류 데려오기 (${Object.keys(G.stats.ranchK || {}).length}/3)`, h: '올가미 밧줄을 들고 이끼 동굴의 소·닭, 버섯숲의 양을 [포획]해요. 원하는 곳에 내려놓으면 우유·달걀·양모를 줘요.', done: () => Object.keys(G.stats.ranchK || {}).length >= 3, rw: [['pancake', 3], ['wool', 4]], xp: 60 });
