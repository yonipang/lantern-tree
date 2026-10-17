// ================= v87 바닥 파기 데이터: 빈 양동이, 물·용암 흐름 빠르기, 하루 하나 자연물 =================
// 기획: dev/design/바닥파기.md (2026-10-17 확정). 동작은 sim/digging.js(구덩이·흐름·양동이)와 sim/nature.js(자연물)에 있어요.
// 이 파일은 data/controls.js 다음에 와요: 양동이 레시피는 「지형 재료 2배」·작업대 단계 나누기(data/automation-tiers.js) 뒤라 그대로 작업대 기본 단계예요.
import { ITEMS, RECIPES, Rc } from './items.js';
import { BUCKET_FISH } from './rpg-nature.js';
import { G } from '../save/state.js';

// 빈 양동이: 물 칸에 대고 쓰면 「물 한 동이」 하나 (물 칸은 줄지 않아요), 용암은 못 떠요, 닳지 않아요
ITEMS.bucket = { n: '빈 양동이', kind: 'bucket', stack: 1, d: '물을 바라보고 누르면 「물 한 동이」를 떠요. 물은 줄지 않아요. 용암은 뜰 수 없어요. 닳지 않아요.' };
RECIPES.push(Object.assign(Rc('bucket', 1, [['wood', 4], ['copperBar', 1]], 'bench', 'tool'), { tier: 0, need: () => (G.stats.fishCaught || 0) >= BUCKET_FISH }));

// 흐름: 이어진 구덩이로 한 칸 퍼지는 데 걸리는 시간(초, 게임 시간)
export const FLOW_SEC = { 10: 0.5, 17: 2 }; // 물 · 용암
// 하루 하나 새 자연물: 게임을 안 한 날 몫은 이만큼까지 쌓여요
export const NAT_DAY_MAX = 7;
// 지역(biome)마다 생기는 자연물과 비율 — 새 세계 만들기(world/gen.js)의 비율을 따라요
export const NAT_DAY_KINDS = {
  0: [['root', 1], ['bush', 0.85], ['grass', 3], ['glow', 0.6]],
  1: [['bigShroom', 1.5], ['root', 0.6], ['glow', 1], ['grass', 2], ['bush', 1]],
  2: [['cluster', 2], ['glow', 1]],
  3: [['fireBloom', 1]],
  4: [['iceCluster', 1]],
};
// 그 자연물이 생길 수 있는 바닥
export const NAT_DAY_FLOORS = new Set([1, 2, 3, 4, 18, 19]);
