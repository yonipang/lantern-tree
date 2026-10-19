// ================= v101 새 몬스터 움직임 (data/growth.js의 ENEMY ai 이름별) =================
// sim/enemies.js enemyStep이 몬스터마다 부르고, true를 돌려주면 그 장의 기본 움직임(뛰기·걷기)을 건너뛰어요. 밀려나기·닿으면 다침은 그대로.
// 탄은 보스와 같은 G.shots, 위험 지대는 G.hz(보스 것과 같이 sim/bosses.js가 움직이고 그려요). 무작위는 rand().
import { ENEMY } from '../data/rpg-nature.js';
import { G, alivePlayers, withPlayer } from '../save/state.js';
import { emit } from './events.js';
import { hurtPlayer } from './player.js';
import { moveEnt } from '../world/tiles.js';
const dmgOf = (e, def, k = 1) => Math.round(def.dmg * (e.dm || 1) * k);
const hz = h => { G.hz = G.hz || []; G.hz.push(Object.assign({ t: 0 }, h)); };
const shoot = (e, dx, dy, d, spd, k, dmg, extra) => G.shots.push(Object.assign({ x: e.x, y: e.y - .3, vx: dx / d * spd, vy: dy / d * spd, life: 2.6, dmg, k }, extra || {}));
const tick = (e, k, dt) => { e[k] = (e[k] || 0) - dt; return e[k]; };
export const MON_AI = {
  // 이끼 두더지: 쫓을 때 땅속으로 숨어(안 맞음) 빠르게 다가왔다가 튀어나와요
  burrow(e, def, dt, d, dx, dy, chase, sm) {
    if (!chase) { if (e.under) { e.under = false; emit('puff', e.x, e.y, '#8a6a52', 6, 2); } return false; }
    const t = tick(e, 'bt', dt);
    if (!e.under && t <= 0 && d > 1.6) { e.under = true; e.bt = 1.6; emit('puff', e.x, e.y, '#8a6a52', 6, 2); return true; }
    if (e.under) { if (t <= 0 || d < 1.1) { e.under = false; e.bt = 1.4; emit('puff', e.x, e.y, '#8a6a52', 10, 2.6); emit('sfx', 'mine'); return false; }
      moveEnt(e, dx / d * def.spd * 1.5 * dt * sm, dy / d * def.spd * 1.5 * dt * sm, def.r); return true; }
    return false; },
  // 뿌리 덩굴: 움직이지 않고, 가까이 오면 0.45초 뒤 휘둘러요
  lash(e, def, dt, d) { const p = G.p; tick(e, 'cd', dt);
    if (e.wind > 0) { e.wind -= dt; e.flash = 1; if (e.wind <= 0) { e.flash = 0; e.cd = 1.2; emit('puff', e.x, e.y - .3, '#9be37a', 8, 2.4); emit('sfx', 'swing'); if (d < def.reach + .2 && p.dead <= 0) hurtPlayer(dmgOf(e, def), e.x, e.y); } }
    else if (d < def.reach && p.dead <= 0 && e.cd <= 0) e.wind = .45;
    return true; },
  // 포자 버섯: 쓰러지면 독 구름 (onEnemyDie)
  spore() { return false; },
  // 버섯 거북: 천천히 돌아서 앞쪽에서 때리면 피해가 적어요 (hitEnemy → shellCut)
  shell(e, def, dt, d, dx, dy, chase) { const want = Math.atan2(dy, dx); if (e.fa == null) e.fa = want;
    if (chase) { let da = want - e.fa; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; e.fa += Math.max(-1.6 * dt, Math.min(1.6 * dt, da)); e.flip = Math.cos(e.fa) < 0; }
    return false; },
  // 독 개구리: 멀리 뛰고, 내 가까이 내려앉으면 독 웅덩이
  toad(e, def, dt, d, dx, dy, chase) { if (e.wasAir && !(e.air > 0) && chase && d < 2.6) hz({ x: e.x, y: e.y, r: .8, warn: .2, life: 2.2, dmg: dmgOf(e, def, .5), k: 'poison' }); e.wasAir = e.air > 0; return false; },
  // 수정 거미: 끈적한 거미줄을 쏴서 느리게 해요
  web(e, def, dt, d, dx, dy, chase) { if (tick(e, 'cd', dt) <= 0 && chase && e.sees && d < 6) { e.cd = 2.6; shoot(e, dx, dy, d, 6, 'web', dmgOf(e, def, .5), { slow: 2 }); emit('sfx', 'cast'); } return false; },
  // 거울 수정: 멈춰서 0.7초 모았다가 빛줄기(빠른 파편 5개가 한 줄로)
  beam(e, def, dt, d, dx, dy, chase) { tick(e, 'cd', dt);
    if (e.wind > 0) { e.wind -= dt; e.flash = 1; if (e.wind <= 0) { e.flash = 0; const a = e.aimA; for (let k = 0; k < 5; k++) G.shots.push({ x: e.x - Math.cos(a) * k * .35, y: e.y - .3 - Math.sin(a) * k * .35, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, life: 1.4, dmg: dmgOf(e, def), k: 'shard', a }); emit('sfx', 'clink'); } return true; }
    if (chase && e.sees && d < 7 && e.cd <= 0) { e.cd = 3.2; e.wind = .7; e.aimA = Math.atan2(dy, dx); return true; }
    return e.cd > 2.4; },
  // 용암 도롱뇽: 쫓는 동안 지나간 자리에 불 웅덩이
  trail(e, def, dt, d, dx, dy, chase) { if (chase && tick(e, 'tr', dt) <= 0) { e.tr = .6; hz({ x: e.x, y: e.y, r: .65, warn: .25, life: 2.4, dmg: dmgOf(e, def, .5), k: 'lava' }); } return false; },
  // 화산탄 말랑이: 가까이 오면 1초 깜빡이다 터져요 (터지면 드롭·경험치 없음)
  bomb(e, def, dt, d, dx, dy, chase) {
    if (e.fuse > 0) { e.fuse -= dt; e.flash = 1; if (e.fuse <= 0) { const at = G.enemies.indexOf(e); if (at >= 0) G.enemies.splice(at, 1);
        emit('puff', e.x, e.y, '#ff8a3d', 26, 4.5, .5); emit('puff', e.x, e.y, '#ffc861', 12, 3, .7); emit('shake', .35); emit('sfx', 'brk');
        for (const pl of alivePlayers()) if (Math.hypot(pl.p.x - e.x, pl.p.y - e.y) < 2) withPlayer(pl, () => hurtPlayer(dmgOf(e, def, 1.6), e.x, e.y, 'fire')); }
      return true; }
    if (chase && d < 1.7 && !(e.air > 0)) { e.fuse = 1; return true; } return false; },
  // 작은 흑요석 골렘: 0.7초 조준(그 방향을 기억) → 0.45초 돌진
  charge(e, def, dt, d, dx, dy, chase, sm) { tick(e, 'cd', dt);
    if (e.dash > 0) { e.dash -= dt; moveEnt(e, e.cx * 8 * dt * sm, e.cy * 8 * dt * sm, def.r); e.anim = (e.anim || 0) + dt * 2; return true; }
    if (e.aim > 0) { e.aim -= dt; e.flash = 1; if (e.aim <= 0) { e.flash = 0; e.dash = .45; emit('sfx', 'swing'); } return true; }
    if (chase && e.sees && d < 6 && e.cd <= 0) { e.cd = 3; e.aim = .7; e.cx = dx / d; e.cy = dy / d; e.flip = dx < 0; return true; }
    return false; },
  // 고드름 정령: 거리를 두고, 내 자리에 경고 원 뒤 고드름
  icicle(e, def, dt, d, dx, dy, chase, sm) { if (!chase) return false; const p = G.p;
    if (tick(e, 'cd', dt) <= 0 && e.sees && d < 7) { e.cd = 3.2; hz({ x: p.x, y: p.y, r: 1, warn: .9, life: 1.05, dmg: dmgOf(e, def), k: 'frost', slow: 1.5 }); emit('sfx', 'cast'); }
    if (d < 3.5) { moveEnt(e, -dx / d * def.spd * dt * sm, -dy / d * def.spd * dt * sm, def.r); e.anim = (e.anim || 0) + dt; e.flip = dx > 0; return true; }
    return false; },
  // 아기 설인: 눈덩이를 던져요
  throw(e, def, dt, d, dx, dy, chase) { if (tick(e, 'cd', dt) <= 0 && chase && e.sees && d < 6.5) { e.cd = 2.3; shoot(e, dx, dy, d, 6.5, 'snow', dmgOf(e, def, .8)); emit('sfx', 'swing'); } return false; },
};
// 쓰러질 때 (sim/combat.js enemyDie)
export function onEnemyDie(e) { const def = ENEMY[e.k]; if (def && def.ai === 'spore') hz({ x: e.x, y: e.y, r: 1.4, warn: .35, life: 3.2, dmg: Math.max(3, Math.round(def.dmg * .5)), k: 'poison' }); }
// 맞을 때 피해 바꾸기 (sim/combat.js hitEnemy): 땅속 두더지는 안 맞고, 버섯 거북은 앞에서 맞으면 30%
export function monDmg(e, dmg) { const def = ENEMY[e.k]; if (!def || !def.ai) return dmg;
  if (e.under) return 0;
  if (def.ai === 'shell' && e.fa != null) { const p = G.p; let da = Math.atan2(p.y - e.y, p.x - e.x) - e.fa; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283; if (Math.abs(da) < 1.05) return Math.max(1, Math.round(dmg * .3)); }
  return dmg; }
