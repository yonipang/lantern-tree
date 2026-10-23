// ================= loop =================
import { loadArt } from './art/hand-art.js';
import { buildSprites } from './art/world.js';
import { $ } from './engine/util.js';
import { iconURL } from './render/icons.js';
import { computeLight, initLight } from './render/light.js';
import { render, resize } from './render/view.js';
import { cam, deserialize, G, lastInputAt, newGame, noteInput, paused, playerList, serialize, setSound, started } from './save/state.js';
import { cloudInit, cloudUpload, loadBackups, loadLocal, pushBackup, saveLocal, storageWorks } from './save/storage.js';
import { pausedTick, update } from './sim/loop.js';
import { onFrame } from './sim/systems.js';
import { hitstopTick } from './ui/feedback.js';
import { jobPanelTick, updateHud } from './ui/hud.js';
import { placeJoyIdle, sendCtl, setupInput } from './ui/input.js';
import { beginPlay } from './ui/picker.js';
export let saveT = 0, snapT = 0, cloudT = 0; // 저장·백업·클라우드 (매 프레임 순서표 sim/systems.js)
onFrame('autosave', dt => {
  saveT += dt; if (saveT > 25) { saveT = 0; saveLocal(true); }
});
onFrame('backup', dt => {
  snapT += dt; if (snapT > 1200) { snapT = 0; pushBackup('플레이 중 자동 백업'); }
});
onFrame('cloud', dt => {
  cloudT += dt; if (cloudT > 120) { cloudT = 0; cloudUpload(false); }
});
export let lastT = 0;
export function loop(ts) {
  const dt = Math.min(0.05, (ts - lastT) / 1000 || 0); lastT = ts;
  if (G) { sendCtl(); jobPanelTick(dt); if (!paused) { if (!(hitstopTick(dt) && playerList().length <= 1)) update(dt); } else pausedTick(dt); /* v138 맞힐 때 멈칫 (혼자일 때만 세계를 잠깐 멈춤) */ }
  if (G && started && !document.hidden && ts - lastInputAt < IDLE_LIMIT * 1000) G.playT = (G.playT || 0) + dt;
  render(); if (G && started) updateHud();
  requestAnimationFrame(loop);
}
export async function start(data) {
  document.body.classList.add('intro');
  try { await Promise.race([document.fonts.load('16px "NeoDunggeunmo Pro"', '등불나무 0'), new Promise(r => setTimeout(r, 1500))]); } catch (e) { } // v78: 도트 글꼴을 받은 뒤 그려요 (캔버스 글자가 예전 글꼴로 먼저 그려지지 않게)
  await loadArt();
  buildSprites();
  initLight();
  try { setSound(localStorage.getItem('lantern-tree-sound') !== '0'); } catch (e) { }
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  $('#icHu').src = iconURL('food');
  ['bInv', 'bStat', 'bMap', 'bMenu'].forEach((id, k) => { $('#' + id + ' img').src = iconURL(['bag', 'star', 'map', 'gear'][k]); });
  setupInput(); resize(); placeJoyIdle();
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel']) window.addEventListener(ev, () => { noteInput(); }, { capture: true, passive: true });
  try { navigator.storage?.persist?.().catch(() => { }); } catch (e) { }
  const saved = (data && data.save) || loadLocal();
  if (saved) { try { deserialize(saved); $('#btnContinue').hidden = false; } catch (e) { pushBackup('불러오기 실패한 세이브'); newGame(20261008); } } else newGame(20261008);
  if (loadBackups().length) $('#btnBackups').hidden = false;
  setTimeout(() => cloudInit(), 50);
  if (!storageWorks()) { const w = $('#saveWarn'); w.hidden = false; w.textContent = '⚠ 이 화면에서는 진행 상황이 저장되지 않아요. 홈 화면 앱이나 브라우저에서 열거나, 플레이 중 설정 → 세이브 파일로 내보내기로 백업해 주세요.'; }
  cam.x = G.p.x; cam.y = G.p.y - .3; computeLight();
  if (data && data.save && data.playing) beginPlay();
  requestAnimationFrame(loop);
}
window.claude?.hot?.snapshot?.(() => ({ save: serialize(), playing: started }));
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
