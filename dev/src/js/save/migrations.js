// ================= loading old saves: every fix that makes an older save work in this version =================
// deserialize() (save/state.js) calls these while it loads a save, always in the same order — keep that order when adding one.
// The save format itself never changes here (SAVE_KEY 'lantern-tree-save-v1', v: 3): new versions only add fields with defaults,
// so old saves load and new saves still open in older versions. Add a save to dev/qa/snapshot/saves/ for each new fix.
//
// order in deserialize(): migrateBagV2 · migrateV2 · migrateV3 · loadEquip · refundRoofItems · convertDrills · moveOldWeapon ·
// (v83: loadSets right after the pets) · noticeRename58 · refundRoofTiles · migrateGear61 · migrateForges60 (convertForges, growFootprints) · growFootprints · fixParts ·
// grantUniques · ensureDeepAltars · migrateRecipes · syncNotes · grantAccs
import { ACC_OF, EQ_SLOTS } from '../data/gear-animals.js';
import { BKEYS } from '../data/rpg-nature.js';
import { DISHES } from '../data/farming-cooking.js';
import { GUIDE } from '../data/quests.js';
import { G, ME, beat, started } from './state.js';
import { GEAR_IT } from '../data/automation-tiers.js';
import { HOT, ITEMS, OBJ, OLD_PIECES, UNIQ_OF } from '../data/items.js';
import { spawnDrop } from '../sim/drops.js';
import { BX, BY, CX, CY, H, LAVA, PIT, SA, SB, SI, SL, W, idx, inB } from '../world/map.js';
import { GROW122 } from '../data/decor122.js';
import { addPond, addSnow132, addWater, genWorld, placeSnow132 } from '../world/gen.js';
import { delObj, fpFree, fpOf, fpTiles, noDigZone, setParts } from '../world/tiles.js';
import { OLD_AUTO } from '../data/automation.js';
import { josa } from '../engine/util.js';
import { emit } from '../sim/events.js';
import { WATER } from '../sim/nature.js';
import { GREW } from '../sim/building.js';
import { bossNoteIds, learnRecipe, roomNotes } from '../sim/cooking.js';
import { eqCopy, freshEquip, freshSets } from '../sim/gear.js';
import { addItem, isTool, moveInto, returnObj, seenAll } from '../sim/inventory.js';
import { benchLv, syncStations } from '../sim/crafting.js';

// ---- save layout (inventory, equipment) ----
// saves from before the 6-slot hotbar (invV 1): 30 slots, three empty slots put in after the hotbar
export function migrateBagV2() { while (G.inv.length < 30) G.inv.push(null); G.inv.splice(6, 0, null, null, null); if (!(G.sel < 6)) G.sel = 0; }
// v83: 장비 세트 I·II·III — 지금 세트는 G.equip·G.petOn, 다른 세트는 G.eqSets에 (옛 세이브는 모두 세트 I)
export function loadSets(raw, cur) {
  const k0 = Number.isInteger(cur) && cur >= 0 && cur <= 2 ? cur : 0; G.eqSet = k0; G.eqSets = freshSets();
  if (!Array.isArray(raw)) return;
  raw.slice(0, 3).forEach((x, k) => { if (k === k0 || !x || typeof x !== 'object') return; const e = freshEquip();
    for (const [sl] of EQ_SLOTS) { const it = x.e && x.e[sl]; if (it && ITEMS[it.id] && ITEMS[it.id].kind === 'wear' && ITEMS[it.id].slot === sl) e[sl] = eqCopy(it); }
    G.eqSets[k] = { e: EQ_SLOTS.some(([sl]) => e[sl]) ? e : null, pet: x.pet && (G.pets || {})[x.pet] ? x.pet : null }; }); }
