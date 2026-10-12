// ================= 기능별 아이콘(ICON)·물체 그림(OSPR)·몬스터 그림 (구조 변경 3단계: 규칙 파일들에서 그림만 모음) =================
// 위에서부터 예전 파일 순서대로예요. 그림은 게임을 시작할 때(buildSprites) 한꺼번에 만들어져서, 이 파일이 규칙 파일들 뒤에 와도 괜찮아요.
// 새 아이템의 아이콘·새 물체의 그림은 여기에 (밸런스 데이터는 js/data/, 동작은 규칙 파일).
import { ARROWS } from '../data/circuits-regions.js';
import { BAG_UPS, ITEMS, RECIPES } from '../data/items.js';
import { C, HD, INK, mk, whiten } from '../engine/canvas.js';
import { DEEP_DISHES } from '../data/deep-survival.js';
import { DISHES, STAR_OF } from '../data/farming-cooking.js';
import { FLOWERS } from '../data/rpg-nature.js';
import { FPAL, OSPR, SPR } from './world.js';
import { ICON, UICON, bowIcon, packet, pickIcon, sickleIcon, swordIcon, axeIcon, daggerIcon, hammerIcon, spearIcon, staffIcon } from './characters.js';
import { RINGS } from '../data/gear-animals.js';
import { SUMMON } from '../data/quests.js';
import { rng } from '../engine/random.js';

// ---- 기본 아이템 (content/items.js) ----
// 장식 가구 그림 [가로, 세로, 그리기] (구조 변경 3단계: data/items.js의 DECOR 표에서 떼어 냄)
export const DECOR_SPR = {
  woodCrate: [16, 16, A => { A.r(2, 4, 12, 11, C.wood); A.r(2, 4, 12, 1, C.woodL); A.r(2, 14, 12, 1, C.woodD); A.r(2, 4, 1, 11, C.woodD); A.r(13, 4, 1, 11, C.woodD); A.r(3, 9, 10, 1, C.woodD); A.line(3, 5, 12, 13, C.woodD); A.p(4, 6, '#ffd1a0'); }],
  logBench: [16, 16, A => { A.r(3, 11, 2, 3, C.woodD); A.r(11, 11, 2, 3, C.woodD); A.r(1, 8, 14, 4, C.wood); A.r(1, 8, 14, 1, C.woodL); A.r(1, 11, 14, 1, C.woodD); A.e(1.6, 9.8, 1.2, 1.8, '#e8b97a'); A.e(14.4, 9.8, 1.2, 1.8, '#e8b97a'); A.p(6, 9, C.woodD); A.p(10, 10, C.woodD); A.e(11, 7.6, 1.6, .8, C.leaf); }],
  stoneBench: [16, 16, A => { A.r(2, 11, 3, 3, C.stoneD); A.r(11, 11, 3, 3, C.stoneD); A.r(1, 8, 14, 3, C.stone); A.r(1, 8, 14, 1, C.stoneL); A.r(1, 10, 14, 1, C.stoneD); A.p(4, 9, C.stoneL); A.p(12, 9, C.stoneD); }],
  stoneLantern: [16, 24, A => { A.r(5, 20, 6, 2, C.stoneD); A.r(7, 13, 2, 7, C.stone); A.r(7, 13, 1, 7, C.stoneL); A.r(4, 8, 8, 5, C.stone); A.r(6, 9, 4, 3, '#ffd27a'); A.p(7, 10, '#fff1c0'); A.poly([[2, 8.5], [8, 3.5], [14, 8.5]], C.stoneD); A.r(3, 8, 10, 1, C.stoneL); A.p(8, 3, C.stone); }],
  flowerBox: [16, 16, A => { A.r(1, 9, 14, 5, C.wood); A.r(1, 9, 14, 1, C.woodL); A.r(1, 13, 14, 1, C.woodD); A.r(2, 9, 12, 1, C.dirt); [[3, 6, C.rose], [6, 5, '#fff1d6'], [9, 6, '#ffd25c'], [12, 5, C.cry]].forEach(([x, y, c]) => { A.line(x, y + 1, x, 9, C.leafD); A.p(x, y, c); A.p(x - 1, y, c); A.p(x + 1, y, c); A.p(x, y - 1, c); A.p(x, y + 1, c); A.p(x, y, '#ffc861'); }); A.p(4, 8, C.leaf); A.p(10, 8, C.leaf); }],
  strawBasket: [16, 16, A => { A.line(4, 8, 6, 3, C.leafD); A.line(10, 8, 11, 4, C.leaf); A.p(6, 3, C.leafL); A.e(8, 11, 6, 3.6, '#d9b26a'); for (let x = 3; x < 14; x += 2) A.line(x, 9, x + 1, 14, '#b08a45'); A.e(8, 8.6, 6, 1.4, '#e8c98a'); A.e(8, 8.6, 4.6, .8, '#9a7438'); }],
  pictureFrame: [16, 16, A => { A.line(5, 11, 3, 15, C.woodD); A.line(11, 11, 13, 15, C.woodD); A.line(8, 10, 8, 15, C.woodD); A.r(3, 1, 10, 10, C.woodD); A.r(4, 2, 8, 8, '#a8dcf5'); A.e(6, 9, 3, 2, C.leaf); A.e(10.5, 9.5, 3, 2.2, C.leafD); A.e(10, 4, 1.3, 1.3, C.amber); A.p(5, 4, '#ffffff'); A.p(6, 4, '#ffffff'); }],
  copperLamp: [16, 24, A => { A.e(8, 21.5, 3.4, 1.4, C.copperD); A.r(7, 9, 2, 12, C.copper); A.r(7, 9, 1, 12, C.copperL); A.poly([[3, 10], [5, 3.5], [11, 3.5], [13, 10]], C.copper); A.line(5, 4, 4, 9, C.copperL); A.r(4, 10, 8, 1, C.copperD); A.r(6, 11, 4, 1, '#fff1c0'); }],
  copperKettle: [16, 16, A => { A.line(12, 10, 15, 6, C.copperD, 2); A.line(4, 7, 2, 9, C.copperD); A.line(2, 9, 4, 12, C.copperD); A.e(8, 10.5, 5, 4, C.copper); A.e(6.5, 9, 1.6, 1.4, C.copperL); A.r(4, 14, 8, 1, C.copperD); A.e(8, 6.6, 2.6, 1, C.copperD); A.p(8, 5, C.copperL); }],
  grandClock: [16, 24, A => { A.r(4, 3, 8, 19, C.woodD); A.r(3, 2, 10, 2, C.woodL); A.r(3, 21, 10, 2, C.wood); A.e(8, 7.5, 3, 3, C.cream); A.e(8, 7.5, 3, 3, C.cream); A.p(8, 6, INK); A.p(8, 7, INK); A.p(9, 7, INK); A.r(6, 12, 4, 7, '#5a3a24'); A.line(8, 12, 8, 16, C.copper); A.e(8, 17, 1.2, 1.2, C.copperL); A.p(5, 4, C.copper); A.p(10, 4, C.copper); }],
  ironStove: [16, 24, A => { A.r(9, 1, 3, 8, '#4a4558'); A.r(9, 1, 3, 1, C.iron); A.r(3, 8, 10, 12, '#5a5468'); A.r(2, 8, 12, 2, C.iron); A.r(5, 12, 6, 5, '#2e2b3a'); A.r(6, 14, 4, 3, C.fire); A.r(7, 15, 2, 2, C.amber); A.r(4, 20, 2, 2, '#3d3a4a'); A.r(10, 20, 2, 2, '#3d3a4a'); A.p(4, 10, C.ironL); }],
  ironChair: [16, 16, A => { A.line(4, 2, 4, 9, C.ironD); A.line(11, 2, 11, 9, C.ironD); A.r(4, 2, 8, 1, C.ironD); A.e(7, 5, 1.5, 1.5, C.ironD); A.e(7, 5, .6, .6, '#00000000'); A.e(9.5, 5, 1.5, 1.5, C.ironD); A.r(3, 9, 10, 2, C.iron); A.r(4, 9, 8, 1, '#7fb3e0'); A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); }],
};
for (const id in DECOR_SPR) OSPR[id] = DECOR_SPR[id];

OSPR.forge = [16, 20, A => { A.r(2, 13, 2, 6, C.woodD); A.r(12, 13, 2, 6, C.woodD); A.r(1, 10, 14, 4, C.wood); A.r(1, 10, 14, 1, C.copperL); A.r(1, 11, 14, 1, C.copper); A.r(1, 13, 14, 1, C.woodD); A.r(4, 6, 8, 3, C.iron); A.r(3, 5, 10, 1, C.ironL); A.r(12, 6, 3, 1, C.iron); A.r(6, 9, 4, 1, C.ironD); A.line(10, 1, 13, 4, C.woodD); A.r(8, 1, 4, 2, C.ironD); A.r(2, 8, 2, 2, C.copper); A.p(2, 8, C.copperL); }];
Object.assign(ICON, {
  resin: A => { A.poly([[8, 2], [11.6, 8.5], [4.4, 8.5]], '#e8a33a'); A.e(8, 10, 4, 4, '#e8a33a'); A.e(7, 9, 1.5, 2, '#ffd98a'); A.p(6, 8, '#fff3d0'); A.p(10, 12, '#b8742a'); A.p(9, 13, '#b8742a'); },
  rope: A => { A.e(8, 9, 6, 4.6, '#b8903f'); A.e(8, 9, 4.6, 3.4, '#d9b66a'); A.e(8, 9, 3, 2.2, '#b8903f'); A.e(8, 9, 1.6, 1.1, '#7a5a2a'); A.line(12, 11, 15, 14, '#b8903f', 2); A.p(5, 6, '#f0d898'); A.p(9, 5, '#f0d898'); },
});
// 무기 아이콘 (구조 변경 3단계: data/items.js의 WEAPONS 표에서 떼어 냄)
export const WEAPON_ICON = {
  daggerWood: daggerIcon(C.woodL, '#f0c890', C.woodD),
  spearWood: spearIcon(C.stone, C.stoneL),
  bowWood: bowIcon(C.wood, C.woodL),
  daggerCopper: daggerIcon(C.copper, C.copperL, C.woodD),
  spearCopper: spearIcon(C.copper, C.copperL),
  hammerCopper: hammerIcon(C.copper, C.copperL, C.copperD),
  staffGlow: staffIcon(C.glow, C.glowL),
  spearIron: spearIcon(C.iron, C.ironL),
  hammerIron: hammerIcon(C.iron, C.ironL, C.ironD),
  bowIron: bowIcon(C.woodD, C.wood, C.iron),
  staffCrystal: staffIcon(C.cry, C.cryL),
  bowCrystal: bowIcon(C.cry, C.cryL, C.cryL),
  axeStone: axeIcon(C.stone, C.stoneL),
  axeCopper: axeIcon(C.copper, C.copperL),
  axeIron: axeIcon(C.iron, C.ironL),
};
for (const id in WEAPON_ICON) ICON[id] = WEAPON_ICON[id];
// 보스 전용 무기 아이콘 (구조 변경 3단계: data/items.js의 UNIQ 표에서 떼어 냄)
export const UNIQ_ICON = {
  daggerQueen: daggerIcon('#c58cf0', '#f6e6ff', '#7d3fa3'),
  hammerSlime: hammerIcon('#86d96b', '#d2f7b8', '#4f9e45'),
  bowGolem: bowIcon('#6a6488', C.cryL, C.cry),
};
for (const id in UNIQ_ICON) ICON[id] = UNIQ_ICON[id];
ICON.golemCore = A => { A.poly([[8, 1], [14, 8], [8, 15], [2, 8]], C.cryD); A.poly([[8, 2.5], [12.5, 8], [8, 13.5], [3.5, 8]], C.cry); A.poly([[8, 2.5], [8, 8], [3.5, 8]], C.cryL); A.e(8, 8, 2, 2, '#7ff0e6'); A.p(7, 7, '#ffffff'); };
ICON.pickCrystal = pickIcon(C.cry, C.cryL);
BAG_UPS.forEach(([id]) => { ICON[id] = A => { UICON.bag(A); A.r(10, 1, 6, 6, '#7fe0b5'); A.r(12, 2, 2, 4, '#241b2f'); A.r(11, 3, 4, 2, '#241b2f'); }; });


