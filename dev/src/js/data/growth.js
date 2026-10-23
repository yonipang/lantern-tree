// ================= v99 성장 확장 2: 무기 6종 × 6단계 + 착용 레벨 + 보스 특별 무기 6종씩 (dev/design/성장확장.md 2장) =================
// 단계(0~5) = 작업대·장비제작대 단계(나무 · 구리 · 철 · 수정 · 금·흑요석 · 서리). 7~9단계는 가장 깊은 곳·그림자 틈을 만들 때.
// 공격력 = 그 단계 검 공격력 × 종류 배율(반올림). 지금 무기도 이 표대로 고쳐요(이름·id 그대로). 도끼는 도구라 이 표 밖이에요.
// 이 파일은 data/automation-tiers.js 뒤에 있어서 「지형 재료 2배」·레시피 단계 나누기가 적용되지 않아요 — 재료 개수와 단계(tier)를 여기 적힌 그대로 써요.
import { DUR } from './circuits-regions.js';
import { ITEMS, RAR, RECIPES, Rc } from './items.js';
import { ENEMY, SK_CAT, SKILLS } from './rpg-nature.js';
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
// ================= v101 성장 확장 4: 새 몬스터 15종 (지금 있는 5지역에 3종씩, dev/design/성장확장.md 4장) =================
// 움직임은 지금 있는 것(뛰기·걷기·탄·위험 지대·느려짐)을 섞어서: ai 이름별 동작은 sim/monsters.js MON_AI
// 경험치는 지금처럼 기본 체력의 절반. 지역 난이도 배율(REGION_HP·REGION_DMG)도 그대로 곱해요.
Object.assign(ENEMY, {
  // 이끼 동굴 (Lv.1~10)
  moleMoss: { n: '이끼 두더지', hp: 22, dmg: 7, spd: 2.4, r: 0.32, hop: 0, ai: 'burrow', drops: [['dirt', 1, 2, 0.8], ['fiber', 1, 1, 0.4]], col: '#8a6a52' },
  fireflyMoss: { n: '반딧벌레', hp: 6, dmg: 3, spd: 3.6, r: 0.22, hop: 0, pack: 3, drops: [['glowcap', 1, 1, 0.25]], col: '#e8f08a' },
  vineRoot: { n: '뿌리 덩굴', hp: 30, dmg: 8, spd: 0, r: 0.36, hop: 0, ai: 'lash', reach: 1.9, drops: [['wood', 1, 2, 0.7], ['fiber', 1, 2, 0.5]], col: '#6a9a4a' },
  // 버섯숲 (Lv.8~18)
  sporeShroom: { n: '포자 버섯', hp: 34, dmg: 9, spd: 1.9, r: 0.3, hop: 0, ai: 'spore', drops: [['spore', 1, 2, 0.7], ['mushroom', 1, 1, 0.5]], col: '#c58cf0' },
  shroomTurtle: { n: '버섯 거북', hp: 60, dmg: 12, spd: 1.4, r: 0.38, hop: 0, ai: 'shell', drops: [['shroomCap', 1, 2, 0.7], ['resin', 1, 1, 0.3]], col: '#b673de' },
  toadPoison: { n: '독 개구리', hp: 40, dmg: 10, spd: 4.2, r: 0.32, hop: 1, air: .6, ai: 'toad', drops: [['gel', 1, 2, 0.7], ['spore', 1, 1, 0.4]], col: '#7fd06a' },
  // 수정 동굴 (Lv.15~28)
  crySpider: { n: '수정 거미', hp: 70, dmg: 14, spd: 2.8, r: 0.34, hop: 0, ai: 'web', aggro: 6, drops: [['rope', 1, 2, 0.6], ['crystal', 1, 1, 0.4]], col: '#9a8ad0' },
  mirrorCry: { n: '거울 수정', hp: 80, dmg: 16, spd: 0.6, r: 0.34, hop: 0, ai: 'beam', aggro: 6.5, drops: [['crystal', 1, 2, 0.8], ['cryGem', 1, 1, 0.25]], col: '#d6c2ff' },
  crySnail: { n: '수정 달팽이', hp: 160, dmg: 12, spd: 0.9, r: 0.38, hop: 0, drops: [['crystal', 2, 4, 1], ['cryGem', 1, 1, 0.4], ['granite', 1, 2, 0.5]], col: '#b493f5' },
  // 용암 동굴 (Lv.25~40)
  lavaSala: { n: '용암 도롱뇽', hp: 120, dmg: 22, spd: 2.9, r: 0.34, hop: 0, ai: 'trail', aggro: 6.5, drops: [['obsidian', 1, 1, 0.3], ['fireBerry', 1, 1, 0.3]], col: '#ff6a2a' },
  bombSlime: { n: '화산탄 말랑이', hp: 70, dmg: 18, spd: 3.1, r: 0.34, hop: 1, ai: 'bomb', aggro: 6.5, drops: [['gel', 1, 2, 0.6], ['goldOre', 1, 1, 0.3]], col: '#e8501f' },
  obsGolem: { n: '작은 흑요석 골렘', hp: 170, dmg: 26, spd: 1.8, r: 0.38, hop: 0, ai: 'charge', aggro: 6.5, drops: [['obsidian', 1, 2, 0.8], ['basalt', 1, 2, 0.5]], col: '#4a3a5a' },
  // 얼음 동굴 (Lv.35~50)
  frostWolf: { n: '서리 늑대', hp: 110, dmg: 22, spd: 4.2, r: 0.34, hop: 0, pack: 2, aggro: 6.5, drops: [['wool', 1, 1, 0.3], ['frostShard', 1, 1, 0.35]], col: '#cfe6f4' },
  icicleSprite: { n: '고드름 정령', hp: 90, dmg: 18, spd: 1.6, r: 0.3, hop: 0, ai: 'icicle', aggro: 7, drops: [['frostShard', 1, 2, 0.5], ['iceBlock', 1, 1, 0.4]], col: '#9fd8f0' },
  yetiBaby: { n: '아기 설인', hp: 150, dmg: 24, spd: 2.0, r: 0.38, hop: 0, ai: 'throw', aggro: 6.5, drops: [['wool', 1, 2, 0.5], ['frostShard', 1, 1, 0.4]], col: '#f4f8ff' },
});
// 지역별 나오는 몬스터와 비율 (지금 몬스터 비율은 조금 줄어요)
export const MON_TABLE = [
  [['slimeG', .55], ['moleMoss', .25], ['vineRoot', .2]], // v135: 반딧벌레(fireflyMoss)는 안 나와요(사용자 요청) — 그 몫 15%를 셋에 나눔. 몬스터 정의는 남겨 둠
  [['slimeO', .35], ['shroomy', .25], ['sporeShroom', .15], ['shroomTurtle', .12], ['toadPoison', .13]],
  [['slimeP', .45], ['shroomy', .15], ['crySpider', .15], ['mirrorCry', .12], ['crySnail', .13]],
  [['magmaSlime', .35], ['cinder', .25], ['lavaSala', .15], ['bombSlime', .13], ['obsGolem', .12]],
  [['frostSlime', .35], ['snowling', .25], ['frostWolf', .15], ['icicleSprite', .12], ['yetiBaby', .13]],
];
// ================= v102 성장 확장 5: 새 스킬 26개 (dev/design/성장확장.md 5장) =================
// 지금처럼 스킬마다 3단계, 스킬 포인트는 레벨마다 1점. 무기 전용 스킬은 그 종류 무기를 들어야 써요(sim/skills.js). 동작은 sim/skills.js, 항상 효과는 각 규칙 파일(skl('이름')).
Object.assign(SKILLS, {
  // 검
  lunge: { n: '돌진 베기', act: 1, lv: 14, max: 3, mp: () => 14, cd: l => 6 - l, d: l => `검을 들고 앞으로 2.5칸 돌진하며 지나는 적을 베요. 무기 피해의 ${120 + 30 * l}% (검을 들고 있어야 해요)` },
  parry: { n: '받아치기 자세', lv: 30, max: 3, d: l => `검을 들면 받는 피해 −${4 * l}% · 맞은 뒤 3초 안의 다음 공격 피해 +${25 * l}%` },
  // 단검
  shadowStep: { n: '그림자 걸음', act: 1, lv: 18, max: 3, mp: () => 16, cd: l => 7 - l, d: l => `가장 가까운 적(6칸) 뒤로 순간이동해 치명타로 찔러요. 무기 피해의 ${150 + 40 * l}% (단검을 들고 있어야 해요)` },
  vital: { n: '급소 노리기', lv: 22, max: 3, d: l => `단검을 들면 치명타 확률 +${5 * l}%` },
  // 창
  pierceDash: { n: '꿰뚫기 돌진', act: 1, lv: 16, max: 3, mp: () => 16, cd: l => 7 - l, d: l => `창을 들고 4칸을 꿰뚫으며 돌진해요. 무기 피해의 ${130 + 30 * l}% (창을 들고 있어야 해요)` },
  longArm: { n: '긴 팔', lv: 26, max: 3, d: l => `창 사거리 +${15 * l}%` },
  // 망치
  heavyHand: { n: '무거운 손', lv: 20, max: 3, d: l => `망치로 때리면 ${10 * l}% 확률로 적이 1초 기절해요` },
  earthquake: { n: '지진', act: 1, lv: 24, max: 3, mp: () => 26, cd: l => 11 - l, d: l => `망치로 땅을 내리쳐 둘레 3.5칸의 적에게 무기 피해의 ${150 + 40 * l}%를 주고 1초 기절시켜요 (망치를 들고 있어야 해요)` },
  // 활
  pierceArrow: { n: '꿰뚫는 화살', act: 1, lv: 20, max: 3, mp: () => 14, cd: l => 5 - l * .5, d: l => `적 셋을 꿰뚫는 화살 한 발. 활 피해의 ${180 + 40 * l}% (활을 들고 있어야 해요)` },
  trapArrow: { n: '덫 화살', act: 1, lv: 32, max: 3, mp: () => 18, cd: () => 9, d: l => `가장 가까운 적(사거리 안) 둘레 2칸을 끈적하게 해 ${3 + l}초 동안 느리게 해요 (활을 들고 있어야 해요)` },
  // 마법
  fireball: { n: '불꽃 구슬', act: 1, lv: 15, max: 3, mp: () => 14, cd: () => 1.6, d: l => `불타는 구슬을 쏴요. 피해 ${14 + 8 * l} + 불꽃 (지혜로 강해져요)` },
  chain: { n: '번개 사슬', act: 1, lv: 28, max: 3, mp: () => 22, cd: l => 7 - l, d: l => `가장 가까운 적에게 번개가 떨어지고 3칸 안의 적 ${2 + l}마리에게 더 튀어요. 피해 ${16 + 8 * l} (지혜로 강해져요)` },
  lightShield: { n: '빛 방패', act: 1, lv: 35, max: 3, mp: () => 24, cd: () => 16, d: l => `8초 동안 피해 ${30 + 15 * l}를 대신 받아 주는 빛 방패` },
  orbFriend: { n: '빛 구슬 친구', act: 1, lv: 45, max: 3, mp: () => 30, cd: () => 24, d: l => `${12 + 4 * l}초 동안 빛 구슬이 따라다니며 0.8초마다 가까운 적을 스스로 쏴요. 피해 ${8 + 4 * l} (지혜로 강해져요)` },
  // 일반
  sprint: { n: '질주', act: 1, lv: 13, max: 3, mp: () => 10, cd: () => 10, d: l => `${4 + l}초 동안 이동 속도 +40%` },
  leech: { n: '생명 흡수', lv: 38, max: 3, d: l => `적을 물리치면 최대 체력의 ${2 * l + 1}%를 회복해요` },
  secondWind: { n: '두 번째 숨', lv: 40, max: 3, d: l => `기절할 피해를 받아도 체력 1로 한 번 버텨요 (${150 - 30 * l}초마다 한 번)` },
  // 생활
  farmer: { n: '농부의 손', lv: 10, max: 3, d: l => `작물이 ${10 * l}% 빨리 자라요` },
  fisher: { n: '낚시꾼', lv: 12, max: 3, d: l => `물고기가 ${12 * l}% 빨리 물고, 당길 수 있는 시간 +${15 * l}%` },
  chef: { n: '요리사', lv: 17, max: 3, d: l => `음식 버프가 ${15 * l}% 오래가요` },
  porter: { n: '짐꾼', lv: 25, max: 3, d: l => `가방 칸 +${3 * l}` },
  animalFriend: { n: '동물 친구', lv: 30, max: 3, d: l => `펫 효과 강화: 강아지 끌어오는 거리 +${25 * l}% · 토끼 추가 드롭 +${10 * l}%${l >= 2 ? ' · 고양이 행운 +1' : ''}` },
  // 큰 스킬 (Lv.50~)
  dawnLight: { n: '새벽빛', act: 1, lv: 55, max: 3, mp: () => 40, cd: () => 20, d: l => `빛이 터져 둘레 4칸의 적에게 피해 ${40 + 20 * l} (그림자 몬스터에게 2배, 지혜로 강해져요)` },
  starRain: { n: '별빛 화살비', act: 1, lv: 65, max: 3, mp: () => 44, cd: () => 22, d: l => `가장 가까운 적(8칸) 둘레 3.5칸에 별빛 화살 ${8 + 4 * l}발이 떨어져요. 한 발 피해 ${12 + 6 * l} (지혜로 강해져요)` },
  awaken: { n: '등불지기의 각성', act: 1, lv: 70, max: 3, mp: () => 50, cd: () => 60, d: l => `${8 + 2 * l}초 동안 모든 스킬의 기다리는 시간이 2배 빨리 줄어요` },
  earthSplit: { n: '대지 가르기', act: 1, lv: 75, max: 3, mp: () => 48, cd: () => 18, d: l => `바라보는 쪽 6칸을 한 줄로 가르며 적에게 무기 피해의 ${200 + 50 * l}%와 1초 기절` },
});
SK_CAT.length = 0; SK_CAT.push(
  ['gen', '일반', ['dash', 'spin', 'stomp', 'sprint', 'tough', 'warrior', 'swift', 'leech', 'secondWind']],
  ['sword', '검', ['lunge', 'parry']], ['dagger', '단검', ['shadowStep', 'vital']], ['spear', '창', ['pierceDash', 'longArm']], ['hammer', '망치', ['earthquake', 'heavyHand']],
  ['bow', '활', ['volley', 'pierceArrow', 'trapArrow', 'hawk']],
  ['magic', '마법', ['bolt', 'heal', 'frostRing', 'fireball', 'chain', 'lightShield', 'orbFriend', 'arcane']],
  ['life', '생활', ['quake', 'miner', 'gourmet', 'lucky', 'farmer', 'fisher', 'chef', 'porter', 'animalFriend']],
  ['ult', '큰 스킬', ['dawnLight', 'starRain', 'awaken', 'earthSplit']]);
