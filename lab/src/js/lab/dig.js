// ================= 실험판 캐기·베기·만지기 (L2) =================
// 캐기 버튼(PC E·스페이스)을 누르고 있으면 바라보는 것을 0.28초마다 한 번씩 쳐요(본 게임 나무 곡괭이 빠르기):
//  벽 → 캐기 (벽 체력·나오는 것은 본 게임 표 WALLS) · 뿌리기둥·큰버섯·빛버섯 → 베기 (본 게임 OBJ drops)
//  작업대·진열대·계산대·상자·대장장이 → 누르는 순간 한 번 「만지기」(창 열기·말 걸기 — sim은 사건만 남기고 창은 js/lab/ui.js)
// 곡괭이 (재미중심 12장): 기본 곡괭이 흙벽 3번 · 구리 광맥 4번 · 돌벽 못 캠 / 구리 곡괭이 흙벽 2번 · 구리 광맥 3번 · 돌벽 4번.
// 보이기·소리는 사건으로만 남겨요(emit) — 받는 곳은 js/lab/feedback.js·ui.js.
import { OBJ, WALLS } from '../data/items.js';
import { WPAL } from '../art/world.js';
import { rand } from '../engine/random.js';
import { emit } from '../sim/events.js';
import { ctlOf, defineCmd } from '../sim/commands.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
import { idx, inB, W } from '../world/map.js';
import { WATER } from '../sim/nature.js';
import { BEDROCK, COPPER_W, DIRT_W, placeObj, removeObj, STONE_W } from './world.js';
import { anchorAt, fpOf } from '../world/tiles.js';
import { addBag, countBag, takeBag } from './bag.js';
import { touchObj, touchSmith, smithNear } from './shop.js';
export const DIG_GAP = .28;
const PICK_HITS = { pickWood: { [DIRT_W]: 3, [COPPER_W]: 4 }, pickCopper: { [DIRT_W]: 2, [COPPER_W]: 3, [STONE_W]: 4 } };
export const hitsFor = w => (PICK_HITS[G.pick] || PICK_HITS.pickWood)[w] || 0;
// 바라보는 칸 후보: 발 칸에서 바라보는 쪽 한 칸. 대각선이면 그 칸이 비었을 때 가로·세로 칸도 봐요
function frontCands(p) {
  const px = Math.floor(p.x), py = Math.floor(p.y - .1), f = p.face, fx = Math.abs(f.x) > .38 ? Math.sign(f.x) : 0, fy = Math.abs(f.y) > .38 ? Math.sign(f.y) : 0;
  const c = [[px + fx, py + fy]]; if (fx && fy) c.push(Math.abs(f.x) >= Math.abs(f.y) ? [px + fx, py] : [px, py + fy], Math.abs(f.x) >= Math.abs(f.y) ? [px, py + fy] : [px + fx, py]);
  return c.filter(([x, y]) => inB(x, y));
}
// 바라보는 것: { k: 'npc' } · { k: 'obj', a, o, x, y } · { k: 'wall', x, y } · null
export function frontThing(p = G.p) {
  if (smithNear(p)) return { k: 'npc' };
  for (const [x, y] of frontCands(p)) { const i = idx(x, y), a = anchorAt(i); if (a >= 0) return { k: 'obj', a, o: G.objs.get(a), x: a % W, y: (a / W) | 0 }; if (G.wall[i]) return { k: 'wall', x, y }; }
  return null;
}
export function frontTile(p = G.p) { const t = frontThing(p); return t && t.k !== 'npc' ? { x: t.x, y: t.y, a: t.a } : null; }
// 버튼 이름 (화면 쪽이 매 순간 읽어요)
export function actLabel() {
  const t = frontThing(); if (!t) return '캐기'; if (t.k === 'npc') return '말 걸기'; if (t.k === 'wall') return '캐기';
  const d = OBJ[t.o.t] || {}; if (d.nat === 'chop') return '베기'; if (d.nat === 'pick') return '줍기';
  if (t.o.shelf != null) return '진열'; if (t.o.counter) return '장부'; if (t.o.t === 'bench') return '만들기'; if (t.o.loot) return '열기'; if (t.o.mine) return '줍기'; return '보기';
}
function drop(id, n) { if (n > 0) { addBag(id, n); emit('got', id, n); } }
const roll = tbl => { for (const [id, a, b, ch] of tbl || []) if (rand() < ch) drop(id, a + Math.floor(rand() * (b - a + 1))); };
onFrame('act', dt => {
  const p = G.p, act = ctlOf(p).act, edge = act && !p.actWas; p.actWas = act; G.digCd = Math.max(0, G.digCd - dt); if (!act) { G.act = null; return; }
  const t = frontThing(p); G.act = t && t.k !== 'npc' ? { x: t.x, y: t.y, a: t.a } : null; if (!t) return;
  if (t.k === 'npc') { if (edge) touchSmith(); return; }
  if (t.k === 'obj') { const d = OBJ[t.o.t] || {};
    if (d.nat === 'chop' || d.nat === 'pick') { if (G.digCd > 0) return; G.digCd = DIG_GAP; hitNature(t); return; }
    if (edge) touchObj(t); return; }
  if (G.digCd > 0) return; G.digCd = DIG_GAP;
  const i = idx(t.x, t.y), w = G.wall[i];
  if (w === BEDROCK) { emit('toast', '너무 단단해서 캘 수 없어요', '', 'bedrock'); emit('sfx', 'clink'); return; }
  const hp = hitsFor(w);
  if (!hp) { emit('toast', '돌벽은 구리 곡괭이가 있어야 캘 수 있어요', '', 'needpick'); emit('sfx', 'clink'); emit('chips', t.x + .5, t.y + .95, '#8d8a9c', '#5c5a6c', 3, 0); return; }
  const dmg = (G.whit.get(i) || 0) + 1, pal = WPAL[w] || WPAL[1]; // 튀는 조각 색 = 본 게임 벽 색표
  // 금 그림은 본 게임 WALLS 체력 기준이라, 곡괭이마다 다른 횟수를 그 칸 수에 맞춰 저장해요
  const full = (WALLS[w] && WALLS[w].hp) || 3, shown = Math.min(full - 1, Math.ceil(dmg / hp * full));
  if (dmg < hp) { G.wdmg.set(i, shown); G.whit.set(i, dmg); emit('sfx', 'mine'); emit('chips', t.x + .5, t.y + .95, pal[1], pal[0], 5, 0); emit('shake', .06); return; }
  G.wdmg.delete(i); G.whit.delete(i); G.wall[i] = 0; emit('sfx', 'brk'); emit('chips', t.x + .5, t.y + .6, pal[0], pal[1], 14, 1); emit('shake', .12); emit('lit');
  roll(WALLS[w] && WALLS[w].drop); emit('wallBroke', t.x, t.y);
});
function hitNature(t) { const d = OBJ[t.o.t], left = (t.o.hp || d.hp || 1) - 1; emit('sfx', 'mine'); emit('chips', t.x + .5, t.y + .8, '#6f9b4a', '#4a3524', 4, 0);
  if (left > 0) { t.o.hp = left; t.o.shk = .2; return; }
  removeObj(t.a); emit('chips', t.x + .5, t.y + .6, '#7ab35a', '#5e391f', 10, 1); emit('lit'); roll(d.drops); }
