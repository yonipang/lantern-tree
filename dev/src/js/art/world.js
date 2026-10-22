// --- world object sprites
import { ARTC, ARTP } from './hand-art.js';
import { C, HD, INK, mk, outline, outlineHD, outlineSel, setMkDef, softShadow, whiten } from '../engine/canvas.js';
import { DECOR, OBJ } from '../data/items.js';
import { FLOWERS, YOUNG_TREES } from '../data/rpg-nature.js';
import { NAT123 } from '../data/nature123.js';
import { ICON, UICON, bossSpr, buildPlayer, dimmed, golemSpr, queenSpr, shotSpr, shroomySpr, slimeSpr, waterTex } from './characters.js';
import { clamp, hexRgb } from '../engine/util.js';
import { hash2, rng } from '../engine/random.js';
import { ABOSS_SPR, MON_SPR_DEF, darkSpr, npcSprites, shadowBitSpr } from './content.js';
import { bloomSpr, bossExtraSprites, emberSpr, giantSpr, natFloorTex, regFloorTex, snowSpr, spiritSpr, turtleSpr, wildSpr } from './content.js';
import { rot90, twIcon, twSprite } from '../render/parts.js';
import { FPV, GREW, GROW_SPR, setFootprints } from '../sim/building.js';
import { buildTilemap } from './tilemap.js';
export const OSPR = {
  bench: [16, 16, A => { A.r(3, 9, 2, 5, C.woodD); A.r(11, 9, 2, 5, C.woodD); A.r(1, 6, 14, 4, C.wood); A.r(1, 6, 14, 1, C.woodL); A.r(1, 9, 14, 1, C.woodD); A.r(3, 4, 4, 2, C.iron); A.r(3, 4, 4, 1, C.ironL); A.r(9, 3, 1, 3, C.woodD); A.r(8, 3, 3, 1, C.stoneD); A.r(12, 5, 2, 1, C.amber); }],
  furnace: [16, 20, A => { A.r(10, 1, 3, 5, C.stoneD); A.r(10, 1, 3, 1, C.stone); A.e(8, 9, 6.2, 5, C.stone); A.r(2, 9, 12, 9, C.stone); A.e(6, 6.5, 2.5, 1.4, C.stoneL); A.r(2, 17, 12, 1, C.stoneD); for (const [x, y] of [[3, 10], [9, 9], [6, 12], [12, 13], [3, 15]]) A.r(x, y, 2, 1, C.stoneD); A.e(8, 14.5, 3.2, 2.6, '#2a1d2f'); A.r(5, 15, 6, 2, '#2a1d2f'); A.e(8, 15.5, 2.2, 1.4, C.fire); A.p(8, 15, C.amber); A.p(7, 16, C.amber); }],
  pot: [16, 16, A => { A.r(4, 13, 2, 2, '#3a3448'); A.r(10, 13, 2, 2, '#3a3448'); A.e(8, 10, 6, 4.5, '#4a4458'); A.e(6, 9, 2, 1.2, '#6d6680'); A.r(2, 6, 12, 2, '#6d6680'); A.r(2, 6, 12, 1, '#8c86a0'); A.e(8, 6.5, 5, 1, '#e7a24b'); A.p(6, 6, '#ffd08a'); A.r(0, 8, 2, 1, '#6d6680'); A.r(14, 8, 2, 1, '#6d6680'); A.p(6, 3, '#e8e0f0'); A.p(7, 2, '#e8e0f0'); A.p(10, 3, '#e8e0f0'); }],
  chest: [16, 16, A => { A.r(2, 7, 12, 7, C.wood); A.e(8, 7, 6, 3.2, C.woodL); A.r(2, 7, 12, 1, C.woodD); A.r(2, 13, 12, 1, C.woodD); A.r(4, 4, 1, 10, C.woodD); A.r(11, 4, 1, 10, C.woodD); A.r(7, 7, 2, 3, C.amber); A.p(7, 9, '#a8692a'); A.p(4, 8, C.amber); A.p(11, 8, C.amber); A.p(5, 5, '#f0c890'); }],
  torch: [16, 16, A => { A.r(7, 8, 2, 7, C.woodD); A.r(7, 8, 1, 7, C.wood); A.r(6, 8, 4, 2, '#e5c97a'); A.e(8, 5.5, 2.6, 3.2, C.fire); A.e(8, 6, 1.5, 2, C.amber); A.p(8, 2, '#ffe9a8'); A.p(8, 6, '#fff6d8'); }],
  chair: [16, 16, A => { A.r(4, 2, 8, 2, C.woodL); A.r(4, 4, 1, 6, C.wood); A.r(11, 4, 1, 6, C.wood); A.r(7, 4, 2, 5, C.wood); A.r(3, 9, 10, 3, C.woodL); A.r(4, 9, 8, 2, '#f2a1b6'); A.p(5, 9, '#ffd1dd'); A.r(3, 11, 10, 1, C.woodD); A.r(4, 12, 1, 3, C.woodD); A.r(11, 12, 1, 3, C.woodD); }],
  table: [16, 16, A => { A.r(7, 11, 2, 4, C.woodD); A.e(8, 7, 7, 3.6, C.cream); A.r(1, 7, 14, 4, C.cream); A.r(1, 10, 14, 1, '#f2c2cc'); for (let x = 1; x < 15; x += 2) A.p(x, 11, C.rose); A.e(6, 6, 3, 1.2, '#ffffff'); A.r(9, 4, 3, 2, '#ffffff'); A.p(12, 5, '#ffffff'); A.r(9, 4, 3, 1, '#9fd8f0'); }],
  bed: [16, 24, A => { A.e(8, 4, 6, 3, C.wood); A.r(2, 4, 12, 4, C.wood); A.r(2, 4, 12, 1, C.woodL); A.p(8, 3, C.amber); A.r(2, 8, 12, 14, C.cream); A.e(8, 9.5, 5, 2, '#ffffff'); A.r(2, 12, 12, 10, '#f28aa6'); for (let y = 12; y < 22; y += 2) for (let x = 2 + ((y / 2) % 2) * 2; x < 14; x += 4) A.r(x, y, 2, 2, '#ffb3c6'); A.r(2, 12, 12, 2, '#ffd1dd'); A.r(2, 21, 12, 2, C.woodD); }],
  plant: [16, 18, A => { A.poly([[4, 11], [12, 11], [11, 17], [5, 17]], '#d9774a'); A.r(3, 10, 10, 2, '#e8915f'); A.r(5, 15, 6, 1, '#b85d36'); A.e(5.5, 7, 2.6, 3.6, C.leaf); A.e(10.5, 6, 2.6, 4, C.leafL); A.e(8, 5, 2, 4.5, C.leafD); A.e(11, 2.6, 1.6, 1.6, C.rose); A.p(11, 2, C.amber); }],
  rug: [16, 16, A => { A.r(1, 2, 14, 12, '#e98ca6'); A.r(2, 3, 12, 10, '#f8cfd9'); A.poly([[8, 4], [12, 8], [8, 12], [4, 8]], '#e98ca6'); A.poly([[8, 6], [10, 8], [8, 10], [6, 8]], C.amber); for (let x = 2; x < 15; x += 2) { A.p(x, 1, C.cream); A.p(x, 14, C.cream); } }],
  lampShroom: [16, 24, A => { A.e(8, 21.5, 3.4, 1.6, '#b98a6a'); A.r(7, 10, 2, 11, '#efe2ce'); A.r(8, 10, 1, 11, '#d9c8ae'); A.e(8, 8, 6.4, 4.6, '#ff9ad5'); A.r(2, 9, 12, 2, '#d96aa9'); A.e(6, 6, 2.2, 1.2, '#ffd6ef'); A.p(10, 5, '#ffd6ef'); A.p(11, 7, '#ffffff'); A.p(4, 8, '#ffffff'); }],
  lampCrystal: [16, 24, A => { A.r(4, 17, 8, 5, C.stone); A.r(3, 16, 10, 2, C.stoneL); A.r(4, 21, 8, 1, C.stoneD); A.poly([[8, 1], [12, 8], [10, 16], [6, 16], [4, 8]], C.cry); A.poly([[8, 1], [8, 16], [6, 16], [4, 8]], C.cryL); A.p(6, 6, '#ffffff'); A.p(6, 7, '#ffffff'); A.p(10, 11, C.cryD); }],
  shelf: [16, 24, A => { A.r(1, 2, 14, 20, C.woodD); A.r(2, 3, 12, 18, '#5a3a24'); A.r(2, 9, 12, 1, C.wood); A.r(2, 15, 12, 1, C.wood); A.r(1, 2, 14, 1, C.woodL); const bk = [C.rose, C.mint, C.amber, C.cry, '#7fb3e0', C.berry]; let x = 2; for (const c of bk) { A.r(x, 4 + (x % 3 === 0 ? 1 : 0), 2, 5 - (x % 3 === 0 ? 1 : 0), c); x += 2; } x = 2; for (const c of bk.slice().reverse()) { A.r(x, 10 + (x % 4 === 0 ? 1 : 0), 2, 5 - (x % 4 === 0 ? 1 : 0), c); x += 2; } A.e(6, 18.5, 2.5, 1.5, C.leaf); A.r(9, 17, 4, 4, '#e8915f'); }],
  cushion: [16, 16, A => { A.e(8, 10, 6.2, 4.6, '#f3c58f'); A.poly([[2.5, 8], [4.5, 2.5], [7.5, 6.5]], '#f3c58f'); A.poly([[8.5, 6.5], [11.5, 2.5], [13.5, 8]], '#f3c58f'); A.p(5, 5, C.rose); A.p(11, 5, C.rose); A.r(5, 9, 2, 1, INK); A.r(9, 9, 2, 1, INK); A.p(8, 10, C.rose); A.p(4, 11, '#ffa9b9'); A.p(12, 11, '#ffa9b9'); A.r(7, 6, 2, 1, '#d99a5c'); A.r(6, 13, 4, 1, '#d99a5c'); }],
  vase: [16, 16, A => { A.line(6, 9, 5, 4, C.leafD, 1); A.line(8, 9, 10, 3, C.leafD, 1); A.line(8, 9, 8, 5, C.leafD, 1); A.e(5, 3.5, 1.7, 1.7, C.rose); A.e(10.5, 3, 1.7, 1.7, C.amber); A.e(8, 5.5, 1.6, 1.6, '#ffffff'); A.p(5, 3, '#fff1b0'); A.p(10, 3, '#fff'); A.r(7, 8, 2, 3, '#7fb3e0'); A.e(8, 12.5, 3.6, 3, '#7fb3e0'); A.p(6, 11, '#d4ecff'); A.p(6, 12, '#d4ecff'); }],
  root: [16, 28, A => { A.poly([[2, 27], [5, 21], [7, 27]], C.woodD); A.poly([[9, 27], [11, 21], [14, 27]], C.woodD); A.r(5, 9, 6, 18, C.woodD); A.r(6, 9, 2, 18, C.wood); A.p(9, 14, '#5e391f'); A.p(8, 19, '#5e391f'); A.e(8, 8, 6.4, 5.2, C.leafD); A.e(7, 6.5, 4.4, 3.4, C.leaf); A.e(5.6, 5, 2, 1.4, C.leafL); A.p(4, 12, C.leaf); A.p(4, 13, C.leaf); A.p(12, 11, C.leaf); A.p(12, 12, C.leafD); }],
  bigShroom: [16, 26, A => { A.e(8, 24.5, 4, 1.4, '#7a5aa0'); A.r(6, 11, 4, 14, C.cream); A.r(9, 11, 1, 14, '#e5d3b5'); A.e(8, 8.5, 7.3, 5.6, '#e07b5f'); A.r(1, 10, 14, 2, '#b9573f'); A.e(5, 5.5, 1.6, 1.2, C.cream); A.e(10, 4.5, 1.3, 1, C.cream); A.p(12, 8, C.cream); A.p(4, 9, C.cream); A.p(8, 7, C.cream); }],
  grass: [16, 16, A => { A.line(4, 14, 3, 8, C.leafD); A.line(6, 14, 6, 5, C.leaf); A.line(8, 14, 9, 7, C.leafL); A.line(10, 14, 11, 6, C.leaf); A.line(12, 14, 13, 9, C.leafD); A.p(6, 5, '#d9f7b0'); A.p(11, 6, '#d9f7b0'); }, '#244a2a'],
  glow: [16, 16, A => { A.r(5, 10, 2, 4, '#e8f7f2'); A.e(6, 9, 3, 2, C.glow); A.p(5, 8, C.glowL); A.r(10, 9, 2, 5, '#e8f7f2'); A.e(11, 7.5, 2.6, 2, '#7ff0e6'); A.p(10, 7, C.glowL); A.r(8, 12, 1, 2, '#e8f7f2'); A.e(8.5, 11.5, 1.6, 1.2, C.glow); }],
  cluster: [16, 18, A => { A.poly([[3, 16], [4, 7], [7, 16]], C.cryD); A.poly([[6, 16], [8, 2], [11, 16]], C.cry); A.poly([[6, 16], [8, 2], [8, 16]], C.cryL); A.poly([[10, 16], [13, 8], [14, 16]], C.cry); A.p(7, 6, '#fff'); A.e(8, 16.5, 6, 1.2, '#3c3263'); }],
  stumpStool: [16, 16, A => { A.r(3, 8, 10, 6, C.wood); A.r(4, 9, 1, 4, C.woodD); A.r(8, 9, 1, 5, C.woodD); A.r(11, 9, 1, 4, C.woodD); A.p(2, 13, C.woodD); A.p(13, 13, C.woodD); A.e(8, 8, 5, 2.2, '#e8b97a'); A.e(8, 8, 3, 1.2, '#c99560'); A.p(8, 8, C.woodD); A.e(5.5, 7, 2, 1, C.leaf); A.p(5, 6, C.leafL); }],
  mossSofa: [16, 16, A => { A.r(1, 5, 14, 9, C.woodD); A.r(2, 3, 12, 6, '#6fae5f'); A.r(2, 3, 12, 1, '#8fd07a'); A.r(7, 4, 1, 4, '#5e9a50'); A.r(2, 9, 12, 3, '#7dbd6b'); A.r(2, 9, 12, 1, '#a5dc8a'); A.r(1, 7, 2, 6, '#5e9a50'); A.r(13, 7, 2, 6, '#5e9a50'); A.r(2, 13, 1, 2, C.woodD); A.r(13, 13, 1, 2, C.woodD); A.p(4, 4, '#ffd36b'); A.p(11, 5, '#ff9ab0'); A.p(10, 4, C.leafL); }],
  sproutLamp: [16, 24, A => { A.r(5, 19, 6, 3, '#c9845a'); A.r(4, 18, 8, 2, '#e09a6a'); A.line(8, 18, 7, 12, C.leafD); A.line(7, 12, 9, 8, C.leafD); A.e(5, 14, 2.4, 1.2, C.leaf); A.e(11, 11, 2.4, 1.2, C.leafL); A.e(9, 5, 3.2, 3.6, '#c8f58a'); A.e(9, 5.5, 1.8, 2.2, '#f4ffd8'); A.p(8, 4, '#ffffff'); A.e(9, 1.8, 2, 1, C.leaf); }],
  leafRug: [16, 16, A => { A.poly([[1, 8], [5, 3], [11, 2], [15, 7], [11, 13], [5, 13]], '#6fb66a'); A.poly([[1, 8], [5, 3], [11, 2], [15, 7]], '#82c77a'); A.line(2, 8, 14, 7, '#4c8f4a'); A.line(5, 8, 4, 5, '#4c8f4a'); A.line(9, 8, 8, 4, '#4c8f4a'); A.line(6, 8, 7, 11, '#4c8f4a'); A.line(10, 8, 11, 11, '#4c8f4a'); }, '#2f5a33'],
  mossBed: [16, 24, A => { A.r(2, 3, 12, 5, C.wood); A.r(2, 3, 12, 1, C.woodL); A.e(8, 3, 6, 1.4, C.leaf); A.p(4, 2, C.leafL); A.p(11, 2, '#ffd36b'); A.r(2, 8, 12, 14, C.cream); A.e(8, 9.5, 4.6, 1.8, '#ffffff'); A.r(2, 12, 12, 10, '#7dbd6b'); A.r(2, 12, 12, 2, '#a5dc8a'); for (const [x, y] of [[4, 15], [9, 16], [6, 19], [11, 19], [3, 20]]) { A.p(x, y, '#a5dc8a'); A.p(x + 1, y, '#5e9a50'); } A.r(2, 21, 12, 2, C.woodD); }],
  shroomStool: [16, 16, A => { A.r(6, 9, 4, 5, C.cream); A.r(9, 9, 1, 5, '#e5d3b5'); A.e(8, 8, 6.4, 3.2, '#e36b6b'); A.r(2, 9, 12, 1, '#b94c55'); A.p(5, 7, C.cream); A.p(9, 6, C.cream); A.p(11, 8, C.cream); A.p(6, 8, C.cream); }],
  shroomTable: [16, 16, A => { A.r(6, 9, 4, 6, C.cream); A.r(9, 9, 1, 6, '#e5d3b5'); A.e(8, 7.4, 7.4, 3.4, '#8e4fb8'); A.e(8, 6.8, 6.4, 2.5, '#b673de'); A.p(4, 7, '#fbe7ff'); A.p(12, 6, '#fbe7ff'); A.r(9, 4, 3, 2, '#ffffff'); A.r(9, 4, 3, 1, '#f2a0c0'); A.p(12, 5, '#ffffff'); A.e(5.5, 6, 1.4, 0.8, '#e36b6b'); }],
  sporeLamp: [16, 24, A => { A.e(8, 21.5, 3.6, 1.4, '#4a3850'); A.r(7, 10, 2, 11, '#5e4370'); A.r(7, 10, 1, 11, '#7d5a90'); A.e(8, 7, 4.6, 5, '#b673de'); A.e(8, 7.4, 3.4, 3.8, '#d59bff'); A.e(8, 7.6, 1.8, 2.2, '#f3dcff'); A.e(8, 2.5, 4.6, 1.6, '#8e4fb8'); A.p(2, 4, '#e8c8ff'); A.p(14, 6, '#e8c8ff'); A.p(13, 1, '#e8c8ff'); }],
  shroomWardrobe: [16, 24, A => { A.r(2, 9, 12, 13, C.cream); A.r(12, 9, 2, 13, '#e5d3b5'); A.e(8, 8, 7.4, 5, '#e07b5f'); A.r(1, 9, 14, 2, '#b9573f'); A.e(5, 6, 1.5, 1, C.cream); A.e(10.5, 5, 1.3, 0.9, C.cream); A.p(12, 8, C.cream); A.e(8, 17, 3, 3.5, '#b9845a'); A.r(5, 17, 6, 5, '#b9845a'); A.r(8, 14, 1, 8, '#8a5a3a'); A.p(7, 18, C.amber); A.p(9, 18, C.amber); A.e(4.5, 12.5, 1.3, 1.3, '#9fd8f0'); A.e(11.5, 12.5, 1.3, 1.3, '#9fd8f0'); A.r(2, 21, 12, 1, '#d9c2a0'); }],
  dotRug: [16, 16, A => { A.r(1, 2, 14, 12, '#8e5fb5'); A.r(2, 3, 12, 10, '#a978cf'); for (let y = 4; y < 13; y += 3) for (let x = (y % 2 ? 4 : 3); x < 14; x += 3) A.p(x, y, '#fbe7ff'); for (let x = 2; x < 15; x += 2) { A.p(x, 1, C.cream); A.p(x, 14, C.cream); } }],
  cryChair: [16, 16, A => { A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); A.poly([[4, 9], [5, 3], [8, 1], [11, 3], [12, 9]], C.cry); A.poly([[4, 9], [5, 3], [8, 1], [8, 9]], C.cryL); A.p(6, 4, '#ffffff'); A.r(3, 9, 10, 3, C.iron); A.r(3, 9, 10, 1, C.ironL); A.r(4, 10, 8, 1, '#d9c8ff'); }],
  cryTable: [16, 16, A => { A.r(3, 9, 1, 6, C.ironD); A.r(12, 9, 1, 6, C.ironD); A.r(7, 9, 2, 5, C.ironD); A.r(1, 7, 14, 2, C.cry); A.poly([[1, 7], [3, 4], [13, 4], [15, 7]], C.cryL); A.p(4, 5, '#ffffff'); A.p(5, 5, '#ffffff'); A.poly([[9, 1], [10.5, 3.5], [9, 5], [7.5, 3.5]], C.cry); A.p(9, 2, '#ffffff'); }],
  cryFountain: [16, 20, A => { A.e(8, 16, 7, 3, C.stone); A.e(8, 15.5, 6, 2.2, C.stoneL); A.e(8, 15.6, 5, 1.6, '#7fd0f0'); A.p(5, 15, '#d4f4ff'); A.p(10, 16, '#d4f4ff'); A.r(7, 7, 2, 8, C.stoneL); A.r(8, 7, 1, 8, C.stone); A.poly([[8, 0.6], [10.5, 4], [8, 7.5], [5.5, 4]], C.cry); A.poly([[8, 0.6], [8, 7.5], [5.5, 4]], C.cryL); A.p(5, 9, '#bfefff'); A.p(11, 10, '#bfefff'); A.p(4, 12, '#bfefff'); }],
  cryMirror: [16, 24, A => { A.r(4, 21, 8, 1, C.ironD); A.r(7, 18, 2, 3, C.ironD); A.e(8, 10, 5.6, 8.4, C.cry); A.e(8, 10, 4.2, 7, '#d9ecf8'); A.e(8, 10, 3.2, 6, '#c4def2'); A.line(6, 6, 9, 12, '#ffffff'); A.line(7, 5, 10, 11, '#eef7ff'); A.p(8, 1, C.cryL); A.p(3, 10, C.cryL); A.p(13, 10, C.cryL); }],
  starRug: [16, 16, A => { A.r(1, 2, 14, 12, '#3b3a72'); A.r(2, 3, 12, 10, '#4a4890'); for (const [x, y] of [[4, 5], [11, 5], [7, 8], [12, 10], [4, 11]]) { A.p(x, y, '#ffe9a8'); A.p(x - 1, y, '#c9b86a'); A.p(x + 1, y, '#c9b86a'); A.p(x, y - 1, '#c9b86a'); A.p(x, y + 1, '#c9b86a'); } for (let x = 2; x < 15; x += 2) { A.p(x, 1, C.cryL); A.p(x, 14, C.cryL); } }],
  fishTank: [16, 16, A => { A.r(2, 12, 12, 3, C.woodD); A.r(2, 12, 12, 1, C.wood); A.r(2, 3, 12, 9, '#bfe6f6'); A.r(3, 5, 10, 6, '#6fb8e0'); A.r(3, 9, 10, 2, '#e8d29a'); A.line(5, 10, 5, 6, C.leaf); A.p(4, 7, C.leafL); A.e(10, 7, 1.8, 1.1, '#ff9a4d'); A.p(12, 7, '#ff9a4d'); A.p(12, 6, '#ff9a4d'); A.p(9, 7, INK); A.p(7, 5, '#ffffff'); A.p(8, 4, '#ffffff'); A.r(2, 3, 12, 1, '#e6f6ff'); }],
  bootPlanter: [16, 18, A => { A.poly([[4, 8], [10, 8], [10, 13], [14, 13], [14, 17], [4, 17]], '#7a5a3a'); A.r(4, 16, 10, 1, '#4a3424'); A.r(4, 8, 6, 1, '#9c7650'); A.p(7, 12, '#4a3424'); A.line(6, 8, 5, 4, C.leafD); A.line(8, 8, 9, 3, C.leafD); A.e(5, 3.5, 1.6, 1.6, C.rose); A.e(9.5, 2.6, 1.6, 1.6, C.amber); A.p(9, 2, '#fff'); A.e(7, 6, 1.4, 1, C.leaf); }],
  shrine: [16, 22, A => { A.r(3, 14, 10, 7, C.stone); A.r(2, 12, 12, 3, C.stoneL); A.r(3, 20, 10, 1, C.stoneD); A.r(5, 16, 6, 1, C.stoneD); A.p(5, 17, C.amber); A.p(10, 17, C.amber); A.r(6, 18, 4, 1, C.stoneD); A.r(7, 11, 2, 1, C.stoneD); }],
};
// crops: seed → sprout → flower/bud → grown. soil: bit 1 watered (dark, wet shine), bit 2 fertilized (pale grains)
export const CROP_STEP = { berry: ['씨앗', '새싹', '꽃', '다 자람'], shroom: ['포자', '새싹', '아기 버섯', '다 자람'], moss: ['포자', '새싹', '반쯤 덮임', '다 자람'], glow: ['포자', '새싹', '빛이 돌기 시작', '다 자람'], bean: ['씨앗', '새싹', '꽃', '다 자람'], fire: ['씨앗', '새싹', '꽃', '다 자람'], radish: ['씨앗', '새싹', '서리 맺힌 잎', '다 자람'] };
export function cropSoil(A, soil) {
  const wet = soil & 1; A.e(8, 13, 5, 1.8, wet ? '#3a271c' : C.dirtD); A.e(8, 12.6, 4.4, 1.2, wet ? '#563826' : C.dirt);
  if (wet) { A.p(5, 13, '#7fb4dc'); A.p(11, 12, '#7fb4dc'); A.p(9, 14, '#5a88b0'); }
  if (soil & 2) for (const [x, y] of [[4, 12], [12, 13], [7, 14], [10, 12]]) A.p(x, y, '#efe4c4');
}
export const cropSprout = (A, c1, c2, c3) => { A.r(8, 10, 1, 3, c3); A.e(6.4, 9.6, 1.8, 1.1, c1); A.e(9.7, 8.8, 1.8, 1.1, c2); A.p(6, 9, c2); };
export function cropSpr(kind, stage, soil = 0) {
  return mk(16, 16, A => {
    cropSoil(A, soil);
    if (stage === 0) { const c = kind === 'fire' ? '#ff8a3d' : kind === 'radish' ? '#e8f8ff' : kind === 'berry' || kind === 'bean' ? '#c9a46b' : kind === 'shroom' ? '#c79ae8' : kind === 'glow' ? '#6ff2e6' : '#7cc271'; A.p(6, 12, c); A.p(8, 13, c); A.p(10, 12, c); A.p(7, 12, '#e9d6a8'); return; }
    if (stage === 1) { if (kind === 'berry') cropSprout(A, C.leaf, C.leafL, C.leafD); else if (kind === 'shroom') cropSprout(A, '#e9dcc4', '#c79ae8', '#cdbb9a'); else if (kind === 'glow') cropSprout(A, '#e8f7f2', C.glowL, '#9fd8cc'); else if (kind === 'bean') cropSprout(A, C.leaf, '#c9b8ff', C.leafD); else if (kind === 'fire') cropSprout(A, C.leaf, '#ff9b4a', C.leafD); else if (kind === 'radish') cropSprout(A, '#bfe6ff', '#e8f8ff', '#7fc0e0'); else cropSprout(A, '#62ad62', '#9be37a', '#468a4f'); return; }
    if (kind === 'berry') {
      if (stage === 2) { A.r(8, 9, 1, 4, C.leafD); A.e(8, 8.6, 4, 3, C.leafD); A.e(7.4, 7.8, 2.8, 2, C.leaf); A.p(6, 7, C.leafL);
        for (const [x, y] of [[5, 8], [10, 6]]) { A.p(x - 1, y, '#ffffff'); A.p(x + 1, y, '#ffffff'); A.p(x, y - 1, '#ffffff'); A.p(x, y + 1, '#f4eefa'); A.p(x, y, '#ffd25c'); } }
      else { A.e(8, 8, 5.6, 4.6, C.leafD); A.e(7, 6.8, 4, 3.2, C.leaf); A.e(5.6, 5.4, 1.6, 1, C.leafL); A.p(11, 5, C.leafL);
        for (const [x, y] of [[4, 8], [8, 5], [11, 8], [7, 10], [9, 8]]) { A.e(x + .5, y + .5, 1.5, 1.5, C.berry); A.p(x, y, '#ffc2d4'); } }
    } else if (kind === 'shroom') {
      if (stage === 2) { A.r(6, 10, 2, 3, C.cream); A.e(7, 9.4, 2.2, 1.5, '#e36b6b'); A.p(6, 9, '#ffd6d6'); A.r(10, 11, 1, 2, C.cream); A.e(10.5, 10.6, 1.5, 1.1, '#a65fd1'); }
      else { A.r(4, 8, 3, 5, C.cream); A.r(6, 8, 1, 5, '#e5d3b5'); A.e(5.5, 6.8, 3.8, 2.6, '#e36b6b'); A.r(2, 7, 7, 1, '#b9573f'); A.p(4, 5, C.cream); A.p(7, 6, C.cream);
        A.r(10, 9, 2, 4, C.cream); A.e(11, 8, 2.8, 2, '#a65fd1'); A.p(10, 7, '#fbe7ff'); A.p(12, 8, '#fbe7ff'); }
    } else if (kind === 'glow') {
      if (stage === 2) { A.r(6, 10, 2, 3, '#e8f7f2'); A.e(7, 9.4, 2.4, 1.6, '#36b3a8'); A.p(5, 9, C.glowL); A.p(9, 9, C.glowL); A.r(10, 11, 1, 2, '#e8f7f2'); A.e(10.5, 10.5, 1.6, 1.1, '#36b3a8'); A.p(11, 10, C.glowL); }
      else { A.r(4, 9, 2, 4, '#e8f7f2'); A.e(5, 8, 3, 2.2, C.glow); A.p(4, 7, C.glowL); A.p(6, 7, '#ffffff'); A.r(9, 7, 3, 6, '#e8f7f2'); A.r(11, 7, 1, 6, '#c8e6df'); A.e(10.5, 6, 3.6, 2.6, C.glow); A.r(7, 7, 7, 1, '#36b3a8'); A.p(9, 5, '#ffffff'); A.p(12, 5, C.glowL); A.r(7, 11, 1, 2, '#e8f7f2'); A.e(7.5, 10.6, 1.4, 1, C.glowL); }
    } else if (kind === 'fire') {
      A.r(8, 8, 1, 5, C.leafD); A.e(6, 10, 2, 1.2, C.leaf); A.e(10.4, 9.2, 2, 1.2, C.leafL);
      if (stage === 2) { A.e(8, 6.4, 2.6, 2.2, '#ff8a3d'); A.e(8, 6, 1.6, 1.4, '#ffd25c'); A.p(8, 5, '#fff1b0'); A.p(6, 6, '#ff6a2a'); A.p(10, 7, '#ff6a2a'); }
      else { A.e(8, 7.5, 5, 3.8, C.leafD); A.e(7, 6.6, 3.4, 2.4, C.leaf); for (const [x, y] of [[5, 7], [10, 5], [11, 9], [7, 10]]) { A.e(x + .5, y + .5, 1.5, 1.5, '#ff6a2a'); A.p(x, y, '#ffd25c'); } A.p(9, 8, '#fff1b0'); }
    } else if (kind === 'radish') {
      if (stage === 2) { A.e(6, 9, 1.8, 3, '#7fc0e0'); A.e(10, 9, 1.8, 3, '#9fd8f0'); A.e(8, 8, 1.6, 3.4, '#bfe6ff'); A.p(6, 6, '#ffffff'); A.p(10, 6, '#ffffff'); A.p(8, 5, '#ffffff'); }
      else { A.e(8, 11.6, 3.4, 2.4, '#e8f8ff'); A.e(7, 11, 1.6, 1.2, '#ffffff'); A.p(10, 12, '#bfe6ff'); A.e(5.6, 7, 1.8, 3.2, '#7fc0e0'); A.e(10.4, 7, 1.8, 3.2, '#9fd8f0'); A.e(8, 6, 1.6, 3.4, '#bfe6ff'); A.p(5, 4, '#ffffff'); A.p(11, 4, '#ffffff'); A.p(8, 3, '#ffffff'); }
    } else if (kind === 'bean') {
      A.line(8, 13, 8, 4, C.leafD); A.line(8, 9, 5, 6, C.leafD); A.line(8, 7, 11, 5, C.leafD); A.e(5.5, 9, 1.8, 1.1, C.leaf); A.e(10.6, 8.6, 1.8, 1.1, C.leaf); A.e(8, 3.6, 1.6, 1, C.leafL);
      if (stage === 2) { for (const [x, y] of [[5, 6], [11, 5], [8, 8]]) { A.p(x - 1, y, '#e3d4ff'); A.p(x + 1, y, '#e3d4ff'); A.p(x, y - 1, '#ffffff'); A.p(x, y + 1, '#c9b8ff'); A.p(x, y, '#fff1b0'); } }
      else { for (const [x, y] of [[4, 6], [11, 4], [10, 9], [5, 10]]) { A.e(x + .5, y + 1, 1.3, 2, C.cry); A.p(x, y, C.cryL); A.p(x + 1, y + 2, C.cryD); } A.p(6, 6, '#ffffff'); }
    } else {
      if (stage === 2) { A.e(8, 11.4, 4.4, 2.2, '#468a4f'); A.e(7, 10.8, 2.6, 1.4, '#62ad62'); A.p(6, 10, '#9be37a'); A.p(10, 11, '#9be37a'); A.p(11, 10, '#62ad62'); }
      else { A.e(8, 10.6, 6.2, 3.8, '#3c7a46'); A.e(7.5, 9.6, 4.8, 2.8, '#58a05c'); A.e(6, 8.6, 2.2, 1.3, '#7cc271'); for (const [x, y] of [[4, 10], [8, 8], [11, 10], [9, 11], [12, 9]]) A.p(x, y, '#9be37a'); A.p(10, 8, '#ffd36b'); A.p(5, 11, '#fff1d6'); }
    }
  });
}
// a younger look for a tree: the same picture drawn smaller, then outlined again
export function youngSpr([w, h, f]) { const raw = mk(w, h, f, null), k = .78, w2 = Math.round(w * k), h2 = Math.round(h * k); return mk(w2, h2, A => { A.g.imageSmoothingEnabled = false; A.g.drawImage(raw, 0, 0, w2, h2); }); }
export function bushSpr(full) {
  return mk(16, 16, A => { A.e(8, 10, 6.6, 4.8, C.leafD); A.e(6, 8.6, 3.6, 3, C.leaf); A.e(10.4, 8.2, 3.6, 3, C.leaf); A.e(5, 7.4, 1.4, 1, C.leafL); A.e(10, 6.8, 1.4, 1, C.leafL);
    if (full) for (const [x, y] of [[4, 10], [8, 8], [11, 11], [7, 12], [12, 8]]) { A.e(x + .5, y + .5, 1.3, 1.3, C.berry); A.p(x, y, '#ffc2d4'); } });
}
// ---- lantern tree: six looks, one per planted light seed. The look follows G.treeSeeds only, so old saves need nothing new ----
export const TREE_STAGE = ['잠든 나무', '새순', '잎이 차오름', '첫 꽃', '빛 열매', '완성'];
export const TREE_BLESS = s => s >= 5 ? 18 : s >= 3 ? 12 : 0; // crops within this many tiles grow 20% faster
export const TREE_SPREAD = [0, 0, 3.5, 5.5, 7.5, 9.5]; // moss and little flowers creep over the bare ground around the roots
// leaf palettes: dark, mid, light, lighter, shine, underside
export const TREE_PAL = [
  ['#56605a', '#68736b', '#7a857c', '#8c968d', '#a4ada4', '#454e48'],
  ['#3f7a4c', '#5ea35a', '#8fd66a', '#b8f08a', '#e4ffc4', '#2f5e3a'],
  ['#2c7454', '#38896a', '#46a07a', '#5cb98c', '#9ee3bb', '#22593f'],
  ['#235f45', '#2c7552', '#3a8c62', '#4fa676', '#86d4a4', '#1a4a35'],
  ['#1d5740', '#276c4d', '#33845c', '#46a06f', '#7cc99a', '#163f2e'],
  ['#164a35', '#1e6044', '#287752', '#349064', '#56b47f', '#0f3626'],
];
export const TREE_BARK = [['#7a7078', '#958b93', '#564d58'], ['#8c6a52', '#a8856a', '#5e4436'], [C.wood, C.woodL, C.woodD], [C.wood, C.woodL, C.woodD], ['#a86c3a', '#cf9860', '#74462a'], ['#a46838', '#cd955c', '#6e4127']];
// w,h: sprite size · cx/tw/top: trunk · br: branches [x0,y0,x1,y1,thick] · bl: leaf blobs back→front [cx,cy,rx,ry] · lan: seed lanterns (top of string) · small: extra lanterns · fruit: light fruits
export const TREE_SPEC = [
  { w: 48, h: 60, cx: 24, tw: 10, top: 24, br: [[23, 32, 10, 17, 2], [10, 17, 5, 13, 1], [14, 22, 7, 23, 1], [25, 30, 38, 15, 2], [38, 15, 43, 11, 1], [34, 21, 41, 22, 1], [24, 27, 23, 8, 2], [23, 12, 18, 6, 1], [23, 10, 28, 5, 1]],
    tuft: [[5, 12], [43, 10], [18, 5], [28, 4], [41, 21]], lan: [[11, 17], [37, 16], [8, 23]] },
  { w: 48, h: 60, cx: 24, tw: 10, top: 24, br: [[23, 32, 10, 17, 2], [10, 17, 5, 13, 1], [14, 22, 7, 23, 1], [25, 30, 38, 15, 2], [38, 15, 43, 11, 1], [34, 21, 41, 22, 1], [24, 27, 23, 8, 2], [23, 12, 18, 6, 1], [23, 10, 28, 5, 1]],
    sprout: [[5, 12], [43, 10], [18, 5], [28, 4], [41, 21], [7, 22], [23, 7], [31, 22], [15, 19], [33, 14], [22, 15]], lan: [[11, 17], [37, 16], [8, 23]] },
  { w: 48, h: 60, cx: 24, tw: 12, top: 28, br: [], bl: [[12, 25, 10, 8], [36, 25, 10, 8], [24, 18, 21, 14]], lan: [[9, 31], [24, 34], [39, 31]], base: 1 },
  { w: 60, h: 70, cx: 30, tw: 12, top: 34, br: [[30, 42, 14, 34, 2], [30, 40, 46, 34, 2]], bl: [[13, 31, 11, 9], [47, 31, 11, 9], [30, 24, 26, 17], [30, 13, 15, 8]], lan: [[11, 37], [30, 42], [49, 37], [19, 26], [41, 26]], flowers: 16, base: 2 },
  { w: 68, h: 76, cx: 34, tw: 15, top: 40, br: [[34, 50, 9, 40, 3], [9, 40, 4, 37, 2], [34, 48, 59, 40, 3], [59, 40, 64, 37, 2]], bl: [[12, 36, 12, 10], [56, 36, 12, 10], [34, 28, 30, 19], [34, 15, 18, 10]], lan: [[12, 43], [34, 48], [56, 43], [22, 32], [46, 32]], flowers: 8, fruit: [[16, 30], [29, 22], [41, 24], [52, 30], [34, 37], [23, 39], [46, 40]], base: 3 },
  { w: 80, h: 84, cx: 40, tw: 17, top: 46, br: [[40, 58, 9, 46, 3], [9, 46, 3, 42, 2], [40, 56, 71, 46, 3], [71, 46, 77, 42, 2]], bl: [[11, 42, 12, 10], [69, 42, 12, 10], [22, 30, 15, 13], [58, 30, 15, 13], [40, 31, 33, 21], [40, 16, 22, 12]], lan: [[13, 49], [40, 54], [67, 49], [25, 40], [55, 40]],
    small: [[5, 38], [75, 38], [16, 27], [64, 27], [31, 18], [49, 18], [40, 8]], flowers: 6, fruit: [[20, 34], [33, 25], [47, 25], [60, 34], [40, 42]], base: 4, rim: 1 },
];
export function leafBlob(A, R, cx, cy, rx, ry, P) {
  const n = Math.max(6, Math.round((rx + ry) / 2.6));
  A.e(cx, cy, rx * .86, ry * .84, P[0]);
  for (let k = 0; k < n; k++) { const a = k / n * 6.283 + R() * .35; A.e(cx + Math.cos(a) * rx * .7, cy + Math.sin(a) * ry * .68, rx * .3 + R() * 1.1, ry * .33 + R() * .9, P[0]); }
  A.e(cx, cy + ry * .62, rx * .66, ry * .26, P[5]);
  A.e(cx, cy - ry * .14, rx * .78, ry * .62, P[1]);
  for (let k = 0; k < n; k++) { const a = Math.PI * (1.05 + .9 * (k + .5) / n); A.e(cx + Math.cos(a) * rx * .6, cy - ry * .16 + Math.sin(a) * ry * .54, rx * .22 + R() * .9, ry * .25 + R() * .7, P[1]); }
  A.e(cx - rx * .16, cy - ry * .36, rx * .5, ry * .36, P[2]); A.e(cx + rx * .3, cy - ry * .28, rx * .28, ry * .24, P[2]);
  A.e(cx - rx * .3, cy - ry * .54, rx * .26, ry * .19, P[3]); A.e(cx + rx * .12, cy - ry * .6, rx * .2, ry * .14, P[3]);
  A.e(cx - rx * .38, cy - ry * .62, Math.max(1.3, rx * .1), Math.max(.8, ry * .06), P[4]); A.p(cx + rx * .1, cy - ry * .7, P[4]);
  for (let k = 0; k < rx * ry / 7; k++) { const a = R() * 6.283, d = Math.sqrt(R()) * .78, x = Math.round(cx + Math.cos(a) * rx * d), y = Math.round(cy + Math.sin(a) * ry * d), col = y < cy - ry * .25 ? P[1] : P[0]; A.p(x, y, col); A.p(x + 1, y - 1, col); }
}
export function treeSprs(s) {
  const S = TREE_SPEC[s], P = TREE_PAL[s], B = TREE_BARK[s], R = rng(4021 + s * 97), hl = (S.cx - S.tw / 2) | 0, hr = hl + S.tw;
  const trunk = mk(S.w, S.h, A => {
    const by = S.h - 1;
    A.poly([[hl - 6, by], [hl + 1, by - 12], [hl + 3, by]], B[2]); A.poly([[hr + 6, by], [hr - 1, by - 12], [hr - 3, by]], B[2]); A.poly([[hl - 1, by], [hl + 3, by - 7], [hl + 5, by]], B[0]);
    if (s >= 4) { A.poly([[hl - 10, by], [hl - 1, by - 8], [hl, by]], B[2]); A.poly([[hr + 10, by], [hr + 1, by - 8], [hr, by]], B[2]); }
    for (const [x0, y0, x1, y1, t] of S.br) { A.line(x0, y0, x1, y1, B[2], t + 1); A.line(x0, y0 - 1, x1, y1 - 1, B[0], t); }
    A.r(hl, S.top, S.tw, by - S.top, B[0]); A.r(hl, S.top, 3, by - S.top, B[1]); A.r(hr - 3, S.top, 3, by - S.top, B[2]);
    for (let k = 0; k < S.tw / 3; k++) { const x = hl + 4 + ((R() * (S.tw - 7)) | 0), y0 = S.top + 3 + ((R() * (by - S.top - 18)) | 0); A.line(x, y0, x, y0 + 4 + ((R() * 6) | 0), B[2]); }
    const hx = S.cx, hy = by - 8, hw = S.tw * .28; A.e(hx, hy, hw + 1, 5.5, '#5e3519'); A.r(hx - hw - 1, hy, hw * 2 + 2, 7, '#5e3519'); A.e(hx, hy, hw, 4.5, '#7a4b2a'); A.r(hx - hw, hy, hw * 2, 6, '#7a4b2a'); A.p(hx + 2, hy + 2, s ? C.amber : '#8a7a70');
    if (S.base) { const mo = ['#5ea366', '#7cc271', '#9be37a'];
      for (let k = 0; k < 4 + S.base * 3; k++) { const left = k % 2, x = left ? hl - 2 - R() * (5 + S.base * 2) : hr + 2 + R() * (5 + S.base * 2), y = by - R() * 3; A.e(x, y, 2 + R() * 1.5, 1, mo[(R() * 2) | 0]); A.p(x, y - 1, mo[2]); }
      const fc = ['#ff8fa3', '#fff1d6', '#ffd25c', '#c2dcff']; for (let k = 0; k < S.base * 2 + 1; k++) { const x = k % 2 ? hl - 3 - R() * (4 + S.base * 2) : hr + 3 + R() * (4 + S.base * 2), y = by - 1 - R() * 2; A.p(x, y, fc[k % 4]); A.p(x, y - 1, '#5ea366'); } }
  });
  const canopy = mk(S.w, S.h, A => {
    for (const [x, y] of S.tuft || []) { A.e(x, y, 2, 1.2, P[0]); A.p(x - 1, y - 1, P[1]); }
    for (const [x, y] of S.sprout || []) { A.e(x - 1, y, 1.6, 1, P[1]); A.e(x + 1.2, y - 1, 1.6, 1, P[2]); A.p(x, y - 2, P[3]); A.p(x + 1, y - 2, P[4]); }
    for (const [x, y, rx, ry] of S.bl || []) leafBlob(A, R, x, y, rx, ry, P);
    const solid = (x, y) => x >= 0 && y >= 0 && x < S.w && y < S.h && A.g.getImageData(x, y, 1, 1).data[3] > 0;
    for (let k = 0, n = 0; n < (S.flowers || 0) && k < 400; k++) { const [bx, by2, rx, ry] = S.bl[(R() * S.bl.length) | 0], a = R() * 6.283, d = Math.sqrt(R()) * .8, x = Math.round(bx + Math.cos(a) * rx * d), y = Math.round(by2 + Math.sin(a) * ry * d);
      if (y > by2 + ry * .35 || !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) continue; n++;
      const pk = R() < .3 ? '#fff1f6' : '#ffb3c8'; A.p(x - 1, y, pk); A.p(x + 1, y, pk); A.p(x, y - 1, pk); A.p(x, y + 1, pk); A.p(x, y, '#ffe27a'); }
    for (const [x, y] of S.fruit || []) { A.p(x, y - 2, P[5]); A.e(x + .5, y + .5, 1.7, 1.7, '#ffc861'); A.p(x, y, '#fff3c4'); A.p(x + 1, y + 1, '#e8a23f'); }
    if (S.rim) for (let x = 2; x < S.w - 2; x++) { if (hash2(x, s, 77) > .12) continue; let y = 0; while (y < S.h && !solid(x, y)) y++; if (y >= S.h - 30) continue; A.p(x, y, '#ffd98a'); if (solid(x + 1, y)) A.p(x + 1, y, '#f2e3a8'); if (solid(x, y + 1)) A.p(x, y + 1, P[3]); }
  });
  // canopy bounds (for see-through) from the drawn pixels
  const d = canopy.getContext('2d').getImageData(0, 0, S.w, S.h).data; let x0 = S.w, x1 = 0, y0 = S.h, y1 = 0;
  for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) if (d[(y * S.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { s, w: S.w, h: S.h, trunk, canopy, lan: S.lan, small: S.small || [], fruit: S.fruit || [], box: { x0, x1, y0, y1 } };
}
export const lanternSpr = on => mk(9, 11, A => { A.r(4, 0, 1, 3, C.woodD); A.r(2, 3, 5, 1, C.woodD); A.r(2, 4, 5, 5, on ? '#ffcf6b' : '#5a4a52'); A.r(3, 5, 3, 3, on ? '#fff3c4' : '#6e5c66'); A.r(2, 9, 5, 1, C.woodD); });
export const lanternSmallSpr = () => mk(5, 8, A => { A.r(2, 0, 1, 2, C.woodD); A.r(1, 2, 3, 1, C.woodD); A.r(1, 3, 3, 3, '#ffcf6b'); A.p(2, 4, '#fff3c4'); A.r(1, 6, 3, 1, C.woodD); });
export function spreadSprs() {
  const mo = ['#4a8a50', '#62ad62', '#7cc271', '#9be37a'];
  SPR.tmoss = [0, 1, 2].map(v => mk(10, 6, A => { const R = rng(311 + v); for (let k = 0; k < 5 + v; k++) { const x = 1 + R() * 8, y = 2 + R() * 3; A.p(x, y, mo[(R() * 2) | 0]); A.p(x, y - 1, mo[2]); if (R() < .4) A.p(x + 1, y - 2, mo[3]); } }, null));
  SPR.tflower = {}; for (const c of ['R', 'B', 'Y', 'W']) { const F = FLOWERS[c]; SPR.tflower[c] = mk(5, 6, A => { A.p(2, 5, '#4a8a50'); A.p(2, 4, '#62ad62'); A.p(1, 2, F[2]); A.p(3, 2, F[2]); A.p(2, 1, F[2]); A.p(2, 3, F[4]); A.p(2, 2, c === 'Y' ? '#fff1b0' : '#ffe27a'); }, null); }
}

// tiles
export const FPAL = { 30: ['#c8894a', '#e0a560', '#9c6534'], 31: ['#b0473c', '#c85a4c', '#7e3028'], 32: ['#d9a868', '#ecc590', '#b08048'], 33: ['#a5482c', '#c0613a', '#7a3420'], 34: ['#b85a52', '#cf7268', '#8a3c36'], /* v122 새 바닥(그림은 dev/art/floor/30~34 — 22는 구덩이 PIT) */ 7: ['#5f9e5c', '#6fb36a', '#4a7f48'], 8: ['#6a4f7a', '#7f6191', '#55406a'], 9: ['#7c74b8', '#958ccf', '#625a9c'], 1: ['#4f8f57', '#5ea366', '#447d4c'], 2: ['#6e4a3a', '#7d5743', '#5e3d30'], 3: ['#5a4560', '#6a5272', '#4a3850'], 4: ['#3d4566', '#4a5378', '#323a58'], 5: ['#b07a4a', '#c48d5a', '#7d5233'], 6: ['#7f7a92', '#948fa6', '#5d5872'] };
export function floorTex(t, v) {
  if (t >= 17 && t <= 21) return regFloorTex(t, v);
  if (t >= 11 && t <= 16) return natFloorTex(t, v);
  const R = rng(t * 977 + v * 131 + 7), pal = FPAL[t];
  const P = (A, x, y, col) => A.p(((x % 16) + 16) % 16, ((y % 16) + 16) % 16, col);
  return mk(16, 16, A => {
    if (t === 1) { A.r(0, 0, 16, 16, '#468a4f');
      for (let k = 0; k < 26; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#3c7a46'); P(A, x + 1, y, '#3c7a46'); }
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0, c = R() < .5 ? '#58a05c' : '#62ad62'; P(A, x, y + 1, '#356c40'); P(A, x, y, c); P(A, x, y - 1, c); P(A, x + (R() < .5 ? 1 : -1), y - 2, '#7cc271'); }
      for (let k = 0; k < 5; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#8fd27a');
      if (v === 0) P(A, 4, 5, '#ffd36b'); if (v === 2) P(A, 11, 10, '#fff1d6'); return; }
    if (t === 2) { A.r(0, 0, 16, 16, '#6b4838');
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#5e3d30'); P(A, x + 1, y, '#5e3d30'); }
      for (let k = 0; k < 12; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#7a5442');
      for (let k = 0; k < 3; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#9a8478'); P(A, x + 1, y, '#857066'); P(A, x, y + 1, '#4a3127'); P(A, x + 1, y + 1, '#4a3127'); } return; }
    if (t === 3) { A.r(0, 0, 16, 16, '#544060');
      for (let k = 0; k < 22; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#4a3756'); P(A, x, y + 1, '#4a3756'); }
      for (let k = 0; k < 14; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#614c6e');
      for (let k = 0; k < 4; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#5f6f57'); P(A, x + 1, y, '#6a7d60'); }
      for (let k = 0; k < 3; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#c49ae0'); P(A, x, y + 1, '#3d2c48'); } return; }
    if (t === 4) { A.r(0, 0, 16, 16, '#3d4566');
      for (let k = 0; k < 18; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#353c5a'); P(A, x + 1, y, '#353c5a'); }
      for (let k = 0; k < 12; k++) P(A, R() * 16 | 0, R() * 16 | 0, '#4a5378');
      { let x = R() * 16 | 0, y = R() * 16 | 0; for (let k = 0; k < 6; k++) { P(A, x, y, '#2c3250'); x += R() < .5 ? 1 : 0; y += R() < .6 ? 1 : 0; } }
      if (v % 2 === 0) { const x = R() * 16 | 0, y = R() * 16 | 0; P(A, x, y, '#c9b8ff'); P(A, x + 1, y, '#8f84d0'); } return; }
    if (t === 5) { A.r(0, 0, 16, 16, '#a8743f');
      for (let y = 0; y < 16; y += 4) { A.r(0, y, 16, 1, '#c08a52'); A.r(0, y + 3, 16, 1, '#7d5233'); const j = ((y / 4 + v) % 2) ? 5 : 11; A.r(j, y, 1, 3, '#7d5233'); A.p(j - 1, y + 1, '#d8b48a');
        for (let k = 0; k < 2; k++) A.r(R() * 13 | 0, y + 1 + (R() * 2 | 0), 2 + (R() * 3 | 0), 1, '#96643a'); } return; }
    if (t === 6) { A.r(0, 0, 16, 16, '#565170');
      const jit = () => (R() * 2 | 0);
      for (const [x, y, w, h] of [[1, 1, 6 + jit(), 6], [9, 1, 6, 5 + jit()], [1, 9, 5, 6], [7, 8, 8, 7]]) { A.r(x, y, w, h, '#8a85a0'); A.r(x, y, w, 1, '#a7a2bb'); A.r(x, y, 1, h, '#9a95b0'); A.r(x, y + h - 1, w, 1, '#6c6786'); A.r(x + w - 1, y, 1, h, '#726d8c'); A.p(x + 2, y + 2, '#9994ae'); }
      return; }
    A.r(0, 0, 16, 16, pal[0]);
    if (t === 5) { for (let y = 0; y < 16; y += 4) { A.r(0, y, 16, 1, pal[1]); A.r(0, y + 3, 16, 1, pal[2]); const j = ((y / 4 + v) % 2) ? 5 : 11; A.r(j, y, 1, 3, pal[2]); } A.p(3, 1, '#c99a6a'); A.p(13, 9, '#c99a6a'); return; }
    if (t === 7) { A.r(0, 7, 16, 1, pal[2]); A.r(7, 0, 1, 16, pal[2]); A.r(0, 15, 16, 1, pal[2]); A.r(15, 0, 1, 16, pal[2]); A.r(0, 0, 7, 1, pal[1]); A.r(8, 8, 7, 1, pal[1]); A.p(3, 4, '#9be37a'); A.p(4, 3, '#9be37a'); if (v % 2) A.p(11, 11, '#ffd36b'); return; }
    if (t === 8) { for (const [x, y] of [[4, 4], [12, 4], [8, 12], [0, 12], [16, 12]]) A.e(x, y, 3.3, 3.3, pal[1]); A.p(3, 3, '#d9bfe8'); A.p(11, 3, '#d9bfe8'); A.p(7, 11, '#d9bfe8'); return; }
    if (t === 9) { A.poly([[8, 0], [16, 8], [8, 16], [0, 8]], pal[1]); A.line(0, 8, 8, 0, pal[2]); A.line(8, 0, 16, 8, pal[2]); A.line(16, 8, 8, 16, pal[2]); A.line(8, 16, 0, 8, pal[2]); A.p(8, 5, '#ffffff'); if (v % 2) A.p(3, 3, '#e3d4ff'); return; }
    if (t === 6) { A.r(0, 7, 16, 1, pal[2]); A.r(0, 15, 16, 1, pal[2]); A.r(7, 0, 1, 7, pal[2]); A.r(15, 0, 1, 7, pal[2]); A.r(3, 8, 1, 7, pal[2]); A.r(11, 8, 1, 7, pal[2]); A.r(0, 0, 7, 1, pal[1]); A.r(8, 0, 7, 1, pal[1]); A.r(0, 8, 3, 1, pal[1]); A.r(4, 8, 7, 1, pal[1]); A.r(12, 8, 4, 1, pal[1]); return; }
    for (let k = 0; k < 24; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1 + (R() * 2 | 0)]);
    for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 2 + R() * 12 | 0; A.p(x, y, pal[1]); A.p(x + 1, y, pal[1]); A.p(x, y + 1, pal[2]); }
    if (t === 1) { for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 3 + R() * 11 | 0; A.p(x, y, '#72bb72'); A.p(x + 1, y - 1, '#72bb72'); A.p(x - 1, y - 1, '#5ea366'); } if (v === 0) { A.p(5, 5, '#ffd36b'); A.p(11, 11, '#ff9ab0'); } if (v === 2) A.p(9, 4, '#fff1d6'); }
    if (t === 2) { const x = 3 + R() * 9 | 0, y = 3 + R() * 9 | 0; A.p(x, y, '#8f7a72'); A.p(x + 1, y, '#a48f86'); }
    if (t === 3) { for (let k = 0; k < 3; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#b98ad0'); }
    if (t === 4) { for (let k = 0; k < 2; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#a99cf0'); A.r(0, 0, 16, 1, '#454e72'); A.r(0, 0, 1, 16, '#454e72'); }
  }, null);
}
export const WPAL = { 16: ['#3a2e4e', '#4e4066', '#241c34'], 17: ['#3a2e4e', '#4e4066', '#241c34'], /* v129 그림자 바위·결정 광맥 */ 14: ['#c8894a', '#e0a560', '#9c6534'], 15: ['#a04a32', '#c0613a', '#7a3420'], /* v122 판자 벽·붉은 나무 벽(그림은 dev/art/wtop·wfront/14·15) */ 13: ['#4b3f78', '#5b4d8f', '#3c3263'], 9: ['#3a3340', '#4a414f', '#2a2430'], 10: ['#3a3340', '#4a414f', '#2a2430'], 11: ['#8fc4e8', '#b8e0f8', '#6a9cc8'], 12: ['#8fc4e8', '#b8e0f8', '#6a9cc8'], 1: ['#8a5a3e', '#9c6a4a', '#704630'], 2: ['#8e89a3', '#a29db6', '#6f6a86'], 3: ['#4b3f78', '#5b4d8f', '#3c3263'], 4: ['#8a5a3e', '#9c6a4a', '#704630'], 5: ['#8e89a3', '#a29db6', '#6f6a86'], 6: ['#a06a3c', '#b97e4a', '#7d4d2a'], 7: ['#a59fb8', '#bab5cb', '#6f6a86'], 8: ['#2b2238', '#352a45', '#221b2d'] };
export const WFRONT_COL = { 16: '#1e1830', 17: '#1e1830', 14: '#8a5a30', 15: '#6e2e1e', 13: '#33295a', 9: '#221c28', 10: '#221c28', 11: '#5a88b0', 12: '#5a88b0', 1: '#5e3b29', 2: '#5e5a74', 3: '#33295a', 4: '#5e3b29', 5: '#5e5a74', 6: '#6e4426', 7: '#77718c', 8: '#1a1424' };
export function wallTop(t, v) {
  const R = rng(t * 733 + v * 97 + 3), pal = WPAL[t];
  return mk(16, 16, A => {
    A.r(0, 0, 16, 16, pal[0]);
    if (t === 6) { for (const x of [0, 5, 10, 15]) { A.r(x, 0, 1, 16, pal[2]); if (x < 15) A.r(x + 1, 0, 1, 16, pal[1]); } A.p(3, 3, pal[2]); A.p(8, 12, pal[2]); A.p(13, 6, pal[2]); return; }
    if (t === 7) { for (let y = 0; y < 16; y += 4) { A.r(0, y + 3, 16, 1, pal[2]); A.r(0, y, 16, 1, pal[1]); const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) A.r(x, y, 1, 3, pal[2]); } return; }
    for (let k = 0; k < 5; k++) A.e(R() * 16, R() * 16, 1 + R() * 2, 1 + R() * 1.4, pal[2]);
    for (let k = 0; k < 4; k++) A.e(R() * 16, R() * 16, 0.8 + R() * 1.5, 0.7 + R(), pal[1]);
    for (let k = 0; k < 10; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1 + (R() * 2 | 0)]);
    if (t === 3) for (let k = 0; k < 9; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, k % 3 ? '#8a7ab0' : '#c9a8c0'); if (k % 4 === 0) A.p(x + 1, y, '#2c2450'); }
    if (t === 13) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 4 + R() * 9; A.poly([[x, y - 3], [x + 2, y], [x, y + 2], [x - 2, y]], '#e8e0ff'); A.p(x | 0, (y - 1) | 0, '#ffffff'); A.p((x + 1) | 0, y | 0, C.cryL); }
    if (t === 4) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.7, 1.4, C.copper); A.p(x - 1, y - 1, C.copperL); A.p(x + 1, y, C.copperD); }
    if (t === 5) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.6, 1.3, C.iron); A.p(x - 1, y - 1, '#ffffff'); A.p(x + 1, y, C.ironD); }
    if (t === 9 || t === 10) { let x = R() * 16 | 0, y = R() * 16 | 0; for (let k = 0; k < 7; k++) { A.p(x, y, k % 3 ? '#c4441a' : '#ff8a3d'); x = (x + (R() < .5 ? 1 : 0)) % 16; y = (y + (R() < .7 ? 1 : 0)) % 16; } }
    if (t === 10) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.e(x, y, 1.6, 1.3, '#ffd25c'); A.p(x - 1, y - 1, '#fff1b0'); A.p(x + 1, y, '#c9902a'); }
    if (t === 11 || t === 12) { for (let k = 0; k < 3; k++) { const x = R() * 14 | 0, y = R() * 14 | 0; A.p(x, y, '#ffffff'); A.p(x + 1, y + 1, '#e8f8ff'); } }
    if (t === 17) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.poly([[x, y - 2.5], [x + 1.6, y], [x, y + 2], [x - 1.6, y]], '#8a6ad0'); A.p(x | 0, (y - 1) | 0, '#e8dcff'); } // v129
    if (t === 12) for (let k = 0; k < 3; k++) { const x = 3 + R() * 10, y = 3 + R() * 10; A.poly([[x, y - 2.5], [x + 1.6, y], [x, y + 2], [x - 1.6, y]], '#5ad8f0'); A.p(x | 0, (y - 1) | 0, '#ffffff'); }
  }, null);
}
export function wallFront(t) {
  return mk(16, 5, A => { const c = WFRONT_COL[t]; A.r(0, 0, 16, 5, c); for (let x = 1; x < 16; x += 3) A.r(x, 1, 1, 3, 'rgba(255,255,255,0.07)'); A.r(0, 4, 16, 1, '#1d1424'); A.r(0, 0, 16, 1, 'rgba(255,255,255,0.06)');
    if (t === 4) A.p(6, 2, C.copper); if (t === 5) A.p(9, 2, C.iron); if (t === 10) A.p(7, 2, '#ffd25c'); if (t === 12) A.p(10, 2, '#7ff0ff'); if (t === 9) A.p(4, 3, '#c4441a'); if (t === 3) { A.p(4, 2, '#8a7ab0'); A.p(11, 1, '#8a7ab0'); } if (t === 13) { A.p(4, 2, '#e8e0ff'); A.p(11, 1, '#e8e0ff'); } if (t === 7) { A.r(0, 2, 16, 1, '#5e5a74'); A.r(7, 0, 1, 2, '#5e5a74'); } }, null);
}
export function crackSpr(n) { return mk(16, 16, A => { const c = 'rgba(30,18,34,0.75)'; A.line(8, 8, 4, 4, c); A.line(8, 8, 12, 6, c); if (n > 0) { A.line(8, 8, 6, 13, c); A.line(4, 4, 2, 6, c); } if (n > 1) { A.line(8, 8, 13, 12, c); A.line(12, 6, 14, 2, c); A.line(6, 13, 3, 14, c); } }, null); }

export const PRI = { 1: 4, 3: 3, 4: 2, 2: 1, 18: .5, 19: .6, 35: 5 }; // v132 눈 무더기는 얼음 바닥 위에 (경계의 어두운 선이 얼음 쪽에)
export function rotCanvas(c, q) { if (!q) return c; const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const g = k.getContext('2d'); g.translate(8, 8); g.rotate(q * Math.PI / 2); g.drawImage(c, -8, -8); return k; }
export function makeFringe(t, mode, part = 'all') {
  // mode: 'edge' (land over land), 'water' (land over water with foam)
  const src = SPR.floor[t][1].getContext('2d').getImageData(0, 0, 16, 16).data, R = rng(t * 53 + (mode === 'water' ? 7 : 1));
  const depth = []; let d = 2.5; for (let i = 0; i < 16; i++) { d += (R() - .5) * 1.5; d = clamp(d, 1.2, 4.2); depth.push(Math.round(d)); }
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), im = g.createImageData(16, 16), D = im.data;
  const set = (x, y, r, gg, b, a) => { if (y < 0 || y > 15) return; const k = (y * 16 + x) * 4; D[k] = r; D[k + 1] = gg; D[k + 2] = b; D[k + 3] = a; };
  for (let x = 0; x < 16; x++) { const dp = depth[x];
    if (part !== 'fx') for (let y = 0; y < dp; y++) { const k = (y * 16 + x) * 4; set(x, y, src[k], src[k + 1], src[k + 2], 255); }
    if (part !== 'land') { if (mode === 'water') { set(x, dp, 225, 244, 255, 210); set(x, dp + 1, 200, 232, 255, 90); } else set(x, dp, 20, 12, 30, 70); }
    if (dp > 1 && part !== 'fx') { const k = ((dp - 1) * 16 + x) * 4; set(x, dp - 1, Math.min(255, src[k] * 1.12), Math.min(255, src[k + 1] * 1.12), Math.min(255, src[k + 2] * 1.12), 255); }
  }
  g.putImageData(im, 0, 0); return [0, 1, 2, 3].map(q => rotCanvas(c, q));
}
export function makeCorner(t, mode) {
  const src = SPR.floor[t][2].getContext('2d').getImageData(0, 0, 16, 16).data;
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'), im = g.createImageData(16, 16), D = im.data;
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) { const r = Math.hypot(x + .5, y + .5), k = (y * 16 + x) * 4;
    if (r < 3.2) { D[k] = src[k]; D[k + 1] = src[k + 1]; D[k + 2] = src[k + 2]; D[k + 3] = 255; }
    else if (r < 4.3) { if (mode === 'water') { D[k] = 225; D[k + 1] = 244; D[k + 2] = 255; D[k + 3] = 170; } else { D[k] = 20; D[k + 1] = 12; D[k + 2] = 30; D[k + 3] = 60; } } }
  g.putImageData(im, 0, 0); return [0, 1, 2, 3].map(q => rotCanvas(c, q));
}
export const DECO_DEF = {
  1: [A => { A.p(2, 1, C.rose); A.p(1, 2, C.rose); A.p(3, 2, C.rose); A.p(2, 3, C.rose); A.p(2, 2, C.amber); A.p(2, 4, C.leafD); },
      A => { A.p(2, 1, '#ffffff'); A.p(1, 2, '#ffffff'); A.p(3, 2, '#ffffff'); A.p(2, 3, '#ffffff'); A.p(2, 2, '#ffd36b'); A.p(2, 4, C.leafD); },
      A => { A.p(2, 1, '#ffd36b'); A.p(1, 2, '#ffd36b'); A.p(3, 2, '#ffd36b'); A.p(2, 2, '#fff1b0'); A.p(2, 3, C.leafD); },
      A => { A.p(2, 3, '#5fae5c'); A.p(2, 4, '#4f9a50'); A.p(3, 2, '#7cc46e'); A.p(3, 3, '#5fae5c'); A.p(3, 4, '#4f9a50'); A.p(4, 3, '#5fae5c'); A.p(4, 4, '#4f9a50'); },
      A => { A.p(1, 4, C.leafD); A.p(1, 3, C.leaf); A.p(2, 2, C.leafL); A.p(3, 3, C.leaf); A.p(3, 4, C.leafD); A.p(4, 2, C.leafL); A.p(5, 3, C.leaf); A.p(5, 4, C.leafD); },
      A => { A.r(2, 3, 2, 1, '#7f8a6a'); A.p(2, 2, '#9aa684'); A.p(5, 4, '#7f8a6a'); }],
  2: [A => { A.r(2, 3, 2, 1, '#8a7466'); A.p(2, 2, '#a68d7e'); A.p(5, 4, '#7a6458'); },
      A => { A.line(1, 4, 5, 2, '#5a3929'); A.p(3, 2, '#7a5442'); },
      A => { A.p(1, 4, C.leafD); A.p(2, 3, C.leaf); A.p(3, 4, C.leafD); A.p(3, 2, C.leafL); }],
  3: [A => { A.r(2, 3, 1, 2, C.cream); A.e(2.5, 2.4, 2, 1.3, '#b673de'); A.p(2, 2, '#fbe7ff'); },
      A => { A.r(2, 3, 1, 2, C.cream); A.e(2.5, 2.4, 2, 1.3, '#e36b6b'); A.p(3, 2, C.cream); },
      A => { A.p(1, 3, '#c49ae0'); A.p(3, 2, '#d8b6ee'); A.p(4, 4, '#c49ae0'); A.p(2, 5, '#a77bc4'); },
      A => { A.e(3, 3.5, 2.4, 1.4, '#5f6f57'); A.p(2, 3, '#7a8c6e'); }],
  4: [A => { A.poly([[2, 0.5], [3.6, 4], [2, 5.5], [0.6, 4]], C.cry); A.p(2, 2, C.cryL); },
      A => { A.poly([[2, 1], [3.4, 4], [2, 5], [.8, 4]], '#8fb8f0'); A.poly([[4.5, 2.5], [5.6, 4.5], [4.5, 5.5], [3.6, 4.5]], C.cry); A.p(2, 2, '#e6f2ff'); },
      A => { A.r(2, 3, 2, 1, '#6c74a0'); A.p(2, 2, '#9aa2cc'); }],
};
export const SPR = {};
export function buildTerrain() {
  SPR.fringe = {}; SPR.fringeW = {}; SPR.corner = {}; SPR.cornerW = {}; SPR.fringeL = {}; SPR.fringeX = {}; SPR.fringeWL = {}; SPR.fringeWX = {};
  for (const t of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 30, 31, 32, 33, 34, 35]) { SPR.fringeW[t] = makeFringe(t, 'water'); SPR.fringeWL[t] = makeFringe(t, 'water', 'land'); SPR.fringeWX[t] = makeFringe(t, 'water', 'fx'); SPR.cornerW[t] = makeCorner(t, 'water'); if (PRI[t]) { SPR.fringe[t] = makeFringe(t, 'edge'); SPR.fringeL[t] = makeFringe(t, 'edge', 'land'); SPR.fringeX[t] = makeFringe(t, 'edge', 'fx'); SPR.corner[t] = makeCorner(t, 'edge'); } }
  SPR.deco = {}; for (const t in DECO_DEF) SPR.deco[t] = DECO_DEF[t].map(f => mk(7, 7, f, 'soft'));
  SPR.lily = ARTC['lily/0'] ? [artPaint('lily/0', 'sel'), artPaint(ARTC['lily/1'] ? 'lily/1' : 'lily/0', 'sel')] : [mk(9, 7, /* v122 손그림 연잎(16px)이 있으면 그것 */ A => { A.e(4.5, 3.5, 3.6, 2.6, '#4f9a5e'); A.e(3.6, 2.8, 1.6, 1, '#6cbb76'); A.poly([[4.5, 3.5], [8.5, 1.8], [8.5, 3.4]], '#00000000'); A.g.globalCompositeOperation = 'destination-out'; A.poly([[4.5, 3.5], [8.6, 1.6], [8.6, 3.6]], '#000'); A.g.globalCompositeOperation = 'source-over'; }, 'sel'),
    mk(9, 8, A => { A.e(4.5, 4.5, 3.6, 2.6, '#4f9a5e'); A.e(3.6, 3.8, 1.6, 1, '#6cbb76'); A.e(5, 2.6, 1.5, 1.3, '#ffb3c6'); A.p(5, 2, '#ffe0ea'); A.p(5, 3, C.amber); }, 'sel')];
}
export function buildSprites() {
  buildPlayer(0);
  SPR.slimeG = slimeSpr('#86d96b', '#d2f7b8', '#4f9e45'); SPR.slimeO = slimeSpr('#f2a65a', '#ffe0b8', '#c06e2c'); SPR.slimeP = slimeSpr('#b58cf0', '#ecdfff', '#7a55c4');
  for (const c in FLOWERS) { const F = FLOWERS[c]; SPR['bloom' + c] = bloomSpr(F[2], F[3], F[4]); }
  SPR.wild = {}; for (const c in FLOWERS) SPR.wild[c] = wildSpr(FLOWERS[c][2], FLOWERS[c][3]);
  SPR.shroomy = shroomySpr(); SPR.boss = bossSpr(); SPR.queen = queenSpr(); SPR.golem = golemSpr();
  SPR.shot = { spore: shotSpr('#d59bff', '#f6e6ff'), shard: shotSpr(C.cry, '#ffffff', true), fire: shotSpr('#ff8a3d', '#ffe0a0'), ice: shotSpr('#9fd8f0', '#ffffff', true) };
  SPR.magmaSlime = slimeSpr('#ff7a3d', '#ffd0a0', '#c04a1a'); SPR.frostSlime = slimeSpr('#9fd8f0', '#ffffff', '#5a9ac8'); SPR.cinder = emberSpr(); SPR.snowling = snowSpr(); SPR.turtle = turtleSpr(false); SPR.turtleS = turtleSpr(true); SPR.spirit = spiritSpr(); SPR.water = [waterTex(0), waterTex(1)];
  setMkDef('sel');
  SPR.item = {}; for (const k in ICON) SPR.item[k] = mk(16, 16, ICON[k]);
  SPR.ui = {}; for (const k in UICON) SPR.ui[k] = mk(16, 16, UICON[k]);
  SPR.obj = {}; for (const k in OSPR) { const [w, h, f, o] = OSPR[k]; SPR.obj[k] = mk(w, h, f, o); }
  for (const k in OBJ) if (OBJ[k].tw) { SPR.obj[k] = twSprite(k, OBJ[k].tw.type === 'pillar' ? 0 : 10, false); SPR.item[k] = twIcon(k); }
  SPR.bush = [bushSpr(false), bushSpr(true)];
  // v50 placeholders until drawn art arrives: grown stations are the old picture at 2×, benches twice as wide, beds longer;
  // trees are drawn bigger (they still only block their trunk tile). The picture is scaled before its outline is added.
  for (const k in GROW_SPR) if (OSPR[k]) { const [w, h, f, o] = OSPR[k], [sx, sy, bed] = GROW_SPR[k], raw = mk(w, h, f, null), W2 = Math.round(w * sx), H2 = Math.round(h * sy);
    SPR.obj[k] = mk(W2, H2, A => { A.g.imageSmoothingEnabled = false; if (bed) { const top = Math.round(h * .42), bot = 4, mid = h - top - bot, mid2 = H2 - top - bot; A.g.drawImage(raw, 0, 0, w, top, 0, 0, w, top); A.g.drawImage(raw, 0, top, w, mid, 0, top, w, mid2); A.g.drawImage(raw, 0, h - bot, w, bot, 0, H2 - bot, w, bot); } else A.g.drawImage(raw, 0, 0, W2, H2); }, o); }
  SPR.crop = {}; for (const k of ['berry', 'shroom', 'moss', 'glow', 'bean', 'fire', 'radish']) SPR.crop[k] = [0, 1, 2, 3].map(s => [0, 1, 2, 3].map(v => cropSpr(k, s, v)));
  SPR.treeSt = [0, 1, 2, 3, 4, 5].map(treeSprs); SPR.lantern = [lanternSpr(false), lanternSpr(true)]; SPR.lanternS = lanternSmallSpr(); spreadSprs();
  SPR.floor = {}; for (const t in FPAL) SPR.floor[t] = [0, 1, 2, 3].map(v => floorTex(+t, v));
  SPR.wtop = {}; SPR.wfront = {}; for (const t in WPAL) { SPR.wtop[t] = [0, 1, 2, 3].map(v => wallTop(+t, v)); SPR.wfront[t] = wallFront(+t); }
  SPR.crack = [0, 1, 2].map(crackSpr);
  // hand-drawn art replaces the base sprites, then everything made from them is rebuilt; a second pass lets art replace those too
  applyArt();
  for (const c in FLOWERS) SPR['bloom' + c + 'W'] = whiten(SPR['bloom' + c]);
  for (const k of ['slimeG', 'slimeO', 'slimeP', 'shroomy', 'boss', 'queen', 'golem', 'magmaSlime', 'frostSlime', 'cinder', 'snowling', 'turtle', 'turtleS', 'spirit']) SPR[k + 'W'] = whiten(SPR[k]);
  for (const k in MON_SPR_DEF) { SPR[k] = MON_SPR_DEF[k](); SPR[k + 'W'] = whiten(SPR[k]); } npcSprites(); /* v104 */ SPR.shadowBit = shadowBitSpr(); SPR.shadowBitW = whiten(SPR.shadowBit); SPR.dark = darkSpr(); SPR.darkW = whiten(SPR.dark); /* v108 */ SPR.shot.web = shotSpr('#e8e4f8', '#ffffff'); SPR.shot.shade = shotSpr('#5a3a8a', '#e8dcff'); /* v129 길 잃은 등불지기 */ SPR.shot.snow = shotSpr('#ffffff', '#d4f6ff'); // v101 새 몬스터·탄
  for (const k in ABOSS_SPR) { SPR[k] = ABOSS_SPR[k](); SPR[k + 'W'] = whiten(SPR[k]); } SPR.shot.book = shotSpr('#c9a26b', '#fff1d6'); // v131 기록관 보스 · 책 탄
  for (const k in OBJ) if (OBJ[k].sz && OBJ[k].rotV && !SPR.obj[k + 'V'] && SPR.obj[k]) SPR.obj[k + 'V'] = rot90(SPR.obj[k]);
  for (const k in OBJ) if (OBJ[k].dir4 && SPR.obj[k + 'U']) { const src = SPR.obj[k + 'U'], s = src.hd ? HD : 1, c2 = document.createElement('canvas'); c2.width = src.width; c2.height = src.height; c2.hd = src.hd; c2.getContext('2d').drawImage(src, 0, 0, src.width, 11 * s, 0, 0, src.width, 11 * s); SPR.obj[k + 'Ub'] = c2; }
  SPR.obj.bush = SPR.bush[1];
  // v80: a turned-off torch has no flame (the dimmed flame looked like a broken one): flame pixels go, the base keeps a dark ember, a faint wisp of smoke
  const snuffed = c => { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.hd = c.hd; const g = k.getContext('2d'); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, k.width, k.height), a = d.data, w = k.width, h = k.height;
    let cx = 0, n = 0; for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const r = a[i], gg = a[i + 1], b = a[i + 2], fl = (r > 150 && r - b > 100) || (r * .3 + gg * .59 + b * .11) > 215; if (!fl) continue;
      const y = (i / 4 / w) | 0; if (y >= h - 3) { a[i] = 74; a[i + 1] = 44; a[i + 2] = 40; } else { a[i + 3] = 0; cx += (i / 4) % w; n++; } }
    const sx = n ? Math.round(cx / n) : w >> 1; for (const [dx, dy, al] of [[0, 5, 150], [1, 7, 120], [0, 9, 90], [-1, 11, 60]]) { const x = sx + dx, y = h - 3 - dy; if (x < 0 || y < 0 || x >= w) continue; const i = (y * w + x) * 4; a[i] = 150; a[i + 1] = 144; a[i + 2] = 160; a[i + 3] = al; }
    g.putImageData(d, 0, 0); return k; };
  SPR.objOff = {}; for (const k of ['torch', 'lampShroom', 'lampCrystal', 'sproutLamp', 'sporeLamp', ...Object.keys(DECOR).filter(k => DECOR[k].use === 'lamp'), ...Object.keys(OBJ).filter(k => OBJ[k].offDim && SPR.obj[k])]) SPR.objOff[k] = k === 'torch' ? snuffed(SPR.obj[k]) : dimmed(SPR.obj[k]);
  SPR.giant = {}; for (const k in SPR.crop) SPR.giant[k] = giantSpr(k);
  SPR.young = {}; for (const k of YOUNG_TREES) if (OSPR[k]) SPR.young[k] = ARTC['obj/' + k] || GROW_SPR[k] ? youngOf(SPR.obj[k]) : youngSpr(OSPR[k]);
  SPR.glow = {}; bossExtraSprites();
  applyArt();
  for (const k in MON_SPR_DEF) if (ARTC['mon/' + k]) SPR[k + 'W'] = whiten(SPR[k]); // v133 받은 그림으로 바꾼 몬스터(폭탄 슬라임·버섯·나무 정령)는 맞을 때 하얀 그림도 새 그림으로
  // v123: 자연물 그림(dev/art/obj)이 없을 때(그림 없이 묶은 판)는 비슷한 원래 그림으로 — 세계에 저절로 나기 때문에 빈 그림이면 멈춰요
  { const FB = { tree: 'roundTree', bush: 'bush', stump: 'root', cactus: 'grass', log: 'bigRock' }; for (const id in NAT123) if (!SPR.obj[id]) SPR.obj[id] = SPR.obj[FB[NAT123[id][2]]] || SPR.obj.root; }
  // v122: 뿌리기둥 크기 여러 가지 — 같은 나무가 자라는 단계 그림 4장(etc/rootS, Plants.png 31~34번, 그림자 지움)
  if (SPR.rootS && !Array.isArray(SPR.rootS)) SPR.rootS = Object.keys(SPR.rootS).sort((p, q) => p - q).map(k => SPR.rootS[k]);
  SPR.rootSY = (SPR.rootS || []).map(youngOf);
  warpSprites(); // v89
  SPR.fp = {}; for (const id in GREW) if (SPR.obj[id] && OSPR[id]) { const [w, h, f, o] = OSPR[id]; SPR.fp[id] = { big: SPR.obj[id], bigV: SPR.obj[id + 'V'] || (GREW[id][2] ? rot90(SPR.obj[id]) : null), small: ARTC['obj/' + id] ? SPR.obj[id] : mk(w, h, f, o) }; }
  setFootprints(FPV);
  buildTerrain();
  buildTilemap(); // v71: drawn floor tilesets, tall walls, water per region
  setMkDef(null);
  SPR.obj.refundBox = SPR.obj.chest; // v69: the refund box looks like a chest (hand-drawn chest art included)
}
// sprites that can't take hand-drawn art yet (floors/walls come with the 32px floor template; characters are built from parts)
// v54: floors and walls take drawn art too (floor/<type>/<n>, any number of variants; wtop/<type>/0-3; wfront/<type>)
export const ART_SKIP = new Set(['tiles', 'terrain', 'crack', 'deco', 'water', 'fringe', 'fringeL', 'fringeX', 'fringeW', 'fringeWL', 'fringeWX', 'corner', 'cornerW', 'player', 'playerW', 'playerSit', 'sleepHead', 'treeSt', 'glow', 'animal']);
export const ART_SEL = new Set(['item', 'ui', 'obj', 'objOff', 'crop', 'giant', 'young', 'bush', 'wild', 'lantern', 'lanternS', 'lily', 'tmoss', 'tflower']);
export const artSeg = path => { const s = path.split('/'); if (s[0] === 'mon' || s[0] === 'etc') s.shift(); return s; }; // mon/slimeG → SPR.slimeG
export function artPaint(path, ol) { // the drawn picture plus the outline the old sprite had (ol), unless it was packed as .raw
  const key = path + '|' + ol; if (ARTP[key]) return ARTP[key]; const src = ARTC[path], c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.hd = true;
  if (!ART[path][1]) ol = null; if (ol === 'soft') softShadow(c); else if (ol) { if (HD > 1) outlineHD(c); else if (ol === 'sel') outlineSel(c); else outline(c, ol); } // 16px art gets the old sprite's own outline; 32px art the soft one
  c.ol = ol; return ARTP[key] = c; }
