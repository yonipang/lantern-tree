// ---- lantern tree at play: growth show, see-through canopy, falling leaves, glow (all visual, nothing saved) ----
const TREEFX = { grow: null, leaves: [], alpha: 1, leafT: 0 };
const treeStage = () => G ? clamp(G.treeSeeds | 0, 0, 5) : 0;
const treeBase = () => ({ x: CX + .5, y: CY + 1 + 2 / 16 });
function treeBox(L) { const b = treeBase(); return { l: b.x + (L.box.x0 - L.w / 2) / 16, r: b.x + (L.box.x1 + 1 - L.w / 2) / 16, t: b.y - (L.h - L.box.y0) / 16, b: b.y - (L.h - L.box.y1 - 1) / 16 }; }
function behindCanopy() { const p = G.p, L = SPR.treeSt && SPR.treeSt[treeStage()]; if (!L || p.y >= CY + 1) return false; const k = treeBox(L); return p.x + .3 > k.l && p.x - .3 < k.r && p.y > k.t + .3 && p.y - .9 < k.b; }
function treeLeaf(st, burst) {
  const L = SPR.treeSt[st], b = treeBase(), k = treeBox(L), P = TREE_PAL[st];
  const x = k.l + .3 + fxRand() * Math.max(.1, k.r - k.l - .6), top = k.t + (k.b - k.t) * (.35 + fxRand() * .6), gy = b.y - .2 + fxRand() * .8;
  const col = burst && st >= 3 && fxRand() < .35 ? (fxRand() < .5 ? '#ffb3c8' : '#fff1f6') : P[1 + ((fxRand() * 3) | 0)];
  TREEFX.leaves.push({ x, y: gy, z: Math.max(.3, gy - top), vz: burst ? .9 + fxRand() * .8 : .3 + fxRand() * .2, vx: burst ? (x - b.x) * (.8 + fxRand()) : (fxRand() - .5) * .3, vy: burst ? (fxRand() - .2) * .7 : 0, t: 0, ph: fxRand() * 6.28, col });
}
function updateTree(dt) {
  const F = TREEFX, st = treeStage(), g = F.grow;
  if (g) { g.t += dt; if (!g.burst && g.t >= .45) { g.burst = 1; if (g.to >= 1) for (let k = 0; k < 22; k++) treeLeaf(g.to, 1); } if (g.t >= 1.6) F.grow = null; }
  F.alpha += ((behindCanopy() ? .42 : 1) - F.alpha) * Math.min(1, dt * 8);
  for (let i = F.leaves.length - 1; i >= 0; i--) { const q = F.leaves[i]; q.t += dt;
    if (q.z > 0) { q.z = Math.max(0, q.z - q.vz * dt); q.x += (q.vx + Math.sin(q.t * 2.4 + q.ph) * .35) * dt; q.y += q.vy * dt; q.vx *= Math.pow(.4, dt); q.vy *= Math.pow(.4, dt); }
    else { q.rest = (q.rest || 0) + dt; if (q.rest > .8) F.leaves.splice(i, 1); } }
  if (st >= 5 && F.leaves.length < 14 && Math.hypot(G.p.x - CX, G.p.y - CY) < 22) { F.leafT -= dt; if (F.leafT <= 0) { F.leafT = .7 + fxRand() * 1.1; treeLeaf(st, 0); } }
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
function hurtPlayer(dmg, sx, sy, kind) {
  if (kind === 'fire' && wearing('turtleCharm')) dmg *= 1 - turtleCut(eqLv('turtleCharm'));
  dmg *= 1 - ringV('def');
  const p = G.p; if (p.inv > 0 || p.dead > 0 || p.sleep) return; if (p.sit) standUp(); dmg = Math.max(1, Math.round(dmg * (1 - skl('tough') * 0.07) * (1 - bval('def'))));
  p.hp -= dmg; p.inv = 0.75; p.hurt = 0.18; const dx = p.x - sx, dy = p.y - sy, l = Math.hypot(dx, dy) || 1; p.kx = dx / l * 9; p.ky = dy / l * 9;
  shake = Math.max(shake, 0.28); SFX.hurt(); ftext(p.x, p.y - 1.2, '-' + dmg, '#ff7a8a');
  if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; G.fish = null; $('#fade').textContent = '기절했어요…'; $('#fade').hidden = false; }
}
function respawn() {
  const p = G.p; $('#fade').hidden = true; const lostN = dropLost(); G.recall = null;
  const so = G.spawnPt && G.objs.get(idx(G.spawnPt.x, G.spawnPt.y)); const sp = so && OBJ[so.t].bed ? G.spawnPt : null;
  if (sp) { p.x = sp.x + .5; p.y = sp.y + 1.6; if (boxHits(p.x, p.y, .28)) { p.x = sp.x + 1.5; p.y = sp.y + .5; } } else { p.x = CX + .5; p.y = CY + 1.7; }
  p.hp = Math.round(maxHp() * .7); p.mp = maxMp(); p.dash = null; p.hunger = Math.max(p.hunger, 45); p.inv = 2; p.dead = 0; G.enemies.length = 0; G.pshots.length = 0;
  for (const k of BKEYS) if (!G.bossDead[k]) G.bosses[k] = freshBoss(k); G.shots.length = 0; G.hz = []; G.fish = null; $('#bossbar').hidden = true;
  cam.x = p.x; cam.y = p.y; toast(sp ? '침대에서 깨어났어요' : '등불나무 곁에서 깨어났어요'); unstick(p, '사방이 막혀 있어서 바로 바깥에서 깨어났어요'); if (lostN) setTimeout(() => toast(`쓰러진 자리에 재료 ${lostN}개를 떨어뜨렸어요 · 지도에 꾸러미가 표시돼요`, 'warn', 'lostdrop'), 1200);
}

