import { C, INK, mk, whiten } from '../engine/canvas.js';
import { SPR } from './world.js';
import { clamp } from '../engine/util.js';
import { rng } from '../engine/random.js';
import { G } from '../save/state.js';
import { H } from '../world/map.js';
import { WEAR_PAL } from '../sim/gear.js';
import { head } from '../ui/panels.js';
export function playerFrame(dir, step, pal) {
  return mk(16, 19, A => {
    const { r, p, e } = A; const fy = 17;
    if (dir === 'side') { if (step) { r(5, fy, 3, 1, C.dirtD); r(9, fy - 1, 3, 1, C.dirtD); } else r(6, fy, 4, 1, C.dirtD); }
    else { if (step) { r(5, fy, 2, 1, C.dirtD); r(9, fy - 1, 2, 1, C.dirtD); } else { r(5, fy, 2, 1, C.dirtD); r(9, fy, 2, 1, C.dirtD); } }
    r(4, 12, 8, 5, pal[0]); r(4, 16, 8, 1, pal[1]); r(5, 12, 6, 1, pal[2]);
    if (dir === 'up') { r(5, 12, 6, 4, C.woodD); r(6, 13, 4, 2, C.wood); p(8, 12, C.amber); }
    else if (dir === 'down') { r(7, 13, 2, 3, pal[1]); p(7, 14, C.amber); p(8, 14, C.amber); }
    if (dir !== 'side') { r(3, 13, 1, 2, pal[0]); r(12, 13, 1, 2, pal[0]); p(3, 15, C.skin); p(12, 15, C.skin); }
    else { r(8, 13, 2, 2, pal[1]); p(9, 15, C.skin); }
    e(8, 8.2, 5.2, 4.6, pal[0]); e(6.4, 5.8, 2, 1.2, pal[2]);
    if (dir === 'down') { e(8, 9.4, 3.6, 2.8, C.skin); r(6, 8, 1, 2, INK); r(9, 8, 1, 2, INK); p(5, 10, C.blush); p(10, 10, C.blush); }
    if (dir === 'side') { e(10, 9.4, 2.6, 2.8, C.skin); r(10, 8, 1, 2, INK); p(11, 10, C.blush); }
    if (dir === 'up') { r(5, 11, 6, 1, pal[1]); }
    r(8, 1, 1, 3, C.leafD); e(6.6, 2.2, 1.7, 1.1, C.leaf); e(9.8, 1.8, 1.7, 1.1, C.leafL);
  });
}
export const OUTFITS = [['민트', '#6cc9a3', '#479b7f', '#a5ecc9'], ['딸기', '#ff8fa3', '#d9607d', '#ffc2cf'], ['라벤더', '#b493f5', '#7a5cc4', '#e3d4ff'], ['하늘', '#7fb3e0', '#4f84b8', '#c4e2fa'], ['귤', '#ffb15c', '#d9822f', '#ffd9a0']];
// ---- playable characters (original designs). Each has its own hair/hat, outfit palette (dyeable) and details ----
export function headHelpers(A, dy) {
  return { R: (x, y, w, h, c) => A.r(x, y + dy, w, h, c), P: (x, y, c) => A.p(x, y + dy, c), E: (x, y, rx, ry, c) => A.e(x, y + dy, rx, ry, c), poly: (pts, c) => A.poly(pts.map(([x, y]) => [x, y + dy]), c) };
}
export const CHARS = {
  sprout: { n: '새싹', d: '민트 후드를 쓴 정원지기', pal: ['#6cc9a3', '#479b7f', '#a5ecc9'], classic: true },
  momo: { n: '모모', d: '늘 졸린 견습 마법사', pal: ['#6a4fa0', '#4d3678', '#8d72c4'], hc: ['#8a5a3c', '#6b4029', '#b07a52'], eye: '#6b4029', shoe: '#3a2e4f',
    eyes(H, dir) { const lid = '#f0c2a0'; if (dir === 'down') { H.R(5, 8, 2, 1, lid); H.R(9, 8, 2, 1, lid); H.R(5, 9, 2, 1, INK); H.R(9, 9, 2, 1, INK); } else if (dir === 'side') { H.R(10, 8, 2, 1, lid); H.R(10, 9, 2, 1, INK); } },
    hair(H, dir) { const [h0, h1, h2] = this.hc, k0 = '#3d3f7a', k1 = '#2a2b57', k2 = '#5b5fae';
      if (dir === 'down') { H.R(3, 7, 2, 5, h0); H.R(11, 7, 2, 5, h0); H.R(3, 11, 2, 1, h1); H.R(11, 11, 2, 1, h1); H.R(4, 6, 8, 2, h0); H.P(6, 8, h0); H.P(9, 8, h0); }
      if (dir === 'up') { H.E(8, 8.6, 5.2, 4, h0); H.R(4, 11, 8, 1, h1); }
      if (dir === 'side') { H.R(3, 6, 6, 6, h0); H.R(3, 11, 5, 1, h1); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); }
      H.E(8, 5.4, 7, 1.6, k1); H.E(8, 5.1, 6.6, 1.2, k0);
      const tip = dir === 'side' ? [[4.2, 5], [11.8, 5], [7, 1.6], [3.4, 0.6]] : [[4.2, 5], [11.8, 5], [9.8, 1.6], [12.8, 0.6]]; H.poly(tip, k0);
      H.R(5, 4, 6, 1, '#ffc861'); H.P(dir === 'side' ? 6 : 9, 2, '#ffe9a8'); H.P(dir === 'side' ? 5 : 8, 3, k2); },
    front(A, dir, pal) { if (dir === 'down') { A.r(7, 12, 2, 1, C.cream); A.p(8, 14, '#ffc861'); A.p(7, 14, '#ffc861'); A.r(4, 16, 8, 1, pal[1]); } } },
  naru: { n: '나루', d: '고양이귀 모자의 낚시꾼', pal: ['#ffd25c', '#d9a63a', '#fff0a8'], hc: ['#e08a4a', '#b8642f', '#ffb57a'], eye: '#4f9a5e', shoe: '#5a7a9a',
    hair(H, dir) { const [h0, h1] = this.hc, b0 = '#f3e3c8', b1 = '#cdb592', b2 = '#fff9ee', pk = '#ffb3c6';
      if (dir === 'down') { H.R(3, 8, 2, 3, h0); H.R(11, 8, 2, 3, h0); H.P(5, 8, h0); H.P(10, 8, h0); H.P(7, 8, h1); }
      if (dir === 'side') { H.R(3, 8, 5, 3, h0); H.P(12, 8, h0); }
      if (dir === 'up') { H.R(3, 8, 10, 4, h0); H.R(4, 11, 8, 1, h1); }
      H.E(8, 5.6, 5.5, 3, b0); H.R(3, 7, 10, 1, b1); H.R(5, 4, 3, 1, b2);
      H.poly([[2.6, 5], [3.8, 0.8], [6.8, 3.6]], b0); H.poly([[9.2, 3.6], [12.2, 0.8], [13.4, 5]], b0); H.P(4, 3, pk); H.P(11, 3, pk); H.P(4, 2, pk); H.P(11, 2, pk); },
    front(A, dir, pal) { if (dir === 'down') { A.r(8, 12, 1, 5, pal[1]); A.p(7, 13, '#c08a2a'); A.p(7, 15, '#c08a2a'); } if (dir === 'up') { A.r(5, 12, 6, 1, pal[1]); } } },
  pori: { n: '포리', d: '버섯 모자를 쓴 탐험가', pal: ['#7d9a4f', '#5b7536', '#a6c27a'], hc: ['#3a3045', '#262033', '#5a4d6b'], eye: '#3a3045', shoe: '#6b4a2f',
    hair(H, dir) { const [h0] = this.hc, r0 = '#e55b5b', r1 = '#b63e45', r2 = '#ff8f8f', rim = '#f3d9c0';
      if (dir === 'down') { H.R(3, 8, 1, 3, h0); H.R(12, 8, 1, 3, h0); H.P(4, 8, h0); H.P(11, 8, h0); }
      if (dir === 'side') { H.R(3, 8, 4, 3, h0); }
      if (dir === 'up') { H.R(3, 8, 10, 4, h0); }
      H.E(8, 4.8, 6.6, 3.4, r1); H.E(8, 4.4, 6.2, 3, r0); H.R(2, 7, 12, 1, rim); H.R(3, 7, 1, 1, '#d9b896'); H.R(12, 7, 1, 1, '#d9b896');
      H.P(5, 3, '#fff'); H.R(9, 2, 2, 1, '#fff'); H.P(12, 5, '#fff'); H.P(4, 5, r2); H.P(8, 4, '#fff'); },
    front(A, dir, pal) { if (dir === 'down') { A.r(7, 12, 2, 4, C.cream); A.line(4, 12, 10, 16, '#7d4d2a'); } if (dir === 'up') { A.line(11, 12, 5, 16, '#7d4d2a'); A.r(5, 13, 4, 3, '#a8763f'); } if (dir === 'side') { A.r(5, 13, 3, 3, '#a8763f'); } } },
  todak: { n: '토닥', d: '이끼 갑옷의 꼬마 기사', pal: ['#6f9a6a', '#4e7349', '#9cc497'], hc: ['#a9b5a0', '#7a8672', '#d4dccb'], eye: '#3b5a8a', shoe: '#5a5468',
    back(A, dir) { const cp = '#d9604f', cd = '#a8413a'; if (dir === 'down') { A.r(3, 12, 10, 5, cd); } if (dir === 'side') { A.r(3, 12, 4, 6, cp); A.r(3, 17, 3, 1, cd); } },
    head(H, dir, pal, sleep) { const [m0, m1, m2] = this.hc;
      H.E(8, 7.8, 5.4, 4.8, m1); H.E(8, 7.6, 5.1, 4.5, m0); H.P(5, 4, m2); H.P(6, 4, m2); H.P(4, 5, m2);
      if (dir === 'down') { H.E(8, 9.8, 3.4, 2.3, C.skin); H.R(4, 7, 8, 1, m1); if (sleep) { H.R(5, 9, 2, 1, INK); H.R(9, 9, 2, 1, INK); } else { H.R(6, 8, 1, 2, INK); H.R(9, 8, 1, 2, INK); H.P(6, 9, this.eye); H.P(9, 9, this.eye); } H.P(5, 11, C.blush); H.P(10, 11, C.blush); }
      if (dir === 'side') { H.E(10.2, 9.8, 2.4, 2.3, C.skin); H.R(8, 7, 5, 1, m1); H.R(10, 8, 1, 2, INK); H.P(10, 9, this.eye); H.P(11, 11, C.blush); }
      H.R(8, 0, 1, 3, '#d9604f'); H.E(9.6, 1.4, 2, 1, '#ff8a7a'); H.P(10, 1, '#ffc2b8'); },
    front(A, dir, pal) { if (dir === 'down') { A.r(5, 12, 6, 1, pal[2]); A.p(7, 14, '#ffc861'); A.p(8, 14, '#ffc861'); A.p(7, 13, '#ffc861'); A.p(8, 15, '#ffc861'); } if (dir === 'up') { A.r(4, 12, 8, 5, '#d9604f'); A.r(4, 16, 8, 1, '#a8413a'); A.p(5, 12, '#ff8a7a'); } } },
  rumi: { n: '루미', d: '등불 머리핀의 길 안내인', pal: ['#f0965a', '#c96f3a', '#ffc08a'], hc: ['#9a5a3a', '#6e3d27', '#c07e57'], eye: '#d98b2b', shoe: '#7d4d2a',
    back(A, dir) { const [h0, h1] = this.hc; if (dir === 'down') { A.r(3, 11, 2, 3, h0); A.p(3, 14, h1); } if (dir === 'side') { A.r(3, 11, 4, 4, h0); A.r(4, 15, 2, 1, h1); } },
    over(A, dir) { const [h0, h1] = this.hc; if (dir === 'up') { A.r(4, 11, 8, 4, h0); A.r(5, 15, 6, 1, h1); A.r(7, 12, 1, 3, h1); A.p(8, 15, '#ffc861'); } },
    hair(H, dir) { const [h0, h1, h2] = this.hc, am = '#ffd25c';
      if (dir === 'down') { H.R(3, 7, 2, 5, h0); H.R(11, 7, 2, 3, h0); H.R(4, 6, 8, 2, h0); H.P(10, 8, h0); H.P(11, 8, h0); H.P(5, 8, h0); H.P(6, 5, h2); H.P(7, 5, h2);
        H.P(12, 10, h1); H.P(12, 11, h0); H.P(12, 12, h1); H.P(12, 13, h0); H.P(12, 14, '#ffc861'); H.R(3, 5, 2, 2, am); H.P(3, 4, '#fff0a8'); }
      if (dir === 'up') { H.E(8, 8.4, 5.2, 4.2, h0); H.R(5, 5, 3, 1, h2); H.R(11, 5, 2, 2, am); }
      if (dir === 'side') { H.R(3, 6, 6, 6, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.R(5, 5, 2, 2, am); H.P(5, 4, '#fff0a8'); } },
    front(A, dir, pal) { if (dir === 'down') { A.r(6, 13, 4, 4, '#fff1d6'); A.r(6, 13, 4, 1, '#e8d8c0'); A.p(8, 15, '#ff8fa3'); } if (dir === 'side') { A.r(9, 13, 3, 3, '#fff1d6'); } } },
  ciel: { n: '시엘', d: '수정 장식의 떠돌이', pal: ['#4a4f8f', '#33366a', '#6d73b8'], hc: ['#5fc7c9', '#3e9a9e', '#a6ecec'], eye: '#8d72c4', shoe: '#33366a',
    back(A, dir) { const [h0, h1] = this.hc; if (dir === 'side') { A.r(3, 11, 2, 3, h0); A.p(3, 14, h1); } },
    over(A, dir) { const [h0, h1] = this.hc; if (dir === 'up') { A.r(7, 11, 2, 4, h0); A.p(7, 15, h1); A.p(8, 12, C.cry); } },
    hair(H, dir) { const [h0, h1, h2] = this.hc;
      if (dir === 'down') { H.R(3, 7, 1, 4, h0); H.R(12, 7, 1, 4, h0); H.R(4, 6, 8, 2, h0); H.P(4, 8, h0); H.P(8, 8, h0); H.P(11, 8, h0); H.P(5, 5, h2); H.P(6, 4, h2); H.R(11, 5, 1, 2, C.cry); H.P(12, 5, C.cryL); }
      if (dir === 'up') { H.E(8, 8.2, 5.2, 4.4, h0); H.R(5, 4, 3, 1, h2); H.R(4, 5, 1, 2, C.cry); }
      if (dir === 'side') { H.R(3, 6, 6, 5, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.P(9, 8, h0); H.R(6, 5, 1, 2, C.cry); H.P(7, 5, C.cryL); } },
    body(A, dir, pal) { A.r(3, 12, 10, 5, pal[0]); A.r(3, 16, 10, 1, pal[1]); A.r(4, 11, 8, 2, pal[2]);
      if (dir === 'down') { A.r(8, 13, 1, 4, pal[1]); A.p(7, 12, C.cry); A.p(8, 12, C.cryL); A.p(4, 15, C.skin); A.p(11, 15, C.skin); }
      if (dir === 'side') { A.p(10, 15, C.skin); A.p(11, 12, C.cry); }
      if (dir === 'up') { A.r(4, 13, 8, 1, pal[1]); } } },
};
// ---- dress-up: build your own character from original parts ----
export const HAIRC = [['갈색', ['#8a5a3c', '#6b4029', '#b07a52']], ['밤색', ['#9a5a3a', '#6e3d27', '#c07e57']], ['검정', ['#3a3045', '#262033', '#5a4d6b']], ['금발', ['#f0c85a', '#c99a2e', '#ffe69a']], ['주황', ['#e08a4a', '#b8642f', '#ffb57a']],
  ['분홍', ['#f29ab8', '#c96b8f', '#ffc6da']], ['하늘', ['#5fc7c9', '#3e9a9e', '#a6ecec']], ['초록', ['#6fb86a', '#4e8a4a', '#a6e09c']], ['보라', ['#9b7ad6', '#7356a8', '#c7b0f0']]];
export const EYEC = [['갈색', '#6b4029'], ['초록', '#4f9a5e'], ['파랑', '#3b5a8a'], ['보라', '#8d72c4'], ['호박', '#d98b2b']];
export const OUTC = [['민트', ['#6cc9a3', '#479b7f', '#a5ecc9']], ['딸기', ['#ff8fa3', '#d9607d', '#ffc2cf']], ['라벤더', ['#b493f5', '#7a5cc4', '#e3d4ff']], ['하늘', ['#7fb3e0', '#4f84b8', '#c4e2fa']], ['귤', ['#ffb15c', '#d9822f', '#ffd9a0']],
  ['노랑', ['#ffd25c', '#d9a63a', '#fff0a8']], ['남색', ['#4a4f8f', '#33366a', '#6d73b8']], ['이끼', ['#7d9a4f', '#5b7536', '#a6c27a']], ['밤', ['#9a6a4a', '#6e4a33', '#c49272']]];
export const HAIRS = {
  bob: { n: '단발', draw(H, d, [h0, h1, h2]) { if (d === 'down') { H.R(3, 7, 2, 5, h0); H.R(11, 7, 2, 5, h0); H.R(3, 11, 2, 1, h1); H.R(11, 11, 2, 1, h1); H.R(4, 6, 8, 2, h0); H.P(6, 8, h0); H.P(9, 8, h0); H.P(6, 5, h2); H.P(7, 5, h2); }
    if (d === 'up') { H.E(8, 8.6, 5.2, 4, h0); H.R(4, 11, 8, 1, h1); H.R(6, 5, 3, 1, h2); } if (d === 'side') { H.R(3, 6, 6, 6, h0); H.R(3, 11, 5, 1, h1); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.P(6, 5, h2); } } },
  short: { n: '짧은 머리', draw(H, d, [h0, h1, h2]) { if (d === 'down') { H.R(3, 7, 1, 3, h0); H.R(12, 7, 1, 3, h0); H.R(4, 6, 8, 2, h0); H.P(4, 8, h0); H.P(8, 8, h0); H.P(11, 8, h0); H.P(5, 5, h2); H.P(6, 4, h2); }
    if (d === 'up') { H.E(8, 8.2, 5.2, 4.2, h0); H.R(5, 4, 3, 1, h2); } if (d === 'side') { H.R(3, 6, 6, 5, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.P(9, 8, h0); H.P(5, 4, h2); } } },
  long: { n: '긴 생머리', draw(H, d, [h0, h1, h2]) { if (d === 'down') { H.R(3, 7, 2, 5, h0); H.R(11, 7, 2, 5, h0); H.R(4, 6, 8, 2, h0); H.P(7, 8, h0); H.P(6, 5, h2); H.P(7, 5, h2); }
      if (d === 'up') { H.E(8, 8.4, 5.2, 4.2, h0); H.R(6, 5, 3, 1, h2); } if (d === 'side') { H.R(3, 6, 6, 6, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); } },
    over(A, d, [h0, h1]) { if (d === 'down') { A.r(3, 11, 2, 4, h0); A.r(11, 11, 2, 4, h0); A.p(3, 15, h1); A.p(12, 15, h1); } if (d === 'up') { A.r(4, 11, 8, 5, h0); A.r(5, 16, 6, 1, h1); } if (d === 'side') { A.r(3, 11, 4, 5, h0); A.r(4, 16, 2, 1, h1); } } },
  buns: { n: '양쪽 똥머리', draw(H, d, [h0, h1, h2]) { const bun = (x) => { H.E(x, 4.4, 2.1, 2, h1); H.E(x, 4.1, 1.8, 1.7, h0); H.P(Math.round(x) - 1, 3, h2); };
    if (d === 'down') { bun(3.6); bun(12.4); H.R(4, 6, 8, 2, h0); H.R(3, 7, 1, 3, h0); H.R(12, 7, 1, 3, h0); H.P(5, 8, h0); H.P(10, 8, h0); }
    if (d === 'up') { bun(3.6); bun(12.4); H.E(8, 8.2, 5.2, 4.2, h0); } if (d === 'side') { bun(4.4); H.R(3, 6, 6, 5, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); } } },
  pony: { n: '포니테일', draw(H, d, [h0, h1, h2]) { if (d === 'down') { H.R(4, 6, 8, 2, h0); H.R(3, 7, 1, 4, h0); H.R(12, 7, 1, 4, h0); H.P(6, 8, h0); H.P(10, 8, h0); H.P(6, 5, h2); }
      if (d === 'up') { H.E(8, 8.2, 5.2, 4.2, h0); H.P(8, 9, '#ff8fa3'); } if (d === 'side') { H.R(3, 6, 6, 5, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.R(1, 8, 2, 5, h0); H.P(1, 13, h1); H.P(3, 8, '#ff8fa3'); } },
    over(A, d, [h0, h1]) { if (d === 'up') { A.r(7, 10, 2, 5, h0); A.p(7, 15, h1); } } },
  curly: { n: '곱슬', draw(H, d, [h0, h1, h2]) { const bumps = () => { H.P(3, 5, h0); H.P(5, 3, h0); H.P(8, 2, h0); H.P(11, 3, h0); H.P(13, 5, h0); H.P(5, 4, h2); H.P(9, 3, h2); };
    if (d === 'down') { bumps(); H.R(2, 7, 2, 5, h0); H.R(12, 7, 2, 5, h0); H.R(4, 6, 8, 2, h0); H.P(4, 8, h0); H.P(7, 8, h0); H.P(9, 8, h0); H.P(11, 8, h0); H.P(2, 12, h1); H.P(13, 12, h1); }
    if (d === 'up') { bumps(); H.E(8, 8.2, 5.8, 4.6, h0); H.P(4, 12, h1); H.P(11, 12, h1); } if (d === 'side') { bumps(); H.R(2, 6, 7, 6, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); H.P(10, 8, h0); } } },
  braid: { n: '땋은 머리', draw(H, d, [h0, h1, h2]) { if (d === 'down') { H.R(3, 7, 2, 5, h0); H.R(11, 7, 2, 3, h0); H.R(4, 6, 8, 2, h0); H.P(10, 8, h0); H.P(11, 8, h0); H.P(5, 8, h0); H.P(6, 5, h2); H.P(7, 5, h2);
      H.P(12, 10, h1); H.P(12, 11, h0); H.P(12, 12, h1); H.P(12, 13, h0); H.P(12, 14, '#ffc861'); }
      if (d === 'up') { H.E(8, 8.4, 5.2, 4.2, h0); H.R(5, 5, 3, 1, h2); } if (d === 'side') { H.R(3, 6, 6, 6, h0); H.R(8, 6, 5, 2, h0); H.P(12, 8, h0); } },
    over(A, d, [h0, h1]) { if (d === 'up') { A.r(7, 11, 2, 4, h0); A.p(7, 12, h1); A.p(8, 14, h1); A.p(7, 15, '#ffc861'); } if (d === 'side') { A.r(3, 11, 2, 3, h0); A.p(3, 14, '#ffc861'); } } },
  spiky: { n: '삐죽 머리', draw(H, d, [h0, h1, h2]) { const sp = () => { H.poly([[3, 6], [4, 2], [6, 5]], h0); H.poly([[6, 5], [8, 1], [10, 5]], h0); H.poly([[10, 5], [12, 2], [13, 6]], h0); H.P(8, 3, h2); };
    if (d === 'down') { sp(); H.R(3, 7, 1, 3, h0); H.R(12, 7, 1, 3, h0); H.R(4, 6, 8, 1, h0); H.P(4, 7, h0); H.P(6, 8, h0); H.P(8, 7, h0); H.P(10, 8, h0); H.P(11, 7, h0); }
    if (d === 'up') { sp(); H.E(8, 8.2, 5.2, 4.2, h0); } if (d === 'side') { sp(); H.R(3, 6, 6, 5, h0); H.R(8, 6, 5, 1, h0); H.P(12, 7, h0); H.P(10, 8, h0); H.poly([[2, 8], [1, 5], [4, 6]], h0); } } },
};
export const HATS = {
  none: { n: '없음' },
  sprout: { n: '새싹', draw(H) { H.R(8, 1, 1, 3, C.leafD); H.E(6.6, 2.2, 1.7, 1.1, C.leaf); H.E(9.8, 1.8, 1.7, 1.1, C.leafL); } },
  ribbon: { n: '리본', draw(H, d) { const x = d === 'side' ? 5 : 10; H.poly([[x - 2.5, 3], [x, 4.5], [x - 2.5, 6]], '#ff8fa3'); H.poly([[x + 2.5, 3], [x, 4.5], [x + 2.5, 6]], '#ff8fa3'); H.P(x, 4, '#d9607d'); } },
  flowers: { n: '꽃 화관', draw(H, d) { const pts = d === 'side' ? [4, 7, 10] : [3, 6, 9, 12]; pts.forEach((x, k) => { const c = ['#ff8fa3', '#fff1d6', '#ffd25c', '#b493f5'][k % 4]; H.P(x, 4, c); H.P(x + 1, 4, c); H.P(x, 5, c); H.P(x + 1, 5, '#ffc861'); }); H.R(3, 6, 10, 1, C.leafD); } },
  wizard: { n: '마법사 모자', draw(H, d) { const k0 = '#3d3f7a', k1 = '#2a2b57', k2 = '#5b5fae'; H.E(8, 5.4, 7, 1.6, k1); H.E(8, 5.1, 6.6, 1.2, k0);
    H.poly(d === 'side' ? [[4.2, 5], [11.8, 5], [7, 1.6], [3.4, 0.6]] : [[4.2, 5], [11.8, 5], [9.8, 1.6], [12.8, 0.6]], k0); H.R(5, 4, 6, 1, '#ffc861'); H.P(d === 'side' ? 6 : 9, 2, '#ffe9a8'); H.P(d === 'side' ? 5 : 8, 3, k2); } },
  catbeanie: { n: '고양이귀 털모자', draw(H) { const b0 = '#f3e3c8', b1 = '#cdb592', b2 = '#fff9ee', pk = '#ffb3c6'; H.E(8, 5.6, 5.5, 3, b0); H.R(3, 7, 10, 1, b1); H.R(5, 4, 3, 1, b2);
    H.poly([[2.6, 5], [3.8, 0.8], [6.8, 3.6]], b0); H.poly([[9.2, 3.6], [12.2, 0.8], [13.4, 5]], b0); H.P(4, 3, pk); H.P(11, 3, pk); H.P(4, 2, pk); H.P(11, 2, pk); } },
  mushroom: { n: '버섯 모자', draw(H) { const r0 = '#e55b5b', r1 = '#b63e45', rim = '#f3d9c0'; H.E(8, 4.8, 6.6, 3.4, r1); H.E(8, 4.4, 6.2, 3, r0); H.R(2, 7, 12, 1, rim); H.P(5, 3, '#fff'); H.R(9, 2, 2, 1, '#fff'); H.P(12, 5, '#fff'); H.P(8, 4, '#fff'); } },
  lanternpin: { n: '등불 머리핀', draw(H, d) { const x = d === 'up' ? 11 : d === 'side' ? 5 : 3; H.R(x, 5, 2, 2, '#ffd25c'); H.P(x, 4, '#fff0a8'); } },
  crystalpin: { n: '수정 핀', draw(H, d) { const x = d === 'up' ? 4 : d === 'side' ? 6 : 11; H.R(x, 5, 1, 2, C.cry); H.P(x + 1, 5, C.cryL); } },
};
export const OUTFITS2 = {
  tunic: { n: '튜닉', front(A, d, p) { if (d === 'down') { A.r(7, 13, 2, 3, p[1]); A.p(7, 14, '#ffc861'); A.p(8, 14, '#ffc861'); } if (d === 'up') { A.r(5, 12, 6, 4, C.woodD); A.r(6, 13, 4, 2, C.wood); } } },
  robe: { n: '로브', front(A, d, p) { if (d === 'down') { A.r(7, 12, 2, 1, C.cream); A.p(8, 14, '#ffc861'); A.p(7, 14, '#ffc861'); A.r(4, 16, 8, 1, p[1]); } } },
  raincoat: { n: '우비', shoe: '#5a7a9a', front(A, d, p) { if (d === 'down') { A.r(8, 12, 1, 5, p[1]); A.p(7, 13, p[1]); A.p(7, 15, p[1]); } if (d === 'up') A.r(5, 12, 6, 1, p[1]); } },
  vest: { n: '탐험 조끼', shoe: '#6b4a2f', front(A, d) { if (d === 'down') { A.r(7, 12, 2, 4, C.cream); A.line(4, 12, 10, 16, '#7d4d2a'); } if (d === 'up') { A.line(11, 12, 5, 16, '#7d4d2a'); A.r(5, 13, 4, 3, '#a8763f'); } if (d === 'side') A.r(5, 13, 3, 3, '#a8763f'); } },
  apron: { n: '앞치마', front(A, d) { if (d === 'down') { A.r(6, 13, 4, 4, '#fff1d6'); A.r(6, 13, 4, 1, '#e8d8c0'); A.p(8, 15, '#ff8fa3'); } if (d === 'side') A.r(9, 13, 3, 3, '#fff1d6'); } },
  cloak: { n: '망토', body(A, d, p) { A.r(3, 12, 10, 5, p[0]); A.r(3, 16, 10, 1, p[1]); A.r(4, 11, 8, 2, p[2]); if (d === 'down') { A.r(8, 13, 1, 4, p[1]); A.p(7, 12, C.cry); A.p(8, 12, C.cryL); A.p(4, 15, C.skin); A.p(11, 15, C.skin); } if (d === 'side') A.p(10, 15, C.skin); if (d === 'up') A.r(4, 13, 8, 1, p[1]); } },
  armor: { n: '꼬마 갑옷', shoe: '#5a5468', back(A, d) { if (d === 'down') A.r(3, 12, 10, 5, '#a8413a'); if (d === 'side') { A.r(3, 12, 4, 6, '#d9604f'); A.r(3, 17, 3, 1, '#a8413a'); } },
    front(A, d, p) { if (d === 'down') { A.r(5, 12, 6, 1, p[2]); A.p(7, 14, '#ffc861'); A.p(8, 14, '#ffc861'); A.p(7, 13, '#ffc861'); A.p(8, 15, '#ffc861'); } if (d === 'up') { A.r(4, 12, 8, 5, '#d9604f'); A.r(4, 16, 8, 1, '#a8413a'); } } },
};
export const LOOK_DEF = { hair: 'bob', hc: 0, eye: 0, outfit: 'tunic', oc: 0, hat: 'none' };
export function cleanLook(L) { L = Object.assign({}, LOOK_DEF, L || {}); if (!HAIRS[L.hair]) L.hair = 'bob'; if (!HATS[L.hat]) L.hat = 'none'; if (!OUTFITS2[L.outfit]) L.outfit = 'tunic'; L.hc = clamp(L.hc | 0, 0, HAIRC.length - 1); L.eye = clamp(L.eye | 0, 0, EYEC.length - 1); L.oc = clamp(L.oc | 0, 0, OUTC.length - 1); return L; }
export function lookDef(L) {
  L = cleanLook(L); const hs = HAIRS[L.hair], hat = HATS[L.hat], of = OUTFITS2[L.outfit], hc = HAIRC[L.hc][1];
  return { n: '나만의 캐릭터', d: '직접 고른 머리와 옷', pal: OUTC[L.oc][1], hc, eye: EYEC[L.eye][1], shoe: of.shoe || '#5a4637', custom: true,
    hair(H, d) { hs.draw(H, d, hc); if (hat.draw) hat.draw(H, d); },
    back(A, d, p) { if (hs.back) hs.back(A, d, hc); if (of.back) of.back(A, d, p); },
    over(A, d, p) { if (hs.over) hs.over(A, d, hc); },
    body: of.body, front: of.front };
}
CHARS.custom = lookDef(LOOK_DEF);
export const CHAR_IDS = Object.keys(CHARS);
export function charFrame(id, dir, step, pal) {
  const def = CHARS[id];
  return mk(16, 19, A => {
    const { r, p } = A; const fy = 17, sh = def.shoe || C.dirtD;
    if (def.back) def.back(A, dir, pal);
    if (dir === 'side') { if (step) { r(5, fy, 3, 1, sh); r(9, fy - 1, 3, 1, sh); } else r(6, fy, 4, 1, sh); }
    else { if (step) { r(5, fy, 2, 1, sh); r(9, fy - 1, 2, 1, sh); } else { r(5, fy, 2, 1, sh); r(9, fy, 2, 1, sh); } }
    if (def.body) def.body(A, dir, pal);
    else { r(4, 12, 8, 5, pal[0]); r(4, 16, 8, 1, pal[1]); r(5, 12, 6, 1, pal[2]);
      if (dir !== 'side') { r(3, 13, 1, 2, pal[0]); r(12, 13, 1, 2, pal[0]); p(3, 15, C.skin); p(12, 15, C.skin); } else { r(8, 13, 2, 2, pal[1]); p(9, 15, C.skin); } }
    if (def.front) def.front(A, dir, pal);
    if (def.over) def.over(A, dir, pal);
    charHead(A, id, dir, pal, 0, false);
  });
}
export function charHead(A, id, dir, pal, dy, sleep) {
  const def = CHARS[id], H = headHelpers(A, dy);
  if (def.head) { def.head(H, dir, pal, sleep); return; }
  const h0 = def.hc[0];
  H.E(8, 7.8, 5.3, 4.6, h0);
  if (dir === 'down') { H.E(8, 9.6, 3.6, 2.6, C.skin);
    if (sleep) { H.R(5, 9, 2, 1, INK); H.R(9, 9, 2, 1, INK); } else if (def.eyes) def.eyes(H, dir); else { H.R(6, 8, 1, 2, INK); H.R(9, 8, 1, 2, INK); H.P(6, 9, def.eye); H.P(9, 9, def.eye); }
    H.P(5, 10, C.blush); H.P(10, 10, C.blush); }
  if (dir === 'side') { H.E(10.2, 9.6, 2.6, 2.6, C.skin); if (def.eyes) def.eyes(H, dir); else { H.R(10, 8, 1, 2, INK); H.P(10, 9, def.eye); } H.P(11, 10, C.blush); }
  def.hair(H, dir);
}
export function curChar() { return G && CHARS[G.char] ? G.char : 'sprout'; }
export function outfitPal(id, o) { return o ? OUTFITS[o % OUTFITS.length].slice(1) : CHARS[id].pal; }
export const charPrevCache = {};
export function charPreview(id, step = 0, dir = 'down') { const k = id + step + dir; if (CHARS[id].custom || id === '__look') { const c = CHARS[id]; return charFrame(id, dir, step, c.pal).toDataURL(); } if (!charPrevCache[k]) { const c = CHARS[id]; charPrevCache[k] = (c.classic ? playerFrame(dir, step, c.pal) : charFrame(id, dir, step, c.pal)).toDataURL(); } return charPrevCache[k]; }
export function buildPlayer(o) {
  const id = curChar(), ch = CHARS[id], pal = (G && G.equip && G.equip.body && WEAR_PAL[G.equip.body.id]) || outfitPal(id, o || 0);
  const fr = (d, st) => ch.classic ? playerFrame(d, st, pal) : charFrame(id, d, st, pal);
  SPR.player = {}; for (const d of ['down', 'up', 'side']) SPR.player[d] = [fr(d, 0), fr(d, 1)];
  SPR.playerW = {}; for (const d of ['down', 'up', 'side']) SPR.playerW[d] = SPR.player[d].map(whiten);
  const f = SPR.player.down[0], c = document.createElement('canvas'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(f, 0, 0, 16, 16, 0, 0, 16, 16); SPR.playerSit = c;
  if (!ch.classic) { SPR.sleepHead = mk(16, 11, A => charHead(A, id, 'down', pal, -2, true)); return; }
  SPR.sleepHead = mk(16, 11, A => { A.e(8, 5.5, 5.2, 4.4, pal[0]); A.e(6.4, 3.2, 2, 1.1, pal[2]); A.e(8, 6.6, 3.6, 2.6, C.skin); A.r(5, 6, 2, 1, INK); A.r(9, 6, 2, 1, INK); A.p(5, 8, C.blush); A.p(10, 8, C.blush); A.r(8, 0, 1, 2, C.leafD); A.p(7, 0, C.leaf); });
}
export function dimmed(c) { const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; k.hd = c.hd; const g = k.getContext('2d'); g.drawImage(c, 0, 0); const d = g.getImageData(0, 0, k.width, k.height), a = d.data; for (let i = 0; i < a.length; i += 4) { if (!a[i + 3]) continue; const l = (a[i] * .3 + a[i + 1] * .59 + a[i + 2] * .11) / 255; if (l > 0.55) { a[i] *= .45; a[i + 1] *= .45; a[i + 2] *= .55; } } g.putImageData(d, 0, 0); return k; }
export function slimeSpr(col, colL, colD) {
  return mk(16, 14, A => {
    A.e(8, 8, 6.5, 5, colD); A.e(8, 7.5, 6, 4.5, col); A.e(5.6, 5.6, 1.9, 1.1, colL); A.p(4, 6, '#ffffff');
    A.r(6, 7, 1, 2, INK); A.r(10, 7, 1, 2, INK); A.p(5, 9, '#ff9ab0'); A.p(11, 9, '#ff9ab0'); A.p(8, 9, INK);
  });
}
export function bossSpr() {
  return mk(36, 32, A => {
    A.e(18, 20, 15.5, 10.5, '#4f9e45'); A.e(18, 19, 14.5, 9.6, '#86d96b'); A.e(11.5, 14.5, 4.2, 2.2, '#d2f7b8'); A.p(9, 14, '#fff'); A.p(10, 14, '#fff');
    A.r(12, 17, 2, 4, INK); A.r(23, 17, 2, 4, INK); A.p(12, 17, '#fff'); A.p(23, 17, '#fff');
    A.r(16, 23, 5, 1, INK); A.p(15, 22, INK); A.p(21, 22, INK);
    A.e(9, 22, 1.6, 1, '#ff9ab0'); A.e(27, 22, 1.6, 1, '#ff9ab0');
    A.poly([[10, 11], [12, 3], [15, 7], [18, 1], [21, 7], [24, 3], [26, 11]], C.amber);
    A.r(11, 9, 15, 2, '#e5a73f'); A.p(18, 5, C.rose); A.p(13, 7, '#7fe0b5'); A.p(23, 7, '#7fe0b5');
  });
}
export function shroomySpr() {
  return mk(16, 16, A => {
    A.r(5, 14, 2, 1, C.dirtD); A.r(9, 14, 2, 1, C.dirtD);
    A.e(8, 11, 3.8, 3.3, C.cream); A.p(7, 11, INK); A.p(9, 11, INK); A.p(6, 12, C.blush); A.p(10, 12, C.blush);
    A.e(8, 6.5, 6.5, 4, '#a65fd1'); A.r(3, 8, 10, 1, '#7d3fa3');
    A.p(5, 5, '#fbe7ff'); A.p(6, 5, '#fbe7ff'); A.p(9, 4, '#fbe7ff'); A.p(11, 6, '#fbe7ff'); A.p(7, 7, '#fbe7ff');
  });
}
export function queenSpr() {
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
export function golemSpr() {
  return mk(36, 34, A => {
    A.r(8, 29, 7, 4, '#4a4468'); A.r(21, 29, 7, 4, '#4a4468');
    A.poly([[6, 15], [10, 2], [14, 14]], C.cryD); A.poly([[14, 13], [18, 1], [22, 13]], C.cry); A.poly([[14, 13], [18, 1], [18, 13]], C.cryL); A.poly([[22, 14], [27, 4], [30, 15]], C.cry);
    A.e(4, 22, 3, 4, '#57507a'); A.e(32, 22, 3, 4, '#57507a');
    A.e(18, 21, 15, 9.5, '#57507a'); A.e(18, 20, 14, 8.6, '#6a6488'); A.e(12, 15, 5, 2.2, '#8a83ad');
    A.r(11, 19, 4, 3, '#2a2340'); A.r(21, 19, 4, 3, '#2a2340'); A.r(12, 20, 2, 1, '#7ff0e6'); A.r(22, 20, 2, 1, '#7ff0e6');
    A.r(15, 25, 6, 1, '#2a2340'); A.p(9, 25, C.cry); A.p(27, 17, C.cry); A.p(25, 26, C.cryL);
  });
}
export const shotSpr = (c1, c2, diamond) => mk(8, 8, A => { if (diamond) { A.poly([[4, 0.5], [7, 4], [4, 7.5], [1, 4]], c1); A.p(3, 3, c2); A.p(3, 4, c2); } else { A.e(4, 4, 3.2, 3.2, c1); A.e(3.5, 3.5, 1.5, 1.5, c2); } }, null);
export const fishIcon = (body, belly, fin, extra) => A => { A.poly([[1.5, 4.5], [5, 8], [1.5, 11.5]], fin); A.e(9, 8, 5.6, 3.4, body); A.e(9.5, 9.6, 4, 1.4, belly); A.p(8, 4, fin); A.p(9, 4, fin); A.p(10, 5, fin); A.p(12, 7, INK); A.p(10, 6, '#ffffff'); if (extra) extra(A); };
export function waterTex(f) { const R = rng(5150 + f * 17); return mk(16, 16, A => { A.r(0, 0, 16, 16, '#3a78b0'); for (let k = 0; k < 6; k++) { const x = R() * 13 | 0, y = R() * 15 | 0; A.r((x + f * 2) % 13, y, 3, 1, '#5b9bd0'); } for (let k = 0; k < 3; k++) A.p(R() * 16 | 0, R() * 16 | 0, '#8cc4ec'); A.p((4 + f * 5) % 16, (9 + f * 3) % 16, '#e6f7ff'); }, null); }
export const pickIcon = (h, hl) => A => { A.line(3, 13, 10, 6, C.woodD, 2); A.line(3, 12, 9, 6, C.woodL, 1); A.line(5, 3, 9, 3, h, 2); A.line(10, 4, 12, 6, h, 2); A.line(13, 7, 13, 11, h, 2); A.line(6, 3, 9, 3, hl, 1); A.p(11, 4, hl); };
export const axeIcon = (h, hl) => A => { A.line(4, 14, 10, 4, C.woodD, 2); A.line(4, 13, 9, 4, C.woodL, 1); A.poly([[8, 3], [13, 1.5], [14.5, 6.5], [10, 7]], h); A.line(9, 3, 13, 2, hl, 1); A.p(14, 5, hl); };
export const daggerIcon = (b, bl, g) => A => { A.line(7, 9, 12, 4, b, 2); A.line(7, 8, 12, 4, bl, 1); A.p(13, 3, bl); A.line(5, 7, 9, 11, g, 2); A.line(3, 13, 6, 10, C.woodD, 2); A.p(2, 14, C.amber); };
export const spearIcon = (h, hl) => A => { A.line(1, 15, 10, 6, C.woodD, 1); A.line(2, 15, 10, 7, C.wood, 1); A.r(8, 7, 2, 2, '#e5c97a'); A.poly([[9.2, 4.2], [15, 1], [11.8, 6.8]], h); A.line(10, 4.5, 14, 1.8, hl, 1); };
export const hammerIcon = (h, hl, hd) => A => { A.line(2, 14, 9, 7, C.woodD, 2); A.line(2, 13, 8, 7, C.woodL, 1); A.poly([[6, 5], [10.5, 0.5], [15.5, 5.5], [11, 10]], h); A.line(7, 5, 10.5, 1.5, hl, 1); A.line(11, 9.5, 15, 5.5, hd, 1); };
export const bowIcon = (c1, c2, ar) => A => { for (let k = 0; k <= 24; k++) { const t = k / 24, x = Math.round((1 - t) * (1 - t) * 3 + 2 * (1 - t) * t * 2 + t * t * 13), y = Math.round((1 - t) * (1 - t) * 13 + 2 * (1 - t) * t * 2 + t * t * 3); A.r(x, y, 2, 2, c1); A.p(x, y, c2); } A.line(4, 13, 13, 4, '#f0e8d8'); A.line(6, 10, 12, 4, ar || C.woodL); A.p(12, 3, C.ironL); A.p(13, 4, C.ironL); };
export const staffIcon = (o1, o2) => A => { A.line(2, 14, 10, 6, C.woodD, 2); A.line(2, 13, 9, 6, C.woodL, 1); A.p(9, 8, C.woodD); A.p(8, 6, C.woodD); A.e(11.5, 4.5, 3.2, 3.2, o1); A.e(11, 4, 1.4, 1.4, o2); A.p(10, 3, '#ffffff'); A.p(14, 1, o2); A.p(15, 7, o2); };
export const sickleIcon = (b, bl) => A => { A.e(9, 6.5, 5.4, 4.8, b); A.g.globalCompositeOperation = 'destination-out'; A.e(10.6, 8.6, 4.6, 4.2, '#000'); A.g.globalCompositeOperation = 'source-over'; A.p(6, 3, bl); A.p(8, 2, bl); A.line(3, 14, 6, 10, C.woodD, 2); A.p(3, 13, C.woodL); };
export const rodIcon = (c1, c2, bob) => A => { A.line(2, 14, 12, 3, c1, 1); A.line(3, 14, 12, 4, c2, 1); A.p(5, 11, C.iron); A.p(4, 12, C.iron); A.line(13, 3, 13, 10, '#e8e0f0'); A.e(13, 11.5, 1.6, 1.6, bob); A.p(13, 10, '#ffffff'); };
export const swordIcon = (b, bl, g) => A => { A.line(5, 10, 12, 3, b, 2); A.line(6, 9, 12, 3, bl, 1); A.p(13, 2, bl); A.line(3, 8, 7, 12, g, 2); A.line(2, 13, 4, 11, C.woodD, 2); A.p(1, 14, C.amber); };
export const packet = (col, pic) => A => { A.r(4, 3, 8, 11, '#ecd6a8'); A.r(4, 3, 8, 2, '#cdb282'); A.r(5, 13, 6, 1, '#cdb282'); pic(A); };
export const ICON = {
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
export const UICON = {
  heart: A => { A.e(5.5, 6, 3.6, 3.6, C.rose); A.e(10.5, 6, 3.6, 3.6, C.rose); A.poly([[1.9, 7], [14.1, 7], [8, 14]], C.rose); A.p(4, 4, '#fff'); A.p(4, 5, '#ffd0d8'); A.p(11, 10, C.roseD); A.p(10, 11, C.roseD); },
  food: ICON.berry,
  bag: A => { A.r(6, 2, 4, 1, C.woodD); A.p(5, 3, C.woodD); A.p(10, 3, C.woodD); A.e(8, 10, 6, 4.5, C.wood); A.r(2, 9, 12, 4, C.wood); A.e(8, 7, 5.5, 3, C.woodL); A.r(7, 8, 2, 2, C.amber); A.r(3, 13, 10, 1, C.woodD); },
  hammer: A => { A.line(3, 13, 9, 7, C.woodL, 2); A.poly([[6, 5], [10, 1], [14, 5], [10, 9]], C.iron); A.poly([[6, 5], [10, 1], [11, 2], [7, 6]], C.ironL); A.p(11, 7, C.ironD); },
  map: A => { A.r(2, 3, 12, 11, C.cream); A.r(6, 3, 1, 11, '#e2cfae'); A.r(10, 3, 1, 11, '#e2cfae'); A.p(4, 11, C.rose); A.p(5, 10, C.rose); A.p(7, 9, C.rose); A.p(8, 7, C.rose); A.line(10, 5, 12, 7, C.roseD, 1); A.line(12, 5, 10, 7, C.roseD, 1); A.p(4, 5, C.leaf); A.p(5, 6, C.leaf); },
  gear: A => { for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; A.e(8 + Math.cos(a) * 5.3, 8 + Math.sin(a) * 5.3, 1.5, 1.5, C.stoneL); } A.e(8, 8, 5, 5, C.stoneL); A.e(8, 8, 2.1, 2.1, '#3a2e50'); A.p(6, 5, '#fff'); },
  hand: A => { A.e(8, 10.5, 4.6, 4, C.skin); A.r(4, 4, 2, 6, C.skin); A.r(6, 3, 2, 7, C.skin); A.r(8, 3, 2, 7, C.skin); A.r(10, 4, 2, 6, C.skin); A.e(3.4, 10, 1.4, 2.5, C.skin); A.p(5, 5, '#fff'); A.p(7, 4, '#fff'); A.r(6, 12, 4, 1, '#f0c2a0'); },
  dots: A => { A.e(4, 8, 1.6, 1.6, C.cream); A.e(8, 8, 1.6, 1.6, C.cream); A.e(12, 8, 1.6, 1.6, C.cream); },
};
