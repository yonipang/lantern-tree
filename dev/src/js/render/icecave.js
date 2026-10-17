// ================= v79 얼음 동굴 새 방식 시험 (인계 묶음 HANDOFF.md 3-2, 2026-10-16 사용자 확정 그림) · v80 다른 바위에도 기울어진 가장자리 =================
// v80: 기울어진 가장자리는 얼음벽 + 흙·돌·화강암·현무암·광맥(SLANT)에 모두 써요. 바위는 v73 그림(render/terrain.js)을 그대로 깎아 그리고, 벽 옆 바닥엔 청록빛 대신 옅은 그림자.
//   얼어붙은 물(20, 얼음 동굴)도 새 얼음판 그림 — 물과의 경계가 구불구불해요(render/terrain.js bakeFloor).
// 그리는 방식(2D 캔버스 + 칸 그림)은 그대로, 얼음 동굴의 그림만 새로 만들어요. 그림 파일 없이 처음 쓸 때 코드로 만들고 칸마다 기억해요.
//   벽(얼음벽 11): 밝은 얼음 파랑 큰 면 + 대각선 어두운 금 그물 + 연한 줄·드문 반짝임, 윗면 가장자리 1px 밝은 테두리(군데군데 청록),
//     앞면은 위 #2552c2 → 아래 #122c82, 맨 위 줄 밝게·맨 아래 줄 청록.
//     모양(v82 오토타일): 주변 8칸과 변형 번호로 정한 칸 모양 — 곧은 변 2px, 바깥 모서리 5px까지 비스듬히, 1px 요철 (아래 「벽 모양」).
//     들어가는 건 칸 안쪽으로만 (부딪히는 판정은 칸 단위 그대로). 벽 칸 아래에도 얼음 바닥을 깔아 깎인 곳에 바닥이 보여요.
//   바닥(얼음 동굴의 눈 바닥 19): 길쭉한 얼음 조각 면이 두 방향으로 엇갈림, 파랑 5단계(#1a49c4~#3f86f2), 꾸밈 X 서리 무늬·작은 연보라 점.
//   벽과 바닥 사이: 바닥 쪽으로 청록빛이 덩어리지게 들쭉날쭉 번짐(벽에서 0~11px, #86f2d2 → #2a7ee6) — 새 빛에서는 스스로 빛나요.
import { hash2 } from '../engine/random.js';
import { G } from '../save/state.js';
import { idx, inB } from '../world/map.js';
import { presetLayers } from './glight.js';
import { TR } from './terrain.js';

