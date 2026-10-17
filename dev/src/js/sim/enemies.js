// ================= 몬스터: 움직이기·쫓기(가장 가까운 플레이어), 만들기·생기기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { SPAWN_CAP, SPAWN_EVERY, SPAWN_PACK } from '../data/circuits-regions.js';
import { ENEMY } from '../data/rpg-nature.js';
import { rand } from '../engine/random.js';
import { lightAt } from '../render/light.js';
import { G, nearestPlayer, withPlayer } from '../save/state.js';
import { dotTick } from './combat.js';
import { hurtPlayer } from './player.js';
import { onFrame } from './systems.js';
import { BX, BY, CX, CY, idx, inB, SA, SB, SI, SL } from '../world/map.js';
import { canSee, isSolid, moveEnt } from '../world/tiles.js';
onFrame('enemies', updateEnemies);
onFrame('spawn', dt => { const p = G.p;
  G.spawnT += dt; if (G.spawnT > (SPAWN_EVERY[G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0] || 2.6)) { G.spawnT = 0; trySpawn(); }
});
export function updateEnemies(dt) {
  for (const e of G.enemies.slice()) withPlayer(nearestPlayer(e.x, e.y), () => enemyStep(e, dt)); // 몬스터마다 가장 가까운 플레이어를 봐요 (8단계)
}
export function enemyStep(e, dt) {
  const p = G.p;
  const def = ENEMY[e.k], dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
  if (d > 30) { G.enemies.splice(G.enemies.indexOf(e), 1); return; }
  dotTick(e, dt); if (!G.enemies.includes(e)) return; const sm = e.slow > 0 ? (e.chill ? .3 : .45) : 1;
  if (def.calm) e.angry = Math.max(0, (e.angry || 0) - dt);
  // v85: 알아채는 거리 aggro(기본 5칸) 안에서 벽·닫힌 문에 가리지 않아야 알아채요. 한번 쫓으면(또는 맞으면 4초 동안) 3칸 더 멀리까지 쫓고, 안 보여도 1초는 계속 쫓아요
  const alerted = e.alertAt != null && G.time - e.alertAt < 4;
  let chase = false;
  if (d < (def.aggro || 5) + (e.chasing || alerted ? 3 : 0) && p.dead <= 0 && (!def.calm || e.angry > 0)) {
    e.losT = (e.losT || 0) - dt; if (e.losT <= 0) { e.losT = 0.25; e.sees = canSee(e.x, e.y, p.x, p.y); }
    if (e.sees) e.seenAt = G.time;
    chase = e.sees || alerted || (e.chasing && G.time - (e.seenAt || -9) < 1);
  } else e.losT = 0;
  e.chasing = chase; if (chase) p.chasedAt = G.time; // v77: 몬스터가 나를 쫓음 = 싸우는 중
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
// v43 region difficulty: monsters grow tougher the deeper the region (gear can now be upgraded up to +5)
export const REGION_HP = [1, 1, 1.2, 1.15, 1.15], REGION_DMG = [1, 1, 1.1, 1.1, 1.1];
export function regionEnemy(e, b) { const m = REGION_HP[b] || 1; if (m !== 1) { e.hp = Math.round(e.hp * m); e.mh = e.hp; } if ((REGION_DMG[b] || 1) !== 1) e.dm = REGION_DMG[b]; return e; }
export function mkEnemy(k, x, y) { return { k, x, y, hp: ENEMY[k].hp, t: rand(), air: 0, airMax: .42, z: 0, vx: 0, vy: 0, kx: 0, ky: 0, hurt: 0 }; }
export function trySpawn() {
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
