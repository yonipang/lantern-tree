// ---- farming basics: copper sickle, watering can, fertilizer (water and fertilizer marks live on the crop object: w, f, p0) ----
const WCAN_MAX = 10;
Object.assign(ITEMS, {
  sickle: { n: '구리 낫', kind: 'sickle', stack: 1, d: '가방에 있기만 해도 작물을 거둘 때 하나씩 더 얻어요. 다 자란 작물 앞에서 꾹 누르고 있으면 주변 3×3을 한 번에 거둬요. 닳지 않아요.' },
  wcan: { n: '물뿌리개', kind: 'wcan', stack: 1, d: `단축칸에서 골라 들고 물가를 바라보며 누르면 가득 채워요 (${WCAN_MAX}번). 자라는 작물에 물을 주면 25% 빨리 자라요.` },
  fert: { n: '비료', kind: 'fert', d: '단축칸에서 골라 들고 자라는 작물에 뿌리면 남은 성장 시간이 바로 40% 줄어요. 작물마다 한 번만 줄 수 있어요.' },
  fertShroom: { n: '버섯 비료', kind: 'fert', fx: 'shroom', d: '비료와 같아요. 버섯에 주면 거둘 때 빛버섯이 나올 확률이 30%에서 60%로 올라요.' },
});
Object.assign(ICON, {
  sickle: sickleIcon(C.copper, C.copperL),
  wcan: A => { A.e(7, 5.6, 3.4, 2.6, C.copperD); A.g.globalCompositeOperation = 'destination-out'; A.e(7, 5.8, 1.9, 1.3, '#000'); A.g.globalCompositeOperation = 'source-over'; A.line(10, 11, 14, 5, C.copperD, 2); A.r(13, 3, 3, 2, C.copperL);
    A.r(2, 7, 9, 7, C.copper); A.r(2, 7, 9, 1, C.copperL); A.r(2, 13, 9, 1, C.copperD); A.r(3, 9, 1, 3, C.copperL); A.p(15, 6, '#bfe6ff'); A.p(15, 8, '#8fd0f0'); },
  fert: A => { A.e(8, 10.5, 5.4, 4.6, '#b8903f'); A.e(7, 9.6, 3.8, 3.2, '#d9b66a'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#c9a46b'); A.r(5, 6, 6, 1, '#7a5a2a'); A.p(7, 3, '#ecd8a8'); A.e(8.5, 11, 2.2, 1.6, '#62ad62'); A.p(7, 10, '#9be37a'); A.p(10, 13, '#5a3a2c'); A.p(5, 12, '#5a3a2c'); },
  fertShroom: A => { A.e(8, 10.5, 5.4, 4.6, '#7a5aa0'); A.e(7, 9.6, 3.8, 3.2, '#a17fc9'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#8e6fb0'); A.r(5, 6, 6, 1, '#4a3468'); A.p(7, 3, '#cdb8ea'); A.r(7, 10, 2, 3, C.cream); A.e(8, 9.6, 2.6, 1.6, '#e36b6b'); A.p(7, 9, '#ffd6d6'); },
});
RECIPES.push(Rc('sickle', 1, [['copperBar', 3], ['wood', 2], ['rope', 1]], 'forge', 'farm'), Rc('wcan', 1, [['copperBar', 2], ['resin', 1]], 'forge', 'farm'),
  Object.assign(Rc('fert', 2, [['dirt', 3], ['gel', 1]], 'bench', 'farm'), { need: () => beat('queen') }), Object.assign(Rc('fertShroom', 2, [['gShroom', 1], ['spore', 1]], 'bench', 'farm'), { need: () => beat('queen') }));
const recipeOn = r => (r.bag == null || r.bag === (G.bagLv || 0)) && (!r.need || r.need());
function clampCrop(o) { if (o.p0 != null) o.p = Math.max(o.p, o.p0 - OBJ[o.t].grow * .5); }
function cropMsg(o, cs, i) { const d = OBJ[o.t], rem = Math.max(0, d.grow - (G.time - o.p)), left = rem >= 90 ? `${Math.round(rem / 60)}분쯤` : `${Math.max(10, Math.ceil(rem / 10) * 10)}초쯤`;
  const sf = CROP_SOIL[o.t], soil = sf == null || !beat('golem') ? '' : sf === G.floor[i] ? ' · 맞는 흙 ★' : ` · ${SOIL_N[sf]}에 심으면 별 작물이 자라요`;
  return `${d.n} · ${CROP_STEP[d.crop][cs]} (${cs + 1}/4단계) · ${left} 남았어요${o.w ? ' · 물 줌' : ''}${o.f ? ' · 비료 줌' : ''}${soil}`; }
function ripeAround(cx, cy) { const out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t] && OBJ[o.t].crop && cropStage(o) >= 3) out.push([x, y, o]); } return out; }
function waterCrop(t, o) { const s = selItem(); if (!s || s.id !== 'wcan' || (s.w || 0) <= 0 || o.w || !OBJ[o.t].crop) return;
  s.w--; o.w = 1; if (o.p0 == null) o.p0 = o.p; invDirty = true; SFX.place(); puff(t.x + .5, t.y + .7, '#8fd0f0', 7, 1.8, .2);
  if (!s.w) toast('물뿌리개가 비었어요. 물가를 바라보고 눌러 채워요', null, 'wcanEmpty'); }
function fertCrop(t, o) { const s = selItem(), it = s && ITEMS[s.id]; if (!it || it.kind !== 'fert' || o.f || !OBJ[o.t].crop) return; const d = OBJ[o.t];
  if (o.p0 == null) o.p0 = o.p; const rem = d.grow - (G.time - o.p); if (rem > 0) o.p -= rem * .4; clampCrop(o); o.f = it.fx === 'shroom' ? 2 : it.fx === 'cry' ? 3 : 1;
  s.c--; if (!s.c) { G.inv[G.sel] = null; refillHot(G.sel, s.id); } G.stats.fert = (G.stats.fert || 0) + 1; invDirty = true; SFX.craft(); puff(t.x + .5, t.y + .7, '#e8d098', 9, 2, .25); }
function fillCan(t) { const s = selItem(); if (!s || s.id !== 'wcan') return; s.w = WCAN_MAX; invDirty = true; SFX.pick(); puff(t.x + .5, t.y + .5, '#bfe6ff', 8, 2, .2); toast('물뿌리개를 가득 채웠어요', 'good', 'wfill'); }
QSIDE.push(
  { id: 's_crop1', t: () => '베리 심고 거두기', h: '베리 씨앗을 이끼나 흙 바닥에 심고, 다 자라면 거둬요. 작물을 바라보면 몇 단계인지 보여요.', done: () => (G.stats.berryH || 0) >= 1, rw: [['berrySeed', 3], ['spore', 3]], xp: 15 },
  { id: 's_crop2', t: () => `물 준 작물 5개 거두기 (${Math.min(5, G.stats.wetH || 0)}/5)`, h: '구리 장비제작대에서 물뿌리개를 만들어 물가에서 채우고, 자라는 작물에 물을 줘요. 물 준 작물은 25% 빨리 자라요.', done: () => (G.stats.wetH || 0) >= 5, rw: [['copperBar', 3]], xp: 25 },
  { id: 's_crop3', t: () => `비료 10번 쓰기 (${Math.min(10, G.stats.fert || 0)}/10)`, h: '버섯 여왕을 물리치면 작업대에서 비료를 만들 수 있어요. 자라는 작물에 뿌리면 남은 시간이 확 줄어요.', done: () => (G.stats.fert || 0) >= 10, rw: [['gel', 6]], xp: 40 });
TIPS.push('물뿌리개로 물을 준 작물은 25% 빨리 자라요. 물가에서 채워요.', '비료는 작물마다 한 번, 남은 성장 시간을 40% 줄여 줘요.');
// ---- farming, deeper: matching soil, star crops (after the crystal golem), glowcap and crystal bean crops ----
const CROP_SOIL = { cropBerry: 1, cropShroom: 3, cropGlow: 3, cropBean: 4 }, SOIL_N = { 1: '이끼', 2: '흙', 3: '버섯흙', 4: '수정 모래' };
const STAR_OF = { berry: 'berryS', mushroom: 'mushroomS', glowcap: 'glowcapS', cbean: 'cbeanS' };
// decided once, when the crop is grown: only on its own soil, only after the golem; crystal fertilizer raises the odds
function rollStar(i, o) { o.star = beat('golem') && CROP_SOIL[o.t] != null && CROP_SOIL[o.t] === G.floor[i] && Math.random() < (o.f === 3 ? .35 : .15) ? 1 : 0; }
Object.assign(OBJ, {
  cropGlow: { n: '빛버섯', crop: 'glow', grow: 150, yield: [['glowcap', 2, 3, 1], ['glowSpore', 1, 2, 1]] },
  cropBean: { n: '수정 콩', crop: 'bean', grow: 180, yield: [['cbean', 2, 3, 1], ['cbeanSeed', 1, 2, 1]] },
});
Object.assign(ITEMS, {
  glowSpore: { n: '빛버섯 포자', kind: 'seed', crop: 'cropGlow', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 2분 30초쯤 뒤 빛버섯이 자라요. 다 자라면 은은하게 빛나요. 버섯흙이 잘 맞아요.' },
  cbeanSeed: { n: '수정 콩 씨앗', kind: 'seed', crop: 'cropBean', d: '흙·이끼·버섯흙·수정 모래·풀밭에 심으면 3분쯤 뒤 수정 콩이 열려요. 수정 모래가 잘 맞아요.' },
  cbean: { n: '수정 콩', kind: 'food', food: 6, heal: 3, d: '수정처럼 반짝이는 콩. 오독오독 씹어 먹어도 맛있어요.' },
  berryS: { n: '별 통통베리', kind: 'food', food: 17, heal: 6, d: '별 작물에서 딴 특별한 베리. 제작에서는 통통베리 대신 쓸 수 있어요 (보통 베리를 먼저 써요).' },
  mushroomS: { n: '별 버섯', kind: 'food', food: 10, heal: 0, d: '별 작물에서 딴 특별한 버섯. 제작에서는 버섯 대신 쓸 수 있어요 (보통 버섯을 먼저 써요).' },
  glowcapS: { n: '별 빛버섯', d: '별 작물에서 딴 특별한 빛버섯. 제작에서는 빛버섯 대신 쓸 수 있어요 (보통 빛버섯을 먼저 써요).' },
  cbeanS: { n: '별 수정 콩', kind: 'food', food: 8, heal: 4, d: '별 작물에서 딴 특별한 수정 콩. 제작에서는 수정 콩 대신 쓸 수 있어요.' },
  fertCry: { n: '수정 비료', kind: 'fert', fx: 'cry', d: '비료와 같아요. 맞는 흙에 심은 작물이 별 작물이 될 확률이 15%에서 35%로 올라요.' },
});
ITEMS.berrySeed.d = '흙·이끼·버섯흙·수정 모래·풀밭에 심어요. 이끼가 잘 맞아요.'; ITEMS.spore.d = '흙·이끼·버섯흙·수정 모래·풀밭에 심어요. 버섯흙이 잘 맞아요.';
const starMark = A => { A.p(12, 1, '#fff1b0'); A.p(11, 2, '#ffd25c'); A.p(12, 2, '#ffffff'); A.p(13, 2, '#ffd25c'); A.p(12, 3, '#ffd25c'); A.p(14, 4, '#fff1b0'); };
Object.assign(ICON, {
  glowSpore: packet('#ecd6a8', A => { A.e(8, 8, 2.6, 1.6, C.glow); A.r(7, 9, 2, 2, '#e8f7f2'); A.p(7, 7, C.glowL); }),
  cbeanSeed: packet('#ecd6a8', A => { A.e(6.5, 9, 1.4, 1.8, C.cry); A.e(9.5, 8, 1.4, 1.8, C.cryL); A.p(9, 7, '#ffffff'); }),
  cbean: A => { A.poly([[3, 12], [6, 5], [12, 3], [13, 5], [9, 11]], C.leaf); A.line(4, 12, 12, 4, C.leafD); for (const [x, y] of [[6, 9], [8, 7], [10, 5]]) { A.e(x + .5, y + .5, 1.6, 1.6, C.cry); A.p(x, y, C.cryL); } A.p(10, 4, '#ffffff'); },
  berryS: A => { ICON.berry(A); starMark(A); }, mushroomS: A => { ICON.mushroom(A); starMark(A); }, glowcapS: A => { ICON.glowcap(A); starMark(A); }, cbeanS: A => { ICON.cbean(A); starMark(A); },
  fertCry: A => { A.e(8, 10.5, 5.4, 4.6, '#6a62b8'); A.e(7, 9.6, 3.8, 3.2, '#a99cf0'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#8e84d8'); A.r(5, 6, 6, 1, '#3a3270'); A.p(7, 3, '#e3d4ff'); A.poly([[8, 8], [10, 11], [8, 14], [6, 11]], C.cry); A.p(7, 10, C.cryL); },
});
OBJ.cluster.drops.push(['cbeanSeed', 1, 1, 0.1]); OBJ.glow.drops.push(['glowSpore', 1, 1, 0.25]);
RECIPES.push(Object.assign(Rc('fertCry', 2, [['gCrystal', 1], ['crystal', 1]], 'forge', 'farm'), { need: () => beat('golem') }));
QSIDE.push({ id: 's_crop4', t: () => `별 작물 5개 거두기 (${Math.min(5, G.stats.starH || 0)}/5)`, h: '수정골렘을 물리친 뒤, 작물을 맞는 흙에 심으면 가끔 별 작물로 자라요. 베리는 이끼, 버섯·빛버섯은 버섯흙, 수정 콩은 수정 모래예요.', done: () => (G.stats.starH || 0) >= 5, rw: [['crystal', 8]], xp: 60 });
TIPS.push('맞는 흙에 심은 작물은 가끔 별 작물이 돼요. 다 자라면 작은 별이 반짝여요.', '수정 결정을 캐면 가끔 수정 콩 씨앗이 나와요.');
// ---- hidden-room treasure chest and the one-of-a-kind decorations found in them ----
OBJ.tchest = { n: '보물상자', solid: 1, tchest: 1, light: [2.2, '#ffd25c'] };
const ROOM_DECO_DEF = {
  mossLantern: ['이끼 석등', '이끼 동굴 숨은 방에서 찾은 오래된 석등. 따뜻하게 빛나요.', [4.5, '#ffd27a'], [16, 22, A => { A.r(4, 19, 8, 2, '#6f6a86'); A.r(5, 18, 6, 1, '#8e89a3'); A.r(6, 12, 4, 6, '#8e89a3'); A.r(6, 12, 1, 6, '#a29db6'); A.r(3, 6, 10, 6, '#8e89a3'); A.r(3, 6, 10, 1, '#a29db6'); A.r(5, 8, 6, 3, '#ffd27a'); A.p(6, 8, '#fff1c0'); A.r(5, 11, 6, 1, '#6f6a86');
    A.poly([[1, 6], [8, 1], [15, 6]], '#6f6a86'); A.e(8, 3.6, 3.4, 1.3, '#62ad62'); A.p(3, 5, '#7cc271'); A.p(12, 5, '#62ad62'); A.p(6, 18, '#62ad62'); A.p(10, 19, '#7cc271'); }]],
  sporeChime: ['포자 풍경', '버섯숲 숨은 방에서 찾은 풍경. 보랏빛 포자 방울이 은은하게 빛나요.', [3, '#d59bff'], [16, 22, A => { A.e(8, 21, 4, 1, '#7a5aa0'); A.r(7, 5, 2, 16, C.woodD); A.r(7, 5, 1, 16, C.wood); A.r(2, 4, 12, 2, C.wood); A.r(2, 4, 12, 1, C.woodL);
    for (const [x, l, c] of [[3, 5, '#b673de'], [8, 0, null], [13, 4, '#d59bff']]) { if (!c) continue; A.line(x, 6, x, 6 + l, '#e8d8c0'); A.e(x, 7.5 + l, 1.8, 1.3, c); A.p(x, 7 + l, '#fbe7ff'); } A.line(10, 6, 10, 12, '#e8d8c0'); A.e(10, 13.5, 1.6, 1.2, '#c79ae8'); A.p(10, 13, '#fbe7ff'); }]],
  cryVase: ['수정 꽃병', '수정 동굴 숨은 방에서 찾은 꽃병. 꽂힌 수정이 보랏빛으로 빛나요.', [3, '#b99bff'], [16, 18, A => { A.e(8, 13.5, 4.4, 3.8, '#4a4290'); A.e(8, 13, 4, 3.4, '#6a62b8'); A.e(6.6, 12, 1.6, 2, '#a99cf0'); A.r(6, 7, 4, 3, '#6a62b8'); A.r(5, 7, 6, 1, '#a99cf0');
    A.poly([[5, 8], [3, 2], [7, 7]], C.cry); A.poly([[7, 7], [8, 0], [10, 7]], C.cryL); A.poly([[9, 8], [13, 3], [11, 8]], C.cry); A.p(8, 2, '#ffffff'); A.p(4, 4, C.cryL); }]],
  emberBowl: ['흑요석 화로', '용암 동굴 숨은 방에서 찾은 흑요석 화로. 꺼지지 않는 불씨가 타올라요.', [4, '#ff9b4a'], [16, 16, A => { A.line(4, 11, 3, 15, '#2a2238'); A.line(12, 11, 13, 15, '#2a2238'); A.line(8, 12, 8, 15, '#2a2238'); A.e(8, 10.5, 6, 2.8, '#2a2238'); A.e(8, 9.6, 5.2, 1.8, '#4a3f5c'); A.p(4, 10, '#8a7aa6');
    A.e(8, 7, 3.2, 3, '#ff8a3d'); A.e(8, 6.2, 2.2, 2.6, '#ffc861'); A.p(8, 3, '#fff1b0'); A.p(6, 5, '#ffe0a0'); A.p(10, 6, '#ff8a3d'); }]],
  iceSwan: ['얼음 백조', '얼음 동굴 숨은 방에서 찾은 얼음 조각. 녹지 않고 반짝여요.', [2.5, '#9fd8f0'], [16, 16, A => { A.e(8, 14, 6.4, 1.6, '#9ab0c8'); A.e(9, 11, 5, 2.8, '#d8e8f5'); A.e(10, 10, 3.2, 1.6, '#ffffff'); A.p(12, 9, '#9fd8f0'); A.line(5, 11, 4, 5, '#e8f8ff', 2); A.e(4.6, 4, 1.8, 1.4, '#ffffff'); A.p(2, 4, '#9fd8f0'); A.p(4, 3, '#5a88b0'); }]],
};
for (const id in ROOM_DECO_DEF) { const [n, d, light, spr] = ROOM_DECO_DEF[id]; ITEMS[id] = { n, kind: 'place', obj: id, d }; OBJ[id] = { n, solid: 1, item: id, light }; OSPR[id] = spr; }
OBJ.emberBowl.flick = 1;
Object.assign(OSPR, {
  tchest: [16, 16, A => { A.r(2, 6, 12, 8, '#8a5a34'); A.r(2, 3, 12, 4, '#a86a3c'); A.r(2, 3, 12, 1, '#d09058'); A.r(2, 6, 12, 1, '#6a4428'); A.r(4, 3, 1, 11, '#ffd25c'); A.r(11, 3, 1, 11, '#ffd25c'); A.r(2, 8, 12, 1, '#e8a33a');
    A.r(7, 7, 2, 3, '#ffd25c'); A.p(7, 8, '#7a4a1a'); A.r(2, 13, 12, 1, '#5a3a24'); A.p(4, 3, '#fff1b0'); A.p(13, 2, '#fff1b0'); }],
  tchestOpen: [16, 16, A => { A.r(2, 0, 12, 4, '#a86a3c'); A.r(2, 0, 12, 1, '#d09058'); A.r(4, 0, 1, 4, '#ffd25c'); A.r(11, 0, 1, 4, '#ffd25c'); A.r(2, 4, 12, 2, '#2a1a14'); A.r(2, 6, 12, 8, '#8a5a34'); A.r(2, 6, 12, 1, '#b8784a');
    A.r(4, 6, 1, 8, '#ffd25c'); A.r(11, 6, 1, 8, '#ffd25c'); A.r(2, 8, 12, 1, '#e8a33a'); A.r(2, 13, 12, 1, '#5a3a24'); }],
});
QSIDE.push({ id: 's_rooms', t: () => `숨은 방 보물상자 3개 열기 (${Math.min(3, G.stats.chests || 0)}/3)`, h: '벽에 금이 가 있고 틈으로 빛이 새어 나오면 그 너머에 숨은 방이 있어요. 지역마다 한두 곳씩 숨어 있어요.', done: () => (G.stats.chests || 0) >= 3, rw: [['glowSpore', 3], ['cbeanSeed', 2]], xp: 50 });
TIPS.push('벽에 금이 가 있고 틈으로 빛이 새어 나오면, 그 너머에 숨은 방이 있을지도 몰라요.');
// ================= cooking: buff dishes, recipe notes, recipe book =================
// a dish gives one effect in one of three tiers; up to 3 different effects at once, the same effect keeps only its best tier
const BUFF_DUR = [180, 300, 480], BUFF_MAX = 3;
const pct = v => Math.round(v * 100) + '%';
const EFF = {
  atk: { n: '공격력', v: [.05, .10, .15], t: v => '+' + pct(v) }, def: { n: '받는 피해', v: [.05, .10, .15], t: v => '-' + pct(v) },
  move: { n: '이동 속도', v: [.10, .15, .20], t: v => '+' + pct(v) }, mine: { n: '채굴 속도', v: [.10, .20, .30], t: v => '+' + pct(v) },
  light: { n: '빛 범위', v: [.25, .50, .75], t: v => '+' + pct(v) }, regen: { n: '체력 재생', v: [4, 2, 1], t: v => `${v}초마다 +1` },
  maxhp: { n: '최대 체력', v: [10, 20, 30], t: v => '+' + v }, hunger: { n: '배고픔 절약', v: [.75, .5, .35], t: v => `${pct(v)} 속도로 줄어듦` },
  luck: { n: '낚시 운', v: [1, 2, 3], t: v => `${v}단계` }, xp: { n: '경험치', v: [.10, .20, .30], t: v => '+' + pct(v) },
};
// [id, name, effect, tier (0: recovery only, no effect slot), icon shape, colors, ingredients, where its recipe note is found]
const DISHES = [
  ['skewer', '버섯 꼬치', 'atk', 1, 'skewer', ['#e36b6b', '#ff7aa2'], [['mushroom', 3], ['berry', 1]], 'mon'],
  ['capSteak', '버섯 갓 스테이크', 'atk', 2, 'plate', ['#b9573f', '#6ff2e6'], [['shroomCap', 2], ['glowcap', 1]], 'room:r10'],
  ['gelSoup', '말랑 젤 수프', 'def', 1, 'bowl', ['#9be37a', '#e36b6b'], [['gel', 2], ['mushroom', 1], ['gWater', 1]], 'mon'],
  ['beanPorridge', '수정 콩 죽', 'def', 2, 'bowl', ['#e8e0f0', '#b99bff'], [['cbean', 2], ['gel', 1], ['gWater', 1]], 'room:r20'],
  ['beanHotpot', '수정 콩 전골', 'def', 3, 'bowl', ['#d9774a', '#b99bff'], [['cbean', 3], ['shroomCap', 1], ['gWater', 1]], 'room:r30'],
  ['bouncyJelly', '통통 튀는 젤리', 'move', 1, 'jelly', ['#86d96b', '#ff7aa2'], [['gel', 2], ['berry', 1]], 'mon'],
  ['eelGrill', '장어 구이', 'move', 2, 'plate', ['#b673de', '#6ff2e6'], [['sporeEel', 1], ['glowcap', 1]], 'room:r01'],
  ['capStirfry', '버섯 갓 볶음', 'mine', 1, 'plate', ['#e07b5f', '#e8d2b0'], [['mushroom', 2], ['shroomCap', 1]], 'gather'],
  ['beanStirfry', '수정 콩 볶음', 'mine', 2, 'plate', ['#b99bff', '#e8d2b0'], [['cbean', 2], ['mushroom', 1]], 'room:r21'],
  ['glowGrill', '빛버섯 구이', 'light', 1, 'skewer', ['#6ff2e6', '#c8fff6'], [['glowcap', 2]], 'gather'],
  ['glowPancake', '반짝 빛버섯전', 'light', 2, 'cake', ['#f2d38a', '#6ff2e6'], [['glowcap', 2], ['berry', 1]], 'quest:s_crop2'],
  ['glowSoup', '빛버섯 수정 수프', 'light', 3, 'bowl', ['#6ff2e6', '#b99bff'], [['glowcap', 2], ['cbean', 1], ['gWater', 1]], 'room:r40'],
  ['shroomPorridge', '버섯 죽', 'regen', 1, 'bowl', ['#f3e2c4', '#e36b6b'], [['mushroom', 2], ['gWater', 1]], 'mon'],
  ['jellyStew', '젤리 버섯찜', 'regen', 2, 'bowl', ['#86d96b', '#e07b5f'], [['shroomCap', 1], ['gel', 2]], 'room:r11'],
  ['capSoup', '버섯 갓 수프', 'maxhp', 1, 'bowl', ['#e8a37a', '#e07b5f'], [['shroomCap', 1], ['mushroom', 2], ['gWater', 1]], 'gather'],
  ['beanSteam', '수정 콩 버섯찜', 'maxhp', 2, 'bowl', ['#e8e0f0', '#e36b6b'], [['cbean', 1], ['mushroom', 2], ['glowcap', 1]], 'quest:s_crop4'],
  ['koiSteam', '별빛 잉어찜', 'maxhp', 3, 'plate', ['#ffd25c', '#ffb3c6'], [['koi', 1], ['cbean', 1]], 'bottle'],
  ['petalTea', '꽃잎 차', 'hunger', 1, 'cup', ['#f7b8cf', '#ffffff'], [['anyPetal', 2], ['gWater', 1]], 'gather'],
  ['petalDango', '꽃잎 베리 경단', 'hunger', 2, 'dango', ['#f7b8cf', '#ff7aa2', '#b99bff'], [['anyPetal', 2], ['berry', 2], ['cbean', 1]], 'room:r00'],
  ['baitDango', '베리 미끼 경단', 'luck', 1, 'dango', ['#ff7aa2', '#86d96b', '#ff7aa2'], [['berry', 2], ['gel', 1]], 'fish'],
  ['crucianBraise', '붕어 조림', 'luck', 2, 'plate', ['#c9a46b', '#ff7aa2'], [['crucian', 1], ['berry', 2]], 'quest:s_fish'],
  ['shrimpDango', '반짝 새우 경단', 'luck', 3, 'dango', ['#ff9ab0', '#6ff2e6', '#b99bff'], [['shrimp', 2], ['glowcap', 2], ['cbean', 1]], 'boss:golem'],
  ['petalPancake', '꽃잎 버섯 부침', 'xp', 1, 'cake', ['#f2d38a', '#ff7aa2'], [['anyPetal', 1], ['mushroom', 2]], 'gather'],
  ['petalRiceCake', '꽃잎 콩떡', 'xp', 2, 'cake', ['#f4f0f8', '#f7b8cf'], [['cbean', 2], ['anyPetal', 1]], 'quest:s_rooms'],
  ['catfishSoup', '메기 매운탕', null, 0, 'bowl', ['#e84a3a', '#ffd25c'], [['catfish', 1], ['mushroom', 2], ['gWater', 1]], 'boss:slime'],
];
const DISH = {}; for (const d of DISHES) DISH[d[0]] = { id: d[0], n: d[1], ef: d[2], tier: d[3], shape: d[4], col: d[5], req: d[6], src: d[7] };
const KNOWN0 = ['pie', 'stew', 'fishStew'];
const ROOM_NOTES = [['petalDango', 'eelGrill'], ['capSteak', 'jellyStew'], ['beanPorridge', 'beanStirfry'], ['beanHotpot'], ['glowSoup']];
const BOSS_NOTES = { slime: ['catfishSoup'], golem: ['shrimpDango'] }, BOSS_REGION = { slime: 0, queen: 1, golem: 2, turtle: 3, spirit: 4 };
const REGION_N = ['이끼 동굴', '버섯숲', '수정 동굴', '용암 동굴', '얼음 동굴'];
function noteHint(d) { const s = d.src; if (s === 'mon') return '이끼 동굴·버섯숲 몬스터가 가끔 떨어뜨려요'; if (s === 'gather') return '풀·작물·빛버섯을 거둘 때 가끔 나와요'; if (s === 'fish') return '낚시하다 보면 가끔 걸려요'; if (s === 'bottle') return '낚시하다 병 속 쪽지로 걸려요'; if (s === 'ending') return '다섯 등불을 모두 밝히면';
  if (s.startsWith('room:')) return `${REGION_N[+s[6]]} 숨은 방 어딘가`; if (s.startsWith('boss:')) return `${BOSSES[s.slice(5)].n}을(를) 물리치면`; if (s.startsWith('guide:')) { const q = GUIDE.find(x => x.id === s.slice(6)); return q ? `이야기 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '이야기 퀘스트 보상'; } if (s.startsWith('quest:')) { const q = QSIDE.find(x => x.id === s.slice(6)); return q ? `도전 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '도전 퀘스트 보상'; } return ''; }
const knows = id => !DISH[id] || !!(G && G.recipes && G.recipes[id]);
const DISH_FOOD = [[60, 60], [20, 6], [28, 10], [36, 14]];
// ================= v59: smelting and cooking take time — put the materials in, come back for the result =================
// one recipe per furnace / pot at a time (up to 30). It runs on real time, so it keeps going while a panel is open and while the game is closed.
const JOB_MAX = 30, TIMED = { furnace: 1, pot: 1 };
const SMELT_T = { copperBar: 5, ironBar: 10, quartzR: 20, goldBar: 20 }; // anything else smelted later (frost …) takes 30 s
const COOK_T = [6, 10, 30, 50]; // by dish tier: recovery dishes · basic · special · legendary (plain foods 6 s)
function jobTime(r) { if (r.at === 'furnace') return SMELT_T[r.out] || 30; const d = DISH[r.dish || r.out]; return d ? COOK_T[d.tier] || 10 : COOK_T[0]; }
const nowS = () => Date.now() / 1000;
const jobDone = j => j ? clamp(Math.floor((nowS() - j.t0) / j.per), 0, j.q) : 0;
const jobLeft = j => j ? Math.max(0, j.t0 + j.q * j.per - nowS()) : 0;
const fmtT = sec => { sec = Math.ceil(sec); return sec >= 60 ? `${Math.floor(sec / 60)}분${sec % 60 ? ` ${sec % 60}초` : ''}` : `${sec}초`; };
function stockMap() { const m = {}, add = s => { if (s && s.id) m[s.id] = (m[s.id] || 0) + s.c; }; G.inv.forEach(add); for (const o of linkedChests()) (o.items || []).forEach(add); return m; }
function takeJob(o, x, y, quiet) { const j = o && o.job; if (!j) return 0; const d = jobDone(j); if (!d) return 0; const total = d * j.n;
  const left = addItem(j.out, total); if (left) spawnDrop(j.out, left, x, y);
  G.stats.made = G.stats.made || {}; G.stats.made[j.out] = (G.stats.made[j.out] || 0) + d; gainXp(Math.min(8, d));
  if (d >= j.q) delete o.job; else { j.used = j.used.map(([id, c]) => [id, c - Math.floor(c * d / j.q)]); j.q -= d; j.t0 += d * j.per; }
  if (!quiet) { SFX.craft(); craftNote(j.out, total); } invDirty = true; checkGuide(); return total; }
// cancelling hands back what is finished and the materials of everything not started yet
function cancelJob(o, x, y) { if (!o || !o.job) return; takeJob(o, x, y, true); const j = o.job; if (!j) return; const rest = j.q - jobDone(j);
  for (const [id, c] of j.used) { const back = Math.floor(c * rest / j.q); if (back > 0 && ITEMS[id]) { const l = addItem(id, back, false); if (l) spawnDrop(id, l, x, y); } }
  delete o.job; invDirty = true; }
function jobHTML(o) { const j = o.job; if (!j) return ''; const d = jobDone(j), it = ITEMS[j.out], prog = clamp((nowS() - j.t0) / (j.q * j.per), 0, 1);
  return `<div class="rc ok jobcard" data-done="${d}"><div class="ri"><img class="px" src="${iconURL(j.out)}" alt=""></div><div class="rn">${it.n} ${j.q * j.n}개 ${d >= j.q ? '· 다 됐어요!' : TIMED && o.t === 'furnace' ? '녹이는 중' : '만드는 중'}<div class="fixbar" style="max-width:none"><i id="jobBar" style="width:${Math.round(prog * 100)}%"></i></div><div class="ings"><span class="ing" id="jobTxt">${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}</span></div></div>
    <div class="btns" style="grid-column:auto;flex-direction:column"><button type="button" class="btn mk" data-a="jobTake" ${d ? '' : 'disabled'}>꺼내기${d ? ` ${d * j.n}` : ''}</button><button type="button" class="btn ghost mk ${UIS.jobAsk ? 'warn' : ''}" data-a="jobCancel">${UIS.jobAsk ? '정말?' : '취소'}</button></div></div>`; }
// the job card updates itself while the panel is open
let jobUiT = 0;
function jobPanelTick(dt) { if (!panel || panel.kind !== 'craft' || !TIMED[panel.st]) return; jobUiT -= dt; if (jobUiT > 0) return; jobUiT = .25;
  const o = panel.i != null && G.objs.get(panel.i), j = o && o.job, card = document.querySelector('#sheet .jobcard');
  if (!j) { if (card) renderPanel(); return; } if (!card || +card.dataset.done !== jobDone(j)) { renderPanel(); return; }
  const bar = document.getElementById('jobBar'), tx = document.getElementById('jobTxt'), d = jobDone(j);
  if (bar) bar.style.width = Math.round(clamp((nowS() - j.t0) / (j.q * j.per), 0, 1) * 100) + '%'; if (tx) tx.textContent = `${d}/${j.q} 완료${d < j.q ? ` · 남은 시간 ${fmtT(jobLeft(j))}` : ''}`; }
// v59: the world (crops, trees, animals, pits …) keeps growing while the game is closed or the tab is in the background
const OFF_MAX = 30 * 86400;
function advanceOffline(sec) { if (!G || !(sec > 1)) return 0; sec = Math.min(sec, OFF_MAX); G.time += sec; for (const b of G.buffs || []) b.end += sec; return sec; } // food buffs wait for you
const buffText = it => { if (!it.buff) return ''; const [ef, tier] = it.buff, E = EFF[ef], m = BUFF_DUR[tier - 1] * (it.star ? 1.5 : 1) / 60; return `${E.n} ${E.t(E.v[tier - 1])} · ${Number.isInteger(m) ? m : m.toFixed(1)}분`; };
const dishIcon = (shape, c) => A => {
  const [a, b, d] = c;
  if (shape === 'bowl') { A.e(8, 10.6, 6.2, 3.8, '#e8e0d0'); A.e(8, 9.4, 5.6, 2, a); A.p(6, 9, b); A.p(10, 10, b); A.p(8, 9, d || b); A.r(2, 9, 12, 1, '#ffffff'); A.r(6, 14, 4, 1, '#c9c0b0'); A.p(6, 6, '#ffffff'); A.p(9, 5, '#ffffff'); A.p(7, 4, '#e8e0f0'); }
  else if (shape === 'plate') { A.e(8, 12, 7, 2.6, '#c9c0d6'); A.e(8, 11.4, 6, 1.8, '#ffffff'); A.e(8, 9.4, 4.4, 2.4, a); A.p(6, 8, '#ffffff'); A.p(10, 8, b); A.p(7, 10, b); A.p(11, 10, b); }
  else if (shape === 'skewer') { A.line(2, 15, 14, 2, C.woodL); A.e(5.4, 11.4, 2.2, 2.2, a); A.e(8.4, 8.2, 2.2, 2.2, b); A.e(11.2, 5.2, 2, 2, a); A.p(5, 10, '#ffffff'); A.p(8, 7, '#ffffff'); }
  else if (shape === 'dango') { A.line(8, 15, 8, 1, C.woodL); A.e(8, 4, 2.8, 2.4, c[0]); A.e(8, 8.2, 2.8, 2.4, c[1]); A.e(8, 12.2, 2.8, 2.4, c[2]); A.p(7, 3, '#ffffff'); A.p(7, 7, '#ffffff'); A.p(7, 11, '#ffffff'); }
  else if (shape === 'cup') { A.e(13, 9.4, 2, 2.4, '#f4f0f8'); A.e(13, 9.4, 1, 1.4, '#1b142600'); A.r(4, 6, 8, 8, '#f4f0f8'); A.r(4, 6, 8, 1, '#ffffff'); A.r(5, 7, 6, 2, a); A.r(4, 13, 8, 1, '#c9c0d6'); A.p(7, 3, b); A.p(9, 4, b); A.e(8, 8, 1.2, .6, '#ffffff'); }
  else if (shape === 'cake') { A.e(8, 11.4, 6.6, 3.4, '#c99560'); A.e(8, 10.2, 6.2, 2.8, a); for (const [x, y] of [[5, 10], [8, 9], [11, 10], [7, 11]]) A.p(x, y, b); A.p(6, 9, '#ffffff'); }
  else { A.e(8, 14, 6, 1.2, '#e8e0f0'); A.e(8, 10, 5.4, 4.4, a); A.e(6.4, 8.2, 1.8, 1.4, '#ffffff'); A.p(10, 11, b); A.p(9, 6, b); } };
for (const d of DISHES) { const [fd, hl] = DISH_FOOD[d[3]]; ITEMS[d[0]] = { n: d[1], kind: 'food', food: fd, heal: hl, buff: d[2] ? [d[2], d[3]] : null, d: d[2] ? `버프 요리예요. 먹으면 효과가 생겨요.` : '얼큰하고 든든한 매운탕. 체력을 많이 회복해요.' }; ICON[d[0]] = dishIcon(d[4], d[5]);
  const r = Rc(d[0], 1, d[6], 'pot', 'food'); r.dish = d[0]; RECIPES.push(r); }
// recipe notes: picking one up teaches the dish (they never stay in the bag)
const noteIcon = A => { A.r(3, 2, 10, 12, '#f3e7c8'); A.r(3, 2, 10, 1, '#d8c79c'); A.r(3, 13, 10, 1, '#d8c79c'); for (const y of [5, 7, 9]) A.r(5, y, y === 7 ? 5 : 6, 1, '#b8a47a'); A.e(11, 11.5, 1.8, 1.8, '#e36b6b'); A.p(11, 11, '#ff9ab0'); };
for (const d of DISHES) { ITEMS['rn_' + d[0]] = { n: `레시피 쪽지 · ${d[1]}`, note: d[0], d: '주우면 바로 요리솥 레시피를 알게 돼요.' }; ICON['rn_' + d[0]] = noteIcon; }
// star dishes: cooked with at least one star crop → effect lasts 1.5×, fills 1.2×
for (const r of RECIPES.filter(r => r.at === 'pot' && r.cat === 'food')) { const id = r.out, base = ITEMS[id]; if (!base || base.star) continue;
  const k = r.req.findIndex(([m]) => STAR_OF[m]); if (k < 0) continue; const [m, c] = r.req[k], sm = STAR_OF[m];
  ITEMS[id + 'S'] = { ...base, n: '별 ' + base.n, food: Math.round(base.food * 1.2), star: 1, base: id, d: '별 작물로 만든 특별한 요리. 효과가 1.5배 오래가고 배가 더 불러요.' }; ICON[id + 'S'] = (f => A => { f(A); starMark(A); })(ICON[id]);
  const req = r.req.map(x => x.slice()); if (c > 1) { req[k][1] = c - 1; req.push([sm, 1]); } else req[k] = [sm, 1];
  const sr = Rc(id + 'S', 1, req, 'pot', 'food'); sr.dish = r.dish; sr.star = 1; sr.need = () => knows(id) && availCount0(sm) > 0; RECIPES.push(sr); }
ITEMS.anyPetal = { n: '아무 꽃잎', virtual: 1 }; ICON.anyPetal = A => { A.e(6, 8, 3.4, 2.6, '#f7b8cf'); A.e(10, 9, 3.2, 2.6, '#ffd25c'); A.e(8, 6, 2.6, 2.2, '#6fa8ff'); A.p(8, 8, '#ffffff'); };
for (const c in FLOWERS) if (ITEMS['petal' + c]) ITEMS['petal' + c].petal = 1;
ITEMS.bottle = { n: '병 속 쪽지', virtual: 1 }; ICON.bottle = A => { A.r(6, 2, 4, 3, '#c9a46b'); A.e(8, 10, 4.4, 5, '#9fd8f0'); A.e(8, 10, 3.6, 4.2, '#c8eefc'); A.r(6, 8, 4, 4, '#f3e7c8'); A.r(7, 9, 2, 1, '#b8a47a'); A.p(6, 6, '#ffffff'); };
function learnRecipe(id, quiet) { if (!DISH[id] || !G) return false; G.recipes = G.recipes || {}; if (G.recipes[id]) return false; G.recipes[id] = 1; UIS.craftOrder = null;
  if (!quiet) { toast(`새 레시피를 알게 됐어요: ${DISH[id].n}! (요리솥)`, 'good'); SFX.seed(); } return true; }
const NOTE_CH = { mon: .06, gather: .03, fish: .08 };
function maybeNote(src, x, y) { if (!G || !G.recipes || Math.random() >= (NOTE_CH[src] || 0)) return; const pool = DISHES.filter(d => d[7] === src && !knows(d[0]) && !G.drops.some(q => q.id === 'rn_' + d[0])); if (!pool.length) return; spawnDrop('rn_' + pool[(Math.random() * pool.length) | 0][0], 1, x, y); }
function roomNotes(r) { const list = ROOM_NOTES[r.b] || [], n = (G.rooms || []).filter(q => q.b === r.b).length; return n >= list.length ? [list[r.k]].filter(Boolean) : r.k === 0 ? list.slice() : []; }
function bossNoteIds(k) { const list = (BOSS_NOTES[k] || []).slice(), rg = BOSS_REGION[k]; if (rg != null && !(G.rooms || []).some(q => q.b === rg)) list.push(...ROOM_NOTES[rg]); return list; }
for (const [qid, dish] of [['s_crop2', 'glowPancake'], ['s_crop4', 'beanSteam'], ['s_rooms', 'petalRiceCake'], ['s_fish', 'crucianBraise']]) { const q = QSIDE.find(x => x.id === qid); if (q) q.rw = q.rw.concat([['rn_' + dish, 1]]); }
// ---- buffs ----
const activeBuffs = () => (G && G.buffs ? G.buffs.filter(b => b.end > G.time) : []);
function bval(ef) { if (!G || !G.buffs) return 0; let best = null; for (const b of G.buffs) if (b.ef === ef && b.end > G.time && (!best || b.tier > best.tier)) best = b; return best ? EFF[ef].v[best.tier - 1] : 0; }
const luckTier = () => Math.max(bval('luck'), (G.luck || 0) > G.time ? 2 : 0, petIs('cat') ? 1 : 0); // the fountain wish counts as a tier-2 luck effect
let buffAsk = null;
function buffCheck(it, id) { const [ef, tier] = it.buff, act = activeBuffs(), same = act.find(b => b.ef === ef);
  if (same) { if (same.tier > tier) { toast('더 좋은 효과가 이미 있어요 · 배만 불러요', null, 'buffLow'); return 'lower'; } return 'ok'; }
  if (act.length < BUFF_MAX) return 'ok';
  if (buffAsk && buffAsk.id === id && performance.now() < buffAsk.until) { buffAsk = null; return 'ok'; }
  const sh = act.reduce((a, b) => b.end < a.end ? b : a); buffAsk = { id, until: performance.now() + 5000 };
  toast(`효과 칸이 가득 찼어요. 한 번 더 먹으면 남은 시간이 가장 짧은 「${EFF[sh.ef].n}」 효과와 바꿔요`, 'warn', 'buffFull'); return 'ask'; }
function applyBuff(it, id) { const [ef, tier] = it.buff, dur = BUFF_DUR[tier - 1] * (it.star ? 1.5 : 1); G.buffs = activeBuffs();
  const same = G.buffs.find(b => b.ef === ef); if (same) Object.assign(same, { tier, end: G.time + dur, max: dur, id });
  else { if (G.buffs.length >= BUFF_MAX) { const sh = G.buffs.reduce((a, b) => b.end < a.end ? b : a); G.buffs.splice(G.buffs.indexOf(sh), 1); } G.buffs.push({ ef, tier, end: G.time + dur, max: dur, id }); }
  if (ef === 'maxhp') G.p.hp = Math.min(maxHp(), G.p.hp); toast(`${EFF[ef].n} ${EFF[ef].t(EFF[ef].v[tier - 1])} · ${Math.round(dur / 6) / 10}분`, 'good', 'buff'); buffDirty = true; }
let buffDirty = true, lastBuffKey = '', buffRegenT = 0;
function buffTick(dt) {
  if (!G.buffs) G.buffs = []; if (G.buffs.some(b => b.end <= G.time)) { const gone = G.buffs.filter(b => b.end <= G.time); G.buffs = G.buffs.filter(b => b.end > G.time); for (const b of gone) toast(`${EFF[b.ef].n} 효과가 끝났어요`, null, 'buffEnd'); if (G.p.hp > maxHp()) G.p.hp = maxHp(); buffDirty = true; }
  const rg = bval('regen'); if (rg && G.p.dead <= 0) { buffRegenT += dt; if (buffRegenT >= rg) { buffRegenT = 0; if (G.p.hp < maxHp()) G.p.hp = Math.min(maxHp(), G.p.hp + 1); } } else buffRegenT = 0;
}
function drawBuffs() { const el = $('#buffs'); if (!el) return; const act = activeBuffs(); const key = act.map(b => b.id + ':' + Math.ceil((b.end - G.time) / b.max * 24)).join('|');
  if (key === lastBuffKey && !buffDirty) return; lastBuffKey = key; buffDirty = false; el.hidden = !act.length;
  el.innerHTML = act.map(b => `<span class="bf" title="${EFF[b.ef].n} ${EFF[b.ef].t(EFF[b.ef].v[b.tier - 1])}" style="--f:${Math.max(0, (b.end - G.time) / b.max).toFixed(3)}"><img class="px" src="${iconURL(b.id)}" alt="${EFF[b.ef].n}"><i>${b.tier}</i></span>`).join(''); }
// ---- fishing luck, message bottles ----
const LUCK_KOI = [1, 1.5, 2, 3], LUCK_BOOT = [1, .7, .5, .25], LUCK_BOTTLE = [.01, .02, .04, .06];
function catchTable(b) { const L = luckTier(), base = (CATCH[b] || CATCH[0]).map(([k, w]) => [k, k === 'koi' ? w * LUCK_KOI[L] : k === 'boot' ? w * LUCK_BOOT[L] : w]); const tot = base.reduce((a, x) => a + x[1], 0), pb = LUCK_BOTTLE[L]; base.push(['bottle', tot * pb / (1 - pb)]); return base; }
function fishBottle() {
  if (!knows('koiSteam')) { learnRecipe('koiSteam', true); toast('병 속에서 쪽지가 나왔어요! 새 레시피: 별빛 잉어찜', 'good'); SFX.seed(); return; }
  const cs = Object.keys(FLOWERS), pool = [['petal' + cs[(Math.random() * cs.length) | 0], 2], ['crystal', 2], ['gel', 2], [['glowSpore', 'cbeanSeed', 'berrySeed'][(Math.random() * 3) | 0], 2]];
  pool.sort(() => Math.random() - .5); for (const [id, c] of pool.slice(0, 3)) { const l = addItem(id, c); if (l) spawnDrop(id, l, G.p.x, G.p.y); } toast('작은 보물상자를 낚았어요!', 'good'); }
