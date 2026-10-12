// ================= 가방·상자·도구 주머니: 넣기·빼기·세기·쌓기·내구도, 상자 재료 함께 쓰기, 가방·상자·도구 명령 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
function returnObj(o, x, y) {
  if (o.job) cancelJob(o, x, y); // v59: a furnace / pot picked up mid-job gives back the finished items and the unused materials
  const d = OBJ[o.t]; if (o.store) for (const s2 of o.store) { const l = moveInto(G.inv, s2); if (l) spawnDrop(s2.id, l, x, y); }
  if (DUR[d.item]) { const it = { id: d.item, c: 1, dur: Math.round(o.e != null ? o.e : DUR[d.item][0]) }; if (moveInto(G.inv, it)) { spawnDrop(d.item, 1, x, y); G.drops[G.drops.length - 1].dur = it.dur; } }
  else { const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; const l = addItem(it, 1, false); if (l) spawnDrop(it, 1, x, y); } // v60: an upgraded workbench comes back as its tier item
  emit('inv');
}
// ================= inventory =================
const invSize = () => HOT + BAG0 + BAG_STEP * ((G && G.bagLv) || 0);
const isMat = it => !it.kind || it.kind === 'ground' || it === ITEMS.dirt || !!it.mat;
const stackMax = id => ITEMS[id].stack || (isMat(ITEMS[id]) ? 999 : 99);
// bag kinds for the tabs and for sorting
const BAG_TABS = [['all', '전체'], ['equip', '장비'], ['mat', '재료'], ['food', '음식'], ['deco', '꾸미기'], ['seed', '씨앗']];
function bagCat(id) { const it = ITEMS[id], k = it.kind; if (['pick', 'axe', 'lasso', 'sword', 'rod', 'shovel', 'sickle', 'wcan', 'wear', 'recall', 'arrow'].includes(k)) return 'equip'; if (k === 'food') return 'food'; if (k === 'seed' || k === 'fert') return 'seed'; if (isMat(it) || k === 'key') return 'mat'; return 'deco'; }
function addItem(id, c, count = true) {
  if (ITEMS[id] && ITEMS[id].note) { learnRecipe(ITEMS[id].note); return 0; } // recipe notes teach a dish instead of taking a bag slot
  if (isTool(id) && G.tools) { for (let k = 0; k < c; k++) { const t = { id, c: 1 }; if (DUR[id]) t.dur = DUR[id][0]; G.tools.push(t); } G.newIds = G.newIds || {}; G.newIds[id] = 1; emit('inv'); return 0; } // v65: tools go into the tool pouch
  let left = c; const inv = G.inv, mx = stackMax(id);
  for (let i = 0; i < inv.length && left > 0; i++) { const s = inv[i]; if (s && s.id === id && s.c < mx) { const k = Math.min(mx - s.c, left); s.c += k; left -= k; } }
  // v65: new stacks go into an empty hotbar slot first, then the bag
  const order = [...Array(HOT).keys()].concat([...Array(inv.length - HOT).keys()].map(k => k + HOT));
  for (const i of order) { if (left <= 0) break; if (!inv[i]) { const k = Math.min(mx, left); inv[i] = { id, c: k }; if (DUR[id]) inv[i].dur = DUR[id][0]; left -= k; G.newIds = G.newIds || {}; G.newIds[id] = 1; } }
  const got = c - left;
  if (got > 0 && rarOf(id) >= 3 && (ITEMS[id].kind === 'sword' || ITEMS[id].kind === 'pick')) { G.stats.epicSeen = G.stats.epicSeen || {}; G.stats.epicSeen[id] = 1; }
  if (got > 0 && ITEMS[id].kind === 'sword') autoHotWeapon(id);
  if (count && got > 0) { const S = G.stats; if (id === 'wood') S.wood += got; if (id === 'copperOre') S.copperOre += got; if (id === 'copperBar') S.copperBar += got; if (id === 'lightSeed') S.seedsFound += got; }
  emit('inv'); return left;
}
// 'anyFish' / 'anyPetal' in a recipe take any fish / any petal
const WILD = { anyFish: it => !!it.fish, anyPetal: it => !!it.petal };
const idIs = (sid, id) => sid === id || (!!WILD[id] && !!ITEMS[sid] && WILD[id](ITEMS[sid]));
const countItem = id => G.inv.concat(G.tools || []).reduce((a, s) => a + (s && idIs(s.id, id) ? s.c : 0), 0);
function removeItem(id, c) { for (let i = G.inv.length - 1; i >= 0 && c > 0; i--) { const s = G.inv[i]; if (s && idIs(s.id, id)) { const k = Math.min(s.c, c); s.c -= k; c -= k; if (!s.c) G.inv[i] = null; } }
  const T = G.tools || []; for (let i = T.length - 1; i >= 0 && c > 0; i--) if (idIs(T[i].id, id)) { const h = heldTool(); T.splice(i, 1); c--; fixTsel(h); } emit('inv'); }
