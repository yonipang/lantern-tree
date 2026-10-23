// ================= v91·v92 건축 모드 (규칙): 건축 목록·개수(가방 + 16칸 안 상자), 만들어서 놓기, 놓을 수 있는지, 연속 놓기·벽/바닥 교체, v92 옮기기·뜯기·되돌리기 =================
// 화면(목록·미리보기·누르기)은 ui/build.js. 여기서는 명령 'bplace' { id, cells: [[x, y] …], rot } · 'bmove' { from, to, rot } · 'btake' { cells } · 'bundo' 만 받아요.
// 기획: dev/design/건축모드.md (v91 = 켜고 끄기·목록·놓기·연속 놓기·교체, v92 = 옮기기·뜯기·되돌리기)
import { TIER_IT, TIERED } from '../data/automation-tiers.js';
import { TIMED } from '../data/farming-cooking.js';
import { BUILT_WALLS, ITEMS, OBJ, RECIPES, WALLS } from '../data/items.js';
import { DECOR_ONLY } from '../data/decor136.js';
import { canDev, devOn } from '../save/storage.js';
import { FLOOR_ITEM, NATURE } from '../data/rpg-nature.js';
import { rand, rint } from '../engine/random.js';
import { G } from '../save/state.js';
import { BUILD_KINDS, groundOf, putItem, rotN, rotOf, rotSwaps } from './building.js';
import { defineCmd } from './commands.js';
import { knows } from './cooking.js';
import { flowNear } from './digging.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { recipeOn } from './farming.js';
import { addItem, countItem, isBroken, isRefund, isStore, removeItem, returnObj, slotIs, storeAt } from './inventory.js';
import { markLight } from './loop.js';
import { nearWarpPt, portalWhy, warpsChanged } from './warp.js';
import { idx, inB, LAVA, PIT, W } from '../world/map.js';
import { WATER } from './nature.js';
import { anchorAt, canPlace, delObj, fpFree, fpOf, isPlacedFloor, noDigZone, occupied, pushSpot, setParts } from '../world/tiles.js';
export const BM_REACH = 8, BM_MAX = 64, BM_CHEST_R = 16;
// ---- 분류 탭 ----
export const BM_CATS = [['wall', '벽'], ['floor', '바닥'], ['furn', '가구'], ['light', '조명'], ['stn', '제작대'], ['circ', '회로'], ['nat', '자연'], ['deco', '꾸미기']]; // v136 「꾸미기」는 개발자 모드에서만 (꾸미기 전용 물건)
// v93: 흙·얼음 덩이는 「벽」 탭(쌓기)과 「바닥」 탭(메우기·바꾸기) 둘 다 — 바닥 탭의 것은 'dirt#g'처럼 #g를 붙인 이름으로 골라요
export const GSUF = '#g';
export const bmBase = id => typeof id === 'string' && id.endsWith(GSUF) ? id.slice(0, -GSUF.length) : id;
export const bmItem = id => { const b = bmBase(id), it = ITEMS[b]; return b !== id ? groundOf(it) : it; };
export function bmCat(id) { if (bmBase(id) !== id) return 'floor'; const it = ITEMS[id], k = it.kind; if (it.deco) return 'deco'; /* v136 꾸미기 전용 */
  if (k === 'wall') return 'wall'; if (k === 'floor' || k === 'ground') return 'floor'; if (k === 'wire') return 'circ'; if (k === 'seed') return 'nat';
  const d = OBJ[it.obj] || {}; if (d.tw) return 'wall'; if (d.dev || d.sw || d.src || d.gate || it.obj === 'battery' || it.obj === 'eLamp') return 'circ';
  if (d.station || it.obj === 'chest' || it.obj === 'chestBig' || d.warp) return 'stn'; /* v136 상자 종류 가구는 가구 탭 그대로 */ if (d.light) return 'light'; if (d.nat || d.crop || d.tree || d.ranch || natDecor().has(id)) return 'nat'; return 'furn'; }
