// v47: the map is far bigger, so recipes ask for twice as much terrain (dirt, stone, granite, basalt, ice)
const TERRAIN_MATS = new Set(['dirt', 'stone', 'granite', 'basalt', 'iceBlock']);
for (const r of RECIPES) r.req = r.req.map(([id, c]) => [id, TERRAIN_MATS.has(id) ? c * 2 : c]);
// ================= v60: workbench tiers — 작업대 → 구리 → 철 → 석영 → 금 → 서리 =================
// one workbench upgraded in place (o.lv 0–5). A higher tier also makes everything the lower tiers make; its own things come first.
const BENCH_N = ['작업대', '구리 작업대', '철 작업대', '석영 작업대', '금 작업대', '서리 작업대'];
const BENCH_IT = ['bench', 'forge', 'benchFe', 'benchQ', 'benchAu', 'benchFr']; // the item you get back when picking one up ('forge' = the old copper workbench item)
const BENCH_UP = [null, [['copperBar', 8], ['stone', 20]], [['ironBar', 8], ['stone', 30]], [['quartzR', 6], ['granite', 20]], [['goldBar', 6], ['basalt', 20]], [['frostShard', 10], ['iceBlock', 20]]];
const BENCH_COL = [null, '#e5884a', '#c8d0dc', '#d8d2ee', '#ffd25c', '#9fd8f0'];
const BENCH_MAX = BENCH_N.length - 1;
const TIER_MAT = [[5, ['frostShard', 'frostCore', 'iceBlock']], [4, ['goldBar', 'goldOre', 'obsidian', 'lavaCore', 'basalt']], [3, ['quartzR', 'crystal', 'cryGem', 'granite', 'golemCore', 'gCrystal']], [2, ['ironBar', 'ironOre']], [1, ['copperBar', 'copperOre']]];
for (const r of RECIPES) if (r.at === 'bench' || r.at === 'forge') { let t = 0; for (const [lv, ms] of TIER_MAT) if (r.req.some(([id]) => ms.includes(id))) { t = lv; break; } r.tier = r.at === 'forge' ? Math.max(1, t) : t; r.at = 'bench'; }
{ const k = RECIPES.findIndex(r => r.out === 'forge'); if (k >= 0) RECIPES.splice(k, 1); } // no longer made: you upgrade the workbench instead
Object.assign(ITEMS.forge, { n: BENCH_N[1], obj: 'bench', blv: 1, d: '1단계 작업대. 작업대에서 만드는 것도 모두 만들어요. (v60 전 이름: 구리 제작대)' });
for (let lv = 2; lv <= BENCH_MAX; lv++) ITEMS[BENCH_IT[lv]] = { n: BENCH_N[lv], kind: 'place', obj: 'bench', blv: lv, d: `${lv}단계 작업대. ${BENCH_N.slice(0, lv).join('·')}에서 만드는 것도 모두 만들어요.` };
Object.assign(OBJ.forge, { n: BENCH_N[1], station: 'bench' }); STN.forge = BENCH_N[1]; // old saves: placed copper workbenches become tier-1 workbenches (convertForges)
const benchLv = o => !o ? -1 : o.t === 'bench' || o.t === 'smelter' ? (o.lv || 0) : o.t === 'forge' ? 1 : -1;
const tierNames = st => TIERED[st] || BENCH_N;
const craftTier = () => panel && panel.kind === 'craft' && TIERED[panel.st] ? (panel.i != null ? Math.max(0, benchLv(G.objs.get(panel.i))) : panel.tier || 0) : 0;
function convertForges() { let n = 0; for (const o of G.objs.values()) if (o.t === 'forge') { o.t = 'bench'; o.lv = 1; n++; } return n; }
// ================= v61: the 장비제작대 has the same six tiers; weapons · armour · accessories · tools are made, fixed, broken down and upgraded there =================
const GEAR_N = ['장비제작대', '구리 장비제작대', '철 장비제작대', '석영 장비제작대', '금 장비제작대', '서리 장비제작대'];
const GEAR_IT = ['smelter', 'smelterCu', 'smelterFe', 'smelterQ', 'smelterAu', 'smelterFr'];
for (let lv = 1; lv <= BENCH_MAX; lv++) ITEMS[GEAR_IT[lv]] = { n: GEAR_N[lv], kind: 'place', obj: 'smelter', blv: lv, d: `${lv}단계 장비제작대. ${GEAR_N.slice(0, lv).join('·')}에서 만드는 장비도 모두 만들어요.` };
const TIERED = { bench: BENCH_N, smelter: GEAR_N }, TIER_IT = { bench: BENCH_IT, smelter: GEAR_IT };
const GEAR_TOOLS = ['pick', 'shovel', 'rod', 'wcan', 'sickle', 'lasso', 'recall'];
const gearCatOf = it => !it || it.bagUp ? null : it.kind === 'sword' || it.kind === 'arrow' ? 'weapon' : it.kind === 'wear' ? (it.slot === 'body' || it.slot === 'head' ? 'armor' : 'acc') : GEAR_TOOLS.includes(it.kind) ? 'tool' : null;
const recipeTier = r => { for (const [lv, ms] of TIER_MAT) if (r.req.some(([id]) => ms.includes(id))) return lv; return 0; };
for (const r of RECIPES) { const c = gearCatOf(ITEMS[r.out]); if (!c || !(r.at === 'bench' || r.at === 'smelter' || r.at == null)) continue; if (r.at !== 'bench') r.tier = recipeTier(r); r.at = 'smelter'; r.cat = c; }
function benchUpHTML(o) { const lv = benchLv(o); if (lv < 0) return ''; const st = o.t === 'smelter' ? 'smelter' : 'bench', NM = tierNames(st), IT = TIER_IT[st];
  if (lv >= BENCH_MAX) return `<p class="hint">가장 높은 단계 ${st === 'smelter' ? '장비제작대' : '작업대'}예요 · 모든 ${st === 'smelter' ? '장비' : '작업대 물건'}를 만들 수 있어요</p>`;
  const cost = BENCH_UP[lv + 1], ok = cost.every(([id, c]) => availCount(id) >= c);
  return `<div class="rc ${ok ? 'ok' : 'no'} benchup" style="margin-bottom:10px"><div class="ri"><img class="px" src="${iconURL(IT[lv + 1])}" alt=""></div><div class="rn">${NM[lv + 1]}로 올리기<small>새 ${st === 'smelter' ? '장비가' : '물건이'} 더 생겨요</small><div class="ings">${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="benchUp" ${ok ? '' : 'disabled'}>올리기</button></div>`; }
