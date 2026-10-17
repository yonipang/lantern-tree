// ================= 회로·기계·깊은 지역 데이터 (구조 변경 2단계: content/circuits-regions.js에서 데이터만 옮김) =================
// 전선·전지·발전기·채굴기, 깊은 동굴 재료·몬스터 수치·생성 수, 황금·전설 장비, 화살, 채굴장 산출 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 content/circuits-regions.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { C } from '../engine/canvas.js';
import { CATCH, ENEMY } from './rpg-nature.js';
import { DUR2, ITEMS, OBJ, RAR, RECIPES, Rc, UNIQ_OF, USE, USE_LBL, WEAPON_DUR } from './items.js';

Object.assign(ITEMS, {
  wire: { n: '전선', kind: 'wire', d: '바닥에 깔아 전기를 이어요. 위·아래·옆으로 붙은 전선끼리 연결돼요. 전선을 들고 전선 칸을 누르면 걷어요.' },
  battery: { n: '건전지', kind: 'place', obj: 'battery', stack: 1, d: '붙은 전선에 전기를 보내요. 쓰면 줄어들고, 작업대 [수리]에서 다시 충전해요.' },
  generator: { n: '발전기', kind: 'place', obj: 'generator', d: '연료(나무·젤·송진)를 넣으면 건전지 없이 전기를 계속 만들어요. 기계가 일할 때만 연료를 써요.' },
  crystalGen: { n: '수정 발전기', kind: 'place', obj: 'crystalGen', d: '수정의 힘으로 연료 없이 영원히 전기를 만들어요.' },
  lever: { n: '레버', kind: 'place', obj: 'lever', d: '누르면 켜고 꺼요. 켜져 있을 때만 양쪽 전선을 이어 줘요.' },
  plate: { n: '압력판', kind: 'place', obj: 'plate', d: '누군가 올라서 있는 동안만 양쪽 전선을 이어 줘요.' },
  timer: { n: '타이머 회로', kind: 'place', obj: 'timer', d: '정해진 간격으로 켜졌다 꺼졌다 하며 양쪽 전선을 이어요. 누르면 간격이 바뀌어요.' },
  eLamp: { n: '전기 램프', kind: 'place', obj: 'eLamp', d: '전기가 들어오면 환하게 켜져요.' },
  eDoor: { n: '전기 문', kind: 'place', obj: 'eDoor', d: '전기가 들어오면 열리고, 끊기면 닫혀요.' },
  drillCu: { n: '구리 채굴기', kind: 'place', obj: 'drillCu', d: '놓을 때 바라보는 쪽의 벽에서 광물을 계속 캐요(벽은 사라지지 않아요). 흙·구리·돌·철 광맥까지. 전기가 필요해요.' },
  drillFe: { n: '철 채굴기', kind: 'place', obj: 'drillFe', d: '화강암 벽·석영 광맥까지 더 빠르게 캐는 채굴기. 전기가 필요해요.' },
});
Object.assign(OBJ, {
  battery: { n: '건전지', solid: 1, item: 'battery', src: 'batt' },
  generator: { n: '발전기', solid: 1, item: 'generator', src: 'gen', light: [2.5, '#ff9a4a'] },
  crystalGen: { n: '수정 발전기', solid: 1, item: 'crystalGen', src: 'cgen', light: [4, '#c6b0ff'] },
  lever: { n: '레버', solid: 1, item: 'lever', sw: 'lever' },
  plate: { n: '압력판', flat: 1, item: 'plate', sw: 'plate' },
  timer: { n: '타이머 회로', solid: 1, item: 'timer', sw: 'timer' },
  eLamp: { n: '전기 램프', solid: 1, item: 'eLamp', dev: 'lamp', light: [7, '#fff1c0'], idle: .02 },
  eDoor: { n: '전기 문', solid: 1, item: 'eDoor', dev: 'door', door: 1, idle: .01 },
  drillCu: { n: '구리 채굴기', solid: 1, item: 'pitCu', dev: 'drill', tier: 1, every: 12, draw: .5, idle: 0 },
  drillFe: { n: '철 채굴기', solid: 1, item: 'pitFe', dev: 'drill', tier: 2, every: 7, draw: .8, idle: 0 },
});
ITEMS.drillGold = { n: '황금 채굴기', kind: 'place', obj: 'drillGold', d: '용암·얼음 동굴의 금·서리 광맥까지 빠르게 캐는 채굴기. 전기가 필요해요.' };
OBJ.drillGold = { n: '황금 채굴기', solid: 1, item: 'pitGold', dev: 'drill', tier: 3, every: 5, draw: 1, idle: 0 };
Object.assign(USE, { battery: 'batt', generator: 'fuel', crystalGen: 'cinfo', lever: 'lever', plate: 'cinfo', timer: 'timer', eLamp: 'cinfo', eDoor: 'cinfo', drillCu: 'drill', drillFe: 'drill', drillGold: 'drill' });
Object.assign(USE_LBL, { batt: '확인', fuel: '연료 넣기', cinfo: '살펴보기', lever: '레버 당기기', timer: '간격 바꾸기', drill: '꺼내기' });
export const BATT_MAX = 600, FUEL = { wood: 30, gel: 45, resin: 90 }, FUEL_MAX = 3600, DRILL_CAP = 60;
RECIPES.push(Rc('wire', 10, [['copperBar', 1], ['rope', 1]], 'forge', 'circuit'), Rc('battery', 1, [['copperBar', 2], ['gel', 3], ['glowcap', 1]], 'forge', 'circuit'),
  Rc('lever', 1, [['copperBar', 1], ['wood', 2]], 'forge', 'circuit'), Rc('plate', 1, [['copperBar', 1], ['stone', 3]], 'forge', 'circuit'), Rc('timer', 1, [['copperBar', 2], ['glowcap', 1], ['ironBar', 1]], 'forge', 'circuit'),
  Rc('eLamp', 1, [['copperBar', 1], ['glowcap', 2]], 'forge', 'circuit'), Rc('eDoor', 1, [['ironBar', 2], ['copperBar', 2], ['wood', 2]], 'forge', 'circuit'),
  Rc('generator', 1, [['ironBar', 6], ['stone', 16], ['copperBar', 4]], 'forge', 'circuit'), Rc('crystalGen', 1, [['crystal', 16], ['ironBar', 8], ['glowcap', 6]], 'forge', 'circuit'));
