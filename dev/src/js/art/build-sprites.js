const DECO_DEF = {
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
const SPR = {};
function buildTerrain() {
  SPR.fringe = {}; SPR.fringeW = {}; SPR.corner = {}; SPR.cornerW = {}; SPR.fringeL = {}; SPR.fringeX = {}; SPR.fringeWL = {}; SPR.fringeWX = {};
  for (const t of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]) { SPR.fringeW[t] = makeFringe(t, 'water'); SPR.fringeWL[t] = makeFringe(t, 'water', 'land'); SPR.fringeWX[t] = makeFringe(t, 'water', 'fx'); SPR.cornerW[t] = makeCorner(t, 'water'); if (PRI[t]) { SPR.fringe[t] = makeFringe(t, 'edge'); SPR.fringeL[t] = makeFringe(t, 'edge', 'land'); SPR.fringeX[t] = makeFringe(t, 'edge', 'fx'); SPR.corner[t] = makeCorner(t, 'edge'); } }
  SPR.deco = {}; for (const t in DECO_DEF) SPR.deco[t] = DECO_DEF[t].map(f => mk(7, 7, f, 'soft'));
  SPR.lily = [mk(9, 7, A => { A.e(4.5, 3.5, 3.6, 2.6, '#4f9a5e'); A.e(3.6, 2.8, 1.6, 1, '#6cbb76'); A.poly([[4.5, 3.5], [8.5, 1.8], [8.5, 3.4]], '#00000000'); A.g.globalCompositeOperation = 'destination-out'; A.poly([[4.5, 3.5], [8.6, 1.6], [8.6, 3.6]], '#000'); A.g.globalCompositeOperation = 'source-over'; }, 'sel'),
    mk(9, 8, A => { A.e(4.5, 4.5, 3.6, 2.6, '#4f9a5e'); A.e(3.6, 3.8, 1.6, 1, '#6cbb76'); A.e(5, 2.6, 1.5, 1.3, '#ffb3c6'); A.p(5, 2, '#ffe0ea'); A.p(5, 3, C.amber); }, 'sel')];
}
function buildSprites() {
  buildPlayer(0);
  SPR.slimeG = slimeSpr('#86d96b', '#d2f7b8', '#4f9e45'); SPR.slimeO = slimeSpr('#f2a65a', '#ffe0b8', '#c06e2c'); SPR.slimeP = slimeSpr('#b58cf0', '#ecdfff', '#7a55c4');
  for (const c in FLOWERS) { const F = FLOWERS[c]; SPR['bloom' + c] = bloomSpr(F[2], F[3], F[4]); }
  SPR.wild = {}; for (const c in FLOWERS) SPR.wild[c] = wildSpr(FLOWERS[c][2], FLOWERS[c][3]);
  SPR.shroomy = shroomySpr(); SPR.boss = bossSpr(); SPR.queen = queenSpr(); SPR.golem = golemSpr();
  SPR.shot = { spore: shotSpr('#d59bff', '#f6e6ff'), shard: shotSpr(C.cry, '#ffffff', true), fire: shotSpr('#ff8a3d', '#ffe0a0'), ice: shotSpr('#9fd8f0', '#ffffff', true) };
  SPR.magmaSlime = slimeSpr('#ff7a3d', '#ffd0a0', '#c04a1a'); SPR.frostSlime = slimeSpr('#9fd8f0', '#ffffff', '#5a9ac8'); SPR.cinder = emberSpr(); SPR.snowling = snowSpr(); SPR.turtle = turtleSpr(false); SPR.turtleS = turtleSpr(true); SPR.spirit = spiritSpr(); SPR.water = [waterTex(0), waterTex(1)];
  MKDEF = 'sel';
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
  for (const k in OBJ) if (OBJ[k].sz && OBJ[k].rotV && !SPR.obj[k + 'V'] && SPR.obj[k]) SPR.obj[k + 'V'] = rot90(SPR.obj[k]);
  for (const k in OBJ) if (OBJ[k].dir4 && SPR.obj[k + 'U']) { const src = SPR.obj[k + 'U'], s = src.hd ? HD : 1, c2 = document.createElement('canvas'); c2.width = src.width; c2.height = src.height; c2.hd = src.hd; c2.getContext('2d').drawImage(src, 0, 0, src.width, 11 * s, 0, 0, src.width, 11 * s); SPR.obj[k + 'Ub'] = c2; }
  SPR.obj.bush = SPR.bush[1];
  SPR.objOff = {}; for (const k of ['torch', 'lampShroom', 'lampCrystal', 'sproutLamp', 'sporeLamp', ...Object.keys(DECOR).filter(k => DECOR[k].use === 'lamp')]) SPR.objOff[k] = dimmed(SPR.obj[k]);
  SPR.giant = {}; for (const k in SPR.crop) SPR.giant[k] = giantSpr(k);
  SPR.young = {}; for (const k of YOUNG_TREES) if (OSPR[k]) SPR.young[k] = ARTC['obj/' + k] || GROW_SPR[k] ? youngOf(SPR.obj[k]) : youngSpr(OSPR[k]);
  SPR.glow = {}; bossExtraSprites();
  applyArt();
  SPR.fp = {}; for (const id in GREW) if (SPR.obj[id] && OSPR[id]) { const [w, h, f, o] = OSPR[id]; SPR.fp[id] = { big: SPR.obj[id], bigV: SPR.obj[id + 'V'] || (GREW[id][2] ? rot90(SPR.obj[id]) : null), small: ARTC['obj/' + id] ? SPR.obj[id] : mk(w, h, f, o) }; }
  setFootprints(FPV);
  buildTerrain();
  MKDEF = null;
}
// sprites that can't take hand-drawn art yet (floors/walls come with the 32px floor template; characters are built from parts)
// v54: floors and walls take drawn art too (floor/<type>/<n>, any number of variants; wtop/<type>/0-3; wfront/<type>)
const ART_SKIP = new Set(['crack', 'deco', 'water', 'fringe', 'fringeL', 'fringeX', 'fringeW', 'fringeWL', 'fringeWX', 'corner', 'cornerW', 'player', 'playerW', 'playerSit', 'sleepHead', 'treeSt', 'glow', 'animal']);
const ART_SEL = new Set(['item', 'ui', 'obj', 'objOff', 'crop', 'giant', 'young', 'bush', 'wild', 'lantern', 'lanternS', 'lily', 'tmoss', 'tflower']);
const artSeg = path => { const s = path.split('/'); if (s[0] === 'mon' || s[0] === 'etc') s.shift(); return s; }; // mon/slimeG → SPR.slimeG
function artPaint(path, ol) { // the drawn picture plus the outline the old sprite had (ol), unless it was packed as .raw
  const key = path + '|' + ol; if (ARTP[key]) return ARTP[key]; const src = ARTC[path], c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); c.hd = true;
  if (!ART[path][1]) ol = null; if (ol === 'soft') softShadow(c); else if (ol) { if (HD > 1) outlineHD(c); else if (ol === 'sel') outlineSel(c); else outline(c, ol); } // 16px art gets the old sprite's own outline; 32px art the soft one
  c.ol = ol; return ARTP[key] = c; }
