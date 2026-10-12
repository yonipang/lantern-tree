// ================= 농사·숨은 방·요리 데이터 (구조 변경 2단계: features/farming-cooking.js에서 데이터만 옮김) =================
// 낫·물뿌리개·비료, 맞는 흙·별 작물, 숨은 방 장식, 버프·요리·레시피 쪽지, 용광로·요리솥 시간, 낚시 운 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 이 파일은 shell.html에서 features/farming-cooking.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { FLOWERS } from './rpg-nature.js';
import { ITEMS, OBJ, RECIPES, Rc, TIPS } from './items.js';
import { QSIDE } from './quests.js';
import { G, beat } from '../save/state.js';
import { knows, pct } from '../sim/cooking.js';
import { availCount0 } from '../sim/inventory.js';

// ---- farming basics: copper sickle, watering can, fertilizer (water and fertilizer marks live on the crop object: w, f, p0) ----
export const WCAN_MAX = 10;
Object.assign(ITEMS, {
  sickle: { n: '구리 낫', kind: 'sickle', stack: 1, d: '가방에 있기만 해도 작물을 거둘 때 하나씩 더 얻어요. 다 자란 작물 앞에서 꾹 누르고 있으면 주변 3×3을 한 번에 거둬요. 닳지 않아요.' },
  wcan: { n: '물뿌리개', kind: 'wcan', stack: 1, d: `도구 칸에서 골라 들고 물가를 바라보며 누르면 가득 채워요 (${WCAN_MAX}번). 자라는 작물에 물을 주면 25% 빨리 자라요.` },
  fert: { n: '비료', kind: 'fert', d: '단축칸에서 골라 들고 자라는 작물에 뿌리면 남은 성장 시간이 바로 40% 줄어요. 작물마다 한 번만 줄 수 있어요.' },
  fertShroom: { n: '버섯 비료', kind: 'fert', fx: 'shroom', d: '비료와 같아요. 버섯에 주면 거둘 때 빛버섯이 나올 확률이 30%에서 60%로 올라요.' },
});
RECIPES.push(Rc('sickle', 1, [['copperBar', 3], ['wood', 2], ['rope', 1]], 'forge', 'farm'), Rc('wcan', 1, [['copperBar', 2], ['resin', 1]], 'forge', 'farm'),
  Object.assign(Rc('fert', 2, [['dirt', 3], ['gel', 1]], 'bench', 'farm'), { need: () => beat('queen') }), Object.assign(Rc('fertShroom', 2, [['gShroom', 1], ['spore', 1]], 'bench', 'farm'), { need: () => beat('queen') }));
QSIDE.push(
  { id: 's_crop1', t: () => '베리 심고 거두기', h: '베리 씨앗을 이끼나 흙 바닥에 심고, 다 자라면 거둬요. 작물을 바라보면 몇 단계인지 보여요.', done: () => (G.stats.berryH || 0) >= 1, rw: [['berrySeed', 3], ['spore', 3]], xp: 15 },
  { id: 's_crop2', t: () => `물 준 작물 5개 거두기 (${Math.min(5, G.stats.wetH || 0)}/5)`, h: '구리 장비제작대에서 물뿌리개를 만들어 물가에서 채우고, 자라는 작물에 물을 줘요. 물 준 작물은 25% 빨리 자라요.', done: () => (G.stats.wetH || 0) >= 5, rw: [['copperBar', 3]], xp: 25 },
  { id: 's_crop3', t: () => `비료 10번 쓰기 (${Math.min(10, G.stats.fert || 0)}/10)`, h: '버섯 여왕을 물리치면 작업대에서 비료를 만들 수 있어요. 자라는 작물에 뿌리면 남은 시간이 확 줄어요.', done: () => (G.stats.fert || 0) >= 10, rw: [['gel', 6]], xp: 40 });
