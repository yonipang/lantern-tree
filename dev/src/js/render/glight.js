// ================= v73 새 빛 효과 (빛 데모의 WebGL2 방식) =================
// 그리는 순서는 예전 그대로(2D 캔버스에 세계를 그림). 그와 함께 같은 자리에 두 장을 더 그려요:
//   면 정보(matCv): 바닥·벽 윗면·벽 앞면·서 있는 것과 높이 — 그림마다 한 번 만들어 둔 「면 그림」을 같은 자리에 그려요
//   발광(emCv): 스스로 빛나는 픽셀(광석·반딧불이·등불나무 빛) — 나머지는 검은 실루엣으로 뒤를 가려요
// 그다음 그래픽 칩(WebGL2)이 픽셀마다 빛을 계산해요: 빛마다 벽 그림자(부드러운 경계), 면 방향에 따른 밝기, 발광, 밝은 곳 번짐.
// 몬스터가 생기는 규칙·지도 밝히기는 예전처럼 render/light.js의 칸 단위 밝기를 써요 (보이는 것만 바뀜).
// 그래픽 칩을 못 쓰거나 메뉴에서 「예전 빛」을 고르면 예전 방식 그대로예요.
import { G } from '../save/state.js';
import { H, idx, W } from '../world/map.js';
import { LIGHTS } from './light.js';
import { GLOW_RULE } from './terrain.js';

export let lightPref = 'new'; try { lightPref = localStorage.getItem('lantern-tree-light') || 'new'; } catch (e) { }
export const setLightPref = v => { lightPref = v; try { localStorage.setItem('lantern-tree-light', v); } catch (e) { } };
export const GLST = { failed: false, err: '', frames: 0, renderer: '', soft: false };
// ---------------- G-buffer (2D 캔버스 두 장) ----------------
export const GB = { on: false, kind: 'floor', ore: 0 };
const matCv = document.createElement('canvas'), emCv = document.createElement('canvas');
const mctx = matCv.getContext('2d'), ectx = emCv.getContext('2d');
const GLAY = new WeakMap();
// kind: 'floor' 바닥(면 그림 없음) · 'top' 벽 윗면 · 'front' 벽 앞면 · 'up' 서 있는 것 · 'shade' 벽 윗면 그늘(발광도 어둡게) · 'off' 안 그림
export function drawKind(k, ore = 0) { GB.kind = k; GB.ore = ore; }
function gxlayerOf(img, kind, ore) {
  let m = GLAY.get(img); if (!m) { m = {}; GLAY.set(img, m); }
  const key = kind + ore; if (m[key]) return m[key];
  const w = img.width, h = img.height; if (!w || !h) return m[key] = { mat: null, em: null };
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  if (kind === 'shade') { const d = g.getImageData(0, 0, w, h); for (let k = 0; k < d.data.length; k += 4) { d.data[k] = d.data[k + 1] = d.data[k + 2] = 0; d.data[k + 3] = Math.min(255, Math.round(d.data[k + 3] / .96)); } g.putImageData(d, 0, 0); return m[key] = { mat: null, em: c }; } // the shade hides glow fully (black, not the shade's own colour)
  const src = g.getImageData(0, 0, w, h).data, M = new ImageData(w, h), E = new ImageData(w, h), rule = GLOW_RULE[ore];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = (y * w + x) * 4; if (src[k + 3] < 128) continue; let ty, z, off;
    if (kind === 'top') { ty = 3; z = 16; off = 12 + Math.round(y / 3); }
    else if (kind === 'front') { ty = 2; z = Math.max(0, h - y); off = h + 1 - y; }
    else { ty = 4; z = Math.min(255, h - y); off = Math.min(127, h - y); }
    M.data[k] = ty * 40; M.data[k + 1] = z; M.data[k + 2] = 128 + off; M.data[k + 3] = 255;
    const on = rule && rule(src[k], src[k + 1], src[k + 2]);
    E.data[k] = on ? src[k] : 0; E.data[k + 1] = on ? src[k + 1] : 0; E.data[k + 2] = on ? src[k + 2] : 0; E.data[k + 3] = 255;
  }
  const mat = document.createElement('canvas'), em = document.createElement('canvas'); mat.width = em.width = w; mat.height = em.height = h;
  mat.getContext('2d').putImageData(M, 0, 0); em.getContext('2d').putImageData(E, 0, 0);
  return m[key] = { mat, em };
}
function gxmirror(g, img, args) {
  if (GB.kind === 'floor' || GB.kind === 'off' || !img || g.globalCompositeOperation !== 'source-over' || g.globalAlpha < .5) return;
  const L = gxlayerOf(img, GB.kind, GB.ore); if (!L.mat && !L.em) return;
  const tf = g.getTransform(), a = Array.prototype.slice.call(args);
  if (a.length === 3) a.push(img.width, img.height); // same size as drawn (hd art is drawn at its own size since v53)
  if (L.mat) { mctx.setTransform(tf); a[0] = L.mat; mctx.drawImage.apply(mctx, a); }
  if (L.em) { ectx.setTransform(tf); a[0] = L.em; ectx.drawImage.apply(ectx, a); }
}
// 한 장 그리기 시작: 면 정보는 「바닥」으로, 발광은 검정으로 채우고, 세계 캔버스의 drawImage를 따라 그리게 해요
export function beginGB(g, bw, bh) {
  if (matCv.width !== bw || matCv.height !== bh) { matCv.width = emCv.width = bw; matCv.height = emCv.height = bh; }
  for (const c of [mctx, ectx]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.imageSmoothingEnabled = false; }
  mctx.fillStyle = 'rgb(40,0,128)'; mctx.fillRect(0, 0, bw, bh); ectx.fillStyle = '#000'; ectx.fillRect(0, 0, bw, bh);
  if (!g.__gb) { const orig = g.drawImage; g.drawImage = function (img) { const r = orig.apply(g, arguments); if (GB.on) gxmirror(g, img, arguments); return r; }; g.__gb = true; }
  GB.on = true; GB.kind = 'floor'; GB.ore = 0;
}
export function endGB() { GB.on = false; }
// 발광 캔버스에 직접 그리기 (반딧불이·물빛·등불나무 빛: 'lighter'로 더해요)
export function emCtxFor(g) { ectx.setTransform(g.getTransform()); ectx.globalAlpha = 1; ectx.globalCompositeOperation = 'source-over'; ectx.imageSmoothingEnabled = false; return ectx; }

