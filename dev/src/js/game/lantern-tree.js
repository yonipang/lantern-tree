// ---- lantern tree at play: growth show, see-through canopy, falling leaves, glow (all visual, nothing saved) ----
const TREEFX = { grow: null, leaves: [], alpha: 1, leafT: 0 };
const treeStage = () => G ? clamp(G.treeSeeds | 0, 0, 5) : 0;
const treeBase = () => ({ x: CX + .5, y: CY + 1 + 2 / 16 });
function treeBox(L) { const b = treeBase(); return { l: b.x + (L.box.x0 - L.w / 2) / 16, r: b.x + (L.box.x1 + 1 - L.w / 2) / 16, t: b.y - (L.h - L.box.y0) / 16, b: b.y - (L.h - L.box.y1 - 1) / 16 }; }
function behindCanopy() { const p = G.p, L = SPR.treeSt && SPR.treeSt[treeStage()]; if (!L || p.y >= CY + 1) return false; const k = treeBox(L); return p.x + .3 > k.l && p.x - .3 < k.r && p.y > k.t + .3 && p.y - .9 < k.b; }
function treeLeaf(st, burst) {
  const L = SPR.treeSt[st], b = treeBase(), k = treeBox(L), P = TREE_PAL[st];
  const x = k.l + .3 + Math.random() * Math.max(.1, k.r - k.l - .6), top = k.t + (k.b - k.t) * (.35 + Math.random() * .6), gy = b.y - .2 + Math.random() * .8;
  const col = burst && st >= 3 && Math.random() < .35 ? (Math.random() < .5 ? '#ffb3c8' : '#fff1f6') : P[1 + ((Math.random() * 3) | 0)];
  TREEFX.leaves.push({ x, y: gy, z: Math.max(.3, gy - top), vz: burst ? .9 + Math.random() * .8 : .3 + Math.random() * .2, vx: burst ? (x - b.x) * (.8 + Math.random()) : (Math.random() - .5) * .3, vy: burst ? (Math.random() - .2) * .7 : 0, t: 0, ph: Math.random() * 6.28, col });
}
function updateTree(dt) {
  const F = TREEFX, st = treeStage(), g = F.grow;
  if (g) { g.t += dt; if (!g.burst && g.t >= .45) { g.burst = 1; if (g.to >= 1) for (let k = 0; k < 22; k++) treeLeaf(g.to, 1); } if (g.t >= 1.6) F.grow = null; }
  F.alpha += ((behindCanopy() ? .42 : 1) - F.alpha) * Math.min(1, dt * 8);
  for (let i = F.leaves.length - 1; i >= 0; i--) { const q = F.leaves[i]; q.t += dt;
    if (q.z > 0) { q.z = Math.max(0, q.z - q.vz * dt); q.x += (q.vx + Math.sin(q.t * 2.4 + q.ph) * .35) * dt; q.y += q.vy * dt; q.vx *= Math.pow(.4, dt); q.vy *= Math.pow(.4, dt); }
    else { q.rest = (q.rest || 0) + dt; if (q.rest > .8) F.leaves.splice(i, 1); } }
  if (st >= 5 && F.leaves.length < 14 && Math.hypot(G.p.x - CX, G.p.y - CY) < 22) { F.leafT -= dt; if (F.leafT <= 0) { F.leafT = .7 + Math.random() * 1.1; treeLeaf(st, 0); } }
}
// moss and little flowers on bare ground (dirt or moss with nothing on it) near the roots; decided per tile, never stored
function spreadKind(x, y, R) {
  if (!R || !inB(x, y)) return null; const i = idx(x, y); if (G.wall[i] || (G.floor[i] !== 1 && G.floor[i] !== 2) || G.objs.get(i) || G.wire.has(i)) return null;
  const e = Math.hypot(x - CX, y - CY) / R; if (e >= 1 || hash2(x, y, 71) > .6 * (1 - e * e * e)) return null;
  const k = hash2(x, y, 72); return k < .55 ? 'm' + (((k * 6) | 0) % 3) : ['R', 'B', 'Y', 'W'][Math.min(3, ((k - .55) / .45 * 4) | 0)];
}
function drawSpread(x, y, sx, sy, R) {
  const k = spreadKind(x, y, R); if (!k) return;
  if (k[0] === 'm') ctx.drawImage(SPR.tmoss[+k[1]], sx + 1 + ((hash2(x, y, 73) * 5) | 0), sy + 4 + ((hash2(x, y, 74) * 6) | 0));
  else { ctx.drawImage(SPR.tflower[k], sx + 2 + ((hash2(x, y, 73) * 9) | 0), sy + 2 + ((hash2(x, y, 74) * 8) | 0)); if (hash2(x, y, 75) < .35) ctx.drawImage(SPR.tmoss[0], sx + ((hash2(x, y, 76) * 6) | 0), sy + 9); }
}
function drawTreeLook(L, t, o) {
  const b = treeBase(), sc = o.sc || 1, a = o.alpha, ca = a * o.ca, sw = L.s >= 5 ? Math.round(Math.sin(t * .7) * 1.2) / 16 : 0;
  const at = (lx, ly) => ({ x: b.x + (lx - L.w / 2) * sc / 16, y: b.y - (L.h - ly) * sc / 16 });
  if (a <= 0) return;
  shadow(b.x, CY + .95, (1.1 + L.w / 64) * sc, .3 * a);
  drawImg(L.trunk, b.x, b.y, { sx: sc, sy: sc, alpha: a });
  if (L.s < 2) L.lan.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 11); drawImg(SPR.lantern[k < L.s ? 1 : 0], q.x, q.y, { alpha: a }); });
  drawImg(L.canopy, b.x + sw, b.y, { sx: sc, sy: sc, alpha: ca });
  if (L.s >= 2) L.lan.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 11); drawImg(SPR.lantern[k < L.s ? 1 : 0], q.x + sw, q.y, { alpha: ca }); });
  L.small.forEach(([lx, ly], k) => { const q = at(lx + Math.sin(t * 1.3 + k * 2) * .5, ly + 8); drawImg(SPR.lanternS, q.x + sw, q.y, { alpha: ca }); });
}
function drawTree(t) {
  const S = SPR.treeSt, g = TREEFX.grow, ca = TREEFX.alpha;
  if (!g) { drawTreeLook(S[treeStage()], t, { alpha: 1, ca }); return; }
  const u = clamp((g.t - .2) / .9, 0, 1), e = 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2); // grows with a little overshoot
  drawTreeLook(S[g.from], t, { alpha: 1 - clamp((u - .7) / .3, 0, 1), ca });
  drawTreeLook(S[g.to], t, { alpha: Math.min(1, u * 1.7), ca, sc: .78 + .22 * e });
}
function drawTreeLeaves(T, camX, camY) {
  for (const q of TREEFX.leaves) { ctx.globalAlpha = q.z > 0 ? 1 : Math.max(0, 1 - q.rest / .8); ctx.fillStyle = q.col; const X = Math.round(q.x * T - camX), Y = Math.round((q.y - q.z) * T - camY); ctx.fillRect(X, Y, 2, 1); if (Math.sin(q.t * 5 + q.ph) > 0) ctx.fillRect(X + 1, Y - 1, 1, 1); }
  ctx.globalAlpha = 1;
}
// drawn after the darkness so lanterns, fruit, fireflies and the blessing edge read as light
function drawTreeGlow(t, T, camX, camY, cw, ch) {
  const st = treeStage(), g = TREEFX.grow, b = treeBase(), show = g ? (g.t > .7 ? g.to : g.from) : st, L = SPR.treeSt[show], ca = TREEFX.alpha;
  const onS = (X, Y, m = 12) => X > -m && Y > -m && X < cw + m && Y < ch + m, sw = show >= 5 ? Math.round(Math.sin(t * .7) * 1.2) : 0;
  const at = (lx, ly) => [Math.round((b.x + (lx - L.w / 2) / 16) * T - camX), Math.round((b.y - (L.h - ly) / 16) * T - camY)];
  ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = true;
  if (onS(b.x * T - camX, (b.y - 2.5) * T - camY, 120)) {
    L.lan.forEach(([lx, ly], k) => { if (k >= show) return; const [X, Y] = at(lx + Math.sin(t * 1.6 + k) * .6, ly + 7); ctx.globalAlpha = (.5 + Math.sin(t * 2 + k) * .08) * (show >= 2 ? ca : 1); ctx.drawImage(glowSprite('#ffd27a'), X + sw - 10, Y - 10, 20, 20); });
    L.small.forEach(([lx, ly], k) => { const [X, Y] = at(lx, ly + 5); ctx.globalAlpha = (.45 + Math.sin(t * 2.3 + k * 1.9) * .1) * ca; ctx.drawImage(glowSprite('#ffd27a'), X + sw - 7, Y - 7, 14, 14); });
    L.fruit.forEach(([lx, ly], k) => { const [X, Y] = at(lx + .5, ly + .5); ctx.globalAlpha = (.38 + Math.sin(t * 1.4 + k * 1.3) * .2) * ca; ctx.drawImage(glowSprite('#ffe08a'), X + sw - 7, Y - 7, 14, 14); });
    const nf = [0, 0, 0, 6, 10, 18][show], cx = b.x, cy = b.y - L.h * .52 / 16, rx = L.w / 16 * .62 + .6, ry = L.h / 16 * .42 + .4;
    for (let k = 0; k < nf; k++) { const h1 = hash2(k, 1, 9), h2 = hash2(k, 2, 9), h3 = hash2(k, 3, 9), X = (cx + Math.sin(t * .3 * (.6 + h1) + k * 2.1) * rx * (.45 + .55 * h2)) * T - camX, Y = (cy + Math.cos(t * .23 * (.7 + h3) + k) * ry * (.5 + .5 * h1)) * T - camY;
      const al = Math.max(0, Math.sin(t * 2.6 * (.5 + h2) + k * 1.7)); if (al <= .02) continue; ctx.globalAlpha = al * .9; ctx.drawImage(glowSprite('#e6ff9a'), X - 5, Y - 5, 10, 10); ctx.fillStyle = '#f8ffd0'; ctx.fillRect(Math.round(X), Math.round(Y), 1, 1); }
  }
  const R = TREE_BLESS(g ? (g.t > 1 ? g.to : g.from) : st);
  if (R) { const n = Math.round(R * 4), ox = CX + .5, oy = CY + .5;
    for (let k = 0; k < n; k++) { const h = hash2(k, R, 5), a = (k + h * .6) / n * 6.283 + t * .015, r = R + Math.sin(t * .6 + k * 1.7) * .22, wx = ox + Math.cos(a) * r, wy = oy + Math.sin(a) * r, X = wx * T - camX, Y0 = wy * T - camY;
      if (!onS(X, Y0)) continue; const tx = Math.floor(wx), ty = Math.floor(wy); if (!inB(tx, ty) || G.wall[idx(tx, ty)]) continue;
      const ph = (t * .22 + h) % 1, Y = Y0 - ph * 10; ctx.globalAlpha = Math.sin(ph * Math.PI) * .75; ctx.drawImage(glowSprite('#e9ffb8'), X - 4, Y - 4, 8, 8); ctx.fillStyle = '#f6ffdc'; ctx.fillRect(Math.round(X), Math.round(Y), 1, 1); } }
  if (g) { const X = b.x * T - camX, Y = b.y * T - camY, pa = g.t < .25 ? g.t / .25 : Math.max(0, 1 - (g.t - .25) / 1.1), Hh = 7.5 * T;
    const gr = ctx.createLinearGradient(0, Y - Hh, 0, Y); gr.addColorStop(0, 'rgba(255,236,170,0)'); gr.addColorStop(.45, `rgba(255,236,170,${.3 * pa})`); gr.addColorStop(1, `rgba(255,236,170,${.55 * pa})`);
    ctx.globalAlpha = 1; ctx.fillStyle = gr; ctx.fillRect(X - 10, Y - Hh, 20, Hh); ctx.fillRect(X - 3, Y - Hh, 6, Hh);
    for (const dl of [0, .3]) { const q = clamp((g.t - dl) / 1.3, 0, 1); if (q <= 0 || q >= 1) continue; const rr = (1 + q * (TREE_BLESS(g.to) || 9)) * T;
      ctx.strokeStyle = `rgba(255,233,160,${.6 * (1 - q)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, (CY + .6) * T - camY, rr, 0, 6.283); ctx.stroke(); } }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
}
function insertSeeds() {
  const n = Math.min(countItem('lightSeed'), 5 - G.treeSeeds); if (n <= 0) return; const from = treeStage(); removeItem('lightSeed', n); G.treeSeeds += n; lightDirty = true;
  TREEFX.grow = { t: 0, from, to: treeStage() }; shake = Math.max(shake, .15);
  SFX.seed(); puff(CX + .5, CY - 1, '#ffd25c', 30, 4, 2); G.p.hp = maxHp(); gainXp(50 * n);
  if (G.treeSeeds >= 5 && !G.won2) { G.won = true; G.won2 = true; learnRecipe('festCake', true); setTimeout(() => { SFX.win(); openPanel('win2'); }, 1700); }
  else if (G.treeSeeds >= 3 && !G.won) { G.won = true; setTimeout(() => { SFX.win(); openPanel('win'); }, 1700); }
  else toast(`등불나무가 조금 더 밝아졌어요 (${G.treeSeeds}/${G.treeSeeds < 3 ? 3 : 5})`, 'good');
}
