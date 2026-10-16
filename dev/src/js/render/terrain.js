// ================= v73 바닥·벽·광석 새 그림 (빛 데모의 「에셋으로」 세트, dev/art/terrain/) =================
// 그림 원본: 사용자가 직접 그려 예전에 판매했던 텍스처 묶음 → dev/art_src/terrain/make_terrain.py 가 16px 조각으로 만들어요.
// 바닥: 잔디(1)·흙(2)·물(10)은 칸 조각이 아니라 픽셀 단위 경계(구불구불, 벽 쪽은 중립)로 굽고, 나무(5)·돌(6) 바닥은 네모 블록.
//   그 밖의 바닥(버섯흙·수정 모래·눈·얼음·용암·물 타일 …)은 예전 그림을 그 칸에 그대로 덮어요.
// 벽: 흙(1)·돌(2)·화강암(3)·현무암(9)은 새 그림. 광맥(구리 4·철 5·금 10·서리 12·석영 13)은 주변 바위(oreHost) 속에 박힌 그림.
//   맵 생성(광석 위치·양)은 바꾸지 않고, 그릴 때만 주변 바위를 보고 바탕을 골라요. 얼음벽·암반·지어 쌓는 벽은 예전 그림.
import { ARTC } from '../art/hand-art.js';
import { BIOME_WATER, OLD_WATER, WALL_TOP } from '../art/tilemap.js';
import { hash2 } from '../engine/random.js';
import { hexRgb } from '../engine/util.js';
import { G } from '../save/state.js';
import { WATER } from '../sim/nature.js';
import { idx, inB } from '../world/map.js';

export const NEW_FLOORS = new Set([1, 2, WATER, 5, 6]); // 새 방식으로 굽는 바닥
const tr_BUILT = new Set([5, 6]); // 블록처럼 칸 단위로 깔리는 바닥
export const ROCKS = [1, 2, 3, 9]; // 광석의 바탕이 될 수 있는 바위
export const ORE_T = new Set([4, 5, 10, 12, 13]);
const tr_NEW_WALLS = new Set([...ROCKS, ...ORE_T]);
const tr_A_EDGE = { gE: [32, 53, 20], gS: [49, 82, 31], pE: [54, 35, 23], pS: [90, 59, 39] }; // 외곽선·그늘 색 (텍스처의 가장 어두운 색에서)
const tr_JOIN = { wobble: .16, jag: .085, pathWobble: .12, pathJag: .03, link: .2 }; // 경계가 구불거리는 정도 (칸 단위 ≈ ×16px)
const tr_CLIFF = { h: 7, fh: 2 }; // 물가 절벽: 땅 쪽 7줄 + 물 쪽 거품 2줄
// 스스로 빛나는 광석 픽셀 (빛 효과에서 발광)
const tr_lum = (r, g, b) => .3 * r + .59 * g + .11 * b;
export const GLOW_RULE = {
  4: (r, g, b) => r > 150 && r - b > 80 && g > 60 && g < 200,
  10: (r, g, b) => r > 150 && g > 110 && b < 130,
  13: (r, g, b) => tr_lum(r, g, b) > 150,
  12: (r, g, b) => b > 200 && tr_lum(r, g, b) > 150,
};
export const TR = { ready: false, tried: false };
const tcnv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; if (fn) fn(g); return c; };
const tr_top12 = src => tcnv(16, WALL_TOP, g => g.drawImage(src, 0, 0, 16, WALL_TOP, 0, 0, 16, WALL_TOP)); // 윗면은 위쪽 12줄
function tr_pixOf(img) { const w = img.width, h = img.height, d = tcnv(w, h, g => g.drawImage(img, 0, 0)).getContext('2d').getImageData(0, 0, w, h).data;
  return (x, y) => { x = ((x % w) + w) % w; y = ((y % h) + h) % h; const k = (y * w + x) * 4; return [d[k], d[k + 1], d[k + 2], d[k + 3]]; }; }
