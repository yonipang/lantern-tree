// ================= farm automation (after the crystal generator), giant crops, the festival cake =================
const hasCgen = () => ((G.stats.made || {}).crystalGen || 0) > 0 || [...G.objs.values()].some(o => o.t === 'crystalGen');
const HARV_CAP = 60, HARV_EVERY = 3, SPRK_EVERY = 2;
Object.assign(ITEMS, {
  sprinkler: { n: '스프링클러', kind: 'place', obj: 'sprinkler', d: '전기가 들어오면 둘레 5×5 칸의 자라는 작물에 물을 줘요 (물 준 작물은 25% 빨리 자라요).' },
  harvester: { n: '자동 수확기', kind: 'place', obj: 'harvester', d: '전기가 들어오면 둘레 3×3 칸의 다 자란 작물을 거둬서 옆 상자에 담아요 (구리 낫 보너스는 없어요). 상자가 없거나 차면 안에 모아 둬요.' },
});
Object.assign(OBJ, {
  sprinkler: { n: '스프링클러', solid: 1, item: 'sprinkler', dev: 'sprk', draw: .3, idle: .02 },
  harvester: { n: '자동 수확기', solid: 1, item: 'harvester', dev: 'harv', draw: .4, idle: .02 },
});
Object.assign(OSPR, {
  sprinkler: [16, 18, A => { A.e(8, 16.5, 5, 1.4, '#6f6a86'); A.r(5, 12, 6, 4, '#8e89a3'); A.r(5, 12, 6, 1, '#bab5cb'); A.r(7, 5, 2, 7, C.copper); A.r(7, 5, 1, 7, C.copperL); A.e(8, 4.5, 3.6, 1.8, C.copperD); A.e(8, 4, 3, 1.2, C.copperL); for (const x of [4, 8, 12]) A.p(x, 2, '#8fd0f0'); A.p(6, 1, '#bfe6ff'); A.p(10, 1, '#bfe6ff'); A.r(6, 14, 4, 1, '#3f7fb5'); }],
  harvester: [16, 20, A => { A.r(2, 8, 12, 11, C.ironD); A.r(3, 9, 10, 9, C.iron); A.r(3, 9, 10, 1, C.ironL); A.r(5, 11, 6, 4, '#2a2238'); A.r(6, 12, 4, 2, '#7fe0b5'); A.line(2, 8, 0, 4, C.woodD); A.line(14, 8, 16, 4, C.woodD); A.e(1, 4, 2, 1.2, C.cryL); A.e(15, 4, 2, 1.2, C.cryL); A.r(4, 18, 8, 1, '#3a3270'); A.p(7, 5, C.cry); A.r(6, 5, 4, 3, C.cry); A.p(7, 5, '#ffffff'); }],
});
Object.assign(USE, { sprinkler: 'sprk', harvester: 'harv' }); Object.assign(USE_LBL, { sprk: '살펴보기', harv: '꺼내기' });
RECIPES.push(Object.assign(Rc('sprinkler', 1, [['ironBar', 4], ['copperBar', 2], ['gWater', 2]], 'forge', 'farm'), { need: hasCgen }), Object.assign(Rc('harvester', 1, [['ironBar', 6], ['crystal', 4], ['wire', 4]], 'forge', 'farm'), { need: hasCgen }));
// what one ripe crop gives (star and mushroom-fertilizer rules apply, the sickle bonus does not); also counts it for the quests
function cropYield(i, o) { const d = OBJ[o.t]; if (o.star == null) rollStar(i, o); const out = [];
  for (const [id, a, b, ch] of d.yield.map(([id, a, b, ch], k) => [!k && o.star && STAR_OF[id] ? STAR_OF[id] : id, a, b, id === 'glowcap' && o.f === 2 ? .6 : ch])) if (Math.random() < ch) { const c = rint(a, b); if (c > 0) out.push([id, c]); }
  const S = G.stats; S.cropH = (S.cropH || 0) + 1; if (o.t === 'cropBerry') S.berryH = (S.berryH || 0) + 1; if (o.w) S.wetH = (S.wetH || 0) + 1; if (o.star) S.starH = (S.starH || 0) + 1; return out; }
