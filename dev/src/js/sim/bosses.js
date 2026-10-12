// ================= 보스: 깨우기·패턴(BOSS_AI)·단계·탄환·위험 지대, 맞기, 재도전 보상·소환 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// hazards on the floor: lava pools, frost nova warnings
function updateHazards(dt) {
  G.hz = G.hz || [];
  for (let i = G.hz.length - 1; i >= 0; i--) { const h = G.hz[i]; h.t += dt; if (h.t > h.life) { G.hz.splice(i, 1); continue; } const live = alivePlayers(); if (h.t < h.warn || !live.length) continue;
    const hit = pl => Math.hypot(pl.p.x - h.x, pl.p.y - h.y) < h.r; // 살아 있는 플레이어마다 (8단계)
    if (h.k === 'lava') { for (const pl of live) if (hit(pl)) withPlayer(pl, () => hurtPlayer(h.dmg, h.x, h.y, 'fire')); }
    else if (!h.done) { h.done = 1; emit('puff', h.x, h.y, '#d4f6ff', 26, 4.5, .4); emit('shake', .3); for (const pl of live) if (hit(pl)) withPlayer(pl, () => { const p = G.p; hurtPlayer(h.dmg, h.x, h.y); p.slowT = (h.slow || 2) * (wearing('snowBrooch') ? broochMul(eqLv('snowBrooch')) : 1); emit('ftext', p.x, p.y - 1.6, '꽁꽁!', '#bfe6ff'); }); } }
}
function bossDot(b, n, col) { if (b.hp <= 0 || G.bossDead[b.k]) return; b.hp -= n; emit('ftext', b.x, b.y - 2.3, n, col); if (b.hp <= 0) hitBoss(b, 0, false); }
function hitBoss(b, dmg, crit, fx) {
  if ((b.inv || 0) > 0) { if (dmg > 0) emit('ftext', b.x, b.y - 2.3, '막힘', '#bfe6ff'); return; }
  if (b.k === 'turtle' && b.ph === 'open' && dmg > 0) { dmg = Math.round(dmg * 1.5); crit = true; }
  const def = BOSSES[b.k]; if (b.k === 'golem' && b.ph === 'stun') { dmg = Math.round(dmg * 1.5); crit = true; }
  if (b.k === 'turtle' && b.ph === 'shell' && dmg > 0) { dmg = Math.max(1, Math.round(dmg * .4)); crit = false; }
  if (dmg > 0) { b.hp -= dmg; b.hurt = 0.14; emit('ftext', b.x, b.y - 2.3, dmg + (crit ? '!' : ''), crit ? '#ffc861' : '#fff1d6'); emit('puff', b.x, b.y - .3, def.col, 6, 3); emit('sfx', 'hit'); emit('shake', 0.18); if (fx) applyFx(b, fx, dmg, true); }
  if (b.hp <= 0) {
    G.bossDead[b.k] = true; bossCleanup(b); gainXp({ queen: 120, slime: 200, golem: 320, turtle: 450, spirit: 500 }[b.k] || 100, b.x, b.y); G.hz = []; emit('bossbar', false); G.shots.length = 0; emit('puff', b.x, b.y, def.col, 40, 5, 0.6); emit('puff', b.x, b.y, '#ffc861', 16, 4, 1); emit('sfx', 'win'); emit('shake', 0.5, true);
    G.stats.beaten = G.stats.beaten || {}; const again = !!G.stats.beaten[b.k]; G.stats.beaten[b.k] = 1; for (const id of bossNoteIds(b.k)) if (!knows(id)) spawnDrop('rn_' + id, 1, b.x, b.y);
    if (ACC_OF[b.k] && (!again || rand() < .35)) { G.stats.accGot = G.stats.accGot || {}; G.stats.accGot[b.k] = 1; spawnDrop(ACC_OF[b.k], 1, b.x, b.y); } if (again) { rematchLoot(b); return; }
    if (UNIQ_OF[b.k]) { G.stats.uniq = G.stats.uniq || {}; if (!G.stats.uniq[b.k]) { G.stats.uniq[b.k] = 1; spawnDrop(UNIQ_OF[b.k], 1, b.x, b.y); } }
    if (b.k === 'golem') spawnDrop('golemCore', 1, b.x, b.y);
    if (b.k === 'turtle') { spawnDrop('lavaCore', 2, b.x, b.y); spawnDrop('goldBar', 6, b.x, b.y); spawnDrop('obsidian', 4, b.x, b.y); deepSeedDrop('turtle', SL, b); emit('toast', '용암 거북을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'spirit') { spawnDrop('frostCore', 2, b.x, b.y); spawnDrop('frostShard', 10, b.x, b.y); spawnDrop('goldBar', 3, b.x, b.y); deepSeedDrop('spirit', SI, b); emit('toast', '서리 정령을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'slime') { spawnDrop('lightSeed', 1, b.x, b.y); spawnDrop('gel', 8, b.x, b.y); spawnDrop('copperBar', 5, b.x, b.y); spawnDrop('ironOre', 4, b.x, b.y); emit('toast', '말랑대왕을 물리쳤어요! 빛씨앗이 떨어졌어요', 'good'); }
    if (b.k === 'queen') { spawnDrop('shroomCap', 10, b.x, b.y); spawnDrop('glowcap', 6, b.x, b.y); spawnDrop('ironBar', 4, b.x, b.y); spawnDrop('spore', 3, b.x, b.y); emit('toast', '버섯 여왕을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
    if (b.k === 'golem') { spawnDrop('crystal', 8, b.x, b.y); spawnDrop('cryGem', 3, b.x, b.y); spawnDrop('ironBar', 5, b.x, b.y); emit('toast', '수정골렘을 물리쳤어요! 제단의 봉인이 풀렸어요', 'good'); }
  }
}
function rematchLoot(b) { for (const [id, c] of REMATCH[b.k] || []) spawnDrop(id, c, b.x, b.y); const u = UNIQ_OF[b.k] && rand() < .35; if (u) spawnDrop(UNIQ_OF[b.k], 1, b.x, b.y); G.stats.rematch = (G.stats.rematch || 0) + 1;
  emit('toast', `${BOSSES[b.k].n}을 다시 물리쳤어요!${u ? ' 전용 장비가 떨어졌어요' : ''}`, 'good'); }
function summonDecide(it, s0) { const k = it.boss, h = BOSSES[k].home(), d = Math.hypot(G.p.x - h.x, G.p.y - h.y), t = targetTile();
  if (!beat(k)) return { k: 'info', lbl: '아직 몰라요', icon: 'dots', msg: `${BOSSES[k].n}을 한 번 물리친 뒤에 쓸 수 있어요`, t };
  if (!G.bossDead[k]) return { k: 'info', lbl: '깨어 있음', icon: 'dots', msg: `${BOSSES[k].n}이 이미 보스방에 있어요`, t };
  if (d > 9) return { k: 'info', lbl: '보스방에서', icon: 'dots', msg: `${BOSSES[k].n}의 보스방 안에서 써요`, t };
  return { k: 'summon', lbl: '소환', icon: s0.id, t, boss: k }; }
function summonBoss(k) { const s0 = selItem(); if (!s0 || ITEMS[s0.id].boss !== k || !G.bossDead[k]) return;
  s0.c--; if (!s0.c) { G.inv[G.sel] = null; refillHot(G.sel, s0.id); } invDirty = true;
  G.bossDead[k] = false; G.bosses[k] = freshBoss(k); const b = G.bosses[k]; emit('puff', b.x, b.y, BOSSES[k].col, 30, 4, .8); emit('shake', .4, true); emit('sfx', 'boss'); emit('toast', `${BOSSES[k].n}이 다시 나타났어요!`, 'warn', 'summon'); }
onFrame('bosses', updateBosses);
function updateBosses(dt) {
  let active = null;
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; withPlayer(nearestPlayer(b.x, b.y), () => { if (bossCommon(b, dt)) { if (b.inv > 0) b.inv -= dt; phaseCheck(b); if (b.ph === 'roar') { b.t -= dt; b.anim = (b.anim || 0) + dt; if (b.t <= 0) { b.ph = 'walk'; b.t = .6; } } else BOSS_AI[k](b, dt); if (k === 'spirit' && (b.stage || 1) >= 3) cloneTick(b, dt); if (!G.bossDead[k]) dotTick(b, dt, true); active = G.bossDead[k] ? null : b; } }); } // 보스마다 가장 가까운 플레이어 (8단계)
  if (active) withPlayer(nearestPlayer(active.x, active.y), () => emit('bossHp', active.k, active.hp, active.max));
  updateShots(dt); updateHazards(dt);
}
function bossCommon(b, dt) {
  const def = BOSSES[b.k], p = G.p, d = Math.hypot(p.x - b.x, p.y - b.y); b.hurt = Math.max(0, b.hurt - dt); b.d = d;
  if (b.st === 'sleep') { if (d < def.wake && p.dead <= 0) { b.st = 'fight'; b.t = 1.2; emit('sfx', 'boss'); emit('shake', 0.4, true); emit('toast', `${def.n}이 깨어났어요!`); emit('bossbar', true); } return false; }
  if (p.dead > 0 || d > 24) { bossCleanup(b); Object.assign(b, freshBoss(b.k)); emit('bossbar', false); G.shots.length = 0; G.hz = []; return false; }
  return true;
}
const BOSS_AI = {
  turtle(b, dt) {
    const p = G.p, d = b.d, st = b.stage || 1, half = st >= 2; b.t -= dt;
    if (b.ph === 'walk') { if (d > 2.4) moveEnt(b, (p.x - b.x) / d * 1.1 * dt, (p.y - b.y) / d * 1.1 * dt, 1.0); b.anim = (b.anim || 0) + dt; if (b.t <= 0) { b.casts++; if (st === 3 && b.casts % 3 === 1) { b.ph = 'erupt'; b.t = .9; emit('sfx', 'boss'); } else if (b.casts % 3 === 0) { b.ph = 'hide'; b.t = .55; } else { b.ph = 'spit'; b.t = .5; } } }
    else if (b.ph === 'erupt') { if (fxRand() < dt * 25) emit('puff', b.x + (fxRand() - .5), b.y - .3, '#ff8a3d', 1, 2.4, .3); emit('shake', .08); if (b.t <= 0) { turtleErupt(b); b.ph = 'open'; b.t = 3; emit('ftext', b.x, b.y - 2.4, '지금이에요!', '#ffd25c'); } }
    else if (b.ph === 'open') { if (fxRand() < dt * 6) emit('puff', b.x, b.y - .5, '#ffd25c', 1, 1.2, .2); if (b.t <= 0) { b.ph = 'walk'; b.t = .8; } }
    else if (b.ph === 'spit') { if (b.t <= 0) { const n = half ? 7 : 5, base = Math.atan2(p.y - b.y, p.x - b.x); for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.26; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, life: 3, dmg: 20, k: 'fire' }); } emit('sfx', 'cast2'); b.ph = 'walk'; b.t = half ? 0.8 : 1.2; } }
    else if (b.ph === 'hide') { if (b.t <= 0) { b.ph = 'shell'; b.t = half ? 3.2 : 2.6; const a = Math.atan2(p.y - b.y, p.x - b.x); b.dx = Math.cos(a); b.dy = Math.sin(a); b.bounce = 0; emit('sfx', 'swing'); } }
    else if (b.ph === 'shell') {
      const sp = half ? 10.5 : 8.5, ox = b.x, oy = b.y, mx = b.dx * sp * dt, my = b.dy * sp * dt;
      if (moveEnt(b, mx, my, 1.0)) { if (Math.abs(b.x - ox) < Math.abs(mx) * .5) b.dx = -b.dx; if (Math.abs(b.y - oy) < Math.abs(my) * .5) b.dy = -b.dy; b.bounce++; emit('shake', .3); emit('sfx', 'brk'); emit('puff', b.x, b.y, '#ff8a3d', 8, 3); if (st >= 2) emberBurst(b); }
      if (fxRand() < dt * 8) emit('puff', b.x, b.y + .3, '#ff8a3d', 1, 1, .2);
      if (b.t <= 0 || b.bounce >= (st === 3 ? 7 : 5)) { b.ph = 'walk'; b.t = 1.1; G.hz = G.hz || []; const n = half ? 6 : 4; for (let k = 0; k < n; k++) { const hx = p.x + (rand() - .5) * 5, hy = p.y + (rand() - .5) * 5; if (!isSolid(Math.floor(hx), Math.floor(hy))) G.hz.push({ x: hx, y: hy, r: 1.1, t: 0, warn: .8, life: 7, dmg: 15, k: 'lava' }); } }
    }
    if (d < 1.5) hurtPlayer(b.ph === 'shell' ? 28 : 18, b.x, b.y);
  },
  spirit(b, dt) {
    const p = G.p, d = b.d, st = b.stage || 1, half = st >= 2; b.t -= dt; b.anim = (b.anim || 0) + dt;
    if (b.ph === 'walk') { const want = d > 5 ? 1 : d < 3.4 ? -1 : 0; if (want && d > 0) moveEnt(b, (p.x - b.x) / d * 1.9 * want * dt, (p.y - b.y) / d * 1.9 * want * dt, .8); if (b.t <= 0) { b.casts++; b.ph = b.casts % (half ? 2 : 3) === 0 ? 'fade' : 'ring'; b.t = b.ph === 'fade' ? .55 : .65; } }
    else if (b.ph === 'ring') { if (b.t <= 0) { const n = 18, gap = Math.floor(rand() * n), off = rand(); for (let k = 0; k < n; k++) { if ((k - gap + n) % n < 3) continue; const a = (k + off) / n * 6.283; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.4, vy: Math.sin(a) * 4.4, life: 4, dmg: 17, k: 'ice', a, spin: st === 3 ? (b.rings % 2 ? -.35 : .35) : 0 }); } emit('sfx', 'cast2'); if (st === 3) for (const e of G.enemies) if (e.k === 'spiritClone') emit('puff', e.x, e.y - .6, '#bfe6ff', 8, 2.2); b.rings = (b.rings || 0) + 1; if (half && b.rings % 2 === 1) b.t = .55; else { b.ph = 'walk'; b.t = half ? 1.0 : 1.5; } } }
    else if (b.ph === 'fade') { if (b.t <= 0) { const h0 = BOSSES.spirit.home(); for (let k = 0; k < 24; k++) { const a = rand() * 6.283, r = 1.8 + rand() * 1.0, x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (!boxHits(x, y, .8) && Math.hypot(x - h0.x, y - h0.y) < 12) { b.x = x; b.y = y; break; } }
      if (st === 3) { const nc = G.enemies.filter(e => e.k === 'spiritClone').length; if (nc < 2) spiritClones(b, 2 - nc); } b.ph = 'nova'; b.t = 1.0; G.hz = G.hz || []; G.hz.push({ x: b.x, y: b.y, r: 3.2, t: 0, warn: .9, life: 1.05, dmg: 26, k: 'frost', slow: 2.8 }); emit('puff', b.x, b.y - .5, '#d4f6ff', 14, 2.5); } }
    else if (b.ph === 'nova') { if (b.t <= 0) { b.ph = 'walk'; b.t = .9; if (half && G.enemies.length < 8) { const nf = st === 3 ? Math.max(0, 2 - G.enemies.filter(e => e.k === 'frostSlime').length) : 2; for (let k = 0; k < nf; k++) G.enemies.push(mkEnemy('frostSlime', b.x + (k ? 1.4 : -1.4), b.y + .6)); } } }
    if (d < 1.2 && b.ph !== 'fade') hurtPlayer(18, b.x, b.y);
  },
  slime(b, dt) {
    const p = G.p, d = b.d;
    if (b.air > 0) {
      moveEnt(b, b.vx * dt, b.vy * dt, 0.85); b.air -= dt; b.z = Math.sin((1 - Math.max(0, b.air) / b.airMax) * Math.PI) * 1.8;
      if (b.air <= 0) {
        b.z = 0; b.lands++; emit('shake', 0.35, true); emit('sfx', 'brk'); emit('slamRing', b.x, b.y);
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
      b.rot += 0.31; b.casts++; emit('sfx', 'cast2');
      if (!b.dbl && b.casts % 2 === 0 && G.enemies.length < 9) for (let k = 0; k < (half ? 3 : 2); k++) G.enemies.push(mkEnemy('shroomy', b.x + (k - (half ? 1 : .5)) * 1.6, b.y + .8));
      if (half && !b.dbl) { b.dbl = 1; b.ph = 'cast'; b.t = .45; } else { b.dbl = 0; b.ph = 'walk'; b.t = half ? 1.3 : 1.9; } } }
    if (d < 1.3) hurtPlayer(15, b.x, b.y);
  },
  golem(b, dt) {
    const p = G.p, d = b.d, half = b.hp < b.max / 2; b.t -= dt;
    if (b.ph === 'walk') { if (d > 2.5) moveEnt(b, (p.x - b.x) / d * 1.4 * dt, (p.y - b.y) / d * 1.4 * dt, .9); if (b.t <= 0) { b.ph = 'aim'; b.t = 0.75; } }
    else if (b.ph === 'aim') { if (b.t > 0.3) { b.dx = (p.x - b.x) / (d || 1); b.dy = (p.y - b.y) / (d || 1); } if (b.t <= 0) { b.ph = 'dash'; b.t = 0.62; emit('sfx', 'swing'); } }
    else if (b.ph === 'dash') {
      const blocked = moveEnt(b, b.dx * 12.5 * dt, b.dy * 12.5 * dt, .9); if (fxRand() < .5) emit('puff', b.x, b.y + .3, '#8a83ad', 1, 1, .1);
      if (blocked) { b.ph = 'stun'; b.t = 1.0; b.chain = 0; emit('shake', 0.45, true); emit('sfx', 'brk'); emit('puff', b.x + b.dx, b.y + b.dy, C.cryL, 14, 3); emit('ftext', b.x, b.y - 2.6, '기절!', '#7ff0e6'); }
      else if (b.t <= 0) { const n = half ? 9 : 7, base = Math.atan2(p.y - b.y, p.x - b.x); for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.22; G.shots.push({ x: b.x, y: b.y - .4, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, life: 3, dmg: 17, k: 'shard', a }); } emit('sfx', 'clink'); if (half && !b.chain) { b.chain = 1; b.ph = 'aim'; b.t = .6; } else { b.chain = 0; b.ph = 'walk'; b.t = half ? 0.5 : 0.9; } }
    }
    else if (b.ph === 'stun') { if (b.t <= 0) { b.ph = 'walk'; b.t = 0.6; } }
    if (d < 1.4 && b.ph !== 'stun') hurtPlayer(b.ph === 'dash' ? 26 : 18, b.x, b.y);
  },
};
function updateShots(dt) {
  for (let i = G.shots.length - 1; i >= 0; i--) {
    const s = G.shots[i]; if (s.spin) { const c = Math.cos(s.spin * dt), sn = Math.sin(s.spin * dt), vx = s.vx * c - s.vy * sn; s.vy = s.vx * sn + s.vy * c; s.vx = vx; } s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (inB(tx, ty) && pillarBlocks(s, tx, ty)) { G.shots.splice(i, 1); continue; }
    if (s.life <= 0 || !inB(tx, ty) || G.wall[idx(tx, ty)]) { emit('puff', s.x, s.y, s.k === 'spore' ? '#d59bff' : C.cryL, 3, 1.5, .2); G.shots.splice(i, 1); continue; }
    const pl = alivePlayers().find(q => Math.hypot(s.x - q.p.x, s.y - (q.p.y - .3)) < 0.42); // 살아 있는 플레이어 누구든
    if (pl) { withPlayer(pl, () => hurtPlayer(s.dmg, s.x - s.vx, s.y - s.vy, s.k === 'fire' ? 'fire' : null)); G.shots.splice(i, 1); }
  }
}
const bossStage = b => b.hp > b.max * 2 / 3 ? 1 : b.hp > b.max / 3 ? 2 : 3;
function phaseCheck(b) { if (!PHASE_BOSS[b.k] || b.hp <= 0) return; b.stage = b.stage || 1; const s = bossStage(b); if (s <= b.stage) return;
  b.stage = s; b.ph = 'roar'; b.t = 1.5; b.inv = 1.5; G.shots.length = 0; emit('shake', .5); emit('sfx', 'boss'); emit('puff', b.x, b.y - .5, BOSSES[b.k].col, 30, 4, .6); emit('puff', b.x, b.y - .5, '#ffe9a8', 12, 3, .8); emit('ftext', b.x, b.y - 2.6, '!!', '#ffd25c');
  G.stats.phaseTip = G.stats.phaseTip || {}; const key = b.k + s; if (!G.stats.phaseTip[key]) { G.stats.phaseTip[key] = 1; emit('toast', PHASE_TIP[b.k][s - 2], 'warn', 'phase'); }
  if (b.k === 'spirit' && s >= 2 && !(b.pillars || []).length) spiritPillars(b); if (b.k === 'spirit' && s === 3) spiritClones(b, 2); }