export const ICE_W = 11, ICE_BIOME = 4, ICE_SNOW = 19, ICE_FROZEN = 20;
export const SLANT = new Set([ICE_W, 1, 2, 3, 9, 4, 5, 10, 12, 13]); // 가장자리가 기울어지는 벽 (얼음·흙·돌·화강암·현무암·광맥 5종)
const ic_hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ic_mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const IC = {
  top: ['#1d42ad', '#2350bd', '#295bc8', '#2f63d1', '#356bd9'].map(ic_hex), crack: ic_hex('#162f8c'), line: ic_hex('#5a8ce6'), spark: ic_hex('#ffffff'),
  rim: ic_hex('#7fb8f8'), rimT: ic_hex('#7ff0d6'), fTop: ic_hex('#2552c2'), fBot: ic_hex('#122c82'), fHi: ic_hex('#5a8ce6'), fLow: ic_hex('#54d8c6'), fSide: ic_hex('#0e2266'),
  floor: ['#1a49c4', '#2357cf', '#2b66da', '#3576e6', '#3f86f2'].map(ic_hex), seam: ic_hex('#173fae'), frost: ic_hex('#a8e4ff'), dot: ic_hex('#c6b6ff'),
  frz: ['#3577dc', '#3d80e1', '#4789e6'].map(ic_hex), frzLine: ic_hex('#cdeeff'), frzBub: ic_hex('#9fd0ff'), frzRim: ic_hex('#e2f6ff'),
  glowA: ic_hex('#86f2d2'), glowB: ic_hex('#2a7ee6'), edge: ic_hex('#123590'), edgeS: ic_hex('#1b44b4'), cliffT: ic_hex('#2a5ccc'), cliffB: ic_hex('#15358f'), foam: ic_hex('#d6f4ff'),
};
const ICE = { ins: [1, 1, 2, 3, 5], round: 5, shadeRim: 4, shadeFade: 9, shadeBlack: .9, glowMax: 11, frontUp: 12 };
const ROCK = { shadeRim: 2, shadeFade: 5, shadeBlack: .96, shadow: [.34, .2, .09] }; // 바위: 예전 벽 그늘 그대로, 벽 옆 바닥 그림자 3px
// 새 빛에서 얼음이 스스로 내는 빛 (픽셀 밝기별 비율): 밝은 테두리·맨 아래 청록 줄은 많이, 나머지 얼음은 조금
export const ICE_EM = (r, g, b) => (.3 * r + .59 * g + .11 * b) > 150 ? .85 : .22;
export const isIceShard = i => G.biome[i] === ICE_BIOME && G.floor[i] === ICE_SNOW && !G.wall[i];
const ic_open = (x, y) => inB(x, y) && !G.wall[idx(x, y)];
// ---- 벽 모양: v82 오토타일 ----
// 칸 모양은 주변 8칸(열림/막힘)과 변형 번호(0~2)만으로 정해요 — 같은 조합이면 어디서나 같은 그림이라 미리 만들어 둔 칸을 다시 써요.
//   곧은 변: 열린 쪽으로 2px 들어감 · 바깥 모서리(두 변이 열림): 꼭짓점 5px까지 비스듬히 + 대각선으로 깎음
//   변 끝에서 옆 칸이 막혔으면: 대각선 칸이 열렸으면 2px 그대로 이어지고, 막혔으면 0px로 줄어 옆 벽과 맞물려요
//   안쪽 모서리(대각선만 열림): 3px 비스듬히 · 변 가운데(4~11px)에 1px 요철(변형마다 다름)
//   주변 8칸 번호(ic_sig): 0 북서 · 1 북 · 2 북동 · 3 서 · 4 동 · 5 남서 · 6 남 · 7 남동 (1 = 열림)
export const AUTOTILE = { dep: 2, corner: 5, cut: 7, notch: 3, variants: 3 };
const ic_SH = new Map(), ic_OCC = new Map();
// 모양에 영향 없는 대각선은 지워요 (두 옆이 모두 열린 모서리)
export function canonSig(s) { const o = b => (s >> b) & 1; if (o(1) && o(3)) s &= ~1; if (o(1) && o(4)) s &= ~4; if (o(6) && o(3)) s &= ~32; if (o(6) && o(4)) s &= ~128; return s; }
const ic_var = (x, y) => (hash2(x, y, 207) * AUTOTILE.variants) | 0;
// 한 변을 따라 들어가는 정도 (16칸): aO·aD = t=0 쪽 옆 칸 열림·대각선 열림, bO·bD = t=15 쪽
function ic_side(aO, aD, bO, bD, vr, seed, bump) {
  const r = new Int8Array(16), A = AUTOTILE;
  for (let t = 0; t < 16; t++) { let d = A.dep;
    if (aO) d = Math.max(d, A.corner - t); else if (!aD) d = Math.min(d, t);
    if (bO) d = Math.max(d, A.corner - (15 - t)); else if (!bD) d = Math.min(d, 15 - t);
    if (bump && t >= 4 && t <= 11 && hash2(vr, Math.floor(t / 3), seed) < .3) d++;
    r[t] = d; }
  return r; }
// 칸 모양 (16×16, 1 = 벽) — sig: 주변 8칸, vr: 변형, bump: 요철 넣기
export function autoShape(sig, vr = 0, bump = true) {
  sig = canonSig(sig); const key = sig * 8 + vr * 2 + (bump ? 1 : 0); let m = ic_SH.get(key); if (m) return m;
  const o = b => (sig >> b) & 1, oN = o(1), oE = o(4), oS = o(6), oW = o(3), A = AUTOTILE;
  const N = oN ? ic_side(oW, o(0), oE, o(2), vr, 211, bump) : null, S = oS ? ic_side(oW, o(5), oE, o(7), vr, 212, bump) : null;
  const Wd = oW ? ic_side(oN, o(0), oS, o(5), vr, 213, bump) : null, E = oE ? ic_side(oN, o(2), oS, o(7), vr, 214, bump) : null;
  m = new Uint8Array(256);
  for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) { const iu = 15 - u, iv = 15 - v;
    if ((N && v < N[u]) || (S && iv < S[u]) || (Wd && u < Wd[v]) || (E && iu < E[v])) continue;
    if ((oN && oW && u + v < A.cut) || (oN && oE && iu + v < A.cut) || (oS && oW && u + iv < A.cut) || (oS && oE && iu + iv < A.cut)) continue;
    if ((!oN && !oW && o(0) && u + v < A.notch) || (!oN && !oE && o(2) && iu + v < A.notch) || (!oS && !oW && o(5) && u + iv < A.notch) || (!oS && !oE && o(7) && iu + iv < A.notch)) continue;
    m[v * 16 + u] = 1; }
  ic_SH.set(key, m); return m; }
