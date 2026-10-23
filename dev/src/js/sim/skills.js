// ================= v102 새 스킬 동작 (data/growth.js의 SKILLS 추가분, sim/combat.js의 SK_FN에 덧붙여요) =================
// 항상 효과(패시브)는 각 규칙 파일에서 skl('이름')으로 봐요: parry·vital·longArm·heavyHand(sim/combat.js) · leech·secondWind·sprint(sim/player.js) · farmer(sim/nature.js) · fisher(sim/fishing.js) · chef(sim/cooking.js) · porter(sim/inventory.js) · animalFriend(sim/drops.js·loop.js·cooking.js)
import { BKEYS, BOSSES, ENEMY } from '../data/rpg-nature.js';
import { rand } from '../engine/random.js';
import { G } from '../save/state.js';
import { faceTo, nearestEnemy } from './actions.js';
import { hitBoss } from './bosses.js';
import { ctlOf } from './commands.js';
import { curWeapon, hitEnemy, SK_FN, shootP, wRange } from './combat.js';
import { emit } from './events.js';
import { wtOf } from './gear.js';
import { wear } from './inventory.js';
import { magicMul, maxHp, meleeMul, rangeMul } from './player.js';
import { onFrame } from './systems.js';
import { moveSlide } from '../world/tiles.js';
const WTN = { sword: '검', dagger: '단검', spear: '창', hammer: '망치', bow: '활' };
function needWt(wt) { const w = curWeapon(); if (w.wt !== wt) { emit('toast', `${WTN[wt]}을(를) 들고 있어야 쓸 수 있어요`, null, 'needwt'); return null; } return w; }
const aimAt = (range) => { const p = G.p, aim = ctlOf(p).aim; if (aim) faceTo(aim.x - p.x, aim.y - (p.y - .45)); else { const en = nearestEnemy(range); if (en) faceTo(en.x - p.x, en.y - p.y); } return Math.atan2(p.face.y, p.face.x); };
const meleeRoll = (w, mul, critP = .1) => { const crit = rand() < critP; return [Math.max(1, Math.round(w.dmg * (wtOf(w).magic ? magicMul() : meleeMul()) * mul * (crit ? 1.6 : 1))), crit]; };
// 둘레 R칸의 적·보스 모두 때리기 → 맞힌 수
function hitAround(x, y, R, dmgFn, kb, fx, stun) { let n = 0;
  for (const e of G.enemies.slice()) if (Math.hypot(e.x - x, e.y - y) < R + ENEMY[e.k].r) { const [d, c] = dmgFn(); hitEnemy(e, d, c, kb, fx); if (stun) e.stun = Math.max(e.stun || 0, stun); n++; }
  for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && Math.hypot(b.x - x, b.y - y) < R + BOSSES[k].hr) { const [d, c] = dmgFn(); hitBoss(b, d, c, fx); n++; } }
  return n; }
// 앞으로 돌진하며 지나는 적 때리기 (돌진 베기·꿰뚫기 돌진)
function dashHit(w, dist, mul, kb) { const p = G.p, ang = aimAt(dist + 1), ux = Math.cos(ang), uy = Math.sin(ang), hitList = new Set(); let moved = 0;
  for (let s = 0; s < dist; s += .25) { const x0 = p.x, y0 = p.y; moveSlide(p, ux * .25, uy * .25, .28); const mv = Math.hypot(p.x - x0, p.y - y0); moved += mv; if (mv < .05) break;
    for (const e of G.enemies.slice()) if (!hitList.has(e) && Math.hypot(e.x - p.x, e.y - p.y) < .8 + ENEMY[e.k].r) { hitList.add(e); const [d, c] = meleeRoll(w, mul); hitEnemy(e, d, c, kb, w.fx); }
    for (const k of BKEYS) { if (G.bossDead[k]) continue; const b = G.bosses[k]; if (b.st === 'fight' && b.z <= .7 && !hitList.has(b) && Math.hypot(b.x - p.x, b.y - p.y) < .8 + BOSSES[k].hr) { hitList.add(b); const [d, c] = meleeRoll(w, mul); hitBoss(b, d, c, w.fx); } } }
  p.inv = Math.max(p.inv, .3); G.swing = { t: .22, max: .22, ang, icon: w.id, wt: w.wt }; emit('puff', p.x, p.y, '#e8d8c0', 10, 2.4, .1); emit('sfx', 'swing'); if (hitList.size) wear(w.slot); return moved; }
