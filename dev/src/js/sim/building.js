// ================= 건축: 얇은 벽·문·자동문 잇기, 가구 돌리기·발자리 크기, 놓기·줍기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { SPR } from '../art/world.js';
import { BATT_MAX } from '../data/circuits-regions.js';
import { FEED_SLOTS } from '../data/beaver.js';
import { BMAT, BMAT_X, BTYPE, ITEMS, OBJ, TW_H } from '../data/items.js';
import { FLOOR_ITEM, GROW_TIME } from '../data/rpg-nature.js';
import { clamp, josa } from '../engine/util.js';
import { ICONURL } from '../render/icons.js';
import { G, paused, started } from '../save/state.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { addItem, refillHot, returnObj, selItem } from './inventory.js';
import { WATER } from './nature.js';
import { idx, inB, LAVA, PIT } from '../world/map.js';
import { canPlace, delObj, floorItem, fpOf, isPlacedFloor, placeAnchor, pushSpot, setParts } from '../world/tiles.js';
import { flowNear } from './digging.js';
import { markLight } from './loop.js';
import { meId } from './survival.js';
import { portalWhy, warpsChanged } from './warp.js';
export const bmat = m => BMAT[m] || BMAT_X[m];
export const twH = type => (BTYPE[type] || {}).h || TW_H[type];
export const twType = o => o && OBJ[o.t] && OBJ[o.t].tw ? OBJ[o.t].tw.type : null;
// wall-like pieces split the floor of their own tile along the wall line
export const TW_WALL = { thin: 1, half: 1, win: 1, frame: 1, door: 1, slide: 1 };
export const wallPiece = i => { const o = G.objs.get(i); return !!(o && TW_WALL[twType(o)]); };
export function twLinks(type, x, y) {
  if (!inB(x, y)) return false; const i = idx(x, y);
  if (G.wall[i]) return type !== 'fence';
  const o = G.objs.get(i), t = twType(o); if (!t) return false;
  if (type === 'fence') return t === 'fence' || t === 'pillar' || t === 'door';
  return t !== 'fence' || type === 'door' || type === 'pillar';
}
export const TW_JOIN = { door: 1, win: 1, slide: 1 }; // the same kind side by side draws as one wide piece (double door, long window)
export const twSame = (type, x, y) => inB(x, y) && twType(G.objs.get(idx(x, y))) === type;
export function twMask(x, y, type) { if (type === 'pillar') return 0;
  let m = (twLinks(type, x, y - 1) ? 1 : 0) | (twLinks(type, x + 1, y) ? 2 : 0) | (twLinks(type, x, y + 1) ? 4 : 0) | (twLinks(type, x - 1, y) ? 8 : 0);
  if (TW_JOIN[type]) m |= (twSame(type, x - 1, y) ? 16 : 0) | (twSame(type, x + 1, y) ? 32 : 0);
  return m; }
// doors that open together: the same kind joined left and right in one row
export function doorGroup(x, y) { const o = G.objs.get(idx(x, y)), t = twType(o), out = [[idx(x, y), o]]; if (!t || !TW_JOIN[t]) return out;
  for (const s of [-1, 1]) for (let k = 1; k <= 4; k++) { const xx = x + s * k; if (!twSame(t, xx, y)) break; const j = idx(xx, y); out.push([j, G.objs.get(j)]); }
  return out; }
// a sliding door's panel glides open and shut (kept outside the save)
export const SLIDE = new WeakMap(), SLIDE_PW = new WeakMap(), SLIDE_NEAR = 2;
export function slideStep(o, t) { const tg = o.open ? 1 : 0; let s = SLIDE.get(o); if (!s) SLIDE.set(o, s = { v: tg, t }); const dt = clamp(t - s.t, 0, .1); s.t = t; s.v += clamp(tg - s.v, -dt * 5, dt * 5); return Math.round(s.v * 4) / 4; }
export let placeRot = 0, placeRotFor = null;
export const pRot = () => { const s0 = G && selItem(); return s0 && s0.id === placeRotFor ? placeRot : 0; };
export const DIRN = ['아래', '오른쪽', '위', '왼쪽'];
// v65 (stardew-like): each piece turns 1, 2 or 4 ways, chosen before placing (to turn a placed one, pick it up and place it again).
// Seats face 4 ways (the sitter faces the same way); other furniture 2 (front / turned 90°); front-only and round things do not turn.
// A turned piece uses its own drawing when there is one (obj/<id>S.png side, obj/<id>U.png back), otherwise the drawing turned 90°.
export const ROT4 = new Set(['chair', 'cryChair', 'mossSofa', 'ironChair', 'shroomStool', 'stumpStool', 'sofa2', 'logBench', 'stoneBench', 'cushion']);
export const NOROT = new Set(['pictureFrame', 'vase', 'table', 'rugRound', 'cryMirror', 'cryFountain', 'fountainBig', 'fishTank', 'bootPlanter', 'torch']);
export function rotN(t) { const d = OBJ[t]; if (!d || !d.item || d.tw || d.dev || d.src || d.sw || d.chest || d.nest || d.feeder || d.ranch || d.nat || d.crop || d.tree || d.lost || NOROT.has(t)) return 1; return ROT4.has(t) || d.dir4 ? 4 : 2; }
export const canRotObj = t => rotN(t) > 1;
export const rotSwaps = d => !!(d && d.sz && d.sz[0] !== d.sz[1]);
export const placeFp = d => d.sz ? (pRot() % 2 && rotSwaps(d) ? [d.sz[1], d.sz[0]] : d.sz) : [1, 1];
export const rotOf = o => typeof o.dir === 'number' ? o.dir : o.rot ? 1 : 0;
export function rotatePlace() { const s = selItem(), it = s && ITEMS[s.id]; if (!it || it.kind !== 'place' || rotN(it.obj) < 2) return; const n = rotN(it.obj);
  if (placeRotFor !== s.id) { placeRotFor = s.id; placeRot = 0; } placeRot = (placeRot + 1) % n;
  emit('toast', n === 4 ? `${josa(DIRN[placeRot], '을', '를')} 보게 놓아요` : placeRot ? '옆으로 돌려 놓아요' : '정면으로 놓아요', null, 'prot'); emit('sfx', 'click'); }
