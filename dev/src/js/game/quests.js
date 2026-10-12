// ================= guide =================
function nearestObjOf(t, rad = 24) { const p = G.p; let best = null, bd = 1e9; for (let y = Math.floor(p.y - rad); y <= p.y + rad; y++) for (let x = Math.floor(p.x - rad); x <= p.x + rad; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && o.t === t) { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = { x: x + .5, y: y + .5 }; } } } return best; }
const hasItem = id => countItem(id) > 0 || wearing(id);
// v47: quest texts name directions from the old map; on the ring map they are rewritten from where things really are
function dirFix() { if (LAY !== 2) return null; const d = (x, y) => dirKo(x, y);
  return { '서쪽 버섯숲': `${d(SA.x, SA.y)} 버섯숲`, '동쪽 동굴의 말랑대왕': `${d(BX, BY)} 이끼 동굴의 말랑대왕`, '화살표를 따라 서쪽으로!': `화살표를 따라 ${d(SA.x, SA.y)}으로!`, '화살표를 따라 동쪽으로!': `화살표를 따라 ${d(BX, BY)}으로!`,
    '북쪽 수정동굴': `${d(SB.x, SB.y)} 수정동굴`, '남쪽 용암 동굴': `${d(SL.x, SL.y)} 용암 동굴`, '서쪽 얼음 동굴': `${d(SI.x, SI.y)} 얼음 동굴`,
    '아주 단단한 벽에 막혀 있어서 수정 곡괭이가 있어야 들어갈 수 있어요.': '벽이 아주 단단해서 수정 곡괭이가 있어야 캘 수 있어요. 열린 굴로 걸어 들어갈 수는 있지만 덥고 추우니 준비해서 가요.',
    '수정 곡괭이로 남쪽·서쪽 깊은 곳의 단단한 벽을 뚫어요.': `바깥 고리의 ${d(SL.x, SL.y)} 용암 동굴과 ${d(SI.x, SI.y)} 얼음 동굴로 가 봐요.` }; }
