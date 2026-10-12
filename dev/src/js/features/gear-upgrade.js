// ---- v43 smelter 「용광로」 (v58: renamed 「장비제작대」): upgrade gear (+1 … +5) and break it down; rings are made here too ----
ITEMS.smelter = { n: '장비제작대', kind: 'place', obj: 'smelter', d: '장비에 재료를 넣어 강화하고(최대 +5), 장비를 분해해 재료 일부를 돌려받아요. 반지도 여기서 만들어요. (v58 전 이름: 용광로)' };
OBJ.smelter = { n: '장비제작대', solid: 1, station: 'smelter', item: 'smelter', light: [3.4, '#ff8a3d'] };
const GROW_SPR = { bench: [2, 2], logBench: [2, 1], stoneBench: [2, 1],
  roundTree: [1.75, 1.75], root: [1.35, 1.35], bigShroom: [1.75, 1.75], cherryTree: [1.4, 1.4], bigTree: [1.5, 1.5] };
// v50: workstations and benches take as many tiles as in other games (stations 2×1, benches 2×1) — in games started
// from v50 on (save fpV: 2). Saves from before keep them at one tile. Benches can be turned; stations only flip.
// v51: beds are one tile again (1 wide, 1.5 tall picture); the extra tile of beds placed as 1×2 in v50 is dropped by fixParts.
// v55: the copper workbench (anvil), furnace and smelter are one tile again; their extra tile from v50~v54 is dropped by fixParts the same way.
const GREW = { bench: [2, 1], logBench: [2, 1, 1], stoneBench: [2, 1, 1] };
let FPV = 2;
function setFootprints(v) { FPV = v === 2 ? 2 : 1;
  for (const id in GREW) { const d = OBJ[id]; if (!d) continue; const [w, h, rv] = GREW[id];
    if (FPV === 2) { d.sz = [w, h]; if (rv) d.rotV = 1; } else { delete d.sz; delete d.rotV; }
    const f = SPR.fp && SPR.fp[id]; if (f) { SPR.obj[id] = FPV === 2 ? f.big : f.small; if (FPV === 2 && f.bigV) SPR.obj[id + 'V'] = f.bigV; else delete SPR.obj[id + 'V']; delete ICONURL[id]; } } }
setFootprints(2);
OSPR.smelter = [16, 22, A => { A.r(2, 9, 12, 12, '#5a5468'); A.r(2, 9, 12, 2, '#8d97a8'); A.r(2, 9, 1, 12, '#787090'); A.r(13, 9, 1, 12, '#36334a'); for (const [x, y] of [[4, 13], [9, 12], [6, 17], [11, 16]]) A.r(x, y, 2, 1, '#46405a');
  A.r(5, 3, 6, 7, '#46405a'); A.r(5, 3, 6, 1, '#8d97a8'); A.r(6, 1, 4, 2, '#36334a'); A.r(5, 14, 6, 5, '#2a1810'); A.e(8, 16.5, 2.4, 1.8, '#ff8a3d'); A.e(8, 17, 1.4, 1, '#ffe08a'); A.r(3, 20, 10, 1, '#24222e'); A.p(4, 11, '#ffd25c'); }];