export function rotateAction() { if (!started || paused || !G || G.p.dead > 0) return; rotatePlace(); }
export const BUILD_KINDS = ['place', 'wall', 'floor', 'ground', 'seed', 'wire'];
// v93: 흙·얼음 덩이는 벽 재료이자 바닥 재료 (ITEMS의 ground) — 바닥으로 쓸 때는 이 「바닥 재료」 모습으로 놓아요
const GR = {};
export const groundOf = it => it && it.kind === 'wall' && it.ground ? (GR[it.ground] || (GR[it.ground] = { n: it.n, kind: 'ground', ground: it.ground, of: it })) : null;
export const groundFill = f => f === PIT || f === WATER || f === LAVA; // 메우기 (바꾸기가 아니라)
export const placeLbl = it => it.kind === 'wire' ? '빛뿌리 깔기' : it.kind === 'seed' ? '심기' : it.kind === 'wall' ? '쌓기' : it.kind === 'floor' ? '깔기' : it.kind === 'ground' ? (it.ground === WATER ? '붓기' : '덮기') : '놓기';
export function pickupObj(t, o) {
  const d = OBJ[o.t]; if (!d.item || (d.chest && o.items && o.items.some(x => x))) return;
  delObj(idx(t.x, t.y)); if (d.bed && G.spawnPt && G.spawnPt.x === t.x && G.spawnPt.y === t.y) G.spawnPt = null;
  returnObj(o, t.x + .5, t.y + .5); emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .6, '#e8d8c0', 5, 2); markLight();
}
export const isGround = o => { const d = OBJ[o.t]; return !d.solid && !!(d.nat || d.crop); };
// v91: 놓기의 세계 바꾸기 부분 (단축칸 놓기 placeItem과 건축 모드 bplace가 함께 써요) — s = 놓는 물건 칸(배터리 남은 양), op.rot 방향, op.anchor 여러 칸 가구 자리, op.give 걷어 낸 깐 바닥 받기
const dropAt = (id, t) => spawnDrop(id, 1, t.x + .5, t.y + .5);
export function putItem(it, s, t, op = {}) { const i = idx(t.x, t.y), give = op.give || dropAt;
  if (it.kind === 'wall') { G.wall[i] = it.wall; G.wdmg.delete(i); (G.bwall || (G.bwall = new Set())).add(i); /* v92: 직접 쌓은 벽 */ if (G.floor[i] === WATER) G.floor[i] = 2; if (G.floor[i] === LAVA) G.floor[i] = 18; if (G.under.get(i) === WATER) G.under.set(i, 2); }
  else if (it.kind === 'floor') { const old = G.floor[i]; G.floor[i] = it.floor; if (isPlacedFloor(old)) give(FLOOR_ITEM[old], t); else G.under.set(i, old); }
  else if (it.kind === 'ground') { const old = G.floor[i], back = old === PIT || old === WATER || old === LAVA ? null : floorItem(old); G.floor[i] = it.ground; G.under.delete(i); // v87: 바꾼 자연 바닥은 돌려받아요
    if (back) { const l = addItem(back, 1, false); if (l) spawnDrop(back, 1, t.x + .5, t.y + .5); } if (it.ground === WATER || it.ground === LAVA) flowNear(t.x, t.y); }
  else if (it.kind === 'wire') G.wire.set(i, 1);
  else if (it.kind === 'seed') G.objs.set(i, OBJ[it.crop].growTo ? { t: it.crop, at: G.time + GROW_TIME } : { t: it.crop, p: G.time, p0: G.time });
  else { const o = { t: it.obj }; if (it.blv) o.lv = it.blv; if (it.obj === 'bush') o.r = G.time + 150; if (OBJ[it.obj].ranch) o.p = G.time + OBJ[it.obj].every; if (it.obj === 'battery') o.e = s.dur != null ? s.dur : BATT_MAX; if (it.obj === 'eLamp') o.off = true; if (OBJ[it.obj].dev === 'drill') { const f = G.p.face; o.dir = Math.abs(f.x) > Math.abs(f.y) ? { x: Math.sign(f.x), y: 0 } : { x: 0, y: f.y < 0 ? -1 : 1 }; } if (it.obj === 'chest') o.items = Array(18).fill(null); if (it.obj === 'feeder') o.feed = Array(FEED_SLOTS).fill(null); /* v114 */ if (OBJ[it.obj].warp) { o.own = meId(); o.at = G.time; } /* v89 포탈: 놓은 사람·차례 */ if (OBJ[it.obj].dev === 'farm') o.p = G.time; const dd = OBJ[it.obj];
    const pr = op.rot != null ? op.rot : pRot(), rn = rotN(it.obj); if (rn > 1 && pr % rn) { o.dir = pr % rn; if (rotSwaps(dd) && o.dir % 2) o.rot = 1; } // v65: 2 or 4 directions, chosen before placing
    if (dd.sz) { const a = op.anchor || placeAnchor(t, fpOf(o)); t = { x: a.x, y: a.y }; G.objs.set(idx(a.x, a.y), o); setParts(idx(a.x, a.y), o); }
    else G.objs.set(i, o);
    if (it.obj === 'bench') G.stats.bench = 1; if (it.obj === 'smelter') G.stats.gbench = 1; /* v124 퀘스트 「장비제작대 만들고 놓기」 */ if (it.blv && it.obj === 'bench') { G.stats.forge = 1; G.stats.benchLv = Math.max(G.stats.benchLv || 0, it.blv); } if (it.blv && it.obj === 'smelter') G.stats.gearLv = Math.max(G.stats.gearLv || 0, it.blv); if (it.obj === 'torch') G.stats.torch++; if (OBJ[it.obj].bed) { G.spawnPt = { x: t.x, y: t.y }; emit('toast', '이제 기절하면 침대에서 깨어나요', 'good', 'bed'); }
    if (OBJ[it.obj].warp) { warpsChanged(); G.stats.portals = (G.stats.portals || 0) + 1; emit('toast', '포탈을 놓았어요 · 워프 목적지가 하나 늘었어요', 'good', 'portal'); } }
  markLight(); emit('tile', t.x, t.y); return t;
}
export function placeItem(t, gr) {
  const s = selItem(); if (!s) return; const it = gr ? groundOf(ITEMS[s.id]) || ITEMS[s.id] : ITEMS[s.id], i = idx(t.x, t.y); // v93 gr: 흙·얼음 덩이를 바닥으로
  if (it.kind === 'place' && OBJ[it.obj] && OBJ[it.obj].warp) { const why = portalWhy(t.x, t.y); if (why) { emit('toast', why, 'warn', 'portal'); return; } } // v89 포탈
  // v67 (BF-09): the placing player steps to a free tile next to them first, in the same moment (nothing placed or used up if there is none)
  if (BUILD_KINDS.includes(it.kind) && !canPlace(t.x, t.y, it)) { const sp = pushSpot(t.x, t.y, it); if (!sp) { emit('toast', '여기엔 놓을 수 없어요 · 비켜설 자리가 없어요', null, 'noplace'); return; } const p = G.p; p.x = sp.x; p.y = sp.y; p.kx = p.ky = 0; if (p.dash) p.dash = null; }
  t = putItem(it, s, t);
  s.c--; if (!s.c) { G.inv[G.sel] = null; refillHot(G.sel, s.id); } emit('inv');
  emit('sfx', 'place'); emit('puff', t.x + .5, t.y + .9, '#e8d8c0', 5, 1.6, 0.1);
}
export const GROW_SPR = { bench: [2, 2], logBench: [2, 1], stoneBench: [2, 1],
  roundTree: [1.75, 1.75], root: [1.35, 1.35], bigShroom: [1.75, 1.75], cherryTree: [1.4, 1.4], bigTree: [1.5, 1.5] };
