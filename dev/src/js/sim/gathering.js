// ================= 모으기: 벽 캐기·나무 베기·수확, 쳐서 회수(공격 버튼으로 가구 떼기) =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { OLD_AUTO } from '../data/automation.js';
import { WPAL } from '../art/world.js';
import { TIER_IT } from '../data/automation-tiers.js';
import { DUR } from '../data/circuits-regions.js';
import { CHOP_CD, natHits, RECOVER_GAP, RECOVER_HITS } from '../data/controls.js';
import { STAR_OF } from '../data/farming-cooking.js';
import { BUILT_WALLS, ITEMS, OBJ, TIERNAME, WALLS } from '../data/items.js';
import { C } from '../engine/canvas.js';
import { G } from '../save/state.js';
import { faceTo, natTool, targetTile } from './actions.js';
import { bestPick, HITSTOP } from './combat.js';
import { maybeNote } from './cooking.js';
import { cancelJob } from './crafting.js';
import { rollDrops, spawnDrop } from './drops.js';
import { emit } from './events.js';
import { rollStar } from './farming.js';
import { wear } from './inventory.js';
import { afterCut, isYoung, youngDrops } from './nature.js';
import { gainXp, mineMul } from './player.js';
import { SHADOW_WALL_XP } from '../data/shadow.js';
import { hasItem } from './quests.js';
import { idx, inB, W } from '../world/map.js';
import { anchorAt, delObj, fpOf } from '../world/tiles.js';
import { markLight } from './loop.js';
import { nestContents } from './beaver.js';
export function breakWall(tx, ty) { const i = idx(tx, ty), w = G.wall[i], def = WALLS[w]; G.wall[i] = 0; G.wdmg.delete(i); if (G.bwall) G.bwall.delete(i); rollDrops(def.drop, tx + .5, ty + .5); emit('chips', tx + .5, ty + .6, WPAL[w][0], WPAL[w][1], 14, 1); emit('puff', tx + .5, ty + .6, WPAL[w][0], 6, 2.4); emit('hitstop', HITSTOP.wall); emit('sfx', 'brk'); /* v138 부서질 때 덩어리가 튐 */ markLight(); emit('tile', tx, ty); gainXp(SHADOW_WALL_XP[w] || (w >= 9 && w <= 12 ? (w === 10 || w === 12 ? 6 : 3) : w === 3 || w === 4 || w === 5 ? 3 : w === 2 ? 1 : 0)); } // v129 그림자 바위 4 · 결정 광맥 10
export function mineWall(t) {
  const p = G.p, i = idx(t.x, t.y), w = G.wall[i], def = WALLS[w], pk = bestPick();
  faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(p.face.y, p.face.x), icon: pk.id === 'hand' ? null : pk.id };
  if (def.tier > pk.tier) { emit('sfx', 'clink'); emit('puff', t.x + .5, t.y + .9, '#ffffff', 3, 1.5); emit('toast', `${def.n}은(는) ${TIERNAME[def.tier] || '더 좋은 곡괭이'}가 필요해요`, null, 'tier' + w); return; }
  const dm = (G.wdmg.get(i) || 0) + pk.power * mineMul(); wear(pk.slot); emit('sfx', 'mine'); emit('chips', t.x + .5, t.y + .95, WPAL[w][1], WPAL[w][0], 5, 0); emit('shake', 0.06); /* v138 돌 조각 (예전 먼지 4개) */
  if (dm >= def.hp) {
    breakWall(t.x, t.y);
  } else G.wdmg.set(i, dm);
}
export function hitObj(t, o) {
  const d = OBJ[o.t], tl = natTool(d), i = idx(t.x, t.y), tier = tl ? ITEMS[tl.id].tier || 0 : 0; // v65: an axe (or else a pickaxe) from the tool pouch
  faceTo(t.x + .5 - G.p.x, t.y + .5 - G.p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: d.nat === 'pick' || !tl ? null : tl.id };
  if ((d.tier || 0) > tier) { emit('sfx', 'clink'); emit('toast', `${d.n}은(는) ${TIERNAME[d.tier]}가 필요해요`, null, 'otier'); return; }
  // v139: 치는 횟수로 (예전: 도구 힘 × 캐는 배율을 체력에 쌓음). 도구 내구도는 부술 때 한 번만 닳아요 (예전: 칠 때마다)
  o.dmg = (o.dmg || 0) + 1; const yg = isYoung(o), need = d.nat === 'pick' ? 1 : Math.max(1, natHits(d.hp) - (yg ? 1 : 0)), last = o.dmg >= need;
  const fx = natFx(d, o); emit('sfx', 'mine'); if (fx.chip) emit('chips', t.x + .5, t.y + .7, fx.c1, fx.c2, last ? 4 : 5, 0); else emit('leaves', t.x + .5, t.y + .35, fx.c1, fx.c2, last ? 5 : 4); emit('shake', last ? .1 : .05);
  if (last) { delObj(i); if (d.nat !== 'pick' && tl) wear(tl); const fpc = d.sz ? fpOf(o) : [1, 1]; rollDrops(yg ? youngDrops(d.drops) : d.drops, t.x + fpc[0] / 2, t.y + fpc[1] / 2); if (d.dropFn) d.dropFn(t.x + fpc[0] / 2, t.y + fpc[1] / 2); if ((d.nat === 'cut' && !d.ntree) || d.nat === 'pick') maybeNote('gather', t.x + .5, t.y + .5); afterCut(t, o);
    if (need > 1) { if (fx.chip) emit('chips', t.x + .5, t.y + .6, fx.c1, fx.c2, 12, 1); else { emit('leaves', t.x + .5, t.y + .2, fx.c1, fx.c2, 12); emit('chips', t.x + .5, t.y + .7, '#9b6b43', '#c79a64', 6, 1); } emit('hitstop', HITSTOP.wall); } // v138·v139 부서질 때 더 크게
    emit('sfx', 'brk'); markLight(); gainXp(o.t === 'cluster' ? 3 : o.t === 'root' || o.t === 'bigShroom' || d.ntree ? 1 : 0); } else o.shake = 0.32; // v139 기울며 흔들림 (예전 0.15)
}
// v139 칠 때 나오는 것: 캐는 것(바위·결정·뼈)은 돌 조각, 베는 것(나무·덤불·풀)은 잎 — 색은 이름으로 (보이기만)
export function natFx(d, o) { const n = d.n || '';
  if (d.nat === 'mine') return o.t === 'cluster' ? { chip: 1, c1: C.cry, c2: '#e9dcff' } : /얼음|결정/.test(n) ? { chip: 1, c1: '#bfe3f5', c2: '#f2fbff' } : /해골|뼈/.test(n) ? { chip: 1, c1: '#e6dcc8', c2: '#9a8f86' } : { chip: 1, c1: '#9a8f86', c2: '#e8d8c0' };
  if (/벚꽃|분홍/.test(n)) return { c1: '#f4b6c8', c2: '#ffe2ea' }; if (/단풍/.test(n)) return { c1: '#e0874a', c2: '#f3c26b' }; if (/눈|서리|얼음/.test(n)) return { c1: '#e6f2fb', c2: '#a9d2a0' };
  if (/큰버섯/.test(n) || o.t === 'bigShroom') return { c1: '#e07b5f', c2: '#f3d1b8' }; if (/마른|통나무|그루터기/.test(n)) return { c1: '#a07a52', c2: '#c9a06e' }; if (d.nat === 'pick') return { c1: '#9be3ff', c2: '#e6f7ff' };
  return { c1: '#7fbf6a', c2: '#a8d978' }; }
