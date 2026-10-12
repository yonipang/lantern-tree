// ================= 자동화·축제 케이크·작업대 단계 데이터 (구조 변경 2단계: features/automation-tiers.js에서 데이터만 옮김) =================
// 스프링클러·자동 수확기, 거대 작물, 축제 케이크, 「지형 재료 2배」, 작업대·장비제작대 단계와 레시피 단계 나누기 — 밸런스 숫자와 이름·설명은 여기서 고쳐요.
// 순서가 중요해요: 「지형 재료 2배」·단계 나누기는 이 줄보다 앞에서 만든 레시피에만 적용돼요 (shell.html에서 이 파일 앞에 있는 파일들).
// 이 파일은 shell.html에서 features/automation-tiers.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { DISH, DISHES } from './farming-cooking.js';
import { ITEMS, OBJ, RECIPES, Rc, STN, TIPS, USE, USE_LBL } from './items.js';
import { QSIDE } from './quests.js';
import { G } from '../save/state.js';

// ================= farm automation (after the crystal generator), giant crops, the festival cake =================
export const hasCgen = () => ((G.stats.made || {}).crystalGen || 0) > 0 || [...G.objs.values()].some(o => o.t === 'crystalGen');
export const HARV_CAP = 60, HARV_EVERY = 3, SPRK_EVERY = 2;
Object.assign(ITEMS, {
  sprinkler: { n: '스프링클러', kind: 'place', obj: 'sprinkler', d: '전기가 들어오면 둘레 5×5 칸의 자라는 작물에 물을 줘요 (물 준 작물은 25% 빨리 자라요).' },
  harvester: { n: '자동 수확기', kind: 'place', obj: 'harvester', d: '전기가 들어오면 둘레 3×3 칸의 다 자란 작물을 거둬서 옆 상자에 담아요 (구리 낫 보너스는 없어요). 상자가 없거나 차면 안에 모아 둬요.' },
});
Object.assign(OBJ, {
  sprinkler: { n: '스프링클러', solid: 1, item: 'sprinkler', dev: 'sprk', draw: .3, idle: .02 },
  harvester: { n: '자동 수확기', solid: 1, item: 'harvester', dev: 'harv', draw: .4, idle: .02 },
});
Object.assign(USE, { sprinkler: 'sprk', harvester: 'harv' }); Object.assign(USE_LBL, { sprk: '살펴보기', harv: '꺼내기' });
RECIPES.push(Object.assign(Rc('sprinkler', 1, [['ironBar', 4], ['copperBar', 2], ['gWater', 2]], 'forge', 'farm'), { need: hasCgen }), Object.assign(Rc('harvester', 1, [['ironBar', 6], ['crystal', 4], ['wire', 4]], 'forge', 'farm'), { need: hasCgen }));
// giant crops: four of the same crop in a 2×2 square on their own soil, all grown → 3% chance to merge into one giant (6× harvest, 3 seeds)
export const GIANT_CH = .03;
OBJ.giantCrop = { n: '거대 작물', sz: [2, 2], solid: 1, giant: 1 };
QSIDE.push({ id: 's_auto', t: () => `자동 수확기로 작물 20개 거두기 (${Math.min(20, G.stats.autoH || 0)}/20)`, h: '수정 발전기를 만든 뒤 작업대에서 자동 수확기와 스프링클러를 만들어요. 전선으로 전기를 이어 주세요.', done: () => (G.stats.autoH || 0) >= 20, rw: [['crystal', 10], ['goldBar', 2]], xp: 80 },
  { id: 's_giant', t: '거대 작물 거두기', h: '같은 작물 네 개를 2×2로 맞는 흙에 심어 두면, 다 자랐을 때 아주 가끔 하나로 합쳐져요.', done: () => (G.stats.giantH || 0) >= 1, rw: [['fertCry', 6], ['cbeanSeed', 4]], xp: 100 });
