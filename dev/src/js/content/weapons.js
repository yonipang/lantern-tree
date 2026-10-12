// ---- materials, the copper workbench, weapon types ----
Object.assign(ITEMS, {
  resin: { n: '송진', d: '뿌리기둥이나 큰버섯을 베면 가끔 나오는 끈적한 송진. 단단하게 붙여 줘요.' },
  rope: { n: '이끼 끈', d: '이끼 섬유를 꼬아 만든 튼튼한 끈. 도구와 가구에 쓰여요.' },
  forge: { n: '구리 제작대', kind: 'place', obj: 'forge', d: '구리·철·수정으로 된 도구, 무기, 가구를 만드는 곳.' },
});
OBJ.forge = { n: '구리 제작대', solid: 1, station: 'forge', item: 'forge' };
STN.forge = '구리 제작대';
OBJ.root.drops.push(['resin', 1, 1, 0.4]); OBJ.bigShroom.drops.push(['resin', 1, 1, 0.25]);
OSPR.forge = [16, 20, A => { A.r(2, 13, 2, 6, C.woodD); A.r(12, 13, 2, 6, C.woodD); A.r(1, 10, 14, 4, C.wood); A.r(1, 10, 14, 1, C.copperL); A.r(1, 11, 14, 1, C.copper); A.r(1, 13, 14, 1, C.woodD); A.r(4, 6, 8, 3, C.iron); A.r(3, 5, 10, 1, C.ironL); A.r(12, 6, 3, 1, C.iron); A.r(6, 9, 4, 1, C.ironD); A.line(10, 1, 13, 4, C.woodD); A.r(8, 1, 4, 2, C.ironD); A.r(2, 8, 2, 2, C.copper); A.p(2, 8, C.copperL); }];
const daggerIcon = (b, bl, g) => A => { A.line(7, 9, 12, 4, b, 2); A.line(7, 8, 12, 4, bl, 1); A.p(13, 3, bl); A.line(5, 7, 9, 11, g, 2); A.line(3, 13, 6, 10, C.woodD, 2); A.p(2, 14, C.amber); };
const spearIcon = (h, hl) => A => { A.line(1, 15, 10, 6, C.woodD, 1); A.line(2, 15, 10, 7, C.wood, 1); A.r(8, 7, 2, 2, '#e5c97a'); A.poly([[9.2, 4.2], [15, 1], [11.8, 6.8]], h); A.line(10, 4.5, 14, 1.8, hl, 1); };
const hammerIcon = (h, hl, hd) => A => { A.line(2, 14, 9, 7, C.woodD, 2); A.line(2, 13, 8, 7, C.woodL, 1); A.poly([[6, 5], [10.5, 0.5], [15.5, 5.5], [11, 10]], h); A.line(7, 5, 10.5, 1.5, hl, 1); A.line(11, 9.5, 15, 5.5, hd, 1); };
const bowIcon = (c1, c2, ar) => A => { for (let k = 0; k <= 24; k++) { const t = k / 24, x = Math.round((1 - t) * (1 - t) * 3 + 2 * (1 - t) * t * 2 + t * t * 13), y = Math.round((1 - t) * (1 - t) * 13 + 2 * (1 - t) * t * 2 + t * t * 3); A.r(x, y, 2, 2, c1); A.p(x, y, c2); } A.line(4, 13, 13, 4, '#f0e8d8'); A.line(6, 10, 12, 4, ar || C.woodL); A.p(12, 3, C.ironL); A.p(13, 4, C.ironL); };
const staffIcon = (o1, o2) => A => { A.line(2, 14, 10, 6, C.woodD, 2); A.line(2, 13, 9, 6, C.woodL, 1); A.p(9, 8, C.woodD); A.p(8, 6, C.woodD); A.e(11.5, 4.5, 3.2, 3.2, o1); A.e(11, 4, 1.4, 1.4, o2); A.p(10, 3, '#ffffff'); A.p(14, 1, o2); A.p(15, 7, o2); };
Object.assign(ICON, {
  resin: A => { A.poly([[8, 2], [11.6, 8.5], [4.4, 8.5]], '#e8a33a'); A.e(8, 10, 4, 4, '#e8a33a'); A.e(7, 9, 1.5, 2, '#ffd98a'); A.p(6, 8, '#fff3d0'); A.p(10, 12, '#b8742a'); A.p(9, 13, '#b8742a'); },
  rope: A => { A.e(8, 9, 6, 4.6, '#b8903f'); A.e(8, 9, 4.6, 3.4, '#d9b66a'); A.e(8, 9, 3, 2.2, '#b8903f'); A.e(8, 9, 1.6, 1.1, '#7a5a2a'); A.line(12, 11, 15, 14, '#b8903f', 2); A.p(5, 6, '#f0d898'); A.p(9, 5, '#f0d898'); },
});
const WTYPE = {
  fist: { n: '주먹', reach: 1.15, arc: 1.0, cd: 0.3, kb: 4 },
  sword: { n: '검', reach: 1.45, arc: 1.3, cd: 0.36, kb: 8 },
  axe: { n: '도끼', reach: 1.5, arc: 1.2, cd: 0.5, kb: 10, chop: 1.6 },
  dagger: { n: '단검', reach: 1.2, arc: 1.05, cd: 0.22, kb: 4, crit: 0.15 },
  spear: { n: '창', reach: 2.35, arc: 0.42, cd: 0.46, kb: 11 },
  hammer: { n: '망치', reach: 1.7, arc: 2.5, cd: 0.72, kb: 16 },
  bow: { n: '활', ranged: 'arrow', range: 6.5, cd: 0.62, spd: 12, kb: 2.5 },
  staff: { n: '지팡이', ranged: 'orb', range: 6.5, cd: 0.66, spd: 8, mp: 5, magic: 1, kb: 2 },
};
const wtOf = w => WTYPE[(w && w.wt) || 'sword'];
for (const id of ['swordWood', 'swordCopper', 'swordIron', 'swordCrystal']) ITEMS[id].wt = 'sword';
const rarDefault = () => { for (const id in ITEMS) if ((ITEMS[id].kind === 'sword' || ITEMS[id].kind === 'pick') && RAR[id] == null) RAR[id] = 0; };
// id: [name, type, damage, recipe, durability, repair, icon, description, orb colour]
const WEAPONS = {
  daggerWood: ['나무 단검', 'dagger', 4, [['wood', 3], ['fiber', 2]], 150, [['wood', 2]], daggerIcon(C.woodL, '#f0c890', C.woodD), '짧지만 아주 빠르게 찔러요. 치명타가 잘 터져요.'],
  spearWood: ['나무 창', 'spear', 6, [['wood', 5], ['rope', 1]], 180, [['wood', 3]], spearIcon(C.stone, C.stoneL), '멀리 있는 적을 콕 찔러요. 앞쪽 좁은 곳만 맞혀요.'],
  bowWood: ['나무 활', 'bow', 4, [['wood', 4], ['rope', 2]], 160, [['rope', 1]], bowIcon(C.wood, C.woodL), '멀리 화살을 쏴요. 화살은 따로 필요 없어요.'],
  daggerCopper: ['구리 단검', 'dagger', 8, [['copperBar', 3], ['wood', 1], ['rope', 1]], 300, [['copperBar', 1]], daggerIcon(C.copper, C.copperL, C.woodD), '빠르게 콕콕! 치명타가 잘 터져요.'],
  spearCopper: ['구리 창', 'spear', 12, [['copperBar', 4], ['wood', 3], ['rope', 1]], 320, [['copperBar', 2]], spearIcon(C.copper, C.copperL), '긴 창으로 멀리서 안전하게 찔러요.'],
  hammerCopper: ['구리 망치', 'hammer', 20, [['copperBar', 6], ['wood', 2], ['stone', 4]], 300, [['copperBar', 2]], hammerIcon(C.copper, C.copperL, C.copperD), '느리지만 넓게 쾅! 적을 멀리 밀어내요.'],
  staffGlow: ['빛버섯 지팡이', 'staff', 9, [['wood', 4], ['glowcap', 4], ['gel', 3], ['copperBar', 1]], 250, [['glowcap', 2]], staffIcon(C.glow, C.glowL), '기력을 조금 써서 적을 꿰뚫는 빛 구슬을 쏴요. 지혜가 높을수록 세져요.', '#9ff2e6'],
  spearIron: ['철 창', 'spear', 19, [['ironBar', 4], ['wood', 3], ['rope', 2]], 550, [['ironBar', 2]], spearIcon(C.iron, C.ironL), '묵직한 철 창. 멀리서 깊게 찔러요.'],
  hammerIron: ['철 망치', 'hammer', 32, [['ironBar', 7], ['wood', 2], ['resin', 2]], 600, [['ironBar', 3]], hammerIcon(C.iron, C.ironL, C.ironD), '바닥이 울릴 만큼 강한 한 방.'],
  bowIron: ['사냥꾼의 활', 'bow', 11, [['ironBar', 3], ['wood', 4], ['rope', 3], ['gel', 2]], 450, [['ironBar', 1], ['rope', 1]], bowIcon(C.woodD, C.wood, C.iron), '팽팽한 시위로 빠른 화살을 쏴요.'],
  staffCrystal: ['수정 지팡이', 'staff', 17, [['crystal', 10], ['ironBar', 4], ['glowcap', 4]], 700, [['crystal', 3]], staffIcon(C.cry, C.cryL), '보랏빛 구슬이 적 여럿을 꿰뚫어요.', '#d6c2ff'],
  bowCrystal: ['별빛 활', 'bow', 18, [['crystal', 10], ['ironBar', 4], ['rope', 4], ['glowcap', 2]], 800, [['crystal', 3]], bowIcon(C.cry, C.cryL, C.cryL), '별빛처럼 반짝이는 화살을 쏴요.'],
  axeStone: ['돌 도끼', 'axe', 8, [['stone', 4], ['wood', 3], ['rope', 1]], 200, [['stone', 2]], axeIcon(C.stone, C.stoneL), '묵직하게 내려찍어요. 들고 있으면 나무도 더 빨리 베요.'],
  axeCopper: ['구리 도끼', 'axe', 15, [['copperBar', 4], ['wood', 2], ['rope', 1]], 350, [['copperBar', 2]], axeIcon(C.copper, C.copperL), '단단한 구리 도끼. 적을 멀리 밀어내고 나무도 잘 베요.'],
  axeIron: ['철 도끼', 'axe', 23, [['ironBar', 4], ['wood', 2], ['resin', 1]], 550, [['ironBar', 2]], axeIcon(C.iron, C.ironL), '날이 선 철 도끼. 한 번에 크게 찍어요.'],
};
const WEAPON_DUR = {}, DUR2 = {};
for (const id in WEAPONS) { const [n, wt, dmg, req, dur, fix, icon, d, orb] = WEAPONS[id];
  ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, orb }; ICON[id] = icon; WEAPON_DUR[id] = [dur, fix]; RECIPES.push(Rc(id, 1, req, 'bench', 'weapon')); }