export function loadEquip(raw) {
  G.equip = freshEquip(); const se = raw && typeof raw === 'object' ? raw : {}; // v42: the old 'acc' slot moves to the slot that fits (turtle charm → neck, snow brooch → head)
  for (const sl of ['body', 'head', 'neck', 'ring', 'legs', 'acc']) { const e = se[sl]; if (e && ITEMS[e.id] && ITEMS[e.id].kind === 'wear' && !G.equip[ITEMS[e.id].slot]) G.equip[ITEMS[e.id].slot] = eqCopy(e); } // v83 버그 수정: 강화 단계(lv)도 그대로 (예전엔 불러오면 입은 장비의 강화가 사라졌어요)
  return se.weapon && ITEMS[se.weapon.id] && ITEMS[se.weapon.id].kind === 'sword' ? eqCopy(se.weapon) : null; // v48: no weapon slot any more
}
// ---- the world (map regions added in v2 / v3) ----
export function migrateV3() {
  const w = genWorld(G.seed); let n = 0;
  for (let i = 0; i < W * H; i++) { if (w.biome[i] < 3) continue; const o = G.objs.get(i); const mine = (o && !OBJ[o.t].nat && o.t !== 'bush') || G.wire.has(i) || G.under.has(i);
    G.biome[i] = w.biome[i]; if (G.explored[i] || mine) continue;
    G.wall[i] = w.wall[i]; G.floor[i] = w.floor[i]; const no = w.objs.get(i); if (no) G.objs.set(i, no); else G.objs.delete(i); n++; }
  return n;
}
export function migrateV2() {
  const isNatural = o => !o || !!OBJ[o.t].nat || o.t === 'bush';
  for (const [S, fl, b] of [[SA, 3, 1], [SB, 4, 2]]) for (let y = S.y - 9; y <= S.y + 9; y++) for (let x = S.x - 9; x <= S.x + 9; x++) {
    if (!inB(x, y)) continue; const d = Math.hypot(x + .5 - (S.x + .5), y + .5 - (S.y + .5)); if (d > 8.2) continue; const i = idx(x, y);
    if (G.wall[i] && G.wall[i] !== 8 && G.wall[i] !== 6 && G.wall[i] !== 7) { G.wall[i] = 0; G.floor[i] = d < 4.6 ? 6 : fl; G.biome[i] = b; }
    const o = G.objs.get(i); if (o && d > 4.2 && OBJ[o.t].solid && isNatural(o)) G.objs.delete(i);
  }
  const safe = (x, y) => Math.hypot(x - CX, y - CY) < 9.5 || Math.hypot(x - BX, y - BY) < 10.5 || Math.hypot(x - SA.x, y - SA.y) < 9.5 || Math.hypot(x - SB.x, y - SB.y) < 9.5;
  addWater(G, G.seed, safe, i => !G.explored[i] && !G.objs.get(i) && [1, 2, 3, 4].includes(G.floor[i]));
  addPond(G, i => [1, 2].includes(G.floor[i]) && isNatural(G.objs.get(i)) && !(G.objs.get(i) && G.objs.get(i).t === 'treeP'));
}
// ---- items that changed or went away ----
// v41: roofs were removed — old saves get their roof items and placed roofs back as material (4 roofs were made from 2 wood or stone)
export const OLD_ROOF = { roofWood: 'wood', roofStone: 'stone' };
export function refundRoofItems() { const back = { n: 0 };
  const fix = a => Array.isArray(a) ? a.map(s2 => { if (!s2 || !OLD_ROOF[s2.id]) return s2; back.n += s2.c || 1; return { id: OLD_ROOF[s2.id], c: Math.ceil((s2.c || 1) / 2) }; }) : a;
  G.inv = fix(G.inv); for (const o of G.objs.values()) if (o.items) o.items = fix(o.items); return back; }
export function refundRoofTiles(arr, back) { const cnt = { wood: 0, stone: 0 };
  if (Array.isArray(arr)) for (const e of arr) if (Array.isArray(e) && cnt[e[1]] != null) cnt[e[1]]++;
  for (const m in cnt) if (cnt[m]) { const n = Math.ceil(cnt[m] / 2), l = addItem(m, n, false); if (l) spawnDrop(m, l, G.p.x, G.p.y + .6); back.n += cnt[m]; }
  if (back.n) { G.stats.roofBack = (G.stats.roofBack || 0) + back.n; setTimeout(() => { try { emit('toast', '지붕이 없어져서, 가지고 있던 지붕을 나무·돌로 돌려받았어요', 'good', 'roofback'); } catch (e) { } }, 1200); } }
// v46 convertDrills (옛 채굴기 → 채굴장)는 v113에서 멈췄어요: 채굴기가 다시 생겼고 채굴장은 없어졌어요
// v48: the weapon from an old save's weapon slot goes into an empty hotbar slot (or the bag, or onto the ground)
export function unslotWeapon(w) { const to = G.inv.slice(0, HOT).findIndex(x => !x); if (to >= 0) { G.inv[to] = w; return '단축칸'; }
  if (!moveInto(G.inv, w)) return '가방'; spawnDrop(w.id, 1, G.p.x, G.p.y); const d = G.drops[G.drops.length - 1]; d.dur = w.dur; d.lv = w.lv; return '발밑'; }