// ---- deep regions: lava cave (south) and ice cave (west) ----
Object.assign(ITEMS, {
  goldOre: { n: '금광석', d: '용암 동굴의 금 광맥에서 나와요. 용광로에서 녹여요.' },
  goldBar: { n: '금괴', d: '반짝이는 금괴. 깊은 동굴 장비를 만들어요.' },
  obsidian: { n: '흑요석', d: '현무암벽을 캐면 가끔 나오는 검은 돌. 아주 날카로워요.' },
  frostShard: { n: '서리 결정', d: '얼음 동굴의 서리 광맥에서 나오는 차가운 결정.' },
  fireBerry: { n: '불꽃 열매', kind: 'food', food: 22, heal: 20, d: '용암 동굴 불꽃풀에 열리는 따끈한 열매.' },
  lavaCore: { n: '용암 핵', d: '용암 거북의 등껍질 속에서 끓던 핵. 전설 장비 재료예요.' },
  frostCore: { n: '서리 핵', d: '서리 정령의 마음이었던 차가운 핵. 전설 장비 재료예요.' },
});
RECIPES.push(Rc('goldBar', 1, [['goldOre', 2]], 'furnace', 'mat'));
ITEMS.meadow = { n: '풀밭', kind: 'floor', floor: 21, d: '씨앗을 심는 밭이에요. 이끼 포자는 풀밭에서만 자라요.' };
ITEMS.mossSpore = { n: '이끼 포자', kind: 'seed', crop: 'cropMoss', d: '풀밭에 심으면 1분 30초쯤 뒤 이끼가 소복이 자라요. 거두면 이끼 한 삽과 포자를 다시 얻어요.' };
OBJ.cropMoss = { n: '이끼', crop: 'moss', grow: 90, yield: [['gMoss', 2, 3, 1], ['mossSpore', 1, 2, 1], ['fiber', 1, 1, 0.5]] };
OBJ.grass.drops.push(['mossSpore', 1, 1, 0.25]);
RECIPES.push(Rc('meadow', 4, [['dirt', 2], ['fiber', 2]], 'bench', 'nature'), Rc('mossSpore', 2, [['fiber', 3]], null, 'mat'));
OBJ.fireBloom = { n: '불꽃풀', hp: 1, nat: 'cut', light: [2.6, '#ff9b4a'], drops: [['fireBerry', 1, 1, 0.6], ['fiber', 1, 1, 0.4]] };
OBJ.iceCluster = { n: '얼음 결정', solid: 1, hp: 4, tier: 2, nat: 'mine', light: [3, '#9fe8ff'], drops: [['frostShard', 1, 2, 1]] };
Object.assign(ENEMY, {
  magmaSlime: { n: '용암 말랑이', hp: 95, dmg: 20, spd: 3.0, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['obsidian', 1, 1, 0.25], ['goldOre', 1, 1, 0.2]], col: '#ff7a3d' },
  cinder: { n: '불씨 도깨비', hp: 80, dmg: 19, spd: 2.5, r: 0.3, hop: 0, drops: [['fireBerry', 1, 1, 0.4], ['goldOre', 1, 1, 0.3]], col: '#ff9b4a' },
  frostSlime: { n: '얼음 말랑이', hp: 90, dmg: 18, spd: 2.9, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['frostShard', 1, 1, 0.35]], col: '#9fd8f0' },
  snowling: { n: '눈뭉치', hp: 85, dmg: 18, spd: 2.3, r: 0.32, hop: 0, drops: [['frostShard', 1, 1, 0.35], ['fiber', 1, 2, 0.4]], col: '#e8f4ff' },
});
// tougher monsters everywhere (bloom critters stay gentle); deeper places notice you from farther away
Object.assign(ENEMY.slimeG, { hp: 18, dmg: 7 }); Object.assign(ENEMY.slimeO, { hp: 40, dmg: 12, aggro: 5.5 }); Object.assign(ENEMY.slimeP, { hp: 75, dmg: 18, aggro: 6 }); Object.assign(ENEMY.shroomy, { hp: 34, dmg: 11, spd: 2.3, aggro: 5.5 });
Object.assign(ENEMY.magmaSlime, { hp: 120, dmg: 24, aggro: 6.5 }); Object.assign(ENEMY.cinder, { hp: 105, dmg: 22, spd: 2.7, aggro: 6.5 }); Object.assign(ENEMY.frostSlime, { hp: 115, dmg: 22, aggro: 6.5 }); Object.assign(ENEMY.snowling, { hp: 110, dmg: 22, spd: 2.5, aggro: 6.5 });
export const SPAWN_CAP = [6, 8, 9, 10, 10], SPAWN_EVERY = [2.6, 2.3, 2.0, 1.6, 1.6], SPAWN_PACK = [0, .2, .3, .4, .4];
CATCH[3] = CATCH[2]; CATCH[4] = [['smelt', 50], ['shrimp', 26], ['crucian', 10], ['boot', 6], ['koi', 8]];
// deep gear (영웅) and legendary (전설)
export const GEAR2 = {
  swordGold: ['황금 검', 'sword', 36, [['goldBar', 6], ['obsidian', 2], ['ironBar', 2]], 1100, [['goldBar', 2]], '묵직하게 빛나는 황금 검.'],
  daggerObsidian: ['흑요석 단검', 'dagger', 24, [['obsidian', 4], ['goldBar', 1], ['rope', 1]], 900, [['obsidian', 2]], '유리처럼 날카로운 단검. 치명타가 잘 터져요.'],
  hammerObsidian: ['흑요석 망치', 'hammer', 54, [['obsidian', 6], ['goldBar', 3], ['wood', 2]], 1000, [['obsidian', 3]], '땅이 갈라질 만큼 무거운 한 방.'],
  spearFrost: ['서리 창', 'spear', 34, [['frostShard', 8], ['goldBar', 2], ['wood', 3]], 1000, [['frostShard', 3]], '찌르면 적이 꽁꽁 얼어붙어요.', null, 'chill'],
  staffFrost: ['눈꽃 지팡이', 'staff', 28, [['frostShard', 6], ['crystal', 4], ['glowcap', 3]], 1000, [['frostShard', 3]], '눈꽃 구슬이 적을 꿰뚫고 얼려요.', '#d4f6ff', 'chill'],
  bowGold: ['황금 활', 'bow', 28, [['goldBar', 4], ['rope', 3], ['frostShard', 2]], 1000, [['goldBar', 2]], '황금빛 화살이 멀리 날아가요.'],
};
for (const id in GEAR2) { const [n, wt, dmg, req, dur, fix, d, orb, fx] = GEAR2[id]; ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, orb, fx }; DUR2[id] = [dur, fix]; RAR[id] = 3; RECIPES.push(Rc(id, 1, req, 'forge', 'weapon')); }
ITEMS.pickGold = { n: '황금 곡괭이', kind: 'pick', power: 5, tier: 3, stack: 1, d: '깊은 동굴의 벽도 빠르게 캐는 곡괭이.' }; DUR2.pickGold = [1800, [['goldBar', 2]]]; RAR.pickGold = 3;
RECIPES.push(Rc('pickGold', 1, [['goldBar', 6], ['obsidian', 2], ['frostShard', 2]], 'forge', 'tool'));
Object.assign(UNIQ_OF, { turtle: 'swordLava', spirit: 'bowFrost' });
ITEMS.swordLava = { n: '용암 거북의 대검', kind: 'sword', wt: 'sword', dmg: 44, stack: 1, fx: 'burn', d: '용암 거북의 등껍질을 깎아 만든 대검. 벤 자리에 불꽃이 일어요.' }; DUR2.swordLava = [1300, [['obsidian', 3]]]; RAR.swordLava = 3;
ITEMS.bowFrost = { n: '서리 정령의 활', kind: 'sword', wt: 'bow', dmg: 32, stack: 1, fx: 'chill', d: '서리 정령이 남긴 활. 화살에 맞은 적이 얼어붙어요.' }; DUR2.bowFrost = [1300, [['frostShard', 3]]]; RAR.bowFrost = 3;
ITEMS.swordDawn = { n: '새벽빛 검', kind: 'sword', wt: 'sword', dmg: 62, stack: 1, fx: 'burn', d: '용암과 서리의 핵을 함께 벼린 전설의 검. 새벽처럼 환하게 타올라요.' }; DUR2.swordDawn = [2400, [['goldBar', 2], ['crystal', 2]]]; RAR.swordDawn = 4;
ITEMS.pickStar = { n: '별빛 곡괭이', kind: 'pick', power: 7, tier: 3, stack: 1, d: '별빛이 깃든 전설의 곡괭이. 어떤 벽이든 순식간에 캐요.' }; DUR2.pickStar = [3000, [['goldBar', 2], ['frostShard', 2]]]; RAR.pickStar = 4;
RECIPES.push(Rc('swordDawn', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['crystal', 10]], 'forge', 'weapon'), Rc('pickStar', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['frostShard', 8]], 'forge', 'tool'));
Object.assign(RAR, { goldBar: 2, frostShard: 2, obsidian: 2, lavaCore: 3, frostCore: 3 });
// ---- v42 mineral arrows: optional ammo — a bow shoots plain wooden arrows forever, but carries the best arrows in the bag first (one per shot) ----
// id: [name, damage ×, tip colour, recipe (makes 10), station, pierce, effect]
export const ARROWS = {
  arrowStone: ['돌 화살', 1.15, '#b9b4cc', [['stone', 2], ['wood', 1]], 'bench', 0],
  arrowCopper: ['구리 화살', 1.3, '#e5884a', [['copperBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowIron: ['철 화살', 1.5, '#d8e0ea', [['ironBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowCrystal: ['수정 화살', 1.7, '#c1a8f5', [['crystal', 2], ['wood', 1], ['fiber', 1]], 'forge', 1],
  arrowGold: ['금 화살', 1.9, '#ffd25c', [['goldBar', 1], ['wood', 2], ['fiber', 1]], 'forge', 0, 'burn'],
};
export const ARROW_ORD = Object.keys(ARROWS).reverse(); // best first
for (const id in ARROWS) { const [n, mul, tip, req, at, pierce, fx] = ARROWS[id];
  ITEMS[id] = { n, kind: 'arrow', stack: 999, arw: { mul, tip, pierce, fx }, d: `활을 쓸 때 가방에 있으면 한 발에 하나씩 써요. 화살이 없으면 나무 화살을 써요.` }; RECIPES.push(Rc(id, 10, req, at, 'weapon')); }
Object.assign(RAR, { arrowIron: 1, arrowCrystal: 2, arrowGold: 2 });
// ---- v42 stone drill: an electric drill like the ore drills, cheaper and quicker, but only for terrain (dirt and stone walls) ----
ITEMS.drillStone = { n: '돌 채굴기', kind: 'place', obj: 'drillStone', d: '놓을 때 바라보는 쪽의 지형(흙벽·돌벽·화강암 벽)에서 흙·돌·화강암을 계속 캐요(벽은 사라지지 않아요). 광맥은 못 캐는 대신 구리 채굴기보다 빨라요. 전기가 필요해요.' };
OBJ.drillStone = { n: '돌 채굴기', solid: 1, item: 'quarry', dev: 'drill', tier: 1, only: [1, 2, 3], every: 8, draw: .4, idle: 0 };
USE.drillStone = 'drill';
// v46: what was asked for was a Palworld-style stone pit (돌 채굴장, a 2×2 site that only gives stone), so the wall drill has no recipe any more;
// drills already set down keep working, and picking one up (or loading a save that holds one) gives a 돌 채굴장 instead
// ---- v43 crystal cave materials: granite (terrain) · quartz 석영 (mineral, the old 'crystal' item) · 수정결정 (the region's own core material) ----
RECIPES.push(Rc('quartzR', 1, [['crystal', 2]], 'furnace', 'mat'));
Object.assign(RAR, { quartzR: 1, cryGem: 2 });
{ const setReq = (out, req) => { const r = RECIPES.find(q => q.out === out); if (r) { r.req = req; r.at = 'forge'; } };
  setReq('swordCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 3]]);
  setReq('staffCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 4], ['glowcap', 4]]);
  setReq('bowCrystal', [['quartzR', 4], ['cryGem', 2], ['ironBar', 4], ['rope', 4]]);
  setReq('pickCrystal', [['quartzR', 5], ['ironBar', 4], ['golemCore', 1], ['glowcap', 2]]);
  setReq('staffFrost', [['frostShard', 6], ['quartzR', 2], ['cryGem', 1], ['glowcap', 3]]);
  setReq('swordDawn', [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['quartzR', 6], ['cryGem', 2]]);
  setReq('arrowCrystal', [['quartzR', 1], ['wood', 1], ['fiber', 1]]);
  setReq('lampCrystal', [['cryGem', 1], ['crystal', 2], ['ironBar', 1]]); }
// ---- multi-tile objects (2×1, 2×2, 3×2 …): the top-left tile holds the object, the other tiles hold {t:'_part', a: anchor} ----
OBJ._part = { n: '', part: 1 };
// ---- tree workshop: a 2×2 plot of saplings; chop when grown, or power it to chop by itself into a chest next to it ----
export const FARM_GROW = 90, FARM_CAP = 60;
export const FARM_TXT = { treeFarm: ['베기', '나무를 베었어요! 묘목이 다시 자라요', '나무가 자라는 중이에요', '#7fbf6a', 'wood'], quarry: ['캐기', '돌을 캤어요! 바위가 다시 차올라요', '바위가 차오르는 중이에요', '#a29db6', 'stone'],
  pitCu: ['캐기', '구리광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.copper, 'copperOre'], pitFe: ['캐기', '철광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', C.iron, 'ironOre'], pitGold: ['캐기', '금광석을 캤어요! 광맥이 다시 차올라요', '광맥이 차오르는 중이에요', '#ffd25c', 'goldOre'] };
export const PIT_Y = { quarry: ['stone', 5, 7], pitCu: ['copperOre', 3, 4], pitFe: ['ironOre', 3, 4], pitGold: ['goldOre', 2, 3] }; // v46: each pit gives one material only

// ---- 모든 장비의 내구도·분해 (구조 변경 2단계: game/actions.js에서 옮김) — 위 파일들의 무기·장비 내구도(WEAPON_DUR·DUR2)를 다 넣은 뒤에 합쳐요 ----
// ---- durability: tools wear with use; at 0 they are broken (kept, but unusable) until repaired at a workbench ----
// [max uses, full repair cost]
export const DUR = { pickWood: [200, [['wood', 3]]], pickCopper: [400, [['copperBar', 2]]], pickIron: [800, [['ironBar', 2]]],
  swordWood: [120, [['wood', 3]]], swordCopper: [250, [['copperBar', 2]]], swordIron: [450, [['ironBar', 2]]], swordCrystal: [800, [['crystal', 3]]],
  rod: [150, [['fiber', 2]]], shovel: [250, [['copperBar', 1]]] };
Object.assign(DUR, WEAPON_DUR, DUR2); DUR.battery = [600, [['glowcap', 1], ['gel', 2]]];
// ---- salvage: break equipment down at a workbench and get 70% of its crafting materials back (rounded) ----
export const SALVAGE_RATE = 0.7, SALVAGE_BASE = { pickWood: [['wood', 3]], swordWood: [['wood', 3]] }; // starter tools have no recipe
