// ================= 제작: 가까운 제작대·제작 자리, 만들 수 있는지, 강화·분해·수리·작업대 올리기·제작 명령, 용광로·요리솥 시간 작업 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// recipes people usually make many of at once get a quantity picker
const isMulti = r => ['build', 'food', 'mat'].includes(r.cat) || ['floor', 'wall', 'ground', 'food', 'mat', 'fert'].includes(ITEMS[r.out].kind);
function maxCraft(r) { let m = 99; for (const [id, c] of r.req) m = Math.min(m, Math.floor(availCount(id) / c)); return Math.max(0, m); }
const benchNear = near => near.has('bench') || near.has('forge');
function repairCost(s) { const mx = durMax(s.id), frac = 1 - durOf(s) / mx; return DUR[s.id][1].map(([id, c]) => [id, Math.max(1, Math.ceil(c * frac))]); }
function salvageGet(id) { const r = RECIPES.find(r => r.out === id), req = r ? r.req : SALVAGE_BASE[id]; if (!req) return null; return req.map(([m, c]) => [m, Math.round(c * SALVAGE_RATE)]).filter(([, c]) => c > 0); }
function salvGet2(s) { const m = new Map(); for (const [id, c] of salvageGet(s.id) || []) m.set(id, (m.get(id) || 0) + c); for (const [id, c] of upgSpent(s.id, lvOf(s))) m.set(id, (m.get(id) || 0) + Math.floor(c / 2)); const out = [...m].filter(([, c]) => c > 0); return out.length ? out : null; }
const canSalv = near => near.has('smelter'); // v61: only at the 장비제작대
const upgSlot = i => itemAt(i);
function nearStations() { const p = G.p, set = new Set(); for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) set.add(OBJ[o.t].station); } return set; }
const atHere = (r, st) => (r.at || null) === (st || null) || (st === 'bench' && !r.at);
// 제작 자리 c = { st: 어느 제작대 창(없으면 손 제작), i: 그 제작대 칸, tier: 칸 없이 연 창의 단계 }
const stationTier = c => c && TIERED[c.st] ? (c.i != null ? Math.max(0, benchLv(G.objs.get(c.i))) : c.tier || 0) : 0;
function craftable(r, near, c) { const st = (c && c.st) || null; return (!r.dish || knows(r.dish)) && atHere(r, st) && (!st || near.has(st)) && (!TIERED[st] || (r.tier || 0) <= stationTier(c)) && r.req.every(([id, c2]) => availCount(id) >= c2); }
// ---- 강화·분해·수리·작업대 올리기 (가까운 제작대와 연결된 상자의 재료를 함께 써요) ----
defineCmd('upg', c => { const s = upgSlot(c.i); if (!s || !upgOk(s.id) || lvOf(s) >= UPG_MAX || !nearStations().has('smelter')) return false; const cost = upgCost(s.id, lvOf(s)); POOL = null; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); s.lv = lvOf(s) + 1; G.stats.upg = (G.stats.upg || 0) + 1; emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffd25c', 14, 2.4, .5); emit('toast', `강화 성공! ${ITEMS[s.id].n} +${s.lv} · ${upgText(s.id, s.lv)}`, 'good'); emit('inv'); });
defineCmd('salv', c => { const s = itemAt(c.i), got = s && (DUR[s.id] || upgOk(s.id)) && salvGet2(s); if (!got || !canSalv(nearStations())) return false;
  clearSlot(c.i); for (const [id, n] of got) { const l = addItem(id, n, false); if (l) spawnDrop(id, l, G.p.x, G.p.y); }
  emit('sfx', 'brk'); emit('toast', `${josa(ITEMS[s.id].n, '을', '를')} 분해했어요: ${got.map(([id, n]) => ITEMS[id].n + ' ' + n + '개').join(', ')}`, 'good'); emit('inv'); });
defineCmd('fix', c => { const s = itemAt(c.i); if (!s || !DUR[s.id] || !nearStations().has('smelter')) return false; const cost = repairCost(s); POOL = null; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); s.dur = DUR[s.id][0]; emit('sfx', 'craft'); emit('toast', `${josa(ITEMS[s.id].n, '을', '를')} 새것처럼 고쳤어요`, 'good'); emit('inv'); });
defineCmd('benchUp', c => { const o = c.o != null ? G.objs.get(c.o) : null, lv = benchLv(o); if (lv < 0 || lv >= BENCH_MAX) return false; POOL = null; const cost = BENCH_UP[lv + 1]; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); if (o.t === 'forge') o.t = 'bench'; o.lv = lv + 1;
  if (o.t === 'smelter') G.stats.gearLv = Math.max(G.stats.gearLv || 0, o.lv); else { G.stats.forge = 1; G.stats.benchLv = Math.max(G.stats.benchLv || 0, o.lv); }
  const x = c.o % W, y = (c.o / W) | 0; emit('sfx', 'win'); emit('puff', x + 1, y + .3, BENCH_COL[o.lv], 22, 3, .6); emit('toast', `${tierNames(o.t)[o.lv]}로 올렸어요! 새로 만들 수 있는 것이 맨 위에 나와요`, 'good', 'benchup'); emit('inv'); checkGuide(); });
