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
// saves from before cooking notes: hand over what the player has already earned (opened rooms, beaten bosses, claimed quests; early notes once past the mushroom queen)
function migrateRecipes() {
  for (const r of G.rooms || []) if (r.open) for (const id of roomNotes(r)) learnRecipe(id, true);
  for (const k of BKEYS) if (beat(k)) for (const id of bossNoteIds(k)) learnRecipe(id, true);
  for (const d of DISHES) if (d[7].startsWith('quest:') && (G.qclaim || {})[d[7].slice(6)]) learnRecipe(d[0], true);
  if (beat('queen')) for (const d of DISHES) if (['mon', 'gather', 'fish'].includes(d[7])) learnRecipe(d[0], true);
}
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
