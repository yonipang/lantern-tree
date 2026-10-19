// ================= 퀘스트·여러 칸 가구 데이터 (구조 변경 2단계: game/quests.js에서 데이터만 옮김) =================
// 길잡이 퀘스트(GUIDE)와 보상(Q_META), 곁가지 퀘스트(QSIDE), 여러 칸 가구(MULTI) — 문구·보상·크기는 여기서 고쳐요.
// QSIDE에 넣는 순서 = 퀘스트 목록 순서. 이 파일은 shell.html에서 game/quests.js 바로 앞에 와요 (예전과 같은 실행 순서).
import { FLOWERS, BOSSES } from './rpg-nature.js';
import { ITEMS, OBJ, RECIPES, Rc, USE } from './items.js';
import { G, beat, guardOf } from '../save/state.js';
import { CX, CY, SA, SB, SI, SL, idx } from '../world/map.js';
import { countItem } from '../sim/inventory.js';
import { epicOwned, hasItem, nearestObjOf } from '../sim/quests.js';

// ---- 보스 다시 부르는 조각상 (구조 변경 3단계: game/combat.js에서 옮김 — 레시피 순서 그대로) ----
export const SUMMON = {
  queenIdol: ['포자 여왕 부름 버섯', 'queen', [['shroomCap', 10], ['glowcap', 6], ['spore', 4]], '#b673de', '#fbe7ff'],
  slimeIdol: ['말랑 왕관 조각상', 'slime', [['gel', 30], ['copperBar', 6]], '#86d96b', '#ffd25c'],
  golemIdol: ['수정 심장 조각상', 'golem', [['crystal', 20], ['ironBar', 6]], '#9d7fe0', '#7ff0e6'],
  turtleIdol: ['용암 등껍질 조각상', 'turtle', [['obsidian', 8], ['goldBar', 4], ['fireBerry', 4]], '#ff8a3d', '#ffc861'],
  spiritIdol: ['서리 결정 조각상', 'spirit', [['frostShard', 16], ['goldBar', 4]], '#9fd8f0', '#ffffff'],
};
for (const id in SUMMON) { const [n, k, req] = SUMMON[id];
  ITEMS[id] = { n, kind: 'summon', boss: k, d: `${BOSSES[k].n}을 물리친 뒤 보스방에서 쓰면 ${BOSSES[k].n}이 다시 나타나요. 다시 잡으면 재료와 함께 가끔 전용 장비가 떨어져요.` };
  RECIPES.push(Rc(id, 1, req, 'forge', 'tool')); }

