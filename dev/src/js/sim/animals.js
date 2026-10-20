// ================= 동물: 펫(함께 다니기·따라오기), 들짐승, 올가미 포획, 목장 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { ANIMALS } from '../data/gear-animals.js';
import { ITEMS, OBJ } from '../data/items.js';
import { rand } from '../engine/random.js';
import { josa } from '../engine/util.js';
import { G, nextTurn, playerList, withPlayer } from '../save/state.js';
import { defineCmd } from './commands.js';
import { spawnDrop } from './drops.js';
import { emit } from './events.js';
import { addItem } from './inventory.js';
import { WATER } from './nature.js';
import { beaverHome, caughtMsg, waterNear } from './beaver.js';
import { onFrame } from './systems.js';
import { catchLoop } from '../ui/panels-extra.js';
import { openPanel, panel } from '../ui/panels.js';
import { idx, inB, LAVA } from '../world/map.js';
import { isSolid, moveEnt } from '../world/tiles.js';
defineCmd('pet', c => { const i = c.id; if (!(G.pets || {})[i]) return false; if (G.petOn === i) { G.petOn = null; G.petE = null; emit('toast', `${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '은', '는').slice(ANIMALS[i].pn.length)} 집에서 쉬어요`, null, 'peton'); } else { G.petOn = i; G.petE = { x: G.p.x - .6, y: G.p.y + .2, flip: false, anim: 0, moving: false }; emit('hearts', G.p.x, G.p.y - .5, 4); emit('toast', `${ANIMALS[i].pn}${josa(ANIMALS[i].pn, '과', '와').slice(ANIMALS[i].pn.length)} 함께 다녀요 · ${ANIMALS[i].fx}`, 'good', 'peton'); } emit('sfx', 'pick'); });
export const petIs = k => !!(G && G.petOn === k);
export const wildNear = r => { const p = G.p; let best = null, bd = r; for (const w of G.wild || []) { const d = Math.hypot(w.x - p.x, w.y - p.y); if (d < bd) { bd = d; best = w; } } return best; };
export let wildT = 0;
onFrame('wild', dt => wildTick(dt));
export let petDt = 0;
export function wildTick(dt) { petDt = dt;
  G.wild = G.wild || []; wildT -= dt;
  G.wild = G.wild.filter(w => playerList().some(pl => Math.hypot(w.x - pl.p.x, w.y - pl.p.y) < 30)); // 플레이어 누구에게서든 멀면 사라져요 (8단계)
  if (wildT <= 0) { wildT = 6; const pl = nextTurn(), p = pl.p; withPlayer(pl, () => { const pb = G.biome[idx(Math.floor(p.x), Math.floor(p.y))] || 0;
    const wet = beaverHome(p.x, p.y); // v114: 비버는 이끼 동굴 물가에서만, 물가에 있으면 먼저 나와요 (다른 동물 2마리와 따로 한 마리 더)
    let kinds = Object.keys(ANIMALS).filter(k => ANIMALS[k].biome === pb && !(ANIMALS[k].pet && (G.pets || {})[k]) && !G.wild.some(w => w.k === k) && (!ANIMALS[k].worker || wet));
    if (kinds.includes('beaver')) kinds = ['beaver'];
    const bv = kinds[0] === 'beaver'; // 무작위 순서는 예전 그대로 (비버가 없을 때 같은 결과)
    if (kinds.length && G.wild.length < (bv ? 3 : 2) && rand() < .35) for (let tries = 0; tries < 12; tries++) { const a = rand() * 6.283, r = 7 + rand() * 6, x = Math.floor(p.x + Math.cos(a) * r), y = Math.floor(p.y + Math.sin(a) * r);
      if (!inB(x, y) || isSolid(x, y) || G.objs.get(idx(x, y)) || G.biome[idx(x, y)] !== pb || G.floor[idx(x, y)] === WATER || G.floor[idx(x, y)] === LAVA || (bv && !waterNear(x, y, 3))) continue;
      G.wild.push({ k: kinds[(rand() * kinds.length) | 0], x: x + .5, y: y + .6, vx: 0, vy: 0, t: 1, flip: false, anim: 0 }); break; } }); } // 생기는 곳: 플레이어 돌아가며 (그 플레이어의 펫 종류는 빼고)
  const mdt = Math.min(dt, .1);
  for (const w of G.wild) { w.t -= dt; if (w.t <= 0) { w.t = 1.2 + rand() * 2; if (rand() < .45) { w.vx = 0; w.vy = 0; } else { const a = rand() * 6.283, sp = ANIMALS[w.k].spd; w.vx = Math.cos(a) * sp; w.vy = Math.sin(a) * sp; } }
    if (w.vx || w.vy) { moveEnt(w, w.vx * mdt, w.vy * mdt, .25); w.anim += mdt; if (w.vx) w.flip = w.vx < 0; } }
  for (const pl of playerList()) withPlayer(pl, petFollow); }