// v48: no weapon slot any more — the old slot's weapon goes to the hotbar (or the bag, or the ground)
export function moveOldWeapon(oldWp) { const wn = ITEMS[oldWp.id].n, where = unslotWeapon(oldWp); setTimeout(() => { if (G && started) emit('toast', `이제 무기는 단축칸에서 골라 들면 써요 · 무기 칸에 있던 ${josa(wn, '을', '를')} ${where}에 넣어 두었어요`, 'good', 'eqmove'); }, 1600); }
// ---- workstations and furniture sizes ----
// v58 rename notice for older saves (화로 → 용광로, 용광로 → 장비제작대)
export function noticeRename58() { G.stats.nm58 = 1; const has = [...G.objs.values()].some(o => o.t === 'furnace' || o.t === 'smelter') || G.inv.some(x => x && (x.id === 'furnace' || x.id === 'smelter')); if (has) setTimeout(() => { if (G && started) emit('toast', '이름이 바뀌었어요: 화로 → 용광로, 용광로 → 장비제작대', 'good', 'nm58'); }, 2600); }
// v61: weapons moved to the 장비제작대 — older worlds keep making what they could
export function migrateGear61() { G.stats.nm61 = 1; let blv = 0, has = false; for (const o of G.objs.values()) { if (o.t === 'bench') blv = Math.max(blv, o.lv || 0); if (o.t === 'forge') blv = Math.max(blv, 1); }
    for (const o of G.objs.values()) if (o.t === 'smelter') { has = true; o.lv = Math.max(o.lv || 0, blv); } // v61: weapons moved to the 장비제작대 — older worlds keep making what they could
    if (!has && blv >= 1) { const id = GEAR_IT[blv], l = addItem(id, 1, false); if (l) spawnDrop(id, 1, G.p.x, G.p.y); setTimeout(() => { if (G && started) emit('toast', `무기·도구는 이제 장비제작대에서 만들어요 · ${ITEMS[id].n}를 가방에 넣어 드렸어요`, 'good', 'gear61'); }, 4200); } }