function devStore(i, o, got) { const x = i % W, y = (i / W) | 0; for (const [id, c] of got) { let left = c; for (const [dx, dy] of D4) { if (!left) break; const ch = inB(x + dx, y + dy) && G.objs.get(idx(x + dx, y + dy)); if (ch && ch.t === 'chest' && ch.items) left = moveInto(ch.items, { id, c: left }); }
    if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, HARV_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } } }
function farmDevStep(i, o, d, on, dt) { const x = i % W, y = (i / W) | 0; o.work = on; if (!on) return; o.prog = (o.prog || 0) + dt;
  if (d.dev === 'sprk') { if (o.prog < SPRK_EVERY) return; o.prog = 0; let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = inB(x + dx, y + dy) && G.objs.get(idx(x + dx, y + dy)); if (c && OBJ[c.t] && OBJ[c.t].crop && !c.w && cropStage(c) < 3) { c.w = 1; if (c.p0 == null) c.p0 = c.p; n++; } }
    if (n && Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 14) for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; G.parts.push({ x: x + .5, y: y + .2, z: 1, vx: Math.cos(a) * 3, vy: Math.sin(a) * 2, vz: 1.5, life: .6, max: .6, col: '#8fd0ff', sz: 1 }); } return; }
  if (o.prog < HARV_EVERY) return; o.prog = 0; const n0 = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (n0 >= HARV_CAP) { o.why = 'full'; return; } o.why = '';
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const j = inB(x + dx, y + dy) ? idx(x + dx, y + dy) : -1, c = j >= 0 && G.objs.get(j); if (!c || !OBJ[c.t] || !OBJ[c.t].crop || cropStage(c) < 3) continue;
    G.objs.delete(j); devStore(i, o, cropYield(j, c)); if (Math.hypot(x + dx + .5 - G.p.x, y + dy + .5 - G.p.y) < 14) puff(x + dx + .5, y + dy + .5, '#9be37a', 5, 2); G.stats.autoH = (G.stats.autoH || 0) + 1; } }
// giant crops: four of the same crop in a 2×2 square on their own soil, all grown → 3% chance to merge into one giant (6× harvest, 3 seeds)
const GIANT_CH = .03;
OBJ.giantCrop = { n: '거대 작물', sz: [2, 2], solid: 1, giant: 1 };
function giantTry(i, o) { if (o.gt || !beat('golem')) return; const x = i % W, y = (i / W) | 0, js = [i, idx(x + 1, y), idx(x, y + 1), idx(x + 1, y + 1)];
  if (!inB(x + 1, y + 1)) return; const cs = js.map(j => G.objs.get(j)); if (cs.some(c => !c || c.t !== o.t || cropStage(c) < 3 || c.gt || c.star)) return;
  if (js.some(j => CROP_SOIL[o.t] !== G.floor[j])) return; for (const c of cs) c.gt = 1; if (Math.random() >= GIANT_CH) return;
  for (const j of js) G.objs.delete(j); const g = { t: 'giantCrop', c: o.t }; G.objs.set(i, g); setParts(i, g); G.stats.giants = (G.stats.giants || 0) + 1;
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 16) { puff(x + 1, y + 1, '#ffe9a8', 26, 3.5, .6); SFX.win(); toast(`${josa('거대 ' + OBJ[o.t].n, '이', '가')} 자랐어요!`, 'good', 'giant'); } lightDirty = true; }
function harvestGiant(t, o) { const base = OBJ[o.c], [id, a, b] = base.yield[0], seed = base.yield[1] && base.yield[1][0]; delObj(idx(t.x, t.y)); spawnDrop(id, rint(a * 6, b * 6), t.x + 1, t.y + 1); if (seed) spawnDrop(seed, 3, t.x + 1, t.y + 1);
  const S = G.stats; S.cropH = (S.cropH || 0) + 1; S.giantH = (S.giantH || 0) + 1; SFX.win(); puff(t.x + 1, t.y + 1, '#9be37a', 20, 3.5); gainXp(20); }