// ---- 성장·자연 (content/rpg-nature.js) ----
Object.assign(UICON, {
  quest: A => { A.r(3, 2, 10, 12, '#f0e2c8'); A.r(3, 2, 10, 1, '#fff7e8'); A.r(2, 1, 12, 2, '#c9a878'); A.r(2, 13, 12, 2, '#c9a878'); for (const y of [5, 7, 9]) A.r(5, y, 6, 1, '#8a7a6a'); A.p(11, 11, '#e0552a'); A.p(10, 11, '#ff8a3d'); },
  star: A => { A.poly([[8, 1], [10, 6], [15, 6], [11, 9.5], [12.5, 15], [8, 11.5], [3.5, 15], [5, 9.5], [1, 6], [6, 6]], C.amber); A.poly([[8, 3], [9.3, 6.8], [8, 9]], '#fff1b0'); A.p(7, 7, '#fff7d6'); },
  sk_dash: A => { A.e(10.5, 9, 4.5, 4.5, C.mint); A.e(9.5, 7.6, 1.8, 1.4, C.mintL); A.p(12, 8, INK); A.line(1, 6, 5, 6, C.cream); A.line(0, 9, 4, 9, C.cream); A.line(1, 12, 5, 12, C.cream); },
  sk_spin: A => { for (let k = 0; k < 22; k++) { const a = k / 22 * 5.2 + .5; A.r(Math.round(8 + Math.cos(a) * 5.5), Math.round(8 + Math.sin(a) * 5.5), 2, 1, C.cream); } A.poly([[2, 3], [6, 3], [4, 7]], C.cream); A.line(6, 10, 10, 6, C.ironL, 2); A.p(5, 11, C.woodD); },
  sk_bolt: A => { A.line(2, 14, 11, 5, '#fff1b0', 2); A.poly([[9, 3], [15, 1], [13, 7]], '#ffd25c'); A.p(4, 6, '#fff7d6'); A.p(12, 12, '#fff7d6'); A.p(6, 3, '#ffd25c'); },
  sk_quake: A => { A.e(8, 10, 6.5, 4.6, C.stone); A.e(6.5, 8.5, 2.6, 1.4, C.stoneL); A.line(5, 7, 8, 10, INK); A.line(8, 10, 7, 14, INK); A.line(8, 10, 12, 8, INK); A.p(2, 3, C.amber); A.p(14, 2, C.amber); A.p(8, 2, C.amber); },
  sk_heal: A => { UICON.heart(A); A.r(7, 4, 2, 6, '#ffffff'); A.r(5, 6, 6, 2, '#ffffff'); },
  sk_tough: A => { A.poly([[3, 2], [13, 2], [13, 8], [8, 14.5], [3, 8]], C.ironD); A.poly([[4, 3], [12, 3], [12, 8], [8, 13], [4, 8]], C.iron); A.r(7, 4, 2, 7, C.rose); A.r(5, 6, 6, 2, C.rose); },
  sk_miner: pickIcon(C.copper, C.copperL),
  sk_gourmet: ICON.pie,
  sk_lucky: A => { for (const [x, y] of [[5.5, 5.5], [10.5, 5.5], [5.5, 10.5], [10.5, 10.5]]) A.e(x, y, 3, 3, C.leaf); A.p(4, 4, C.leafL); A.p(9, 4, C.leafL); A.e(8, 8, 1.6, 1.6, C.leafD); A.line(9, 10, 13, 15, C.leafD); },
  sk_swift: A => { A.poly([[3, 13], [6, 3], [11, 1], [9, 6], [14, 5], [9, 11]], '#e8f0ff'); A.line(3, 13, 10, 4, '#9fb6e0'); A.p(13, 2, C.amber); A.p(14, 9, C.amber); },
  sk_stomp: A => { A.e(8, 13, 7, 2.4, C.stone); A.e(8, 12.6, 5, 1.5, C.stoneL); A.r(6, 3, 4, 8, '#8a5a3e'); A.r(5, 9, 6, 3, '#6b4430'); A.line(1, 8, 3, 10, C.cream); A.line(15, 8, 13, 10, C.cream); A.line(2, 5, 4, 7, C.cream); A.line(14, 5, 12, 7, C.cream); },
  sk_warrior: A => { A.line(3, 13, 12, 4, C.ironL, 2); A.line(4, 13, 13, 4, C.iron, 1); A.line(13, 13, 4, 4, C.ironL, 2); A.line(12, 13, 3, 4, C.iron, 1); A.r(2, 12, 3, 3, C.woodD); A.r(11, 12, 3, 3, C.woodD); A.p(8, 8, C.amber); },
  sk_volley: A => { for (const [x, y] of [[2, 12], [5, 14], [1, 8]]) { A.line(x, y, x + 9, y - 9, '#8a6a52'); A.p(x + 9, y - 9, C.ironL); A.p(x + 10, y - 10, '#ffffff'); } A.p(13, 2, C.amber); },
  sk_hawk: A => { A.e(8, 8, 6.5, 4, '#f0e2c8'); A.e(8, 8, 3, 3, '#ffd25c'); A.e(8, 8, 1.4, 1.4, INK); A.p(7, 7, '#ffffff'); A.line(1, 8, 3, 8, '#c9a878'); A.line(13, 8, 15, 8, '#c9a878'); },
  sk_frostRing: A => { for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; A.p(Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), k % 3 ? '#9fd8f0' : '#ffffff'); } for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; A.line(8, 8, 8 + Math.cos(a) * 3, 8 + Math.sin(a) * 3, '#d4f6ff'); } },
  sk_arcane: A => { A.e(8, 8, 6, 6, '#3a2f68'); A.e(8, 8, 4.5, 4.5, '#6b5bc8'); A.e(8, 8, 2.4, 2.4, '#bfa8ff'); A.p(7, 6, '#ffffff'); for (let k = 0; k < 4; k++) { const a = k / 4 * 6.283 + .4; A.p(Math.round(8 + Math.cos(a) * 7), Math.round(8 + Math.sin(a) * 7), '#ffd25c'); } },
});
export const petalIcon = (c, cL, cD) => A => { A.e(6, 9, 3.2, 4.6, c); A.e(10.5, 7.5, 2.6, 3.8, cD); A.e(10.5, 7, 1.8, 2.8, c); A.p(5, 7, cL); A.p(6, 6, cL); A.p(10, 5, cL); A.line(6, 13, 6, 14, C.leafD); };
for (const c in FLOWERS) { const [, , col, cL, cD] = FLOWERS[c]; ICON['petal' + c] = petalIcon(col, cL, cD); }
export function bloomSpr(c, cL, cD) {
  return mk(16, 16, A => { A.line(8, 12, 8, 15, C.leafD); A.e(5, 14, 2, 1, C.leaf); A.e(11, 14, 2, 1, C.leaf);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 - 1.57; A.e(8 + Math.cos(a) * 4.4, 7.5 + Math.sin(a) * 4, 2.4, 2.3, k % 2 ? c : cD); }
    A.e(8, 7.5, 3.3, 3, C.cream); A.p(7, 7, INK); A.p(9, 7, INK); A.p(6, 8, C.blush); A.p(10, 8, C.blush); A.p(5, 3, cL); A.p(11, 3, cL); });
}
export const wildSpr = (c, cL) => mk(16, 16, A => { A.line(5, 14, 5, 9, C.leafD); A.line(9, 14, 10, 8, C.leafD); A.line(12, 14, 12, 10, C.leaf); A.e(4, 13, 1.6, .8, C.leaf); A.e(10, 13.5, 1.6, .8, C.leaf);
  for (const [x, y] of [[5, 8], [10, 7], [12, 9.5]]) { A.e(x - 1.2, y, 1.1, 1.1, c); A.e(x + 1.2, y, 1.1, 1.1, c); A.e(x, y - 1.2, 1.1, 1.1, c); A.e(x, y + 1.2, 1.1, 1.1, c); A.p(Math.round(x), Math.round(y), '#ffd25c'); } A.p(9, 6, cL); }, 'soft');