// v60: placed copper workbenches (forge) become tier-1 workbenches
export function migrateForges60(oldFp) { const nf = convertForges(); if (nf) { if (!oldFp) growFootprints(); setTimeout(() => { if (G && started) emit('toast', '구리 제작대는 이제 「구리 작업대」예요 · 작업대를 열어 맨 위에서 다음 단계로 올릴 수 있어요', 'good', 'forgeconv'); }, 3200); } }
export function convertForges() { let n = 0; for (const o of G.objs.values()) if (o.t === 'forge') { o.t = 'bench'; o.lv = 1; n++; } return n; }
// v56: in saves from before v50 the workbench and benches stood on one tile. Grow each one to its 2×1 size where it stands
// (into the tile on its right, or else on its left); if both are taken it goes back to the bag as an item.
export function growFootprints() {
  let back = 0;
  for (const [i, o] of [...G.objs]) { if (!GREW[o.t] || !OBJ[o.t].sz) continue;
    if (fpTiles(i, o).every(j => { if (j === i) return true; const q = G.objs.get(j); return q && q.t === '_part' && q.a === i; })) continue;
    const fp = fpOf(o), x = i % W, y = (i / W) | 0; G.objs.delete(i); let ok = false;
    for (const [ax, ay] of [[x, y], [x - fp[0] + 1, y]]) if (inB(ax, ay) && fpFree(ax, ay, fp, false, null)) { const ni = idx(ax, ay); G.objs.set(ni, o); setParts(ni, o); ok = true; break; }
    if (!ok) { returnObj(o, x + .5, y + .5); back++; } }
  if (back) setTimeout(() => { try { emit('toast', `작업대·벤치가 2칸으로 커졌어요. 옆자리가 막힌 ${back}개는 가방으로 돌려받았어요`, 'good', 'grewback'); } catch (e) { } }, 1400);
  return back;
}
// v122 (dev/design/그림에셋.md): 침대·2인 침대·둥근 탁자·긴 식탁이 새 그림에 맞춰 커졌어요(GROW122). 놓여 있는 것마다 새 크기가 들어갈
// 자리를 찾아요 — 원래 칸이 새 자리의 아래 줄(가운데부터)에 오는 자리부터, 벽·물건·물·용암·구덩이가 없는 곳. 자리가 없으면 걷어서 그 물건으로
// 돌려줘요(가방 먼저, 넘치면 등불나무 옆 환급 상자 — v69처럼). 그 침대에서 깨어나던 자리는 새 자리를 따라가요(걷었으면 없어져요).
// 한 번만 해요(G.stats.grow122 표시) — 이미 새 크기로 놓인 것도 건너뛰어요.
export function grow122() {
  if (G.stats.grow122) return null; let moved = 0, back = 0; const own = [];
  const free = (ax, ay, fp) => { if (!fpFree(ax, ay, fp, false, null)) return false; for (let dy = 0; dy < fp[1]; dy++) for (let dx = 0; dx < fp[0]; dx++) if (G.floor[idx(ax + dx, ay + dy)] === PIT) return false; return true; };
  for (const [i, o] of [...G.objs]) { if (!GROW122[o.t] || !G.objs.has(i)) continue;
    if (fpTiles(i, o).every(j => { if (j === i) return true; const q = G.objs.get(j); return q && q.t === '_part' && q.a === i; })) continue;
    const x = i % W, y = (i / W) | 0, fp = fpOf(o);
    for (let dy = -1; dy <= 4; dy++) for (let dx = -1; dx <= 4; dx++) { if (!inB(x + dx, y + dy)) continue; const j = idx(x + dx, y + dy), q = G.objs.get(j); if (q && q.t === '_part' && q.a === i) G.objs.delete(j); }
    G.objs.delete(i);
    const xs = [Math.floor((fp[0] - 1) / 2)]; for (let k = 0; k < fp[0]; k++) if (k !== xs[0]) xs.push(k);
    let at = -1; for (let oy = fp[1] - 1; oy >= 0 && at < 0; oy--) for (const ox of xs) { const ax = x - ox, ay = y - oy; if (inB(ax, ay) && free(ax, ay, fp)) { at = idx(ax, ay); break; } }
    const home = OBJ[o.t].bed && G.spawnPt && G.spawnPt.x === x && G.spawnPt.y === y;
    if (at >= 0) { G.objs.set(at, o); setParts(at, o); if (home) G.spawnPt = { x: at % W, y: (at / W) | 0 }; moved++; }
    else { if (home) G.spawnPt = null; own.push({ id: OBJ[o.t].item || o.t, c: 1 }); back++; } }
  if (!moved && !back) { G.stats.grow122 = { moved: 0, back: 0, boxes: 0 }; return null; }
  const over = []; for (const s of own) { const left = moveInto(G.inv, s); if (left) over.push({ id: s.id, c: left }); }
  let boxes = 0, rest = over;
  while (rest.length) { const at = freeTileNear(CX, CY + 7); if (at < 0) break; const items = Array(18).fill(null), next = [];
    for (const s of rest) { const left = moveInto(items, s); if (left) next.push({ id: s.id, c: left }); }
    G.objs.set(at, { t: 'refundBox', items, own: ME }); boxes++; rest = next; }
  G.stats.grow122 = { moved, back, boxes };
  setTimeout(() => { try { emit('toast', `새 그림에 맞춰 침대·탁자·긴 식탁이 커졌어요${back ? ` · 자리가 좁은 ${back}개는 ${boxes ? '가방·등불나무 옆 환급 상자' : '가방'}로 돌려받았어요` : ''}`, 'good', 'grow122'); } catch (e) { } }, 2400);
  return G.stats.grow122;
}
export function fixParts() {
  for (const [i, o] of [...G.objs]) { if (o.t !== '_part') continue; const a = G.objs.get(o.a); if (!a || a.t === '_part' || !OBJ[a.t] || !OBJ[a.t].sz || !fpTiles(o.a, a).includes(i)) G.objs.delete(i); }
  for (const [i, o] of [...G.objs]) { const d = OBJ[o.t]; if (!d || !d.sz) continue; for (const j of fpTiles(i, o)) { if (j !== i && !G.objs.get(j)) G.objs.set(j, { t: '_part', a: i }); } }
}
// ---- things the player already earned (run on every load, so later versions can add more) ----
// saves from before the deep regions: if the altar room was never built (the area had been explored), build it now, or hand over the seed if its boss is already gone
export function ensureDeepAltars() { let w = null; G.stats.deepSeed = G.stats.deepSeed || {};
  for (const [S, k] of [[SL, 'turtle'], [SI, 'spirit']]) { const o = G.objs.get(idx(S.x, S.y)); if (o && o.t === 'shrine') { if (G.bossDead[k] && !o.has) G.stats.deepSeed[k] = 1; continue; }
    if (G.bossDead[k]) { if (!G.stats.deepSeed[k]) { G.stats.deepSeed[k] = 1; const l = addItem('lightSeed', 1); if (l) spawnDrop('lightSeed', 1, G.p.x, G.p.y); } continue; }
    w = w || genWorld(G.seed);
    for (let y = S.y - 10; y <= S.y + 10; y++) for (let x = S.x - 10; x <= S.x + 10; x++) { if (!inB(x, y) || Math.hypot(x - S.x - .5, y - S.y - .5) > 9.6) continue; const j = idx(x, y), q = G.objs.get(j); if (q && q.t !== 'shrine' && OBJ[q.t] && !OBJ[q.t].nat && q.t !== 'bush') continue; G.wall[j] = w.wall[j]; G.floor[j] = w.floor[j]; G.biome[j] = w.biome[j]; const no = w.objs.get(j); if (no) G.objs.set(j, { ...no }); else G.objs.delete(j); } } }
