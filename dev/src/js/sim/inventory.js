// ================= 가방·상자·도구 주머니: 넣기·빼기·세기·쌓기·내구도, 상자 재료 함께 쓰기, 가방·상자·도구 명령 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { OLD_AUTO } from '../data/automation.js';
import { TIER_IT } from '../data/automation-tiers.js';
import { DUR } from '../data/circuits-regions.js';
import { TOOL_KINDS } from '../data/controls.js';
import { STAR_OF } from '../data/farming-cooking.js';
import { UPG_POW } from '../data/gear-animals.js';
import { BAG0, BAG_STEP, HOT, ITEMS, OBJ } from '../data/items.js';
import { josa } from '../engine/util.js';
import { curPl, G, ME } from '../save/state.js';
import { canDev, devOn } from '../save/storage.js';
import { defineCmd } from './commands.js';
import { learnRecipe } from './cooking.js';
import { cancelJob } from './crafting.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { autoHotWeapon, lvOf, rarOf, unwear, wearItem } from './gear.js';
import { eat, fitBag } from './player.js';
import { idx, inB, W } from '../world/map.js';
import { delObj, fpTiles } from '../world/tiles.js';
// v136: 보관함 = 보관상자 + 상자 종류 가구(나무 상자·통·자루·바구니·궤짝·수납장·큰 보관함 …). OBJ[t].chest = 칸 수(1이면 예전 보관상자 18칸)
export const storeSlots = t => { const c = OBJ[t] && OBJ[t].chest; return !c ? 0 : c === 1 ? 18 : c; };
export const isStore = o => !!o && o.t !== 'refundBox' && storeSlots(o.t) > 0;
// 그 칸의 보관함(여러 칸이면 몸통 칸으로) — 옛 세이브에 놓여 있던 상자 종류 가구는 처음 쓸 때 빈 칸을 만들어요
export function storeAt(j) { let o = G.objs.get(j); if (o && o.t === '_part') { j = o.a; o = G.objs.get(j); } if (!isStore(o)) return null; if (!Array.isArray(o.items)) o.items = Array(storeSlots(o.t)).fill(null); return { o, j }; }
import { markLight } from './loop.js';
import { onFrame } from './systems.js';
import { nestContents } from './beaver.js';
// ---- v77: 본 적 있는 물건 (캐릭터 것, 저장 칸 seen) — 처음 얻은 물건에 빨간 점 ----
// 값: 1 본 것 · 2 새것 (가방 창의 그 칸에 작은 점, 한 번 누르면 1) · 3 새것 + 가방 버튼에 빨간 점 (가방을 열면 2)
// 가방·도구 주머니에 처음 들어온 물건을 매 프레임 찾아요 — 줍기·제작·상자·보상 … 어느 길로 들어와도 같이 잡혀요
export function noteSeen() { const S = G.seen || (G.seen = {}); let n = false;
  const see = s => { if (s && ITEMS[s.id] && !S[s.id]) { S[s.id] = 3; n = true; } }; G.inv.forEach(see); (G.tools || []).forEach(see);
  if (n) emit('inv'); }
onFrame('seen', noteSeen);
// 지금 가진 것 (가방·도구 주머니·장비, chests면 내가 놓은 상자 안까지 — 숨은 방 보물상자는 빼고)은 모두 본 것으로 — 새 게임과 v77 전 세이브
export function seenAll(chests) { const S = G.seen || (G.seen = {}); const see = s => { if (s && ITEMS[s.id]) S[s.id] = 1; };
  G.inv.forEach(see); (G.tools || []).forEach(see); for (const k in (G.equip || {})) see(G.equip[k]);
  if (chests) for (const o of G.objs.values()) if (o.items && o.t !== 'tchest') o.items.forEach(see); }