Object.assign(OSPR, {
  sapling: [16, 16, A => { A.e(8, 14, 3, 1, C.dirtD); A.line(8, 14, 8, 9, C.woodD); A.e(6.2, 9, 2, 1.4, C.leaf); A.e(9.8, 8, 2, 1.4, C.leafL); A.p(8, 8, C.leafL); }],
  saplingB: [16, 18, A => { A.e(8, 16.5, 3.2, 1, C.dirtD); A.r(7, 9, 2, 8, C.wood); A.r(7, 9, 1, 8, C.woodL); A.line(9, 12, 11, 10, C.wood); A.p(11, 9, C.leafL); A.e(8, 7, 4.6, 4, C.leafD); A.e(7, 6, 3.4, 2.8, C.leaf); A.e(6, 4.8, 1.4, 1, C.leafL); A.p(10, 5, C.leafL); }],
  capSapling: [16, 16, A => { A.e(8, 14, 3, 1, '#7a5aa0'); A.r(7, 10, 2, 4, C.cream); A.e(8, 9.5, 3.2, 2.2, '#b673de'); A.p(7, 9, '#fbe7ff'); }],
  capSaplingB: [16, 17, A => { A.e(8, 15.5, 3.4, 1.1, '#7a5aa0'); A.r(6, 8, 4, 8, C.cream); A.r(9, 8, 1, 8, '#e5d3b5'); A.e(8, 7, 5.4, 3.6, '#a8584a'); A.e(8, 6, 4.8, 3, '#e07b5f'); A.p(6, 5, C.cream); A.p(10, 4, C.cream); A.p(8, 6, C.cream); }],
  stump: [16, 16, A => { A.e(8, 13, 5.5, 2.2, C.woodD); A.r(3, 9, 10, 4, C.wood); A.r(3, 9, 2, 4, C.woodL); A.e(8, 9, 5, 2, '#e8b97a'); A.e(8, 9, 3, 1.2, '#c99560'); A.p(8, 9, C.woodD); A.line(2, 13, 4, 11, C.woodD); A.line(11, 8, 12, 5, C.leaf); A.p(13, 5, C.leafL); }],
  capStump: [16, 16, A => { A.e(8, 13.5, 4, 1.4, '#7a5aa0'); A.r(6, 8, 4, 6, C.cream); A.r(9, 8, 1, 6, '#e5d3b5'); A.e(8, 8, 2.4, 1, '#e5d3b5'); A.p(10, 7, '#b673de'); A.p(5, 12, '#b673de'); }],
});
Object.assign(ICON, {
  sapling: A => { A.r(4, 11, 8, 4, '#d9774a'); A.r(3, 10, 10, 2, '#e8915f'); A.line(8, 11, 8, 5, C.woodD); A.e(5.6, 5.5, 2.4, 1.6, C.leaf); A.e(10.4, 4.5, 2.4, 1.6, C.leafL); },
  capSapling: A => { A.r(4, 11, 8, 4, '#d9774a'); A.r(3, 10, 10, 2, '#e8915f'); A.r(7, 6, 2, 5, C.cream); A.e(8, 5.5, 4, 2.8, '#b673de'); A.p(6, 4, '#fbe7ff'); A.p(10, 5, '#fbe7ff'); },
  berryBush: A => { A.e(8, 10, 6.6, 4.8, C.leafD); A.e(6, 8.6, 3.6, 3, C.leaf); A.e(10.4, 8.2, 3.6, 3, C.leaf); A.e(5, 7.4, 1.4, 1, C.leafL); for (const [x, y] of [[4, 10], [8, 8], [11, 11], [7, 12], [12, 8]]) { A.e(x + .5, y + .5, 1.3, 1.3, C.berry); A.p(x, y, '#ffc2d4'); } },
});
Object.assign(FPAL, { 21: ['#6b4838', '#62ad62', '#5a3a2c'], 17: ['#e8501f', '#ff8a3d', '#9a2e14'], 18: ['#4a3f48', '#5a4f58', '#3a3038'], 19: ['#b8cde0', '#d8e8f5', '#9ab0c8'], 20: ['#9fd8f0', '#e8f8ff', '#7ab8d8'], 11: ['#5fa8d8', '#8fd0f0', '#3f7fb5'], 12: ['#3a6fa8', '#5b9bd0', '#2a5288'], 13: ['#4f93c8', '#7fbfe8', '#356fa0'], 14: ['#6a62b8', '#a99cf0', '#4a4290'], 15: ['#4f93c8', '#7fbfe8', '#356fa0'], 16: ['#4f8f57', '#f7b8cf', '#ffffff'] });
export function regFloorTex(t, v) {
  const R = rng(t * 577 + v * 41 + 9), pal = FPAL[t];
  return mk(16, 16, A => { A.r(0, 0, 16, 16, pal[0]);
    if (t === 21) { A.r(0, 0, 16, 16, '#6b4838'); for (let y = 1; y < 16; y += 4) { A.r(0, y, 16, 1, '#5a3a2c'); A.r(0, y + 1, 16, 1, '#7d5743'); } for (let k = 0; k < 6; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#62ad62'); A.p(x + 1, y - 1 < 0 ? 0 : y - 1, '#7cc271'); } A.r(0, 0, 16, 1, '#4f8f57'); A.r(0, 15, 16, 1, '#4f8f57'); A.r(0, 0, 1, 16, '#4f8f57'); A.r(15, 0, 1, 16, '#4f8f57'); return; }
    if (t === 17) { for (let k = 0; k < 5; k++) { const x = R() * 16, y = R() * 16; A.e(x, y, 2.5 + R() * 2, 1.2 + R(), '#ff7a2d'); } for (let k = 0; k < 4; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.r(x, y, 2, 1, '#ffc861'); } for (let k = 0; k < 3; k++) { const x = R() * 14 | 0, y = R() * 14 | 0; A.r(x, y, 3, 2, '#9a2e14'); A.p(x + 1, y, '#5a1a0a'); } return; }
    for (let k = 0; k < 20; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[2]); for (let k = 0; k < 12; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[1]);
    if (t === 18) { for (let k = 0; k < 3; k++) { const x = 1 + R() * 13 | 0, y = 1 + R() * 13 | 0; A.p(x, y, '#2a2228'); A.p(x + 1, y, '#2a2228'); A.p(x, y + 1, '#615460'); } if (v === 0) { A.p(5, 9, '#ff8a3d'); A.p(6, 9, '#c4441a'); } }
    if (t === 19) { for (let k = 0; k < 4; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#ffffff'); } if (v === 1) { A.e(9, 10, 2.4, 1.2, '#e8f4ff'); A.p(8, 9, '#ffffff'); } }
    if (t === 20) { for (let k = 0; k < 3; k++) { const x = R() * 12 | 0, y = 3 + R() * 12 | 0; A.line(x, y, x + 3, y - 3, '#e8f8ff'); } A.p(3, 12, '#ffffff'); if (v % 2) A.p(12, 4, '#ffffff'); }
  }, null);
}
export function natFloorTex(t, v) {
  const R = rng(t * 911 + v * 37 + 5), pal = FPAL[t];
  return mk(16, 16, A => {
    if (t === 16) { A.r(0, 0, 16, 16, '#468a4f'); for (let k = 0; k < 22; k++) { const x = R() * 16 | 0, y = R() * 16 | 0; A.p(x, y, '#3c7a46'); A.p((x + 1) % 16, y, '#3c7a46'); }
      for (let k = 0; k < 6; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#62ad62');
      for (let k = 0; k < 9; k++) { const x = R() * 15 | 0, y = R() * 15 | 0, w = R() < .55; A.p(x, y, w ? '#ffffff' : '#f7b8cf'); A.p(x + 1, y, w ? '#fcd9e6' : '#f49ab8'); if (R() < .4) A.p(x, y + 1, '#f49ab8'); } return; }
    A.r(0, 0, 16, 16, pal[0]); for (let k = 0; k < 6; k++) { const x = R() * 13 | 0, y = R() * 15 | 0; A.r(x, y, 3, 1, pal[1]); } for (let k = 0; k < 5; k++) A.p(R() * 16 | 0, R() * 16 | 0, pal[2]);
    if (t === 11) for (let k = 0; k < 4; k++) { const x = 2 + R() * 12, y = 2 + R() * 12; A.e(x, y, 1.3, 1, '#a99a7c'); A.p(x | 0, (y - 1) | 0, '#cfc2a4'); }
    if (t === 12 && v % 2 === 0) { A.e(8, 8, 3.6, 2.6, '#4f9a5e'); A.e(7, 7.4, 1.5, 1, '#6cbb76'); A.line(8, 8, 11, 6, pal[0]); if (v === 0) { A.e(10, 6.4, 1.3, 1.1, '#ffb3c6'); A.p(10, 6, '#ffe0ea'); } }
    if (t === 13) { A.e(8, 8, 4.8, 3.8, '#625d78'); A.e(8, 7.4, 4.4, 3.2, '#8f8aa3'); A.e(7, 6.6, 2.6, 1.6, '#b9b4cc'); }
    if (t === 14) { for (let k = 0; k < 3; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, '#ffffff'); A.p(x + 1, y, '#e3d4ff'); } if (v === 1) { A.poly([[2, 14], [4, 9], [6, 14]], C.cry); A.p(4, 11, C.cryL); } }
    if (t === 15) for (let k = 0; k < 6; k++) { const x = R() * 15 | 0, y = R() * 15 | 0; A.p(x, y, R() < .5 ? '#ffffff' : '#f7b8cf'); A.p(x + 1, y, '#f49ab8'); }
  }, null);
}
// 자연 꾸미기 그림 [가로, 세로, 그리기] (구조 변경 3단계: data/rpg-nature.js의 NATURE 표에서 떼어 냄)
export const NATURE_SPR = {
  cherryTree: [32, 40, A => {
    A.poly([[12, 39], [15, 26], [17, 26], [20, 39]], C.woodD); A.r(14, 21, 4, 18, C.wood); A.r(14, 21, 1, 18, C.woodL); A.line(16, 24, 9, 16, C.wood, 2); A.line(17, 23, 24, 15, C.wood, 2);
    for (const [x, y, r] of [[9, 15, 6.5], [23, 14, 6.5], [16, 9, 7.5], [6, 10, 5], [26, 9, 5], [16, 17, 6], [11, 5, 5], [21, 4, 5]]) A.e(x, y, r, r * .85, '#f49ab8');
    for (const [x, y, r] of [[9, 13, 4.5], [22, 12, 4.5], [15, 7, 5.5], [7, 9, 3], [25, 8, 3], [11, 4, 3], [20, 3, 3]]) A.e(x, y, r, r * .8, '#f7b8cf');
    for (const [x, y] of [[8, 11], [13, 5], [19, 9], [24, 11], [16, 14], [10, 16], [22, 5], [5, 8], [27, 12]]) { A.p(x, y, '#ffffff'); A.p(x + 1, y, '#fcd9e6'); }
    A.p(18, 13, '#d9607d'); A.p(6, 14, '#d9607d'); A.p(26, 13, '#d9607d'); }],
  roundTree: [24, 32, A => {
    A.poly([[8, 31], [11, 24], [13, 24], [16, 31]], C.woodD); A.r(10, 17, 4, 14, C.wood); A.r(10, 17, 1, 14, C.woodL);
    A.e(12, 11, 10, 9, C.leafD); A.e(10.5, 9.5, 7.5, 6.5, C.leaf); A.e(15, 8, 5, 4, C.leaf); A.e(8, 6, 2.6, 1.6, C.leafL); A.p(15, 5, C.leafL); A.p(5, 11, C.leafL); A.p(17, 14, '#2f6e33'); }],
  shrub: [16, 14, A => {
    A.e(8, 9, 7, 4.6, C.leafD); A.e(5.5, 7.5, 3.6, 3, C.leaf); A.e(10.5, 7, 3.8, 3.2, C.leaf); A.e(8, 5.5, 3, 2.4, C.leaf); A.p(5, 6, C.leafL); A.p(10, 5, C.leafL); A.p(8, 4, C.leafL); }],
  hydrangea: [16, 16, A => {
    A.e(8, 11, 7, 4.4, C.leafD); A.e(8, 10, 5.6, 3.4, C.leaf);
    for (const [x, y] of [[4.5, 7], [11, 6.5], [8, 4.5]]) { A.e(x, y, 3, 2.6, '#6fa8ff'); A.p(x - 1 | 0, y - 1 | 0, '#c2dcff'); A.p(x + 1 | 0, y | 0, '#c2dcff'); A.p(x | 0, y + 1 | 0, '#4a78d0'); } }],
  roseBlack: [16, 16, A => {
    A.e(8, 11, 7, 4.4, '#2f6e33'); A.e(8, 10, 5.6, 3.4, C.leafD);
    for (const [x, y] of [[4.5, 7.5], [11, 7], [8, 4.5]]) { A.e(x, y, 2.4, 2.2, '#4a3f5c'); A.p(x | 0, y | 0, '#8a7aa6'); A.p(x - 1 | 0, y | 0, '#2a2238'); A.p(x + 1 | 0, y - 1 | 0, '#d0485e'); } }],
  sunflower: [16, 28, A => {
    A.line(8, 27, 8, 11, C.leafD, 2); A.e(5, 20, 3, 1.4, C.leaf); A.e(11, 16, 3, 1.4, C.leaf);
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283; A.e(8 + Math.cos(a) * 4.2, 7 + Math.sin(a) * 4.2, 1.8, 1.8, k % 2 ? '#ffd25c' : '#f2b83a'); }
    A.e(8, 7, 2.8, 2.8, '#7a4a2a'); A.p(7, 6, '#a06a3a'); A.p(9, 8, '#5a3420'); }],
  daisies: [16, 16, A => {
    for (const [x, y] of [[4, 5], [11, 4], [7, 10], [13, 11], [3, 13]]) { A.line(x, y + 1, x, y + 3, C.leaf); A.p(x - 1, y, '#ffffff'); A.p(x + 1, y, '#ffffff'); A.p(x, y - 1, '#ffffff'); A.p(x, y + 1, '#f4f0f8'); A.p(x, y, '#ffd25c'); } }],
  flowerBed: [16, 16, A => {
    A.e(4, 12, 3.4, 2, C.leafD); A.e(11, 13, 4, 2, C.leafD); A.e(8, 7, 4, 2, C.leafD); A.e(3, 5, 2.6, 1.6, C.leaf); A.e(13, 6, 2.6, 1.6, C.leaf);
    const cs = ['#ff6b81', '#6fa8ff', '#ffd25c'];
    [[3, 4], [7, 3], [12, 4], [5, 8], [10, 8], [14, 9], [2, 11], [7, 12], [12, 13], [9, 15]].forEach(([x, y], k) => { const c = cs[k % 3]; A.p(x - 1, y, c); A.p(x + 1, y, c); A.p(x, y - 1, c); A.p(x, y + 1, c); A.p(x, y, k % 3 === 2 ? '#d9a53a' : '#fff1d6'); }); }],
};
for (const id in NATURE_SPR) OSPR[id] = NATURE_SPR[id];


// ---- 회로·깊은 지역 (content/circuits-regions.js) ----
export const drillSpr = dir => A => { A.r(3, 8, 10, 10, '#5a5468'); A.r(3, 8, 10, 2, '#8d97a8'); A.r(3, 8, 1, 10, '#787090'); A.r(12, 8, 1, 10, '#36334a'); A.r(5, 12, 6, 3, '#e5884a'); A.r(5, 12, 6, 1, '#ffb57a'); A.p(7, 16, '#7fe0b5');
  const [dx, dy] = dir, cx = 8 + dx * 5, cy = 12 + dy * 5; if (dy < 0) A.poly([[5, 9], [11, 9], [8, 1]], '#c8d0dc'); else if (dy > 0) A.poly([[5, 17], [11, 17], [8, 21]], '#c8d0dc'); else if (dx > 0) A.poly([[12, 10], [12, 16], [16, 13]], '#c8d0dc'); else A.poly([[4, 10], [4, 16], [0, 13]], '#c8d0dc'); A.p(cx, cy, '#ffffff'); };
Object.assign(OSPR, {
  battery: [16, 16, A => { A.r(4, 4, 8, 11, '#3e4a5a'); A.r(4, 4, 2, 11, '#5a6a80'); A.r(11, 4, 1, 11, '#2a3240'); A.r(6, 2, 4, 2, '#e5884a'); A.r(6, 2, 4, 1, '#ffb57a'); A.r(5, 7, 6, 5, '#2a3240'); A.r(7, 8, 2, 3, '#ffd25c'); A.r(6, 9, 4, 1, '#ffd25c'); }],
  generator: [16, 22, A => { A.r(10, 1, 3, 9, '#5a5468'); A.r(10, 1, 1, 9, '#8d97a8'); A.r(2, 8, 12, 13, '#4a4558'); A.r(2, 8, 12, 2, '#8d97a8'); A.r(2, 8, 1, 13, '#6c7688'); A.r(13, 8, 1, 13, '#2a2836'); A.r(4, 13, 8, 5, '#2a1810'); A.r(4, 13, 8, 1, '#1a1018'); A.r(3, 20, 10, 1, '#24222e'); A.p(5, 11, '#ffd25c'); A.p(7, 11, '#7fe0b5'); }],
  crystalGen: [16, 24, A => { A.r(3, 17, 10, 6, '#625d78'); A.r(3, 17, 10, 1, '#b9b4cc'); A.r(2, 16, 12, 2, '#8f8aa3'); A.poly([[8, 2], [12, 9], [8, 15], [4, 9]], '#9d7fe0'); A.poly([[8, 2], [8, 15], [4, 9]], '#c1a8f5'); A.p(7, 6, '#ffffff'); A.r(5, 19, 6, 2, '#3a3450'); A.p(6, 20, '#c6b0ff'); A.p(9, 20, '#c6b0ff'); }],
  lever: [16, 16, A => { A.r(4, 11, 8, 4, '#5a5468'); A.r(4, 11, 8, 1, '#8d97a8'); A.line(8, 12, 4, 5, '#8a6a52', 2); A.e(4, 4, 1.8, 1.8, '#e05a5a'); A.p(3, 3, '#ffb0b0'); }],
  leverOn: [16, 16, A => { A.r(4, 11, 8, 4, '#5a5468'); A.r(4, 11, 8, 1, '#8d97a8'); A.line(8, 12, 12, 5, '#8a6a52', 2); A.e(12, 4, 1.8, 1.8, '#5ad08a'); A.p(11, 3, '#c0ffd8'); }],
  plate: [16, 16, A => { A.r(2, 2, 12, 12, '#5a5468'); A.r(3, 3, 10, 10, '#8d97a8'); A.r(3, 3, 10, 1, '#c8d0dc'); A.r(3, 12, 10, 1, '#5a5468'); A.p(4, 4, '#ffffff'); }],
  plateOn: [16, 16, A => { A.r(2, 2, 12, 12, '#5a5468'); A.r(3, 4, 10, 9, '#6c7688'); A.r(3, 4, 10, 1, '#5ad08a'); }],
  timer: [16, 16, A => { A.r(3, 5, 10, 10, '#4a4558'); A.r(3, 5, 10, 2, '#787090'); A.e(8, 10, 3.4, 3.4, '#fff1d6'); A.line(8, 10, 8, 8, INK); A.line(8, 10, 10, 10, INK); A.r(7, 3, 2, 2, '#e5884a'); }],
  eLamp: [16, 24, A => { A.e(8, 22, 4, 1.4, '#36334a'); A.r(7, 9, 2, 13, '#8d97a8'); A.r(7, 9, 1, 13, '#c8d0dc'); A.r(4, 7, 8, 2, '#5a5468'); A.e(8, 4.5, 3.6, 3.6, '#fff1c0'); A.e(7, 3.6, 1.6, 1.4, '#ffffff'); A.r(5, 7, 6, 1, '#787090'); }],
  eDoor: [16, 18, A => { A.r(2, 1, 12, 17, '#5a5468'); A.r(3, 2, 10, 15, '#8d97a8'); A.r(3, 2, 10, 1, '#c8d0dc'); A.r(7, 2, 2, 15, '#6c7688'); A.r(4, 8, 2, 2, '#ffd25c'); A.r(10, 8, 2, 2, '#ffd25c'); }],
  eDoorOpen: [16, 18, A => { A.r(1, 1, 3, 17, '#8d97a8'); A.r(12, 1, 3, 17, '#8d97a8'); A.r(1, 1, 3, 1, '#c8d0dc'); A.r(12, 1, 3, 1, '#c8d0dc'); A.r(2, 8, 1, 2, '#5ad08a'); A.r(13, 8, 1, 2, '#5ad08a'); }],
  drillCu: [16, 22, drillSpr([0, -1])],
});
OSPR.drillFe = [16, 22, A => { drillSpr([0, -1])(A); A.r(5, 12, 6, 3, '#c8d0dc'); A.r(5, 12, 6, 1, '#ffffff'); }];
export const goldTrim = A => { A.r(5, 12, 6, 3, '#ffd25c'); A.r(5, 12, 6, 1, '#fff1b0'); A.r(3, 8, 10, 1, '#ffc23a'); };
OSPR.drillGold = [16, 22, A => { drillSpr([0, -1])(A); goldTrim(A); }];
for (const [k, d] of [['U', [0, -1]], ['D', [0, 1]], ['L', [-1, 0]], ['R', [1, 0]]]) { OSPR['drillGold' + k] = [16, 22, A => { drillSpr(d)(A); goldTrim(A); }]; OSPR['drillCu' + k] = [16, 22, drillSpr(d)]; OSPR['drillFe' + k] = [16, 22, A => { drillSpr(d)(A); A.r(5, 12, 6, 3, '#c8d0dc'); A.r(5, 12, 6, 1, '#ffffff'); }]; }
Object.assign(ICON, { wire: A => { A.e(8, 9, 6, 4.6, '#b8642f'); A.e(8, 9, 4.4, 3.2, '#e5884a'); A.e(8, 9, 2.8, 2, '#b8642f'); A.e(8, 9, 1.4, 1, '#5a3a14'); A.line(12, 11, 15, 14, '#e5884a', 2); A.p(15, 15, '#c8d0dc'); } });
Object.assign(ICON, {
  goldOre: A => { A.e(8, 9, 5.6, 4.6, '#4a414f'); A.e(6.5, 7.5, 2.4, 1.3, '#5a4f58'); A.e(6, 10, 1.7, 1.3, '#ffd25c'); A.e(10, 8, 1.5, 1.3, '#ffd25c'); A.p(9, 11, '#fff1b0'); A.p(10, 7, '#fff1b0'); },
  goldBar: A => { A.r(3, 8, 10, 4, '#ffc23a'); A.poly([[3, 8], [5, 5], [11, 5], [13, 8]], '#ffe28a'); A.r(3, 11, 10, 1, '#c9902a'); A.p(6, 6, '#ffffff'); A.p(7, 6, '#fff7d0'); },
  obsidian: A => { A.poly([[3, 12], [6, 4], [11, 3], [13, 9], [9, 14]], '#2a2238'); A.poly([[6, 4], [11, 3], [9, 8]], '#4a3f68'); A.p(8, 5, '#9a8ad0'); A.p(10, 10, '#4a3f68'); },
  frostShard: A => { A.poly([[8, 1], [11, 7], [8, 14], [5, 7]], '#7fd8f0'); A.poly([[8, 1], [8, 14], [5, 7]], '#d4f6ff'); A.poly([[12, 6], [14, 10], [12, 14], [10.5, 10]], '#5ab8e0'); A.p(7, 5, '#ffffff'); },
  fireBerry: A => { A.e(6, 10, 3.6, 3.6, '#ff6a2a'); A.e(10.5, 9, 3.2, 3.2, '#ff8a3d'); A.p(5, 8, '#ffd0a0'); A.p(10, 7, '#ffe0b0'); A.line(8, 6, 9, 2, C.leafD); A.e(10, 3, 1.6, .9, C.leaf); },
  lavaCore: A => { A.e(8, 8, 6, 6, '#7a2a14'); A.e(8, 8, 4.6, 4.6, '#e8501f'); A.e(8, 8, 2.6, 2.6, '#ffc861'); A.p(6, 6, '#ffffff'); A.p(12, 11, '#ff8a3d'); },
  frostCore: A => { A.e(8, 8, 6, 6, '#3a6fa8'); A.e(8, 8, 4.6, 4.6, '#7fd8f0'); A.e(8, 8, 2.6, 2.6, '#ffffff'); A.p(4, 4, '#d4f6ff'); A.p(12, 12, '#d4f6ff'); A.p(12, 4, '#d4f6ff'); A.p(4, 12, '#d4f6ff'); },
});
ICON.mossSpore = packet('#4f8f57', A => { A.e(8, 9, 2.6, 2, '#62ad62'); A.p(6, 7, '#9be37a'); A.p(10, 8, '#9be37a'); A.p(8, 11, '#3c7a46'); });
OSPR.fireBloom = [16, 16, A => { A.line(5, 15, 5, 9, '#5a3a2e'); A.line(10, 15, 11, 8, '#5a3a2e'); A.e(4, 14, 2, .9, '#4a3a30'); A.e(11, 14.5, 2, .9, '#4a3a30'); for (const [x, y] of [[5, 7], [11, 6]]) { A.poly([[x - 2.6, y + 2], [x, y - 4], [x + 2.6, y + 2]], '#ff6a2a'); A.poly([[x - 1.4, y + 2], [x, y - 1.6], [x + 1.4, y + 2]], '#ffc861'); A.p(x, y + 1, '#fff1b0'); } A.e(8, 12, 1.6, 1.4, '#ff8a3d'); A.p(8, 11, '#ffd0a0'); }];
OSPR.iceCluster = [16, 18, A => { A.poly([[3, 16], [4, 7], [7, 16]], '#5a9ac8'); A.poly([[6, 16], [8, 2], [11, 16]], '#9fd8f0'); A.poly([[6, 16], [8, 2], [8, 16]], '#e8f8ff'); A.poly([[10, 16], [13, 8], [14, 16]], '#7fc0e8'); A.p(7, 6, '#fff'); A.e(8, 16.5, 6, 1.2, '#5a88b0'); }];
// 황금·서리 장비 아이콘 (구조 변경 3단계: data/circuits-regions.js의 GEAR2 표에서 떼어 냄)
export const GEAR2_ICON = {
  swordGold: swordIcon('#ffd25c', '#fff1b0', '#c9902a'),
  daggerObsidian: daggerIcon('#3a2a4a', '#9a8ad0', '#c9902a'),
  hammerObsidian: hammerIcon('#3a2a4a', '#6a5a8a', '#1a1424'),
  spearFrost: spearIcon('#7fd8f0', '#e8f8ff'),
  staffFrost: staffIcon('#9fd8f0', '#ffffff'),
  bowGold: bowIcon('#c9902a', '#ffd25c', '#fff1b0'),
};
for (const id in GEAR2_ICON) ICON[id] = GEAR2_ICON[id];
ICON.pickGold = pickIcon('#ffd25c', '#fff1b0');
ICON.swordLava = swordIcon('#e8501f', '#ffc861', '#5a3a2e');
ICON.bowFrost = bowIcon('#5a9ac8', '#e8f8ff', '#7fd8f0');
ICON.swordDawn = swordIcon('#ffe9a8', '#ffffff', '#ff8fa3');
ICON.pickStar = pickIcon('#ffe9a8', '#ffffff');
export const arrowIcon = (h, hl) => A => { A.line(2, 14, 11, 5, '#8a6a52', 1); A.line(3, 14, 11, 6, '#b8946a', 1); A.poly([[9.5, 3.5], [14.5, 1.5], [12.5, 6.5]], h); A.p(12, 4, hl); A.r(1, 11, 2, 2, '#eef2f7'); A.r(3, 13, 2, 2, '#eef2f7'); A.p(2, 12, '#ff8fa3'); };
for (const id in ARROWS) ICON[id] = arrowIcon(ARROWS[id][2], '#ffffff');
export const stoneDrill = dir => A => { A.r(3, 8, 10, 10, '#8f8aa3'); A.r(3, 8, 10, 2, '#b9b4cc'); A.r(3, 8, 1, 10, '#a39eb5'); A.r(12, 8, 1, 10, '#625d78'); A.p(5, 15, '#625d78'); A.p(10, 11, '#625d78'); A.p(9, 16, '#625d78');
  A.r(5, 12, 6, 3, '#9c6a4a'); A.r(5, 12, 6, 1, '#c99560'); A.e(8, 13.5, 1.4, 1.4, '#5a3929'); A.line(8, 13, 11, 11, '#5a3929'); A.p(7, 16, '#7fe0b5');
  const [dx, dy] = dir; if (dy < 0) A.poly([[5, 9], [11, 9], [8, 1]], '#b9b4cc'); else if (dy > 0) A.poly([[5, 17], [11, 17], [8, 21]], '#b9b4cc'); else if (dx > 0) A.poly([[12, 10], [12, 16], [16, 13]], '#b9b4cc'); else A.poly([[4, 10], [4, 16], [0, 13]], '#b9b4cc'); A.p(8 + dx * 5, 12 + dy * 5, '#ffffff'); };
OSPR.drillStone = [16, 22, stoneDrill([0, -1])];
for (const [k, d] of [['U', [0, -1]], ['D', [0, 1]], ['L', [-1, 0]], ['R', [1, 0]]]) OSPR['drillStone' + k] = [16, 22, stoneDrill(d)];
export function emberSpr() { return mk(16, 16, A => { A.r(5, 14, 2, 1, '#3a2a26'); A.r(9, 14, 2, 1, '#3a2a26'); A.e(8, 11, 3.8, 3.3, '#5a3a2e'); A.p(7, 11, '#ffc861'); A.p(9, 11, '#ffc861'); A.p(6, 12, '#ff8a3d'); A.p(10, 12, '#ff8a3d');
  A.poly([[2.5, 9], [5, 3], [7, 5.5], [8, 0.5], [10, 5.5], [11.5, 3], [13.5, 9]], '#ff6a2a'); A.poly([[4.5, 9], [6.5, 5], [8, 3], [9.5, 5], [11.5, 9]], '#ffc861'); A.r(3, 8, 10, 1, '#c4441a'); }); }
export function snowSpr() { return mk(16, 16, A => { A.e(8, 11.5, 4.6, 3.6, '#c8dcef'); A.e(8, 11, 4.3, 3.3, '#ffffff'); A.e(8, 6, 3.4, 3, '#c8dcef'); A.e(8, 5.6, 3.1, 2.7, '#ffffff'); A.p(7, 5, INK); A.p(9, 5, INK); A.p(6, 6, C.blush); A.p(10, 6, C.blush); A.p(8, 7, '#ff9b4a');
  A.line(3, 9, 1, 7, '#7a5a3a'); A.line(13, 9, 15, 7, '#7a5a3a'); A.p(8, 10, '#5a88b0'); A.p(8, 12, '#5a88b0'); A.r(5, 2, 6, 1, '#7fd8f0'); A.r(6, 1, 4, 1, '#7fd8f0'); }); }
export function turtleSpr(shell) { return mk(40, 32, A => {
  if (!shell) { A.e(7, 26, 3.4, 2.6, '#a8784e'); A.e(33, 26, 3.4, 2.6, '#a8784e'); A.e(9, 13, 3, 2.4, '#a8784e'); A.e(31, 13, 3, 2.4, '#a8784e'); }
  A.e(20, 18, 17, 11, '#3a2620'); A.e(20, 17, 16, 10, '#5a3a2e'); A.e(20, 16, 13, 7.5, '#7a4a34');
  for (const [x, y] of [[14, 13], [20, 11], [26, 13], [17, 19], [23, 19]]) { A.poly([[x - 3, y], [x, y - 2.5], [x + 3, y], [x, y + 2.5]], '#4a2e24'); A.line(x - 2, y, x + 2, y, '#ff8a3d'); A.p(x, y - 1, '#ffc861'); }
  A.poly([[12, 8], [14, 3], [16, 8]], '#2a1c18'); A.poly([[18, 6], [20, 0.5], [22, 6]], '#2a1c18'); A.poly([[24, 8], [26, 3], [28, 8]], '#2a1c18'); A.p(20, 2, '#ff8a3d');
  A.r(4, 25, 32, 2, '#2a1c18');
  if (!shell) { A.e(20, 27, 6, 4.6, '#c9a070'); A.e(18.5, 25.5, 3, 1.6, '#e0c090'); A.r(16, 26, 2, 2, INK); A.r(22, 26, 2, 2, INK); A.p(16, 26, '#fff'); A.p(22, 26, '#fff'); A.r(19, 29, 2, 1, INK); A.e(15, 29, 1.2, .8, C.blush); A.e(25, 29, 1.2, .8, C.blush); }
}); }
export function spiritSpr() { return mk(32, 36, A => {
  A.poly([[9, 24], [16, 35], [23, 24]], '#bfe6ff'); A.poly([[12, 24], [16, 32], [20, 24]], '#e8f8ff');
  A.e(5, 18, 2.6, 2.6, '#9fd8f0'); A.e(27, 18, 2.6, 2.6, '#9fd8f0'); A.p(4, 17, '#fff'); A.p(26, 17, '#fff');
  A.e(16, 17, 10, 9.5, '#7fc0e8'); A.e(16, 16.5, 9.2, 8.8, '#d4f0ff'); A.e(13, 13, 4, 2.6, '#ffffff');
  A.r(12, 16, 2, 3, '#2a4f88'); A.r(18, 16, 2, 3, '#2a4f88'); A.p(12, 16, '#fff'); A.p(18, 16, '#fff'); A.r(15, 21, 2, 1, '#2a4f88'); A.e(10.5, 20, 1.4, .9, '#ffc0d0'); A.e(21.5, 20, 1.4, .9, '#ffc0d0');
  for (const [x, h] of [[9, 5], [13, 8], [16, 10], [19, 8], [23, 5]]) { A.poly([[x - 1.8, 9], [x, 9 - h], [x + 1.8, 9]], '#7fd8f0'); A.poly([[x - .6, 9], [x, 9 - h + 2], [x + .6, 9]], '#ffffff'); }
}); }
export const farmTree = (A, x, yb, st) => { const s = [0.55, 1.1, 1.65, 2.2][st]; if (st === 0) { A.e(x, yb, 3, 1.2, '#4a3428'); A.line(x, yb, x, yb - 5, C.woodD); A.e(x - 2, yb - 4.5, 2.2, 1.4, C.leaf); A.e(x + 2, yb - 5.5, 2.2, 1.4, C.leafL); A.e(x, yb - 6.5, 1.6, 1.2, '#9be37a'); A.p(x - 2, yb - 5, '#c8f58a'); return; }
  A.r(x - 1, Math.round(yb - 4 * s), 2, Math.round(4 * s), C.wood); A.r(x - 1, Math.round(yb - 4 * s), 1, Math.round(4 * s), C.woodL); A.e(x, yb - 4 * s - 2.4 * s, 2.8 * s + 1, 2.4 * s + 1, C.leafD); A.e(x - .6, yb - 4 * s - 2.8 * s, 2.1 * s + .6, 1.8 * s + .6, C.leaf); A.p(Math.round(x - 1.5 * s), Math.round(yb - 4 * s - 3.8 * s), C.leafL); if (st === 3) { A.p(Math.round(x + s), Math.round(yb - 5.5 * s), '#ffd36b'); } };
export const quarryRock = (A, x, yb, st, oc, ol) => { const s = [.45, .75, 1, 1.25][st]; A.e(x, yb - 3 * s, 6 * s + 1, 4 * s + 1, '#625d78'); A.e(x - .5, yb - 3.6 * s, 5.4 * s + .6, 3.4 * s + .6, '#8e89a3'); A.e(x - 2 * s, yb - 5 * s, 2.4 * s, 1.4 * s, '#b9b4cc'); A.p(Math.round(x + 2 * s), Math.round(yb - 2 * s), '#625d78'); if (st === 3) { A.p(Math.round(x - 3), Math.round(yb - 6), '#ffffff'); A.p(Math.round(x + 3), Math.round(yb - 5), '#e3d4ff'); }
  if (oc && st) for (const [dx, dy] of [[-2, -3], [2, -4], [0, -1.6], [3, -1.4]].slice(0, st + 1)) { A.e(x + dx * s, yb + dy * s, 1.1 * s + .4, .9 * s + .4, oc); A.p(Math.round(x + dx * s - .5), Math.round(yb + dy * s - .5), ol); } };
export const quarrySpr = (st, oc, ol) => [32, 40, A => { A.r(1, 10, 30, 29, '#5a5468'); for (let k = 0; k < 14; k++) { const R = rng(4100 + k); A.p(2 + R() * 28 | 0, 11 + R() * 27 | 0, k % 2 ? '#6f6a86' : '#46405a'); }
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); }
  quarryRock(A, 10, 25, st, oc, ol); quarryRock(A, 22, 24, st, oc, ol); quarryRock(A, 16, 36, st, oc, ol); A.line(25, 34, 29, 28, C.woodD); A.line(27, 27, 30, 30, C.stoneL); A.p(26, 28, C.stoneL); }];
export const farmSpr = st => [32, 40, A => { A.r(1, 10, 30, 29, '#6b4838'); for (let y = 13; y < 38; y += 5) A.r(2, y, 28, 1, '#5a3a2c'); for (let k = 0; k < 8; k++) A.p(3 + k * 3.5 | 0, 37 - (k % 3) * 9, '#62ad62');
  A.r(0, 9, 32, 2, C.woodD); A.r(0, 37, 32, 2, C.woodD); A.r(0, 9, 2, 30, C.woodD); A.r(30, 9, 2, 30, C.woodD); for (const x of [0, 10, 20, 30]) { A.r(x, 7, 2, 4, C.wood); A.r(x, 36, 2, 4, C.wood); } A.r(0, 9, 32, 1, C.woodL);
  farmTree(A, 9, 23, st); farmTree(A, 23, 23, st); farmTree(A, 16, 35, st); }];


// ---- 보스 조각상 (game/combat.js) ----
for (const id in SUMMON) { const [, , , c1, c2] = SUMMON[id];
  ICON[id] = A => { A.r(4, 12, 8, 3, '#625d78'); A.r(4, 12, 8, 1, '#8f8aa3'); A.e(8, 8, 4, 4.6, c1); A.e(7, 6.6, 1.8, 1.6, c2); A.p(6, 6, '#ffffff'); A.p(10, 10, '#00000033'); }; }

// ---- 여러 칸 가구 (game/quests.js) ----
export const flowerDots = (A, w, h, seed) => { const R = rng(seed); const cs = ['#ff6b81', '#6fa8ff', '#ffd25c', '#ffffff', '#f49ab8']; for (let k = 0; k < w * h / 10; k++) { const x = 1 + R() * (w - 3) | 0, y = 2 + R() * (h - 4) | 0; A.e(x, y + 1, 1.6, .8, C.leafD); const c = cs[k % cs.length]; A.p(x - 1, y, c); A.p(x + 1, y, c); A.p(x, y - 1, c); A.p(x, y + 1, c); A.p(x, y, '#fff1d6'); } };
Object.assign(OSPR, {
  bedDouble: [32, 34, A => { A.r(1, 2, 30, 9, C.woodD); A.r(2, 3, 28, 7, C.wood); A.r(2, 3, 28, 2, C.woodL); A.r(2, 10, 28, 22, '#f3e2c4'); A.e(9, 13.5, 5.2, 2.8, '#e8e0f0'); A.e(23, 13.5, 5.2, 2.8, '#e8e0f0'); A.e(9, 13, 4.4, 2, '#ffffff'); A.e(23, 13, 4.4, 2, '#ffffff');
    A.r(2, 17, 28, 14, '#f49ab8'); A.r(2, 17, 28, 2, '#f7b8cf'); for (let y = 21; y < 30; y += 4) for (let x = 5 + (y % 8 ? 0 : 3); x < 29; x += 6) { A.p(x, y, '#ffd0de'); A.p(x + 1, y, '#ffd0de'); A.p(x, y + 1, '#ffd0de'); } A.r(2, 30, 28, 2, '#d9607d'); A.r(1, 31, 3, 3, C.woodD); A.r(28, 31, 3, 3, C.woodD); }],
  longTable: [32, 22, A => { A.r(1, 4, 30, 10, C.woodL); A.r(1, 4, 30, 1, '#e8b97a'); A.r(1, 12, 30, 3, C.wood); A.r(5, 6, 22, 5, '#9be37a'); A.r(5, 6, 22, 1, '#c8f58a'); A.r(3, 15, 3, 6, C.woodD); A.r(26, 15, 3, 6, C.woodD); A.e(11, 8, 2.6, 1.5, '#ffffff'); A.e(11, 8, 1.4, .8, '#ffb15c'); A.r(20, 4, 3, 4, '#d9774a'); A.e(21.5, 3, 2, 1.5, '#ff9ab0'); }],
  longTableV: [16, 38, A => { A.r(2, 4, 12, 26, C.woodL); A.r(2, 4, 12, 1, '#e8b97a'); A.r(2, 28, 12, 3, C.wood); A.r(5, 6, 6, 20, '#9be37a'); A.r(5, 6, 1, 20, '#c8f58a'); A.r(3, 31, 3, 6, C.woodD); A.r(10, 31, 3, 6, C.woodD); A.e(8, 12, 2.6, 1.6, '#ffffff'); A.e(8, 12, 1.4, .8, '#ffb15c'); A.r(7, 19, 3, 4, '#d9774a'); A.e(8.5, 18, 2, 1.5, '#ff9ab0'); }],
  sofa2: [32, 24, A => { A.r(1, 3, 30, 10, '#5fbf93'); A.r(1, 3, 30, 2, '#7fe0b5'); A.r(1, 12, 30, 8, '#4f9f7a'); A.r(3, 12, 12, 6, '#7fe0b5'); A.r(17, 12, 12, 6, '#7fe0b5'); A.r(3, 12, 12, 1, '#a8f0cf'); A.r(17, 12, 12, 1, '#a8f0cf'); A.r(0, 8, 4, 13, '#3f8a68'); A.r(28, 8, 4, 13, '#3f8a68'); A.r(0, 8, 4, 1, '#5fbf93'); A.r(28, 8, 4, 1, '#5fbf93'); A.r(2, 21, 2, 3, C.woodD); A.r(28, 21, 2, 3, C.woodD); A.e(9, 7, 3, 2.4, '#ffd36b'); A.p(8, 6, '#fff1b0'); }],
  sofa2V: [16, 40, A => { A.r(9, 3, 6, 32, '#5fbf93'); A.r(9, 3, 1, 32, '#7fe0b5'); A.r(2, 9, 8, 26, '#4f9f7a'); A.r(3, 10, 6, 11, '#7fe0b5'); A.r(3, 23, 6, 11, '#7fe0b5'); A.r(3, 10, 6, 1, '#a8f0cf'); A.r(3, 23, 6, 1, '#a8f0cf'); A.r(1, 5, 14, 5, '#3f8a68'); A.r(1, 34, 14, 4, '#3f8a68'); A.r(1, 5, 14, 1, '#5fbf93'); A.r(2, 38, 2, 2, C.woodD); A.r(12, 38, 2, 2, C.woodD); }],
  bookcase2: [32, 34, A => { A.r(1, 1, 30, 32, C.woodD); A.r(3, 3, 26, 28, '#3a2a26'); const R = rng(321), cs = ['#ff8fa3', '#7fb8ff', '#ffd25c', '#7fe0b5', '#c89aff', '#ff9b4a', '#f4f0f8']; for (const y of [3, 12, 21]) { let x = 4; while (x < 27) { const w = 2 + (R() * 2 | 0), h = 6 + (R() * 2 | 0); if (x + w > 28) break; A.r(x, y + 8 - h, w, h, cs[(R() * cs.length) | 0]); A.p(x, y + 8 - h, '#ffffff'); x += w + (R() < .2 ? 1 : 0); } A.r(3, y + 8, 26, 2, C.wood); } A.r(1, 1, 30, 1, C.woodL); }],
  kitchenSet: [48, 28, A => { A.r(0, 0, 48, 9, '#f4f0f8'); for (let x = 0; x < 48; x += 4) A.r(x, 0, 1, 9, '#d9d0e2'); A.r(0, 4, 48, 1, '#d9d0e2'); A.r(0, 10, 48, 17, '#e8e2d8'); A.r(0, 8, 48, 4, '#bab5cb'); A.r(0, 8, 48, 1, '#d9d0e2');
    for (const x of [1, 17, 33]) { A.r(x, 14, 14, 11, '#d8cfc2'); A.r(x + 6, 18, 2, 2, C.woodD); } A.r(5, 8, 11, 4, '#8fd0f0'); A.r(5, 8, 11, 1, '#5b9bd0'); A.line(10, 7, 10, 3, '#a29db6'); A.line(10, 3, 13, 3, '#a29db6'); A.r(19, 8, 8, 3, C.woodL); A.r(21, 8, 3, 1, '#ff9b4a'); A.p(24, 8, C.leaf);
    A.r(30, 8, 14, 4, '#3a3340'); A.e(34, 10, 2.2, 1.1, '#ff8a3d'); A.e(40, 10, 2.2, 1.1, '#ff8a3d'); A.e(40, 7, 3, 1.6, '#8e89a3'); A.r(37, 5, 6, 2, '#a29db6'); A.r(0, 26, 48, 2, '#bab5cb'); }],
  fountainBig: [32, 34, A => { A.e(16, 25, 15.5, 8.5, '#6f6a86'); A.e(16, 24, 15, 8, '#8e89a3'); A.e(16, 24, 12, 6, '#3a78b0'); A.e(13, 22.5, 6, 2, '#5b9bd0'); A.p(9, 24, '#bfe6ff'); A.p(22, 26, '#bfe6ff'); A.r(14, 9, 4, 15, '#a29db6'); A.r(14, 9, 1, 15, '#bab5cb'); A.e(16, 10, 7, 3, '#8e89a3'); A.e(16, 9.5, 5.5, 2, '#5b9bd0'); A.e(16, 5, 2, 3, '#bfe6ff'); A.p(16, 2, '#ffffff'); A.line(10, 11, 8, 20, '#bfe6ff'); A.line(22, 11, 24, 20, '#bfe6ff'); }],
  rugBig: [32, 32, A => { A.r(2, 1, 28, 30, '#d9607d'); A.r(1, 2, 30, 28, '#d9607d'); A.r(4, 4, 24, 24, '#f49ab8'); for (let k = 3; k < 29; k += 3) { A.p(k, 2, '#ffd0de'); A.p(k, 29, '#ffd0de'); A.p(2, k, '#ffd0de'); A.p(29, k, '#ffd0de'); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; A.e(16 + Math.cos(a) * 5, 16 + Math.sin(a) * 5, 2.6, 2.6, '#ffffff'); } A.e(16, 16, 3.4, 3.4, '#ffd25c'); A.p(15, 15, '#fff1b0'); for (const [x, y] of [[7, 7], [25, 7], [7, 25], [25, 25]]) { A.e(x, y, 1.6, 1.6, '#ffd25c'); A.p(x - 2, y, C.leaf); A.p(x + 2, y, C.leaf); } }],
  rugLong: [48, 32, A => { A.r(2, 2, 44, 28, '#6fa8ff'); for (let y = 4; y < 28; y += 6) { A.r(2, y, 44, 2, '#c2dcff'); A.r(2, y + 2, 44, 1, '#4a78d0'); } A.r(2, 2, 44, 1, '#4a78d0'); A.r(2, 29, 44, 1, '#4a78d0'); for (let y = 3; y < 30; y += 2) { A.p(0, y, '#f4f0f8'); A.p(1, y, '#e3d4ff'); A.p(46, y, '#e3d4ff'); A.p(47, y, '#f4f0f8'); } }],
  rugRound: [48, 48, A => { for (const [r, c] of [[23, '#b8742a'], [20, '#e8a33a'], [16.5, '#d9774a'], [13, '#f2b83a'], [9.5, '#e8915f'], [6, '#ffd98a'], [2.5, '#e8a33a']]) A.e(24, 24, r, r, c); for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; A.p(24 + Math.cos(a) * 18.3 | 0, 24 + Math.sin(a) * 18.3 | 0, '#fff1d6'); } }],
  bigTree: [32, 52, A => { A.poly([[6, 51], [12, 40], [20, 40], [26, 51]], C.woodD); A.r(11, 26, 10, 22, C.wood); A.r(11, 26, 3, 22, C.woodL); A.line(16, 30, 16, 46, C.woodD); A.line(19, 34, 19, 44, C.woodD); A.e(16, 48, 9, 2.6, '#4a3428');
    A.e(16, 18, 15.5, 14, '#2f6e33'); A.e(15, 16, 14, 12, C.leafD); A.e(10, 13, 8, 7, C.leaf); A.e(21, 12, 8, 7, C.leaf); A.e(15, 7, 8, 5.5, C.leaf); A.e(9, 10, 3, 2, C.leafL); A.e(19, 6, 3, 1.8, C.leafL); A.e(24, 15, 2.4, 1.6, C.leafL); for (const [x, y] of [[6, 18], [25, 21], [14, 23], [20, 9]]) A.p(x, y, '#ffd36b'); }],
  bigRock: [32, 22, A => { A.e(16, 15, 15.5, 7, '#57507a'); A.e(15, 13, 14, 8, '#8e89a3'); A.e(19, 15, 8, 4, '#7f7a92'); A.e(11, 9, 6, 3, '#a29db6'); A.p(9, 8, '#bab5cb'); A.e(22, 7.5, 5.5, 2.2, '#62ad62'); A.e(21, 7, 3, 1.2, '#7cc271'); A.e(7, 16, 3, 1.4, '#62ad62'); A.p(25, 12, '#6f6a86'); A.p(13, 17, '#6f6a86'); }],
  flowerField: [48, 32, A => { A.r(1, 1, 46, 30, '#4f8f57'); A.r(0, 3, 48, 26, '#4f8f57'); for (let k = 0; k < 40; k++) { const R = rng(900 + k); A.p(R() * 46 | 0, R() * 30 | 0, '#62ad62'); } flowerDots(A, 48, 32, 77); }],
  pondBig: [32, 32, A => { A.e(16, 16, 15.5, 14.5, '#6f6a86'); A.e(16, 16, 14.5, 13.5, '#8e89a3'); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; A.e(16 + Math.cos(a) * 13.5, 16 + Math.sin(a) * 12.5, 2.2, 1.8, k % 2 ? '#a29db6' : '#8e89a3'); } A.e(16, 16, 11.5, 10.5, '#3a78b0'); A.r(9, 12, 6, 1, '#5b9bd0'); A.r(17, 20, 7, 1, '#5b9bd0'); A.e(11, 19, 3.4, 2.2, '#4f9a5e'); A.e(21, 12, 3, 2, '#4f9a5e'); A.e(21, 11, 1.4, 1.1, '#ffb3c6'); A.p(21, 10, '#ffe0ea'); A.p(14, 14, '#bfe6ff'); }],
  treeFarm: farmSpr(0), treeFarm1: farmSpr(1), treeFarm2: farmSpr(2), treeFarm3: farmSpr(3),
  quarry: quarrySpr(0), quarry1: quarrySpr(1), quarry2: quarrySpr(2), quarry3: quarrySpr(3),
  ...Object.fromEntries([['pitCu', C.copper, C.copperL], ['pitFe', C.iron, '#ffffff'], ['pitGold', '#ffd25c', '#fff1b0']].flatMap(([k, c1, c2]) => [0, 1, 2, 3].map(st => [k + (st || ''), quarrySpr(st, c1, c2)]))),
  chairS: [16, 16, A => { A.r(4, 2, 2, 10, C.wood); A.r(4, 2, 2, 1, C.woodL); A.r(4, 9, 9, 3, C.woodL); A.r(6, 9, 7, 2, '#f2a1b6'); A.p(7, 9, '#ffd1dd'); A.r(4, 11, 9, 1, C.woodD); A.r(4, 12, 1, 3, C.woodD); A.r(12, 12, 1, 3, C.woodD); }],
  chairU: [16, 16, A => { A.r(4, 12, 1, 3, C.woodD); A.r(11, 12, 1, 3, C.woodD); A.r(3, 9, 10, 3, C.woodL); A.r(4, 2, 8, 9, C.wood); A.r(4, 2, 8, 2, C.woodL); A.r(6, 4, 1, 6, C.woodD); A.r(9, 4, 1, 6, C.woodD); A.r(3, 11, 10, 1, C.woodD); }],
  cryChairS: [16, 16, A => { A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); A.poly([[3, 10], [4, 2], [7, 1], [7, 10]], C.cry); A.poly([[3, 10], [4, 2], [5, 2], [5, 10]], C.cryL); A.r(4, 9, 9, 3, C.iron); A.r(4, 9, 9, 1, C.ironL); A.r(6, 10, 6, 1, '#d9c8ff'); }],
  cryChairU: [16, 16, A => { A.r(4, 11, 1, 4, C.ironD); A.r(11, 11, 1, 4, C.ironD); A.r(3, 9, 10, 3, C.iron); A.poly([[4, 12], [5, 3], [8, 1], [11, 3], [12, 12]], C.cryD); A.poly([[5, 11], [6, 4], [8, 2.5], [10, 4], [11, 11]], C.cry); A.p(8, 5, C.cryL); }],
  mossSofaS: [16, 16, A => { A.r(2, 8, 12, 6, C.woodD); A.r(2, 2, 4, 11, '#6fae5f'); A.r(2, 2, 4, 1, '#8fd07a'); A.r(5, 8, 9, 4, '#7dbd6b'); A.r(5, 8, 9, 1, '#a5dc8a'); A.r(2, 13, 1, 2, C.woodD); A.r(13, 13, 1, 2, C.woodD); A.p(3, 4, '#ffd36b'); }],
  mossSofaU: [16, 16, A => { A.r(1, 5, 14, 9, C.woodD); A.r(2, 9, 12, 3, '#7dbd6b'); A.r(1, 3, 14, 9, '#5e9a50'); A.r(1, 3, 14, 1, '#8fd07a'); A.r(4, 5, 8, 5, '#6fae5f'); A.r(1, 7, 2, 6, '#4e8a42'); A.r(13, 7, 2, 6, '#4e8a42'); A.r(2, 13, 1, 2, C.woodD); A.r(13, 13, 1, 2, C.woodD); }],
});