// 그림자용 4px 칸 (4×4 = 16비트, 9픽셀 이상 벽이면 막힘)
export function autoOcc(m) { let b = ic_OCC.get(m); if (b !== undefined) return b; b = 0;
  for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) { let n = 0; for (let v = 0; v < 4; v++) for (let u = 0; u < 4; u++) n += m[(cy * 4 + v) * 16 + cx * 4 + u]; if (n >= 9) b |= 1 << (cy * 4 + cx); }
  ic_OCC.set(m, b); return b; }
function ic_sig(x, y) { let s = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) { if (ic_open(x + dx, y + dy)) s |= 1 << k; k++; } } return s; }
const ic_slanted = w => SLANT.has(w) && (w === ICE_W || TR.ready); // 기울어진 모양으로 그리는 벽 (바위는 새 그림이 있을 때만)
export const tileShape = (x, y) => autoShape(ic_sig(x, y), ic_var(x, y), true);
// 그림자 지도(render/glight.js)용: 칸 (x,y)의 4px 칸 막힘 (16비트) — 기울어진 벽은 모양대로, 다른 벽은 모두 막힘, 바닥은 0
export function wallOcc4(x, y) { const w = G.wall[idx(x, y)]; if (!w) return 0; if (!ic_slanted(w)) return 0xffff; return autoOcc(tileShape(x, y)); }
// 세계 픽셀 (wx,wy)가 벽 안인지: 기울어지는 벽은 깎인 모양, 다른 벽(지어 쌓는 벽·암반)은 칸 전체, 지도 밖도 벽
export function wallSolidPx(wx, wy) { const x = Math.floor(wx / 16), y = Math.floor(wy / 16); if (!inB(x, y)) return true; const w = G.wall[idx(x, y)]; if (!w) return false; if (!SLANT.has(w)) return true; return !!tileShape(x, y)[(wy - y * 16) * 16 + wx - x * 16]; }
// 픽셀 사각형 [X0, X0+w)×[Y0, Y0+h)의 벽 지도 (칸마다 모양을 한 번만 구해요): 0 바닥 · 1 칸 전체 벽 · 2 얼음벽 · 3 기울어지는 바위
export function wallMask(X0, Y0, w, h) {
  const m = new Uint8Array(w * h), tx0 = Math.floor(X0 / 16), ty0 = Math.floor(Y0 / 16), tx1 = Math.floor((X0 + w - 1) / 16), ty1 = Math.floor((Y0 + h - 1) / 16);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const out = !inB(tx, ty), wl = out ? 8 : G.wall[idx(tx, ty)]; if (!wl) continue;
    const sl = !out && SLANT.has(wl), e = sl ? tileShape(tx, ty) : null, val = !sl ? 1 : wl === ICE_W ? 2 : 3;
    const u0 = Math.max(0, X0 - tx * 16), u1 = Math.min(15, X0 + w - 1 - tx * 16), v0 = Math.max(0, Y0 - ty * 16), v1 = Math.min(15, Y0 + h - 1 - ty * 16);
    for (let v = v0; v <= v1; v++) { const row = (ty * 16 + v - Y0) * w + tx * 16 - X0; if (!e) { m.fill(val, row + u0, row + u1 + 1); continue; } for (let u = u0; u <= u1; u++) if (e[v * 16 + u]) m[row + u] = val; } }
  return m; }
// 거리 (1·1.41 근사): src(k)가 참인 픽셀에서 떨어진 거리
function ic_dist(m, w, h, src) { const d = new Float32Array(w * h), BIG = 1e9; for (let k = 0; k < w * h; k++) d[k] = src(m[k]) ? 0 : BIG;
  // 두 번 훑기 (앞으로: 왼쪽·위·왼쪽 위·오른쪽 위 / 뒤로: 반대) — v81: 함수 호출 없이 (폰에서 빠르게)
  for (let j = 0; j < h; j++) for (let q = 0; q < w; q++) { const k = j * w + q; let v = d[k]; if (!v) continue;
    if (q > 0 && d[k - 1] + 1 < v) v = d[k - 1] + 1;
    if (j > 0) { const u = k - w; if (d[u] + 1 < v) v = d[u] + 1; if (q > 0 && d[u - 1] + 1.41 < v) v = d[u - 1] + 1.41; if (q < w - 1 && d[u + 1] + 1.41 < v) v = d[u + 1] + 1.41; }
    d[k] = v; }
  for (let j = h - 1; j >= 0; j--) for (let q = w - 1; q >= 0; q--) { const k = j * w + q; let v = d[k]; if (!v) continue;
    if (q < w - 1 && d[k + 1] + 1 < v) v = d[k + 1] + 1;
    if (j < h - 1) { const u = k + w; if (d[u] + 1 < v) v = d[u] + 1; if (q < w - 1 && d[u + 1] + 1.41 < v) v = d[u + 1] + 1.41; if (q > 0 && d[u - 1] + 1.41 < v) v = d[u - 1] + 1.41; }
    d[k] = v; }
  return d; }
