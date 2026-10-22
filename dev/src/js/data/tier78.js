// ================= v130 남은 성장 확장 ② 7·8단계 무기·방어구 · 큰 어둠 재도전 · 새벽돌 (dev/design/성장확장.md 8-2c) =================
// 사용자 선택(2026-10-22, 수치는 추천대로): 작업대·장비제작대 6단계 「그림자」(data/automation-tiers.js — 올리기 그림자 결정 10 · 그림자 바위 20).
// 7단계(그림자, 착용 Lv.50)와 8단계(새벽돌, 착용 Lv.60) 장비는 모두 그림자 장비제작대에서 만들어요(장비 단계 6). 7단계 곡괭이는 없어요.
// 큰 어둠도 다른 보스처럼 특별 무기 6종(7단계 × 1.25, 효과 「어둠 번개」 — 사용자 선택: 주변 적까지 이어서 맞음).
// 새벽돌은 큰 어둠에서: 첫 처치 6개 · 다시 물리치면 2~4개(sim/bosses.js). 옛 세이브에서 이미 물리친 사람은 나루에게서 한 번(sim/npc.js · save/migrations.js).
// 이 파일은 data/shadow.js 다음이라 「지형 재료 2배」·레시피 단계 나누기가 적용되지 않아요 — 재료 개수와 단계(tier)를 여기 적힌 그대로 써요.
import { DUR } from './circuits-regions.js';
import { ITEMS, RAR, RECIPES, Rc } from './items.js';
import { AR_DEF, AR_SLOTS, AR_TABLE, BOSS_TIER, BOSS_W, SP_MUL, SP_OF, tierDmg, WT_ORDER, WT_RLV, WT_SW, WT_TABLE } from './growth.js';
import { SUMMON } from './quests.js';

export const SHADOW_TIER = 6; // 장비제작대 6단계(그림자)에서 7·8단계 장비를 만들어요
// 단계 6(7단계) · 7(8단계): 검 공격력 64 · 84, 착용 레벨 50 · 60
WT_SW.push(64, 84); WT_RLV.push(50, 60);
WT_TABLE.push(
  ['swordShadow', 'daggerShadow', 'spearShadow', 'hammerShadow', 'bowShadow', 'staffShadow'],
  ['swordDawnstone', 'daggerDawnstone', 'spearDawnstone', 'hammerDawnstone', 'bowDawnstone', 'staffDawnstone'],
);
const T78_NAME = ['그림자', '새벽돌'], T78_DUR = [1600, 2000], T78_RAR = [3, 4]; // 영웅 · 전설
const T78_FIX = [[['shadowCry', 2]], [['dawnstone', 1]]];
const KIND_N = { sword: '검', dagger: '단검', spear: '창', hammer: '망치', bow: '활', staff: '지팡이' };
const T78_D = [
  { sword: '그림자 결정으로 벼린 검. 깊은 곳의 어둠을 베어요.', dagger: '어둠처럼 소리 없이 찌르는 단검.', spear: '끝이 그림자 결정으로 된 긴 창.', hammer: '그림자 바위를 통째로 단 망치. 쿵! 하고 땅이 울려요.', bow: '그림자 결정으로 깎은 활. 화살이 어둠을 가르며 날아가요.', staff: '보랏빛 결정 끝에서 그림자 구슬이 날아가요.' },
  { sword: '새벽돌로 벼린 검. 따뜻한 빛이 날을 따라 흘러요.', dagger: '새벽빛처럼 날카로운 단검.', spear: '끝에서 새벽빛이 번지는 긴 창.', hammer: '새벽돌을 박은 망치. 내려치면 빛이 터져요.', bow: '새벽돌로 보강한 활. 빛나는 화살이 멀리 날아가요.', staff: '새벽돌 끝에서 아침 햇살 같은 구슬이 날아가요.' },
];
const T78_ORB = ['#c9a8ff', '#ffe9a8'];
// 재료: 종류 → [단계 7, 단계 8]
const T78_REQ = {
  sword: [[['shadowCry', 8], ['shadowRock', 6], ['frostShard', 2]], [['dawnstone', 4], ['shadowCry', 6]]],
  dagger: [[['shadowCry', 5], ['shadowRock', 3], ['frostShard', 1]], [['dawnstone', 3], ['shadowCry', 4]]],
  spear: [[['shadowCry', 7], ['shadowRock', 4], ['wood', 3]], [['dawnstone', 4], ['shadowCry', 5], ['wood', 3]]],
  hammer: [[['shadowCry', 10], ['shadowRock', 8], ['goldBar', 2]], [['dawnstone', 5], ['shadowCry', 8]]],
  bow: [[['shadowCry', 6], ['shadowRock', 2], ['rope', 3]], [['dawnstone', 3], ['shadowCry', 5], ['rope', 3]]],
  staff: [[['shadowCry', 6], ['glowcap', 4], ['goldBar', 2]], [['dawnstone', 3], ['shadowCry', 5], ['glowcap', 4]]],
};
for (let s = 0; s < 2; s++) { const t = SHADOW_TIER + s; WT_TABLE[t].forEach((id, k) => { const wt = WT_ORDER[k];
  ITEMS[id] = { n: `${T78_NAME[s]} ${KIND_N[wt]}`, kind: 'sword', wt, stack: 1, d: T78_D[s][wt], orb: wt === 'staff' ? T78_ORB[s] : undefined, dmg: tierDmg(t, wt), rlv: WT_RLV[t], wtier: t };
  DUR[id] = [T78_DUR[s], T78_FIX[s]]; RAR[id] = T78_RAR[s];
  const r = Rc(id, 1, T78_REQ[wt][s], 'smelter', 'weapon'); r.tier = SHADOW_TIER; r.cat = 'weapon'; RECIPES.push(r); }); }