// ---- 농사·요리 (features/farming-cooking.js) ----
Object.assign(ICON, {
  sickle: sickleIcon(C.copper, C.copperL),
  wcan: A => { A.e(7, 5.6, 3.4, 2.6, C.copperD); A.g.globalCompositeOperation = 'destination-out'; A.e(7, 5.8, 1.9, 1.3, '#000'); A.g.globalCompositeOperation = 'source-over'; A.line(10, 11, 14, 5, C.copperD, 2); A.r(13, 3, 3, 2, C.copperL);
    A.r(2, 7, 9, 7, C.copper); A.r(2, 7, 9, 1, C.copperL); A.r(2, 13, 9, 1, C.copperD); A.r(3, 9, 1, 3, C.copperL); A.p(15, 6, '#bfe6ff'); A.p(15, 8, '#8fd0f0'); },
  fert: A => { A.e(8, 10.5, 5.4, 4.6, '#b8903f'); A.e(7, 9.6, 3.8, 3.2, '#d9b66a'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#c9a46b'); A.r(5, 6, 6, 1, '#7a5a2a'); A.p(7, 3, '#ecd8a8'); A.e(8.5, 11, 2.2, 1.6, '#62ad62'); A.p(7, 10, '#9be37a'); A.p(10, 13, '#5a3a2c'); A.p(5, 12, '#5a3a2c'); },
  fertShroom: A => { A.e(8, 10.5, 5.4, 4.6, '#7a5aa0'); A.e(7, 9.6, 3.8, 3.2, '#a17fc9'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#8e6fb0'); A.r(5, 6, 6, 1, '#4a3468'); A.p(7, 3, '#cdb8ea'); A.r(7, 10, 2, 3, C.cream); A.e(8, 9.6, 2.6, 1.6, '#e36b6b'); A.p(7, 9, '#ffd6d6'); },
});
export const starMark = A => { A.p(12, 1, '#fff1b0'); A.p(11, 2, '#ffd25c'); A.p(12, 2, '#ffffff'); A.p(13, 2, '#ffd25c'); A.p(12, 3, '#ffd25c'); A.p(14, 4, '#fff1b0'); };
Object.assign(ICON, {
  glowSpore: packet('#ecd6a8', A => { A.e(8, 8, 2.6, 1.6, C.glow); A.r(7, 9, 2, 2, '#e8f7f2'); A.p(7, 7, C.glowL); }),
  cbeanSeed: packet('#ecd6a8', A => { A.e(6.5, 9, 1.4, 1.8, C.cry); A.e(9.5, 8, 1.4, 1.8, C.cryL); A.p(9, 7, '#ffffff'); }),
  cbean: A => { A.poly([[3, 12], [6, 5], [12, 3], [13, 5], [9, 11]], C.leaf); A.line(4, 12, 12, 4, C.leafD); for (const [x, y] of [[6, 9], [8, 7], [10, 5]]) { A.e(x + .5, y + .5, 1.6, 1.6, C.cry); A.p(x, y, C.cryL); } A.p(10, 4, '#ffffff'); },
  berryS: A => { ICON.berry(A); starMark(A); }, mushroomS: A => { ICON.mushroom(A); starMark(A); }, glowcapS: A => { ICON.glowcap(A); starMark(A); }, cbeanS: A => { ICON.cbean(A); starMark(A); },
  fertCry: A => { A.e(8, 10.5, 5.4, 4.6, '#6a62b8'); A.e(7, 9.6, 3.8, 3.2, '#a99cf0'); A.poly([[5, 6], [6, 2.5], [10, 2.5], [11, 6]], '#8e84d8'); A.r(5, 6, 6, 1, '#3a3270'); A.p(7, 3, '#e3d4ff'); A.poly([[8, 8], [10, 11], [8, 14], [6, 11]], C.cry); A.p(7, 10, C.cryL); },
});
// 숨은 방 장식 그림 [가로, 세로, 그리기] (구조 변경 3단계: data/farming-cooking.js의 ROOM_DECO_DEF 표에서 떼어 냄)
export const ROOM_DECO_SPR = {
  mossLantern: [16, 22, A => { A.r(4, 19, 8, 2, '#6f6a86'); A.r(5, 18, 6, 1, '#8e89a3'); A.r(6, 12, 4, 6, '#8e89a3'); A.r(6, 12, 1, 6, '#a29db6'); A.r(3, 6, 10, 6, '#8e89a3'); A.r(3, 6, 10, 1, '#a29db6'); A.r(5, 8, 6, 3, '#ffd27a'); A.p(6, 8, '#fff1c0'); A.r(5, 11, 6, 1, '#6f6a86');
    A.poly([[1, 6], [8, 1], [15, 6]], '#6f6a86'); A.e(8, 3.6, 3.4, 1.3, '#62ad62'); A.p(3, 5, '#7cc271'); A.p(12, 5, '#62ad62'); A.p(6, 18, '#62ad62'); A.p(10, 19, '#7cc271'); }],
  sporeChime: [16, 22, A => { A.e(8, 21, 4, 1, '#7a5aa0'); A.r(7, 5, 2, 16, C.woodD); A.r(7, 5, 1, 16, C.wood); A.r(2, 4, 12, 2, C.wood); A.r(2, 4, 12, 1, C.woodL);
    for (const [x, l, c] of [[3, 5, '#b673de'], [8, 0, null], [13, 4, '#d59bff']]) { if (!c) continue; A.line(x, 6, x, 6 + l, '#e8d8c0'); A.e(x, 7.5 + l, 1.8, 1.3, c); A.p(x, 7 + l, '#fbe7ff'); } A.line(10, 6, 10, 12, '#e8d8c0'); A.e(10, 13.5, 1.6, 1.2, '#c79ae8'); A.p(10, 13, '#fbe7ff'); }],
  cryVase: [16, 18, A => { A.e(8, 13.5, 4.4, 3.8, '#4a4290'); A.e(8, 13, 4, 3.4, '#6a62b8'); A.e(6.6, 12, 1.6, 2, '#a99cf0'); A.r(6, 7, 4, 3, '#6a62b8'); A.r(5, 7, 6, 1, '#a99cf0');
    A.poly([[5, 8], [3, 2], [7, 7]], C.cry); A.poly([[7, 7], [8, 0], [10, 7]], C.cryL); A.poly([[9, 8], [13, 3], [11, 8]], C.cry); A.p(8, 2, '#ffffff'); A.p(4, 4, C.cryL); }],
  emberBowl: [16, 16, A => { A.line(4, 11, 3, 15, '#2a2238'); A.line(12, 11, 13, 15, '#2a2238'); A.line(8, 12, 8, 15, '#2a2238'); A.e(8, 10.5, 6, 2.8, '#2a2238'); A.e(8, 9.6, 5.2, 1.8, '#4a3f5c'); A.p(4, 10, '#8a7aa6');
    A.e(8, 7, 3.2, 3, '#ff8a3d'); A.e(8, 6.2, 2.2, 2.6, '#ffc861'); A.p(8, 3, '#fff1b0'); A.p(6, 5, '#ffe0a0'); A.p(10, 6, '#ff8a3d'); }],
  iceSwan: [16, 16, A => { A.e(8, 14, 6.4, 1.6, '#9ab0c8'); A.e(9, 11, 5, 2.8, '#d8e8f5'); A.e(10, 10, 3.2, 1.6, '#ffffff'); A.p(12, 9, '#9fd8f0'); A.line(5, 11, 4, 5, '#e8f8ff', 2); A.e(4.6, 4, 1.8, 1.4, '#ffffff'); A.p(2, 4, '#9fd8f0'); A.p(4, 3, '#5a88b0'); }],
};
for (const id in ROOM_DECO_SPR) OSPR[id] = ROOM_DECO_SPR[id];
Object.assign(OSPR, {
  tchest: [16, 16, A => { A.r(2, 6, 12, 8, '#8a5a34'); A.r(2, 3, 12, 4, '#a86a3c'); A.r(2, 3, 12, 1, '#d09058'); A.r(2, 6, 12, 1, '#6a4428'); A.r(4, 3, 1, 11, '#ffd25c'); A.r(11, 3, 1, 11, '#ffd25c'); A.r(2, 8, 12, 1, '#e8a33a');
    A.r(7, 7, 2, 3, '#ffd25c'); A.p(7, 8, '#7a4a1a'); A.r(2, 13, 12, 1, '#5a3a24'); A.p(4, 3, '#fff1b0'); A.p(13, 2, '#fff1b0'); }],
  tchestOpen: [16, 16, A => { A.r(2, 0, 12, 4, '#a86a3c'); A.r(2, 0, 12, 1, '#d09058'); A.r(4, 0, 1, 4, '#ffd25c'); A.r(11, 0, 1, 4, '#ffd25c'); A.r(2, 4, 12, 2, '#2a1a14'); A.r(2, 6, 12, 8, '#8a5a34'); A.r(2, 6, 12, 1, '#b8784a');
    A.r(4, 6, 1, 8, '#ffd25c'); A.r(11, 6, 1, 8, '#ffd25c'); A.r(2, 8, 12, 1, '#e8a33a'); A.r(2, 13, 12, 1, '#5a3a24'); }],
});
export const dishIcon = (shape, c) => A => {
  const [a, b, d] = c;
  if (shape === 'bowl') { A.e(8, 10.6, 6.2, 3.8, '#e8e0d0'); A.e(8, 9.4, 5.6, 2, a); A.p(6, 9, b); A.p(10, 10, b); A.p(8, 9, d || b); A.r(2, 9, 12, 1, '#ffffff'); A.r(6, 14, 4, 1, '#c9c0b0'); A.p(6, 6, '#ffffff'); A.p(9, 5, '#ffffff'); A.p(7, 4, '#e8e0f0'); }
  else if (shape === 'plate') { A.e(8, 12, 7, 2.6, '#c9c0d6'); A.e(8, 11.4, 6, 1.8, '#ffffff'); A.e(8, 9.4, 4.4, 2.4, a); A.p(6, 8, '#ffffff'); A.p(10, 8, b); A.p(7, 10, b); A.p(11, 10, b); }
  else if (shape === 'skewer') { A.line(2, 15, 14, 2, C.woodL); A.e(5.4, 11.4, 2.2, 2.2, a); A.e(8.4, 8.2, 2.2, 2.2, b); A.e(11.2, 5.2, 2, 2, a); A.p(5, 10, '#ffffff'); A.p(8, 7, '#ffffff'); }
  else if (shape === 'dango') { A.line(8, 15, 8, 1, C.woodL); A.e(8, 4, 2.8, 2.4, c[0]); A.e(8, 8.2, 2.8, 2.4, c[1]); A.e(8, 12.2, 2.8, 2.4, c[2]); A.p(7, 3, '#ffffff'); A.p(7, 7, '#ffffff'); A.p(7, 11, '#ffffff'); }
  else if (shape === 'cup') { A.e(13, 9.4, 2, 2.4, '#f4f0f8'); A.e(13, 9.4, 1, 1.4, '#1b142600'); A.r(4, 6, 8, 8, '#f4f0f8'); A.r(4, 6, 8, 1, '#ffffff'); A.r(5, 7, 6, 2, a); A.r(4, 13, 8, 1, '#c9c0d6'); A.p(7, 3, b); A.p(9, 4, b); A.e(8, 8, 1.2, .6, '#ffffff'); }
  else if (shape === 'cake') { A.e(8, 11.4, 6.6, 3.4, '#c99560'); A.e(8, 10.2, 6.2, 2.8, a); for (const [x, y] of [[5, 10], [8, 9], [11, 10], [7, 11]]) A.p(x, y, b); A.p(6, 9, '#ffffff'); }
  else { A.e(8, 14, 6, 1.2, '#e8e0f0'); A.e(8, 10, 5.4, 4.4, a); A.e(6.4, 8.2, 1.8, 1.4, '#ffffff'); A.p(10, 11, b); A.p(9, 6, b); } };
for (const d of DISHES) ICON[d[0]] = dishIcon(d[4], d[5]);
// recipe notes: picking one up teaches the dish (they never stay in the bag)
export const noteIcon = A => { A.r(3, 2, 10, 12, '#f3e7c8'); A.r(3, 2, 10, 1, '#d8c79c'); A.r(3, 13, 10, 1, '#d8c79c'); for (const y of [5, 7, 9]) A.r(5, y, y === 7 ? 5 : 6, 1, '#b8a47a'); A.e(11, 11.5, 1.8, 1.8, '#e36b6b'); A.p(11, 11, '#ff9ab0'); };
for (const d of DISHES) ICON['rn_' + d[0]] = noteIcon;
for (const r of RECIPES) if (r.star && r.at === 'pot' && r.cat === 'food' && ITEMS[r.out].base) ICON[r.out] = (f => A => { f(A); starMark(A); })(ICON[ITEMS[r.out].base]);
ICON.anyPetal = A => { A.e(6, 8, 3.4, 2.6, '#f7b8cf'); A.e(10, 9, 3.2, 2.6, '#ffd25c'); A.e(8, 6, 2.6, 2.2, '#6fa8ff'); A.p(8, 8, '#ffffff'); };
ICON.bottle = A => { A.r(6, 2, 4, 3, '#c9a46b'); A.e(8, 10, 4.4, 5, '#9fd8f0'); A.e(8, 10, 3.6, 4.2, '#c8eefc'); A.r(6, 8, 4, 4, '#f3e7c8'); A.r(7, 9, 2, 1, '#b8a47a'); A.p(6, 6, '#ffffff'); };

// ---- 장비·동물 (features/gear-animals.js) ----
Object.assign(ICON, {
  fireSeed: packet('#ecd6a8', A => { A.e(8, 9, 2.2, 2.2, '#ff8a3d'); A.p(7, 8, '#ffd25c'); A.p(9, 6, C.leaf); }),
  radishSeed: packet('#ecd6a8', A => { A.e(8, 9, 2.2, 2.2, '#e8f8ff'); A.p(7, 8, '#ffffff'); A.p(9, 6, '#9fd8f0'); }),
  radish: A => { A.e(8, 10, 3.6, 4.4, '#e8f8ff'); A.e(7, 9, 2, 2.6, '#ffffff'); A.line(8, 14, 9, 15, '#c8e6f5'); A.p(10, 11, '#bfe6ff'); A.e(6, 4, 1.6, 2.6, '#7fc0e0'); A.e(10, 4, 1.6, 2.6, '#9fd8f0'); A.e(8, 3, 1.4, 2.4, '#bfe6ff'); },
  fireBerryS: A => { ICON.fireBerry(A); starMark(A); }, radishS: A => { ICON.radish(A); starMark(A); },
});
Object.assign(ICON, {
  obsCoat: A => { A.poly([[4, 3], [12, 3], [14, 14], [2, 14]], '#3a2f52'); A.poly([[5, 3], [11, 3], [12.5, 13], [3.5, 13]], '#5a4a78'); A.r(7, 3, 2, 11, '#2a2238'); A.p(6, 6, '#8a7ab0'); A.p(6, 9, '#8a7ab0'); A.r(4, 2, 8, 2, '#8a7ab0'); A.p(10, 5, '#b99bff'); },
  frostRobe: A => { A.poly([[5, 2], [11, 2], [14, 14], [2, 14]], '#5a9ac8'); A.poly([[6, 2], [10, 2], [12.5, 13], [3.5, 13]], '#8fd0f0'); A.r(7, 2, 2, 12, '#d8f2ff'); A.p(5, 8, '#ffffff'); A.p(11, 10, '#ffffff'); A.r(3, 12, 10, 1, '#d8f2ff'); },
  turtleCharm: A => { A.line(8, 1, 8, 4, '#c9a46b'); A.e(8, 9, 5, 4.6, '#2f6e33'); A.e(8, 8.6, 4, 3.6, '#ff8a3d'); for (const [x, y] of [[6, 7], [10, 7], [8, 10]]) A.e(x, y, 1.3, 1.1, '#c4441a'); A.p(7, 6, '#ffd25c'); },
  snowBrooch: A => { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; A.line(8, 8, 8 + Math.cos(a) * 5.4, 8 + Math.sin(a) * 5.4, '#9fd8f0'); } A.e(8, 8, 2.2, 2.2, '#ffffff'); A.p(8, 8, '#7fc0e0'); },
});
OSPR.smelter = [16, 22, A => { A.r(2, 9, 12, 12, '#5a5468'); A.r(2, 9, 12, 2, '#8d97a8'); A.r(2, 9, 1, 12, '#787090'); A.r(13, 9, 1, 12, '#36334a'); for (const [x, y] of [[4, 13], [9, 12], [6, 17], [11, 16]]) A.r(x, y, 2, 1, '#46405a');
  A.r(5, 3, 6, 7, '#46405a'); A.r(5, 3, 6, 1, '#8d97a8'); A.r(6, 1, 4, 2, '#36334a'); A.r(5, 14, 6, 5, '#2a1810'); A.e(8, 16.5, 2.4, 1.8, '#ff8a3d'); A.e(8, 17, 1.4, 1, '#ffe08a'); A.r(3, 20, 10, 1, '#24222e'); A.p(4, 11, '#ffd25c'); }];
for (const id in RINGS) { const [, , , , , , band, gem] = RINGS[id];
  ICON[id] = A => { A.e(8, 10, 5.2, 4.6, band); A.e(8, 10.4, 3.4, 2.8, 'rgba(0,0,0,0)'); A.g.globalCompositeOperation = 'destination-out'; A.e(8, 10.6, 3.2, 2.6, '#000'); A.g.globalCompositeOperation = 'source-over'; A.p(5, 8, '#ffffff'); A.poly([[8, 1.5], [11, 4.5], [8, 7.5], [5, 4.5]], gem); A.p(7, 3, '#ffffff'); }; }
ICON.lasso = A => { A.e(10, 6, 4.4, 4, '#b8903f'); A.e(10, 6, 3, 2.6, 'rgba(0,0,0,0)'); A.g.globalCompositeOperation = 'destination-out'; A.e(10, 6, 3, 2.6, '#000'); A.g.globalCompositeOperation = 'source-over'; A.e(5, 12, 3.6, 2.6, '#d9b66a'); A.e(5, 12, 2.2, 1.4, '#b8903f'); A.line(7, 9, 8, 10, '#b8903f', 2); A.p(9, 3, '#f0d898'); A.p(13, 5, '#f0d898'); };
export const ANIM_DRAW = {
    dog: A => { A.r(3, 8, 9, 5, '#c98a5a'); A.r(3, 8, 9, 1, '#e0a878'); A.r(10, 4, 5, 5, '#c98a5a'); A.r(10, 4, 5, 1, '#e0a878'); A.r(9, 4, 2, 4, '#8a5a3e'); A.r(13, 7, 3, 2, '#fff1d6'); A.p(15, 7, INK); A.p(12, 5, INK); A.r(4, 13, 2, 2, '#8a5a3e'); A.r(9, 13, 2, 2, '#8a5a3e'); A.line(3, 9, 1, 6, '#c98a5a', 2); A.r(5, 10, 3, 2, '#fff1d6'); },
    rabbit: A => { A.e(7, 10.5, 4.5, 3.4, '#f4f0f8'); A.e(11.5, 8, 3, 2.8, '#f4f0f8'); A.r(10, 1, 2, 6, '#f4f0f8'); A.r(12, 2, 2, 5, '#e8e2f0'); A.p(10.5, 3, '#ff9ab0'); A.p(10, 4, '#ff9ab0'); A.p(13, 7, INK); A.p(14, 9, '#ff8fa3'); A.e(2.6, 10, 1.6, 1.5, '#ffffff'); A.r(5, 13, 3, 1, '#d9d2e6'); A.r(9, 13, 3, 1, '#d9d2e6'); },
    cat: A => { A.r(3, 8, 8, 5, '#f0a860'); A.r(3, 8, 8, 1, '#ffc88a'); A.e(12, 7, 3.4, 3.2, '#f0a860'); A.poly([[9, 5], [10, 1.5], [11.5, 4.5]], '#f0a860'); A.poly([[12.5, 4.5], [14, 1.5], [15, 5]], '#f0a860'); A.p(10, 3, '#ff9ab0'); A.p(14, 3, '#ff9ab0'); A.p(11, 7, INK); A.p(14, 7, INK); A.p(12, 8, '#ff8fa3');
      for (const x of [4, 7]) A.r(x, 9, 1, 3, '#d9884a'); A.r(4, 13, 2, 2, '#d9884a'); A.r(9, 13, 2, 2, '#d9884a'); A.line(3, 10, 1, 4, '#f0a860', 2); A.p(1, 4, '#ffc88a'); },
  cow: A => { A.r(2, 6, 10, 6, '#f4f0f0'); A.r(2, 6, 10, 1, '#ffffff'); A.r(4, 7, 3, 3, '#3a3340'); A.r(8, 9, 3, 2, '#3a3340'); A.r(11, 4, 4, 6, '#f4f0f0'); A.r(10, 4, 1, 2, '#3a3340'); A.r(12, 8, 4, 3, '#f7b8c8'); A.p(13, 9, '#d9607d'); A.p(15, 9, '#d9607d'); A.p(13, 6, INK); A.p(11, 2, '#e8d8b0'); A.p(14, 2, '#e8d8b0'); A.r(11, 3, 4, 1, '#e8d8b0');
    for (const x of [3, 5, 8, 10]) A.r(x, 12, 1, 3, '#d9d2e6'); A.r(3, 14, 1, 1, '#3a3340'); A.r(10, 14, 1, 1, '#3a3340'); A.line(2, 7, 1, 11, '#d9d2e6'); A.p(1, 12, '#3a3340'); A.r(6, 11, 2, 1, '#f7b8c8'); },
  chicken: A => { A.e(7, 10, 4.4, 3.4, '#ffffff'); A.e(6, 9, 2.6, 1.6, '#f0ecf4'); A.e(11, 6.5, 2.4, 2.4, '#ffffff'); A.r(10, 3, 3, 2, '#ff5a5a'); A.p(11, 2, '#ff5a5a'); A.r(13, 6, 2, 1, '#ffc23a'); A.p(11, 9, '#ff5a5a'); A.p(12, 6, INK); A.poly([[2, 7], [4, 9], [2.5, 11]], '#e8e2f0'); A.r(6, 13, 1, 2, '#ffa53a'); A.r(9, 13, 1, 2, '#ffa53a'); },
  sheep: A => { for (const [x, y] of [[4, 8], [7, 7], [10, 8], [5, 11], [9, 11], [3, 10], [11, 10]]) A.e(x, y, 2.6, 2.4, '#fff4e0'); A.e(7, 9.5, 4.8, 3.2, '#fff4e0'); for (const [x, y] of [[5, 7], [9, 8], [6, 11]]) A.p(x, y, '#ffffff'); A.e(13, 7.5, 2.2, 2.4, '#5a4a52'); A.p(14, 7, '#fff4e0'); A.r(11, 6, 2, 1, '#5a4a52');
    for (const x of [4, 6, 9, 11]) A.r(x, 12, 1, 3, '#5a4a52'); },
};
for (const k of ['cow', 'chicken', 'sheep']) OSPR[k] = [16, 16, ANIM_DRAW[k]];
OSPR.woolRug = [16, 16, A => { A.r(1, 2, 14, 12, '#e8dcc4'); A.r(2, 3, 12, 10, '#fff4e0'); for (let y = 4; y < 12; y += 3) for (let x = 3 + (y % 2); x < 13; x += 3) A.p(x, y, '#e8dcc4'); A.r(1, 13, 14, 1, '#c9b89a'); for (const x of [1, 4, 7, 10, 13]) A.p(x, 14, '#c9b89a'); }];
Object.assign(ICON, {
  milk: A => { A.r(5, 4, 6, 10, '#f4f0f8'); A.r(5, 4, 6, 1, '#ffffff'); A.r(6, 2, 4, 2, '#c8d0dc'); A.r(5, 8, 6, 3, '#7fb8ff'); A.r(6, 9, 4, 1, '#bfe0ff'); A.r(10, 4, 1, 10, '#d9d2e6'); },
  egg: A => { A.e(8, 9, 4.4, 5.4, '#fff4e0'); A.e(7, 7.4, 1.6, 2.2, '#ffffff'); A.e(9.5, 11.5, 2, 1.4, '#efe2c8'); },
  wool: A => { for (const [x, y] of [[5, 9], [8, 7], [11, 9], [7, 11], [10, 11]]) A.e(x, y, 3, 2.8, '#fff4e0'); A.p(6, 7, '#ffffff'); A.p(9, 6, '#ffffff'); A.e(8, 10, 2, 1.4, '#efe2c8'); },
  friedEgg: A => { A.e(8, 9, 6.4, 4.6, '#ffffff'); A.e(6, 7.6, 2, 1.2, '#f4f0f8'); A.e(9, 9, 2.6, 2.2, '#ffc23a'); A.p(8, 8, '#fff1b0'); },
  pancake: A => { A.e(8, 12, 6.6, 2.4, '#d9d2e6'); for (const y of [10, 8, 6]) { A.e(8, y, 5.4, 2, '#d9944a'); A.e(8, y - .6, 4.8, 1.3, '#f0b870'); } A.e(8, 4.6, 2.4, 1.2, '#fff4e0'); A.p(6, 4, '#ff7aa2'); A.p(10, 4, '#ff7aa2'); A.p(8, 3, '#ff7aa2'); },
  woolHat: A => { A.e(8, 10, 6, 4.4, '#ff8fa3'); A.r(2, 10, 12, 3, '#d9607d'); for (const x of [3, 6, 9, 12]) A.p(x, 11, '#ffb3c6'); A.e(8, 4, 2.2, 2.2, '#fff4e0'); A.p(7, 3, '#ffffff'); A.p(6, 8, '#ffb3c6'); },
});

// ---- 깊은 동굴 (features/deep-survival.js) ----
for (const d of DEEP_DISHES) { const id = d[0]; ICON[id] = dishIcon(d[4], d[5]); ICON['rn_' + id] = noteIcon; if (d[6].some(([m]) => STAR_OF[m])) ICON[id + 'S'] = (f => A => { f(A); starMark(A); })(ICON[id]); }
ICON.homeStone = A => { A.e(8, 9, 5.4, 5.8, '#4a4290'); A.e(8, 8.6, 4.6, 5, '#6a62b8'); A.e(7, 7, 2.4, 2.6, '#a99cf0'); A.e(8, 9, 2, 2, '#ffd27a'); A.p(8, 8, '#fff1c0'); A.p(5, 5, '#e3d4ff'); A.p(11, 12, '#3a3270'); };
OSPR.lostBag = [16, 16, A => { A.e(8, 13.5, 5, 1.4, 'rgba(0,0,0,.25)'); A.e(8, 10, 5, 4, '#b8903f'); A.e(7, 9, 3.4, 2.6, '#d9b66a'); A.poly([[5, 7], [6, 3.5], [10, 3.5], [11, 7]], '#c9a46b'); A.r(5, 6, 6, 1, '#7a5a2a'); A.p(12, 3, '#fff1b0'); A.p(13, 2, '#ffffff'); A.p(3, 5, '#fff1b0'); }];
OSPR.icePillar = [16, 26, A => { A.e(8, 24.5, 5.4, 1.6, '#7ab8d8'); A.r(4, 6, 8, 18, '#9fd8f0'); A.r(4, 6, 3, 18, '#d8f2ff'); A.r(11, 6, 1, 18, '#6a9cc8'); A.poly([[4, 6], [8, 1], [12, 6]], '#e8f8ff'); A.p(6, 10, '#ffffff'); A.p(9, 16, '#ffffff'); A.line(7, 13, 10, 18, '#bfe6ff'); }];
export function bossExtraSprites() {
  const crack = src => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.hd = src.hd; const g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-atop'; const w = c.width, h = c.height;
    const pts = [[.28, .42], [.38, .3], [.47, .46], [.56, .32], [.66, .48], [.74, .36]]; g.fillStyle = '#ff6a2a'; for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; const n = 12; for (let j = 0; j <= n; j++) g.fillRect(Math.round((x0 + (x1 - x0) * j / n) * w), Math.round((y0 + (y1 - y0) * j / n) * h), 1, 1); }
    g.fillStyle = '#ffd25c'; for (const [x, y] of pts) g.fillRect(Math.round(x * w), Math.round(y * h), 1, 1); return c; };
  const alpha = (src, a) => { const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.hd = src.hd; const g = c.getContext('2d'); g.globalAlpha = a; g.drawImage(src, 0, 0); return c; };
  SPR.turtleC = crack(SPR.turtle); SPR.turtleCW = whiten(SPR.turtleC); SPR.turtleSC = crack(SPR.turtleS); SPR.turtleSCW = whiten(SPR.turtleSC);
  SPR.spiritClone = alpha(SPR.spirit, .5); SPR.spiritCloneW = alpha(whiten(SPR.spirit), .7); }


// ---- 자동화·축제 (features/automation-tiers.js) ----
Object.assign(OSPR, {
  sprinkler: [16, 18, A => { A.e(8, 16.5, 5, 1.4, '#6f6a86'); A.r(5, 12, 6, 4, '#8e89a3'); A.r(5, 12, 6, 1, '#bab5cb'); A.r(7, 5, 2, 7, C.copper); A.r(7, 5, 1, 7, C.copperL); A.e(8, 4.5, 3.6, 1.8, C.copperD); A.e(8, 4, 3, 1.2, C.copperL); for (const x of [4, 8, 12]) A.p(x, 2, '#8fd0f0'); A.p(6, 1, '#bfe6ff'); A.p(10, 1, '#bfe6ff'); A.r(6, 14, 4, 1, '#3f7fb5'); }],
  harvester: [16, 20, A => { A.r(2, 8, 12, 11, C.ironD); A.r(3, 9, 10, 9, C.iron); A.r(3, 9, 10, 1, C.ironL); A.r(5, 11, 6, 4, '#2a2238'); A.r(6, 12, 4, 2, '#7fe0b5'); A.line(2, 8, 0, 4, C.woodD); A.line(14, 8, 16, 4, C.woodD); A.e(1, 4, 2, 1.2, C.cryL); A.e(15, 4, 2, 1.2, C.cryL); A.r(4, 18, 8, 1, '#3a3270'); A.p(7, 5, C.cry); A.r(6, 5, 4, 3, C.cry); A.p(7, 5, '#ffffff'); }],
});
export const giantSpr = kind => { const src = SPR.crop[kind][3][0], s = src.hd ? HD : 1, c = mk(32 * s, 32 * s, A => { A.g.imageSmoothingEnabled = false; A.g.drawImage(src, 0, 0, 32 * s, 32 * s); }, null); c.hd = src.hd; return c; };
ICON.festCake = A => { A.e(8, 12.6, 6.8, 2.4, '#e8e0f0'); A.r(3, 7, 10, 5, '#fff1d6'); A.e(8, 7, 5, 1.8, '#ffffff'); A.r(3, 9, 10, 1, '#ff9ab0'); A.e(8, 12, 5, 1.6, '#f2d38a'); for (const [x, c] of [[4, '#ff6b81'], [6, '#6fa8ff'], [8, '#ffd25c'], [10, '#f4f0f8'], [12, '#4a3f5c']]) A.p(x, 6, c); A.r(7, 2, 2, 4, '#ffd27a'); A.p(8, 1, '#fff1c0'); };
ICON.rn_festCake = noteIcon;

// ---- 조작 (features/controls.js) ----
// an arrow icon for the 「방향」 option
ICON.rotate = A => { for (let k = 0; k <= 20; k++) { const a = -0.4 + k / 20 * 4.6; A.r(8 + Math.cos(a) * 5 - .5, 8 + Math.sin(a) * 5 - .5, 2, 2, '#7fe0b5'); } A.poly([[10.5, 1], [15, 3.5], [10.5, 6.5]], '#7fe0b5'); };