// 횃불: 발밑 칸에 하나 놓아요 (가방의 횃불을 씀)
defineCmd('torch', () => { const p = G.p, x = Math.floor(p.x), y = Math.floor(p.y - .1), i = idx(x, y);
  if (countBag('torch') <= 0) { emit('toast', '횃불이 없어요 — 작업대에서 나무 1개로 2개 만들어요', '', 'notorch'); return; }
  if (G.objs.has(i)) { emit('toast', '여기엔 이미 놓았어요 — 한 칸 옮겨서 놓아요', '', 'torchhere'); return; }
  takeBag('torch', 1); G.objs.set(i, { t: 'torch', mine: 1 }); emit('sfx', 'place'); emit('lit'); });
// 가방의 가구·조명을 바라보는 칸에 놓기 (1칸짜리만)
defineCmd('place', c => { const id = c.id, d = OBJ[id]; if (!d || countBag(id) <= 0 || fpOf({ t: id })[0] * fpOf({ t: id })[1] !== 1) return;
  const p = G.p, cand = frontCands(p).find(([x, y]) => { const i = idx(x, y); return !G.wall[i] && G.floor[i] !== WATER && !G.objs.has(i); });
  if (!cand) { emit('toast', '바라보는 곳이 비어 있어야 놓을 수 있어요', '', 'noplace'); return; }
  takeBag(id, 1); placeObj(G, id, cand[0], cand[1], { mine: 1 }); emit('sfx', 'place'); emit('lit'); emit('placed', id); });