// festival cake: the true ending's reward; eat it, or set it on a table as decoration
DISHES.push(['festCake', '등불 축제 케이크', null, 0, 'cake', ['#fff1d6', '#ff7aa2'], [['berry', 5], ['petalR', 1], ['petalB', 1], ['petalY', 1], ['petalW', 1], ['petalK', 1], ['glowcap', 2]], 'ending']);
DISH.festCake = { id: 'festCake', n: '등불 축제 케이크', ef: null, tier: 0, shape: 'cake', req: DISHES[DISHES.length - 1][6], src: 'ending' };
ITEMS.festCake = { n: '등불 축제 케이크', kind: 'food', food: 100, heal: 40, cake: 1, d: '다섯 등불을 밝힌 날의 축하 케이크. 먹으면 배가 가득 차요. 탁자 앞에서 들고 누르면 탁자 위에 올려 장식해요.' };
ITEMS.rn_festCake = { n: '레시피 쪽지 · 등불 축제 케이크', note: 'festCake', d: '주우면 바로 요리솥 레시피를 알게 돼요.' };
{ const r = Rc('festCake', 1, DISH.festCake.req, 'pot', 'food'); r.dish = 'festCake'; RECIPES.push(r); }
export const CAKE_TABLES = ['table', 'shroomTable', 'cryTable', 'longTable'];
TIPS.push('수정 발전기를 만들면 스프링클러와 자동 수확기로 밭을 자동으로 돌볼 수 있어요.', '같은 작물 네 개를 2×2로 맞는 흙에 심으면 가끔 거대 작물이 자라요.');
TIPS.push('버프 요리는 세 가지까지 함께 효과가 있어요. 같은 효과는 가장 좋은 것 하나만 적용돼요.', '레시피 쪽지는 몬스터·채집·낚시·숨은 방·보스에서 찾을 수 있어요.', '별 작물을 넣어 만든 요리는 효과가 1.5배 오래가요.');
// v47: the map is far bigger, so recipes ask for twice as much terrain (dirt, stone, granite, basalt, ice)
export const TERRAIN_MATS = new Set(['dirt', 'stone', 'granite', 'basalt', 'iceBlock']);
for (const r of RECIPES) r.req = r.req.map(([id, c]) => [id, TERRAIN_MATS.has(id) ? c * 2 : c]);
// ================= v60: workbench tiers — 작업대 → 구리 → 철 → 석영 → 금 → 서리 =================
// one workbench upgraded in place (o.lv 0–5). A higher tier also makes everything the lower tiers make; its own things come first.
export const BENCH_N = ['작업대', '구리 작업대', '철 작업대', '석영 작업대', '금 작업대', '서리 작업대'];
export const BENCH_IT = ['bench', 'forge', 'benchFe', 'benchQ', 'benchAu', 'benchFr']; // the item you get back when picking one up ('forge' = the old copper workbench item)
export const BENCH_UP = [null, [['copperBar', 8], ['stone', 20]], [['ironBar', 8], ['stone', 30]], [['quartzR', 6], ['granite', 20]], [['goldBar', 6], ['basalt', 20]], [['frostShard', 10], ['iceBlock', 20]]];
export const BENCH_COL = [null, '#e5884a', '#c8d0dc', '#d8d2ee', '#ffd25c', '#9fd8f0'];
export const BENCH_MAX = BENCH_N.length - 1;
export const TIER_MAT = [[5, ['frostShard', 'frostCore', 'iceBlock']], [4, ['goldBar', 'goldOre', 'obsidian', 'lavaCore', 'basalt']], [3, ['quartzR', 'crystal', 'cryGem', 'granite', 'golemCore', 'gCrystal']], [2, ['ironBar', 'ironOre']], [1, ['copperBar', 'copperOre']]];
for (const r of RECIPES) if (r.at === 'bench' || r.at === 'forge') { let t = 0; for (const [lv, ms] of TIER_MAT) if (r.req.some(([id]) => ms.includes(id))) { t = lv; break; } r.tier = r.at === 'forge' ? Math.max(1, t) : t; r.at = 'bench'; }
{ const k = RECIPES.findIndex(r => r.out === 'forge'); if (k >= 0) RECIPES.splice(k, 1); } // no longer made: you upgrade the workbench instead
Object.assign(ITEMS.forge, { n: BENCH_N[1], obj: 'bench', blv: 1, d: '1단계 작업대. 작업대에서 만드는 것도 모두 만들어요. (v60 전 이름: 구리 제작대)' });
for (let lv = 2; lv <= BENCH_MAX; lv++) ITEMS[BENCH_IT[lv]] = { n: BENCH_N[lv], kind: 'place', obj: 'bench', blv: lv, d: `${lv}단계 작업대. ${BENCH_N.slice(0, lv).join('·')}에서 만드는 것도 모두 만들어요.` };
Object.assign(OBJ.forge, { n: BENCH_N[1], station: 'bench' }); STN.forge = BENCH_N[1]; // old saves: placed copper workbenches become tier-1 workbenches (convertForges)
// ================= v61: the 장비제작대 has the same six tiers; weapons · armour · accessories · tools are made, fixed, broken down and upgraded there =================
export const GEAR_N = ['장비제작대', '구리 장비제작대', '철 장비제작대', '석영 장비제작대', '금 장비제작대', '서리 장비제작대'];
export const GEAR_IT = ['smelter', 'smelterCu', 'smelterFe', 'smelterQ', 'smelterAu', 'smelterFr'];
for (let lv = 1; lv <= BENCH_MAX; lv++) ITEMS[GEAR_IT[lv]] = { n: GEAR_N[lv], kind: 'place', obj: 'smelter', blv: lv, d: `${lv}단계 장비제작대. ${GEAR_N.slice(0, lv).join('·')}에서 만드는 장비도 모두 만들어요.` };
export const TIERED = { bench: BENCH_N, smelter: GEAR_N }, TIER_IT = { bench: BENCH_IT, smelter: GEAR_IT };
export const GEAR_TOOLS = ['pick', 'shovel', 'rod', 'wcan', 'sickle', 'lasso', 'recall'];
export const gearCatOf = it => !it || it.bagUp ? null : it.kind === 'sword' || it.kind === 'arrow' ? 'weapon' : it.kind === 'wear' ? (it.slot === 'body' || it.slot === 'head' ? 'armor' : 'acc') : GEAR_TOOLS.includes(it.kind) ? 'tool' : null;
export const recipeTier = r => { for (const [lv, ms] of TIER_MAT) if (r.req.some(([id]) => ms.includes(id))) return lv; return 0; };
for (const r of RECIPES) { const c = gearCatOf(ITEMS[r.out]); if (!c || !(r.at === 'bench' || r.at === 'smelter' || r.at == null)) continue; if (r.at !== 'bench') r.tier = recipeTier(r); r.at = 'smelter'; r.cat = c; }
