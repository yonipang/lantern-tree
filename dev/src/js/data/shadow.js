// ================= v129 남은 성장 확장 ① 그림자 지대 · 깊은 몬스터 5종 · 그림자 결정 (dev/design/성장확장.md 8장) =================
// 사용자 선택(2026-10-22, 모두 추천대로): 빛씨앗 5개를 심으면 가장 깊은 곳 유적 둘레 약 25칸이 「그림자 지대」로 깨어나요
// (자연 바위 → 그림자 바위, 자연 바닥 → 그림자 바닥, 바위의 약 6%는 그림자 결정 광맥). 그림자 바위는 황금 곡괭이 이상.
// 깊은 몬스터 5종은 그림자 지대에서만 나오고, 모두 빛 안에서 받는 피해 2배(그림자 조각과 같은 shadow 표시). 더위·추위는 밑의 용암·얼음 동굴 그대로.
// 경험치는 지금 규칙(체력의 절반) 그대로라 체력을 높게 잡았어요. 큰 어둠 첫 처치 경험치 100 → 4,000(sim/bosses.js).
// 동작은 sim/shadow.js(지대 깨우기·출현)·sim/monsters.js(움직임), 그림은 art/content.js(Claude 임시). 이 파일은 data/nature123.js 다음에 와요.
import { ITEMS, TIERNAME, WALLS } from './items.js';
import { ENEMY } from './rpg-nature.js';

// 그림자 지대 크기: 유적 가운데에서 반지름 SHADOW_R 칸(± SHADOW_WOB 칸 구불구불), 바위 가운데 결정 광맥 비율
export const SHADOW_R = 25, SHADOW_WOB = 4, SHADOW_VEIN = 0.06;
export const SHADOW_FLOOR = 23, SHADOW_ROCK = 16, SHADOW_VEIN_W = 17; // 바닥·벽 번호 (22 구덩이 · 14·15 v122 벽 다음)
// 그림자 지대로 바뀌는 것: 자연 바위(흙·돌·화강암·현무암·얼음) · 자연 바닥(흙·이끼·버섯흙·수정 모래·재·눈). 광맥·물·용암·얼어붙은 물·놓은 것은 그대로
export const SHADOW_FROM_WALL = new Set([1, 2, 3, 9, 11]);
export const SHADOW_FROM_FLOOR = new Set([1, 2, 3, 4, 18, 19]);

// 벽 (황금 곡괭이 = 단계 4)
WALLS[SHADOW_ROCK] = { n: '그림자 바위', tier: 4, hp: 10, drop: [['shadowRock', 1, 1, 1]] };
WALLS[SHADOW_VEIN_W] = { n: '그림자 결정 광맥', tier: 4, hp: 12, drop: [['shadowCry', 1, 2, 1], ['shadowRock', 1, 1, 0.3]] };
TIERNAME.push('황금 곡괭이');
ITEMS.pickGold.tier = 4; ITEMS.pickStar.tier = 4; // 황금·별빛 곡괭이만 그림자 바위를 캐요 (힘·내구도는 그대로)
ITEMS.pickGold.d = '깊은 동굴의 벽도 빠르게 캐는 곡괭이. 그림자 바위도 캘 수 있어요.';

// 아이템
ITEMS.shadowCry = { n: '그림자 결정', d: '그림자 지대의 결정 광맥과 깊은 몬스터에게서 얻어요. 7단계 장비의 재료가 될 거예요.' };
ITEMS.shadowRock = { n: '그림자 바위', kind: 'wall', wall: SHADOW_ROCK, mat: 1, d: '그림자 지대의 바위를 캐면 나와요. 들고 있으면 그림자 바위 벽을 쌓을 수 있어요.' };

// 깊은 몬스터 5종 (모두 shadow: 빛 안에서 받는 피해 2배 · 지역 보정 없음)
Object.assign(ENEMY, {
  // 땅속으로 다가와 발밑에서 튀어나와 붙잡아요(2초 느려짐)
  shadowHand: { n: '그림자 손', hp: 300, dmg: 28, spd: 2.0, r: 0.34, hop: 0, ai: 'grab', aggro: 6.5, shadow: 1, grab: 2, mound: '#2a1e3a', drops: [['shadowCry', 1, 1, 0.2], ['shadowRock', 1, 2, 0.5]], col: '#3a2a5a' },
  // 벽을 지나다니고, 밝은 곳에 들어가면 1초 깜빡이다 사라져요(경험치·드롭 없음)
  shadowGhost: { n: '망각 유령', hp: 360, dmg: 30, spd: 2.4, r: 0.32, hop: 0, ai: 'ghost', aggro: 6.5, shadow: 1, xray: 1, alpha: 0.72, drops: [['shadowCry', 1, 1, 0.25]], col: '#8a7ab8' },
  // 앞(±60°)에서 맞으면 피해 20%만, 4초마다 조준 뒤 돌진
  shadowKnight: { n: '잊힌 기사', hp: 560, dmg: 36, spd: 1.8, r: 0.38, hop: 0, ai: 'knight', aggro: 6.5, shadow: 1, front: 0.2, drops: [['shadowCry', 1, 2, 0.4], ['goldBar', 1, 1, 0.3]], col: '#5a5070' },
  // 빠르고 3마리 무리
  shadowWolf: { n: '그림자 늑대', hp: 320, dmg: 32, spd: 4.6, r: 0.34, hop: 0, pack: 2, aggro: 6.5, shadow: 1, drops: [['shadowCry', 1, 1, 0.15], ['wool', 1, 1, 0.3]], col: '#2e2244' },
  // 그림자 탄·발밑 경고 원·짧은 순간이동을 번갈아 써요, 결정을 꼭 줘요
  lostKeeper: { n: '길 잃은 등불지기', hp: 700, dmg: 34, spd: 2.2, r: 0.34, hop: 0, ai: 'keeper', aggro: 7, shadow: 1, drops: [['shadowCry', 2, 3, 1]], col: '#c9a8ff' },
});
// 그림자 지대에서 나오는 몬스터와 비율 (생기는 간격·최대 수는 그 자리 지역(용암·얼음) 그대로)
export const SHADOW_TABLE = [['shadowHand', .25], ['shadowGhost', .2], ['shadowKnight', .2], ['shadowWolf', .25], ['lostKeeper', .1]];
// 벽 캘 때 경험치 (sim/gathering.js breakWall)
export const SHADOW_WALL_XP = { [SHADOW_ROCK]: 4, [SHADOW_VEIN_W]: 10 };
