// ================= v91 건축 모드 (규칙): 건축 목록·개수(가방 + 16칸 안 상자), 만들어서 놓기, 놓을 수 있는지, 연속 놓기·벽/바닥 교체 명령 =================
// 화면(목록·미리보기·누르기)은 ui/build.js. 여기서는 명령 { k: 'bplace', id, cells: [[x, y] …], rot }만 받아요.
// 기획: dev/design/건축모드.md (v91 = 켜고 끄기·목록·놓기·연속 놓기·교체, v92 = 옮기기·뜯기·되돌리기)
import { TIERED } from '../data/automation-tiers.js';
import { TIMED } from '../data/farming-cooking.js';
import { ITEMS, OBJ, RECIPES, WALLS } from '../data/items.js';
import { NATURE } from '../data/rpg-nature.js';
import { rand, rint } from '../engine/random.js';
import { G } from '../save/state.js';
import { BUILD_KINDS, putItem, rotN, rotSwaps } from './building.js';
import { defineCmd } from './commands.js';
import { knows } from './cooking.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { recipeOn } from './farming.js';
import { addItem, countItem, isBroken, isRefund, removeItem, slotIs } from './inventory.js';
import { portalWhy } from './warp.js';
import { idx, inB, W } from '../world/map.js';
import { canPlace, fpFree, noDigZone, pushSpot } from '../world/tiles.js';
export const BM_REACH = 8, BM_MAX = 64, BM_CHEST_R = 16;
// ---- 분류 탭 ----
export const BM_CATS = [['wall', '벽'], ['floor', '바닥'], ['furn', '가구'], ['light', '조명'], ['stn', '제작대'], ['circ', '회로'], ['nat', '자연']];
export function bmCat(id) { const it = ITEMS[id], k = it.kind;
  if (k === 'wall') return 'wall'; if (k === 'floor' || k === 'ground') return 'floor'; if (k === 'wire') return 'circ'; if (k === 'seed') return 'nat';
  const d = OBJ[it.obj] || {}; if (d.tw) return 'wall'; if (d.dev || d.sw || d.src || d.gate || it.obj === 'battery' || it.obj === 'eLamp') return 'circ';
  if (d.station || d.chest || it.obj === 'chest' || d.warp) return 'stn'; if (d.light) return 'light'; if (d.nat || d.crop || d.tree || d.ranch || natDecor().has(id)) return 'nat'; return 'furn'; }
let NAT_D = null; // 자연 꾸미기(덤불·꽃밭·연못·바위): 자연 꾸미기 표와 제작 창 「자연」 탭의 것
const natDecor = () => NAT_D || (NAT_D = new Set([...Object.keys(NATURE), ...RECIPES.filter(r => r.cat === 'nature').map(r => r.out)]));
export const isBuildItem = id => { const it = ITEMS[id]; return !!it && BUILD_KINDS.includes(it.kind); };
// 끌어서 여러 칸: 바닥은 네모, 벽·울타리·전선은 끈 길 한 줄, 그 밖은 한 칸
export function bmDrag(id) { const it = ITEMS[id]; if (!it) return 'one'; if (it.kind === 'floor' || it.kind === 'ground') return 'rect';
  if (it.kind === 'wall' || it.kind === 'wire') return 'line'; const d = OBJ[it.obj]; return d && d.tw ? 'line' : 'one'; }
// ---- 가방 + 둘레 16칸 안 보관상자 ----
export function bmChests() { const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y), out = [];
  for (const [j, o] of G.objs) { if (!o || o.t !== 'chest' || !o.items || isRefund(o)) continue; const x = j % W, y = (j / W) | 0; if (Math.abs(x - px) > BM_CHEST_R || Math.abs(y - py) > BM_CHEST_R) continue; out.push({ o, d: Math.hypot(x - px, y - py) }); }
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
  return st.has(r.at); }
