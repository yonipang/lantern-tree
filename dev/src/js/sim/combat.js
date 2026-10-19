// ================= 전투: 무기·휘두르기·쏘기, 스킬, 피해·상태 이상·몬스터 처치, 화살, 공격 버튼 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { ARROW_ORD } from '../data/circuits-regions.js';
import { UPG_DMG, UPG_POW } from '../data/gear-animals.js';
import { ITEMS, WALLS, WTYPE } from '../data/items.js';
import { BKEYS, BOSSES, ENEMY, SKILLS } from '../data/rpg-nature.js';
import { fxRand, rand } from '../engine/random.js';
import { G, paused, started } from '../save/state.js';
import { faceTo, nearestEnemy, targetTile } from './actions.js';
import { bossDot, hitBoss } from './bosses.js';
import { ctlOf, defineCmd } from './commands.js';
import { maybeNote } from './cooking.js';
import { rollDrops } from './drops.js';
import { emit } from './events.js';
import { breakWall, hitRecover, recoverTarget } from './gathering.js';
import { lvOf, rlvOf, rlvOk, wtOf } from './gear.js';
import { isBroken, selItem, wear } from './inventory.js';
import { atkSpd, gainXp, magicMul, maxHp, meleeMul, rangeMul, RS, skl, standUp } from './player.js';
import { onFrame } from './systems.js';
import { monDmg, onEnemyDie } from './monsters.js';
import { idx, inB, W } from '../world/map.js';
export function bestArrow() { for (const id of ARROW_ORD) { const k = G.inv.findIndex(s => s && s.id === id); if (k >= 0) return k; } return -1; }
export function takeArrow() { const k = bestArrow(); if (k < 0) return null; const s = G.inv[k], a = ITEMS[s.id].arw; s.c--; if (s.c <= 0) G.inv[k] = null; emit('inv'); G.stats.arrows = (G.stats.arrows || 0) + 1; return a; }
export function bestPick() { let b = { power: 0.5, tier: 0, id: 'hand' }; const h = selItem(); // v48: a pickaxe held is the one used (v65: from the tool slot)
  if (h && ITEMS[h.id] && ITEMS[h.id].kind === 'pick' && !isBroken(h) && (G.sel >= 0 || G.tHand)) return { ...ITEMS[h.id], id: h.id, slot: h, power: ITEMS[h.id].power * (1 + UPG_POW * lvOf(h)) };
  for (const s of G.inv.concat(G.tools || [])) { if (!s || ITEMS[s.id].kind !== 'pick' || isBroken(s)) continue; const pw = ITEMS[s.id].power * (1 + UPG_POW * lvOf(s)); if (pw > b.power) b = { ...ITEMS[s.id], id: s.id, slot: s, power: pw }; } return b; }
// v48: the weapon held in the hotbar is the weapon (there is no weapon slot any more); otherwise the fist
export const FIST = { n: '주먹', dmg: 3, id: 'hand', wt: 'fist' };
export const wpOf = s => { const it = ITEMS[s.id]; return { ...it, id: s.id, slot: s, dmg: it.dmg * (1 + UPG_DMG * lvOf(s)) }; }; // v43: each upgrade level adds 8% damage
export function curWeapon() { const s = selItem(), it = s && ITEMS[s.id]; if (it && it.kind === 'sword' && !isBroken(s) && rlvOk(s.id)) return wpOf(s); // v65: the attack button always has a weapon (v99: 착용 레벨이 모자란 무기는 빼고)
  const all = G.inv.filter(x => x && ITEMS[x.id] && ITEMS[x.id].kind === 'sword' && !isBroken(x) && rlvOk(x.id)); if (!all.length) return FIST;
  const last = G.lastW && all.find(x => x.id === G.lastW); if (last) return wpOf(last);
  let b = all[0]; for (const x of all) if (wpOf(x).dmg > wpOf(b).dmg) b = x; return wpOf(b); }