const durMax = id => DUR[id] ? DUR[id][0] : 0;
const durOf = s => !s || !DUR[s.id] ? 0 : (s.dur == null ? DUR[s.id][0] : s.dur);
const isBroken = s => !!(s && DUR[s.id] && durOf(s) <= 0);
function wear(s, n = 1) {
  if (!s || !DUR[s.id] || isBroken(s)) return; const mx = DUR[s.id][0], before = durOf(s); s.dur = Math.max(0, before - n); emit('inv');
  const nm = ITEMS[s.id].n;
  if (s.dur <= 0) { emit('toast', `${josa(nm, '이', '가')} 망가졌어요! 장비제작대에서 고칠 수 있어요`, null, 'broke' + s.id); emit('sfx', 'clink'); }
  else if (before > mx * .2 && s.dur <= mx * .2) emit('toast', `${josa(nm, '이', '가')} 많이 닳았어요 (${s.dur}/${mx})`, null, 'worn' + s.id);
}
const usableItem = id => G.inv.concat(G.tools || []).some(s => s && s.id === id && !isBroken(s));
const selItem = () => G.sel < 0 ? ((G.tools && G.tools[G.tsel]) || null) : G.inv[G.sel]; // v65: sel −1 = the tool slot
function pickHot(i) { // 단축칸 고르기 (같은 칸을 한 번 더 고르면 음식은 먹고 옷은 입어요)
  { const s = G.inv[i]; if (s && ITEMS[s.id] && ITEMS[s.id].kind === 'sword' && !isBroken(s)) G.lastW = s.id; } // v65
  if (G.sel === i) { const s = G.inv[i]; if (s && ITEMS[s.id].kind === 'food') eat(i); else if (s && ITEMS[s.id].kind === 'wear') wearItem(i); }
  G.sel = i; emit('inv');
}
defineCmd('hot', c => pickHot(c.i));
defineCmd('sel', c => { const d = c.d, n = HOT + (G.tools && G.tools.length ? 1 : 0), off = n > HOT ? 1 : 0; G.sel = ((G.sel + off + d + n) % n) - off; if (G.sel < 0) G.tsel = Math.min(G.tsel || 0, G.tools.length - 1); emit('inv'); }); // 마우스 휠
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
function takeAvail(id, c) { c = takeAvail0(id, c); if (c > 0 && STAR_OF[id]) takeAvail0(STAR_OF[id], c); emit('inv'); } // plain ones go first, star ones are kept for last
function refillHot(slot, id) {
  if (slot == null || slot >= HOT || G.inv[slot] || !id) return;
  for (let j = HOT; j < G.inv.length; j++) { const t = G.inv[j]; if (t && t.id === id) { G.inv[slot] = t; G.inv[j] = null; emit('inv'); emit('ftext', G.p.x, G.p.y - 1.5, `${ITEMS[id].n} 보충`, '#bfe6ff'); return; } }
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
  emit('inv');
}
function moveSlot(A, B) {
  if (A.arr === B.arr && A.i === B.i) return false; const a = A.arr[A.i], b = B.arr[B.i]; if (!a) return false;
  if (b && a.id === b.id && b.c < stackMax(b.id)) { const k = Math.min(stackMax(b.id) - b.c, a.c); b.c += k; a.c -= k; if (!a.c) A.arr[A.i] = null; }
  else { A.arr[A.i] = b; B.arr[B.i] = a; }
  emit('inv'); emit('sfx', 'place'); return true;
}
const slotArr = s => s.o == null ? G.inv : (G.objs.get(s.o) || {}).items; // 칸 위치 { o: 상자 칸(가방이면 null), i }
// ---- 가방 ----
defineCmd('invSwap', c => { const A = G.inv[c.a], B = G.inv[c.b]; if (A && B && A.id === B.id && B.c < stackMax(B.id)) { const k = Math.min(stackMax(B.id) - B.c, A.c); B.c += k; A.c -= k; if (!A.c) G.inv[c.a] = null; } else { G.inv[c.a] = B; G.inv[c.b] = A; } emit('sfx', 'place'); emit('inv'); });
defineCmd('move', c => { const A = slotArr(c.a), B = slotArr(c.b); return !!A && !!B && moveSlot({ arr: A, i: c.a.i }, { arr: B, i: c.b.i }); }); // 끌어 옮기기
defineCmd('sortBag', () => { sortBag(); emit('sfx', 'place'); emit('toast', '가방을 정리했어요', null, 'sortbag'); });
defineCmd('wear', c => { if (G.inv[c.i]) wearItem(c.i); });
defineCmd('unwear', c => { if (G.equip[c.sl]) unwear(c.sl); });
defineCmd('eat', c => eat(c.i));
defineCmd('toHot', c => { const from = c.i; let to = G.inv.slice(0, HOT).findIndex(x => !x); if (to < 0) to = G.sel < HOT ? G.sel : 0; const tmp = G.inv[to]; G.inv[to] = G.inv[from]; G.inv[from] = tmp; G.sel = to; emit('inv'); emit('sfx', 'place'); });
defineCmd('trash', c => { G.inv[c.i] = null; emit('inv'); });
defineCmd('trashTool', c => clearSlot('t:' + c.i));
// ---- 상자 ----
defineCmd('stash', c => { const o = G.objs.get(c.o); if (!o || !o.items) return false; const r = stashBag(o, c.same);
  emit('toast', r.n ? `${r.n}개를 상자에 넣었어요${r.left ? ' · 상자가 가득 차서 일부는 남았어요' : ''}` : c.same ? '상자에 있는 것과 같은 물건이 가방에 없어요' : r.left ? '상자가 가득 찼어요' : '가방에 넣을 물건이 없어요', r.n ? 'good' : null, 'stash'); if (r.n) emit('sfx', 'place'); emit('inv'); });
