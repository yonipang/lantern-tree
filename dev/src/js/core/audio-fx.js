// ================= audio =================
let AC = null, noiseBuf = null;
function ensureAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); const n = AC.sampleRate * 0.4; noiseBuf = AC.createBuffer(1, n, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function tone(f, dur, type = 'square', vol = 0.05, slide = 0) { if (!AC || !soundOn) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02); }
function nz(dur, vol, freq) { if (!AC || !soundOn) return; const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + .02); }
let lastPickSfx = 0;
const SFX = {
  hit: () => { tone(260, .09, 'square', .045, -140); nz(.05, .06, 1800); }, mine: () => { nz(.07, .09, 900); tone(180, .05, 'triangle', .03); }, brk: () => { nz(.16, .11, 500); tone(150, .14, 'triangle', .05, -70); },
  pick: () => { const n = performance.now(); if (n - lastPickSfx < 60) return; lastPickSfx = n; tone(880, .07, 'triangle', .045, 380); }, place: () => tone(330, .07, 'triangle', .06, -90),
  hurt: () => tone(170, .2, 'sawtooth', .05, -100), craft: () => { tone(660, .08, 'triangle', .05); setTimeout(() => tone(990, .1, 'triangle', .05), 70); }, eat: () => { tone(520, .09, 'sine', .07, -200); setTimeout(() => tone(620, .08, 'sine', .06, -200), 90); },
  clink: () => tone(1300, .05, 'square', .025), boss: () => { tone(90, .55, 'sawtooth', .07, -40); nz(.4, .06, 300); }, swing: () => nz(.06, .035, 2600),
  equip: () => tone(720, .05, 'triangle', .04, 200), purr: () => { tone(95, .25, 'triangle', .05, -15); setTimeout(() => tone(90, .25, 'triangle', .05, -15), 260); }, click: () => tone(1000, .03, 'square', .02), page: () => nz(.12, .04, 3200),
  sleep: () => [523, 440, 392, 330].forEach((f, i) => setTimeout(() => tone(f, .35, 'sine', .04), i * 220)),
  cast: () => { nz(.12, .04, 1800); tone(420, .12, 'sine', .03, 300); }, plop: () => tone(320, .09, 'sine', .05, -170), bite: () => { tone(880, .06, 'square', .04); setTimeout(() => tone(1175, .08, 'square', .04), 70); },
  catch: () => [660, 880, 1046].forEach((f, i) => setTimeout(() => tone(f, .12, 'triangle', .05), i * 70)), cast2: () => { tone(500, .25, 'sine', .04, -250); nz(.2, .03, 1200); },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .3, 'triangle', .06), i * 130)), seed: () => [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, .2, 'triangle', .05), i * 90)),
};

// ================= effects =================
function puff(x, y, col, n = 6, spd = 2.5, z = 0.3) { for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, s = spd * (0.4 + Math.random() * 0.8); G.parts.push({ x, y, z: z + Math.random() * .2, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6, vz: 1.5 + Math.random() * 2, life: .5 + Math.random() * .35, max: .8, col, sz: 1 + (Math.random() * 2 | 0) }); } }
function ftext(x, y, txt, col = '#fff1d6') { G.texts.push({ x, y, txt, col, life: 1, vy: -1.1 }); }
const toastKeys = {};
function placeToasts() { const g = document.querySelector('#goal'), box = $('#toasts'); if (!g || !box) return; const r = g.getBoundingClientRect(); if (r.width) { box.style.top = Math.round(r.bottom + 10) + 'px'; box.style.left = Math.round(r.left + 2) + 'px'; } }
function toast(msg, cls, key) {
  const now = performance.now(); if (key) { if (toastKeys[key] && now - toastKeys[key] < 2200) return; toastKeys[key] = now; }
  const box = $('#toasts'); placeToasts(); const el = document.createElement('div'); el.className = 'toast' + (cls ? ' ' + cls : ''); el.textContent = msg; box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, cls === 'warn' ? 6500 : 2300);
}
function spawnDrop(id, c, x, y) { const a = Math.random() * 6.283; G.drops.push({ id, c, x, y, vx: Math.cos(a) * 1.4, vy: Math.sin(a) * 1.1, z: 0.3, vz: 2.6, t: 0, hold: 0 }); }
function rollDrops(list, x, y) { for (const [id, a, b, ch] of list) if (Math.random() < (ch < 1 && petIs('rabbit') && rarOf(id) >= 2 ? Math.min(1, ch * 1.25) : ch)) { const c = rint(a, b); if (c > 0) spawnDrop(id, c + (Math.random() < skl('lucky') * 0.12 ? 1 : 0), x, y); } }