function bossCleanup(b) { for (const i of b.pillars || []) { const o = G.objs.get(i); if (o && o.t === 'icePillar') G.objs.delete(i); } b.pillars = []; if (G.enemies.some(e => e.k === 'spiritClone')) G.enemies = G.enemies.filter(e => e.k !== 'spiritClone'); lightDirty = true; }
// lava turtle: stage 2 sparks off every wall bounce, stage 3 erupts around you and then opens its shell
function emberBurst(b) { const p = G.p, base = Math.atan2(p.y - b.y, p.x - b.x); for (const da of [-.45, .45]) { const a = base + da + (rand() - .5) * .3; G.shots.push({ x: b.x, y: b.y - .3, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, life: 2.4, dmg: 12, k: 'fire' }); } }
function turtleErupt(b) { const p = G.p; G.hz = G.hz || []; for (let k = 0; k < 6; k++) { const a = rand() * 6.283, r = k ? 1.3 + rand() * 2.4 : 0, hx = p.x + Math.cos(a) * r, hy = p.y + Math.sin(a) * r; if (!isSolid(Math.floor(hx), Math.floor(hy))) G.hz.push({ x: hx, y: hy, r: 1.0, t: 0, warn: .9, life: 2.6, dmg: 18, k: 'lava' }); }
  emit('shake', .45); emit('sfx', 'brk'); emit('puff', b.x, b.y - .6, '#ff8a3d', 22, 4, .5); }
