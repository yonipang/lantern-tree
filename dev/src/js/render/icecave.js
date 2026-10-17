// ================= v79 얼음 동굴 새 방식 시험 (인계 묶음 HANDOFF.md 3-2, 2026-10-16 사용자 확정 그림) · v80 다른 바위에도 기울어진 가장자리 =================
// v80: 기울어진 가장자리는 얼음벽 + 흙·돌·화강암·현무암·광맥(SLANT)에 모두 써요. 바위는 v73 그림(render/terrain.js)을 그대로 깎아 그리고, 벽 옆 바닥엔 청록빛 대신 옅은 그림자.
//   얼어붙은 물(20, 얼음 동굴)도 새 얼음판 그림 — 물과의 경계가 구불구불해요(render/terrain.js bakeFloor).
// 그리는 방식(2D 캔버스 + 칸 그림)은 그대로, 얼음 동굴의 그림만 새로 만들어요. 그림 파일 없이 처음 쓸 때 코드로 만들고 칸마다 기억해요.
//   벽(얼음벽 11): 밝은 얼음 파랑 큰 면 + 대각선 어두운 금 그물 + 연한 줄·드문 반짝임, 윗면 가장자리 1px 밝은 테두리(군데군데 청록),
//     앞면은 위 #2552c2 → 아래 #122c82, 맨 위 줄 밝게·맨 아래 줄 청록.
//     모양: 열린 쪽 가장자리가 칸 모양 그대로가 아니라 비스듬히 기울어짐 — 칸 꼭짓점마다 안쪽으로 들어가는 정도(1~5px)를 꼭짓점 자리로 정하고
//     (옆 칸과 같은 꼭짓점을 쓰니 이음매가 맞음) 그 사이를 직선으로 + 1px 요철, 바깥 모서리는 반지름 5px로 둥글게. 들어가는 건 칸 안쪽으로만
//     (부딪히는 판정은 칸 단위 그대로). 벽 칸 아래에도 얼음 바닥을 깔아 깎인 곳에 바닥이 보여요.
//   바닥(얼음 동굴의 눈 바닥 19): 길쭉한 얼음 조각 면이 두 방향으로 엇갈림, 파랑 5단계(#1a49c4~#3f86f2), 꾸밈 X 서리 무늬·작은 연보라 점.
//   벽과 바닥 사이: 바닥 쪽으로 청록빛이 덩어리지게 들쭉날쭉 번짐(벽에서 0~11px, #86f2d2 → #2a7ee6) — 새 빛에서는 스스로 빛나요.
import { hash2 } from '../engine/random.js';
import { G } from '../save/state.js';
import { idx, inB } from '../world/map.js';

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
// ---- 벽 모양 ----
const ic_vIns = (vx, vy) => ICE.ins[(hash2(vx, vy, 201) * ICE.ins.length) | 0]; // 꼭짓점이 안쪽으로 들어가는 정도
const ic_bump = (a, b, s) => hash2(a, b, s) < .3 ? 1 : 0; // 1px 요철 (3px씩 이어짐)
function ic_edge(x, y) { // 칸 하나의 네 변: 각 변을 따라 들어가는 정도 (16칸 배열), 열린 쪽만
  const oN = ic_open(x, y - 1), oS = ic_open(x, y + 1), oW = ic_open(x - 1, y), oE = ic_open(x + 1, y);
  const a = ic_vIns(x, y), b = ic_vIns(x + 1, y), c = ic_vIns(x, y + 1), d = ic_vIns(x + 1, y + 1), L = (p, q, t) => Math.round(p + (q - p) * (t + .5) / 16);
  const run = (n, s) => { const r = new Int8Array(16); for (let t = 0; t < 16; t++) r[t] = n(t) + ic_bump(s[0], Math.floor((s[1] + t) / 3), s[2]); return r; };
  return { oN, oS, oW, oE,
    N: oN ? run(t => L(a, b, t), [y * 3, x * 16, 211]) : null, S: oS ? run(t => L(c, d, t), [(y + 1) * 3, x * 16, 212]) : null,
    W: oW ? run(t => L(a, c, t), [x * 3, y * 16, 213]) : null, E: oE ? run(t => L(b, d, t), [(x + 1) * 3, y * 16, 214]) : null,
    cNW: !oN && !oW && ic_open(x - 1, y - 1) ? a : 0, cNE: !oN && !oE && ic_open(x + 1, y - 1) ? b : 0, cSW: !oS && !oW && ic_open(x - 1, y + 1) ? c : 0, cSE: !oS && !oE && ic_open(x + 1, y + 1) ? d : 0 };
}
const ic_EDGE = new Map();
function ic_edgeOf(x, y) { const i = idx(x, y), sig = ic_sig(x, y); let e = ic_EDGE.get(i); if (!e || e.sig !== sig) { e = ic_edge(x, y); e.sig = sig; ic_EDGE.set(i, e); if (ic_EDGE.size > 6000) ic_EDGE.clear(); } return e; }
// 둘레 5×5 (앞면이 드러나는지는 이웃 칸의 깎인 모양에 달려서)
function ic_sig5(x, y) { let s = 0, k = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { if (dx || dy) { if (ic_open(x + dx, y + dy)) s |= 1 << k; k++; } } return s; }
function ic_sig(x, y) { let s = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (dx || dy) { if (ic_open(x + dx, y + dy)) s |= 1 << k; k++; } } return s; }
// 얼음벽 칸 (x,y)의 발자국 픽셀 (u,v)가 벽 안인지 (위에서 본 모양 — 윗면은 이걸 12px 위로 올려 그려요)
function ic_in(e, u, v) {
  if (e.W && u < e.W[v]) return false; if (e.E && 15 - u < e.E[v]) return false; if (e.N && v < e.N[u]) return false; if (e.S && 15 - v < e.S[u]) return false;
  const R = ICE.round, rc = (p, q) => p < R && q < R && (R - p) * (R - p) + (R - q) * (R - q) > R * R;
  if (e.N && e.W && rc(u - e.W[v], v - e.N[u])) return false; if (e.N && e.E && rc(15 - u - e.E[v], v - e.N[u])) return false;
  if (e.S && e.W && rc(u - e.W[v], 15 - v - e.S[u])) return false; if (e.S && e.E && rc(15 - u - e.E[v], 15 - v - e.S[u])) return false;
  if (u < e.cNW && v < e.cNW) return false; if (15 - u < e.cNE && v < e.cNE) return false; if (u < e.cSW && 15 - v < e.cSW) return false; if (15 - u < e.cSE && 15 - v < e.cSE) return false;
  return true;
}
// 세계 픽셀 (wx,wy)가 벽 안인지: 기울어지는 벽은 깎인 모양, 다른 벽(지어 쌓는 벽·암반)은 칸 전체, 지도 밖도 벽
export function wallSolidPx(wx, wy) { const x = Math.floor(wx / 16), y = Math.floor(wy / 16); if (!inB(x, y)) return true; const w = G.wall[idx(x, y)]; if (!w) return false; if (!SLANT.has(w)) return true; return ic_in(ic_edgeOf(x, y), wx - x * 16, wy - y * 16); }
// 픽셀 사각형 [X0, X0+w)×[Y0, Y0+h)의 벽 지도 (칸마다 모양을 한 번만 구해요): 0 바닥 · 1 칸 전체 벽 · 2 얼음벽 · 3 기울어지는 바위
export function wallMask(X0, Y0, w, h) {
  const m = new Uint8Array(w * h), tx0 = Math.floor(X0 / 16), ty0 = Math.floor(Y0 / 16), tx1 = Math.floor((X0 + w - 1) / 16), ty1 = Math.floor((Y0 + h - 1) / 16);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) { const out = !inB(tx, ty), wl = out ? 8 : G.wall[idx(tx, ty)]; if (!wl) continue;
    const sl = !out && SLANT.has(wl), e = sl ? ic_edgeOf(tx, ty) : null, val = !sl ? 1 : wl === ICE_W ? 2 : 3;
    const u0 = Math.max(0, X0 - tx * 16), u1 = Math.min(15, X0 + w - 1 - tx * 16), v0 = Math.max(0, Y0 - ty * 16), v1 = Math.min(15, Y0 + h - 1 - ty * 16);
    for (let v = v0; v <= v1; v++) for (let u = u0; u <= u1; u++) if (!e || ic_in(e, u, v)) m[(ty * 16 + v - Y0) * w + tx * 16 + u - X0] = val; }
  return m; }
