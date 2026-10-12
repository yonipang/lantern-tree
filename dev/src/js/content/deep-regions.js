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
Object.assign(ICON, {
  goldOre: A => { A.e(8, 9, 5.6, 4.6, '#4a414f'); A.e(6.5, 7.5, 2.4, 1.3, '#5a4f58'); A.e(6, 10, 1.7, 1.3, '#ffd25c'); A.e(10, 8, 1.5, 1.3, '#ffd25c'); A.p(9, 11, '#fff1b0'); A.p(10, 7, '#fff1b0'); },
  goldBar: A => { A.r(3, 8, 10, 4, '#ffc23a'); A.poly([[3, 8], [5, 5], [11, 5], [13, 8]], '#ffe28a'); A.r(3, 11, 10, 1, '#c9902a'); A.p(6, 6, '#ffffff'); A.p(7, 6, '#fff7d0'); },
  obsidian: A => { A.poly([[3, 12], [6, 4], [11, 3], [13, 9], [9, 14]], '#2a2238'); A.poly([[6, 4], [11, 3], [9, 8]], '#4a3f68'); A.p(8, 5, '#9a8ad0'); A.p(10, 10, '#4a3f68'); },
  frostShard: A => { A.poly([[8, 1], [11, 7], [8, 14], [5, 7]], '#7fd8f0'); A.poly([[8, 1], [8, 14], [5, 7]], '#d4f6ff'); A.poly([[12, 6], [14, 10], [12, 14], [10.5, 10]], '#5ab8e0'); A.p(7, 5, '#ffffff'); },
  fireBerry: A => { A.e(6, 10, 3.6, 3.6, '#ff6a2a'); A.e(10.5, 9, 3.2, 3.2, '#ff8a3d'); A.p(5, 8, '#ffd0a0'); A.p(10, 7, '#ffe0b0'); A.line(8, 6, 9, 2, C.leafD); A.e(10, 3, 1.6, .9, C.leaf); },
  lavaCore: A => { A.e(8, 8, 6, 6, '#7a2a14'); A.e(8, 8, 4.6, 4.6, '#e8501f'); A.e(8, 8, 2.6, 2.6, '#ffc861'); A.p(6, 6, '#ffffff'); A.p(12, 11, '#ff8a3d'); },
  frostCore: A => { A.e(8, 8, 6, 6, '#3a6fa8'); A.e(8, 8, 4.6, 4.6, '#7fd8f0'); A.e(8, 8, 2.6, 2.6, '#ffffff'); A.p(4, 4, '#d4f6ff'); A.p(12, 12, '#d4f6ff'); A.p(12, 4, '#d4f6ff'); A.p(4, 12, '#d4f6ff'); },
});
RECIPES.push(Rc('goldBar', 1, [['goldOre', 2]], 'furnace', 'mat'));
ITEMS.meadow = { n: '풀밭', kind: 'floor', floor: 21, d: '씨앗을 심는 밭이에요. 이끼 포자는 풀밭에서만 자라요.' };
ITEMS.mossSpore = { n: '이끼 포자', kind: 'seed', crop: 'cropMoss', d: '풀밭에 심으면 1분 30초쯤 뒤 이끼가 소복이 자라요. 거두면 이끼 한 삽과 포자를 다시 얻어요.' };
ICON.mossSpore = packet('#4f8f57', A => { A.e(8, 9, 2.6, 2, '#62ad62'); A.p(6, 7, '#9be37a'); A.p(10, 8, '#9be37a'); A.p(8, 11, '#3c7a46'); });
OBJ.cropMoss = { n: '이끼', crop: 'moss', grow: 90, yield: [['gMoss', 2, 3, 1], ['mossSpore', 1, 2, 1], ['fiber', 1, 1, 0.5]] };
OBJ.grass.drops.push(['mossSpore', 1, 1, 0.25]);
RECIPES.push(Rc('meadow', 4, [['dirt', 2], ['fiber', 2]], 'bench', 'nature'), Rc('mossSpore', 2, [['fiber', 3]], null, 'mat'));
OSPR.fireBloom = [16, 16, A => { A.line(5, 15, 5, 9, '#5a3a2e'); A.line(10, 15, 11, 8, '#5a3a2e'); A.e(4, 14, 2, .9, '#4a3a30'); A.e(11, 14.5, 2, .9, '#4a3a30'); for (const [x, y] of [[5, 7], [11, 6]]) { A.poly([[x - 2.6, y + 2], [x, y - 4], [x + 2.6, y + 2]], '#ff6a2a'); A.poly([[x - 1.4, y + 2], [x, y - 1.6], [x + 1.4, y + 2]], '#ffc861'); A.p(x, y + 1, '#fff1b0'); } A.e(8, 12, 1.6, 1.4, '#ff8a3d'); A.p(8, 11, '#ffd0a0'); }];
OSPR.iceCluster = [16, 18, A => { A.poly([[3, 16], [4, 7], [7, 16]], '#5a9ac8'); A.poly([[6, 16], [8, 2], [11, 16]], '#9fd8f0'); A.poly([[6, 16], [8, 2], [8, 16]], '#e8f8ff'); A.poly([[10, 16], [13, 8], [14, 16]], '#7fc0e8'); A.p(7, 6, '#fff'); A.e(8, 16.5, 6, 1.2, '#5a88b0'); }];
OBJ.fireBloom = { n: '불꽃풀', hp: 1, nat: 'cut', light: [2.6, '#ff9b4a'], drops: [['fireBerry', 1, 1, 0.6], ['fiber', 1, 1, 0.4]] };
OBJ.iceCluster = { n: '얼음 결정', solid: 1, hp: 4, tier: 2, nat: 'mine', light: [3, '#9fe8ff'], drops: [['frostShard', 1, 2, 1]] };
Object.assign(ENEMY, {
  magmaSlime: { n: '용암 말랑이', hp: 95, dmg: 20, spd: 3.0, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['obsidian', 1, 1, 0.25], ['goldOre', 1, 1, 0.2]], col: '#ff7a3d' },
  cinder: { n: '불씨 도깨비', hp: 80, dmg: 19, spd: 2.5, r: 0.3, hop: 0, drops: [['fireBerry', 1, 1, 0.4], ['goldOre', 1, 1, 0.3]], col: '#ff9b4a' },
  frostSlime: { n: '얼음 말랑이', hp: 90, dmg: 18, spd: 2.9, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['frostShard', 1, 1, 0.35]], col: '#9fd8f0' },
  snowling: { n: '눈뭉치', hp: 85, dmg: 18, spd: 2.3, r: 0.32, hop: 0, drops: [['frostShard', 1, 1, 0.35], ['fiber', 1, 2, 0.4]], col: '#e8f4ff' },
});
// tougher monsters everywhere (bloom critters stay gentle); deeper places notice you from farther away
Object.assign(ENEMY.slimeG, { hp: 18, dmg: 7 }); Object.assign(ENEMY.slimeO, { hp: 40, dmg: 12, aggro: 8.5 }); Object.assign(ENEMY.slimeP, { hp: 75, dmg: 18, aggro: 9 }); Object.assign(ENEMY.shroomy, { hp: 34, dmg: 11, spd: 2.3, aggro: 8.5 });
Object.assign(ENEMY.magmaSlime, { hp: 120, dmg: 24, aggro: 10 }); Object.assign(ENEMY.cinder, { hp: 105, dmg: 22, spd: 2.7, aggro: 10 }); Object.assign(ENEMY.frostSlime, { hp: 115, dmg: 22, aggro: 10 }); Object.assign(ENEMY.snowling, { hp: 110, dmg: 22, spd: 2.5, aggro: 10 });
const SPAWN_CAP = [6, 8, 9, 10, 10], SPAWN_EVERY = [2.6, 2.3, 2.0, 1.6, 1.6], SPAWN_PACK = [0, .2, .3, .4, .4];
CATCH[3] = CATCH[2]; CATCH[4] = [['smelt', 50], ['shrimp', 26], ['crucian', 10], ['boot', 6], ['koi', 8]];
// deep gear (영웅) and legendary (전설)
const GEAR2 = {
  swordGold: ['황금 검', 'sword', 36, [['goldBar', 6], ['obsidian', 2], ['ironBar', 2]], 1100, [['goldBar', 2]], swordIcon('#ffd25c', '#fff1b0', '#c9902a'), '묵직하게 빛나는 황금 검.'],
  daggerObsidian: ['흑요석 단검', 'dagger', 24, [['obsidian', 4], ['goldBar', 1], ['rope', 1]], 900, [['obsidian', 2]], daggerIcon('#3a2a4a', '#9a8ad0', '#c9902a'), '유리처럼 날카로운 단검. 치명타가 잘 터져요.'],
  hammerObsidian: ['흑요석 망치', 'hammer', 54, [['obsidian', 6], ['goldBar', 3], ['wood', 2]], 1000, [['obsidian', 3]], hammerIcon('#3a2a4a', '#6a5a8a', '#1a1424'), '땅이 갈라질 만큼 무거운 한 방.'],
  spearFrost: ['서리 창', 'spear', 34, [['frostShard', 8], ['goldBar', 2], ['wood', 3]], 1000, [['frostShard', 3]], spearIcon('#7fd8f0', '#e8f8ff'), '찌르면 적이 꽁꽁 얼어붙어요.', null, 'chill'],
  staffFrost: ['눈꽃 지팡이', 'staff', 28, [['frostShard', 6], ['crystal', 4], ['glowcap', 3]], 1000, [['frostShard', 3]], staffIcon('#9fd8f0', '#ffffff'), '눈꽃 구슬이 적을 꿰뚫고 얼려요.', '#d4f6ff', 'chill'],
  bowGold: ['황금 활', 'bow', 28, [['goldBar', 4], ['rope', 3], ['frostShard', 2]], 1000, [['goldBar', 2]], bowIcon('#c9902a', '#ffd25c', '#fff1b0'), '황금빛 화살이 멀리 날아가요.'],
};
for (const id in GEAR2) { const [n, wt, dmg, req, dur, fix, icon, d, orb, fx] = GEAR2[id]; ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, orb, fx }; ICON[id] = icon; DUR2[id] = [dur, fix]; RAR[id] = 3; RECIPES.push(Rc(id, 1, req, 'forge', 'weapon')); }
ITEMS.pickGold = { n: '황금 곡괭이', kind: 'pick', power: 5, tier: 3, stack: 1, d: '깊은 동굴의 벽도 빠르게 캐는 곡괭이.' }; ICON.pickGold = pickIcon('#ffd25c', '#fff1b0'); DUR2.pickGold = [1800, [['goldBar', 2]]]; RAR.pickGold = 3;
RECIPES.push(Rc('pickGold', 1, [['goldBar', 6], ['obsidian', 2], ['frostShard', 2]], 'forge', 'tool'));
Object.assign(UNIQ_OF, { turtle: 'swordLava', spirit: 'bowFrost' });
ITEMS.swordLava = { n: '용암 거북의 대검', kind: 'sword', wt: 'sword', dmg: 44, stack: 1, fx: 'burn', d: '용암 거북의 등껍질을 깎아 만든 대검. 벤 자리에 불꽃이 일어요.' }; ICON.swordLava = swordIcon('#e8501f', '#ffc861', '#5a3a2e'); DUR2.swordLava = [1300, [['obsidian', 3]]]; RAR.swordLava = 3;
ITEMS.bowFrost = { n: '서리 정령의 활', kind: 'sword', wt: 'bow', dmg: 32, stack: 1, fx: 'chill', d: '서리 정령이 남긴 활. 화살에 맞은 적이 얼어붙어요.' }; ICON.bowFrost = bowIcon('#5a9ac8', '#e8f8ff', '#7fd8f0'); DUR2.bowFrost = [1300, [['frostShard', 3]]]; RAR.bowFrost = 3;
ITEMS.swordDawn = { n: '새벽빛 검', kind: 'sword', wt: 'sword', dmg: 62, stack: 1, fx: 'burn', d: '용암과 서리의 핵을 함께 벼린 전설의 검. 새벽처럼 환하게 타올라요.' }; ICON.swordDawn = swordIcon('#ffe9a8', '#ffffff', '#ff8fa3'); DUR2.swordDawn = [2400, [['goldBar', 2], ['crystal', 2]]]; RAR.swordDawn = 4;
ITEMS.pickStar = { n: '별빛 곡괭이', kind: 'pick', power: 7, tier: 3, stack: 1, d: '별빛이 깃든 전설의 곡괭이. 어떤 벽이든 순식간에 캐요.' }; ICON.pickStar = pickIcon('#ffe9a8', '#ffffff'); DUR2.pickStar = [3000, [['goldBar', 2], ['frostShard', 2]]]; RAR.pickStar = 4;
RECIPES.push(Rc('swordDawn', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['crystal', 10]], 'forge', 'weapon'), Rc('pickStar', 1, [['lavaCore', 1], ['frostCore', 1], ['goldBar', 8], ['frostShard', 8]], 'forge', 'tool'));
Object.assign(RAR, { goldBar: 2, frostShard: 2, obsidian: 2, lavaCore: 3, frostCore: 3 });
// ---- v42 mineral arrows: optional ammo — a bow shoots plain wooden arrows forever, but carries the best arrows in the bag first (one per shot) ----
// id: [name, damage ×, tip colour, recipe (makes 10), station, pierce, effect]
const ARROWS = {
  arrowStone: ['돌 화살', 1.15, '#b9b4cc', [['stone', 2], ['wood', 1]], 'bench', 0],
  arrowCopper: ['구리 화살', 1.3, '#e5884a', [['copperBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowIron: ['철 화살', 1.5, '#d8e0ea', [['ironBar', 1], ['wood', 1], ['fiber', 1]], 'forge', 0],
  arrowCrystal: ['수정 화살', 1.7, '#c1a8f5', [['crystal', 2], ['wood', 1], ['fiber', 1]], 'forge', 1],
  arrowGold: ['금 화살', 1.9, '#ffd25c', [['goldBar', 1], ['wood', 2], ['fiber', 1]], 'forge', 0, 'burn'],
};
const ARROW_ORD = Object.keys(ARROWS).reverse(); // best first
const arrowIcon = (h, hl) => A => { A.line(2, 14, 11, 5, '#8a6a52', 1); A.line(3, 14, 11, 6, '#b8946a', 1); A.poly([[9.5, 3.5], [14.5, 1.5], [12.5, 6.5]], h); A.p(12, 4, hl); A.r(1, 11, 2, 2, '#eef2f7'); A.r(3, 13, 2, 2, '#eef2f7'); A.p(2, 12, '#ff8fa3'); };
for (const id in ARROWS) { const [n, mul, tip, req, at, pierce, fx] = ARROWS[id];
  ITEMS[id] = { n, kind: 'arrow', stack: 999, arw: { mul, tip, pierce, fx }, d: `활을 쓸 때 가방에 있으면 한 발에 하나씩 써요. 화살이 없으면 나무 화살을 써요.` }; ICON[id] = arrowIcon(tip, '#ffffff'); RECIPES.push(Rc(id, 10, req, at, 'weapon')); }
Object.assign(RAR, { arrowIron: 1, arrowCrystal: 2, arrowGold: 2 });
function bestArrow() { for (const id of ARROW_ORD) { const k = G.inv.findIndex(s => s && s.id === id); if (k >= 0) return k; } return -1; }
function takeArrow() { const k = bestArrow(); if (k < 0) return null; const s = G.inv[k], a = ITEMS[s.id].arw; s.c--; if (s.c <= 0) G.inv[k] = null; invDirty = true; G.stats.arrows = (G.stats.arrows || 0) + 1; return a; }
// ---- v42 stone drill: an electric drill like the ore drills, cheaper and quicker, but only for terrain (dirt and stone walls) ----
ITEMS.drillStone = { n: '돌 채굴기', kind: 'place', obj: 'drillStone', d: '놓을 때 바라보는 쪽의 지형(흙벽·돌벽·화강암 벽)에서 흙·돌·화강암을 계속 캐요(벽은 사라지지 않아요). 광맥은 못 캐는 대신 구리 채굴기보다 빨라요. 전기가 필요해요.' };
OBJ.drillStone = { n: '돌 채굴기', solid: 1, item: 'quarry', dev: 'drill', tier: 1, only: [1, 2, 3], every: 8, draw: .4, idle: 0 };
USE.drillStone = 'drill';
const stoneDrill = dir => A => { A.r(3, 8, 10, 10, '#8f8aa3'); A.r(3, 8, 10, 2, '#b9b4cc'); A.r(3, 8, 1, 10, '#a39eb5'); A.r(12, 8, 1, 10, '#625d78'); A.p(5, 15, '#625d78'); A.p(10, 11, '#625d78'); A.p(9, 16, '#625d78');
  A.r(5, 12, 6, 3, '#9c6a4a'); A.r(5, 12, 6, 1, '#c99560'); A.e(8, 13.5, 1.4, 1.4, '#5a3929'); A.line(8, 13, 11, 11, '#5a3929'); A.p(7, 16, '#7fe0b5');
  const [dx, dy] = dir; if (dy < 0) A.poly([[5, 9], [11, 9], [8, 1]], '#b9b4cc'); else if (dy > 0) A.poly([[5, 17], [11, 17], [8, 21]], '#b9b4cc'); else if (dx > 0) A.poly([[12, 10], [12, 16], [16, 13]], '#b9b4cc'); else A.poly([[4, 10], [4, 16], [0, 13]], '#b9b4cc'); A.p(8 + dx * 5, 12 + dy * 5, '#ffffff'); };
OSPR.drillStone = [16, 22, stoneDrill([0, -1])];
for (const [k, d] of [['U', [0, -1]], ['D', [0, 1]], ['L', [-1, 0]], ['R', [1, 0]]]) OSPR['drillStone' + k] = [16, 22, stoneDrill(d)];
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
function emberSpr() { return mk(16, 16, A => { A.r(5, 14, 2, 1, '#3a2a26'); A.r(9, 14, 2, 1, '#3a2a26'); A.e(8, 11, 3.8, 3.3, '#5a3a2e'); A.p(7, 11, '#ffc861'); A.p(9, 11, '#ffc861'); A.p(6, 12, '#ff8a3d'); A.p(10, 12, '#ff8a3d');
  A.poly([[2.5, 9], [5, 3], [7, 5.5], [8, 0.5], [10, 5.5], [11.5, 3], [13.5, 9]], '#ff6a2a'); A.poly([[4.5, 9], [6.5, 5], [8, 3], [9.5, 5], [11.5, 9]], '#ffc861'); A.r(3, 8, 10, 1, '#c4441a'); }); }
function snowSpr() { return mk(16, 16, A => { A.e(8, 11.5, 4.6, 3.6, '#c8dcef'); A.e(8, 11, 4.3, 3.3, '#ffffff'); A.e(8, 6, 3.4, 3, '#c8dcef'); A.e(8, 5.6, 3.1, 2.7, '#ffffff'); A.p(7, 5, INK); A.p(9, 5, INK); A.p(6, 6, C.blush); A.p(10, 6, C.blush); A.p(8, 7, '#ff9b4a');
  A.line(3, 9, 1, 7, '#7a5a3a'); A.line(13, 9, 15, 7, '#7a5a3a'); A.p(8, 10, '#5a88b0'); A.p(8, 12, '#5a88b0'); A.r(5, 2, 6, 1, '#7fd8f0'); A.r(6, 1, 4, 1, '#7fd8f0'); }); }
function turtleSpr(shell) { return mk(40, 32, A => {
  if (!shell) { A.e(7, 26, 3.4, 2.6, '#a8784e'); A.e(33, 26, 3.4, 2.6, '#a8784e'); A.e(9, 13, 3, 2.4, '#a8784e'); A.e(31, 13, 3, 2.4, '#a8784e'); }
  A.e(20, 18, 17, 11, '#3a2620'); A.e(20, 17, 16, 10, '#5a3a2e'); A.e(20, 16, 13, 7.5, '#7a4a34');
  for (const [x, y] of [[14, 13], [20, 11], [26, 13], [17, 19], [23, 19]]) { A.poly([[x - 3, y], [x, y - 2.5], [x + 3, y], [x, y + 2.5]], '#4a2e24'); A.line(x - 2, y, x + 2, y, '#ff8a3d'); A.p(x, y - 1, '#ffc861'); }
  A.poly([[12, 8], [14, 3], [16, 8]], '#2a1c18'); A.poly([[18, 6], [20, 0.5], [22, 6]], '#2a1c18'); A.poly([[24, 8], [26, 3], [28, 8]], '#2a1c18'); A.p(20, 2, '#ff8a3d');
  A.r(4, 25, 32, 2, '#2a1c18');
  if (!shell) { A.e(20, 27, 6, 4.6, '#c9a070'); A.e(18.5, 25.5, 3, 1.6, '#e0c090'); A.r(16, 26, 2, 2, INK); A.r(22, 26, 2, 2, INK); A.p(16, 26, '#fff'); A.p(22, 26, '#fff'); A.r(19, 29, 2, 1, INK); A.e(15, 29, 1.2, .8, C.blush); A.e(25, 29, 1.2, .8, C.blush); }
}); }
function spiritSpr() { return mk(32, 36, A => {
  A.poly([[9, 24], [16, 35], [23, 24]], '#bfe6ff'); A.poly([[12, 24], [16, 32], [20, 24]], '#e8f8ff');
  A.e(5, 18, 2.6, 2.6, '#9fd8f0'); A.e(27, 18, 2.6, 2.6, '#9fd8f0'); A.p(4, 17, '#fff'); A.p(26, 17, '#fff');
  A.e(16, 17, 10, 9.5, '#7fc0e8'); A.e(16, 16.5, 9.2, 8.8, '#d4f0ff'); A.e(13, 13, 4, 2.6, '#ffffff');
  A.r(12, 16, 2, 3, '#2a4f88'); A.r(18, 16, 2, 3, '#2a4f88'); A.p(12, 16, '#fff'); A.p(18, 16, '#fff'); A.r(15, 21, 2, 1, '#2a4f88'); A.e(10.5, 20, 1.4, .9, '#ffc0d0'); A.e(21.5, 20, 1.4, .9, '#ffc0d0');
  for (const [x, h] of [[9, 5], [13, 8], [16, 10], [19, 8], [23, 5]]) { A.poly([[x - 1.8, 9], [x, 9 - h], [x + 1.8, 9]], '#7fd8f0'); A.poly([[x - .6, 9], [x, 9 - h + 2], [x + .6, 9]], '#ffffff'); }
}); }
// hazards on the floor: lava pools, frost nova warnings
function updateHazards(dt) {
  const p = G.p; G.hz = G.hz || [];
  for (let i = G.hz.length - 1; i >= 0; i--) { const h = G.hz[i]; h.t += dt; if (h.t > h.life) { G.hz.splice(i, 1); continue; } if (h.t < h.warn || p.dead > 0) continue;
    const d = Math.hypot(p.x - h.x, p.y - h.y);
    if (h.k === 'lava') { if (d < h.r) hurtPlayer(h.dmg, h.x, h.y, 'fire'); }
    else if (!h.done) { h.done = 1; puff(h.x, h.y, '#d4f6ff', 26, 4.5, .4); shake = Math.max(shake, .3); if (d < h.r) { hurtPlayer(h.dmg, h.x, h.y); p.slowT = (h.slow || 2) * (wearing('snowBrooch') ? broochMul(eqLv('snowBrooch')) : 1); ftext(p.x, p.y - 1.6, '꽁꽁!', '#bfe6ff'); } } }
}
function drawHazards(T, camX, camY) {
  const t = performance.now() / 1000;
  for (const h of G.hz || []) { const X = h.x * T - camX, Y = h.y * T - camY, warn = h.t < h.warn;
    if (h.k === 'lava') { const a = warn ? .25 + .25 * Math.sin(t * 20) : Math.min(1, (h.life - h.t) * 1.5); ctx.globalAlpha = a; ctx.fillStyle = warn ? '#ff8a3d' : '#e8501f'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.fill(); if (!warn) { ctx.fillStyle = '#ffc861'; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * .55, h.r * T * .32, 0, 0, 6.283); ctx.fill(); } ctx.globalAlpha = 1; }
    else if (warn) { const pr = h.t / h.warn; ctx.strokeStyle = `rgba(191,230,255,${.4 + pr * .5})`; ctx.lineWidth = 2 * Z; ctx.setLineDash([4 * Z, 3 * Z]); ctx.beginPath(); ctx.ellipse(X, Y, h.r * T, h.r * T * .62, 0, 0, 6.283); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = `rgba(191,230,255,${pr * .25})`; ctx.beginPath(); ctx.ellipse(X, Y, h.r * T * pr, h.r * T * .62 * pr, 0, 0, 6.283); ctx.fill(); } }
}

