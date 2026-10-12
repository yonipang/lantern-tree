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
const benchLv = o => !o ? -1 : o.t === 'bench' || o.t === 'smelter' ? (o.lv || 0) : o.t === 'forge' ? 1 : -1;
const tierNames = st => TIERED[st] || BENCH_N;
function benchUpHTML(o) { const lv = benchLv(o); if (lv < 0) return ''; const st = o.t === 'smelter' ? 'smelter' : 'bench', NM = tierNames(st), IT = TIER_IT[st];
  if (lv >= BENCH_MAX) return `<p class="hint">가장 높은 단계 ${st === 'smelter' ? '장비제작대' : '작업대'}예요 · 모든 ${st === 'smelter' ? '장비' : '작업대 물건'}를 만들 수 있어요</p>`;
  const cost = BENCH_UP[lv + 1], ok = cost.every(([id, c]) => availCount(id) >= c);
  return `<div class="rc ${ok ? 'ok' : 'no'} benchup" style="margin-bottom:10px"><div class="ri"><img class="px" src="${iconURL(IT[lv + 1])}" alt=""></div><div class="rn">${NM[lv + 1]}로 올리기<small>새 ${st === 'smelter' ? '장비가' : '물건이'} 더 생겨요</small><div class="ings">${cost.map(([id, c]) => { const have = availCount(id); return `<span class="ing ${have < c ? 'short' : ''}"><img class="px" src="${iconURL(id)}" alt="">${ITEMS[id].n} ${have}/${c}</span>`; }).join('')}</div></div><button type="button" class="btn mk" data-a="benchUp" ${ok ? '' : 'disabled'}>올리기</button></div>`; }