STN.smelter = '장비제작대';
RECIPES.push(Rc('smelter', 1, [['wood', 10], ['stone', 8], ['resin', 2]], 'bench', 'furn')); // v58: made early at the workbench from wood and stone
// rings: [name, effect, base, per level, recipe, rarity, band, gem]
const RINGS = {
  ringCu: ['구리 반지', 'atk', .04, .01, [['copperBar', 4], ['gel', 2]], 0, C.copper, '#ff8fa3'],
  ringFe: ['철 반지', 'def', .04, .01, [['ironBar', 4], ['copperBar', 2]], 1, C.iron, '#7fe0b5'],
  ringQ: ['석영 반지', 'mp', .2, .05, [['quartzR', 3], ['ironBar', 2]], 2, '#d8d2ee', '#ffffff'],
  ringGem: ['수정결정 반지', 'xp', .08, .02, [['cryGem', 2], ['quartzR', 2], ['ironBar', 2]], 2, C.iron, C.cry],
  ringGold: ['금 반지', 'mine', .1, .02, [['goldBar', 3], ['cryGem', 1]], 3, '#ffd25c', '#7ff0e6'],
};
const RING_TXT = { atk: v => `공격력 +${pct2(v)}`, def: v => `받는 피해 -${pct2(v)}`, mp: v => `기력 회복 +${pct2(v)}`, xp: v => `경험치 +${pct2(v)}`, mine: v => `채굴 속도 +${pct2(v)}` };
const pct2 = v => Math.round(v * 100) + '%';
for (const id in RINGS) { const [n, k, b, per, req, rar, band, gem] = RINGS[id];
  ITEMS[id] = { n, kind: 'wear', slot: 'ring', stack: 1, ring: k, d: `반지 칸에 끼면 ${RING_TXT[k](b)}. 장비제작대에서 강화할 때마다 ${Math.round(per * 100)}%씩 더 좋아져요.` }; RAR[id] = rar;
  ICON[id] = A => { A.e(8, 10, 5.2, 4.6, band); A.e(8, 10.4, 3.4, 2.8, 'rgba(0,0,0,0)'); A.g.globalCompositeOperation = 'destination-out'; A.e(8, 10.6, 3.2, 2.6, '#000'); A.g.globalCompositeOperation = 'source-over'; A.p(5, 8, '#ffffff'); A.poly([[8, 1.5], [11, 4.5], [8, 7.5], [5, 4.5]], gem); A.p(7, 3, '#ffffff'); };
  RECIPES.push(Rc(id, 1, req, 'smelter', 'ring')); }
const lvOf = s => (s && s.lv) || 0;
const UPG_MAX = 5, UPG_DMG = .08, UPG_POW = .1, UPG_MAT = ['copperBar', 'ironBar', 'quartzR', 'goldBar', 'goldBar'];
const upgOk = id => { const it = ITEMS[id]; return !!it && (it.kind === 'sword' || it.kind === 'pick' || it.kind === 'wear'); };
const upgTier = id => { const r = rarOf(id); return r >= 0 ? Math.min(4, r) : 3; }; // clothes and charms from the deep caves count as heroic
function upgCost(id, lv) { const t = upgTier(id), c = [[UPG_MAT[t], 2 + 2 * lv]]; if (lv >= 2) c.push(t <= 1 ? ['glowcap', 2 * (lv - 1)] : ['cryGem', lv - 1]); return c; }
function upgSpent(id, lv) { const m = {}; for (let k = 0; k < lv; k++) for (const [x, c] of upgCost(id, k)) m[x] = (m[x] || 0) + c; return Object.entries(m); }
const eqLv = id => { if (!G || !G.equip) return -1; for (const [sl] of EQ_SLOTS) { const e = G.equip[sl]; if (e && e.id === id) return lvOf(e); } return -1; };
const ringV = k => { const e = G && G.equip && G.equip.ring, R = e && RINGS[e.id]; return R && R[1] === k ? R[2] + R[3] * lvOf(e) : 0; };
const guardMul = lv => .5 - .05 * lv, turtleCut = lv => .3 + .04 * lv, broochMul = lv => .5 - .05 * lv;
function upgText(id, lv) { const it = ITEMS[id];
  if (it.kind === 'sword') return `공격력 ${Math.round(it.dmg * (1 + UPG_DMG * lv))}`;
  if (it.kind === 'pick') return `캐는 힘 ${+(it.power * (1 + UPG_POW * lv)).toFixed(1)}`;
  if (it.ring) return RING_TXT[it.ring](RINGS[id][2] + RINGS[id][3] * lv);
  if (it.guard) return `${it.guard === 'hot' ? '더위' : '추위'} 게이지 ${pct2(guardMul(lv))} 속도`;
  if (id === 'turtleCharm') return `불·용암 피해 -${pct2(turtleCut(lv))}`;
  if (id === 'snowBrooch') return `얼어 느려지는 시간 ${pct2(broochMul(lv))}`;
  if (id === 'woolHat') return `추위 게이지 ${pct2(.85 - .03 * lv)} 속도`;
  return ''; }