let NAT_D = null; // 자연 꾸미기(덤불·꽃밭·연못·바위): 자연 꾸미기 표와 제작 창 「자연」 탭의 것
const natDecor = () => NAT_D || (NAT_D = new Set([...Object.keys(NATURE), ...RECIPES.filter(r => r.cat === 'nature').map(r => r.out)]));
export const isBuildItem = id => { const it = ITEMS[id]; return !!it && BUILD_KINDS.includes(it.kind); };
// 끌어서 여러 칸: 바닥은 네모, 벽·울타리·빛뿌리는 끈 길 한 줄, 그 밖은 한 칸
export function bmDrag(id) { const it = bmItem(id); if (!it) return 'one'; if (it.kind === 'floor' || it.kind === 'ground') return 'rect';
  if (it.kind === 'wall' || it.kind === 'wire') return 'line'; const d = OBJ[it.obj]; return d && d.tw ? 'line' : 'one'; }
// ---- 가방 + 둘레 16칸 안 보관상자 ----
export function bmChests() { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y), out = [];
  for (const [j, o] of G.objs) { if (!isStore(o) || !storeAt(j)) continue; /* v136 상자 종류 가구도 */ const x = j % W, y = (j / W) | 0; if (Math.abs(x - px) > BM_CHEST_R || Math.abs(y - py) > BM_CHEST_R) continue; out.push({ o, d: Math.hypot(x - px, y - py) }); }
  return out.sort((a, b) => a.d - b.d).map(c => c.o); }
export function bmCount(id, ch = bmChests()) { let n = countItem(id), b = 0; for (const o of ch) for (const s of o.items) if (slotIs(s, id)) b += s.c; return { bag: n, box: b, all: n + b }; }
// 한 개를 가방(뒤 칸부터) → 가까운 상자 순으로 꺼내요. 돌려주는 칸은 배터리 남은 양을 그대로 가져요
export function bmTake(id, n, ch) { let left = n; const one = [];
  for (let i = G.inv.length - 1; i >= 0 && left > 0; i--) { const s = G.inv[i]; if (s && slotIs(s, id) && s.dur != null) one.push(s.dur); }
  const fromBag = Math.min(left, countItem(id)); if (fromBag) removeItem(id, fromBag); left -= fromBag;
  for (const o of ch) for (let k = 0; k < o.items.length && left > 0; k++) { const s = o.items[k]; if (!slotIs(s, id)) continue; if (s.dur != null) one.push(s.dur); const t = Math.min(s.c, left); s.c -= t; left -= t; if (!s.c) o.items[k] = null; }
  return { id, c: 1, dur: one.length ? one[0] : undefined }; }
// ---- 만들어서 놓기: 해금된 레시피 + 그 제작대 단계까지 올렸어야 (곁에 있을 필요는 없음). 시간이 걸리는 용광로·요리솥 것은 안 돼요 ----
export function bmStations() { const set = new Set(); for (const o of G.objs.values()) { const d = o && OBJ[o.t]; if (d && d.station) set.add(d.station); } return set; }
export function stationReached(r, st) { if (!r.at) return true; if (TIMED[r.at]) return false;
  if (r.at === 'bench') return !!G.stats.bench && (r.tier || 0) <= (G.stats.benchLv || 0);
  if (TIERED[r.at]) return st.has(r.at) && (r.tier || 0) <= (G.stats.gearLv || 0);
  if (r.at === 'fdesk') return st.has('fdesk') && (r.tier || 0) <= (G.stats.benchLv || 0); // v136 가구 제작대
  return st.has(r.at); }
const DEV_R = {}; // v136 개발자 모드: 꾸미기 전용·재료 없이 놓기 (재료 없는 레시피)
export function bmRecipe(id, st = bmStations()) { if (canDev() && (DECOR_ONLY[id] || devOn('free')) && ITEMS[id]) return DEV_R[id] || (DEV_R[id] = { out: id, n: 1, req: [], at: 'dev' }); return RECIPES.find(r => r.out === id && recipeOn(r) && (!r.dish || knows(r.dish)) && stationReached(r, st)) || null; }
export const bmCanMake = (r, ch) => !!r && (r.at === 'dev' || r.req.every(([m, c]) => bmCount(m, ch).all >= c));
// ---- 건축 목록: 가진 것 + 만들 수 있는 레시피 ----
export function bmList() { const ch = bmChests(), st = bmStations(), seen = new Set(), out = [];
  const add = id => { if (seen.has(id) || !isBuildItem(id)) return; seen.add(id); const c = bmCount(id, ch), r = c.all ? null : bmRecipe(id, st); if (!c.all && !r) return;
    const e = { id, base: id, cat: bmCat(id), bag: c.bag, box: c.box, have: c.all, r, can: c.all > 0 || bmCanMake(r, ch) }; out.push(e);
    if (groundOf(ITEMS[id])) out.push({ ...e, id: id + GSUF, cat: 'floor' }); };
  for (const s of G.inv) if (s) add(s.id); for (const o of ch) for (const s of o.items) if (s) add(s.id);
  for (const r of RECIPES) add(r.out);
  if (canDev()) for (const id in DECOR_ONLY) add(id); // v136 개발자 모드 「꾸미기」 탭
  return out; }