function dirText(str) { const m = dirFix(); if (!m || typeof str !== 'string') return str; const re = new RegExp(Object.keys(m).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'); return str.replace(re, a => m[a]); }
function layoutTexts() { if (typeof GUIDE === 'undefined') return; for (const q of [...GUIDE, ...QSIDE]) { if (!('_t0' in q)) { q._t0 = q.t; q._h0 = q.h; }
  q.t = typeof q._t0 === 'function' ? (() => dirText(q._t0())) : dirText(q._t0); q.h = typeof q._h0 === 'function' ? (() => dirText(q._h0())) : dirText(q._h0); } }
const GUIDE = [
  { t: () => `뿌리기둥을 베어 나무 모으기 (${Math.min(6, G.stats.wood)}/6)`, h: '초록 이끼가 덮인 기둥 앞에서 손 버튼(PC는 E)을 눌러요.', done: () => G.stats.wood >= 6, target: () => nearestObjOf('root', 14) },
  { t: () => '제작에서 작업대 만들고 설치하기', h: '오른쪽 위 [제작] → 작업대. 만든 뒤 단축칸에서 고르고 빈 땅을 바라보며 눌러요.', done: () => G.stats.bench },
  { t: () => '횃불을 만들어 어두운 곳에 놓기', h: '횃불은 어디서나 만들 수 있어요. 밝은 곳에는 몬스터가 생기지 않아요.', done: () => G.stats.torch > 0 },
  { t: () => `흙벽에서 구리광석 캐기 (${Math.min(6, G.stats.copperOre)}/6)`, h: '주황색 돌이 박힌 벽을 찾아 캐요. 흙은 용광로 재료가 돼요.', done: () => G.stats.copperOre >= 6 },
  { t: () => '용광로를 놓고 구리괴 만들기', h: '작업대에서 용광로를 만든 뒤 설치하고, 용광로를 열어 구리괴를 만들어요.', done: () => G.stats.copperBar >= 1 },
  { t: () => '작업대를 구리 작업대로 올리기', h: '작업대를 열면 맨 위에 [올리기]가 있어요 (구리괴 8·돌 20). 구리 가구·요리솥은 구리 작업대부터 만들어요. 무기·도구는 장비제작대를 같은 방법으로 올려서 만들어요.', done: () => G.stats.forge || hasItem('forge') || hasItem('pickCopper') || hasItem('pickIron') },
  { t: () => '구리 곡괭이 만들기', h: '장비제작대(작업대에서 나무·돌로 만들어요)를 놓고 구리 단계로 올린 뒤 만들어요. 이끼 끈은 [제작 → 재료]에서 이끼 섬유로 꼬아요. 구리 곡괭이가 있으면 돌벽과 철 광맥도 캘 수 있어요.', done: () => hasItem('pickCopper') || hasItem('pickIron') },
  { t: () => '서쪽 버섯숲의 버섯 여왕 물리치기', h: '화살표를 따라 서쪽으로! 여왕은 포자를 둥글게 흩뿌려요. 포자 사이 빈틈으로 피하고, 따라오는 버섯도깨비를 먼저 정리해요.', done: () => beat('queen'), target: () => BOSSES.queen.home() },
  { t: () => '동쪽 동굴의 말랑대왕 물리치기', h: '화살표를 따라 동쪽으로! 대왕은 여왕보다 훨씬 튼튼해요. 음식을 넉넉히 챙기고, 점프 후 착지할 때 멀리 떨어져요.', done: () => beat('slime'), target: () => BOSSES.slime.home() },
  { t: () => '북쪽 수정동굴의 수정골렘 물리치기', h: '빨간 점선이 보이면 옆으로 피해요! 벽에 부딪혀 기절했을 때 때리면 더 아파요. 화강암 벽과 석영 광맥은 철 곡괭이로 캘 수 있어요.', done: () => beat('golem'), target: () => BOSSES.golem.home() },
  { t: () => `빛씨앗 모으기 (${Math.min(3, G.stats.seedsFound)}/3)`, h: '봉인이 풀린 두 제단의 씨앗과, 말랑대왕이 남긴 씨앗을 모아요.', done: () => G.stats.seedsFound >= 3,
    target: () => { const p = G.p; const c = [SA, SB].filter(s => G.objs.get(idx(s.x, s.y))?.has && G.bossDead[guardOf(s.x, s.y)]).map(s => ({ x: s.x + .5, y: s.y + .5 })); c.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); return c[0] || null; } },
  { t: () => `등불나무에 빛씨앗 심기 (${G.treeSeeds}/3)`, h: '빛씨앗을 들고 등불나무 앞에서 눌러요.', done: () => G.treeSeeds >= 3, target: () => ({ x: CX + .5, y: CY + .5 }) },
  { t: () => '수정 핵으로 수정 곡괭이 만들기', h: '수정골렘이 남긴 수정 핵으로 석영 장비제작대(장비제작대를 석영 단계까지 올려요)에서 만들어요. 남쪽 용암 동굴과 서쪽 얼음 동굴은 아주 단단한 벽에 막혀 있어서 수정 곡괭이가 있어야 들어갈 수 있어요.', done: () => ['pickCrystal', 'pickGold', 'pickStar'].some(hasItem) || beat('turtle') || beat('spirit') },
  { t: () => '남쪽 용암 동굴의 용암 거북 물리치기', h: '등껍질에 숨어 굴러올 때는 거의 다치지 않아요. 벽에 튕기다 멈추면 그때 공격해요! 바닥이 주황색으로 반짝이면 곧 용암이 고여요.', done: () => beat('turtle'), target: () => BOSSES.turtle.home() },
  { t: () => '서쪽 얼음 동굴의 서리 정령 물리치기', h: '얼음 고리는 빈틈 쪽으로 빠져나가요. 정령이 사라지면 곁에 다시 나타나 얼음을 터뜨려요. 점선 원 밖으로 피해요!', done: () => beat('spirit'), target: () => BOSSES.spirit.home() },
  { t: () => `깊은 동굴의 빛씨앗 모으기 (${Math.max(0, Math.min(2, G.stats.seedsFound - 3))}/2)`, h: '용암 거북과 서리 정령이 쓰러지면 빛씨앗을 떨어뜨려요. 예전 세이브라면 보스방 가운데 제단에 놓여 있을 수도 있어요.', done: () => G.stats.seedsFound >= 5 || G.treeSeeds >= 5,
    target: () => { const p = G.p; const c = [SL, SI].filter(s => G.objs.get(idx(s.x, s.y))?.has && G.bossDead[guardOf(s.x, s.y)]).map(s => ({ x: s.x + .5, y: s.y + .5 })); c.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); return c[0] || null; } },
  { t: () => `등불나무의 마지막 등불 밝히기 (${G.treeSeeds}/5)`, h: '빛씨앗을 들고 등불나무 앞에서 눌러요.', done: () => G.treeSeeds >= 5, target: () => ({ x: CX + .5, y: CY + .5 }) },
  { t: () => '낚시하고 지역 가구로 꾸미기', h: '물가에서 낚시를 하고, 제작에서 이끼·버섯·수정 세트 가구를 만들어 나만의 아지트를 꾸며 보세요.', done: () => false },
];
// quest ids, rewards and xp (main story, in order)
const Q_META = [['wood', [['fiber', 5], ['berry', 3]], 10], ['bench', [['torch', 4]], 10], ['torch', [['berrySeed', 3], ['rope', 2]], 10], ['ore', [['copperOre', 3], ['resin', 1]], 15], ['bar', [['resin', 2], ['gel', 2]], 15],
  ['forge', [['rope', 4]], 20], ['pick', [['grilled', 3], ['torch', 6]], 25], ['queen', [['copperBar', 5], ['glowcap', 3]], 80], ['slime', [['ironBar', 4], ['gel', 6]], 100], ['golem', [['crystal', 8], ['ironBar', 4]], 140],
  ['seeds', [['stew', 3]], 40], ['tree', [['crystal', 10], ['stew', 2]], 100], ['cpick', [['torch', 10], ['stew', 3]], 60], ['turtle', [['goldBar', 4], ['frostShard', 3]], 200], ['spirit', [['frostShard', 6], ['goldBar', 2]], 220], ['seeds2', [['fireBerry', 4]], 60], ['tree2', [['crystal', 12], ['goldBar', 4]], 200], ['free', [], 0]];