export const bagNew = () => { const S = G.seen || {}; for (const k in S) if (S[k] === 3) return true; return false; };
defineCmd('seenBag', () => { const S = G.seen || {}; for (const k in S) if (S[k] === 3) S[k] = 2; }); // 가방을 열었어요 → 가방 버튼의 빨간 점 끄기
defineCmd('seenItem', c => { const S = G.seen || {}; if (S[c.id] > 1) S[c.id] = 1; }); // 가방 창에서 그 물건을 눌렀어요 → 칸의 작은 점 끄기
export function returnObj(o, x, y) {
  if (o.job) cancelJob(o, x, y); // v59: a furnace / pot picked up mid-job gives back the finished items and the unused materials
  const d = OBJ[o.t]; if (o.store) for (const s2 of o.store) { const l = moveInto(G.inv, s2); if (l) spawnDrop(s2.id, l, x, y); }
  for (const [id, c] of nestContents(o)) { const l = addItem(id, c, false); if (l) spawnDrop(id, l, x, y); } // v114: 둥지의 비버·먹이통의 먹이
  if (DUR[d.item]) { const it = { id: d.item, c: 1, dur: Math.round(o.e != null ? o.e : DUR[d.item][0]) }; if (moveInto(G.inv, it)) { spawnDrop(d.item, 1, x, y); G.drops[G.drops.length - 1].dur = it.dur; } }
  else if (OLD_AUTO[o.t]) { for (const [m, c] of OLD_AUTO[o.t]) { const l = addItem(m, c, false); if (l) spawnDrop(m, l, x, y); } } // v113: 옛 돌 채굴기는 재료로
  else { const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; const l = addItem(it, 1, false); if (l) spawnDrop(it, 1, x, y); } // v60: an upgraded workbench comes back as its tier item
  emit('inv');
}
// ================= inventory =================
export const invSize = () => HOT + BAG0 + BAG_STEP * ((G && G.bagLv) || 0) + 3 * ((G && G.rpg && G.rpg.sk && G.rpg.sk.porter) || 0) + (devOn('bag') ? 60 : 0); // v136 개발자 도구: 가방 +60칸 // v102 짐꾼 +3칸/단계
export const isMat = it => !it.kind || it.kind === 'ground' || it === ITEMS.dirt || !!it.mat;
export const stackMax = id => ITEMS[id].stack || (isMat(ITEMS[id]) ? 999 : 99);
// bag kinds for the tabs and for sorting
export const BAG_TABS = [['all', '전체'], ['equip', '장비'], ['mat', '재료'], ['food', '음식'], ['deco', '꾸미기'], ['seed', '씨앗']];
export function bagCat(id) { const it = ITEMS[id], k = it.kind; if (['pick', 'axe', 'lasso', 'sword', 'rod', 'shovel', 'sickle', 'wcan', 'bucket', 'wear', 'recall', 'arrow'].includes(k)) return 'equip'; if (k === 'food') return 'food'; if (k === 'seed' || k === 'fert') return 'seed'; if (isMat(it) || k === 'key') return 'mat'; return 'deco'; }
export function addItem(id, c, count = true) {
  if (ITEMS[id] && ITEMS[id].note) { learnRecipe(ITEMS[id].note); return 0; } // recipe notes teach a dish instead of taking a bag slot
  if (isTool(id) && G.tools) { for (let k = 0; k < c; k++) { const t = { id, c: 1 }; if (DUR[id]) t.dur = DUR[id][0]; G.tools.push(t); } emit('inv'); return 0; } // v65: tools go into the tool pouch
  let left = c; const inv = G.inv, mx = stackMax(id);
  for (let i = 0; i < inv.length && left > 0; i++) { const s = inv[i]; if (s && s.id === id && s.c < mx) { const k = Math.min(mx - s.c, left); s.c += k; left -= k; } }
  // v65: new stacks go into an empty hotbar slot first, then the bag
  const order = [...Array(HOT).keys()].concat([...Array(inv.length - HOT).keys()].map(k => k + HOT));
  for (const i of order) { if (left <= 0) break; if (!inv[i]) { const k = Math.min(mx, left); inv[i] = { id, c: k }; if (DUR[id]) inv[i].dur = DUR[id][0]; left -= k; } }
  const got = c - left;
  if (got > 0 && rarOf(id) >= 3 && (ITEMS[id].kind === 'sword' || ITEMS[id].kind === 'pick')) { G.stats.epicSeen = G.stats.epicSeen || {}; G.stats.epicSeen[id] = 1; }
  if (got > 0 && ITEMS[id].kind === 'sword') autoHotWeapon(id);
  if (count && got > 0) { const S = G.stats; if (id === 'wood') S.wood += got; if (id === 'copperOre') S.copperOre += got; if (id === 'copperBar') S.copperBar += got; if (id === 'lightSeed') S.seedsFound += got; }
  emit('inv'); return left;
}
// 'anyFish' / 'anyPetal' in a recipe take any fish / any petal
export const WILD = { anyFish: it => !!it.fish, anyPetal: it => !!it.petal };
export const idIs = (sid, id) => sid === id || (!!WILD[id] && !!ITEMS[sid] && WILD[id](ITEMS[sid]));
export const countItem = id => G.inv.concat(G.tools || []).reduce((a, s) => a + (s && idIs(s.id, id) ? s.c : 0), 0);
export function removeItem(id, c) { for (let i = G.inv.length - 1; i >= 0 && c > 0; i--) { const s = G.inv[i]; if (s && idIs(s.id, id)) { const k = Math.min(s.c, c); s.c -= k; c -= k; if (!s.c) G.inv[i] = null; } }
  const T = G.tools || []; for (let i = T.length - 1; i >= 0 && c > 0; i--) if (idIs(T[i].id, id)) { const h = heldTool(); T.splice(i, 1); c--; fixTsel(h); } emit('inv'); }
