// ================= v132 얼음 동굴 새 단장 (dev/design/그림에셋.md 「v132」 · 기획-결정사항.md 2026-10-23) =================
// 사용자 선택(2026-10-23): 얼음 동굴 바닥 = 받은 얼음 타일 · 벽 = 받은 그림 절벽색에 푸른 기 · 동굴 안 빛을 살짝 푸르게(B) · 눈 조금
// · 「눈 무더기」 칸(35)을 새로 만들고, 바꾼 그림(겨울 자연물·얼음 결정 A~C)은 눈 무더기 위에만 나와요 · 좁은 곳에는 작은 것만
// · 나무·돌·풀·결정만 자연물로 나오고 나머지(눈사람·크리스마스 트리·눈 버섯·눈 덮인 유적·토템)는 꾸미기로만
// · 얼음 결정 A~C는 모두 캘 수 있고(서리 결정) 은은하게 빛나요 — A가 지금 「얼음 결정」 그림을 바꿔요
// · 용암 동굴 해골·뼈(받침을 재 바닥색으로 바꾼 그림)는 용암 동굴 재 바닥에 드문드문 나와요.
// 그림은 받은 에셋(Craftpix 겨울·유적 팩)에서 잘라 반투명 그림자만 지웠어요(dev/art/obj/<id>.raw.png, 눈 무더기 dev/art/floor/35, 얼음 바닥 dev/art/tiles/iceFloor).
// 놓는 일: 새 세계 world/gen.js addSnow132·placeSnow132 · 옛 세계 save/migrations.js snow132(불러올 때 한 번) · 하루 하나 sim/nature.js(pickNat).
// 이 파일은 data/nature123.js 다음에 와요.
import { ITEMS, OBJ, RECIPES, Rc } from './items.js';
import { DIG_YIELD } from './rpg-nature.js';
import { NAT_DAY_FLOORS, NAT_DAY_KINDS } from './digging.js';
import { recipeTier } from './automation-tiers.js';

export const SNOW_F = 35; // 눈 무더기 바닥 (자연 바닥 — 파면 눈)
DIG_YIELD[SNOW_F] = 'gSnow'; NAT_DAY_FLOORS.add(SNOW_F);

// 종류: 크기 S(작음·좁은 곳도) · M · L(넓은 곳에만) — 그림 폭으로 나눴어요 (S ≤ 32px · M ≤ 56px · L 그 위)
const K = {
  tree: { solid: 1, ntree: 1, nat: 'chop', hp: 5, drops: [['wood', 3, 5, 1], ['resin', 1, 1, 0.3]] },
  treeS: { solid: 1, ntree: 1, nat: 'chop', hp: 3, drops: [['wood', 1, 3, 1]] },
  iceTree: { solid: 1, nat: 'chop', hp: 5, drops: [['iceBlock', 2, 4, 1], ['frostShard', 1, 1, 0.3]] },
  rock: { solid: 1, nat: 'mine', hp: 4, tier: 1, drops: [['stone', 2, 4, 1], ['gSnow', 1, 1, 0.5]] },
  rockS: { solid: 1, nat: 'mine', hp: 2, tier: 1, drops: [['stone', 1, 2, 1], ['gSnow', 1, 1, 0.3]] },
  flower: { solid: 1, nat: 'cut', hp: 1, light: [1.2, '#bfefff'], drops: [['fiber', 1, 1, 1], ['frostShard', 1, 1, 0.15]] },
  weed: { solid: 1, nat: 'cut', hp: 1, drops: [['fiber', 1, 2, 1]] },
  bone: { solid: 1, nat: 'mine', hp: 2, tier: 0, drops: [['gAsh', 1, 2, 1], ['stone', 1, 1, 0.4]] },
};
// 얼음 결정 A~C: 지금 「얼음 결정」과 같은 아이템(서리 결정)을 줘요. 큰 것일수록 조금 더(Claude 임시) · 은은한 빛
OBJ.iceCluster.light = [1.7, '#9fe8ff']; // 은은하게 (예전 3)
OBJ.iceClusterB = { n: '얼음 결정', solid: 1, hp: 5, tier: 2, nat: 'mine', light: [2, '#9fe8ff'], drops: [['frostShard', 1, 3, 1]] };
OBJ.iceClusterC = { n: '얼음 가시 결정', solid: 1, hp: 6, tier: 2, nat: 'mine', light: [2.4, '#a8eeff'], drops: [['frostShard', 2, 3, 1]] };
export const CRYSTAL132 = { iceCluster: 'T', iceClusterB: 'T', iceClusterC: 'M' }; // T = 그 칸만 비면 돼요(예전 얼음 결정처럼)

