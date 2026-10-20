// ================= 매 프레임 순서표 (구조 변경 7-3: 연결 고리) =================
// 매 프레임 진행(update, game/update.js)은 기능을 하나씩 부르지 않고 이 표의 순서대로 돌려요.
// 기능 파일은 자기 일을 onFrame('이름', dt => …)으로 등록해요 — 새 기능은 이 표에 이름 한 칸을 넣고(자리 = 실행 순서) 그 파일에서 등록.
// 몇 초마다 하는 일은 등록한 함수 안에서 시간을 세요. 표에 있는데 등록이 없거나, 표에 없는 이름을 등록하면 build.py가 멈춰요.
import { playerList, withPlayer } from '../save/state.js';
export const FRAME_ORDER = [
  'player',   // 움직이기·바라보기·넉백·대시·기력 (game/update.js)
  'act',      // 상호작용 버튼: 무엇을 할지 고르고 누르면 하기 (game/actions.js)
  'attack',   // 공격 버튼 (features/controls.js)
  'buff', 'env', 'recall', 'warp', // 음식 버프 (features/farming-cooking.js) · 더위·추위 · 귀환석 (features/deep-survival.js) · v89 워프 이동 (sim/warp.js)
  'hunger',   // 배고픔·체력 회복 (game/update.js)
  'wild',     // 들짐승·펫 (features/gear-animals.js)
  'enemies', 'bosses', // 몬스터·보스 (game/update.js)
  'pshots',   // 내 화살·마법 (game/actions.js)
  'deep', 'darkContact', // v108 가장 깊은 곳·큰 어둠 닿기
  'archives', // v106 기록관 안 그림자 조각
  'cocoons', // v104 그림자 고치 둘레 그림자 조각
  'skills102', // v102 빛 구슬 친구·빛 방패·각성·질주 시간
  'fish',     // 낚시 (game/combat.js)
  'drops', 'fx', // 떨어진 물건 줍기 · 반짝이·떠오르는 글자 (game/update.js)
  'seen',     // v77: 처음 얻은 물건 찾기 — 빨간 점 (sim/inventory.js)
  'ambient',  // 주변 반딧불이 같은 보이기용 (render.js)
  'tree',     // 등불나무 연출 (game/update.js)
  'spawn', 'regrow', // 몬스터 생기기 · 자연 다시 자라기 (game/update.js)
  'zone', 'grow', // 꽃잎 구역 · 작물·나무 자라기 (content/rpg-nature.js)
  'flow',     // v87: 물·용암이 이어진 구덩이로 흐르기 (sim/digging.js)
  'circuit',  // 빛뿌리·기계 (content/circuits-regions.js)
  'beaver',   // v114 비버 둥지: 먹이통의 먹이를 먹고 둘레의 다 자란 나무 베기 (sim/beaver.js)
  'light', 'guide', // 빛 계산 · 퀘스트·지역·숨은 방 확인 (game/update.js)
  'autosave', 'backup', 'cloud', // 저장·백업·클라우드 (main.js)
  'camera',   // 카메라 따라가기 (render.js)
  'shake',    // 화면 흔들림 줄이기 (ui/feedback.js)
];
// 플레이어마다 한 번씩 도는 칸 (그동안 G.p·G.inv … 가 그 플레이어 것). 나머지 칸은 세계에 한 번 (화면 쪽은 내 플레이어 기준)
export const PER_PLAYER_FRAMES = new Set(['player', 'act', 'attack', 'buff', 'env', 'recall', 'warp', 'hunger', 'pshots', 'skills102', 'fish', 'spawn', 'seen']);
const SYS = new Map();
export function onFrame(name, fn) {
  if (!FRAME_ORDER.includes(name)) throw new Error('매 프레임 순서표(sim/systems.js)에 없는 이름이에요: ' + name);
  if (SYS.has(name)) throw new Error('매 프레임 이름이 겹쳐요: ' + name);
  SYS.set(name, fn);
}
export function runFrame(dt) {
  for (const name of FRAME_ORDER) { const fn = SYS.get(name); if (!fn) continue;
    if (PER_PLAYER_FRAMES.has(name)) { for (const pl of playerList()) withPlayer(pl, () => fn(dt)); } else fn(dt); }
}
