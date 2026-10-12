// ================= 지도 그림: 칸 색(MAPF·MAPW), 지도 다시 만들기(rebuildMap)·한 점 고치기(mapPixel) =================
// (구조 변경 10단계: render.js·ui/panels.js·ui/input.js에서 나눔 — 덩어리 순서는 예전 그대로)
// ================= map =================
import { hexRgb } from '../engine/util.js';
import { chunks } from './chunks.js';
import { AMB } from './world.js';
import { G } from '../save/state.js';
import { H, idx, W } from '../world/map.js';
export let mapCv = null, mapCtx = null, mapImg = null;
export const MAPF = { 7: '#6fb36a', 8: '#7f6191', 9: '#958ccf', 10: '#3f7fb5', 1: '#4f8f57', 2: '#7a5442', 3: '#6a5272', 4: '#4a5378', 5: '#c08a58', 6: '#8f8aa3' };
Object.assign(MAPF, { 21: '#7a6a3a', 17: '#ff6a2a', 18: '#4a3f48', 19: '#c8dcef', 20: '#a8e0f8', 11: '#6fb6e0', 12: '#3f7fb5', 13: '#5b9bd0', 14: '#8a7ad0', 15: '#7fb0d8', 16: '#e8a8c0' });
export const MAPW = { 13: '#8a72d0', 9: '#2e2832', 10: '#c9a03a', 11: '#9cc8e8', 12: '#5ad8f0', 1: '#3a2a25', 2: '#38364a', 3: '#4a3a78', 4: '#a85f32', 5: '#8d97a8', 6: '#8a5a32', 7: '#6f6a86', 8: '#0b0910' };
export function rebuildMap() { chunks.clear(); AMB.length = 0; if (!mapCv || mapCv.width !== W) { mapCv = document.createElement('canvas'); mapCv.width = W; mapCv.height = H; mapCtx = mapCv.getContext('2d'); } mapImg = mapCtx.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G.explored[idx(x, y)]) mapPixel(x, y, true); mapCtx.putImageData(mapImg, 0, 0); }
export function mapPixel(x, y, bulk) {
  const i = idx(x, y); if (!G.explored[i] || !mapImg) return; const w = G.wall[i]; const col = w ? MAPW[w] : MAPF[G.floor[i]] || '#555';
  const [r, g, b] = hexRgb(col); const k = i * 4; mapImg.data[k] = r * 255; mapImg.data[k + 1] = g * 255; mapImg.data[k + 2] = b * 255; mapImg.data[k + 3] = 255; if (!bulk) mapDirty = true;
}
export let mapDirty = false;
export function flushMap() { if (mapDirty) { mapCtx.putImageData(mapImg, 0, 0); mapDirty = false; } } // 바뀐 지도 그림을 캔버스에