// v139 다음 치기까지 간격 (sim/actions.js 'chop')
export function chopCd(o) { const d = o && OBJ[o.t]; if (!d) return CHOP_CD[0]; const tl = natTool(d), tier = tl ? ITEMS[tl.id].tier || 0 : 0; return Math.max(.14, CHOP_CD[Math.min(CHOP_CD.length - 1, tier)] / Math.sqrt(Math.max(1, mineMul()))); }
export function harvest(t, o) {
  const d = OBJ[o.t];
  const sk = hasItem('sickle'); // a copper sickle in the bag gives one more of the main crop
  if (d.crop) { const i = idx(t.x, t.y); if (o.star == null) rollStar(i, o); G.objs.delete(i); // a star crop gives its main harvest as star items
    rollDrops(d.yield.map(([id, a, b, ch], k) => [!k && o.star && STAR_OF[id] ? STAR_OF[id] : id, a + (sk && !k ? 1 : 0), b + (sk && !k ? 1 : 0), id === 'glowcap' && o.f === 2 ? .6 : ch]), t.x + .5, t.y + .5);
    const S = G.stats; S.cropH = (S.cropH || 0) + 1; if (o.star) { S.starH = (S.starH || 0) + 1; emit('ftext', t.x + .5, t.y - .3, '★ 별 작물!', '#ffe9a8'); } if (o.t === 'cropBerry') S.berryH = (S.berryH || 0) + 1; if (o.w) S.wetH = (S.wetH || 0) + 1; }
  else { delObj(idx(t.x, t.y)); rollDrops([['berry', 2 + (sk ? 1 : 0), 3 + (sk ? 1 : 0), 1]], t.x + .5, t.y + .6); spawnDrop('berrySeed', 1, t.x + .5, t.y + .6); markLight(); } // v87: 딴 베리덤불은 사라지고 베리 씨앗을 꼭 1개 줘요 (예전: 150초 뒤 다시 열림, 씨앗 30%)
  emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .5, '#9be37a', 6, 2); gainXp(2); maybeNote('gather', t.x + .5, t.y + .5);
}
export const HITS = new Map();
export function recoverTarget() { const t = targetTile(); if (!inB(t.x, t.y)) return null; let i = idx(t.x, t.y); const w = G.wall[i];
  if (BUILT_WALLS.has(w)) return { t, i, wall: w }; // the wood and brick walls players build (natural walls only by pickaxe)
  let o = G.objs.get(i); if (o && o.t === '_part') { const ai = anchorAt(i); if (ai < 0) return null; i = ai; o = G.objs.get(ai); }
  const d = o && OBJ[o.t]; if (!d || !d.item || d.nat || d.crop || d.lost || d.tree || d.shrine || d.tchest || d.ranch || d.bush || d.growTo) return null;
  return { t: { x: i % W, y: (i / W) | 0 }, i, o, full: !!(d.chest && o.items && o.items.some(x => x)) }; }