// ---- 놓을 수 있는지 ----
export function pickTier() { let t = 0; for (const s of G.inv.concat(G.tools || [])) { if (!s || !ITEMS[s.id] || ITEMS[s.id].kind !== 'pick' || isBroken(s)) continue; t = Math.max(t, ITEMS[s.id].tier || 0); } return t; }
export const bmFp = (id, rot) => { const it = ITEMS[id], d = it && OBJ[it.obj]; if (!d || !d.sz) return [1, 1]; return rot % 2 && rotSwaps(d) && rotN(it.obj) > 1 ? [d.sz[1], d.sz[0]] : d.sz; };
// 여러 칸 가구: 누른 칸이 아래 줄 가운데가 되게
export const bmAnchor = (id, x, y, rot) => { const fp = bmFp(id, rot); return { x: x - Math.floor((fp[0] - 1) / 2), y: y - (fp[1] - 1) }; };
export const inBmReach = (x, y) => { const p = G.p; return Math.abs(x - Math.floor(p.x)) <= BM_REACH && Math.abs(y - Math.floor(p.y)) <= BM_REACH; };
// 벽 위에 다른 벽을 놓으면 바꾸기: 지금 가진 곡괭이로 캘 수 있는 벽만(쌓은 벽도 같음), 암반·보스방은 안 돼요
export function wallSwapOk(x, y, it) { const i = idx(x, y), w = G.wall[i]; if (!w || it.kind !== 'wall' || w === it.wall) return false; const def = WALLS[w];
  return !!def && def.tier <= pickTier() && noDigZone(x, y) !== 'boss' && !G.objs.get(i); }
// null = 놓을 수 있음, 아니면 까닭 (skip: 내 몸은 비켜설 수 있으니 무시)
export function bmWhy(id, x, y, rot = 0, skip) { const it = bmItem(id); if (!it || !BUILD_KINDS.includes(it.kind)) return '놓을 수 없는 물건이에요';
  if (!inB(x, y)) return '여기엔 놓을 수 없어요'; if (!inBmReach(x, y)) return '8칸 안에만 놓을 수 있어요';
  const d = it.kind === 'place' ? OBJ[it.obj] : null;
  if (d && d.warp) { const w = portalWhy(x, y); if (w) return w; }
  if (it.kind === 'wall' && G.wall[idx(x, y)]) { if (wallSwapOk(x, y, it)) return null; const w = G.wall[idx(x, y)]; return w === it.wall ? '같은 벽이에요' : (WALLS[w] || {}).tier > pickTier() ? '더 좋은 곡괭이가 있어야 바꿀 수 있어요' : '이 벽은 바꿀 수 없어요'; }
  if (d && d.sz) { const fp = bmFp(id, rot), a = bmAnchor(id, x, y, rot); return fpFree(a.x, a.y, fp, !!d.solid, null, skip) ? null : '자리가 모자라요'; }
  return canPlace(x, y, it, skip) ? null : '여기엔 놓을 수 없어요'; }
// 벽을 바꿀 때 원래 벽은 캔 것과 같이 (가방으로, 넘치면 발밑에)
function wallBack(x, y) { const w = G.wall[idx(x, y)], def = WALLS[w]; if (!def) return;
  if (myWall(idx(x, y)) && wallItem(w)) { toBag(wallItem(w), { x, y }); return; } // v92: 직접 쌓은 벽은 그 벽 그대로 돌려받아요
  for (const [id, a, b, chance] of def.drop) if (rand() < chance) { const c = rint(a, b); if (c > 0) { const l = addItem(id, c, false); if (l) spawnDrop(id, l, x + .5, y + .5); } } }
