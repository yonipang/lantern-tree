// ================= v91·v92 건축 모드 (화면): 켜고 끄기, 아래 건축 목록, 화면 누르기·끌기로 놓기, 「놓기」 버튼(앞 칸), 미리보기, v92 놓기/옮기기/뜯기 고르기·되돌리기 =================
// 규칙은 sim/buildmode.js (명령 'bplace'·'bmove'·'btake'·'bundo'). 기획: dev/design/건축모드.md
import { ITEMS, OBJ } from '../data/items.js';
import { ensureAudio } from '../engine/audio.js';
import { toast } from '../engine/effects.js';
import { $, clamp, josa } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { ctx, cv, DPR, LIFT, pxFont, pxText, TP, VIEW } from '../render/view.js';
import { G, paused, started } from '../save/state.js';
import { DIRN, rotN, rotOf } from '../sim/building.js';
import { BM_CATS, BM_MAX, bmAnchor, bmDrag, bmFp, bmList, bmMoveWhy, bmObjAt, bmTakeAt, bmUndoKind, bmWhy, BM_REACH, canMoveObj, moveAnchor, moveFp } from '../sim/buildmode.js';
import { fpOf } from '../world/tiles.js';
import { onEvent } from '../sim/events.js';
import { onlyMe } from './feedback.js';
import { command, joyEnd, placeJoyIdle } from './input.js';
import { canDev } from '../save/storage.js';
import { closePanel, panel } from './panels.js';
import { idx, inB } from '../world/map.js';
export const BM = { on: false, cat: 'wall', id: null, rot: 0, drag: null, list: [], sup: 0, hover: null, tool: 'place', grab: null };
const TOOLS = [['place', '놓기', '1'], ['move', '옮기기', '2'], ['take', '뜯기', '3']];
export function bmOpen() { if (!started || !G || G.p.dead > 0) return; if (panel) closePanel(); ensureAudio();
  BM.on = true; BM.drag = null; BM.tool = 'place'; BM.grab = null; document.body.classList.add('building'); $('#bmBar').hidden = $('#bmTop').hidden = false; joyEnd(); bmRender(); placeJoyIdle(); }