// ---- 제작 { r: 레시피 번호, q: 몇 번, st·i·tier: 제작 자리 } → false 못 만듦 · 'reorder' 목록 순서를 새로 · 그 밖은 다시 그리기 ----
defineCmd('craft', c => {
  const r = RECIPES[c.r], near = nearStations(); POOL = null; if (!craftable(r, near, c)) return false;
  const so = TIMED[r.at] && c.i != null ? G.objs.get(c.i) : null; // v59: the furnace / pot being used
  if (so && so.job) { emit('toast', `${STN[r.at]}에서 만드는 게 끝나면 넣을 수 있어요`, null, 'jobbusy'); return false; }
  const q = isMulti(r) ? clamp(c.q || 1, 1, Math.max(1, Math.min(so ? JOB_MAX : 99, maxCraft(r)))) : 1, total = r.n * q;
  const before = so ? stockMap() : null;
  for (const [id, n] of r.req) takeAvail(id, n * q);
  if (so) { const after = stockMap(), used = Object.keys(before).map(id => [id, before[id] - (after[id] || 0)]).filter(([, n]) => n > 0), per = jobTime(r);
    so.job = { out: r.out, n: r.n, q, per, t0: nowS(), used }; emit('sfx', 'place'); emit('toast', `${STN[r.at]}에 넣었어요 · ${fmtT(q * per)} 뒤에 다 돼요`, 'good', 'jobput'); emit('inv'); return 'reorder'; }
  G.stats.made = G.stats.made || {}; G.stats.made[r.out] = (G.stats.made[r.out] || 0) + q;
  if (ITEMS[r.out].bagUp) { G.bagLv = (G.bagLv || 0) + 1; while (G.inv.length < invSize()) G.inv.push(null); emit('sfx', 'craft'); emit('craftNote', r.out, 1, `가방이 ${G.inv.length - HOT}칸으로 늘었어요!`); emit('inv'); return 'reorder'; }
  const left = addItem(r.out, total); if (left) spawnDrop(r.out, left, G.p.x, G.p.y);
  emit('sfx', 'craft'); emit('craftNote', r.out, total); gainXp(Math.min(8, q * (r.tier ? 3 : r.at ? 1 : 0)));
  emit('inv'); checkGuide();
});
defineCmd('jobTake', c => { const o = c.o != null && G.objs.get(c.o); if (o) takeJob(o, G.p.x, G.p.y); });
defineCmd('jobCancel', c => { const o = c.o != null && G.objs.get(c.o); if (o) { cancelJob(o, G.p.x, G.p.y); emit('sfx', 'click'); emit('toast', '취소하고 재료를 돌려받았어요', null, 'jobcancel'); } });
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
  if (!quiet) { emit('sfx', 'craft'); emit('craftNote', j.out, total); } emit('inv'); checkGuide(); return total; }
// cancelling hands back what is finished and the materials of everything not started yet
function cancelJob(o, x, y) { if (!o || !o.job) return; takeJob(o, x, y, true); const j = o.job; if (!j) return; const rest = j.q - jobDone(j);
  for (const [id, c] of j.used) { const back = Math.floor(c * rest / j.q); if (back > 0 && ITEMS[id]) { const l = addItem(id, back, false); if (l) spawnDrop(id, l, x, y); } }
  delete o.job; emit('inv'); }
function advanceOffline(sec) { if (!G || !(sec > 1)) return 0; sec = Math.min(sec, OFF_MAX); G.time += sec; for (const b of G.buffs || []) b.end += sec; return sec; } // food buffs wait for you
const benchLv = o => !o ? -1 : o.t === 'bench' || o.t === 'smelter' ? (o.lv || 0) : o.t === 'forge' ? 1 : -1;
const tierNames = st => TIERED[st] || BENCH_N;
