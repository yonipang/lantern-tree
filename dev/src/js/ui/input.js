// ================= input wiring =================
// ---- 입력 상태 (구조 변경 7단계: game/actions.js에서 옮김) — 규칙은 이걸 직접 읽지 않고 매 프레임 조작 의도(ctl)를 받아요 ----
import { buildPlayer } from '../art/characters.js';
import { audioState, ensureAudio } from '../engine/audio.js';
import { toast } from '../engine/effects.js';
import { rand } from '../engine/random.js';
import { $ } from '../engine/util.js';
import { cv, DPR, LIFT, resize, TP, VIEW } from '../render/view.js';
import { deserialize, G, newGame, paused, SAVE_KEY, started } from '../save/state.js';
import { applyImport, clearImport, CLOUD, cloudAuth, cloudKeepLocal, cloudTakePending, cloudTitleClick, cloudTitleRefresh, cloudUpload, escHTML, loadBackups, loadLocal, pickSaveFile, pushBackup, readSaveFile, saveLocal } from '../save/storage.js';
import { cycleAlt } from '../sim/actions.js';
import { catchThrow } from '../sim/animals.js';
import { runCmd } from '../sim/commands.js';
import { advanceOffline } from '../sim/crafting.js';
import { wearItem } from '../sim/gear.js';
import { flipHotbar, toggleToolRow, toolSlotClick } from './hud.js';
import { DRAG, hotClick, onSheetClick, setupDrag } from './panel-actions.js';
import { closePanel, openPanel, panel, panelAt, refocusGame, UIS } from './panels.js';
import { beginPlay, hidePicker, pickSel, renderPicker, setPickSel, showPicker } from './picker.js';
import { idx, inB } from '../world/map.js';
export const keys = new Set();
export const joy = { active: false, id: null, ox: 0, oy: 0, vx: 0, vy: 0 };
export const dpad = { id: null, vx: 0, vy: 0 };
export let ctrlPref = 'joy'; try { ctrlPref = localStorage.getItem('lantern-tree-ctrl') === 'pad' ? 'pad' : 'joy'; } catch (e) { }
export const setCtrlPref = v => { ctrlPref = v; };
export const mouse = { x: 0, y: 0, down: false, last: 0, used: false, over: false };
export let btnHeld = false, atkBtnHeld = false;
export const releaseHeld = () => { btnHeld = false; };
export const aimMouse = () => mouse.used && mouse.over && (mouse.down || performance.now() - mouse.last < 3500);
export function mouseWorld() { return { x: (mouse.x * DPR + VIEW.baseX) / TP, y: (mouse.y * DPR + VIEW.baseY) / TP }; }
export function mouseTile() {
  const m = mouseWorld(); let tx = Math.floor(m.x), ty = Math.floor(m.y);
  // wall tops are drawn lifted (v72: by 12px — LIFT), so a floor tile above a wall visually belongs to the nearest wall below that reaches it
  if (!(inB(tx, ty) && G.wall[idx(tx, ty)])) { const lf = LIFT / 16; for (let r = ty + 1; r <= ty + Math.ceil(lf); r++) if (inB(tx, r) && G.wall[idx(tx, r)] && m.y >= r - lf) { ty = r; break; } }
  return { x: tx, y: ty, mx: m.x, my: m.y };
}
// 매 프레임(그리고 명령을 보내기 바로 전) 지금 조작을 조작 의도로 묶어 보내요 (sim/commands.js 「조작 의도」)
export function readCtl() {
  if (panel) return { k: 'ctl', mx: 0, my: 0, stick: null, act: false, atk: false, aim: null }; // v76: 창이 열린 동안 내 캐릭터는 제자리 (세계는 계속)
  let mx = 0, my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
  if (joy.active) { mx += joy.vx; my += joy.vy; }
  if (dpad.id != null) { mx += dpad.vx; my += dpad.vy; }
  const stick = dpad.id != null && Math.hypot(dpad.vx, dpad.vy) > .2 ? { x: dpad.vx, y: dpad.vy } : joy.active && Math.hypot(joy.vx, joy.vy) > .2 ? { x: joy.vx, y: joy.vy } : null; // 대시 방향 (방향 패드가 먼저)
  let aim = null; if (aimMouse()) { const m = mouseTile(); aim = { x: m.mx, y: m.my, tx: m.x, ty: m.y }; }
  return { k: 'ctl', mx, my, stick, act: btnHeld || keys.has('Space') || keys.has('KeyE'), atk: atkBtnHeld || mouse.down || keys.has('KeyJ'), aim };
}
export function sendCtl() { if (G) runCmd(readCtl()); }
export function command(c) { sendCtl(); return runCmd(c); } // 버튼·키로 보내는 명령 — 그 순간의 조작 의도와 함께
export function subAction() { if (!started || paused || !G || G.p.dead > 0) return; ensureAudio(); command({ k: 'alt' }); } // v65: the small button
export function padEnd() { dpad.id = null; dpad.vx = dpad.vy = 0; const dp = $('#dpad'); if (dp) dp.querySelectorAll('i').forEach(x => x.classList.remove('on')); }
export function applyCtrl() { document.body.classList.toggle('padmode', ctrlPref === 'pad'); if (ctrlPref === 'pad') joyEnd(); else padEnd(); }
export function joyEnd() { joy.active = false; joy.id = null; joy.vx = joy.vy = 0; const j = $('#joy'); j.classList.remove('on'); placeJoyIdle(); $('#joyKnob').style.transform = ''; }
export function placeJoyIdle() { const j = $('#joy'); j.style.left = (innerHeight > 600 ? 80 : 72) + 'px'; j.style.top = (innerHeight - (innerHeight > 600 ? 184 : 120)) + 'px'; } // v78: 와이어프레임 v2 자리(지름 128px, 왼쪽 16px)
export function setupInput() {
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    ensureAudio(); if (paused) return;
    if (e.pointerType === 'mouse') { if (e.button === 2) { mouse.used = true; mouse.last = performance.now(); mouse.x = e.clientX; mouse.y = e.clientY; command({ k: 'skill', n: 0 }); return; } mouse.over = true; mouse.down = e.button === 0; if (mouse.down) command({ k: 'tap', b: 'atk' }); /* v65: the mouse attacks */ mouse.used = true; mouse.last = performance.now(); mouse.x = e.clientX; mouse.y = e.clientY; return; }
    document.body.classList.add('touch'); mouse.used = false;
    if (!joy.active && ctrlPref !== 'pad' && e.clientX < innerWidth * 0.62) { joy.active = true; joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; const j = $('#joy'); j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.classList.add('on'); try { cv.setPointerCapture(e.pointerId); } catch (_) { } }
  });
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.last = performance.now(); mouse.used = true; mouse.over = e.target === cv; });
  document.addEventListener('mouseleave', () => { mouse.over = false; });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') return;
    if (joy.active && e.pointerId === joy.id) { let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const l = Math.hypot(dx, dy), R = 48; /* v78: 받침 128px − 손잡이 32px */ if (l > R) { dx *= R / l; dy *= R / l; } /* v75: the base stays where it was pressed; only the knob is held inside the ring, and the walk keeps that direction at full speed */
      const m = Math.hypot(dx, dy) / R; joy.vx = m > 0.15 ? dx / R : 0; joy.vy = m > 0.15 ? dy / R : 0; $('#joyKnob').style.transform = `translate(${dx}px,${dy}px)`; }
  });
  const up = e => { if (e.pointerType === 'mouse') { if (e.button === 0) mouse.down = false; return; } if (e.pointerId === joy.id) joyEnd(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); window.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') mouse.down = false; });
  const ab = $('#actBtn');
  ab.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); if (paused) return; btnHeld = true; command({ k: 'tap', b: 'act' }); ab.classList.add('on'); try { ab.setPointerCapture(e.pointerId); } catch (_) { } });
  const abUp = () => { btnHeld = false; ab.classList.remove('on'); }; ab.addEventListener('pointerup', abUp); ab.addEventListener('pointercancel', abUp); ab.addEventListener('lostpointercapture', abUp);
  const kb = $('#atkBtn'); // v65: the attack button
  kb.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); if (paused) return; atkBtnHeld = true; command({ k: 'tap', b: 'atk' }); kb.classList.add('on'); try { kb.setPointerCapture(e.pointerId); } catch (_) { } });
  const kbUp = () => { atkBtnHeld = false; kb.classList.remove('on'); }; kb.addEventListener('pointerup', kbUp); kb.addEventListener('pointercancel', kbUp); kb.addEventListener('lostpointercapture', kbUp);
  $('#altNext').addEventListener('click', () => { if (started && !paused) cycleAlt(); });
  window.addEventListener('keydown', e => {
    const tf = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
    if (tf) { if (e.target.offsetParent !== null && e.code !== 'Escape') return; e.target.blur(); } // a hidden text field must never swallow the game keys
    if (e.repeat && !['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) { if (['Space', 'Tab'].includes(e.code)) e.preventDefault(); return; }
    ensureAudio();
    if (e.code === 'Escape') { if (panel) closePanel(); else if (started) openPanel('menu'); return; }
    if (!started) return;
    if (panel && panel.kind === 'catch' && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyJ')) { e.preventDefault(); catchThrow(); return; }
    if (panel) { const bag = panel.kind === 'inv' || (panel.kind === 'craft' && !panel.st); // v77: 손제작은 가방 안 제작 탭
      if (['KeyI', 'KeyB', 'KeyU'].includes(e.code) && bag) { e.preventDefault(); closePanel(); } else if ((e.code === 'KeyC' || e.code === 'KeyK') && panel.kind === 'stat') closePanel(); else if (e.code === 'KeyM' && panel.kind === 'map') closePanel(); else if (e.code === 'KeyL' && panel.kind === 'quest') closePanel(); return; }
    if (e.code === 'Tab') { e.preventDefault(); toolSlotClick(); return; } // v65: the tool row
    if (e.code === 'KeyI' || e.code === 'KeyB') { e.preventDefault(); openPanel('inv'); return; }
    if (e.code === 'KeyC') { openPanel('stat'); return; } if (e.code === 'KeyK') { openPanel('stat', { sk: 1 }); return; } // v77: C = 캐릭터, K = 캐릭터의 스킬 쪽
    if (e.code === 'KeyM') { openPanel('map'); return; } if (e.code === 'KeyU') { openPanel('inv'); return; } if (e.code === 'KeyL') { openPanel('quest'); return; } // v77: L = 퀘스트
    if (e.code === 'KeyF') { command({ k: 'skill', n: 0 }); return; } if (e.code === 'KeyG') { command({ k: 'skill', n: 1 }); return; }
    if (/^Digit[1-9]$/.test(e.code)) { hotClick(+e.code.slice(5) - 1); return; }
    if (e.code === 'KeyR') { subAction(); return; }
    if (e.code === 'KeyQ') { cycleAlt(); return; } // v65: Q = next option on the small button (eat with E)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (['Space', 'KeyE'].includes(e.code)) command({ k: 'tap', b: 'act' }); if (e.code === 'KeyJ') command({ k: 'tap', b: 'atk' });
    keys.add(e.code);
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  // buttons never keep keyboard focus after a mouse click; any click outside a text field brings focus back to the game
  document.addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('button') && !e.target.closest('input,textarea')) e.preventDefault(); }, true);
  document.addEventListener('pointerdown', e => { if (!(e.target.closest && e.target.closest('input,textarea,select'))) refocusGame(); }, true);
  window.addEventListener('blur', () => { keys.clear(); btnHeld = false; atkBtnHeld = false; mouse.down = false; joyEnd(); padEnd(); });
  const dp = $('#dpad');
  const padMove = e => { if (dpad.id !== e.pointerId) return; const r = dp.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < 12) { dpad.vx = dpad.vy = 0; } else { const a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4); dpad.vx = Math.abs(Math.cos(a)) < 1e-6 ? 0 : Math.cos(a); dpad.vy = Math.abs(Math.sin(a)) < 1e-6 ? 0 : Math.sin(a); }
    dp.querySelector('.u').classList.toggle('on', dpad.vy < -.1); dp.querySelector('.d').classList.toggle('on', dpad.vy > .1); dp.querySelector('.l').classList.toggle('on', dpad.vx < -.1); dp.querySelector('.r').classList.toggle('on', dpad.vx > .1); };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); document.body.classList.add('touch'); if (paused || dpad.id != null) return; dpad.id = e.pointerId; try { dp.setPointerCapture(e.pointerId); } catch (_) { } padMove(e); });
  dp.addEventListener('pointermove', padMove);
  const pu = e => { if (e.pointerId === dpad.id) padEnd(); }; dp.addEventListener('pointerup', pu); dp.addEventListener('pointercancel', pu); dp.addEventListener('lostpointercapture', pu);
  applyCtrl();
  cv.addEventListener('wheel', e => { if (paused) return; command({ k: 'sel', d: e.deltaY > 0 ? 1 : -1 }); }, { passive: true });
  $('#hotbar').addEventListener('click', e => { if (performance.now() - DRAG.block < 400) return; if (e.target.closest('[data-tool]')) { toolSlotClick(); return; } const b = e.target.closest('[data-i]'); if (b) { toggleToolRow(false); hotClick(+b.dataset.i); } });
  setupDrag();
  $('#subBtn').addEventListener('click', () => subAction());
  $('#sheet').addEventListener('click', onSheetClick);
  $('#backdrop').addEventListener('click', () => { if (performance.now() - panelAt < 450 || performance.now() - DRAG.block < 400) return; if (panel && panel.kind !== 'win') closePanel(); });
  $('#bInv').addEventListener('click', () => started && openPanel('inv'));
  $('#bStat').addEventListener('click', () => started && openPanel('stat'));
  $('#face').addEventListener('click', () => started && openPanel('stat')); // v77: 얼굴도 캐릭터 화면
  $('#hbFlip').addEventListener('click', () => { if (!started) return; ensureAudio(); flipHotbar(); });
  $('#skBar').addEventListener('pointerdown', e => { const b = e.target.closest('.skb'); if (!b) return; e.preventDefault(); ensureAudio(); command({ k: 'skill', n: +b.dataset.n }); });
  $('#bMap').addEventListener('click', () => started && openPanel('map'));
  $('#bMenu').addEventListener('click', () => started && openPanel('menu'));
  $('#goal').addEventListener('click', () => started && openPanel('quest')); // v77: 진행 중인 이야기 한 줄을 누르면 퀘스트
  let newAsk = false;
  $('#btnNew').addEventListener('click', () => { ensureAudio();
    if (loadLocal() && !newAsk) { newAsk = true; $('#btnNew').textContent = '정말 새로 시작할까요? (지금 세이브는 백업돼요)'; $('#btnNew').classList.add('warn'); return; }
    if (newAsk) pushBackup('새 모험 시작 전'); newAsk = false; $('#btnNew').textContent = '새 모험 시작'; $('#btnNew').classList.remove('warn'); showPicker(); });
  $('#btnBackups').addEventListener('click', () => { const el = $('#bkList'); if (!el.hidden) { el.hidden = true; return; } const b = loadBackups();
    const fmt = t => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    el.innerHTML = `<div style="color:var(--muted);font-size:16px">되돌리면 지금 세이브도 백업해 둬요.</div>` + b.map((x, k) => `<div class="bk"><span>${fmt(x.at)}<br><small style="color:var(--muted)">${escHTML(x.reason || '')}</small></span><button class="btn ghost" type="button" data-bk="${k}">되돌리기</button></div>`).join(''); el.hidden = false; });
  $('#btnCloud').addEventListener('click', () => { ensureAudio(); cloudTitleClick(); });
  $('#cloudTitle').addEventListener('click', e => { const b = e.target.closest('[data-ct]'); if (!b) return; const k = b.dataset.ct;
    if (k === 'emailT') { UIS.clTitleEmail = !UIS.clTitleEmail; cloudTitleRefresh(); return; }
    CLOUD.wantTake = true; cloudAuth(k, 'ct'); });
  $('#wearAsk').addEventListener('click', () => { const el = $('#wearAsk'), k = G.inv.findIndex(x => x && x.id === el.dataset.id); el.hidden = true; if (k >= 0) wearItem(k); });
  $('#cloudAsk').addEventListener('click', e => { const b = e.target.closest('[data-cl]'); if (!b) return; if (b.dataset.cl === 'take') cloudTakePending(); else cloudKeepLocal(); });
  $('#bkList').addEventListener('click', e => { const bt = e.target.closest('[data-bk]'); if (!bt) return; const x = loadBackups()[+bt.dataset.bk]; if (!x) return;
    let sv; try { sv = JSON.parse(x.data); } catch (err) { toast('백업을 읽지 못했어요'); return; }
    const cur = (() => { try { return localStorage.getItem(SAVE_KEY); } catch (err) { return null; } })();
    try { deserialize(sv); } catch (err) { toast('백업을 불러오지 못했어요'); return; }
    if (cur) pushBackup('백업 되돌리기 전', cur); $('#bkList').hidden = true; beginPlay(); toast('백업에서 되돌렸어요', 'good'); });
  $('#cpGrid').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; setPickSel(b.dataset.c); renderPicker(); });
  $('#charBack').addEventListener('click', () => hidePicker());
  $('#charGo').addEventListener('click', () => { hidePicker(); newGame((rand() * 1e9) | 0); G.char = pickSel; G.outfit = 0; buildPlayer(0); beginPlay(); if (pickSel === 'custom') setTimeout(() => openPanel('look'), 300); toast('등불나무 곁에서 눈을 떴어요'); setTimeout(() => toast(document.body.classList.contains('touch') ? '왼쪽을 끌어 움직이고, 손 버튼으로 뿌리기둥을 베어 보세요' : 'WASD로 움직이고, E(또는 스페이스)로 뿌리기둥을 베어 보세요'), 1400); });
  $('#btnContinue').addEventListener('click', () => { ensureAudio(); beginPlay(); toast('다시 돌아왔어요'); });
  $('#btnImport').addEventListener('click', () => { ensureAudio(); pickSaveFile('title'); });
  $('#fileIn').addEventListener('change', e => readSaveFile(e.target.files && e.target.files[0]));
  $('#impAsk').addEventListener('click', e => { const b = e.target.closest('[data-imp]'); if (!b) return; if (b.dataset.imp === 'yes') applyImport(); else { clearImport(); $('#impAsk').hidden = true; } });
  window.addEventListener('resize', () => { resize(); if (!joy.active) placeJoyIdle(); });
  let hiddenAt = 0; document.addEventListener('visibilitychange', () => { if (document.hidden && started) { hiddenAt = Date.now(); saveLocal(true); cloudUpload(false); } else if (!document.hidden && hiddenAt) { if (G && started) advanceOffline((Date.now() - hiddenAt) / 1000); hiddenAt = 0; } });
  window.addEventListener('pagehide', () => { if (started) saveLocal(true); });
  // v66 (BF-02): wake the sound again when coming back (lock screen · app switch · back/forward cache), and on the next tap or key if the
  // browser only allows it from one. Only an already made sound device is woken here — the very first one still waits for a tap.
  const wake = () => { if (audioState() !== 'none' && audioState() !== 'running') ensureAudio(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  window.addEventListener('pageshow', wake); window.addEventListener('focus', wake);
  for (const ev of ['pointerup', 'touchend', 'keydown']) document.addEventListener(ev, wake, true);
}