// 거리 (1·1.41 근사): src(k)가 참인 픽셀에서 떨어진 거리
function ic_dist(m, w, h, src) { const d = new Float32Array(w * h).fill(1e9); for (let k = 0; k < w * h; k++) if (src(m[k])) d[k] = 0;
  for (let pass = 0; pass < 2; pass++) for (let s = 0; s < w * h; s++) { const k = pass ? w * h - 1 - s : s, q = k % w, j = (k / w) | 0, sg = pass ? -1 : 1;
    const nb = (dq, dj, c) => { const qq = q + dq * sg, jj = j + dj * sg; if (qq < 0 || jj < 0 || qq >= w || jj >= h) return; const v = d[jj * w + qq] + c; if (v < d[k]) d[k] = v; };
    nb(-1, 0, 1); nb(0, -1, 1); nb(-1, -1, 1.41); nb(1, -1, 1.41); }
  return d; }
// ---- 무늬 ----
const ic_vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, s), b = hash2(ix + 1, iy, s), c = hash2(ix, iy + 1, s), d = hash2(ix + 1, iy + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
// 늘인 조각 (보로노이): 조각마다 두 방향 중 하나로 길쭉해요. 가장 가까운 조각·두 번째와의 차이
function ic_cell(wx, wy, cs, st, s) { const gx = Math.floor(wx / cs), gy = Math.floor(wy / cs); let d1 = 1e9, d2 = 1e9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = gx + i, cy = gy + j, px = (cx + .15 + hash2(cx, cy, s) * .7) * cs, py = (cy + .15 + hash2(cx, cy, s + 1) * .7) * cs;
    const o = hash2(cx, cy, s + 2) < .5 ? 1 : -1, ax = .86, ay = .5 * o, dx = wx + .5 - px, dy = wy + .5 - py, p = (dx * ax + dy * ay) / st, q = -dx * ay + dy * ax, d = Math.sqrt(p * p + q * q);
    if (d < d1) { d2 = d1; d1 = d; id = cx * 7919 + cy; } else if (d < d2) d2 = d; }
  return { id, gap: d2 - d1 }; }