// 자연물: id: [이름, 설명, 종류, 크기, 레시피(작업대 · 자연)]
export const NAT132 = {
  iceTreeL: ['큰 얼음 나무', '가지까지 얼어붙은 커다란 얼음 나무.', 'iceTree', 'L', [['iceBlock', 8], ['gSnow', 4]]],
  iceTree: ['얼음 나무', '가지까지 얼어붙은 얼음 나무.', 'iceTree', 'L', [['iceBlock', 6], ['gSnow', 3]]],
  snowPineL: ['큰 눈 전나무', '눈이 소복이 쌓인 커다란 전나무.', 'tree', 'L', [['dirt', 4], ['gSnow', 4], ['wood', 6]]],
  snowPine: ['눈 전나무', '눈이 소복이 쌓인 전나무.', 'tree', 'L', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  snowPineS: ['작은 눈 전나무', '눈 쌓인 작은 전나무.', 'treeS', 'M', [['dirt', 2], ['gSnow', 2], ['wood', 2]]],
  snowRoundL: ['큰 눈꽃 둥근 나무', '하얀 눈이 덮인 둥근 나무.', 'tree', 'L', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  snowRound: ['눈꽃 둥근 나무', '하얀 눈이 덮인 둥근 나무.', 'tree', 'M', [['dirt', 3], ['gSnow', 3], ['wood', 3]]],
  snowRoundS: ['작은 눈꽃 덤불', '눈이 덮인 동그란 덤불.', 'treeS', 'S', [['dirt', 2], ['gSnow', 2]]],
  snowTwigL: ['큰 눈 가지 나무', '앙상한 가지마다 눈이 얹힌 나무.', 'tree', 'L', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  snowTwig: ['눈 가지 나무', '앙상한 가지마다 눈이 얹힌 나무.', 'tree', 'M', [['dirt', 3], ['gSnow', 3], ['wood', 3]]],
  snowTwigS: ['작은 눈 가지 나무', '눈이 얹힌 작은 가지 나무.', 'treeS', 'M', [['dirt', 2], ['gSnow', 2], ['wood', 2]]],
  frostTreeL: ['큰 서리 나무', '청록 잎에 서리가 내린 커다란 나무.', 'tree', 'L', [['dirt', 4], ['gSnow', 4], ['wood', 4]]],
  frostTree: ['서리 나무', '청록 잎에 서리가 내린 나무.', 'tree', 'L', [['dirt', 3], ['gSnow', 3], ['wood', 3]]],
  frostTreeS: ['작은 서리 나무', '서리 내린 작은 청록 나무.', 'treeS', 'M', [['dirt', 2], ['gSnow', 2], ['wood', 2]]],
  snowRockL: ['큰 눈 바위', '눈이 덮인 커다란 바위 무더기.', 'rock', 'L', [['stone', 8], ['gSnow', 3]]],
  snowRock: ['눈 바위', '눈이 덮인 바위.', 'rock', 'M', [['stone', 6], ['gSnow', 2]]],
  snowRockS: ['작은 눈 바위', '눈이 얹힌 작은 바위.', 'rockS', 'S', [['stone', 3], ['gSnow', 1]]],
  snowPebble: ['눈 돌멩이', '눈 속에 박힌 돌멩이.', 'rockS', 'S', [['stone', 2], ['gSnow', 1]]],
  iceFlowerL: ['큰 얼음꽃', '얼음처럼 투명한 꽃이 은은하게 빛나요.', 'flower', 'M', [['fiber', 2], ['frostShard', 1], ['gSnow', 1]]],
  iceFlower: ['얼음꽃', '얼음처럼 투명한 꽃이 은은하게 빛나요.', 'flower', 'S', [['fiber', 2], ['frostShard', 1]]],
  iceFlowerS: ['작은 얼음꽃', '은은하게 빛나는 작은 얼음꽃.', 'flower', 'S', [['fiber', 1], ['frostShard', 1]]],
  frostWeedL: ['큰 서리풀', '붉은 줄기에 얼음 잎이 돋은 풀.', 'weed', 'M', [['fiber', 3], ['gSnow', 1]]],
  frostWeed: ['서리풀', '붉은 줄기에 얼음 잎이 돋은 풀.', 'weed', 'M', [['fiber', 2], ['gSnow', 1]]],
  frostWeedS: ['작은 서리풀', '붉은 줄기의 작은 서리풀.', 'weed', 'S', [['fiber', 1], ['gSnow', 1]]],
};
// 용암 동굴 해골·뼈: 재 바닥(18)에 나와요
export const BONE132 = {
  ashSkullL: ['큰 해골', '재 속에 반쯤 묻힌 커다란 해골.', 'L', [['stone', 6], ['gAsh', 3]]],
  ashSkull: ['해골', '재 속에 묻힌 해골.', 'M', [['stone', 4], ['gAsh', 2]]],
  ashSkullS: ['작은 해골', '재 위에 굴러다니는 작은 해골.', 'S', [['stone', 2], ['gAsh', 1]]],
  ashSpine: ['등뼈', '재 위에 휘어진 커다란 등뼈.', 'M', [['stone', 4], ['gAsh', 2]]],
  ashRibs: ['갈비뼈', '재 위에 흩어진 갈비뼈.', 'M', [['stone', 3], ['gAsh', 2]]],
  ashJaw: ['짐승 해골', '뿔 달린 짐승의 해골.', 'M', [['stone', 3], ['gAsh', 2]]],
};
export const SIZE132 = {}; // id → S·M·L (자연물이 나오는 자리 고르기)
for (const id in CRYSTAL132) SIZE132[id] = CRYSTAL132[id];
for (const id in NAT132) { const [n, d, kind, sz, req] = NAT132[id]; SIZE132[id] = sz;
  ITEMS[id] = { n, kind: 'place', obj: id, d: d + (K[kind].ntree ? ' 베면 나무와 뿌리기둥 묘목을 줘요.' : '') };
  OBJ[id] = Object.assign({ n, item: id }, JSON.parse(JSON.stringify(K[kind])));
  const r = Rc(id, 1, req, 'bench', 'nature'); r.tier = recipeTier(r); RECIPES.push(r); }
for (const id in BONE132) { const [n, d, sz, req] = BONE132[id]; SIZE132[id] = sz;
  ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = Object.assign({ n, item: id }, JSON.parse(JSON.stringify(K.bone)));
  const r = Rc(id, 1, req, 'bench', 'nature'); r.tier = recipeTier(r); RECIPES.push(r); }

// 꾸미기로만 (자연에는 안 나와요): id: [이름, 설명, 재료, 분류, 칸, 가구 탭]
export const DECO132 = {
  snowman: ['눈사람', '목도리를 두르고 모자를 쓴 눈사람 (2×1).', [['gSnow', 8], ['wood', 2], ['fiber', 2]], 'furn', [2, 1], 'deco'],
  snowmanHat: ['모자 쓴 눈사람', '갈색 모자를 쓴 눈사람.', [['gSnow', 6], ['fiber', 2]], 'furn', null, 'deco'],
  snowmanKid: ['꼬마 눈사람', '빨간 모자를 쓴 꼬마 눈사람.', [['gSnow', 5], ['petalR', 1]], 'furn', null, 'deco'],
  snowmanRound: ['동글 눈사람', '나뭇가지 팔을 단 동글동글한 눈사람.', [['gSnow', 6], ['wood', 2]], 'furn', null, 'deco'],
  snowmanS: ['작은 눈사람', '손바닥만 한 작은 눈사람.', [['gSnow', 3]], 'furn', null, 'deco'],
  xmasTree: ['크리스마스 트리', '별과 방울로 꾸민 커다란 전나무 (2×1).', [['wood', 8], ['gSnow', 4], ['copperBar', 1], ['petalR', 2], ['petalY', 2]], 'furn', [2, 1], 'deco'],
  snowShroomL: ['큰 눈 버섯', '눈이 소복이 쌓인 커다란 버섯 (2×1).', [['mushroom', 4], ['gSnow', 4]], 'nature', [2, 1], null],
  snowShroom: ['눈 버섯', '눈이 쌓인 버섯.', [['mushroom', 3], ['gSnow', 2]], 'nature', null, null],
  snowShroomS: ['작은 눈 버섯', '눈이 얹힌 작은 버섯.', [['mushroom', 2], ['gSnow', 1]], 'nature', null, null],
  frostShroomL: ['큰 붉은 눈 버섯', '붉은 갓에 눈이 얹힌 버섯 나무.', [['mushroom', 4], ['gSnow', 3], ['petalR', 1]], 'nature', null, null],
  frostShroom: ['붉은 눈 버섯', '붉은 갓에 눈이 얹힌 버섯.', [['mushroom', 3], ['gSnow', 2], ['petalR', 1]], 'nature', null, null],
  frostShroomS: ['작은 붉은 눈 버섯', '붉은 갓의 작은 눈 버섯.', [['mushroom', 2], ['gSnow', 1]], 'nature', null, null],
  snowArch: ['눈 덮인 돌 아치', '눈이 쌓인 옛 돌 아치 (3×1).', [['stone', 16], ['gSnow', 4]], 'nature', [3, 1], null],
  snowRuinWall: ['눈 덮인 돌담', '계단이 붙은 무너진 돌담에 눈이 얹혔어요 (3×1).', [['stone', 14], ['gSnow', 3]], 'nature', [3, 1], null],
  snowRuinRing: ['눈 덮인 돌 고리', '둥글게 놓인 옛 돌들 (3×2).', [['stone', 16], ['gSnow', 4]], 'nature', [3, 2], null],
  snowRuinS: ['눈 덮인 돌무더기', '눈이 쌓인 옛 돌무더기 (2×1).', [['stone', 10], ['gSnow', 3]], 'nature', [2, 1], null],
  snowTotem: ['나무 토템', '곰 얼굴을 새긴 나무 토템 (2×1).', [['wood', 10], ['frostShard', 1]], 'furn', [2, 1], 'deco'],
  snowTotemS: ['작은 나무 토템', '눈이 얹힌 작은 나무 토템.', [['wood', 6], ['frostShard', 1]], 'furn', null, 'deco'],
  ashDragon: ['커다란 뼈 무더기', '재 속에 길게 누운 커다란 짐승 뼈 (4×2).', [['stone', 12], ['gAsh', 6]], 'nature', [4, 2], null],
};
for (const id in DECO132) { const [n, d, req, cat, sz] = DECO132[id];
  ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = Object.assign({ n, item: id, solid: 1 }, sz ? { sz } : {});
  const r = Rc(id, 1, req, 'bench', cat); r.tier = recipeTier(r); RECIPES.push(r); }

// 눈 무더기 위에 나오는 비율 (눈 무더기 칸 하나당 %). 결정은 지금 얼음 결정 양(얼음 바닥의 약 2%)과 비슷하게 맞췄어요.
export const SNOW_GEN = [
  ['iceCluster', 6], ['iceClusterB', 3.5], ['iceClusterC', 2.5],
  ['iceTreeL', 0.25], ['iceTree', 0.35], ['snowPineL', 0.25], ['snowPine', 0.35], ['snowPineS', 0.5], ['snowRoundL', 0.2], ['snowRound', 0.35], ['snowRoundS', 0.6],
  ['snowTwigL', 0.2], ['snowTwig', 0.3], ['snowTwigS', 0.4], ['frostTreeL', 0.2], ['frostTree', 0.3], ['frostTreeS', 0.4],
  ['snowRockL', 0.2], ['snowRock', 0.4], ['snowRockS', 0.7], ['snowPebble', 0.8],
  ['iceFlowerL', 0.6], ['iceFlower', 1.2], ['iceFlowerS', 1.4], ['frostWeedL', 0.4], ['frostWeed', 0.6], ['frostWeedS', 0.8],
];
// 용암 동굴 재 바닥(18) 칸 하나당 %
export const ASH_GEN = [['ashSkullL', 0.05], ['ashSkull', 0.12], ['ashSkullS', 0.25], ['ashSpine', 0.1], ['ashRibs', 0.12], ['ashJaw', 0.12]];
// 크기마다 비어 있어야 하는 둘레 (왼쪽·오른쪽 칸 수, 위쪽 칸 수, 아래쪽 칸 수) — 벽·다른 물체가 없어야 해요
export const ROOM132 = { T: [0, 0, 0], S: [1, 1, 1], M: [1, 2, 1], L: [2, 3, 1] };
// 하루 하나 자연 재생: 눈 무더기 칸이면 이 목록에서 (얼음 결정도 이제 눈 무더기에서만), 재 바닥이면 해골·뼈도 조금
export const SNOW_DAY = SNOW_GEN.map(([k, p]) => [k, p]);
NAT_DAY_KINDS[4] = NAT_DAY_KINDS[4].filter(([k]) => k !== 'iceCluster');
NAT_DAY_KINDS[3].push(['ashSkullS', 0.05], ['ashJaw', 0.03], ['ashRibs', 0.03]);
// 칸 (x,y)에 크기 sz의 자연물을 놓아도 되는지: 둘레에 벽·물체가 없어야 해요 (wall·objs·칸 확인·칸 번호 함수를 받아요 — 새 세계·옛 세계·하루 하나가 같이 써요)
export function roomFor(sz, x, y, wall, objs, inb, ix) { const [sx, up, dn] = ROOM132[sz] || ROOM132.S;
  for (let yy = y - up; yy <= y + dn; yy++) for (let xx = x - sx; xx <= x + sx; xx++) { if (!inb(xx, yy)) return false; const j = ix(xx, yy); if (wall[j] || objs.has(j)) return false; }
  return true; }
