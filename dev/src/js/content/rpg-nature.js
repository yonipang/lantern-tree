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


// ---- petals & flower critters (bloomlings) living in zones of the moss caves ----
const FLOWERS = { R: ['빨강', '빨간', '#ff6b81', '#ffb3c0', '#d0485e'], B: ['파랑', '파란', '#6fa8ff', '#c2dcff', '#4a78d0'], Y: ['노랑', '노란', '#ffd25c', '#fff1b0', '#d9a53a'], W: ['하양', '하얀', '#f4f0f8', '#ffffff', '#c9c0d6'], K: ['까망', '검은', '#4a3f5c', '#8a7aa6', '#2a2238'] };
const petalIcon = (c, cL, cD) => A => { A.e(6, 9, 3.2, 4.6, c); A.e(10.5, 7.5, 2.6, 3.8, cD); A.e(10.5, 7, 1.8, 2.8, c); A.p(5, 7, cL); A.p(6, 6, cL); A.p(10, 5, cL); A.line(6, 13, 6, 14, C.leafD); };
for (const c in FLOWERS) { const [n, adj, col, cL, cD] = FLOWERS[c];
  ITEMS['petal' + c] = { n: `${adj} 꽃잎`, d: `${n} 꽃망울이 떨어뜨리는 꽃잎. 자연 꾸미기 재료예요.` };
  ICON['petal' + c] = petalIcon(col, cL, cD);
  ENEMY['bloom' + c] = c === 'K' ? { n: `${n} 꽃망울`, hp: 46, dmg: 11, spd: 2.2, r: 0.3, hop: 0, calm: 1, drops: [['petalK', 1, 2, 1], ['petalR', 1, 1, 0.3]], col }
    : { n: `${n} 꽃망울`, hp: 18, dmg: 6, spd: 1.9, r: 0.3, hop: 0, calm: 1, drops: [['petal' + c, 1, 2, 1], ['berrySeed', 1, 1, 0.08]], col }; }
function bloomSpr(c, cL, cD) {
  return mk(16, 16, A => { A.line(8, 12, 8, 15, C.leafD); A.e(5, 14, 2, 1, C.leaf); A.e(11, 14, 2, 1, C.leaf);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 - 1.57; A.e(8 + Math.cos(a) * 4.4, 7.5 + Math.sin(a) * 4, 2.4, 2.3, k % 2 ? c : cD); }
    A.e(8, 7.5, 3.3, 3, C.cream); A.p(7, 7, INK); A.p(9, 7, INK); A.p(6, 8, C.blush); A.p(10, 8, C.blush); A.p(5, 3, cL); A.p(11, 3, cL); });
}
const wildSpr = (c, cL) => mk(16, 16, A => { A.line(5, 14, 5, 9, C.leafD); A.line(9, 14, 10, 8, C.leafD); A.line(12, 14, 12, 10, C.leaf); A.e(4, 13, 1.6, .8, C.leaf); A.e(10, 13.5, 1.6, .8, C.leaf);
  for (const [x, y] of [[5, 8], [10, 7], [12, 9.5]]) { A.e(x - 1.2, y, 1.1, 1.1, c); A.e(x + 1.2, y, 1.1, 1.1, c); A.e(x, y - 1.2, 1.1, 1.1, c); A.e(x, y + 1.2, 1.1, 1.1, c); A.p(Math.round(x), Math.round(y), '#ffd25c'); } A.p(9, 6, cL); }, 'soft');