const toBag = (id, t) => { const l = addItem(id, 1, false); if (l) spawnDrop(id, l, t.x + .5, t.y + .5); };
// ---- 놓기 명령 ----
defineCmd('bplace', c => {
  const p = G.p, it = bmItem(c.id), id = bmBase(c.id); if (!p || p.dead > 0 || !it || !BUILD_KINDS.includes(it.kind) || !Array.isArray(c.cells)) return false;
  const rot = rotN(it.obj) > 1 ? (c.rot | 0) % rotN(it.obj) : 0, cells = c.cells.slice(0, BM_MAX), st = bmStations();
  let n = 0, made = 0, why = null, last = null; const undo = [];
  for (const cell of cells) { const x = cell[0] | 0, y = cell[1] | 0; let w = bmWhy(c.id, x, y, rot);
    // 한 칸만 놓을 때는 단축칸 놓기처럼 내 몸이 비켜서요 (v67)
    if (w && cells.length === 1 && !(OBJ[it.obj] || {}).sz && !bmWhy(c.id, x, y, rot, p)) { const sp = pushSpot(x, y, it); if (sp) { p.x = sp.x; p.y = sp.y; p.kx = p.ky = 0; if (p.dash) p.dash = null; w = null; } }
    if (w) { why = why || w; continue; }
    const ch = bmChests(); let s;
    if (bmCount(id, ch).all > 0) s = bmTake(id, 1, ch);
    else { const r = bmRecipe(id, st); if (!r || !bmCanMake(r, ch)) { why = r ? '재료가 모자라요' : '가진 것이 없어요'; break; }
      for (const [m, k] of r.req) bmTake(m, k, ch); s = { id, c: 1 }; if (r.at !== 'dev') made++;
      if (r.n > 1) { const l = addItem(id, r.n - 1, false); if (l) spawnDrop(id, l, p.x, p.y); }
      G.stats.made = G.stats.made || {}; G.stats.made[id] = (G.stats.made[id] || 0) + 1; }
    if (it.kind === 'wall' && G.wall[idx(x, y)]) { wallBack(x, y); G.wdmg.delete(idx(x, y)); }
    const t = putItem(it, s, { x, y }, { rot, anchor: OBJ[it.obj] && OBJ[it.obj].sz ? bmAnchor(c.id, x, y, rot) : null, give: toBag });
    emit('puff', t.x + .5, t.y + .9, '#e8d8c0', 3, 1.4, 0.1); n++; last = t; if (it.kind !== 'seed' && it.kind !== 'ground') undo.push({ x: t.x, y: t.y }); }
  if (n) setUndo(undo.length ? { k: 'place', id, cells: undo } : null);
  emit('inv');
  if (n) { emit('sfx', 'place'); if (made) emit('toast', `재료로 ${made}개를 만들어 놓았어요`, 'good', 'bmake'); if (why && cells.length > 1) emit('toast', `${n}칸 놓았어요 · ${why}`, null, 'bplace'); }
  else { emit('toast', why || '여기엔 놓을 수 없어요', null, 'bplace'); return false; }
  return last;
});
// ================= v92 건축 모드 2: 옮기기·뜯기·되돌리기 (기획: dev/design/건축모드.md 6~8) =================
// 직접 놓은 것 = 가구·제작대·조명 같은 물건(회수할 수 있는 것), 직접 쌓은 벽(나무·돌벽돌 벽, v92부터 쌓은 자연 재료 벽 G.bwall), 깐 바닥, 빛뿌리.
// 자연 벽·나무·작물·덮은 자연 바닥은 뜯지 않아요(곡괭이·도끼·낫·삽으로). 되돌리기는 사람마다 마지막 한 번(놓기·옮기기·뜯기), 저장하지 않아요.
const BW = () => G.bwall || (G.bwall = new Set());
export const myWall = i => { const w = G.wall[i]; return !!w && (BUILT_WALLS.has(w) || BW().has(i)); };
let WIT = null;
export const wallItem = w => { if (!WIT) { WIT = {}; for (const id in ITEMS) { const it = ITEMS[id]; if (it.kind === 'wall' && !(it.wall in WIT)) WIT[it.wall] = id; } } return WIT[w] || null; };
export function bmObjAt(x, y) { if (!inB(x, y)) return null; const ai = anchorAt(idx(x, y)); if (ai < 0) return null; const o = G.objs.get(ai); return o ? { i: ai, o, x: ai % W, y: (ai / W) | 0 } : null; }
const notMine = d => !d || !d.item || d.refund || d.lost || d.crop || d.tree || d.nat;
export const canMoveObj = o => !notMine(OBJ[o.t]);
export const canTakeObj = o => canMoveObj(o) && !(OBJ[o.t].chest && o.items && o.items.some(Boolean));
const retItem = o => TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : OBJ[o.t].item;
const setUndo = u => { if (G.p) G.p.bmUndo = u || null; };
export const bmUndoKind = () => (G && G.p && G.p.bmUndo && G.p.bmUndo.k) || null;
// 뜯을 것: 물건 → 벽 → 빛뿌리 → 깐 바닥 (위에 있는 것부터)
export function bmTakeAt(x, y, far) {
  if (!inB(x, y)) return { why: '뜯을 것이 없어요' }; if (!far && !inBmReach(x, y)) return { why: '8칸 안에서만 뜯을 수 있어요' };
  const i = idx(x, y), a = bmObjAt(x, y);
  if (a) { if (canTakeObj(a.o)) return { k: 'obj', ...a }; return { why: OBJ[a.o.t] && OBJ[a.o.t].chest && canMoveObj(a.o) ? '물건이 든 상자는 뜯을 수 없어요 · 옮기기는 돼요' : '직접 놓은 것만 뜯을 수 있어요' }; }
  if (G.wall[i]) return myWall(i) && wallItem(G.wall[i]) ? { k: 'wall', i, x, y } : { why: '직접 쌓은 벽만 뜯어요 · 자연 벽은 곡괭이로 캐요' };
  if (G.wire.has(i)) return { k: 'wire', i, x, y };
  if (isPlacedFloor(G.floor[i])) { if ((G.under.has(i) ? G.under.get(i) : 2) === PIT && occupied(x, y)) return { why: '누가 서 있는 칸이에요' }; return { k: 'floor', i, x, y }; }
  return { why: '직접 놓은 것만 뜯을 수 있어요' }; }
