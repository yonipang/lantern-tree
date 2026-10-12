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