export function grantUniques() {
  G.stats.uniq = G.stats.uniq || {};
  for (const k in UNIQ_OF) if (G.bossDead[k] && !G.stats.uniq[k]) { G.stats.uniq[k] = 1; const l = moveInto(G.inv, { id: UNIQ_OF[k], c: 1 }); if (l) spawnDrop(UNIQ_OF[k], 1, G.p.x, G.p.y); if (k === 'golem') { const l2 = addItem('golemCore', 1, false); if (l2) spawnDrop('golemCore', 1, G.p.x, G.p.y); } }
}
// saves from before cooking notes: hand over what the player has already earned (opened rooms, beaten bosses, claimed quests; early notes once past the mushroom queen)
export function migrateRecipes() {
  for (const r of G.rooms || []) if (r.open) for (const id of roomNotes(r)) learnRecipe(id, true);
  for (const k of BKEYS) if (beat(k)) for (const id of bossNoteIds(k)) learnRecipe(id, true);
  for (const d of DISHES) if (d[7].startsWith('quest:') && (G.qclaim || {})[d[7].slice(6)]) learnRecipe(d[0], true);
  if (beat('queen')) for (const d of DISHES) if (['mon', 'gather', 'fish'].includes(d[7])) learnRecipe(d[0], true);
}
// notes the save has already earned (opened rooms, beaten bosses, claimed quests) — run on every load so later versions can add notes to old places
export function syncNotes() {
  if (G.won2) learnRecipe('festCake', true);
  for (const r of G.rooms || []) if (r.open) for (const id of roomNotes(r)) learnRecipe(id, true);
  for (const k of BKEYS) if (beat(k)) for (const id of bossNoteIds(k)) learnRecipe(id, true);
  for (const d of DISHES) { const s = d[7]; if ((s.startsWith('quest:') || s.startsWith('guide:')) && (G.qclaim || {})[s.slice(6)]) learnRecipe(d[0], true); }
}
export function grantAccs() { G.stats.accGot = G.stats.accGot || {}; for (const k in ACC_OF) if (beat(k) && !G.stats.accGot[k]) { G.stats.accGot[k] = 1; const l = moveInto(G.inv, { id: ACC_OF[k], c: 1 }); if (l) spawnDrop(ACC_OF[k], 1, G.p.x, G.p.y); } }
// v65: tools move into their own pouch (the tool slot at the front of the hotbar holds one); a tool held stays in hand
export function migrateTools65() { G.stats.nm65 = 1; const held = G.sel >= 0 ? G.inv[G.sel] : null; let moved = 0;
  for (let i = 0; i < G.inv.length; i++) { const s = G.inv[i]; if (s && isTool(s.id)) { G.tools.push({ ...s, c: 1 }); if (s.c > 1) for (let k = 1; k < s.c; k++) G.tools.push({ id: s.id, c: 1 }); G.inv[i] = null; moved += s.c || 1; } }
  if (held && isTool(held.id)) { G.tsel = G.tools.findIndex(x => x.id === held.id && x.dur === held.dur); if (G.tsel < 0) G.tsel = 0; G.sel = -1; G.tHand = true; } // the tool that was in hand stays in hand
  if (!G.lastW && held && ITEMS[held.id] && ITEMS[held.id].kind === 'sword') G.lastW = held.id; // otherwise the strongest weapon is used
  setTimeout(() => { if (G && started) emit('toast', '조작이 바뀌었어요 · 칼 버튼은 공격, 손 버튼은 열기·캐기·놓기예요' + (moved ? ` · 도구 ${moved}개는 도구 주머니로 옮겼어요 (단축칸 맨 앞 도구 칸)` : ''), 'good', 'nm65'); }, 1600); }