// ---------------- WebGL2 ----------------
const gxMAXL = 40;
let gl = null, glCv = null, PV, PL, PB, PBl, PF, gxvao, texA, texM, texE, texOcc, visTex, visFb, fbLit = null, fbB1 = null, fbB2 = null, gxcurW = 0, gxcurH = 0;
const gxVS = `#version 300 es
layout(location = 0) in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
const gxSOFT_N = 16, gxSOFT_R = 6; // 벽 그림자 경계: 광선 16개, 빛의 반너비 6px
const gxRAY = `
bool occ(ivec2 c){ if (c.x < 0 || c.y < 0 || float(c.x) >= uMap.x || float(c.y) >= uMap.y) return true; ivec2 q = c - uOccO;
  if (q.x < 0 || q.y < 0 || q.x >= uOccS.x || q.y >= uOccS.y) return false; return texelFetch(uOcc, q, 0).r > 0u; }
float ray(vec2 a, vec2 b, ivec2 skip){
  vec2 p = a / 16., q = b / 16., d = q - p; ivec2 c = ivec2(floor(p)), e = ivec2(floor(q));
  ivec2 st = ivec2(sign(d)); vec2 inv = 1. / max(abs(d), vec2(1e-5));
  vec2 tm = vec2(d.x > 0. ? float(c.x) + 1. - p.x : p.x - float(c.x), d.y > 0. ? float(c.y) + 1. - p.y : p.y - float(c.y)) * inv;
  for (int i = 0; i < 72; i++) {
    if (c != skip && occ(c)) return 0.;
    if (c == e) return 1.;
    if (tm.x < tm.y) { if (tm.x > 1.) return 1.; tm.x += inv.x; c.x += st.x; } else { if (tm.y > 1.) return 1.; tm.y += inv.y; c.y += st.y; }
  }
  return 1.;
}
float softVis(vec2 a, vec2 b, ivec2 skip){
  vec2 dir = normalize(b - a + vec2(1e-4)), n = vec2(-dir.y, dir.x) * ${gxSOFT_R.toFixed(1)};
  float s = 0., wsum = 0.;
  for (int k = 0; k < ${gxSOFT_N}; k++) { float t = (float(k) + .5) / ${gxSOFT_N}. * 2. - 1., w = sqrt(1. - t * t); s += ray(a, b + n * t, skip) * w; wsum += w; }
  return s / wsum;
}`;
const gxVIS = `#version 300 es
precision highp float; precision highp int;
uniform highp usampler2D uOcc; uniform vec2 uMap, uLight, uOrigin, uSlot; uniform ivec2 uOccO, uOccS; out vec4 o;
${gxRAY}
void main(){ vec2 P = uOrigin + gl_FragCoord.xy - uSlot; o = vec4(softVis(P, uLight, ivec2(floor(P / 16.))), 0., 0., 1.); }`;
const gxLIT = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uAlb, uMat, uEm, uVis;
uniform vec2 uCam; uniform vec3 uAmb; uniform int uN;
uniform vec4 uL0[${gxMAXL}], uL1[${gxMAXL}], uVisR[${gxMAXL}], uGlow[${gxMAXL}];
out vec4 o;
void main(){
  ivec2 gp = ivec2(gl_FragCoord.xy);
  vec3 alb = texelFetch(uAlb, gp, 0).rgb; vec4 m = texelFetch(uMat, gp, 0); vec3 em = texelFetch(uEm, gp, 0).rgb;
  int ty = m.a < .5 ? 0 : int(m.r * 255. / 40. + .5);
  vec2 sp = vec2(gp) + .5 + uCam;
  if (ty == 0) { o = vec4(alb * .05, 1.); return; }
  float z = m.g * 255., off = m.b * 255. - 128.;
  vec3 P = vec3(sp.x, sp.y + off, z);
  vec3 acc = uAmb * (ty == 3 ? .7 : 1.);
  for (int i = 0; i < ${gxMAXL}; i++) { if (i >= uN) break;
    vec3 L = uL0[i].xyz - P; float d = length(L.xy), r = uL0[i].w; if (d >= r) continue;
    float at = pow(1. - d / r, 1.7);
    vec3 Ln = normalize(L); float ndl;
    if (ty == 2) ndl = smoothstep(-.05, .45, Ln.y) * 1.15;
    else if (ty == 3) ndl = .42;
    else if (ty == 4) ndl = .8 + .2 * max(dot(normalize(vec3(0., .55, .85)), Ln), 0.);
    else ndl = .82 + .18 * Ln.z;
    if (ndl <= 0.) continue;
    float gxsh = 1.; vec4 vr = uVisR[i];
    if (vr.x >= 0.) { ivec2 q = ivec2(floor(P.xy - vr.zw)); float sz = uGlow[i].w; if (q.x >= 0 && q.y >= 0 && float(q.x) < sz && float(q.y) < sz) gxsh = texelFetch(uVis, ivec2(vr.xy) + q, 0).r; }
    acc += uL1[i].rgb * uL1[i].w * at * ndl * gxsh;
  }
  vec3 c = alb * acc * 1.45;
  c += em * 1.1;
  float lc = dot(c, vec3(.3, .59, .11)); c *= (1. - exp(-lc * 1.2)) / max(lc, 1e-4);
  for (int i = 0; i < ${gxMAXL}; i++) { if (i >= uN) break; if (uGlow[i].z <= 0.) continue;
    float d = length(sp - uGlow[i].xy) / (uGlow[i].z * 1.25); if (d >= 1.) continue; float a = (1. - d); c += uL1[i].rgb * a * a * .16; }
  o = vec4(c, 1.);
}`;
const gxBRIGHT = `#version 300 es
precision highp float; uniform sampler2D uLit, uEm; uniform vec2 uBuf; out vec4 o;
void main(){ ivec2 b = ivec2(gl_FragCoord.xy) * 2, hi = ivec2(uBuf) - 1; vec3 c = vec3(0.), e = vec3(0.);
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) { ivec2 t = min(b + ivec2(i, j), hi); c += texelFetch(uLit, t, 0).rgb; e += texelFetch(uEm, t, 0).rgb; }
  vec3 r = max(c * .25 - .7, 0.) * 1.5 + e * .25 * .4; o = vec4(r, 1.); }`;
