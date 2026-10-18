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
// 지도가 보여 주는 범위. v94: 끌어서 옮기고, 두 손가락·휠·+−로 확대·축소해요 (UIS.mapV = 가운데 칸 cx·cy와 보이는 칸 수 span)
// 처음 열 때: 퀘스트 「지도에서 보기」는 목표 가운데 90칸, 워프 고르기는 전체, 그 밖은 나를 가운데로 지난번 크기(처음은 90칸)
export const MAP_MIN = 20;
export const mapMax = () => Math.max(W, H);
export const MAP_NEAR = 90;
function mapStart() { const F = UIS.mapFocus; if (F) return { cx: F.x, cy: F.y, span: MAP_NEAR };
  if (UIS.mapWarp != null) return { cx: W / 2, cy: H / 2, span: mapMax() };
  const span = UIS.mapSpan || MAP_NEAR; return span >= mapMax() ? { cx: W / 2, cy: H / 2, span } : { cx: G.p.x, cy: G.p.y, span }; }
export function mapView() { const v = UIS.mapV || (UIS.mapV = mapStart()), span = clamp(v.span, MAP_MIN, mapMax()), s = 600 / span;
  const a = (c, D) => span >= D ? (D - span) / 2 : clamp(c - span / 2, 0, D - span); return { span, s, ox: a(v.cx, W), oy: a(v.cy, H) }; }
// 보이는 범위를 바꾸고(지도 그림 칸 px·py를 기준점으로 k배 확대, 그다음 dx·dy 그림 칸만큼 옮김) 가장자리 안으로 맞춰요
export function mapMove(k, px, py, dx = 0, dy = 0) { const { span, s, ox, oy } = mapView(), ns = clamp(span / k, MAP_MIN, mapMax()), wx = ox + px / s, wy = oy + py / s, s2 = 600 / ns;
  UIS.mapV = { cx: wx - (px + dx) / s2 + ns / 2, cy: wy - (py + dy) / s2 + ns / 2, span: ns }; const r = mapView(); UIS.mapV = { cx: r.ox + ns / 2, cy: r.oy + ns / 2, span: ns };
  if (UIS.mapWarp == null && !UIS.mapFocus) UIS.mapSpan = ns; mapRedraw(); }
export function mapSet(v) { UIS.mapV = v; if (UIS.mapWarp == null && !UIS.mapFocus) UIS.mapSpan = v.span; }
export const mapIsAll = () => mapView().span >= mapMax() - .5;
let mapRaf = 0;
function mapRedraw() { if (mapRaf) return; mapRaf = requestAnimationFrame(() => { mapRaf = 0; drawMap(); const b = $('#sheet [data-a=mapzoom]'); if (b) b.textContent = mapIsAll() ? '가까이 보기' : '전체 보기'; }); }
// 지도 위 손가락·마우스: 하나면 옮기기, 둘이면 벌리고 좁혀 확대·축소, 휠도 확대·축소. 8px 넘게 움직였으면 그 뒤 누르기(워프 고르기)는 무시
const MG = { p: new Map(), last: null, movedAt: 0, moved: false };
export const mapDragged = () => performance.now() - MG.movedAt < 350;
function mapPt(e) { const c = $('#mapCv'); if (!c) return null; const r = c.getBoundingClientRect(); if (!r.width) return null; return { x: (e.clientX - r.left) * 600 / r.width, y: (e.clientY - r.top) * 600 / r.height }; }
function mapPair() { const a = [...MG.p.values()]; if (a.length < 2) return null; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; }
export function setupMapGestures() {
  document.addEventListener('pointerdown', e => { if (!e.target || e.target.id !== 'mapCv' || (e.pointerType === 'mouse' && e.button !== 0)) return; const q = mapPt(e); if (!q) return;
    if (!MG.p.size) MG.moved = false; MG.p.set(e.pointerId, { x: q.x, y: q.y, sx: q.x, sy: q.y }); MG.last = mapPair(); });
  window.addEventListener('pointermove', e => { const P = MG.p.get(e.pointerId); if (!P) return; const q = mapPt(e); if (!q) return; const dx = q.x - P.x, dy = q.y - P.y; P.x = q.x; P.y = q.y;
    if (!MG.moved && Math.hypot(q.x - P.sx, q.y - P.sy) > 8 * 600 / Math.max(1, ($('#mapCv')?.getBoundingClientRect().width || 600))) MG.moved = true;
    if (!MG.moved) return; MG.movedAt = performance.now();
    if (MG.p.size >= 2) { const n = mapPair(), o = MG.last; if (o && n && o.d > 4) mapMove(n.d / o.d, o.x, o.y, n.x - o.x, n.y - o.y); MG.last = n; }
    else mapMove(1, 0, 0, dx, dy); });
  const up = e => { if (!MG.p.delete(e.pointerId)) return; if (MG.moved) MG.movedAt = performance.now(); MG.last = mapPair(); };
  window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  const clear = () => { MG.p.clear(); MG.last = null; }; window.addEventListener('blur', clear); document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  document.addEventListener('wheel', e => { if (!e.target || e.target.id !== 'mapCv') return; e.preventDefault(); const q = mapPt(e); if (!q) return; const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; mapMove(Math.exp(-clamp(dy, -200, 200) * .002), q.x, q.y); }, { passive: false });
}
// v89: 지도를 누른 곳에서 가장 가까운 갈 수 있는 곳 (지도 그림 칸 기준 40 안), 없으면 null
export function warpTapAt(el, clientX, clientY) { const r = el.getBoundingClientRect(); if (!r.width) return null; const X = (clientX - r.left) * 600 / r.width, Y = (clientY - r.top) * 600 / r.height, { s, ox, oy } = mapView();
  let best = null, bd = 40; for (const e of warpDests(UIS.mapWarp)) { const d = Math.hypot((e.x + .5 - ox) * s - X, (e.y + .5 - oy) * s - Y); if (d < bd) { bd = d; best = e; } } return best; }