// v69 (BF-05): thin walls, half walls, pillars, window walls and window frames were removed. Every one still in the save — placed in the
// world, in the bag or hotbar, in a chest, in a lost bundle — turns back into what it cost to make (OLD_PIECES, summed per material and
// rounded up). Pieces inside a chest or a bundle come back into that same chest or bundle. The rest (placed ones and the bag's) go into
// the bag first; what does not fit goes into a refund box (saved, opens like a chest, only for its owner) next to the lantern tree —
// never onto the ground, which is not saved. Saves before multiplayer have one player, so the bag and the placed pieces are theirs (ME).
// Nothing is left afterwards, so loading the same save again hands nothing back twice.
export function refundPieces() {
  const add = (m, k, v) => { m[k] = (m[k] || 0) + v; }, own = {}, total = {}; let n = 0, placed = 0;
  const take = (s, into) => { if (!s || !OLD_PIECES[s.id]) return false; const [m, v] = OLD_PIECES[s.id], c = s.c || 1; add(into, m, v * c); n += c; return true; };
  for (const o of G.objs.values()) if (Array.isArray(o.items)) { const back = {}; let hit = false;
    o.items = o.items.map(s => take(s, back) ? (hit = true, null) : s);
    if (hit) for (const m in back) { const c = Math.ceil(back[m]); add(total, m, c); const left = moveInto(o.items, { id: m, c }); if (left) add(own, m, left); } }
  G.inv = G.inv.map(s => take(s, own) ? null : s);
  for (const [i, o] of [...G.objs]) if (OLD_PIECES[o.t]) { const [m, v] = OLD_PIECES[o.t]; add(own, m, v); G.objs.delete(i); placed++; n++; }
  if (!n) return null;
  let over = []; for (const m in own) { const c = Math.ceil(own[m]); add(total, m, c); const left = moveInto(G.inv, { id: m, c }); if (left) over.push({ id: m, c: left }); }
  let boxes = 0;
  while (over.length) { const at = freeTileNear(CX, CY + 7); if (at < 0) break; const items = Array(18).fill(null), next = [];
    for (const s of over) { const left = moveInto(items, s); if (left) next.push({ id: s.id, c: left }); }
    G.objs.set(at, { t: 'refundBox', items, own: ME }); boxes++; over = next; }
  G.stats.bf05 = { n: (G.stats.bf05 ? G.stats.bf05.n : 0) + n, placed, back: total, boxes };
  const mats = Object.entries(total).map(([m, c]) => `${ITEMS[m].n} ${c}`).join(' · ');
  setTimeout(() => { try { emit('toast', `반벽·기둥·얇은 벽·창문이 없어져서, 가지고 있던 ${n}개를 재료(${mats})로 돌려받았어요${boxes ? ' · 가방에 다 안 들어간 건 등불나무 옆 환급 상자에 있어요' : ''}${placed ? ' · 세워 둔 벽이 없어진 곳은 다시 쌓아 주세요' : ''}`, 'good', 'bf05'); } catch (e) { } }, 1600);
  return G.stats.bf05;
}
// v113 (자동 생산 1, dev/design/자동생산.md 1장): 돌·구리·철·황금 채굴장과 나무 작업장이 없어졌어요. 세이브에 남은 것 — 놓인 것(안에 모인 광석·나무도),
// 가방·상자·꾸러미 속 아이템 — 은 만들 때 든 재료(OLD_AUTO)로 돌려줘요. 방법은 v69 refundPieces와 같아요: 상자·꾸러미 속 것은 그 안으로,
// 나머지는 가방 먼저, 넘치면 등불나무 옆 환급 상자(주인만, 꺼내기만). 남는 것이 없어서 같은 세이브를 다시 불러도 두 번 주지 않아요.
// 놓여 있는 옛 돌 채굴기(drillStone)는 그대로 일해요 (회수할 때 sim/gathering.js·sim/buildmode.js가 재료로 줘요).
export function refundAuto113() {
  const add = (m, k, v) => { m[k] = (m[k] || 0) + v; }, own = {}, total = {}; let n = 0, placed = 0;
  const take = (s, into) => { if (!s || !OLD_AUTO[s.id] || s.id === 'drillStone') return false; const c = s.c || 1; for (const [m, v] of OLD_AUTO[s.id]) add(into, m, v * c); n += c; return true; };
  for (const o of G.objs.values()) if (Array.isArray(o.items)) { const back = {}; let hit = false;
    o.items = o.items.map(s => take(s, back) ? (hit = true, null) : s);
    if (hit) for (const m in back) { add(total, m, back[m]); const left = moveInto(o.items, { id: m, c: back[m] }); if (left) add(own, m, left); } }
  G.inv = G.inv.map(s => take(s, own) ? null : s);
  for (const [i, o] of [...G.objs]) if (OLD_AUTO[o.t] && o.t !== 'drillStone') { for (const [m, v] of OLD_AUTO[o.t]) add(own, m, v);
    for (const s2 of o.store || []) if (s2 && ITEMS[s2.id] && s2.c > 0) add(own, s2.id, s2.c);
    delObj(i); placed++; n++; }
  if (!n) return null;
  const over = []; for (const m in own) { add(total, m, own[m]); const left = moveInto(G.inv, { id: m, c: own[m] }); if (left) over.push({ id: m, c: left }); }
  let boxes = 0, rest = over;
  while (rest.length) { const at = freeTileNear(CX, CY + 7); if (at < 0) break; const items = Array(18).fill(null), next = [];
    for (const s of rest) { const left = moveInto(items, s); if (left) next.push({ id: s.id, c: left }); }
    G.objs.set(at, { t: 'refundBox', items, own: ME }); boxes++; rest = next; }
  G.stats.auto113 = { n: (G.stats.auto113 ? G.stats.auto113.n : 0) + n, placed, back: total, boxes };
  setTimeout(() => { try { emit('toast', `채굴장·나무 작업장이 없어져서, 가지고 있던 ${n}개를 재료로 돌려받았어요${boxes ? ' · 가방에 다 안 들어간 건 등불나무 옆 환급 상자에 있어요' : ''} · 이제 광석은 채굴기, 나무는 비버 둥지로 모아요`, 'good', 'auto113'); } catch (e) { } }, 2000);
  return G.stats.auto113;
}
// the free tile nearest to (x, y) — no wall, no object, not water or lava, not on the lantern tree or the starter deck
function freeTileNear(x0, y0) {
  for (let r = 0; r <= 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const x = x0 + dx, y = y0 + dy;
    if (!inB(x, y) || Math.hypot(x - CX, y - CY) < 3.5 || (y >= CY + 1 && y <= CY + 5 && Math.abs(x - CX) <= 5)) continue;
    const i = idx(x, y); if (G.wall[i] || G.objs.get(i) || G.floor[i] === WATER || G.floor[i] === LAVA) continue; return i; }
  return -1;
}
// v77: 세이브에 「본 적 있는 물건」이 없으면 지금 가진 것(가방·도구·장비·상자)을 모두 본 것으로 — 빨간 점이 한꺼번에 뜨지 않게
export function migrateSeen77() { seenAll(true); }
// v93: 「한 삽」 없애기 — 흙 한 삽은 흙, 얼음 한 삽은 얼음 덩이로 (같은 개수). 모르는 물건을 지우기 전에 불러요
export const SHOVELFUL93 = { gDirt: 'dirt', gIce: 'iceBlock' };
export function mergeShovelful93() { const fix = s => { if (s && SHOVELFUL93[s.id]) s.id = SHOVELFUL93[s.id]; };
  (G.inv || []).forEach(fix); (G.__extra || []).forEach(fix);
  for (const o of G.objs.values()) { if (Array.isArray(o.items)) o.items.forEach(fix); if (Array.isArray(o.store)) o.store.forEach(fix);
    if (o.job && Array.isArray(o.job.used)) o.job.used = o.job.used.map(([id, c]) => [SHOVELFUL93[id] || id, c]); } }