export const wRange = W => W.range * (W.ranged === 'arrow' ? 1 + skl('hawk') * .15 : 1); // v44 매의 눈
export const atkCd = () => { const W = wtOf(curWeapon()); return W.cd * atkSpd() * (W.ranged ? 1 : 1 - skl('warrior') * .03); };
export function swingAttack() {
  const p = G.p, w = curWeapon(), W = wtOf(w), aim = ctlOf(p).aim; if (aim) faceTo(aim.x - p.x, aim.y - (p.y - .45)); const ang = Math.atan2(p.face.y, p.face.x); G.fish = null;
  if (W.ranged) {
    if (W.mp && (p.mp || 0) < W.mp) { emit('toast', '기력이 부족해요. 잠깐 기다리면 다시 차요', null, 'nomp'); emit('sfx', 'clink'); return false; }
    if (W.mp) p.mp -= W.mp;
    const ar = W.ranged === 'arrow' ? takeArrow() : null; // mineral arrows from the bag, best first
    const crit = rand() < 0.1, dmg = Math.round(w.dmg * (ar ? ar.mul : 1) * (W.magic ? magicMul() : rangeMul()) * (crit ? 1.6 : 1) * (0.9 + rand() * 0.2));
    shootP(ang, { k: W.ranged, dmg, crit, spd: W.spd, range: wRange(W), pierce: W.magic ? 1 : ar ? ar.pierce : 0, col: w.orb || '#bff7ef', tip: ar ? ar.tip : null, slot: w.slot, kb: W.kb != null ? W.kb : W.magic ? 4 : 6, fx: w.fx || (ar && ar.fx) });
    G.swing = { t: 0.18, max: 0.18, ang, icon: w.id, wt: w.wt }; emit('sfx', 'swing'); return true;
  }
  const big = W.arc > 2, dur = big ? 0.3 : W === WTYPE.dagger ? 0.14 : 0.22;
  G.swing = { t: dur, max: dur, ang, icon: w.id === 'hand' ? null : w.id, wt: w.wt, arc: big ? 2 : 1.2, rad: big ? 1.2 : 0.95 };
  emit('sfx', 'swing'); if (big) emit('shake', 0.12);
  const hit = (e, rr) => { const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d > W.reach + rr) return false; let da = Math.abs(Math.atan2(dy, dx) - ang); if (da > Math.PI) da = 2 * Math.PI - da; return da < W.arc || d < 0.6 + rr; };
  const roll = () => { const crit = rand() < 0.1 + (W.crit || 0); return [Math.round(w.dmg * meleeMul() * (crit ? 1.6 : 1) * (0.9 + rand() * 0.2)), crit]; };
  let landed = false;
  for (const e of G.enemies.slice()) if (hit(e, ENEMY[e.k].r)) { const [dmg, crit] = roll(); hitEnemy(e, dmg, crit, W.kb, w.fx); landed = true; }
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && hit(b, BOSSES[k].hr)) { if (b.z > 0.7) emit('ftext', b.x, b.y - 2, '빗나감', '#bfaed3'); else { const [dmg, crit] = roll(); hitBoss(b, dmg, crit, w.fx); landed = true; } } }
  if (landed) wear(w.slot);
  return true;
}
export function shootP(ang, o) { const p = G.p; G.pshots.push(Object.assign({ x: p.x + Math.cos(ang) * .3, y: p.y + Math.sin(ang) * .3, vx: Math.cos(ang) * o.spd, vy: Math.sin(ang) * o.spd, life: o.range / o.spd, hit: [], ang }, o)); }
onFrame('pshots', dt => updatePShots(dt));
export function updatePShots(dt) {
  for (let i = G.pshots.length - 1; i >= 0; i--) {
    const s = G.pshots[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; const tx = Math.floor(s.x), ty = Math.floor(s.y);
    if (s.life <= 0 || !inB(tx, ty) || G.wall[idx(tx, ty)]) { emit('puff', s.x, s.y - .3, s.k === 'arrow' ? '#e8d8c0' : s.col, 4, 1.5, .2); G.pshots.splice(i, 1); continue; }
    let done = false;
    for (const e of G.enemies.slice()) { if (s.hit.includes(e)) continue; if (Math.hypot(e.x - s.x, e.y - s.y) < ENEMY[e.k].r + 0.28) { hitEnemy(e, s.dmg, s.crit, s.kb || 6, s.fx); s.hit.push(e); s.landed = true; if (!s.pierce) { done = true; break; } } }
    if (!done) for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st !== 'fight' || b.z > 0.7 || s.hit.includes(b)) continue; if (Math.hypot(b.x - s.x, b.y - s.y) < BOSSES[k].hr + 0.28) { hitBoss(b, s.dmg, s.crit, s.fx); s.hit.push(b); s.landed = true; if (!s.pierce) { done = true; break; } } }
    if (s.landed && s.slot && !s.worn) { wear(s.slot); s.worn = true; }
    if (done) G.pshots.splice(i, 1);
  }
}
// ---- active skills ----
defineCmd('skill', c => useSkill(c.n));
export function useSkill(n) {
  if (!G || paused || !started) return; const p = G.p; if (p.dead > 0 || p.sleep) return;
  const k = G.rpg.slot[n]; if (!k) { emit('open', 'stat'); return; }
  const S = SKILLS[k], l = skl(k); if (!l || (G.skcd[k] || 0) > 0) return;
  const cost = S.mp(l); if ((p.mp || 0) < cost) { emit('toast', '기력이 부족해요. 잠깐 기다리면 다시 차요', null, 'nomp'); emit('sfx', 'clink'); return; }
  if (p.sit) standUp();
  if (SK_FN[k](l) === false) return; p.mp -= cost; G.skcd[k] = S.cd(l);
}
export const SK_FN = {
  dash(l) { const p = G.p; let dx = p.face.x, dy = p.face.y; const st = ctlOf(p).stick; if (st) { dx = st.x; dy = st.y; } const L = Math.hypot(dx, dy) || 1, sp = 15 * (1 + (l - 1) * .15); p.dash = { t: .2, vx: dx / L * sp, vy: dy / L * sp }; p.inv = Math.max(p.inv, .4); emit('puff', p.x, p.y, '#e8d8c0', 8, 2, .1); emit('sfx', 'swing'); },
  spin(l) { const p = G.p, w = curWeapon(), mul = 1.3 + .3 * l; G.swing = { t: .3, max: .3, ang: Math.atan2(p.face.y, p.face.x), icon: w.id === 'hand' ? null : w.id, arc: Math.PI, rad: 1.35 }; emit('sfx', 'swing'); emit('shake', .15);
    const roll = () => { const crit = rand() < .1; return [Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1)), crit]; }; let landed = false;
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < 1.9 + ENEMY[e.k].r) { const [d, c] = roll(); hitEnemy(e, d, c, 12, w.fx); landed = true; }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < 1.9 + BOSSES[k].hr) { const [d, c] = roll(); hitBoss(b, d, c); landed = true; } }
    if (landed) wear(w.slot); },
  bolt(l) { const p = G.p, aim = ctlOf(p).aim; if (aim) faceTo(aim.x - p.x, aim.y - (p.y - .45)); else { const en = nearestEnemy(7); if (en) faceTo(en.x - p.x, en.y - p.y); } const ang = Math.atan2(p.face.y, p.face.x);
    shootP(ang, { k: 'orb', dmg: Math.round((10 + 6 * l) * magicMul()), crit: false, spd: 11, range: 8, pierce: 1, col: '#fff1b0', kb: 5 }); emit('sfx', 'cast2'); },
  quake(l) { const t = targetTile(), pk = bestPick(); let n = 0; if (inB(t.x, t.y) && !G.wall[idx(t.x, t.y)]) { const f = G.p.face; if (Math.abs(f.x) > Math.abs(f.y)) t.x += Math.sign(f.x); else t.y += f.y < 0 ? -1 : 1; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = t.x + dx, y = t.y + dy; if (!inB(x, y)) continue; const w = G.wall[idx(x, y)]; if (!w || w === 8 || WALLS[w].tier > pk.tier || Math.hypot(x + .5 - G.p.x, y + .5 - G.p.y) > 3.6) continue; breakWall(x, y); n++; }
    if (!n) { emit('toast', '부술 수 있는 벽이 없어요', null, 'noquake'); return false; }
    faceTo(t.x + .5 - G.p.x, t.y + .5 - G.p.y); G.swing = { t: .22, max: .22, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: pk.id === 'hand' ? null : pk.id }; emit('shake', .3); wear(pk.slot, n); },
  stomp(l) { const p = G.p, w = curWeapon(), mul = .7 + .2 * l, R = 2.5; emit('shake', .3); emit('sfx', 'brk');
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; emit('puff', p.x + Math.cos(a) * 1.6, p.y + Math.sin(a) * 1.1, '#c9b8a8', 2, 2, .15); }
    const roll = () => { const crit = rand() < .1; return [Math.max(1, Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1))), crit]; }; let landed = false;
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + ENEMY[e.k].r) { const [d, c] = roll(); hitEnemy(e, d, c, 18, 'slow'); landed = true; }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < R + BOSSES[k].hr) { const [d, c] = roll(); hitBoss(b, d, c, 'slow'); landed = true; } }
    if (landed) wear(w.slot); },
  volley(l) { const p = G.p, w = curWeapon(), W = wtOf(w); if (W.ranged !== 'arrow') { emit('toast', '화살비는 활을 들고 있어야 쓸 수 있어요', null, 'novolley'); return false; }
    const aim = ctlOf(p).aim; if (aim) faceTo(aim.x - p.x, aim.y - (p.y - .45)); else { const en = nearestEnemy(wRange(W)); if (en) faceTo(en.x - p.x, en.y - p.y); }
    const ang = Math.atan2(p.face.y, p.face.x), n = 3 + 2 * l, spread = .9;
    for (let k = 0; k < n; k++) { const a = ang + (k / (n - 1) - .5) * spread, crit = rand() < .1; shootP(a, { k: 'arrow', dmg: Math.max(1, Math.round(w.dmg * (.5 + .1 * l) * rangeMul() * (crit ? 1.6 : 1))), crit, spd: W.spd, range: wRange(W), pierce: 0, col: '#bff7ef', kb: 3, fx: w.fx }); }
    G.swing = { t: 0.18, max: 0.18, ang, icon: w.id, wt: w.wt }; emit('sfx', 'swing'); },
  frostRing(l) { const p = G.p, R = 3, dmg = Math.round((12 + 8 * l) * magicMul()); emit('sfx', 'cast2');
    for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283; emit('puff', p.x + Math.cos(a) * R * .9, p.y + Math.sin(a) * R * .7, k % 2 ? '#9fd8f0' : '#ffffff', 2, 1.5, .2); }
    for (const e of G.enemies.slice()) if (Math.hypot(e.x - p.x, e.y - p.y) < R + ENEMY[e.k].r) hitEnemy(e, dmg, false, 5, 'chill');
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - p.x, b.y - p.y) < R + BOSSES[k].hr) hitBoss(b, dmg, false, 'chill'); } },
  heal(l) { const p = G.p; if (p.hp >= maxHp()) { emit('toast', '체력이 이미 가득해요', null, 'fullhp'); return false; } const v = Math.round((20 + 12 * l) * (1 + RS('int') * .04)); p.hp = Math.min(maxHp(), p.hp + v); emit('hearts', p.x, p.y - .6, 6); emit('puff', p.x, p.y - .5, '#ffe9a8', 14, 2, .6); emit('ftext', p.x, p.y - 1.3, '♥ +' + v, '#ff8fa3'); emit('sfx', 'seed'); },
};
export function applyFx(e, fx, dmg, boss) {
  if (!fx) return;
  if (fx === 'poison') e.poison = { t: 4, dps: Math.max(2, dmg * .14) };
  else if (fx === 'burn') e.burn = { t: 3, dps: Math.max(3, dmg * .22) };
  else if (fx === 'slow' && !boss) e.slow = 2.5;
  else if (fx === 'chill' && !boss) { e.slow = 3.5; e.chill = 1; }
  else if (fx === 'split') { for (let k = 0; k < 3; k++) { const a = rand() * 6.283; G.pshots.push({ x: e.x, y: e.y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: .32, hit: [e], ang: a, k: 'orb', dmg: Math.max(1, Math.round(dmg * .45)), crit: false, col: '#d6c2ff', kb: 3, pierce: 0, spd: 9 }); } }
}
export function dotTick(e, dt, boss) {
  for (const [k, col] of [['poison', '#9be37a'], ['burn', '#ff9b4a']]) { const d = e[k]; if (!d) continue; d.t -= dt; d.acc = (d.acc || 0) + d.dps * dt * (boss ? .5 : 1);
    if (d.acc >= 1) { const n = Math.floor(d.acc); d.acc -= n; if (boss) bossDot(e, n, col); else dotHit(e, n, col); if (fxRand() < .5) emit('puff', e.x, e.y - .3, col, 2, 1, .3); }
    if (d.t <= 0) e[k] = null; }
  if (e.slow > 0) { e.slow -= dt; if (fxRand() < dt * 4) emit('puff', e.x, e.y - .2, e.chill ? '#d4f1ff' : '#b8f0a0', 1, .6, .3); if (e.slow <= 0) e.chill = 0; }
}
export function dotHit(e, n, col) { if (!G.enemies.includes(e)) return; e.hp -= n; emit('ftext', e.x, e.y - 0.8, n, col); if (e.hp <= 0) enemyDie(e); }
export function enemyDie(e) { const def = ENEMY[e.k]; const at = G.enemies.indexOf(e); if (at < 0) return; G.enemies.splice(at, 1); onEnemyDie(e); /* v101 */ emit('puff', e.x, e.y, def.col, 12, 3.2); rollDrops(def.drops, e.x, e.y); if (G.biome[idx(Math.floor(e.x), Math.floor(e.y))] <= 1) maybeNote('mon', e.x, e.y); G.stats.kills = (G.stats.kills || 0) + 1; if (e.zone != null && G.fzones && G.fzones[e.zone]) G.fzones[e.zone].dead.push(G.time + 45); gainXp(Math.max(2, Math.round(def.hp / 2)), e.x, e.y); }
export function hitEnemy(e, dmg, crit, kb = 8, fx) {
  const p = G.p, def = ENEMY[e.k]; p.fightAt = G.time; /* v77: 싸우는 중 → 머리 위 체력 막대 */ dmg = monDmg(e, dmg); /* v101 땅속·거북 등딱지 */ if (dmg <= 0) { emit('ftext', e.x, e.y - 0.8, '막힘', '#bfe6ff'); return; } e.hp -= dmg; e.hurt = 0.14; e.alertAt = G.time; /* v85: 맞으면 4초 동안 더 멀리서도 쫓아요 */ if (e.hp > 0 && fx !== 'split') applyFx(e, fx, dmg); if (def.calm) e.angry = 10; const dx = e.x - p.x, dy = e.y - p.y, l = Math.hypot(dx, dy) || 1;
  e.kx = dx / l * kb; e.ky = dy / l * kb; emit('ftext', e.x, e.y - 0.8, dmg + (crit ? '!' : ''), crit ? '#ffc861' : '#fff1d6'); emit('puff', e.x, e.y, def.col, 4, 2); emit('sfx', 'hit'); emit('shake', 0.12);
  if (fx === 'split') applyFx(e, fx, dmg);
  if (e.hp <= 0) enemyDie(e);
}
// ---- the attack button ----
onFrame('attack', dt => attackTick(dt));
export function attackTick(dt) { const p = G.p; G.atkT -= dt; G.atkQ = Math.max(0, G.atkQ - dt); if (p.dead > 0 || p.sleep) { G.atkQ = 0; return; } if ((G.atkQ > 0 || ctlOf(p).atk) && G.atkT <= 0) { G.atkQ = 0; doAttack(); } }
export function doAttack() {
  const p = G.p; if (p.dead > 0 || p.sleep) return; if (p.sit) standUp(); G.fish = null;
  { const h = selItem(); if (h && ITEMS[h.id] && ITEMS[h.id].kind === 'sword' && !rlvOk(h.id)) emit('toast', `${ITEMS[h.id].n}은(는) Lv.${rlvOf(h.id)}부터 들 수 있어요`, 'bad', 'rlv'); }
  const w = curWeapon(), WT = wtOf(w); if (w.id !== 'hand') G.lastW = w.id;
  let en = nearestEnemy(WT.ranged ? wRange(WT) : Math.max(WT.reach + .9, 2));
  if (en && WT.ranged && !los(Math.floor(p.x), Math.floor(p.y), Math.floor(en.x), Math.floor(en.y))) en = null;
  if (en && !ctlOf(p).aim) faceTo(en.x - p.x, en.y - p.y); // the nearest monster first
  if (!en && !nearestEnemy(4)) { const tg = recoverTarget(); if (tg) { hitRecover(tg, w); G.atkT = .32; return; } }
  G.atkT = swingAttack() === false ? .3 : atkCd();
}
export function los(x0, y0, x1, y1) { let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy, x = x0, y = y0; while (true) { if (x === x1 && y === y1) return true; if (!(x === x0 && y === y0) && G.wall[idx(x, y)]) return false; const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; } } }