export function bmClose() { if (!BM.on) return; BM.on = false; BM.drag = null; BM.hover = null; BM.grab = null; document.body.classList.remove('building'); $('#bmBar').hidden = $('#bmTop').hidden = true; $('#bmPut').hidden = $('#bmRot').hidden = true; joyEnd(); placeJoyIdle(); }
export const bmToggle = () => BM.on ? bmClose() : bmOpen();
export const bmEsc = () => { if (BM.grab) { BM.grab = null; bmRender(); } else bmClose(); }; // v92: 잡은 물건이 있으면 먼저 놓아 줘요
const entry = id => BM.list.find(e => e.id === id);
// 고른 것으로 몇 칸을 놓을 수 있는지 (가진 것 + 재료로 만들 수 있는 것) — 미리보기에서 넘치는 칸은 빨갛게
function supply(e) { if (!e) return 0; if (e.have) return e.have; if (!e.r || !e.can) return 0; return BM_MAX; }
export function bmRender() { if (!BM.on || !G) return;
  BM.list = bmList(); const inCat = BM.list.filter(e => e.cat === BM.cat);
  if (!BM.id || !entry(BM.id)) BM.id = (inCat.find(e => e.can) || inCat[0] || {}).id || null;
  const sel = entry(BM.id); BM.sup = supply(sel); if (sel && BM.rot && rotN(ITEMS[sel.base].obj) < 2) BM.rot = 0;
  const cnt = c => BM.list.filter(e => e.cat === c).length, undo = bmUndoKind();
  let h = `<div class="bm-tools">${TOOLS.map(([k, n, key]) => `<button type="button" class="${BM.tool === k ? 'on' : ''}" data-bt="${k}">${n}<i class="k"> ${key}</i></button>`).join('')}<button type="button" class="undo" data-bu="1"${undo ? '' : ' disabled'}>되돌리기<i class="k"> Ctrl+&#90;</i></button></div>`;
  if (BM.tool !== 'place') { gripCheck(); const g = BM.grab && G.objs.get(idx(BM.grab.x, BM.grab.y));
    h += `<div class="bm-info">${BM.tool === 'take' ? '<span>직접 놓은 것을 누르거나 끌어 뜯어요</span>' : g ? `<b>${OBJ[g.t].n}</b> <span>옮길 자리를 누르세요</span>` : '<span>옮길 물건을 누르세요</span>'}</div>`;
    $('#bmBar').innerHTML = h; $('#bmRot').hidden = !(g && rotN(g.t) > 1); $('#bmPut').hidden = false; $('#bmPut').textContent = BM.tool === 'take' ? '뜯기' : g ? '내려놓기' : '잡기';
    document.body.style.setProperty('--bmH', Math.round($('#bmBar').getBoundingClientRect().height + (document.body.classList.contains('touch') ? 0 : 8)) + 'px'); placeJoyIdle(); return; }
  h += `<div class="bm-info">${sel ? `<b>${ITEMS[sel.base].n}</b>${sel.id !== sel.base ? ' <span>바닥으로</span>' : ''} ${sel.have ? `× ${sel.have} <span>가방 ${sel.bag} · 상자 ${sel.box}</span>` : sel.can ? `<span class="mk">만들어서 놓기</span> <span>${sel.r.req.map(([m, c]) => ITEMS[m].n + ' ' + c).join(' · ')}</span>` : `<span class="no">재료가 모자라요 · ${sel.r.req.map(([m, c]) => ITEMS[m].n + ' ' + c).join(' · ')}</span>`}` : '<span>놓을 것이 없어요</span>'}</div>`;
  h += `<div class="bm-tabs">${BM_CATS.filter(([c]) => c !== 'deco' || canDev()).map(([c, n]) => `<button type="button" class="${BM.cat === c ? 'on' : ''}${cnt(c) ? '' : ' empty'}" data-bc="${c}">${n}</button>`).join('')}</div><div class="bm-slots">`;
  for (const e of inCat) h += `<button type="button" class="slot${e.id === BM.id ? ' pick' : ''}${e.can ? '' : ' dim'}${e.have ? '' : ' mk'}" data-bi="${e.id}" aria-label="${ITEMS[e.base].n}"><img class="px" src="${iconURL(e.base)}" alt=""><span class="cnt">${e.have > 1 ? e.have : ''}</span></button>`;
  if (!inCat.length) h += `<p class="bm-none">이 칸에 놓을 것이 없어요</p>`;
  $('#bmBar').innerHTML = h + '</div>';
  $('#bmRot').hidden = !(sel && rotN(ITEMS[sel.base].obj) > 1); $('#bmPut').hidden = !sel; $('#bmPut').textContent = '놓기';
  document.body.style.setProperty('--bmH', Math.round($('#bmBar').getBoundingClientRect().height + (document.body.classList.contains('touch') ? 0 : 8)) + 'px'); placeJoyIdle(); }
onEvent('inv', onlyMe(() => { if (BM.on) bmRender(); }));
onEvent('fade', onlyMe(m => { if (m === 'faint' || m === 'show') bmClose(); })); // 기절하면 건축 끝
export function bmRotate() { let n; if (BM.tool === 'move') { const g = grabbed(); if (!g) return; n = rotN(g.o.t); } else if (BM.tool === 'place') { const e = entry(BM.id); if (!e) return; n = rotN(ITEMS[e.base].obj); } else return; if (n < 2) return; BM.rot = (BM.rot + 1) % n;
  toast(n === 4 ? `${josa(DIRN[BM.rot], '을', '를')} 보게 놓아요` : BM.rot ? '옆으로 돌려 놓아요' : '정면으로 놓아요'); }
// ---- v92 놓기·옮기기·뜯기 고르기, 잡은 물건 ----
export function bmTool(k) { if (!BM.on || !TOOLS.some(t => t[0] === k)) return; BM.tool = k; BM.grab = null; BM.drag = null; if (k === 'place') BM.rot = 0; bmRender(); }
const grabbed = () => { if (!BM.grab || !G) return null; const a = bmObjAt(BM.grab.x, BM.grab.y); return a && a.o === BM.grab.o ? a : null; };
function gripCheck() { if (BM.grab && !grabbed()) BM.grab = null; } // 잡은 물건이 없어졌으면(다른 사람이 뜯음 등) 놓아 줘요
function grabAt(t) { const a = bmObjAt(t.x, t.y); if (!a) { toast('옮길 물건이 없어요'); return false; } if (!canMoveObj(a.o)) { toast('옮길 수 없는 물건이에요'); return false; }
  BM.grab = { x: a.x, y: a.y, o: a.o }; BM.rot = rotOf(a.o); bmRender(); return true; }