const bmGive = (id, x, y) => { const l = addItem(id, 1, false); if (l) spawnDrop(id, l, x + .5, y + .5); };
const copyObj = o => { const c = JSON.parse(JSON.stringify(o)); delete c.job; if (Array.isArray(c.store)) c.store = []; return c; };
// 한 가지를 뜯어서 가방으로 (가득이면 발밑에) — 되돌리기용 기록을 돌려줘요
function takeOne(t) { const { x, y, i } = t;
  if (t.k === 'obj') { const o = t.o, d = OBJ[o.t], rec = { k: 'obj', x, y, o: copyObj(o), it: retItem(o) };
    delObj(i); if (d.bed && G.spawnPt && G.spawnPt.x === x && G.spawnPt.y === y) G.spawnPt = null;
    returnObj(o, x + .5, y + .5); if (d.warp) warpsChanged(); emit('puff', x + .5, y + .6, '#e8d8c0', 4, 2); emit('tile', x, y); return rec; }
  if (t.k === 'wall') { const w = G.wall[i]; G.wall[i] = 0; G.wdmg.delete(i); BW().delete(i); bmGive(wallItem(w), x, y); flowNear(x, y); emit('puff', x + .5, y + .6, '#c9b49a', 5, 2); emit('tile', x, y); return { k: 'wall', x, y, w }; }
  if (t.k === 'wire') { G.wire.delete(i); bmGive('wire', x, y); emit('tile', x, y); return { k: 'wire', x, y }; }
  const f = G.floor[i], u = G.under.has(i) ? G.under.get(i) : null; G.floor[i] = u != null ? u : 2; G.under.delete(i); bmGive(FLOOR_ITEM[f], x, y); flowNear(x, y); emit('puff', x + .5, y + .7, '#e8d8c0', 4, 2); emit('tile', x, y); return { k: 'floor', x, y, f, u }; }
