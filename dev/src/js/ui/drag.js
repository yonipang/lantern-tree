// ---- drag & drop between bag, hotbar and chest slots ----
const DRAG = { st: null, block: 0 };
function slotRef(el) {
  if (!el || !G) return null; const a = el.dataset.a, i = +el.dataset.i; if (!Number.isInteger(i)) return null;
  if (a === 'inv' || a === 'hot' || a === 'cin') return i < G.inv.length ? { arr: G.inv, i } : null;
  if (a === 'cout' && panel && panel.kind === 'chest') { const o = G.objs.get(panel.i); if (o && o.items && i < o.items.length) return { arr: o.items, i }; }
  return null;
}
function moveSlot(A, B) {
  if (A.arr === B.arr && A.i === B.i) return false; const a = A.arr[A.i], b = B.arr[B.i]; if (!a) return false;
  if (b && a.id === b.id && b.c < stackMax(b.id)) { const k = Math.min(stackMax(b.id) - b.c, a.c); b.c += k; a.c -= k; if (!a.c) A.arr[A.i] = null; }
  else { A.arr[A.i] = b; B.arr[B.i] = a; }
  invDirty = true; SFX.place(); return true;
}
function dragEnd(commit, e) {
  const D = DRAG.st; if (!D) return; DRAG.st = null;
  if (D.ghost) D.ghost.remove(); if (D.hb) D.hb.style.scrollBehavior = ''; D.el.classList.remove('dragging'); document.querySelectorAll('.slot.dropT').forEach(x => x.classList.remove('dropT'));
  if (D.mode) DRAG.block = performance.now();
  if (D.mode === 'drag' && commit && e) { const t = document.elementFromPoint(e.clientX, e.clientY), B = slotRef(t && t.closest('.slot[data-a]')), A = slotRef(D.el);
    if (A && B && A.arr[A.i] === D.item && moveSlot(A, B)) { UIS.invSel = null; UIS.trash = false; refreshHotbar(); if (panel) renderPanel(); } }
}
function setupDrag() {
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => { if (e.target.closest && e.target.closest('.slot, #hotbar, #sheet')) e.preventDefault(); });
  document.addEventListener('pointerdown', e => {
    if (DRAG.st || !G || !started || (e.pointerType === 'mouse' && e.button !== 0)) return; const el = e.target.closest && e.target.closest('.slot[data-a]'); if (!el) return;
    const A = slotRef(el), item = A && A.arr[A.i]; if (!item && !(e.pointerType !== 'mouse' && (el.closest('.sh-body') || el.closest('#hbSlots')))) return;
    DRAG.st = { el, item, x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, mode: null, touch: e.pointerType !== 'mouse', body: el.closest('.sh-body'), hb: el.closest('#hbSlots'), sy: 0, sx: 0 };
  }, true);
  window.addEventListener('pointermove', e => {
    const D = DRAG.st; if (!D || e.pointerId !== D.id) return; const dx = e.clientX - D.x, dy = e.clientY - D.y;
    if (!D.mode && Math.hypot(dx, dy) > 7) {
      if (D.touch && D.body && performance.now() - D.t < 260 && Math.abs(dy) > Math.abs(dx)) { D.mode = 'scroll'; D.sy = D.body.scrollTop; }
      else if (D.touch && D.hb && performance.now() - D.t < 260 && Math.abs(dx) >= Math.abs(dy)) { D.mode = 'hscroll'; D.sx = D.hb.scrollLeft; D.hb.style.scrollBehavior = 'auto'; }
      else if (!D.item) { D.mode = 'none'; }
      else { D.mode = 'drag'; D.el.classList.add('dragging'); const g = document.createElement('img'); g.id = 'dragGhost'; g.className = 'px'; g.alt = ''; g.src = iconURL(D.item.id); document.body.appendChild(g); D.ghost = g; }
    }
    if (D.mode === 'scroll') D.body.scrollTop = D.sy - dy;
    else if (D.mode === 'hscroll') D.hb.scrollLeft = D.sx - dx;
    else if (D.mode === 'drag') { D.lx = e.clientX; D.ly = e.clientY; if (D.body && !D.raf) { const step = () => { if (DRAG.st !== D) return; const r = D.body.getBoundingClientRect(); if (D.ly < r.top + 44) D.body.scrollTop -= 9; else if (D.ly > r.bottom - 44) D.body.scrollTop += 9; D.raf = requestAnimationFrame(step); }; D.raf = requestAnimationFrame(step); }
      D.ghost.style.left = e.clientX + 'px'; D.ghost.style.top = e.clientY + 'px'; const t = document.elementFromPoint(e.clientX, e.clientY), tEl = t && t.closest('.slot[data-a]');
      document.querySelectorAll('.slot.dropT').forEach(x => { if (x !== tEl) x.classList.remove('dropT'); }); if (tEl && tEl !== D.el && slotRef(tEl)) tEl.classList.add('dropT'); }
  });
  window.addEventListener('pointerup', e => { if (DRAG.st && e.pointerId === DRAG.st.id) dragEnd(true, e); });
  window.addEventListener('pointercancel', e => { if (DRAG.st && e.pointerId === DRAG.st.id) dragEnd(false); });
}
function sortBag() { // merge stacks and order the bag by kind; the hotbar stays as the player set it
  const items = G.inv.slice(HOT).filter(Boolean), merged = [];
  for (const it of items) { const mx = stackMax(it.id); if (DUR[it.id]) { merged.push(it); continue; } let left = it.c; for (const m of merged) if (m.id === it.id && m.c < mx && left) { const k = Math.min(mx - m.c, left); m.c += k; left -= k; } if (left) merged.push({ ...it, c: left }); }
  const catOrd = { equip: 0, food: 1, mat: 2, seed: 3, deco: 4 }, ord = Object.keys(ITEMS);
  merged.sort((a, b) => catOrd[bagCat(a.id)] - catOrd[bagCat(b.id)] || ord.indexOf(a.id) - ord.indexOf(b.id) || b.c - a.c);
  for (let j = HOT; j < G.inv.length; j++) G.inv[j] = merged[j - HOT] || null;
  UIS.invSel = null; invDirty = true;
}
function hotClick(i) {
  ensureAudio();
  if (G.sel === i) { const s = G.inv[i]; if (s && ITEMS[s.id].kind === 'food') eat(i); else if (s && ITEMS[s.id].kind === 'wear') wearItem(i); }
  G.sel = i; invDirty = true;
}