export const durMax = id => DUR[id] ? DUR[id][0] : 0;
export const durOf = s => !s || !DUR[s.id] ? 0 : (s.dur == null ? DUR[s.id][0] : s.dur);
export const isBroken = s => !!(s && DUR[s.id] && durOf(s) <= 0);
export function wear(s, n = 1) {
  if (!s || !DUR[s.id] || isBroken(s)) return; const mx = DUR[s.id][0], before = durOf(s); s.dur = Math.max(0, before - n); emit('inv');
  const nm = ITEMS[s.id].n;
  if (s.dur <= 0) { emit('toast', `${josa(nm, '이', '가')} 망가졌어요! 장비제작대에서 고칠 수 있어요`, null, 'broke' + s.id); emit('sfx', 'clink'); }
  else if (before > mx * .2 && s.dur <= mx * .2) emit('toast', `${josa(nm, '이', '가')} 많이 닳았어요 (${s.dur}/${mx})`, null, 'worn' + s.id);
}
export const usableItem = id => G.inv.concat(G.tools || []).some(s => s && s.id === id && !isBroken(s));
export const selItem = () => G.sel < 0 ? ((G.tools && G.tools[G.tsel]) || null) : G.inv[G.sel]; // v65: sel −1 = the tool slot
export function pickHot(i) { // 단축칸 고르기 (같은 칸을 한 번 더 고르면 음식은 먹고 옷은 입어요)
  { const s = G.inv[i]; if (s && ITEMS[s.id] && ITEMS[s.id].kind === 'sword' && !isBroken(s)) G.lastW = s.id; } // v65
  if (G.sel === i) { const s = G.inv[i]; if (s && ITEMS[s.id].kind === 'food') eat(i); else if (s && ITEMS[s.id].kind === 'wear') wearItem(i); }
  G.sel = i; emit('inv');
}
defineCmd('hot', c => pickHot(c.i));
// v66 (BF-06): a hotbar slot tapped inside the bag becomes the held slot — only picked, never eaten or worn (unlike tapping it twice on the hotbar)
defineCmd('selHot', c => { const i = c.i; if (!Number.isInteger(i) || i < 0 || i >= HOT) return; const s = G.inv[i]; if (s && ITEMS[s.id] && ITEMS[s.id].kind === 'sword' && !isBroken(s)) G.lastW = s.id; G.sel = i; emit('inv'); });
defineCmd('sel', c => { const d = c.d, n = HOT + (G.tools && G.tools.length ? 1 : 0), off = n > HOT ? 1 : 0; G.sel = ((G.sel + off + d + n) % n) - off; if (G.sel < 0) G.tsel = Math.min(G.tsel || 0, G.tools.length - 1); emit('inv'); }); // 마우스 휠
// ================= 가방·상자·제작 명령 (구조 변경 7-2: ui/panel-actions.js·ui/panels.js에서 옮김) =================
// 창 안 버튼(ui/panel-actions.js의 onSheetClick)과 칸 끌어 옮기기는 명령만 보내고(runCmd), 규칙은 여기서 처리해요.
// 창 안 고르기 상태(UIS)·확인 한 번 더 묻기·다시 그리기는 화면 쪽. 명령이 false를 돌려주면 「아무 일도 안 함」(화면은 다시 그리지 않음).
// ---- chests touching a crafting station lend their items (a chain of touching chests counts as one big store) ----
export let POOL = null;
export const resetPool = () => { POOL = null; }; // 근처 상자를 다시 찾아요
export function linkedChests() {
  if (POOL) return POOL;
  const p = G.p, seen = new Set(), out = [], q = [];
  for (let y = Math.floor(p.y) - 4; y <= p.y + 4; y++) for (let x = Math.floor(p.x) - 4; x <= p.x + 4; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (o && OBJ[o.t].station) for (const j of fpTiles(idx(x, y), o)) q.push([j % W, (j / W) | 0]); }
  while (q.length && out.length < 80) { const [x, y] = q.shift();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!inB(nx, ny)) continue; const j = idx(nx, ny); if (seen.has(j)) continue; const so = storeAt(j); if (so && !seen.has(so.j)) { seen.add(j); seen.add(so.j); out.push(so.o); q.push([nx, ny]); } else if (so) seen.add(j); } }
  return out;
}
export const slotIs = (s, id) => !!s && idIs(s.id, id);
export function availCount0(id) { let n = countItem(id); for (const o of linkedChests()) for (const s of o.items) if (slotIs(s, id)) n += s.c; return n; }
export const availCount = id => availCount0(id) + (STAR_OF[id] ? availCount0(STAR_OF[id]) : 0); // star crops stand in for the plain ones
export function takeAvail0(id, c) { // bag first, then the linked chests; returns what is still missing
  const fromBag = Math.min(c, countItem(id)); if (fromBag) removeItem(id, fromBag); c -= fromBag;
  for (const o of linkedChests()) for (let k = 0; k < o.items.length && c > 0; k++) { const s = o.items[k]; if (!slotIs(s, id)) continue; const t = Math.min(s.c, c); s.c -= t; c -= t; if (!s.c) o.items[k] = null; }
  return c;
}
export function takeAvail(id, c) { c = takeAvail0(id, c); if (c > 0 && STAR_OF[id]) takeAvail0(STAR_OF[id], c); emit('inv'); } // plain ones go first, star ones are kept for last
export function refillHot(slot, id) {
  if (slot == null || slot >= HOT || G.inv[slot] || !id) return;
  for (let j = HOT; j < G.inv.length; j++) { const t = G.inv[j]; if (t && t.id === id) { G.inv[slot] = t; G.inv[j] = null; emit('inv'); emit('ftext', G.p.x, G.p.y - 1.5, `${ITEMS[id].n} 보충`, '#bfe6ff'); return; } }
}
// bag (not the hotbar) → chest; 'same' only moves kinds the chest already holds
export function stashBag(o, same) { let n = 0, left = 0; for (let i = HOT; i < G.inv.length; i++) { const s = G.inv[i]; if (!s) continue; if (same && !o.items.some(x => x && x.id === s.id)) continue; const l = moveInto(o.items, s); n += s.c - l; if (l) { s.c = l; left++; } else G.inv[i] = null; } return { n, left }; }
export function moveInto(arr, s) { const mx = stackMax(s.id); let left = s.c; for (let i = 0; i < arr.length && left; i++) { const t = arr[i]; if (t && t.id === s.id && t.c < mx) { const k = Math.min(mx - t.c, left); t.c += k; left -= k; } } const ord = arr === G.inv ? [...Array(arr.length - HOT).keys()].map(k => k + HOT).concat([...Array(HOT).keys()]) : [...arr.keys()]; for (const i of ord) if (left && !arr[i]) { arr[i] = { id: s.id, c: Math.min(mx, left) }; if (s.dur != null) arr[i].dur = s.dur; if (s.w != null) arr[i].w = s.w; if (s.lv) arr[i].lv = s.lv; left -= arr[i].c; } return left; }
export function sortBag() { // merge stacks and order the bag by kind; the hotbar stays as the player set it
  const items = G.inv.slice(HOT).filter(Boolean), merged = [];
  for (const it of items) { const mx = stackMax(it.id); if (DUR[it.id]) { merged.push(it); continue; } let left = it.c; for (const m of merged) if (m.id === it.id && m.c < mx && left) { const k = Math.min(mx - m.c, left); m.c += k; left -= k; } if (left) merged.push({ ...it, c: left }); }
  const catOrd = { equip: 0, food: 1, mat: 2, seed: 3, deco: 4 }, ord = Object.keys(ITEMS);
  merged.sort((a, b) => catOrd[bagCat(a.id)] - catOrd[bagCat(b.id)] || ord.indexOf(a.id) - ord.indexOf(b.id) || b.c - a.c);
  for (let j = HOT; j < G.inv.length; j++) G.inv[j] = merged[j - HOT] || null;
  emit('inv');
}
export function moveSlot(A, B) {
  if (A.arr === B.arr && A.i === B.i) return false; const a = A.arr[A.i], b = B.arr[B.i]; if (!a) return false;
  if (b && a.id === b.id && b.c < stackMax(b.id)) { const k = Math.min(stackMax(b.id) - b.c, a.c); b.c += k; a.c -= k; if (!a.c) A.arr[A.i] = null; }
  else { A.arr[A.i] = b; B.arr[B.i] = a; }
  emit('inv'); emit('sfx', 'place'); return true;
}
export const slotArr = s => s.o == null ? G.inv : (G.objs.get(s.o) || {}).items; // 칸 위치 { o: 상자 칸(가방이면 null), i }
// ---- 가방 ----
defineCmd('invSwap', c => { const A = G.inv[c.a], B = G.inv[c.b]; if (A && B && A.id === B.id && B.c < stackMax(B.id)) { const k = Math.min(stackMax(B.id) - B.c, A.c); B.c += k; A.c -= k; if (!A.c) G.inv[c.a] = null; } else { G.inv[c.a] = B; G.inv[c.b] = A; } emit('sfx', 'place'); emit('inv'); });
defineCmd('move', c => { const A = slotArr(c.a), B = slotArr(c.b); { const oa = c.a.o != null && G.objs.get(c.a.o), ob = c.b.o != null && G.objs.get(c.b.o); if ((isRefund(oa) || isRefund(ob)) && c.a.o !== c.b.o && (isRefund(ob) || (isRefund(oa) && (!refundMine(oa) || (B && B[c.b.i] && A && A[c.a.i] && B[c.b.i].id !== A[c.a.i].id))))) return false; } /* v69: nothing goes into a refund box */ return !!A && !!B && moveSlot({ arr: A, i: c.a.i }, { arr: B, i: c.b.i }); }); // 끌어 옮기기
defineCmd('sortBag', () => { sortBag(); emit('sfx', 'place'); emit('toast', '가방을 정리했어요', null, 'sortbag'); });
defineCmd('wear', c => { if (G.inv[c.i]) wearItem(c.i); });
defineCmd('unwear', c => { if (G.equip[c.sl]) unwear(c.sl); });
defineCmd('eat', c => eat(c.i));
// 「단축칸으로」: 빈 단축칸 → 든 단축칸 → 1번 칸과 자리 바꿈. 도구를 들면 G.sel = -1이라, 꽉 찼을 때 -1번 자리로 옮겨 물건이 사라지던 버그를 막음
defineCmd('toHot', c => { const from = c.i; if (!(from >= HOT && from < G.inv.length) || !G.inv[from]) return; let to = G.inv.slice(0, HOT).findIndex(x => !x); if (to < 0) to = G.sel >= 0 && G.sel < HOT ? G.sel : 0; const tmp = G.inv[to]; G.inv[to] = G.inv[from]; G.inv[from] = tmp; G.sel = to; emit('inv'); emit('sfx', 'place'); });
defineCmd('trash', c => { G.inv[c.i] = null; emit('inv'); });
defineCmd('trashTool', c => clearSlot('t:' + c.i));
// ---- 상자 ----
// v69 (BF-05): the refund box — only its owner opens it, and nothing can be put back into it (take-only)
export const refundMine = o => !!o && (o.own || ME) === ((curPl && curPl.id) || ME);
export const isRefund = o => !!o && o.t === 'refundBox';
export function clearRefundBox(i) { const o = G.objs.get(i); if (!isRefund(o) || !refundMine(o) || (o.items || []).some(x => x)) return false; delObj(i); emit('sfx', 'pick'); emit('puff', i % W + .5, ((i / W) | 0) + .6, '#e8d8c0', 5, 2); markLight(); emit('close'); return true; }
defineCmd('stash', c => { const o = G.objs.get(c.o); if (!o || !o.items || isRefund(o)) return false; const r = stashBag(o, c.same);
  emit('toast', r.n ? `${r.n}개를 상자에 넣었어요${r.left ? ' · 상자가 가득 차서 일부는 남았어요' : ''}` : c.same ? '상자에 있는 것과 같은 물건이 가방에 없어요' : r.left ? '상자가 가득 찼어요' : '가방에 넣을 물건이 없어요', r.n ? 'good' : null, 'stash'); if (r.n) emit('sfx', 'place'); emit('inv'); });