defineCmd('chest', c => { const o = G.objs.get(c.o); if (!o) return false; const src = c.out ? o.items : G.inv, dst = c.out ? G.inv : o.items; const s = src[c.i]; if (!s) return false; const left = moveInto(dst, s); if (left === s.c) { emit('toast', c.out ? '가방이 가득 찼어요' : '상자가 가득 찼어요', null, 'full'); return false; } if (left) s.c = left; else src[c.i] = null; emit('sfx', 'pick'); emit('inv'); }); // 상자 ↔ 가방 한 칸 (out: 상자에서 꺼내기)
defineCmd('retrieve', c => { const o = G.objs.get(c.o); if (o) { delObj(c.o); returnObj(o, G.p.x, G.p.y); emit('sfx', 'pick'); lightDirty = true; } }); // 제작대 회수
defineCmd('markAdd', () => { G.marks = G.marks || []; G.marks.push({ x: Math.floor(G.p.x), y: Math.floor(G.p.y) }); });
defineCmd('markDel', c => { G.marks.splice(c.i, 1); });
const isTool = id => !!ITEMS[id] && TOOL_KINDS.includes(ITEMS[id].kind);
const toolPow = s => ((ITEMS[s.id] && ITEMS[s.id].power) || 1) * (1 + UPG_POW * lvOf(s));
const heldTool = () => (G && G.sel < 0 && G.tools && G.tools[G.tsel]) || null;
// the tool of a kind to use: the one in hand if it is that kind, else the best working one (pouch first, then the bag)
// (a tool the player chose on purpose — from the tool row, the pouch or the hotbar — is used even if a better one exists; one interact took out by itself is not)
function bestTool(kind) { if (!G) return null; const h = selItem(); if (h && ITEMS[h.id] && ITEMS[h.id].kind === kind && !isBroken(h) && (G.sel >= 0 || G.tHand)) return h;
  let b = null; for (const s of (G.tools || []).concat(G.inv)) { if (!s || !ITEMS[s.id] || ITEMS[s.id].kind !== kind || isBroken(s)) continue; if (!b || toolPow(s) > toolPow(b)) b = s; } return b; }
