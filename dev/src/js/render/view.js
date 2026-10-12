// ================= 화면: 캔버스·배율(resize)·카메라 따라가기, 한 장 그리기(render) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
import { effH, effW, HD, hdCtx } from '../engine/canvas.js';
import { fxRand } from '../engine/random.js';
import { $, clamp } from '../engine/util.js';
import { renderOverlay, renderWorld } from './world.js';
import { cam, G } from '../save/state.js';
import { onFrame } from '../sim/systems.js';
import { shake } from '../ui/feedback.js';
import { markLight } from '../sim/loop.js';
onFrame('camera', dt => { const p = G.p; // 카메라가 플레이어를 부드럽게 따라가요
  const k = 1 - Math.pow(0.0005, dt); cam.x += (p.x - cam.x) * k; cam.y += (p.y - .3 - cam.y) * k;
});
// ================= render =================
export const cv = $('#cv'), mainCtx = cv.getContext('2d');
export let ctx = mainCtx;
export const lowCv = document.createElement('canvas'), lowCtx = lowCv.getContext('2d');
export let VIEW = { camX: 0, camY: 0, baseX: 0, baseY: 0 };
export let zoomPref = 'normal'; try { zoomPref = localStorage.getItem('lantern-tree-zoom') || 'normal'; } catch (e) { }
export const setZoomPref = v => { zoomPref = v; };
export let vignette = null;
export let TP = 48, Z = 3, DPR = 1; // 화면 배율 (save/state.js에서 옮김, 11단계)
export const LIFT = 5;
export function resize() {
  DPR = Math.min(3, window.devicePixelRatio || 1);
  const w = innerWidth, h = innerHeight; cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  const zm = { small: .78, normal: 1, large: 1.25 }[zoomPref] || 1;
  const target = clamp(Math.min(w, h) / 10.5, 30, 54) * zm; Z = Math.max(1, Math.round(target * DPR / 16)); TP = 16 * Z; markLight(); vignette = null;
}
export function drawImg(img, wx, wyFoot, o = {}) {
  const sx = (o.sx || 1), sy = (o.sy || 1); const sw = effW(img) * Z * sx, sh = effH(img) * Z * sy;
  const dx = Math.round(wx * TP - VIEW.camX - sw / 2), dy = Math.round(wyFoot * TP - VIEW.camY - sh - (o.z || 0) * TP);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.flip) { ctx.save(); ctx.translate(dx + sw, dy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, sw, sh); ctx.restore(); } else ctx.drawImage(img, dx, dy, sw, sh);
  if (o.alpha != null) ctx.globalAlpha = 1;
}
export function shadow(wx, wy, rw, alpha = 0.32) { ctx.fillStyle = `rgba(12,6,22,${alpha})`; ctx.beginPath(); ctx.ellipse(wx * TP - VIEW.camX, wy * TP - VIEW.camY, rw * TP, rw * TP * 0.42, 0, 0, 6.283); ctx.fill(); }
export function render() {
  const cw = cv.width, ch = cv.height, RZ = Z;
  mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.globalCompositeOperation = 'source-over'; mainCtx.imageSmoothingEnabled = false;
  mainCtx.fillStyle = '#120f1c'; mainCtx.fillRect(0, 0, cw, ch);
  if (!G) return;
  // world is drawn in game pixels on a canvas with HD art pixels per game pixel, then scaled up to the screen
  const bw = Math.ceil(cw / RZ) + 2, bh = Math.ceil(ch / RZ) + 2;
  if (lowCv.width !== bw * HD || lowCv.height !== bh * HD) { lowCv.width = bw * HD; lowCv.height = bh * HD; }
  const shk = shake > 0 ? shake * 5 : 0;
  const bx0 = cam.x * 16 - cw / RZ / 2, by0 = cam.y * 16 - ch / RZ / 2;
  const gx = bx0 + (fxRand() - .5) * shk, gy = by0 + (fxRand() - .5) * shk, ix = Math.floor(gx), iy = Math.floor(gy);
  ctx = hdCtx(lowCtx); Z = 1; TP = 16; VIEW = { camX: ix, camY: iy, baseX: ix, baseY: iy };
  lowCtx.setTransform(HD, 0, 0, HD, 0, 0); lowCtx.globalCompositeOperation = 'source-over'; lowCtx.globalAlpha = 1; lowCtx.imageSmoothingEnabled = false;
  lowCtx.fillStyle = '#120f1c'; lowCtx.fillRect(0, 0, bw, bh);
  try { renderWorld(bw, bh); } finally { ctx = mainCtx; Z = RZ; TP = 16 * RZ; lowCtx.setTransform(1, 0, 0, 1, 0, 0); }
  mainCtx.drawImage(lowCv, Math.round((ix - gx) * RZ), Math.round((iy - gy) * RZ), bw * RZ, bh * RZ);
  VIEW = { camX: gx * RZ, camY: gy * RZ, baseX: bx0 * RZ, baseY: by0 * RZ };
  renderOverlay(cw, ch);
}