// 처음 쓸 때 한 번 만들어요 (그림이 없으면 예전 그림 그대로)
export function terrainReady() {
  if (TR.ready || TR.tried) return TR.ready;
  TR.tried = true; const AK = k => ARTC['terrain/' + k];
  if (!AK('grass') || !AK('wtop/1') || !AK('ore/4_1_top_0')) return false;
  TR.wtop = {}; TR.wfront = {};
  for (const t of ROCKS) { const t12 = tr_top12(AK('wtop/' + t)); TR.wtop[t] = [t12, t12, t12, t12]; TR.wfront[t] = [AK('wfront/' + t)]; }
  TR.ore = {};
  for (const t of ORE_T) for (const h of ROCKS) TR.ore[t + '_' + h] = { top: [0, 1, 2, 3].map(v => tr_top12(AK(`ore/${t}_${h}_top_${v}`))), front: [0, 1, 2].map(v => AK(`ore/${t}_${h}_front_${v}`)) };
  TR.ripple = [AK('ripple_0'), AK('ripple_1')];
  TR.built = {};
  for (const [f, k] of [[5, 'fwood'], [6, 'fstone']]) { const px = tr_pixOf(AK(k)); let dk = [255, 255, 255], best = 1e9;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = px(x, y), l = tr_lum(c[0], c[1], c[2]); if (l < best) { best = l; dk = c; } }
    TR.built[f] = { edge: dk.slice(0, 3).map(v => Math.round(v * .55)) }; }
  TR.waterC = {}; // 지역별 물 바탕색 (이끼 동굴은 텍스처)
  return TR.ready = true;
}
// 광석이 박힐 바위: 가까운 둘레부터 세어 가장 많은 바위 (흙·돌·화강암·현무암). 없으면 돌
export function oreHost(x, y) {
  for (let r = 1; r <= 5; r++) { let best = 0, bn = 0; const n = { 1: 0, 2: 0, 3: 0, 9: 0 };
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !inB(x + dx, y + dy)) continue; const w = G.wall[idx(x + dx, y + dy)]; if (n[w] !== undefined) n[w]++; }
    for (const h of ROCKS) if (n[h] > bn) { bn = n[h]; best = h; }
    if (best) return best; }
  return 2;
}
// 벽 한 칸의 새 그림 { top, front, ore } — 새 그림이 없는 벽이면 null
export function wallArt(x, y, w) {
  if (!TR.ready || !tr_NEW_WALLS.has(w)) return null;
  const tv = (hash2(x, y, 9) * 4) | 0, fv = (hash2(x, y, 13) * 3) | 0;
  if (ORE_T.has(w)) { const o = TR.ore[w + '_' + oreHost(x, y)]; return { top: o.top[tv], front: o.front[fv], ore: w }; }
  return { top: TR.wtop[w][tv], front: TR.wfront[w][0], ore: 0 };
}
export const isNewFloor = f => NEW_FLOORS.has(f);
// 물칸 위 잔물결: 이끼 동굴은 새 그림, 다른 지역은 그 지역 물 그림에서 바탕색을 뺀 것
const tr_RIP = new Map();
export function rippleOf(b, src) { if (!b && TR.ripple) return TR.ripple; let r = tr_RIP.get(src); if (r) return r;
  r = src.map(img => tcnv(16, 16, g => { g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, 16, 16), a = d.data, cnt = new Map();
    for (let k = 0; k < a.length; k += 4) { const c = a[k] << 16 | a[k + 1] << 8 | a[k + 2]; cnt.set(c, (cnt.get(c) || 0) + 1); }
    const base = [...cnt].sort((p, q) => q[1] - p[1])[0][0]; for (let k = 0; k < a.length; k += 4) if ((a[k] << 16 | a[k + 1] << 8 | a[k + 2]) === base) a[k + 3] = 0; g.putImageData(d, 0, 0); }));
  tr_RIP.set(src, r); return r; }
