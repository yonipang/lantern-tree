// ================= 실험판 세계: 작은 이끼 동굴 + 거점 가게 (L2) =================
// 본 게임 지도 틀(world/map.js)의 200×200 크기를 쓰고, 가운데 약 90×90칸만 동굴로 만들어요. 그 밖은 단단한 암반(8).
// 바닥·벽 번호는 본 게임과 같아요(그림을 같이 쓰려고): 바닥 1 이끼 잔디 · 2 흙길 · 10 물 / 벽 1 흙벽 · 2 돌벽 · 4 구리 광맥 · 8 단단한 암반, 지역 0 = 이끼 동굴.
// L2 (재미중심.md 12·13장): 가운데 거점(작업대·계산대·진열대 2·손님 길 팻말) + 발견 공간 4곳(버섯 군락·묻힌 광맥·대장장이 쉼터·돌벽 보상 방)
// 발견 공간은 손으로 정한 자리예요(고정 배치). 거점에서 그 앞까지는 늘 굴이 이어지고, 숨은 방은 두꺼운 벽(입구만 2칸) 뒤에 있어요.
import { fbm, hash2, vn } from '../engine/random.js';
import { G, ME, setWorld } from '../save/state.js';
import { H, idx, inB, setLayout, W } from '../world/map.js';
import { WATER } from '../sim/nature.js';
import { AMB_SEEDS } from '../render/light.js';
import { freshEquip } from '../save/state.js';
import { OBJ } from '../data/items.js';
import { fpOf } from '../world/tiles.js';
export const CAVE_R = 44; // 동굴 반지름 (칸)
export const BEDROCK = 8, DIRT_W = 1, STONE_W = 2, COPPER_W = 4;
// 거점 (가운데 네모, 늘 열려 있음)
export const BASE = { x0: 93, y0: 95, x1: 107, y1: 105 };
export const inBase = (x, y) => x >= BASE.x0 && x <= BASE.x1 && y >= BASE.y0 && y <= BASE.y1;
export const GATE = { x: 106.5, y: 103.6 }; // 손님이 오가는 길 (팻말 옆)
export const SMITH_HOME = { x: 96.5, y: 99.6 }; // 대장장이가 마을에 오면 서는 자리 (작업대 아래)
// 발견 공간: 안쪽 네모 · 입구(plug: 막는 벽 2칸, 없으면 열린 입구) · 거점에서 오는 굴의 끝(end)과 굴 길(path)
export const ROOMS = {
  grove: { n: '버섯 군락', x0: 83, y0: 85, x1: 87, y1: 89, ring: DIRT_W, plug: [[85, 90], [85, 91]], end: [85, 92], path: [[93, 97], [85, 97], [85, 92]], clue: 'spore' },
  vein: { n: '묻힌 광맥', x0: 114, y0: 88, x1: 120, y1: 92, ring: DIRT_W, plug: null, end: [117, 93], path: [[107, 97], [117, 97], [117, 93]] },
  shelter: { n: '버려진 채굴 쉼터', x0: 77, y0: 108, x1: 83, y1: 112, ring: DIRT_W, plug: [[85, 110], [84, 110]], end: [86, 110], path: [[93, 103], [86, 103], [86, 110]], clue: 'hammer' },
  vault: { n: '돌벽 너머 작은 방', x0: 125, y0: 103, x1: 129, y1: 106, ring: STONE_W, plug: [[123, 105], [124, 105]], end: [122, 105], path: [[107, 103], [122, 103], [122, 105]] },
};
// 여러 칸 물체: 왼쪽 위 칸에 물체, 나머지 칸엔 '_part'(본 게임과 같은 방식 — world/tiles.js isSolid가 봐요)
export function placeObj(g, t, x, y, extra = {}) {
  const o = { t, ...extra }, [w, h] = (OBJ[t] && OBJ[t].sz) || [1, 1], a = idx(x, y);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) { const i = idx(xx, yy); g.wall[i] = 0; if (g.floor[i] === WATER) g.floor[i] = 2; g.objs.set(i, i === a ? o : { t: '_part', a }); }
  return o;
}
export function removeObj(a) { const o = G.objs.get(a); if (!o) return; const [w, h] = fpOf(o), x = a % W, y = (a / W) | 0; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) G.objs.delete(idx(xx, yy)); }
export function newLabWorld(seed) {
  setLayout(1); // 200×200
  const N = W * H, wall = new Uint8Array(N), floor = new Uint8Array(N), biome = new Uint8Array(N);
  const cx = W / 2, cy = H / 2;
  // 굴 모양: 두 소음의 「능선」(값이 0.5 근처인 곳)을 따라 구불구불한 굴 + 군데군데 작은 방, 가운데 시작 방은 늘 열림
  const rooms = [[cx, cy, 4.5]]; for (let k = 0; k < 9; k++) { const a = hash2(k, 1, seed) * 6.283, r = 12 + hash2(k, 2, seed) * (CAVE_R - 18); rooms.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 2.5 + hash2(k, 3, seed) * 3]); }
  const distOf = (x, y) => Math.hypot(x - cx, y - cy) + (vn(x * .08, y * .08, seed + 5) - .5) * 10;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = idx(x, y), d = distOf(x, y);
    floor[i] = vn(x * .16, y * .16, seed + 3) > .66 ? 2 : 1;
    if (d > CAVE_R) { wall[i] = BEDROCK; continue; }
    const tun = Math.abs(fbm(x * .045, y * .045, seed) - .5) < .04 || Math.abs(fbm(x * .06, y * .06, seed + 9) - .5) < .028;
    const room = rooms.some(([rx, ry, rr]) => Math.hypot(x - rx, y - ry) < rr + (vn(x * .3, y * .3, seed + 7) - .5) * 1.6);
    wall[i] = tun || room ? 0 : 1;
  }
  // 한 번 다듬기: 벽에 둘러싸인 외톨이 빈칸은 메우고, 거의 다 열린 곳의 외톨이 벽은 걷어요
  const nb = i => { let n = 0; for (const o of [-1, 1, -W, W, -W - 1, -W + 1, W - 1, W + 1]) n += wall[i + o] ? 1 : 0; return n; };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = idx(x, y); if (wall[i] === BEDROCK) continue; const n = nb(i); if (!wall[i] && n >= 7) wall[i] = 1; else if (wall[i] && n <= 1) wall[i] = 0; }
  // 벽 종류: 대부분 흙벽, 군데군데 돌벽 덩어리, 흙벽 속 작은 구리 광맥 / 물웅덩이는 열린 곳에 드문드문
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = idx(x, y); if (wall[i] === 1) wall[i] = vn(x * .22, y * .22, seed + 21) > .8 ? COPPER_W : vn(x * .07, y * .07, seed + 33) > .66 ? STONE_W : DIRT_W;
    else if (!wall[i] && vn(x * .12, y * .12, seed + 41) > .8 && distOf(x, y) > 8) floor[i] = WATER; }
  const g = { seed, wall, floor, biome, objs: new Map(), wdmg: new Map(), whit: new Map(), drops: [], parts: [], texts: [], time: 0,
    treeSeeds: AMB_SEEDS, // 새 빛 바탕 밝기 B (render/light.js) — 실험판엔 등불나무가 없어요
    gold: 0, bag: { torch: 6 }, pick: 'pickWood', recipes: ['torch', 'stew', 'chair'], cats: ['raw', 'basic'],
    shelves: [], customers: [], ledger: {}, smith: { at: 'shelter', x: 79.5, y: 110.6 }, opened: {}, custCd: 6, custN: 0, sold: 0, log: [] };
  const open = (x, y) => { if (!inB(x, y) || wall[idx(x, y)] === BEDROCK) return; const i = idx(x, y); wall[i] = 0; if (floor[i] === WATER) floor[i] = 2; };
  // 거점: 네모 전체를 열고 물은 흙길로
  for (let y = BASE.y0; y <= BASE.y1; y++) for (let x = BASE.x0; x <= BASE.x1; x++) open(x, y);
  // 거점에서 발견 공간 앞까지 2칸 너비 굴 (꺾인 선)
  for (const R of Object.values(ROOMS)) for (let k = 0; k + 1 < R.path.length; k++) { const [ax, ay] = R.path[k], [bx, by] = R.path[k + 1];
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) { open(x, y); if (ay === by) open(x, y + 1); else open(x + 1, y); } }
  // 발견 공간: 둘레 벽(숨은 방은 2칸 두께) → 안쪽 열기 → 입구 막는 벽
  for (const [key, R] of Object.entries(ROOMS)) { const th = R.plug ? 2 : 1;
    for (let y = R.y0 - th; y <= R.y1 + th; y++) for (let x = R.x0 - th; x <= R.x1 + th; x++) { const i = idx(x, y); wall[i] = R.ring; floor[i] = floor[i] === WATER ? 2 : floor[i]; }
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) open(x, y);
    if (R.plug) for (const [x, y] of R.plug) { const i = idx(x, y); wall[i] = R.ring; } else { const [ex, ey] = R.end; open(ex, ey - 1); open(ex + 1, ey - 1); }
    if (key === 'vein') for (const [x, y] of [[115, 89], [119, 89], [117, 90], [115, 91], [119, 91]]) wall[idx(x, y)] = COPPER_W; // 구리 노드 5개 (12장)
    open(R.end[0], R.end[1]); }
  setWorld(g, { id: ME, p: null, inv: [], char: 'sprout', look: null, equip: freshEquip(), act: null, swing: null, digCd: 0, explored: new Uint8Array(N) });
  // 거점 물건 (작업대·계산대·진열대 2·손님 길 팻말)
  placeObj(g, 'bench', 94, 97);
  placeObj(g, 'desk', 102, 97, { counter: 1 });
  for (const [x, y] of [[99, 100], [102, 100]]) { placeObj(g, 'crateF', x, y, { shelf: g.shelves.length }); g.shelves.push({ x, y, id: null, n: 0, price: 0 }); }
  placeObj(g, 'cropSign', 107, 102, { gate: 1 });
  for (const [x, y] of [[93, 100], [107, 99], [97, 105], [104, 105]]) placeObj(g, 'torch', x, y); // 거점을 밝히는 횃불 (가져갈 수 없음)
  // 쉼터 안: 낡은 상자·통·횃불 (대장장이는 G.smith로 따로 그려요)
  placeObj(g, 'crateS', 78, 109); placeObj(g, 'barrelS', 82, 109); placeObj(g, 'torch', 80, 112);
  // 돌벽 너머 방: 보물상자 (횃불 4 · 버섯 3 · 버섯 램프 1 — 12장)
  placeObj(g, 'chest', 127, 104, { loot: [['torch', 4], ['mushroom', 3], ['lampShroom', 1]] });
  // 버섯 군락: 큰버섯 5 · 빛버섯 3 (12장: 버섯 6 + 나무 2 안팎)
  for (const [x, y] of [[83, 85], [86, 86], [84, 88], [87, 89], [85, 87]]) placeObj(g, 'bigShroom', x, y, { hp: 3 });
  for (const [x, y] of [[84, 86], [86, 88], [83, 89]]) placeObj(g, 'glow', x, y, { hp: 1 });
  // 뿌리기둥(나무)·큰버섯: 거점 둘레 굴에 흩어 둠 + 거점 안 두 그루 (나무 2개 이상 보장 — 12장)
  placeObj(g, 'root', 94, 104, { hp: 3 }); placeObj(g, 'root', 106, 96, { hp: 3 });
  let nRoot = 0, nShroom = 0;
  for (let r = 7; r < 34 && (nRoot < 12 || nShroom < 5); r += .5) for (let a = 0; a < 6.283; a += .35) { const x = Math.round(cx + Math.cos(a + r) * r), y = Math.round(cy + Math.sin(a + r) * r); if (!inB(x, y)) continue; const i = idx(x, y);
    if (wall[i] || floor[i] === WATER || g.objs.has(i) || inBase(x, y) || inAnyRoom(x, y, 2) || hash2(x, y, seed + 51) > .05) continue;
    if (wall[i - W] && wall[i + W] && wall[i - 1] && wall[i + 1]) continue;
    if (nRoot < 12) { placeObj(g, 'root', x, y, { hp: 3 }); nRoot++; } else if (nShroom < 5) { placeObj(g, 'bigShroom', x, y, { hp: 3 }); nShroom++; } }
  g.p = { x: 100.5, y: 103.6, face: { x: 0, y: -1 }, dir: 'up', flip: false, anim: 0, moving: false, hurt: 0, inv: 0, dead: 0, kx: 0, ky: 0, hp: 100 };
  return g;
}
export function inAnyRoom(x, y, pad = 0) { for (const R of Object.values(ROOMS)) if (x >= R.x0 - pad && x <= R.x1 + pad && y >= R.y0 - pad && y <= R.y1 + pad) return R; return null; }
export const tileAt = (x, y) => (inB(x, y) ? idx(x, y) : -1);
export const isOpen = (x, y) => inB(x, y) && !G.wall[idx(x, y)] && G.floor[idx(x, y)] !== WATER;
export const rnd01 = (x, y, k) => hash2(x, y, k);
