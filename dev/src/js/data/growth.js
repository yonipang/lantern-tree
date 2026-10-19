// ================= v99 성장 확장 2: 무기 6종 × 6단계 + 착용 레벨 + 보스 특별 무기 6종씩 (dev/design/성장확장.md 2장) =================
// 단계(0~5) = 작업대·장비제작대 단계(나무 · 구리 · 철 · 수정 · 금·흑요석 · 서리). 7~9단계는 가장 깊은 곳·그림자 틈을 만들 때.
// 공격력 = 그 단계 검 공격력 × 종류 배율(반올림). 지금 무기도 이 표대로 고쳐요(이름·id 그대로). 도끼는 도구라 이 표 밖이에요.
// 이 파일은 data/automation-tiers.js 뒤에 있어서 「지형 재료 2배」·레시피 단계 나누기가 적용되지 않아요 — 재료 개수와 단계(tier)를 여기 적힌 그대로 써요.
import { DUR } from './circuits-regions.js';
import { ITEMS, RAR, RECIPES, Rc } from './items.js';
import { josa } from '../engine/util.js';
export const WT_SW = [6, 11, 17, 26, 36, 48]; // 단계별 검 공격력
export const WT_MUL = { sword: 1, dagger: .65, spear: 1.05, hammer: 1.5, bow: .85, staff: .8 };
export const WT_RLV = [1, 5, 12, 20, 30, 40]; // 단계별 착용 레벨
export const WT_ORDER = ['sword', 'dagger', 'spear', 'hammer', 'bow', 'staff'];
export const tierDmg = (t, wt) => Math.round(WT_SW[t] * WT_MUL[wt]);
// 단계마다 종류별 id (지금 있는 무기는 그 자리에, 없던 자리는 새로)
export const WT_TABLE = [
  ['swordWood', 'daggerWood', 'spearWood', 'hammerWood', 'bowWood', 'staffWood'],
  ['swordCopper', 'daggerCopper', 'spearCopper', 'hammerCopper', 'bowCopper', 'staffGlow'],
  ['swordIron', 'daggerIron', 'spearIron', 'hammerIron', 'bowIron', 'staffIron'],
  ['swordCrystal', 'daggerCrystal', 'spearCrystal', 'hammerCrystal', 'bowCrystal', 'staffCrystal'],
  ['swordGold', 'daggerObsidian', 'spearGold', 'hammerObsidian', 'bowGold', 'staffGold'],
  ['swordFrost', 'daggerFrost', 'spearFrost', 'hammerFrost', 'bowIce', 'staffFrost'],
];
// 새 일반 무기 13개: id → [이름, 재료, 고치는 재료, 설명, 구슬 색]
const NEW_W = {
  hammerWood: ['나무 망치', [['wood', 8], ['rope', 1]], [['wood', 3]], '느리지만 넓게 쿵! 적을 멀리 밀어내요.'],
  staffWood: ['나무 지팡이', [['wood', 6], ['glowcap', 1], ['fiber', 2]], [['wood', 2]], '기력을 조금 써서 빛 구슬을 쏴요. 지혜가 높을수록 세져요.', '#cdeccb'],
  bowCopper: ['구리 활', [['copperBar', 3], ['wood', 4], ['rope', 2]], [['copperBar', 1]], '구리로 보강한 활. 화살이 조금 더 세게 날아가요.'],
  daggerIron: ['철 단검', [['ironBar', 3], ['wood', 1], ['rope', 1]], [['ironBar', 1]], '날카로운 철 단검. 치명타가 잘 터져요.'],
  staffIron: ['철 지팡이', [['ironBar', 3], ['glowcap', 4], ['gel', 2]], [['ironBar', 1]], '철 고리로 감싼 지팡이. 단단한 빛 구슬을 쏴요.', '#e6f0ff'],
  daggerCrystal: ['수정 단검', [['crystal', 6], ['ironBar', 2], ['rope', 1]], [['crystal', 2]], '보랏빛 수정 단검. 빠르게 콕콕 찔러요.'],
  spearCrystal: ['수정 창', [['crystal', 8], ['ironBar', 3], ['wood', 3]], [['crystal', 3]], '끝이 수정으로 된 창. 멀리서 깊게 찔러요.'],
  hammerCrystal: ['수정 망치', [['crystal', 10], ['ironBar', 4], ['wood', 2]], [['crystal', 3]], '수정 덩어리를 박은 망치. 쾅! 하고 반짝여요.'],
  spearGold: ['황금 창', [['goldBar', 4], ['obsidian', 1], ['wood', 3]], [['goldBar', 2]], '황금빛으로 빛나는 긴 창.'],
  staffGold: ['흑요석 지팡이', [['obsidian', 4], ['goldBar', 2], ['glowcap', 3]], [['obsidian', 2]], '검은 흑요석 끝에서 불빛 구슬이 날아가요.', '#ffc861'],
  swordFrost: ['서리 검', [['frostShard', 8], ['goldBar', 2], ['ironBar', 2]], [['frostShard', 3]], '차갑게 빛나는 서리 검.'],
  daggerFrost: ['서리 단검', [['frostShard', 5], ['goldBar', 1], ['rope', 1]], [['frostShard', 2]], '얼음처럼 날카로운 단검.'],
  hammerFrost: ['서리 망치', [['frostShard', 10], ['goldBar', 3], ['wood', 2]], [['frostShard', 3]], '얼음 덩어리를 단 망치. 땅이 얼 만큼 무거워요.'],
  bowIce: ['얼음 활', [['frostShard', 6], ['goldBar', 2], ['rope', 3]], [['frostShard', 2]], '얼음으로 깎은 활. 차가운 화살이 멀리 날아가요.'],
};
const W_DUR = [160, 310, 550, 800, 1000, 1300], W_RAR = [0, 0, 1, 2, 3, 3];
for (let t = 0; t < WT_TABLE.length; t++) WT_TABLE[t].forEach((id, k) => {
  const wt = WT_ORDER[k], nw = NEW_W[id];
  if (nw) { const [n, req, fix, d, orb] = nw; ITEMS[id] = { n, kind: 'sword', wt, stack: 1, d, orb }; DUR[id] = [W_DUR[t], fix]; RAR[id] = W_RAR[t];
    const r = Rc(id, 1, req, 'smelter', 'weapon'); r.tier = t; r.cat = 'weapon'; RECIPES.push(r); }
  Object.assign(ITEMS[id], { dmg: tierDmg(t, wt), rlv: WT_RLV[t], wtier: t });
});
// 황금 활은 금 단계인데 재료에 서리 조각이 있어 서리 장비제작대에서만 만들던 것 → 흑요석으로 바꿔 금 장비제작대에서
{ const r = RECIPES.find(x => x.out === 'bowGold'); if (r) { r.req = r.req.map(([m, c]) => m === 'frostShard' ? ['obsidian', c] : [m, c]); r.tier = 4; } }
// ---- 보스 특별 무기: 보스마다 6종, 그 보스 단계 공격력 × 1.25 + 그 보스의 효과. 지금 보스 무기 5개는 그 보스의 6종 가운데 하나 ----
export const BOSS_TIER = { slime: 1, queen: 2, golem: 3, turtle: 4, spirit: 5 };
export const SP_MUL = 1.25;
// 보스 → 종류별 id (지금 있는 것 그대로) · 이름 앞말 · 효과 · 고치는 재료 · 구슬 색
export const BOSS_W = {
  slime: { ids: ['swordSlime', 'daggerSlime', 'spearSlime', 'hammerSlime', 'bowSlime', 'staffSlime'], pre: '말랑대왕', fx: 'slow', fix: [['gel', 6]], orb: '#b8f09a' },
  queen: { ids: ['swordQueen', 'daggerQueen', 'spearQueen', 'hammerQueen', 'bowQueen', 'staffQueen'], pre: '포자 여왕의', fx: 'poison', fix: [['shroomCap', 3]], orb: '#e2b8ff' },
  golem: { ids: ['swordGolem', 'daggerGolem', 'spearGolem', 'hammerGolem', 'bowGolem', 'staffGolem'], pre: '수정 거인의', fx: 'split', fix: [['crystal', 4]], orb: '#d6c2ff' },
  turtle: { ids: ['swordLava', 'daggerLava', 'spearLava', 'hammerLava', 'bowLava', 'staffLava'], pre: '용암 거북의', fx: 'burn', fix: [['obsidian', 3]], orb: '#ffb36b' },
  spirit: { ids: ['swordSpirit', 'daggerSpirit', 'spearSpirit', 'hammerSpirit', 'bowFrost', 'staffSpirit'], pre: '서리 정령의', fx: 'chill', fix: [['frostShard', 3]], orb: '#d4f6ff' },
};
const SP_NAME = { sword: '검', dagger: '단검', spear: '창', hammer: '망치', bow: '활', staff: '지팡이' };
const SP_D = { slow: '맞은 적이 끈적해져 느려져요.', poison: '맞을 때마다 독 포자가 퍼져요.', split: '맞은 곳에서 수정 파편이 튀어요.', burn: '맞은 자리에 불꽃이 일어요.', chill: '맞은 적이 얼어붙어요.' };
const SP_DUR = [0, 700, 800, 900, 1300, 1300];
export const SP_OF = {}; // 특별 무기 id → 보스
for (const b in BOSS_W) { const B = BOSS_W[b], t = BOSS_TIER[b];
  B.ids.forEach((id, k) => { const wt = WT_ORDER[k]; SP_OF[id] = b;
    if (!ITEMS[id]) { ITEMS[id] = { n: `${B.pre} ${SP_NAME[wt]}`, kind: 'sword', wt, stack: 1, fx: B.fx, d: `${josa(B.pre.replace(/의$/, ''), '이', '가')} 남긴 ${SP_NAME[wt]}. ${SP_D[B.fx]}`, orb: wt === 'staff' ? B.orb : undefined }; DUR[id] = [SP_DUR[t], B.fix]; }
    Object.assign(ITEMS[id], { dmg: Math.round(tierDmg(t, wt) * SP_MUL), rlv: WT_RLV[t], wtier: t, fx: B.fx }); RAR[id] = 3; });
}
// 새벽빛 검(전설, 두 핵으로 만듦)은 표 밖이라 공격력 그대로, 착용 레벨만 서리 단계와 같이. 도끼(도구)도 단계에 맞춰 착용 레벨
Object.assign(ITEMS.swordDawn, { rlv: 40 }); ITEMS.axeStone.rlv = 1; ITEMS.axeCopper.rlv = 5; ITEMS.axeIron.rlv = 12;
// ================= v100 성장 확장 3: 방어구 머리·상의·하의 × 6단계 + 방어력 (dev/design/성장확장.md 3장) =================
// 받는 피해 × 50 / (50 + 방어력 합계) (sim/player.js hurtPlayer). 강화 단계마다 방어력 +8%(무기 공격력과 같이). 착용 레벨은 무기와 같은 표(WT_RLV).
// 지금 특수 옷 4개(흑요석 외투·서리 비단옷·털모자·눈꽃 브로치)도 그 단계 방어력의 70%를 받아 방어구가 돼요 — 특수 옷은 착용 레벨 없음(그 동굴에 가려고 입는 옷이라)
export const AR_SLOTS = ['head', 'body', 'legs'];
export const AR_DEF = { head: [1, 2, 4, 6, 9, 13], body: [2, 4, 7, 11, 16, 22], legs: [1, 2, 4, 6, 9, 13] };
export const AR_K = 50, AR_SPECIAL = .7;
// 단계마다 [id, 이름, 재료] × 머리·상의·하의
export const AR_TABLE = [
  [['helmMoss', '이끼 두건', [['fiber', 6], ['rope', 1]]], ['armorMoss', '이끼 조끼', [['fiber', 10], ['rope', 2]]], ['legsMoss', '이끼 바지', [['fiber', 8], ['rope', 1]]]],
  [['helmCopper', '구리 투구', [['copperBar', 3], ['fiber', 2]]], ['armorCopper', '구리 갑옷', [['copperBar', 5], ['fiber', 4]]], ['legsCopper', '구리 각반', [['copperBar', 4], ['fiber', 3]]]],
  [['helmIron', '철 투구', [['ironBar', 3], ['rope', 1]]], ['armorIron', '철 갑옷', [['ironBar', 5], ['rope', 2]]], ['legsIron', '철 각반', [['ironBar', 4], ['rope', 1]]]],
  [['helmCrystal', '수정 투구', [['crystal', 4], ['ironBar', 1], ['cryGem', 1]]], ['armorCrystal', '수정 갑옷', [['crystal', 7], ['ironBar', 2], ['cryGem', 1]]], ['legsCrystal', '수정 각반', [['crystal', 5], ['ironBar', 2], ['cryGem', 1]]]],
  [['helmGold', '황금 투구', [['goldBar', 3], ['obsidian', 1]]], ['armorObsidian', '흑요석 갑옷', [['goldBar', 4], ['obsidian', 3]]], ['legsGold', '황금 각반', [['goldBar', 3], ['obsidian', 2]]]],
  [['helmFrost', '서리 투구', [['frostShard', 4], ['goldBar', 1]]], ['armorFrost', '서리 갑옷', [['frostShard', 7], ['goldBar', 2]]], ['legsFrost', '서리 각반', [['frostShard', 5], ['goldBar', 1]]]],
];
const AR_D = { head: '머리에 써요', body: '몸에 입어요', legs: '다리에 입어요' };
AR_TABLE.forEach((row, t) => row.forEach(([id, n, req], k) => { const sl = AR_SLOTS[k];
  ITEMS[id] = { n, kind: 'wear', slot: sl, stack: 1, def: AR_DEF[sl][t], rlv: WT_RLV[t], wtier: t, d: `${AR_D[sl]}. 받는 피해를 줄여 줘요.` }; RAR[id] = W_RAR[t];
  const r = Rc(id, 1, req, 'smelter', 'armor'); r.tier = t; r.cat = 'armor'; RECIPES.push(r); }));
for (const [id, t] of [['obsCoat', 4], ['frostRobe', 5], ['woolHat', 0], ['snowBrooch', 5]]) if (ITEMS[id]) ITEMS[id].def = Math.max(1, Math.round(AR_DEF[ITEMS[id].slot][t] * AR_SPECIAL));