// v50: workstations and benches take as many tiles as in other games (stations 2×1, benches 2×1) — in games started
// from v50 on (save fpV: 2). Saves from before keep them at one tile. Benches can be turned; stations only flip.
// v51: beds are one tile again (1 wide, 1.5 tall picture); the extra tile of beds placed as 1×2 in v50 is dropped by fixParts.
// v55: the copper workbench (anvil), furnace and smelter are one tile again; their extra tile from v50~v54 is dropped by fixParts the same way.
export const GREW = { bench: [2, 1], logBench: [2, 1, 1], stoneBench: [2, 1, 1] };
export let FPV = 2;
export function setFootprints(v) { FPV = v === 2 ? 2 : 1;
  for (const id in GREW) { const d = OBJ[id]; if (!d) continue; const [w, h, rv] = GREW[id];
    if (FPV === 2) { d.sz = [w, h]; if (rv) d.rotV = 1; } else { delete d.sz; delete d.rotV; }
    const f = SPR.fp && SPR.fp[id]; if (f) { SPR.obj[id] = FPV === 2 ? f.big : f.small; if (FPV === 2 && f.bigV) SPR.obj[id + 'V'] = f.bigV; else delete SPR.obj[id + 'V']; delete ICONURL[id]; } } }
setFootprints(2);
