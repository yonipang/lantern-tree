// ================= 지도 창: 상자 표시 설정, 지도 그리기(drawMap) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// the map's unopened-treasure markers can be hidden; a per-viewer setting kept in this browser
import { BKEYS, BOSSES, FLOWERS } from '../data/rpg-nature.js';
import { ITEMS } from '../data/items.js';
import { SUMMON } from '../data/quests.js';
import { INK } from '../engine/canvas.js';
import { toast } from '../engine/effects.js';
import { $, clamp } from '../engine/util.js';
import { iconCanvas } from '../render/icons.js';
import { flushMap, mapCv } from '../render/map.js';
import { WATER } from '../sim/nature.js';
import { G } from '../save/state.js';
import { escHTML } from '../save/storage.js';
import { myBag } from '../sim/survival.js';
import { liveWarps, warpDests, warpName, warpOn } from '../sim/warp.js';
import { SPR } from '../art/world.js';
import { UIS } from './panels.js';
import { CX, CY, H, idx, SA, SB, W } from '../world/map.js';
export let mapChestPref = null;
export const setMapChest = v => { mapChestPref = v; };
export function mapChestOn() { return true; /* v111: 범례의 「표시」 체크를 없애 늘 보여요 */ if (mapChestPref == null) { try { mapChestPref = localStorage.getItem('lantern-tree-map-chest') !== '0'; } catch (_) { mapChestPref = true; } } return mapChestPref; }
export function drawMap() {
  const c = $('#mapCv'); if (!c) return; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#0c0a12'; g.fillRect(0, 0, 600, 600);
  flushMap();
  const F = UIS.mapFocus, { span, s, ox, oy } = mapView(); // v84: 퀘스트 「지도에서 보기」는 목표를 가운데로
  g.drawImage(mapCv, ox, oy, span, span, 0, 0, 600, 600);
  const dot = (x, y, col, r) => { const X = (x - ox) * s, Y = (y - oy) * s; g.fillStyle = INK; g.beginPath(); g.arc(X, Y, r + 3, 0, 6.283); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(X, Y, r, 0, 6.283); g.fill(); };
  for (const m of mapMarks()) { if (m.k === 'warp' || m.k === 'portal') continue; const X = (m.x - ox) * s, Y = (m.y - oy) * s; if (X < -20 || Y < -20 || X > 620 || Y > 620) continue; markAt(g, m, X, Y); } // v95: 색 점 대신 아이콘
  // v89 워프포인트·포탈: 켜진 것은 어디든(세계 공용), 안 켜진 워프포인트는 밝힌 곳만 흐리게
  const WM = UIS.mapWarp; for (const e of liveWarps()) { const on = warpOn(e.o); if (!on && !G.explored[e.i]) continue; const X = (e.x + .5 - ox) * s, Y = (e.y + .5 - oy) * s; if (X < -20 || Y < -20 || X > 620 || Y > 620) continue;
    const F2 = SPR.warpF && SPR.warpF[e.o.t === 'portal' ? 'portal' : 'pt'], img = F2 ? (on ? F2.base[0] : F2.off) : null;
    if (e.i === WM) { g.fillStyle = 'rgba(127,224,181,.35)'; g.beginPath(); g.arc(X, Y, 22, 0, 6.283); g.fill(); }
    g.globalAlpha = on ? 1 : .55; if (img) { g.imageSmoothingEnabled = false; g.drawImage(img, X - 16, Y - 20, 32, 32); } else dot(e.x + .5, e.y + .5, e.o.t === 'portal' ? '#7fe8f0' : on ? '#c9a6ff' : '#6a5a80', 6); g.globalAlpha = 1;
    if (e.i === UIS.warpSel) { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(X, Y, 20, 0, 6.283); g.stroke(); g.strokeStyle = '#ffc861'; g.lineWidth = 4; g.beginPath(); g.arc(X, Y, 20, 0, 6.283); g.stroke(); } }
  { const N = navPt(); if (N) pinAt(g, (N.x - ox) * s, (N.y - oy) * s, NAV_COL); } // v95: 길 안내 중인 곳
  if (UIS.mapPin) pinAt(g, (UIS.mapPin.x - ox) * s, (UIS.mapPin.y - oy) * s, '#ffffff'); // v95: 지도에서 고른 곳
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

// ================= v95: 지도 아이콘·길 안내 =================
// 지도의 장소 표시(등불나무·침대·보스 …)를 지금 있는 그림으로 그려요(임시, 나중에 손그림으로 바꿀 수 있어요).
// 지도를 누르면 그 자리에 핀(UIS.mapPin)이 꽂히고 「위치 찾기」를 누르면 길 안내(화면 하늘색 화살표 + 남은 칸)가 시작돼요.
// 길 안내는 이 화면 것만이고 저장하지 않아요. 3칸 안에 오면 끝나요.
export const NAV_COL = '#7fd8ff', NAV_ARRIVE = 3;
const mkSummon = k => Object.keys(SUMMON).find(id => SUMMON[id][1] === k);
const mkIcon = id => (id && ITEMS[id] ? iconCanvas(id) : null);
const mkWarpImg = k => { const F = SPR.warpF && SPR.warpF[k]; return F ? F.base[0] : null; };
// 범례 순서 = 화면 순서. img(m)는 그 표시의 그림, col은 테두리 색
export const MK = {
  tree: { n: '등불나무', col: '#ffc861', img: () => mkIcon('lightSeed') },
  bed: { n: '침대', col: '#ff8fa3', img: () => mkIcon('bed') },
  boss: { n: '보스', col: '#86d96b', img: m => mkIcon(mkSummon((m && m.b) || 'slime')) },
  water: { n: '물', col: '#3f7fb5', img: null },
  altar: { n: '빛씨앗 제단', col: '#fff1b0', img: () => SPR.obj.shrine },
  fzone: { n: '꽃망울 구역', col: '#ff6b81', img: m => SPR.wild && SPR.wild[(m && m.c) || 'R'] },
  chest: { n: '찾았지만 안 연 보물상자', col: '#ffd25c', img: () => SPR.obj.tchest },
  bag: { n: '잃어버린 꾸러미', col: '#ff9b4a', img: () => SPR.obj.lostBag },
  back: { n: '귀환 표지', col: '#b99bff', img: () => mkIcon('homeStone') },
  warp: { n: '워프포인트', col: '#c9a6ff', img: () => mkWarpImg('pt') },
  portal: { n: '포탈', col: '#7fe8f0', img: () => mkWarpImg('portal') },
};
// 지금 지도에 보이는 장소 표시 (나·물 제외). 규칙은 v94까지의 색 점과 같아요
export function mapMarks() { const L = [], add = (k, x, y, ex) => L.push({ k, x, y, name: MK[k].n, ...ex });
  add('tree', CX + .5, CY);
  if (G.spawnPt) add('bed', G.spawnPt.x + .5, G.spawnPt.y + .5);
  for (const k of BKEYS) { const h = BOSSES[k].home(); if (!G.bossDead[k] && G.explored[idx(Math.floor(h.x), Math.floor(h.y))]) add('boss', h.x, h.y, { b: k, col: BOSSES[k].col, name: BOSSES[k].n }); }
  for (const sp of [SA, SB]) if (G.explored[idx(sp.x, sp.y)] && G.objs.get(idx(sp.x, sp.y))?.has) add('altar', sp.x + .5, sp.y + .5);
  for (const z of G.fzones || []) if (G.explored[idx(z.x, z.y)]) add('fzone', z.x + .5, z.y + .5, { c: z.c, col: FLOWERS[z.c][2], name: `${FLOWERS[z.c][1]} 꽃망울 구역` });
  if (mapChestOn()) for (const r of G.rooms || []) if (r.found && !r.open) add('chest', r.cx + .5, r.cy + .5, { name: '보물상자' });
  for (const [i, o] of G.objs) if (myBag(o)) add('bag', i % W + .5, ((i / W) | 0) + .5);
  if (G.backPt) add('back', G.backPt.x, G.backPt.y);
  for (const e of liveWarps()) { if (!warpOn(e.o) && !G.explored[e.i]) continue; add(e.o.t === 'portal' ? 'portal' : 'warp', e.x + .5, e.y + .5, { name: warpName(e) }); }
  return L; }
// 그림을 sz 상자 안에 비율 그대로
function mkFit(g, img, X, Y, sz) { const w = img.width, h = img.height, k = sz / Math.max(w, h); g.imageSmoothingEnabled = false; g.drawImage(img, Math.round(X - w * k / 2), Math.round(Y - h * k / 2), Math.round(w * k), Math.round(h * k)); }
function markAt(g, m, X, Y) { const D = MK[m.k], col = m.col || D.col, img = D.img && D.img(m);
  g.fillStyle = INK; g.beginPath(); g.arc(X, Y, 17, 0, 6.283); g.fill(); g.fillStyle = '#2a2236'; g.beginPath(); g.arc(X, Y, 14, 0, 6.283); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.arc(X, Y, 14, 0, 6.283); g.stroke();
  if (img) mkFit(g, img, X, Y, 22); else { g.fillStyle = col; g.beginPath(); g.arc(X, Y, 6, 0, 6.283); g.fill(); } }
function pinAt(g, X, Y, col) { if (X < -30 || Y < -40 || X > 630 || Y > 640) return; g.lineJoin = 'round';
  g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(X, Y); g.lineTo(X - 9, Y - 16); g.arc(X, Y - 22, 10, Math.PI * .8, Math.PI * .2); g.closePath(); g.stroke(); g.fill();
  g.fillStyle = INK; g.beginPath(); g.arc(X, Y - 22, 4, 0, 6.283); g.fill(); }
// 범례 아이콘 그림 (32×32, 한 번 만들어 둠)
const MK_URL = {};
export function markURL(k) { if (MK_URL[k]) return MK_URL[k]; const c = document.createElement('canvas'); c.width = c.height = 36; const g = c.getContext('2d'); markAt(g, { k }, 18, 18); return MK_URL[k] = c.toDataURL(); }
// 범례에서 고른 종류 중 내게 가장 가까운 곳 (지도에서 밝힌 곳만). 없으면 null
export function nearestMark(k) { const p = G.p; let best = null, bd = 1e9;
  if (k === 'water') { for (let i = 0; i < G.floor.length; i++) { if (!G.explored[i] || G.wall[i] || G.floor[i] !== WATER) continue; const x = i % W + .5, y = ((i / W) | 0) + .5, d = (x - p.x) ** 2 + (y - p.y) ** 2; if (d < bd) { bd = d; best = { k, x, y, name: '물' }; } } return best; }
  for (const m of mapMarks()) { if (m.k !== k) continue; const d = (m.x - p.x) ** 2 + (m.y - p.y) ** 2; if (d < bd) { bd = d; best = m; } } return best; }
// 지도를 누른 곳: 가까운 장소 표시(지도 그림 칸 28 안)가 있으면 거기로, 아니면 누른 칸
export function pinTapAt(el, clientX, clientY) { const r = el.getBoundingClientRect(); if (!r.width) return null; const X = (clientX - r.left) * 600 / r.width, Y = (clientY - r.top) * 600 / r.height, { s, ox, oy } = mapView();
  let best = null, bd = 28; for (const m of mapMarks()) { const d = Math.hypot((m.x - ox) * s - X, (m.y - oy) * s - Y); if (d < bd) { bd = d; best = m; } }
  if (best) return { x: best.x, y: best.y, name: best.name, k: best.k };
  const x = clamp(ox + X / s, 0, W - .01), y = clamp(oy + Y / s, 0, H - .01); return { x: Math.floor(x) + .5, y: Math.floor(y) + .5, name: '' }; }
let NAV = null; // { x, y, name, g } — g: 그 세계에서만 (새 게임·불러오기 하면 사라짐)
export const navPt = () => (NAV && NAV.g === G ? NAV : null);
export function setNav(t) { NAV = t ? { x: t.x, y: t.y, name: t.name || '', k: t.k || '', g: G } : null; }
export const navSame = (a, b) => !!a && !!b && Math.hypot(a.x - b.x, a.y - b.y) < .6;
// 화면 쪽 매 프레임: 3칸 안에 오면 길 안내 끝
export function navTick() { const n = navPt(); if (!n || !G.p || G.p.dead > 0) return; if (Math.hypot(n.x - G.p.x, n.y - G.p.y) <= NAV_ARRIVE) { NAV = null; toast(`${n.name || '고른 곳'}에 도착했어요`, 'good', 'navEnd'); } }
// 지도 창 아래: 고른 곳·길 안내 줄, 그리고 아이콘 범례 (아이콘을 누르면 가장 가까운 그곳을 지도 가운데에 두고 핀을 꽂아요)
export function navBarHTML() { const P = UIS.mapPin, N = navPt(), d = t => Math.round(Math.hypot(t.x - G.p.x, t.y - G.p.y));
  if (P) { const on = navSame(P, N); return `<div class="warpgo navgo"><span>${escHTML(P.name || '고른 곳')} · ${d(P)}칸</span><span class="navb">${on ? '<button class="btn ghost" data-a="navOff" type="button">길 안내 끄기</button>' : '<button class="btn" data-a="navGo" type="button">위치 찾기</button>'}<button class="btn ghost" data-a="pinClear" type="button" aria-label="고른 곳 지우기">×</button></span></div>`; }
  if (N) return `<div class="warpgo navgo"><span>길 안내 중 · ${escHTML(N.name || '고른 곳')} · ${d(N)}칸</span><span class="navb"><button class="btn ghost" data-a="navOff" type="button">끄기</button></span></div>`;
  return ''; } // v96: 설명 글은 가이드로
export function mapLegendHTML() { const have = new Set(mapMarks().map(m => m.k)), hasW = () => { for (let i = 0; i < G.floor.length; i++) if (G.explored[i] && !G.wall[i] && G.floor[i] === WATER) return true; return false; };
  const btn = k => { const ok = k === 'water' ? hasW() : have.has(k); return `<button class="lgbtn${ok ? '' : ' off'}" data-a="mapFind" data-i="${k}" type="button"><img class="px" src="${markURL(k)}" alt="">${MK[k].n}</button>`; };
  let h = `<div class="legend lgicons"><button class="lgbtn" data-a="mapMe" type="button"><i style="background:#7fe0b5"></i>나</button>`;
  for (const k in MK) { if (k === 'chest') continue; /* v111: 범례에서 뺌 (지도에는 그대로 보여요) */ h += btn(k); }
  if (UIS.mapFocus) h += '<span><i style="background:transparent;box-shadow:inset 0 0 0 3px #ffc861"></i>퀘스트 목표</span>';
  return h + '</div>'; }