Object.assign(SK_FN, {
  lunge(l) { const w = needWt('sword'); if (!w) return false; dashHit(w, 2.5, 1.2 + .3 * l, 10); },
  shadowStep(l) { const w = needWt('dagger'); if (!w) return false; const p = G.p, en = nearestEnemy(6); if (!en) { emit('toast', '가까운 적이 없어요', null, 'noen'); return false; }
    const dx = en.x - p.x, dy = en.y - p.y, d = Math.hypot(dx, dy) || 1; const nx = en.x + dx / d * .9, ny = en.y + dy / d * .9; emit('puff', p.x, p.y, '#4a3f5c', 10, 2.5, .2);
    p.x = nx; p.y = ny; moveSlide(p, 0, 0, .28); faceTo(-dx, -dy); emit('puff', p.x, p.y, '#4a3f5c', 10, 2.5, .2); const [dm] = meleeRoll(w, 1.5 + .4 * l, 1); hitEnemy(en, dm, true, 6, w.fx); wear(w.slot);
    G.swing = { t: .14, max: .14, ang: Math.atan2(p.face.y, p.face.x), icon: w.id, wt: w.wt }; emit('sfx', 'swing'); p.inv = Math.max(p.inv, .25); },
  pierceDash(l) { const w = needWt('spear'); if (!w) return false; dashHit(w, 4, 1.3 + .3 * l, 6); },
  earthquake(l) { const w = needWt('hammer'); if (!w) return false; const p = G.p; emit('shake', .45); emit('sfx', 'brk');
    for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283; emit('puff', p.x + Math.cos(a) * 2.4, p.y + Math.sin(a) * 1.6, '#c9b8a8', 2, 2.2, .2); }
    if (hitAround(p.x, p.y, 3.5, () => meleeRoll(w, 1.5 + .4 * l), 14, w.fx, 1)) wear(w.slot); G.swing = { t: .3, max: .3, ang: Math.atan2(p.face.y, p.face.x), icon: w.id, wt: w.wt, arc: Math.PI, rad: 1.3 }; },
  pierceArrow(l) { const w = needWt('bow'); if (!w) return false; const WT = wtOf(w), ang = aimAt(wRange(WT)), crit = rand() < .1;
    shootP(ang, { k: 'arrow', dmg: Math.max(1, Math.round(w.dmg * (1.8 + .4 * l) * rangeMul() * (crit ? 1.6 : 1))), crit, spd: WT.spd * 1.3, range: wRange(WT) * 1.2, pierce: 3, col: '#fff1b0', kb: 4, fx: w.fx, slot: w.slot });
    G.swing = { t: 0.18, max: 0.18, ang, icon: w.id, wt: w.wt }; emit('sfx', 'swing'); },
  trapArrow(l) { const w = needWt('bow'); if (!w) return false; const en = nearestEnemy(wRange(wtOf(w))); if (!en) { emit('toast', '사거리 안에 적이 없어요', null, 'noen'); return false; }
    faceTo(en.x - G.p.x, en.y - G.p.y); let n = 0; for (const e of G.enemies) if (Math.hypot(e.x - en.x, e.y - en.y) < 2 + ENEMY[e.k].r) { e.slow = Math.max(e.slow || 0, 3 + l); n++; }
    for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; emit('puff', en.x + Math.cos(a) * 1.6, en.y + Math.sin(a) * 1.1, '#e8e4f8', 2, 1.8, .3); }
    G.swing = { t: 0.18, max: 0.18, ang: Math.atan2(G.p.face.y, G.p.face.x), icon: w.id, wt: w.wt }; emit('sfx', 'swing'); emit('ftext', en.x, en.y - 1.2, '끈적!', '#e8e4f8'); },
  fireball(l) { const ang = aimAt(7); shootP(ang, { k: 'orb', dmg: Math.round((14 + 8 * l) * magicMul()), crit: false, spd: 9, range: 8, pierce: 0, col: '#ff8a3d', kb: 6, fx: 'burn', look: 'fire' }); /* v136 불덩이 그림 */ emit('sfx', 'cast'); },
  chain(l) { const p = G.p, dmg = Math.round((16 + 8 * l) * magicMul()); let cur = nearestEnemy(6); if (!cur) { emit('toast', '가까운 적이 없어요', null, 'noen'); return false; }
    const hitSet = new Set(); let from = { x: p.x, y: p.y - .4 };
    for (let n = 0; n < 3 + l && cur; n++) { hitSet.add(cur); for (let k = 1; k <= 5; k++) emit('puff', from.x + (cur.x - from.x) * k / 5, from.y + (cur.y - .3 - from.y) * k / 5, '#fff1b0', 1, 1.2, .15); emit('fxAnim', 'ring', cur.x, cur.y - .3); /* v136 번개 고리 */ hitEnemy(cur, dmg, false, 4); from = { x: cur.x, y: cur.y - .3 };
      let best = null, bd = 3; for (const e of G.enemies) if (!hitSet.has(e)) { const d = Math.hypot(e.x - cur.x, e.y - cur.y); if (d < bd) { bd = d; best = e; } } cur = best; }
    emit('sfx', 'cast'); emit('shake', .15); },
  lightShield(l) { const p = G.p; p.shield = 30 + 15 * l; p.shieldT = 8; emit('fxAnim', 'shield', p.x, p.y); /* v136 방패 그림 */ emit('puff', p.x, p.y - .5, '#fff1b0', 16, 2.6, .5); emit('ftext', p.x, p.y - 1.4, `방패 ${p.shield}`, '#fff1b0'); emit('sfx', 'cast'); },
  orbFriend(l) { const p = G.p; p.orb = { t: 12 + 4 * l, cd: 0, dmg: 8 + 4 * l }; emit('puff', p.x - .6, p.y - .9, '#fff1b0', 10, 2, .5); emit('sfx', 'cast'); },
  sprint(l) { const p = G.p; p.sprintT = 4 + l; emit('puff', p.x, p.y, '#e8d8c0', 8, 2, .2); emit('sfx', 'swing'); },
  dawnLight(l) { const p = G.p, dmg = Math.round((40 + 20 * l) * magicMul()); emit('sfx', 'cast'); emit('shake', .3);
    for (let k = 0; k < 36; k++) { const a = k / 36 * 6.283; emit('puff', p.x + Math.cos(a) * 3.6, p.y + Math.sin(a) * 2.6, k % 2 ? '#fff1b0' : '#ffffff', 2, 2, .3); }
    hitAround(p.x, p.y, 4, () => [dmg, false], 8, null); for (const e of G.enemies) if (ENEMY[e.k].shadow && Math.hypot(e.x - p.x, e.y - p.y) < 4 + ENEMY[e.k].r) hitEnemy(e, dmg, false, 0); /* 그림자 몬스터는 2배 (아직 없음) */ },
  starRain(l) { const en = nearestEnemy(8); if (!en) { emit('toast', '가까운 적이 없어요', null, 'noen'); return false; } const n = 8 + 4 * l, dmg = Math.round((12 + 6 * l) * magicMul()), cx = en.x, cy = en.y;
    faceTo(cx - G.p.x, cy - G.p.y); emit('sfx', 'cast');
    for (let k = 0; k < n; k++) { const a = rand() * 6.283, r = rand() * 3.5, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; emit('puff', x, y - 1.2, '#fff1b0', 4, 2, .5); hitAround(x, y, .9, () => [dmg, false], 3, null); } },
  awaken(l) { const p = G.p; p.awakeT = 8 + 2 * l; emit('puff', p.x, p.y - .5, '#ffe9a8', 24, 3.5, .8); emit('ftext', p.x, p.y - 1.6, '각성!', '#ffd25c'); emit('sfx', 'seed'); },
  earthSplit(l) { const w = curWeapon(), p = G.p, ang = aimAt(6), ux = Math.cos(ang), uy = Math.sin(ang); emit('shake', .5); emit('sfx', 'brk'); let n = 0;
    for (let s = 1; s <= 6; s += .5) { const x = p.x + ux * s, y = p.y + uy * s; if (s % 1 === 0) emit('puff', x, y, '#c9b8a8', 4, 2.4, .25); n += hitAround(x, y, .7, () => meleeRoll(w, 2 + .5 * l), 10, w.fx, 1); }
    G.swing = { t: .3, max: .3, ang, icon: w.id === 'hand' ? null : w.id, wt: w.wt }; if (n && w.slot) wear(w.slot); },
});
// 매 프레임: 빛 구슬 친구 · 빛 방패 시간 · 각성(쿨다운 2배) · 질주
onFrame('skills102', dt => { const p = G.p; if (!p) return;
  if (p.shieldT > 0) { p.shieldT -= dt; if (p.shieldT <= 0) p.shield = 0; }
  if (p.sprintT > 0) p.sprintT -= dt;
  if (p.awakeT > 0) { p.awakeT -= dt; for (const k in G.skcd) if (G.skcd[k] > 0) G.skcd[k] -= dt; }
  const o = p.orb; if (o) { o.t -= dt; o.cd -= dt; if (o.t <= 0) { p.orb = null; return; } if (fxTick(dt)) emit('puff', p.x - .6, p.y - .9, '#fff1b0', 1, .8, .3);
    if (o.cd <= 0) { const en = nearestEnemy(6); if (en) { o.cd = .8; const ang = Math.atan2(en.y - (p.y - .4), en.x - p.x); G.pshots.push({ x: p.x - .6, y: p.y - .9, vx: Math.cos(ang) * 10, vy: Math.sin(ang) * 10, life: .8, hit: [], ang, k: 'orb', dmg: Math.round(o.dmg * magicMul()), crit: false, col: '#fff1b0', kb: 3, pierce: 0, spd: 10 }); } } }
});
let fxAcc = 0; const fxTick = dt => { fxAcc += dt; if (fxAcc > .12) { fxAcc = 0; return true; } return false; };
export const skills102 = true;
