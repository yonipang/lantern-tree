function playerFrame(dir, step, pal) {
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
const OUTFITS = [['민트', '#6cc9a3', '#479b7f', '#a5ecc9'], ['딸기', '#ff8fa3', '#d9607d', '#ffc2cf'], ['라벤더', '#b493f5', '#7a5cc4', '#e3d4ff'], ['하늘', '#7fb3e0', '#4f84b8', '#c4e2fa'], ['귤', '#ffb15c', '#d9822f', '#ffd9a0']];
// ---- playable characters (original designs). Each has its own hair/hat, outfit palette (dyeable) and details ----
function headHelpers(A, dy) {
  return { R: (x, y, w, h, c) => A.r(x, y + dy, w, h, c), P: (x, y, c) => A.p(x, y + dy, c), E: (x, y, rx, ry, c) => A.e(x, y + dy, rx, ry, c), poly: (pts, c) => A.poly(pts.map(([x, y]) => [x, y + dy]), c) };
}
const CHARS = {
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
const HAIRC = [['갈색', ['#8a5a3c', '#6b4029', '#b07a52']], ['밤색', ['#9a5a3a', '#6e3d27', '#c07e57']], ['검정', ['#3a3045', '#262033', '#5a4d6b']], ['금발', ['#f0c85a', '#c99a2e', '#ffe69a']], ['주황', ['#e08a4a', '#b8642f', '#ffb57a']],
  ['분홍', ['#f29ab8', '#c96b8f', '#ffc6da']], ['하늘', ['#5fc7c9', '#3e9a9e', '#a6ecec']], ['초록', ['#6fb86a', '#4e8a4a', '#a6e09c']], ['보라', ['#9b7ad6', '#7356a8', '#c7b0f0']]];
const EYEC = [['갈색', '#6b4029'], ['초록', '#4f9a5e'], ['파랑', '#3b5a8a'], ['보라', '#8d72c4'], ['호박', '#d98b2b']];
const OUTC = [['민트', ['#6cc9a3', '#479b7f', '#a5ecc9']], ['딸기', ['#ff8fa3', '#d9607d', '#ffc2cf']], ['라벤더', ['#b493f5', '#7a5cc4', '#e3d4ff']], ['하늘', ['#7fb3e0', '#4f84b8', '#c4e2fa']], ['귤', ['#ffb15c', '#d9822f', '#ffd9a0']],
  ['노랑', ['#ffd25c', '#d9a63a', '#fff0a8']], ['남색', ['#4a4f8f', '#33366a', '#6d73b8']], ['이끼', ['#7d9a4f', '#5b7536', '#a6c27a']], ['밤', ['#9a6a4a', '#6e4a33', '#c49272']]];
const HAIRS = {
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
const HATS = {
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
const OUTFITS2 = {
  tunic: { n: '튜닉', front(A, d, p) { if (d === 'down') { A.r(7, 13, 2, 3, p[1]); A.p(7, 14, '#ffc861'); A.p(8, 14, '#ffc861'); } if (d === 'up') { A.r(5, 12, 6, 4, C.woodD); A.r(6, 13, 4, 2, C.wood); } } },
  robe: { n: '로브', front(A, d, p) { if (d === 'down') { A.r(7, 12, 2, 1, C.cream); A.p(8, 14, '#ffc861'); A.p(7, 14, '#ffc861'); A.r(4, 16, 8, 1, p[1]); } } },
  raincoat: { n: '우비', shoe: '#5a7a9a', front(A, d, p) { if (d === 'down') { A.r(8, 12, 1, 5, p[1]); A.p(7, 13, p[1]); A.p(7, 15, p[1]); } if (d === 'up') A.r(5, 12, 6, 1, p[1]); } },
  vest: { n: '탐험 조끼', shoe: '#6b4a2f', front(A, d) { if (d === 'down') { A.r(7, 12, 2, 4, C.cream); A.line(4, 12, 10, 16, '#7d4d2a'); } if (d === 'up') { A.line(11, 12, 5, 16, '#7d4d2a'); A.r(5, 13, 4, 3, '#a8763f'); } if (d === 'side') A.r(5, 13, 3, 3, '#a8763f'); } },
  apron: { n: '앞치마', front(A, d) { if (d === 'down') { A.r(6, 13, 4, 4, '#fff1d6'); A.r(6, 13, 4, 1, '#e8d8c0'); A.p(8, 15, '#ff8fa3'); } if (d === 'side') A.r(9, 13, 3, 3, '#fff1d6'); } },
  cloak: { n: '망토', body(A, d, p) { A.r(3, 12, 10, 5, p[0]); A.r(3, 16, 10, 1, p[1]); A.r(4, 11, 8, 2, p[2]); if (d === 'down') { A.r(8, 13, 1, 4, p[1]); A.p(7, 12, C.cry); A.p(8, 12, C.cryL); A.p(4, 15, C.skin); A.p(11, 15, C.skin); } if (d === 'side') A.p(10, 15, C.skin); if (d === 'up') A.r(4, 13, 8, 1, p[1]); } },
  armor: { n: '꼬마 갑옷', shoe: '#5a5468', back(A, d) { if (d === 'down') A.r(3, 12, 10, 5, '#a8413a'); if (d === 'side') { A.r(3, 12, 4, 6, '#d9604f'); A.r(3, 17, 3, 1, '#a8413a'); } },
    front(A, d, p) { if (d === 'down') { A.r(5, 12, 6, 1, p[2]); A.p(7, 14, '#ffc861'); A.p(8, 14, '#ffc861'); A.p(7, 13, '#ffc861'); A.p(8, 15, '#ffc861'); } if (d === 'up') { A.r(4, 12, 8, 5, '#d9604f'); A.r(4, 16, 8, 1, '#a8413a'); } } },
};
const LOOK_DEF = { hair: 'bob', hc: 0, eye: 0, outfit: 'tunic', oc: 0, hat: 'none' };
function cleanLook(L) { L = Object.assign({}, LOOK_DEF, L || {}); if (!HAIRS[L.hair]) L.hair = 'bob'; if (!HATS[L.hat]) L.hat = 'none'; if (!OUTFITS2[L.outfit]) L.outfit = 'tunic'; L.hc = clamp(L.hc | 0, 0, HAIRC.length - 1); L.eye = clamp(L.eye | 0, 0, EYEC.length - 1); L.oc = clamp(L.oc | 0, 0, OUTC.length - 1); return L; }
function lookDef(L) {
  L = cleanLook(L); const hs = HAIRS[L.hair], hat = HATS[L.hat], of = OUTFITS2[L.outfit], hc = HAIRC[L.hc][1];
  return { n: '나만의 캐릭터', d: '직접 고른 머리와 옷', pal: OUTC[L.oc][1], hc, eye: EYEC[L.eye][1], shoe: of.shoe || '#5a4637', custom: true,
    hair(H, d) { hs.draw(H, d, hc); if (hat.draw) hat.draw(H, d); },
    back(A, d, p) { if (hs.back) hs.back(A, d, hc); if (of.back) of.back(A, d, p); },
    over(A, d, p) { if (hs.over) hs.over(A, d, hc); },
    body: of.body, front: of.front };
}
CHARS.custom = lookDef(LOOK_DEF);
const CHAR_IDS = Object.keys(CHARS);
function charFrame(id, dir, step, pal) {
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
function charHead(A, id, dir, pal, dy, sleep) {
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
function curChar() { return G && CHARS[G.char] ? G.char : 'sprout'; }
function outfitPal(id, o) { return o ? OUTFITS[o % OUTFITS.length].slice(1) : CHARS[id].pal; }
const charPrevCache = {};
function charPreview(id, step = 0, dir = 'down') { const k = id + step + dir; if (CHARS[id].custom || id === '__look') { const c = CHARS[id]; return charFrame(id, dir, step, c.pal).toDataURL(); } if (!charPrevCache[k]) { const c = CHARS[id]; charPrevCache[k] = (c.classic ? playerFrame(dir, step, c.pal) : charFrame(id, dir, step, c.pal)).toDataURL(); } return charPrevCache[k]; }
function buildPlayer(o) {
  const id = curChar(), ch = CHARS[id], pal = (G && G.equip && G.equip.body && WEAR_PAL[G.equip.body.id]) || outfitPal(id, o || 0);
  const fr = (d, st) => ch.classic ? playerFrame(d, st, pal) : charFrame(id, d, st, pal);
  SPR.player = {}; for (const d of ['down', 'up', 'side']) SPR.player[d] = [fr(d, 0), fr(d, 1)];
  SPR.playerW = {}; for (const d of ['down', 'up', 'side']) SPR.playerW[d] = SPR.player[d].map(whiten);
  const f = SPR.player.down[0], c = document.createElement('canvas'); c.width = 16; c.height = 16; c.getContext('2d').drawImage(f, 0, 0, 16, 16, 0, 0, 16, 16); SPR.playerSit = c;
  if (!ch.classic) { SPR.sleepHead = mk(16, 11, A => charHead(A, id, 'down', pal, -2, true)); return; }
  SPR.sleepHead = mk(16, 11, A => { A.e(8, 5.5, 5.2, 4.4, pal[0]); A.e(6.4, 3.2, 2, 1.1, pal[2]); A.e(8, 6.6, 3.6, 2.6, C.skin); A.r(5, 6, 2, 1, INK); A.r(9, 6, 2, 1, INK); A.p(5, 8, C.blush); A.p(10, 8, C.blush); A.r(8, 0, 1, 2, C.leafD); A.p(7, 0, C.leaf); });
}
