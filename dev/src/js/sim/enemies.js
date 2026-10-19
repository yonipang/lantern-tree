// ================= 몬스터: 움직이기·쫓기(가장 가까운 플레이어), 만들기·생기기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { SPAWN_CAP, SPAWN_EVERY, SPAWN_PACK } from '../data/circuits-regions.js';
import { OBJ } from '../data/items.js';
import { ENEMY } from '../data/rpg-nature.js';
import { hexRgb } from '../engine/util.js';
import { rand } from '../engine/random.js';
import { lightAt } from '../render/light.js';
import { G, nearestPlayer, withPlayer } from '../save/state.js';
import { dotTick, los } from './combat.js';
import { hurtPlayer } from './player.js';
import { onFrame } from './systems.js';
import { BX, BY, CX, CY, idx, inB, SA, SB, SI, SL, W } from '../world/map.js';
import { canSee, fpOf, isSolid, moveEnt } from '../world/tiles.js';
import { warpSafe } from './warp.js';
import { MON_TABLE } from '../data/growth.js';
import { MON_AI } from './monsters.js';
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
  if (e.stun > 0) { e.stun -= dt; e.vx = e.vy = 0; if (Math.abs(e.kx || 0) + Math.abs(e.ky || 0) > 0.05) { moveEnt(e, e.kx * dt, e.ky * dt, def.r); const k = Math.pow(0.001, dt); e.kx *= k; e.ky *= k; } e.hurt = Math.max(0, (e.hurt || 0) - dt); return; } // v102 기절: 안 움직이고 안 때려요
  const special = def.ai && MON_AI[def.ai] && MON_AI[def.ai](e, def, dt, d, dx, dy, chase, sm); // v101: 특별한 움직임이 true면 기본 움직임은 건너뛰어요
  if (special) { if (!G.enemies.includes(e)) return; }
  else if (def.hop) {
    if (e.air > 0) { moveEnt(e, e.vx * dt * sm, e.vy * dt * sm, def.r); e.air -= dt * sm; e.z = Math.sin((1 - Math.max(0, e.air) / e.airMax) * Math.PI) * 0.35; if (e.air <= 0) { e.z = 0; e.land = 0.15; } }
    else { e.t -= dt; e.land = Math.max(0, (e.land || 0) - dt); if (e.t <= 0) { let ax, ay; if (chase) { ax = dx / d; ay = dy / d; } else { const a = rand() * 6.283; ax = Math.cos(a); ay = Math.sin(a); } const sp = chase ? def.spd : def.spd * 0.5; let flee = null; if (!chase) { flee = litFlee(e); if (flee) { ax = flee[0] * 2; ay = flee[1] * 2; } else if (litAhead(e, ax, ay, sp * 0.42 + def.r + .2)) ax = ay = 0; } e.vx = ax * sp; e.vy = ay * sp; e.air = e.airMax = 0.42; e.t = (chase || flee ? 0.45 : 1.2) + rand() * 0.6; } } // v88: 밝은 곳에서 나갈 때는 쫓을 때처럼 자주 뛰어요
  } else {
    e.t -= dt; if (!chase && e.zone != null && G.fzones && G.fzones[e.zone]) { const z = G.fzones[e.zone], zx = z.x + .5 - e.x, zy = z.y + .5 - e.y, zd = Math.hypot(zx, zy); if (zd > 4.5 && !isLit(z.x, z.y)) { e.vx = zx / zd * def.spd * .5; e.vy = zy / zd * def.spd * .5; e.t = .6; } } // v88: 꽃 구역 가운데가 밝으면 돌아가지 않아요 (빛 가장자리에서 왔다 갔다 하지 않게)
    if (chase) { e.vx = dx / d * def.spd; e.vy = dy / d * def.spd; } else if (e.t <= 0) { e.t = 1.5 + rand() * 2; const a = rand() * 6.283, s = rand() < .4 ? 0 : def.spd * .4; e.vx = Math.cos(a) * s; e.vy = Math.sin(a) * s; }
    if (!chase && def.spd > 0) { // v88: 쫓지 않을 때는 밝은 곳에 들어가지 않고, 밝은 곳에 있으면 어두운 쪽으로 나가요
      const f = litFlee(e); if (f) { e.vx = f[0] * def.spd * .5; e.vy = f[1] * def.spd * .5; e.t = Math.max(e.t, .3); }
      else { const v = Math.hypot(e.vx, e.vy); if (v > .05 && litAhead(e, e.vx / v, e.vy / v, def.r + .25)) { e.vx = e.vy = 0; e.t = Math.min(e.t, .4); } } }
    moveEnt(e, e.vx * dt * sm, e.vy * dt * sm, def.r); e.anim = (e.anim || 0) + dt * sm * (Math.hypot(e.vx, e.vy) > 0.1 ? 1 : 0);
    if (Math.abs(e.vx) > 0.05) e.flip = e.vx < 0;
  }
  if (Math.abs(e.kx || 0) + Math.abs(e.ky || 0) > 0.05) { moveEnt(e, e.kx * dt, e.ky * dt, def.r); const k = Math.pow(0.001, dt); e.kx *= k; e.ky *= k; }
  e.hurt = Math.max(0, (e.hurt || 0) - dt);
  if (d < def.r + 0.34 && (e.z || 0) < 0.2 && (!def.calm || e.angry > 0) && !e.under && def.spd > 0) hurtPlayer(Math.round(def.dmg * (e.dm || 1)), e.x, e.y);
}
// v43 region difficulty: monsters grow tougher the deeper the region (gear can now be upgraded up to +5)
export const REGION_HP = [1, 1, 1.2, 1.15, 1.15], REGION_DMG = [1, 1, 1.1, 1.1, 1.1];
export function regionEnemy(e, b) { const m = REGION_HP[b] || 1; if (m !== 1) { e.hp = Math.round(e.hp * m); e.mh = e.hp; } if ((REGION_DMG[b] || 1) !== 1) e.dm = REGION_DMG[b]; return e; }
export function mkEnemy(k, x, y) { return { k, x, y, hp: ENEMY[k].hp, t: rand(), air: 0, airMax: .42, z: 0, vx: 0, vy: 0, kx: 0, ky: 0, hurt: 0 }; }
export function pickMon(b) { const row = MON_TABLE[b] || MON_TABLE[0]; let r = rand(); for (const [k, w] of row) { r -= w; if (r < 0) return k; } return row[0][0]; }
export function trySpawn() {
  const p = G.p; if (p.dead > 0) return; const pb = G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0; const near = G.enemies.filter(e => Math.hypot(e.x - p.x, e.y - p.y) < 20).length; if (near >= (SPAWN_CAP[pb] || 7)) return;
  for (let k = 0; k < 10; k++) {
    const a = rand() * 6.283, r = 10 + rand() * 6, x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r);
    if (!inB(x, y) || isSolid(x, y) || G.objs.get(idx(x, y))) continue;
    if (Math.hypot(x - CX, y - CY) < 13 + G.treeSeeds * 4) continue; if (Math.hypot(x - BX, y - BY) < 11 || Math.hypot(x - SA.x, y - SA.y) < 10 || Math.hypot(x - SB.x, y - SB.y) < 10 || Math.hypot(x - SL.x, y - SL.y) < 11 || Math.hypot(x - SI.x, y - SI.y) < 11) continue;
    if (lightAt(x, y) > 0.3) continue;
    if ((G.fzones || []).some(z => Math.hypot(x - z.x, y - z.y) < 7)) continue;
    if (warpSafe(x + .5, y + .5)) continue; // v89: 워프포인트·포탈 둘레 6칸
    const b = G.biome[idx(x, y)]; const kk = pickMon(b); // v101: 지역별 표(MON_TABLE)
    G.enemies.push(regionEnemy(mkEnemy(kk, x + .5, y + .6), b));
    const packN = ENEMY[kk].pack || 0; for (let q = 0; q < packN; q++) { const dx = Math.round((rand() - .5) * 3), dy = Math.round((rand() - .5) * 3); if (!isSolid(x + dx, y + dy) && !G.objs.get(idx(x + dx, y + dy))) G.enemies.push(regionEnemy(mkEnemy(kk, x + dx + .5, y + dy + .6), b)); } // v101 떼 몬스터
    if (!packN && rand() < (SPAWN_PACK[b] || 0)) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!isSolid(x + dx, y + dy) && !G.objs.get(idx(x + dx, y + dy))) { G.enemies.push(regionEnemy(mkEnemy(kk, x + dx + .5, y + dy + .6), b)); break; } }
    return;
  }
}

