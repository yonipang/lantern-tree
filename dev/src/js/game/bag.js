// ================= 가방·상자·제작 명령 (구조 변경 7-2: ui/panel-actions.js·ui/panels.js에서 옮김) =================
// 창 안 버튼(ui/panel-actions.js의 onSheetClick)과 칸 끌어 옮기기는 명령만 보내고(runCmd), 규칙은 여기서 처리해요.
// 창 안 고르기 상태(UIS)·확인 한 번 더 묻기·다시 그리기는 화면 쪽. 명령이 false를 돌려주면 「아무 일도 안 함」(화면은 다시 그리지 않음).
// ---- chests touching a crafting station lend their items (a chain of touching chests counts as one big store) ----
let POOL = null;
function linkedChests() {
  if (POOL) return POOL;
  const p = G.p, seen = new Set(), out = [], q = [];
  for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) for (const j of fpTiles(idx(x, y), o)) q.push([j % W, (j / W) | 0]); }
  while (q.length && out.length < 80) { const [x, y] = q.shift();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j)) continue; const o = G.objs.get(j); if (o && o.t === 'chest' && o.items) { seen.add(j); out.push(o); q.push([nx, ny]); } } }
  return out;
}
const slotIs = (s, id) => !!s && idIs(s.id, id);
function availCount0(id) { let n = countItem(id); for (const o of linkedChests()) for (const s of o.items) if (slotIs(s, id)) n += s.c; return n; }
const availCount = id => availCount0(id) + (STAR_OF[id] ? availCount0(STAR_OF[id]) : 0); // star crops stand in for the plain ones
function takeAvail0(id, c) { // bag first, then the linked chests; returns what is still missing
  const fromBag = Math.min(c, countItem(id)); if (fromBag) removeItem(id, fromBag); c -= fromBag;
  for (const o of linkedChests()) for (let k = 0; k < o.items.length && c > 0; k++) { const s = o.items[k]; if (!slotIs(s, id)) continue; const t = Math.min(s.c, c); s.c -= t; c -= t; if (!s.c) o.items[k] = null; }
  return c;
}
function takeAvail(id, c) { c = takeAvail0(id, c); if (c > 0 && STAR_OF[id]) takeAvail0(STAR_OF[id], c); invDirty = true; } // plain ones go first, star ones are kept for last
function refillHot(slot, id) {
  if (slot == null || slot >= HOT || G.inv[slot] || !id) return;
  for (let j = HOT; j < G.inv.length; j++) { const t = G.inv[j]; if (t && t.id === id) { G.inv[slot] = t; G.inv[j] = null; invDirty = true; emit('ftext', G.p.x, G.p.y - 1.5, `${ITEMS[id].n} 보충`, '#bfe6ff'); return; } }
}
// bag (not the hotbar) → chest; 'same' only moves kinds the chest already holds
function stashBag(o, same) { let n = 0, left = 0; for (let i = HOT; i < G.inv.length; i++) { const s = G.inv[i]; if (!s) continue; if (same && !o.items.some(x => x && x.id === s.id)) continue; const l = moveInto(o.items, s); n += s.c - l; if (l) { s.c = l; left++; } else G.inv[i] = null; } return { n, left }; }
function moveInto(arr, s) { const mx = stackMax(s.id); let left = s.c; for (let i = 0; i < arr.length && left; i++) { const t = arr[i]; if (t && t.id === s.id && t.c < mx) { const k = Math.min(mx - t.c, left); t.c += k; left -= k; } } const ord = arr === G.inv ? [...Array(arr.length - HOT).keys()].map(k => k + HOT).concat([...Array(HOT).keys()]) : [...arr.keys()]; for (const i of ord) if (left && !arr[i]) { arr[i] = { id: s.id, c: Math.min(mx, left) }; if (s.dur != null) arr[i].dur = s.dur; if (s.w != null) arr[i].w = s.w; if (s.lv) arr[i].lv = s.lv; left -= arr[i].c; } return left; }
function sortBag() { // merge stacks and order the bag by kind; the hotbar stays as the player set it
  const items = G.inv.slice(HOT).filter(Boolean), merged = [];
  for (const it of items) { const mx = stackMax(it.id); if (DUR[it.id]) { merged.push(it); continue; } let left = it.c; for (const m of merged) if (m.id === it.id && m.c < mx && left) { const k = Math.min(mx - m.c, left); m.c += k; left -= k; } if (left) merged.push({ ...it, c: left }); }
  const catOrd = { equip: 0, food: 1, mat: 2, seed: 3, deco: 4 }, ord = Object.keys(ITEMS);
  merged.sort((a, b) => catOrd[bagCat(a.id)] - catOrd[bagCat(b.id)] || ord.indexOf(a.id) - ord.indexOf(b.id) || b.c - a.c);
  for (let j = HOT; j < G.inv.length; j++) G.inv[j] = merged[j - HOT] || null;
  invDirty = true;
}
function moveSlot(A, B) {
  if (A.arr === B.arr && A.i === B.i) return false; const a = A.arr[A.i], b = B.arr[B.i]; if (!a) return false;
  if (b && a.id === b.id && b.c < stackMax(b.id)) { const k = Math.min(stackMax(b.id) - b.c, a.c); b.c += k; a.c -= k; if (!a.c) A.arr[A.i] = null; }
  else { A.arr[A.i] = b; B.arr[B.i] = a; }
  invDirty = true; emit('sfx', 'place'); return true;
}
function nearStations() { const p = G.p, set = new Set(); for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) set.add(OBJ[o.t].station); } return set; }
const atHere = (r, st) => (r.at || null) === (st || null) || (st === 'bench' && !r.at);
// 제작 자리 c = { st: 어느 제작대 창(없으면 손 제작), i: 그 제작대 칸, tier: 칸 없이 연 창의 단계 }
const stationTier = c => c && TIERED[c.st] ? (c.i != null ? Math.max(0, benchLv(G.objs.get(c.i))) : c.tier || 0) : 0;
function craftable(r, near, c) { const st = (c && c.st) || null; return (!r.dish || knows(r.dish)) && atHere(r, st) && (!st || near.has(st)) && (!TIERED[st] || (r.tier || 0) <= stationTier(c)) && r.req.every(([id, c2]) => availCount(id) >= c2); }
const slotArr = s => s.o == null ? G.inv : (G.objs.get(s.o) || {}).items; // 칸 위치 { o: 상자 칸(가방이면 null), i }

