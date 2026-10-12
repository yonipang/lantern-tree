// ---- building pieces: thin walls, half walls, window walls, window frames, fences, doors, pillars and the auto sliding door (auto-connecting) ----
// v41: pieces stand on the tile's bottom line like natural walls (TW_BASE), and the tall ones are as high as a natural wall; roofs were removed
const BMAT = { wood: { n: '나무', res: 'wood', f: '#b0743f', fd: '#7d4d2a', fl: '#d9a066', c: '#e0b07a', cd: '#8a5a33', door: '#8f5a32' },
  stone: { n: '돌', res: 'stone', f: '#8f8aa3', fd: '#625d78', fl: '#b9b4cc', c: '#d3cee3', cd: '#6d6884', door: '#6d6884' } };
const BMAT_X = { metal: { n: '금속', f: '#8d97a8', fd: '#5a5468', fl: '#c8d0dc', c: '#dfe5ee', cd: '#6c7688', door: '#a9b6c8' } };
const bmat = m => BMAT[m] || BMAT_X[m];
const BTYPE = { // h: height in px · cnt: pieces per craft · cost: material per craft
  thin: { n: '얇은 벽', h: 16, cnt: 2, cost: 2, d: '얇고 아늑한 실내 벽. 옆 칸과 자동으로 이어지고, 바위벽과 높이가 같아요.' },
  half: { n: '반벽', h: 9, cnt: 2, cost: 1, d: '허리 높이의 낮은 벽. 옆 칸과 자동으로 이어져요.' },
  win: { n: '창문벽', h: 16, cnt: 2, cost: 3, d: '작은 창이 난 얇은 벽. 나란히 놓으면 긴 창이 돼요.' },
  frame: { n: '창문 틀', h: 16, cnt: 1, cost: 2, d: '벽 대신 세우는 큰 유리창.' },
  fence: { n: '울타리', h: 10, cnt: 2, cost: 1, d: '마당을 두르는 울타리. 울타리·기둥·문과 이어져요.' },
  door: { n: '문', h: 16, cnt: 1, cost: 4, d: '바라보고 누르면 열고 닫아요. 두 칸을 나란히 놓으면 양문이 되어 함께 열려요.' },
  pillar: { n: '기둥', h: 22, cnt: 2, cost: 1, d: '가느다란 기둥. 벽과 울타리가 이어져요.' },
};
const TW_H = { slide: 16 }; // pieces outside the wood/stone sets
const twH = type => (BTYPE[type] || {}).h || TW_H[type];
const BCAP = s => s[0].toUpperCase() + s.slice(1);
const bId = (type, mat) => 'b' + BCAP(type) + BCAP(mat); // e.g. bThinWood
function addBuildPieces() {
  for (const mat in BMAT) {
    const M = BMAT[mat];
    for (const type in BTYPE) { const T = BTYPE[type], id = bId(type, mat);
      OBJ[id] = { n: `${M.n} ${T.n}`, solid: 1, item: id, tw: { type, mat }, door: type === 'door' ? 1 : 0 };
      ITEMS[id] = { n: `${M.n} ${T.n}`, kind: 'place', obj: id, d: T.d };
      if (type === 'door') USE[id] = 'door';
      RECIPES.push(Rc(id, T.cnt, [[M.res, T.cost]], 'bench', 'build')); }
  }
  // auto sliding door: opens by itself while powered and someone walks up; without power it is an ordinary door
  OBJ.slideDoor = { n: '자동 미닫이문', solid: 1, item: 'slideDoor', tw: { type: 'slide', mat: 'metal' }, door: 1, dev: 'slide', idle: .01 };
  ITEMS.slideDoor = { n: '자동 미닫이문', kind: 'place', obj: 'slideDoor', d: '전선으로 전기를 이어 주면 다가갈 때 옆으로 스르륵 열리고, 멀어지면 닫혀요. 몬스터는 못 열어요. 전기가 없으면 손으로 여닫아요.' };
  USE.slideDoor = 'door';
  RECIPES.push(Rc('slideDoor', 1, [['copperBar', 3], ['ironBar', 2], ['crystal', 1]], 'forge', 'build'));
}
const twType = o => o && OBJ[o.t] && OBJ[o.t].tw ? OBJ[o.t].tw.type : null;
// wall-like pieces split the floor of their own tile along the wall line
const TW_WALL = { thin: 1, half: 1, win: 1, frame: 1, door: 1, slide: 1 };
const wallPiece = i => { const o = G.objs.get(i); return !!(o && TW_WALL[twType(o)]); };
function twLinks(type, x, y) {
  if (!inB(x, y)) return false; const i = idx(x, y);
  if (G.wall[i]) return type !== 'fence';
  const o = G.objs.get(i), t = twType(o); if (!t) return false;
  if (type === 'fence') return t === 'fence' || t === 'pillar' || t === 'door';
  return t !== 'fence' || type === 'door' || type === 'pillar';
}
const TW_JOIN = { door: 1, win: 1, slide: 1 }; // the same kind side by side draws as one wide piece (double door, long window)
const twSame = (type, x, y) => inB(x, y) && twType(G.objs.get(idx(x, y))) === type;
function twMask(x, y, type) { if (type === 'pillar') return 0;
  let m = (twLinks(type, x, y - 1) ? 1 : 0) | (twLinks(type, x + 1, y) ? 2 : 0) | (twLinks(type, x, y + 1) ? 4 : 0) | (twLinks(type, x - 1, y) ? 8 : 0);
  if (TW_JOIN[type]) m |= (twSame(type, x - 1, y) ? 16 : 0) | (twSame(type, x + 1, y) ? 32 : 0);
  return m; }