// v83 「가까운 상자에 넣기」: 내 둘레 16칸 안의 보관상자 중 그 물건이 이미 있는 상자에만, 가까운 상자부터 (겹치기 → 빈칸). 단축칸·도구 주머니는 그대로, 남으면 가방에
export const STASH_R = 16;
export function stashNear() {
  const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y), list = [];
  for (const [j, o] of G.objs) { if (!isStore(o) || !storeAt(j)) continue; const x = j % W, y = (j / W) | 0; if (Math.abs(x - px) > STASH_R || Math.abs(y - py) > STASH_R) continue; list.push({ j, o, x, y, d: Math.hypot(x + .5 - p.x, y + .5 - p.y), n: 0 }); }
  list.sort((a, b) => a.d - b.d); let n = 0, left = 0;
  for (let i = HOT; i < G.inv.length; i++) { const s = G.inv[i]; if (!s) continue; const to = list.filter(c => c.o.items.some(x => x && x.id === s.id)); if (!to.length) continue;
    for (const c of to) { const l = moveInto(c.o.items, s), k = s.c - l; c.n += k; n += k; s.c = l; if (!l) break; }
    if (!s.c) G.inv[i] = null; else left++; }
  const used = list.filter(c => c.n);
  for (const c of used) { emit('puff', c.x + .5, c.y + .4, '#ffe9a8', 10, 2.2, .6); emit('ftext', c.x + .5, c.y - .3, `+${c.n}`, '#ffe9a8'); }
  return { n, left, boxes: used.length, near: list.length }; }
