// ================= 실험판 캐기·횃불 (L1) =================
// 캐기 버튼을 누르고 있으면 바라보는 벽을 0.28초마다 한 번씩 쳐요(본 게임 나무 곡괭이 빠르기). 벽 체력은 본 게임 표(WALLS) 그대로:
// 흙벽 3번 · 구리 광맥 4번 · 돌벽 5번, 단단한 암반은 못 캐요. 금 4단계 그림은 본 게임 것(G.wdmg)을 그대로 씀.
// 보이기·소리는 사건으로만 남겨요(emit) — 받는 곳은 js/lab/feedback.js (본 게임 규칙과 같게, 멀티를 다시 붙일 수 있게).
import { WALLS } from '../data/items.js';
import { WPAL } from '../art/world.js';
import { emit } from '../sim/events.js';
import { ctlOf, defineCmd } from '../sim/commands.js';
import { onFrame } from '../sim/systems.js';
import { G } from '../save/state.js';
import { idx, inB } from '../world/map.js';
import { BEDROCK, COPPER_W } from './world.js';
export const DIG_GAP = .28;
// 바라보는 칸: 발 칸에서 바라보는 쪽 한 칸. 대각선이면 그 칸이 벽이 아닐 때 가로·세로 칸을 봐요
export function frontTile(p = G.p) {
  const px = Math.floor(p.x), py = Math.floor(p.y - .1), f = p.face, fx = Math.abs(f.x) > .38 ? Math.sign(f.x) : 0, fy = Math.abs(f.y) > .38 ? Math.sign(f.y) : 0;
  const c = [[px + fx, py + fy]]; if (fx && fy) c.push(Math.abs(f.x) >= Math.abs(f.y) ? [px + fx, py] : [px, py + fy], Math.abs(f.x) >= Math.abs(f.y) ? [px, py + fy] : [px + fx, py]);
  for (const [x, y] of c) if (inB(x, y) && G.wall[idx(x, y)]) return { x, y };
  return null;
}
onFrame('act', dt => {
  const p = G.p; G.digCd = Math.max(0, G.digCd - dt); if (!ctlOf(p).act) return;
  const t = frontTile(p); G.act = t; if (!t || G.digCd > 0) return; G.digCd = DIG_GAP;
  const i = idx(t.x, t.y), w = G.wall[i];
  if (w === BEDROCK) { emit('toast', '너무 단단해서 캘 수 없어요', '', 'bedrock'); emit('sfx', 'clink'); return; }
  const hp = (WALLS[w] && WALLS[w].hp) || 3, dmg = (G.wdmg.get(i) || 0) + 1;
  const pal = WPAL[w] || WPAL[1]; // 튀는 조각 색 = 본 게임 벽 색표
  if (dmg < hp) { G.wdmg.set(i, dmg); emit('sfx', 'mine'); emit('chips', t.x + .5, t.y + .95, pal[1], pal[0], 5, 0); emit('shake', .06); return; }
  G.wdmg.delete(i); G.wall[i] = 0; emit('sfx', 'brk'); emit('chips', t.x + .5, t.y + .6, pal[0], pal[1], 14, 1); emit('shake', .12); emit('lit');
  if (w === COPPER_W) { G.found = (G.found || 0) + 1; emit('sfx', 'pick'); emit('toast', `구리광석 ${G.found}`, 'good', 'ore'); }
});
// 횃불: 발밑 칸에 하나 놓아요 (L1은 6개 — 빛도 아껴 쓰는 자원)
defineCmd('torch', () => { const p = G.p, x = Math.floor(p.x), y = Math.floor(p.y - .1), i = idx(x, y);
  if (G.torches <= 0) { emit('toast', '횃불이 없어요', '', 'notorch'); return; }
  if (G.objs.has(i)) return; G.objs.set(i, { t: 'torch' }); G.torches--; emit('sfx', 'place'); emit('lit'); emit('torches', G.torches); });