// doors that open together: the same kind joined left and right in one row
function doorGroup(x, y) { const o = G.objs.get(idx(x, y)), t = twType(o), out = [[idx(x, y), o]]; if (!t || !TW_JOIN[t]) return out;
  for (const s of [-1, 1]) for (let k = 1; k <= 4; k++) { const xx = x + s * k; if (!twSame(t, xx, y)) break; const j = idx(xx, y); out.push([j, G.objs.get(j)]); }
  return out; }
const TW_BASE = 4; // pieces are drawn in their own coordinates with the footprint line at y=12, then moved down onto the tile's bottom line
// draws one piece in tile coordinates (tile top at y0); the piece rises h px above its footprint line. open: 0..1 (a sliding door slides part way)
function twDraw(A, type, mat, mask, open, h, y0) {
  y0 += TW_BASE;
  const M = bmat(mat), R = (x, y, w, hh, c) => { if (w > 0 && hh > 0) A.r(x, y0 + y, w, hh, c); }, P = (x, y, c) => A.p(x, y0 + y, c);
  const N = mask & 1, E = mask & 2, S = mask & 4, Wm = mask & 8, jw = mask & 16, je = mask & 32, ew = E || Wm || !(N || S), x0 = Wm ? 0 : 6, x1 = E ? 16 : 10;
  const face = (a, b) => { R(a, 12 - h, b - a, h, M.f); R(a, 11, b - a, 1, M.fd);
    if (mat === 'wood') { for (let x = a; x < b; x++) if (x % 4 === 0) R(x, 12 - h, 1, h - 1, M.fd); }
    else if (mat === 'metal') { R(a, 12 - h + 2, b - a, 1, M.fl); R(a, 12 - h + 9, b - a, 1, M.fd); }
    else for (let r = 0, y = 12 - h + 3; y < 11; y += 4, r++) { R(a, y, b - a, 1, M.fd); for (let x = a + (r % 2 ? 2 : 0); x < b; x += 5) R(x, y - 3, 1, 3, M.fd); } };
  const cap = (a, b, ya, yb, col) => { R(a, ya - h, b - a, yb - ya, col || M.c); };
  if (type === 'pillar') { R(6, 12 - h, 4, h, M.f); R(6, 12 - h, 1, h, M.fl); R(9, 12 - h, 1, h, M.fd); R(5, 8 - h, 6, 4, M.c); R(5, 11 - h, 6, 1, M.cd); R(5, 10, 6, 2, M.fd); return; }
  if (type === 'fence') { const rail = (a, b) => { R(a, 12 - h + 2, b - a, 2, M.fl); R(a, 12 - h + 4, b - a, 1, M.fd); R(a, 12 - h + 6, b - a, 2, M.fl); R(a, 12 - h + 8, b - a, 1, M.fd); };
    if (N) R(7, 0 - h + 3, 2, 12, M.fl); if (S) R(7, 12 - h + 3, 2, 4, M.fl); if (ew) rail(x0, x1); R(7, 12 - h, 2, h, M.f); R(7, 12 - h - 1, 2, 1, M.c); return; }
  if (type === 'slide') { // two metal posts with a panel that slides into the left post (or apart, for a pair)
    if (ew) { const a = jw ? 0 : 3, b = je ? 16 : 13, w = b - a, s = open || 0, right = jw && !je;
      if (!jw) face(x0, 3); if (!je) face(13, x1); cap(x0, x1, 8, 12); R(x0, 12 - h, x1 - x0, 1, M.cd);
      R(a, 12 - h + 1, w, 1, M.fd); P(right ? 14 : 8, 12 - h, s > .5 ? '#7fe0b5' : '#ffd25c');
      const pw = Math.max(1, Math.round(w * (1 - s))), px = right ? b - pw : a;
      R(px, 12 - h + 2, pw, h - 3, M.door); R(px, 12 - h + 2, pw, 1, M.fl); R(right ? px : px + pw - 1, 12 - h + 2, 1, h - 3, M.fd);
      if (pw >= 6) { R(px + (right ? 2 : pw - 5), 12 - h + 4, 3, h - 9, '#a8dcf5'); P(px + (right ? 2 : pw - 5), 12 - h + 5, '#eaf8ff'); }
      if (s > .02) R(right ? a : a + pw, 12 - h + 2, w - pw, 1, 'rgba(20,12,30,0.35)'); }
    else { if (N) cap(6, 10, 0, 8); cap(6, 10, 8, 12); if (S) cap(6, 10, 12, 16); else face(6, 10); if ((open || 0) < .5) R(7, (N ? 0 : 8) - h + 1, 2, (S ? 16 : 12) - (N ? 0 : 8) - 1, M.door); }
    return; }
  if (type === 'door' && open) {
    if (ew) { if (!jw) face(x0, 3); if (!je) face(13, x1); cap(x0, x1, 8, 12);
      if (jw && !je) { R(12, 12 - h, 1, h, M.fd); R(10, 12 - h + 1, 2, h - 1, M.door); R(11, 12 - h + 1, 1, h - 1, M.fl); } // right leaf of a pair swings to the right post
      else if (!jw) { R(3, 12 - h, 1, h, M.fd); R(4, 12 - h + 1, 2, h - 1, M.door); R(4, 12 - h + 1, 1, h - 1, M.fl); } }
    else { cap(6, 10, 0, 2); cap(6, 10, 14, 16); R(10, 2 - h + 2, 1, 10, M.door); }
    return; }
  if (N) cap(6, 10, 0, 8);
  if (ew) { face(x0, x1); cap(x0, x1, 8, 12); R(x0, 12 - h, x1 - x0, 1, M.cd);
    if (type === 'win') { const a = jw ? 0 : Math.max(x0, 4), b = je ? 16 : Math.min(x1, 12); if (b - a >= 4) { R(a, 12 - h + 3, b - a, 8, M.fl); R(a + (jw ? 0 : 1), 12 - h + 4, b - a - (jw ? 0 : 1) - (je ? 0 : 1), 6, '#a8dcf5'); P(a + 2, 12 - h + 5, '#eaf8ff'); P(a + 3, 12 - h + 6, '#eaf8ff'); if (!jw && !je) R((a + b) >> 1, 12 - h + 4, 1, 6, M.fl); } }
    if (type === 'frame') { R(x0 + (Wm ? 0 : 1), 12 - h + 1, x1 - x0 - (Wm ? 0 : 1) - (E ? 0 : 1), h - 3, '#a8dcf5'); R(x0, 12 - h + Math.round(h / 2), x1 - x0, 1, M.fl); if (x1 - x0 >= 8) R(8, 12 - h + 1, 1, h - 3, M.fl); P(x0 + 2, 12 - h + 3, '#eaf8ff'); P(x0 + 3, 12 - h + 4, '#eaf8ff'); }
    if (type === 'door') { const a = jw ? 0 : 3, b = je ? 16 : 13; R(a, 12 - h + 1, b - a, h - 2, M.door); R(a, 12 - h + 1, b - a, 1, M.fl);
      if (!jw && !je) { R(8, 12 - h + 1, 1, h - 2, M.fd); P(10, 12 - h + 10, '#ffc861'); P(6, 12 - h + 10, '#ffc861'); }
      else { if (je) R(15, 12 - h + 1, 1, h - 2, M.fd); P(je ? 13 : 2, 12 - h + 10, '#ffc861'); } }
  } else { cap(6, 10, 8, 12); if (!S) { face(6, 10); if (type === 'win' || type === 'frame') R(7, 12 - h + 3, 2, 8, '#a8dcf5'); if (type === 'door') R(7, 12 - h + 1, 2, h - 2, M.door); } }
  if (S) cap(6, 10, 12, 16);
  if (!ew) { if (type === 'win' || type === 'frame') R(7, (N ? 0 : 8) - h + 1, 2, (S ? 16 : 12) - (N ? 0 : 8) - 2, '#a8dcf5'); if (type === 'door') R(7, (N ? 0 : 8) - h, 2, (S ? 16 : 12) - (N ? 0 : 8), M.door); }
}
const TWC = {}, TW_Y0 = 26;
function twSprite(id, mask, open) { const k = id + '|' + mask + '|' + (+open || 0); if (TWC[k]) return TWC[k]; const { type, mat } = OBJ[id].tw;
  return TWC[k] = mk(16, TW_Y0 + 16, A => twDraw(A, type, mat, mask, +open || 0, twH(type), TW_Y0), 'sel'); }
function twIcon(id) { const { type, mat } = OBJ[id].tw, h = Math.min(10, Math.round(twH(type) * .5) + 2); return mk(16, 16, A => twDraw(A, type, mat, type === 'pillar' ? 0 : 10, false, h, 3 - TW_BASE), 'sel'); }
// a sliding door's panel glides open and shut (kept outside the save)
const SLIDE = new WeakMap(), SLIDE_PW = new WeakMap(), SLIDE_NEAR = 2;
function slideStep(o, t) { const tg = o.open ? 1 : 0; let s = SLIDE.get(o); if (!s) SLIDE.set(o, s = { v: tg, t }); const dt = clamp(t - s.t, 0, .1); s.t = t; s.v += clamp(tg - s.v, -dt * 5, dt * 5); return Math.round(s.v * 4) / 4; }
addBuildPieces();

