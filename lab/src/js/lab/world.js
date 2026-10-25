// ================= 실험판 세계: 작은 이끼 동굴 하나 (L1) =================
// 본 게임 지도 틀(world/map.js)의 200×200 크기를 쓰고, 가운데 약 90×90칸만 동굴로 만들어요. 그 밖은 단단한 암반(8).
// 바닥·벽 번호는 본 게임과 같아요(그림을 같이 쓰려고): 바닥 1 이끼 잔디 · 2 흙길 · 10 물 / 벽 1 흙벽 · 2 돌벽 · 4 구리 광맥 · 8 단단한 암반, 지역 0 = 이끼 동굴.
// 단서·둥지·작은 유적은 L2에서 (재미중심.md 이끼 동굴 실험).
import { fbm, hash2, vn } from '../engine/random.js';
import { G, ME, setWorld } from '../save/state.js';
import { H, idx, inB, setLayout, W } from '../world/map.js';
import { WATER } from '../sim/nature.js';
import { AMB_SEEDS } from '../render/light.js';
import { freshEquip } from '../save/state.js';
export const CAVE_R = 44; // 동굴 반지름 (칸)
export const BEDROCK = 8, DIRT_W = 1, STONE_W = 2, COPPER_W = 4;
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
  // 섬처럼 떨어진 굴은 그대로 둬요 — 캐서 찾아가는 맛 (L2에서 단서를 여기 둬요)
  const p = { x: cx + .5, y: cy + .5, face: { x: 0, y: 1 }, dir: 'down', flip: false, anim: 0, moving: false, hurt: 0, inv: 0, dead: 0, kx: 0, ky: 0, hp: 100 };
  const g = { seed, wall, floor, biome, objs: new Map(), wdmg: new Map(), drops: [], parts: [], texts: [], time: 0,
    treeSeeds: AMB_SEEDS, // 새 빛 바탕 밝기 B (render/light.js) — 실험판엔 등불나무가 없어요
    torches: 6 };
  const pl = { id: ME, p, inv: [], char: 'sprout', look: null, equip: freshEquip(), act: null, swing: null, digCd: 0, explored: new Uint8Array(N) };
  return setWorld(g, pl);
}
export const tileAt = (x, y) => (inB(x, y) ? idx(x, y) : -1);
export const isOpen = (x, y) => inB(x, y) && !G.wall[idx(x, y)] && G.floor[idx(x, y)] !== WATER;
// 바닥에 얹은 물건이 길을 막는지 (횃불은 안 막음)
export const solidAt = (x, y) => { if (!inB(x, y)) return true; const i = idx(x, y); if (G.wall[i] || G.floor[i] === WATER) return true; const o = G.objs.get(i); return !!(o && o.solid); };
export const rnd01 = (x, y, k) => hash2(x, y, k);
