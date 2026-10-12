// ================= loading old saves: every fix that makes an older save work in this version =================
// deserialize() (save/state.js) calls these while it loads a save, always in the same order — keep that order when adding one.
// The save format itself never changes here (SAVE_KEY 'lantern-tree-save-v1', v: 3): new versions only add fields with defaults,
// so old saves load and new saves still open in older versions. Add a save to dev/qa/snapshot/saves/ for each new fix.
//
// order in deserialize(): migrateBagV2 · migrateV2 · migrateV3 · loadEquip · refundRoofItems · convertDrills · moveOldWeapon ·
// noticeRename58 · refundRoofTiles · migrateGear61 · migrateForges60 (convertForges, growFootprints) · growFootprints · fixParts ·
// grantUniques · ensureDeepAltars · migrateRecipes · syncNotes · grantAccs
import { ACC_OF } from '../data/gear-animals.js';
import { BKEYS } from '../data/rpg-nature.js';
import { DISHES } from '../data/farming-cooking.js';
import { G, beat, started } from './state.js';
import { GEAR_IT } from '../data/automation-tiers.js';
import { HOT, ITEMS, OBJ, UNIQ_OF } from '../data/items.js';
import { spawnDrop } from '../sim/drops.js';
import { toast } from '../engine/effects.js';
import { BX, BY, CX, CY, H, SA, SB, SI, SL, W, idx, inB } from '../world/map.js';
import { addPond, addWater, genWorld } from '../world/gen.js';
import { fpFree, fpOf, fpTiles, setParts } from '../world/tiles.js';
import { josa } from '../engine/util.js';

// ---- save layout (inventory, equipment) ----
// saves from before the 6-slot hotbar (invV 1): 30 slots, three empty slots put in after the hotbar
export function migrateBagV2() { while (G.inv.length < 30) G.inv.push(null); G.inv.splice(6, 0, null, null, null); if (!(G.sel < 6)) G.sel = 0; }
export function loadEquip(raw) {
  G.equip = freshEquip(); const se = raw && typeof raw === 'object' ? raw : {}; // v42: the old 'acc' slot moves to the slot that fits (turtle charm → neck, snow brooch → head)
  for (const sl of ['body', 'head', 'neck', 'ring', 'acc']) { const e = se[sl]; if (e && ITEMS[e.id] && ITEMS[e.id].kind === 'wear' && !G.equip[ITEMS[e.id].slot]) G.equip[ITEMS[e.id].slot] = { id: e.id, c: 1 }; }
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
  const natural = o => !o || !!OBJ[o.t].nat || o.t === 'bush';
  for (const [S, fl, b] of [[SA, 3, 1], [SB, 4, 2]]) for (let y = S.y - 9; y <= S.y + 9; y++) for (let x = S.x - 9; x <= S.x + 9; x++) {
    if (!inB(x, y)) continue; const d = Math.hypot(x + .5 - (S.x + .5), y + .5 - (S.y + .5)); if (d > 8.2) continue; const i = idx(x, y);
    if (G.wall[i] && G.wall[i] !== 8 && G.wall[i] !== 6 && G.wall[i] !== 7) { G.wall[i] = 0; G.floor[i] = d < 4.6 ? 6 : fl; G.biome[i] = b; }
    const o = G.objs.get(i); if (o && d > 4.2 && OBJ[o.t].solid && natural(o)) G.objs.delete(i);
  }
  const safe = (x, y) => Math.hypot(x - CX, y - CY) < 9.5 || Math.hypot(x - BX, y - BY) < 10.5 || Math.hypot(x - SA.x, y - SA.y) < 9.5 || Math.hypot(x - SB.x, y - SB.y) < 9.5;
  addWater(G, G.seed, safe, i => !G.explored[i] && !G.objs.get(i) && [1, 2, 3, 4].includes(G.floor[i]));
  addPond(G, i => [1, 2].includes(G.floor[i]) && natural(G.objs.get(i)) && !(G.objs.get(i) && G.objs.get(i).t === 'treeP'));
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
  if (back.n) { G.stats.roofBack = (G.stats.roofBack || 0) + back.n; setTimeout(() => { try { toast('지붕이 없어져서, 가지고 있던 지붕을 나무·돌로 돌려받았어요', 'good', 'roofback'); } catch (e) { } }, 1200); } }
