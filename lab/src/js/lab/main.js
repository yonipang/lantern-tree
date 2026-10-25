// ================= 실험판 시작·매 프레임 =================
import { loadArt } from '../art/hand-art.js';
import { buildSprites } from '../art/world.js';
import { $ } from '../engine/util.js';
import { computeLight } from '../render/light.js';
import { render, resize } from '../render/view.js';
import { cam, G, paused, setPaused, setStarted } from '../save/state.js';
import { runFrame } from '../sim/systems.js';
import { sendCtl, setupInput } from './input.js';
import { showTorches } from './feedback.js';
import { newLabWorld } from './world.js';
import { runCmd } from '../sim/commands.js';
export const LAB_VER = 'L1.1';
let lastT = 0, testHold = false; // testHold: 테스트가 게임 시간을 직접 진행하는 동안 (아래 __lab.step)
export function loop(ts) {
  const dt = Math.min(.05, (ts - lastT) / 1000 || 0); lastT = ts;
  if (G && !paused && !testHold) { sendCtl(); G.time += dt; runFrame(dt); }
  render(); requestAnimationFrame(loop);
}
export function beginLab(seed) {
  newLabWorld(seed); cam.x = G.p.x; cam.y = G.p.y - .3; computeLight(); showTorches(G.torches);
  $('#title').hidden = true; document.body.classList.remove('intro'); setPaused(false); setStarted(true);
}
export async function start() {
  document.body.classList.add('intro');
  try { await Promise.race([document.fonts.load('16px "NeoDunggeunmo Pro"', '등불나무 0'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { }
  await loadArt(); buildSprites(); setupInput(); resize();
  const q = new URLSearchParams(location.search), seed = +q.get('seed') || 20261025;
  $('#btnNew').addEventListener('click', () => beginLab(seed));
  $('#labVer').textContent = LAB_VER;
  requestAnimationFrame(loop);
}
start();
// 테스트·확인용 손잡이 (lab/qa가 씀) — 게임 결과에는 영향 없어요
// step(초, 조작): 실제 시계 대신 게임 시간을 1/60초씩 정해진 만큼 진행 (테스트가 컴퓨터 빠르기에 흔들리지 않게). 그동안 화면 쪽 조작은 안 읽어요
window.__lab = { get G() { return G; }, beginLab, newLabWorld, runCmd: c => runCmd(c),
  step(sec, ctl = {}) { testHold = true; const n = Math.round(sec * 60); for (let k = 0; k < n; k++) { runCmd({ k: 'ctl', mx: 0, my: 0, act: false, ...ctl }); G.time += 1 / 60; runFrame(1 / 60); } },
  release() { testHold = false; } };
