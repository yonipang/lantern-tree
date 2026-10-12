// ================= data =================
// v47: two map layouts. 1 = the original 200×200 map (every save made before v47 keeps it); 2 = the 600×600 ring map for new games:
// the lantern tree in the middle, a ring split into the moss cave (north) and mushroom forest (south), then a wide ring split into
// the crystal cave (north), lava cave (south-east) and ice cave (south-west), a sea ring, and hard rock at the edge
let LAY = 1, W = 200, H = 200, CX = 100, CY = 100, BX = 144, BY = 102, SA = { x: 54, y: 118 }, SB = { x: 106, y: 24 }, SL = { x: 96, y: 184 }, SI = { x: 16, y: 104 };
const L2 = { r1: 34, r2: 100, r3: 250, r4: 272 }; // ring radii of layout 2 (start · moss/mushroom · crystal/lava/ice · sea; rock beyond)
function setLayout(v) { LAY = v === 2 ? 2 : 1;
  if (LAY === 2) { W = H = 600; CX = CY = 300; const at = (deg, r) => ({ x: Math.round(CX + Math.cos(deg * Math.PI / 180) * r), y: Math.round(CY + Math.sin(deg * Math.PI / 180) * r) });
    const b = at(-35, 64); BX = b.x; BY = b.y; SA = at(140, 66); SB = at(-90, 172); SL = at(30, 172); SI = at(150, 172); }
  else { W = H = 200; CX = CY = 100; BX = CX + 44; BY = CY + 2; SA = { x: CX - 46, y: CY + 18 }; SB = { x: CX + 6, y: CY - 76 }; SL = { x: CX - 4, y: CY + 84 }; SI = { x: CX - 84, y: CY + 4 }; }
  layoutTexts(); }
const devLayout = () => { try { const v = +localStorage.getItem('lantern-tree-layout'); return v === 1 || v === 2 ? v : 0; } catch (_) { return 0; } }; // tests pin the old layout
const DIR8 = ['동쪽', '남동쪽', '남쪽', '남서쪽', '서쪽', '북서쪽', '북쪽', '북동쪽'];
const dirKo = (x, y) => DIR8[((Math.round(Math.atan2(y - CY, x - CX) / (Math.PI / 4)) % 8) + 8) % 8];
const LAVA = 17;
const idx = (x, y) => y * W + x;
// recipes people usually make many of at once get a quantity picker
const isMulti = r => ['build', 'food', 'mat'].includes(r.cat) || ['floor', 'wall', 'ground', 'food', 'mat', 'fert'].includes(ITEMS[r.out].kind);
function maxCraft(r) { let m = 99; for (const [id, c] of r.req) m = Math.min(m, Math.floor(availCount(id) / c)); return Math.max(0, m); }
const bmat = m => BMAT[m] || BMAT_X[m];
const twH = type => (BTYPE[type] || {}).h || TW_H[type];
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
for (const id in DECOR) OSPR[id] = DECOR[id].spr;

OSPR.forge = [16, 20, A => { A.r(2, 13, 2, 6, C.woodD); A.r(12, 13, 2, 6, C.woodD); A.r(1, 10, 14, 4, C.wood); A.r(1, 10, 14, 1, C.copperL); A.r(1, 11, 14, 1, C.copper); A.r(1, 13, 14, 1, C.woodD); A.r(4, 6, 8, 3, C.iron); A.r(3, 5, 10, 1, C.ironL); A.r(12, 6, 3, 1, C.iron); A.r(6, 9, 4, 1, C.ironD); A.line(10, 1, 13, 4, C.woodD); A.r(8, 1, 4, 2, C.ironD); A.r(2, 8, 2, 2, C.copper); A.p(2, 8, C.copperL); }];
Object.assign(ICON, {
  resin: A => { A.poly([[8, 2], [11.6, 8.5], [4.4, 8.5]], '#e8a33a'); A.e(8, 10, 4, 4, '#e8a33a'); A.e(7, 9, 1.5, 2, '#ffd98a'); A.p(6, 8, '#fff3d0'); A.p(10, 12, '#b8742a'); A.p(9, 13, '#b8742a'); },
  rope: A => { A.e(8, 9, 6, 4.6, '#b8903f'); A.e(8, 9, 4.6, 3.4, '#d9b66a'); A.e(8, 9, 3, 2.2, '#b8903f'); A.e(8, 9, 1.6, 1.1, '#7a5a2a'); A.line(12, 11, 15, 14, '#b8903f', 2); A.p(5, 6, '#f0d898'); A.p(9, 5, '#f0d898'); },
});
const wtOf = w => WTYPE[(w && w.wt) || 'sword'];
for (const id in WEAPONS) ICON[id] = WEAPONS[id][6];
for (const id in UNIQ) ICON[id] = UNIQ[id][5];
ICON.golemCore = A => { A.poly([[8, 1], [14, 8], [8, 15], [2, 8]], C.cryD); A.poly([[8, 2.5], [12.5, 8], [8, 13.5], [3.5, 8]], C.cry); A.poly([[8, 2.5], [8, 8], [3.5, 8]], C.cryL); A.e(8, 8, 2, 2, '#7ff0e6'); A.p(7, 7, '#ffffff'); };
ICON.pickCrystal = pickIcon(C.cry, C.cryL);
const rarOf = id => RAR[id] != null ? RAR[id] : -1;
const rarCol = id => rarOf(id) >= 1 ? RARITY[rarOf(id)][1] : null;
const rarName = id => { const c = rarCol(id), n = ITEMS[id].n; return c ? `<span style="color:${c}">${n}</span>` : n; };
const benchNear = near => near.has('bench') || near.has('forge');
BAG_UPS.forEach(([id]) => { ICON[id] = A => { UICON.bag(A); A.r(10, 1, 6, 6, '#7fe0b5'); A.r(12, 2, 2, 4, '#241b2f'); A.r(11, 3, 4, 2, '#241b2f'); }; });