// v46: old stone drills become stone pits
export function convertDrills() { const DRILL_TO = { drillStone: 'quarry', drillCu: 'pitCu', drillFe: 'pitFe', drillGold: 'pitGold' }, conv = x => { if (x && DRILL_TO[x.id]) x.id = DRILL_TO[x.id]; }; G.inv.forEach(conv); for (const o of G.objs.values()) if (o.items) o.items.forEach(conv); }
// v48: the weapon from an old save's weapon slot goes into an empty hotbar slot (or the bag, or onto the ground)
export function unslotWeapon(w) { const to = G.inv.slice(0, HOT).findIndex(x => !x); if (to >= 0) { G.inv[to] = w; return '단축칸'; }
  if (!moveInto(G.inv, w)) return '가방'; spawnDrop(w.id, 1, G.p.x, G.p.y); const d = G.drops[G.drops.length - 1]; d.dur = w.dur; d.lv = w.lv; return '발밑'; }
// v48: no weapon slot any more — the old slot's weapon goes to the hotbar (or the bag, or the ground)
export function moveOldWeapon(oldWp) { const wn = ITEMS[oldWp.id].n, where = unslotWeapon(oldWp); setTimeout(() => { if (G && started) toast(`이제 무기는 단축칸에서 골라 들면 써요 · 무기 칸에 있던 ${josa(wn, '을', '를')} ${where}에 넣어 두었어요`, 'good', 'eqmove'); }, 1600); }
// ---- workstations and furniture sizes ----
// v58 rename notice for older saves (화로 → 용광로, 용광로 → 장비제작대)
export function noticeRename58() { G.stats.nm58 = 1; const has = [...G.objs.values()].some(o => o.t === 'furnace' || o.t === 'smelter') || G.inv.some(x => x && (x.id === 'furnace' || x.id === 'smelter')); if (has) setTimeout(() => { if (G && started) toast('이름이 바뀌었어요: 화로 → 용광로, 용광로 → 장비제작대', 'good', 'nm58'); }, 2600); }
// v61: weapons moved to the 장비제작대 — older worlds keep making what they could
export function migrateGear61() { G.stats.nm61 = 1; let blv = 0, has = false; for (const o of G.objs.values()) { if (o.t === 'bench') blv = Math.max(blv, o.lv || 0); if (o.t === 'forge') blv = Math.max(blv, 1); }
    for (const o of G.objs.values()) if (o.t === 'smelter') { has = true; o.lv = Math.max(o.lv || 0, blv); } // v61: weapons moved to the 장비제작대 — older worlds keep making what they could
    if (!has && blv >= 1) { const id = GEAR_IT[blv], l = addItem(id, 1, false); if (l) spawnDrop(id, 1, G.p.x, G.p.y); setTimeout(() => { if (G && started) toast(`무기·도구는 이제 장비제작대에서 만들어요 · ${ITEMS[id].n}를 가방에 넣어 드렸어요`, 'good', 'gear61'); }, 4200); } }
// v60: placed copper workbenches (forge) become tier-1 workbenches
export function migrateForges60(oldFp) { const nf = convertForges(); if (nf) { if (!oldFp) growFootprints(); setTimeout(() => { if (G && started) toast('구리 제작대는 이제 「구리 작업대」예요 · 작업대를 열어 맨 위에서 다음 단계로 올릴 수 있어요', 'good', 'forgeconv'); }, 3200); } }
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
  if (back) setTimeout(() => { try { toast(`작업대·벤치가 2칸으로 커졌어요. 옆자리가 막힌 ${back}개는 가방으로 돌려받았어요`, 'good', 'grewback'); } catch (e) { } }, 1400);
  return back;
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
  setTimeout(() => { if (G && started) toast('조작이 바뀌었어요 · 칼 버튼은 공격, 손 버튼은 열기·캐기·놓기예요' + (moved ? ` · 도구 ${moved}개는 도구 주머니로 옮겼어요 (단축칸 맨 앞 도구 칸)` : ''), 'good', 'nm65'); }, 1600); }
