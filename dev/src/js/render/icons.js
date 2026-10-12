// ================= 아이콘: 아이템 아이콘 그림·주소(iconURL) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// tall or wide pictures sit in a square canvas so bag and hotbar slots keep their square shape (v55)
import { ARTC } from '../art/hand-art.js';
import { SPR } from '../art/world.js';
import { BENCH_COL } from '../data/automation-tiers.js';
import { ITEMS } from '../data/items.js';
import { C, INK, mk } from '../engine/canvas.js';
import { WATER } from '../sim/nature.js';
export const SQICON = new WeakMap();
export function squareIcon(c) {
  if (!c || c.width === c.height) return c; if (SQICON.has(c)) return SQICON.get(c);
  const n = Math.max(c.width, c.height), k = document.createElement('canvas'); k.width = k.height = n;
  k.getContext('2d').drawImage(c, (n - c.width) >> 1, n - c.height); k.hd = c.hd; k.ol = c.ol; SQICON.set(c, k); return k;
}
export function iconCanvas(id) {
  if (SPR.item[id]) return SPR.item[id];
  const it = ITEMS[id];
  if (it.blv) { const b = iconCanvas(it.obj === 'smelter' ? 'smelter' : 'bench'), c = document.createElement('canvas'); c.width = b.width; c.height = b.height; c.hd = b.hd; const g = c.getContext('2d'); g.drawImage(b, 0, 0); const z = Math.max(4, Math.round(b.width / 4)); g.fillStyle = INK; g.fillRect(b.width - z - 1, 0, z + 1, z + 1); g.fillStyle = BENCH_COL[it.blv]; g.fillRect(b.width - z, 1, z - 1, z - 1); return SPR.item[id] = c; } // v60: tier workbench = workbench + tier colour plate
  if (it.kind === 'place') { const f = SPR.fp && SPR.fp[it.obj]; return squareIcon(f && !ARTC['obj/' + it.obj] ? f.small : SPR.obj[it.obj]); }
  if (it.kind === 'wall') { const c = mk(16, 16, A => { A.g.drawImage(SPR.wtop[it.wall][0], 0, 0, 16, 11, 1, 1, 14, 10); A.g.drawImage(SPR.wfront[it.wall], 0, 0, 16, 5, 1, 11, 14, 4); }); return SPR.item[id] = c; }
  if (it.kind === 'floor') { const c = mk(16, 16, A => { A.g.drawImage(SPR.floor[it.floor][1], 0, 0, 16, 16, 1, 3, 14, 11); }); return SPR.item[id] = c; }
  if (it.kind === 'ground') { const c = it.ground === WATER
      ? mk(16, 16, A => { A.r(3, 6, 10, 8, C.woodD); A.r(4, 6, 8, 7, C.wood); A.r(3, 8, 10, 1, C.stoneD); A.r(3, 12, 10, 1, C.stoneD); A.e(8, 6, 4.6, 1.6, '#4f9ad8'); A.p(6, 6, '#bfe6ff'); A.p(9, 5, '#bfe6ff'); A.line(3, 6, 6, 1, C.stoneD); A.line(13, 6, 10, 1, C.stoneD); A.r(6, 1, 5, 1, C.stoneD); })
      : mk(16, 16, A => { const tex = SPR.floor[it.ground][0]; A.e(8, 10, 6.4, 4.2, '#000'); A.g.globalCompositeOperation = 'source-in'; A.g.drawImage(tex, 0, 0); A.g.globalCompositeOperation = 'source-over'; A.e(7, 8, 3, 1.4, 'rgba(255,255,255,0.18)'); });
    return SPR.item[id] = c; }
  return SPR.ui.dots;
}
export const ICONURL = {};
export function iconURL(id) { if (ICONURL[id]) return ICONURL[id]; const c = SPR.ui[id] || squareIcon(iconCanvas(id)); return ICONURL[id] = c.toDataURL(); } // every item takes one square slot (v55)