function moveTo(a, t) { const ok = command({ k: 'bmove', from: [a.x, a.y], to: [t.x, t.y], rot: BM.rot }); if (ok) BM.grab = null; bmRender(); return ok; }
export const bmUndo = () => { if (!BM.on || !G || G.p.dead > 0) return; command({ k: 'bundo' }); BM.grab = null; bmRender(); };
export function bmPick(d) { const l = BM.list.filter(e => e.cat === BM.cat); if (!l.length) return; const k = l.findIndex(e => e.id === BM.id); BM.id = l[(k + d + l.length) % l.length].id; bmRender(); }
// ---- 화면 칸 고르기 ----
export function tileAt(cx, cy) { const mx = (cx * DPR + VIEW.baseX) / TP, my = (cy * DPR + VIEW.baseY) / TP; let tx = Math.floor(mx), ty = Math.floor(my);
  if (!(inB(tx, ty) && G.wall[idx(tx, ty)])) { const lf = LIFT / 16; for (let r = ty + 1; r <= ty + Math.ceil(lf); r++) if (inB(tx, r) && G.wall[idx(tx, r)] && my >= r - lf) { ty = r; break; } } // 벽 윗면을 누르면 그 벽 칸
  return { x: tx, y: ty }; }
// 앞 칸 (「놓기」 버튼): 보는 쪽으로 한 칸
export function frontTile() { const p = G.p, f = p.face || { x: 0, y: 1 }, px = Math.floor(p.x), py = Math.floor(p.y);
  return Math.abs(f.x) >= Math.abs(f.y) ? { x: px + Math.sign(f.x || 1), y: py } : { x: px, y: py + Math.sign(f.y) }; }
function lineTo(path, b) { const a = path[path.length - 1]; if (!a) { path.push(b); return; } let x = a.x, y = a.y;
  while ((x !== b.x || y !== b.y) && path.length < BM_MAX) { const dx = b.x - x, dy = b.y - y; if (Math.abs(dx) >= Math.abs(dy)) x += Math.sign(dx); else y += Math.sign(dy); path.push({ x, y }); } }
// 끌기 모양: 바닥은 네모, 벽·울타리·빛뿌리는 지나간 길, 그 밖은 마지막 칸
export function dragCells() { const d = BM.drag; if (!d || (BM.tool === 'place' && !BM.id)) return []; const m = BM.tool === 'take' ? 'rect' : BM.tool === 'move' ? 'one' : bmDrag(BM.id);
  if (m === 'one') return [d.b]; if (m === 'line') return d.path.slice(0, BM_MAX);
  const out = [], x0 = Math.min(d.a.x, d.b.x), x1 = Math.max(d.a.x, d.b.x), y0 = Math.min(d.a.y, d.b.y), y1 = Math.max(d.a.y, d.b.y);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { out.push({ x, y }); } out.sort((p, q) => Math.hypot(p.x - d.a.x, p.y - d.a.y) - Math.hypot(q.x - d.a.x, q.y - d.a.y)); return out.slice(0, BM_MAX); }
const overUI = (cx, cy) => { for (const s of ['#bmBar', '#bmTop', '#bmPut', '#bmRot']) { const e = $(s); if (!e || e.hidden) continue; const r = e.getBoundingClientRect(); if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return true; } return inJoyZone(cx, cy); };
export function bmDown(e) { if ((BM.tool === 'place' && !BM.id) || paused) return; const t = tileAt(e.clientX, e.clientY); BM.drag = { id: e.pointerId, a: t, b: t, path: [t] }; try { cv.setPointerCapture(e.pointerId); } catch (_) { } }
export function bmMove(e) { const d = BM.drag; if (e.pointerType === 'mouse') BM.hover = tileAt(e.clientX, e.clientY); if (!d || e.pointerId !== d.id) return; const t = tileAt(e.clientX, e.clientY); if (t.x === d.b.x && t.y === d.b.y) return; d.b = t; lineTo(d.path, t); }
export function bmUp(e) { const d = BM.drag; if (!d || e.pointerId !== d.id) return; BM.drag = null;
  if (e.type === 'pointercancel' || overUI(e.clientX, e.clientY)) return; // 목록·조이스틱 위에서 떼면 취소
  if (BM.tool === 'move') { const g = grabbed();
    if (g) { const o = bmObjAt(d.b.x, d.b.y); if (o && o.o === g.o && d.a.x === d.b.x && d.a.y === d.b.y) { BM.grab = null; bmRender(); return; } moveTo(g, d.b); return; }
    const a = bmObjAt(d.a.x, d.a.y); if (a && canMoveObj(a.o) && (d.a.x !== d.b.x || d.a.y !== d.b.y)) { BM.rot = rotOf(a.o); moveTo(a, d.b); return; } // 물건에서 끌어 바로 옮기기
    grabAt(d.b); return; }
  BM.drag = d; const cells = dragCells(); BM.drag = null; send(cells); }
