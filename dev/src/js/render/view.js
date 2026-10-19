// ================= 화면: 캔버스·배율(resize)·카메라 따라가기, 한 장 그리기(render) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
import { effH, effW, HD, hdCtx } from '../engine/canvas.js';
import { fxRand } from '../engine/random.js';
import { $, clamp } from '../engine/util.js';
import { renderOverlay, renderWorld, renderWorldPost } from './world.js';
import { beginGB, endGB, glActive, GLST, shadeGL } from './glight.js';
import { cam, G } from '../save/state.js';
import { onFrame } from '../sim/systems.js';
import { shake } from '../ui/feedback.js';
import { markLight } from '../sim/loop.js';
import { WALL_LIFT } from '../art/tilemap.js';
onFrame('camera', dt => { const p = G.p; // 카메라가 플레이어를 부드럽게 따라가요
  const k = 1 - Math.pow(0.0005, dt); cam.x += (p.x - cam.x) * k; cam.y += (p.y - .3 - cam.y) * k;
});
// ================= render =================
export const cv = $('#cv'), mainCtx = cv.getContext('2d');
export let ctx = mainCtx;
export const setCtx = c => { ctx = c; }; // v73: the world pass can draw its glows into the light pass's glow layer
export const lowCv = document.createElement('canvas'), lowCtx = lowCv.getContext('2d');
// v109: 세계 그림(lowCv, 게임 픽셀 크기)을 화면 크기 캔버스에 매번 늘려 그리지 않고, 그대로 화면에 붙여 브라우저가 늘려 보여 줘요
// (큰 창에서 늘려 그리기가 창 넓이만큼 무거워 밀리던 것). #cv는 그 위에 투명하게 겹쳐 글자·화살표만 화면 해상도로 그려요
lowCv.id = 'wcv'; cv.parentNode.insertBefore(lowCv, cv);
let wcvCss = '';
// 글자층(#cv)에 무언가 그렸는지: 비어 있던 장이 또 비면 지우지도 다시 올리지도 않아요 (큰 창에서 화면 크기 층을 매번 새로 합치지 않게)
let ovDrew = true;
for (const m of ['fill', 'fillRect', 'fillText', 'stroke', 'strokeRect', 'strokeText', 'drawImage', 'putImageData']) { const f = mainCtx[m]; mainCtx[m] = function () { ovDrew = true; return f.apply(mainCtx, arguments); }; }
export let VIEW = { camX: 0, camY: 0, baseX: 0, baseY: 0 };
export let zoomPref = 'normal'; try { zoomPref = localStorage.getItem('lantern-tree-zoom') || 'normal'; } catch (e) { }
export const setZoomPref = v => { zoomPref = v; };
export let vignette = null;
export let TP = 48, Z = 3, DPR = 1; // 화면 배율 (save/state.js에서 옮김, 11단계)
export const LIFT = WALL_LIFT; // 벽이 자기 칸 위로 올라오는 높이 (v71: 20px, v72: 12px — art/tilemap.js)
export const PXFONT = '"NeoDunggeunmo Pro"'; // v78 도트 글꼴
// 캔버스 글자 크기: 예전 크기(n 게임 픽셀)에 가장 가까운 「16px × 화면 배율」의 배수 (도트 글꼴은 16px 단위에서만 또렷해요)
export function pxFont(n) { const u = 16 * DPR; return `${Math.max(1, Math.round(n * Z / u)) * u}px ${PXFONT}, sans-serif`; }
// 도트 글자 + 도트 테두리(굵기 = 글자 도트 1칸). 자리는 화면 픽셀에 맞춰요
export function pxText(t, x, y, col, ink) {
  const d = Math.max(1, Math.round(parseFloat(ctx.font) / 16)); x = Math.round(x); y = Math.round(y);
  if (ink) { ctx.fillStyle = ink; for (const [a, b] of [[-d, 0], [d, 0], [0, -d], [0, d], [-d, -d], [d, -d], [-d, d], [d, d]]) ctx.fillText(t, x + a, y + b); }
  ctx.fillStyle = col; ctx.fillText(t, x, y);
}
// v90: PC 큰 창 밀림 고치기 — 한 화면에 보이는 칸 수 상한(긴 쪽 24칸·짧은 쪽 14칸, 세로 폰은 원래 이 안이라 그대로)
// + 큰 화면(짧은 변 500px 넘음)은 내부 해상도를 약 320만 픽셀까지만 (폰은 그대로)
export const VIEW_MAX_LONG = 24, VIEW_MAX_SHORT = 14, MAX_PIXELS = 3.2e6, PHONE_SHORT = 500;
export function resize() {
  const w = innerWidth, h = innerHeight;
  DPR = Math.min(3, window.devicePixelRatio || 1);
  if (Math.min(w, h) > PHONE_SHORT && w * h * DPR * DPR > MAX_PIXELS) DPR = Math.sqrt(MAX_PIXELS / (w * h));
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  const zm = { small: .78, normal: 1, large: 1.25 }[zoomPref] || 1;
  const target = clamp(Math.min(w, h) / 10.5, 30, 54) * zm; Z = Math.max(1, Math.round(target * DPR / 16));
  const lng = Math.max(cv.width, cv.height), sht = Math.min(cv.width, cv.height);
  Z = Math.max(Z, Math.ceil(lng / (16 * VIEW_MAX_LONG)), Math.ceil(sht / (16 * VIEW_MAX_SHORT)));
  TP = 16 * Z; markLight(); vignette = null;
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
  if (!G) { mainCtx.fillStyle = '#120f1c'; mainCtx.fillRect(0, 0, cw, ch); return; }
  if (ovDrew) { mainCtx.clearRect(0, 0, cw, ch); ovDrew = false; }
  // world is drawn in game pixels on a canvas with HD art pixels per game pixel, then scaled up to the screen
  const bw = Math.ceil(cw / RZ) + 2, bh = Math.ceil(ch / RZ) + 2;
  if (lowCv.width !== bw * HD || lowCv.height !== bh * HD) { lowCv.width = bw * HD; lowCv.height = bh * HD; }
  const shk = shake > 0 ? shake * 5 : 0;
  const bx0 = cam.x * 16 - cw / RZ / 2, by0 = cam.y * 16 - ch / RZ / 2;
  const gx = bx0 + (fxRand() - .5) * shk, gy = by0 + (fxRand() - .5) * shk, ix = Math.floor(gx), iy = Math.floor(gy);
  ctx = hdCtx(lowCtx); Z = 1; TP = 16; VIEW = { camX: ix, camY: iy, baseX: ix, baseY: iy };
  lowCtx.setTransform(HD, 0, 0, HD, 0, 0); lowCtx.globalCompositeOperation = 'source-over'; lowCtx.globalAlpha = 1; lowCtx.imageSmoothingEnabled = false;
  lowCtx.fillStyle = '#120f1c'; lowCtx.fillRect(0, 0, bw, bh);
  let glOn = glActive(); // v73: the new light (render/glight.js) — falls back to the old light if the GPU can't
  try {
    if (glOn) beginGB(lowCtx, bw * HD, bh * HD);
    try { renderWorld(bw, bh, glOn); } finally { endGB(); }
    if (glOn) { let out = null; try { out = shadeGL(lowCv, bw * HD, bh * HD, ix, iy); } catch (e) { GLST.failed = true; GLST.err = String(e && e.message || e); console.warn('새 빛 효과 오류 — 예전 빛으로 그려요:', e); }
      lowCtx.setTransform(1, 0, 0, 1, 0, 0); lowCtx.globalCompositeOperation = 'source-over'; lowCtx.globalAlpha = 1;
      if (out) lowCtx.drawImage(out, 0, 0); lowCtx.setTransform(HD, 0, 0, HD, 0, 0); }
    renderWorldPost(bw, bh);
  } finally { ctx = mainCtx; Z = RZ; TP = 16 * RZ; lowCtx.setTransform(1, 0, 0, 1, 0, 0); }
  { const ox = Math.round((ix - gx) * RZ), oy = Math.round((iy - gy) * RZ), css = `${bw * RZ / DPR}|${bh * RZ / DPR}|${ox / DPR}|${oy / DPR}`; // 화면 픽셀 단위로 맞춘 자리·크기
    if (css !== wcvCss) { wcvCss = css; const st = lowCv.style; st.width = bw * RZ / DPR + 'px'; st.height = bh * RZ / DPR + 'px'; st.transform = `translate(${ox / DPR}px,${oy / DPR}px)`; } }
  VIEW = { camX: gx * RZ, camY: gy * RZ, baseX: bx0 * RZ, baseY: by0 * RZ };
  renderOverlay(cw, ch);
}