export function hitRecover(tg, w) { const p = G.p, t = tg.t; faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: .22, max: .22, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: 1.2, rad: .95 }; emit('sfx', 'swing');
  if (tg.full) { emit('sfx', 'clink'); emit('toast', '물건이 든 상자는 비워야 떨어져요', null, 'fullchest'); return; }
  const h = HITS.get(tg.i), n = h && G.time - h.t < RECOVER_GAP ? h.n + 1 : 1; HITS.set(tg.i, { n, t: G.time, x: t.x, y: t.y });
  emit('sfx', 'mine'); emit('puff', t.x + .5, t.y + .7, '#e8d8c0', 4, 1.6); if (tg.o) tg.o.shake = .15; emit('shake', .04);
  if (n >= RECOVER_HITS) { HITS.delete(tg.i); if (tg.wall) breakWall(t.x, t.y); else dropObj(t, tg.o); } }
export function dropObj(t, o) { const i = idx(t.x, t.y), d = OBJ[o.t], fp = d.sz ? fpOf(o) : [1, 1], x = t.x + fp[0] / 2, y = t.y + fp[1] / 2 + .3;
  delObj(i); if (d.bed && G.spawnPt && G.spawnPt.x === t.x && G.spawnPt.y === t.y) G.spawnPt = null;
  if (o.job) cancelJob(o, x, y); if (o.store) for (const s2 of o.store) spawnDrop(s2.id, s2.c, x, y);
  for (const [id, c] of nestContents(o)) spawnDrop(id, c, x, y); // v114: 둥지의 비버·먹이통의 먹이
  if (OLD_AUTO[o.t]) { for (const [m, c] of OLD_AUTO[o.t]) spawnDrop(m, c, x, y); emit('sfx', 'brk'); emit('puff', x, y, '#e8d8c0', 10, 2.4); markLight(); emit('tile', t.x, t.y); emit('inv'); return; } // v113: 옛 돌 채굴기는 재료로
  const it = TIER_IT[o.t] && o.lv ? TIER_IT[o.t][o.lv] : d.item; spawnDrop(it, 1, x, y);
  if (DUR[d.item]) G.drops[G.drops.length - 1].dur = Math.round(o.e != null ? o.e : DUR[d.item][0]);
  emit('sfx', 'brk'); emit('puff', x, y, '#e8d8c0', 10, 2.4); markLight(); emit('tile', t.x, t.y); emit('inv'); }