OBJ.wildF = { n: '들꽃', hp: 1, nat: 'cut', drops: [] };
function genFlowerZones() {
  const R = rng((G.seed | 0) * 7 + 99), zones = [];
  for (const c of ['R', 'B', 'Y', 'W', 'K', 'R', 'B', 'Y', 'W', 'K']) {
    for (let tries = 0; tries < 1200; tries++) {
      const loose = tries >= 500, far = c === 'K', a = R() * 6.283, d = loose ? 14 + R() * 50 : (far ? 40 : 16) + R() * (far ? 22 : 28), x = Math.floor(CX + Math.cos(a) * d), y = Math.floor(CY + Math.sin(a) * d);
      if (x < 4 || y < 4 || x >= W - 4 || y >= H - 4 || G.biome[idx(x, y)] !== 0) continue;
      if (zones.some(z => Math.hypot(z.x - x, z.y - y) < (loose ? 10 : 13)) || Math.hypot(x - BX, y - BY) < 12) continue;
      let open = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = idx(x + dx, y + dy); if (!G.wall[j] && G.floor[j] !== WATER) open++; }
      if (open < (loose ? 12 : 17)) continue;
      zones.push({ x, y, c, dead: [] });
      for (let k = 0; k < 14; k++) { const fx = x + Math.round((R() - .5) * 7), fy = y + Math.round((R() - .5) * 7), j = idx(fx, fy); if (!G.wall[j] && !G.objs.get(j) && [1, 2].includes(G.floor[j])) G.objs.set(j, { t: 'wildF', c }); }
      break;
    }
  }
  return zones;
}
const cleanZones = zs => zs.filter(z => z && Number.isInteger(z.x) && Number.isInteger(z.y) && FLOWERS[z.c]).map(z => ({ x: z.x, y: z.y, c: z.c, dead: Array.isArray(z.dead) ? z.dead.filter(Number.isFinite) : [] }));
function zoneTick() {
  const p = G.p; if (p.dead > 0 || !G.fzones) return;
  G.fzones.forEach((z, zi) => {
    z.dead = z.dead.filter(t => t > G.time);
    if (Math.hypot(z.x + .5 - p.x, z.y + .5 - p.y) > 26 || (z.next || 0) > G.time) return;
    const alive = G.enemies.reduce((n, e) => n + (e.zone === zi ? 1 : 0), 0), cap = z.c === 'K' ? 2 : 3;
    if (alive + z.dead.length >= cap) return;
    for (let k = 0; k < 10; k++) { const x = Math.floor(z.x + (Math.random() - .5) * 6), y = Math.floor(z.y + (Math.random() - .5) * 6);
      if (!inB(x, y) || isSolid(x, y) || Math.hypot(x + .5 - p.x, y + .5 - p.y) < 3.5) continue;
      const e = mkEnemy('bloom' + z.c, x + .5, y + .6); e.zone = zi; G.enemies.push(e); puff(x + .5, y + .4, FLOWERS[z.c][2], 8, 2, .3); z.next = G.time + 1.5; break; }
  });
}
// ---- saplings, stumps and regrowth ----
Object.assign(OBJ, {
  sapling: { n: '뿌리기둥 묘목', growTo: 'root', into: '뿌리기둥' },
  capSapling: { n: '아기 큰버섯', growTo: 'bigShroom', into: '큰버섯' },
  stump: { n: '그루터기', growTo: 'g', stump: 1, into: '뿌리기둥' },
  capStump: { n: '버섯 밑동', growTo: 'g', stump: 1, into: '큰버섯' },
});
Object.assign(ITEMS, {
  sapling: { n: '뿌리기둥 묘목', kind: 'seed', crop: 'sapling', d: '흙·이끼·버섯흙 바닥에 심으면 3분쯤 뒤 뿌리기둥으로 자라요.' },
  capSapling: { n: '아기 큰버섯', kind: 'seed', crop: 'capSapling', d: '흙·이끼·버섯흙 바닥에 심으면 3분쯤 뒤 큰버섯으로 자라요.' },
  berryBush: { n: '베리덤불', kind: 'place', obj: 'bush', d: '삽으로 퍼 온 베리덤불. 원하는 곳에 옮겨 심으면 다시 열매가 열려요.' },
});
OBJ.root.drops.push(['sapling', 1, 1, 0.22]); OBJ.bigShroom.drops.push(['capSapling', 1, 1, 0.22]);
const GROW_TIME = 180, REGROW_TIME = 240, YOUNG_T = 60; // each tree step lasts YOUNG_T: sapling → young sapling → young tree → grown (stumps wait one step first)
const YOUNG_TREES = ['root', 'bigShroom', 'cherryTree', 'roundTree', 'bigTree'];
const isYoung = o => !!(o && o.yg && G.time < o.yg);
// -1 bare stump, 0 sapling, 1 young sapling, 2 young tree (can be cut for a little wood), 3 grown. Worked out from times already saved, so old saves need nothing new
function treeStep(o) { const d = OBJ[o.t]; if (d.growTo) { const r = (o.at || 0) - G.time; return d.stump && r > 3 * YOUNG_T ? -1 : r > 2 * YOUNG_T ? 0 : 1; } return isYoung(o) ? 2 : 3; }
const youngDrops = drops => drops.filter(([id, , , ch]) => ch >= 1 && !['sapling', 'capSapling', 'resin'].includes(id)).map(([id, a, b]) => [id, Math.max(1, Math.ceil(a / 2)), Math.max(1, Math.ceil(b / 2)), 1]);
Object.assign(OSPR, {
  sapling: [16, 16, A => { A.e(8, 14, 3, 1, C.dirtD); A.line(8, 14, 8, 9, C.woodD); A.e(6.2, 9, 2, 1.4, C.leaf); A.e(9.8, 8, 2, 1.4, C.leafL); A.p(8, 8, C.leafL); }],
  saplingB: [16, 18, A => { A.e(8, 16.5, 3.2, 1, C.dirtD); A.r(7, 9, 2, 8, C.wood); A.r(7, 9, 1, 8, C.woodL); A.line(9, 12, 11, 10, C.wood); A.p(11, 9, C.leafL); A.e(8, 7, 4.6, 4, C.leafD); A.e(7, 6, 3.4, 2.8, C.leaf); A.e(6, 4.8, 1.4, 1, C.leafL); A.p(10, 5, C.leafL); }],
  capSapling: [16, 16, A => { A.e(8, 14, 3, 1, '#7a5aa0'); A.r(7, 10, 2, 4, C.cream); A.e(8, 9.5, 3.2, 2.2, '#b673de'); A.p(7, 9, '#fbe7ff'); }],
  capSaplingB: [16, 17, A => { A.e(8, 15.5, 3.4, 1.1, '#7a5aa0'); A.r(6, 8, 4, 8, C.cream); A.r(9, 8, 1, 8, '#e5d3b5'); A.e(8, 7, 5.4, 3.6, '#a8584a'); A.e(8, 6, 4.8, 3, '#e07b5f'); A.p(6, 5, C.cream); A.p(10, 4, C.cream); A.p(8, 6, C.cream); }],
  stump: [16, 16, A => { A.e(8, 13, 5.5, 2.2, C.woodD); A.r(3, 9, 10, 4, C.wood); A.r(3, 9, 2, 4, C.woodL); A.e(8, 9, 5, 2, '#e8b97a'); A.e(8, 9, 3, 1.2, '#c99560'); A.p(8, 9, C.woodD); A.line(2, 13, 4, 11, C.woodD); A.line(11, 8, 12, 5, C.leaf); A.p(13, 5, C.leafL); }],
  capStump: [16, 16, A => { A.e(8, 13.5, 4, 1.4, '#7a5aa0'); A.r(6, 8, 4, 6, C.cream); A.r(9, 8, 1, 6, '#e5d3b5'); A.e(8, 8, 2.4, 1, '#e5d3b5'); A.p(10, 7, '#b673de'); A.p(5, 12, '#b673de'); }],
});
Object.assign(ICON, {
  sapling: A => { A.r(4, 11, 8, 4, '#d9774a'); A.r(3, 10, 10, 2, '#e8915f'); A.line(8, 11, 8, 5, C.woodD); A.e(5.6, 5.5, 2.4, 1.6, C.leaf); A.e(10.4, 4.5, 2.4, 1.6, C.leafL); },
  capSapling: A => { A.r(4, 11, 8, 4, '#d9774a'); A.r(3, 10, 10, 2, '#e8915f'); A.r(7, 6, 2, 5, C.cream); A.e(8, 5.5, 4, 2.8, '#b673de'); A.p(6, 4, '#fbe7ff'); A.p(10, 5, '#fbe7ff'); },
  berryBush: A => { A.e(8, 10, 6.6, 4.8, C.leafD); A.e(6, 8.6, 3.6, 3, C.leaf); A.e(10.4, 8.2, 3.6, 3, C.leaf); A.e(5, 7.4, 1.4, 1, C.leafL); for (const [x, y] of [[4, 10], [8, 8], [11, 11], [7, 12], [12, 8]]) { A.e(x + .5, y + .5, 1.3, 1.3, C.berry); A.p(x, y, '#ffc2d4'); } },
});
function afterCut(t, o) {
  const i = idx(t.x, t.y);
  if (o.t === 'root' || o.t === 'bigShroom') G.objs.set(i, { t: o.t === 'root' ? 'stump' : 'capStump', g: o.t, at: G.time + REGROW_TIME });
  else if (OBJ[o.t] && OBJ[o.t].ntree) G.objs.set(i, { t: 'stump', g: o.t, at: G.time + REGROW_TIME });
  else if (o.t === 'grass' || o.t === 'glow' || o.t === 'wildF') { G.regen = G.regen || []; if (G.regen.length < 600) G.regen.push([i, o.t, G.time + (o.t === 'grass' ? 120 : 200), o.c || null]); }
  if (o.t === 'wildF') rollDrops([['petal' + (FLOWERS[o.c] ? o.c : 'R'), 1, 1, 0.35]], t.x + .5, t.y + .5);
}
function growTick(dt = 2) {
  // crops: lantern-tree blessing (time ×0.8) and water (time ×0.75) add up, but never below half the normal time
  const BR = TREE_BLESS(treeStage());
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.crop || o.p == null) continue; if (G.time - o.p >= d.grow) { if (o.star == null) rollStar(i, o); giantTry(i, o); continue; } let k = 0; if (BR && Math.hypot(i % W - CX, ((i / W) | 0) - CY) <= BR) k += .25; if (o.w) k += 1 / 3; if (k) { o.p -= dt * k; clampCrop(o); } }
  const p = G.p, inside = (x, y) => Math.abs(x + .5 - p.x) < .8 && Math.abs(y + .5 - p.y) < .8;
  for (const [i, o] of G.objs) { if (o.yg && G.time >= o.yg) { delete o.yg; const x = i % W, y = (i / W) | 0; if (Math.hypot(x - p.x, y - p.y) < 20) puff(x + .5, y + .2, '#9be37a', 6, 2, .3); } }
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.growTo || G.time < (o.at || 0) - YOUNG_T) continue; const x = i % W, y = (i / W) | 0;
    if (inside(x, y)) { o.at = Math.max(o.at || 0, G.time + 4 + YOUNG_T); continue; }
    const nt = d.growTo === 'g' ? (OBJ[o.g] ? o.g : 'root') : d.growTo, yg = (o.at || 0) > G.time ? o.at : 0, no = yg ? { t: nt, yg } : { t: nt };
    if (OBJ[nt].sz) { G.objs.delete(i); if (!fpFree(x, y, fpOf(no), true)) { G.objs.set(i, o); o.at = G.time + 10 + YOUNG_T; continue; } G.objs.set(i, no); setParts(i, no); } else G.objs.set(i, no); if (Math.hypot(x - p.x, y - p.y) < 20) puff(x + .5, y + .6, '#9be37a', 8, 2, .3); lightDirty = true; }
  if (G.regen && G.regen.length) G.regen = G.regen.filter(([i, t, at, c]) => { if (at > G.time) return true; if (!OBJ[t] || G.wall[i] || G.objs.get(i) || ![1, 2, 3].includes(G.floor[i])) return false; const x = i % W, y = (i / W) | 0; if (inside(x, y)) return true; const o = { t }; if (c) o.c = c; G.objs.set(i, o); return false; });
}
function digPlant(t, o) {
  const d = OBJ[o.t], i = idx(t.x, t.y); delObj(i);
  const id = d.bush ? 'berryBush' : o.t === 'sapling' ? 'sapling' : o.t === 'capSapling' ? 'capSapling' : d.stump && o.g && OBJ[o.g] && OBJ[o.g].ntree && ITEMS[o.g] ? o.g : 'wood';
  const l = addItem(id, 1, false); if (l) spawnDrop(id, 1, t.x + .5, t.y + .5);
  SFX.pick(); puff(t.x + .5, t.y + .7, '#9be37a', 7, 2.2); invDirty = true; lightDirty = true; const sv = selItem(); if (sv && sv.id === 'shovel') wear(sv);
  toast(d.bush ? '베리덤불을 퍼냈어요. 원하는 곳에 다시 심어요' : d.stump ? `${d.n}을(를) 뽑았어요` : `${d.n}을(를) 퍼냈어요`, null, 'digplant');
}
// ---- nature decorations ----
const WFLOOR = new Set([11, 12, 13, 14, 15]);
Object.assign(FPAL, { 21: ['#6b4838', '#62ad62', '#5a3a2c'], 17: ['#e8501f', '#ff8a3d', '#9a2e14'], 18: ['#4a3f48', '#5a4f58', '#3a3038'], 19: ['#b8cde0', '#d8e8f5', '#9ab0c8'], 20: ['#9fd8f0', '#e8f8ff', '#7ab8d8'], 11: ['#5fa8d8', '#8fd0f0', '#3f7fb5'], 12: ['#3a6fa8', '#5b9bd0', '#2a5288'], 13: ['#4f93c8', '#7fbfe8', '#356fa0'], 14: ['#6a62b8', '#a99cf0', '#4a4290'], 15: ['#4f93c8', '#7fbfe8', '#356fa0'], 16: ['#4f8f57', '#f7b8cf', '#ffffff'] });
function regFloorTex(t, v) {
  const R = rng(t * 577 + v * 41 + 9), pal = FPAL[t];
  return mk(16, 16, A => { A.r(0, 0, 16, 16, pal[0]);
    if (t === 21) { A.r(0, 0, 16, 16, '#6b4838'); for (let y = 1; y < 16; y += 4) { A.r(0, y, 16, 1, '#5a3a2c'); A.r(0, y + 1, 16, 1, '#7d5743'); } for (let k = 0; k < 6; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#62ad62'); A.p(x + 1, y - 1 < 0 ? 0 : y - 1, '#7cc271'); } A.r(0, 0, 16, 1, '#4f8f57'); A.r(0, 15, 16, 1, '#4f8f57'); A.r(0, 0, 1, 16, '#4f8f57'); A.r(15, 0, 1, 16, '#4f8f57'); return; }
    if (t === 17) { for (let k = 0; k < 5; k++) { const x = R() * 16, y = R() * 16; A.e(x, y, 2.5 + R() * 2, 1.2 + R(), '#ff7a2d'); } for (let k = 0; k < 4; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.r(x, y, 2, 1, '#ffc861'); } for (let k = 0; k < 3; k++) { const x = R() * 14 | 0, y = R() * 14 | 0; A.r(x, y, 3, 2, '#9a2e14'); A.p(x + 1, y, '#5a1a0a'); } return; }
    for (let k = 0; k < 20; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[2]); for (let k = 0; k < 12; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1]);
    if (t === 18) { for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 1 + R() * 13 | 0; A.p(x, y, '#2a2228'); A.p(x + 1, y, '#2a2228'); A.p(x, y + 1, '#615460'); } if (v === 0) { A.p(5, 9, '#ff8a3d'); A.p(6, 9, '#c4441a'); } }
    if (t === 19) { for (let k = 0; k < 4; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#ffffff'); } if (v === 1) { A.e(9, 10, 2.4, 1.2, '#e8f4ff'); A.p(8, 9, '#ffffff'); } }
    if (t === 20) { for (let k = 0; k < 3; k++) { const x = R() * 12 | 0, y = 3 + R() * 12 | 0; A.line(x, y, x + 3, y - 3, '#e8f8ff'); } A.p(3, 12, '#ffffff'); if (v % 2) A.p(12, 4, '#ffffff'); }
  }, null);
}
function natFloorTex(t, v) {
  const R = rng(t * 911 + v * 37 + 5), pal = FPAL[t];
  return mk(16, 16, A => {
    if (t === 16) { A.r(0, 0, 16, 16, '#468a4f'); for (let k = 0; k < 22; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; A.p(x, y, '#3c7a46'); A.p((x + 1) % 16, y, '#3c7a46'); }
      for (let k = 0; k < 6; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#62ad62');
      for (let k = 0; k < 9; k++) { const x = R() * 15 | 0, y = R() * 15 | 0, w = R() < .55; A.p(x, y, w ? '#ffffff' : '#f7b8cf'); A.p(x + 1, y, w ? '#fcd9e6' : '#f49ab8'); if (R() < .4) A.p(x, y + 1, '#f49ab8'); } return; }
    A.r(0, 0, 16, 16, pal[0]); for (let k = 0; k < 6; k++) { const x = R() * 13 | 0, y = R() * 15 | 0; A.r(x, y, 3, 1, pal[1]); } for (let k = 0; k < 5; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[2]);
    if (t === 11) for (let k = 0; k < 4; k++) { const x = 2 + R() * 12, y = 2 + R() * 12; A.e(x, y, 1.3, 1, '#a99a7c'); A.p(x | 0, (y - 1) | 0, '#cfc2a4'); }
    if (t === 12 && v % 2 === 0) { A.e(8, 8, 3.6, 2.6, '#4f9a5e'); A.e(7, 7.4, 1.5, 1, '#6cbb76'); A.line(8, 8, 11, 6, pal[0]); if (v === 0) { A.e(10, 6.4, 1.3, 1.1, '#ffb3c6'); A.p(10, 6, '#ffe0ea'); } }
    if (t === 13) { A.e(8, 8, 4.8, 3.8, '#625d78'); A.e(8, 7.4, 4.4, 3.2, '#8f8aa3'); A.e(7, 6.6, 2.6, 1.6, '#b9b4cc'); }
    if (t === 14) { for (let k = 0; k < 3; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#ffffff'); A.p(x + 1, y, '#e3d4ff'); } if (v === 1) { A.poly([[2, 14], [4, 9], [6, 14]], C.cry); A.p(4, 11, C.cryL); } }
    if (t === 15) for (let k = 0; k < 6; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, R() < .5 ? '#ffffff' : '#f7b8cf'); A.p(x + 1, y, '#f49ab8'); }
  }, null);
}
const NFLOOR = { 11: ['waterShallow', '얕은 물 타일', '자갈이 비치는 맑은 물. 위로 걸어 다닐 수 있어요.', [['gWater', 1], ['stone', 1]]], 12: ['waterPond', '연못 물 타일', '연잎이 동동 떠 있는 연못.', [['gWater', 1], ['gMoss', 1]]],
  13: ['waterStep', '징검돌 물 타일', '징검돌이 놓인 물길.', [['gWater', 1], ['stone', 3]]], 14: ['waterCrystal', '수정 샘물 타일', '보랏빛으로 반짝이는 샘물.', [['gWater', 1], ['crystal', 1]]],
  15: ['waterPetal', '꽃잎 물 타일', '벚꽃잎이 떠다니는 물.', [['gWater', 1], ['petalW', 1], ['petalR', 1]]], 16: ['floorCherry', '벚꽃 타일', '벚꽃잎이 흩날린 이끼 바닥.', [['dirt', 1], ['gMoss', 1], ['petalW', 1], ['petalR', 1]]] };
for (const f in NFLOOR) { const [id, n, d, req] = NFLOOR[f]; ITEMS[id] = { n, kind: 'floor', floor: +f, d }; RECIPES.push(Rc(id, 4, req, req.some(([m]) => m === 'crystal') ? 'forge' : 'bench', 'nature')); }
const NATURE = {
  cherryTree: ['벚꽃나무', '분홍 꽃잎이 흩날리는 커다란 벚꽃나무.', [['dirt', 6], ['gMoss', 6], ['wood', 10], ['petalW', 8], ['petalR', 6]], 0, [32, 40, A => {
    A.poly([[12, 39], [15, 26], [17, 26], [20, 39]], C.woodD); A.r(14, 21, 4, 18, C.wood); A.r(14, 21, 1, 18, C.woodL); A.line(16, 24, 9, 16, C.wood, 2); A.line(17, 23, 24, 15, C.wood, 2);
    for (const [x, y, r] of [[9, 15, 6.5], [23, 14, 6.5], [16, 9, 7.5], [6, 10, 5], [26, 9, 5], [16, 17, 6], [11, 5, 5], [21, 4, 5]]) A.e(x, y, r, r * .85, '#f49ab8');
    for (const [x, y, r] of [[9, 13, 4.5], [22, 12, 4.5], [15, 7, 5.5], [7, 9, 3], [25, 8, 3], [11, 4, 3], [20, 3, 3]]) A.e(x, y, r, r * .8, '#f7b8cf');
    for (const [x, y] of [[8, 11], [13, 5], [19, 9], [24, 11], [16, 14], [10, 16], [22, 5], [5, 8], [27, 12]]) { A.p(x, y, '#ffffff'); A.p(x + 1, y, '#fcd9e6'); }
    A.p(18, 13, '#d9607d'); A.p(6, 14, '#d9607d'); A.p(26, 13, '#d9607d'); }]],
  roundTree: ['둥근 나무', '동글동글한 초록 나무.', [['dirt', 4], ['gMoss', 4]], 0, [24, 32, A => {
    A.poly([[8, 31], [11, 24], [13, 24], [16, 31]], C.woodD); A.r(10, 17, 4, 14, C.wood); A.r(10, 17, 1, 14, C.woodL);
    A.e(12, 11, 10, 9, C.leafD); A.e(10.5, 9.5, 7.5, 6.5, C.leaf); A.e(15, 8, 5, 4, C.leaf); A.e(8, 6, 2.6, 1.6, C.leafL); A.p(15, 5, C.leafL); A.p(5, 11, C.leafL); A.p(17, 14, '#2f6e33'); }]],
  shrub: ['덤불', '푸릇푸릇한 작은 덤불.', [['dirt', 2], ['gMoss', 2]], 0, [16, 14, A => {
    A.e(8, 9, 7, 4.6, C.leafD); A.e(5.5, 7.5, 3.6, 3, C.leaf); A.e(10.5, 7, 3.8, 3.2, C.leaf); A.e(8, 5.5, 3, 2.4, C.leaf); A.p(5, 6, C.leafL); A.p(10, 5, C.leafL); A.p(8, 4, C.leafL); }]],
  hydrangea: ['수국 덤불', '파란 꽃송이가 탐스러운 수국.', [['dirt', 1], ['gMoss', 1], ['petalB', 3]], 0, [16, 16, A => {
    A.e(8, 11, 7, 4.4, C.leafD); A.e(8, 10, 5.6, 3.4, C.leaf);
    for (const [x, y] of [[4.5, 7], [11, 6.5], [8, 4.5]]) { A.e(x, y, 3, 2.6, '#6fa8ff'); A.p(x - 1 | 0, y - 1 | 0, '#c2dcff'); A.p(x + 1 | 0, y | 0, '#c2dcff'); A.p(x | 0, y + 1 | 0, '#4a78d0'); } }]],
  roseBlack: ['흑장미 덤불', '신비로운 검은 장미가 핀 덤불.', [['dirt', 1], ['gMoss', 1], ['petalK', 2], ['petalR', 1]], 0, [16, 16, A => {
    A.e(8, 11, 7, 4.4, '#2f6e33'); A.e(8, 10, 5.6, 3.4, C.leafD);
    for (const [x, y] of [[4.5, 7.5], [11, 7], [8, 4.5]]) { A.e(x, y, 2.4, 2.2, '#4a3f5c'); A.p(x | 0, y | 0, '#8a7aa6'); A.p(x - 1 | 0, y | 0, '#2a2238'); A.p(x + 1 | 0, y - 1 | 0, '#d0485e'); } }]],
  sunflower: ['해바라기', '키가 큰 노란 해바라기.', [['dirt', 1], ['gMoss', 1], ['petalY', 3]], 0, [16, 28, A => {
    A.line(8, 27, 8, 11, C.leafD, 2); A.e(5, 20, 3, 1.4, C.leaf); A.e(11, 16, 3, 1.4, C.leaf);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; A.e(8 + Math.cos(a) * 4.2, 7 + Math.sin(a) * 4.2, 1.8, 1.8, k % 2 ? '#ffd25c' : '#f2b83a'); }
    A.e(8, 7, 2.8, 2.8, '#7a4a2a'); A.p(7, 6, '#a06a3a'); A.p(9, 8, '#5a3420'); }]],
  daisies: ['데이지 무리', '작고 하얀 데이지. 위로 걸어 다닐 수 있어요.', [['gMoss', 1], ['petalW', 2]], 1, [16, 16, A => {
    for (const [x, y] of [[4, 5], [11, 4], [7, 10], [13, 11], [3, 13]]) { A.line(x, y + 1, x, y + 3, C.leaf); A.p(x - 1, y, '#ffffff'); A.p(x + 1, y, '#ffffff'); A.p(x, y - 1, '#ffffff'); A.p(x, y + 1, '#f4f0f8'); A.p(x, y, '#ffd25c'); } }]],
  flowerBed: ['꽃밭', '빨강·파랑·노랑 꽃이 가득한 꽃밭. 위로 걸어 다닐 수 있어요.', [['dirt', 2], ['gMoss', 2], ['petalR', 2], ['petalB', 2], ['petalY', 2]], 1, [16, 16, A => {
    A.e(4, 12, 3.4, 2, C.leafD); A.e(11, 13, 4, 2, C.leafD); A.e(8, 7, 4, 2, C.leafD); A.e(3, 5, 2.6, 1.6, C.leaf); A.e(13, 6, 2.6, 1.6, C.leaf);
    const cs = ['#ff6b81', '#6fa8ff', '#ffd25c'];
    [[3, 4], [7, 3], [12, 4], [5, 8], [10, 8], [14, 9], [2, 11], [7, 12], [12, 13], [9, 15]].forEach(([x, y], k) => { const c = cs[k % 3]; A.p(x - 1, y, c); A.p(x + 1, y, c); A.p(x, y - 1, c); A.p(x, y + 1, c); A.p(x, y, k % 3 === 2 ? '#d9a53a' : '#fff1d6'); }); }]],
};
for (const id in NATURE) { const [n, d, req, flat, spr] = NATURE[id]; OSPR[id] = spr; ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = flat ? { n, flat: 1, item: id } : { n, solid: 1, item: id }; RECIPES.push(Rc(id, 1, req, 'bench', 'nature')); }
RECIPES.push(Rc('sapling', 1, [['wood', 3], ['dirt', 2], ['fiber', 2]], 'bench', 'nature'));
Object.assign(OBJ.cherryTree, { ntree: 1, nat: 'cut', hp: 6, drops: [['wood', 3, 5, 1], ['petalW', 1, 2, 0.5], ['petalR', 1, 1, 0.3]] });
Object.assign(OBJ.roundTree, { ntree: 1, nat: 'cut', hp: 5, drops: [['wood', 2, 4, 1], ['sapling', 1, 1, 0.2]] });