const giantSpr = kind => { const src = SPR.crop[kind][3][0], s = src.hd ? HD : 1, c = mk(32 * s, 32 * s, A => { A.g.imageSmoothingEnabled = false; A.g.drawImage(src, 0, 0, 32 * s, 32 * s); }, null); c.hd = src.hd; return c; };
QSIDE.push({ id: 's_auto', t: () => `자동 수확기로 작물 20개 거두기 (${Math.min(20, G.stats.autoH || 0)}/20)`, h: '수정 발전기를 만든 뒤 작업대에서 자동 수확기와 스프링클러를 만들어요. 전선으로 전기를 이어 주세요.', done: () => (G.stats.autoH || 0) >= 20, rw: [['crystal', 10], ['goldBar', 2]], xp: 80 },
  { id: 's_giant', t: '거대 작물 거두기', h: '같은 작물 네 개를 2×2로 맞는 흙에 심어 두면, 다 자랐을 때 아주 가끔 하나로 합쳐져요.', done: () => (G.stats.giantH || 0) >= 1, rw: [['fertCry', 6], ['cbeanSeed', 4]], xp: 100 });
// festival cake: the true ending's reward; eat it, or set it on a table as decoration
DISHES.push(['festCake', '등불 축제 케이크', null, 0, 'cake', ['#fff1d6', '#ff7aa2'], [['berry', 5], ['petalR', 1], ['petalB', 1], ['petalY', 1], ['petalW', 1], ['petalK', 1], ['glowcap', 2]], 'ending']);
DISH.festCake = { id: 'festCake', n: '등불 축제 케이크', ef: null, tier: 0, shape: 'cake', req: DISHES[DISHES.length - 1][6], src: 'ending' };
ITEMS.festCake = { n: '등불 축제 케이크', kind: 'food', food: 100, heal: 40, cake: 1, d: '다섯 등불을 밝힌 날의 축하 케이크. 먹으면 배가 가득 차요. 탁자 앞에서 들고 누르면 탁자 위에 올려 장식해요.' };
ICON.festCake = A => { A.e(8, 12.6, 6.8, 2.4, '#e8e0f0'); A.r(3, 7, 10, 5, '#fff1d6'); A.e(8, 7, 5, 1.8, '#ffffff'); A.r(3, 9, 10, 1, '#ff9ab0'); A.e(8, 12, 5, 1.6, '#f2d38a'); for (const [x, c] of [[4, '#ff6b81'], [6, '#6fa8ff'], [8, '#ffd25c'], [10, '#f4f0f8'], [12, '#4a3f5c']]) A.p(x, 6, c); A.r(7, 2, 2, 4, '#ffd27a'); A.p(8, 1, '#fff1c0'); };
ITEMS.rn_festCake = { n: '레시피 쪽지 · 등불 축제 케이크', note: 'festCake', d: '주우면 바로 요리솥 레시피를 알게 돼요.' }; ICON.rn_festCake = noteIcon;
{ const r = Rc('festCake', 1, DISH.festCake.req, 'pot', 'food'); r.dish = 'festCake'; RECIPES.push(r); }
const CAKE_TABLES = ['table', 'shroomTable', 'cryTable', 'longTable'];
TIPS.push('수정 발전기를 만들면 스프링클러와 자동 수확기로 밭을 자동으로 돌볼 수 있어요.', '같은 작물 네 개를 2×2로 맞는 흙에 심으면 가끔 거대 작물이 자라요.');
TIPS.push('버프 요리는 세 가지까지 함께 효과가 있어요. 같은 효과는 가장 좋은 것 하나만 적용돼요.', '레시피 쪽지는 몬스터·채집·낚시·숨은 방·보스에서 찾을 수 있어요.', '별 작물을 넣어 만든 요리는 효과가 1.5배 오래가요.');