// ---- 무늬 ----
const ic_vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
// 늘인 조각 (보로노이): 조각마다 두 방향 중 하나로 길쭉해요. 가장 가까운 조각·두 번째와의 차이
function ic_cell(wx, wy, cs, st, s, per = 0) { const gx = Math.floor(wx / cs), gy = Math.floor(wy / cs); let d1 = 1e9, d2 = 1e9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, hx = per ? ((cx % per) + per) % per : cx, hy = per ? ((cy % per) + per) % per : cy; // per: 반복 무늬(칸 per개마다 같은 모양)
    const px = (cx + .15 + hash2(hx, hy, s) * .7) * cs, py = (cy + .15 + hash2(hx, hy, s + 1) * .7) * cs, o = hash2(hx, hy, s + 2) < .5 ? 1 : -1, ax = .86, ay = .5 * o, dx = wx + .5 - px, dy = wy + .5 - py, p = (dx * ax + dy * ay) / st, q = -dx * ay + dy * ax, d = Math.sqrt(p * p + q * q);
    if (d < d1) { d2 = d1; d1 = d; id = hx * 7919 + hy; } else if (d < d2) d2 = d; }
  return { id, gap: d2 - d1 }; }
// v82: 얼음벽 윗면은 32px마다 반복하는 무늬 (오토타일: 칸 그림을 다시 쓰니 무늬도 칸 2개마다 같게) — wx·wy는 0~31
const IC_TP = 32;
const ic_vnP = (x, y, s, P) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = n => ((n % P) + P) % P;
  const a = hash2(w(ix), w(iy), s), b = hash2(w(ix + 1), w(iy), s), c = hash2(w(ix), w(iy + 1), s), d = hash2(w(ix + 1), w(iy + 1), s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
function ic_topPx(wx, wy) {
  wx &= IC_TP - 1; wy &= IC_TP - 1;
  if (hash2(wx, wy, 230) < .0025) return IC.spark;
  const c = ic_cell(wx, wy, 8, 1.6, 231, IC_TP / 8), k = Math.min(4, Math.floor(hash2(c.id, 3, 232) * 5));
  const cr1 = ((wx + wy + Math.round(ic_vnP(wx / 8, wy / 8, 233, 4) * 6)) & 15) === 0 && ic_vnP(wx / 8, wy / 8, 234, 4) > .45;
  const cr2 = ((wx - wy + Math.round(ic_vnP(wx / 8, wy / 8, 235, 4) * 6)) & 15) === 0 && ic_vnP(wx / 8, wy / 8, 236, 4) > .5;
  if (cr1 || cr2 || c.gap < .7) return IC.crack;
  if (((wx + 2 * wy) & 15) === 0 && ic_vnP(wx / 4, wy / 4, 237, 8) > .62) return IC.line;
  return IC.top[k];
}
// 얼음 조각 바닥 무늬는 256px마다 반복 — 처음 한 번 만들어 두고 베껴 써요 (v81: 픽셀마다 계산하던 것이 폰에서 느렸어요)
const IC_P = 256; let ic_FT = null, ic_FC = null;
function ic_floorTex() { if (ic_FT) return ic_FT; ic_FT = new Uint8ClampedArray(IC_P * IC_P * 4);
  for (let y = 0; y < IC_P; y++) for (let x = 0; x < IC_P; x++) { const c = ic_floorCalc(x, y), k = (y * IC_P + x) * 4; ic_FT[k] = c[0]; ic_FT[k + 1] = c[1]; ic_FT[k + 2] = c[2]; ic_FT[k + 3] = 255; }
  ic_FC = ic_cnv(IC_P, IC_P); ic_FC.getContext('2d').putImageData(new ImageData(ic_FT, IC_P, IC_P), 0, 0); return ic_FT; }
function ic_floorPx(wx, wy) { const t = ic_floorTex(), k = (((wy & 255) * IC_P) + (wx & 255)) * 4; return [t[k], t[k + 1], t[k + 2]]; }
function ic_floorCalc(wx, wy) {
  const c = ic_cell(wx, wy, 8, 2.2, 241, IC_P / 8); if (c.gap < .55) return IC.seam;
  let k = Math.floor(hash2(c.id, 5, 242) * 5); if (hash2(c.id, 6, 243) < .2) k = Math.max(0, k - 1); // 일부 조각 조금 어둡게
  return IC.floor[Math.min(4, k)];
}
// 얼어붙은 물(20): 매끈한 얼음판 — 큰 조각 3단계 + 대각선으로 길게 비치는 줄 + 작은 공기 방울, 물 쪽 가장자리는 밝게
export function iceWarm() { ic_floorTex(); iceFrozenPx(0, 0, false); }
let ic_ZT = null; // 얼음판 무늬도 256px마다 반복 (처음 한 번 만들어요)
export function iceFrozenPx(wx, wy, rim) {
  if (rim) return IC.frzRim;
  if (!ic_ZT) { ic_ZT = []; for (let y = 0; y < IC_P; y++) for (let x = 0; x < IC_P; x++) ic_ZT.push(ic_frozenCalc(x, y)); }
  return ic_ZT[(wy & 255) * IC_P + (wx & 255)];
}
function ic_frozenCalc(wx, wy) {
  if ((((wx - 2 * wy) % 29) + 29) % 29 < 2 && ic_vn(wx / 7, wy / 7, 300) > .55) return IC.frzLine;
  if (hash2(wx, wy, 301) < .006) return IC.frzBub;
  const c = ic_cell(wx, wy, 16, 2.6, 302, IC_P / 16); return IC.frz[Math.min(2, Math.floor(hash2(c.id, 7, 303) * 3))];
}
// ---- 칸 그림 (칸마다 기억, 이웃이 바뀌면 다시) ----
// v81: 칸 그림은 칸마다 따로 캔버스를 만들지 않고 아틀라스에 칸(16×92: 윗면 16 · 그늘 16 · 앞면 28 · 바위 아래 그림자 31)으로 모아요.
//   v80에서 칸마다 작은 캔버스를 만들었더니 한 장에 수천 개를 따로 그려 폰에서 많이 밀렸어요(같은 그림판에서 그리면 빨라요).
//   새 빛(render/glight.js)이 쓰는 면 정보·발광도 같은 자리에 미리 써 둬요(그림에서 다시 읽지 않게).
const ic_cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ic_put = (D, k, c, a = 255) => { D[k] = Math.round(c[0]); D[k + 1] = Math.round(c[1]); D[k + 2] = Math.round(c[2]); D[k + 3] = a; };
const ic_ART = new Map();
const ic_PIX = new WeakMap(); // 바위 그림의 픽셀 (한 번만 읽어요)
function ic_pix(c) { let d = ic_PIX.get(c); if (!d) { const k = ic_cnv(16, 16), g = k.getContext('2d'); g.drawImage(c, 0, 0); d = g.getImageData(0, 0, 16, 16).data; ic_PIX.set(c, d); } return d; }
const ic_at = (d, u, v) => { const k = ((v & 15) * 16 + (u & 15)) * 4; return [d[k], d[k + 1], d[k + 2]]; };
const SLOT_W = 16, SLOT_H = 92, PG_COLS = 16, PG_ROWS = 4, PG_W = SLOT_W * PG_COLS, PG_H = SLOT_H * PG_ROWS, PG_N = PG_COLS * PG_ROWS, MAX_PAGES = 24, ATL_N = PG_N * MAX_PAGES;
// 아틀라스는 작은 쪽(64칸, 256×240) 여러 장: 칸을 만들 때는 메모리에만 쓰고, 그리기 전에 바뀐 쪽만 한 번에 올려요(flushWallAtlas)
export const ATL = { budget: 1e9, pages: [], owner: [], used: new Float64Array(ATL_N), pin: new Uint8Array(ATL_N), clock: 0, free: [], next: 0 };
function ic_page(pi) { let pg = ATL.pages[pi]; if (pg) return pg;
  const alb = ic_cnv(PG_W, PG_H), mat = ic_cnv(PG_W, PG_H), em = ic_cnv(PG_W, PG_H), g = alb.getContext('2d');
  pg = { alb, mat, em, A: g.createImageData(PG_W, PG_H), M: g.createImageData(PG_W, PG_H), E: g.createImageData(PG_W, PG_H), dirty: false }; ATL.pages[pi] = pg;
  const L = { mat, em }, tab = {}; // 어느 종류(윗면·앞면, 광석 번호)로 그려도 미리 써 둔 면 정보·발광을 써요
  for (const o of ['ice', 0, 4, 5, 10, 12, 13]) { tab['itop' + o] = L; tab['front' + o] = L; }
  tab.shade0 = { mat: null, em }; presetLayers(alb, tab); return pg; }
// 한 장에 새로 만드는 칸 그림 수 (넘으면 그 칸은 이번 장만 예전 네모 그림 — 끊김 줄이기)
export function wallBudget(n) { ATL.budget = n; }
export function flushWallAtlas() { for (const pg of ATL.pages) if (pg && pg.dirty) { pg.dirty = false; pg.alb.getContext('2d').putImageData(pg.A, 0, 0); pg.mat.getContext('2d').putImageData(pg.M, 0, 0); pg.em.getContext('2d').putImageData(pg.E, 0, 0); } }
function ic_slot() { // 새 칸 → 빈 칸 → 가장 오래 안 쓴 칸
  if (ATL.free.length) return ATL.free.pop(); if (ATL.next < ATL_N) return ATL.next++;
  let best = -1, bu = Infinity; for (let k = 0; k < ATL_N; k++) if (!ATL.pin[k] && ATL.used[k] < bu) { bu = ATL.used[k]; best = k; }
  const ow = ATL.owner[best]; if (ow !== undefined) { const a = ic_ART.get(ow); if (a && a.slot === best) ic_ART.delete(ow); } return best;
}
// 기울어지는 벽 한 칸의 그림 { slot, u, v(아틀라스 자리), front(앞면 있음), frontUp, ore } — 윗면은 (u, v) 16×16, 그늘 (u, v+16), 앞면 (u, v+32) 16×28
// rock: 바위면 v73 그림 { top16, front, ore } (render/terrain.js wallArt), 얼음벽이면 null · glow: 광석 발광 규칙 (render/terrain.js GLOW_RULE)
// v82 오토타일: 칸 그림은 (바위 그림, 주변 8칸, 변형[, 얼음 무늬 자리]) 조합마다 하나 — 같은 조합의 칸은 모두 같은 그림을 써요
const ic_IMG = new WeakMap(); let ic_imgN = 0;
const ic_rid = img => { if (!img) return 'i'; let n = ic_IMG.get(img); if (!n) { n = ++ic_imgN; ic_IMG.set(img, n); } return n; };
export function slantWallArt(x, y, w, rock, glow) {
  if (ic_ART.size > 30000) ic_ART.clear(); // 기억이 너무 커지면 비워요 (아틀라스 자리는 오래된 순으로 다시 써요)
  const ice = w === ICE_W, sig = canonSig(ic_sig(x, y)), vr = ic_var(x, y), par = ice ? (x & 1) + (y & 1) * 2 : 0;
  const key = (ice ? 'i' : ic_rid(rock.top16) + '.' + ic_rid(rock.front)) + ':' + sig + ':' + vr + ':' + par, clk = ++ATL.clock; let a = ic_ART.get(key);
  if (a) { ATL.used[a.slot] = clk; return a; }
  if (ATL.budget-- <= 0) return null;
  const slot = ic_slot(); ATL.owner[slot] = key; ATL.used[slot] = clk;
  a = ic_build(sig, vr, par, w, rock, glow, slot); ic_ART.set(key, a); return a;
}
// 칸 둘레 3×3을 48×48 벽 지도로 (가운데 칸은 진짜 모양, 옆 벽은 주변 8칸 밖을 벽으로 보고 요철 없이 — 그늘·앞면 계산에만 써요)
const ic_BIT = { '-1,-1': 0, '0,-1': 1, '1,-1': 2, '-1,0': 3, '1,0': 4, '-1,1': 5, '0,1': 6, '1,1': 7 };
function ic_local(sig, vr) {
  const m = new Uint8Array(48 * 48), open = (dx, dy) => (dx || dy) && Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && (sig >> ic_BIT[dx + ',' + dy]) & 1;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (open(dx, dy)) continue; let sh;
    if (!dx && !dy) sh = autoShape(sig, vr, true);
    else { let ns = 0, k = 0; for (let ey = -1; ey <= 1; ey++) for (let ex = -1; ex <= 1; ex++) { if (!ex && !ey) continue; if (open(dx + ex, dy + ey)) ns |= 1 << k; k++; } sh = autoShape(ns, 0, false); }
    for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) m[((dy + 1) * 16 + v) * 48 + (dx + 1) * 16 + u] = sh[v * 16 + u]; }
  return m; }
