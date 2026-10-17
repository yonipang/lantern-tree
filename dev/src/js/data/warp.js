// ================= v89 워프포인트·포탈 데이터 =================
// 기획: dev/design/워프포탈.md (2026-10-18 확정). 동작은 sim/warp.js(놓기·켜기·이동·몬스터 안 생기는 곳), 그림은 render/world.js·art/world.js.
// 이 파일은 data/digging.js 다음에 와요 (「지형 재료 2배」·작업대 단계 나누기 data/automation-tiers.js 뒤라서 단계를 직접 적어요).
import { ITEMS, OBJ, RECIPES, Rc } from './items.js';

// 워프포인트: 지역마다 이만큼 (이끼 동굴·버섯숲·수정·용암·얼음) + 등불나무 곁 1개(처음부터 켜짐)
export const WARP_PER_REGION = 2;
// 지역 워프포인트 가운데 하나는 보스방 가는 길 근처: 보스방 가운데에서 이 거리 사이
export const WARP_BOSS_NEAR = [16, 30];
// 같은 지역 두 워프포인트는 이만큼 떨어져요 (못 찾으면 조금씩 줄여요)
export const WARP_GAP = 40;
// 목적지를 고르고 이동하기까지 (초, 그 사이에 맞으면 취소)
export const WARP_DELAY = 1;
// 워프포인트·포탈 둘레 이 칸 안에는 몬스터가 생기지 않아요
export const WARP_SAFE = 6;
// 포탈: 한 사람당 놓을 수 있는 개수
export const PORTAL_MAX = 5;
// 워프포인트·포탈 앞에서 출발할 수 있는 거리 (칸)
export const WARP_REACH = 2.2;
// 그림 한 장 시간 (초): 워프 6장 · 포탈 24장 (한 바퀴 2초)
export const WARP_FRAME = 0.083;

OBJ.warpPt = { n: '워프포인트', solid: 1, warp: 'pt' }; // 회수할 수 없어요 (item 없음)
OBJ.portal = { n: '포탈', solid: 1, item: 'portal', warp: 'portal' };
ITEMS.portal = { n: '포탈', kind: 'place', obj: 'portal', d: '놓으면 워프 목적지가 하나 늘어요. 포탈이나 켜진 워프포인트 앞에서 누르면 지도에서 켜진 곳을 골라 이동해요. 한 사람당 5개까지 · 보스방 가까이에는 못 놓아요.' };
RECIPES.push(Object.assign(Rc('portal', 1, [['crystal', 8], ['ironBar', 4], ['cryGem', 2], ['glowcap', 4]], 'bench', 'furn'), { tier: 3 }));