// ---- 가방 ----
defineCmd('invSwap', c => { const A = G.inv[c.a], B = G.inv[c.b]; if (A && B && A.id === B.id && B.c < stackMax(B.id)) { const k = Math.min(stackMax(B.id) - B.c, A.c); B.c += k; A.c -= k; if (!A.c) G.inv[c.a] = null; } else { G.inv[c.a] = B; G.inv[c.b] = A; } emit('sfx', 'place'); invDirty = true; });
defineCmd('move', c => { const A = slotArr(c.a), B = slotArr(c.b); return !!A && !!B && moveSlot({ arr: A, i: c.a.i }, { arr: B, i: c.b.i }); }); // 끌어 옮기기
defineCmd('sortBag', () => { sortBag(); emit('sfx', 'place'); emit('toast', '가방을 정리했어요', null, 'sortbag'); });
defineCmd('wear', c => { if (G.inv[c.i]) wearItem(c.i); });
defineCmd('unwear', c => { if (G.equip[c.sl]) unwear(c.sl); });
defineCmd('eat', c => eat(c.i));
defineCmd('toHot', c => { const from = c.i; let to = G.inv.slice(0, HOT).findIndex(x => !x); if (to < 0) to = G.sel < HOT ? G.sel : 0; const tmp = G.inv[to]; G.inv[to] = G.inv[from]; G.inv[from] = tmp; G.sel = to; invDirty = true; emit('sfx', 'place'); });
defineCmd('trash', c => { G.inv[c.i] = null; invDirty = true; });
defineCmd('trashTool', c => clearSlot('t:' + c.i));
defineCmd('pet', c => { const i = c.id; if (!(G.pets || {})[i]) return false; if (G.petOn === i) { G.petOn = null; G.petE = null; emit('toast', `${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '은', '는').slice(ANIMALS[i].pn.length)} 집에서 쉬어요`, null, 'peton'); } else { G.petOn = i; G.petE = { x: G.p.x - .6, y: G.p.y + .2, flip: false, anim: 0, moving: false }; emit('hearts', G.p.x, G.p.y - .5, 4); emit('toast', `${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '과', '와').slice(ANIMALS[i].pn.length)} 함께 다녀요 · ${ANIMALS[i].fx}`, 'good', 'peton'); } emit('sfx', 'pick'); });

// ---- 상자 ----
defineCmd('stash', c => { const o = G.objs.get(c.o); if (!o || !o.items) return false; const r = stashBag(o, c.same);
  emit('toast', r.n ? `${r.n}개를 상자에 넣었어요${r.left ? ' · 상자가 가득 차서 일부는 남았어요' : ''}` : c.same ? '상자에 있는 것과 같은 물건이 가방에 없어요' : r.left ? '상자가 가득 찼어요' : '가방에 넣을 물건이 없어요', r.n ? 'good' : null, 'stash'); if (r.n) emit('sfx', 'place'); invDirty = true; });