// the pet walks behind its owner, and hops over walls when it gets left too far behind
export function petFollow() { const p = G.p, dt = petDt;
  if (G.petOn && ANIMALS[G.petOn]) { let e = G.petE; if (!e) e = G.petE = { x: p.x - .8, y: p.y + .2, flip: false, anim: 0, moving: false };
    const dx = p.x - e.x, dy = p.y + .15 - e.y, d = Math.hypot(dx, dy);
    if (d > 10) { e.x = p.x - .6; e.y = p.y + .2; }
    else if (d > 1.3) { const sp = Math.min(7, 1.5 + d * 2.2); moveEnt(e, dx / d * sp * dt, dy / d * sp * dt, .22); e.moving = true; e.anim += dt; if (Math.abs(dx) > .1) e.flip = dx < 0; }
    else e.moving = false; } else G.petE = null; }
export function openCatch(w) { if (!w || !G.wild.includes(w)) return; openPanel('catch', { w, hits: 0, miss: 0, t0: performance.now(), spd: ANIMALS[w.k].spd * 1.9, za: rand() * 6.283, zw: 1.0 }); requestAnimationFrame(catchLoop); }
export const catchAng = c => ((performance.now() - c.t0) / 1000 * c.spd) % 6.283;
export const inZone = (a, c) => { let d = Math.abs(a - c.za) % 6.283; if (d > Math.PI) d = 6.283 - d; return d < c.zw / 2; };
export function catchThrow() { const c = panel && panel.kind === 'catch' ? panel : null; if (!c || (c.cool || 0) > performance.now()) return; c.cool = performance.now() + 250; const w = c.w, a = catchAng(c);
  if (inZone(a, c)) { c.hits++; emit('sfx', 'pick');
    if (c.hits >= 3 && ANIMALS[w.k].worker) { G.wild = G.wild.filter(x => x !== w); const l = addItem(w.k, 1); if (l) spawnDrop(w.k, l, G.p.x, G.p.y); G.stats.beavers = (G.stats.beavers || 0) + 1; emit('close'); emit('hearts', w.x, w.y - .5, 6); emit('sfx', 'seed'); emit('toast', caughtMsg(w.k), 'good'); emit('inv'); return; } // v114 비버: 일꾼 (목장 퀘스트에 안 셈)
    if (c.hits >= 3 && ANIMALS[w.k].ranch) { G.wild = G.wild.filter(x => x !== w); const l = addItem(w.k, 1); if (l) spawnDrop(w.k, l, G.p.x, G.p.y); G.stats.ranchK = G.stats.ranchK || {}; G.stats.ranchK[w.k] = 1; emit('close'); emit('hearts', w.x, w.y - .5, 6); emit('sfx', 'seed'); emit('toast', `${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '을', '를').slice(ANIMALS[w.k].n.length)} 데려왔어요! 원하는 곳에 내려놓으면 ${ANIMALS[w.k].verb.split(' ')[0]}${ANIMALS[w.k].ranch === 'wool' ? '을' : '를'} 줘요`, 'good'); emit('inv'); return; }
    if (c.hits >= 3) { G.pets = G.pets || {}; G.pets[w.k] = 1; G.wild = G.wild.filter(x => x !== w); if (!G.petOn) { G.petOn = w.k; G.petE = { x: w.x, y: w.y, flip: false, anim: 0, moving: false }; } G.stats.pets = Object.keys(G.pets).length;
      emit('close'); emit('hearts', w.x, w.y - .5, 8); emit('sfx', 'seed'); emit('toast', `${ANIMALS[w.k].n} ${ANIMALS[w.k].pn}${josa(ANIMALS[w.k].pn, '이', '가').slice(ANIMALS[w.k].pn.length)} 친구가 됐어요! [가방]에서 함께 다닐 펫을 골라요`, 'good'); return; }
    c.za = rand() * 6.283; c.zw *= .78; c.spd *= 1.18; }
  else { c.miss++; emit('sfx', 'clink'); if (c.miss >= 2) { G.wild = G.wild.filter(x => x !== w); emit('close'); emit('toast', `${ANIMALS[w.k].n}${josa(ANIMALS[w.k].n, '이', '가').slice(ANIMALS[w.k].n.length)} 놀라서 도망갔어요`, null, 'flee'); return; } }
  emit('refresh', 'catch'); }
export function ranchReady(o) { return G.time >= (o.p || 0); }
export function ranchCollect(t, o) { const d = OBJ[o.t]; if (!ranchReady(o)) return; o.p = G.time + d.every; const l = addItem(d.ranch, 1); if (l) spawnDrop(d.ranch, l, t.x + .5, t.y + .5);
  G.stats.ranch = (G.stats.ranch || 0) + 1; emit('hearts', t.x + .5, t.y, 3); emit('sfx', 'pick'); emit('puff', t.x + .5, t.y + .3, '#fff4e0', 6, 1.6, .2); emit('toast', `${ITEMS[d.ranch].n}${josa(ITEMS[d.ranch].n, '을', '를').slice(ITEMS[d.ranch].n.length)} 얻었어요`, 'good', 'ranch'); emit('inv'); }