defineCmd('stashNear', () => { const r = stashNear();
  emit('toast', r.n ? `${r.n}개를 상자 ${r.boxes}개에 넣었어요${r.left ? ' · 상자가 가득 차서 일부는 남았어요' : ''}` : !r.near ? '근처(16칸 안)에 보관상자가 없어요' : r.left ? '상자가 가득 차서 넣지 못했어요' : '근처 상자에 같은 물건이 없어요', r.n ? 'good' : null, 'stash');
  if (r.n) emit('sfx', 'place'); emit('inv'); return r; });
defineCmd('chest', c => { const o = G.objs.get(c.o); if (!o || (isRefund(o) && (!c.out || !refundMine(o)))) return false; const src = c.out ? o.items : G.inv, dst = c.out ? G.inv : o.items; const s = src[c.i]; if (!s) return false; const left = moveInto(dst, s); if (left === s.c) { emit('toast', c.out ? '가방이 가득 찼어요' : '상자가 가득 찼어요', null, 'full'); return false; } if (left) s.c = left; else src[c.i] = null; emit('sfx', 'pick'); emit('inv'); }); // 상자 ↔ 가방 한 칸 (out: 상자에서 꺼내기)
defineCmd('retrieve', c => { const o = G.objs.get(c.o); if (isRefund(o)) { clearRefundBox(c.o); return; } if (o) { delObj(c.o); returnObj(o, G.p.x, G.p.y); emit('sfx', 'pick'); markLight(); } }); // 제작대 회수
defineCmd('markAdd', () => { G.marks = G.marks || []; G.marks.push({ x: Math.floor(G.p.x), y: Math.floor(G.p.y) }); });
defineCmd('markDel', c => { G.marks.splice(c.i, 1); });
// v136 개발자 도구: 지도 전부 밝히기 · 가방 칸 다시 맞추기(가방 넉넉히 스위치)
defineCmd('devReveal', () => { if (!canDev()) return false; G.explored.fill(1); emit('remap'); emit('toast', '지도를 모두 밝혔어요', 'good'); });
defineCmd('fitBag', () => { fitBag(); emit('inv'); });
export const isTool = id => !!ITEMS[id] && TOOL_KINDS.includes(ITEMS[id].kind);
export const toolPow = s => ((ITEMS[s.id] && ITEMS[s.id].power) || 1) * (1 + UPG_POW * lvOf(s));
export const heldTool = () => (G && G.sel < 0 && G.tools && G.tools[G.tsel]) || null;
// the tool of a kind to use: the one in hand if it is that kind, else the best working one (pouch first, then the bag)
// (a tool the player chose on purpose — from the tool row, the pouch or the hotbar — is used even if a better one exists; one interact took out by itself is not)
export function bestTool(kind) { if (!G) return null; const h = selItem(); if (h && ITEMS[h.id] && ITEMS[h.id].kind === kind && !isBroken(h) && (G.sel >= 0 || G.tHand)) return h;
  let b = null; for (const s of (G.tools || []).concat(G.inv)) { if (!s || !ITEMS[s.id] || ITEMS[s.id].kind !== kind || isBroken(s)) continue; if (!b || toolPow(s) > toolPow(b)) b = s; } return b; }
