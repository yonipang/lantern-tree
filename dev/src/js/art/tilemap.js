// ================= v71 바닥 타일맵 · 높은 벽 (설정과 그림 만들기) =================
// 바닥: dev/art/tiles/<이름>.raw.png 타일셋을 한 칸의 4등분(8px 조각)으로 이어 붙여요.
//   한 타일셋 = 3×3 덩어리(blk: 바깥 모서리·변·가운데) + 안쪽 모서리 2×2(inn: 네 칸이 만나는 곳에 구멍이 하나).
//   조각마다 옆 두 칸과 대각선 한 칸이 같은 땅인지 보고 가운데·변·바깥 모서리·안쪽 모서리 중 하나를 골라요.
// 물에 닿는 남쪽 가장자리에는 절벽(cliff), 물칸 맨 위에는 거품/얼음 두께(fringeWL)를 그려요.
// 자연 벽에 닿는 곳은 바닥이 둥글게 끝나고 그 바깥은 어두운 바위색(ROCK_FILL)이에요. 사람이 쌓은 벽(나무·돌벽돌)은 바닥이 그대로 닿아요.
// 그리기는 render/chunks.js(바닥)·render/world.js(벽·물). 그림이 없으면(타일셋 PNG를 빼면) 예전 바닥 그대로예요.
import { ARTC } from './hand-art.js';
import { SPR } from './world.js';

export const WALL_H = 16; // 벽 앞면 높이 px (v71: 5 → 20, v72: 20 → 16 = 한 칸) — 앞면이 벽 칸에 딱 맞게 서요
export const WALL_TOP = 12; // v72: 벽 윗면 높이 px (예전 16) — 앞면 바로 위에 얹혀요
export const WALL_LIFT = WALL_H + WALL_TOP - 16; // 벽이 자기 칸 위(북쪽 칸)로 올라오는 높이: 12px — 그만큼 뒤에 선 것을 가려요
export const BUILT_WALLS = new Set([6, 7]); // 나무 벽·돌벽돌 벽: 바닥 테두리 없이 바로 닿아요
export const ROCK_FILL = '#28202c';
// 지역별 물 색 [바탕, 잔물결, 반짝임] — 이끼 동굴은 청록, 얼음 동굴은 차가운 짙은 파랑. 나머지 지역은 예전 물 그림
export const BIOME_WATER = { 0: ['#82ebcf', '#b0f6e2', '#d8fbf1'], 4: ['#3f6fb0', '#6898d2', '#96c4ec'] };
export const OLD_WATER = '#3a78b0';
// 바닥 번호 → 타일셋. sheet = ART 경로, blk·inn = 시트 안 칸 좌표(16px 단위)
//   path: 위에 깔리는 길(흙길) — 주변에 잔디가 있으면 잔디 위에, 없으면 혼자 테두리를 가져요
//   deco: 풀포기·얼음 줄무늬를 드문드문, patches: 여러 칸짜리 풀 무늬(같은 조각 안에 다 들어가고 둘레가 잔디일 때만)
//   edgeTo: 이 바닥 쪽으로도 테두리를 둘러요(눈 → 얼음), edgeFill: 그 테두리 바깥 색
export const TILESETS = [
  { name: 'grass', sheet: 'tiles/grass', floors: [1, 2], plain: [1], blk: [2, 0], inn: [0, 3],
    path: { floors: [2], blk: [5, 11], inn: [0, 13] },
    deco: { dens: .1, list: [[1, 0], [1, 1], [1, 2]] },
    patches: [{ dens: .03, size: [4, 3], at: [5, 1] }, { dens: .09, size: [2, 2], at: [2, 5] }],
    cliff: { x: 40, y: 133, h: 7, at: 9, fh: 2 } },
  { name: 'snow', sheet: 'tiles/snow', floors: [19], blk: [0, 10], inn: [2, 7], edgeTo: [20], edgeFill: '#9ecff2',
    cliff: { x: 8, y: 135, h: 6, at: 10, fh: 2 } },
  { name: 'ice', sheet: 'tiles/ice', floors: [20], blk: [0, 0], inn: [3, 0],
    deco: { dens: .25, list: [[5, 0]], flip: true },
    cliff: { x: 96, y: 39, h: 1, at: 15, fh: 6 } },
];
const WALL_LOOK = { topTint: 'rgb(200,192,210)', faceTop: 'rgb(255,250,245)', faceBot: 'rgb(190,168,160)', rim: 2, fade: 5, black: .96 };
export const TM = { ready: false, byFloor: {}, shade: new Map() };
export const tileSetOf = f => TM.byFloor[f] || null;
const cnv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; if (fn) fn(g); return c; };