// ================= update =================
let regrowT = 0, snapT = 0, cloudT = 0, zoneT = 0, growT = 0, circT = 0;
function regrow() {
  const p = G.p;
  for (let k = 0; k < 14; k++) {
    const a = rand() * 6.283, d = 13 + rand() * 22, x = Math.floor(p.x + Math.cos(a) * d), y = Math.floor(p.y + Math.sin(a) * d);
    if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) continue; const i = idx(x, y), f = G.floor[i], b = G.biome[i];
    if (G.wall[i] || G.objs.get(i) || !(f === 1 || f === 2 || f === 3) || b === 2) continue;
    if (Math.hypot(x - CX, y - CY) < 3.5) continue;
    let nat = 0, built = false;
    for (let dy = -3; dy <= 3 && !built; dy++) for (let dx = -3; dx <= 3; dx++) { const j = idx(x + dx, y + dy), o = G.objs.get(j); if (isPlacedFloor(G.floor[j])) { built = true; break; } if (!o) continue; const od = OBJ[o.t]; if (od.nat || od.bush) nat++; else if (od.item || od.tw) { built = true; break; } }
    if (built || nat >= 6) continue;
    G.objs.set(i, { t: rand() < (b === 1 ? 0.25 : 0.35) && f !== 3 ? 'root' : 'grass' }); return;
  }
}
let lightDirty = true, lightT = 0, guideT = 0, spawnT = 0, hungerT = 0, regenT = 0, saveT = 0;
function update(dt) {
  G.time += dt; const p = G.p;
  let mx = 0, my = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1; if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1; if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
  if (joy.active) { mx += joy.vx; my += joy.vy; }
  if (dpad.id != null) { mx += dpad.vx; my += dpad.vy; }
  let mag = Math.hypot(mx, my); if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
  if (p.dead > 0) { p.dead -= dt; mag = 0; if (p.dead <= 0) respawn(); }
  if (p.sleep) { p.sleep.t -= dt; mag = 0; if (p.sleep.t <= 0) wakeUp(); }
  if (p.sit) { if (mag > 0.3) standUp(); else { mag = 0; p.sitT = (p.sitT || 0) + dt; if (p.sitT > 0.8) { p.sitT = 0; if (p.hp < maxHp()) p.hp = Math.min(maxHp(), p.hp + 1); } } }
  p.moving = mag > 0.12;
  p.slowT = Math.max(0, (p.slowT || 0) - dt);
  if (p.moving) { const sp = 4.4 * moveMul() * Math.max(0.5, mag) * (p.slowT > 0 ? .55 : 1); moveEnt(p, mx * sp * dt, my * sp * dt, 0.28); p.anim += dt; if (!aimMouse()) p.face = { x: mx / mag, y: my / mag }; }
  if (aimMouse() && p.dead <= 0 && !p.sit && !p.sleep) { const m = mouseWorld(); faceTo(m.x - p.x, m.y - (p.y - .4)); }
  const f = p.face; if (Math.abs(f.x) > Math.abs(f.y) * 1.05) { p.dir = 'side'; p.flip = f.x < 0; } else p.dir = f.y < 0 ? 'up' : 'down';
  if (Math.abs(p.kx) + Math.abs(p.ky) > 0.05) { moveEnt(p, p.kx * dt, p.ky * dt, 0.28); const k = Math.pow(0.0015, dt); p.kx *= k; p.ky *= k; } else p.kx = p.ky = 0;
  p.inv = Math.max(0, p.inv - dt); p.hurt = Math.max(0, p.hurt - dt);
  if (p.dash) { moveEnt(p, p.dash.vx * dt, p.dash.vy * dt, 0.28); p.dash.t -= dt; if (fxRand() < .5) puff(p.x, p.y, '#e8d8c0', 1, 1, .05); if (p.dash.t <= 0) p.dash = null; }
  p.mp = Math.min(maxMp(), (p.mp == null ? maxMp() : p.mp) + (2.5 + RS('int') * 0.25) * (1 + ringV('mp')) * dt); for (const k in G.skcd) if (G.skcd[k] > 0) G.skcd[k] -= dt;
  // action
  G.act = decide(); actCd -= dt; if (G.swing) { G.swing.t -= dt; if (G.swing.t <= 0) G.swing = null; }
  const held = actHeld() && p.dead <= 0 && !p.sleep; actQ = Math.max(0, actQ - dt);
  if (p.dead > 0) actQ = 0;
  if (actQ > 0 && actCd <= 0) { actQ = 0; tryAct(true); } else if (held && actCd <= 0) tryAct(false);
  if (!held && actQ <= 0) { holdGroup = null; holdK = null; }
  holdT = held ? holdT + dt : 0;
  attackTick(dt); // v65: the attack button
  // survival
  buffTick(dt); envTick(dt); recallTick(dt);
  hungerT += dt; if (hungerT >= 9 / hungerMul()) { hungerT = 0; p.hunger = Math.max(0, p.hunger - 1); if (p.hunger === 20) toast('배가 고파요. 무언가 먹어요', null, 'hungry'); }
  regenT += dt; if (regenT >= 2.5) { regenT = 0; if (p.hunger <= 0 && p.dead <= 0) { p.hp -= 2; ftext(p.x, p.y - 1.2, '-2', '#ffb15c'); if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; $('#fade').hidden = false; } } else if (p.hunger >= 55 && p.hp < maxHp() && p.dead <= 0 && envLv('hot') < 2) p.hp = Math.min(maxHp(), p.hp + 1); }
  wildTick(dt); updateEnemies(dt); updateBosses(dt); updatePShots(dt); updateFish(dt); updateDrops(dt); updateFx(dt); updateAmbient(dt); updateTree(dt);
  spawnT += dt; if (spawnT > (SPAWN_EVERY[G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0] || 2.6)) { spawnT = 0; trySpawn(); }
  regrowT += dt; if (regrowT > 3) { regrowT = 0; regrow(); }
  zoneT += dt; if (zoneT > 1) { zoneT = 0; zoneTick(); }
  growT += dt; if (growT > 2) { const gd = growT; growT = 0; growTick(gd); }
  circT += dt; if (circT > .2) { circuitTick(circT); circT = 0; }
  lightT += dt; if (lightT > 0.09 || lightDirty) { lightT = 0; lightDirty = false; computeLight(); }
  guideT += dt; if (guideT > 0.5) { guideT = 0; checkGuide(); checkBiome(); roomTick(); }
  saveT += dt; if (saveT > 25) { saveT = 0; saveLocal(true); }
  snapT += dt; if (snapT > 1200) { snapT = 0; pushBackup('플레이 중 자동 백업'); }
  cloudT += dt; if (cloudT > 120) { cloudT = 0; cloudUpload(false); }
  // crops & bush stage only visual
  const k = 1 - Math.pow(0.0005, dt); cam.x += (p.x - cam.x) * k; cam.y += (p.y - .3 - cam.y) * k;
  shake = Math.max(0, shake - dt);
}
function updateEnemies(dt) {
  const p = G.p;
  for (const e of G.enemies.slice()) {
    const def = ENEMY[e.k], dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
    if (d > 30) { G.enemies.splice(G.enemies.indexOf(e), 1); continue; }
    dotTick(e, dt); if (!G.enemies.includes(e)) continue; const sm = e.slow > 0 ? (e.chill ? .3 : .45) : 1;
    if (def.calm) e.angry = Math.max(0, (e.angry || 0) - dt);
    const chase = d < (def.aggro || 8) && p.dead <= 0 && (!def.calm || e.angry > 0);
    if (def.hop) {
      if (e.air > 0) { moveEnt(e, e.vx * dt * sm, e.vy * dt * sm, def.r); e.air -= dt * sm; e.z = Math.sin((1 - Math.max(0, e.air) / e.airMax) * Math.PI) * 0.35; if (e.air <= 0) { e.z = 0; e.land = 0.15; } }
      else { e.t -= dt; e.land = Math.max(0, (e.land || 0) - dt); if (e.t <= 0) { let ax, ay; if (chase) { ax = dx / d; ay = dy / d; } else { const a = rand() * 6.283; ax = Math.cos(a); ay = Math.sin(a); } const sp = chase ? def.spd : def.spd * 0.5; e.vx = ax * sp; e.vy = ay * sp; e.air = e.airMax = 0.42; e.t = (chase ? 0.45 : 1.2) + rand() * 0.6; } }
    } else {
      e.t -= dt; if (!chase && e.zone != null && G.fzones && G.fzones[e.zone]) { const z = G.fzones[e.zone], zx = z.x + .5 - e.x, zy = z.y + .5 - e.y, zd = Math.hypot(zx, zy); if (zd > 4.5) { e.vx = zx / zd * def.spd * .5; e.vy = zy / zd * def.spd * .5; e.t = .6; } }
      if (chase) { e.vx = dx / d * def.spd; e.vy = dy / d * def.spd; } else if (e.t <= 0) { e.t = 1.5 + rand() * 2; const a = rand() * 6.283, s = rand() < .4 ? 0 : def.spd * .4; e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; }
      moveEnt(e, e.vx * dt * sm, e.vy * dt * sm, def.r); e.anim = (e.anim || 0) + dt * sm * (Math.hypot(e.vx, e.vy) > 0.1 ? 1 : 0);
      if (Math.abs(e.vx) > 0.05) e.flip = e.vx < 0;
    }
    if (Math.abs(e.kx || 0) + Math.abs(e.ky || 0) > 0.05) { moveEnt(e, e.kx * dt, e.ky * dt, def.r); const k = Math.pow(0.001, dt); e.kx *= k; e.ky *= k; }
    e.hurt = Math.max(0, (e.hurt || 0) - dt);
    if (d < def.r + 0.34 && (e.z || 0) < 0.2 && (!def.calm || e.angry > 0)) hurtPlayer(Math.round(def.dmg * (e.dm || 1)), e.x, e.y);
  }
}
let bossName = '';
function updateBosses(dt) {
  let active = null;
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (bossCommon(b, dt)) { if (b.inv > 0) b.inv -= dt; phaseCheck(b); if (b.ph === 'roar') { b.t -= dt; b.anim = (b.anim || 0) + dt; if (b.t <= 0) { b.ph = 'walk'; b.t = .6; } } else BOSS_AI[k](b, dt); if (k === 'spirit' && (b.stage || 1) >= 3) cloneTick(b, dt); if (!G.bossDead[k]) dotTick(b, dt, true); active = G.bossDead[k] ? null : b; } }
  if (active) { $('#bossFill').style.width = Math.max(0, active.hp / active.max * 100) + '%'; $('#bossbar').classList.toggle('phased', !!PHASE_BOSS[active.k]); if (bossName !== active.k) { bossName = active.k; $('#bossbar .bn').textContent = BOSSES[active.k].n; } }
  updateShots(dt); updateHazards(dt);
}
function bossCommon(b, dt) {
  const def = BOSSES[b.k], p = G.p, d = Math.hypot(p.x - b.x, p.y - b.y); b.hurt = Math.max(0, b.hurt - dt); b.d = d;
  if (b.st === 'sleep') { if (d < def.wake && p.dead <= 0) { b.st = 'fight'; b.t = 1.2; SFX.boss(); shake = 0.4; toast(`${def.n}이 깨어났어요!`); $('#bossbar').hidden = false; bossName = ''; } return false; }
  if (p.dead > 0 || d > 24) { bossCleanup(b); Object.assign(b, freshBoss(b.k)); $('#bossbar').hidden = true; G.shots.length = 0; G.hz = []; return false; }
  return true;
}
const BOSS_AI = {
  turtle(b, dt) {
    const p = G.p, d = b.d, st = b.stage || 1, half = st >= 2; b.t -= dt;
    if (b.ph === 'walk') { if (d > 2.4) moveEnt(b, (p.x - b.x) / d * 1.1 * dt, (p.y - b.y) / d * 1.1 * dt, 1.0); b.anim = (b.anim || 0) + dt; if (b.t <= 0) { b.casts++; if (st === 3 && b.casts % 3 === 1) { b.ph = 'erupt'; b.t = .9; SFX.boss(); } else if (b.casts % 3 === 0) { b.ph = 'hide'; b.t = .55; } else { b.ph = 'spit'; b.t = .5; } } }
    else if (b.ph === 'erupt') { if (fxRand() < dt * 25) puff(b.x + (fxRand() - .5), b.y - .3, '#ff8a3d', 1, 2.4, .3); shake = Math.max(shake, .08); if (b.t <= 0) { turtleErupt(b); b.ph = 'open'; b.t = 3; ftext(b.x, b.y - 2.4, '지금이에요!', '#ffd25c'); } }
    else if (b.ph === 'open') { if (fxRand() < dt * 6) puff(b.x, b.y - .5, '#ffd25c', 1, 1.2, .2); if (b.t <= 0) { b.ph = 'walk'; b.t = .8; } }
    else if (b.ph === 'spit') { if (b.t <= 0) { const n = half ? 7 : 5, base = Math.atan2(p.y - b.y, p.x - b.x); for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.26; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, life: 3, dmg: 20, k: 'fire' }); } SFX.cast2(); b.ph = 'walk'; b.t = half ? 0.8 : 1.2; } }
    else if (b.ph === 'hide') { if (b.t <= 0) { b.ph = 'shell'; b.t = half ? 3.2 : 2.6; const a = Math.atan2(p.y - b.y, p.x - b.x); b.dx = Math.cos(a); b.dy = Math.sin(a); b.bounce = 0; SFX.swing(); } }
    else if (b.ph === 'shell') {
      const sp = half ? 10.5 : 8.5, ox = b.x, oy = b.y, mx = b.dx * sp * dt, my = b.dy * sp * dt;
      if (moveEnt(b, mx, my, 1.0)) { if (Math.abs(b.x - ox) < Math.abs(mx) * .5) b.dx = -b.dx; if (Math.abs(b.y - oy) < Math.abs(my) * .5) b.dy = -b.dy; b.bounce++; shake = Math.max(shake, .3); SFX.brk(); puff(b.x, b.y, '#ff8a3d', 8, 3); if (st >= 2) emberBurst(b); }
      if (fxRand() < dt * 8) puff(b.x, b.y + .3, '#ff8a3d', 1, 1, .2);
      if (b.t <= 0 || b.bounce >= (st === 3 ? 7 : 5)) { b.ph = 'walk'; b.t = 1.1; G.hz = G.hz || []; const n = half ? 6 : 4; for (let k = 0; k < n; k++) { const hx = p.x + (rand() - .5) * 5, hy = p.y + (rand() - .5) * 5; if (!isSolid(Math.floor(hx), Math.floor(hy))) G.hz.push({ x: hx, y: hy, r: 1.1, t: 0, warn: .8, life: 7, dmg: 15, k: 'lava' }); } }
    }
    if (d < 1.5) hurtPlayer(b.ph === 'shell' ? 28 : 18, b.x, b.y);
  },
  spirit(b, dt) {
    const p = G.p, d = b.d, st = b.stage || 1, half = st >= 2; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (b.ph === 'walk') { const want = d > 5 ? 1 : d < 3.4 ? -1 : 0; if (want && d > 0) moveEnt(b, (p.x - b.x) / d * 1.9 * want * dt, (p.y - b.y) / d * 1.9 * want * dt, .8); if (b.t <= 0) { b.casts++; b.ph = b.casts % (half ? 2 : 3) === 0 ? 'fade' : 'ring'; b.t = b.ph === 'fade' ? .55 : .65; } }
    else if (b.ph === 'ring') { if (b.t <= 0) { const n = 18, gap = Math.floor(rand() * n), off = rand(); for (let k = 0; k < n; k++) { if ((k - gap + n) % n < 3) continue; const a = (k + off) / n * 6.283; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.4, vy: Math.sin(a) * 4.4, life: 4, dmg: 17, k: 'ice', a, spin: st === 3 ? (b.rings % 2 ? -.35 : .35) : 0 }); } SFX.cast2(); if (st === 3) for (const e of G.enemies) if (e.k === 'spiritClone') puff(e.x, e.y - .6, '#bfe6ff', 8, 2.2); b.rings = (b.rings || 0) + 1; if (half && b.rings % 2 === 1) b.t = .55; else { b.ph = 'walk'; b.t = half ? 1.0 : 1.5; } } }
    else if (b.ph === 'fade') { if (b.t <= 0) { const h0 = BOSSES.spirit.home(); for (let k = 0; k < 24; k++) { const a = rand() * 6.283, r = 1.8 + rand() * 1.0, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (!boxHits(x, y, .8) && Math.hypot(x - h0.x, y - h0.y) < 12) { b.x = x; b.y = y; break; } }
      if (st === 3) { const nc = G.enemies.filter(e => e.k === 'spiritClone').length; if (nc < 2) spiritClones(b, 2 - nc); } b.ph = 'nova'; b.t = 1.0; G.hz = G.hz || []; G.hz.push({ x: b.x, y: b.y, r: 3.2, t: 0, warn: .9, life: 1.05, dmg: 26, k: 'frost', slow: 2.8 }); puff(b.x, b.y - .5, '#d4f6ff', 14, 2.5); } }
    else if (b.ph === 'nova') { if (b.t <= 0) { b.ph = 'walk'; b.t = .9; if (half && G.enemies.length < 8) { const nf = st === 3 ? Math.max(0, 2 - G.enemies.filter(e => e.k === 'frostSlime').length) : 2; for (let k = 0; k < nf; k++) G.enemies.push(mkEnemy('frostSlime', b.x + (k ? 1.4 : -1.4), b.y + .6)); } } }
    if (d < 1.2 && b.ph !== 'fade') hurtPlayer(18, b.x, b.y);
  },
  slime(b, dt) {
    const p = G.p, d = b.d;
    if (b.air > 0) {
      moveEnt(b, b.vx * dt, b.vy * dt, 0.85); b.air -= dt; b.z = Math.sin((1 - Math.max(0, b.air) / b.airMax) * Math.PI) * 1.8;
      if (b.air <= 0) {
        b.z = 0; b.lands++; shake = 0.35; SFX.brk(); for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; G.parts.push({ x: b.x + Math.cos(a) * 1.2, y: b.y + Math.sin(a) * .8, z: .1, vx: Math.cos(a) * 5, vy: Math.sin(a) * 3.5, vz: 1, life: .45, max: .45, col: '#c9f0b0', sz: 2 }); }
        if (Math.hypot(p.x - b.x, p.y - b.y) < 2.8) hurtPlayer(20, b.x, b.y);
        if (b.lands % 3 === 0 && G.enemies.length < 10) for (let k = 0; k < 2; k++) G.enemies.push(mkEnemy('slimeO', b.x + (k ? 1.4 : -1.4), b.y + .5));
        b.t = b.hp < b.max / 2 ? 0.65 : 1.1;
      }
    } else { b.t -= dt; if (b.t <= 0) { b.airMax = 0.85; b.air = b.airMax; let vx = (p.x - b.x) / b.airMax, vy = (p.y - b.y) / b.airMax; const sp = Math.hypot(vx, vy); if (sp > 8) { vx *= 8 / sp; vy *= 8 / sp; } b.vx = vx; b.vy = vy; } }
    if (b.z < 0.4 && d < 1.3) hurtPlayer(15, b.x, b.y);
  },
  queen(b, dt) {
    const p = G.p, d = b.d, half = b.hp < b.max / 2;
    if (b.ph !== 'cast') { b.t -= dt; if (d > 1.7) { const sp = half ? 2.3 : 1.7; moveEnt(b, (p.x - b.x) / d * sp * dt, (p.y - b.y) / d * sp * dt, .8); } b.anim = (b.anim || 0) + dt; if (b.t <= 0) { b.ph = 'cast'; b.t = 0.75; } }
    else { b.t -= dt; if (b.t <= 0) {
      const n = half ? 18 : 14; for (let k = 0; k < n; k++) { const a = k / n * 6.283 + b.rot; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.6, vy: Math.sin(a) * 4.6, life: 3.5, dmg: 12, k: 'spore' }); }
      b.rot += 0.31; b.casts++; SFX.cast2();
      if (!b.dbl && b.casts % 2 === 0 && G.enemies.length < 9) for (let k = 0; k < (half ? 3 : 2); k++) G.enemies.push(mkEnemy('shroomy', b.x + (k - (half ? 1 : .5)) * 1.6, b.y + .8));
      if (half && !b.dbl) { b.dbl = 1; b.ph = 'cast'; b.t = .45; } else { b.dbl = 0; b.ph = 'walk'; b.t = half ? 1.3 : 1.9; } } }
    if (d < 1.3) hurtPlayer(15, b.x, b.y);
  },
  golem(b, dt) {
    const p = G.p, d = b.d, half = b.hp < b.max / 2; b.t -= dt;
    if (b.ph === 'walk') { if (d > 2.5) moveEnt(b, (p.x - b.x) / d * 1.4 * dt, (p.y - b.y) / d * 1.4 * dt, .9); if (b.t <= 0) { b.ph = 'aim'; b.t = 0.75; } }
    else if (b.ph === 'aim') { if (b.t > 0.3) { b.dx = (p.x - b.x) / (d || 1); b.dy = (p.y - b.y) / (d || 1); } if (b.t <= 0) { b.ph = 'dash'; b.t = 0.62; SFX.swing(); } }
    else if (b.ph === 'dash') {
      const blocked = moveEnt(b, b.dx * 12.5 * dt, b.dy * 12.5 * dt, .9); if (fxRand() < .5) puff(b.x, b.y + .3, '#8a83ad', 1, 1, .1);
      if (blocked) { b.ph = 'stun'; b.t = 1.0; b.chain = 0; shake = 0.45; SFX.brk(); puff(b.x + b.dx, b.y + b.dy, C.cryL, 14, 3); ftext(b.x, b.y - 2.6, '기절!', '#7ff0e6'); }
      else if (b.t <= 0) { const n = half ? 9 : 7, base = Math.atan2(p.y - b.y, p.x - b.x); for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.22; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, life: 3, dmg: 17, k: 'shard', a }); } SFX.clink(); if (half && !b.chain) { b.chain = 1; b.ph = 'aim'; b.t = .6; } else { b.chain = 0; b.ph = 'walk'; b.t = half ? 0.5 : 0.9; } }
    }
    else if (b.ph === 'stun') { if (b.t <= 0) { b.ph = 'walk'; b.t = 0.6; } }
    if (d < 1.4 && b.ph !== 'stun') hurtPlayer(b.ph === 'dash' ? 26 : 18, b.x, b.y);
  },
};
function updateShots(dt) {
  const p = G.p;
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; if (s.spin) { const c = Math.cos(s.spin * dt), sn = Math.sin(s.spin * dt), vx = s.vx * c - s.vy * sn; s.vy = s.vx * sn + s.vy * c; s.vx = vx; } s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (inB(tx, ty) && pillarBlocks(s, tx, ty)) { G.shots.splice(i, 1); continue; }
    if (s.life <= 0 || !inB(tx, ty) || G.wall[idx(tx, ty)]) { puff(s.x, s.y, s.k === 'spore' ? '#d59bff' : C.cryL, 3, 1.5, .2); G.shots.splice(i, 1); continue; }
    if (p.dead <= 0 && Math.hypot(s.x - p.x, s.y - (p.y - .3)) < 0.42) { hurtPlayer(s.dmg, s.x - s.vx, s.y - s.vy, s.k === 'fire' ? 'fire' : null); G.shots.splice(i, 1); }
  }
}
// v43 region difficulty: monsters grow tougher the deeper the region (gear can now be upgraded up to +5)
const REGION_HP = [1, 1, 1.2, 1.15, 1.15], REGION_DMG = [1, 1, 1.1, 1.1, 1.1];
function regionEnemy(e, b) { const m = REGION_HP[b] || 1; if (m !== 1) { e.hp = Math.round(e.hp * m); e.mh = e.hp; } if ((REGION_DMG[b] || 1) !== 1) e.dm = REGION_DMG[b]; return e; }
function mkEnemy(k, x, y) { return { k, x, y, hp: ENEMY[k].hp, t: rand(), air: 0, airMax: .42, z: 0, vx: 0, vy: 0, kx: 0, ky: 0, hurt: 0 }; }
function trySpawn() {
  const p = G.p; if (p.dead > 0) return; const pb = G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0; const near = G.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) < 20).length; if (near >= (SPAWN_CAP[pb] || 7)) return;
  for (let k = 0; k < 10; k++) {
    const a = rand() * 6.283, r = 10 + rand() * 6, x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r);
    if (!inB(x, y) || isSolid(x, y) || G.objs.get(idx(x, y))) continue;
    if (Math.hypot(x - CX, y - CY) < 13 + G.treeSeeds * 4) continue; if (Math.hypot(x - BX, y - BY) < 11 || Math.hypot(x - SA.x, y - SA.y) < 10 || Math.hypot(x - SB.x, y - SB.y) < 10 || Math.hypot(x - SL.x, y - SL.y) < 11 || Math.hypot(x - SI.x, y - SI.y) < 11) continue;
    if (lightAt(x, y) > 0.3) continue;
    if ((G.fzones || []).some(z => Math.hypot(x - z.x, y - z.y) < 7)) continue;
    const b = G.biome[idx(x, y)]; const kk = b === 0 ? 'slimeG' : b === 1 ? (rand() < .55 ? 'slimeO' : 'shroomy') : b === 3 ? (rand() < .55 ? 'magmaSlime' : 'cinder') : b === 4 ? (rand() < .55 ? 'frostSlime' : 'snowling') : (rand() < .75 ? 'slimeP' : 'shroomy');
    G.enemies.push(regionEnemy(mkEnemy(kk, x + .5, y + .6), b));
    if (rand() < (SPAWN_PACK[b] || 0)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!isSolid(x + dx, y + dy) && !G.objs.get(idx(x + dx, y + dy))) { G.enemies.push(regionEnemy(mkEnemy(kk, x + dx + .5, y + dy + .6), b)); break; } }
    return;
  }
}
function updateDrops(dt) {
  const p = G.p;
  for (const d of G.drops.slice()) {
    d.t += dt; d.vz -= 12 * dt; d.z += d.vz * dt; if (d.z < 0) { d.z = 0; d.vz = Math.abs(d.vz) * 0.35; if (d.vz < 0.6) d.vz = 0; d.vx *= 0.6; d.vy *= 0.6; }
    moveEnt(d, d.vx * dt, d.vy * dt, 0.15); d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt);
    d.hold = Math.max(0, d.hold - dt);
    const dx = p.x - d.x, dy = p.y - .3 - d.y, l = Math.hypot(dx, dy);
    const mag = petIs('dog') ? 1.6 : 1; // v45: the dog pulls drops in from further away
    if (d.t > 0.4 && l < 2.2 * mag && d.hold <= 0 && p.dead <= 0) { const s = 9 * Math.max(.15, 1 - l / (2.6 * mag)) + 2; d.x += dx / l * s * dt; d.y += dy / l * s * dt;
      if (l < 0.45) { const left = d.dur != null || d.lv ? moveInto(G.inv, { id: d.id, c: d.c, dur: d.dur, lv: d.lv }) : addItem(d.id, d.c); if (ITEMS[d.id] && /^petal/.test(d.id)) { G.stats.petals = G.stats.petals || {}; G.stats.petals[d.id.slice(5)] = 1; } const got = d.c - left; if (got) { SFX.pick(); ftext(p.x, p.y - 1.4, `+${got} ${ITEMS[d.id].n}`, rarCol(d.id) || '#fff1d6'); if (rarOf(d.id) >= 3) toast(`${RARITY[rarOf(d.id)][0]} 장비 ${josa(ITEMS[d.id].n, '을', '를')} 얻었어요!`, 'good'); } if (left) { d.c = left; d.hold = 1.5; toast('가방이 가득 찼어요', null, 'full-inv'); } else G.drops.splice(G.drops.indexOf(d), 1); } }
    if (d.t > 400) G.drops.splice(G.drops.indexOf(d), 1);
  }
}
function updateFx(dt) {
  for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; if (q.life <= 0) { G.parts.splice(i, 1); continue; } q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= 9 * dt; q.z = Math.max(0, q.z + q.vz * dt); q.vx *= Math.pow(.2, dt); q.vy *= Math.pow(.2, dt); }
  for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= Math.pow(.15, dt); if (t.life <= 0) G.texts.splice(i, 1); }
  for (const o of visibleShakers) { o.shake = Math.max(0, (o.shake || 0) - dt); }
}
const visibleShakers = new Set();

