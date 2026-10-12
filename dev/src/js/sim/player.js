// ================= 플레이어: 능력치·스킬·경험치, 움직이기·배고픔·다치기·기절·깨어나기, 앉기·자기·먹기, 능력치·스킬·꾸미기 명령 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
// skill points earned by a level: one per level up, plus a bonus one at the top level (10 skills × 3 steps = 30)
const spDue = lv => lv - 1 + (lv >= MAX_LV ? 1 : 0);
const freshRpg = () => ({ lv: 1, xp: 0, pts: 0, sp: 0, str: 0, dex: 0, vit: 0, int: 0, sk: {}, slot: [null, null] });
function cleanRpg(r) {
  const f = freshRpg(); if (!r || typeof r !== 'object') return f;
  for (const k of ['lv', 'xp', 'pts', 'sp', 'str', 'dex', 'vit', 'int']) f[k] = Math.max(0, Math.floor(+r[k] || 0)); f.lv = clamp(f.lv || 1, 1, MAX_LV);
  if (r.sk && typeof r.sk === 'object') for (const k in r.sk) if (SKILLS[k]) { const l = clamp(Math.floor(+r.sk[k] || 0), 0, SKILLS[k].max); if (l) f.sk[k] = l; }
  const spent = Object.values(f.sk).reduce((a, l) => a + l, 0), due = spDue(f.lv); if (spent + f.sp < due) f.sp = due - spent; // older saves at the top level never got the bonus point
  if (Array.isArray(r.slot)) f.slot = [0, 1].map(i => { const k = r.slot[i]; return SKILLS[k] && SKILLS[k].act && f.sk[k] ? k : null; });
  return f;
}
const skl = k => (G && G.rpg && G.rpg.sk[k]) || 0;
const RS = k => (G && G.rpg ? G.rpg[k] : 0);
const maxHp = () => 100 + RS('vit') * 8 + bval('maxhp');
const maxMp = () => 40 + RS('int') * 6 + skl('arcane') * 8;
const meleeMul = () => (1 + RS('str') * 0.05) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('warrior') * .06);
const rangeMul = () => (1 + RS('dex') * 0.03) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('hawk') * .08);
const magicMul = () => (1 + RS('int') * 0.035) * (1 + bval('atk')) * (1 + ringV('atk')) * (1 + skl('arcane') * .06);
const atkSpd = () => (1 - Math.min(0.2, RS('dex') * 0.01)) * (envLv('cold') >= 2 ? 1.1 : 1);
const moveMul = () => (1 + Math.min(0.15, RS('dex') * 0.01) + skl('swift') * 0.06) * (1 + bval('move')) * [1, .9, .8, .8][envLv('cold')];
const mineMul = () => (1 + RS('str') * 0.03) * (1 + skl('miner') * 0.25) * (1 + bval('mine')) * (1 + ringV('mine'));
const hungerMul = () => Math.max(0.4, (1 - Math.min(0.3, RS('vit') * 0.02)) * (1 - skl('gourmet') * 0.15)) * (bval('hunger') || 1) * [1, 1.3, 1.6, 1.6][envLv('hot')];
function gainXp(n, x, y) {
  const R = G && G.rpg; if (!R || !(n > 0) || R.lv >= MAX_LV) return; n = Math.max(n, Math.round(n * (1 + bval('xp') + ringV('xp')))); R.xp += n;
  if (x != null && n >= 3) emit('ftext', x, y - 0.9, `+${n} 경험치`, '#b8e0ff');
  let up = 0; while (R.lv < MAX_LV && R.xp >= XP_NEED(R.lv)) { R.xp -= XP_NEED(R.lv); R.lv++; R.pts += 2; R.sp += 1; up++; }
  if (R.lv >= MAX_LV) { R.xp = 0; if (up) R.sp += 1; } // reaching the top level gives one more skill point (since v44 there are more skills than points: 스킬 다시 배우기 is free)
  if (up) { const p = G.p; p.hp = maxHp(); p.mp = maxMp(); emit('puff', p.x, p.y - .5, '#ffe9a8', 26, 3.5, .8); emit('ftext', p.x, p.y - 1.6, `Lv.${R.lv}!`, '#ffd25c'); emit('sfx', 'seed'); emit('toast', R.lv >= MAX_LV ? `최고 레벨 Lv.${R.lv}! 보너스 스킬 포인트 +1 · [능력]에서 올려요` : `레벨 업! Lv.${R.lv} · [능력]에서 능력치와 스킬을 올려요`, 'good'); emit('refresh', 'stat'); }
}
defineCmd('statUp', c => { const R = G.rpg, i = c.s; if (R.pts > 0 && STATN[i]) { R[i]++; R.pts--; if (i === 'vit') G.p.hp = Math.min(maxHp(), G.p.hp + 8); emit('sfx', 'click'); } });
defineCmd('statReset', () => { const R = G.rpg; R.pts += R.str + R.dex + R.vit + R.int; R.str = R.dex = R.vit = R.int = 0; G.p.hp = Math.min(G.p.hp, maxHp()); G.p.mp = Math.min(G.p.mp, maxMp()); emit('sfx', 'craft'); emit('toast', '능력치 포인트를 모두 돌려받았어요'); });
defineCmd('skUp', c => { const R = G.rpg, i = c.s, S = SKILLS[i]; if (!S) return false; const l = R.sk[i] || 0; if (R.sp <= 0 || R.lv < S.lv || l >= S.max) return false; R.sk[i] = l + 1; R.sp--; if (S.act && !l && !R.slot.includes(i)) { const e = R.slot.indexOf(null); if (e >= 0) R.slot[e] = i; } emit('sfx', 'craft'); emit('toast', l ? `${S.n} ${l + 1}단계로 올렸어요` : `${S.n}을(를) 배웠어요!`, 'good'); });
defineCmd('skReset', () => { const R = G.rpg; R.sp += Object.values(R.sk).reduce((a2, l) => a2 + l, 0); R.sk = {}; R.slot = [null, null]; G.p.mp = Math.min(G.p.mp, maxMp()); emit('sfx', 'click'); emit('toast', '스킬 포인트를 모두 돌려받았어요', 'good', 'skreset'); });
defineCmd('skSlot', c => { const id = c.s, R = G.rpg, m = c.n; if (!R.sk[id]) return false; if (R.slot[m] === id) R.slot[m] = null; else { const o = R.slot.indexOf(id); if (o >= 0) R.slot[o] = R.slot[m]; R.slot[m] = id; } emit('sfx', 'click'); });
// ---- 꾸미기·캐릭터·긴급 탈출·지도 표시(개발자) ----
defineCmd('look', c => { G.look = cleanLook(c.look); CHARS.custom = lookDef(G.look); G.char = 'custom'; G.outfit = 0; buildPlayer(0); emit('puff', G.p.x, G.p.y - .5, CHARS.custom.pal[0], 16, 2.6, .6); emit('sfx', 'craft'); emit('toast', '새 모습으로 꾸몄어요', 'good'); });
defineCmd('char', c => { const i = c.c; if (!(CHARS[i] && G.char !== i)) return false; G.char = i; G.outfit = 0; buildPlayer(0); emit('puff', G.p.x, G.p.y - .5, CHARS[i].pal[0], 14, 2.5, .6); emit('sfx', 'craft'); emit('toast', `${roJosa(CHARS[i].n)} 바꿨어요`, 'good'); return true; });
function standUp() { const p = G.p, s = p.sit; if (!s) return; p.sit = null; p.x = s.px; p.y = s.py; if (boxHits(p.x, p.y, .28)) { p.x = s.x + .5; p.y = s.y + 1.5; } }
function sleepIn(t) { const p = G.p; G.fish = null; p.sleep = { t: 2.6, x: t.x, y: t.y }; p.inv = 4; emit('fade', 'sleep'); emit('sfx', 'sleep'); }
function wakeUp() { const p = G.p, s = p.sleep; p.sleep = null; emit('fade', 'wake'); p.hp = maxHp(); p.hunger = Math.max(0, p.hunger - 6); G.spawnPt = { x: s.x, y: s.y }; G.enemies = G.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) > 12); emit('toast', '푹 잤어요! 체력이 가득 찼고, 여기서 다시 깨어나요', 'good'); }
function eat(slot) {
  const s = G.inv[slot]; if (!s) return; const it = ITEMS[s.id]; if (it.kind !== 'food') return;
  const p = G.p; if (p.hunger >= 99.5 && p.hp >= maxHp() && !it.buff) { emit('toast', '지금은 배가 불러요', null, 'full'); return; }
  const bc = it.buff ? buffCheck(it, s.id) : null; if (bc === 'ask') return;
  const gm = 1 + skl('gourmet') * 0.1, fd = Math.round(it.food * gm), hl = Math.round((it.heal || 0) * gm);
  p.hunger = Math.min(100, p.hunger + fd); p.hp = Math.min(maxHp(), p.hp + hl); s.c--; if (!s.c) { G.inv[slot] = null; refillHot(slot, s.id); } invDirty = true;
  emit('sfx', 'eat'); emit('ftext', p.x, p.y - 1.3, `+${fd}`, '#ffb15c'); if (hl) emit('ftext', p.x + .4, p.y - 1.0, `♥${hl}`, '#ff8fa3');
  if (bc === 'ok') applyBuff(it, s.id);
}
function hurtPlayer(dmg, sx, sy, kind) {
  if (kind === 'fire' && wearing('turtleCharm')) dmg *= 1 - turtleCut(eqLv('turtleCharm'));
  dmg *= 1 - ringV('def');
  const p = G.p; if (p.inv > 0 || p.dead > 0 || p.sleep) return; if (p.sit) standUp(); dmg = Math.max(1, Math.round(dmg * (1 - skl('tough') * 0.07) * (1 - bval('def'))));
  p.hp -= dmg; p.inv = 0.75; p.hurt = 0.18; const dx = p.x - sx, dy = p.y - sy, l = Math.hypot(dx, dy) || 1; p.kx = dx / l * 9; p.ky = dy / l * 9;
  emit('shake', 0.28); emit('sfx', 'hurt'); emit('ftext', p.x, p.y - 1.2, '-' + dmg, '#ff7a8a');
  if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; G.fish = null; emit('fade', 'faint'); }
}
function respawn() {
  const p = G.p; emit('fade', 'hide'); const lostN = dropLost(); G.recall = null;
  const so = G.spawnPt && G.objs.get(idx(G.spawnPt.x, G.spawnPt.y)); const sp = so && OBJ[so.t].bed ? G.spawnPt : null;
  if (sp) { p.x = sp.x + .5; p.y = sp.y + 1.6; if (boxHits(p.x, p.y, .28)) { p.x = sp.x + 1.5; p.y = sp.y + .5; } } else { p.x = CX + .5; p.y = CY + 1.7; }
  p.hp = Math.round(maxHp() * .7); p.mp = maxMp(); p.dash = null; p.hunger = Math.max(p.hunger, 45); p.inv = 2; p.dead = 0; G.pshots.length = 0; G.fish = null;
  if (alivePlayers().length <= 1) { G.enemies.length = 0; for (const k of BKEYS) if (!G.bossDead[k]) G.bosses[k] = freshBoss(k); G.shots.length = 0; G.hz = []; } // 혼자일 때만 세계를 가라앉혀요 (8단계)
  emit('bossbar', false);
  cam.x = p.x; cam.y = p.y; emit('toast', sp ? '침대에서 깨어났어요' : '등불나무 곁에서 깨어났어요'); unstick(p, '사방이 막혀 있어서 바로 바깥에서 깨어났어요'); if (lostN) setTimeout(() => emit('toast', `쓰러진 자리에 재료 ${lostN}개를 떨어뜨렸어요 · 지도에 꾸러미가 표시돼요`, 'warn', 'lostdrop'), 1200);
}
onFrame('player', dt => {
  const p = G.p;
  const ctl = ctlOf(p); let mx = ctl.mx, my = ctl.my;
  let mag = Math.hypot(mx, my); if (mag > 1) { mx /= mag; my /= mag; mag = 1; }
  if (p.dead > 0) { p.dead -= dt; mag = 0; if (p.dead <= 0) respawn(); }
  if (p.sleep) { p.sleep.t -= dt; mag = 0; if (p.sleep.t <= 0) wakeUp(); }
  if (p.sit) { if (mag > 0.3) standUp(); else { mag = 0; p.sitT = (p.sitT || 0) + dt; if (p.sitT > 0.8) { p.sitT = 0; if (p.hp < maxHp()) p.hp = Math.min(maxHp(), p.hp + 1); } } }
  p.moving = mag > 0.12;
  p.slowT = Math.max(0, (p.slowT || 0) - dt);
  if (p.moving) { const sp = 4.4 * moveMul() * Math.max(0.5, mag) * (p.slowT > 0 ? .55 : 1); moveEnt(p, mx * sp * dt, my * sp * dt, 0.28); p.anim += dt; if (!ctl.aim) p.face = { x: mx / mag, y: my / mag }; }
  if (ctl.aim && p.dead <= 0 && !p.sit && !p.sleep) faceTo(ctl.aim.x - p.x, ctl.aim.y - (p.y - .4));
  const f = p.face; if (Math.abs(f.x) > Math.abs(f.y) * 1.05) { p.dir = 'side'; p.flip = f.x < 0; } else p.dir = f.y < 0 ? 'up' : 'down';
  if (Math.abs(p.kx) + Math.abs(p.ky) > 0.05) { moveEnt(p, p.kx * dt, p.ky * dt, 0.28); const k = Math.pow(0.0015, dt); p.kx *= k; p.ky *= k; } else p.kx = p.ky = 0;
  p.inv = Math.max(0, p.inv - dt); p.hurt = Math.max(0, p.hurt - dt);
  if (p.dash) { moveEnt(p, p.dash.vx * dt, p.dash.vy * dt, 0.28); p.dash.t -= dt; if (fxRand() < .5) emit('puff', p.x, p.y, '#e8d8c0', 1, 1, .05); if (p.dash.t <= 0) p.dash = null; }
  p.mp = Math.min(maxMp(), (p.mp == null ? maxMp() : p.mp) + (2.5 + RS('int') * 0.25) * (1 + ringV('mp')) * dt); for (const k in G.skcd) if (G.skcd[k] > 0) G.skcd[k] -= dt;
});
onFrame('hunger', dt => {
  const p = G.p;
  G.hungerT += dt; if (G.hungerT >= 9 / hungerMul()) { G.hungerT = 0; p.hunger = Math.max(0, p.hunger - 1); if (p.hunger === 20) emit('toast', '배가 고파요. 무언가 먹어요', null, 'hungry'); }
  G.regenT += dt; if (G.regenT >= 2.5) { G.regenT = 0; if (p.hunger <= 0 && p.dead <= 0) { p.hp -= 2; emit('ftext', p.x, p.y - 1.2, '-2', '#ffb15c'); if (p.hp <= 0) { p.hp = 0; p.dead = 1.8; emit('fade', 'show'); } } else if (p.hunger >= 55 && p.hp < maxHp() && p.dead <= 0 && envLv('hot') < 2) p.hp = Math.min(maxHp(), p.hp + 1); }
});