// ---- boss-only weapons (epic) with on-hit effects ----
const FXN = { poison: '독: 맞은 적이 몇 초 동안 계속 아파요', slow: '끈적끈적: 맞은 적이 느려져요', split: '수정 파편: 맞은 곳에서 파편 3개가 튀어 주변 적도 맞혀요', burn: '불꽃: 맞은 적이 불타올라요', chill: '서리: 맞은 적이 꽁꽁 얼어 아주 느려져요' };
const UNIQ = {
  daggerQueen: ['포자 여왕의 단검', 'dagger', 18, 650, [['shroomCap', 3]], daggerIcon('#c58cf0', '#f6e6ff', '#7d3fa3'), '버섯 여왕이 남긴 단검. 찌를 때마다 독 포자가 퍼져요.', 'poison', 'queen'],
  hammerSlime: ['말랑대왕 망치', 'hammer', 34, 700, [['gel', 6]], hammerIcon('#86d96b', '#d2f7b8', '#4f9e45'), '말랑대왕의 왕관 조각으로 만든 망치. 맞은 적이 끈적해져 느려져요.', 'slow', 'slime'],
  bowGolem: ['수정 거인의 활', 'bow', 24, 900, [['crystal', 4]], bowIcon('#6a6488', C.cryL, C.cry), '수정골렘의 팔로 만든 활. 화살이 맞으면 수정 파편이 튀어요.', 'split', 'golem'],
};
const UNIQ_OF = {};
for (const id in UNIQ) { const [n, wt, dmg, dur, fix, icon, d, fx, boss] = UNIQ[id];
  ITEMS[id] = { n, kind: 'sword', wt, dmg, stack: 1, d, fx, orb: '#d6c2ff' }; ICON[id] = icon; WEAPON_DUR[id] = [dur, fix]; UNIQ_OF[boss] = id; }
