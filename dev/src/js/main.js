// ================= loop =================
let lastT = 0;
function loop(ts) {
  const dt = Math.min(0.05, (ts - lastT) / 1000 || 0); lastT = ts;
  if (G) { sendCtl(); jobPanelTick(dt); if (!paused) update(dt); else { if (lightDirty) { lightDirty = false; computeLight(); } if (!started) { G.time += dt; lightT += dt; if (lightT > .1) { lightT = 0; computeLight(); } } } }
  if (G && started && !document.hidden && ts - lastInputAt < IDLE_LIMIT * 1000) G.playT = (G.playT || 0) + dt;
  render(); if (G && started) updateHud();
  requestAnimationFrame(loop);
}
async function start(data) {
  document.body.classList.add('intro');
  await loadArt();
  buildSprites();
  lightCv = document.createElement('canvas'); lightCtx = lightCv.getContext('2d');
  try { soundOn = localStorage.getItem('lantern-tree-sound') !== '0'; } catch (e) { }
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  $('#icHp').src = iconURL('heart'); $('#icHu').src = iconURL('food');
  ['bInv', 'bCraft', 'bQuest', 'bStat', 'bMap', 'bMenu'].forEach((id, k) => { $('#' + id + ' img').src = iconURL(['bag', 'hammer', 'quest', 'star', 'map', 'gear'][k]); });
  if (!document.body.classList.contains('touch')) $('#titleHint').textContent = 'WASD로 이동 · 클릭이나 스페이스로 캐기·공격·놓기';
  setupInput(); resize(); placeJoyIdle();
  for (const ev of ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel']) window.addEventListener(ev, () => { lastInputAt = performance.now(); }, { capture: true, passive: true });
  try { navigator.storage?.persist?.().catch(() => { }); } catch (e) { }
  const saved = (data && data.save) || loadLocal();
  if (saved) { try { deserialize(saved); $('#btnContinue').hidden = false; } catch (e) { pushBackup('불러오기 실패한 세이브'); newGame(20261008); } } else newGame(20261008);
  if (loadBackups().length) $('#btnBackups').hidden = false;
  setTimeout(() => cloudInit(), 50);
  if (!storageWorks()) { const w = $('#saveWarn'); w.hidden = false; w.textContent = '⚠ 이 화면에서는 진행 상황이 저장되지 않아요. 홈 화면 앱이나 브라우저에서 열거나, 플레이 중 메뉴 → 세이브 파일로 내보내기로 백업해 주세요.'; }
  cam.x = G.p.x; cam.y = G.p.y - .3; computeLight();
  if (data && data.save && data.playing) beginPlay();
  requestAnimationFrame(loop);
}
window.claude?.hot?.snapshot?.(() => ({ save: serialize(), playing: started }));
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
