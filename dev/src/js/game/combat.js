// ---- active skills ----
function useSkill(n) {
  if (!G || paused || !started) return; const p = G.p; if (p.dead > 0 || p.sleep) return;
  const k = G.rpg.slot[n]; if (!k) { openPanel('stat'); return; }
  const S = SKILLS[k], l = skl(k); if (!l || (G.skcd[k] || 0) > 0) return;
  const cost = S.mp(l); if ((p.mp || 0) < cost) { toast('기력이 부족해요. 잠깐 기다리면 다시 차요', null, 'nomp'); SFX.clink(); return; }
  if (p.sit) standUp();
  if (SK_FN[k](l) === false) return; p.mp -= cost; G.skcd[k] = S.cd(l);
}
const SK_FN = {
  dash(l) { const p = G.p; let dx = p.face.x, dy = p.face.y; if (joy.active && Math.hypot(joy.vx, joy.vy) > .2) { dx = joy.vx; dy = joy.vy; } if (dpad.id != null && Math.hypot(dpad.vx, dpad.vy) > .2) { dx = dpad.vx; dy = dpad.vy; } const L = Math.hypot(dx, dy) || 1, sp = 15 * (1 + (l - 1) * .15); p.dash = { t: .2, vx: dx / L * sp, vy: dy / L * sp }; p.inv = Math.max(p.inv, .4); puff(p.x, p.y, '#e8d8c0', 8, 2, .1); SFX.swing(); },
  spin(l) { const p = G.p, w = curWeapon(), mul = 1.3 + .3 * l; G.swing = { t: .3, max: .3, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, arc: Math.PI, rad: 1.35 }; SFX.swing(); shake = Math.max(shake, .15);
    const roll = () => { const crit = Math.random() < .1; return [Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1)), crit]; }; let landed = false;
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < 1.9 + ENEMY[e.k].r) { const [d, c] = roll(); hitEnemy(e, d, c, 12, w.fx); landed = true; }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < 1.9 + BOSSES[k].hr) { const [d, c] = roll(); hitBoss(b, d, c); landed = true; } }
    if (landed) wear(w.slot); },
  bolt(l) { const p = G.p; if (aimMouse()) { const m = mouseWorld(); faceTo(m.x - p.x, m.y - (p.y - .45)); } else { const en = nearestEnemy(7); if (en) faceTo(en.x - p.x, en.y - p.y); } const ang = Math.atan2(p.face.y, p.face.x);
    shootP(ang, { k: 'orb', dmg: Math.round((10 + 6 * l) * magicMul()), crit: false, spd: 11, range: 8, pierce: 1, col: '#fff1b0', kb: 5 }); SFX.cast2(); },
  quake(l) { const t = targetTile(), pk = bestPick(); let n = 0; if (inB(t.x, t.y) && !G.wall[idx(t.x, t.y)]) { const f = G.p.face; if (Math.abs(f.x) > Math.abs(f.y)) t.x += Math.sign(f.x); else t.y += f.y < 0 ? -1 : 1; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = t.x + dx, y = t.y + dy; if (!inB(x, y)) continue; const w = G.wall[idx(x, y)]; if (!w || w === 8 || WALLS[w].tier > pk.tier || Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) > 3.6) continue; breakWall(x, y); n++; }
    if (!n) { toast('부술 수 있는 벽이 없어요', null, 'noquake'); return false; }
    faceTo(t.x + .5 - G.p.x, t.y + .5 - G.p.y); G.swing = { t: .22, max: .22, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: pk.id === 'hand' ? null : pk.id }; shake = Math.max(shake, .3); wear(pk.slot, n); },
  stomp(l) { const p = G.p, w = curWeapon(), mul = .7 + .2 * l, R = 2.5; shake = Math.max(shake, .3); SFX.brk();
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; puff(p.x + Math.cos(a) * 1.6, p.y + Math.sin(a) * 1.1, '#c9b8a8', 2, 2, .15); }
    const roll = () => { const crit = Math.random() < .1; return [Math.max(1, Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1))), crit]; }; let landed = false;
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + ENEMY[e.k].r) { const [d, c] = roll(); hitEnemy(e, d, c, 18, 'slow'); landed = true; }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < R + BOSSES[k].hr) { const [d, c] = roll(); hitBoss(b, d, c, 'slow'); landed = true; } }
    if (landed) wear(w.slot); },
  volley(l) { const p = G.p, w = curWeapon(), W = wtOf(w); if (W.ranged !== 'arrow') { toast('화살비는 활을 들고 있어야 쓸 수 있어요', null, 'novolley'); return false; }
    if (aimMouse()) { const m = mouseWorld(); faceTo(m.x - p.x, m.y - (p.y - .45)); } else { const en = nearestEnemy(wRange(W)); if (en) faceTo(en.x - p.x, en.y - p.y); }
    const ang = Math.atan2(p.face.y, p.face.x), n = 3 + 2 * l, spread = .9;
    for (let k = 0; k < n; k++) { const a = ang + (k / (n - 1) - .5) * spread, crit = Math.random() < .1; shootP(a, { k: 'arrow', dmg: Math.max(1, Math.round(w.dmg * (.5 + .1 * l) * rangeMul() * (crit ? 1.6 : 1))), crit, spd: W.spd, range: wRange(W), pierce: 0, col: '#bff7ef', kb: 3, fx: w.fx }); }
    G.swing = { t: 0.18, max: 0.18, ang, icon: w.id, wt: w.wt }; SFX.swing(); },
  frostRing(l) { const p = G.p, R = 3, dmg = Math.round((12 + 8 * l) * magicMul()); SFX.cast2();
    for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283; puff(p.x + Math.cos(a) * R * .9, p.y + Math.sin(a) * R * .7, k % 2 ? '#9fd8f0' : '#ffffff', 2, 1.5, .2); }
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + ENEMY[e.k].r) hitEnemy(e, dmg, false, 5, 'chill');
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < R + BOSSES[k].hr) hitBoss(b, dmg, false, 'chill'); } },
  heal(l) { const p = G.p; if (p.hp >= maxHp()) { toast('체력이 이미 가득해요', null, 'fullhp'); return false; } const v = Math.round((20 + 12 * l) * (1 + RS('int') * .04)); p.hp = Math.min(maxHp(), p.hp + v); hearts(p.x, p.y - .6, 6); puff(p.x, p.y - .5, '#ffe9a8', 14, 2, .6); ftext(p.x, p.y - 1.3, '♥ +' + v, '#ff8fa3'); SFX.seed(); },
};
function breakWall(tx, ty) { const i = idx(tx, ty), w = G.wall[i], def = WALLS[w]; G.wall[i] = 0; G.wdmg.delete(i); rollDrops(def.drop, tx + .5, ty + .5); puff(tx + .5, ty + .6, WPAL[w][0], 10, 3); SFX.brk(); lightDirty = true; mapPixel(tx, ty); gainXp(w >= 9 && w <= 12 ? (w === 10 || w === 12 ? 6 : 3) : w === 3 || w === 4 || w === 5 ? 3 : w === 2 ? 1 : 0); }
function applyFx(e, fx, dmg, boss) {
  if (!fx) return;
  if (fx === 'poison') e.poison = { t: 4, dps: Math.max(2, dmg * .14) };
  else if (fx === 'burn') e.burn = { t: 3, dps: Math.max(3, dmg * .22) };
  else if (fx === 'slow' && !boss) e.slow = 2.5;
  else if (fx === 'chill' && !boss) { e.slow = 3.5; e.chill = 1; }
  else if (fx === 'split') { for (let k = 0; k < 3; k++) { const a = Math.random() * 6.283; G.pshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: .32, hit: [e], ang: a, k: 'orb', dmg: Math.max(1, Math.round(dmg * .45)), crit: false, col: '#d6c2ff', kb: 3, pierce: 0, spd: 9 }); } }
}
function dotTick(e, dt, boss) {
  for (const [k, col] of [['poison', '#9be37a'], ['burn', '#ff9b4a']]) { const d = e[k]; if (!d) continue; d.t -= dt; d.acc = (d.acc || 0) + d.dps * dt * (boss ? .5 : 1);
    if (d.acc >= 1) { const n = Math.floor(d.acc); d.acc -= n; if (boss) bossDot(e, n, col); else dotHit(e, n, col); if (Math.random() < .5) puff(e.x, e.y - .3, col, 2, 1, .3); }
    if (d.t <= 0) e[k] = null; }
  if (e.slow > 0) { e.slow -= dt; if (Math.random() < dt * 4) puff(e.x, e.y - .2, e.chill ? '#d4f1ff' : '#b8f0a0', 1, .6, .3); if (e.slow <= 0) e.chill = 0; }
}
function dotHit(e, n, col) { if (!G.enemies.includes(e)) return; e.hp -= n; ftext(e.x, e.y - 0.8, n, col); if (e.hp <= 0) enemyDie(e); }
function bossDot(b, n, col) { if (b.hp <= 0 || G.bossDead[b.k]) return; b.hp -= n; ftext(b.x, b.y - 2.3, n, col); if (b.hp <= 0) hitBoss(b, 0, false); }
function enemyDie(e) { const def = ENEMY[e.k]; const at = G.enemies.indexOf(e); if (at < 0) return; G.enemies.splice(at, 1); puff(e.x, e.y, def.col, 12, 3.2); rollDrops(def.drops, e.x, e.y); if (G.biome[idx(Math.floor(e.x), Math.floor(e.y))] <= 1) maybeNote('mon', e.x, e.y); G.stats.kills = (G.stats.kills || 0) + 1; if (e.zone != null && G.fzones && G.fzones[e.zone]) G.fzones[e.zone].dead.push(G.time + 45); gainXp(Math.max(2, Math.round(def.hp / 2)), e.x, e.y); }
function hitEnemy(e, dmg, crit, kb = 8, fx) {
  const p = G.p, def = ENEMY[e.k]; e.hp -= dmg; e.hurt = 0.14; if (e.hp > 0 && fx !== 'split') applyFx(e, fx, dmg); if (def.calm) e.angry = 10; const dx = e.x - p.x, dy = e.y - p.y, l = Math.hypot(dx, dy) || 1;
  e.kx = dx / l * kb; e.ky = dy / l * kb; ftext(e.x, e.y - 0.8, dmg + (crit ? '!' : ''), crit ? '#ffc861' : '#fff1d6'); puff(e.x, e.y, def.col, 4, 2); SFX.hit(); shake = Math.max(shake, 0.12);
  if (fx === 'split') applyFx(e, fx, dmg);
  if (e.hp <= 0) enemyDie(e);
}
function hitBoss(b, dmg, crit, fx) {
  if ((b.inv || 0) > 0) { if (dmg > 0) ftext(b.x, b.y - 2.3, '막힘', '#bfe6ff'); return; }
  if (b.k === 'turtle' && b.ph === 'open' && dmg > 0) { dmg = Math.round(dmg * 1.5); crit = true; }
  const def = BOSSES[b.k]; if (b.k === 'golem' && b.ph === 'stun') { dmg = Math.round(dmg * 1.5); crit = true; }
  if (b.k === 'turtle' && b.ph === 'shell' && dmg > 0) { dmg = Math.max(1, Math.round(dmg * .4)); crit = false; }
  if (dmg > 0) { b.hp -= dmg; b.hurt = 0.14; ftext(b.x, b.y - 2.3, dmg + (crit ? '!' : ''), crit ? '#ffc861' : '#fff1d6'); puff(b.x, b.y - .3, def.col, 6, 3); SFX.hit(); shake = Math.max(shake, 0.18); if (fx) applyFx(b, fx, dmg, true); }
  if (b.hp <= 0) {
    G.bossDead[b.k] = true; bossCleanup(b); gainXp({ queen: 120, slime: 200, golem: 320, turtle: 450, spirit: 500 }[b.k] || 100, b.x, b.y); G.hz = []; $('#bossbar').hidden = true; G.shots.length = 0; puff(b.x, b.y, def.col, 40, 5, 0.6); puff(b.x, b.y, '#ffc861', 16, 4, 1); SFX.win(); shake = 0.5;
    G.stats.beaten = G.stats.beaten || {}; const again = !!G.stats.beaten[b.k]; G.stats.beaten[b.k] = 1; for (const id of bossNoteIds(b.k)) if (!knows(id)) spawnDrop('rn_' + id, 1, b.x, b.y);
    if (ACC_OF[b.k] && (!again || Math.random() < .35)) { G.stats.accGot = G.stats.accGot || {}; G.stats.accGot[b.k] = 1; spawnDrop(ACC_OF[b.k], 1, b.x, b.y); } if (again) { rematchLoot(b); return; }
    if (UNIQ_OF[b.k]) { G.stats.uniq = G.stats.uniq || {}; if (!G.stats.uniq[b.k]) { G.stats.uniq[b.k] = 1; spawnDrop(UNIQ_OF[b.k], 1, b.x, b.y); } }
    if (b.k === 'golem') spawnDrop('golemCore', 1, b.x, b.y);
    if (b.k === 'turtle') { spawnDrop('lavaCore', 2, b.x, b.y); spawnDrop('goldBar', 6, b.x, b.y); spawnDrop('obsidian', 4, b.x, b.y); deepSeedDrop('turtle', SL, b); toast('용암 거북을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'spirit') { spawnDrop('frostCore', 2, b.x, b.y); spawnDrop('frostShard', 10, b.x, b.y); spawnDrop('goldBar', 3, b.x, b.y); deepSeedDrop('spirit', SI, b); toast('서리 정령을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'slime') { spawnDrop('lightSeed', 1, b.x, b.y); spawnDrop('gel', 8, b.x, b.y); spawnDrop('copperBar', 5, b.x, b.y); spawnDrop('ironOre', 4, b.x, b.y); toast('말랑대왕을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'queen') { spawnDrop('shroomCap', 10, b.x, b.y); spawnDrop('glowcap', 6, b.x, b.y); spawnDrop('ironBar', 4, b.x, b.y); spawnDrop('spore', 3, b.x, b.y); toast('버섯 여왕을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
    if (b.k === 'golem') { spawnDrop('crystal', 8, b.x, b.y); spawnDrop('cryGem', 3, b.x, b.y); spawnDrop('ironBar', 5, b.x, b.y); toast('수정골렘을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
  }
}