const olOf = v => { if (v instanceof HTMLCanvasElement) return v.ol; if (v && typeof v === 'object') for (const k in v) { const o = olOf(v[k]); if (o !== undefined) return o; } return undefined; };
function setArt(o, key, c) { const v = o[key]; if (v == null || v instanceof HTMLCanvasElement) o[key] = c; else if (typeof v === 'object') for (const k in v) setArt(v, k, c); }
function cropArt(path, ol) { // a drawn crop is only the plant: the game puts the right soil (dry · watered · fertilized) under it
  const art = artPaint(path, ol); return [0, 1, 2, 3].map(v => { const soil = mk(16, 16, A => cropSoil(A, v), ol === undefined ? 'sel' : ol), S = 16 * HD, w = Math.max(S, art.width), h = Math.max(S, art.height), c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(soil, (w - S) >> 1, h - S, S, S); g.drawImage(art, (w - art.width) >> 1, h - art.height); c.hd = true; c.ol = art.ol; return c; }); }
function applyArt() { // shallow paths first so crop/berry/3 wins over crop/berry
  for (const path of Object.keys(ARTC).sort((a, b) => a.split('/').length - b.split('/').length)) { const seg = artSeg(path); if (!seg.length || ART_SKIP.has(seg[0])) continue;
    if (seg[0] === 'crop' && (seg.length === 2 || seg.length === 3) && SPR.crop[seg[1]]) { const C0 = SPR.crop[seg[1]]; for (const st of seg.length === 3 ? [+seg[2]] : [0, 1, 2, 3]) if (C0[st]) C0[st] = cropArt(path, olOf(C0[st])); continue; }
    let o = SPR; for (let i = 0; i < seg.length - 1; i++) { if (o[seg[i]] == null || o[seg[i]] instanceof HTMLCanvasElement) o[seg[i]] = {}; o = o[seg[i]]; }
    const last = seg[seg.length - 1]; let ol = olOf(o[last]); if (ol === undefined) ol = ART_SEL.has(seg[0]) ? 'sel' : INK; setArt(o, last, artPaint(path, ol)); } }
function youngOf(src) { const w2 = Math.max(1, Math.round(src.width * .78)), h2 = Math.max(1, Math.round(src.height * .78)), c = document.createElement('canvas'); c.width = w2; c.height = h2; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, w2, h2); c.hd = src.hd; return c; }
function glowSprite(col) {
  if (SPR.glow[col]) return SPR.glow[col];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const [r, gg, b] = hexRgb(col).map(v => Math.round(v * 255));
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, `rgba(${r},${gg},${b},0.55)`); gr.addColorStop(0.4, `rgba(${r},${gg},${b},0.16)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return SPR.glow[col] = c;
}