function holdTool(s, chosen) { if (!s || !G.tools) return; G.tHand = !!chosen; let k = G.tools.indexOf(s);
  if (k < 0) { const j = G.inv.indexOf(s); if (j < 0) return; G.inv[j] = null; G.tools.push(s); k = G.tools.length - 1; } // a tool still in the bag moves into the pouch
  G.tsel = k; G.sel = -1; emit('inv'); }
function fixTsel(h) { if (!G.tools.length) { G.tsel = 0; if (G.sel < 0) G.sel = 0; return; } const k = h ? G.tools.indexOf(h) : -1; if (k >= 0) G.tsel = k; else { G.tsel = Math.min(G.tsel || 0, G.tools.length - 1); const kd = h && ITEMS[h.id].kind, nx = kd && bestTool(kd); if (nx && G.tools.includes(nx)) G.tsel = G.tools.indexOf(nx); } }
// tools that ended up in the bag (from a chest, an old save …) go to the pouch
function sweepTools() { if (!G || !G.tools) return; const h = heldTool(); for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (s && isTool(s.id)) { if (i === G.sel) { G.inv[i] = null; G.tools.push(s); G.tsel = G.tools.length - 1; G.sel = -1; } else { G.inv[i] = null; G.tools.push(s); } emit('inv'); } } if (h && G.sel < 0) fixTsel(h); }
// the bag and the pouch together for repair · salvage · upgrade lists ('t:3' = pouch slot 3)
const slotList = () => G.inv.map((s, i) => ({ s, i })).concat((G.tools || []).map((s, k) => ({ s, i: 't:' + k })));
const itemAt = i => typeof i === 'string' ? (i.startsWith('e:') ? G.equip[i.slice(2)] : i.startsWith('t:') ? (G.tools || [])[+i.slice(2)] : null) : G.inv[i];
function clearSlot(i) { if (typeof i === 'string' && i.startsWith('t:')) { const h = heldTool(), k = +i.slice(2), gone = G.tools[k]; G.tools.splice(k, 1); if (h && h === gone) { G.tsel = 0; if (!G.tools.length && G.sel < 0) G.sel = 0; } else fixTsel(h); } else G.inv[i] = null; emit('inv'); }
// one of each kind for the tool row: the best working one, broken ones hidden
function toolRowList() { const by = {}; for (const s of G.tools || []) { if (isBroken(s)) continue; const k = ITEMS[s.id].kind; if (!by[k] || toolPow(s) > toolPow(by[k])) by[k] = s; } return TOOL_KINDS.map(k => by[k]).filter(Boolean); }
defineCmd('hold', c => { const s = G.tools && G.tools[c.i]; if (s) holdTool(s, true); });
