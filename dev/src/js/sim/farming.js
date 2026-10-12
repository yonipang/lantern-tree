// ================= 농사: 물·비료·별 작물·주변 수확, 자동화(스프링클러·자동 수확기)·거대 작물, 나무 작업장·채굴장 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
const growOf = o => (OBJ[o.t] && OBJ[o.t].grow) || FARM_GROW;
const farmStage = o => Math.max(0, Math.min(3, Math.floor((G.time - (o.p || 0)) / growOf(o) * 3)));
const farmLbl = o => (o.store || []).length ? '꺼내기' : farmStage(o) >= 3 ? farmT(o)[0] : '살펴보기';
function pitStat(o, n) { G.stats.quarried = (G.stats.quarried || 0) + n; if (o.t !== 'quarry') G.stats.drilled = (G.stats.drilled || 0) + n; }
const farmT = o => FARM_TXT[o.t] || FARM_TXT.treeFarm;
function farmYield(o) { const py = o && PIT_Y[o.t]; if (py) return [[py[0], py[1] + (rand() * (py[2] - py[1] + 1) | 0)]]; // v46: the stone pit gives only stone
  const out = [['wood', 5 + (rand() * 3 | 0)]]; if (rand() < .35) out.push(['resin', 1]); if (rand() < .12) out.push(['sapling', 1]); if (rand() < .5) out.push(['fiber', 1 + (rand() * 2 | 0)]); return out; }
function farmHarvest(i, o, auto) { const x = i % W, y = (i / W) | 0;
  if (!auto) { const got = farmYield(o); o.p = G.time; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1]; for (const [id, c] of got) spawnDrop(id, c, x + 1, y + 1.2); emit('sfx', 'brk'); emit('puff', x + 1, y + 1, farmT(o)[3], 10, 2.5); gainXp(2); return true; }
  const chests = []; for (const j of fpTiles(i, o)) { const jx = j % W, jy = (j / W) | 0; for (const [dx, dy] of D4) { if (!inB(jx + dx, jy + dy)) continue; const c = G.objs.get(idx(jx + dx, jy + dy)); if (c && c.t === 'chest' && c.items && !chests.includes(c)) chests.push(c); } }
  const stN = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (stN >= FARM_CAP && !chests.some(c => c.items.some(z => !z))) { o.why = 'full'; return false; }
  const got = farmYield(o); o.p = G.time; o.why = ''; if (PIT_Y[o.t]) pitStat(o, got[0][1]); else G.stats.farmed = (G.stats.farmed || 0) + got[0][1];
  for (const [id, c] of got) { let left = c; for (const ch of chests) { if (!left) break; left = moveInto(ch.items, { id, c: left }); } if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, FARM_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } }
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 14) { emit('puff', x + 1, y + 1, farmT(o)[3], 8, 2); emit('sfx', 'brk'); } return true; }
const recipeOn = r => (r.bag == null || r.bag === (G.bagLv || 0)) && (!r.need || r.need());
function clampCrop(o) { if (o.p0 != null) o.p = Math.max(o.p, o.p0 - OBJ[o.t].grow * .5); }
function cropMsg(o, cs, i) { const d = OBJ[o.t], rem = Math.max(0, d.grow - (G.time - o.p)), left = rem >= 90 ? `${Math.round(rem / 60)}분쯤` : `${Math.max(10, Math.ceil(rem / 10) * 10)}초쯤`;
  const sf = CROP_SOIL[o.t], soil = sf == null || !beat('golem') ? '' : sf === G.floor[i] ? ' · 맞는 흙 ★' : ` · ${SOIL_N[sf]}에 심으면 별 작물이 자라요`;
  return `${d.n} · ${CROP_STEP[d.crop][cs]} (${cs + 1}/4단계) · ${left} 남았어요${o.w ? ' · 물 줌' : ''}${o.f ? ' · 비료 줌' : ''}${soil}`; }
function ripeAround(cx, cy) { const out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = cx + dx, y = cy + dy; if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t] && OBJ[o.t].crop && cropStage(o) >= 3) out.push([x, y, o]); } return out; }
function waterCrop(t, o) { const s = selItem(); if (!s || s.id !== 'wcan' || (s.w || 0) <= 0 || o.w || !OBJ[o.t].crop) return;
  s.w--; o.w = 1; if (o.p0 == null) o.p0 = o.p; invDirty = true; emit('sfx', 'place'); emit('puff', t.x + .5, t.y + .7, '#8fd0f0', 7, 1.8, .2);
  if (!s.w) emit('toast', '물뿌리개가 비었어요. 물가를 바라보고 눌러 채워요', null, 'wcanEmpty'); }
function fertCrop(t, o) { const s = selItem(), it = s && ITEMS[s.id]; if (!it || it.kind !== 'fert' || o.f || !OBJ[o.t].crop) return; const d = OBJ[o.t];
  if (o.p0 == null) o.p0 = o.p; const rem = d.grow - (G.time - o.p); if (rem > 0) o.p -= rem * .4; clampCrop(o); o.f = it.fx === 'shroom' ? 2 : it.fx === 'cry' ? 3 : 1;
  s.c--; if (!s.c) { G.inv[G.sel] = null; refillHot(G.sel, s.id); } G.stats.fert = (G.stats.fert || 0) + 1; invDirty = true; emit('sfx', 'craft'); emit('puff', t.x + .5, t.y + .7, '#e8d098', 9, 2, .25); }