const gxBLUR = `#version 300 es
precision highp float; uniform sampler2D uSrc; uniform vec2 uDir, uInv; out vec4 o;
void main(){ vec2 uv = gl_FragCoord.xy * uInv; vec3 c = texture(uSrc, uv).rgb * .227;
  c += (texture(uSrc, uv + uDir * 1.385).rgb + texture(uSrc, uv - uDir * 1.385).rgb) * .316;
  c += (texture(uSrc, uv + uDir * 3.231).rgb + texture(uSrc, uv - uDir * 3.231).rgb) * .07; o = vec4(c, 1.); }`;
// 화면으로: 위아래를 뒤집어(캔버스 맨 윗줄 = 세계 맨 윗줄) 번짐을 더해요
const gxFINAL = `#version 300 es
precision highp float; uniform sampler2D uLit, uBloom; uniform vec2 uBuf; uniform float uBloomK; out vec4 o;
void main(){ ivec2 t = ivec2(int(gl_FragCoord.x), int(uBuf.y) - 1 - int(gl_FragCoord.y));
  vec3 c = texelFetch(uLit, t, 0).rgb + texture(uBloom, (vec2(t) + .5) / uBuf).rgb * uBloomK; o = vec4(c, 1.); }`;
function gxsh(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
function gxprog(fs) { const p = gl.createProgram(); gl.attachShader(p, gxsh(gl.VERTEX_SHADER, gxVS)); gl.attachShader(p, gxsh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i), nm = (a.name.endsWith('[0]') ? a.name.slice(0, -3) : a.name); u[nm] = gl.getUniformLocation(p, a.name); } return { p, u }; }
function gxtex(filter) { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
function gxtexN(w, h, filter, ifmt = gl.RGBA8, fmt = gl.RGBA) { const t = gxtex(filter); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, gl.UNSIGNED_BYTE, null); return t; }
function gxfbo(w, h, t) { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { f, t, w, h }; }
const gxfreeFb = b => { if (!b) return; gl.deleteFramebuffer(b.f); gl.deleteTexture(b.t); };
function gxbindT(unit, t, loc) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); }
// 빛마다 벽 그림자 지도를 한 칸씩 (크기별 줄: 128·256·512·1024px)
const gxVIS_W = 2048; let gxBANDS = [];
function gxinitGL() {
  glCv = document.createElement('canvas'); glCv.width = glCv.height = 1;
  gl = glCv.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('WebGL2를 쓸 수 없어요');
  // 그래픽 칩 없이 CPU로 흉내 내는 WebGL(SwiftShader·llvmpipe …)은 너무 느려서 예전 빛을 써요 ('force'면 그래도 새 빛 — 테스트용)
  const dbg = gl.getExtension('WEBGL_debug_renderer_info'); GLST.renderer = String(dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  if (/swiftshader|llvmpipe|softpipe|software|microsoft basic/i.test(GLST.renderer) && lightPref !== 'force') { GLST.soft = true; throw new Error('그래픽 칩 없이 그리는 브라우저라 느려요: ' + GLST.renderer); }
  glCv.addEventListener('webglcontextlost', e => { e.preventDefault(); GLST.failed = true; GLST.err = 'context lost'; gl = null; });
  PV = gxprog(gxVIS); PL = gxprog(gxLIT); PB = gxprog(gxBRIGHT); PBl = gxprog(gxBLUR); PF = gxprog(gxFINAL);
  gxvao = gl.createVertexArray(); gl.bindVertexArray(gxvao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  texA = gxtex(gl.NEAREST); texM = gxtex(gl.NEAREST); texE = gxtex(gl.NEAREST); texOcc = gxtex(gl.NEAREST);
  const maxT = gl.getParameter(gl.MAX_TEXTURE_SIZE); let y = 0; gxBANDS = [];
  for (const [s, rows] of [[128, 2], [256, 3], [512, 1], [1024, 1]]) { if (y + s * rows > maxT) break; gxBANDS.push({ s, y, rows, n: (gxVIS_W / s) * rows, free: [] }); for (let k = 0; k < (gxVIS_W / s) * rows; k++) gxBANDS[gxBANDS.length - 1].free.push(k); y += s * rows; }
  visTex = gxtexN(gxVIS_W, y, gl.NEAREST, gl.R8, gl.RED); visFb = gxfbo(gxVIS_W, y, visTex);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('그림자 지도를 만들 수 없어요');
}
export function glReady() {
  if (gl) return true; if (GLST.failed) return false;
  try { gxinitGL(); return true; } catch (e) { GLST.failed = true; GLST.err = String(e && e.message || e); gl = null; console.warn('새 빛 효과를 쓸 수 없어 예전 빛으로 그려요:', GLST.err); return false; }
}
export const glActive = () => (lightPref === 'new' || lightPref === 'force') && glReady();
function gxsizeTargets(w, h) {
  if (w === gxcurW && h === gxcurH) return; gxcurW = w; gxcurH = h;
  for (const b of [fbLit, fbB1, fbB2]) gxfreeFb(b);
  fbLit = gxfbo(w, h, gxtexN(w, h, gl.NEAREST)); const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1);
  fbB1 = gxfbo(hw, hh, gxtexN(hw, hh, gl.LINEAR)); fbB2 = gxfbo(hw, hh, gxtexN(hw, hh, gl.LINEAR));
  glCv.width = w; glCv.height = h;
}
// ---- 벽 칸 지도 (보이는 곳 + 빛이 닿는 곳만, 매 장) — 바뀐 칸이 있으면 그림자를 모두 다시 구워요 ----
let gxoccMap = null, gxoccVer = 0, gxoccBuf = new Uint8Array(0);
const gxOCC = { x: 0, y: 0, w: 0, h: 0 };
function gxuploadOcc(x0, y0, x1, y1) {
  if (!gxoccMap) { gxoccMap = new Uint8Array(W * H); gxoccMap.fill(255); }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W - 1, x1); y1 = Math.min(H - 1, y1);
  const w = Math.max(1, x1 - x0 + 1), h = Math.max(1, y1 - y0 + 1); if (gxoccBuf.length < w * h) gxoccBuf = new Uint8Array(w * h * 2);
  let changed = false;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = idx(x0 + x, y0 + y), v = G.wall[i] ? 1 : 0; gxoccBuf[y * w + x] = v; const o = gxoccMap[i]; if (o !== v) { if (o !== 255) changed = true; gxoccMap[i] = v; } }
  gxOCC.x = x0; gxOCC.y = y0; gxOCC.w = w; gxOCC.h = h;
  gl.bindTexture(gl.TEXTURE_2D, texOcc); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8UI, w, h, 0, gl.RED_INTEGER, gl.UNSIGNED_BYTE, gxoccBuf.subarray(0, w * h));
  if (changed) gxoccVer++;
}
// ---- 그림자 지도 칸 (빛 자리마다 하나, 오래 안 쓰면 비워요) ----
const gxSLOTS = new Map(); let gxclock = 0;
function gxslotFor(key, R) {
  let s = gxSLOTS.get(key); const need = 2 * R + 2;
  if (s && s.size >= need) { s.used = gxclock; return s; }
  if (s) { gxBANDS[s.b].free.push(s.k); gxSLOTS.delete(key); }
  let bi = gxBANDS.findIndex(b => b.s >= need); if (bi < 0) bi = gxBANDS.length - 1; const b = gxBANDS[bi];
  if (!b.free.length) { let old = null, ot = Infinity; for (const [k2, v] of gxSLOTS) if (v.b === bi && v.used < gxclock && v.used < ot) { ot = v.used; old = k2; } if (old === null) return null; b.free.push(gxSLOTS.get(old).k); gxSLOTS.delete(old); }
  const k = b.free.pop(), per = gxVIS_W / b.s;
  s = { b: bi, k, ax: (k % per) * b.s, ay: b.y + Math.floor(k / per) * b.s, size: Math.min(b.s, need), R: Math.min(R, (b.s >> 1) - 1), ver: -1, lx: NaN, ly: NaN, used: gxclock };
  gxSLOTS.set(key, s); return s;
}
function gxbake(s, lx, ly) {
  if (s.ver === gxoccVer && s.lx === lx && s.ly === ly) return;
  s.ver = gxoccVer; s.lx = lx; s.ly = ly; s.ox = Math.floor(lx - s.R); s.oy = Math.floor(ly - s.R);
  gl.viewport(s.ax, s.ay, s.size, s.size); gl.uniform2f(PV.u.uLight, lx, ly); gl.uniform2f(PV.u.uOrigin, s.ox, s.oy); gl.uniform2f(PV.u.uSlot, s.ax, s.ay);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
const gxU0 = new Float32Array(gxMAXL * 4), gxU1 = new Float32Array(gxMAXL * 4), gxUV = new Float32Array(gxMAXL * 4), gxUG = new Float32Array(gxMAXL * 4);
// 이번 장에 쓸 빛 고르기 (보이는 곳에 닿는 것, 플레이어 빛 먼저, 가까운 순)
function gxpickLights(camX, camY, bw, bh) {
  const p = G.p, out = [], cx = camX + bw / 2, cy = camY + bh / 2;
  LIGHTS.forEach((L, i) => { const x = (i === 0 ? p.x : L.x) * 16, y = (i === 0 ? p.y - .3 : L.y) * 16, r = L.r * 16;
    if (x + r < camX || y + r < camY || x - r > camX + bw || y - r > camY + bh + 24) return;
    const z = i === 0 ? 22 : i === 1 ? 34 : L.col ? (L.tall ? 18 : 9) : L.c[1] < .6 && !L.col ? 5 : 16;
    out.push({ key: i === 0 ? 'P' : i === 1 ? 'T' : (x | 0) + ',' + (y | 0), x, y, z, r, c: L.c, k: L.k, glow: !!L.col && i !== 0, tall: L.tall, d: i === 0 ? -1 : Math.hypot(x - cx, y - cy) }); });
  out.sort((a, b) => a.d - b.d); if (out.length > gxMAXL) out.length = gxMAXL; return out;
}
// 세계를 다 그린 뒤: 빛을 입힌 그림(glCv, bw×bh)을 돌려줘요 — 화면에는 예전처럼 lowCv를 거쳐 그려요
export function shadeGL(albCv, bw, bh, camX, camY) {
  GLST.frames++; gxsizeTargets(bw, bh); gxclock++;
  for (const [t, src] of [[texA, albCv], [texM, matCv], [texE, emCv]]) { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src); }
  const L = gxpickLights(camX, camY, bw, bh), n = L.length;
  // 벽 칸 지도: 화면 + 고른 빛의 그림자 지도 범위
  let x0 = camX, y0 = camY, x1 = camX + bw, y1 = camY + bh;
  for (const l of L) { const R = Math.ceil(l.r * 1.1) + 2; x0 = Math.min(x0, l.x - R); y0 = Math.min(y0, l.y - R); x1 = Math.max(x1, l.x + R); y1 = Math.max(y1, l.y + R); }
  gxuploadOcc(Math.floor(x0 / 16) - 1, Math.floor(y0 / 16) - 1, Math.ceil(x1 / 16) + 1, Math.ceil(y1 / 16) + 1);
  gl.bindVertexArray(gxvao); gl.disable(gl.BLEND);
  gl.bindFramebuffer(gl.FRAMEBUFFER, visFb.f); gl.useProgram(PV.p);
  gxbindT(5, texOcc, PV.u.uOcc); gl.uniform2f(PV.u.uMap, W, H); gl.uniform2i(PV.u.uOccO, gxOCC.x, gxOCC.y); gl.uniform2i(PV.u.uOccS, gxOCC.w, gxOCC.h);
  gxUG.fill(0); gxUV.fill(-1);
  for (let i = 0; i < n; i++) { const l = L[i], o = i * 4, s = gxslotFor(l.key, Math.ceil(l.r * 1.1) + 2);
    if (s) { gxbake(s, l.x, l.y); gxUV[o] = s.ax; gxUV[o + 1] = s.ay; gxUV[o + 2] = s.ox; gxUV[o + 3] = s.oy; gxUG[o + 3] = s.size; }
    gxU0[o] = l.x; gxU0[o + 1] = l.y; gxU0[o + 2] = l.z; gxU0[o + 3] = l.r;
    gxU1[o] = l.c[0]; gxU1[o + 1] = l.c[1]; gxU1[o + 2] = l.c[2]; gxU1[o + 3] = l.k;
    if (l.glow) { gxUG[o] = l.x; gxUG[o + 1] = l.y - (l.tall ? .9 : .35) * 16; gxUG[o + 2] = Math.min(l.r / 16, 7) * 16 * .38; } }
  // 빛 계산
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbLit.f); gl.viewport(0, 0, bw, bh); gl.useProgram(PL.p); const u = PL.u;
  gl.uniform4fv(u.uL0, gxU0); gl.uniform4fv(u.uL1, gxU1); gl.uniform4fv(u.uVisR, gxUV); gl.uniform4fv(u.uGlow, gxUG); gl.uniform1i(u.uN, n);
  const amb = (.075 + G.treeSeeds * .03) * .7; gl.uniform3f(u.uAmb, amb * .85, amb * .8, amb * 1.35);
  gl.uniform2f(u.uCam, camX, camY); gxbindT(0, texA, u.uAlb); gxbindT(1, texM, u.uMat); gxbindT(2, texE, u.uEm); gxbindT(4, visTex, u.uVis);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // 번짐
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbB1.f); gl.viewport(0, 0, fbB1.w, fbB1.h); gl.useProgram(PB.p);
  gxbindT(0, fbLit.t, PB.u.uLit); gxbindT(1, texE, PB.u.uEm); gl.uniform2f(PB.u.uBuf, bw, bh); gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.useProgram(PBl.p);
  for (let k = 0; k < 2; k++) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB2.f); gxbindT(0, fbB1.t, PBl.u.uSrc); gl.uniform2f(PBl.u.uDir, 1 / fbB1.w, 0); gl.uniform2f(PBl.u.uInv, 1 / fbB2.w, 1 / fbB2.h); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbB1.f); gxbindT(0, fbB2.t, PBl.u.uSrc); gl.uniform2f(PBl.u.uDir, 0, 1 / fbB1.h); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  // 화면용 한 장
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, bw, bh); gl.useProgram(PF.p);
  gxbindT(0, fbLit.t, PF.u.uLit); gxbindT(1, fbB1.t, PF.u.uBloom); gl.uniform2f(PF.u.uBuf, bw, bh); gl.uniform1f(PF.u.uBloomK, .55);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return glCv;
}
export const glDebug = () => ({ on: !!gl, failed: GLST.failed, soft: GLST.soft, renderer: GLST.renderer, err: GLST.err, frames: GLST.frames, err2: gl ? gl.getError() : -1, slots: gxSLOTS.size, gxoccVer });
// 테스트·확인용: 지금 면 정보·발광 캔버스와 빛을 입힌 결과 (data URL)
export const glDump = () => ({ mat: matCv.toDataURL(), em: emCv.toDataURL(), out: gxglCvURL() });
function gxglCvURL() { try { return glCv ? glCv.toDataURL() : ''; } catch (e) { return ''; } }
