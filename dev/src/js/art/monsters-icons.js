function dimmed(c) { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.hd = c.hd; const g = k.getContext('2d'); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, k.width, k.height), a = d.data; for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const l = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) / 255; if (l > 0.55) { a[i] *= .45; a[i + 1] *= .45; a[i + 2] *= .55; } } g.putImageData(d, 0, 0); return k; }
function slimeSpr(col, colL, colD) {
  return mk(16, 14, A => {
    A.e(8, 8, 6.5, 5, colD); A.e(8, 7.5, 6, 4.5, col); A.e(5.6, 5.6, 1.9, 1.1, colL); A.p(4, 6, '#ffffff');
    A.r(6, 7, 1, 2, INK); A.r(10, 7, 1, 2, INK); A.p(5, 9, '#ff9ab0'); A.p(11, 9, '#ff9ab0'); A.p(8, 9, INK);
  });
}
function bossSpr() {
  return mk(36, 32, A => {
    A.e(18, 20, 15.5, 10.5, '#4f9e45'); A.e(18, 19, 14.5, 9.6, '#86d96b'); A.e(11.5, 14.5, 4.2, 2.2, '#d2f7b8'); A.p(9, 14, '#fff'); A.p(10, 14, '#fff');
    A.r(12, 17, 2, 4, INK); A.r(23, 17, 2, 4, INK); A.p(12, 17, '#fff'); A.p(23, 17, '#fff');
    A.r(16, 23, 5, 1, INK); A.p(15, 22, INK); A.p(21, 22, INK);
    A.e(9, 22, 1.6, 1, '#ff9ab0'); A.e(27, 22, 1.6, 1, '#ff9ab0');
    A.poly([[10, 11], [12, 3], [15, 7], [18, 1], [21, 7], [24, 3], [26, 11]], C.amber);
    A.r(11, 9, 15, 2, '#e5a73f'); A.p(18, 5, C.rose); A.p(13, 7, '#7fe0b5'); A.p(23, 7, '#7fe0b5');
  });
}
function shroomySpr() {
  return mk(16, 16, A => {
    A.r(5, 14, 2, 1, C.dirtD); A.r(9, 14, 2, 1, C.dirtD);
    A.e(8, 11, 3.8, 3.3, C.cream); A.p(7, 11, INK); A.p(9, 11, INK); A.p(6, 12, C.blush); A.p(10, 12, C.blush);
    A.e(8, 6.5, 6.5, 4, '#a65fd1'); A.r(3, 8, 10, 1, '#7d3fa3');
    A.p(5, 5, '#fbe7ff'); A.p(6, 5, '#fbe7ff'); A.p(9, 4, '#fbe7ff'); A.p(11, 6, '#fbe7ff'); A.p(7, 7, '#fbe7ff');
  });
}
function queenSpr() {
  return mk(36, 36, A => {
    A.e(9, 27, 2.4, 2.2, C.cream); A.e(27, 27, 2.4, 2.2, C.cream);
    A.poly([[11, 20], [25, 20], [29, 34], [7, 34]], '#f3e2c4'); A.r(7, 32, 22, 2, '#e5cfae'); for (let x = 8; x < 29; x += 3) A.p(x, 31, '#d9bfe8');
    A.e(18, 24, 7.5, 6, C.cream);
    A.r(14, 23, 2, 3, INK); A.r(20, 23, 2, 3, INK); A.p(14, 23, '#fff'); A.p(20, 23, '#fff');
    A.p(17, 27, INK); A.p(18, 28, INK); A.p(19, 27, INK); A.e(12, 27, 1.6, 1, C.blush); A.e(24, 27, 1.6, 1, C.blush);
    A.e(18, 14, 16.5, 8.5, '#8e4fb8'); A.e(18, 13, 15.5, 7.5, '#b673de'); A.r(2, 17, 32, 2, '#7d3fa3');
    for (const [x, y, r] of [[9, 12, 2.2], [18, 9, 2.6], [27, 12, 2.2], [13, 16, 1.3], [23, 16, 1.3]]) A.e(x, y, r, r * .8, '#fbe7ff');
    A.poly([[12, 7], [13, 1.5], [16, 4.5], [18, 0.6], [20, 4.5], [23, 1.5], [24, 7]], C.amber); A.r(12, 6, 12, 2, '#e5a73f'); A.p(18, 3, C.rose);
  });
}
function golemSpr() {
  return mk(36, 34, A => {
    A.r(8, 29, 7, 4, '#4a4468'); A.r(21, 29, 7, 4, '#4a4468');
    A.poly([[6, 15], [10, 2], [14, 14]], C.cryD); A.poly([[14, 13], [18, 1], [22, 13]], C.cry); A.poly([[14, 13], [18, 1], [18, 13]], C.cryL); A.poly([[22, 14], [27, 4], [30, 15]], C.cry);
    A.e(4, 22, 3, 4, '#57507a'); A.e(32, 22, 3, 4, '#57507a');
    A.e(18, 21, 15, 9.5, '#57507a'); A.e(18, 20, 14, 8.6, '#6a6488'); A.e(12, 15, 5, 2.2, '#8a83ad');
    A.r(11, 19, 4, 3, '#2a2340'); A.r(21, 19, 4, 3, '#2a2340'); A.r(12, 20, 2, 1, '#7ff0e6'); A.r(22, 20, 2, 1, '#7ff0e6');
    A.r(15, 25, 6, 1, '#2a2340'); A.p(9, 25, C.cry); A.p(27, 17, C.cry); A.p(25, 26, C.cryL);
  });
}
const shotSpr = (c1, c2, diamond) => mk(8, 8, A => { if (diamond) { A.poly([[4, 0.5], [7, 4], [4, 7.5], [1, 4]], c1); A.p(3, 3, c2); A.p(3, 4, c2); } else { A.e(4, 4, 3.2, 3.2, c1); A.e(3.5, 3.5, 1.5, 1.5, c2); } }, null);
const fishIcon = (body, belly, fin, extra) => A => { A.poly([[1.5, 4.5], [5, 8], [1.5, 11.5]], fin); A.e(9, 8, 5.6, 3.4, body); A.e(9.5, 9.6, 4, 1.4, belly); A.p(8, 4, fin); A.p(9, 4, fin); A.p(10, 5, fin); A.p(12, 7, INK); A.p(10, 6, '#ffffff'); if (extra) extra(A); };
function waterTex(f) { const R = rng(5150 + f * 17); return mk(16, 16, A => { A.r(0, 0, 16, 16, '#3a78b0'); for (let k = 0; k < 6; k++) { const x = R() * 13 | 0, y = R() * 15 | 0; A.r((x + f * 2) % 13, y, 3, 1, '#5b9bd0'); } for (let k = 0; k < 3; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#8cc4ec'); A.p((4 + f * 5) % 16, (9 + f * 3) % 16, '#e6f7ff'); }, null); }
const pickIcon = (h, hl) => A => { A.line(3, 13, 10, 6, C.woodD, 2); A.line(3, 12, 9, 6, C.woodL, 1); A.line(5, 3, 9, 3, h, 2); A.line(10, 4, 12, 6, h, 2); A.line(13, 7, 13, 11, h, 2); A.line(6, 3, 9, 3, hl, 1); A.p(11, 4, hl); };
const axeIcon = (h, hl) => A => { A.line(4, 14, 10, 4, C.woodD, 2); A.line(4, 13, 9, 4, C.woodL, 1); A.poly([[8, 3], [13, 1.5], [14.5, 6.5], [10, 7]], h); A.line(9, 3, 13, 2, hl, 1); A.p(14, 5, hl); };
const sickleIcon = (b, bl) => A => { A.e(9, 6.5, 5.4, 4.8, b); A.g.globalCompositeOperation = 'destination-out'; A.e(10.6, 8.6, 4.6, 4.2, '#000'); A.g.globalCompositeOperation = 'source-over'; A.p(6, 3, bl); A.p(8, 2, bl); A.line(3, 14, 6, 10, C.woodD, 2); A.p(3, 13, C.woodL); };
const rodIcon = (c1, c2, bob) => A => { A.line(2, 14, 12, 3, c1, 1); A.line(3, 14, 12, 4, c2, 1); A.p(5, 11, C.iron); A.p(4, 12, C.iron); A.line(13, 3, 13, 10, '#e8e0f0'); A.e(13, 11.5, 1.6, 1.6, bob); A.p(13, 10, '#ffffff'); };
const swordIcon = (b, bl, g) => A => { A.line(5, 10, 12, 3, b, 2); A.line(6, 9, 12, 3, bl, 1); A.p(13, 2, bl); A.line(3, 8, 7, 12, g, 2); A.line(2, 13, 4, 11, C.woodD, 2); A.p(1, 14, C.amber); };
const packet = (col, pic) => A => { A.r(4, 3, 8, 11, '#ecd6a8'); A.r(4, 3, 8, 2, '#cdb282'); A.r(5, 13, 6, 1, '#cdb282'); pic(A); };
const ICON = {
  wood: A => { A.r(2, 6, 11, 6, C.wood); A.r(2, 6, 11, 1, C.woodL); A.r(2, 11, 11, 1, C.woodD); A.p(5, 8, C.woodD); A.p(8, 10, C.woodD); A.p(6, 9, C.woodD); A.e(12.5, 9, 2.3, 3, '#e8b97a'); A.p(12, 9, C.woodD); A.p(13, 8, '#c99560'); },
  dirt: A => { A.e(8, 9.5, 5.6, 4.2, C.dirt); A.e(6.5, 8, 2.6, 1.5, C.dirtL); A.p(10, 10, C.dirtD); A.p(5, 11, C.dirtD); A.p(9, 12, C.dirtD); A.p(11, 8, '#8f7a72'); },
  stone: A => { A.e(8, 9, 5.6, 4.6, C.stone); A.e(6.5, 7.5, 2.6, 1.5, C.stoneL); A.p(10, 11, C.stoneD); A.p(9, 12, C.stoneD); A.p(5, 10, C.stoneD); },
  fiber: A => { A.line(5, 13, 6, 3, C.leafD, 1); A.line(8, 13, 8, 2, C.leaf, 1); A.line(11, 13, 10, 3, C.leafL, 1); A.line(6, 13, 4, 4, C.leaf, 1); A.line(10, 13, 12, 4, C.leafD, 1); A.r(4, 9, 8, 2, '#e5c97a'); },
  gel: A => { A.e(8, 10, 5, 4, '#86d96b'); A.poly([[8, 2], [12, 8], [4, 8]], '#86d96b'); A.p(6, 8, '#e2fbd2'); A.p(6, 9, '#e2fbd2'); A.p(7, 7, '#e2fbd2'); A.p(10, 12, '#4f9e45'); },
  copperOre: A => { A.e(8, 9, 5.6, 4.6, C.stoneD); A.e(6.5, 7.5, 2.4, 1.3, C.stone); A.e(6, 10, 1.7, 1.3, C.copper); A.e(10, 8, 1.5, 1.3, C.copper); A.p(9, 11, C.copperL); A.p(10, 7, C.copperL); },
  ironOre: A => { A.e(8, 9, 5.6, 4.6, C.stoneD); A.e(6.5, 7.5, 2.4, 1.3, C.stone); A.e(6, 10, 1.7, 1.3, C.iron); A.e(10, 8, 1.5, 1.3, C.iron); A.p(9, 11, C.ironL); A.p(10, 7, C.ironL); },
  crystal: A => { A.poly([[6, 3], [9, 1], [11, 6], [10, 14], [5, 14], [4, 7]], '#cfc6e8'); A.poly([[6, 3], [9, 1], [8, 14], [5, 14], [4, 7]], '#efeaff'); A.line(8, 3, 7, 12, '#ffffff'); A.p(10, 9, '#9d92c0'); A.p(9, 12, '#9d92c0'); A.p(12, 12, '#b9b0d8'); A.p(3, 12, '#b9b0d8'); },
  quartzR: A => { A.r(2, 6, 12, 7, '#a9a2c8'); A.r(2, 6, 12, 2, '#ffffff'); A.r(3, 8, 10, 4, '#e8e4fa'); A.r(2, 12, 12, 1, '#7d76a0'); A.p(5, 9, '#ffffff'); A.p(10, 10, '#c9c2e6'); A.p(12, 4, '#ffffff'); A.p(13, 3, '#e3d4ff'); },
  cryGem: A => { A.poly([[8, 1], [13, 5], [11, 14], [5, 14], [3, 5]], C.cryD); A.poly([[8, 2], [12, 5.5], [10, 13], [6, 13], [4, 5.5]], C.cry); A.poly([[8, 2], [8, 13], [6, 13], [4, 5.5]], C.cryL); A.e(8, 7, 1.8, 1.8, '#7ff0e6'); A.p(6, 5, '#ffffff'); A.p(13, 1, '#ffffff'); A.p(2, 10, '#e3d4ff'); },
  copperBar: A => { A.r(3, 8, 10, 4, C.copper); A.poly([[3, 8], [5, 5], [11, 5], [13, 8]], C.copperL); A.r(3, 11, 10, 1, C.copperD); A.p(6, 6, '#fff3e0'); },
  ironBar: A => { A.r(3, 8, 10, 4, C.iron); A.poly([[3, 8], [5, 5], [11, 5], [13, 8]], C.ironL); A.r(3, 11, 10, 1, C.ironD); A.p(6, 6, '#ffffff'); },
  glowcap: A => { A.r(6, 9, 4, 5, '#e8f7f2'); A.e(8, 6.5, 5, 3.5, C.glow); A.p(6, 5, C.glowL); A.p(9, 4, C.glowL); A.p(10, 7, C.glowL); A.r(3, 8, 10, 1, '#36b3a8'); },
  mushroom: A => { A.r(6, 9, 4, 5, C.cream); A.r(6, 9, 4, 1, '#e8d2b0'); A.e(8, 6.5, 5, 3.5, '#e36b6b'); A.p(6, 5, C.cream); A.p(9, 4, C.cream); A.p(10, 7, C.cream); A.r(3, 8, 10, 1, '#b94c55'); },
  berry: A => { A.e(6.5, 10, 3.5, 3.5, C.berry); A.e(10.5, 9, 3, 3, '#e86a92'); A.p(5, 9, '#ffc2d4'); A.p(10, 8, '#ffc2d4'); A.e(9, 4.5, 2.5, 1.3, C.leaf); A.p(8, 6, C.leafD); },
  berrySeed: packet('#ecd6a8', A => { A.e(8, 9, 2.2, 2.2, C.berry); A.p(7, 8, '#ffc2d4'); A.p(9, 6, C.leaf); }),
  spore: packet('#ecd6a8', A => { A.e(8, 8, 2.6, 1.6, '#a65fd1'); A.r(7, 9, 2, 2, C.cream); }),
  grilled: A => { A.line(2, 14, 13, 3, C.woodL, 1); A.e(6, 10, 2.6, 2.1, '#b5523f'); A.e(9.6, 6.5, 2.6, 2.1, '#b5523f'); A.p(5, 9, '#7a2f22'); A.p(9, 6, '#7a2f22'); A.p(6, 11, '#e8925f'); A.p(10, 7, '#e8925f'); },
  pie: A => { A.e(8, 10.5, 6.5, 3.5, '#e0a35f'); A.e(8, 9.5, 5.5, 2.6, '#c73e6b'); A.line(4, 9, 12, 9, '#f6d39b', 1); A.p(6, 8, '#f6d39b'); A.p(9, 8, '#f6d39b'); A.p(7, 11, '#f6d39b'); A.p(10, 11, '#f6d39b'); A.r(2, 12, 12, 1, '#b97c3f'); },
  stew: A => { A.r(2, 8, 12, 3, '#8c5a3c'); A.e(8, 11, 6, 3, '#8c5a3c'); A.e(8, 8, 6, 1.8, '#e0953f'); A.p(6, 8, '#e36b6b'); A.p(10, 8, C.glow); A.p(8, 7, '#fff1d6'); A.p(6, 4, '#e8e0f0'); A.p(7, 3, '#e8e0f0'); A.p(10, 4, '#e8e0f0'); A.p(11, 3, '#e8e0f0'); A.r(3, 12, 10, 1, '#5e3a26'); },
  lightSeed: A => { A.e(8, 9.5, 4.5, 5, '#ffcf4f'); A.e(7, 8, 2, 2.4, '#fff1b0'); A.p(6, 7, '#fff'); A.e(9.6, 3.6, 1.8, 1, C.leaf); A.p(8, 4, C.leafD); A.p(13, 2, '#fff'); A.p(12, 2, '#fff7c2'); A.p(14, 2, '#fff7c2'); A.p(13, 1, '#fff7c2'); A.p(13, 3, '#fff7c2'); },
  pickWood: pickIcon(C.stone, C.stoneL), pickCopper: pickIcon(C.copper, C.copperL), pickIron: pickIcon(C.iron, C.ironL),
  swordWood: swordIcon(C.woodL, '#f0c890', C.woodD), swordCopper: swordIcon(C.copper, C.copperL, C.woodD), swordIron: swordIcon(C.iron, C.ironL, C.amber), swordCrystal: swordIcon(C.cry, C.cryL, C.amber),
};
Object.assign(ICON, {
  shroomCap: A => { A.e(8, 8, 6.5, 4.2, '#e07b5f'); A.r(2, 9, 12, 2, '#b9573f'); A.e(5.5, 6, 1.4, 1, C.cream); A.e(10, 5.5, 1.2, .9, C.cream); A.p(12, 8, C.cream); A.p(7, 8, C.cream); },
  rod: rodIcon(C.woodD, C.wood, '#ff6b6b'),
  shovel: A => { A.line(3, 3, 9, 9, C.woodD, 2); A.line(3, 3, 8, 8, C.wood); A.r(2, 2, 3, 2, C.woodD); A.poly([[8.5, 9.5], [11, 7], [14.5, 10.5], [13.5, 13.5], [10.5, 14.5], [7, 11]], C.copperD); A.poly([[9, 9.5], [11, 7.5], [13.8, 10.3], [13, 13], [10.3, 13.8], [7.6, 11]], C.copper); A.p(11, 9, C.copperL); A.p(12, 10, C.copperL); },
  minnow: fishIcon('#8fc7a0', '#d8f2df', '#5e9a6e'),
  crucian: fishIcon('#d9a24a', '#f6dc9a', '#a8702a'),
  catfish: fishIcon('#8a6a9a', '#d7c4e0', '#5e4370', A => { A.line(13, 9, 15, 11, '#3a2a44'); A.line(13, 9, 15, 9, '#3a2a44'); }),
  sporeEel: A => { A.poly([[1, 6], [3, 8], [1, 10]], '#4fae98'); A.e(8, 8, 6.6, 2.2, '#6fd0b8'); A.e(8, 9, 6, 1, '#bff0e0'); A.p(13, 7, INK); A.p(5, 7, '#b673de'); A.p(8, 7, '#b673de'); A.p(11, 8, '#b673de'); },
  smelt: fishIcon('#b9d8f0', '#ffffff', '#8fb0e0', A => { A.p(13, 3, '#fff'); A.p(13, 2, C.cryL); A.p(12, 3, C.cryL); A.p(14, 3, C.cryL); A.p(13, 4, C.cryL); }),
  shrimp: A => { A.poly([[2, 7], [4, 10], [1, 12]], '#e07aa0'); A.e(8, 9, 5, 3.5, '#f2a0c0'); A.e(7, 8, 3.5, 2.2, '#ffc6da'); A.p(12, 7, INK); A.line(12, 6, 15, 3, '#e07aa0'); A.line(12, 6, 15, 5, '#e07aa0'); for (const x of [6, 8, 10]) A.p(x, 12, '#e07aa0'); },
  koi: fishIcon('#fff4ea', '#ffffff', '#ffb48a', A => { A.e(7, 7, 1.6, 1.2, '#ff8a3d'); A.e(10.5, 9, 1.4, 1, '#ff8a3d'); A.p(13, 2, '#ffe9a8'); A.p(14, 4, '#ffe9a8'); A.p(4, 3, '#ffe9a8'); }),
  boot: A => { A.poly([[4, 2], [10, 2], [10, 10], [14, 10], [14, 14], [4, 14]], '#7a5a3a'); A.r(4, 13, 10, 1, '#4a3424'); A.r(4, 2, 6, 2, '#9c7650'); A.p(8, 6, '#4a3424'); A.p(8, 8, '#4a3424'); A.p(5, 7, '#6fb0e0'); },
  anyFish: fishIcon('#8fc7a0', '#d8f2df', '#5e9a6e'),
  grilledFish: A => { A.e(8, 11, 7, 2.6, '#e8e2d8'); A.e(8, 10.5, 6, 1.7, '#ffffff'); A.poly([[2, 6], [4, 8], [2, 10]], '#a0603a'); A.e(9, 8, 5, 2.6, '#c9824a'); A.line(6, 7, 7, 9, '#7a3f22'); A.line(9, 7, 10, 9, '#7a3f22'); A.p(12, 7, INK); A.p(13, 11, C.leaf); A.p(14, 11, C.leafL); },
  fishStew: A => { A.r(2, 8, 12, 3, '#6d8fb0'); A.e(8, 11, 6, 3, '#6d8fb0'); A.e(8, 8, 6, 1.8, '#f2e3c2'); A.p(6, 8, '#e36b6b'); A.p(10, 8, C.leaf); A.poly([[9, 5], [11, 7], [9, 8]], '#8fc7a0'); A.p(6, 4, '#e8e0f0'); A.p(7, 3, '#e8e0f0'); A.r(3, 12, 10, 1, '#4a6a8a'); },
});
const UICON = {
  heart: A => { A.e(5.5, 6, 3.6, 3.6, C.rose); A.e(10.5, 6, 3.6, 3.6, C.rose); A.poly([[1.9, 7], [14.1, 7], [8, 14]], C.rose); A.p(4, 4, '#fff'); A.p(4, 5, '#ffd0d8'); A.p(11, 10, C.roseD); A.p(10, 11, C.roseD); },
  food: ICON.berry,
  bag: A => { A.r(6, 2, 4, 1, C.woodD); A.p(5, 3, C.woodD); A.p(10, 3, C.woodD); A.e(8, 10, 6, 4.5, C.wood); A.r(2, 9, 12, 4, C.wood); A.e(8, 7, 5.5, 3, C.woodL); A.r(7, 8, 2, 2, C.amber); A.r(3, 13, 10, 1, C.woodD); },
  hammer: A => { A.line(3, 13, 9, 7, C.woodL, 2); A.poly([[6, 5], [10, 1], [14, 5], [10, 9]], C.iron); A.poly([[6, 5], [10, 1], [11, 2], [7, 6]], C.ironL); A.p(11, 7, C.ironD); },
  map: A => { A.r(2, 3, 12, 11, C.cream); A.r(6, 3, 1, 11, '#e2cfae'); A.r(10, 3, 1, 11, '#e2cfae'); A.p(4, 11, C.rose); A.p(5, 10, C.rose); A.p(7, 9, C.rose); A.p(8, 7, C.rose); A.line(10, 5, 12, 7, C.roseD, 1); A.line(12, 5, 10, 7, C.roseD, 1); A.p(4, 5, C.leaf); A.p(5, 6, C.leaf); },
  gear: A => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; A.e(8 + Math.cos(a) * 5.3, 8 + Math.sin(a) * 5.3, 1.5, 1.5, C.stoneL); } A.e(8, 8, 5, 5, C.stoneL); A.e(8, 8, 2.1, 2.1, '#3a2e50'); A.p(6, 5, '#fff'); },
  hand: A => { A.e(8, 10.5, 4.6, 4, C.skin); A.r(4, 4, 2, 6, C.skin); A.r(6, 3, 2, 7, C.skin); A.r(8, 3, 2, 7, C.skin); A.r(10, 4, 2, 6, C.skin); A.e(3.4, 10, 1.4, 2.5, C.skin); A.p(5, 5, '#fff'); A.p(7, 4, '#fff'); A.r(6, 12, 4, 1, '#f0c2a0'); },
  dots: A => { A.e(4, 8, 1.6, 1.6, C.cream); A.e(8, 8, 1.6, 1.6, C.cream); A.e(12, 8, 1.6, 1.6, C.cream); },
};
