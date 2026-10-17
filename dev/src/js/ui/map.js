// ================= 지도 창: 상자 표시 설정, 지도 그리기(drawMap) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// the map's unopened-treasure markers can be hidden; a per-viewer setting kept in this browser
import { BKEYS, BOSSES, FLOWERS } from '../data/rpg-nature.js';
import { INK } from '../engine/canvas.js';
import { $, clamp } from '../engine/util.js';
import { flushMap, mapCv } from '../render/map.js';
import { G } from '../save/state.js';
import { myBag } from '../sim/survival.js';
import { liveWarps, warpDests, warpOn } from '../sim/warp.js';
import { SPR } from '../art/world.js';
import { UIS } from './panels.js';
import { CX, CY, H, idx, SA, SB, W } from '../world/map.js';
export let mapChestPref = null;
export const setMapChest = v => { mapChestPref = v; };
export function mapChestOn() { if (mapChestPref == null) { try { mapChestPref = localStorage.getItem('lantern-tree-map-chest') !== '0'; } catch (_) { mapChestPref = true; } } return mapChestPref; }
export function drawMap() {
  const c = $('#mapCv'); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0c0a12'; g.fillRect(0, 0, 600, 600);
  flushMap();
  const F = UIS.mapFocus, { span, s, ox, oy } = mapView(); // v84: 퀘스트 「지도에서 보기」는 목표를 가운데로
  g.drawImage(mapCv, ox, oy, span, span, 0, 0, 600, 600);
  const dot = (x, y, col, r) => { const X = (x - ox) * s, Y = (y - oy) * s; g.fillStyle = INK; g.beginPath(); g.arc(X, Y, r + 3, 0, 6.283); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X, Y, r, 0, 6.283); g.fill(); };
  dot(CX + .5, CY, '#ffc861', 9);
  if (G.spawnPt) dot(G.spawnPt.x + .5, G.spawnPt.y + .5, '#ff8fa3', 5);
  for (const z of G.fzones || []) if (G.explored[idx(z.x, z.y)]) dot(z.x + .5, z.y + .5, FLOWERS[z.c][2], 4);
  for (const k of BKEYS) { const h = BOSSES[k].home(); if (!G.bossDead[k] && G.explored[idx(Math.floor(h.x), Math.floor(h.y))]) dot(h.x, h.y, BOSSES[k].col, 6); }
  for (const sp of [SA, SB]) if (G.explored[idx(sp.x, sp.y)] && G.objs.get(idx(sp.x, sp.y))?.has) dot(sp.x + .5, sp.y + .5, '#fff1b0', 5);
  if (mapChestOn()) for (const r of G.rooms || []) if (r.found && !r.open) dot(r.cx + .5, r.cy + .5, '#ffd25c', 5);
  for (const [i, o] of G.objs) if (myBag(o)) dot(i % W + .5, ((i / W) | 0) + .5, '#ff9b4a', 5); // v68: only my own bundles
  if (G.backPt) dot(G.backPt.x, G.backPt.y, '#b99bff', 5);
  // v89 워프포인트·포탈: 켜진 것은 어디든(세계 공용), 안 켜진 워프포인트는 밝힌 곳만 흐리게
  const WM = UIS.mapWarp; for (const e of liveWarps()) { const on = warpOn(e.o); if (!on && !G.explored[e.i]) continue; const X = (e.x + .5 - ox) * s, Y = (e.y + .5 - oy) * s; if (X < -20 || Y < -20 || X > 620 || Y > 620) continue;
    const F2 = SPR.warpF && SPR.warpF[e.o.t === 'portal' ? 'portal' : 'pt'], img = F2 ? (on ? F2.base[0] : F2.off) : null;
    if (e.i === WM) { g.fillStyle = 'rgba(127,224,181,.35)'; g.beginPath(); g.arc(X, Y, 22, 0, 6.283); g.fill(); }
    g.globalAlpha = on ? 1 : .55; if (img) { g.imageSmoothingEnabled = false; g.drawImage(img, X - 16, Y - 20, 32, 32); } else dot(e.x + .5, e.y + .5, e.o.t === 'portal' ? '#7fe8f0' : on ? '#c9a6ff' : '#6a5a80', 6); g.globalAlpha = 1;
    if (e.i === UIS.warpSel) { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(X, Y, 20, 0, 6.283); g.stroke(); g.strokeStyle = '#ffc861'; g.lineWidth = 4; g.beginPath(); g.arc(X, Y, 20, 0, 6.283); g.stroke(); } }
  dot(G.p.x, G.p.y, '#7fe0b5', 8);
  if (F) { const X = (F.x - ox) * s, Y = (F.y - oy) * s; g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(X, Y, 16, 0, 6.283); g.stroke(); g.strokeStyle = '#ffc861'; g.lineWidth = 4; g.beginPath(); g.arc(X, Y, 16, 0, 6.283); g.stroke(); dot(F.x, F.y, '#ffc861', 6); }
}
// 지도가 보여 주는 범위 (전체 보기면 지도 전체, 아니면 나(또는 목표)를 가운데로 90칸) — v89 워프 고르기는 전체 보기가 먼저
export function mapView() { const F = UIS.mapFocus, all = UIS.mapWarp != null ? !UIS.warpNear : UIS.mapAll, cx0 = F ? F.x : G.p.x, cy0 = F ? F.y : G.p.y;
  const span = all ? W : 90, s = 600 / span; return { span, s, ox: all ? 0 : clamp(cx0 - span / 2, 0, W - span), oy: all ? 0 : clamp(cy0 - span / 2, 0, H - span) }; }
// v89: 지도를 누른 곳에서 가장 가까운 갈 수 있는 곳 (지도 그림 칸 기준 40 안), 없으면 null
export function warpTapAt(el, clientX, clientY) { const r = el.getBoundingClientRect(); if (!r.width) return null; const X = (clientX - r.left) * 600 / r.width, Y = (clientY - r.top) * 600 / r.height, { s, ox, oy } = mapView();
  let best = null, bd = 40; for (const e of warpDests(UIS.mapWarp)) { const d = Math.hypot((e.x + .5 - ox) * s - X, (e.y + .5 - oy) * s - Y); if (d < bd) { bd = d; best = e; } } return best; }
