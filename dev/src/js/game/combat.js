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
    const roll = () => { const crit = rand() < .1; return [Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1)), crit]; }; let landed = false;
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
    const roll = () => { const crit = rand() < .1; return [Math.max(1, Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1))), crit]; }; let landed = false;
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + ENEMY[e.k].r) { const [d, c] = roll(); hitEnemy(e, d, c, 18, 'slow'); landed = true; }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < R + BOSSES[k].hr) { const [d, c] = roll(); hitBoss(b, d, c, 'slow'); landed = true; } }
    if (landed) wear(w.slot); },
  volley(l) { const p = G.p, w = curWeapon(), W = wtOf(w); if (W.ranged !== 'arrow') { toast('화살비는 활을 들고 있어야 쓸 수 있어요', null, 'novolley'); return false; }
    if (aimMouse()) { const m = mouseWorld(); faceTo(m.x - p.x, m.y - (p.y - .45)); } else { const en = nearestEnemy(wRange(W)); if (en) faceTo(en.x - p.x, en.y - p.y); }
    const ang = Math.atan2(p.face.y, p.face.x), n = 3 + 2 * l, spread = .9;
    for (let k = 0; k < n; k++) { const a = ang + (k / (n - 1) - .5) * spread, crit = rand() < .1; shootP(a, { k: 'arrow', dmg: Math.max(1, Math.round(w.dmg * (.5 + .1 * l) * rangeMul() * (crit ? 1.6 : 1))), crit, spd: W.spd, range: wRange(W), pierce: 0, col: '#bff7ef', kb: 3, fx: w.fx }); }
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
  else if (fx === 'split') { for (let k = 0; k < 3; k++) { const a = rand() * 6.283; G.pshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: .32, hit: [e], ang: a, k: 'orb', dmg: Math.max(1, Math.round(dmg * .45)), crit: false, col: '#d6c2ff', kb: 3, pierce: 0, spd: 9 }); } }
}
function dotTick(e, dt, boss) {
  for (const [k, col] of [['poison', '#9be37a'], ['burn', '#ff9b4a']]) { const d = e[k]; if (!d) continue; d.t -= dt; d.acc = (d.acc || 0) + d.dps * dt * (boss ? .5 : 1);
    if (d.acc >= 1) { const n = Math.floor(d.acc); d.acc -= n; if (boss) bossDot(e, n, col); else dotHit(e, n, col); if (fxRand() < .5) puff(e.x, e.y - .3, col, 2, 1, .3); }
    if (d.t <= 0) e[k] = null; }
  if (e.slow > 0) { e.slow -= dt; if (fxRand() < dt * 4) puff(e.x, e.y - .2, e.chill ? '#d4f1ff' : '#b8f0a0', 1, .6, .3); if (e.slow <= 0) e.chill = 0; }
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
    if (ACC_OF[b.k] && (!again || rand() < .35)) { G.stats.accGot = G.stats.accGot || {}; G.stats.accGot[b.k] = 1; spawnDrop(ACC_OF[b.k], 1, b.x, b.y); } if (again) { rematchLoot(b); return; }
    if (UNIQ_OF[b.k]) { G.stats.uniq = G.stats.uniq || {}; if (!G.stats.uniq[b.k]) { G.stats.uniq[b.k] = 1; spawnDrop(UNIQ_OF[b.k], 1, b.x, b.y); } }
    if (b.k === 'golem') spawnDrop('golemCore', 1, b.x, b.y);
    if (b.k === 'turtle') { spawnDrop('lavaCore', 2, b.x, b.y); spawnDrop('goldBar', 6, b.x, b.y); spawnDrop('obsidian', 4, b.x, b.y); deepSeedDrop('turtle', SL, b); toast('용암 거북을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'spirit') { spawnDrop('frostCore', 2, b.x, b.y); spawnDrop('frostShard', 10, b.x, b.y); spawnDrop('goldBar', 3, b.x, b.y); deepSeedDrop('spirit', SI, b); toast('서리 정령을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'slime') { spawnDrop('lightSeed', 1, b.x, b.y); spawnDrop('gel', 8, b.x, b.y); spawnDrop('copperBar', 5, b.x, b.y); spawnDrop('ironOre', 4, b.x, b.y); toast('말랑대왕을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'queen') { spawnDrop('shroomCap', 10, b.x, b.y); spawnDrop('glowcap', 6, b.x, b.y); spawnDrop('ironBar', 4, b.x, b.y); spawnDrop('spore', 3, b.x, b.y); toast('버섯 여왕을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
    if (b.k === 'golem') { spawnDrop('crystal', 8, b.x, b.y); spawnDrop('cryGem', 3, b.x, b.y); spawnDrop('ironBar', 5, b.x, b.y); toast('수정골렘을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
  }
}
// ---- calling a beaten boss back for another fight ----
const REMATCH = { queen: [['shroomCap', 6], ['glowcap', 4], ['spore', 2], ['ironBar', 2]], slime: [['gel', 10], ['copperBar', 4], ['ironOre', 4]], golem: [['crystal', 6], ['cryGem', 2], ['golemCore', 1], ['ironBar', 3]], turtle: [['lavaCore', 1], ['goldBar', 4], ['obsidian', 3]], spirit: [['frostCore', 1], ['frostShard', 8], ['goldBar', 2]] };
function rematchLoot(b) { for (const [id, c] of REMATCH[b.k] || []) spawnDrop(id, c, b.x, b.y); const u = UNIQ_OF[b.k] && rand() < .35; if (u) spawnDrop(UNIQ_OF[b.k], 1, b.x, b.y); G.stats.rematch = (G.stats.rematch || 0) + 1;
  toast(`${BOSSES[b.k].n}을 다시 물리쳤어요!${u ? ' 전용 장비가 떨어졌어요' : ''}`, 'good'); }
const SUMMON = {
  queenIdol: ['포자 여왕 부름 버섯', 'queen', [['shroomCap', 10], ['glowcap', 6], ['spore', 4]], '#b673de', '#fbe7ff'],
  slimeIdol: ['말랑 왕관 조각상', 'slime', [['gel', 30], ['copperBar', 6]], '#86d96b', '#ffd25c'],
  golemIdol: ['수정 심장 조각상', 'golem', [['crystal', 20], ['ironBar', 6]], '#9d7fe0', '#7ff0e6'],
  turtleIdol: ['용암 등껍질 조각상', 'turtle', [['obsidian', 8], ['goldBar', 4], ['fireBerry', 4]], '#ff8a3d', '#ffc861'],
  spiritIdol: ['서리 결정 조각상', 'spirit', [['frostShard', 16], ['goldBar', 4]], '#9fd8f0', '#ffffff'],
};
for (const id in SUMMON) { const [n, k, req, c1, c2] = SUMMON[id];
  ITEMS[id] = { n, kind: 'summon', boss: k, d: `${BOSSES[k].n}을 물리친 뒤 보스방에서 쓰면 ${BOSSES[k].n}이 다시 나타나요. 다시 잡으면 재료와 함께 가끔 전용 장비가 떨어져요.` };
  ICON[id] = A => { A.r(4, 12, 8, 3, '#625d78'); A.r(4, 12, 8, 1, '#8f8aa3'); A.e(8, 8, 4, 4.6, c1); A.e(7, 6.6, 1.8, 1.6, c2); A.p(6, 6, '#ffffff'); A.p(10, 10, '#00000033'); };
  RECIPES.push(Rc(id, 1, req, 'forge', 'tool')); }
function summonDecide(it, s0) { const k = it.boss, h = BOSSES[k].home(), d = Math.hypot(G.p.x - h.x, G.p.y - h.y), t = targetTile();
  if (!beat(k)) return { k: 'info', lbl: '아직 몰라요', icon: 'dots', msg: `${BOSSES[k].n}을 한 번 물리친 뒤에 쓸 수 있어요`, t };
  if (!G.bossDead[k]) return { k: 'info', lbl: '깨어 있음', icon: 'dots', msg: `${BOSSES[k].n}이 이미 보스방에 있어요`, t };
  if (d > 9) return { k: 'info', lbl: '보스방에서', icon: 'dots', msg: `${BOSSES[k].n}의 보스방 안에서 써요`, t };
  return { k: 'summon', lbl: '소환', icon: s0.id, t, boss: k }; }
function summonBoss(k) { const s0 = selItem(); if (!s0 || ITEMS[s0.id].boss !== k || !G.bossDead[k]) return;
  s0.c--; if (!s0.c) { G.inv[G.sel] = null; refillHot(G.sel, s0.id); } invDirty = true;
  G.bossDead[k] = false; G.bosses[k] = freshBoss(k); const b = G.bosses[k]; puff(b.x, b.y, BOSSES[k].col, 30, 4, .8); shake = .4; SFX.boss(); toast(`${BOSSES[k].n}이 다시 나타났어요!`, 'warn', 'summon'); }
const pickOne = a => a[Math.floor(fxRand() * a.length)];
function hearts(x, y, n, ch = '♥', col = '#ff8fa3') { for (let k = 0; k < n; k++) G.texts.push({ x: x + (fxRand() - .5) * .9, y: y - .2 - fxRand() * .5, txt: ch, col, life: .8 + fxRand() * .5, vy: -1.2 - fxRand() }); }
function useObj(a) {
  const o = a.o, t = a.t, p = G.p, x = t.x + .5;
  switch (a.u) {
    case 'farm': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); SFX.pick(); toast(o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `${OBJ[o.t].n}에서 ${n}개를 꺼냈어요`, 'good', 'farm'); invDirty = true; break; }
      if (farmStage(o) >= 3) { farmHarvest(idx(t.x, t.y), o, false); toast(farmT(o)[1], null, 'farm'); break; }
      toast(`${farmT(o)[2]} (${Math.round(Math.min(1, (G.time - (o.p || 0)) / growOf(o)) * 100)}%) · 건전지·발전기와 전선으로 이으면 다 될 때마다 저절로 ${farmT(o)[0] === '캐기' ? '캐서' : '베어'} 옆 상자에 담아요`, null, 'farm'); break; }
    case 'lever': o.on = !o.on; SFX.click(); toast(o.on ? '레버를 켰어요' : '레버를 껐어요', null, 'lever'); break;
    case 'timer': { const L = [1, 2, 4, 8], k = (L.indexOf(o.per || 2) + 1) % L.length; o.per = L[k]; SFX.click(); toast(`타이머 간격: ${o.per}초마다 켜고 꺼요`, null, 'timer'); break; }
    case 'batt': toast(`건전지 ${Math.round((o.e || 0) / BATT_MAX * 100)}% 남았어요${(o.e || 0) <= 0 ? ' · 회수해서 작업대 [수리]로 충전해요' : ''}`, null, 'batt'); break;
    case 'fuel': { let added = 0; for (const f of ['resin', 'gel', 'wood']) { while ((o.fuel || 0) + FUEL[f] <= FUEL_MAX && countItem(f) > 0) { removeItem(f, 1); o.fuel = (o.fuel || 0) + FUEL[f]; added++; } }
      toast(added ? `연료를 넣었어요 · 약 ${Math.round((o.fuel || 0) / 60)}분 동안 일할 수 있어요` : (o.fuel || 0) >= FUEL_MAX - 30 ? '연료가 가득 찼어요' : `연료가 없어요 (나무·젤·송진) · 남은 연료 약 ${Math.round((o.fuel || 0) / 60)}분`, added ? 'good' : null, 'fuel'); if (added) SFX.place(); break; }
    case 'sprk': toast(o.work ? '물을 주는 중이에요 · 둘레 5×5 칸의 자라는 작물에 2초마다 물을 줘요' : '전기가 들어오지 않아요. 수정 발전기·건전지와 전선으로 이어 주세요', null, 'sprk'); break;
    case 'harv': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); SFX.pick(); toast(o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `자동 수확기에서 ${n}개를 꺼냈어요`, 'good', 'harv'); invDirty = true; break; }
      toast(o.work ? '둘레 3×3 칸의 다 자란 작물을 거둬서 옆 상자에 담아요' : '전기가 들어오지 않아요. 수정 발전기·건전지와 전선으로 이어 주세요', null, 'harv'); break; }
    case 'drill': { const n = (o.store || []).reduce((a2, s2) => a2 + s2.c, 0);
      if (n) { for (const s2 of o.store) { const l = moveInto(G.inv, s2); s2.c = l; } o.store = o.store.filter(s2 => s2.c > 0); SFX.pick(); toast(o.store.length ? '가방이 가득 차서 일부만 꺼냈어요' : `채굴기에서 ${n}개를 꺼냈어요`, 'good', 'drill'); invDirty = true; break; }
      const d2 = OBJ[o.t]; toast(o.work ? `캐는 중이에요 · 다음 광물까지 ${Math.ceil(d2.every - (o.prog || 0))}초` : o.why === 'power' || !o.why ? '전기가 들어오지 않아요. 건전지·발전기와 전선으로 이어 주세요' : o.why === 'wall' ? '앞에 캘 벽이 없어요. 광맥을 바라보게 다시 놓아 주세요' : o.why === 'tier' ? (d2.only ? '돌 채굴기는 흙벽·돌벽·화강암 벽(지형)만 캘 수 있어요. 광맥은 구리·철·황금 채굴기로 캐요' : '이 채굴기로는 못 캐는 벽이에요') : '안이 가득 찼어요. 꺼내거나 옆에 상자를 두세요', null, 'drill'); break; }
    case 'cinfo': { const d2 = OBJ[o.t]; toast(d2.src === 'cgen' ? '수정 발전기 · 연료 없이 계속 전기를 만들어요' : d2.sw === 'plate' ? '압력판 · 올라서 있는 동안 양쪽 전선을 이어 줘요' : d2.dev === 'door' ? (o.open ? '전기 문 · 전기가 들어와 열려 있어요' : '전기 문 · 전기가 들어오면 열려요') : (o.off === false ? '전기 램프 · 켜져 있어요' : '전기 램프 · 전기가 들어오면 켜져요'), null, 'cinfo'); break; }
    case 'door': { if (OBJ[o.t].dev === 'slide' && o.pw) { toast('자동 미닫이문 · 전기가 들어와 있어서 다가가면 저절로 열려요', null, 'cinfo'); break; }
      const grp = doorGroup(t.x, t.y), nv = !o.open; // a double door opens and closes together
      if (!nv && grp.some(([j]) => occupied(j % W, (j / W) | 0))) { toast('문 사이에 누가 있어서 닫을 수 없어요', null, 'doorblk'); break; }
      for (const [, g] of grp) g.open = nv; SFX.place(); puff(x, t.y + .6, '#e8d8c0', 3, 1.2); break; }
    case 'sit': { const sd = rotN(o.t) === 4 ? rotOf(o) : 0, fp2 = fpOf(o); p.sit = { x: t.x, y: t.y, px: p.x, py: p.y, dir: sd }; p.x = t.x + (fp2[0] > 1 ? fp2[0] / 2 : .5); p.y = t.y + (fp2[1] > 1 ? fp2[1] / 2 : .62); p.face = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 }][sd]; p.dir = ['down', 'side', 'up', 'side'][sd]; p.flip = sd === 3; } G.fish = null; SFX.place(); toast('편안하게 앉았어요. 체력이 조금씩 차올라요', null, 'sit'); break;
    case 'sleep': sleepIn(t); break;
    case 'pet': hearts(x, t.y, 5); SFX.purr(); if ((o.cd || 0) <= G.time) { o.cd = G.time + 20; p.hp = Math.min(maxHp(), p.hp + 5); ftext(p.x, p.y - 1.3, '♥ +5', '#ff8fa3'); } toast(pickOne(['골골골…', '말랑말랑해요', '쿠션이 기분 좋아 보여요']), null, 'pet'); break;
    case 'lamp': o.off = !o.off; lightDirty = true; SFX.click(); break;
    case 'feed': puff(x, t.y + .4, '#d4f1ff', 8, 1.2, .5); hearts(x, t.y, 3); SFX.plop(); toast('물고기들이 반가워해요', null, 'feed'); break;
    case 'read': G.tipN = ((G.tipN || 0) + 1) % TIPS.length; toast(TIPS[G.tipN]); SFX.page(); break;
    case 'mirror': puff(p.x, p.y - .8, '#fff7c2', 10, 2, .8); SFX.seed(); toast(pickOne(COMPLIMENTS), null, 'mirror'); break;
    case 'dress': openPanel('look'); break;
    case 'wish': if ((o.cd || 0) > G.time) { toast('분수가 쉬고 있어요. 조금 뒤에 다시 빌어요', null, 'wish'); break; } o.cd = G.time + 120; G.luck = G.time + 120; puff(x, t.y, '#bfefff', 16, 2.5, 1); SFX.seed(); toast('행운이 깃들었어요! 2분 동안 낚시 운 2단계 (요리의 낚시 운과 겹치면 더 높은 쪽만)', 'good'); break;
    case 'water': o.shake = .3; for (let k = 0; k < 8; k++) G.parts.push({ x: x + (fxRand() - .5) * .6, y: t.y + .6, z: 1.2, vx: (fxRand() - .5), vy: 0, vz: -1, life: .5, max: .5, col: '#8fd0ff', sz: 1 }); SFX.plop(); toast('촉촉해졌어요', null, 'water'); break;
    case 'tea': if ((o.cd || 0) > G.time) { toast('찻잔이 비었어요. 조금 뒤에 다시 마셔요', null, 'tea'); break; } o.cd = G.time + 45; p.hp = Math.min(maxHp(), p.hp + 6); p.hunger = Math.min(100, p.hunger + 4); ftext(p.x, p.y - 1.3, '♥ +6', '#ff8fa3'); SFX.eat(); toast('따뜻한 차 한 잔, 기운이 나요', null, 'tea'); break;
  }
}
function standUp() { const p = G.p, s = p.sit; if (!s) return; p.sit = null; p.x = s.px; p.y = s.py; if (boxHits(p.x, p.y, .28)) { p.x = s.x + .5; p.y = s.y + 1.5; } }
function sleepIn(t) { const p = G.p; G.fish = null; p.sleep = { t: 2.6, x: t.x, y: t.y }; p.inv = 4; const f = $('#fade'); f.textContent = '쿨쿨… 좋은 꿈 꾸는 중'; f.classList.add('sleep'); f.hidden = false; SFX.sleep(); }
function wakeUp() { const p = G.p, s = p.sleep; p.sleep = null; const f = $('#fade'); f.hidden = true; f.classList.remove('sleep'); f.textContent = '기절했어요…'; p.hp = maxHp(); p.hunger = Math.max(0, p.hunger - 6); G.spawnPt = { x: s.x, y: s.y }; G.enemies = G.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) > 12); toast('푹 잤어요! 체력이 가득 찼고, 여기서 다시 깨어나요', 'good'); }
function startFish(t) { const p = G.p; faceTo(t.x + .5 - p.x, t.y + .5 - p.y); G.fish = { tx: t.x, ty: t.y, bx: t.x + .5 + (fxRand() - .5) * .3, by: t.y + .55, st: 'wait', t: 1.6 + rand() * 3.4, bite: 0, win: .95, fly: 0.3, nib: 0 }; SFX.cast(); }
function splash(x, y, n) { for (let k = 0; k < n; k++) { const a = fxRand() * 6.283; G.parts.push({ x, y, z: .05, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * .6, vz: 2 + fxRand() * 1.5, life: .4, max: .4, col: '#bfe6ff', sz: 1 }); } }
function updateFish(dt) {
  if (G.fishFx) { G.fishFx.t += dt; if (G.fishFx.t > 0.55) G.fishFx = null; }
  const f = G.fish; if (!f) return; const p = G.p;
  if (p.moving || p.dead > 0 || p.sit || p.sleep || !usableItem('rod')) { G.fish = null; return; }
  if (f.fly > 0) { f.fly -= dt; if (f.fly <= 0) { SFX.plop(); splash(f.bx, f.by, 5); } return; }
  f.nib = Math.max(0, f.nib - dt);
  if (f.st === 'wait') { f.t -= dt; if (f.t > 0.7 && f.nib <= 0 && rand() < dt * 0.7) { f.nib = 0.22; SFX.plop(); }
    if (f.t <= 0) { f.st = 'bite'; f.bite = f.win; SFX.bite(); splash(f.bx, f.by, 8); ftext(p.x, p.y - 1.7, '!', '#ffc861'); try { navigator.vibrate && navigator.vibrate(40); } catch (e) { } } }
  else { f.bite -= dt; if (f.bite <= 0) { toast('놓쳤어요… 다시 던져 봐요', null, 'miss'); G.fish = null; } }
}
function reel() {
  const f = G.fish; if (!f) return; G.fish = null;
  if (f.st !== 'bite') { SFX.place(); return; }
  const tbl = catchTable(G.biome[idx(f.tx, f.ty)]); let r = rand() * tbl.reduce((a, x) => a + x[1], 0), id = tbl[0][0];
  for (const [k, w] of tbl) { r -= w; if (r <= 0) { id = k; break; } }
  if (id === 'bottle') fishBottle(); else { const left = addItem(id, 1); if (left) spawnDrop(id, 1, G.p.x, G.p.y); } maybeNote('fish', G.p.x, G.p.y);
  G.fishFx = { id, t: 0, x0: f.bx, y0: f.by, x1: G.p.x, y1: G.p.y - .5 }; splash(f.bx, f.by, 12); SFX.catch();
  const seen = G.stats.fishSeen || (G.stats.fishSeen = {});
  if (id === 'bottle') { } else if (!seen[id]) { seen[id] = 1; toast(`처음 낚았어요: ${ITEMS[id].n}!`, 'good'); } else ftext(G.p.x, G.p.y - 1.5, ITEMS[id].n, '#bfe6ff');
  G.stats.fishCaught = (G.stats.fishCaught || 0) + 1; gainXp(id === 'koi' ? 12 : id === 'boot' ? 1 : 4, G.p.x, G.p.y);
  wear(bestTool('rod'));
}
function mineWall(t) {
  const p = G.p, i = idx(t.x, t.y), w = G.wall[i], def = WALLS[w], pk = bestPick();
  faceTo(t.x + .5 - p.x, t.y + .5 - p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(p.face.y, p.face.x), icon: pk.id === 'hand' ? null : pk.id };
  if (def.tier > pk.tier) { SFX.clink(); puff(t.x + .5, t.y + .9, '#ffffff', 3, 1.5); toast(`${def.n}은(는) ${TIERNAME[def.tier] || '더 좋은 곡괭이'}가 필요해요`, null, 'tier' + w); return; }
  const dm = (G.wdmg.get(i) || 0) + pk.power * mineMul(); wear(pk.slot); SFX.mine(); puff(t.x + .5, t.y + .95, WPAL[w][1], 4, 2, 0.2); shake = Math.max(shake, 0.06);
  if (dm >= def.hp) {
    breakWall(t.x, t.y);
  } else G.wdmg.set(i, dm);
}
function hitObj(t, o) {
  const d = OBJ[o.t], tl = natTool(d), i = idx(t.x, t.y), tier = tl ? ITEMS[tl.id].tier || 0 : 0; // v65: an axe (or else a pickaxe) from the tool pouch
  faceTo(t.x + .5 - G.p.x, t.y + .5 - G.p.y);
  G.swing = { t: 0.2, max: 0.2, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: d.nat === 'pick' || !tl ? null : tl.id };
  if ((d.tier || 0) > tier) { SFX.clink(); toast(`${d.n}은(는) ${TIERNAME[d.tier]}가 필요해요`, null, 'otier'); return; }
  o.dmg = (o.dmg || 0) + (d.nat === 'pick' ? 9 : Math.max(1, tl ? toolPow(tl) : 0.5) * mineMul()); if (d.nat !== 'pick' && tl) wear(tl);
  SFX.mine(); puff(t.x + .5, t.y + .7, o.t === 'cluster' ? C.cry : o.t === 'bigShroom' ? '#e07b5f' : '#7fbf6a', 4, 2);
  const yg = isYoung(o);
  if (o.dmg >= (yg ? Math.max(1, Math.ceil(d.hp / 2)) : d.hp)) { delObj(i); const fpc = d.sz ? fpOf(o) : [1, 1]; rollDrops(yg ? youngDrops(d.drops) : d.drops, t.x + fpc[0] / 2, t.y + fpc[1] / 2); if (d.dropFn) d.dropFn(t.x + fpc[0] / 2, t.y + fpc[1] / 2); if ((d.nat === 'cut' && !d.ntree) || d.nat === 'pick') maybeNote('gather', t.x + .5, t.y + .5); afterCut(t, o); SFX.brk(); lightDirty = true; gainXp(o.t === 'cluster' ? 3 : o.t === 'root' || o.t === 'bigShroom' || d.ntree ? 1 : 0); } else o.shake = 0.15;
}
function placeItem(t) {
  const s = selItem(); if (!s) return; const it = ITEMS[s.id], i = idx(t.x, t.y);
  if (it.kind === 'wall') { G.wall[i] = it.wall; G.wdmg.delete(i); if (G.floor[i] === WATER) G.floor[i] = 2; if (G.floor[i] === LAVA) G.floor[i] = 18; if (G.under.get(i) === WATER) G.under.set(i, 2); }
  else if (it.kind === 'floor') { const old = G.floor[i]; G.floor[i] = it.floor; if (isPlacedFloor(old)) spawnDrop(FLOOR_ITEM[old], 1, t.x + .5, t.y + .5); else G.under.set(i, old); }
  else if (it.kind === 'ground') { G.floor[i] = it.ground; G.under.delete(i); }
  else if (it.kind === 'wire') G.wire.set(i, 1);
  else if (it.kind === 'seed') G.objs.set(i, OBJ[it.crop].growTo ? { t: it.crop, at: G.time + GROW_TIME } : { t: it.crop, p: G.time, p0: G.time });
  else { const o = { t: it.obj }; if (it.blv) o.lv = it.blv; if (it.obj === 'bush') o.r = G.time + 150; if (OBJ[it.obj].ranch) o.p = G.time + OBJ[it.obj].every; if (it.obj === 'battery') o.e = s.dur != null ? s.dur : BATT_MAX; if (it.obj === 'eLamp') o.off = true; if (OBJ[it.obj].dev === 'drill') { const f = G.p.face; o.dir = Math.abs(f.x) > Math.abs(f.y) ? { x: Math.sign(f.x), y: 0 } : { x: 0, y: f.y < 0 ? -1 : 1 }; } if (it.obj === 'chest') o.items = Array(18).fill(null); if (OBJ[it.obj].dev === 'farm') o.p = G.time; const dd = OBJ[it.obj];
    const pr = pRot(), rn = rotN(it.obj); if (rn > 1 && pr % rn) { o.dir = pr % rn; if (rotSwaps(dd) && o.dir % 2) o.rot = 1; } // v65: 2 or 4 directions, chosen before placing
    if (dd.sz) { const a = placeAnchor(t, fpOf(o)); t = { x: a.x, y: a.y }; G.objs.set(idx(a.x, a.y), o); setParts(idx(a.x, a.y), o); }
    else G.objs.set(i, o);
    if (it.obj === 'bench') G.stats.bench = 1; if (it.blv && it.obj === 'bench') { G.stats.forge = 1; G.stats.benchLv = Math.max(G.stats.benchLv || 0, it.blv); } if (it.blv && it.obj === 'smelter') G.stats.gearLv = Math.max(G.stats.gearLv || 0, it.blv); if (it.obj === 'torch') G.stats.torch++; if (OBJ[it.obj].bed) { G.spawnPt = { x: t.x, y: t.y }; toast('이제 기절하면 침대에서 깨어나요', 'good', 'bed'); } }
  s.c--; if (!s.c) { G.inv[G.sel] = null; refillHot(G.sel, s.id); } invDirty = true;
  SFX.place(); puff(t.x + .5, t.y + .9, '#e8d8c0', 5, 1.6, 0.1); lightDirty = true; mapPixel(t.x, t.y);
}
function harvest(t, o) {
  const d = OBJ[o.t];
  const sk = hasItem('sickle'); // a copper sickle in the bag gives one more of the main crop
  if (d.crop) { const i = idx(t.x, t.y); if (o.star == null) rollStar(i, o); G.objs.delete(i); // a star crop gives its main harvest as star items
    rollDrops(d.yield.map(([id, a, b, ch], k) => [!k && o.star && STAR_OF[id] ? STAR_OF[id] : id, a + (sk && !k ? 1 : 0), b + (sk && !k ? 1 : 0), id === 'glowcap' && o.f === 2 ? .6 : ch]), t.x + .5, t.y + .5);
    const S = G.stats; S.cropH = (S.cropH || 0) + 1; if (o.star) { S.starH = (S.starH || 0) + 1; ftext(t.x + .5, t.y - .3, '★ 별 작물!', '#ffe9a8'); } if (o.t === 'cropBerry') S.berryH = (S.berryH || 0) + 1; if (o.w) S.wetH = (S.wetH || 0) + 1; }
  else { o.r = G.time + 150; rollDrops([['berry', 2 + (sk ? 1 : 0), 3 + (sk ? 1 : 0), 1], ['berrySeed', 1, 1, 0.3]], t.x + .5, t.y + .6); }
  SFX.pick(); puff(t.x + .5, t.y + .5, '#9be37a', 6, 2); gainXp(2); maybeNote('gather', t.x + .5, t.y + .5);
}
function eat(slot) {
  const s = G.inv[slot]; if (!s) return; const it = ITEMS[s.id]; if (it.kind !== 'food') return;
  const p = G.p; if (p.hunger >= 99.5 && p.hp >= maxHp() && !it.buff) { toast('지금은 배가 불러요', null, 'full'); return; }
  const bc = it.buff ? buffCheck(it, s.id) : null; if (bc === 'ask') return;
  const gm = 1 + skl('gourmet') * 0.1, fd = Math.round(it.food * gm), hl = Math.round((it.heal || 0) * gm);
  p.hunger = Math.min(100, p.hunger + fd); p.hp = Math.min(maxHp(), p.hp + hl); s.c--; if (!s.c) { G.inv[slot] = null; refillHot(slot, s.id); } invDirty = true;
  SFX.eat(); ftext(p.x, p.y - 1.3, `+${fd}`, '#ffb15c'); if (hl) ftext(p.x + .4, p.y - 1.0, `♥${hl}`, '#ff8fa3');
  if (bc === 'ok') applyBuff(it, s.id);
}
