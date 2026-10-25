// ================= 실험판 빛 — 본 게임 render/light.js 자리에 들어가요 =================
// 본 게임 새 빛(render/glight.js)이 가져가는 LIGHTS·ICE_LIGHT·iceView를 같은 이름으로 갖춰요.
// LIGHTS[0]은 늘 내 둘레 빛이에요 (glight.js가 0번을 플레이어 빛으로 봐요).
// 규칙상 밝기(lightAt)도 칸마다 계산해 둬요 — 나중에 몬스터가 생기는 곳·빛 피하기에 써요. 지금은 보이기에만 씀.
// 그래픽 칩이 없는 브라우저는 새 빛이 꺼지므로, 그때 덮을 어둠 그림(lightCv)도 여기서 만들어요 (render/view.js).
import { OBJ } from '../data/items.js';
import { hexRgb } from '../engine/util.js';
import { cv, TP } from './view.js';
import { cam, G } from '../save/state.js';
import { idx, inB } from '../world/map.js';
import { onFrame } from '../sim/systems.js';
import { takeLightDirty } from '../sim/loop.js';
export let LX0 = 0, LY0 = 0, LW = 0, LH = 0, LR = null, LG = null, LB = null, lightCv = null, lightCtx = null, lightImg = null, LIGHTS = [];
// 본 게임 얼음 동굴 차가운 빛 (실험판은 이끼 동굴뿐이라 안 씀 — glight.js가 가져가서 이름만 같게)
export const ICE_LIGHT = { amb: .06, ambMul: [.68, .92, 1.6], mul: [.82, 1.04, 1.45], player: [.82, .94, 1.12], pr: 1.15 };
export const iceView = () => !!G && G.biome[idx(Math.floor(G.p.x), Math.floor(G.p.y))] === 4;
// 바탕 밝기 (2026-10-25 사용자 선택 B: 본 게임보다 약 2.3배). 새 빛은 G.treeSeeds로 바탕 밝기를 정해요
// ((.075 + 씨앗 × .03) × .7) → 씨앗 3.21개만큼이면 .12 = 본 게임 씨앗 0개 .0525의 약 2.3배
export const AMB_B = .12, AMB_SEEDS = (AMB_B / .7 - .075) / .03;
export const PLAYER_R = 4.6; // 내 둘레 빛 반지름 (본 게임과 같음)
export function lightAt(x, y) { const i = (y - LY0) * LW + (x - LX0); if (x < LX0 || y < LY0 || x >= LX0 + LW || y >= LY0 + LH) return 0; return (LR[i] + LG[i] + LB[i]) / 3; }
// 벽에 가려지는지 (본 게임 sim/combat.js los와 같은 방식 — 칸 단위 직선)
export function seeLine(x0, y0, x1, y1) { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy, x = x0, y = y0;
  while (true) { if (x === x1 && y === y1) return true; if (!(x === x0 && y === y0) && (!inB(x, y) || G.wall[idx(x, y)])) return false; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } } }
export function computeLight() {
  if (!G) return; if (!lightCv) { lightCv = document.createElement('canvas'); lightCtx = lightCv.getContext('2d'); }
  const cw = cv.width, ch = cv.height, camX = cam.x * TP - cw / 2, camY = cam.y * TP - ch / 2;
  const x0 = Math.floor(camX / TP) - 2, x1 = Math.ceil((camX + cw) / TP) + 2, y0 = Math.floor(camY / TP) - 3, y1 = Math.ceil((camY + ch) / TP) + 3, w = x1 - x0 + 1, h = y1 - y0 + 1;
  if (w !== LW || h !== LH || !LR) { LW = w; LH = h; LR = new Float32Array(w * h); LG = new Float32Array(w * h); LB = new Float32Array(w * h); lightCv.width = w; lightCv.height = h; lightImg = lightCtx.createImageData(w, h); }
  LX0 = x0; LY0 = y0;
  const amb = AMB_B; LR.fill(amb * .85); LG.fill(amb * .8); LB.fill(amb * 1.35);
  const p = G.p, lights = [{ x: p.x, y: p.y - .3, r: PLAYER_R, c: [1, .9, .75], k: .95 }];
  for (let y = y0 - 8; y <= y1 + 8; y++) for (let x = x0 - 8; x <= x1 + 8; x++) { if (!inB(x, y)) continue; const o = G.objs.get(idx(x, y)); if (!o) continue; const d = OBJ[o.t], L = d && d.light; if (!L) continue;
    const fl = d.flick ? 1 + Math.sin(G.time * 9 + x * 3) * .05 + Math.sin(G.time * 23 + y) * .03 : 1;
    lights.push({ x: x + .5, y: y + .5, r: L[0] * fl, c: hexRgb(L[1]), k: 1, col: L[1] }); }
  LIGHTS = lights;
  for (const L of lights) { const sx = Math.floor(L.x), sy = Math.floor(L.y), r = L.r, r2 = r * r;
    for (let ty = Math.max(y0, Math.floor(L.y - r)); ty <= Math.min(y1, Math.ceil(L.y + r)); ty++) for (let tx = Math.max(x0, Math.floor(L.x - r)); tx <= Math.min(x1, Math.ceil(L.x + r)); tx++) {
      if (!inB(tx, ty)) continue; const dx = tx + .5 - L.x, dy = ty + .5 - L.y, d2 = dx * dx + dy * dy; if (d2 > r2) continue;
      let f = Math.pow(1 - Math.sqrt(d2) / r, 1.25) * L.k; if (!(tx === sx && ty === sy) && !seeLine(sx, sy, tx, ty)) f *= .1; if (f < .01) continue;
      const i = (ty - y0) * w + (tx - x0); LR[i] += f * L.c[0]; LG[i] += f * L.c[1]; LB[i] += f * L.c[2]; } }
  const D = lightImg.data;
  for (let i = 0; i < w * h; i++) { const r = Math.min(1, LR[i]), g = Math.min(1, LG[i]), b = Math.min(1, LB[i]); D[i * 4] = r * 255; D[i * 4 + 1] = g * 255; D[i * 4 + 2] = b * 255; D[i * 4 + 3] = 255;
    if (r + g + b > .95) { const tx = x0 + i % w, ty = y0 + (i / w | 0); if (inB(tx, ty)) G.explored[idx(tx, ty)] = 1; } }
  lightCtx.putImageData(lightImg, 0, 0);
}
let lightT = 0;
onFrame('light', dt => { lightT += dt; if (takeLightDirty() || lightT > .09) { lightT = 0; computeLight(); } });
