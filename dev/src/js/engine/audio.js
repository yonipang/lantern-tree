// ================= 소리 (SFX.hit() 같은 효과음) =================
import { fxRand } from './random.js';
import { soundOn } from '../save/state.js';
import { eat } from '../sim/player.js';

let AC = null, noiseBuf = null;
// v66 (BF-02): after the phone is locked or the app is switched, the sound device can come back 'suspended', 'interrupted' (iPhone)
// or 'closed'. Anything but 'running' is resumed (a closed one is made again); a browser that only allows it from a tap is tried
// again on the next tap (ui/input.js). The sound on/off setting is not touched.
export function ensureAudio() { try { if (AC && AC.state === 'closed') AC = null;
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); const n = AC.sampleRate * 0.4; noiseBuf = AC.createBuffer(1, n, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = fxRand() * 2 - 1; }
  if (AC.state !== 'running') { const r = AC.resume(); if (r && r.catch) r.catch(() => { }); unlockTick(); } } catch (e) { AC = null; } }
// a silent one-sample sound: iPhone Safari only really wakes the sound device once something plays during a tap
function unlockTick() { try { const b = AC.createBuffer(1, 1, AC.sampleRate), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } catch (e) { } }
export const audioState = () => AC ? AC.state : 'none';
function tone(f, dur, type = 'square', vol = 0.05, slide = 0) { if (!AC || !soundOn) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02); }
function nz(dur, vol, freq) { if (!AC || !soundOn) return; const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.2; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur + .02); }
let lastPickSfx = 0;
export const SFX = {
  hit: () => { tone(260, .09, 'square', .045, -140); nz(.05, .06, 1800); }, mine: () => { nz(.07, .09, 900); tone(180, .05, 'triangle', .03); }, brk: () => { nz(.16, .11, 500); tone(150, .14, 'triangle', .05, -70); },
  pick: () => { const n = performance.now(); if (n - lastPickSfx < 60) return; lastPickSfx = n; tone(880, .07, 'triangle', .045, 380); }, place: () => tone(330, .07, 'triangle', .06, -90),
  hurt: () => tone(170, .2, 'sawtooth', .05, -100), craft: () => { tone(660, .08, 'triangle', .05); setTimeout(() => tone(990, .1, 'triangle', .05), 70); }, eat: () => { tone(520, .09, 'sine', .07, -200); setTimeout(() => tone(620, .08, 'sine', .06, -200), 90); },
  clink: () => tone(1300, .05, 'square', .025), boss: () => { tone(90, .55, 'sawtooth', .07, -40); nz(.4, .06, 300); }, swing: () => nz(.06, .035, 2600),
  equip: () => tone(720, .05, 'triangle', .04, 200), purr: () => { tone(95, .25, 'triangle', .05, -15); setTimeout(() => tone(90, .25, 'triangle', .05, -15), 260); }, click: () => tone(1000, .03, 'square', .02), page: () => nz(.12, .04, 3200),
  sleep: () => [523, 440, 392, 330].forEach((f, i) => setTimeout(() => tone(f, .35, 'sine', .04), i * 220)),
  cast: () => { nz(.12, .04, 1800); tone(420, .12, 'sine', .03, 300); }, plop: () => tone(320, .09, 'sine', .05, -170), bite: () => { tone(880, .06, 'square', .04); setTimeout(() => tone(1175, .08, 'square', .04), 70); },
  catch: () => [660, 880, 1046].forEach((f, i) => setTimeout(() => tone(f, .12, 'triangle', .05), i * 70)), cast2: () => { tone(500, .25, 'sine', .04, -250); nz(.2, .03, 1200); },
  bell: () => [1568, 2093].forEach((f, i) => setTimeout(() => tone(f, .45, 'sine', .035), i * 110)), blip: () => tone(700 + fxRand() * 160, .025, 'triangle', .012), // v117 길잡이 방울 · 타이핑
  qdone: () => [1175, 1568].forEach((f, i) => setTimeout(() => tone(f, i ? .4 : .14, 'triangle', .055), i * 100)), // v124 「퀘스트 완료!」 띵
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, .3, 'triangle', .06), i * 130)), seed: () => [784, 988, 1175].forEach((f, i) => setTimeout(() => tone(f, .2, 'triangle', .05), i * 90)),
};
