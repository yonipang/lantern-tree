// ================= 매 프레임 진행(update → sim/systems.js 순서표), 빛 계산·퀘스트 확인, 떨어진 물건 줍기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { ITEMS, RARITY } from '../data/items.js';
import { josa } from '../engine/util.js';
import { computeLight } from '../render/light.js';
import { G, nearestPlayer, playerList, started, withPlayer } from '../save/state.js';
import { petIs } from './animals.js';
import { emit } from './events.js';
import { rarCol, rarOf } from './gear.js';
import { addItem, moveInto } from './inventory.js';
import { checkBiome, checkGuide } from './quests.js';
import { onFrame, runFrame } from './systems.js';
import { roomTick } from '../world/gen.js';
import { moveEnt } from '../world/tiles.js';
export let lightDirty = true, lightT = 0, guideT = 0;
export const markLight = () => { lightDirty = true; }; // 빛을 다시 계산해요 (다른 파일은 이걸 불러요)
export function pausedTick(dt) { if (lightDirty) { lightDirty = false; computeLight(); } if (!started) { G.time += dt; lightT += dt; if (lightT > .1) { lightT = 0; computeLight(); } } } // 화면이 멈춘 동안 (제목 화면·창)
export function update(dt) {
  G.time += dt;
  runFrame(dt); // 매 프레임 순서표 (sim/systems.js): 기능마다 onFrame으로 등록해요
}
onFrame('drops', updateDrops);
onFrame('light', dt => {
  lightT += dt; if (lightT > 0.09 || lightDirty) { lightT = 0; lightDirty = false; computeLight(); }
});
onFrame('guide', dt => {
  guideT += dt; if (guideT > 0.5) { guideT = 0; checkGuide(); for (const pl of playerList()) withPlayer(pl, () => { checkBiome(); roomTick(); }); }
});
export function updateDrops(dt) {
  for (const d of G.drops.slice()) withPlayer(nearestPlayer(d.x, d.y), () => dropStep(d, dt)); // 가장 가까운 플레이어가 끌어당겨 주워요 (8단계)
}
export function dropStep(d, dt) {
  const p = G.p; {
    d.t += dt; d.vz -= 12 * dt; d.z += d.vz * dt; if (d.z < 0) { d.z = 0; d.vz = Math.abs(d.vz) * 0.35; if (d.vz < 0.6) d.vz = 0; d.vx *= 0.6; d.vy *= 0.6; }
    moveEnt(d, d.vx * dt, d.vy * dt, 0.15); d.vx *= Math.pow(0.05, dt); d.vy *= Math.pow(0.05, dt);
    d.hold = Math.max(0, d.hold - dt);
    const dx = p.x - d.x, dy = p.y - .3 - d.y, l = Math.hypot(dx, dy);
    const mag = petIs('dog') ? 1.6 : 1; // v45: the dog pulls drops in from further away
    if (d.t > 0.4 && l < 2.2 * mag && d.hold <= 0 && p.dead <= 0) { const s = 9 * Math.max(.15, 1 - l / (2.6 * mag)) + 2; d.x += dx / l * s * dt; d.y += dy / l * s * dt;
      if (l < 0.45) { const left = d.dur != null || d.lv ? moveInto(G.inv, { id: d.id, c: d.c, dur: d.dur, lv: d.lv }) : addItem(d.id, d.c); if (ITEMS[d.id] && /^petal/.test(d.id)) { G.stats.petals = G.stats.petals || {}; G.stats.petals[d.id.slice(5)] = 1; } const got = d.c - left; if (got) { emit('sfx', 'pick'); emit('ftext', p.x, p.y - 1.4, `+${got} ${ITEMS[d.id].n}`, rarCol(d.id) || '#fff1d6'); if (rarOf(d.id) >= 3) emit('toast', `${RARITY[rarOf(d.id)][0]} 장비 ${josa(ITEMS[d.id].n, '을', '를')} 얻었어요!`, 'good'); } if (left) { d.c = left; d.hold = 1.5; emit('toast', '가방이 가득 찼어요', null, 'full-inv'); } else G.drops.splice(G.drops.indexOf(d), 1); } }
    if (d.t > 400) G.drops.splice(G.drops.indexOf(d), 1);
  }
}
