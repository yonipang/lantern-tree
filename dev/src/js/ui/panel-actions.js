import { setLightPref } from '../render/glight.js';
import { buildPlayer } from '../art/characters.js';
import { DUR } from '../data/circuits-regions.js';
import { JOB_MAX, TIMED } from '../data/farming-cooking.js';
import { EQ_N } from '../data/gear-animals.js';
import { HOT, RECIPES } from '../data/items.js';
import { ensureAudio, SFX } from '../engine/audio.js';
import { toast } from '../engine/effects.js';
import { rand } from '../engine/random.js';
import { clamp } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { resize, setZoomPref } from '../render/view.js';
import { G, newGame, setSound, setStarted, soundOn, started } from '../save/state.js';
import { applyImport, canDev, clearImport, CLOUD, cloudAuth, cloudKeepLocal, cloudTakePending, cloudUpload, DEV, devTap, exportSave, fbErr, pickSaveFile, pushBackup, saveLocal } from '../save/storage.js';
import { catchThrow } from '../sim/animals.js';
import { runCmd } from '../sim/commands.js';
import { canSalv, maxCraft, nearStations, salvGet2 } from '../sim/crafting.js';
import { upgOk } from '../sim/gear.js';
import { itemAt } from '../sim/inventory.js';
import { checkGuide } from '../sim/quests.js';
import { resetGoalText } from './feedback.js';
import { markInv, refreshHotbar } from './hud.js';
import { applyCtrl, ctrlPref, setCtrlPref } from './input.js';
import { mapChestOn, setMapChest } from './map.js';
import { closePanel, craftCtx, openPanel, panel, panelAt, renderPanel, UIS } from './panels.js';
export function onSheetClick(e) {
  if (performance.now() - DRAG.block < 400) return;
  if (performance.now() - panelAt < 450) return;
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, i = b.dataset.i != null ? (isNaN(+b.dataset.i) ? b.dataset.i : +b.dataset.i) : null;
  ensureAudio();
  if (a === 'close') { closePanel(); return; }
  if (a === 'bagNav') { if (panel && panel.kind !== i) openPanel(i, { nav: 1 }); return; } // v77: 가방 | 제작 탭
  if (a === 'inv') {
    UIS.trash = false; if (G.inv[i]) runCmd({ k: 'seenItem', id: G.inv[i].id }); // v77: 새 물건 표시는 한 번 누르면 꺼져요
    if (Number.isInteger(i) && i < HOT) runCmd({ k: 'selHot', i }); // v66 (BF-06): the hotbar slot picked here stays in hand after the bag closes
    if (UIS.invSel === null) { if (G.inv[i]) UIS.invSel = i; }
    else if (UIS.invSel === i) UIS.invSel = null;
    else { runCmd({ k: 'invSwap', a: UIS.invSel, b: i }); UIS.invSel = null; }
    markInv(); renderPanel(); return;
  }
  if (a === 'bagTab') { UIS.bagTab = i; UIS.invSel = null; renderPanel(); return; }
  if (a === 'stash') { if (!(panel && panel.kind === 'chest') || runCmd({ k: 'stash', o: panel.i, same: i === 'same' }) === false) return; renderPanel(); return; }
  if (a === 'sortBag') { runCmd({ k: 'sortBag' }); UIS.invSel = null; renderPanel(); return; }
  if (a === 'wearOn') { const k = UIS.invSel; if (k != null && G.inv[k]) runCmd({ k: 'wear', i: k }); UIS.invSel = null; renderPanel(); return; }
  if (a === 'eqSlot') { const sl = i; if (G.equip[sl]) runCmd({ k: 'unwear', sl }); else toast(`${EQ_N[sl]} 칸에 낄 장비는 가방에서 고르고 [입기]·[달기]를 눌러요`, null, 'eq'); renderPanel(); return; }
  if (a === 'catchThrow') { catchThrow(); return; }
  if (a === 'petOn') { if (runCmd({ k: 'pet', id: i }) === false) return; renderPanel(); return; }
  if (a === 'eqPick') { runCmd({ k: 'wear', i }); renderPanel(); return; }
  if (a === 'pouch') { if (G.tools[i]) runCmd({ k: 'seenItem', id: G.tools[i].id }); UIS.toolSel = UIS.toolSel === i ? null : i; UIS.invSel = null; UIS.trash = false; renderPanel(); return; } // v65 tool pouch
  if (a === 'holdTool') { const s = G.tools[UIS.toolSel]; if (s) { runCmd({ k: 'hold', i: UIS.toolSel }); SFX.click(); } UIS.toolSel = null; renderPanel(); return; }
  if (a === 'trashTool') { if (!UIS.trash) { UIS.trash = true; renderPanel(); return; } runCmd({ k: 'trashTool', i: UIS.toolSel }); UIS.toolSel = null; UIS.trash = false; renderPanel(); return; }
  if (a === 'eat') { runCmd({ k: 'eat', i: UIS.invSel }); if (!G.inv[UIS.invSel]) UIS.invSel = null; renderPanel(); return; }
  if (a === 'tohot') { runCmd({ k: 'toHot', i: UIS.invSel }); UIS.invSel = null; renderPanel(); return; }
  if (a === 'trash') { if (!UIS.trash) { UIS.trash = true; renderPanel(); return; } runCmd({ k: 'trash', i: UIS.invSel }); UIS.invSel = null; UIS.trash = false; renderPanel(); return; }
  if (a === 'tab') { if (UIS.tab !== i) UIS.tab2 = 'all'; UIS.tab = i; UIS.salvAsk = null; renderPanel(); return; }
  if (a === 'tab2') { UIS.tab2 = i; renderPanel(); return; }
  if (a === 'upg') { if (runCmd({ k: 'upg', i }) === false) return; renderPanel(); return; }
  if (a === 'salv') { const s = itemAt(i), got = s && (DUR[s.id] || upgOk(s.id)) && salvGet2(s); if (!got || !canSalv(nearStations())) return;
    if (UIS.salvAsk !== i) { UIS.salvAsk = i; renderPanel(); return; }
    UIS.salvAsk = null; runCmd({ k: 'salv', i }); renderPanel(); return; }
  if (a === 'fix') { if (runCmd({ k: 'fix', i }) === false) return; renderPanel(); return; }
  if (a === 'benchUp') { if (runCmd({ k: 'benchUp', o: panel && panel.i != null ? panel.i : null }) === false) return; UIS.craftOrder = null; renderPanel(); return; }
  if (a === 'jobTake') { runCmd({ k: 'jobTake', o: panel ? panel.i : null }); renderPanel(); return; }
  if (a === 'jobCancel') { if (!UIS.jobAsk) { UIS.jobAsk = true; renderPanel(); return; } UIS.jobAsk = false; runCmd({ k: 'jobCancel', o: panel ? panel.i : null }); renderPanel(); return; }
  if (a === 'qty') { const [ri, d] = String(i).split(':'), r = RECIPES[+ri], mx = Math.max(1, Math.min(TIMED[r.at] ? JOB_MAX : 99, maxCraft(r))), cur = clamp(UIS.qty[ri] || 1, 1, mx); UIS.qty[ri] = d === 'max' ? mx : clamp(cur + (+d), 1, mx); renderPanel(); return; }
  if (a === 'mapChest') { setMapChest(!mapChestOn()); try { localStorage.setItem('lantern-tree-map-chest', mapChestOn() ? '1' : '0'); } catch (_) { } renderPanel(); return; }
  if (a === 'mapzoom') { UIS.mapAll = !UIS.mapAll; renderPanel(); return; }
  if (a === 'craft') { // 제작 자리(어느 제작대 창인지)를 함께 보내요
    const res = runCmd({ k: 'craft', r: i, q: UIS.qty[i] || 1, st: craftCtx(), i: panel.i, tier: panel.tier }); if (res === false) return;
    if (res === 'reorder') UIS.craftOrder = null; renderPanel(); return;
  }
  if (a === 'retrieve') { runCmd({ k: 'retrieve', o: panel.i }); closePanel(); return; }
  if (a === 'cout' || a === 'cin') { if (runCmd({ k: 'chest', o: panel.i, i, out: a === 'cout' }) === false) return; renderPanel(); return; }
  if (a === 'qTab') { UIS.qTab = i; renderPanel(); return; }
  if (a === 'qClaim') { runCmd({ k: 'claim', id: i }); renderPanel(); return; }
  if (a === 'qClaimAll') { runCmd({ k: 'claimAll' }); renderPanel(); return; }
  if (a === 'statUp') { runCmd({ k: 'statUp', s: i }); UIS.statAsk = false; renderPanel(); return; }
  if (a === 'statReset') { if (!UIS.statAsk) { UIS.statAsk = true; renderPanel(); return; } runCmd({ k: 'statReset' }); UIS.statAsk = false; renderPanel(); return; }
  if (a === 'skUp') { if (runCmd({ k: 'skUp', s: i }) === false) return; renderPanel(); return; }
  if (a === 'skReset') { if (!UIS.skAsk) { UIS.skAsk = true; renderPanel(); return; } runCmd({ k: 'skReset' }); UIS.skAsk = false; renderPanel(); return; }
  if (a === 'skSlot') { const [id, n] = String(i).split(':'); if (runCmd({ k: 'skSlot', s: id, n: +n }) === false) return; renderPanel(); return; }
  if (a === 'save') { saveLocal(); return; }
  if (a === 'escape') { if (!UIS.confirmEsc) { UIS.confirmEsc = true; renderPanel(); return; } UIS.confirmEsc = false; closePanel(); if (runCmd({ k: 'escape' })) saveLocal(true); return; }
  if (a === 'qtShow') { UIS.qtShow = !UIS.qtShow; renderPanel(); return; }
  if (a === 'export') { exportSave(); return; }
  if (a === 'clGoogle') { cloudAuth('google'); return; }
  if (a === 'clEmailT') { UIS.clEmail = !UIS.clEmail; renderPanel(); return; }
  if (a === 'clIn') { cloudAuth('in'); return; }
  if (a === 'clUp') { cloudAuth('up'); return; }
  if (a === 'clOut') { CLOUD.api.out().then(() => toast('로그아웃했어요')).catch(e => toast(fbErr(e), 'warn')); return; }
  if (a === 'clUpNow') { cloudUpload(true, false); return; }
  if (a === 'clTake') { cloudTakePending(); return; }
  if (a === 'clKeep') { cloudKeepLocal(); return; }
  if (a === 'clPrev') { if (!UIS.prevAsk) { UIS.prevAsk = true; renderPanel(); return; } cloudTakePending(true); return; }
  if (a === 'openLook') { openPanel('look'); return; }
  if (a === 'lookTab') { UIS.lookTab = i; renderPanel(); return; }
  if (a === 'lookSet') { const [k, v] = String(i).split(':'); UIS.look[k] = ['hc', 'eye', 'oc'].includes(k) ? +v : v; SFX.click(); renderPanel(); return; }
  if (a === 'lookOk') { runCmd({ k: 'look', look: UIS.look }); saveLocal(true); closePanel(); return; }
  if (a === 'charSet' && i === 'custom') { openPanel('look'); return; }
  if (a === 'charSet') { if (runCmd({ k: 'char', c: i })) saveLocal(true); renderPanel(); return; }
  if (a === 'import') { pickSaveFile('menu'); return; }
  if (a === 'impYes') { applyImport(); return; }
  if (a === 'impNo') { clearImport(); renderPanel(); return; }
  if (a === 'devtap') { if (devTap()) { toast(DEV ? '개발자 모드를 켰어요' : '개발자 모드를 껐어요'); renderPanel(); } return; }
  if (a === 'markAdd' && canDev()) { runCmd({ k: 'markAdd' }); saveLocal(true); renderPanel(); return; }
  if (a === 'markDel' && canDev()) { runCmd({ k: 'markDel', i }); saveLocal(true); renderPanel(); return; }
  if (a === 'ctrl') { setCtrlPref(i === 'pad' ? 'pad' : 'joy'); try { localStorage.setItem('lantern-tree-ctrl', ctrlPref); } catch (e) { } applyCtrl(); renderPanel(); return; }
  if (a === 'light') { setLightPref(i); renderPanel(); return; } // v73: new light (GPU) or the old light
  if (a === 'zoom') { setZoomPref(i); try { localStorage.setItem('lantern-tree-zoom', i); } catch (e) { } resize(); renderPanel(); return; }
  if (a === 'sound') { setSound(!soundOn); try { localStorage.setItem('lantern-tree-sound', soundOn ? '1' : '0'); } catch (e) { } renderPanel(); return; }
  if (a === 'newgame') { if (!UIS.confirmNew) { UIS.confirmNew = true; renderPanel(); return; } saveLocal(true); pushBackup('처음부터 다시 하기 전'); { const keepC = G.char; newGame((rand() * 1e9) | 0); G.char = keepC; buildPlayer(0); } setStarted(true); closePanel(); markInv(); resetGoalText(); checkGuide(); saveLocal(true); toast('새로운 모험을 시작해요'); return; }
}
// ---- drag & drop between bag, hotbar and chest slots ----
export const DRAG = { st: null, block: 0 };
export function slotRef(el) {
  if (!el || !G) return null; const a = el.dataset.a, i = +el.dataset.i; if (!Number.isInteger(i)) return null;
  if (a === 'inv' || a === 'hot' || a === 'cin') return i < G.inv.length ? { arr: G.inv, o: null, i } : null;
  if (a === 'cout' && panel && panel.kind === 'chest') { const o = G.objs.get(panel.i); if (o && o.items && i < o.items.length) return { arr: o.items, o: panel.i, i }; }
  return null;
}
export function dragEnd(commit, e) {
  const D = DRAG.st; if (!D) return; DRAG.st = null;
  if (D.ghost) D.ghost.remove(); if (D.hb) D.hb.style.scrollBehavior = ''; D.el.classList.remove('dragging'); document.querySelectorAll('.slot.dropT').forEach(x => x.classList.remove('dropT'));
  if (D.mode) DRAG.block = performance.now();
  if (D.mode === 'drag' && commit && e) { const t = document.elementFromPoint(e.clientX, e.clientY), B = slotRef(t && t.closest('.slot[data-a]')), A = slotRef(D.el);
    if (A && B && A.arr[A.i] === D.item && runCmd({ k: 'move', a: { o: A.o, i: A.i }, b: { o: B.o, i: B.i } })) { UIS.invSel = null; UIS.trash = false; refreshHotbar(); if (panel) renderPanel(); } }
}
export function setupDrag() {
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
export function hotClick(i) {
  ensureAudio(); runCmd({ k: 'hot', i });
}