GUIDE.forEach((g, k) => { const m = Q_META[k]; g.id = m[0]; g.rw = m[1]; g.xp = m[2]; });
// side quests: any time, in any order
const QSIDE = [
  { id: 's_moss', t: '이끼 섬유로 이끼 한 삽 만들기', h: '[제작 → 재료]에서 이끼 섬유 1개로 만들어요.', done: () => (G.stats.made || {}).gMoss > 0, rw: [['fiber', 6]], xp: 10 },
  { id: 's_lv5', t: '레벨 5 달성하기', h: '몬스터를 물리치고 광석을 캐면 경험치가 쌓여요.', done: () => G.rpg.lv >= 5, rw: [['stew', 2], ['rope', 4]], xp: 0 },
  { id: 's_fish', t: () => `물고기 10마리 낚기 (${Math.min(10, G.stats.fishCaught || 0)}/10)`, h: '물가에서 낚싯대로 낚아요.', done: () => (G.stats.fishCaught || 0) >= 10, rw: [['grilledFish', 3], ['gel', 3]], xp: 30 },
  { id: 's_bag', t: '가방 한 번 늘리기', h: '[작업대 → 도구]에서 튼튼한 가방을 만들어요.', done: () => (G.bagLv || 0) >= 1, rw: [['rope', 6], ['resin', 2]], xp: 30 },
  { id: 's_kill', t: () => `몬스터 50마리 물리치기 (${Math.min(50, G.stats.kills || 0)}/50)`, h: '꽃망울과 말랑이들도 포함돼요.', done: () => (G.stats.kills || 0) >= 50, rw: [['ironBar', 3], ['stew', 2]], xp: 60 },
  { id: 's_petal', t: () => `꽃잎 다섯 색 모으기 (${Object.keys(FLOWERS).filter(c => countItem('petal' + c) > 0 || (G.stats.petals || {})[c]).length}/5)`, h: '이끼 동굴 곳곳의 꽃망울 구역을 찾아가요.', done: () => Object.keys(FLOWERS).every(c => countItem('petal' + c) > 0 || (G.stats.petals || {})[c]), rw: [['glowcap', 4], ['rope', 4]], xp: 50 },
  { id: 's_lamp', t: '전기 램프에 불 켜기', h: '건전지 → 전선 → 전기 램프를 이어 놓아요. 모두 구리 작업대에서 만들어요.', done: () => !!G.stats.litLamp, rw: [['wire', 10], ['battery', 1]], xp: 40 },
  { id: 's_drill', t: () => `채굴장에서 광물 20개 얻기 (${Math.min(20, G.stats.drilled || 0)}/20)`, h: '작업대에서 구리·철 채굴장을 만들어 놓으면 광석이 계속 차올라요. 전기를 이으면 저절로 캐요. 예전 채굴기를 광맥 벽 앞에 놓고 전기를 연결하면 계속 캐요. 옆에 상자가 있으면 거기에 담아요.', done: () => (G.stats.drilled || 0) >= 20, rw: [['battery', 2], ['copperBar', 6]], xp: 60 },
  { id: 's_deep', t: '용암 동굴과 얼음 동굴에 발 들이기', h: '수정 곡괭이로 남쪽·서쪽 깊은 곳의 단단한 벽을 뚫어요.', done: () => !!(G.stats.seen3 && G.stats.seen4), rw: [['fireBerry', 4], ['torch', 6]], xp: 60 },
  { id: 's_gold', t: () => `금괴 10개 만들기 (${Math.min(10, (G.stats.made || {}).goldBar || 0)}/10)`, h: '용암 동굴의 금 광맥에서 금광석을 캐서 용광로에서 녹여요.', done: () => ((G.stats.made || {}).goldBar || 0) >= 10, rw: [['obsidian', 3], ['fireBerry', 3]], xp: 80 },
  { id: 's_epic', t: () => `영웅 장비 3가지 모으기 (${Math.min(3, epicOwned())}/3)`, h: '보스 전용 무기나 황금·흑요석·서리 장비가 영웅 등급이에요.', done: () => epicOwned() >= 3, rw: [['goldBar', 4], ['stew', 3]], xp: 120 },
  { id: 's_legend', t: '전설 장비 만들기', h: '용암 핵과 서리 핵을 모아 서리 장비제작대에서 새벽빛 검이나 별빛 곡괭이를 만들어요.', done: () => ['swordDawn', 'pickStar'].some(id => hasItem(id) || ((G.stats.made || {})[id] || 0) > 0), rw: [['stew', 5], ['goldBar', 4]], xp: 300 },
  { id: 's_rematch', t: '보스 한 마리 다시 불러서 물리치기', h: '보스를 물리친 뒤 작업대에서 소환 조각상을 만들어 보스방에서 써요. 다시 잡으면 재료와 함께 가끔 전용 장비가 떨어져요.', done: () => (G.stats.rematch || 0) > 0, rw: [['stew', 3], ['goldBar', 2]], xp: 120 },
  { id: 's_gen', t: '발전기 돌리기', h: '발전기를 만들고 연료(나무·젤·송진)를 넣으면 건전지 없이 전기를 계속 써요.', done: () => !!G.stats.genRun, rw: [['ironBar', 4], ['resin', 4]], xp: 60 },
];
const MULTI = {
  bedDouble: ['포근한 2인 침대', '둘이 누워도 넉넉한 커다란 침대 (2×2).', [['wood', 14], ['fiber', 10], ['rope', 3]], 'bench', 'furn', [2, 2], { solid: 1, bed: 1 }, 'sleep'],
  longTable: ['긴 식탁', '여럿이 둘러앉는 긴 식탁 (2×1). 가로·세로로 돌릴 수 있어요.', [['wood', 10], ['resin', 1]], 'bench', 'furn', [2, 1], { solid: 1, rotV: 1 }],
  sofa2: ['2인 소파', '폭신한 민트색 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [['wood', 8], ['fiber', 10], ['rope', 2]], 'bench', 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit'],
  bookcase2: ['큰 책장', '책이 빼곡한 큰 책장 (2×1).', [['wood', 14], ['resin', 2]], 'bench', 'furn', [2, 1], { solid: 1 }, 'read'],
  kitchenSet: ['부엌 조리대', '싱크대와 화구가 붙은 조리대 (3×1).', [['copperBar', 4], ['stone', 8], ['wood', 6]], 'forge', 'furn', [3, 1], { solid: 1 }],
  fountainBig: ['큰 분수', '물소리가 졸졸 흐르는 큰 분수 (2×2).', [['stone', 20], ['gWater', 2], ['crystal', 2]], 'forge', 'furn', [2, 2], { solid: 1, light: [3.5, '#9fd8f0'] }, 'wish'],
  rugBig: ['큰 꽃 러그', '가운데 노란 꽃이 핀 러그 (2×2). 위로 걸어 다닐 수 있어요.', [['fiber', 12], ['petalR', 2]], 'bench', 'furn', [2, 2], { flat: 1 }],
  rugLong: ['긴 줄무늬 러그', '복도에 깔기 좋은 긴 러그 (3×2). 가로·세로로 돌릴 수 있어요.', [['fiber', 14], ['rope', 2]], 'bench', 'furn', [3, 2], { flat: 1, rotV: 1 }],
  rugRound: ['둥근 엮음 러그', '알록달록 엮은 큰 원형 러그 (3×3).', [['fiber', 18], ['petalY', 2], ['petalB', 2]], 'bench', 'furn', [3, 3], { flat: 1 }],
  bigTree: ['큰 고목', '굵은 줄기의 커다란 나무 (2×2). 베면 그루터기가 남고 다시 자라요.', [['dirt', 8], ['gMoss', 8], ['wood', 16], ['sapling', 2]], 'bench', 'nature', [2, 2], { solid: 1, ntree: 1, nat: 'cut', hp: 10, drops: [['wood', 6, 9, 1], ['resin', 1, 2, 0.6], ['sapling', 1, 1, 0.4]] }],
  bigRock: ['이끼 바위', '이끼가 살짝 덮인 큰 바위 (2×1).', [['stone', 16], ['gMoss', 2]], 'bench', 'nature', [2, 1], { solid: 1 }],
  flowerField: ['큰 꽃밭', '온갖 색 꽃이 가득한 꽃밭 (3×2). 위로 걸어 다닐 수 있어요.', [['dirt', 3], ['gMoss', 3], ['petalR', 2], ['petalY', 2], ['petalB', 2], ['petalW', 2]], 'bench', 'nature', [3, 2], { flat: 1, rotV: 1 }],
  pondBig: ['작은 연못', '연잎이 떠 있는 작은 연못 (2×2).', [['gWater', 4], ['stone', 8], ['gMoss', 2]], 'bench', 'nature', [2, 2], { flat: 1, solid: 1 }],
  pitCu: ['구리 채굴장', '구리 광맥을 옮겨 심은 2×2 채굴장이에요. 아무 데나 놓으면 광맥이 차오를 때마다 구리광석을 캐요. 전기를 이으면 저절로 캐서 옆 상자에 담아요.', [['copperBar', 6], ['stone', 16], ['copperOre', 8], ['rope', 2]], 'forge', 'mine', [2, 2], { solid: 1, dev: 'farm', draw: .6, idle: .05, grow: 120 }, 'farm'],
  pitFe: ['철 채굴장', '철 광맥을 옮겨 심은 2×2 채굴장이에요. 광맥이 차오를 때마다 철광석을 캐요. 전기를 이으면 저절로 캐서 옆 상자에 담아요.', [['ironBar', 6], ['copperBar', 4], ['ironOre', 8], ['crystal', 2]], 'forge', 'mine', [2, 2], { solid: 1, dev: 'farm', draw: .8, idle: .05, grow: 150 }, 'farm'],
  pitGold: ['황금 채굴장', '금 광맥을 옮겨 심은 2×2 채굴장이에요. 광맥이 차오를 때마다 금광석을 캐요. 전기를 이으면 저절로 캐서 옆 상자에 담아요.', [['goldBar', 4], ['obsidian', 4], ['goldOre', 6], ['ironBar', 4]], 'forge', 'mine', [2, 2], { solid: 1, dev: 'farm', draw: 1, idle: .05, grow: 180 }, 'farm'],
  quarry: ['돌 채굴장', '바위를 쌓아 둔 2×2 채석장이에요. 바위가 다시 차오르면 캐서 돌을 얻어요. 전기를 이으면 다 찰 때마다 저절로 캐서 옆 상자에 담아요.', [['stone', 20], ['wood', 8], ['rope', 2]], 'bench', 'mine', [2, 2], { solid: 1, dev: 'farm', draw: .6, idle: .05 }, 'farm'],
  treeFarm: ['나무 작업장', '묘목을 심어 둔 2×2 벌목장이에요. 나무가 다 자라면 베어요. 전기를 이으면 다 자랄 때마다 저절로 베어 옆 상자에 담아요.', [['wood', 20], ['dirt', 10], ['sapling', 2], ['rope', 2]], 'bench', 'nature', [2, 2], { solid: 1, dev: 'farm', draw: .6, idle: .05 }, 'farm'],
};
for (const id in MULTI) { const [n, d, req, at, cat, sz, ex, use] = MULTI[id]; ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = Object.assign({ n, item: id, sz }, ex); if (use) USE[id] = use; RECIPES.push(Rc(id, 1, req, at, cat)); }
for (const id of ['chair', 'cryChair', 'mossSofa']) if (OBJ[id]) OBJ[id].dir4 = 1;
const flowerDots = (A, w, h, seed) => { const R = rng(seed); const cs = ['#ff6b81', '#6fa8ff', '#ffd25c', '#ffffff', '#f49ab8']; for (let k = 0; k < w * h / 10; k++) { const x = 1 + R() * (w - 3) | 0, y = 2 + R() * (h - 4) | 0; A.e(x, y + 1, 1.6, .8, C.leafD); const c = cs[k % cs.length]; A.p(x - 1, y, c); A.p(x + 1, y, c); A.p(x, y - 1, c); A.p(x, y + 1, c); A.p(x, y, '#fff1d6'); } };
Object.assign(OSPR, {
  bedDouble: [32, 34, A => { A.r(1, 2, 30, 9, C.woodD); A.r(2, 3, 28, 7, C.wood); A.r(2, 3, 28, 2, C.woodL); A.r(2, 10, 28, 22, '#f3e2c4'); A.e(9, 13.5, 5.2, 2.8, '#e8e0f0'); A.e(23, 13.5, 5.2, 2.8, '#e8e0f0'); A.e(9, 13, 4.4, 2, '#ffffff'); A.e(23, 13, 4.4, 2, '#ffffff');
    A.r(2, 17, 28, 14, '#f49ab8'); A.r(2, 17, 28, 2, '#f7b8cf'); for (let y = 21; y < 30; y += 4) for (let x = 5 + (y % 8 ? 0 : 3); x < 29; x += 6) { A.p(x, y, '#ffd0de'); A.p(x + 1, y, '#ffd0de'); A.p(x, y + 1, '#ffd0de'); } A.r(2, 30, 28, 2, '#d9607d'); A.r(1, 31, 3, 3, C.woodD); A.r(28, 31, 3, 3, C.woodD); }],
  longTable: [32, 22, A => { A.r(1, 4, 30, 10, C.woodL); A.r(1, 4, 30, 1, '#e8b97a'); A.r(1, 12, 30, 3, C.wood); A.r(5, 6, 22, 5, '#9be37a'); A.r(5, 6, 22, 1, '#c8f58a'); A.r(3, 15, 3, 6, C.woodD); A.r(26, 15, 3, 6, C.woodD); A.e(11, 8, 2.6, 1.5, '#ffffff'); A.e(11, 8, 1.4, .8, '#ffb15c'); A.r(20, 4, 3, 4, '#d9774a'); A.e(21.5, 3, 2, 1.5, '#ff9ab0'); }],
  longTableV: [16, 38, A => { A.r(2, 4, 12, 26, C.woodL); A.r(2, 4, 12, 1, '#e8b97a'); A.r(2, 28, 12, 3, C.wood); A.r(5, 6, 6, 20, '#9be37a'); A.r(5, 6, 1, 20, '#c8f58a'); A.r(3, 31, 3, 6, C.woodD); A.r(10, 31, 3, 6, C.woodD); A.e(8, 12, 2.6, 1.6, '#ffffff'); A.e(8, 12, 1.4, .8, '#ffb15c'); A.r(7, 19, 3, 4, '#d9774a'); A.e(8.5, 18, 2, 1.5, '#ff9ab0'); }],
  sofa2: [32, 24, A => { A.r(1, 3, 30, 10, '#5fbf93'); A.r(1, 3, 30, 2, '#7fe0b5'); A.r(1, 12, 30, 8, '#4f9f7a'); A.r(3, 12, 12, 6, '#7fe0b5'); A.r(17, 12, 12, 6, '#7fe0b5'); A.r(3, 12, 12, 1, '#a8f0cf'); A.r(17, 12, 12, 1, '#a8f0cf'); A.r(0, 8, 4, 13, '#3f8a68'); A.r(28, 8, 4, 13, '#3f8a68'); A.r(0, 8, 4, 1, '#5fbf93'); A.r(28, 8, 4, 1, '#5fbf93'); A.r(2, 21, 2, 3, C.woodD); A.r(28, 21, 2, 3, C.woodD); A.e(9, 7, 3, 2.4, '#ffd36b'); A.p(8, 6, '#fff1b0'); }],
  sofa2V: [16, 40, A => { A.r(9, 3, 6, 32, '#5fbf93'); A.r(9, 3, 1, 32, '#7fe0b5'); A.r(2, 9, 8, 26, '#4f9f7a'); A.r(3, 10, 6, 11, '#7fe0b5'); A.r(3, 23, 6, 11, '#7fe0b5'); A.r(3, 10, 6, 1, '#a8f0cf'); A.r(3, 23, 6, 1, '#a8f0cf'); A.r(1, 5, 14, 5, '#3f8a68'); A.r(1, 34, 14, 4, '#3f8a68'); A.r(1, 5, 14, 1, '#5fbf93'); A.r(2, 38, 2, 2, C.woodD); A.r(12, 38, 2, 2, C.woodD); }],
  bookcase2: [32, 34, A => { A.r(1, 1, 30, 32, C.woodD); A.r(3, 3, 26, 28, '#3a2a26'); const R = rng(321), cs = ['#ff8fa3', '#7fb8ff', '#ffd25c', '#7fe0b5', '#c89aff', '#ff9b4a', '#f4f0f8']; for (const y of [3, 12, 21]) { let x = 4; while (x < 27) { const w = 2 + (R() * 2 | 0), h = 6 + (R() * 2 | 0); if (x + w > 28) break; A.r(x, y + 8 - h, w, h, cs[(R() * cs.length) | 0]); A.p(x, y + 8 - h, '#ffffff'); x += w + (R() < .2 ? 1 : 0); } A.r(3, y + 8, 26, 2, C.wood); } A.r(1, 1, 30, 1, C.woodL); }],
  kitchenSet: [48, 28, A => { A.r(0, 0, 48, 9, '#f4f0f8'); for (let x = 0; x < 48; x += 4) A.r(x, 0, 1, 9, '#d9d0e2'); A.r(0, 4, 48, 1, '#d9d0e2'); A.r(0, 10, 48, 17, '#e8e2d8'); A.r(0, 8, 48, 4, '#bab5cb'); A.r(0, 8, 48, 1, '#d9d0e2');
    for (const x of [1, 17, 33]) { A.r(x, 14, 14, 11, '#d8cfc2'); A.r(x + 6, 18, 2, 2, C.woodD); } A.r(5, 8, 11, 4, '#8fd0f0'); A.r(5, 8, 11, 1, '#5b9bd0'); A.line(10, 7, 10, 3, '#a29db6'); A.line(10, 3, 13, 3, '#a29db6'); A.r(19, 8, 8, 3, C.woodL); A.r(21, 8, 3, 1, '#ff9b4a'); A.p(24, 8, C.leaf);
    A.r(30, 8, 14, 4, '#3a3340'); A.e(34, 10, 2.2, 1.1, '#ff8a3d'); A.e(40, 10, 2.2, 1.1, '#ff8a3d'); A.e(40, 7, 3, 1.6, '#8e89a3'); A.r(37, 5, 6, 2, '#a29db6'); A.r(0, 26, 48, 2, '#bab5cb'); }],
  fountainBig: [32, 34, A => { A.e(16, 25, 15.5, 8.5, '#6f6a86'); A.e(16, 24, 15, 8, '#8e89a3'); A.e(16, 24, 12, 6, '#3a78b0'); A.e(13, 22.5, 6, 2, '#5b9bd0'); A.p(9, 24, '#bfe6ff'); A.p(22, 26, '#bfe6ff'); A.r(14, 9, 4, 15, '#a29db6'); A.r(14, 9, 1, 15, '#bab5cb'); A.e(16, 10, 7, 3, '#8e89a3'); A.e(16, 9.5, 5.5, 2, '#5b9bd0'); A.e(16, 5, 2, 3, '#bfe6ff'); A.p(16, 2, '#ffffff'); A.line(10, 11, 8, 20, '#bfe6ff'); A.line(22, 11, 24, 20, '#bfe6ff'); }],
  rugBig: [32, 32, A => { A.r(2, 1, 28, 30, '#d9607d'); A.r(1, 2, 30, 28, '#d9607d'); A.r(4, 4, 24, 24, '#f49ab8'); for (let k = 3; k < 29; k += 3) { A.p(k, 2, '#ffd0de'); A.p(k, 29, '#ffd0de'); A.p(2, k, '#ffd0de'); A.p(29, k, '#ffd0de'); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; A.e(16 + Math.cos(a) * 5, 16 + Math.sin(a) * 5, 2.6, 2.6, '#ffffff'); } A.e(16, 16, 3.4, 3.4, '#ffd25c'); A.p(15, 15, '#fff1b0'); for (const [x, y] of [[7, 7], [25, 7], [7, 25], [25, 25]]) { A.e(x, y, 1.6, 1.6, '#ffd25c'); A.p(x - 2, y, C.leaf); A.p(x + 2, y, C.leaf); } }],
  rugLong: [48, 32, A => { A.r(2, 2, 44, 28, '#6fa8ff'); for (let y = 4; y < 28; y += 6) { A.r(2, y, 44, 2, '#c2dcff'); A.r(2, y + 2, 44, 1, '#4a78d0'); } A.r(2, 2, 44, 1, '#4a78d0'); A.r(2, 29, 44, 1, '#4a78d0'); for (let y = 3; y < 30; y += 2) { A.p(0, y, '#f4f0f8'); A.p(1, y, '#e3d4ff'); A.p(46, y, '#e3d4ff'); A.p(47, y, '#f4f0f8'); } }],
  rugRound: [48, 48, A => { for (const [r, c] of [[23, '#b8742a'], [20, '#e8a33a'], [16.5, '#d9774a'], [13, '#f2b83a'], [9.5, '#e8915f'], [6, '#ffd98a'], [2.5, '#e8a33a']]) A.e(24, 24, r, r, c); for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; A.p(24 + Math.cos(a) * 18.3 | 0, 24 + Math.sin(a) * 18.3 | 0, '#fff1d6'); } }],
  bigTree: [32, 52, A => { A.poly([[6, 51], [12, 40], [20, 40], [26, 51]], C.woodD); A.r(11, 26, 10, 22, C.wood); A.r(11, 26, 3, 22, C.woodL); A.line(16, 30, 16, 46, C.woodD); A.line(19, 34, 19, 44, C.woodD); A.e(16, 48, 9, 2.6, '#4a3428');
    A.e(16, 18, 15.5, 14, '#2f6e33'); A.e(15, 16, 14, 12, C.leafD); A.e(10, 13, 8, 7, C.leaf); A.e(21, 12, 8, 7, C.leaf); A.e(15, 7, 8, 5.5, C.leaf); A.e(9, 10, 3, 2, C.leafL); A.e(19, 6, 3, 1.8, C.leafL); A.e(24, 15, 2.4, 1.6, C.leafL); for (const [x, y] of [[6, 18], [25, 21], [14, 23], [20, 9]]) A.p(x, y, '#ffd36b'); }],
  bigRock: [32, 22, A => { A.e(16, 15, 15.5, 7, '#57507a'); A.e(15, 13, 14, 8, '#8e89a3'); A.e(19, 15, 8, 4, '#7f7a92'); A.e(11, 9, 6, 3, '#a29db6'); A.p(9, 8, '#bab5cb'); A.e(22, 7.5, 5.5, 2.2, '#62ad62'); A.e(21, 7, 3, 1.2, '#7cc271'); A.e(7, 16, 3, 1.4, '#62ad62'); A.p(25, 12, '#6f6a86'); A.p(13, 17, '#6f6a86'); }],
  flowerField: [48, 32, A => { A.r(1, 1, 46, 30, '#4f8f57'); A.r(0, 3, 48, 26, '#4f8f57'); for (let k = 0; k < 40; k++) { const R = rng(900 + k); A.p(R() * 46 | 0, R() * 30 | 0, '#62ad62'); } flowerDots(A, 48, 32, 77); }],
  pondBig: [32, 32, A => { A.e(16, 16, 15.5, 14.5, '#6f6a86'); A.e(16, 16, 14.5, 13.5, '#8e89a3'); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; A.e(16 + Math.cos(a) * 13.5, 16 + Math.sin(a) * 12.5, 2.2, 1.8, k % 2 ? '#a29db6' : '#8e89a3'); } A.e(16, 16, 11.5, 10.5, '#3a78b0'); A.r(9, 12, 6, 1, '#5b9bd0'); A.r(17, 20, 7, 1, '#5b9bd0'); A.e(11, 19, 3.4, 2.2, '#4f9a5e'); A.e(21, 12, 3, 2, '#4f9a5e'); A.e(21, 11, 1.4, 1.1, '#ffb3c6'); A.p(21, 10, '#ffe0ea'); A.p(14, 14, '#bfe6ff'); }],
  treeFarm: farmSpr(0), treeFarm1: farmSpr(1), treeFarm2: farmSpr(2), treeFarm3: farmSpr(3),
  quarry: quarrySpr(0), quarry1: quarrySpr(1), quarry2: quarrySpr(2), quarry3: quarrySpr(3),
  ...Object.fromEntries([['pitCu', C.copper, C.copperL], ['pitFe', C.iron, '#ffffff'], ['pitGold', '#ffd25c', '#fff1b0']].flatMap(([k, c1, c2]) => [0, 1, 2, 3].map(st => [k + (st || ''), quarrySpr(st, c1, c2)]))),
  chairS: [16, 16, A => { A.r(4, 2, 2, 10, C.wood); A.r(4, 2, 2, 1, C.woodL); A.r(4, 9, 9, 3, C.woodL); A.r(6, 9, 7, 2, '#f2a1b6'); A.p(7, 9, '#ffd1dd'); A.r(4, 11, 9, 1, C.woodD); A.r(4, 12, 1, 3, C.woodD); A.r(12, 12, 1, 3, C.woodD); }],
  chairU: [16, 16, A => { A.r(4, 12, 1, 3, C.woodD); A.r(11, 12, 1, 3, C.woodD); A.r(3, 9, 10, 3, C.woodL); A.r(4, 2, 8, 9, C.wood); A.r(4, 2, 8, 2, C.woodL); A.r(6, 4, 1, 6, C.woodD); A.r(9, 4, 1, 6, C.woodD); A.r(3, 11, 10, 1, C.woodD); }],
  cryChairS: [16, 16, A => { A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); A.poly([[3, 10], [4, 2], [7, 1], [7, 10]], C.cry); A.poly([[3, 10], [4, 2], [5, 2], [5, 10]], C.cryL); A.r(4, 9, 9, 3, C.iron); A.r(4, 9, 9, 1, C.ironL); A.r(6, 10, 6, 1, '#d9c8ff'); }],
  cryChairU: [16, 16, A => { A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); A.r(3, 9, 10, 3, C.iron); A.poly([[4, 12], [5, 3], [8, 1], [11, 3], [12, 12]], C.cryD); A.poly([[5, 11], [6, 4], [8, 2.5], [10, 4], [11, 11]], C.cry); A.p(8, 5, C.cryL); }],
  mossSofaS: [16, 16, A => { A.r(2, 8, 12, 6, C.woodD); A.r(2, 2, 4, 11, '#6fae5f'); A.r(2, 2, 4, 1, '#8fd07a'); A.r(5, 8, 9, 4, '#7dbd6b'); A.r(5, 8, 9, 1, '#a5dc8a'); A.r(2, 13, 1, 2, C.woodD); A.r(13, 13, 1, 2, C.woodD); A.p(3, 4, '#ffd36b'); }],
  mossSofaU: [16, 16, A => { A.r(1, 5, 14, 9, C.woodD); A.r(2, 9, 12, 3, '#7dbd6b'); A.r(1, 3, 14, 9, '#5e9a50'); A.r(1, 3, 14, 1, '#8fd07a'); A.r(4, 5, 8, 5, '#6fae5f'); A.r(1, 7, 2, 6, '#4e8a42'); A.r(13, 7, 2, 6, '#4e8a42'); A.r(2, 13, 1, 2, C.woodD); A.r(13, 13, 1, 2, C.woodD); }],
});
QSIDE.push({ id: 's_farm', t: () => `나무 작업장으로 나무 30개 얻기 (${Math.min(30, G.stats.farmed || 0)}/30)`, h: '작업대에서 나무 작업장을 만들어 놓고, 다 자라면 베어요. 건전지와 전선으로 전기를 이으면 저절로 베어 옆 상자에 담아요.', done: () => (G.stats.farmed || 0) >= 30, rw: [['rope', 4], ['battery', 1]], xp: 50 });
const qText = q => typeof q.t === 'function' ? q.t() : q.t;
const epicOwned = () => { const got = new Set(); for (const s2 of G.inv) if (s2 && rarOf(s2.id) >= 3 && (ITEMS[s2.id].kind === 'sword' || ITEMS[s2.id].kind === 'pick')) got.add(s2.id); for (const id in (G.stats.epicSeen || {})) got.add(id); return got.size; };
function questState(q, k) { const side = k == null; const done = side ? q.done() : k < G.guide; const cur = !side && k === G.guide; return { done, cur, claimed: !!(G.qclaim || {})[q.id], has: (q.rw && q.rw.length) || q.xp }; }
const canClaim = () => GUIDE.some((q, k) => { const st = questState(q, k); return st.done && !st.claimed && st.has; }) || QSIDE.some(q => { const st = questState(q); return st.done && !st.claimed && st.has; });
function claimQuest(id) {
  const q = GUIDE.find(x => x.id === id) || QSIDE.find(x => x.id === id); if (!q) return; const k = GUIDE.indexOf(q), st = questState(q, k < 0 ? null : k); if (!st.done || st.claimed) return;
  G.qclaim = G.qclaim || {}; G.qclaim[id] = 1; for (const [it, c] of q.rw) { const l = addItem(it, c, false); if (l) spawnDrop(it, l, G.p.x, G.p.y); } if (q.xp) gainXp(q.xp, G.p.x, G.p.y);
  SFX.craft(); puff(G.p.x, G.p.y - .5, '#ffe9a8', 16, 2.6, .6);
}
let goalTarget = null, lastGoalTxt = '';
function checkGuide() {
  let n = 0; while (G.guide < GUIDE.length - 1 && GUIDE[G.guide].done() && n < 20) { if (started && !G.qt[GUIDE[G.guide].id]) G.qt[GUIDE[G.guide].id] = Math.max(1, Math.round(G.playT || 0)); G.guide++; n++; }
  if (n === 1 && started) { toast('목표 달성!', 'good'); SFX.craft(); }
  const g = GUIDE[G.guide]; const txt = g.t(); if (txt !== lastGoalTxt) { $('#goalTxt').textContent = txt; lastGoalTxt = txt; }
  goalTarget = g.target ? g.target() : null;
  checkUnlocks();
}
function checkBiome() {
  const p = G.p; if (!G.stats.waterTip && started) { outer: for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const x = Math.floor(p.x) + dx, y = Math.floor(p.y) + dy; if (inB(x, y) && G.floor[idx(x, y)] === WATER && !G.wall[idx(x, y)]) { G.stats.waterTip = 1; toast(hasItem('rod') ? '물가예요! 물을 바라보고 눌러 낚시해요' : '물가예요! 낚싯대를 만들면 낚시할 수 있어요 (장비제작대 → 도구)', 'good'); break outer; } } }
  checkBiome0();
}
function checkBiome0() { const p = G.p, b = G.biome[idx(Math.floor(p.x), Math.floor(p.y))]; if (b !== G.biomeNow) { G.biomeNow = b; if (b >= 3) G.stats['seen' + b] = 1; if (started) { toast(BIOME[b] || '', null, 'biome' + b); suggestWear(b); } } }

