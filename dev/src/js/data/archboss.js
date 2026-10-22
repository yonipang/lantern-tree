// ================= v131 남은 성장 확장 ③ 기록관 보스 4 · 기록관 몬스터 2종 (dev/design/성장확장.md 8-2d) =================
// 사용자 선택(2026-10-22, 모두 추천대로): 기록관 일기를 읽으면 봉인된 마지막 방이 열리고 그 기록관의 보스가 있어요(이야기를 막지 않는 도전).
// 보스는 그 지역 보스보다 한 단계 센 도전이고, 특별 무기 6종(보스 단계 × 1.25 + 보스 효과, 안 받은 것부터)을 줘요. 다시 부르기는 소환 조각상.
// 동작은 sim/archboss.js(방 붙이기·보스 움직임·파수 돌인형), 그림은 art/content.js(Claude 임시). 이 파일은 data/tier78.js 다음에 와요 —
// 「지형 재료 2배」·레시피 단계 나누기가 적용되지 않아서 재료 개수와 단계(tier)를 여기 적힌 그대로 써요.
import { DUR } from './circuits-regions.js';
import { ENEMY, REMATCH } from './rpg-nature.js';
import { ITEMS, RAR, RECIPES, Rc } from './items.js';
import { BOSS_TIER, BOSS_W, SP_MUL, SP_OF, tierDmg, WT_ORDER, WT_RLV } from './growth.js';
import { Q_CH, Q_RW, SUMMON } from './quests.js';
import { SHADOW_TIER } from './tier78.js';
import { josa } from '../engine/util.js';

// 기록관 → 보스 (id = sim/archive.js ARCHIVES의 id)
export const ABOSS = [
  { arch: 'arch0', k: 'bookGolem', n: '책더미 골렘', at: '이끼 굴', hp: 1200, xp: 400, tier: 2, col: '#c9a26b', hr: 1.0, scale: 1.2,
    loot: [['ironBar', 6], ['rope', 4]], pre: '책더미 골렘의', fx: 'daze', fix: [['ironBar', 2]], orb: '#f0d8a8',
    ids: ['swordBook', 'daggerBook', 'spearBook', 'hammerBook', 'bowBook', 'staffBook'] },
  { arch: 'arch2', k: 'mirrorSage', n: '거울 사서', at: '수정 동굴', hp: 2400, xp: 800, tier: 4, col: '#d6c2ff', hr: 0.9, scale: 1.15,
    loot: [['cryGem', 4], ['crystal', 6]], pre: '거울 사서의', fx: 'mirror', fix: [['cryGem', 2]], orb: '#efe6ff',
    ids: ['swordMirror', 'daggerMirror', 'spearMirror', 'hammerMirror', 'bowMirror', 'staffMirror'] },
  { arch: 'arch3', k: 'inkFlame', n: '잉크 불꽃', at: '용암 동굴', hp: 3000, xp: 1200, tier: 5, col: '#6a5aff', hr: 0.9, scale: 1.2,
    loot: [['obsidian', 6], ['goldBar', 4]], pre: '잉크 불꽃의', fx: 'ink', fix: [['obsidian', 3]], orb: '#a89aff',
    ids: ['swordInk', 'daggerInk', 'spearInk', 'hammerInk', 'bowInk', 'staffInk'] },
  { arch: 'arch4', k: 'frostKeeper', n: '얼어붙은 기록관장', at: '얼음 동굴', hp: 4000, xp: 1600, tier: SHADOW_TIER, col: '#9fd8f0', hr: 1.0, scale: 1.2,
    loot: [['frostShard', 10], ['goldBar', 4]], pre: '얼어붙은 기록관장의', fx: 'frost', fix: [['frostShard', 4]], orb: '#e8f8ff',
    ids: ['swordKeeper', 'daggerKeeper', 'spearKeeper', 'hammerKeeper', 'bowKeeper', 'staffKeeper'] },
];
export const ABOSS_OF = Object.fromEntries(ABOSS.map(A => [A.k, A]));
export const ABOSS_XP = Object.fromEntries(ABOSS.map(A => [A.k, A.xp])); // 첫 처치 경험치 (다시 잡아도 같음 — 지금 보스 규칙)
export const ABOSS_WAKE = 5; // 깨어나는 거리 (일기 방에서 바로 깨지 않게 다른 보스 8칸보다 짧게)

// ---- 보스 공격 수치 (닿으면 · 탄 · 위험 지대) ----
export const AB_DMG = {
  bookGolem: { touch: 16, dash: 22, book: 12 },
  mirrorSage: { touch: 18, beam: 22 },
  inkFlame: { touch: 22, fire: 22, ink: 6 },
  frostKeeper: { touch: 26, pillar: 30, book: 22 },
};