export const GUIDE = [
  { t: () => `뿌리기둥을 베어 나무 모으기 (${Math.min(6, G.stats.wood)}/6)`, h: '등불나무 아래에서 기억 없이 깨어났어요. 초록 이끼가 덮인 기둥 앞에서 손 버튼(PC는 E)을 눌러 나무를 모아요.', done: () => G.stats.wood >= 6, target: () => nearestObjOf('root', 14) },
  { t: () => '제작에서 작업대 만들고 설치하기', h: '등불지기들이 살던 마을 터예요. 오른쪽 위 [가방] → [제작] 탭 → 작업대. 만든 뒤 단축칸에서 고르고 빈 땅을 바라보며 눌러요.', done: () => G.stats.bench },
  { t: () => '횃불을 만들어 어두운 곳에 놓기', h: '그림자는 빛이 꺼진 어둠에서 생겨요. 횃불은 어디서나 만들 수 있고, 밝은 곳에는 그림자가 들어오지 못해요.', done: () => G.stats.torch > 0 },
  { t: () => `흙벽에서 구리광석 캐기 (${Math.min(6, G.stats.copperOre)}/6)`, h: '주황색 돌이 박힌 벽을 찾아 캐요. 흙은 용광로 재료가 돼요.', done: () => G.stats.copperOre >= 6 },
  { t: () => '용광로를 놓고 구리괴 만들기', h: '작업대에서 용광로를 만든 뒤 설치하고, 용광로를 열어 구리괴를 만들어요.', done: () => G.stats.copperBar >= 1 },
  { t: () => '작업대를 구리 작업대로 올리기', h: '작업대를 열면 맨 위에 [올리기]가 있어요 (구리괴 8·흙 20). 구리 가구·요리솥은 구리 작업대부터 만들어요. 무기·도구는 장비제작대를 같은 방법으로 올려서 만들어요.', done: () => G.stats.forge || hasItem('forge') || hasItem('pickCopper') || hasItem('pickIron') },
  { t: () => '구리 곡괭이 만들기', h: '장비제작대(작업대에서 나무·돌로 만들어요)를 놓고 구리 단계로 올린 뒤 만들어요. 이끼 끈은 [제작 → 재료]에서 이끼 섬유로 꼬아요. 구리 곡괭이가 있으면 돌벽과 철 광맥도 캘 수 있어요.', done: () => hasItem('pickCopper') || hasItem('pickIron') },
  { t: () => '서쪽 버섯숲의 버섯 여왕 물리치기', h: '마을 창고를 지키던 동물이 주인을 잃고 커진 거예요. 화살표를 따라 서쪽으로! 여왕은 포자를 둥글게 흩뿌려요. 포자 사이 빈틈으로 피하고, 따라오는 버섯도깨비를 먼저 정리해요.', done: () => beat('queen'), target: () => BOSSES.queen.home() },
  { t: () => '동쪽 동굴의 말랑대왕 물리치기', h: '말랑대왕도 창고를 지키던 녀석이에요. 화살표를 따라 동쪽으로! 대왕은 여왕보다 훨씬 튼튼해요. 음식을 넉넉히 챙기고, 점프 후 착지할 때 멀리 떨어져요.', done: () => beat('slime'), target: () => BOSSES.slime.home() },
  { t: () => '북쪽 수정동굴의 수정골렘 물리치기', h: '수정 동굴은 등불지기들이 빛을 수정에 담아 두던 보관소예요. 빨간 점선이 보이면 옆으로 피해요! 벽에 부딪혀 기절했을 때 때리면 더 아파요. 화강암 벽과 석영 광맥은 철 곡괭이로 캘 수 있어요.', done: () => beat('golem'), target: () => BOSSES.golem.home() },
  { t: () => `빛씨앗 모으기 (${Math.min(3, G.stats.seedsFound)}/3)`, h: '빛씨앗은 등불지기들이 맡겨 둔 나무의 빛이에요. 봉인이 풀린 두 제단의 씨앗과, 말랑대왕이 남긴 씨앗을 모아요.', done: () => G.stats.seedsFound >= 3,
    target: () => { const p = G.p; const c = [SA, SB].filter(s => G.objs.get(idx(s.x, s.y))?.has && G.bossDead[guardOf(s.x, s.y)]).map(s => ({ x: s.x + .5, y: s.y + .5 })); c.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); return c[0] || null; } },
  { t: () => `등불나무에 빛씨앗 심기 (${G.treeSeeds}/3)`, h: '빛씨앗을 들고 등불나무 앞에서 눌러요. 나무가 한 단계 깨어날 때마다 옛 기억 한 장면을 보여 줘요.', done: () => G.treeSeeds >= 3, target: () => ({ x: CX + .5, y: CY + .5 }) },
  { t: () => '수정 핵으로 수정 곡괭이 만들기', h: '수정골렘이 남긴 수정 핵으로 석영 장비제작대(장비제작대를 석영 단계까지 올려요)에서 만들어요. 남쪽 용암 동굴과 서쪽 얼음 동굴은 아주 단단한 벽에 막혀 있어서 수정 곡괭이가 있어야 들어갈 수 있어요.', done: () => ['pickCrystal', 'pickGold', 'pickStar'].some(hasItem) || beat('turtle') || beat('spirit') },
  { t: () => '남쪽 용암 동굴의 용암 거북 물리치기', h: '용암 동굴은 등불지기들의 대장간이었어요. 거북은 화로를 지키던 수호자인데, 누구를 위해 지키는지 잊었어요. 등껍질에 숨어 굴러올 때는 거의 다치지 않아요. 벽에 튕기다 멈추면 그때 공격해요! 바닥이 주황색으로 반짝이면 곧 용암이 고여요.', done: () => beat('turtle'), target: () => BOSSES.turtle.home() },
  { t: () => '서쪽 얼음 동굴의 서리 정령 물리치기', h: '얼음 동굴에는 등불지기들이 시간을 얼려 잠들어 있고, 정령이 그 잠을 지켜요. 얼음 고리는 빈틈 쪽으로 빠져나가요. 정령이 사라지면 곁에 다시 나타나 얼음을 터뜨려요. 점선 원 밖으로 피해요!', done: () => beat('spirit'), target: () => BOSSES.spirit.home() },
  { t: () => `깊은 동굴의 빛씨앗 모으기 (${Math.max(0, Math.min(2, G.stats.seedsFound - 3))}/2)`, h: '용암 거북과 서리 정령이 쓰러지면 빛씨앗을 떨어뜨려요. 예전 세이브라면 보스방 가운데 제단에 놓여 있을 수도 있어요.', done: () => G.stats.seedsFound >= 5 || G.treeSeeds >= 5,
    target: () => { const p = G.p; const c = [SL, SI].filter(s => G.objs.get(idx(s.x, s.y))?.has && G.bossDead[guardOf(s.x, s.y)]).map(s => ({ x: s.x + .5, y: s.y + .5 })); c.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y)); return c[0] || null; } },
  { t: () => `등불나무의 마지막 등불 밝히기 (${G.treeSeeds}/5)`, h: '빛씨앗을 들고 등불나무 앞에서 눌러요. 다섯 등불이 모두 밝아지면 나무가 마지막 기억을 보여 줘요.', done: () => G.treeSeeds >= 5, target: () => ({ x: CX + .5, y: CY + .5 }) },
  { t: () => '등불나무 곁에서 살아가기', h: '큰 어둠은 흩어지고 등불지기들이 깨어났어요. 이제 물가에서 낚시를 하고, 이끼·버섯·수정 세트 가구로 나만의 마을을 꾸며 보세요. 보스 재도전과 남은 도전 퀘스트도 기다려요.', done: () => false },
];
// quest ids, rewards and xp (main story, in order)
export const Q_META = [['wood', [['fiber', 5], ['berry', 3]], 10], ['bench', [['torch', 4]], 10], ['torch', [['berrySeed', 3], ['rope', 2]], 10], ['ore', [['copperOre', 3], ['resin', 1]], 15], ['bar', [['resin', 2], ['gel', 2]], 15],
  ['forge', [['rope', 4]], 20], ['pick', [['grilled', 3], ['torch', 6]], 25], ['queen', [['copperBar', 5], ['glowcap', 3]], 80], ['slime', [['ironBar', 4], ['gel', 6]], 100], ['golem', [['crystal', 8], ['ironBar', 4]], 140],
  ['seeds', [['stew', 3]], 40], ['tree', [['crystal', 10], ['stew', 2]], 100], ['cpick', [['torch', 10], ['stew', 3]], 60], ['turtle', [['goldBar', 4], ['frostShard', 3]], 200], ['spirit', [['frostShard', 6], ['goldBar', 2]], 220], ['seeds2', [['fireBerry', 4]], 60], ['tree2', [['crystal', 12], ['goldBar', 4]], 200], ['free', [], 0]];