// ---- v88: 몬스터가 피하는 밝은 곳 (규칙 쪽 빛 지도 — 화면의 빛 계산 render/light.js와 따로, 화면 밖·멀티플레이에서도 같아요) ----
// 빛: 놓은 빛 물건(아이템으로 놓는 것 — 켜진 횃불·램프·빛 나는 가구·용광로 …, 꺼진 것 빼고)과 등불나무. 내가 든 빛·자연 빛(빛버섯·수정)·용암·보스 빛은 안 셈.
// 밝기는 화면 계산과 같은 식(가운데에서 멀수록 (1-거리/반지름)^1.25, 벽에 가리면 0.1배, 색 평균, 바탕 밝기 0.075+빛씨앗×0.03)이고, 몬스터가 생기지 않는 기준과 같은 0.3보다 밝으면 「밝은 곳」.
export const LIT_MIN = 0.3;
const LCH = 16; let litG = null, litSrc = null, litTiles = null, litAt = -1, litDirty = true;
export const markRuleLit = () => { litDirty = true; };
function litBuild() {
  litG = G; litAt = G.time; litDirty = false; litSrc = new Map(); litTiles = new Map();
  for (const [i, o] of G.objs) { const d = OBJ[o.t]; if (!d || !d.light || !d.item || o.off) continue;
    const x = i % W, y = (i / W) | 0, fp = d.sz ? fpOf(o) : [1, 1], c = hexRgb(d.light[1]);
    const L = { x: x + fp[0] / 2, y: y + (d.sz ? fp[1] / 2 : .5), r: d.light[0], k: (c[0] + c[1] + c[2]) / 3 }, key = ((L.x / LCH) | 0) + ',' + ((L.y / LCH) | 0);
    if (!litSrc.has(key)) litSrc.set(key, []); litSrc.get(key).push(L); }
}
function litOne(L, tx, ty) { const dx = tx + .5 - L.x, dy = ty + .5 - L.y, d2 = dx * dx + dy * dy; if (d2 > L.r * L.r) return 0;
  let f = Math.pow(1 - Math.sqrt(d2) / L.r, 1.25) * L.k; const sx = Math.floor(L.x), sy = Math.floor(L.y); if (!(tx === sx && ty === sy) && !los(sx, sy, tx, ty)) f *= 0.1; return f; }