export const olOf = v => { if (v instanceof HTMLCanvasElement) return v.ol; if (v && typeof v === 'object') for (const k in v) { const o = olOf(v[k]); if (o !== undefined) return o; } return undefined; };
export function setArt(o, key, c) { const v = o[key]; if (v == null || v instanceof HTMLCanvasElement) o[key] = c; else if (typeof v === 'object') for (const k in v) setArt(v, k, c); }
export function cropArt(path, ol) { // a drawn crop is only the plant: the game puts the right soil (dry · watered · fertilized) under it
  const art = artPaint(path, ol); return [0, 1, 2, 3].map(v => { const soil = mk(16, 16, A => cropSoil(A, v), ol === undefined ? 'sel' : ol), S = 16 * HD, w = Math.max(S, art.width), h = Math.max(S, art.height), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(soil, (w - S) >> 1, h - S, S, S); g.drawImage(art, (w - art.width) >> 1, h - art.height); c.hd = true; c.ol = art.ol; return c; }); }
export function applyArt() { // shallow paths first so crop/berry/3 wins over crop/berry
  for (const path of Object.keys(ARTC).sort((a, b) => a.split('/').length - b.split('/').length)) { const seg = artSeg(path); if (!seg.length || ART_SKIP.has(seg[0])) continue;
    if (seg[0] === 'crop' && (seg.length === 2 || seg.length === 3) && SPR.crop[seg[1]]) { const C0 = SPR.crop[seg[1]]; for (const st of seg.length === 3 ? [+seg[2]] : [0, 1, 2, 3]) if (C0[st]) C0[st] = cropArt(path, olOf(C0[st])); continue; }
    let o = SPR; for (let i = 0; i < seg.length - 1; i++) { if (o[seg[i]] == null || o[seg[i]] instanceof HTMLCanvasElement) o[seg[i]] = {}; o = o[seg[i]]; }
    const last = seg[seg.length - 1]; let ol = olOf(o[last]); if (ol === undefined) ol = ART_SEL.has(seg[0]) ? 'sel' : INK; setArt(o, last, artPaint(path, ol)); } }