// ---- 특별 무기 6종: 보스 단계 × 1.25 + 보스 효과 ----
const AB_KIND_N = { sword: '검', dagger: '단검', spear: '창', hammer: '망치', bow: '활', staff: '지팡이' };
export const AB_FX_D = {
  daze: '맞은 적이 가끔(20%) 1초 기절해요.',
  mirror: '맞힌 피해의 30%가 가까운 다른 적 하나에게 튀어요.',
  ink: '맞은 적은 3초 동안 받는 피해가 20% 늘어요.',
  frost: '쓰러뜨린 적 둘레 2칸의 적이 얼어붙어요.',
};
// 효과 수치 (sim/combat.js applyFx · hitEnemy)
export const DAZE_P = 0.2, DAZE_T = 1, MIRROR_R = 3, MIRROR_MUL = 0.3, INK_T = 3, INK_MUL = 1.2, FROST_R = 2;
const AB_DUR = [0, 700, 800, 900, 1300, 1300, 1600]; // 단계별 내구도 (보스 무기와 같은 표 · 6 = 그림자)
for (const A of ABOSS) { const t = A.tier; BOSS_TIER[A.k] = t; BOSS_W[A.k] = { ids: A.ids, pre: A.pre, fx: A.fx, fix: A.fix, orb: A.orb };
  A.ids.forEach((id, k) => { const wt = WT_ORDER[k]; SP_OF[id] = A.k;
    ITEMS[id] = { n: `${A.pre} ${AB_KIND_N[wt]}`, kind: 'sword', wt, stack: 1, fx: A.fx, d: `${josa(A.n, '이', '가')} 남긴 ${AB_KIND_N[wt]}. ${AB_FX_D[A.fx]}`, orb: wt === 'staff' ? A.orb : undefined,
      dmg: Math.round(tierDmg(t, wt) * SP_MUL), rlv: WT_RLV[t], wtier: t };
    DUR[id] = [AB_DUR[t], A.fix]; RAR[id] = 3; }); }

// ---- 다시 부르기: 소환 조각상 (작업대 · 그 지역 단계) · 다시 잡으면 재료 + 특별 무기 35% (sim/bosses.js rematchLoot) ----
// SUMMON: id → [이름, 보스, 재료, 색1, 색2] · 작업대 단계는 AB_IDOL_TIER
SUMMON.bookIdol = ['책더미 조각상', 'bookGolem', [['ironBar', 4], ['rope', 4], ['wood', 6]], '#c9a26b', '#f0d8a8'];
SUMMON.mirrorIdol = ['거울 조각상', 'mirrorSage', [['crystal', 10], ['cryGem', 2]], '#b493f5', '#efe6ff'];
SUMMON.inkIdol = ['잉크병 조각상', 'inkFlame', [['obsidian', 6], ['goldBar', 3]], '#3a3060', '#a89aff'];
SUMMON.keeperIdol = ['얼음 책 조각상', 'frostKeeper', [['frostShard', 12], ['goldBar', 3]], '#5a9ac8', '#e8f8ff'];
const AB_IDOL_TIER = { bookIdol: 2, mirrorIdol: 3, inkIdol: 4, keeperIdol: 5 };
for (const id in AB_IDOL_TIER) { const [n, k, req] = SUMMON[id], A = ABOSS_OF[k];
  ITEMS[id] = { n, kind: 'summon', boss: k, d: `${josa(A.n, '을', '를')} 물리친 뒤 ${A.at} 기록관의 마지막 방에서 쓰면 ${josa(A.n, '이', '가')} 다시 나타나요. 다시 잡으면 재료와 함께 가끔 ${A.pre} 무기가 떨어져요.` };
  const r = Rc(id, 1, req, 'bench', 'tool'); r.tier = AB_IDOL_TIER[id]; RECIPES.push(r); }
Object.assign(REMATCH, { bookGolem: [['ironBar', 3], ['rope', 3]], mirrorSage: [['cryGem', 2], ['crystal', 4]], inkFlame: [['obsidian', 3], ['goldBar', 2]], frostKeeper: [['frostShard', 6], ['goldBar', 2]] });

// ---- 기록관 몬스터 2종 (깨기 전 기록관 안에서만) ----
Object.assign(ENEMY, {
  // 파수 돌인형: 들어가는 방에서 네모 길을 정해진 대로 돌아요(2마리). 때려도 안 다치고, 레버를 켜면 멈춰 돌이 돼요(sim/archboss.js)
  stoneWard: { n: '파수 돌인형', hp: 999, dmg: 12, spd: 1.6, r: 0.36, hop: 0, ai: 'patrol', aggro: 0, drops: [], col: '#8a8478', xp: 0 },
  // 책벌레: 작고 약한 떼 (그림자 조각과 같이 나와요)
  bookworm: { n: '책벌레', hp: 24, dmg: 7, spd: 3.4, r: 0.26, hop: 0, aggro: 6, drops: [['fiber', 1, 1, 0.3]], col: '#c9a26b' },
  // 거울 사서의 분신: 제자리에서 빛줄기만 쏴요(경험치 없음, 보스가 쓰러지면 사라짐)
  mirrorClone: { n: '거울 분신', hp: 120, dmg: 16, spd: 0, r: 0.34, hop: 0, ai: 'beam', aggro: 9, alpha: 0.75, drops: [], col: '#d6c2ff', xp: 0 },
});
export const WARD_DM = [1, 1, 1.5, 2, 2.4]; // 지역별 파수 돌인형 닿으면 피해 배율 (이끼 12 · 수정 18 · 용암 24 · 얼음 29)
export const WORM_HP = [1, 1, 2.5, 4, 5]; // 지역별 책벌레 체력 배율
export const WORM_N = 3; // 한 번에 나오는 책벌레 수

// ---- 도전 퀘스트 「○○ 기록관의 마지막 방」 4개: 장 번호 · 새 물건 보상 (dev/design/퀘스트설계.md 「보상 원칙」 — 그 장의 다음 관문 재료) ----
Object.assign(Q_CH, { s_ab0: 5, s_ab2: 7, s_ab3: 9, s_ab4: 10 });
Object.assign(Q_RW, { s_ab0: [['ironBar', 3], ['stew', 2]], s_ab2: [['cryGem', 2], ['stew', 2]], s_ab3: [['torch', 6], ['stew', 2]], s_ab4: [['frostShard', 6], ['stew', 2]] });
export const AB_Q_XP = { s_ab0: 120, s_ab2: 200, s_ab3: 260, s_ab4: 300 };