export function bmRecipe(id, st = bmStations()) { return RECIPES.find(r => r.out === id && recipeOn(r) && (!r.dish || knows(r.dish)) && stationReached(r, st)) || null; }
export const bmCanMake = (r, ch) => !!r && r.req.every(([m, c]) => bmCount(m, ch).all >= c);
// ---- 건축 목록: 가진 것 + 만들 수 있는 레시피 ----
export function bmList() { const ch = bmChests(), st = bmStations(), seen = new Set(), out = [];
  const add = id => { if (seen.has(id) || !isBuildItem(id)) return; seen.add(id); const c = bmCount(id, ch), r = c.all ? null : bmRecipe(id, st); if (!c.all && !r) return;
    out.push({ id, cat: bmCat(id), bag: c.bag, box: c.box, have: c.all, r, can: c.all > 0 || bmCanMake(r, ch) }); };
  for (const s of G.inv) if (s) add(s.id); for (const o of ch) for (const s of o.items) if (s) add(s.id);
  for (const r of RECIPES) add(r.out);
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
export function bmWhy(id, x, y, rot = 0, skip) { const it = ITEMS[id]; if (!it || !BUILD_KINDS.includes(it.kind)) return '놓을 수 없는 물건이에요';
  if (!inB(x, y)) return '여기엔 놓을 수 없어요'; if (!inBmReach(x, y)) return '8칸 안에만 놓을 수 있어요';
  const d = it.kind === 'place' ? OBJ[it.obj] : null;
  if (d && d.warp) { const w = portalWhy(x, y); if (w) return w; }
  if (it.kind === 'wall' && G.wall[idx(x, y)]) { if (wallSwapOk(x, y, it)) return null; const w = G.wall[idx(x, y)]; return w === it.wall ? '같은 벽이에요' : (WALLS[w] || {}).tier > pickTier() ? '더 좋은 곡괭이가 있어야 바꿀 수 있어요' : '이 벽은 바꿀 수 없어요'; }
  if (d && d.sz) { const fp = bmFp(id, rot), a = bmAnchor(id, x, y, rot); return fpFree(a.x, a.y, fp, !!d.solid, null, skip) ? null : '자리가 모자라요'; }
  return canPlace(x, y, it, skip) ? null : '여기엔 놓을 수 없어요'; }
// 벽을 바꿀 때 원래 벽은 캔 것과 같이 (가방으로, 넘치면 발밑에)
function wallBack(x, y) { const w = G.wall[idx(x, y)], def = WALLS[w]; if (!def) return;
  for (const [id, a, b, chance] of def.drop) if (rand() < chance) { const c = rint(a, b); if (c > 0) { const l = addItem(id, c, false); if (l) spawnDrop(id, l, x + .5, y + .5); } } }
const toBag = (id, t) => { const l = addItem(id, 1, false); if (l) spawnDrop(id, l, t.x + .5, t.y + .5); };
// ---- 놓기 명령 ----
defineCmd('bplace', c => {
  const p = G.p, it = ITEMS[c.id]; if (!p || p.dead > 0 || !it || !BUILD_KINDS.includes(it.kind) || !Array.isArray(c.cells)) return false;
  const rot = rotN(it.obj) > 1 ? (c.rot | 0) % rotN(it.obj) : 0, cells = c.cells.slice(0, BM_MAX), st = bmStations();
  let n = 0, made = 0, why = null, last = null;
  for (const cell of cells) { const x = cell[0] | 0, y = cell[1] | 0; let w = bmWhy(c.id, x, y, rot);
    // 한 칸만 놓을 때는 단축칸 놓기처럼 내 몸이 비켜서요 (v67)
    if (w && cells.length === 1 && !(OBJ[it.obj] || {}).sz && !bmWhy(c.id, x, y, rot, p)) { const sp = pushSpot(x, y, it); if (sp) { p.x = sp.x; p.y = sp.y; p.kx = p.ky = 0; if (p.dash) p.dash = null; w = null; } }
    if (w) { why = why || w; continue; }
    const ch = bmChests(); let s;
    if (bmCount(c.id, ch).all > 0) s = bmTake(c.id, 1, ch);
    else { const r = bmRecipe(c.id, st); if (!r || !bmCanMake(r, ch)) { why = r ? '재료가 모자라요' : '가진 것이 없어요'; break; }
      for (const [m, k] of r.req) bmTake(m, k, ch); s = { id: c.id, c: 1 }; made++;
      if (r.n > 1) { const l = addItem(c.id, r.n - 1, false); if (l) spawnDrop(c.id, l, p.x, p.y); }
      G.stats.made = G.stats.made || {}; G.stats.made[c.id] = (G.stats.made[c.id] || 0) + 1; }
    if (it.kind === 'wall' && G.wall[idx(x, y)]) { wallBack(x, y); G.wdmg.delete(idx(x, y)); }
    const t = putItem(it, s, { x, y }, { rot, anchor: OBJ[it.obj] && OBJ[it.obj].sz ? bmAnchor(c.id, x, y, rot) : null, give: toBag });
    emit('puff', t.x + .5, t.y + .9, '#e8d8c0', 3, 1.4, 0.1); n++; last = t; }
  emit('inv');
  if (n) { emit('sfx', 'place'); if (made) emit('toast', `재료로 ${made}개를 만들어 놓았어요`, 'good', 'bmake'); if (why && cells.length > 1) emit('toast', `${n}칸 놓았어요 · ${why}`, null, 'bplace'); }
  else { emit('toast', why || '여기엔 놓을 수 없어요', null, 'bplace'); return false; }
  return last;
});