function ic_topPx(wx, wy) {
  if (hash2(wx, wy, 230) < .0025) return IC.spark;
  const c = ic_cell(wx, wy, 11, 1.6, 231), k = Math.min(4, Math.floor(hash2(c.id, 3, 232) * 5));
  const cr1 = Math.abs(((wx + wy + Math.round(ic_vn(wx / 9, wy / 9, 233) * 6)) % 15 + 15) % 15) < 1 && ic_vn(wx / 6, wy / 6, 234) > .45;
  const cr2 = Math.abs(((wx - wy + Math.round(ic_vn(wx / 9, wy / 9, 235) * 6)) % 13 + 13) % 13) < 1 && ic_vn(wx / 6, wy / 6, 236) > .5;
  if (cr1 || cr2 || c.gap < .7) return IC.crack;
  if ((((wx + 2 * wy) % 23) + 23) % 23 === 0 && ic_vn(wx / 5, wy / 5, 237) > .62) return IC.line;
  return IC.top[k];
}
function ic_floorPx(wx, wy) {
  const c = ic_cell(wx, wy, 9, 2.2, 241); if (c.gap < .55) return IC.seam;
  let k = Math.floor(hash2(c.id, 5, 242) * 5); if (hash2(c.id, 6, 243) < .2) k = Math.max(0, k - 1); // 일부 조각 조금 어둡게
  return IC.floor[Math.min(4, k)];
}
// 얼어붙은 물(20): 매끈한 얼음판 — 큰 조각 3단계 + 대각선으로 길게 비치는 줄 + 작은 공기 방울, 물 쪽 가장자리는 밝게
export function iceFrozenPx(wx, wy, rim) {
  if (rim) return IC.frzRim;
  if ((((wx - 2 * wy) % 29) + 29) % 29 < 2 && ic_vn(wx / 7, wy / 7, 300) > .55) return IC.frzLine;
  if (hash2(wx, wy, 301) < .006) return IC.frzBub;
  const c = ic_cell(wx, wy, 16, 2.6, 302); return IC.frz[Math.min(2, Math.floor(hash2(c.id, 7, 303) * 3))];
}
// ---- 칸 그림 (칸마다 기억, 이웃이 바뀌면 다시) ----
const ic_cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const ic_put = (D, k, c, a = 255) => { D[k] = Math.round(c[0]); D[k + 1] = Math.round(c[1]); D[k + 2] = Math.round(c[2]); D[k + 3] = a; };
const ic_ART = new Map();
const ic_PIX = new WeakMap(); // 바위 그림의 픽셀 (한 번만 읽어요)
function ic_pix(c) { let d = ic_PIX.get(c); if (!d) { const k = ic_cnv(16, 16), g = k.getContext('2d'); g.drawImage(c, 0, 0); d = g.getImageData(0, 0, 16, 16).data; ic_PIX.set(c, d); } return d; }
const ic_at = (d, u, v) => { const k = ((v & 15) * 16 + (u & 15)) * 4; return [d[k], d[k + 1], d[k + 2]]; };
// 기울어지는 벽 한 칸의 그림 { top 16×16(발자국, 12px 위로 그림), shade, front(16+FU 줄, FU px 위부터) 또는 null, ore }
// rock: 바위면 v73 그림 { top16, front, ore } (render/terrain.js wallArt), 얼음벽이면 null
export function slantWallArt(x, y, w, rock) {
  const i = idx(x, y), s5 = ic_sig5(x, y), sig = s5 * 16 + (w & 15); let a = ic_ART.get(i); if (a && a.sig === sig && a.src === (rock ? rock.top16 : null)) return a;
  if (ic_ART.size > 4000) ic_ART.clear();
  // 둘레 2칸이 모두 벽인 깊은 칸은 모양이 같아서(깎임·앞면 없음, 그늘은 거의 까맘) 그림 하나를 같이 써요 — 처음 들어갈 때 계산을 줄여요
  if (!s5) { const dk = rock ? rock.top16 : 'ice'; let d = ic_DEEP.get(dk); if (!d) { d = ic_build(x, y, w, rock, ic_edgeOf(x, y)); ic_DEEP.set(dk, d); } ic_ART.set(i, { ...d, sig }); return ic_ART.get(i); }
  a = ic_build(x, y, w, rock, ic_edgeOf(x, y)); a.sig = sig; ic_ART.set(i, a); return a;
}
const ic_DEEP = new Map();
function ic_build(x, y, w, rock, e) {
  const ice = w === ICE_W, X = x * 16, Y = y * 16, FU = ICE.frontUp, L = ice ? ICE : ROCK;
  const tp = rock ? ic_pix(rock.top16) : null, fp = rock ? ic_pix(rock.front) : null;
  const top = ic_cnv(16, 16), shade = ic_cnv(16, 16), tg = top.getContext('2d'), sg = shade.getContext('2d'), icTI = tg.createImageData(16, 16), icSI = sg.createImageData(16, 16);
  // 둘레 10px까지 벽 지도 → 그늘(바닥에서 떨어진 거리)·테두리
  const M = 10, WW = 16 + M * 2, wmk = wallMask(X - M, Y - M, WW, WW), dist = ic_dist(wmk, WW, WW, v => v === 0), sol = (u, v) => wmk[(v + M) * WW + u + M] !== 0;
  for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) { if (!ic_in(e, u, v)) continue; const k = (v * 16 + u) * 4, wx = X + u, wy = Y + v;
    const rim = !sol(u, v - 1) || !sol(u - 1, v) || !sol(u + 1, v);
    if (ice) ic_put(icTI.data, k, rim ? (hash2(wx, wy, 250) < .22 ? IC.rimT : IC.rim) : ic_topPx(wx, wy));
    else { const c = ic_at(tp, u, v); ic_put(icTI.data, k, rim ? c.map(q => Math.min(255, q * 1.35 + 14)) : c); } // 바위 윗면 가장자리는 조금 밝게
    const d = dist[(v + M) * WW + u + M], al = Math.max(0, Math.min(1, (d - L.shadeRim) / L.shadeFade)) * L.shadeBlack;
    ic_put(icSI.data, k, [8, 6, 12], Math.round(al * 255)); }
  tg.putImageData(icTI, 0, 0); sg.putImageData(icSI, 0, 0);
  // 앞면: 칸마다 발자국 맨 아래 픽셀 바로 아래가 비었으면(남쪽 칸이 열렸거나, 아래 벽이 깎였거나, 안쪽 모서리) 그 칸에 16px 앞면 — 둥근 모서리를 따라 돌아요
  let front = null; const vbot = new Int8Array(16).fill(-1); let anyF = false;
  for (let u = 0; u < 16; u++) for (let v = 15; v >= 0; v--) if (ic_in(e, u, v)) { if (!sol(u, v + 1)) { vbot[u] = v; anyF = true; } break; }
  if (anyF) { front = ic_cnv(16, 16 + FU); const fg = front.getContext('2d'), icFI = fg.createImageData(16, 16 + FU);
    for (let u = 0; u < 16; u++) { if (vbot[u] < 0) continue; const side = (u === 0 || vbot[u - 1] < 0) && (u > 0 || e.oW) || (u === 15 || vbot[u + 1] < 0) && (u < 15 || e.oE);
      for (let r = 0; r < 16; r++) { const row = vbot[u] - 15 + r + FU; if (row < 0 || row >= 16 + FU) continue; const k = (row * 16 + u) * 4, wx = X + u;
        let c;
        if (ice) { c = r === 0 ? IC.fHi : r === 15 ? IC.fLow : ic_mix(IC.fTop, IC.fBot, Math.round(r / 15 * 4) / 4);
          if (r > 0 && r < 15) { const f = ic_cell(wx * 2, Y + r * 3, 9, 1, 260); if (f.gap < .45) c = ic_mix(c, IC.crack, .6); else if (hash2(f.id, 1, 261) < .3) c = ic_mix(c, IC.fTop, .25); }
          if (side && r > 0 && r < 15) c = ic_mix(c, IC.fSide, .7); }
        else { c = ic_at(fp, u, r); if (side) c = c.map(q => q * .72); }
        ic_put(icFI.data, k, c); } }
    fg.putImageData(icFI, 0, 0); }
  return { src: rock ? rock.top16 : null, top, shade, front, frontUp: FU, ore: ice ? 'ice' : rock.ore };
}
// ---- 바닥: 얼음 조각 한 칸 (꾸밈은 진짜 바닥 칸에만) ----
export function drawIceShard(g, x, y, X, Y, deco) {
  const im = g.getImageData(X, Y, 16, 16), D = im.data, wx0 = x * 16, wy0 = y * 16;
  for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) ic_put(D, (v * 16 + u) * 4, ic_floorPx(wx0 + u, wy0 + v));
  if (deco) { const h = hash2(x, y, 270);
    if (h < .09) { const cx = 4 + ((hash2(x, y, 271) * 8) | 0), cy = 4 + ((hash2(x, y, 272) * 8) | 0); // X 서리 무늬
      for (let t = -2; t <= 2; t++) for (const [px, py] of [[cx + t, cy + t], [cx + t, cy - t]]) ic_put(D, (py * 16 + px) * 4, t === 0 ? IC.spark : IC.frost); }
    else if (h < .2) { const n = 2 + ((hash2(x, y, 273) * 2) | 0); for (let q = 0; q < n; q++) { const px = 2 + ((hash2(x, y, 274 + q) * 12) | 0), py = 2 + ((hash2(x, y, 280 + q) * 12) | 0); ic_put(D, (py * 16 + px) * 4, IC.dot); } } }
  g.putImageData(im, X, Y);
}
// 물가: 얼음 동굴에서 물 칸으로 들어오는 땅 픽셀 색 (render/terrain.js bakeFloor) — d = 땅 가장자리에서의 거리
export function iceShorePx(wx, wy, d) { return d === 1 ? IC.edge : d === 2 ? IC.edgeS : ic_floorPx(wx, wy); }
export function iceCliffPx(r, h) { return r < h ? ic_mix(IC.cliffT, IC.cliffB, Math.round(r / (h - 1) * 3) / 3) : IC.foam; }
// ---- 벽 옆: 얼음벽은 청록빛(발광), 바위는 옅은 그림자 (바닥 조각 하나 = N×N칸, 없으면 null) ----
export function wallEdgeChunk(cx, cy, N) {
  const x0 = cx * N, y0 = cy * N; let any = false;
  for (let y = y0 - 1; y <= y0 + N && !any; y++) for (let x = x0 - 1; x <= x0 + N; x++) if (inB(x, y) && SLANT.has(G.wall[idx(x, y)])) { any = true; break; }
  if (!any) return null;
  const P = N * 16, Mg = ICE.glowMax + 2, WW = P + Mg * 2, X0 = x0 * 16 - Mg, Y0 = y0 * 16 - Mg, wmk = wallMask(X0, Y0, WW, WW);
  const dI = ic_dist(wmk, WW, WW, v => v === 2), dR = ic_dist(wmk, WW, WW, v => v === 3);
  const gc = ic_cnv(P, P), gi = gc.getContext('2d').createImageData(P, P), sc = ic_cnv(P, P), si = sc.getContext('2d').createImageData(P, P); let lit = false, sh = false;
  for (let j = 0; j < P; j++) for (let q = 0; q < P; q++) { const kk = (j + Mg) * WW + q + Mg; if (wmk[kk]) continue; const wx = X0 + Mg + q, wy = Y0 + Mg + j, o = (j * P + q) * 4;
    const d = dI[kk];
    if (d <= ICE.glowMax) { const reach = ICE.glowMax * (.25 + .75 * ic_vn(wx / 6, wy / 6, 290)) + 1; // 덩어리지게 들쭉날쭉
      if (d <= reach) { const t = Math.min(1, Math.round(d / reach * 3) / 3), a = t < .34 ? .85 : t < .67 ? .6 : .35; ic_put(gi.data, o, ic_mix(IC.glowA, IC.glowB, t), Math.round(a * 255)); lit = true; continue; } }
    const r = Math.round(dR[kk]); if (r >= 1 && r <= 3) { ic_put(si.data, o, [14, 8, 22], Math.round(ROCK.shadow[r - 1] * 255)); sh = true; } }
  if (lit) gc.getContext('2d').putImageData(gi, 0, 0); if (sh) sc.getContext('2d').putImageData(si, 0, 0);
  return lit || sh ? { glow: lit ? gc : null, shadow: sh ? sc : null } : null;
}
// 테스트용: 칸 (x,y) 발자국 안 픽셀 수 (깎인 모양 확인)
export function slantWallPx(x, y) { const e = ic_edgeOf(x, y); let n = 0; for (let v = 0; v < 16; v++) for (let u = 0; u < 16; u++) if (ic_in(e, u, v)) n++; return n; }