ITEMS.golemCore = { n: '수정 핵', d: '수정골렘의 가슴에서 빛나던 핵. 수정 곡괭이를 만드는 데 써요.' };
ICON.golemCore = A => { A.poly([[8, 1], [14, 8], [8, 15], [2, 8]], C.cryD); A.poly([[8, 2.5], [12.5, 8], [8, 13.5], [3.5, 8]], C.cry); A.poly([[8, 2.5], [8, 8], [3.5, 8]], C.cryL); A.e(8, 8, 2, 2, '#7ff0e6'); A.p(7, 7, '#ffffff'); };
ITEMS.pickCrystal = { n: '수정 곡괭이', kind: 'pick', power: 4, tier: 3, stack: 1, d: '아주 단단한 곡괭이. 용암·얼음 지역의 벽까지 캘 수 있어요.' };
ICON.pickCrystal = pickIcon(C.cry, C.cryL); WEAPON_DUR.pickCrystal = [1400, [['crystal', 3]]];
RECIPES.push(Rc('pickCrystal', 1, [['crystal', 10], ['ironBar', 4], ['golemCore', 1], ['glowcap', 2]], 'forge', 'tool'));
// rarity: 0 일반 · 1 고급 · 2 희귀 · 3 영웅 · 4 전설
const RARITY = [['일반', '#d9d0e2'], ['고급', '#7fe0b5'], ['희귀', '#7fb8ff'], ['영웅', '#c89aff'], ['전설', '#ffc35a']];
const RAR = { pickIron: 1, swordIron: 1, spearIron: 1, hammerIron: 1, bowIron: 1, staffGlow: 1, swordCrystal: 2, staffCrystal: 2, bowCrystal: 2, pickCrystal: 2, golemCore: 2, daggerQueen: 3, hammerSlime: 3, bowGolem: 3 };
const rarOf = id => RAR[id] != null ? RAR[id] : -1;
const rarCol = id => rarOf(id) >= 1 ? RARITY[rarOf(id)][1] : null;
const rarName = id => { const c = rarCol(id), n = ITEMS[id].n; return c ? `<span style="color:${c}">${n}</span>` : n; };
RECIPES.push(Rc('gMoss', 1, [['fiber', 1]], null, 'mat'), Rc('rope', 1, [['fiber', 3]], null, 'mat'), Rc('forge', 1, [['copperBar', 3], ['wood', 8], ['resin', 2]], 'bench', 'furn'));
// crafting asks for one or two more kinds of material than before
const REQ_FIX = {
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
const METAL = ['copperBar', 'ironBar', 'crystal'];
for (const r of RECIPES) if (r.at === 'bench' && r.out !== 'forge' && r.req.some(([id]) => METAL.includes(id))) r.at = 'forge';
const benchNear = near => near.has('bench') || near.has('forge');
rarDefault();
const HOT = 9, BAG0 = 24, BAG_STEP = 6, BAG_MAX_LV = 3;
const BAG_UPS = [['bagUp1', '튼튼한 가방', [['fiber', 20], ['rope', 6], ['resin', 2]], 'bench'], ['bagUp2', '여행자의 가방', [['rope', 10], ['gel', 10], ['copperBar', 4]], 'forge'], ['bagUp3', '큰 모험가 가방', [['rope', 16], ['shroomCap', 8], ['ironBar', 4]], 'forge']];
BAG_UPS.forEach(([id, n, req, at], k) => { ITEMS[id] = { n, bagUp: k + 1, d: `만들면 가방이 ${BAG_STEP}칸 늘어나요 (${BAG0 + BAG_STEP * k}칸 → ${BAG0 + BAG_STEP * (k + 1)}칸).` }; ICON[id] = A => { UICON.bag(A); A.r(10, 1, 6, 6, '#7fe0b5'); A.r(12, 2, 2, 4, '#241b2f'); A.r(11, 3, 4, 2, '#241b2f'); }; const r = Rc(id, 1, req, at, 'tool'); r.bag = k; RECIPES.push(r); });