GUIDE.forEach((g, k) => { const m = Q_META[k]; g.id = m[0]; g.rw = m[1]; g.xp = m[2]; });
// side quests: any time, in any order
export const QSIDE = [
  { id: 's_moss', t: '이끼 섬유로 이끼 흙 만들기', h: '[제작 → 재료]에서 이끼 섬유 1개로 만들어요.', done: () => (G.stats.made || {}).gMoss > 0, rw: [['fiber', 6]], xp: 10 },
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
export const MULTI = {
  bedDouble: ['포근한 2인 침대', '둘이 누워도 넉넉한 커다란 침대 (2×2).', [['wood', 14], ['fiber', 10], ['rope', 3]], 'bench', 'furn', [2, 2], { solid: 1, bed: 1 }, 'sleep'],
  longTable: ['긴 식탁', '여럿이 둘러앉는 긴 식탁 (2×1). 가로·세로로 돌릴 수 있어요.', [['wood', 10], ['resin', 1]], 'bench', 'furn', [2, 1], { solid: 1, rotV: 1 }],
  sofa2: ['2인 소파', '폭신한 민트색 소파 (2×1). 가로·세로로 돌릴 수 있어요.', [['wood', 8], ['fiber', 10], ['rope', 2]], 'bench', 'furn', [2, 1], { solid: 1, rotV: 1 }, 'sit'],
  bookcase2: ['큰 책장', '책이 빼곡한 큰 책장 (2×1).', [['wood', 14], ['resin', 2]], 'bench', 'furn', [2, 1], { solid: 1 }, 'read'],
  kitchenSet: ['부엌 조리대', '싱크대와 화구가 붙은 조리대 (3×1).', [['copperBar', 4], ['stone', 8], ['wood', 6]], 'forge', 'furn', [3, 1], { solid: 1 }],
  fountainBig: ['큰 분수', '물소리가 졸졸 흐르는 큰 분수 (2×2).', [['stone', 20], ['gWater', 2], ['crystal', 2]], 'forge', 'furn', [2, 2], { solid: 1, light: [3.5, '#9fd8f0'] }, 'wish'],
  rugBig: ['큰 꽃 러그', '가운데 노란 꽃이 핀 러그 (2×2). 위로 걸어 다닐 수 있어요.', [['fiber', 12], ['petalR', 2]], 'bench', 'furn', [2, 2], { flat: 1 }],
  rugLong: ['긴 줄무늬 러그', '복도에 깔기 좋은 긴 러그 (3×2). 가로·세로로 돌릴 수 있어요.', [['fiber', 14], ['rope', 2]], 'bench', 'furn', [3, 2], { flat: 1, rotV: 1 }],
  rugRound: ['둥근 엮음 러그', '알록달록 엮은 큰 원형 러그 (3×3).', [['fiber', 18], ['petalY', 2], ['petalB', 2]], 'bench', 'furn', [3, 3], { flat: 1 }],
  bigTree: ['큰 고목', '굵은 줄기의 커다란 나무 (2×2). 베면 없어지고 뿌리기둥 묘목 1개를 줘요.', [['dirt', 8], ['gMoss', 8], ['wood', 16], ['sapling', 2]], 'bench', 'nature', [2, 2], { solid: 1, ntree: 1, nat: 'cut', hp: 10, drops: [['wood', 6, 9, 1], ['resin', 1, 2, 0.6]] }],
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
QSIDE.push({ id: 's_farm', t: () => `나무 작업장으로 나무 30개 얻기 (${Math.min(30, G.stats.farmed || 0)}/30)`, h: '작업대에서 나무 작업장을 만들어 놓고, 다 자라면 베어요. 건전지와 전선으로 전기를 이으면 저절로 베어 옆 상자에 담아요.', done: () => (G.stats.farmed || 0) >= 30, rw: [['rope', 4], ['battery', 1]], xp: 50 });
// ---- v84 퀘스트 화면: 진행 숫자(진행 막대)와 「가장 가까운 할 곳」 종류 (글·조건·보상은 위 그대로, 칸만 더해요) ----
// Q_PROG[id]() = [지금, 목표] · Q_GO[id] = 화살표가 가리킬 곳의 종류 (없으면 화살표 없음):
//   ['obj', 물체…] 그 물체 · ['wall', 벽 번호] 그 광맥 · ['stn', 제작대] 그 물건을 만드는 제작대 · ['boss', 보스] 보스방 · ['tgt'] 이야기에 원래 있던 목표
//   ['water'] 물가 · ['enemy'] 몬스터 · ['zone'] 꽃망울 구역 · ['biome', 지역…] 그 지역 · ['room'] 찾았지만 안 연 숨은 방 · ['wild'] 데려올 수 있는 동물
const qn = v => v || 0;
export const Q_PROG = {
  wood: () => [qn(G.stats.wood), 6], ore: () => [qn(G.stats.copperOre), 6], seeds: () => [qn(G.stats.seedsFound), 3], tree: () => [qn(G.treeSeeds), 3],
  seeds2: () => [Math.max(0, qn(G.stats.seedsFound) - 3), 2], tree2: () => [qn(G.treeSeeds), 5],
  s_lv5: () => [G.rpg.lv, 5], s_fish: () => [qn(G.stats.fishCaught), 10], s_kill: () => [qn(G.stats.kills), 50], s_petal: () => [Object.keys(FLOWERS).filter(c => countItem('petal' + c) > 0 || (G.stats.petals || {})[c]).length, 5],
  s_drill: () => [qn(G.stats.drilled), 20], s_gold: () => [qn((G.stats.made || {}).goldBar), 10], s_epic: () => [epicOwned(), 3], s_farm: () => [qn(G.stats.farmed), 30],
  s_crop2: () => [qn(G.stats.wetH), 5], s_crop3: () => [qn(G.stats.fert), 10], s_crop4: () => [qn(G.stats.starH), 5], s_rooms: () => [qn(G.stats.chests), 3], s_ranch: () => [Object.keys(G.stats.ranchK || {}).length, 3], s_auto: () => [qn(G.stats.autoH), 20],
};
export const Q_GO = {
  wood: ['obj', 'root'], ore: ['wall', 4], bar: ['stn', 'furnace'], forge: ['stn', 'bench'], pick: ['stn', 'smelter'], cpick: ['stn', 'smelter'],
  queen: ['boss', 'queen'], slime: ['boss', 'slime'], golem: ['boss', 'golem'], turtle: ['boss', 'turtle'], spirit: ['boss', 'spirit'], seeds: ['tgt'], tree: ['tgt'], seeds2: ['tgt'], tree2: ['tgt'],
  s_fish: ['water'], s_bag: ['stn', 'bench'], s_kill: ['enemy'], s_petal: ['zone'], s_drill: ['obj', 'pitCu', 'pitFe', 'pitGold', 'quarry'], s_deep: ['biome', 3, 4], s_gold: ['stn', 'furnace'],
  s_legend: ['stn', 'smelter'], s_farm: ['obj', 'treeFarm'], s_rooms: ['room'], s_pet: ['wild'], s_ranch: ['wild'],
};