// v110 시작 길잡이 나루: 옛 세이브는 첫 장면 없이 「나루에게 말 걸기」를 끝낸 것으로 (보상도 받은 것으로). 나루를 고치에서 마을로 옮기는 건 sim/npc.js settleStarters
// v119 나루 2부: 옛 세이브에서 이미 지난 새 이야기 퀘스트(「나루에게 가기」·「나루에게 돌아가기」)는 장면 없이 받은 것으로 (마지막 장을 읽었으면 · 큰 어둠을 물리쳤으면)
export function migrateNaru119() { if (G.stats.naru119) return; G.stats.naru119 = 1; const read = !!(G.stats.deep && G.stats.deep.read), dark = !!(G.bossDead && G.bossDead.dark); if (!read && !dark) return; G.qclaim = G.qclaim || {}; const qx = G.stats.qxp = G.stats.qxp || {};
  { G.stats.n2go = 1; G.qclaim.naruGo = 1; qx.naruGo = 1; } if (dark) { G.stats.n2back = 1; G.qclaim.naruBack = 1; qx.naruBack = 1; } }
// v124 새 이야기 퀘스트 「장비제작대 만들고 놓기」: 옛 세이브에 놓인 장비제작대가 있으면 놓은 것으로 셈, 구리 작업대 퀘스트를 이미 지났고 이 퀘스트도 다 됐으면 받은 것으로 (장면·방울·보상 없이)
// v128: 작업대·장비제작대가 한 등급 — 불러올 때마다 놓인 것·기록 중 가장 높은 단계로 맞춰요(재료 없이).
// 처음 한 번은, 예전에 장비제작대를 올린 적이 있으면(gearLv ≥ 1) 「장비제작대 놓기」를 한 것으로 (이제 등급만으로는 그 퀘스트가 안 끝나요)
export function syncTiers128() { if (!G.stats.tier128) { G.stats.tier128 = 1; if ((G.stats.gearLv || 0) >= 1) G.stats.gbench = 1; }
  let m = 0; for (const o of G.objs.values()) m = Math.max(m, benchLv(o)); syncStations(m); }