defineCmd('chest', c => { const o = G.objs.get(c.o); if (!o) return false; const src = c.out ? o.items : G.inv, dst = c.out ? G.inv : o.items; const s = src[c.i]; if (!s) return false; const left = moveInto(dst, s); if (left === s.c) { emit('toast', c.out ? '가방이 가득 찼어요' : '상자가 가득 찼어요', null, 'full'); return false; } if (left) s.c = left; else src[c.i] = null; emit('sfx', 'pick'); invDirty = true; }); // 상자 ↔ 가방 한 칸 (out: 상자에서 꺼내기)
defineCmd('retrieve', c => { const o = G.objs.get(c.o); if (o) { delObj(c.o); returnObj(o, G.p.x, G.p.y); emit('sfx', 'pick'); lightDirty = true; } }); // 제작대 회수

// ---- 강화·분해·수리·작업대 올리기 (가까운 제작대와 연결된 상자의 재료를 함께 써요) ----
defineCmd('upg', c => { const s = upgSlot(c.i); if (!s || !upgOk(s.id) || lvOf(s) >= UPG_MAX || !nearStations().has('smelter')) return false; const cost = upgCost(s.id, lvOf(s)); POOL = null; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); s.lv = lvOf(s) + 1; G.stats.upg = (G.stats.upg || 0) + 1; emit('sfx', 'craft'); emit('puff', G.p.x, G.p.y - .5, '#ffd25c', 14, 2.4, .5); emit('toast', `강화 성공! ${ITEMS[s.id].n} +${s.lv} · ${upgText(s.id, s.lv)}`, 'good'); invDirty = true; });
defineCmd('salv', c => { const s = itemAt(c.i), got = s && (DUR[s.id] || upgOk(s.id)) && salvGet2(s); if (!got || !canSalv(nearStations())) return false;
  clearSlot(c.i); for (const [id, n] of got) { const l = addItem(id, n, false); if (l) spawnDrop(id, l, G.p.x, G.p.y); }
  emit('sfx', 'brk'); emit('toast', `${josa(ITEMS[s.id].n, '을', '를')} 분해했어요: ${got.map(([id, n]) => ITEMS[id].n + ' ' + n + '개').join(', ')}`, 'good'); invDirty = true; });
defineCmd('fix', c => { const s = itemAt(c.i); if (!s || !DUR[s.id] || !nearStations().has('smelter')) return false; const cost = repairCost(s); POOL = null; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); s.dur = DUR[s.id][0]; emit('sfx', 'craft'); emit('toast', `${josa(ITEMS[s.id].n, '을', '를')} 새것처럼 고쳤어요`, 'good'); invDirty = true; });
defineCmd('benchUp', c => { const o = c.o != null ? G.objs.get(c.o) : null, lv = benchLv(o); if (lv < 0 || lv >= BENCH_MAX) return false; POOL = null; const cost = BENCH_UP[lv + 1]; if (!cost.every(([id, n]) => availCount(id) >= n)) return false;
  for (const [id, n] of cost) takeAvail(id, n); if (o.t === 'forge') o.t = 'bench'; o.lv = lv + 1;
  if (o.t === 'smelter') G.stats.gearLv = Math.max(G.stats.gearLv || 0, o.lv); else { G.stats.forge = 1; G.stats.benchLv = Math.max(G.stats.benchLv || 0, o.lv); }
  const x = c.o % W, y = (c.o / W) | 0; emit('sfx', 'win'); emit('puff', x + 1, y + .3, BENCH_COL[o.lv], 22, 3, .6); emit('toast', `${tierNames(o.t)[o.lv]}로 올렸어요! 새로 만들 수 있는 것이 맨 위에 나와요`, 'good', 'benchup'); invDirty = true; checkGuide(); });

// ---- 제작 { r: 레시피 번호, q: 몇 번, st·i·tier: 제작 자리 } → false 못 만듦 · 'reorder' 목록 순서를 새로 · 그 밖은 다시 그리기 ----
defineCmd('craft', c => {
  const r = RECIPES[c.r], near = nearStations(); POOL = null; if (!craftable(r, near, c)) return false;
  const so = TIMED[r.at] && c.i != null ? G.objs.get(c.i) : null; // v59: the furnace / pot being used
  if (so && so.job) { emit('toast', `${STN[r.at]}에서 만드는 게 끝나면 넣을 수 있어요`, null, 'jobbusy'); return false; }
  const q = isMulti(r) ? clamp(c.q || 1, 1, Math.max(1, Math.min(so ? JOB_MAX : 99, maxCraft(r)))) : 1, total = r.n * q;
  const before = so ? stockMap() : null;
  for (const [id, n] of r.req) takeAvail(id, n * q);
  if (so) { const after = stockMap(), used = Object.keys(before).map(id => [id, before[id] - (after[id] || 0)]).filter(([, n]) => n > 0), per = jobTime(r);
    so.job = { out: r.out, n: r.n, q, per, t0: nowS(), used }; emit('sfx', 'place'); emit('toast', `${STN[r.at]}에 넣었어요 · ${fmtT(q * per)} 뒤에 다 돼요`, 'good', 'jobput'); invDirty = true; return 'reorder'; }
  G.stats.made = G.stats.made || {}; G.stats.made[r.out] = (G.stats.made[r.out] || 0) + q;
  if (ITEMS[r.out].bagUp) { G.bagLv = (G.bagLv || 0) + 1; while (G.inv.length < invSize()) G.inv.push(null); emit('sfx', 'craft'); emit('craftNote', r.out, 1, `가방이 ${G.inv.length - HOT}칸으로 늘었어요!`); invDirty = true; return 'reorder'; }
  const left = addItem(r.out, total); if (left) spawnDrop(r.out, left, G.p.x, G.p.y);
  emit('sfx', 'craft'); emit('craftNote', r.out, total); gainXp(Math.min(8, q * (r.tier ? 3 : r.at ? 1 : 0)));
  invDirty = true; checkGuide();
});
defineCmd('jobTake', c => { const o = c.o != null && G.objs.get(c.o); if (o) takeJob(o, G.p.x, G.p.y); });
defineCmd('jobCancel', c => { const o = c.o != null && G.objs.get(c.o); if (o) { cancelJob(o, G.p.x, G.p.y); emit('sfx', 'click'); emit('toast', '취소하고 재료를 돌려받았어요', null, 'jobcancel'); } });