// buildSprites() 끝(지형 테두리를 만든 뒤)에 불러요
export function buildTilemap() {
  buildWalls(); buildWater();
  TM.byFloor = {}; TM.ready = TILESETS.every(s => ARTC[s.sheet]);
  if (!TM.ready) return;
  const blank = cnv(16, 16), blank4 = [blank, blank, blank, blank];
  for (const s of TILESETS) {
    s.img = ARTC[s.sheet];
    for (const f of s.floors) TM.byFloor[f] = s;
    // 물칸 위쪽: 땅이 북쪽에 있으면 거품(또는 얼음 두께)만, 다른 방향 테두리는 땅 칸이 직접 그려요
    const top = s.cliff ? cnv(16, 16, g => g.drawImage(s.img, s.cliff.x, s.cliff.y + s.cliff.h, 16, s.cliff.fh, 0, 0, 16, s.cliff.fh)) : blank;
    for (const f of s.floors) {
      SPR.fringeWX[f] = blank4; SPR.cornerW[f] = blank4; SPR.fringeWL[f] = [top, blank, blank, blank];
      if (SPR.fringe[f]) { SPR.fringe[f] = blank4; SPR.fringeL[f] = blank4; SPR.fringeX[f] = blank4; SPR.corner[f] = blank4; }
    }
  }
}
// 물: 지역별 색 두 장(잔물결이 번갈아)
function buildWater() {
  SPR.waterB = {};
  for (const b in BIOME_WATER) { const [c0, c1, c2] = BIOME_WATER[b];
    SPR.waterB[b] = [0, 1].map(k => cnv(16, 16, g => { g.fillStyle = c0; g.fillRect(0, 0, 16, 16); g.fillStyle = c1;
      for (const [a, y] of k ? [[2, 4], [9, 10], [12, 3]] : [[4, 6], [11, 12], [7, 2]]) g.fillRect(a, y, 3, 1); g.fillStyle = c2; g.fillRect(k ? 6 : 10, k ? 13 : 9, 2, 1); })); }
}
// 벽: 앞면은 WALL_H 높이 — 손그림(wfront/<번호>, 16×WALL_H)이 없으면 윗면 무늬로 임시 앞면을 만들어요.
// 윗면은 16×WALL_TOP으로, 조금 어둡게. 윗면 그림(wtop)이 더 높으면(예전 16×16) 가운데 WALL_TOP줄만 써요.
function buildWalls() {
  SPR.wallIcon = {}; // the wall item icons keep the old (untinted, 5px front) look
  for (const t in SPR.wtop) { const tops = SPR.wtop[t], src = tops[1] || tops[0]; SPR.wallIcon[t] = [tops[0], SPR.wfront[t]];
    if (!(SPR.wfront[t] && SPR.wfront[t].height >= WALL_H)) SPR.wfront[t] = cnv(16, WALL_H, g => {
      for (let y = 0; y < WALL_H; y += 8) g.drawImage(src, 0, 4, 16, 8, 0, y, 16, 8);
      g.globalCompositeOperation = 'multiply'; const gr = g.createLinearGradient(0, 0, 0, WALL_H); gr.addColorStop(0, WALL_LOOK.faceTop); gr.addColorStop(1, WALL_LOOK.faceBot); g.fillStyle = gr; g.fillRect(0, 0, 16, WALL_H);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(20,12,30,0.6)'; g.fillRect(0, 0, 16, 1); g.fillStyle = 'rgba(255,240,220,0.35)'; g.fillRect(0, 1, 16, 1);
      g.fillStyle = 'rgba(20,12,30,0.16)'; for (let y = 6; y < WALL_H - 2; y += 6) g.fillRect(0, y, 16, 1);
      g.fillStyle = 'rgba(20,12,30,0.7)'; g.fillRect(0, WALL_H - 1, 16, 1);
      g.fillStyle = 'rgba(20,12,30,0.18)'; for (let x = 2; x < 16; x += 5) g.fillRect(x, 2, 1, WALL_H - 4); });
    SPR.wtop[t] = tops.map(c => cnv(16, WALL_TOP, g => { const sy = Math.max(0, (c.height - WALL_TOP) >> 1), sh = Math.min(WALL_TOP, c.height), top = () => g.drawImage(c, 0, sy, 16, sh, 0, 0, 16, sh);
      top(); g.globalCompositeOperation = 'multiply'; g.fillStyle = WALL_LOOK.topTint; g.fillRect(0, 0, 16, WALL_TOP); g.globalCompositeOperation = 'destination-in'; top(); }));
  }
  TM.shade.clear();
}
// 벽 윗면 그늘(16×WALL_TOP): 열린 쪽(벽이 아닌 칸) 가장자리 2px만 벽 무늬가 보이고 안쪽으로 5px에 걸쳐 까매져요.
// mask = 열린 이웃: 1 북 · 2 동 · 4 남 · 8 서 · 16 북동 · 32 남동 · 64 남서 · 128 북서
export function wallShade(mask) {
  let c = TM.shade.get(mask); if (c) return c;
  const o = b => mask & b, L = WALL_LOOK, TH = WALL_TOP;
  c = cnv(16, TH, g => { const im = g.createImageData(16, TH);
    for (let y = 0; y < TH; y++) for (let x = 0; x < 16; x++) { const cx = x + .5, cy = y + .5; let d = 99;
      if (o(1)) d = Math.min(d, cy); if (o(4)) d = Math.min(d, TH - cy); if (o(8)) d = Math.min(d, cx); if (o(2)) d = Math.min(d, 16 - cx);
      if (o(16)) d = Math.min(d, Math.hypot(16 - cx, cy)); if (o(32)) d = Math.min(d, Math.hypot(16 - cx, TH - cy)); if (o(64)) d = Math.min(d, Math.hypot(cx, TH - cy)); if (o(128)) d = Math.min(d, Math.hypot(cx, cy));
      const a = Math.max(0, Math.min(1, (d - L.rim) / L.fade)), k = (y * 16 + x) * 4; im.data[k] = 8; im.data[k + 1] = 6; im.data[k + 2] = 12; im.data[k + 3] = Math.round(a * 255 * L.black); }
    g.putImageData(im, 0, 0); });
  TM.shade.set(mask, c); return c;
}
