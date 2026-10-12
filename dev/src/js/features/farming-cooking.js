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
// decided once, when the crop is grown: only on its own soil, only after the golem; crystal fertilizer raises the odds
function rollStar(i, o) { o.star = beat('golem') && CROP_SOIL[o.t] != null && CROP_SOIL[o.t] === G.floor[i] && rand() < (o.f === 3 ? .35 : .15) ? 1 : 0; }
const pct = v => Math.round(v * 100) + '%';
function noteHint(d) { const s = d.src; if (s === 'mon') return '이끼 동굴·버섯숲 몬스터가 가끔 떨어뜨려요'; if (s === 'gather') return '풀·작물·빛버섯을 거둘 때 가끔 나와요'; if (s === 'fish') return '낚시하다 보면 가끔 걸려요'; if (s === 'bottle') return '낚시하다 병 속 쪽지로 걸려요'; if (s === 'ending') return '다섯 등불을 모두 밝히면';
  if (s.startsWith('room:')) return `${REGION_N[+s[6]]} 숨은 방 어딘가`; if (s.startsWith('boss:')) return `${BOSSES[s.slice(5)].n}을(를) 물리치면`; if (s.startsWith('guide:')) { const q = GUIDE.find(x => x.id === s.slice(6)); return q ? `이야기 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '이야기 퀘스트 보상'; } if (s.startsWith('quest:')) { const q = QSIDE.find(x => x.id === s.slice(6)); return q ? `도전 퀘스트 「${escHTML(qText(q).replace(/ \(.*\)$/, ''))}」 보상` : '도전 퀘스트 보상'; } return ''; }
const knows = id => !DISH[id] || !!(G && G.recipes && G.recipes[id]);
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
function advanceOffline(sec) { if (!G || !(sec > 1)) return 0; sec = Math.min(sec, OFF_MAX); G.time += sec; for (const b of G.buffs || []) b.end += sec; return sec; } // food buffs wait for you
const buffText = it => { if (!it.buff) return ''; const [ef, tier] = it.buff, E = EFF[ef], m = BUFF_DUR[tier - 1] * (it.star ? 1.5 : 1) / 60; return `${E.n} ${E.t(E.v[tier - 1])} · ${Number.isInteger(m) ? m : m.toFixed(1)}분`; };
function learnRecipe(id, quiet) { if (!DISH[id] || !G) return false; G.recipes = G.recipes || {}; if (G.recipes[id]) return false; G.recipes[id] = 1; UIS.craftOrder = null;
  if (!quiet) { toast(`새 레시피를 알게 됐어요: ${DISH[id].n}! (요리솥)`, 'good'); SFX.seed(); } return true; }
function maybeNote(src, x, y) { if (!G || !G.recipes || rand() >= (NOTE_CH[src] || 0)) return; const pool = DISHES.filter(d => d[7] === src && !knows(d[0]) && !G.drops.some(q => q.id === 'rn_' + d[0])); if (!pool.length) return; spawnDrop('rn_' + pool[(rand() * pool.length) | 0][0], 1, x, y); }
function roomNotes(r) { const list = ROOM_NOTES[r.b] || [], n = (G.rooms || []).filter(q => q.b === r.b).length; return n >= list.length ? [list[r.k]].filter(Boolean) : r.k === 0 ? list.slice() : []; }
function bossNoteIds(k) { const list = (BOSS_NOTES[k] || []).slice(), rg = BOSS_REGION[k]; if (rg != null && !(G.rooms || []).some(q => q.b === rg)) list.push(...ROOM_NOTES[rg]); return list; }
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
function catchTable(b) { const L = luckTier(), base = (CATCH[b] || CATCH[0]).map(([k, w]) => [k, k === 'koi' ? w * LUCK_KOI[L] : k === 'boot' ? w * LUCK_BOOT[L] : w]); const tot = base.reduce((a, x) => a + x[1], 0), pb = LUCK_BOTTLE[L]; base.push(['bottle', tot * pb / (1 - pb)]); return base; }
function fishBottle() {
  if (!knows('koiSteam')) { learnRecipe('koiSteam', true); toast('병 속에서 쪽지가 나왔어요! 새 레시피: 별빛 잉어찜', 'good'); SFX.seed(); return; }
  const cs = Object.keys(FLOWERS), pool = [['petal' + cs[(rand() * cs.length) | 0], 2], ['crystal', 2], ['gel', 2], [['glowSpore', 'cbeanSeed', 'berrySeed'][(rand() * 3) | 0], 2]];
  pool.sort(() => rand() - .5); for (const [id, c] of pool.slice(0, 3)) { const l = addItem(id, c); if (l) spawnDrop(id, l, G.p.x, G.p.y); } toast('작은 보물상자를 낚았어요!', 'good'); }
