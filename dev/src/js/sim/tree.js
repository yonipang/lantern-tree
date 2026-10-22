// ================= 등불나무: 자라는 단계, 빛씨앗 넣기 =================
// (구조 변경 9단계: 버전마다 덧붙인 content/·game/·features/ 파일에서 기능별로 모음 — 덩어리 순서는 예전 그대로)
import { hash2 } from '../engine/random.js';
import { clamp } from '../engine/util.js';
import { TREEFX } from '../render/parts.js';
import { G } from '../save/state.js';
import { learnRecipe } from './cooking.js';
import { emit } from './events.js';
import { countItem, removeItem } from './inventory.js';
import { gainXp, maxHp } from './player.js';
import { CX, CY, idx, inB } from '../world/map.js';
import { markLight } from './loop.js';
import { shadowWake } from './shadow.js';
import { seedScene } from './cutscene.js';
export const treeStage = () => G ? clamp(G.treeSeeds | 0, 0, 5) : 0;
// moss and little flowers on bare ground (dirt or moss with nothing on it) near the roots; decided per tile, never stored
export function spreadKind(x, y, R) {
  if (!R || !inB(x, y)) return null; const i = idx(x, y); if (G.wall[i] || (G.floor[i] !== 1 && G.floor[i] !== 2) || G.objs.get(i) || G.wire.has(i)) return null;
  const e = Math.hypot(x - CX, y - CY) / R; if (e >= 1 || hash2(x, y, 71) > .6 * (1 - e * e * e)) return null;
  const k = hash2(x, y, 72); return k < .55 ? 'm' + (((k * 6) | 0) % 3) : ['R', 'B', 'Y', 'W'][Math.min(3, ((k - .55) / .45 * 4) | 0)];
}
export function insertSeeds() {
  const n = Math.min(countItem('lightSeed'), 5 - G.treeSeeds); if (n <= 0) return; const from = treeStage(); removeItem('lightSeed', n); G.treeSeeds += n; markLight();
  G.p.hp = maxHp(); gainXp(50 * n); if (G.treeSeeds >= 5) shadowWake(); // v129 그림자 지대
  // v103: 단계가 오를 때마다 나무가 옛 기억 한 장면을 보여 줘요 (엔딩 두 갈래는 하나로 — 마지막 장면은 가장 깊은 곳에서, v108). won·won2는 옛 세이브·축제 케이크 해금을 위해 그대로 둬요
  if (G.treeSeeds >= 5 && !G.won2) { G.won = true; G.won2 = true; learnRecipe('festCake', true); }
  else if (G.treeSeeds >= 3 && !G.won) G.won = true;
  G.stats.mem = G.stats.mem || {}; const st = treeStage(), mem = st > from && !G.stats.mem[st] ? st : 0; if (mem) G.stats.mem[st] = 1;
  const after = cine => { if (mem) emit('memory', mem, cine); else emit('toast', `등불나무가 조금 더 밝아졌어요 (${G.treeSeeds}/5)`, 'good'); };
  // v127: 곁에 있으면 연출 장면(카메라가 나무로 → 빛이 퍼짐 → 나루 한마디 → 기억 장면 창, sim/cutscene.js seedScene) · 아니면 예전처럼 바로
  if (!seedScene(from, st, () => after(true))) { treeGrowFx(from, st); after(false); }
}
// 나무에서 빛이 퍼지는 모습·소리·살짝 흔들림 (v127: 연출 장면에서는 카메라가 나무에 닿은 뒤)
export function treeGrowFx(from, to) { TREEFX.grow = { t: 0, from, to }; emit('shake', .15); emit('sfx', 'seed'); emit('puff', CX + .5, CY - 1, '#ffd25c', 30, 4, 2); }