defineCmd('btake', c => {
  const p = G.p; if (!p || p.dead > 0 || !Array.isArray(c.cells)) return false;
  const seen = new Set(), recs = []; let why = null;
  for (const cell of c.cells.slice(0, BM_MAX)) { const t = bmTakeAt(cell[0] | 0, cell[1] | 0); if (t.why) { why = why || t.why; continue; }
    const key = t.k === 'obj' ? 'o' + t.i : t.k + t.i; if (seen.has(key)) continue; seen.add(key); recs.push(takeOne(t)); }
  if (!recs.length) { emit('toast', why || '뜯을 것이 없어요', null, 'btake'); return false; }
  setUndo({ k: 'take', recs }); markLight(); emit('inv'); emit('sfx', 'pick');
  if (recs.length > 1) emit('toast', `${recs.length}개를 뜯었어요`, null, 'btake'); return recs.length;
});
// ---- 옮기기: 새 자리 모든 칸이 비어야 (자기 자리는 빼고), 든 상자·굽는 중인 것도 그대로 ----
const dirOf = (o, rot) => { const rn = rotN(o.t); return rn > 1 && rot != null ? (rot | 0) % rn : rotOf(o); };
export function moveFp(o, rot) { const d = OBJ[o.t], dir = dirOf(o, rot); return fpOf({ t: o.t, rot: rotSwaps(d) && dir % 2 ? 1 : 0 }); }
export const moveAnchor = (o, x, y, rot) => { const fp = moveFp(o, rot); return { x: x - Math.floor((fp[0] - 1) / 2), y: y - (fp[1] - 1) }; };
export function bmMoveWhy(a, x, y, rot, far) { const o = a.o, d = OBJ[o.t]; if (!canMoveObj(o)) return '옮길 수 없는 물건이에요';
  const fp = moveFp(o, rot), an = moveAnchor(o, x, y, rot);
  for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) { const tx = an.x + dx, ty = an.y + dy; if (!inB(tx, ty)) return '여기엔 놓을 수 없어요'; if (!far && !inBmReach(tx, ty)) return '8칸 안에만 놓을 수 있어요';
    const j = idx(tx, ty), f = G.floor[j]; if (G.wall[j] || f === WATER || f === LAVA || f === PIT) return '여기엔 놓을 수 없어요';
    const q = G.objs.get(j); if (q && j !== a.i && !(q.t === '_part' && q.a === a.i)) return '자리가 모자라요';
    if (d.solid && occupied(tx, ty)) return '누가 서 있는 칸이에요'; if (d.tw && nearWarpPt(tx, ty)) return '워프포인트 둘레에는 세울 수 없어요'; }
  if (d.warp && noDigZone(an.x, an.y) === 'boss') return '보스방 가까이에는 포탈을 놓을 수 없어요';
  return null; }
function moveObj(a, an, dir) { const o = a.o, d = OBJ[o.t], from = { x: a.x, y: a.y, dir: rotOf(o) };
  delObj(a.i); delete o.dir; delete o.rot; if (dir) { o.dir = dir; if (rotSwaps(d) && dir % 2) o.rot = 1; }
  const j = idx(an.x, an.y); G.objs.set(j, o); if (d.sz) setParts(j, o);
  if (d.bed && G.spawnPt && G.spawnPt.x === from.x && G.spawnPt.y === from.y) G.spawnPt = { x: an.x, y: an.y };
  if (d.warp) warpsChanged(); markLight(); emit('tile', from.x, from.y); emit('tile', an.x, an.y); emit('sfx', 'place'); emit('puff', an.x + .5, an.y + .9, '#e8d8c0', 4, 1.4, 0.1);
  return from; }
