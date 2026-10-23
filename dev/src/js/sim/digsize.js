// ================= v137 파기·바꾸기 크기 고르기 =================
// 기획 dev/design/바닥파기.md 7장 (2026-10-23 확정): 1칸 · 2×2 · 3×3 · 4×4
// - 삽이나 바닥 재료(흙·얼음 덩이·이끼 흙 …)를 들면 작은 버튼에 「1×1」 — 누를 때마다 1 → 2 → 3 → 4 → 1 (PC X 키). 캐릭터마다 기억(G.dsz)
// - 삽으로 파기·걷기, 바닥 재료로 메우기·바닥 바꾸기가 같은 크기 (흙·얼음 덩이로 벽 쌓기, 물 한 동이 붓기는 1칸 그대로)
// - 자리: 바라보는 칸부터 앞으로 N줄, 가로는 바라보는 칸이 가운데 (2×2·4×4는 오른쪽·아래쪽으로 한 칸 더). 내 발밑·옆은 안 건드려요
// - 누른 칸과 같은 일만: 파기는 자연 바닥만 · 걷기는 깐 바닥만 · 메우기는 누른 칸과 같은 것(구덩이·물·용암)만 · 바꾸기는 바꿀 수 있는 자연 바닥만
// - 못 하는 칸은 건너뛰고, 바닥 재료가 모자라면 가진 만큼 바라보는 칸에 가까운 칸부터. 삽은 판 칸 수만큼 닳아요
import { HOT, ITEMS } from '../data/items.js';
import { josa } from '../engine/util.js';
import { DIG_SIZE_MAX } from '../data/digging.js';
import { G } from '../save/state.js';
import { emit } from './events.js';
import { defineCmd } from './commands.js';
import { durOf, refillHot, selItem } from './inventory.js';
import { groundFill, groundOf, putItem } from './building.js';
import { WATER } from './nature.js';
import { idx, inB } from '../world/map.js';
import { canPlace, digGround, digWhy, isPlacedFloor } from '../world/tiles.js';

export const dszOf = () => { const n = G && G.dsz; return n >= 2 && n <= DIG_SIZE_MAX ? n : 1; };
export const dszLbl = (n = dszOf()) => `${n}×${n}`;
export const withSz = lbl => dszOf() > 1 ? `${lbl} ${dszLbl()}` : lbl; // 「파기 3×3」 (1칸이면 그대로)
export function cycleDsz() { G.dsz = dszOf() % DIG_SIZE_MAX + 1; emit('sfx', 'click'); emit('toast', `파기·바꾸기 크기 ${dszLbl()}`, null, 'dsize'); }
defineCmd('dsize', () => { if (!G.p.cine && (G.alts || []).some(a => a.k === 'dsize')) cycleDsz(); }); // PC X 키 — 삽·바닥 재료를 들었을 때만

// 크기를 고를 수 있는 손: 삽을 일부러 들었을 때, 바닥 재료(흙·얼음 덩이 포함, 물 한 동이 빼고)를 들었을 때
export function sizeable(md, it) { if (md === 'shovel') return true; if (md !== 'build' || !it) return false;
  return !!groundOf(it) || (it.kind === 'ground' && it.ground !== WATER); }
export const sizeAlt = s => ({ k: 'dsize', lbl: dszLbl(), icon: s ? s.id : 'shovel', onlyAlt: 1 });

// 바라보는 칸 t에서 앞으로 n×n — 가까운 칸부터
export function areaTiles(t, n) {
  const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y); let dx = t.x - px, dy = t.y - py;
  if (!dx && !dy) { const f = p.face || { x: 0, y: 1 }; if (Math.abs(f.x) > Math.abs(f.y)) dx = Math.sign(f.x); else dy = f.y < 0 ? -1 : 1; }
  const ax = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)], lt = ax[0] ? [0, 1] : [1, 0];
  const lo = -Math.floor((n - 1) / 2), out = [];
  for (let k = 0; k < n; k++) for (let l = lo; l < lo + n; l++) { const x = t.x + ax[0] * k + lt[0] * l, y = t.y + ax[1] * k + lt[1] * l; if (inB(x, y)) out.push({ x, y, d: Math.hypot(k, l) }); }
  return out.sort((a, b) => a.d - b.d);
}
// 이 행동이 크기를 따르면 바뀔 칸·건너뛸 칸 (미리 보기와 실제 일이 같은 계산) — 아니면 null
export function areaPlan(a) {
  const n = dszOf(); if (!a || !a.area || !a.t || n < 2 || !inB(a.t.x, a.t.y)) return null;
  const s = selItem(); if (!s) return null; const t = a.t, f0 = G.floor[idx(t.x, t.y)], all = areaTiles(t, n), ok = [], skip = [];
  if (a.k === 'dig') { if (s.id !== 'shovel') return null; const placed = isPlacedFloor(f0); let left = durOf(s);
    let short = false; for (const c of all) { const j = idx(c.x, c.y), can = !digWhy(c.x, c.y) && isPlacedFloor(G.floor[j]) === placed; if (can && left > 0) { ok.push(c); left--; } else { if (can) short = true; skip.push(c); } }
    return { ok, skip, n, k: 'dig', short }; }
  if (a.k === 'place') { const it = a.gr ? groundOf(ITEMS[s.id]) : ITEMS[s.id]; if (!it || it.kind !== 'ground' || it.ground === WATER) return null;
    const fill = groundFill(f0); let left = s.c; for (let j = HOT; j < G.inv.length; j++) { const b = G.inv[j]; if (b && b.id === s.id) left += b.c; } // 단축칸이 비면 가방에서 채워요 (refillHot)
    let short = false; for (const c of all) { const f = G.floor[idx(c.x, c.y)], can = canPlace(c.x, c.y, it) && (fill ? f === f0 : !groundFill(f)); if (can && left > 0) { ok.push(c); left--; } else { if (can) short = true; skip.push(c); } }
    return { ok, skip, n, k: 'place', it, id: s.id, short }; }
  return null;
}
// 크기만큼 파기·걷기 (삽이 망가지면 거기서 멈춰요)
export function digArea(a) { const pl = areaPlan(a); if (!pl) { digGround(a.t); return; }
  let k = 0; for (const c of pl.ok) { const s = selItem(); if (!s || s.id !== 'shovel' || durOf(s) <= 0) break; digGround(c, k++ > 0); }
}
// 크기만큼 메우기·바닥 바꾸기 (재료가 모자라면 가진 만큼)
export function placeArea(a) { const pl = areaPlan(a); if (!pl) return false; let k = 0;
  for (const c of pl.ok) { const s = selItem(); if (!s || s.id !== pl.id) break; putItem(pl.it, s, c); k++;
    s.c--; if (!s.c) { G.inv[G.sel] = null; refillHot(G.sel, s.id); } }
  if (!k) return true; emit('inv'); emit('sfx', 'place');
  if (pl.short) emit('toast', `${josa(ITEMS[pl.id].n, '이', '가')} 모자라서 ${k}칸만 했어요`, null, 'dszshort');
  return true;
}