TIPS.push('물뿌리개로 물을 준 작물은 25% 빨리 자라요. 물가에서 채워요.', '비료는 작물마다 한 번, 남은 성장 시간을 40% 줄여 줘요.');
// ---- farming, deeper: matching soil, star crops (after the crystal golem), glowcap and crystal bean crops ----
export const CROP_SOIL = { cropBerry: 1, cropShroom: 3, cropGlow: 3, cropBean: 4 }, SOIL_N = { 1: '이끼', 2: '흙', 3: '버섯흙', 4: '수정 모래' };
export const STAR_OF = { berry: 'berryS', mushroom: 'mushroomS', glowcap: 'glowcapS', cbean: 'cbeanS' };
Object.assign(OBJ, {
  cropGlow: { n: '빛버섯', crop: 'glow', grow: 150, yield: [['glowcap', 2, 3, 1], ['glowSpore', 1, 2, 1]] },
  cropBean: { n: '수정 콩', crop: 'bean', grow: 180, yield: [['cbean', 2, 3, 1], ['cbeanSeed', 1, 2, 1]] },
});
Object.assign(ITEMS, {
  glowSpore: { n: '빛버섯 포자', kind: 'seed', crop: 'cropGlow', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 2분 30초쯤 뒤 빛버섯이 자라요. 다 자라면 은은하게 빛나요. 버섯흙이 잘 맞아요.' },
  cbeanSeed: { n: '수정 콩 씨앗', kind: 'seed', crop: 'cropBean', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분쯤 뒤 수정 콩이 열려요. 수정 모래가 잘 맞아요.' },
  cbean: { n: '수정 콩', kind: 'food', food: 6, heal: 3, d: '수정처럼 반짝이는 콩. 오독오독 씹어 먹어도 맛있어요.' },
  berryS: { n: '별 통통베리', kind: 'food', food: 17, heal: 6, d: '별 작물에서 딴 특별한 베리. 제작에서는 통통베리 대신 쓸 수 있어요 (보통 베리를 먼저 써요).' },
  mushroomS: { n: '별 버섯', kind: 'food', food: 10, heal: 0, d: '별 작물에서 딴 특별한 버섯. 제작에서는 버섯 대신 쓸 수 있어요 (보통 버섯을 먼저 써요).' },
  glowcapS: { n: '별 빛버섯', d: '별 작물에서 딴 특별한 빛버섯. 제작에서는 빛버섯 대신 쓸 수 있어요 (보통 빛버섯을 먼저 써요).' },
  cbeanS: { n: '별 수정 콩', kind: 'food', food: 8, heal: 4, d: '별 작물에서 딴 특별한 수정 콩. 제작에서는 수정 콩 대신 쓸 수 있어요.' },
  fertCry: { n: '수정 비료', kind: 'fert', fx: 'cry', d: '비료와 같아요. 맞는 흙에 심은 작물이 별 작물이 될 확률이 15%에서 35%로 올라요.' },
});
ITEMS.berrySeed.d = '흙·이끼·버섯흙·수정 모래·풀밭에 심어요. 이끼가 잘 맞아요.'; ITEMS.spore.d = '흙·이끼·버섯흙·수정 모래·풀밭에 심어요. 버섯흙이 잘 맞아요.';
OBJ.cluster.drops.push(['cbeanSeed', 1, 1, 0.1]); OBJ.glow.drops.push(['glowSpore', 1, 1, 0.25]);
RECIPES.push(Object.assign(Rc('fertCry', 2, [['gCrystal', 1], ['crystal', 1]], 'forge', 'farm'), { need: () => beat('golem') }));
QSIDE.push({ id: 's_crop4', t: () => `별 작물 5개 거두기 (${Math.min(5, G.stats.starH || 0)}/5)`, h: '수정골렘을 물리친 뒤, 작물을 맞는 흙에 심으면 가끔 별 작물로 자라요. 베리는 이끼, 버섯·빛버섯은 버섯흙, 수정 콩은 수정 모래예요.', done: () => (G.stats.starH || 0) >= 5, rw: [['crystal', 8]], xp: 60 });
TIPS.push('맞는 흙에 심은 작물은 가끔 별 작물이 돼요. 다 자라면 작은 별이 반짝여요.', '수정 결정을 캐면 가끔 수정 콩 씨앗이 나와요.');
// ---- hidden-room treasure chest and the one-of-a-kind decorations found in them ----
OBJ.tchest = { n: '보물상자', solid: 1, tchest: 1, light: [2.2, '#ffd25c'] };
export const ROOM_DECO_DEF = {
  mossLantern: ['이끼 석등', '이끼 동굴 숨은 방에서 찾은 오래된 석등. 따뜻하게 빛나요.', [4.5, '#ffd27a']],
  sporeChime: ['포자 풍경', '버섯숲 숨은 방에서 찾은 풍경. 보랏빛 포자 방울이 은은하게 빛나요.', [3, '#d59bff']],
  cryVase: ['수정 꽃병', '수정 동굴 숨은 방에서 찾은 꽃병. 꽂힌 수정이 보랏빛으로 빛나요.', [3, '#b99bff']],
  emberBowl: ['흑요석 화로', '용암 동굴 숨은 방에서 찾은 흑요석 화로. 꺼지지 않는 불씨가 타올라요.', [4, '#ff9b4a']],
  iceSwan: ['얼음 백조', '얼음 동굴 숨은 방에서 찾은 얼음 조각. 녹지 않고 반짝여요.', [2.5, '#9fd8f0']],
};
for (const id in ROOM_DECO_DEF) { const [n, d, light] = ROOM_DECO_DEF[id]; ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = { n, solid: 1, item: id, light }; }
OBJ.emberBowl.flick = 1;
QSIDE.push({ id: 's_rooms', t: () => `숨은 방 보물상자 3개 열기 (${Math.min(3, G.stats.chests || 0)}/3)`, h: '벽에 금이 가 있고 틈으로 빛이 새어 나오면 그 너머에 숨은 방이 있어요. 지역마다 한두 곳씩 숨어 있어요.', done: () => (G.stats.chests || 0) >= 3, rw: [['glowSpore', 3], ['cbeanSeed', 2]], xp: 50 });
TIPS.push('벽에 금이 가 있고 틈으로 빛이 새어 나오면, 그 너머에 숨은 방이 있을지도 몰라요.');
// ================= cooking: buff dishes, recipe notes, recipe book =================
// a dish gives one effect in one of three tiers; up to 3 different effects at once, the same effect keeps only its best tier
export const BUFF_DUR = [180, 300, 480], BUFF_MAX = 3;
export const EFF = {
  atk: { n: '공격력', v: [.05, .10, .15], t: v => '+' + pct(v) }, def: { n: '받는 피해', v: [.05, .10, .15], t: v => '-' + pct(v) },
  move: { n: '이동 속도', v: [.10, .15, .20], t: v => '+' + pct(v) }, mine: { n: '채굴 속도', v: [.10, .20, .30], t: v => '+' + pct(v) },
  light: { n: '빛 범위', v: [.25, .50, .75], t: v => '+' + pct(v) }, regen: { n: '체력 재생', v: [4, 2, 1], t: v => `${v}초마다 +1` },
  maxhp: { n: '최대 체력', v: [10, 20, 30], t: v => '+' + v }, hunger: { n: '배고픔 절약', v: [.75, .5, .35], t: v => `${pct(v)} 속도로 줄어듦` },
  luck: { n: '낚시 운', v: [1, 2, 3], t: v => `${v}단계` }, xp: { n: '경험치', v: [.10, .20, .30], t: v => '+' + pct(v) },
};
// [id, name, effect, tier (0: recovery only, no effect slot), icon shape, colors, ingredients, where its recipe note is found]
export const DISHES = [
  ['skewer', '버섯 꼬치', 'atk', 1, 'skewer', ['#e36b6b', '#ff7aa2'], [['mushroom', 3], ['berry', 1]], 'mon'],
  ['capSteak', '버섯 갓 스테이크', 'atk', 2, 'plate', ['#b9573f', '#6ff2e6'], [['shroomCap', 2], ['glowcap', 1]], 'room:r10'],
  ['gelSoup', '말랑 젤 수프', 'def', 1, 'bowl', ['#9be37a', '#e36b6b'], [['gel', 2], ['mushroom', 1], ['gWater', 1]], 'mon'],
  ['beanPorridge', '수정 콩 죽', 'def', 2, 'bowl', ['#e8e0f0', '#b99bff'], [['cbean', 2], ['gel', 1], ['gWater', 1]], 'room:r20'],
  ['beanHotpot', '수정 콩 전골', 'def', 3, 'bowl', ['#d9774a', '#b99bff'], [['cbean', 3], ['shroomCap', 1], ['gWater', 1]], 'room:r30'],
  ['bouncyJelly', '통통 튀는 젤리', 'move', 1, 'jelly', ['#86d96b', '#ff7aa2'], [['gel', 2], ['berry', 1]], 'mon'],
  ['eelGrill', '장어 구이', 'move', 2, 'plate', ['#b673de', '#6ff2e6'], [['sporeEel', 1], ['glowcap', 1]], 'room:r01'],
  ['capStirfry', '버섯 갓 볶음', 'mine', 1, 'plate', ['#e07b5f', '#e8d2b0'], [['mushroom', 2], ['shroomCap', 1]], 'gather'],
  ['beanStirfry', '수정 콩 볶음', 'mine', 2, 'plate', ['#b99bff', '#e8d2b0'], [['cbean', 2], ['mushroom', 1]], 'room:r21'],
  ['glowGrill', '빛버섯 구이', 'light', 1, 'skewer', ['#6ff2e6', '#c8fff6'], [['glowcap', 2]], 'gather'],
  ['glowPancake', '반짝 빛버섯전', 'light', 2, 'cake', ['#f2d38a', '#6ff2e6'], [['glowcap', 2], ['berry', 1]], 'quest:s_crop2'],
  ['glowSoup', '빛버섯 수정 수프', 'light', 3, 'bowl', ['#6ff2e6', '#b99bff'], [['glowcap', 2], ['cbean', 1], ['gWater', 1]], 'room:r40'],
  ['shroomPorridge', '버섯 죽', 'regen', 1, 'bowl', ['#f3e2c4', '#e36b6b'], [['mushroom', 2], ['gWater', 1]], 'mon'],
  ['jellyStew', '젤리 버섯찜', 'regen', 2, 'bowl', ['#86d96b', '#e07b5f'], [['shroomCap', 1], ['gel', 2]], 'room:r11'],
  ['capSoup', '버섯 갓 수프', 'maxhp', 1, 'bowl', ['#e8a37a', '#e07b5f'], [['shroomCap', 1], ['mushroom', 2], ['gWater', 1]], 'gather'],
  ['beanSteam', '수정 콩 버섯찜', 'maxhp', 2, 'bowl', ['#e8e0f0', '#e36b6b'], [['cbean', 1], ['mushroom', 2], ['glowcap', 1]], 'quest:s_crop4'],
  ['koiSteam', '별빛 잉어찜', 'maxhp', 3, 'plate', ['#ffd25c', '#ffb3c6'], [['koi', 1], ['cbean', 1]], 'bottle'],
  ['petalTea', '꽃잎 차', 'hunger', 1, 'cup', ['#f7b8cf', '#ffffff'], [['anyPetal', 2], ['gWater', 1]], 'gather'],
  ['petalDango', '꽃잎 베리 경단', 'hunger', 2, 'dango', ['#f7b8cf', '#ff7aa2', '#b99bff'], [['anyPetal', 2], ['berry', 2], ['cbean', 1]], 'room:r00'],
  ['baitDango', '베리 미끼 경단', 'luck', 1, 'dango', ['#ff7aa2', '#86d96b', '#ff7aa2'], [['berry', 2], ['gel', 1]], 'fish'],
  ['crucianBraise', '붕어 조림', 'luck', 2, 'plate', ['#c9a46b', '#ff7aa2'], [['crucian', 1], ['berry', 2]], 'quest:s_fish'],
  ['shrimpDango', '반짝 새우 경단', 'luck', 3, 'dango', ['#ff9ab0', '#6ff2e6', '#b99bff'], [['shrimp', 2], ['glowcap', 2], ['cbean', 1]], 'boss:golem'],
  ['petalPancake', '꽃잎 버섯 부침', 'xp', 1, 'cake', ['#f2d38a', '#ff7aa2'], [['anyPetal', 1], ['mushroom', 2]], 'gather'],
  ['petalRiceCake', '꽃잎 콩떡', 'xp', 2, 'cake', ['#f4f0f8', '#f7b8cf'], [['cbean', 2], ['anyPetal', 1]], 'quest:s_rooms'],
  ['catfishSoup', '메기 매운탕', null, 0, 'bowl', ['#e84a3a', '#ffd25c'], [['catfish', 1], ['mushroom', 2], ['gWater', 1]], 'boss:slime'],
];
export const DISH = {}; for (const d of DISHES) DISH[d[0]] = { id: d[0], n: d[1], ef: d[2], tier: d[3], shape: d[4], col: d[5], req: d[6], src: d[7] };
export const KNOWN0 = ['pie', 'stew', 'fishStew'];
export const ROOM_NOTES = [['petalDango', 'eelGrill'], ['capSteak', 'jellyStew'], ['beanPorridge', 'beanStirfry'], ['beanHotpot'], ['glowSoup']];
export const BOSS_NOTES = { slime: ['catfishSoup'], golem: ['shrimpDango'] }, BOSS_REGION = { slime: 0, queen: 1, golem: 2, turtle: 3, spirit: 4 };
export const REGION_N = ['이끼 동굴', '버섯숲', '수정 동굴', '용암 동굴', '얼음 동굴'];
export const DISH_FOOD = [[60, 60], [20, 6], [28, 10], [36, 14]];
// ================= v59: smelting and cooking take time — put the materials in, come back for the result =================
// one recipe per furnace / pot at a time (up to 30). It runs on real time, so it keeps going while a panel is open and while the game is closed.
export const JOB_MAX = 30, TIMED = { furnace: 1, pot: 1 };
export const SMELT_T = { copperBar: 5, ironBar: 10, quartzR: 20, goldBar: 20 }; // anything else smelted later (frost …) takes 30 s
export const COOK_T = [6, 10, 30, 50]; // by dish tier: recovery dishes · basic · special · legendary (plain foods 6 s)
// v59: the world (crops, trees, animals, pits …) keeps growing while the game is closed or the tab is in the background
export const OFF_MAX = 30 * 86400;
for (const d of DISHES) { const [fd, hl] = DISH_FOOD[d[3]]; ITEMS[d[0]] = { n: d[1], kind: 'food', food: fd, heal: hl, buff: d[2] ? [d[2], d[3]] : null, d: d[2] ? `버프 요리예요. 먹으면 효과가 생겨요.` : '얼큰하고 든든한 매운탕. 체력을 많이 회복해요.' };
  const r = Rc(d[0], 1, d[6], 'pot', 'food'); r.dish = d[0]; RECIPES.push(r); }
for (const d of DISHES) { ITEMS['rn_' + d[0]] = { n: `레시피 쪽지 · ${d[1]}`, note: d[0], d: '주우면 바로 요리솥 레시피를 알게 돼요.' }; }
// star dishes: cooked with at least one star crop → effect lasts 1.5×, fills 1.2×
for (const r of RECIPES.filter(r => r.at === 'pot' && r.cat === 'food')) { const id = r.out, base = ITEMS[id]; if (!base || base.star) continue;
  const k = r.req.findIndex(([m]) => STAR_OF[m]); if (k < 0) continue; const [m, c] = r.req[k], sm = STAR_OF[m];
  ITEMS[id + 'S'] = { ...base, n: '별 ' + base.n, food: Math.round(base.food * 1.2), star: 1, base: id, d: '별 작물로 만든 특별한 요리. 효과가 1.5배 오래가고 배가 더 불러요.' };
  const req = r.req.map(x => x.slice()); if (c > 1) { req[k][1] = c - 1; req.push([sm, 1]); } else req[k] = [sm, 1];
  const sr = Rc(id + 'S', 1, req, 'pot', 'food'); sr.dish = r.dish; sr.star = 1; sr.need = () => knows(id) && availCount0(sm) > 0; RECIPES.push(sr); }
ITEMS.anyPetal = { n: '아무 꽃잎', virtual: 1 };
for (const c in FLOWERS) if (ITEMS['petal' + c]) ITEMS['petal' + c].petal = 1;
ITEMS.bottle = { n: '병 속 쪽지', virtual: 1 };
export const NOTE_CH = { mon: .06, gather: .03, fish: .08 };
for (const [qid, dish] of [['s_crop2', 'glowPancake'], ['s_crop4', 'beanSteam'], ['s_rooms', 'petalRiceCake'], ['s_fish', 'crucianBraise']]) { const q = QSIDE.find(x => x.id === qid); if (q) q.rw = q.rw.concat([['rn_' + dish, 1]]); }
// ---- fishing luck, message bottles ----
export const LUCK_KOI = [1, 1.5, 2, 3], LUCK_BOOT = [1, .7, .5, .25], LUCK_BOTTLE = [.01, .02, .04, .06];

// ---- 숨은 방: 지역마다 몇 개 · 장식 · 보물상자 안 (구조 변경 2단계: world.js에서 옮김) ----
// ---- hidden rooms: small walled rooms behind a cracked wall, one or two per region, each with a treasure chest ----
// placed on untouched rock only (compared with the world as first generated), so old saves get them too without touching anything the player built
export const ROOM_N = [2, 2, 2, 1, 1], ROOM_DECO = ['mossLantern', 'sporeChime', 'cryVase', 'emberBowl', 'iceSwan'];
export const ROOM_LOOT = [
  [[['berrySeed', 4], ['glowSpore', 2], ['copperBar', 4], ['rope', 3]], [['mossSpore', 3], ['resin', 3], ['gel', 5], ['berryS', 3]]],
  [[['glowSpore', 3], ['spore', 4], ['shroomCap', 4], ['ironBar', 2]], [['glowcapS', 3], ['gShroom', 6], ['gel', 6], ['copperBar', 5]]],
  [[['cbeanSeed', 3], ['crystal', 8], ['ironBar', 3]], [['cbeanS', 3], ['gCrystal', 6], ['crystal', 6], ['goldBar', 1]]],
  [[['obsidian', 4], ['goldBar', 2], ['fireBerry', 4], ['crystal', 4]]],
  [[['frostShard', 6], ['goldBar', 2], ['ironBar', 3], ['crystal', 4]]]];