function send(cells) { if (!cells.length) return; if (BM.tool === 'take') { command({ k: 'btake', cells: cells.map(c => [c.x, c.y]) }); return; }
  if (!BM.id) return; command({ k: 'bplace', id: BM.id, rot: BM.rot, cells: cells.map(c => [c.x, c.y]) }); bmRender(); }
export const bmPutFront = () => { if (!BM.on || !G || G.p.dead > 0) return; const f = frontTile();
  if (BM.tool === 'move') { const g = grabbed(); if (g) moveTo(g, f); else grabAt(f); return; } send([f]); };
// ---- 폰 조이스틱: 건축 중에는 왼쪽 아래(목록 바로 위)에서만 ----
export function joyZone() { const bar = $('#bmBar'), bh = bar && !bar.hidden ? bar.getBoundingClientRect().height : 0; return { x: 76, y: innerHeight - bh - 76, r: 72 }; }
export const inJoyZone = (cx, cy) => { if (!BM.on || !document.body.classList.contains('touch')) return false; const z = joyZone(); return Math.hypot(cx - z.x, cy - z.y) <= z.r; };
// ---- 미리보기 (render/world.js renderOverlay에서 화면 좌표로) ----
export function drawBuild(T, camX, camY) { if (!BM.on || !G || G.p.dead > 0) return; const p = G.p, px = Math.floor(p.x), py = Math.floor(p.y), zz = T / 16, L = LIFT * zz;
  ctx.save(); ctx.setLineDash([4 * zz, 3 * zz]); ctx.strokeStyle = 'rgba(255,241,214,.45)'; ctx.lineWidth = zz; // 놓을 수 있는 거리 8칸
  ctx.strokeRect((px - BM_REACH) * T - camX + .5, (py - BM_REACH) * T - camY + .5, (BM_REACH * 2 + 1) * T - 1, (BM_REACH * 2 + 1) * T - 1); ctx.setLineDash([]);
  const touch = document.body.classList.contains('touch'), here = touch ? frontTile() : BM.hover;
  if (BM.tool !== 'place') { drawEdit(T, camX, camY, here, touch); ctx.restore(); return; }
  const cells = BM.drag ? dragCells() : BM.id ? [here].filter(Boolean) : [];
  const soft = !BM.drag; let used = 0;
  for (const c of cells) { if (!BM.id) break; const why = bmWhy(BM.id, c.x, c.y, BM.rot); const ok = !why && used < BM.sup; if (ok) used++;
    const fp = bmFp(BM.id, BM.rot), a = fp[0] * fp[1] > 1 ? bmAnchor(BM.id, c.x, c.y, BM.rot) : c, wall = inB(a.x, a.y) && G.wall[idx(a.x, a.y)] && fp[0] * fp[1] === 1;
    const X = a.x * T - camX, Y = a.y * T - camY - (wall ? L : 0), w = fp[0] * T, h = fp[1] * T;
    ctx.fillStyle = ok ? `rgba(95,208,122,${soft ? .25 : .45})` : `rgba(224,90,80,${soft ? .25 : .45})`; ctx.fillRect(X, Y, w, h);
    ctx.strokeStyle = ok ? 'rgba(200,255,210,.9)' : 'rgba(255,190,180,.9)'; ctx.lineWidth = zz; ctx.strokeRect(X + zz / 2, Y + zz / 2, w - zz, h - zz); }
  if (BM.drag && cells.length > 1) { ctx.font = pxFont(6.2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; pxText(`${used} / ${cells.length}`, clamp((BM.drag.b.x + .5) * T - camX, 30, ctx.canvas.width - 30), BM.drag.b.y * T - camY - 6 * zz, '#fff', '#000'); }
  ctx.restore(); }
// v92 옮기기·뜯기 미리보기: 뜯을 것은 주황, 못 뜯는 칸은 옅은 빨강 / 잡은 물건은 노란 테두리, 옮길 자리는 초록·빨강
function bmBox(T, camX, camY, x, y, w, h, fill, line, lift) { const zz = T / 16, X = x * T - camX, Y = y * T - camY - (lift || 0);
  ctx.fillStyle = fill; ctx.fillRect(X, Y, w * T, h * T); ctx.strokeStyle = line; ctx.lineWidth = zz; ctx.strokeRect(X + zz / 2, Y + zz / 2, w * T - zz, h * T - zz); }
function drawEdit(T, camX, camY, here, touch) { const L = LIFT * T / 16, soft = !BM.drag;
  if (BM.tool === 'take') { const cells = BM.drag ? dragCells() : [here].filter(Boolean), seen = new Set(); let n = 0;
    for (const c of cells) { const t = bmTakeAt(c.x, c.y); if (t.why) { if (!soft) bmBox(T, camX, camY, c.x, c.y, 1, 1, 'rgba(224,90,80,.18)', 'rgba(255,190,180,.5)'); else bmBox(T, camX, camY, c.x, c.y, 1, 1, 'rgba(224,90,80,.2)', 'rgba(255,190,180,.8)', inB(c.x, c.y) && G.wall[idx(c.x, c.y)] ? L : 0); continue; }
      const key = t.k === 'obj' ? 'o' + t.i : t.k + t.i; if (seen.has(key)) continue; seen.add(key); n++;
      const fp = t.k === 'obj' ? fpOf(t.o) : [1, 1]; bmBox(T, camX, camY, t.x, t.y, fp[0], fp[1], `rgba(240,150,60,${soft ? .3 : .5})`, 'rgba(255,220,170,.95)', t.k === 'wall' ? L : 0); }
    if (BM.drag && cells.length > 1) { ctx.font = pxFont(6.2); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; pxText(`뜯기 ${n}`, clamp((BM.drag.b.x + .5) * T - camX, 30, ctx.canvas.width - 30), BM.drag.b.y * T - camY - 6 * T / 16, '#fff', '#000'); }
    return; }
  // 옮기기
  const g = grabbed();
  if (!g) { const a0 = BM.drag ? bmObjAt(BM.drag.a.x, BM.drag.a.y) : null;
    if (a0 && canMoveObj(a0.o) && BM.drag && (BM.drag.a.x !== BM.drag.b.x || BM.drag.a.y !== BM.drag.b.y)) { dest(T, camX, camY, a0, BM.drag.b, rotOf(a0.o)); return; }
    const t = BM.drag ? BM.drag.b : here; if (!t) return; const a = bmObjAt(t.x, t.y); if (!a) return; const fp = fpOf(a.o);
    bmBox(T, camX, camY, a.x, a.y, fp[0], fp[1], canMoveObj(a.o) ? 'rgba(255,214,90,.25)' : 'rgba(224,90,80,.2)', canMoveObj(a.o) ? 'rgba(255,230,150,.95)' : 'rgba(255,190,180,.8)'); return; }
  const fp = fpOf(g.o); bmBox(T, camX, camY, g.x, g.y, fp[0], fp[1], 'rgba(255,214,90,.2)', 'rgba(255,230,150,.95)');
  const t = BM.drag ? BM.drag.b : here; if (t) dest(T, camX, camY, g, t, BM.rot); }
function dest(T, camX, camY, a, t, rot) { const why = bmMoveWhy(a, t.x, t.y, rot), fp = moveFp(a.o, rot), an = moveAnchor(a.o, t.x, t.y, rot);
  bmBox(T, camX, camY, an.x, an.y, fp[0], fp[1], why ? 'rgba(224,90,80,.4)' : 'rgba(95,208,122,.4)', why ? 'rgba(255,190,180,.9)' : 'rgba(200,255,210,.9)'); }
// ---- 목록·버튼 누르기 ----
export function setupBuild() {
  $('#bmBar').addEventListener('click', e => { const t = e.target.closest('[data-bc]'), s = e.target.closest('[data-bi]');
    const tl = e.target.closest('[data-bt]'), u = e.target.closest('[data-bu]'); if (tl) { bmTool(tl.dataset.bt); return; } if (u) { bmUndo(); return; }
    if (t) { BM.cat = t.dataset.bc; BM.id = null; BM.rot = 0; bmRender(); } else if (s) { if (BM.id !== s.dataset.bi) BM.rot = 0; BM.id = s.dataset.bi; bmRender(); } });
  $('#bmDone').addEventListener('click', () => bmClose());
  $('#bmRot').addEventListener('click', () => bmRotate());
  $('#bmPut').addEventListener('pointerdown', e => { e.preventDefault(); bmPutFront(); });
}