function ic_build(sig, vr, par, w, rock, glow, slot) {
  const ice = w === ICE_W, X = (par & 1) * 16, Y = (par >> 1) * 16, FU = ICE.frontUp, L = ice ? ICE : ROCK, FH = 16 + FU, e = autoShape(sig, vr, true);
  const tp = rock ? ic_pix(rock.top16) : null, fp = rock ? ic_pix(rock.front) : null;
  const pg = ic_page(Math.floor(slot / PG_N)), lk = slot % PG_N, su = (lk % PG_COLS) * SLOT_W, sv = Math.floor(lk / PG_COLS) * SLOT_H, A = pg.A.data, Mt = pg.M.data, E = pg.E.data;
  for (let v = 0; v < SLOT_H; v++) { const o = ((sv + v) * PG_W + su) * 4; A.fill(0, o, o + SLOT_W * 4); Mt.fill(0, o, o + SLOT_W * 4); E.fill(0, o, o + SLOT_W * 4); } // 칸 비우기
  const at = (u, v) => ((sv + v) * PG_W + su + u) * 4; pg.dirty = true;
  const emF = ice ? (r, g, b) => ICE_EM(r, g, b) : (r, g, b) => glow && glow(r, g, b) ? 1 : 0;
  // 면 정보·발광 (render/glight.js gxlayerOf와 같은 값): 윗면 = 종류 3·높이 16·12px 아래, 앞면 = 종류 2·높이 FH−줄·FH+1−줄 아래
  const surf = (k, c, ty, z, off) => { Mt[k] = ty * 40; Mt[k + 1] = z; Mt[k + 2] = 128 + off; Mt[k + 3] = 255; const f = emF(c[0], c[1], c[2]); E[k] = c[0] * f; E[k + 1] = c[1] * f; E[k + 2] = c[2] * f; E[k + 3] = 255; };
  // 둘레 3×3 벽 지도 → 그늘(바닥에서 떨어진 거리)·테두리
  const wmk = ic_local(sig, vr), dist = ic_dist(wmk, 48, 48, v => v === 0), sol = (u, v) => wmk[(v + 16) * 48 + u + 16] !== 0;
  for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) { if (!e[v * 16 + u]) continue; const k = at(u, v), ks = at(u, v + 16), wx = X + u, wy = Y + v;
    const rim = !sol(u, v - 1) || !sol(u - 1, v) || !sol(u + 1, v);
    let c; if (ice) c = rim ? (hash2(wx, wy, 250) < .22 ? IC.rimT : IC.rim) : ic_topPx(wx, wy);
    else { c = ic_at(tp, u, v); if (rim) c = c.map(q => Math.min(255, q * 1.35 + 14)); } // 바위 윗면 가장자리는 조금 밝게
    c = c.map(Math.round); ic_put(A, k, c); surf(k, c, 3, 16, 12);
    const d = dist[(v + 16) * 48 + u + 16], al = Math.round(Math.max(0, Math.min(1, (d - L.shadeRim) / L.shadeFade)) * L.shadeBlack * 255);
    ic_put(A, ks, [8, 6, 12], al); E[ks + 3] = Math.min(255, Math.round(al / .96)); } // 그늘은 발광도 가려요(검정)
  // 앞면: 칸마다 발자국 맨 아래 픽셀 바로 아래가 비었으면(남쪽 칸이 열렸거나, 아래 벽이 깎였거나, 안쪽 모서리) 그 칸에 16px 앞면 — 모서리를 따라 돌아요
  const vbot = new Int8Array(16).fill(-1), oW = (sig >> 3) & 1, oE = (sig >> 4) & 1; let anyF = false;
  for (let u = 0; u < 16; u++) for (let v = 15; v >= 0; v--) if (e[v * 16 + u]) { if (!sol(u, v + 1)) { vbot[u] = v; anyF = true; } break; }
  for (let u = 0; u < 16; u++) { if (vbot[u] < 0) continue; const side = (u === 0 || vbot[u - 1] < 0) && (u > 0 || oW) || (u === 15 || vbot[u + 1] < 0) && (u < 15 || oE);
    for (let r = 0; r < 16; r++) { const row = vbot[u] - 15 + r + FU; if (row < 0 || row >= FH) continue; const k = at(u, 32 + row), wx = X + u;
      let c;
      if (ice) { c = r === 0 ? IC.fHi : r === 15 ? IC.fLow : ic_mix(IC.fTop, IC.fBot, Math.round(r / 15 * 4) / 4);
        if (r > 0 && r < 15) { const f = ic_cell(wx * 2, r * 3, 8, 1, 260, 8); if (f.gap < .45) c = ic_mix(c, IC.crack, .6); else if (hash2(f.id, 1, 261) < .3) c = ic_mix(c, IC.fTop, .25); }
        if (side && r > 0 && r < 15) c = ic_mix(c, IC.fSide, .7); }
      else { c = ic_at(fp, u, r); if (side) c = c.map(q => q * .72); }
      c = c.map(Math.round); ic_put(A, k, c); surf(k, c, 2, Math.max(0, FH - row), FH + 1 - row); }
    // v81: 바위는 앞면 바로 아래 바닥에 옅은 그림자 3줄 (예전 칸 단위 접촉 그림자 대신, 벽 그림과 같이 그려요)
    if (!ice) for (let r = 1; r <= 3; r++) { const vv = vbot[u] + r; if (sol(u, vv)) break; const row = vbot[u] + FU + r; if (row >= FH + 3) break; ic_put(A, at(u, 60 + row), [14, 8, 22], Math.round(ROCK.shadow[r - 1] * 255)); } }
  return { slot, img: pg.alb, u: su, v: sv, front: anyF, shadow: anyF && !ice, frontUp: FU, ore: ice ? 'ice' : rock.ore };
}
// ---- 바닥: 얼음 조각 한 칸 (꾸밈은 진짜 바닥 칸에만) ----
export function drawIceShard(g, x, y, X, Y, deco) {
  ic_floorTex(); g.drawImage(ic_FC, (x * 16) & 255, (y * 16) & 255, 16, 16, X, Y, 16, 16); // v81: copy from the repeating pattern (fast)
  if (deco) { const h = hash2(x, y, 270), dot = (px, py, c) => { g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; g.fillRect(X + px, Y + py, 1, 1); };
    if (h < .09) { const cx = 4 + ((hash2(x, y, 271) * 8) | 0), cy = 4 + ((hash2(x, y, 272) * 8) | 0); // X 서리 무늬
      for (let t = -2; t <= 2; t++) for (const [px, py] of [[cx + t, cy + t], [cx + t, cy - t]]) dot(px, py, t === 0 ? IC.spark : IC.frost); }
    else if (h < .2) { const n = 2 + ((hash2(x, y, 273) * 2) | 0); for (let q = 0; q < n; q++) dot(2 + ((hash2(x, y, 274 + q) * 12) | 0), 2 + ((hash2(x, y, 280 + q) * 12) | 0), IC.dot); } }
}
// 물가: 얼음 동굴에서 물 칸으로 들어오는 땅 픽셀 색 (render/terrain.js bakeFloor) — d = 땅 가장자리에서의 거리
export function iceShorePx(wx, wy, d) { return d === 1 ? IC.edge : d === 2 ? IC.edgeS : ic_floorPx(wx, wy); }
export function iceCliffPx(r, h) { return r < h ? ic_mix(IC.cliffT, IC.cliffB, Math.round(r / (h - 1) * 3) / 3) : IC.foam; }
// ---- 벽 옆: 얼음벽은 청록빛(발광), 바위는 옅은 그림자 (바닥 조각 하나 = N×N칸, 없으면 null) ----
export function wallEdgeChunk(cx, cy, N) {
  const x0 = cx * N, y0 = cy * N; let hasI = false, hasR = false;
  for (let y = y0 - 1; y <= y0 + N; y++) for (let x = x0 - 1; x <= x0 + N; x++) { if (!inB(x, y)) continue; const w = G.wall[idx(x, y)]; if (w === ICE_W) hasI = true; else if (SLANT.has(w)) hasR = true; }
  if (!hasI) return null; hasR = false; // v81: 바위 옆 그림자는 벽 그림(아래 3줄)으로 옮겨서 여기서는 얼음벽 청록빛만
  const P = N * 16, Mg = ICE.glowMax + 2, WW = P + Mg * 2, X0 = x0 * 16 - Mg, Y0 = y0 * 16 - Mg, wmk = wallMask(X0, Y0, WW, WW);
  const dI = hasI ? ic_dist(wmk, WW, WW, v => v === 2) : null, dR = hasR ? ic_dist(wmk, WW, WW, v => v === 3) : null; // 있는 벽 종류만
  const gc = ic_cnv(P, P), gi = gc.getContext('2d').createImageData(P, P), sc = ic_cnv(P, P), si = sc.getContext('2d').createImageData(P, P); let lit = false, sh = false;
  for (let j = 0; j < P; j++) for (let q = 0; q < P; q++) { const kk = (j + Mg) * WW + q + Mg; if (wmk[kk]) continue; const wx = X0 + Mg + q, wy = Y0 + Mg + j, o = (j * P + q) * 4;
    const d = dI ? dI[kk] : 1e9;
    if (d <= ICE.glowMax) { const reach = ICE.glowMax * (.25 + .75 * ic_vn(wx / 6, wy / 6, 290)) + 1; // 덩어리지게 들쭉날쭉
      if (d <= reach) { const t = Math.min(1, Math.round(d / reach * 3) / 3), a = t < .34 ? .85 : t < .67 ? .6 : .35; ic_put(gi.data, o, ic_mix(IC.glowA, IC.glowB, t), Math.round(a * 255)); lit = true; continue; } }
    const r = dR ? Math.round(dR[kk]) : 0; if (r >= 1 && r <= 3) { ic_put(si.data, o, [14, 8, 22], Math.round(ROCK.shadow[r - 1] * 255)); sh = true; } }
  if (lit) gc.getContext('2d').putImageData(gi, 0, 0); if (sh) sc.getContext('2d').putImageData(si, 0, 0);
  return lit || sh ? { glow: lit ? gc : null, shadow: sh ? sc : null } : null;
}
// 테스트용: 칸 (x,y) 발자국 안 픽셀 수 (깎인 모양 확인)
export function slantWallPx(x, y) { const e = tileShape(x, y); let n = 0; for (let k = 0; k < 256; k++) n += e[k]; return n; }
