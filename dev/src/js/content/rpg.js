// ---- level, stats and skills ----
const MAX_LV = 30, XP_NEED = lv => 20 + (lv - 1) * 18;
const STATN = { str: ['힘', '근접 무기 피해 +5% · 캐는 힘 +3%'], dex: ['민첩', '활 피해 +3% · 공격 속도 +1% (최대 20%) · 이동 속도 +1%'], vit: ['체력', '최대 체력 +8 · 배고파지는 속도 −2%'], int: ['지혜', '지팡이·스킬 피해 +3.5% · 최대 기력 +6'] };
const SKILLS = {
  dash: { n: '구르기', act: 1, lv: 2, max: 3, mp: l => 12 - l * 2, cd: () => 1.4, d: l => `바라보는 쪽으로 데굴 굴러요. 구르는 동안은 다치지 않아요${l > 1 ? ` · 거리 +${(l - 1) * 15}%` : ''}` },
  spin: { n: '회전 베기', act: 1, lv: 3, max: 3, mp: () => 18, cd: l => 5.5 - l, d: l => `빙글 돌며 주변의 적을 모두 베요. 무기 피해의 ${130 + 30 * l}%` },
  bolt: { n: '빛 화살', act: 1, lv: 4, max: 3, mp: () => 12, cd: () => 1.1, d: l => `적을 꿰뚫는 빛 화살을 쏴요. 피해 ${10 + 6 * l} (지혜로 강해져요)` },
  quake: { n: '광맥 부수기', act: 1, lv: 5, max: 3, mp: l => 22 - l * 4, cd: () => 4, d: () => '바라보는 곳의 벽 3×3을 한 번에 캐요 (곡괭이 등급까지)' },
  heal: { n: '등불 치유', act: 1, lv: 6, max: 3, mp: () => 28, cd: l => 14 - l * 2, d: l => `따뜻한 빛으로 체력을 ${20 + 12 * l} 회복해요` },
  tough: { n: '튼튼한 몸', lv: 1, max: 3, d: l => `받는 피해 −${7 * l}%` },
  miner: { n: '광부의 손', lv: 1, max: 3, d: l => `캐는 힘 +${25 * l}%` },
  gourmet: { n: '든든한 배', lv: 2, max: 3, d: l => `배고파지는 속도 −${15 * l}% · 음식 효과 +${10 * l}%` },
  lucky: { n: '행운', lv: 3, max: 3, d: l => `재료가 하나 더 나올 확률 +${12 * l}%` },
  swift: { n: '날쌘 발', lv: 4, max: 3, d: l => `이동 속도 +${6 * l}%` },
};
// v44: two more skills each for general · magic · bow; skills are grouped by kind in the 능력 panel
Object.assign(SKILLS, {
  stomp: { n: '땅울림', act: 1, lv: 7, max: 3, mp: () => 16, cd: l => 8 - l, d: l => `발을 쿵 굴러 둘레 2.5칸의 적을 멀리 밀쳐내고 느리게 해요. 무기 피해의 ${70 + 20 * l}%` },
  warrior: { n: '전사의 기술', lv: 8, max: 3, d: l => `근접 무기 피해 +${6 * l}% · 근접 공격 속도 +${3 * l}%` },
  volley: { n: '화살비', act: 1, lv: 9, max: 3, mp: () => 20, cd: l => 7 - l, d: l => `활로 화살 ${3 + 2 * l}발을 부채꼴로 쏴요. 한 발에 활 피해의 ${50 + 10 * l}% (활을 들고 있어야 해요)` },
  hawk: { n: '매의 눈', lv: 10, max: 3, d: l => `활 피해 +${8 * l}% · 활 사거리 +${15 * l}%` },
  frostRing: { n: '서리 고리', act: 1, lv: 11, max: 3, mp: () => 24, cd: () => 8, d: l => `둘레 3칸에 서리를 퍼뜨려 피해 ${12 + 8 * l}를 주고 꽁꽁 얼려요 (지혜로 강해져요)` },
  arcane: { n: '마력 순환', lv: 12, max: 3, d: l => `최대 기력 +${8 * l} · 마법 피해 +${6 * l}%` },
});
const SK_CAT = [['gen', '일반', ['dash', 'spin', 'stomp', 'tough', 'warrior', 'swift']], ['magic', '마법', ['bolt', 'heal', 'frostRing', 'arcane']], ['bow', '활', ['volley', 'hawk']], ['life', '생활', ['quake', 'miner', 'gourmet', 'lucky']]];
Object.assign(UICON, {
  quest: A => { A.r(3, 2, 10, 12, '#f0e2c8'); A.r(3, 2, 10, 1, '#fff7e8'); A.r(2, 1, 12, 2, '#c9a878'); A.r(2, 13, 12, 2, '#c9a878'); for (const y of [5, 7, 9]) A.r(5, y, 6, 1, '#8a7a6a'); A.p(11, 11, '#e0552a'); A.p(10, 11, '#ff8a3d'); },
  star: A => { A.poly([[8, 1], [10, 6], [15, 6], [11, 9.5], [12.5, 15], [8, 11.5], [3.5, 15], [5, 9.5], [1, 6], [6, 6]], C.amber); A.poly([[8, 3], [9.3, 6.8], [8, 9]], '#fff1b0'); A.p(7, 7, '#fff7d6'); },
  sk_dash: A => { A.e(10.5, 9, 4.5, 4.5, C.mint); A.e(9.5, 7.6, 1.8, 1.4, C.mintL); A.p(12, 8, INK); A.line(1, 6, 5, 6, C.cream); A.line(0, 9, 4, 9, C.cream); A.line(1, 12, 5, 12, C.cream); },
  sk_spin: A => { for (let k = 0; k < 22; k++) { const a = k / 22 * 5.2 + .5; A.r(Math.round(8 + Math.cos(a) * 5.5), Math.round(8 + Math.sin(a) * 5.5), 2, 1, C.cream); } A.poly([[2, 3], [6, 3], [4, 7]], C.cream); A.line(6, 10, 10, 6, C.ironL, 2); A.p(5, 11, C.woodD); },
  sk_bolt: A => { A.line(2, 14, 11, 5, '#fff1b0', 2); A.poly([[9, 3], [15, 1], [13, 7]], '#ffd25c'); A.p(4, 6, '#fff7d6'); A.p(12, 12, '#fff7d6'); A.p(6, 3, '#ffd25c'); },
  sk_quake: A => { A.e(8, 10, 6.5, 4.6, C.stone); A.e(6.5, 8.5, 2.6, 1.4, C.stoneL); A.line(5, 7, 8, 10, INK); A.line(8, 10, 7, 14, INK); A.line(8, 10, 12, 8, INK); A.p(2, 3, C.amber); A.p(14, 2, C.amber); A.p(8, 2, C.amber); },
  sk_heal: A => { UICON.heart(A); A.r(7, 4, 2, 6, '#ffffff'); A.r(5, 6, 6, 2, '#ffffff'); },
  sk_tough: A => { A.poly([[3, 2], [13, 2], [13, 8], [8, 14.5], [3, 8]], C.ironD); A.poly([[4, 3], [12, 3], [12, 8], [8, 13], [4, 8]], C.iron); A.r(7, 4, 2, 7, C.rose); A.r(5, 6, 6, 2, C.rose); },
  sk_miner: pickIcon(C.copper, C.copperL),
  sk_gourmet: ICON.pie,
  sk_lucky: A => { for (const [x, y] of [[5.5, 5.5], [10.5, 5.5], [5.5, 10.5], [10.5, 10.5]]) A.e(x, y, 3, 3, C.leaf); A.p(4, 4, C.leafL); A.p(9, 4, C.leafL); A.e(8, 8, 1.6, 1.6, C.leafD); A.line(9, 10, 13, 15, C.leafD); },
  sk_swift: A => { A.poly([[3, 13], [6, 3], [11, 1], [9, 6], [14, 5], [9, 11]], '#e8f0ff'); A.line(3, 13, 10, 4, '#9fb6e0'); A.p(13, 2, C.amber); A.p(14, 9, C.amber); },
  sk_stomp: A => { A.e(8, 13, 7, 2.4, C.stone); A.e(8, 12.6, 5, 1.5, C.stoneL); A.r(6, 3, 4, 8, '#8a5a3e'); A.r(5, 9, 6, 3, '#6b4430'); A.line(1, 8, 3, 10, C.cream); A.line(15, 8, 13, 10, C.cream); A.line(2, 5, 4, 7, C.cream); A.line(14, 5, 12, 7, C.cream); },
  sk_warrior: A => { A.line(3, 13, 12, 4, C.ironL, 2); A.line(4, 13, 13, 4, C.iron, 1); A.line(13, 13, 4, 4, C.ironL, 2); A.line(12, 13, 3, 4, C.iron, 1); A.r(2, 12, 3, 3, C.woodD); A.r(11, 12, 3, 3, C.woodD); A.p(8, 8, C.amber); },
  sk_volley: A => { for (const [x, y] of [[2, 12], [5, 14], [1, 8]]) { A.line(x, y, x + 9, y - 9, '#8a6a52'); A.p(x + 9, y - 9, C.ironL); A.p(x + 10, y - 10, '#ffffff'); } A.p(13, 2, C.amber); },
  sk_hawk: A => { A.e(8, 8, 6.5, 4, '#f0e2c8'); A.e(8, 8, 3, 3, '#ffd25c'); A.e(8, 8, 1.4, 1.4, INK); A.p(7, 7, '#ffffff'); A.line(1, 8, 3, 8, '#c9a878'); A.line(13, 8, 15, 8, '#c9a878'); },
  sk_frostRing: A => { for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; A.p(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), k % 3 ? '#9fd8f0' : '#ffffff'); } for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; A.line(8, 8, 8 + Math.cos(a) * 3, 8 + Math.sin(a) * 3, '#d4f6ff'); } },
  sk_arcane: A => { A.e(8, 8, 6, 6, '#3a2f68'); A.e(8, 8, 4.5, 4.5, '#6b5bc8'); A.e(8, 8, 2.4, 2.4, '#bfa8ff'); A.p(7, 6, '#ffffff'); for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + .4; A.p(Math.round(8 + Math.cos(a) * 7), Math.round(8 + Math.sin(a) * 7), '#ffd25c'); } },
});
// skill points earned by a level: one per level up, plus a bonus one at the top level (10 skills × 3 steps = 30)
const spDue = lv => lv - 1 + (lv >= MAX_LV ? 1 : 0);
const freshRpg = () => ({ lv: 1, xp: 0, pts: 0, sp: 0, str: 0, dex: 0, vit: 0, int: 0, sk: {}, slot: [null, null] });
function cleanRpg(r) {
  const f = freshRpg(); if (!r || typeof r !== 'object') return f;
  for (const k of ['lv', 'xp', 'pts', 'sp', 'str', 'dex', 'vit', 'int']) f[k] = Math.max(0, Math.floor(+r[k] || 0)); f.lv = clamp(f.lv || 1, 1, MAX_LV);
  if (r.sk && typeof r.sk === 'object') for (const k in r.sk) if (SKILLS[k]) { const l = clamp(Math.floor(+r.sk[k] || 0), 0, SKILLS[k].max); if (l) f.sk[k] = l; }
  const spent = Object.values(f.sk).reduce((a, l) => a + l, 0), due = spDue(f.lv); if (spent + f.sp < due) f.sp = due - spent; // older saves at the top level never got the bonus point
  if (Array.isArray(r.slot)) f.slot = [0, 1].map(i => { const k = r.slot[i]; return SKILLS[k] && SKILLS[k].act && f.sk[k] ? k : null; });
  return f;
}
const skl = k => (G && G.rpg && G.rpg.sk[k]) || 0;
const RS = k => (G && G.rpg ? G.rpg[k] : 0);
const maxHp = () => 100 + RS('vit') * 8 + bval('maxhp');
const maxMp = () => 40 + RS('int') * 6 + skl('arcane') * 8;
const meleeMul = () => (1 + RS('str') * 0.05) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('warrior') * .06);
const rangeMul = () => (1 + RS('dex') * 0.03) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('hawk') * .08);
const magicMul = () => (1 + RS('int') * 0.035) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('arcane') * .06);
const atkSpd = () => (1 - Math.min(0.2, RS('dex') * 0.01)) * (envLv('cold') >= 2 ? 1.1 : 1);
const moveMul = () => (1 + Math.min(0.15, RS('dex') * 0.01) + skl('swift') * 0.06) * (1 + bval('move')) * [1, .9, .8, .8][envLv('cold')];
const mineMul = () => (1 + RS('str') * 0.03) * (1 + skl('miner') * 0.25) * (1 + bval('mine')) * (1 + ringV('mine'));
const hungerMul = () => Math.max(0.4, (1 - Math.min(0.3, RS('vit') * 0.02)) * (1 - skl('gourmet') * 0.15)) * (bval('hunger') || 1) * [1, 1.3, 1.6, 1.6][envLv('hot')];
function gainXp(n, x, y) {
  const R = G && G.rpg; if (!R || !(n > 0) || R.lv >= MAX_LV) return; n = Math.max(n, Math.round(n * (1 + bval('xp') + ringV('xp')))); R.xp += n;
  if (x != null && n >= 3) ftext(x, y - 0.9, `+${n} 경험치`, '#b8e0ff');
  let up = 0; while (R.lv < MAX_LV && R.xp >= XP_NEED(R.lv)) { R.xp -= XP_NEED(R.lv); R.lv++; R.pts += 2; R.sp += 1; up++; }
  if (R.lv >= MAX_LV) { R.xp = 0; if (up) R.sp += 1; } // reaching the top level gives one more skill point (since v44 there are more skills than points: 스킬 다시 배우기 is free)
  if (up) { const p = G.p; p.hp = maxHp(); p.mp = maxMp(); puff(p.x, p.y - .5, '#ffe9a8', 26, 3.5, .8); ftext(p.x, p.y - 1.6, `Lv.${R.lv}!`, '#ffd25c'); SFX.seed(); toast(R.lv >= MAX_LV ? `최고 레벨 Lv.${R.lv}! 보너스 스킬 포인트 +1 · [능력]에서 올려요` : `레벨 업! Lv.${R.lv} · [능력]에서 능력치와 스킬을 올려요`, 'good'); if (panel && panel.kind === 'stat') renderPanel(); }
}
const CATCH = { 0: [['minnow', 50], ['crucian', 34], ['boot', 10], ['koi', 6]], 1: [['catfish', 44], ['sporeEel', 30], ['minnow', 12], ['boot', 8], ['koi', 6]], 2: [['smelt', 46], ['shrimp', 30], ['crystal', 8], ['boot', 6], ['koi', 10]] };
const WATER = 10;
const ENEMY = {
  slimeG: { n: '초록 말랑이', hp: 14, dmg: 6, spd: 2.6, r: 0.32, hop: 1, drops: [['gel', 1, 1, 0.7]], col: '#86d96b' },
  slimeO: { n: '주황 말랑이', hp: 30, dmg: 10, spd: 2.8, r: 0.34, hop: 1, drops: [['gel', 1, 2, 0.8]], col: '#f2a65a' },
  slimeP: { n: '보라 말랑이', hp: 55, dmg: 15, spd: 3.0, r: 0.36, hop: 1, drops: [['gel', 1, 2, 0.8], ['crystal', 1, 1, 0.4]], col: '#b58cf0' },
  shroomy: { n: '버섯도깨비', hp: 24, dmg: 9, spd: 2.1, r: 0.3, hop: 0, drops: [['mushroom', 1, 2, 0.8], ['spore', 1, 1, 0.35]], col: '#a65fd1' },
};