function spiritPillars(b) { b.pillars = []; const p = G.p; for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) { const x = SI.x + dx, y = SI.y + dy, i = idx(x, y); if (!inB(x, y) || G.wall[i] || G.objs.get(i) || (Math.floor(p.x) === x && Math.floor(p.y) === y)) continue; G.objs.set(i, { t: 'icePillar', hp: 4 }); b.pillars.push(i); emit('puff', x + .5, y + .5, '#d4f6ff', 10, 2.5, .4); } lightDirty = true; }
function spiritClones(b, n) { for (let k = 0; k < n; k++) { const e = mkEnemy('spiritClone', b.x + (k ? 2 : -2), b.y); e.z = .45; G.enemies.push(e); emit('puff', e.x, e.y - .5, '#d4f6ff', 10, 2.5); } }
function cloneTick(b, dt) { const cl = G.enemies.filter(e => e.k === 'spiritClone'); cl.forEach((e, i) => { const a = (b.anim || 0) * .9 + i * Math.PI + .8, tx = b.x + Math.cos(a) * 2.8, ty = b.y + Math.sin(a) * 1.8, k = Math.min(1, dt * 3); if (!boxHits(e.x + (tx - e.x) * k, e.y + (ty - e.y) * k, .3)) { e.x += (tx - e.x) * k; e.y += (ty - e.y) * k; } e.z = .45; e.anim = b.anim; }); return cl; }
function pillarBlocks(s, tx, ty) { const i = idx(tx, ty), o = G.objs.get(i); if (!o || o.t !== 'icePillar') return false; o.hp = (o.hp || 4) - 1; emit('puff', s.x, s.y, '#d4f6ff', 4, 1.6, .2); if (o.hp <= 0) { G.objs.delete(i); emit('puff', tx + .5, ty + .5, '#e8f8ff', 14, 3, .4); emit('sfx', 'brk'); lightDirty = true; } return true; }