export function migrateGbench124() { if (G.stats.gb124) return; G.stats.gb124 = 1; for (const o of G.objs.values()) if (o && o.t === 'smelter') { G.stats.gbench = 1; break; }
  const f = GUIDE.find(q => q.id === 'forge'), g = GUIDE.find(q => q.id === 'gbench'); if (!f || !g || !f.done() || !g.done()) return; G.qclaim = G.qclaim || {}; const qx = G.stats.qxp = G.stats.qxp || {}; G.qclaim.gbench = 1; qx.gbench = 1; }
export function migrateNaru110() { if (G.stats.naru110) return; G.stats.naru110 = 1; G.stats.naruMet = 1; G.qclaim = G.qclaim || {}; G.qclaim.naru = 1; }
// v130: 이미 큰 어둠을 물리친 옛 세이브는 첫 처치 보상(새벽돌 6 + 큰 어둠의 무기 하나)을 나루에게서 한 번 받아요 (sim/npc.js talkTo → sim/bosses.js darkOweGive). 처음 한 번만 확인(stats.dark130)
export function migrateDark130() { const S = G.stats; if (S.dark130) return; S.dark130 = 1; if ((S.beaten || {}).dark && !(S.uniq || {}).dark) S.darkOwe = 1; }

// v132: 옛 세계에도 불러올 때 한 번 — 얼음 동굴 얼음 바닥에 눈 무더기(35)를 깔고 그 위에 겨울 자연물·얼음 결정 A~C, 용암 동굴 재 바닥에 해골·뼈
// (data/winter132.js · world/gen.js). 자연 바닥에만: 깐 바닥(G.under)·쌓은 벽 곁·지은 물건(자연물이 아닌 것) 둘레 3칸·등불나무와 보스방 곁은 빼요.
// 이미 있는 얼음 결정·나무는 그대로(얼음 결정은 새 그림으로 보여요).
export function snow132() { if (G.stats.snow132) return; const built = new Uint8Array(W * H);
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!o || o.t === '_part' || !d || d.nat) continue; const x = i % W, y = (i / W) | 0;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (inB(x + dx, y + dy)) built[idx(x + dx, y + dy)] = 1; }
  for (const i of G.bwall || []) built[i] = 1;
  const ok = i => !built[i] && !G.under.has(i), safe = (x, y) => !!noDigZone(x, y), w = { wall: G.wall, floor: G.floor, biome: G.biome, objs: G.objs };
  const snow = addSnow132(w, G.seed, safe, ok), objs = placeSnow132(w, G.seed, safe, ok);
  G.stats.snow132 = { snow, objs }; }
