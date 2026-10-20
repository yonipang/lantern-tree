import { setLightPref } from '../render/glight.js';
import { buildPlayer } from '../art/characters.js';
import { DUR } from '../data/circuits-regions.js';
import { JOB_MAX, TIMED } from '../data/farming-cooking.js';
import { EQ_N } from '../data/gear-animals.js';
import { HOT, RECIPES } from '../data/items.js';
import { ensureAudio, SFX } from '../engine/audio.js';
import { toast } from '../engine/effects.js';
import { rand } from '../engine/random.js';
import { $, clamp, roJosa } from '../engine/util.js';
import { iconURL } from '../render/icons.js';
import { resize, setZoomPref } from '../render/view.js';
import { G, newGame, setSound, setStarted, soundOn, started } from '../save/state.js';
import { applyImport, canDev, clearImport, CLOUD, cloudAuth, cloudKeepLocal, cloudTakePending, cloudUpload, DEV, devTap, exportSave, fbErr, pickSaveFile, pushBackup, saveLocal } from '../save/storage.js';
import { catchThrow } from '../sim/animals.js';
import { runCmd } from '../sim/commands.js';
import { canSalv, maxCraft, nearStations, salvGet2 } from '../sim/crafting.js';
import { upgOk } from '../sim/gear.js';
import { itemAt } from '../sim/inventory.js';
import { checkGuide, questById, questGo } from '../sim/quests.js';
import { resetGoalText } from './feedback.js';
import { markInv, refreshHotbar } from './hud.js';
import { applyCtrl, ctrlPref, setCtrlPref } from './input.js';
import { MAP_NEAR, mapChestOn, mapDragged, mapIsAll, mapMax, mapMove, mapSet, mapView, NAV_ARRIVE, navSame, nearestMark, pinTapAt, setMapChest, setNav, warpTapAt } from './map.js';
import { H, W } from '../world/map.js';
import { closePanel, craftCtx, openPanel, panel, panelAt, renderPanel, UIS } from './panels.js';
import { bmOpen } from './build.js';
import { isNewCell, pouchOpen, setPouchOpen } from './panels-char.js';
import { typeTap } from './talk.js';
export function onSheetClick(e) {
  if (performance.now() - DRAG.block < 400) return;
  if (performance.now() - panelAt < 450) return;
  const b = e.target.closest('[data-a]'); if (typeTap(e, b)) return; /* v117 말하는 창: 빨리감기·다음 */ if (!b) return; const a = b.dataset.a, i = b.dataset.i != null ? (isNaN(+b.dataset.i) ? b.dataset.i : +b.dataset.i) : null;
  ensureAudio();
  if (a === 'close') { closePanel(); return; }
  if (a === 'bagNav') { if (panel && panel.kind !== i) openPanel(i, { nav: 1 }); return; } // v77: 가방 | 제작 탭
  if (a === 'inv') {
    UIS.trash = false; UIS.toolSel = null; if (G.inv[i]) runCmd({ k: 'seenItem', id: G.inv[i].id }); // v77: 새 물건 표시는 한 번 누르면 꺼져요
    if (Number.isInteger(i) && i < HOT) runCmd({ k: 'selHot', i }); // v66 (BF-06): the hotbar slot picked here stays in hand after the bag closes
    if (UIS.invSel === null) { if (G.inv[i]) UIS.invSel = i; }
    else if (UIS.invSel === i) UIS.invSel = null;
    else { runCmd({ k: 'invSwap', a: UIS.invSel, b: i }); UIS.invSel = null; }
    markInv(); renderPanel(); return;
  }
  if (a === 'bagTab') { UIS.bagTab = i; UIS.invSel = null; renderPanel(); return; }
  if (a === 'stash') { if (!(panel && panel.kind === 'chest') || runCmd({ k: 'stash', o: panel.i, same: i === 'same' }) === false) return; renderPanel(); return; }
  if (a === 'buildMode') { bmOpen(); return; } // v91 건축 모드
  if (a === 'sortBag') { runCmd({ k: 'sortBag' }); UIS.invSel = null; renderPanel(); return; }
  if (a === 'wearOn') { const k = UIS.invSel; if (k != null && G.inv[k]) runCmd({ k: 'wear', i: k }); UIS.invSel = null; renderPanel(); return; }
  if (a === 'chTab') { UIS.chTab = i; UIS.chSlot = null; renderPanel(); return; } // v83: 캐릭터 창 탭 장비 / 스킬 / 등불
  if (a === 'chSlot') { UIS.chSlot = UIS.chSlot === i ? null : i; if (UIS.chSlot && isNewCell(UIS.chSlot)) toast('아직 넣을 수 있는 물건이 없어요', null, 'eqnew'); renderPanel(); return; }
  if (a === 'eqSet') { runCmd({ k: 'eqSet', n: +i }); renderPanel(); return; } // v83: 장비 세트 I·II·III
  if (a === 'stashNear') { runCmd({ k: 'stashNear' }); UIS.invSel = null; UIS.toolSel = null; markInv(); renderPanel(); return; } // v83: 가까운 상자에 넣기
  if (a === 'pouchFold') { setPouchOpen(!pouchOpen()); UIS.toolSel = null; renderPanel(); return; } // v83: 도구 주머니 접기 (기억해요)
  if (a === 'eqSlot') { const sl = i; if (G.equip[sl]) runCmd({ k: 'unwear', sl }); else toast(`${EQ_N[sl]} 칸에 낄 장비는 캐릭터 창 장비 탭에서 칸을 누르고 골라요`, null, 'eq'); renderPanel(); return; }
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
  if (a === 'mapzoom') { const F = UIS.mapFocus, c = F || G.p; mapSet(mapIsAll() ? { cx: c.x, cy: c.y, span: MAP_NEAR } : { cx: W / 2, cy: H / 2, span: mapMax() }); renderPanel(); return; } // v94: 전체 ↔ 가까이(90칸)
  if (a === 'mapZ') { mapMove(i > 0 ? 1.5 : 1 / 1.5, 300, 300); renderPanel(); return; } // v94: + − 버튼은 가운데를 기준으로
  if (a === 'mapMe') { mapSet({ cx: G.p.x, cy: G.p.y, span: mapView().span }); renderPanel(); return; } // v94: 지금 크기 그대로 내 위치로
  // v95: 지도를 누르면 핀, 범례 아이콘을 누르면 가장 가까운 그곳, 「위치 찾기」로 길 안내
  if (a === 'mapPin') { if (mapDragged()) return; const t = pinTapAt(b, e.clientX, e.clientY); if (!t) return; UIS.mapPin = UIS.mapPin && navSame(UIS.mapPin, t) && !t.k ? null : t; renderPanel(); return; }
  if (a === 'mapFind') { const t = nearestMark(i); if (!t) { toast('아직 찾지 못했어요', null, 'mapfind'); return; } UIS.mapPin = { x: t.x, y: t.y, name: t.name, k: t.k }; mapSet({ cx: t.x, cy: t.y, span: mapView().span }); renderPanel(); return; }
  if (a === 'navGo') { const P = UIS.mapPin; if (!P) return; if (Math.hypot(P.x - G.p.x, P.y - G.p.y) <= NAV_ARRIVE) { toast('이미 가까이 있어요', null, 'navNear'); return; } setNav(P); UIS.mapPin = null; closePanel(); toast(`${roJosa(P.name || '고른 곳')} 가는 길을 알려 줄게요`, 'good', 'nav'); return; }
  if (a === 'navOff') { setNav(null); UIS.mapPin = null; renderPanel(); return; }
  if (a === 'pinClear') { UIS.mapPin = null; renderPanel(); return; }
  if (a === 'mapTap') { if (UIS.mapWarp == null || mapDragged()) return; /* v94: 끌어서 옮긴 뒤에는 고르지 않음 */ const e2 = warpTapAt(b, e.clientX, e.clientY); UIS.warpSel = e2 ? e2.i : null; renderPanel(); return; } // v89: 지도에서 워프 목적지 고르기
  if (a === 'warpGo') { const from = UIS.mapWarp; if (from == null) return; runCmd({ k: 'warp', from, to: i }); closePanel(); return; } // v89
  if (a === 'craft') { // 제작 자리(어느 제작대 창인지)를 함께 보내요
    const res = runCmd({ k: 'craft', r: i, q: UIS.qty[i] || 1, st: craftCtx(), i: panel.i, tier: panel.tier }); if (res === false) return;
    if (res === 'reorder') UIS.craftOrder = null; renderPanel(); return;
  }
  if (a === 'retrieve') { runCmd({ k: 'retrieve', o: panel.i }); closePanel(); return; }
  if (a === 'svPut') { if (!(panel && panel.kind === 'sieve') || runCmd({ k: 'sievePut', o: panel.i, id: i, q: +b.dataset.q }) === false) return; UIS.jobAsk = false; renderPanel(); return; } // v115 광석 그물
  if (a === 'fdIn' || a === 'fdOut' || a === 'fdAll') { if (!(panel && panel.kind === 'feeder') || runCmd({ k: a === 'fdIn' ? 'feedIn' : a === 'fdOut' ? 'feedOut' : 'feedAll', o: panel.i, i }) === false) return; renderPanel(); return; } // v114 먹이통
  if (a === 'cout' || a === 'cin') { if (runCmd({ k: 'chest', o: panel.i, i, out: a === 'cout' }) === false) return; renderPanel(); return; }
  if (a === 'qTab') { UIS.qTab = i; renderPanel(); return; }
  if (a === 'qClaim') { runCmd({ k: 'claim', id: i }); renderPanel(); return; }
  if (a === 'qAct') { runCmd({ k: 'qAct', id: i }); renderPanel(); return; } // v84: 활성화 · 활성화 해제
  if (a === 'qMap') { const t = questGo(questById(i)); if (t) openPanel('map', { focus: t }); return; } // v84: 지도에서 보기
  if (a === 'qDoneFold') { UIS.qDoneOpen = !UIS.qDoneOpen; renderPanel(); return; }
  if (a === 'qGotFold') { UIS.qGotOpen = !UIS.qGotOpen; renderPanel(); return; }
  if (a === 'qClaimAll') { runCmd({ k: 'claimAll' }); renderPanel(); return; }
  if (a === 'statUp') { runCmd({ k: 'statUp', s: i }); UIS.statAsk = false; renderPanel(); return; }
  if (a === 'statReset') { if (!UIS.statAsk) { UIS.statAsk = true; renderPanel(); return; } runCmd({ k: 'statReset' }); UIS.statAsk = false; renderPanel(); return; }
  if (a === 'skUp') { if (runCmd({ k: 'skUp', s: i }) === false) return; renderPanel(); return; }
  if (a === 'skReset') { if (!UIS.skAsk) { UIS.skAsk = true; renderPanel(); return; } runCmd({ k: 'skReset' }); UIS.skAsk = false; renderPanel(); return; }
  if (a === 'skSlot') { const [id, n] = String(i).split(':'); if (runCmd({ k: 'skSlot', s: id, n: +n }) === false) return; renderPanel(); return; }
  if (a === 'save') { if (CLOUD.user && !CLOUD.pending) { saveLocal(true); cloudUpload(true).then(ok => toast(ok ? '저장했어요 · 클라우드에도 올렸어요' : '저장했어요 (클라우드에는 올리지 못했어요)', ok ? 'good' : 'warn')); } else saveLocal(); return; } // v111: 「지금 올리기」 대신 — 로그인했으면 클라우드에도
  if (a === 'escape') { if (!UIS.confirmEsc) { UIS.confirmEsc = true; renderPanel(); return; } UIS.confirmEsc = false; closePanel(); if (runCmd({ k: 'escape' })) saveLocal(true); return; }
  if (a === 'qtShow') { UIS.qtShow = !UIS.qtShow; renderPanel(); return; }
  if (a === 'nameOk') { const inp = $('#nameIn'); runCmd({ k: 'setName', n: inp ? inp.value : '' }); panel.nameDraft = null; panel.at = (panel.at || 0) + 1; renderPanel(); return; } // v117 첫 장면 이름 짓기
  if (a === 'profName') { const inp = $('#profName'); runCmd({ k: 'setName', n: inp ? inp.value : '' }); UIS.nameEdit = false; renderPanel(); return; } // v117 프로필에서 이름 바꾸기
  if (a === 'profEdit') { UIS.nameEdit = !UIS.nameEdit; renderPanel(); if (UIS.nameEdit) { const inp = $('#profName'); if (inp && !document.body.classList.contains('touch')) inp.focus(); } return; }
  if (a === 'talkNext') { panel.at = (panel.at || 0) + 1; renderPanel(); return; } // v104
  if (a === 'talkShop') { panel.mode = 'shop'; renderPanel(); return; } // v105
  if (a === 'talkBack') { panel.mode = 'talk'; renderPanel(); return; }
  if (a === 'barter') { if (runCmd({ k: 'barter', npc: panel.npc, n: +i })) renderPanel(); return; }
  if (a === 'diaryLast' || a === 'ending') { openPanel(a); return; } // v108
  if (a === 'diary') { openPanel('diary', { arch: i }); return; } // v106
  if (a === 'memory') { openPanel('memory', { stage: +i }); return; } // v103 나무의 기억 다시 보기
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
  if (a === 'help') { openPanel('help', { nav: true }); return; } // v96: 설정 → 가이드
  if (a === 'helpTab') { UIS.helpTab = i; renderPanel(); return; }
  if (a === 'helpBack') { openPanel('menu', { nav: true }); return; }
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
    if (DRAG.st) dragEnd(false); /* v86: 새로 누르면 남아 있던 끌기·스크롤을 버리고 새 손가락으로 시작해요 (아이폰에서 「손 뗌」이 빠지면 그 뒤로 가방이 안 넘어가던 문제) */
    if (!G || !started || (e.pointerType === 'mouse' && e.button !== 0)) return; const el = e.target.closest && e.target.closest('.slot[data-a]'); if (!el) return;
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
    // v86: 넘기는 중에 창이 다시 그려지면(물건을 주움 등) 새로 그려진 목록을 이어서 넘겨요 — 예전에는 사라진 옛 목록을 넘겨서 멈춘 것처럼 보였어요
    if (D.body && !D.body.isConnected) { const nb = document.querySelector('#sheet .sh-body'); D.body = nb; if (nb && D.mode === 'scroll') D.sy = nb.scrollTop + (D.ldy || 0); }
    if (D.hb && !D.hb.isConnected) { const nh = document.querySelector('#hbSlots'); D.hb = nh; if (nh && D.mode === 'hscroll') D.sx = nh.scrollLeft + (D.ldx || 0); }
    if (D.mode === 'scroll') { if (D.body) { D.body.scrollTop = D.sy - dy; D.ldy = dy; } }
    else if (D.mode === 'hscroll') { if (D.hb) { D.hb.scrollLeft = D.sx - dx; D.ldx = dx; } }
    else if (D.mode === 'drag') { D.lx = e.clientX; D.ly = e.clientY; if (D.body && !D.raf) { const step = () => { if (DRAG.st !== D) return; const r = D.body.getBoundingClientRect(); if (D.ly < r.top + 44) D.body.scrollTop -= 9; else if (D.ly > r.bottom - 44) D.body.scrollTop += 9; D.raf = requestAnimationFrame(step); }; D.raf = requestAnimationFrame(step); }
      D.ghost.style.left = e.clientX + 'px'; D.ghost.style.top = e.clientY + 'px'; const t = document.elementFromPoint(e.clientX, e.clientY), tEl = t && t.closest('.slot[data-a]');
      document.querySelectorAll('.slot.dropT').forEach(x => { if (x !== tEl) x.classList.remove('dropT'); }); if (tEl && tEl !== D.el && slotRef(tEl)) tEl.classList.add('dropT'); }
  });
  window.addEventListener('pointerup', e => { if (DRAG.st && e.pointerId === DRAG.st.id) dragEnd(true, e); });
  window.addEventListener('pointercancel', e => { if (DRAG.st && e.pointerId === DRAG.st.id) dragEnd(false); });
  // v86: 화면에 손가락이 하나도 없는데 끌기가 남아 있으면 풀어요 (「손 뗌」을 놓쳤을 때). 손 뗌이 먼저 와서 놓기가 끝나도록 한 박자 뒤에 봐요
  const noTouch = e => { if (e.touches && e.touches.length === 0 && DRAG.st) { const D = DRAG.st; setTimeout(() => { if (DRAG.st === D) dragEnd(false); }, 0); } };
  window.addEventListener('touchend', noTouch, true); window.addEventListener('touchcancel', noTouch, true);
  const dropAll = () => dragEnd(false); // 앱을 내리거나 창을 떠나면 풀어요
  window.addEventListener('blur', dropAll); window.addEventListener('pagehide', dropAll); document.addEventListener('visibilitychange', () => { if (document.hidden) dropAll(); });
}
export function hotClick(i) {
  ensureAudio(); runCmd({ k: 'hot', i });
}

