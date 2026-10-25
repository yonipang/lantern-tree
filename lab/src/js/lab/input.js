// ================= 실험판 조작 (L1): 폰 조이스틱·캐기 버튼·횃불 버튼 / PC WASD·방향키·E(스페이스)·T =================
// 본 게임처럼 규칙에 바로 손대지 않고 명령을 보내요: 매 프레임 runCmd({ k: 'ctl', … }), 횃불은 runCmd({ k: 'torch' }).
// 조이스틱은 본 게임 v75처럼 화면 왼쪽 누른 곳에 생기고 끌어도 받침이 따라오지 않아요.
import { $ } from '../engine/util.js';
import { ensureAudio } from '../engine/audio.js';
import { runCmd } from '../sim/commands.js';
import { G, started } from '../save/state.js';
import { cv, resize } from '../render/view.js';
export const keys = {};
export const joy = { id: null, x: 0, y: 0, vx: 0, vy: 0 };
let actHeld = false;
const JOY_R = 52;
export function placeJoyIdle() { const j = $('#joy'); j.style.left = (innerHeight > 600 ? 96 : 80) + 'px'; j.style.top = (innerHeight - (innerHeight > 600 ? 150 : 110)) + 'px'; }
function joyMove(e) { let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const d = Math.hypot(dx, dy); joy.vx = dx / Math.max(d, JOY_R); joy.vy = dy / Math.max(d, JOY_R);
  if (d > JOY_R) { dx *= JOY_R / d; dy *= JOY_R / d; } $('#joyKnob').style.transform = `translate(${dx}px,${dy}px)`; }
function joyEnd() { joy.id = null; joy.vx = joy.vy = 0; $('#joy').classList.remove('on'); $('#joyKnob').style.transform = ''; placeJoyIdle(); }
export function setupInput() {
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => { ensureAudio(); if (!started || e.clientX > innerWidth * .55 || joy.id != null) return;
    joy.id = e.pointerId; joy.x = e.clientX; joy.y = e.clientY; const j = $('#joy'); j.style.left = joy.x + 'px'; j.style.top = joy.y + 'px'; j.classList.add('on'); joyMove(e); });
  window.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
  for (const ev of ['pointerup', 'pointercancel']) window.addEventListener(ev, e => { if (e.pointerId === joy.id) joyEnd(); });
  // 화면에 손가락이 하나도 없으면 모두 풀어요 (본 게임 v85: 아이폰에서 「손 뗌」이 빠질 때)
  window.addEventListener('touchend', e => { if (!e.touches.length) { if (joy.id != null) joyEnd(); setAct(false); } });
  const act = $('#actBtn');
  act.addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); setAct(true); });
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) act.addEventListener(ev, () => setAct(false));
  // 손가락이 닿는 순간 놓아요 (캐기 버튼과 같게) — 「클릭」은 폰(특히 아이폰)에서 빠질 때가 있어서 안 써요 (L1.1)
  $('#torchBtn').addEventListener('pointerdown', e => { e.preventDefault(); ensureAudio(); if (started) runCmd({ k: 'torch' }); });
  window.addEventListener('keydown', e => { keys[e.code] = true; ensureAudio(); if (!started) return; if (e.code === 'KeyT' && !e.repeat) runCmd({ k: 'torch' }); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; setAct(false); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { for (const k in keys) keys[k] = false; setAct(false); if (joy.id != null) joyEnd(); } });
  window.addEventListener('resize', () => { resize(); if (joy.id == null) placeJoyIdle(); });
  placeJoyIdle();
}
function setAct(v) { actHeld = v; $('#actBtn').classList.toggle('on', v); }
// 매 프레임: 지금 조작 의도를 명령으로 보내요
export function sendCtl() {
  if (!G) return; const k = c => keys[c] ? 1 : 0;
  let mx = k('KeyD') + k('ArrowRight') - k('KeyA') - k('ArrowLeft'), my = k('KeyS') + k('ArrowDown') - k('KeyW') - k('ArrowUp'); const stick = joy.id != null && Math.hypot(joy.vx, joy.vy) > .15;
  if (stick) { mx += joy.vx; my += joy.vy; }
  runCmd({ k: 'ctl', mx, my, stick: stick ? { x: joy.vx, y: joy.vy } : null, act: actHeld || !!keys.KeyE || !!keys.Space });
}