defineCmd('bmove', c => {
  const p = G.p; if (!p || p.dead > 0 || !Array.isArray(c.from) || !Array.isArray(c.to)) return false;
  const a = bmObjAt(c.from[0] | 0, c.from[1] | 0); if (!a || !canMoveObj(a.o)) { emit('toast', '옮길 수 없는 물건이에요', null, 'bmove'); return false; }
  if (!inBmReach(a.x, a.y)) { emit('toast', '8칸 안에서만 옮길 수 있어요', null, 'bmove'); return false; }
  const x = c.to[0] | 0, y = c.to[1] | 0, why = bmMoveWhy(a, x, y, c.rot); if (why) { emit('toast', why, null, 'bmove'); return false; }
  const an = moveAnchor(a.o, x, y, c.rot), dir = dirOf(a.o, c.rot); if (an.x === a.x && an.y === a.y && dir === rotOf(a.o)) return false;
  const from = moveObj(a, an, dir); setUndo({ k: 'move', o: a.o, from, to: an }); return an;
});
// ---- 되돌리기 (마지막 한 번) ----
function putBack(r) { const i = idx(r.x, r.y), ch = bmChests();
  if (r.k === 'obj') { const d = OBJ[r.o.t]; if (!d || !fpFree(r.x, r.y, fpOf(r.o), !!d.solid) || bmCount(r.it, ch).all < 1) return false;
    const s = bmTake(r.it, 1, ch), o = copyObj(r.o); if (s.dur != null && o.t === 'battery') o.e = s.dur;
    G.objs.set(i, o); if (d.sz) setParts(i, o); if (d.warp) warpsChanged(); return true; }
  if (r.k === 'wall') { const id = wallItem(r.w); if (G.wall[i] || G.objs.get(i) || occupied(r.x, r.y) || !id || bmCount(id, ch).all < 1) return false; bmTake(id, 1, ch); G.wall[i] = r.w; BW().add(i); return true; }
  if (r.k === 'wire') { if (G.wire.has(i) || bmCount('wire', ch).all < 1) return false; bmTake('wire', 1, ch); G.wire.set(i, 1); return true; }
  if (r.k === 'floor') { const id = FLOOR_ITEM[r.f]; if (G.wall[i] || G.floor[i] !== (r.u != null ? r.u : 2) || !id || bmCount(id, ch).all < 1) return false; bmTake(id, 1, ch); G.floor[i] = r.f; if (r.u != null) G.under.set(i, r.u); return true; }
  return false; }
defineCmd('bundo', () => {
  const p = G.p, u = p && p.bmUndo; if (!p || p.dead > 0 || !u) { emit('toast', '되돌릴 것이 없어요', null, 'bundo'); return false; }
  p.bmUndo = null; let n = 0, miss = 0;
  if (u.k === 'take') { for (const r of u.recs.slice().reverse()) { if (putBack(r)) { n++; emit('tile', r.x, r.y); } else miss++; } }
  else if (u.k === 'place') { const it = ITEMS[u.id];
    for (const c of u.cells.slice().reverse()) { const t = bmTakeAt(c.x, c.y, true); if (t.why) { miss++; continue; }
      const same = t.k === 'obj' ? t.o.t === it.obj : t.k === 'wall' ? it.kind === 'wall' && G.wall[t.i] === it.wall : t.k === 'wire' ? it.kind === 'wire' : it.kind === 'floor' && G.floor[t.i] === it.floor;
      if (!same) { miss++; continue; } takeOne(t); n++; } }
  else if (u.k === 'move') { const ai = idx(u.to.x, u.to.y), o = G.objs.get(ai);
    if (o === u.o) { const a = { i: ai, o, x: u.to.x, y: u.to.y }, fp = moveFp(o, u.from.dir);
      const bx = u.from.x + Math.floor((fp[0] - 1) / 2), by = u.from.y + (fp[1] - 1); // 원래 자리를 「아래 줄 가운데」 칸으로 바꿔서 확인
      if (!bmMoveWhy(a, bx, by, u.from.dir, true)) { moveObj(a, { x: u.from.x, y: u.from.y }, u.from.dir); n++; } else miss++; } else miss++; }
  markLight(); emit('inv');
  if (n) { emit('sfx', 'pick'); emit('toast', miss ? `되돌렸어요 · ${miss}개는 되돌리지 못했어요` : '되돌렸어요', 'good', 'bundo'); }
  else emit('toast', u.k === 'take' ? '되돌리지 못했어요 · 그 물건이 없거나 자리가 막혔어요' : '되돌리지 못했어요', null, 'bundo');
  return n;
});