export const ROOT_PICK = [0, 1, 1, 2, 2, 3]; // 뿌리기둥 크기 고르기: 가장 작은 것·가장 큰 것은 덜 나와요
export function youngOf(src) { const w2 = Math.max(1, Math.round(src.width * .78)), h2 = Math.max(1, Math.round(src.height * .78)), c = document.createElement('canvas'); c.width = w2; c.height = h2; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, w2, h2); c.hd = src.hd; return c; }
export function glowSprite(col) {
  if (SPR.glow[col]) return SPR.glow[col];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const [r, gg, b] = hexRgb(col).map(v => Math.round(v * 255));
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${r},${gg},${b},0.55)`); gr.addColorStop(0.4, `rgba(${r},${gg},${b},0.16)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return SPR.glow[col] = c;
}

// v89 워프포인트·포탈: 사용자가 준 그림 띠(dev/art/etc/warpStrip·warpGlow·portalStrip·portalGlow, 16×16 칸이 가로로 6장·24장)를 한 장씩 잘라요.
// SPR.warpF.pt / .portal = { base: [평소 그림…], glow: [빛나는 부분…], off: 안 켜진 워프포인트(첫 장을 어둡게) }. 그림이 없으면 content.js의 임시 모양 한 장.
export function warpSprites() { SPR.warpF = {};
  const cut = S => { if (!(S instanceof HTMLCanvasElement) || !S.height) return []; const n = Math.max(1, Math.round(S.width / S.height)), w = S.width / n, out = [];
    for (let k = 0; k < n; k++) { const c = document.createElement('canvas'); c.width = w; c.height = S.height; c.getContext('2d').drawImage(S, k * w, 0, w, S.height, 0, 0, w, S.height); c.hd = S.hd; c.ol = S.ol; out.push(c); } return out; };
  for (const [k, o, b, g] of [['pt', 'warpPt', 'warpStrip', 'warpGlow'], ['portal', 'portal', 'portalStrip', 'portalGlow']]) {
    const base = cut(SPR[b]); if (!base.length) { SPR.warpF[k] = { base: [SPR.obj[o]], glow: [], off: dimmed(SPR.obj[o]) }; continue; }
    const glow = cut(SPR[g]).map(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i]) return c; return null; }); // 빈 장은 null
    SPR.obj[o] = base[0]; SPR.warpF[k] = { base, glow, off: dimmed(base[0]) }; }
  SPR.objOff.warpPt = SPR.warpF.pt.off; SPR.objOff.brazier = SPR.obj.brazierOff; /* v108 꺼진 횃대 */ }
