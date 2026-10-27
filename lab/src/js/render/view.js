// ================= 실험판 화면: 캔버스·배율·카메라, 한 장 그리기 — 본 게임 render/view.js 자리에 들어가요 =================
// 본 게임 render/view.js와 같은 방법이에요(세계는 게임 픽셀 캔버스에 그리고 브라우저가 늘려 보여 줌, 새 빛은 render/glight.js).
// 본 게임 공용 파일(render/chunks.js·render/light.js …)이 가져가는 cv·TP …를 같은 이름으로 갖춰요.
import { effH, effW, HD, hdCtx } from '../engine/canvas.js';
import { fxRand } from '../engine/random.js';
import { $, clamp } from '../engine/util.js';
import { beginGB, endGB, glActive, GLST, shadeGL } from './glight.js';
import { cam, G } from '../save/state.js';
import { onFrame } from '../sim/systems.js';
import { WALL_LIFT } from '../art/tilemap.js';
import { drawLab, drawLabPost, drawLabTop } from '../lab/draw.js';
import { shake } from '../lab/fx.js';
import { markLight } from '../sim/loop.js';
onFrame('camera', dt => { const p = G.p, k = 1 - Math.pow(0.0005, dt); cam.x += (p.x - cam.x) * k; cam.y += (p.y - .3 - cam.y) * k; });
export const cv = $('#cv'), mainCtx = cv.getContext('2d');
export let ctx = mainCtx;
export const setCtx = c => { ctx = c; };
export const lowCv = document.createElement('canvas'), lowCtx = lowCv.getContext('2d');
lowCv.id = 'wcv'; cv.parentNode.insertBefore(lowCv, cv);
let wcvCss = '';
export let VIEW = { camX: 0, camY: 0, baseX: 0, baseY: 0 };
export let TP = 48, Z = 3, DPR = 1;
export const LIFT = WALL_LIFT;
// 화면 배율: 본 게임과 같은 규칙 (v90·v111 — 폰은 「작게」 0.78배, 한 화면 칸 수 상한 긴 쪽 24·짧은 쪽 14)
export const VIEW_MAX_LONG = 24, VIEW_MAX_SHORT = 14, MAX_PIXELS = 3.2e6, PHONE_SHORT = 500;
export function resize() {
  const w = innerWidth, h = innerHeight;
  DPR = Math.min(3, window.devicePixelRatio || 1);
  if (Math.min(w, h) > PHONE_SHORT && w * h * DPR * DPR > MAX_PIXELS) DPR = Math.sqrt(MAX_PIXELS / (w * h));
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  const target = clamp(Math.min(w, h) / 10.5, 30, 54) * .78; Z = Math.max(1, Math.round(target * DPR / 16));
  const lng = Math.max(cv.width, cv.height), sht = Math.min(cv.width, cv.height);
  Z = Math.max(Z, Math.ceil(lng / (16 * VIEW_MAX_LONG)), Math.ceil(sht / (16 * VIEW_MAX_SHORT)));
  TP = 16 * Z; markLight();
}
export function drawImg(img, wx, wyFoot, o = {}) {
  const sw = effW(img) * Z * (o.sx || 1), sh = effH(img) * Z * (o.sy || 1);
  const dx = Math.round(wx * TP - VIEW.camX - sw / 2), dy = Math.round(wyFoot * TP - VIEW.camY - sh - (o.z || 0) * TP);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  if (o.flip) { ctx.save(); ctx.translate(dx + sw, dy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, sw, sh); ctx.restore(); } else ctx.drawImage(img, dx, dy, sw, sh);
  if (o.alpha != null) ctx.globalAlpha = 1;
}
export function shadow(wx, wy, rw, alpha = .32) { ctx.fillStyle = `rgba(12,6,22,${alpha})`; ctx.beginPath(); ctx.ellipse(wx * TP - VIEW.camX, wy * TP - VIEW.camY, rw * TP, rw * TP * .42, 0, 0, 6.283); ctx.fill(); }
export function render() {
  const cw = cv.width, ch = cv.height, RZ = Z;
  mainCtx.setTransform(1, 0, 0, 1, 0, 0); mainCtx.imageSmoothingEnabled = false; mainCtx.clearRect(0, 0, cw, ch);
  if (!G) return;
  const bw = Math.ceil(cw / RZ) + 2, bh = Math.ceil(ch / RZ) + 2;
  if (lowCv.width !== bw * HD || lowCv.height !== bh * HD) { lowCv.width = bw * HD; lowCv.height = bh * HD; }
  const shk = shake > 0 ? shake * 5 : 0, bx0 = cam.x * 16 - cw / RZ / 2, by0 = cam.y * 16 - ch / RZ / 2;
  const gx = bx0 + (fxRand() - .5) * shk, gy = by0 + (fxRand() - .5) * shk, ix = Math.floor(gx), iy = Math.floor(gy);
  ctx = hdCtx(lowCtx); Z = 1; TP = 16; VIEW = { camX: ix, camY: iy, baseX: ix, baseY: iy };
  lowCtx.setTransform(HD, 0, 0, HD, 0, 0); lowCtx.globalCompositeOperation = 'source-over'; lowCtx.globalAlpha = 1; lowCtx.imageSmoothingEnabled = false;
  lowCtx.fillStyle = '#120f1c'; lowCtx.fillRect(0, 0, bw, bh);
  const glOn = glActive(); // 새 빛 — 그래픽 칩이 없으면 render/light.js의 어둠 그림으로 덮어요
  try {
    if (glOn) beginGB(lowCtx, bw * HD, bh * HD);
    try { drawLab(bw, bh, glOn); } finally { endGB(); }
    if (glOn) { let out = null; try { out = shadeGL(lowCv, bw * HD, bh * HD, ix, iy); } catch (e) { GLST.failed = true; GLST.err = String(e && e.message || e); console.warn('새 빛 효과 오류 — 예전 빛으로 그려요:', e); }
      lowCtx.setTransform(1, 0, 0, 1, 0, 0); if (out) lowCtx.drawImage(out, 0, 0); lowCtx.setTransform(HD, 0, 0, HD, 0, 0); }
    drawLabPost(bw, bh);
  } finally { ctx = mainCtx; Z = RZ; TP = 16 * RZ; lowCtx.setTransform(1, 0, 0, 1, 0, 0); }
  const ox = Math.round((ix - gx) * RZ), oy = Math.round((iy - gy) * RZ), css = `${bw * RZ / DPR}|${bh * RZ / DPR}|${ox / DPR}|${oy / DPR}`;
  if (css !== wcvCss) { wcvCss = css; const st = lowCv.style; st.width = bw * RZ / DPR + 'px'; st.height = bh * RZ / DPR + 'px'; st.transform = `translate(${ox / DPR}px,${oy / DPR}px)`; }
  VIEW = { camX: gx * RZ, camY: gy * RZ, baseX: bx0 * RZ, baseY: by0 * RZ };
  drawLabTop(mainCtx, TP, VIEW.camX, VIEW.camY, DPR);
}