export function holdTool(s, chosen) { if (!s || !G.tools) return; G.tHand = !!chosen; let k = G.tools.indexOf(s);
  if (k < 0) { const j = G.inv.indexOf(s); if (j < 0) return; G.inv[j] = null; G.tools.push(s); k = G.tools.length - 1; } // a tool still in the bag moves into the pouch
  G.tsel = k; G.sel = -1; emit('inv'); }
export function fixTsel(h) { if (!G.tools.length) { G.tsel = 0; if (G.sel < 0) G.sel = 0; return; } const k = h ? G.tools.indexOf(h) : -1; if (k >= 0) G.tsel = k; else { G.tsel = Math.min(G.tsel || 0, G.tools.length - 1); const kd = h && ITEMS[h.id].kind, nx = kd && bestTool(kd); if (nx && G.tools.includes(nx)) G.tsel = G.tools.indexOf(nx); } }
// tools that ended up in the bag (from a chest, an old save …) go to the pouch
export function sweepTools() { if (!G || !G.tools) return; const h = heldTool(); for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (s && isTool(s.id)) { if (i === G.sel) { G.inv[i] = null; G.tools.push(s); G.tsel = G.tools.length - 1; G.sel = -1; } else { G.inv[i] = null; G.tools.push(s); } emit('inv'); } } if (h && G.sel < 0) fixTsel(h); }
// the bag and the pouch together for repair · salvage · upgrade lists ('t:3' = pouch slot 3)
export const slotList = () => G.inv.map((s, i) => ({ s, i })).concat((G.tools || []).map((s, k) => ({ s, i: 't:' + k })));
// 칸 번호: 숫자 = 가방, 'e:옷칸' = 입은 장비, 't:k' = 도구 주머니, 's:세트:옷칸' = 다른 장비 세트에 넣어 둔 장비 (v83)
export const itemAt = i => { if (typeof i !== 'string') return G.inv[i]; if (i.startsWith('e:')) return G.equip[i.slice(2)]; if (i.startsWith('t:')) return (G.tools || [])[+i.slice(2)];
  if (i.startsWith('s:')) { const [, k, sl] = i.split(':'), S = G.eqSets && G.eqSets[+k]; return +k !== (G.eqSet || 0) && S && S.e ? S.e[sl] || null : null; } return null; };
export function clearSlot(i) { if (typeof i === 'string' && i.startsWith('t:')) { const h = heldTool(), k = +i.slice(2), gone = G.tools[k]; G.tools.splice(k, 1); if (h && h === gone) { G.tsel = 0; if (!G.tools.length && G.sel < 0) G.sel = 0; } else fixTsel(h); } else G.inv[i] = null; emit('inv'); }
// one of each kind for the tool row: the best working one, broken ones hidden
export function toolRowList() { const by = {}; for (const s of G.tools || []) { if (isBroken(s)) continue; const k = ITEMS[s.id].kind; if (!by[k] || toolPow(s) > toolPow(by[k])) by[k] = s; } return TOOL_KINDS.map(k => by[k]).filter(Boolean); }
defineCmd('hold', c => { const s = G.tools && G.tools[c.i]; if (s) holdTool(s, true); });