export function ruleLight(tx, ty) {
  if (!inB(tx, ty)) return 0; if (litG !== G || litDirty || G.time - litAt > 2 || G.time < litAt) litBuild();
  const i = idx(tx, ty); let v = litTiles.get(i); if (v !== undefined) return v;
  v = 0.075 + G.treeSeeds * 0.03;
  v += litOne({ x: CX + .5, y: CY - .2, r: 7 + G.treeSeeds * 3.5, k: 1.1 * (1 + .85 + .55) / 3 }, tx, ty);
  const cx = (tx / LCH) | 0, cy = (ty / LCH) | 0;
  for (let gy = cy - 1; gy <= cy + 1; gy++) for (let gx = cx - 1; gx <= cx + 1; gx++) { const a = litSrc.get(gx + ',' + gy); if (a) for (const L of a) v += litOne(L, tx, ty); }
  litTiles.set(i, v); return v;
}
export const isLit = (x, y) => ruleLight(Math.floor(x), Math.floor(y)) > LIT_MIN;
// 앞쪽(dist칸 앞)이 밝은데 지금 칸은 어두우면 true — 그쪽으로 가지 않아요
function litAhead(e, ux, uy, dist) { return !isLit(e.x, e.y) && isLit(e.x + ux * dist, e.y + uy * dist); }
// 밝은 곳에 서 있으면 가장 어두운 쪽(8방향, 2칸 앞, 벽 아닌 곳)을 골라 그 방향을 돌려줘요 (무작위 없음)
function litFlee(e) { if (!isLit(e.x, e.y)) return null; let best = null, bv = Infinity;
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a), nx = e.x + ux * 2, ny = e.y + uy * 2;
    if (isSolid(Math.floor(e.x + ux), Math.floor(e.y + uy)) || isSolid(Math.floor(nx), Math.floor(ny))) continue; const v = ruleLight(Math.floor(nx), Math.floor(ny)); if (v < bv) { bv = v; best = [ux, uy]; } }
  return best; }