// ---- 퀘스트 보상·능력치·스킬 ----
defineCmd('claim', c => claimQuest(c.id));
defineCmd('claimAll', () => { for (const q of [...GUIDE, ...QSIDE]) claimQuest(q.id); emit('toast', '보상을 모두 받았어요', 'good'); });
defineCmd('statUp', c => { const R = G.rpg, i = c.s; if (R.pts > 0 && STATN[i]) { R[i]++; R.pts--; if (i === 'vit') G.p.hp = Math.min(maxHp(), G.p.hp + 8); emit('sfx', 'click'); } });
defineCmd('statReset', () => { const R = G.rpg; R.pts += R.str + R.dex + R.vit + R.int; R.str = R.dex = R.vit = R.int = 0; G.p.hp = Math.min(G.p.hp, maxHp()); G.p.mp = Math.min(G.p.mp, maxMp()); emit('sfx', 'craft'); emit('toast', '능력치 포인트를 모두 돌려받았어요'); });
defineCmd('skUp', c => { const R = G.rpg, i = c.s, S = SKILLS[i]; if (!S) return false; const l = R.sk[i] || 0; if (R.sp <= 0 || R.lv < S.lv || l >= S.max) return false; R.sk[i] = l + 1; R.sp--; if (S.act && !l && !R.slot.includes(i)) { const e = R.slot.indexOf(null); if (e >= 0) R.slot[e] = i; } emit('sfx', 'craft'); emit('toast', l ? `${S.n} ${l + 1}단계로 올렸어요` : `${S.n}을(를) 배웠어요!`, 'good'); });
defineCmd('skReset', () => { const R = G.rpg; R.sp += Object.values(R.sk).reduce((a2, l) => a2 + l, 0); R.sk = {}; R.slot = [null, null]; G.p.mp = Math.min(G.p.mp, maxMp()); emit('sfx', 'click'); emit('toast', '스킬 포인트를 모두 돌려받았어요', 'good', 'skreset'); });
defineCmd('skSlot', c => { const id = c.s, R = G.rpg, m = c.n; if (!R.sk[id]) return false; if (R.slot[m] === id) R.slot[m] = null; else { const o = R.slot.indexOf(id); if (o >= 0) R.slot[o] = R.slot[m]; R.slot[m] = id; } emit('sfx', 'click'); });

// ---- 꾸미기·캐릭터·긴급 탈출·지도 표시(개발자) ----
defineCmd('look', c => { G.look = cleanLook(c.look); CHARS.custom = lookDef(G.look); G.char = 'custom'; G.outfit = 0; buildPlayer(0); emit('puff', G.p.x, G.p.y - .5, CHARS.custom.pal[0], 16, 2.6, .6); emit('sfx', 'craft'); emit('toast', '새 모습으로 꾸몄어요', 'good'); });
defineCmd('char', c => { const i = c.c; if (!(CHARS[i] && G.char !== i)) return false; G.char = i; G.outfit = 0; buildPlayer(0); emit('puff', G.p.x, G.p.y - .5, CHARS[i].pal[0], 14, 2.5, .6); emit('sfx', 'craft'); emit('toast', `${roJosa(CHARS[i].n)} 바꿨어요`, 'good'); return true; });
defineCmd('escape', () => emergencyEscape());
defineCmd('markAdd', () => { G.marks = G.marks || []; G.marks.push({ x: Math.floor(G.p.x), y: Math.floor(G.p.y) }); });
defineCmd('markDel', c => { G.marks.splice(c.i, 1); });