// ---- 방어구: 방어력 머리·하의 18 · 24, 상의 29 · 37 (한 벌 65 · 85 → 받는 피해 −57% · −63%) ----
AR_DEF.head.push(18, 24); AR_DEF.body.push(29, 37); AR_DEF.legs.push(18, 24);
AR_TABLE.push(
  [['helmShadow', '그림자 투구', [['shadowCry', 4], ['goldBar', 1]]], ['armorShadow', '그림자 갑옷', [['shadowCry', 7], ['shadowRock', 4]]], ['legsShadow', '그림자 각반', [['shadowCry', 5], ['shadowRock', 3]]]],
  [['helmDawnstone', '새벽돌 투구', [['dawnstone', 2], ['shadowCry', 3]]], ['armorDawnstone', '새벽돌 갑옷', [['dawnstone', 4], ['shadowCry', 5]]], ['legsDawnstone', '새벽돌 각반', [['dawnstone', 3], ['shadowCry', 4]]]],
);
const AR_D78 = { head: '머리에 써요', body: '몸에 입어요', legs: '다리에 입어요' };
for (let s = 0; s < 2; s++) { const t = SHADOW_TIER + s; AR_TABLE[t].forEach(([id, n, req], k) => { const sl = AR_SLOTS[k];
  ITEMS[id] = { n, kind: 'wear', slot: sl, stack: 1, def: AR_DEF[sl][t], rlv: WT_RLV[t], wtier: t, d: `${AR_D78[sl]}. 받는 피해를 줄여 줘요.` }; RAR[id] = T78_RAR[s];
  const r = Rc(id, 1, req, 'smelter', 'armor'); r.tier = SHADOW_TIER; r.cat = 'armor'; RECIPES.push(r); }); }

// ---- 새벽돌 ----
ITEMS.dawnstone = { n: '새벽돌', d: '큰 어둠을 물리치면 나오는, 새벽처럼 따뜻하게 빛나는 돌. 8단계 장비의 재료예요.' };
export const DAWN_FIRST = 6, DAWN_AGAIN = [2, 4]; // 첫 처치 6개 · 다시 물리치면 2~4개
export const DARK_XP_AGAIN = 1000; // 다시 물리치면 경험치 (첫 처치 4,000의 1/4)

// ---- 큰 어둠 특별 무기 6종 (7단계 × 1.25, 착용 Lv.50) · 효과 「어둠 번개」 ----
// 맞은 적에서 CHAIN_R칸 안의 적에게 차례로 CHAIN_N마리까지 튀어 그 피해의 CHAIN_MUL만큼 (sim/combat.js chainFx, 보스를 맞혀도 둘레 적에게 튐)
export const CHAIN_N = 3, CHAIN_R = 3, CHAIN_MUL = 0.4;
BOSS_TIER.dark = SHADOW_TIER;
BOSS_W.dark = { ids: ['swordDark', 'daggerDark', 'spearDark', 'hammerDark', 'bowDark', 'staffDark'], pre: '큰 어둠의', fx: 'chain', fix: [['shadowCry', 3]], orb: '#c9a8ff' };
BOSS_W.dark.ids.forEach((id, k) => { const wt = WT_ORDER[k]; SP_OF[id] = 'dark';
  ITEMS[id] = { n: `큰 어둠의 ${KIND_N[wt]}`, kind: 'sword', wt, stack: 1, fx: 'chain', d: `큰 어둠이 남긴 ${KIND_N[wt]}. 맞힌 적 둘레의 적에게 어둠 번개가 튀어요.`, orb: wt === 'staff' ? '#c9a8ff' : undefined,
    dmg: Math.round(tierDmg(SHADOW_TIER, wt) * SP_MUL), rlv: WT_RLV[SHADOW_TIER], wtier: SHADOW_TIER };
  DUR[id] = [1600, BOSS_W.dark.fix]; RAR[id] = 3; });

// ---- 큰 어둠 다시 부르기: 어둠의 심장 조각상 (그림자 작업대) ----
SUMMON.darkIdol = ['어둠의 심장 조각상', 'dark', [['shadowCry', 10], ['shadowRock', 10], ['goldBar', 4]], '#3a2a5a', '#c9a8ff'];
ITEMS.darkIdol = { n: '어둠의 심장 조각상', kind: 'summon', boss: 'dark', d: '큰 어둠을 물리친 뒤 가장 깊은 곳 보스방에서 쓰면 큰 어둠이 다시 나타나요. 다시 잡으면 새벽돌과 함께 가끔 큰 어둠의 무기가 떨어져요.' };
{ const r = Rc('darkIdol', 1, SUMMON.darkIdol[2], 'bench', 'tool'); r.tier = SHADOW_TIER; RECIPES.push(r); }

// ---- 옛 세이브: 이미 큰 어둠을 물리친 사람은 첫 처치 보상을 나루에게서 한 번 (sim/npc.js) — 나루 대사는 Claude 임시 ----
export const NARU_DAWN = ['{이름}님, 큰 어둠이 사라진 자리에서 이걸 찾았어요.', '새벽처럼 따뜻한 돌이랑, 어둠이 남긴 무기예요. {이름}님이 가져요!'];
