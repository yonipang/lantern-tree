// ================= 효과: 반짝이(puff)·떠오르는 글자(ftext)·알림(toast) — 보이기만 하고 게임 결과는 안 바꿔요 =================
import { $ } from './util.js';
import { fxRand } from './random.js';
import { G } from '../save/state.js';

export function puff(x, y, col, n = 6, spd = 2.5, z = 0.3) { for (let k = 0; k < n; k++) { const a = fxRand() * 6.283, s = spd * (0.4 + fxRand() * 0.8); G.parts.push({ x, y, z: z + fxRand() * .2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 1.5 + fxRand() * 2, life: .5 + fxRand() * .35, max: .8, col, sz: 1 + (fxRand() * 2 | 0) }); } }
export function ftext(x, y, txt, col = '#fff1d6') { G.texts.push({ x, y, txt, col, life: 1, vy: -1.1 }); }
const toastKeys = {};
function placeToasts() { const g = document.querySelector('#goal'), box = $('#toasts'); if (!g || !box) return; const r = g.getBoundingClientRect(); if (r.width) { box.style.top = Math.round(r.bottom + 10) + 'px'; box.style.left = Math.round(r.left + 2) + 'px'; } }
export function toast(msg, cls, key) {
  const now = performance.now(); if (key) { if (toastKeys[key] && now - toastKeys[key] < 2200) return; toastKeys[key] = now; }
  const box = $('#toasts'); placeToasts(); const el = document.createElement('div'); el.className = 'toast' + (cls ? ' ' + cls : ''); el.textContent = msg; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, cls === 'warn' ? 6500 : 2300);
}