function fillCan(t) { const s = selItem(); if (!s || s.id !== 'wcan') return; s.w = WCAN_MAX; invDirty = true; emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .5, '#bfe6ff', 8, 2, .2); emit('toast', '물뿌리개를 가득 채웠어요', 'good', 'wfill'); }
// decided once, when the crop is grown: only on its own soil, only after the golem; crystal fertilizer raises the odds
function rollStar(i, o) { o.star = beat('golem') && CROP_SOIL[o.t] != null && CROP_SOIL[o.t] === G.floor[i] && rand() < (o.f === 3 ? .35 : .15) ? 1 : 0; }
// what one ripe crop gives (star and mushroom-fertilizer rules apply, the sickle bonus does not); also counts it for the quests
function cropYield(i, o) { const d = OBJ[o.t]; if (o.star == null) rollStar(i, o); const out = [];
  for (const [id, a, b, ch] of d.yield.map(([id, a, b, ch], k) => [!k && o.star && STAR_OF[id] ? STAR_OF[id] : id, a, b, id === 'glowcap' && o.f === 2 ? .6 : ch])) if (rand() < ch) { const c = rint(a, b); if (c > 0) out.push([id, c]); }
  const S = G.stats; S.cropH = (S.cropH || 0) + 1; if (o.t === 'cropBerry') S.berryH = (S.berryH || 0) + 1; if (o.w) S.wetH = (S.wetH || 0) + 1; if (o.star) S.starH = (S.starH || 0) + 1; return out; }
function devStore(i, o, got) { const x = i % W, y = (i / W) | 0; for (const [id, c] of got) { let left = c; for (const [dx, dy] of D4) { if (!left) break; const ch = inB(x + dx, y + dy) && G.objs.get(idx(x + dx, y + dy)); if (ch && ch.t === 'chest' && ch.items) left = moveInto(ch.items, { id, c: left }); }
    if (left) { o.store = o.store || []; const n = o.store.reduce((a, s2) => a + s2.c, 0), add = Math.min(left, HARV_CAP - n); if (add > 0) { const s2 = o.store.find(z => z.id === id); if (s2) s2.c += add; else o.store.push({ id, c: add }); } } } }
function farmDevStep(i, o, d, on, dt) { const x = i % W, y = (i / W) | 0; o.work = on; if (!on) return; o.prog = (o.prog || 0) + dt;
  if (d.dev === 'sprk') { if (o.prog < SPRK_EVERY) return; o.prog = 0; let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const c = inB(x + dx, y + dy) && G.objs.get(idx(x + dx, y + dy)); if (c && OBJ[c.t] && OBJ[c.t].crop && !c.w && cropStage(c) < 3) { c.w = 1; if (c.p0 == null) c.p0 = c.p; n++; } }
    if (n && Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) < 14) emit('spray', x + .5, y + .2); return; }
  if (o.prog < HARV_EVERY) return; o.prog = 0; const n0 = (o.store || []).reduce((a, s2) => a + s2.c, 0); if (n0 >= HARV_CAP) { o.why = 'full'; return; } o.why = '';
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const j = inB(x + dx, y + dy) ? idx(x + dx, y + dy) : -1, c = j >= 0 && G.objs.get(j); if (!c || !OBJ[c.t] || !OBJ[c.t].crop || cropStage(c) < 3) continue;
    G.objs.delete(j); devStore(i, o, cropYield(j, c)); if (Math.hypot(x + dx + .5 - G.p.x, y + dy + .5 - G.p.y) < 14) emit('puff', x + dx + .5, y + dy + .5, '#9be37a', 5, 2); G.stats.autoH = (G.stats.autoH || 0) + 1; } }
function giantTry(i, o) { if (o.gt || !beat('golem')) return; const x = i % W, y = (i / W) | 0, js = [i, idx(x + 1, y), idx(x, y + 1), idx(x + 1, y + 1)];
  if (!inB(x + 1, y + 1)) return; const cs = js.map(j => G.objs.get(j)); if (cs.some(c => !c || c.t !== o.t || cropStage(c) < 3 || c.gt || c.star)) return;
  if (js.some(j => CROP_SOIL[o.t] !== G.floor[j])) return; for (const c of cs) c.gt = 1; if (rand() >= GIANT_CH) return;
  for (const j of js) G.objs.delete(j); const g = { t: 'giantCrop', c: o.t }; G.objs.set(i, g); setParts(i, g); G.stats.giants = (G.stats.giants || 0) + 1;
  if (Math.hypot(x + 1 - G.p.x, y + 1 - G.p.y) < 16) { emit('puff', x + 1, y + 1, '#ffe9a8', 26, 3.5, .6); emit('sfx', 'win'); emit('toast', `${josa('거대 ' + OBJ[o.t].n, '이', '가')} 자랐어요!`, 'good', 'giant'); } lightDirty = true; }
function harvestGiant(t, o) { const base = OBJ[o.c], [id, a, b] = base.yield[0], seed = base.yield[1] && base.yield[1][0]; delObj(idx(t.x, t.y)); spawnDrop(id, rint(a * 6, b * 6), t.x + 1, t.y + 1); if (seed) spawnDrop(seed, 3, t.x + 1, t.y + 1);
  const S = G.stats; S.cropH = (S.cropH || 0) + 1; S.giantH = (S.giantH || 0) + 1; emit('sfx', 'win'); emit('puff', t.x + 1, t.y + 1, '#9be37a', 20, 3.5); gainXp(20); }