const tr_vnoise = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1; };
function tr_waterRGB(b) { let c = TR.waterC[b]; if (!c) { const wb = BIOME_WATER[b]; c = TR.waterC[b] = hexRgb(wb ? wb[0] : OLD_WATER).map(v => Math.round(v * 255)); } return c; }
// 칸 [tx0..tx1]×[ty0..ty1]의 바닥을 픽셀 단위로 구워 ImageData로 돌려줘요 (경계 계산은 둘레 2칸까지 보고, 같은 자리는 언제나 같은 모양)
const tr_texOf = img => { const w = img.width, h = img.height; return { w, h, d: tcnv(w, h, g => g.drawImage(img, 0, 0)).getContext('2d').getImageData(0, 0, w, h).data }; };
const tr_at = (t, x, y) => ((((y % t.h) + t.h) % t.h) * t.w + (((x % t.w) + t.w) % t.w)) * 4;
export function bakeFloor(tx0, ty0, tx1, ty1) {
  if (!TR.tex) TR.tex = { grass: tr_texOf(ARTC['terrain/grass']), dirt: tr_texOf(ARTC['terrain/dirt']), water: tr_texOf(ARTC['terrain/water']), cliff: tr_texOf(ARTC['terrain/cliff']), deco: tr_texOf(ARTC['terrain/deco']), 5: tr_texOf(ARTC['terrain/fwood']), 6: tr_texOf(ARTC['terrain/fstone']) };
  const TX = TR.tex, T = 16, M = 2, cx0 = tx0 - M, cy0 = ty0 - M, cx1 = tx1 + M, cy1 = ty1 + M, TW = cx1 - cx0 + 1, TH = cy1 - cy0 + 1;
  const X0 = cx0 * T, Y0 = cy0 * T, Wp = TW * T, Hp = TH * T, N = Wp * Hp, J = tr_JOIN;
  // 칸 정보: 소속값(1 이 땅, 0 아님, .5 바위 = 어느 쪽도 아님), 벽, 바닥 번호, 블록 바닥
  const mG = new Float32Array(TW * TH), mP = new Float32Array(TW * TH), tW = new Uint8Array(TW * TH), tF = new Int16Array(TW * TH), tB = new Uint8Array(TW * TH), tBi = new Uint8Array(TW * TH);
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { const k = j * TW + i, x = cx0 + i, y = cy0 + j;
    if (!inB(x, y)) { mG[k] = mP[k] = .5; tW[k] = 1; tF[k] = -1; continue; } const q = idx(x, y); tBi[k] = G.biome[q];
    if (G.wall[q]) { mG[k] = mP[k] = .5; tW[k] = 1; tF[k] = -1; continue; } const f = G.floor[q]; tF[k] = f; mG[k] = f === WATER ? 0 : 1; mP[k] = f === 2 ? 1 : 0; tB[k] = tr_BUILT.has(f) ? 1 : 0; }
  const mAt = (m, i, j) => (i < 0 || j < 0 || i >= TW || j >= TH) ? .5 : m[j * TW + i];
  const field = (m, px, py, link) => { const gx = (px - X0) / T - .5, gy = (py - Y0) / T - .5, i = Math.floor(gx), j = Math.floor(gy), u = gx - i, v = gy - j;
    const a = mAt(m, i, j), b = mAt(m, i + 1, j), c = mAt(m, i, j + 1), d = mAt(m, i + 1, j + 1);
    let f = a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
    if (link && a === d && b === c && a + b === 1) f += J.link * 16 * u * (1 - u) * v * (1 - v);
    return f; };
  const Gm = new Uint8Array(N), Pm = new Uint8Array(N), wallPx = new Uint8Array(N), isBuilt = new Uint8Array(N);
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { const k = j * TW + i;
    if (tW[k]) { for (let v = 0; v < T; v++) wallPx.fill(1, (j * T + v) * Wp + i * T, (j * T + v) * Wp + i * T + T); continue; }
    // 둘레 3×3이 모두 같으면 계산 없이 채워요 (대부분의 칸)
    let sameG = true, sameP = true; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (mAt(mG, i + di, j + dj) !== mG[k]) sameG = false; if (mAt(mP, i + di, j + dj) !== mP[k]) sameP = false; }
    const g0 = mG[k] > .5 ? 1 : 0, p0 = mP[k] > .5 ? 1 : 0;
    for (let v = 0; v < T; v++) { const row = (j * T + v) * Wp + i * T, cy = Y0 + j * T + v + .5;
      if (tB[k]) { isBuilt.fill(1, row, row + T); Gm.fill(1, row, row + T); continue; }
      if (sameG) Gm.fill(g0, row, row + T); if (sameP) Pm.fill(p0, row, row + T); if (sameG && sameP) continue;
      for (let u = 0; u < T; u++) { const cx = X0 + i * T + u + .5;
        if (!sameG) Gm[row + u] = field(mG, cx, cy, false) > .5 + J.wobble * tr_vnoise(cx / 14, cy / 14, 11) + J.jag * tr_vnoise(cx / 2.6, cy / 2.6, 12) ? 1 : 0;
        if (!sameP) Pm[row + u] = field(mP, cx, cy, true) > .5 + J.pathWobble * tr_vnoise(cx / 12, cy / 12, 13) + J.pathJag * tr_vnoise(cx / 3, cy / 3, 14) ? 1 : 0; } } }
  const tidy = m => { const o = m.slice(); for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) { const k = y * Wp + x, s = o[k];
    const n = (x > 0 ? o[k - 1] : s) + (x < Wp - 1 ? o[k + 1] : s) + (y > 0 ? o[k - Wp] : s) + (y < Hp - 1 ? o[k + Wp] : s);
    if (s && n <= 1) m[k] = 0; else if (!s && n >= 3) m[k] = 1; } };
  tidy(Gm); for (let k = 0; k < N; k++) Pm[k] &= Gm[k]; tidy(Pm); for (let k = 0; k < N; k++) { Pm[k] &= Gm[k]; if (isBuilt[k]) { Gm[k] = 1; Pm[k] = 0; } }
  const Q = new Int32Array(N);
  const dist4 = (m, cap) => { const d = new Uint8Array(N); let qh = 0, qt = 0;
    for (let y = 0; y < Hp; y++) for (let x = 0; x < Wp; x++) { const k = y * Wp + x; if (!m[k]) continue;
      if ((x > 0 && !m[k - 1]) || (x < Wp - 1 && !m[k + 1]) || (y > 0 && !m[k - Wp]) || (y < Hp - 1 && !m[k + Wp])) { d[k] = 1; Q[qt++] = k; } }
    while (qh < qt) { const k = Q[qh++], x = k % Wp, nd = d[k] + 1; if (nd > cap) continue;
      if (x > 0 && m[k - 1] && !d[k - 1]) { d[k - 1] = nd; Q[qt++] = k - 1; } if (x < Wp - 1 && m[k + 1] && !d[k + 1]) { d[k + 1] = nd; Q[qt++] = k + 1; }
      if (k >= Wp && m[k - Wp] && !d[k - Wp]) { d[k - Wp] = nd; Q[qt++] = k - Wp; } if (k + Wp < N && m[k + Wp] && !d[k + Wp]) { d[k + Wp] = nd; Q[qt++] = k + Wp; } }
    for (let k = 0; k < N; k++) if (m[k] && !d[k]) d[k] = 255; return d; };
  const notP = new Uint8Array(N); for (let k = 0; k < N; k++) notP[k] = Pm[k] || isBuilt[k] ? 0 : 1;
  const dG = dist4(Gm, 4), dP = dist4(Pm, 2), dNP = dist4(notP, 3);
  // 결과는 가운데(요청한 칸)만: ox0·oy0 = 결과의 왼쪽 위 (이 계산 영역 안 px)
  const ox0 = M * T, oy0 = M * T, ow = (tx1 - tx0 + 1) * T, oh = (ty1 - ty0 + 1) * T, out = new ImageData(ow, oh), O = out.data, EC = tr_A_EDGE;
  const oi = k => { const lx = k % Wp - ox0, ly = ((k / Wp) | 0) - oy0; return lx < 0 || ly < 0 || lx >= ow || ly >= oh ? -1 : (ly * ow + lx) * 4; };
  const putC = (o, c) => { O[o] = c[0]; O[o + 1] = c[1]; O[o + 2] = c[2]; O[o + 3] = 255; };
  const putT = (o, t, x, y) => { const s = tr_at(t, x, y), d = t.d; O[o] = d[s]; O[o + 1] = d[s + 1]; O[o + 2] = d[s + 2]; O[o + 3] = 255; };
  const leaf = (x, y) => tr_vnoise(x / 2.3, y / 2.3, 15);
  for (let ly = 0; ly < oh; ly++) for (let lx = 0; lx < ow; lx++) { const k = (oy0 + ly) * Wp + ox0 + lx, o = (ly * ow + lx) * 4, x = X0 + ox0 + lx, y = Y0 + oy0 + ly;
    if (wallPx[k]) { O[o] = 18; O[o + 1] = 15; O[o + 2] = 28; O[o + 3] = 255; continue; }
    if (Gm[k]) { const d = dG[k]; if (d === 1) putC(o, EC.gE); else if ((d === 2 && leaf(x, y) > -.45) || (d === 3 && leaf(x, y) > .1) || (d === 4 && leaf(x, y) > .65)) putC(o, EC.gS); else putT(o, TX.grass, x, y); }
    else { const b = tBi[(((oy0 + ly) >> 4) * TW) + ((ox0 + lx) >> 4)]; if (b) putC(o, tr_waterRGB(b)); else putT(o, TX.water, x, y); } }
  // 작은 장식 (풀포기·꽃·조약돌): 잔디 칸에서만, 경계에서 3px 이상 안쪽 — 한 픽셀이라도 안 되면 통째로 빼요
  const off = (x, y, s, r) => Math.round((hash2(x, y, s) - .5) * 2 * r), DE = TX.deco, px = [];
  const okDeco = k => Gm[k] && dG[k] >= 3 && dNP[k] >= 3 && !wallPx[k] && !isBuilt[k];
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) { if (tF[j * TW + i] !== 1) continue; const x = cx0 + i, y = cy0 + j;
    for (const s of [0, 1]) { if (hash2(x, y, 91 + s * 7) >= .17) continue; const r = hash2(x, y, 92 + s * 7), d = r < .55 ? (r < .3 ? 0 : 1) : r < .7 ? 2 : r < .82 ? 3 : 4;
      const X = x * T + 4 + off(x, y, 93 + s * 7, 6) - X0, Y = y * T + 4 + off(x, y, 94 + s * 7, 6) - Y0; if (X < 0 || Y < 0 || X + 8 > Wp || Y + 8 > Hp) continue;
      if (X + 8 <= ox0 || Y + 8 <= oy0 || X >= ox0 + ow || Y >= oy0 + oh) continue; // 결과에 안 닿는 장식은 건너뛰어요
      px.length = 0; let ok = true;
      for (let v = 0; v < 8 && ok; v++) for (let u = 0; u < 8; u++) { const sI = (v * DE.w + d * 8 + u) * 4; if (DE.d[sI + 3] < 128) continue; const k = (Y + v) * Wp + X + u; if (!okDeco(k)) { ok = false; break; } px.push(k, sI); }
      if (ok) for (let q = 0; q < px.length; q += 2) { const o = oi(px[q]); if (o >= 0) { const sI = px[q + 1]; O[o] = DE.d[sI]; O[o + 1] = DE.d[sI + 1]; O[o + 2] = DE.d[sI + 2]; O[o + 3] = 255; } } } }
  // 흙길: 1px 외곽선 + 안쪽 그늘 / 블록 바닥: 칸 전체에 블록 그림, 다른 바닥이 시작되는 쪽은 어두운 테두리
  for (let ly = 0; ly < oh; ly++) for (let lx = 0; lx < ow; lx++) { const k = (oy0 + ly) * Wp + ox0 + lx, o = (ly * ow + lx) * 4, x = X0 + ox0 + lx, y = Y0 + oy0 + ly;
    if (Pm[k] && !wallPx[k]) { if (dP[k] === 1) putC(o, EC.pE); else if (dP[k] === 2 && leaf(x, y) > -.2) putC(o, EC.pS); else putT(o, TX.dirt, x, y); }
    if (isBuilt[k]) { const ti = (ox0 + lx) >> 4, tj = (oy0 + ly) >> 4, f = tF[tj * TW + ti], u = x & 15, v = y & 15;
      const same = (di, dj) => { const ii = ti + di, jj = tj + dj; return ii >= 0 && jj >= 0 && ii < TW && jj < TH && !tW[jj * TW + ii] && tF[jj * TW + ii] === f; };
      if ((u === 0 && !same(-1, 0)) || (u === 15 && !same(1, 0)) || (v === 0 && !same(0, -1)) || (v === 15 && !same(0, 1))) putC(o, TR.built[f].edge); else putT(o, TX[f], x, y); } }
  // 블록 바닥 아래로 작은 그림자
  for (let ly = 0; ly < oh; ly++) { if (((Y0 + oy0 + ly) & 15) !== 15) continue; for (let lx = 0; lx < ow; lx++) { const k = (oy0 + ly) * Wp + ox0 + lx; if (!isBuilt[k]) continue;
    for (const [dy, f] of [[1, .7], [2, .86]]) { const kk = k + dy * Wp, o = oi(kk); if (o < 0 || isBuilt[kk] || wallPx[kk]) continue; for (let c = 0; c < 3; c++) O[o + c] *= f; } } }
  // 남쪽으로 물에 떨어지는 곳: 물가를 따라 절벽 (옆으로 3열 이상 이어질 때만)
  const shore = (x, yb) => { const k = (yb - 1) * Wp + x; return yb >= 1 && yb < Hp && Gm[k] && !Gm[k + Wp] && !wallPx[k] && !wallPx[k + Wp] && (yb + 2 >= Hp || !Gm[k + 3 * Wp]); };
  const near = (x, yb) => { if (x < 0 || x >= Wp) return false; for (let d = -2; d <= 2; d++) if (shore(x, yb + d)) return true; return false; };
  const CL = TX.cliff, H2 = tr_CLIFF.h + tr_CLIFF.fh;
  for (let x = Math.max(0, ox0 - 1); x < Math.min(Wp, ox0 + ow + 1); x++) for (let yb = Math.max(1, oy0 - H2); yb < Math.min(Hp, oy0 + oh + tr_CLIFF.h + 1); yb++) {
    if (!shore(x, yb) || !near(x - 1, yb) || !near(x + 1, yb)) continue;
    for (let r = 0; r < H2; r++) { const yy = yb - tr_CLIFF.h + r; if (yy < 0 || yy >= Hp) continue; const kk = yy * Wp + x, o = oi(kk); if (o < 0) continue;
      if (wallPx[kk] || (r < tr_CLIFF.h ? !Gm[kk] : Gm[kk])) continue; putT(o, CL, X0 + x, r); } }
  return out;
}
