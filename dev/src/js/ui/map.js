// ================= 지도 창: 상자 표시 설정, 지도 그리기(drawMap) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// the map's unopened-treasure markers can be hidden; a per-viewer setting kept in this browser
import { BKEYS, BOSSES, FLOWERS } from '../data/rpg-nature.js';
import { INK } from '../engine/canvas.js';
import { $, clamp } from '../engine/util.js';
import { flushMap, mapCv } from '../render/map.js';
import { G } from '../save/state.js';
import { UIS } from './panels.js';
import { CX, CY, H, idx, SA, SB, W } from '../world/map.js';
export let mapChestPref = null;
export const setMapChest = v => { mapChestPref = v; };
export function mapChestOn() { if (mapChestPref == null) { try { mapChestPref = localStorage.getItem('lantern-tree-map-chest') !== '0'; } catch (_) { mapChestPref = true; } } return mapChestPref; }
export function drawMap() {
  const c = $('#mapCv'); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0c0a12'; g.fillRect(0, 0, 600, 600);
  flushMap();
  const span = UIS.mapAll ? W : 90, s = 600 / span; const ox = UIS.mapAll ? 0 : clamp(G.p.x - span / 2, 0, W - span), oy = UIS.mapAll ? 0 : clamp(G.p.y - span / 2, 0, H - span);
  g.drawImage(mapCv, ox, oy, span, span, 0, 0, 600, 600);
  const dot = (x, y, col, r) => { const X = (x - ox) * s, Y = (y - oy) * s; g.fillStyle = INK; g.beginPath(); g.arc(X, Y, r + 3, 0, 6.283); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X, Y, r, 0, 6.283); g.fill(); };
  dot(CX + .5, CY, '#ffc861', 9);
  if (G.spawnPt) dot(G.spawnPt.x + .5, G.spawnPt.y + .5, '#ff8fa3', 5);
  for (const z of G.fzones || []) if (G.explored[idx(z.x, z.y)]) dot(z.x + .5, z.y + .5, FLOWERS[z.c][2], 4);
  for (const k of BKEYS) { const h = BOSSES[k].home(); if (!G.bossDead[k] && G.explored[idx(Math.floor(h.x), Math.floor(h.y))]) dot(h.x, h.y, BOSSES[k].col, 6); }
  for (const sp of [SA, SB]) if (G.explored[idx(sp.x, sp.y)] && G.objs.get(idx(sp.x, sp.y))?.has) dot(sp.x + .5, sp.y + .5, '#fff1b0', 5);
  if (mapChestOn()) for (const r of G.rooms || []) if (r.found && !r.open) dot(r.cx + .5, r.cy + .5, '#ffd25c', 5);
  for (const [i, o] of G.objs) if (o.t === 'lostBag') dot(i % W + .5, ((i / W) | 0) + .5, '#ff9b4a', 5);
  if (G.backPt) dot(G.backPt.x, G.backPt.y, '#b99bff', 5);
  dot(G.p.x, G.p.y, '#7fe0b5', 8);
}
